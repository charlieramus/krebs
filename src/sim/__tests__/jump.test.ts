import { describe, expect, it } from 'vitest';
import { EVENT_BUDGET, MAX_JUMP_DEPLETION_FRACTION, SETTLE_MAX_TICKS } from '../constants';
import {
  applyJump,
  nextHorizon,
  nextZeroCrossing,
  resolveOffline,
  retireSpentPools,
  substrateMask,
} from '../jump';
import { createSteadyDetector, replayUntilSteady } from '../steady';
import { setShortfallLogging, tick } from '../tick';
import { createToyPathway } from './fixtures/toyPathway';

/**
 * The kernel half of the analytic jump, against the synthetic pathway. Act 1
 * end to end lives in src/content/act1/__tests__/offline.test.ts.
 */

setShortfallLogging(false);

describe('event enumeration', () => {
  it('marks exactly the pools some enabled reaction consumes', () => {
    const state = createToyPathway();
    const mask = substrateMask(state);
    // The toy pathway is r1: A + 2X + 2P -> 2B + 2Y, r2: B -> C + G + P,
    // r3: Y + C -> X + D. So D and G are products only.
    const consumed = new Set<string>();
    for (let i = 0; i < state.pools.count; i += 1) {
      if (mask[i] === 1) consumed.add(state.pools.ids[i] as string);
    }
    expect(consumed).toEqual(new Set(['A', 'B', 'C', 'P', 'X', 'Y']));
    expect(consumed.has('D')).toBe(false);
    expect(consumed.has('G')).toBe(false);
  });

  it('ignores a disabled reaction, so its substrates stop constraining', () => {
    const state = createToyPathway();
    const r3 = state.reactions.find((r) => r.id === 'r3');
    if (r3 === undefined) throw new Error('no r3');
    r3.enabled = false;
    const mask = substrateMask(state);
    // Y is consumed only by r3. C is consumed only by r3 too.
    expect(mask[state.pools.indexOf('Y')]).toBe(0);
    expect(mask[state.pools.indexOf('C')]).toBe(0);
    expect(mask[state.pools.indexOf('A')]).toBe(1);
  });

  it('locates the horizon by division and nothing else', () => {
    const state = createToyPathway();
    const mask = substrateMask(state);
    const rates = new Float64Array(state.pools.count);
    const a = state.pools.indexOf('A');
    const p = state.pools.indexOf('P');
    rates[a] = -0.5;
    rates[p] = -0.25;

    const horizon = nextHorizon(state, rates, mask);
    const expected = Math.min(
      state.pools.get('A') / 0.5,
      state.pools.get('P') / 0.25,
    );
    expect(horizon.ticks).toBe(expected);
    expect(horizon.draining).toBe(true);
  });

  it('bounds on a rising substrate as well as a draining one', () => {
    const state = createToyPathway();
    const mask = substrateMask(state);
    const rates = new Float64Array(state.pools.count);
    const x = state.pools.indexOf('X');
    rates[x] = state.pools.get('X') / 10; // doubles in ten ticks
    const horizon = nextHorizon(state, rates, mask);
    expect(horizon.poolIndex).toBe(x);
    expect(horizon.ticks).toBeCloseTo(10, 9);
    expect(horizon.draining).toBe(false);
  });

  it('is infinite when nothing that matters is moving', () => {
    const state = createToyPathway();
    const mask = substrateMask(state);
    const rates = new Float64Array(state.pools.count);
    // Only a product-only pool moves, and it can change no rate.
    rates[state.pools.indexOf('D')] = 5;
    expect(nextHorizon(state, rates, mask).ticks).toBe(Number.POSITIVE_INFINITY);
  });

  it('the zero crossing covers every pool, including ones no reaction consumes', () => {
    const state = createToyPathway();
    const rates = new Float64Array(state.pools.count);
    const d = state.pools.indexOf('D');
    state.pools.amounts[d] = 10;
    rates[d] = -1;
    const crossing = nextZeroCrossing(state, rates);
    expect(crossing.poolIndex).toBe(d);
    expect(crossing.ticks).toBe(10);
    // And the drift horizon does not, because D drives nothing.
    expect(nextHorizon(state, rates, substrateMask(state)).ticks).toBe(
      Number.POSITIVE_INFINITY,
    );
  });
});

describe('the jump itself', () => {
  it('advances pools and the tick count together and touches nothing else', () => {
    const state = createToyPathway();
    const rates = new Float64Array(state.pools.count);
    rates[state.pools.indexOf('A')] = -2;
    rates[state.pools.indexOf('D')] = 3;

    const beforeA = state.pools.get('A');
    const beforeD = state.pools.get('D');
    const beforeSeed = state.prng.seed;
    const beforeRng = state.prng.state;

    applyJump(state, rates, 100);

    expect(state.pools.get('A')).toBe(beforeA - 200);
    expect(state.pools.get('D')).toBe(beforeD + 300);
    expect(state.tickCount).toBe(100);
    // ACT 1 CONSUMES NO RANDOM NUMBERS, so a jump advances the PRNG by nothing.
    // Asserted rather than assumed because it stops being true in act 2.
    expect(state.prng.state).toBe(beforeRng);
    expect(state.prng.seed).toBe(beforeSeed);
  });

  it('conserves exactly, because the rate vector came from a tick that did', () => {
    const state = createToyPathway();
    const detector = createSteadyDetector(state.pools.count);
    replayUntilSteady(state, detector, SETTLE_MAX_TICKS);

    const before = state.pools.conservedIds.map((q) => state.pools.totalConserved(q));
    applyJump(state, detector.previousDelta, 5000);
    const after = state.pools.conservedIds.map((q) => state.pools.totalConserved(q));

    for (let i = 0; i < before.length; i += 1) {
      const start = before[i] as number;
      if (start === 0) continue;
      expect(Math.abs((after[i] as number) - start) / start).toBeLessThan(1e-12);
    }
  });
});

describe('retiring a spent pool', () => {
  it('empties only what is below the floor, and takes its rate with it', () => {
    const state = createToyPathway();
    const peak = Float64Array.from(state.pools.amounts);
    const rates = new Float64Array(state.pools.count);
    const d = state.pools.indexOf('D');
    peak[d] = 1000;
    state.pools.amounts[d] = 1e-12; // exactly at 1e-12 of the peak
    rates[d] = -1;
    const a = state.pools.indexOf('A');
    rates[a] = -1;
    const beforeA = state.pools.get('A');

    const discarded = retireSpentPools(state, rates, peak);

    expect(discarded).toBe(1e-12);
    expect(state.pools.get('D')).toBe(0);
    // THE RATE HAS TO GO TOO. A retired pool holding a negative rate puts the
    // next zero crossing at zero ticks and stalls the resolution on a pool that
    // is already empty. That was a real failure before this line existed.
    expect(rates[d]).toBe(0);
    expect(state.pools.get('A')).toBe(beforeA);
    expect(rates[a]).toBe(-1);
  });

  it('tracks the peak, so a pool that grew is measured against what it reached', () => {
    const state = createToyPathway();
    const peak = new Float64Array(state.pools.count);
    const rates = new Float64Array(state.pools.count);
    const d = state.pools.indexOf('D');

    state.pools.amounts[d] = 100;
    retireSpentPools(state, rates, peak);
    expect(peak[d]).toBe(100);
    expect(state.pools.get('D')).toBe(100);

    state.pools.amounts[d] = 1e-9;
    expect(retireSpentPools(state, rates, peak)).toBe(0); // 1e-9 > 100 * 1e-12
    state.pools.amounts[d] = 1e-13;
    expect(retireSpentPools(state, rates, peak)).toBe(1e-13);
    expect(state.pools.get('D')).toBe(0);
  });
});

describe('resolving a window', () => {
  it('agrees with full replay over a window with no events', () => {
    const ticks = 6000;
    const truth = createToyPathway();
    for (let i = 0; i < ticks; i += 1) tick(truth);

    const got = createToyPathway();
    const outcome = resolveOffline(got, createSteadyDetector(got.pools.count), ticks);

    expect(outcome.resolved).toBe(true);
    expect(got.tickCount).toBe(ticks);
    for (let i = 0; i < truth.pools.count; i += 1) {
      const a = truth.pools.amounts[i] as number;
      const b = got.pools.amounts[i] as number;
      const scale = Math.max(Math.abs(a), Math.abs(b), 1e-6);
      expect(Math.abs(a - b) / scale, truth.pools.ids[i] as string).toBeLessThan(5e-3);
    }
  });

  it('never leaves a pool negative', () => {
    for (const ticks of [1200, 12000, 120000, 1_728_000]) {
      const state = createToyPathway();
      resolveOffline(state, createSteadyDetector(state.pools.count), ticks);
      for (let i = 0; i < state.pools.count; i += 1) {
        expect(
          state.pools.amounts[i] as number,
          `${state.pools.ids[i] as string} at ${ticks} ticks`,
        ).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('resolves the whole window or says how much is left, and never silently truncates', () => {
    const ticks = 240000;
    const state = createToyPathway();
    const outcome = resolveOffline(state, createSteadyDetector(state.pools.count), ticks);
    expect(outcome.ticksResolved + outcome.ticksRemaining).toBe(ticks);
    expect(state.tickCount).toBe(outcome.ticksResolved);
    // Time left over is never silent. It is either the budget running out or
    // the system failing to settle, and the caller can tell which.
    if (outcome.ticksRemaining > 0) {
      expect(outcome.budgetExhausted || !outcome.resolved).toBe(true);
    }
  });

  /**
   * THE FALLBACK SIGNAL, AND THE TOY PATHWAY PRODUCES ONE. Act 1 as V5 balanced
   * it always settles, which is what Part 3 says a well-tuned configuration
   * should do, so a configuration that does not settle has to come from
   * somewhere else if the reporting is to be tested at all. The synthetic
   * pathway obliges: `A` drains and the system stops being steady, and the
   * resolution says so rather than pretending.
   */
  it('reports failing to settle rather than resolving badly', () => {
    const state = createToyPathway();
    const outcome = resolveOffline(state, createSteadyDetector(state.pools.count), 240000);
    expect(outcome.resolved).toBe(false);
    expect(outcome.budgetExhausted).toBe(false);
    expect(outcome.ticksRemaining).toBeGreaterThan(0);
    expect(outcome.ticksResolved).toBeGreaterThan(0);
  });

  it('respects the event budget and reports exhausting it', () => {
    // A pathway with an unusually short horizon forces many events. The budget
    // is a bound rather than a target, so the assertion is that it is never
    // exceeded and that overrunning it is reported rather than swallowed.
    const state = createToyPathway({ vmax: { r3: 0.4 } });
    const outcome = resolveOffline(
      state,
      createSteadyDetector(state.pools.count),
      1_728_000,
    );
    expect(outcome.events.length).toBeLessThanOrEqual(EVENT_BUDGET);
    if (outcome.budgetExhausted) {
      expect(outcome.events.length).toBe(EVENT_BUDGET);
      expect(outcome.ticksRemaining).toBeGreaterThan(0);
    }
  });

  it('is deterministic', () => {
    const first = createToyPathway();
    const a = resolveOffline(first, createSteadyDetector(first.pools.count), 400000);
    const second = createToyPathway();
    const b = resolveOffline(second, createSteadyDetector(second.pools.count), 400000);
    expect(b.events.length).toBe(a.events.length);
    expect(b.ticksResolved).toBe(a.ticksResolved);
    for (let i = 0; i < a.events.length; i += 1) {
      expect(b.events[i]).toEqual(a.events[i]);
    }
  });

  it('carries the constants stage 3 measured', () => {
    expect(MAX_JUMP_DEPLETION_FRACTION).toBe(0.25);
    expect(MAX_JUMP_DEPLETION_FRACTION).toBeLessThan(1);
    expect(EVENT_BUDGET).toBe(64);
  });
});
