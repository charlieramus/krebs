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
import { michaelisMenten, type Kinetics } from '../sim/reactions';
import type { SimulationState } from '../sim/state';
import {
  FERMENT_ATP_THRESHOLD,
  UPTAKE_ATP_THRESHOLDS,
  UPTAKE_VMAX_STEPS,
  ZERO_FLUX_THRESHOLD,
} from './tuning';
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
import {
  ACT1_NO_CARRIED_COUNTERS,
  ACT1_UNLOCK_FERMENT,
  act1UptakeUnlockId,
  captureAct1,
  restoreAct1,
  type Act1CarriedCounters,
} from '../content/act1/save';
import { createAutosave, type Autosave, type AutosaveRecord, type SaveReason } from '../save/autosave';
import { serializeReadable } from '../save/codec';
import { currentBuildId, epochNow } from '../save/meta';
import { parseAndMigrate } from '../save/migrations';
import { computeOfflineDelta } from '../save/offline';
import type { SaveSettingsV1, SaveV1 } from '../save/schema';
import {
  createSaveStore,
  type NonDurableReason,
  type SaveStore,
  type WriteOutcome,
} from '../save/storage';

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

  /**
   * Units per game-second produced into each pool, summed across every
   * reaction that makes it. ACT1_POOL_IDS order.
   *
   * DERIVED FROM THE REACTION TABLE, not written down. "ATP per second" is
   * `production[atp]`, which is the payoff phase's coefficient of 2 read out of
   * `src/content/act1/reactions.ts` rather than typed into the display. A
   * stoichiometry change moves the headline figure, which is the same posture
   * `meter.ts` takes and for the same reason.
   */
  readonly production: Float64Array;
  /**
   * Units per game-second, production minus consumption, per pool. Signed.
   *
   * This is the flux DESIGN.md puts in the large type with the stock as a
   * subscript. A pool at zero net rate is at steady state, which is a different
   * statement from a pool at zero.
   */
  readonly netRate: Float64Array;

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

  /** Whether lactate dehydrogenase has been bought. */
  fermentUnlocked: boolean;
  /** Index into UPTAKE_VMAX_STEPS. 0 is the shipped default and is not bought. */
  uptakeStep: number;

  /**
   * The pathway is walled: the payoff phase has stopped and it is not because
   * there is nothing to eat.
   *
   * DERIVED, NOT FLAGGED. Nothing in the simulation knows what a stall is, and
   * it must not: a stall is a reading of simulation state, not a state the
   * simulation is in. The three conditions are the ones V2 stage 5 found
   * separate the walled failure from the starved one, and they are checked
   * against the flux the tick applied rather than the flux it intended.
   */
  walled: boolean;
}

export type Act1SnapshotListener = (snapshot: Act1Snapshot) => void;

/**
 * Applied flux below which a reaction counts as stopped for the purpose of
 * detecting a stall.
 *
 * Deliberately the same number the pathway arrows use to decide whether to draw
 * themselves as moving. If the stall detector and the arrows disagreed, the
 * coach mark could open while the arrows still looked alive, or the arrows could
 * go inert with nothing explaining why. One threshold, one reading.
 */
const STOPPED_FLUX = ZERO_FLUX_THRESHOLD;

/**
 * NAD+ remaining below which the carrier counts as exhausted.
 *
 * A fraction of a single unit against a nicotinamide total of 30. Not zero,
 * because the pool approaches zero asymptotically and never quite arrives, and
 * a detector that waits for exactly zero waits forever.
 */
const WALLED_NAD = 0.05;

/**
 * Persistence, added by UPDATELOGV4.md stage 5.
 *
 * Everything injectable, and `enabled: false` turns the whole thing off. The
 * drain measurement and most of V3's tests want a runtime that does not read or
 * write a save slot, and a persistence layer that cannot be switched off makes
 * every one of them stateful.
 */
export interface Act1PersistenceOptions {
  /** Defaults to `createSaveStore()`, which probes localStorage and falls back to memory. */
  readonly store?: SaveStore;
  /** Epoch milliseconds. Defaults to `epochNow`. The only wall clock in the runtime. */
  readonly epochClock?: () => number;
  /** Default true. False means no load, no autosave and no writes at all. */
  readonly enabled?: boolean;
  readonly autosaveIntervalMs?: number;
  readonly startTimer?: (callback: () => void, ms: number) => number;
  readonly stopTimer?: (handle: number) => void;
  readonly listen?: (event: string, handler: () => void) => () => void;
}

/**
 * What happened when this session started. Read once by the interface.
 *
 * `kind` is the store's load outcome, plus `disabled` for a runtime built with
 * persistence off. The interface branches on it: `recoverable` offers the
 * backup, `future` refuses and says why, `unreadable` says both slots failed,
 * `new-game` says nothing at all.
 */
export interface Act1Session {
  readonly kind: 'loaded' | 'new-game' | 'recoverable' | 'future' | 'unreadable' | 'disabled';
  /**
   * Real milliseconds between the last save and this load, capped at
   * MAX_OFFLINE_HOURS. ACCUMULATED AND NOT CREDITED: V4 simulates none of it.
   */
  readonly awayMs: number;
  readonly offlineCapped: boolean;
  readonly clockWentBackwards: boolean;
  /** Sub-tick game time dropped by the tick reconstruction. Non-zero only after a rate change. */
  readonly discardedMs: number;
  readonly missingPools: readonly string[];
  readonly unknownUnlocks: readonly string[];
  /** False when writes are going to memory and will not survive the tab. */
  readonly durable: boolean;
  readonly nonDurableReason: NonDurableReason | null;
  /** Why the active slot failed, when it did. */
  readonly reason: string | null;
  /** The version found, when the save came from a newer build. */
  readonly futureVersion: number | null;
}

export type ImportOutcome =
  | { readonly kind: 'ok' }
  | { readonly kind: 'corrupt'; readonly reason: string }
  | { readonly kind: 'future'; readonly version: number }
  | { readonly kind: 'failed'; readonly reason: string };

export interface Act1RuntimeOptions {
  /** Passed through to createAct1. Enabled flags, Vmax overrides, initial amounts. */
  readonly act1?: Partial<Act1Options>;
  /** Monotonic milliseconds. Defaults to performance.now. */
  readonly clock?: () => number;
  /** Frame scheduler. Defaults to requestAnimationFrame. */
  readonly schedule?: (callback: () => void) => number;
  /** Frame canceller. Defaults to cancelAnimationFrame. */
  readonly cancel?: (handle: number) => void;
  readonly persistence?: Act1PersistenceOptions;
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

  /**
   * Buy lactate dehydrogenase. Idempotent, and refuses if the cumulative meter
   * has not reached the threshold.
   *
   * NOTHING IS SUBTRACTED FROM THE ATP POOL. The adenylate pool is fixed, closed
   * and conserved, so taking ATP out of it to pay for this would break the
   * conservation test on the tick it happened. That is the true reason and also
   * the more honest statement about a cell: a cell does not save up ATP, it
   * produces it at a rate. Do not "fix" this into a purchase.
   */
  buyFerment(): boolean;
  /** Buy the next uptake capacity step, under the same rules. */
  buyUptakeStep(): boolean;
  /** Whether the meter has reached each threshold. Display only. */
  canBuyFerment(): boolean;
  canBuyUptakeStep(): boolean;

  /* ===== Persistence, UPDATELOGV4.md stage 5 ===== */

  /** What happened when this session started. Fixed at construction. */
  readonly session: Act1Session;
  /** Unlock ids in purchase order. The source of truth the save carries. */
  readonly unlocked: readonly string[];
  /** Build the save this instant. Pure with respect to the simulation. */
  capture(): SaveV1;
  /** Write now. The interface never has to call this; autosave does. */
  save(reason?: SaveReason): WriteOutcome;
  /** The most recent write, for a "last saved" readout. */
  readonly lastSave: AutosaveRecord | null;
  /** Worst write cost seen this session, in milliseconds. */
  readonly worstSaveMs: number;
  /** Readable JSON, for export to a file. docs/SAVE_SCHEMA.md Part 4. */
  exportSave(): string;
  /**
   * Validate an imported file and, only if it is good, write it to the active
   * slot. An import that fails must not touch the existing save, which is why
   * nothing is written until after the full deserialize and migration chain has
   * returned ok.
   */
  importSave(text: string): ImportOutcome;
  /** Accept the backup after a failed parse. The caller reloads the page. */
  acceptRecovery(): WriteOutcome;
}

export function createAct1Runtime(options: Act1RuntimeOptions = {}): Act1Runtime {
  const clock = options.clock ?? (() => performance.now());
  const schedule =
    options.schedule ?? ((callback: () => void) => requestAnimationFrame(callback));
  const cancel = options.cancel ?? ((handle: number) => cancelAnimationFrame(handle));

  /* =========================================================================
     PERSISTENCE, FIRST, BECAUSE IT DECIDES WHAT THE SIMULATION IS BUILT FROM.
     ========================================================================= */

  const persistence = options.persistence ?? {};
  const persistenceEnabled = persistence.enabled ?? true;
  const epochClock = persistence.epochClock ?? epochNow;
  const store: SaveStore | null = persistenceEnabled
    ? (persistence.store ?? createSaveStore())
    : null;

  const loaded = store === null ? null : store.load();

  /**
   * The save this session restored from, or null for a new game.
   *
   * `recoverable`, `future` and `unreadable` all start a NEW GAME in memory and
   * report the outcome. That is deliberate on all three counts. A recoverable
   * save is an offer the player has not accepted yet, and silently loading the
   * backup would make the offer a lie. A future save must not be interpreted at
   * all. And an unreadable pair is exactly the case where the corrupt bytes have
   * to stay on disk untouched while the player decides what to do.
   */
  const restoredSave: SaveV1 | null = loaded?.kind === 'loaded' ? loaded.save : null;
  const restored = restoredSave === null ? null : restoreAct1(restoredSave);

  if (restored !== null && restored.kind !== 'ok') {
    // The codec validated the shape and the content mapping still refused it,
    // which means an unknown pool id. Treated as a corrupt load rather than
    // thrown, because a save that fails here must not take the game down with it.
    console.warn(`krebs: save restored no further than the codec, ${restored.reason}`);
  }

  const restoredOk = restored?.kind === 'ok' ? restored.restored : null;

  const state = restoredOk === null ? createAct1(options.act1 ?? {}) : restoredOk.state;
  const probes: Act1MeterProbes = createAct1MeterProbes(state);
  const meter = restoredOk === null ? createAct1Meter() : restoredOk.meter;

  /** Unlock ids in purchase order. Persisted as `progression.unlocked`. */
  const unlocked: string[] = restoredOk === null ? [] : [...restoredOk.unlocked];
  /**
   * UI settings, carried through unchanged.
   *
   * Empty in every save this build writes, because V3 shipped no persisted
   * setting: reduced motion is read from the OS media query rather than stored.
   * It is read from the save and written back rather than dropped, so a build
   * that adds one and a build that does not can share a file without either of
   * them deleting the other's work.
   */
  const settings: SaveSettingsV1 = restoredOk === null ? {} : restoredOk.settings;
  const carried: Act1CarriedCounters = restoredOk?.carried ?? ACT1_NO_CARRIED_COUNTERS;
  const createdAt = restoredSave?.meta.createdAt ?? epochClock();

  const poolCount = state.pools.count;
  const reactionCount = state.reactions.length;

  /**
   * The g3p level at the start of the METERED WINDOW, for the completed-glucose
   * correction in meter.ts. Trioses sitting in the pool are glucose that has been
   * paid for and has not paid out, and subtracting them is the difference between
   * reporting the sourced yield of 4 and reporting a stall as a collapse in
   * yield.
   *
   * A RESTORED SESSION USES ZERO, NOT THE RESTORED AMOUNT, and this is the one
   * thing persistence quietly broke before it was noticed. The meter is
   * cumulative over the whole save, so its baseline is the g3p the run started
   * with, which is `ACT1_INITIAL.g3p` and is zero. Taking the restored pool level
   * as the baseline would measure the correction from the reload rather than from
   * the beginning, and ATP per glucose would read wrong after every refresh. The
   * development scenario door can seed a non-zero starting g3p, and a save
   * written from one of those restores against zero rather than against the seed;
   * that is a known and deliberate limit of a door that only exists behind a
   * query string.
   */
  const g3pIndex = state.pools.indexOf('g3p');
  const g3pInitial = restoredOk === null ? (state.pools.amounts[g3pIndex] as number) : 0;

  const payoffReaction = reactionIndex('payoff');
  const uptakeReaction = reactionIndex('uptake');
  const nadPool = state.pools.indexOf('nad');

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

  /**
   * Flat stoichiometry matrices, `reactionCount` rows by `poolCount` columns,
   * built once from the reaction table.
   *
   * Same layout choice as `PoolRegistry.conservedWeights` and for the same
   * reason: filling the snapshot is then one linear pass over contiguous memory
   * with no object access, sixty times a second, allocating nothing.
   */
  const producedPer = new Float64Array(reactionCount * poolCount);
  const consumedPer = new Float64Array(reactionCount * poolCount);
  for (let r = 0; r < reactionCount; r += 1) {
    const reaction = state.reactions[r];
    if (reaction === undefined) continue;
    for (const term of reaction.products) {
      producedPer[r * poolCount + term.poolIndex] =
        (producedPer[r * poolCount + term.poolIndex] as number) + term.coefficient;
    }
    for (const term of reaction.substrates) {
      consumedPer[r * poolCount + term.poolIndex] =
        (consumedPer[r * poolCount + term.poolIndex] as number) + term.coefficient;
    }
  }

  const snapshot: Act1Snapshot = {
    amounts: new Float64Array(poolCount),
    flux: new Float64Array(reactionCount),
    appliedFlux: new Float64Array(reactionCount),
    shortfallTicks: new Int32Array(poolCount),
    production: new Float64Array(poolCount),
    netRate: new Float64Array(poolCount),
    meter,
    atpPerGlucose: 0,
    netAtpPerGlucose: 0,
    tickCount: 0,
    elapsedMs: 0,
    interpolation: 0,
    pendingOfflineMs: 0,
    lastTickCount: 0,
    frameCount: 0,
    fermentUnlocked: state.reactions[reactionIndex('ferment')]?.enabled ?? false,
    uptakeStep: 0,
    walled: false,
  };

  /**
   * Re-apply the uptake capacity step.
   *
   * THE LADDER IS AN INTERFACE DECISION and lives in src/ui/tuning.ts, so
   * `src/content/act1/save.ts` reports the step it read out of the unlock list
   * and the runtime is what turns that into a Vmax. Content may not import the
   * interface, and the alternative, moving the ladder into content, is a
   * relocation this log has no business making.
   *
   * Without these four lines a reload silently refunds the purchase. Buying a
   * step replaces a kinetics descriptor and touches no pool, no tick count and no
   * PRNG, so it does not move the canonical hash, which means every determinism
   * test in the project would still pass. Stage 4 has a test that fails on
   * purpose when this is missing.
   */
  if (restoredOk !== null && restoredOk.unlocks.uptakeStep > 0) {
    const step = Math.min(restoredOk.unlocks.uptakeStep, UPTAKE_VMAX_STEPS.length - 1);
    setReactionVmax(state, 'uptake', UPTAKE_VMAX_STEPS[step] as number);
    snapshot.uptakeStep = step;
  }

  /* =========================================================================
     THE OFFLINE DELTA. Computed once, at the boundary, and spent by nobody.
     ========================================================================= */

  const offline =
    restoredSave === null
      ? { awayMs: 0, rawMs: 0, capped: false, clockWentBackwards: false }
      : computeOfflineDelta(restoredSave.meta.lastSavedAt, epochClock());

  /**
   * Accumulated onto the same field a backgrounded tab already feeds.
   *
   * V3 left `pendingOfflineMs` on the snapshot with nothing consuming it, so a
   * hidden tab lost game time into a counter nobody read. V4 makes that counter
   * survive a reload and adds real time away to it. IT STILL CREDITS NOTHING.
   * Not one tick of this is simulated, and V5 owns spending it.
   */
  state.diagnostics.pendingOfflineMs += offline.awayMs;

  const session: Act1Session = {
    kind: store === null ? 'disabled' : (loaded?.kind ?? 'new-game'),
    awayMs: offline.awayMs,
    offlineCapped: offline.capped,
    clockWentBackwards: offline.clockWentBackwards,
    discardedMs: restoredOk?.discardedMs ?? 0,
    missingPools: restoredOk?.missingPools ?? [],
    unknownUnlocks: restoredOk?.unlocks.unknown ?? [],
    durable: store?.durable ?? false,
    nonDurableReason: store?.nonDurableReason ?? null,
    reason:
      loaded?.kind === 'recoverable' || loaded?.kind === 'unreadable' ? loaded.reason : null,
    futureVersion: loaded?.kind === 'future' ? loaded.version : null,
  };

  const listeners = new Set<Act1SnapshotListener>();

  /** Filled in place. Nothing here allocates. */
  function fill(interpolation: number): void {
    snapshot.amounts.set(state.pools.amounts);
    snapshot.shortfallTicks.set(state.diagnostics.shortfallTicks);
    snapshot.production.fill(0);
    snapshot.netRate.fill(0);
    for (let r = 0; r < reactionCount; r += 1) {
      const flux = state.fluxes[r] as number;
      const applied = flux * (state.scales[r] as number);
      snapshot.flux[r] = flux;
      snapshot.appliedFlux[r] = applied;
      if (applied === 0) continue;
      const row = r * poolCount;
      for (let p = 0; p < poolCount; p += 1) {
        const made = applied * (producedPer[row + p] as number);
        const used = applied * (consumedPer[row + p] as number);
        snapshot.production[p] = (snapshot.production[p] as number) + made;
        snapshot.netRate[p] = (snapshot.netRate[p] as number) + made - used;
      }
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

    /**
     * Walled, read off the state rather than flagged by it.
     *
     * Three conditions, and all three are needed. The payoff phase has stopped,
     * so the pathway is not producing. Uptake has NOT stopped, which is what
     * separates this from starvation: a starved cell has every flux low
     * together, and a walled cell is importing at full rate. And the carrier is
     * essentially all reduced, which is the cause rather than a symptom, so a
     * pathway that stops for some other reason a later act invents does not get
     * mislabelled as this one.
     */
    snapshot.walled =
      (snapshot.appliedFlux[payoffReaction] as number) < STOPPED_FLUX &&
      (snapshot.appliedFlux[uptakeReaction] as number) >= STOPPED_FLUX &&
      (state.pools.amounts[nadPool] as number) < WALLED_NAD;
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

  /* =========================================================================
     CAPTURE AND AUTOSAVE
     ========================================================================= */

  /**
   * Build the save. The one place the runtime hands its state to the save layer.
   *
   * `lastSavedAt` is read here rather than in the store, because
   * docs/SAVE_SCHEMA.md Part 3 makes it the only wall-clock input in the system
   * and the boundary is the runtime. The store stays a pure function of what it
   * is given and what is already on disk.
   */
  function capture(): SaveV1 {
    return captureAct1(state, meter, unlocked, settings, {
      meta: { createdAt, lastSavedAt: epochClock(), buildId: currentBuildId() },
      carried,
    });
  }

  const autosave: Autosave | null =
    store === null
      ? null
      : createAutosave({
          store,
          capture,
          ...(persistence.autosaveIntervalMs === undefined
            ? {}
            : { intervalMs: persistence.autosaveIntervalMs }),
          ...(persistence.startTimer === undefined ? {} : { startTimer: persistence.startTimer }),
          ...(persistence.stopTimer === undefined ? {} : { stopTimer: persistence.stopTimer }),
          ...(persistence.listen === undefined ? {} : { listen: persistence.listen }),
        });

  /**
   * SEALING, AND THE DEFECT THAT MADE IT NECESSARY.
   *
   * Found by reloading the real page rather than by any test. An import writes
   * the imported save into the active slot and then the interface reloads, and
   * `beforeunload` fires on that reload and autosaves THE STILL-RUNNING SESSION
   * over the file that was just imported. The import would appear to succeed,
   * the page would come back, and the player would be looking at the save they
   * were trying to replace. Accepting a backup had the same hole.
   *
   * Sealing closes it at the source: after an import or an accepted recovery,
   * the timer and both listeners are torn down and every remaining write path
   * refuses. There is nothing left that can write, rather than a reload that
   * happens to outrun the ones that can.
   *
   * It is also the honest state to be in. Once the active slot holds a save this
   * session did not produce, this session's state is stale by definition and has
   * no business persisting itself.
   */
  let sealed = false;

  function save(reason: SaveReason = 'manual'): WriteOutcome {
    if (autosave === null) {
      return { kind: 'failed', reason: 'persistence is disabled for this runtime', durable: false };
    }
    if (sealed) {
      return { kind: 'failed', reason: 'this session has been replaced by an imported save', durable: false };
    }
    return autosave.saveNow(reason);
  }

  /** Tear down every write path. Called once, and never undone. */
  function seal(): void {
    sealed = true;
    autosave?.stop();
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
      autosave?.start();
    },

    stop(): void {
      if (!running) return;
      running = false;
      if (handle !== null) cancel(handle);
      handle = null;
      autosave?.stop();
    },

    frame,

    subscribe(listener: Act1SnapshotListener): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    canBuyFerment(): boolean {
      return !snapshot.fermentUnlocked && meter.atpProduced >= FERMENT_ATP_THRESHOLD;
    },

    buyFerment(): boolean {
      if (snapshot.fermentUnlocked) return false;
      if (meter.atpProduced < FERMENT_ATP_THRESHOLD) return false;
      setReactionEnabled(state, 'ferment', true);
      snapshot.fermentUnlocked = true;
      unlocked.push(ACT1_UNLOCK_FERMENT);
      // Immediately, and not on the next timer tick. Losing a purchase is the
      // loss a player notices, and it is the one thing autosave should never be
      // thirty seconds late for.
      autosave?.saveNow('unlock');
      return true;
    },

    canBuyUptakeStep(): boolean {
      const next = snapshot.uptakeStep + 1;
      if (next >= UPTAKE_VMAX_STEPS.length) return false;
      const threshold = UPTAKE_ATP_THRESHOLDS[snapshot.uptakeStep];
      return threshold !== undefined && meter.atpProduced >= threshold;
    },

    buyUptakeStep(): boolean {
      const next = snapshot.uptakeStep + 1;
      if (next >= UPTAKE_VMAX_STEPS.length) return false;
      const threshold = UPTAKE_ATP_THRESHOLDS[snapshot.uptakeStep];
      if (threshold === undefined || meter.atpProduced < threshold) return false;
      setReactionVmax(state, 'uptake', UPTAKE_VMAX_STEPS[next] as number);
      snapshot.uptakeStep = next;
      unlocked.push(act1UptakeUnlockId(next));
      autosave?.saveNow('unlock');
      return true;
    },

    /* ===== Persistence ===== */

    session,
    unlocked,
    capture,
    save,

    get lastSave() {
      return autosave?.last ?? null;
    },
    get worstSaveMs() {
      return autosave?.worstDurationMs ?? 0;
    },

    exportSave(): string {
      // Readable JSON. docs/SAVE_SCHEMA.md Part 4: exported saves are plain and
      // readable and there is nothing to protect.
      return serializeReadable(capture());
    },

    importSave(text: string): ImportOutcome {
      if (store === null) {
        return { kind: 'failed', reason: 'persistence is disabled for this runtime' };
      }

      /**
       * NOTHING IS WRITTEN UNTIL THE FILE HAS PASSED EVERYTHING.
       *
       * The full stage 1 deserialize, the stage 3 migration chain, and then the
       * act 1 mapping, which is the only layer that knows an unknown pool id is
       * a corruption. A future-version import gets the same refusal a
       * future-version load gets, for the same reason: this build cannot know
       * what the fields mean.
       */
      const parsed = parseAndMigrate(text);
      if (parsed.kind === 'future') return { kind: 'future', version: parsed.version };
      if (parsed.kind !== 'ok') return { kind: 'corrupt', reason: parsed.reason };

      const mapped = restoreAct1(parsed.save);
      if (mapped.kind !== 'ok') return { kind: 'corrupt', reason: mapped.reason };

      const outcome = store.write(parsed.save);
      if (outcome.kind !== 'written') return { kind: 'failed', reason: outcome.reason };
      // Nothing this session can write may follow. See `seal`.
      seal();
      return { kind: 'ok' };
    },

    acceptRecovery(): WriteOutcome {
      if (store === null) {
        return { kind: 'failed', reason: 'persistence is disabled for this runtime', durable: false };
      }
      const outcome = store.acceptRecovery();
      if (outcome.kind === 'written') seal();
      return outcome;
    },
  };
}

/**
 * Flip a reaction on. This is the whole unlock mechanism for `ferment`, and
 * `Reaction.enabled` is mutable precisely so a later log could do this.
 */
function setReactionEnabled(
  state: SimulationState,
  id: Act1ReactionId,
  enabled: boolean,
): void {
  const reaction = state.reactions[reactionIndex(id)];
  if (reaction === undefined) throw new Error(`runtime: no reaction "${id}"`);
  reaction.enabled = enabled;
}

/**
 * Raise a reaction's Vmax by replacing its kinetics descriptor.
 *
 * THE CAST, AND WHY IT IS NARROW. `Reaction.kinetics` is readonly, which is
 * correct for every other caller: the reaction table is a description of the
 * pathway and nothing in the tick loop has any business rewriting it. An unlock
 * is the one thing that legitimately does, and it does it here, in one place,
 * through the same validating constructor the content layer uses, so an invalid
 * Vmax throws at purchase time rather than producing NaN flux forever.
 *
 * This does NOT touch hashed state. src/sim/hash.ts covers pool amounts, the
 * tick count and the PRNG, so buying an upgrade does not move the canonical
 * hash. It does change how the simulation evolves from here, which means V4's
 * save schema has to persist the unlock state or a reload will silently refund
 * every purchase. Flagged here rather than left for V4 to discover.
 */
function setReactionVmax(state: SimulationState, id: Act1ReactionId, vmax: number): void {
  const index = reactionIndex(id);
  const reaction = state.reactions[index];
  if (reaction === undefined) throw new Error(`runtime: no reaction "${id}"`);
  const kinetics = reaction.kinetics;
  if (kinetics.kind !== 'michaelis-menten') {
    throw new Error(`runtime: "${id}" is not Michaelis-Menten and has no simple Vmax to raise`);
  }
  (reaction as { kinetics: Kinetics }).kinetics = michaelisMenten(vmax, kinetics.km);
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
