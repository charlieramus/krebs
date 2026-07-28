/**
 * Headless dev harness. `npm run sim`.
 *
 * Until V3 there is no interface, so this is the only way to look at the
 * kernel. Its output is meant to be read by a person, not parsed. This file is
 * an entry point rather than a library: importing it runs it.
 *
 * Usage:
 *   npm run sim                    1200 ticks of the balanced pathway
 *   npm run sim -- 400             400 ticks
 *   npm run sim -- 1200 throttled  the carrier-limited pathway
 *   npm run sim -- 1200 starved    the pathway that over-draws a pool
 *   npm run sim -- 1200 starved --verbose   with the per-second shortfall log
 *
 * The pathway below is synthetic. Pools are called A, B, C and so on, and every
 * number in it is invented. It is deliberately NOT glycolysis and carries no
 * biological values, so nothing here can leak into player-facing text and
 * nothing here should ever be cited. Act 1 content arrives in V2.
 */

import process from 'node:process';
import { PoolRegistry, type PoolDefinition } from './pools';
import { michaelisMenten, type Reaction } from './reactions';
import { createPrng } from './prng';
import { createSimulation, type SimulationState } from './state';
import { setShortfallLogging, tick } from './tick';
import { elapsedMs } from './loop';
import { TICK_SECONDS } from './constants';

export type Scenario = 'balanced' | 'throttled' | 'starved';

/**
 * A synthetic pathway with a recycling carrier.
 *
 *   r1:  A + 2 X + 2 P  ->  2 B + 2 Y      forward, reduces the carrier
 *   r2:  B              ->  C + P          forward, releases phosphate
 *   r3:  Y + C          ->  X + D          recycling, reoxidises the carrier
 *
 * X and Y are the two states of one small fixed carrier pool, so r3 is the
 * throughput ceiling for everything upstream of it. That is structurally the
 * shape act 1 has. It is not act 1.
 *
 * Every reaction balances all three conserved quantities, which is what makes
 * the conservation check meaningful:
 *
 *   r1  carbon 6 -> 6,  phosphate 2 -> 2,  redox 2 -> 2
 *   r2  carbon 3 -> 3,  phosphate 1 -> 1,  redox 0 -> 0
 *   r3  carbon 3 -> 3,  phosphate 0 -> 0,  redox 1 -> 1
 */
export function buildScenario(scenario: Scenario): SimulationState {
  const definitions: readonly PoolDefinition[] = [
    { id: 'A', label: 'six carbon, carries two redox', initial: 4000, conserved: { carbon: 6, redox: 2 } },
    { id: 'B', label: 'three carbon, phosphorylated', initial: 0, conserved: { carbon: 3, phosphate: 1 } },
    { id: 'C', label: 'three carbon', initial: 0, conserved: { carbon: 3 } },
    { id: 'D', label: 'three carbon, reduced end product', initial: 0, conserved: { carbon: 3, redox: 1 } },
    { id: 'P', label: 'free phosphate', initial: 400, conserved: { phosphate: 1 } },
    { id: 'X', label: 'carrier, oxidised', initial: 10, conserved: {} },
    { id: 'Y', label: 'carrier, reduced', initial: 0, conserved: { redox: 1 } },
  ];

  const pools = new PoolRegistry(definitions);
  const at = (id: string): number => pools.indexOf(id);

  // Three scenarios, differing only in r1's and r3's Vmax.
  //
  // balanced   r3 reoxidises the carrier about as fast as r1 reduces it. The
  //            system settles and nothing ever runs short.
  // throttled  r3 is far too slow. X drains toward zero and the saturation
  //            curve throttles r1 smoothly on the way down, so the carrier
  //            gates throughput without any pool ever being over-drawn. This
  //            is the well-behaved case, and it is worth being able to see.
  // starved    r1 is fast enough to demand more X in a single tick than the
  //            pool holds. This is the case the proportional scaling guard
  //            exists for, and the only one that exercises it.
  const forwardVmax = scenario === 'starved' ? 400 : 20;
  const forwardKm = scenario === 'starved' ? 1 : 5;
  const recycleVmax = scenario === 'balanced' ? 40 : 0.4;

  const reactions: readonly Reaction[] = [
    {
      id: 'r1',
      substrates: [
        { poolIndex: at('A'), coefficient: 1 },
        { poolIndex: at('X'), coefficient: 2 },
        { poolIndex: at('P'), coefficient: 2 },
      ],
      products: [
        { poolIndex: at('B'), coefficient: 2 },
        { poolIndex: at('Y'), coefficient: 2 },
      ],
      kinetics: michaelisMenten(forwardVmax, forwardKm),
      enabled: true,
    },
    {
      id: 'r2',
      substrates: [{ poolIndex: at('B'), coefficient: 1 }],
      products: [
        { poolIndex: at('C'), coefficient: 1 },
        { poolIndex: at('P'), coefficient: 1 },
      ],
      kinetics: michaelisMenten(60, 4),
      enabled: true,
    },
    {
      id: 'r3',
      substrates: [
        { poolIndex: at('Y'), coefficient: 1 },
        { poolIndex: at('C'), coefficient: 1 },
      ],
      products: [
        { poolIndex: at('X'), coefficient: 1 },
        { poolIndex: at('D'), coefficient: 1 },
      ],
      kinetics: michaelisMenten(recycleVmax, 2),
      enabled: true,
    },
  ];

  return createSimulation(pools, reactions, createPrng(20260728));
}

function pad(value: string, width: number): string {
  return value.length >= width ? value : ' '.repeat(width - value.length) + value;
}

function padRight(value: string, width: number): string {
  return value.length >= width ? value : value + ' '.repeat(width - value.length);
}

export function run(ticks: number, scenario: Scenario, verbose = false): SimulationState {
  // The per-second shortfall log is correct for a running game and useless
  // here, where 60 lines of it would bury the report. The counters are kept
  // either way and printed below. Pass a third argument to see the log.
  setShortfallLogging(verbose);

  const state = buildScenario(scenario);
  const { pools, diagnostics } = state;

  const startTotals = pools.conservedIds.map((q) => pools.totalConserved(q));

  for (let t = 0; t < ticks; t += 1) tick(state);

  console.log('');
  console.log(`  krebs kernel harness, scenario "${scenario}"`);
  console.log(
    `  ${ticks} ticks, ${(ticks * TICK_SECONDS).toFixed(1)} game-seconds, ${elapsedMs(state)} ms`,
  );
  console.log('');
  console.log(`  ${padRight('pool', 5)}${pad('amount', 16)}${pad('short ticks', 14)}   label`);
  console.log(`  ${'-'.repeat(5)}${pad('-'.repeat(15), 16)}${pad('-'.repeat(13), 14)}   ${'-'.repeat(34)}`);
  for (let i = 0; i < pools.count; i += 1) {
    console.log(
      `  ${padRight(pools.ids[i] as string, 5)}` +
        `${pad((pools.amounts[i] as number).toFixed(6), 16)}` +
        `${pad(String(diagnostics.shortfallTicks[i] as number), 14)}` +
        `   ${pools.labels[i] as string}`,
    );
  }

  console.log('');
  console.log('  conservation');
  for (let q = 0; q < pools.conservedIds.length; q += 1) {
    const quantity = pools.conservedIds[q] as string;
    const start = startTotals[q] as number;
    const end = pools.totalConserved(quantity);
    const drift = end - start;
    const relative = start === 0 ? 0 : drift / start;
    console.log(
      `    ${padRight(quantity, 11)}start ${pad(start.toFixed(4), 14)}` +
        `   end ${pad(end.toFixed(4), 14)}` +
        `   relative drift ${relative.toExponential(3)}`,
    );
  }

  console.log('');
  console.log(`  scaling pass cap hit on   ${diagnostics.scalingCapHits} ticks`);
  console.log(`  pending offline ms        ${diagnostics.pendingOfflineMs}`);
  console.log('');

  return state;
}

const ticksArg = Number(process.argv[2] ?? '1200');
const scenarioArg = (process.argv[3] ?? 'balanced') as Scenario;
const verboseArg = process.argv.includes('--verbose');
run(Number.isFinite(ticksArg) && ticksArg > 0 ? ticksArg : 1200, scenarioArg, verboseArg);
