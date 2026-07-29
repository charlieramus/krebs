/**
 * The render bridge introduces no drift, and frame timing does not reach the
 * simulation.
 *
 * The second property is the one that matters. A real requestAnimationFrame
 * delivers wildly irregular deltas: a frame budget missed, a tab throttled, a
 * compositor stall. The fixed timestep in src/sim/loop.ts exists precisely so
 * that none of that changes what the simulation computes. That is asserted here
 * rather than assumed, because the failure mode is silent. A simulation that
 * drifts with frame rate still runs, still looks plausible, and produces a
 * different game on every machine.
 *
 * The clock is injected rather than read, so these tests drive minutes of game
 * time without waiting for any of it.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { MAX_CATCHUP_TICKS, TICK_MS } from '../../sim/constants';
import { hashState } from '../../sim/hash';
import { setShortfallLogging, tick } from '../../sim/tick';
import { createAct1 } from '../../content/act1/reactions';
import { createAct1Runtime, type Act1RuntimeOptions } from '../runtime';

beforeAll(() => {
  setShortfallLogging(false);
});

/**
 * A runtime driven by an explicit list of frame deltas.
 *
 * The scheduler is never used: `frame` is called directly with a clock reading
 * built by accumulating the deltas, which is exactly what requestAnimationFrame
 * would hand it. The first frame credits zero time by construction, so the list
 * is fed starting from the second.
 */
function drive(deltasMs: readonly number[], options: Act1RuntimeOptions = {}) {
  const runtime = createAct1Runtime(options);
  let nowMs = 0;
  runtime.frame(nowMs);
  for (const delta of deltasMs) {
    nowMs += delta;
    runtime.frame(nowMs);
  }
  return runtime;
}

describe('the render bridge introduces no drift', () => {
  it('produces the same pool amounts as calling tick directly the same number of times', () => {
    const ticks = 400;
    const runtime = drive(new Array<number>(ticks).fill(TICK_MS), {
      act1: { enabled: { ferment: true } },
    });

    const direct = createAct1({ enabled: { ferment: true } });
    for (let t = 0; t < ticks; t += 1) tick(direct);

    expect(runtime.state.tickCount).toBe(ticks);
    expect(Array.from(runtime.state.pools.amounts)).toEqual(Array.from(direct.pools.amounts));
    expect(hashState(runtime.state)).toBe(hashState(direct));
  });

  it('copies the live state into the snapshot rather than reporting its own accounting', () => {
    const runtime = drive(new Array<number>(200).fill(TICK_MS), {
      act1: { enabled: { ferment: true } },
    });

    expect(Array.from(runtime.snapshot.amounts)).toEqual(
      Array.from(runtime.state.pools.amounts),
    );
    expect(runtime.snapshot.tickCount).toBe(runtime.state.tickCount);
    expect(runtime.snapshot.elapsedMs).toBe(runtime.state.tickCount * TICK_MS);
  });

  it('meters once per tick, not once per frame', () => {
    // The same 200 ticks of game time delivered three ways: one tick per frame,
    // ten ticks per frame, and one frame carrying the lot. Metering per frame
    // instead of per tick would make these three disagree wildly, because the
    // meter reads scratch arrays the next tick overwrites.
    const perTick = drive(new Array<number>(200).fill(TICK_MS), {
      act1: { enabled: { ferment: true } },
    });
    const perTenTicks = drive(new Array<number>(20).fill(TICK_MS * 10), {
      act1: { enabled: { ferment: true } },
    });
    const oneFrame = drive([TICK_MS * 200], { act1: { enabled: { ferment: true } } });

    expect(perTenTicks.state.tickCount).toBe(200);
    expect(oneFrame.state.tickCount).toBe(200);

    for (const other of [perTenTicks, oneFrame]) {
      expect(other.snapshot.meter.atpProduced).toBeCloseTo(perTick.snapshot.meter.atpProduced, 12);
      expect(other.snapshot.meter.glucoseTakenUp).toBeCloseTo(
        perTick.snapshot.meter.glucoseTakenUp,
        12,
      );
      expect(other.snapshot.meter.lactateProduced).toBeCloseTo(
        perTick.snapshot.meter.lactateProduced,
        12,
      );
    }

    // And the ledger still reads the sourced figures, which is the check that
    // would fail loudest if metering frequency had drifted from tick frequency.
    expect(perTick.snapshot.atpPerGlucose).toBeCloseTo(4, 6);
    expect(oneFrame.snapshot.atpPerGlucose).toBeCloseTo(4, 6);
  });
});

describe('frame timing does not reach the simulation', () => {
  /**
   * Two frame sequences summing to exactly the same total: 400 regular 50ms
   * frames, and an irregular sequence of the kind a real browser delivers.
   *
   * The irregular deltas are integers and sum to exactly 20000, so the
   * accumulator arithmetic is exact in both cases and there is no boundary
   * ambiguity about whether a final tick runs. Every delta stays well below the
   * MAX_CATCHUP_TICKS ceiling, so neither sequence spills into the offline path,
   * which is asserted below rather than assumed.
   */
  const regular = new Array<number>(400).fill(TICK_MS);

  const irregular: number[] = [];
  {
    // A deterministic stutter pattern. No PRNG, because a test that depends on
    // a random sequence cannot be re-run against a failure.
    const pattern = [7, 3, 219, 16, 1, 84, 33, 9, 128, 4, 61, 2, 41, 12, 173, 5];
    let total = 0;
    let i = 0;
    while (total < 20000) {
      const step = Math.min(pattern[i % pattern.length] as number, 20000 - total);
      irregular.push(step);
      total += step;
      i += 1;
    }
  }

  it('the two sequences carry the same total elapsed time', () => {
    expect(regular.reduce((a, b) => a + b, 0)).toBe(20000);
    expect(irregular.reduce((a, b) => a + b, 0)).toBe(20000);
    expect(irregular.length).not.toBe(regular.length);
    expect(Math.max(...irregular)).toBeLessThan(MAX_CATCHUP_TICKS * TICK_MS);
  });

  it('produces an identical tick count, identical pools and an identical hash', () => {
    const smooth = drive(regular, { act1: { enabled: { ferment: true } } });
    const stuttering = drive(irregular, { act1: { enabled: { ferment: true } } });

    expect(stuttering.state.tickCount).toBe(smooth.state.tickCount);
    expect(stuttering.state.tickCount).toBe(400);
    expect(Array.from(stuttering.state.pools.amounts)).toEqual(
      Array.from(smooth.state.pools.amounts),
    );
    expect(hashState(stuttering.state)).toBe(hashState(smooth.state));

    // Frame count differs, which is the point: the display saw two different
    // worlds and the simulation saw one.
    expect(stuttering.snapshot.frameCount).not.toBe(smooth.snapshot.frameCount);
  });

  it('does not lose time to the offline path at these frame sizes', () => {
    const stuttering = drive(irregular, { act1: { enabled: { ferment: true } } });
    expect(stuttering.snapshot.pendingOfflineMs).toBe(0);
  });

  it('routes a backgrounded tab past the catch-up cap into pendingOfflineMs', () => {
    // The known hole from stage 1 step 3, asserted so that it is a documented
    // property rather than a surprise. Five minutes of real time arriving in one
    // frame runs MAX_CATCHUP_TICKS ticks and hands the rest to the offline path,
    // which nothing in V3 consumes.
    const fiveMinutes = 5 * 60 * 1000;
    const runtime = drive([fiveMinutes], { act1: { enabled: { ferment: true } } });

    expect(runtime.state.tickCount).toBe(MAX_CATCHUP_TICKS);
    expect(runtime.snapshot.pendingOfflineMs).toBe(fiveMinutes - MAX_CATCHUP_TICKS * TICK_MS);
  });
});

describe('the runtime does not write to simulation state from the display side', () => {
  it('credits zero elapsed time on the first frame of a run, however late it arrives', () => {
    const runtime = createAct1Runtime({ act1: { enabled: { ferment: true } } });
    runtime.frame(9_999_999);
    expect(runtime.state.tickCount).toBe(0);
    expect(runtime.snapshot.pendingOfflineMs).toBe(0);
  });

  it('leaves the interpolation fraction in [0, 1) and out of the state', () => {
    const runtime = createAct1Runtime({ act1: { enabled: { ferment: true } } });
    let nowMs = 0;
    // 17ms frames over a 50ms tick: the remainder cycles rather than resting.
    for (let f = 0; f < 60; f += 1) {
      nowMs += 17;
      runtime.frame(nowMs);
      expect(runtime.snapshot.interpolation).toBeGreaterThanOrEqual(0);
      expect(runtime.snapshot.interpolation).toBeLessThan(1);
    }
    expect(runtime.state.tickCount).toBe(Math.floor((60 * 17) / TICK_MS));
  });

  it('unsubscribes cleanly', () => {
    const runtime = createAct1Runtime();
    let calls = 0;
    const unsubscribe = runtime.subscribe(() => {
      calls += 1;
    });
    runtime.frame(0);
    runtime.frame(TICK_MS);
    unsubscribe();
    runtime.frame(TICK_MS * 2);
    expect(calls).toBe(2);
  });
});
