/**
 * How long the environment lasts. `npm run sim:drain`.
 *
 * UPDATELOGV3.md stage 1 step 6 asks for a measurement and explicitly not a fix.
 * NOW.md blocking item 1 records that act 1 has an unrecoverable state below
 * roughly 400 environmental glucose: baseline maintenance drains ATP faster than
 * the pathway can bootstrap, the preparatory phase can no longer pay its 2 ATP
 * entry cost, and nothing can restart it because `prep` needs ATP and `payoff`
 * needs the g3p only `prep` makes. UPDATELOGV3.md's arithmetic says a fermenting
 * cell crosses that threshold at roughly 21 minutes, against a
 * docs/PROGRESSION.md target act duration of 45 to 90 minutes.
 *
 * That arithmetic is not trusted here. This measures it, headlessly, through the
 * same src/ui/runtime.ts bridge the browser uses, so the figure stage 6 decides
 * on is the figure the interface will actually produce.
 *
 * This is an entry point rather than a library: importing it runs it. Same
 * posture as src/content/act1/harness.ts and for the same reason.
 */

import process from 'node:process';
import { TICK_MS } from '../sim/constants';
import { setShortfallLogging } from '../sim/tick';
import { ACT1_GLUCOSE_ENV_INITIAL } from '../content/act1/tuning';
import { UPTAKE_VMAX_STEPS } from './tuning';
import { createAct1Runtime } from './runtime';
import { poolIndex } from './runtime';

/** The threshold NOW.M blocking item 1 names. Below this the bootstrap trap bites. */
const TRAP_THRESHOLD = 400;

/**
 * Uptake Vmax values worth measuring.
 *
 * Stage 1 measured a guessed range of 8, 12, 18 and 26, because the capacity
 * ladder did not exist yet. It exists now, so this reads it: these are the Vmax
 * values the game actually sells, and the last of them is the fastest the
 * environment can be drained by a player who buys everything.
 *
 * The ladder stops at 12 because `prep` runs at Vmax 12 and uptake above that
 * delivers glucose the preparatory phase cannot consume. See src/ui/tuning.ts.
 */
const UPTAKE_STEPS = UPTAKE_VMAX_STEPS;

interface DrainResult {
  readonly uptakeVmax: number;
  /** Game seconds at which glucose_env fell below TRAP_THRESHOLD, or null. */
  readonly crossedAtSeconds: number | null;
  readonly glucoseEnvAtEnd: number;
  readonly atpAtEnd: number;
  readonly atpAtCrossing: number | null;
  readonly ranSeconds: number;
}

function measure(uptakeVmax: number, maxMinutes: number): DrainResult {
  const runtime = createAct1Runtime({
    act1: { enabled: { ferment: true }, vmax: { uptake: uptakeVmax } },
  });

  const envIndex = poolIndex('glucose_env');
  const atpIndex = poolIndex('atp');
  const amounts = runtime.state.pools.amounts;

  const maxTicks = Math.round((maxMinutes * 60 * 1000) / TICK_MS);
  let crossedAtSeconds: number | null = null;
  let atpAtCrossing: number | null = null;

  // One tick per frame. Frame timing provably does not reach the simulation, so
  // the cheapest framing is the correct one. See src/ui/__tests__/runtime.test.ts.
  let nowMs = 0;
  runtime.frame(nowMs);
  for (let t = 0; t < maxTicks; t += 1) {
    nowMs += TICK_MS;
    runtime.frame(nowMs);
    if (crossedAtSeconds === null && (amounts[envIndex] as number) < TRAP_THRESHOLD) {
      crossedAtSeconds = runtime.snapshot.elapsedMs / 1000;
      atpAtCrossing = amounts[atpIndex] as number;
    }
  }

  return {
    uptakeVmax,
    crossedAtSeconds,
    atpAtCrossing,
    glucoseEnvAtEnd: amounts[envIndex] as number,
    atpAtEnd: amounts[atpIndex] as number,
    ranSeconds: runtime.snapshot.elapsedMs / 1000,
  };
}

function pad(value: string, width: number): string {
  return value.length >= width ? value : ' '.repeat(width - value.length) + value;
}

function padRight(value: string, width: number): string {
  return value.length >= width ? value : value + ' '.repeat(width - value.length);
}

function minutes(seconds: number): string {
  return `${Math.floor(seconds / 60)}m ${(seconds % 60).toFixed(1)}s`;
}

const maxMinutesArg = Number(process.argv[2] ?? '120');
const maxMinutes = Number.isFinite(maxMinutesArg) && maxMinutesArg > 0 ? maxMinutesArg : 120;

setShortfallLogging(false);

console.log('');
console.log('  krebs environment drain, measured through src/ui/runtime.ts');
console.log(`  ferment enabled, glucose_env starting at ${ACT1_GLUCOSE_ENV_INITIAL}, ${maxMinutes} game-minutes each`);
console.log(`  threshold ${TRAP_THRESHOLD}, the ATP bootstrap trap from NOW.md blocking item 1`);
console.log('');
console.log(
  `  ${padRight('uptake Vmax', 13)}${pad('crosses 400', 18)}${pad('env at end', 14)}` +
    `${pad('atp at crossing', 18)}${pad('atp at end', 14)}`,
);
console.log(`  ${'-'.repeat(13)}${pad('-'.repeat(17), 18)}${pad('-'.repeat(13), 14)}${pad('-'.repeat(17), 18)}${pad('-'.repeat(13), 14)}`);

for (const uptakeVmax of UPTAKE_STEPS) {
  const result = measure(uptakeVmax, maxMinutes);
  console.log(
    `  ${padRight(String(result.uptakeVmax), 13)}` +
      `${pad(result.crossedAtSeconds === null ? 'not in window' : minutes(result.crossedAtSeconds), 18)}` +
      `${pad(result.glucoseEnvAtEnd.toFixed(2), 14)}` +
      `${pad(result.atpAtCrossing === null ? '-' : result.atpAtCrossing.toExponential(3), 18)}` +
      `${pad(result.atpAtEnd.toExponential(3), 14)}`,
  );
}

console.log('');
console.log('  Measured, not fixed. UPDATELOGV3.md stage 6 decides what to do about it.');
console.log('');
