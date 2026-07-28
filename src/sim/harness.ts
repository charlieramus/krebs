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
 * The pathway is the synthetic fixture the property tests run against, imported
 * rather than copied so the thing being looked at and the thing being guarded
 * cannot drift apart. It is deliberately NOT glycolysis and carries no
 * biological values, so nothing here can leak into player-facing text and
 * nothing here should ever be cited. Act 1 content arrives in V2.
 */

import process from 'node:process';
import type { SimulationState } from './state';
import { setShortfallLogging, tick } from './tick';
import { elapsedMs } from './loop';
import { TICK_SECONDS } from './constants';
import { createToyPathway } from './__tests__/fixtures/toyPathway';

export type Scenario = 'balanced' | 'throttled' | 'starved';

/**
 * Three scenarios over the one shared fixture, differing only in r1's and r3's
 * kinetics. See the fixture for the pathway itself and its conservation
 * bookkeeping.
 *
 * balanced   r3 reoxidises the carrier about as fast as r1 reduces it. The
 *            system settles and nothing ever runs short. Fixture defaults.
 * throttled  r3 is far too slow. X drains toward zero and the saturation curve
 *            throttles r1 smoothly on the way down, so the carrier gates
 *            throughput without any pool ever being over-drawn. The
 *            well-behaved failure, and worth being able to see.
 * starved    r1 is fast enough to demand more X in a single tick than the pool
 *            holds. This is the case the proportional scaling guard exists for,
 *            and the only one of the three that exercises it.
 */
export function buildScenario(scenario: Scenario): SimulationState {
  if (scenario === 'throttled') {
    return createToyPathway({ vmax: { r3: 0.4 } });
  }
  if (scenario === 'starved') {
    return createToyPathway({ vmax: { r1: 400, r3: 0.4 }, km: { r1: 1 } });
  }
  return createToyPathway();
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
