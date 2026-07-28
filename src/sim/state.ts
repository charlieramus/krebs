/**
 * The simulation state, and the scratch buffers the tick runs against.
 *
 * Not named in the stage spec, but the spec requires the flux scratch array to
 * be "allocated once at construction, not per tick", and this is what
 * construction means. Every per-tick working array lives here so that `tick`
 * allocates nothing at all.
 */

import { PoolRegistry } from './pools';
import type { Reaction } from './reactions';
import type { Prng } from './prng';

export interface Diagnostics {
  /**
   * Count of ticks in which each pool ran short and had its consumers scaled,
   * indexed by pool index. Counted once per pool per tick, not once per
   * scaling pass.
   *
   * docs/SIMULATION.md Part 2: frequent scaling on a pool means either the pool
   * is too small or the tick is too coarse, and both are balance bugs worth
   * surfacing.
   */
  readonly shortfallTicks: Int32Array;

  /** Ticks in which the scaling loop hit its pass cap. Non-zero is worth looking at. */
  scalingCapHits: number;

  /**
   * Elapsed real milliseconds that exceeded MAX_CATCHUP_TICKS and were not
   * simulated in the loop. docs/SIMULATION.md Part 3 owns this: it is the
   * offline path's input, not time to be silently dropped. Nothing consumes it
   * yet, because offline progress lands in a later log.
   */
  pendingOfflineMs: number;

  /** Last tick at which each pool's shortfall was logged. Throttling only. */
  readonly lastShortfallLogTick: Int32Array;
}

export interface SimulationState {
  readonly pools: PoolRegistry;
  /** Fixed order. Flux computation iterates this by index and never by key. */
  readonly reactions: readonly Reaction[];
  readonly prng: Prng;

  /**
   * Game time, as an integer count. docs/SIMULATION.md Part 5 forbids floating
   * point accumulation of game time. Conversion to milliseconds happens at the
   * boundary only.
   */
  tickCount: number;

  readonly diagnostics: Diagnostics;

  /** Per-reaction flux for the current tick, computed against the tick-start snapshot. */
  readonly fluxes: Float64Array;
  /** Per-reaction shortfall scale factor for the current tick, 1 when unconstrained. */
  readonly scales: Float64Array;
  /** Per-pool demand for the current tick, in pool units, not rate. */
  readonly demand: Float64Array;
  /** Per-pool available-over-demanded factor for the current scaling pass. */
  readonly poolFactors: Float64Array;
  /** Per-pool consumption and production totals for the current tick. */
  readonly consumed: Float64Array;
  readonly produced: Float64Array;
  /** Per-pool "already counted as short this tick" flag. */
  readonly shortfallSeen: Uint8Array;
}

export function createSimulation(
  pools: PoolRegistry,
  reactions: readonly Reaction[],
  prng: Prng,
): SimulationState {
  const poolCount = pools.count;
  const reactionCount = reactions.length;

  return {
    pools,
    reactions: Object.freeze(reactions.slice()),
    prng,
    tickCount: 0,
    diagnostics: {
      shortfallTicks: new Int32Array(poolCount),
      scalingCapHits: 0,
      pendingOfflineMs: 0,
      lastShortfallLogTick: new Int32Array(poolCount).fill(-1000),
    },
    fluxes: new Float64Array(reactionCount),
    scales: new Float64Array(reactionCount),
    demand: new Float64Array(poolCount),
    poolFactors: new Float64Array(poolCount),
    consumed: new Float64Array(poolCount),
    produced: new Float64Array(poolCount),
    shortfallSeen: new Uint8Array(poolCount),
  };
}
