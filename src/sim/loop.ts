/**
 * The fixed-timestep accumulator. docs/SIMULATION.md Part 1.
 *
 *     accumulator += realElapsedMs
 *     while (accumulator >= TICK_MS) { tick(state); accumulator -= TICK_MS }
 *     render(state, accumulator / TICK_MS)
 *
 * This is the boundary between wall-clock time and game time. Real elapsed
 * milliseconds are an argument rather than something read here, because
 * docs/SIMULATION.md Part 5 puts Date.now outside simulation code entirely and
 * the ESLint config in this directory enforces it. Whatever drives the loop,
 * requestAnimationFrame in V3 or a for-loop in the harness today, reads the
 * clock and passes the delta in.
 *
 * The fractional remainder is returned for render interpolation only. It never
 * touches simulation state.
 */

import { MAX_CATCHUP_TICKS, TICK_MS } from './constants';
import type { SimulationState } from './state';
import { tick } from './tick';

export interface Loop {
  /** Unconsumed real milliseconds, always less than TICK_MS after `advance`. */
  readonly accumulatorMs: number;
  /**
   * Feed in real elapsed milliseconds, run whole ticks, return the leftover
   * fraction of a tick in [0, 1) for the renderer to interpolate with.
   */
  advance(elapsedMs: number): number;
  /** Ticks run by the most recent `advance`. Diagnostics and tests. */
  readonly lastTickCount: number;
}

export function createLoop(state: SimulationState): Loop {
  let accumulatorMs = 0;
  let lastTickCount = 0;

  return {
    get accumulatorMs() {
      return accumulatorMs;
    },
    get lastTickCount() {
      return lastTickCount;
    },

    advance(elapsedMs: number): number {
      // A negative delta means the system clock moved backwards. Credit zero,
      // do not error. docs/SIMULATION.md Part 3, clock tampering.
      if (!(elapsedMs > 0)) elapsedMs = 0;

      accumulatorMs += elapsedMs;
      let ticksRun = 0;

      while (accumulatorMs >= TICK_MS) {
        if (ticksRun >= MAX_CATCHUP_TICKS) {
          // Spiral of death guard, docs/SIMULATION.md Part 1. The excess is NOT
          // dropped. Whole ticks' worth of it is handed to the offline path,
          // which docs/SIMULATION.md Part 3 owns and a later log implements.
          // The sub-tick remainder stays in the accumulator, where it would
          // have been anyway.
          const excessMs = accumulatorMs - (accumulatorMs % TICK_MS);
          state.diagnostics.pendingOfflineMs += excessMs;
          accumulatorMs -= excessMs;
          break;
        }
        tick(state);
        accumulatorMs -= TICK_MS;
        ticksRun += 1;
      }

      lastTickCount = ticksRun;
      return accumulatorMs / TICK_MS;
    },
  };
}

/** Game time in milliseconds. The boundary conversion, and the only one. Saves persist this, not tick counts. */
export function elapsedMs(state: SimulationState): number {
  return state.tickCount * TICK_MS;
}
