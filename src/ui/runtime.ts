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
import { hill, michaelisMenten, type Kinetics } from '../sim/reactions';
import type { SimulationState } from '../sim/state';
import {
  ETHANOL_ATP_THRESHOLD,
  FERMENT_ATP_THRESHOLD,
  GLYCOGEN_ATP_THRESHOLD,
  PFK1_PK_ATP_THRESHOLD,
  PFK1_PK_VMAX_FACTOR,
  GLYCOLYSIS_ATP_THRESHOLDS,
  GLYCOLYSIS_STEPS,
  UPTAKE_ATP_THRESHOLDS,
  UPTAKE_VMAX_STEPS,
  ZERO_FLUX_THRESHOLD,
} from './tuning';
import type {
  ActCarriedCounters,
  ActCreateOptions,
  ActDescriptor,
  ActMeter,
  ActMeterProbes,
} from '../content/acts';
import {
  ACT1_UNLOCK_FERMENT,
  ACT1_UNLOCK_FERMENT_ETHANOL,
  ACT1_UNLOCK_GLYCOGEN,
  ACT1_UNLOCK_PFK1_PK,
  act1GlycolysisUnlockId,
  act1UptakeUnlockId,
} from '../content/act1/save';
import { createAutosave, type Autosave, type AutosaveRecord, type SaveReason } from '../save/autosave';
import { serializeReadable } from '../save/codec';
import { currentBuildId, epochNow } from '../save/meta';
import { parseAndMigrate } from '../save/migrations';
import { computeOfflineDelta } from '../save/offline';
import { coarseReplay, resolveOffline, type OfflineEventRecord } from '../sim/jump';
import { createSteadyDetector } from '../sim/steady';
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
export interface ActSnapshot {
  /** Pool amounts, `descriptor.poolIds` order. */
  readonly amounts: Float64Array;
  /** Intended flux per reaction, `descriptor.reactionIds` order, units per game-second. */
  readonly flux: Float64Array;
  /**
   * Flux the tick actually applied, which is `flux * scale`. The two differ
   * exactly when a substrate ran short, so the display must use this one: a
   * dash animation driven by intended flux keeps flowing through a shortfall
   * that has already stopped the reaction.
   */
  readonly appliedFlux: Float64Array;
  /** Ticks in which each pool ran short. Diagnostics, `descriptor.poolIds` order. */
  readonly shortfallTicks: Int32Array;

  /**
   * Units per game-second produced into each pool, summed across every
   * reaction that makes it. `descriptor.poolIds` order.
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

  /** The live meter. Same object every frame, filled in place by `descriptor.recordTick`. */
  readonly meter: ActMeter;
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
  /**
   * Whether the ethanol branch has been bought. Independent of `fermentUnlocked`
   * in the data, gated behind it in the shelf: a player meeting the NAD+ wall
   * for the first time is offered one answer and not a fork.
   */
  ethanolUnlocked: boolean;
  /**
   * Whether glycogen storage has been bought. One flag for two reactions: a
   * reserve that can only be charged is a permanent tax and a reserve that can
   * only be drawn down never fills, so neither half is sold on its own.
   */
  glycogenUnlocked: boolean;
  /** Phosphofructokinase-1 and pyruvate kinase bought. One purchase, two enzymes. */
  pfk1PkBought: boolean;
  /** Index into UPTAKE_VMAX_STEPS. 0 is the shipped default and is not bought. */
  uptakeStep: number;
  /**
   * Index into GLYCOLYSIS_STEPS. 0 is the state at the top of the uptake ladder
   * and is not bought. The two ladders are sequential: this one does not open
   * until `uptakeStep` is at the top of its own.
   */
  glycolysisStep: number;

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

export type ActSnapshotListener = (snapshot: ActSnapshot) => void;

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
 * Persistence, added by UPDATELOGV4.md stage 5.
 *
 * Everything injectable, and `enabled: false` turns the whole thing off. The
 * drain measurement and most of V3's tests want a runtime that does not read or
 * write a save slot, and a persistence layer that cannot be switched off makes
 * every one of them stateful.
 */
export interface ActPersistenceOptions {
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
export interface ActSession {
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
  /** What the offline path did with `awayMs` plus anything already pending. */
  readonly offline: ActOfflineReport;
}

/**
 * What the offline path did with the time this session was away.
 *
 * Everything the return screen needs, and nothing it does not. Present on every
 * session; `creditedMs` is zero when there was nothing to credit, which is the
 * common case and is what a reload produces.
 */
export interface ActOfflineReport {
  /** Game time actually simulated, in milliseconds. */
  readonly creditedMs: number;
  /** Time that was owed and not simulated, in milliseconds. Non-zero only when the budget ran out. */
  readonly uncreditedMs: number;
  /** Cumulative gross ATP produced while away. */
  readonly atpProduced: number;
  /** The event sequence, which DESIGN.md's screen inventory says to show. */
  readonly events: readonly OfflineEventRecord[];
  /** Pool ids, so the return screen can name an event without importing the registry. */
  readonly poolIds: readonly string[];
  /** Whether the coarse-replay fallback ran. docs/SIMULATION.md Part 3 calls this a bug signal. */
  readonly fellBack: boolean;
  /** Whether EVENT_BUDGET ran out. Not the same thing as falling back. */
  readonly budgetExhausted: boolean;
  /** How long the credit took, in real milliseconds. Measured, not estimated. */
  readonly elapsedRealMs: number;
}

export type ImportOutcome =
  | { readonly kind: 'ok' }
  | { readonly kind: 'corrupt'; readonly reason: string }
  | { readonly kind: 'future'; readonly version: number }
  | { readonly kind: 'failed'; readonly reason: string };

export interface ActRuntimeOptions {
  /** Passed through to the descriptor's constructor. Enabled flags, Vmax overrides, initial amounts. */
  readonly create?: ActCreateOptions;
  /** Monotonic milliseconds. Defaults to performance.now. */
  readonly clock?: () => number;
  /** Frame scheduler. Defaults to requestAnimationFrame. */
  readonly schedule?: (callback: () => void) => number;
  /** Frame canceller. Defaults to cancelAnimationFrame. */
  readonly cancel?: (handle: number) => void;
  readonly persistence?: ActPersistenceOptions;
}

export interface ActRuntime {
  /**
   * The act this runtime is running.
   *
   * Exposed rather than kept private because the interface needs it: a
   * component resolving a pool id to an index asks the running act, and there
   * is no longer a module-level function that answers for act 1 on everyone's
   * behalf. `RuntimeContext` re-exports it as `useAct`.
   */
  readonly act: ActDescriptor;
  /** The one snapshot object. Read it, do not keep references to its arrays. */
  readonly snapshot: ActSnapshot;
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
  subscribe(listener: ActSnapshotListener): () => void;

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
  /**
   * Buy the ethanol branch, under the same rules plus one more: it refuses
   * until the lactate branch has been bought. See `canBuyEthanol`.
   *
   * It does not remove the lactate branch and nothing ever does. A cell with
   * both runs both against the same pyruvate, so what the player bought is an
   * option rather than an upgrade.
   */
  buyEthanol(): boolean;
  /**
   * Buy glycogen storage, which turns on both `store` and `mobilise`.
   *
   * It refuses until the glycolytic ladder is finished, because the reserve is
   * charged out of the intracellular glucose the top of that ladder is what
   * produces, and because a buffer against the food running out is only a beat
   * once the food running out is in sight.
   */
  buyGlycogen(): boolean;
  /**
   * Buy phosphofructokinase-1 and pyruvate kinase, one purchase. Refuses until
   * the uptake ladder is finished. See ACT1_UNLOCK_PFK1_PK for why two enzymes
   * are one id and why neither can be sold alone.
   */
  buyPfk1Pk(): boolean;
  /** Buy the next uptake capacity step, under the same rules. */
  buyUptakeStep(): boolean;
  /**
   * Buy the next glycolytic capacity rung, under the same rules, plus one more:
   * it refuses until the uptake ladder is finished. See GLYCOLYSIS_STEPS.
   */
  buyGlycolysisStep(): boolean;
  /** Whether the meter has reached each threshold. Display only. */
  canBuyFerment(): boolean;
  canBuyEthanol(): boolean;
  canBuyGlycogen(): boolean;
  canBuyPfk1Pk(): boolean;
  canBuyUptakeStep(): boolean;
  canBuyGlycolysisStep(): boolean;

  /* ===== Persistence, UPDATELOGV4.md stage 5 ===== */

  /** What happened when this session started. Fixed at construction. */
  readonly session: ActSession;
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

  /* ===== The first run, UPDATELOGV6.md stage 3 ===== */

  /**
   * Whether the opening card has been seen. Persisted under `settings`, which
   * docs/SAVE_SCHEMA.md Part 3 defines as presentation that never affects
   * simulation. False for a save written before this build existed.
   */
  firstRunSeen(): boolean;
  /**
   * Record that it has. Idempotent, and it writes immediately rather than
   * waiting for the autosave interval.
   */
  markFirstRunSeen(): void;
}

export function createActRuntime(
  descriptor: ActDescriptor,
  options: ActRuntimeOptions = {},
): ActRuntime {
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
  const restored = restoredSave === null ? null : descriptor.restore(restoredSave);

  if (restored !== null && restored.kind !== 'ok') {
    // The codec validated the shape and the content mapping still refused it,
    // which means an unknown pool id. Treated as a corrupt load rather than
    // thrown, because a save that fails here must not take the game down with it.
    console.warn(`krebs: save restored no further than the codec, ${restored.reason}`);
  }

  const restoredOk = restored?.kind === 'ok' ? restored.restored : null;

  const state = restoredOk === null ? descriptor.create(options.create) : restoredOk.state;
  const probes: ActMeterProbes = descriptor.createMeterProbes(state);
  const meter = restoredOk === null ? descriptor.createMeter() : restoredOk.meter;

  /** Unlock ids in purchase order. Persisted as `progression.unlocked`. */
  const unlocked: string[] = restoredOk === null ? [] : [...restoredOk.unlocked];
  /**
   * UI settings, carried through and added to.
   *
   * V3 shipped no persisted setting, so this was empty in every save V4 and V5
   * wrote: reduced motion is read from the OS media query rather than stored.
   * UPDATELOGV6.md stage 3 adds the first one. It is still read from the save
   * and written back in full rather than replaced, so a build that knows a key
   * and a build that does not can share a file without either deleting the
   * other's work.
   *
   * `let` rather than `const`, and replaced rather than mutated, because
   * `SaveSettingsV1` is `Readonly<Record<...>>` and the readonly half of that is
   * the useful half: nothing downstream of `capture` can edit a settings object
   * it was handed.
   */
  let settings: SaveSettingsV1 = restoredOk === null ? {} : restoredOk.settings;
  /**
   * `let` rather than `const` since UPDATELOGV8.md stage 5, and replaced rather
   * than mutated for the same reason `settings` is: the fields are readonly and
   * the readonly half is the useful half. The offline credit is the only thing
   * that moves them.
   */
  let carried: ActCarriedCounters = restoredOk?.carried ?? descriptor.noCarriedCounters;
  const createdAt = restoredSave?.meta.createdAt ?? epochClock();

  const poolCount = state.pools.count;
  const reactionCount = state.reactions.length;

  /**
   * The yield-correction baseline at the start of the METERED WINDOW.
   *
   * THE POOL IS THE ACT'S CHOICE AND NOT THIS FILE'S. Act 1 names `g3p`:
   * trioses sitting in the pool are glucose that has been paid for and has not
   * paid out, and subtracting them is the difference between reporting the
   * sourced yield of 4 and reporting a stall as a collapse in yield. The runtime
   * held that literal until UPDATELOGV11.md stage 2 and now asks the descriptor.
   *
   * A RESTORED SESSION USES ZERO, NOT THE RESTORED AMOUNT, and this is the one
   * thing persistence quietly broke before it was noticed. The meter is
   * cumulative over the whole save, so its baseline is the level the run started
   * with, which for act 1 is `ACT1_INITIAL.g3p` and is zero. Taking the restored pool level
   * as the baseline would measure the correction from the reload rather than from
   * the beginning, and ATP per glucose would read wrong after every refresh. The
   * development scenario door can seed a non-zero starting g3p, and a save
   * written from one of those restores against zero rather than against the seed;
   * that is a known and deliberate limit of a door that only exists behind a
   * query string.
   */
  const baselineIndex = descriptor.poolIndex(descriptor.yieldBaselinePoolId);
  const baselineInitial =
    restoredOk === null ? (state.pools.amounts[baselineIndex] as number) : 0;

  /**
   * THE ONCE-PER-TICK PROBLEM, AND HOW IT IS SOLVED.
   *
   * `descriptor.recordTick` reads `state.fluxes` and `state.scales`, which are scratch
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
    descriptor.recordTick(ticked, probes, meter);
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

  const snapshot: ActSnapshot = {
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
    fermentUnlocked: state.reactions[descriptor.reactionIndex('ferment')]?.enabled ?? false,
    ethanolUnlocked: state.reactions[descriptor.reactionIndex('ferment_ethanol')]?.enabled ?? false,
    glycogenUnlocked: state.reactions[descriptor.reactionIndex('store')]?.enabled ?? false,
    pfk1PkBought: false,
    uptakeStep: 0,
    glycolysisStep: 0,
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
    setReactionVmax(descriptor, state, 'uptake', UPTAKE_VMAX_STEPS[step] as number);
    snapshot.uptakeStep = step;
  }

  /**
   * Re-apply the glycolytic capacity rung, second and therefore last.
   *
   * ORDER MATTERS AND IT IS NOT AN ACCIDENT. Both ladders set `uptake`, and this
   * one always sets it higher, because it only opens at the top of the other. It
   * runs second so its value wins, and a save carrying both kinds of id lands on
   * the configuration the player actually had rather than on whichever line ran
   * last by chance. The three rates of a rung are applied together for the same
   * reason they are sold together: the intermediate configurations are lethal.
   * See GLYCOLYSIS_STEPS in src/ui/tuning.ts.
   */
  /**
   * Re-apply the enzyme purchase, before the glycolytic rung so the rung's own
   * re-application below carries the factor.
   *
   * Without these lines a reload silently refunds it, exactly as it would for a
   * capacity rung and for exactly the same reason: a kinetics descriptor is not
   * hashed state, so every determinism test in the project would still pass.
   */
  if (restoredOk !== null && restoredOk.unlocks.pfk1PkBought) {
    snapshot.pfk1PkBought = true;
  }

  if (restoredOk !== null && restoredOk.unlocks.glycolysisStep > 0) {
    const step = Math.min(restoredOk.unlocks.glycolysisStep, GLYCOLYSIS_STEPS.length - 1);
    applyGlycolysisStep(descriptor, state, step, restoredOk.unlocks.pfk1PkBought);
    snapshot.glycolysisStep = step;
  } else if (restoredOk !== null && restoredOk.unlocks.pfk1PkBought) {
    // Bought the enzymes and no rung yet. The factor still has to be applied,
    // and rung 0 is the configuration at the top of the uptake ladder, which is
    // where this purchase lives.
    applyGlycolysisStep(descriptor, state, 0, true);
  }

  /* =========================================================================
     THE OFFLINE DELTA, AND SPENDING IT. docs/SIMULATION.md Part 3.
     ========================================================================= */

  const offline =
    restoredSave === null
      ? { awayMs: 0, rawMs: 0, capped: false, clockWentBackwards: false }
      : computeOfflineDelta(restoredSave.meta.lastSavedAt, epochClock());

  /**
   * Accumulated onto the same field a backgrounded tab already feeds.
   *
   * V3 left `pendingOfflineMs` on the snapshot with nothing consuming it, so a
   * hidden tab lost game time into a counter nobody read. V4 made that counter
   * survive a reload and added real time away to it, and credited none of it.
   *
   * TWO SOURCES AND BOTH ARE REAL. Time the loop routed here when a catch-up
   * exceeded MAX_CATCHUP_TICKS, which is the backgrounded tab, and time measured
   * at load from a genuine absence. Both are elapsed game time that was never
   * simulated and both are spent the same way, which is why they share a field
   * rather than being told apart.
   *
   * The three clock rules V4 established are not reimplemented here. The delta
   * is computed once, at the boundary, from now minus `meta.lastSavedAt`;
   * negative credits zero; positive caps at MAX_OFFLINE_HOURS. All three live in
   * `computeOfflineDelta` above and this spends what they produce.
   */
  state.diagnostics.pendingOfflineMs += offline.awayMs;

  const offlineReport = creditPendingOffline();

  /**
   * Spend `pendingOfflineMs`. Called once, before the first frame.
   *
   * `elapsedGameMs` is a whole multiple of TICK_MS by construction, so the
   * window is floored to whole ticks and the sub-tick remainder stays pending
   * rather than being rounded into existence. That is the same rule
   * docs/SAVE_SCHEMA.md Part 3 applies to reconstruction.
   */
  function creditPendingOffline(): ActOfflineReport {
    const startedAt = clock();
    const pendingMs = state.diagnostics.pendingOfflineMs;
    const windowTicks = Math.floor(pendingMs / TICK_MS);
    const atpBefore = meter.atpProduced;

    if (windowTicks <= 0) {
      return {
        creditedMs: 0,
        uncreditedMs: 0,
        atpProduced: 0,
        events: [],
        poolIds: descriptor.poolIds,
        fellBack: false,
        budgetExhausted: false,
        elapsedRealMs: 0,
      };
    }

    const observer = descriptor.createOfflineObserver(probes, meter);
    const outcome = resolveOffline(
      state,
      createSteadyDetector(state.pools.count),
      windowTicks,
      observer,
    );

    let coveredTicks = outcome.ticksResolved;
    let fellBack = false;

    /*
     * THE FALLBACK. docs/SIMULATION.md Part 3, and it is a bug signal rather
     * than a normal condition. Act 1 as V5 balanced it always settles and stage
     * 4 asserts that over 200 randomized cases, so reaching this line means
     * something about the economy changed and docs/ECONOMY.md wants to know.
     *
     * Falling back is NOT the same as exhausting the event budget and the two
     * are kept apart. A budget exhaustion means the window was too eventful to
     * finish; a fallback means the configuration would not settle at all.
     */
    if (!outcome.resolved && outcome.ticksRemaining > 0) {
      fellBack = true;
      coveredTicks += coarseReplay(state, outcome.ticksRemaining, observer);
    }

    const creditedMs = coveredTicks * TICK_MS;
    state.diagnostics.pendingOfflineMs = pendingMs - creditedMs;
    carried = {
      ...carried,
      offlineCreditedMs: carried.offlineCreditedMs + creditedMs,
      eventsProcessed: carried.eventsProcessed + outcome.events.length,
      offlineFallbackCount: carried.offlineFallbackCount + (fellBack ? 1 : 0),
    };

    return {
      creditedMs,
      uncreditedMs: state.diagnostics.pendingOfflineMs,
      atpProduced: meter.atpProduced - atpBefore,
      events: outcome.events,
      poolIds: descriptor.poolIds,
      fellBack,
      budgetExhausted: outcome.budgetExhausted,
      elapsedRealMs: clock() - startedAt,
    };
  }

  const session: ActSession = {
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
    offline: offlineReport,
  };

  const listeners = new Set<ActSnapshotListener>();

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

    const baselineDelta = (state.pools.amounts[baselineIndex] as number) - baselineInitial;
    snapshot.atpPerGlucose = descriptor.atpPerCompletedGlucose(meter, baselineDelta);
    snapshot.netAtpPerGlucose = descriptor.netAtpPerCompletedGlucose(meter, baselineDelta);

    snapshot.tickCount = state.tickCount;
    snapshot.elapsedMs = elapsedMs(state);
    snapshot.interpolation = interpolation;
    snapshot.pendingOfflineMs = state.diagnostics.pendingOfflineMs;
    snapshot.lastTickCount = loop.lastTickCount;
    snapshot.frameCount += 1;

    /**
     * Walled, read off the state rather than flagged by it, AND ASKED OF THE ACT
     * RATHER THAN COMPUTED HERE.
     *
     * This file used to hold `WALLED_NAD = 0.05` and three act 1 conditions
     * inline. Act 2's wall is not a NAD+ level, so neither the number nor the
     * conditions could stay, and neither could be generalised without asserting
     * that every act's wall is one pool crossing one threshold. The act answers
     * the question instead. See `isWalled` in src/content/acts.ts, which carries
     * the three conditions and the reasoning for them unchanged.
     *
     * Called once per frame with the same two arrays every time and allocates
     * nothing, which is why the predicate takes arrays rather than the snapshot.
     */
    snapshot.walled = descriptor.isWalled(state.pools.amounts, snapshot.appliedFlux, STOPPED_FLUX);
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
    return descriptor.capture(state, meter, unlocked, settings, {
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

  /**
   * WHETHER THE FIRST RUN HAS BEEN SEEN. UPDATELOGV6.md stage 3.
   *
   * docs/SAVE_SCHEMA.md Part 3: anything under `settings` is presentation and
   * never affects simulation. This qualifies exactly. It is not hashed state, it
   * is not read by any tick, and a save that loses it costs the player one card
   * they can reopen from the about panel anyway.
   *
   * NO SCHEMA BUMP, AND THE POLICY THAT ALLOWS THAT IS PART 1's. A missing field
   * new code can default is an additive change, and this defaults to false. So a
   * V4 or V5 save loads into this build and shows the first run once, which is
   * the right outcome rather than a tolerated one: that player has never seen it
   * either, because until this stage there was nothing to see.
   */
  const FIRST_RUN_SEEN = 'firstRunSeen';

  function firstRunSeen(): boolean {
    return settings[FIRST_RUN_SEEN] === true;
  }

  function markFirstRunSeen(): void {
    if (firstRunSeen()) return;
    settings = { ...settings, [FIRST_RUN_SEEN]: true };
    // Written now rather than at the next interval. A player who reads the card,
    // dismisses it and closes the tab inside thirty seconds should not be shown
    // it again, and thirty seconds is the autosave interval.
    autosave?.saveNow('setting');
  }

  return {
    act: descriptor,
    snapshot,
    state,
    loop,
    firstRunSeen,
    markFirstRunSeen,

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

    subscribe(listener: ActSnapshotListener): () => void {
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
      setReactionEnabled(descriptor, state, 'ferment', true);
      snapshot.fermentUnlocked = true;
      unlocked.push(ACT1_UNLOCK_FERMENT);
      // Immediately, and not on the next timer tick. Losing a purchase is the
      // loss a player notices, and it is the one thing autosave should never be
      // thirty seconds late for.
      autosave?.saveNow('unlock');
      return true;
    },

    canBuyEthanol(): boolean {
      // GATED BEHIND THE LACTATE BRANCH, and the gate is a teaching decision
      // rather than a balance one. The NAD+ wall arrives about three seconds in
      // and its answer has to be one thing the player can act on. Offering two
      // branches at that moment turns the act's central beat into a choice
      // between two options the player has no way to tell apart yet, and the
      // thing they have to learn first is that either of them recycles NAD+ and
      // neither makes ATP. docs/PROGRESSION.md lists lactate at 7 and ethanol
      // at 8 for the same reason.
      if (!snapshot.fermentUnlocked) return false;
      if (snapshot.ethanolUnlocked) return false;
      return meter.atpProduced >= ETHANOL_ATP_THRESHOLD;
    },

    buyEthanol(): boolean {
      if (!snapshot.fermentUnlocked) return false;
      if (snapshot.ethanolUnlocked) return false;
      if (meter.atpProduced < ETHANOL_ATP_THRESHOLD) return false;
      setReactionEnabled(descriptor, state, 'ferment_ethanol', true);
      snapshot.ethanolUnlocked = true;
      unlocked.push(ACT1_UNLOCK_FERMENT_ETHANOL);
      autosave?.saveNow('unlock');
      return true;
    },

    canBuyGlycogen(): boolean {
      // GATED ON THE UPTAKE LADDER, AND STAGE 5 MOVED IT THERE FROM THE
      // GLYCOLYTIC ONE.
      //
      // Stage 3 gated this behind the glycolytic ladder on the reasoning that
      // the reserve is charged out of the spare intracellular glucose the top of
      // that ladder produces. **Stage 5 instrumented the whole act and that
      // reasoning is backwards.** The spare glucose is at the top of the UPTAKE
      // ladder, where transport over-delivers by about 87 units a minute; the
      // glycolytic ladder and the enzyme purchase exist to consume it, so by the
      // top of that ladder there is nothing spare left to store. Offered last,
      // the reserve peaked at 462 units and bought 7m35s of tail. Offered here it
      // charges from the pile it was designed for.
      if (snapshot.uptakeStep < UPTAKE_VMAX_STEPS.length - 1) return false;
      if (snapshot.glycogenUnlocked) return false;
      return meter.atpProduced >= GLYCOGEN_ATP_THRESHOLD;
    },

    buyGlycogen(): boolean {
      if (snapshot.uptakeStep < UPTAKE_VMAX_STEPS.length - 1) return false;
      if (snapshot.glycogenUnlocked) return false;
      if (meter.atpProduced < GLYCOGEN_ATP_THRESHOLD) return false;
      // Both, always. See ACT1_UNLOCK_GLYCOGEN.
      setReactionEnabled(descriptor, state, 'store', true);
      setReactionEnabled(descriptor, state, 'mobilise', true);
      snapshot.glycogenUnlocked = true;
      unlocked.push(ACT1_UNLOCK_GLYCOGEN);
      autosave?.saveNow('unlock');
      return true;
    },

    canBuyPfk1Pk(): boolean {
      // THE ENZYMES SIT BETWEEN THE TWO LADDERS AND THE MEASUREMENT PUT THEM
      // THERE. The purchase is worth 17.6 percent at glycolytic rung 0 and
      // nothing at all at rung 4, because it raises the preparatory phase and
      // the preparatory phase is only the bottleneck while transport is
      // over-delivering, which is exactly the state the top of the uptake ladder
      // leaves the cell in. Sold before that ladder is finished it buys nothing;
      // sold after the glycolytic ladder it buys nothing.
      if (snapshot.uptakeStep < UPTAKE_VMAX_STEPS.length - 1) return false;
      if (snapshot.pfk1PkBought) return false;
      return meter.atpProduced >= PFK1_PK_ATP_THRESHOLD;
    },

    buyPfk1Pk(): boolean {
      if (snapshot.uptakeStep < UPTAKE_VMAX_STEPS.length - 1) return false;
      if (snapshot.pfk1PkBought) return false;
      if (meter.atpProduced < PFK1_PK_ATP_THRESHOLD) return false;
      snapshot.pfk1PkBought = true;
      // Re-applied through the same function the ladder uses, at the rung the
      // player is on, so there is exactly one place that knows how a rung and
      // the enzymes compose. A second code path here is how the two drift.
      applyGlycolysisStep(descriptor, state, snapshot.glycolysisStep, true);
      unlocked.push(ACT1_UNLOCK_PFK1_PK);
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
      setReactionVmax(descriptor, state, 'uptake', UPTAKE_VMAX_STEPS[next] as number);
      snapshot.uptakeStep = next;
      unlocked.push(act1UptakeUnlockId(next));
      autosave?.saveNow('unlock');
      return true;
    },

    canBuyGlycolysisStep(): boolean {
      // SEQUENTIAL, NOT INTERLEAVED. The uptake ladder finishes first. Both
      // ladders raise `uptake` and this one always raises it further, so
      // offering them at once would let a player buy a rung that immediately
      // undoes a purchase they can still see on the shelf.
      //
      // AND BEHIND THE TWO ENZYMES SINCE UPDATELOGV10.md STAGE 4, for a related
      // reason measured rather than assumed: this ladder raises `uptake` too, so
      // the first rung of it makes transport the bottleneck again and drops the
      // enzymes from 12.96 percent to 2.37. Offering them at the same time
      // lets a player spend on two upgrades in the order that wastes one.
      if (snapshot.uptakeStep < UPTAKE_VMAX_STEPS.length - 1) return false;
      if (!snapshot.pfk1PkBought) return false;
      const next = snapshot.glycolysisStep + 1;
      if (next >= GLYCOLYSIS_STEPS.length) return false;
      const threshold = GLYCOLYSIS_ATP_THRESHOLDS[snapshot.glycolysisStep];
      return threshold !== undefined && meter.atpProduced >= threshold;
    },

    buyGlycolysisStep(): boolean {
      if (snapshot.uptakeStep < UPTAKE_VMAX_STEPS.length - 1) return false;
      if (!snapshot.pfk1PkBought) return false;
      const next = snapshot.glycolysisStep + 1;
      if (next >= GLYCOLYSIS_STEPS.length) return false;
      const threshold = GLYCOLYSIS_ATP_THRESHOLDS[snapshot.glycolysisStep];
      if (threshold === undefined || meter.atpProduced < threshold) return false;
      applyGlycolysisStep(descriptor, state, next, snapshot.pfk1PkBought);
      snapshot.glycolysisStep = next;
      unlocked.push(act1GlycolysisUnlockId(next));
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

      const mapped = descriptor.restore(parsed.save);
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
  descriptor: ActDescriptor,
  state: SimulationState,
  id: string,
  enabled: boolean,
): void {
  const reaction = state.reactions[descriptor.reactionIndex(id)];
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
function setReactionVmax(
  descriptor: ActDescriptor,
  state: SimulationState,
  id: string,
  vmax: number,
): void {
  const index = descriptor.reactionIndex(id);
  const reaction = state.reactions[index];
  if (reaction === undefined) throw new Error(`runtime: no reaction "${id}"`);
  const kinetics = reaction.kinetics;
  if (kinetics.kind !== 'michaelis-menten') {
    throw new Error(`runtime: "${id}" is not Michaelis-Menten and has no simple Vmax to raise`);
  }
  (reaction as { kinetics: Kinetics }).kinetics = michaelisMenten(vmax, kinetics.km);
}

/**
 * Raise a Vmax without caring which curve the reaction is on.
 *
 * `setReactionVmax` above deliberately refuses anything but Michaelis-Menten,
 * because the uptake ladder is only ever pointed at `uptake` and a surprise Hill
 * form there would mean something had gone wrong. The glycolytic ladder points
 * at `prep`, which is Hill, so it needs the version that carries the shape
 * across. Same narrow cast, same validating constructors, and every field of the
 * old descriptor except Vmax is preserved rather than re-guessed.
 */
function setReactionVmaxPreservingShape(
  descriptor: ActDescriptor,
  state: SimulationState,
  id: string,
  vmax: number,
): void {
  const reaction = state.reactions[descriptor.reactionIndex(id)];
  if (reaction === undefined) throw new Error(`runtime: no reaction "${id}"`);
  const kinetics = reaction.kinetics;
  (reaction as { kinetics: Kinetics }).kinetics =
    kinetics.kind === 'hill'
      ? hill(vmax, kinetics.k, kinetics.n)
      : michaelisMenten(vmax, kinetics.km);
}

/**
 * Apply one rung of the glycolytic capacity ladder. Four reactions, one call.
 *
 * THE FOUR MOVE TOGETHER OR NOT AT ALL. Raising `prep` without `payoff` makes
 * the preparatory phase spend ATP faster than the payoff phase returns it and
 * the cell collapses, and raising `payoff` without `ferment` walls it on NAD+.
 * Both were measured in UPDATELOGV5.md stage 3 and both are why this is one
 * function rather than four calls a caller could make three of.
 */
function applyGlycolysisStep(
  descriptor: ActDescriptor,
  state: SimulationState,
  step: number,
  /**
   * Whether PFK-1 and pyruvate kinase have been bought.
   *
   * THE ENZYMES MULTIPLY ON TOP OF THE RUNG RATHER THAN BEING SUPERSEDED BY IT,
   * so a player who bought them and then climbs the ladder keeps them. That is
   * what an enzyme upgrade means: more of that enzyme, whatever the cell's
   * capacity is. It also keeps V5's condition satisfied at every rung, because
   * scaling `prep` and `payoff` by the SAME factor cannot change their ratio.
   * See PFK1_PK_VMAX_FACTOR, which tabulates the margin at all five rungs.
   */
  pfk1Pk: boolean,
): void {
  const rung = GLYCOLYSIS_STEPS[step];
  if (rung === undefined) throw new Error(`runtime: no glycolysis rung ${step}`);
  const factor = pfk1Pk ? PFK1_PK_VMAX_FACTOR : 1;
  const payoff = rung.payoff * factor;
  setReactionVmaxPreservingShape(descriptor, state, 'uptake', rung.uptake);
  setReactionVmaxPreservingShape(descriptor, state, 'prep', rung.prep * factor);
  setReactionVmaxPreservingShape(descriptor, state, 'payoff', payoff);
  setReactionVmaxPreservingShape(descriptor, state, 'ferment', payoff);
  // The ethanol branch climbs with the lactate branch, at the same value, for
  // the reason the two ship at the same value: the choice between them is about
  // what the cell keeps and a ladder that raised only one would turn it into a
  // choice about speed. It is raised whether or not it has been bought, exactly
  // as `ferment` is, because a Vmax on a disabled reaction does nothing.
  setReactionVmaxPreservingShape(descriptor, state, 'ferment_ethanol', payoff);
}


/*
 * `poolIndex` and `reactionIndex` USED TO LIVE HERE AS MODULE FUNCTIONS AND ARE
 * GONE. Both were `ACT1_POOL_IDS.indexOf(id)`, a linear scan, and `PoolCard`
 * called one of them once per render. They were also the last two places in this
 * file that answered for act 1 on everybody else's behalf.
 *
 * The replacement is `descriptor.poolIndex`, backed by a map built once at
 * module load in src/content/acts.ts, reached from a component through
 * `useAct()` and resolved once per component instance rather than once per
 * render. src/sim/pools.ts and src/sim/steady.ts have held that rule for the
 * kernel since V1; the runtime holds it now too.
 */

/** Game seconds from the snapshot's game milliseconds. The one conversion. */
export function gameSeconds(snapshot: ActSnapshot): number {
  return snapshot.elapsedMs / 1000;
}

export { TICK_MS, TICK_SECONDS };
