/**
 * The slow band of the Part 3 validation sweep. `npm run offline:validate`.
 *
 * An entry point rather than a library: importing it runs it. Same shape as
 * `harness.ts` and `src/ui/drain.ts`.
 *
 * WHY IT IS NOT IN `npm test`, STATED PLAINLY. The reference side of this
 * comparison is full tick-by-tick replay, and twenty-four game-hours is
 * 1,728,000 ticks. A sweep with real weight in the top bands takes minutes, and
 * a suite that takes minutes is a suite people stop running, which turns a
 * validation test into the unverified shortcut Part 3 warns about wearing a
 * test's clothes.
 *
 * So the split is: `__tests__/offlineValidation.test.ts` runs the bands up to
 * forty minutes on every `npm test`, and this runs the whole range including
 * twenty-four hours. Both call the same `runSweep`, so there is one
 * implementation and one tolerance rather than a fast approximation of a slow
 * truth. UPDATELOGV9.md owns CI and this is the command it should run.
 *
 * Usage:
 *   npm run offline:validate                  48 cases, all eleven bands, seed 20260805
 *   npm run offline:validate -- 96            96 cases
 *   npm run offline:validate -- 96 12345      96 cases from seed 12345
 */

import process from 'node:process';
import { OFFLINE_ATP_TOLERANCE, OFFLINE_MISPLACED_TOLERANCE } from './offlineValidation';
import { DURATION_BANDS, runSweep, type CaseResult } from './offlineValidation';

const DEFAULT_SEED = 20260805;
const DEFAULT_COUNT = 48;

function pad(value: string, width: number): string {
  return value.length >= width ? value : ' '.repeat(width - value.length) + value;
}

function padRight(value: string, width: number): string {
  return value.length >= width ? value : value + ' '.repeat(width - value.length);
}

function line(result: CaseResult): string {
  const minutes = (result.sweepCase.ticks / 1200).toFixed(1);
  return (
    `  ${pad(String(result.sweepCase.index), 4)}  ` +
    `${padRight(result.sweepCase.configuration, 20)}` +
    `${pad(minutes, 9)} min` +
    `${pad(String(result.events), 8)} ev` +
    `${pad(result.atpRelative.toExponential(2), 12)}` +
    `${pad(result.misplacedFraction.toExponential(2), 12)}` +
    `${pad(result.conservationRelative.toExponential(2), 12)}` +
    `${pad(result.replayMs.toFixed(0), 9)} ms` +
    `${pad(result.offlineMs.toFixed(1), 9)} ms` +
    `${result.resolved ? '' : '  FALLBACK'}${result.budgetExhausted ? '  BUDGET' : ''}`
  );
}

const count = Number(process.argv[2] ?? DEFAULT_COUNT);
const seed = Number(process.argv[3] ?? DEFAULT_SEED);

console.log('');
console.log(`  krebs offline validation, docs/SIMULATION.md Part 3`);
console.log(
  `  ${count} cases, seed ${seed}, all ${DURATION_BANDS.length} bands, one minute to twenty-four hours`,
);
console.log('');
console.log(
  `  ${pad('#', 4)}  ${padRight('configuration', 20)}${pad('window', 9)}    ` +
    `${pad('events', 5)}   ${pad('ATP rel', 12)}${pad('misplaced', 12)}${pad('conserve', 12)}` +
    `${pad('replay', 9)}   ${pad('offline', 9)}`,
);

const summary = runSweep(seed, count, DURATION_BANDS.length);
for (const result of summary.results) console.log(line(result));

console.log('');
console.log(`  worst ATP disagreement      ${summary.worstAtp.atpRelative.toExponential(3)}` +
  `  at case ${summary.worstAtp.sweepCase.index}, ${summary.worstAtp.sweepCase.configuration}, ` +
  `${(summary.worstAtp.sweepCase.ticks / 1200).toFixed(1)} min`);
console.log(`  worst ATP disagreement, in ATP` +
  `  ${summary.worstAtpAbsolute.atpAbsolute.toFixed(1)} of ${summary.worstAtpAbsolute.atpTotal.toFixed(0)} produced` +
  `  at case ${summary.worstAtpAbsolute.sweepCase.index}, ${summary.worstAtpAbsolute.sweepCase.configuration}, ` +
  `${(summary.worstAtpAbsolute.sweepCase.ticks / 1200).toFixed(1)} min`);
console.log(`  worst misplaced fraction    ${summary.worstMisplaced.misplacedFraction.toExponential(3)}` +
  `  at case ${summary.worstMisplaced.sweepCase.index}, ${summary.worstMisplaced.sweepCase.configuration}`);
console.log(`  worst conservation drift    ${summary.worstConservation.conservationRelative.toExponential(3)}` +
  `  at case ${summary.worstConservation.sweepCase.index}, ${summary.worstConservation.sweepCase.configuration}`);
console.log('');
console.log(`  tolerance, ATP              ${OFFLINE_ATP_TOLERANCE.toExponential(0)}`);
console.log(`  tolerance, misplaced        ${OFFLINE_MISPLACED_TOLERANCE.toExponential(0)}`);
console.log(`  fallbacks                   ${summary.fallbacks}`);
console.log(`  budget exhaustions          ${summary.budgetExhaustions}`);
console.log(
  `  reference side total        ${(summary.replayMs / 1000).toFixed(1)} s against ` +
    `${(summary.offlineMs / 1000).toFixed(2)} s for the offline path`,
);
console.log('');

const failed = summary.results.filter(
  (r) =>
    r.atpRelative > OFFLINE_ATP_TOLERANCE ||
    r.misplacedFraction > OFFLINE_MISPLACED_TOLERANCE ||
    !r.resolved,
);
if (failed.length > 0) {
  console.log(`  ${failed.length} case(s) outside tolerance:`);
  for (const result of failed) console.log(line(result));
  console.log('');
  process.exitCode = 1;
} else {
  console.log('  every case inside tolerance.');
  console.log('');
}
