/**
 * Steady-state detection. docs/SIMULATION.md Part 3 steps 1 and 2.
 *
 * The first half of the offline path, and the half that decides whether the
 * second half is allowed to run at all. It answers one question: has this
 * system reached a state whose future can be computed by arithmetic instead of
 * by simulation.
 *
 * IN THE KERNEL, NOT IN CONTENT AND NOT IN THE SAVE LAYER. Nothing here knows
 * what a pool means. It reads a Float64Array of amounts and reports a number.
 * Act 2 will need it unchanged, and the day it needs it changed is the day it
 * is a property of act 2 rather than of the simulation, which is a different
 * decision from the one made here.
 *
 * ---------------------------------------------------------------------------
 * WHAT IS MEASURED, AND WHY IT IS NOT WHAT THE SPECIFICATION FIRST SAID
 * ---------------------------------------------------------------------------
 *
 * docs/SIMULATION.md Part 3 step 2 used to ask for every pool's derivative,
 * as a fraction of pool size, below STEADY_EPSILON. UPDATELOGV8.md stage 1
 * measured that criterion and it fails twice over.
 *
 * It is unsatisfiable. A finite substrate pool draining and a terminal product
 * pool accumulating both change linearly forever, so their fractional
 * derivative decays as one over elapsed time and never reaches a floor. In act
 * 1 that is `glucose_env` and `lactate`, and no epsilon below 1e-3 is ever
 * reached by either.
 *
 * And it contradicts step 4 of the same algorithm, which advances the state by
 * rate multiplied by duration. A pool whose amount has stopped changing has no
 * output to accumulate. The pools the jump exists to advance are exactly the
 * pools that criterion forbids from ever being steady.
 *
 * So what is tested is the second difference: the per-tick change in each pool
 * must itself have stopped changing. That is what makes the trajectory linear,
 * which is what makes the jump exact rather than approximate. Part 3 step 2 now
 * says so, corrected in the same stage that measured it.
 *
 * The normalisation is unchanged and is still the pool's own size, because a
 * curvature of a thousandth of a unit means something different in a pool of
 * 80000 than in a pool of 3.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS FILE MAY NOT DO
 * ---------------------------------------------------------------------------
 *
 * No allocation after construction. Every buffer is sized once in
 * `createSteadyDetector`, the same way src/sim/state.ts sizes the tick scratch
 * arrays, and `observeSteady` writes into them and returns a boolean.
 *
 * No writing to simulation state. The detector reads `amounts` and touches
 * nothing else. Not a pool, not the tick count, not the PRNG. A detector that
 * perturbed the thing it was measuring would be undetectable by every existing
 * test in the project, because none of them attach one, so
 * `__tests__/steady.test.ts` asserts hash identity with the detector attached
 * and without it. That is the cheapest possible guard against the whole
 * category.
 *
 * No Math.pow, Math.exp, Math.log, Math.random or Date. The ESLint guard
 * already covers src/sim/**. Math.abs and Math.max are exactly specified under
 * IEEE754 and are fine.
 *
 * No iteration over object keys. Indexed loops over typed arrays only.
 */

import { STEADY_EPSILON, STEADY_WINDOW, TICK_SECONDS } from './constants';
import type { SimulationState } from './state';
import { tick } from './tick';

export interface SteadyDetector {
  /** Pool amounts as of the previous observation. Sized once. */
  readonly previousAmount: Float64Array;
  /** Per-tick change as of the previous observation. Sized once. */
  readonly previousDelta: Float64Array;
  /**
   * Observations since the last reset. The first one has no previous delta to
   * difference against, so it can only record one and must not judge.
   */
  samples: number;
  /** Consecutive observations under STEADY_EPSILON. */
  run: number;
  /** The reading from the most recent observation. Diagnostics and reports. */
  worst: number;
  /** Which pool carried that reading, or -1 before the first judgement. */
  worstPool: number;
  /** Whether `run` has reached STEADY_WINDOW. */
  settled: boolean;
}

/**
 * A run counter rather than a ring buffer.
 *
 * The spec asks for a rolling window of STEADY_WINDOW consecutive ticks, and a
 * counter is that window: it holds exactly the fact the test needs, which is
 * how many consecutive observations have been under threshold, and it holds it
 * in one number rather than in 250 of them. A ring buffer would store the
 * readings themselves, which nothing asks for, and would have to be sized
 * against a constant that is now 250 rather than 20. Same semantics, one word
 * of state, and no buffer to size wrong.
 */
export function createSteadyDetector(poolCount: number): SteadyDetector {
  return {
    previousAmount: new Float64Array(poolCount),
    previousDelta: new Float64Array(poolCount),
    samples: 0,
    run: 0,
    worst: 0,
    worstPool: -1,
    settled: false,
  };
}

/**
 * Re-arm against the state as it stands now.
 *
 * Called before a bounded replay begins and again after an event is applied,
 * which is docs/SIMULATION.md Part 3 step 5 returning to step 1. An event
 * invalidates the steady state by definition, so carrying a run count across
 * one would be carrying evidence about a system that no longer exists.
 */
export function resetSteadyDetector(detector: SteadyDetector, state: SimulationState): void {
  const amounts = state.pools.amounts;
  for (let i = 0; i < amounts.length; i += 1) {
    detector.previousAmount[i] = amounts[i] as number;
    detector.previousDelta[i] = 0;
  }
  detector.samples = 0;
  detector.run = 0;
  detector.worst = 0;
  detector.worstPool = -1;
  detector.settled = false;
}

/**
 * Observe one tick. Call immediately after `tick`, before the next one.
 *
 * Returns whether the system is settled. Allocates nothing.
 *
 * THE ZERO CASES, BOTH OF THEM. A curvature of exactly zero is steady whatever
 * the pool holds, including a pool of zero, which is the common case for an
 * intermediate that has not started moving yet. A non-zero curvature in a pool
 * of zero is not steady at any epsilon, because there is no size to be small
 * relative to, and a pool that was moving and is now pinned at zero is a system
 * that just hit a boundary rather than one that settled.
 */
export function observeSteady(detector: SteadyDetector, state: SimulationState): boolean {
  const amounts = state.pools.amounts;
  const count = amounts.length;
  const previousAmount = detector.previousAmount;
  const previousDelta = detector.previousDelta;

  if (detector.samples === 0) {
    for (let i = 0; i < count; i += 1) {
      previousDelta[i] = (amounts[i] as number) - (previousAmount[i] as number);
      previousAmount[i] = amounts[i] as number;
    }
    detector.samples = 1;
    detector.run = 0;
    detector.settled = false;
    return false;
  }

  let worst = 0;
  let worstPool = -1;

  for (let i = 0; i < count; i += 1) {
    const now = amounts[i] as number;
    const previous = previousAmount[i] as number;
    const delta = now - previous;
    const curvature = Math.abs(delta - (previousDelta[i] as number));

    previousDelta[i] = delta;
    previousAmount[i] = now;

    if (curvature === 0) continue;
    const scale = Math.max(Math.abs(now), Math.abs(previous));
    const reading = scale === 0 ? Number.POSITIVE_INFINITY : curvature / scale;
    if (reading > worst) {
      worst = reading;
      worstPool = i;
    }
  }

  detector.samples += 1;
  detector.worst = worst;
  detector.worstPool = worstPool;

  if (worst < STEADY_EPSILON) detector.run += 1;
  else detector.run = 0;

  detector.settled = detector.run >= STEADY_WINDOW;
  return detector.settled;
}

export interface SettleResult {
  /** Whether steady state was reached inside the budget. */
  readonly settled: boolean;
  /** Ticks actually run. At most `maxTicks`. */
  readonly ticksRun: number;
  /** The final reading, and which pool carried it. Useful when `settled` is false. */
  readonly worst: number;
  readonly worstPool: number;
}

/**
 * Bounded full-fidelity replay. docs/SIMULATION.md Part 3 step 1.
 *
 * Run real ticks until the detector says settled or the budget is spent,
 * whichever comes first. THE BUDGET IS NOT A SAFETY VALVE. It is the property
 * that makes the whole approach affordable: the cost of resolving an absence is
 * bounded by the number of events in it rather than by its length, and that is
 * only true because each settle costs at most SETTLE_MAX_TICKS. Raising it to
 * make something pass trades the one guarantee the algorithm offers for a
 * result that was already wrong.
 *
 * `onTick` mirrors `TickObserver` in loop.ts and exists for the same reason:
 * per-tick scratch arrays are only readable per tick, so a caller that needs
 * the meter advanced during replay has to be handed each tick as it happens.
 * It must not write to simulation state.
 */
export function replayUntilSteady(
  state: SimulationState,
  detector: SteadyDetector,
  maxTicks: number,
  onTick?: (state: SimulationState, seconds: number) => void,
): SettleResult {
  resetSteadyDetector(detector, state);

  let ticksRun = 0;
  let settled = false;

  while (ticksRun < maxTicks) {
    tick(state);
    ticksRun += 1;
    if (onTick !== undefined) onTick(state, TICK_SECONDS);
    if (observeSteady(detector, state)) {
      settled = true;
      break;
    }
  }

  return { settled, ticksRun, worst: detector.worst, worstPool: detector.worstPool };
}

/** The threshold and the window, re-exported so a caller reporting a settle does not have to reach past this file. */
export { STEADY_EPSILON, STEADY_WINDOW };
