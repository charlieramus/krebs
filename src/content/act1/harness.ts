/**
 * Headless act 1 harness. `npm run sim:act1`.
 *
 * There is still no interface, so this is the only way to look at act 1. Its
 * output is meant to be read by a person, not parsed. This file is an entry
 * point rather than a library: importing it runs it.
 *
 * Usage:
 *   npm run sim:act1                     1200 ticks of the full pathway
 *   npm run sim:act1 -- 400              400 ticks
 *   npm run sim:act1 -- 1200 walled      ferment disabled, the NAD+ stall
 *   npm run sim:act1 -- 1200 starved     glucose scarce, a different failure
 *   npm run sim:act1 -- 1200 walled --verbose   with the per-second shortfall log
 *
 * WHY THIS IS A SEPARATE FILE FROM src/sim/harness.ts. Not because the scenario
 * sets diverged, though they did. Because src/content/README.md states that
 * src/sim/ never depends on content, and a kernel harness importing
 * createAct1 would be exactly that dependency, in the one file most likely to
 * be read as a licence to add more. `npm run sim` still runs the toy pathway
 * and is untouched, so V1's reported output remains a reference someone can
 * check against.
 *
 * FLUX IS THE HEADLINE. NOW.md inverts the genre convention: rate gets the
 * large type and stock is the subscript. The flux table is therefore printed
 * first, before pools, and it carries both the mean over the run and the
 * instantaneous value at the end, because for act 1 those two numbers
 * disagreeing IS the reading. A walled run has a healthy mean and a dead
 * instantaneous, which is a stall. A starved run has both low together.
 */

import process from 'node:process';
import { TICK_SECONDS } from '../../sim/constants';
import { elapsedMs } from '../../sim/loop';
import { computeFlux, type Reaction } from '../../sim/reactions';
import type { SimulationState } from '../../sim/state';
import { setShortfallLogging, tick } from '../../sim/tick';
import {
  atpPerCompletedGlucose,
  createAct1Meter,
  createAct1MeterProbes,
  netAtpPerCompletedGlucose,
  recordAct1Tick,
} from './meter';
import { createAct1 } from './reactions';

export type Act1Scenario = 'fermenting' | 'walled' | 'starved';

/**
 * Three scenarios over the one act 1 pathway.
 *
 * fermenting  Everything enabled. The pathway runs, NAD+ is recycled, lactate
 *             accumulates. What act 1 looks like once the player has solved it.
 * walled      Ferment disabled, defaults otherwise. NAD+ drains, the payoff
 *             phase stops, and glucose piles up INSIDE the cell with the
 *             environment still full. The act 1 teaching beat.
 * starved     Ferment enabled but environmental glucose scarce. The pathway is
 *             capable and undersupplied, so every flux is low together.
 *
 * The last two are the two failure modes and they must not look alike. Walled
 * is a cell that cannot use what it has: uptake at full rate, payoff at zero,
 * glucose piling up inside. Starved is a cell that has nothing: every flux low,
 * no pool accumulating anywhere. Telling those apart at a glance is the thing
 * V3 has to render, so the harness is where the distinction gets designed.
 *
 * ON THE 500 BELOW, WHICH IS NOT AN ARBITRARY NUMBER.
 *
 * The first draft of this scenario used 20, and it did not show substrate
 * limitation. It showed the pathway dying of ATP exhaustion and never coming
 * back. Below roughly 400 environmental glucose, uptake is slow enough that
 * baseline maintenance drains ATP faster than the pathway can bootstrap, ATP
 * decays toward zero, and the preparatory phase can no longer pay its 2 ATP
 * entry cost. Nothing can restart it: prep needs ATP, payoff needs the g3p that
 * only prep makes. Glucose keeps arriving and the cell stays dead.
 *
 * That is a real property of this configuration and it is left visible rather
 * than tuned away here, because stage 5 measures and does not balance. It is
 * written up in the stage 5 report as a finding for V3. 500 is chosen as the
 * lowest round number that is comfortably clear of the trap, so this scenario
 * shows the failure mode it is named for instead of a different one.
 */
export function buildAct1Scenario(scenario: Act1Scenario): SimulationState {
  if (scenario === 'walled') {
    return createAct1({ enabled: { ferment: false } });
  }
  if (scenario === 'starved') {
    return createAct1({ enabled: { ferment: true }, initial: { glucose_env: 500 } });
  }
  return createAct1({ enabled: { ferment: true } });
}

function pad(value: string, width: number): string {
  return value.length >= width ? value : ' '.repeat(width - value.length) + value;
}

function padRight(value: string, width: number): string {
  return value.length >= width ? value : value + ' '.repeat(width - value.length);
}

export function runAct1(
  ticks: number,
  scenario: Act1Scenario,
  verbose = false,
): SimulationState {
  setShortfallLogging(verbose);

  const state = buildAct1Scenario(scenario);
  const { pools, reactions, diagnostics } = state;
  const reactionCount = reactions.length;

  const startTotals = pools.conservedIds.map((q) => pools.totalConserved(q));
  const g3pStart = pools.get('g3p');

  const probes = createAct1MeterProbes(state);
  const meter = createAct1Meter();
  /** Units of flux actually applied per reaction, integrated over the run. */
  const appliedUnits = new Float64Array(reactionCount);

  for (let t = 0; t < ticks; t += 1) {
    tick(state);
    recordAct1Tick(state, probes, meter);
    for (let r = 0; r < reactionCount; r += 1) {
      appliedUnits[r] =
        (appliedUnits[r] as number) +
        (state.fluxes[r] as number) * (state.scales[r] as number) * TICK_SECONDS;
    }
  }

  const gameSeconds = ticks * TICK_SECONDS;
  const g3pDelta = pools.get('g3p') - g3pStart;

  console.log('');
  console.log(`  krebs act 1 harness, scenario "${scenario}"`);
  console.log(`  ${ticks} ticks, ${gameSeconds.toFixed(1)} game-seconds, ${elapsedMs(state)} ms`);

  console.log('');
  console.log('  flux');
  console.log(
    `  ${padRight('reaction', 10)}${pad('mean /s', 14)}${pad('at end /s', 14)}   state`,
  );
  console.log(`  ${'-'.repeat(10)}${pad('-'.repeat(13), 14)}${pad('-'.repeat(13), 14)}   ${'-'.repeat(8)}`);
  for (let r = 0; r < reactionCount; r += 1) {
    const reaction = reactions[r] as Reaction;
    const mean = (appliedUnits[r] as number) / gameSeconds;
    const now = computeFlux(reaction, pools.amounts);
    console.log(
      `  ${padRight(reaction.id, 10)}${pad(mean.toFixed(6), 14)}${pad(now.toFixed(6), 14)}` +
        `   ${reaction.enabled ? 'on' : 'off'}`,
    );
  }

  console.log('');
  console.log('  yield');
  console.log(`    cumulative ATP produced   ${meter.atpProduced.toFixed(6)} gross`);
  console.log(`    cumulative ATP spent      ${meter.atpSpent.toFixed(6)} in the preparatory phase`);
  console.log(`    cumulative ATP hydrolysed ${meter.atpMaintained.toFixed(6)} by maintenance`);
  console.log(`    glucose taken up          ${meter.glucoseTakenUp.toFixed(6)}`);
  console.log(`    glucose committed         ${meter.glucoseConsumed.toFixed(6)} to glycolysis`);
  console.log(`    lactate produced          ${meter.lactateProduced.toFixed(6)}`);
  console.log(
    `    ATP per glucose           ${atpPerCompletedGlucose(meter, g3pDelta).toFixed(9)} gross, ` +
      `${netAtpPerCompletedGlucose(meter, g3pDelta).toFixed(9)} net`,
  );
  console.log('                              per glucose that finished the pathway, see meter.ts');

  console.log('');
  console.log(`  ${padRight('pool', 12)}${pad('amount', 16)}${pad('short ticks', 14)}   label`);
  console.log(
    `  ${'-'.repeat(12)}${pad('-'.repeat(15), 16)}${pad('-'.repeat(13), 14)}   ${'-'.repeat(30)}`,
  );
  for (let i = 0; i < pools.count; i += 1) {
    console.log(
      `  ${padRight(pools.ids[i] as string, 12)}` +
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
    const relative = start === 0 ? 0 : (end - start) / start;
    console.log(
      `    ${padRight(quantity, 13)}start ${pad(start.toFixed(4), 14)}` +
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
const scenarioArg = (process.argv[3] ?? 'fermenting') as Act1Scenario;
const verboseArg = process.argv.includes('--verbose');
runAct1(Number.isFinite(ticksArg) && ticksArg > 0 ? ticksArg : 1200, scenarioArg, verboseArg);
