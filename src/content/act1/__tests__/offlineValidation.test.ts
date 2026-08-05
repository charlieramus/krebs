import { describe, expect, it } from 'vitest';
import { hashState } from '../../../sim/hash';
import { resolveOffline } from '../../../sim/jump';
import { createSteadyDetector } from '../../../sim/steady';
import { tick } from '../../../sim/tick';
import { createAct1Meter, createAct1MeterProbes, recordAct1Tick } from '../meter';
import { createAct1OfflineObserver } from '../offline';
import {
  buildConfiguration,
  buildSweep,
  CONFIGURATIONS,
  DURATION_BANDS,
  OFFLINE_ATP_TOLERANCE,
  OFFLINE_CONSERVATION_TOLERANCE,
  OFFLINE_MISPLACED_TOLERANCE,
  runSweep,
} from '../offlineValidation';

/**
 * docs/SIMULATION.md Part 3, "Validation requirement". The justification for
 * the entire approach, in that document's own words: without it the offline
 * path is an unverified shortcut.
 *
 * THIS IS THE FAST BAND AND IT IS A REAL SUBSET RATHER THAN A DIFFERENT TEST.
 * `npm run offline:validate` runs the same `runSweep` across all eleven
 * duration bands including twenty-four hours; this runs the first six, up to
 * forty minutes jittered to eighty. One implementation, one tolerance, two
 * bands.
 *
 * The split is a cost decision and it is disclosed rather than glossed. The
 * reference side is full tick-by-tick replay and twenty-four game-hours is
 * 1,728,000 ticks, measured at about 1.4 seconds each. A 200-case sweep across
 * the whole range takes 58 seconds of reference replay, and a suite that takes
 * a minute is a suite people stop running, which is how a validation test
 * becomes the shortcut it was written to prevent. The slow band runs from a
 * command until UPDATELOGV9.md gives it a machine.
 */

const SEED = 20260805;
const FAST_CASES = 40;
/** Bands 0 to 5: one minute to forty minutes, jittered to at most eighty. */
const FAST_BANDS = 6;

describe('the offline path against full replay', () => {
  const summary = runSweep(SEED, FAST_CASES, FAST_BANDS);

  it('agrees with full replay on cumulative ATP, across the whole sweep', () => {
    for (const result of summary.results) {
      expect(
        result.atpRelative,
        `case ${result.sweepCase.index}, ${result.sweepCase.configuration}, ` +
          `${(result.sweepCase.ticks / 1200).toFixed(1)} min`,
      ).toBeLessThan(OFFLINE_ATP_TOLERANCE);
    }
  });

  it('puts every conserved quantity where full replay put it', () => {
    for (const result of summary.results) {
      expect(
        result.misplacedFraction,
        `case ${result.sweepCase.index}, ${result.sweepCase.configuration}`,
      ).toBeLessThan(OFFLINE_MISPLACED_TOLERANCE);
    }
  });

  /**
   * The jump multiplies rates by durations and writes the results into pools
   * without going through the two-phase update, which is the one place in the
   * entire project where a pool changes outside the tick. So it is the one
   * place conservation could break in a way nothing existing would catch.
   */
  it('conserves all five quantities across the offline path, on every case', () => {
    for (const result of summary.results) {
      expect(
        result.conservationRelative,
        `case ${result.sweepCase.index}, ${result.sweepCase.configuration}`,
      ).toBeLessThan(OFFLINE_CONSERVATION_TOLERANCE);
    }
  });

  /**
   * Part 3 calls the fallback a bug signal rather than a normal condition and
   * says a well-tuned configuration should always settle. Act 1 as V5 balanced
   * it always does, and if that stops being true it is a finding about the
   * economy that belongs in docs/ECONOMY.md rather than something to absorb
   * here.
   */
  it('never falls back and never exhausts the event budget', () => {
    expect(summary.fallbacks).toBe(0);
    expect(summary.budgetExhaustions).toBe(0);
  });

  it('reports the sweep, because the numbers are the deliverable', () => {
    console.log(`  offline validation, fast band, seed ${SEED}, ${FAST_CASES} cases`);
    console.log(
      `    worst ATP relative        ${summary.worstAtp.atpRelative.toExponential(3)}` +
        `  at ${summary.worstAtp.sweepCase.configuration}, ` +
        `${(summary.worstAtp.sweepCase.ticks / 1200).toFixed(1)} min`,
    );
    console.log(
      `    worst ATP absolute        ${summary.worstAtpAbsolute.atpAbsolute.toFixed(1)} ATP` +
        ` of ${summary.worstAtpAbsolute.atpTotal.toFixed(0)} produced`,
    );
    console.log(
      `    worst misplaced fraction  ${summary.worstMisplaced.misplacedFraction.toExponential(3)}`,
    );
    console.log(
      `    worst conservation drift  ${summary.worstConservation.conservationRelative.toExponential(3)}`,
    );
    console.log(
      `    reference replay          ${(summary.replayMs / 1000).toFixed(2)} s against ` +
        `${(summary.offlineMs / 1000).toFixed(3)} s offline`,
    );
    expect(summary.results.length).toBe(FAST_CASES);
  });

  it('is reproducible from its seed', () => {
    const first = buildSweep(SEED, FAST_CASES, FAST_BANDS);
    const second = buildSweep(SEED, FAST_CASES, FAST_BANDS);
    expect(second).toEqual(first);
    // And a different seed gives a different sweep, so the seed is doing work.
    expect(buildSweep(SEED + 1, FAST_CASES, FAST_BANDS)).not.toEqual(first);
  });

  it('covers every configuration and the whole band it claims', () => {
    const cases = buildSweep(SEED, FAST_CASES, FAST_BANDS);
    const seen = new Set(cases.map((c) => c.configuration));
    expect(seen.size).toBe(CONFIGURATIONS.length);
    const shortest = Math.min(...cases.map((c) => c.ticks));
    const longest = Math.max(...cases.map((c) => c.ticks));
    expect(shortest).toBeLessThanOrEqual(DURATION_BANDS[1] as number);
    expect(longest).toBeGreaterThan(DURATION_BANDS[FAST_BANDS - 1] as number);
  });
});

/* ===========================================================================
   THE DETERMINISM GUARANTEE, SCOPED.

   docs/SIMULATION.md Part 5 says determinism is a tested property and that the
   same seed plus the same input sequence must produce a bit-identical state
   hash. That sentence is now true only of the full-fidelity path. The two
   claims are asserted separately here so that neither can quietly stand in for
   the other.
   =========================================================================== */

describe('determinism, and what it now covers', () => {
  it('full replay is bit-identical, seed for seed, unchanged', () => {
    const first = buildConfiguration('fermenting');
    const second = buildConfiguration('fermenting');
    for (let i = 0; i < 24000; i += 1) {
      tick(first);
      tick(second);
    }
    expect(hashState(second)).toBe(hashState(first));
    // The frozen canonical values live where they always did, in
    // src/sim/__tests__/determinism.test.ts at 172f83fb and
    // src/content/act1/__tests__/determinism.test.ts at 49ea08d3. Neither moved
    // in this log and neither is duplicated here.
  });

  /**
   * THE CLAIM THAT IS NOT MADE, AND IT IS ASSERTED RATHER THAN OMITTED.
   *
   * The offline path is correct within a tolerance by construction, so it
   * cannot be bit-identical to full replay and must not be tested as though it
   * could be. Asserting the difference rather than merely not asserting
   * equality is the difference between a scoped guarantee and an untested
   * assumption: if a future change made the two identical, that would mean the
   * jump had stopped jumping, and this test would notice.
   */
  it('an offline jump agrees within tolerance and is NOT bit-identical', () => {
    const ticks = 24000;

    const truth = buildConfiguration('fermenting');
    const truthProbes = createAct1MeterProbes(truth);
    const truthMeter = createAct1Meter();
    for (let i = 0; i < ticks; i += 1) {
      tick(truth);
      recordAct1Tick(truth, truthProbes, truthMeter);
    }

    const got = buildConfiguration('fermenting');
    const probes = createAct1MeterProbes(got);
    const meter = createAct1Meter();
    const outcome = resolveOffline(
      got,
      createSteadyDetector(got.pools.count),
      ticks,
      createAct1OfflineObserver(probes, meter),
    );

    expect(outcome.events.length).toBeGreaterThan(0);
    expect(got.tickCount).toBe(truth.tickCount);
    expect(hashState(got)).not.toBe(hashState(truth));

    const relative =
      Math.abs(truthMeter.atpProduced - meter.atpProduced) / truthMeter.atpProduced;
    expect(relative).toBeLessThan(OFFLINE_ATP_TOLERANCE);
  });

  /**
   * The offline path is deterministic in its own right, which is a weaker claim
   * than bit-identity with replay and a necessary one. The same save loaded
   * twice with the same elapsed time has to produce the same state, or a
   * reload becomes a source of variation. Stage 5 asserts the save-layer half
   * of this; here it is the algorithm's half.
   */
  it('the offline path reproduces itself exactly', () => {
    const run = (): string => {
      const state = buildConfiguration('glycolytic-4');
      const probes = createAct1MeterProbes(state);
      const meter = createAct1Meter();
      resolveOffline(
        state,
        createSteadyDetector(state.pools.count),
        288000,
        createAct1OfflineObserver(probes, meter),
      );
      return `${hashState(state)}|${meter.atpProduced}`;
    };
    expect(run()).toBe(run());
  });
});
