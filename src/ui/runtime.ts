/**
 * The bridge between wall-clock time and the simulation. Everything that drives
 * act 1 lives here, outside React.
 *
 * WHY OUTSIDE REACT. There are three clocks in this program and none of them is
 * React's. The simulation runs at a fixed 20Hz over a mutable Float64Array. The
 * display runs at whatever rate requestAnimationFrame delivers, typically 60Hz
 * and never guaranteed. React re-renders on discrete events: an unlock bought, a
 * stall detected, a coach mark opened. Rendering the simulation through React
 * state would fuse the first two clocks onto the third and reconcile a tree
 * sixty times a second to move eight numbers. Subscribers read a preallocated
 * snapshot and write to DOM nodes through refs instead.
 *
 * ON THE CLOCK. `performance.now` rather than `Date.now`, because it is
 * monotonic and immune to the system clock being adjusted underneath a running
 * game. Reading a clock at all is forbidden in src/sim/ and src/content/ by
 * docs/SIMULATION.md Part 5, enforced by the determinism rules in
 * eslint.config.js. Those rules carve out src/ui/ explicitly, and that carve-out
 * is a decision rather than an oversight: this file IS the loop boundary
 * docs/SIMULATION.md describes, and something has to read the clock there. What
 * the carve-out does not license is writing to simulation state from here. The
 * runtime hands real elapsed milliseconds to `loop.advance` and reads what comes
 * back. It never touches a pool.
 *
 * The clock and the frame scheduler are both injectable, so the tests drive real
 * time without waiting for it.
 */

import { TICK_MS, TICK_SECONDS } from '../sim/constants';
import { createLoop, elapsedMs, type Loop } from '../sim/loop';
import type { SimulationState } from '../sim/state';
import {
  atpPerCompletedGlucose,
  createAct1Meter,
  createAct1MeterProbes,
  netAtpPerCompletedGlucose,
  recordAct1Tick,
  type Act1Meter,
  type Act1MeterProbes,
} from '../content/act1/meter';
import { ACT1_POOL_IDS, type Act1PoolId } from '../content/act1/pools';
import {
  ACT1_REACTION_IDS,
  createAct1,
  type Act1Options,
  type Act1ReactionId,
} from '../content/act1/reactions';

/**
 * What the display reads. One object, allocated once, mutated in place every
 * frame, handed to every subscriber.
 *
 * The typed arrays are the same arrays on every frame. A subscriber that wants
 * to keep a value across frames has to copy it out, and this is deliberate: the
 * alternative is allocating eleven arrays sixty times a second and asking the
 * garbage collector to absorb it, which shows up as exactly the periodic hitch
 * that makes a flowing-dash animation stutter.
 */
export interface Act1Snapshot {
  /** Pool amounts, ACT1_POOL_IDS order. */
  readonly amounts: Float64Array;
  /** Intended flux per reaction, ACT1_REACTION_IDS order, units per game-second. */
  readonly flux: Float64Array;
  /**
   * Flux the tick actually applied, which is `flux * scale`. The two differ
   * exactly when a substrate ran short, so the display must use this one: a
   * dash animation driven by intended flux keeps flowing through a shortfall
   * that has already stopped the reaction.
   */
  readonly appliedFlux: Float64Array;
  /** Ticks in which each pool ran short. Diagnostics, ACT1_POOL_IDS order. */
  readonly shortfallTicks: Int32Array;

  /** The live meter. Same object every frame, filled in place by recordAct1Tick. */
  readonly meter: Act1Meter;
  /** Gross ATP per glucose that finished the pathway. The sourced figure is 4. */
  atpPerGlucose: number;
  /** Net of the preparatory spend. The sourced figure is 2. */
  netAtpPerGlucose: number;

  tickCount: number;
  /** Game time. `elapsedMs(state)`, derived from the tick count, never accumulated. */
  elapsedMs: number;
  /**
   * Sub-tick remainder in [0, 1), from `loop.advance`. docs/SIMULATION.md Part 1
   * passes this to the renderer so motion is smooth at frame rate over a 20Hz
   * simulation. It must never reach simulation state.
   */
  interpolation: number;

  /**
   * Game time that exceeded MAX_CATCHUP_TICKS and was routed to the offline
   * path. A KNOWN HOLE, LEFT OPEN AND MADE VISIBLE.
   *
   * A backgrounded tab stops receiving animation frames. When it returns, the
   * elapsed delta is far larger than the 10 game-seconds the catch-up cap
   * allows, so the excess lands in `diagnostics.pendingOfflineMs` and nothing in
   * V3 consumes it. Game time is therefore lost while the tab is hidden. V5 owns
   * the offline path and will consume this field. Until then it is on the
   * snapshot and printed in the dev readout so the hole reads as a hole during
   * the stage 7 play session rather than as a bug in the simulation.
   */
  pendingOfflineMs: number;

  /** Ticks run by the most recent frame. Zero on most frames at 60Hz over 20Hz. */
  lastTickCount: number;
  /** Frames driven since construction. Display-side only, never simulation state. */
  frameCount: number;
}

export type Act1SnapshotListener = (snapshot: Act1Snapshot) => void;

export interface Act1RuntimeOptions {
  /** Passed through to createAct1. Enabled flags, Vmax overrides, initial amounts. */
  readonly act1?: Partial<Act1Options>;
  /** Monotonic milliseconds. Defaults to performance.now. */
  readonly clock?: () => number;
  /** Frame scheduler. Defaults to requestAnimationFrame. */
  readonly schedule?: (callback: () => void) => number;
  /** Frame canceller. Defaults to cancelAnimationFrame. */
  readonly cancel?: (handle: number) => void;
}

export interface Act1Runtime {
  /** The one snapshot object. Read it, do not keep references to its arrays. */
  readonly snapshot: Act1Snapshot;
  /** Escape hatch for tests and the drain measurement. Not for the display. */
  readonly state: SimulationState;
  readonly loop: Loop;
  /** Begin scheduling frames. Idempotent, so a StrictMode double-mount is harmless. */
  start(): void;
  /** Stop scheduling frames. The next start resumes without crediting the gap. */
  stop(): void;
  /**
   * Drive exactly one frame at an explicit clock reading. What the scheduler
   * calls, and what tests and headless measurements call instead of scheduling.
   */
  frame(nowMs: number): void;
  subscribe(listener: Act1SnapshotListener): () => void;
}

export function createAct1Runtime(options: Act1RuntimeOptions = {}): Act1Runtime {
  const clock = options.clock ?? (() => performance.now());
  const schedule =
    options.schedule ?? ((callback: () => void) => requestAnimationFrame(callback));
  const cancel = options.cancel ?? ((handle: number) => cancelAnimationFrame(handle));

  const state = createAct1(options.act1 ?? {});
  const probes: Act1MeterProbes = createAct1MeterProbes(state);
  const meter = createAct1Meter();

  const poolCount = state.pools.count;
  const reactionCount = state.reactions.length;

  /**
   * The g3p level at construction, for the completed-glucose correction in
   * meter.ts. Trioses sitting in the pool are glucose that has been paid for and
   * has not paid out, and subtracting them is the difference between reporting
   * the sourced yield of 4 and reporting a stall as a collapse in yield.
   */
  const g3pIndex = state.pools.indexOf('g3p');
  const g3pInitial = state.pools.amounts[g3pIndex] as number;

  /**
   * THE ONCE-PER-TICK PROBLEM, AND HOW IT IS SOLVED.
   *
   * `recordAct1Tick` reads `state.fluxes` and `state.scales`, which are scratch
   * arrays the next tick overwrites. One frame can run zero ticks, one tick, or
   * two hundred. Metering once per frame is therefore wrong in both directions:
   * a frame that ran three ticks and meters once counts the third tick three
   * times over and the first two not at all, while a frame that ran zero ticks
   * and meters once counts the previous tick a second time. Neither error is
   * visible in any existing test, because the meter is not part of the hashed
   * state, so a slow drift in ATP-per-glucose would look like tuning rather than
   * like a bug.
   *
   * `loop.lastTickCount` reports how many ticks ran but not what they did, and
   * the two overwritten flux snapshots cannot be recovered after the fact. Only
   * the loop is in a position to see them, so V3 stage 1 gave the loop an
   * optional read-only tick observer and the meter rides on it. Metering is
   * exactly as frequent as ticking by construction rather than by the driver
   * remembering to match it.
   */
  const loop = createLoop(state, (ticked) => {
    recordAct1Tick(ticked, probes, meter);
  });

  const snapshot: Act1Snapshot = {
    amounts: new Float64Array(poolCount),
    flux: new Float64Array(reactionCount),
    appliedFlux: new Float64Array(reactionCount),
    shortfallTicks: new Int32Array(poolCount),
    meter,
    atpPerGlucose: 0,
    netAtpPerGlucose: 0,
    tickCount: 0,
    elapsedMs: 0,
    interpolation: 0,
    pendingOfflineMs: 0,
    lastTickCount: 0,
    frameCount: 0,
  };

  const listeners = new Set<Act1SnapshotListener>();

  /** Filled in place. Nothing here allocates. */
  function fill(interpolation: number): void {
    snapshot.amounts.set(state.pools.amounts);
    snapshot.shortfallTicks.set(state.diagnostics.shortfallTicks);
    for (let r = 0; r < reactionCount; r += 1) {
      const flux = state.fluxes[r] as number;
      snapshot.flux[r] = flux;
      snapshot.appliedFlux[r] = flux * (state.scales[r] as number);
    }

    const g3pDelta = (state.pools.amounts[g3pIndex] as number) - g3pInitial;
    snapshot.atpPerGlucose = atpPerCompletedGlucose(meter, g3pDelta);
    snapshot.netAtpPerGlucose = netAtpPerCompletedGlucose(meter, g3pDelta);

    snapshot.tickCount = state.tickCount;
    snapshot.elapsedMs = elapsedMs(state);
    snapshot.interpolation = interpolation;
    snapshot.pendingOfflineMs = state.diagnostics.pendingOfflineMs;
    snapshot.lastTickCount = loop.lastTickCount;
    snapshot.frameCount += 1;
  }

  function notify(): void {
    for (const listener of listeners) listener(snapshot);
  }

  /**
   * Clock reading at the previous frame. Null means the next frame is the first
   * of a run and credits zero elapsed time, which is what makes `stop` then
   * `start` resume rather than dumping the whole paused interval into the
   * accumulator.
   */
  let lastNowMs: number | null = null;
  let handle: number | null = null;
  let running = false;

  function frame(nowMs: number): void {
    const deltaMs = lastNowMs === null ? 0 : nowMs - lastNowMs;
    lastNowMs = nowMs;
    fill(loop.advance(deltaMs));
    notify();
  }

  function pump(): void {
    if (!running) return;
    frame(clock());
    handle = schedule(pump);
  }

  return {
    snapshot,
    state,
    loop,

    start(): void {
      if (running) return;
      running = true;
      lastNowMs = null;
      handle = schedule(pump);
    },

    stop(): void {
      if (!running) return;
      running = false;
      if (handle !== null) cancel(handle);
      handle = null;
    },

    frame,

    subscribe(listener: Act1SnapshotListener): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** Pool index by id, for a display that knows what it is looking at. */
export function poolIndex(id: Act1PoolId): number {
  return ACT1_POOL_IDS.indexOf(id);
}

/** Reaction index by id, same reason. */
export function reactionIndex(id: Act1ReactionId): number {
  return ACT1_REACTION_IDS.indexOf(id);
}

/** Game seconds from the snapshot's game milliseconds. The one conversion. */
export function gameSeconds(snapshot: Act1Snapshot): number {
  return snapshot.elapsedMs / 1000;
}

export { TICK_MS, TICK_SECONDS };
