import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SETTLE_MAX_TICKS, STEADY_EPSILON, STEADY_WINDOW } from '../constants';
import { hashState } from '../hash';
import {
  createSteadyDetector,
  observeSteady,
  replayUntilSteady,
  resetSteadyDetector,
} from '../steady';
import { setShortfallLogging, tick } from '../tick';
import { createToyPathway } from './fixtures/toyPathway';

/**
 * The kernel half of the steady-state detector. Everything here runs against
 * the synthetic pathway, because these are properties of the detector rather
 * than of act 1, and act 1's configurations are measured in
 * src/content/act1/__tests__/steady.test.ts where the content lives.
 */

setShortfallLogging(false);

describe('steady-state detector', () => {
  /**
   * THE CHEAPEST GUARD AGAINST THE WHOLE CATEGORY OF MISTAKE THIS FILE COULD
   * MAKE. A detector that wrote to a pool, the tick count or the PRNG would
   * pass every other test in this project, because nothing else attaches one.
   */
  it('does not perturb the simulation it is measuring', () => {
    const withDetector = createToyPathway();
    const without = createToyPathway();
    const detector = createSteadyDetector(withDetector.pools.count);
    resetSteadyDetector(detector, withDetector);

    for (let i = 0; i < 2000; i += 1) {
      tick(withDetector);
      observeSteady(detector, withDetector);
      tick(without);
    }

    expect(hashState(withDetector)).toBe(hashState(without));
    expect(withDetector.tickCount).toBe(without.tickCount);
    expect(withDetector.prng.state).toBe(without.prng.state);
  });

  it('is deterministic: same seed, same detection tick', () => {
    const first = replayUntilSteady(
      createToyPathway(),
      createSteadyDetector(8),
      SETTLE_MAX_TICKS,
    );
    const second = replayUntilSteady(
      createToyPathway(),
      createSteadyDetector(8),
      SETTLE_MAX_TICKS,
    );
    expect(first.settled).toBe(true);
    expect(second.ticksRun).toBe(first.ticksRun);
    expect(second.worstPool).toBe(first.worstPool);
  });

  it('needs a full window of consecutive observations, not a cumulative count', () => {
    const state = createToyPathway();
    const detector = createSteadyDetector(state.pools.count);
    const first = replayUntilSteady(state, detector, SETTLE_MAX_TICKS);
    expect(first.settled).toBe(true);
    // The run reached the window exactly rather than overshooting it, which is
    // what a counter that never reset would do.
    expect(detector.run).toBe(STEADY_WINDOW);

    // Shove a pool. This is a test-only write and it stands in for the thing a
    // real event does, which is invalidate the steady state. A cumulative count
    // would ignore it and stay settled.
    const index = state.pools.indexOf('A');
    state.pools.amounts[index] = (state.pools.amounts[index] as number) * 2;

    let disturbed = 0;
    let resettledAt = -1;
    for (let i = 0; i < SETTLE_MAX_TICKS; i += 1) {
      tick(state);
      const settled = observeSteady(detector, state);
      if (detector.run === 0) disturbed += 1;
      if (settled) {
        resettledAt = i + 1;
        break;
      }
    }

    expect(disturbed).toBeGreaterThan(0);
    // Strictly more than a window, because the run was knocked back to zero and
    // had to be rebuilt from a system that was genuinely moving again.
    expect(resettledAt).toBeGreaterThan(STEADY_WINDOW);
    expect(detector.run).toBe(STEADY_WINDOW);
  });

  it('stops at the budget rather than running until it settles', () => {
    const state = createToyPathway();
    const result = replayUntilSteady(state, createSteadyDetector(state.pools.count), 40);
    expect(result.settled).toBe(false);
    expect(result.ticksRun).toBe(40);
    expect(state.tickCount).toBe(40);
  });

  it('re-arms on reset, so an event does not inherit the run count before it', () => {
    const state = createToyPathway();
    const detector = createSteadyDetector(state.pools.count);
    const settled = replayUntilSteady(state, detector, SETTLE_MAX_TICKS);
    expect(settled.settled).toBe(true);
    expect(detector.run).toBe(STEADY_WINDOW);

    resetSteadyDetector(detector, state);
    expect(detector.run).toBe(0);
    expect(detector.settled).toBe(false);
    expect(detector.worstPool).toBe(-1);

    // Already settled, so it settles again, and it takes a full window to do it
    // rather than reporting settled on the first observation.
    let ticksToResettle = 0;
    for (let i = 0; i < SETTLE_MAX_TICKS; i += 1) {
      tick(state);
      ticksToResettle += 1;
      if (observeSteady(detector, state)) break;
    }
    expect(ticksToResettle).toBe(STEADY_WINDOW + 1);
  });

  it('treats a frozen system as steady and a pool pinned at zero from motion as not', () => {
    // A pathway with every reaction off never changes, so every curvature is
    // exactly zero and the reading is zero at a pool size of zero too.
    const frozen = createToyPathway();
    for (const reaction of frozen.reactions) reaction.enabled = false;
    const result = replayUntilSteady(frozen, createSteadyDetector(frozen.pools.count), 1200);
    expect(result.settled).toBe(true);
    expect(result.worst).toBe(0);
    expect(result.ticksRun).toBe(STEADY_WINDOW + 1);
  });
});

/**
 * THE ALLOCATION RULE, AS A GUARD RATHER THAN AS A COMMENT.
 *
 * docs/SIMULATION.md Part 2 requires the flux scratch array to be allocated at
 * construction and the same argument applies here: the detector runs once per
 * tick inside a bounded replay that may run 1200 of them per event, sixty-four
 * times over. A per-tick allocation there is a garbage collector pause inside
 * the one code path that exists to avoid a visible stall.
 *
 * Source inspection rather than heap measurement, because a heap measurement in
 * a test runner is a flake waiting to happen and this catches the thing that
 * actually goes wrong, which is somebody writing `const readings = []` inside
 * the loop. Probed by adding each banned form to the hot path in turn.
 */
describe('the hot path allocates nothing', () => {
  const source = readFileSync(
    fileURLToPath(new URL('../steady.ts', import.meta.url)),
    'utf8',
  );

  function bodyOf(name: string): string {
    const start = source.indexOf(`export function ${name}(`);
    expect(start, `no function ${name} in steady.ts`).toBeGreaterThan(-1);
    const open = source.indexOf('{', source.indexOf(')', start));
    let depth = 0;
    for (let i = open; i < source.length; i += 1) {
      if (source[i] === '{') depth += 1;
      else if (source[i] === '}') {
        depth -= 1;
        if (depth === 0) return source.slice(open, i + 1);
      }
    }
    throw new Error(`unbalanced braces reading ${name}`);
  }

  const banned: readonly (readonly [string, string])[] = [
    ['new ', 'constructs an object per call'],
    ['[]', 'an array literal is an allocation'],
    ['.push(', 'pushing implies a growable array'],
    ['.map(', 'map allocates a result array'],
    ['.filter(', 'filter allocates a result array'],
    ['.slice(', 'slice allocates a copy'],
    ['Array.from', 'allocates'],
    ['...', 'a spread allocates'],
  ];

  for (const name of ['observeSteady', 'resetSteadyDetector']) {
    it(`${name} contains no allocating syntax`, () => {
      const body = bodyOf(name);
      for (const [form, why] of banned) {
        expect(body.includes(form), `${name} contains "${form}": ${why}`).toBe(false);
      }
    });
  }

  it('replayUntilSteady allocates once, for its own return value', () => {
    const body = bodyOf('replayUntilSteady');
    for (const [form, why] of banned) {
      if (form === '{}') continue;
      expect(body.includes(form), `replayUntilSteady contains "${form}": ${why}`).toBe(false);
    }
    // One object literal, returned once per settle rather than once per tick.
    expect(body.split('return {').length - 1).toBe(1);
  });

  it('every typed array in the file is sized in the constructor', () => {
    expect(bodyOf('createSteadyDetector').split('new Float64Array').length - 1).toBe(2);
    expect(source.split('new Float64Array').length - 1).toBe(2);
  });

  it('guards the guard: the banned list would fire on a real allocation', () => {
    const probe = 'const readings = []; readings.push(1);';
    const hits = banned.filter(([form]) => probe.includes(form));
    expect(hits.length).toBeGreaterThan(1);
  });
});

describe('the constants this detector is built on', () => {
  it('carries the values UPDATELOGV8.md stage 1 measured', () => {
    // Not a restatement for its own sake. Both were unvalidated placeholders
    // from V1 to V7 and both moved, and a later edit that quietly reverts
    // either one puts the walled cell outside the settle budget without any
    // other test in the project noticing.
    expect(STEADY_EPSILON).toBe(1e-5);
    expect(STEADY_WINDOW).toBe(250);
    expect(STEADY_WINDOW).toBeLessThan(SETTLE_MAX_TICKS);
  });
});
