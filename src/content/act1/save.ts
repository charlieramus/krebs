/**
 * The act 1 save mapping, both directions.
 *
 * The save layer is content-blind. `src/save/` knows a save has a `pools` object
 * and does not know that "nad" is a thing, exactly as `src/sim/` knows a pool has
 * an id and does not know it is a carrier. This file is the one place that knows
 * both, and it is the only file in `src/content/` that may import `src/save/`.
 * The arrow points the same way it has since V2.
 *
 * ---------------------------------------------------------------------------
 * WHAT IS PERSISTED AND WHAT IS DERIVED
 * ---------------------------------------------------------------------------
 *
 * `progression.unlocked` is the source of truth for what the player has bought.
 * The `ferment` reaction's `enabled` flag and the uptake capacity step are both
 * DERIVED from it at load and neither is ever written to the save. Two copies of
 * one fact is a migration hazard and it is the specific way save formats rot:
 * the day they disagree, nothing in the file says which one is right.
 *
 * V3 flagged the other half of this in src/ui/runtime.ts: `setReactionVmax` and
 * `setReactionEnabled` do not touch pool amounts, the tick count or the PRNG, so
 * buying an upgrade does not move the canonical hash. A reload that did not
 * persist unlock state would therefore pass every determinism test in the
 * project while silently refunding every purchase.
 *
 * ---------------------------------------------------------------------------
 * TICK ALIGNMENT, WHICH IS A COST AND NOT A BUG
 * ---------------------------------------------------------------------------
 *
 * The save stores milliseconds, never ticks. docs/SAVE_SCHEMA.md Part 3 calls
 * that the single most important rule in the file, and CLAUDE.md hard rule 6
 * depends on it: TICK_RATE_HZ stays movable during development and is frozen at
 * launch precisely because no save is written in its units.
 *
 * That decouples the DURATION. It does not decouple the ALIGNMENT.
 * `elapsedGameMs` is always a whole multiple of the TICK_MS that produced it, so
 * dividing is exact while the rate is unchanged. Change TICK_MS from 50 to 40
 * during development and a save written at 60050 ms reconstructs to 1501.25
 * ticks, which is not a tick count.
 *
 * The reconstruction therefore FLOORS, and the discarded remainder is returned
 * rather than swallowed. A save with a remainder is NOT corrupt and must never
 * be rejected as corrupt: it is a development-time tick rate change and it costs
 * at most one tick of game time. The obvious reading of a non-integer tick count
 * is that something is wrong, which is why this is written down here rather than
 * left for a later reader to work out.
 */

import { TICK_MS } from '../../sim/constants';
import { elapsedMs } from '../../sim/loop';
import type { SimulationState } from '../../sim/state';
import {
  SCHEMA_VERSION,
  type SaveMetaV1,
  type SaveSettingsV1,
  type SaveV1,
} from '../../save/schema';
import { createAct1Meter, type Act1Meter } from './meter';
import { ACT1_INITIAL, ACT1_POOL_IDS, type Act1PoolId } from './pools';
import { createAct1 } from './reactions';

/* ===========================================================================
   UNLOCK IDS

   PERMANENT. docs/SAVE_SCHEMA.md Part 3: "Pool ids, enzyme ids and unlock ids
   are contract surface. Once a build ships with an id, that id is never reused
   for a different meaning." Renaming one costs a migration.

   V3 tracked what had been bought as a boolean and an integer on the runtime
   snapshot. Neither is a name, and a save needs names, so the ids are minted
   here and the runtime maps onto them rather than the other way round.
   =========================================================================== */

/** Lactate dehydrogenase. The teaching beat of act 1. */
export const ACT1_UNLOCK_FERMENT = 'ferment';

/**
 * Pyruvate decarboxylase and alcohol dehydrogenase. The second NAD+ recycling
 * branch, added by UPDATELOGV10.md stage 2.
 *
 * `ferment` MEANS LACTATE, PERMANENTLY. V4 minted that id before there was a
 * second branch to distinguish it from, and Part 3 makes an id that has shipped
 * permanent, so renaming it to `ferment-lactate` costs a migration and buys
 * nothing this comment does not buy. The new branch sits beside it instead.
 *
 * ADDITIVE, SO NO SCHEMA BUMP, on the same reading V5 used for the glycolytic
 * ladder. docs/SAVE_SCHEMA.md Part 1: a change new code can handle by defaulting
 * a missing field is not breaking. A V4 to V9 save simply has no id with this
 * value and derives the branch as unbought, which is what it was. The two new
 * POOLS are the same case seen from the other side: `restoreAct1` defaults a
 * pool the save did not carry to its ACT1_INITIAL amount and reports it in
 * `missingPools`, and both new pools start at zero, so an older save restores to
 * a cell that has never fermented to ethanol. Which is true of it.
 */
export const ACT1_UNLOCK_FERMENT_ETHANOL = 'ferment-ethanol';

/**
 * Glycogen storage. One purchase turning on BOTH `store` and `mobilise`, added
 * by UPDATELOGV10.md stage 3.
 *
 * ONE ID FOR TWO REACTIONS, on the precedent V5 set for the glycolytic ladder
 * and for the same kind of reason. A cell that can charge a reserve and not draw
 * it down has bought a permanent tax on its own throughput and nothing else,
 * which is a purchasable configuration that makes the cell worse, and V5's rule
 * is that one does not ship. A cell that can draw down a reserve it can never
 * charge has bought a reaction that never runs. Neither half is a thing on its
 * own.
 *
 * ADDITIVE, SO NO SCHEMA BUMP, on the same reading as `ferment-ethanol` above.
 */
export const ACT1_UNLOCK_GLYCOGEN = 'glycogen-storage';

/**
 * One id per rung of the uptake capacity ladder, numbered by its index into
 * `UPTAKE_VMAX_STEPS`. Step 0 is the shipped default and is not purchasable, so
 * the first id a save can carry is `uptake-capacity-1`.
 *
 * The ladder itself lives in src/ui/tuning.ts and its length is an interface
 * decision. This file mints the ids and counts them; it does not know how many
 * there are and must not, because content may not import the interface.
 */
export function act1UptakeUnlockId(step: number): string {
  return `uptake-capacity-${step}`;
}

const UPTAKE_UNLOCK_PREFIX = 'uptake-capacity-';

/** The step number in an uptake unlock id, or null if this is not one. */
export function parseAct1UptakeUnlockId(id: string): number | null {
  return parseStepId(id, UPTAKE_UNLOCK_PREFIX);
}

/**
 * One id per rung of the glycolytic capacity ladder, added by UPDATELOGV5.md
 * stage 3. Rung 0 is the state at the top of the uptake ladder and is not
 * purchasable, so the first id a save can carry is `glycolysis-capacity-1`.
 *
 * ADDITIVE, SO NO SCHEMA BUMP. docs/SAVE_SCHEMA.md Part 1: a change new code can
 * handle by defaulting a missing field is not breaking. A V4 save simply has no
 * id with this prefix and derives rung 0, which is what it was. Read from the
 * other side, `Act1Unlocks.unknown` already carries ids a build does not
 * recognise through capture untouched, so a V4 build loading a V5 save keeps the
 * purchase in the file rather than deleting it.
 *
 * Same shape as the uptake ids and deliberately so. The prefix is different
 * because the two ladders are different purchases, and Part 3 makes an id that
 * has shipped permanent.
 */
export function act1GlycolysisUnlockId(step: number): string {
  return `glycolysis-capacity-${step}`;
}

const GLYCOLYSIS_UNLOCK_PREFIX = 'glycolysis-capacity-';

/** The step number in a glycolytic unlock id, or null if this is not one. */
export function parseAct1GlycolysisUnlockId(id: string): number | null {
  return parseStepId(id, GLYCOLYSIS_UNLOCK_PREFIX);
}

/** Shared by both ladders. A suffix that is not a whole step number is not an id. */
function parseStepId(id: string, prefix: string): number | null {
  if (!id.startsWith(prefix)) return null;
  const suffix = id.slice(prefix.length);
  if (suffix.length === 0) return null;
  const step = Number(suffix);
  if (!Number.isInteger(step) || step < 1) return null;
  return step;
}

export interface Act1Unlocks {
  /** Whether `ferment`, the lactate branch, runs. */
  readonly fermentEnabled: boolean;
  /**
   * Whether `ferment_ethanol` runs. Independent of `fermentEnabled` in both
   * directions: a cell may run either branch, both, or neither, and buying one
   * never removes the other.
   */
  readonly ethanolEnabled: boolean;
  /**
   * Whether `store` and `mobilise` run. One flag, because one purchase turns on
   * both. See ACT1_UNLOCK_GLYCOGEN.
   */
  readonly glycogenEnabled: boolean;
  /** Index into the interface's capacity ladder. 0 is the shipped default. */
  readonly uptakeStep: number;
  /**
   * Index into the interface's glycolytic capacity ladder. 0 is the state at the
   * top of the uptake ladder. Added by UPDATELOGV5.md stage 3.
   */
  readonly glycolysisStep: number;
  /**
   * Ids this build does not recognise, preserved rather than dropped.
   *
   * Not corruption. Part 1 says an additive change new code can default is not
   * breaking, and an unlock this build has not heard of is the additive case seen
   * from the other side. It is carried through capture unchanged so that loading
   * an unfamiliar save and saving it again does not quietly delete something.
   */
  readonly unknown: readonly string[];
}

/**
 * Read the unlock list. The highest capacity id present sets the step rather
 * than the count of them, so a save missing an intermediate id lands on the rung
 * the player actually reached instead of one below it.
 */
export function deriveAct1Unlocks(unlocked: readonly string[]): Act1Unlocks {
  let fermentEnabled = false;
  let ethanolEnabled = false;
  let glycogenEnabled = false;
  let uptakeStep = 0;
  let glycolysisStep = 0;
  const unknown: string[] = [];

  for (const id of unlocked) {
    if (id === ACT1_UNLOCK_FERMENT) {
      fermentEnabled = true;
      continue;
    }
    if (id === ACT1_UNLOCK_FERMENT_ETHANOL) {
      ethanolEnabled = true;
      continue;
    }
    if (id === ACT1_UNLOCK_GLYCOGEN) {
      glycogenEnabled = true;
      continue;
    }
    const uptake = parseAct1UptakeUnlockId(id);
    if (uptake !== null) {
      if (uptake > uptakeStep) uptakeStep = uptake;
      continue;
    }
    const glycolysis = parseAct1GlycolysisUnlockId(id);
    if (glycolysis !== null) {
      if (glycolysis > glycolysisStep) glycolysisStep = glycolysis;
      continue;
    }
    unknown.push(id);
  }

  return { fermentEnabled, ethanolEnabled, glycogenEnabled, uptakeStep, glycolysisStep, unknown };
}

/* ===========================================================================
   CAPTURE
   =========================================================================== */

/**
 * Counters carried forward from the save this session was restored from.
 *
 * Four of the schema's counters cannot be read back off the simulation, for two
 * different reasons, and both reasons are permanent rather than temporary.
 *
 * `negativePoolScalingEvents` is a PROJECTION. The kernel counts shortfall ticks
 * per pool in an Int32Array and the schema stores one number, so the mapping is
 * a sum and a sum cannot be inverted. Restoring the total into any single pool's
 * slot would be a lie in the data, so the restored session starts its per-pool
 * counters at zero and adds its own work to the carried total.
 *
 * `offlineCreditedMs`, `eventsProcessed` and `offlineFallbackCount` belong to
 * the offline path, which V5 owns and V4 does not simulate. They are zero in
 * every save this build writes. They are carried anyway, because a field that
 * silently resets to zero on every reload is worse than one that is honestly
 * absent, and because V5 should inherit a running total rather than start one.
 *
 * `scalingCapHits` is deliberately NOT here. It is a plain mutable number on
 * `state.diagnostics`, so it restores onto the state exactly and capture reads
 * it straight back. The asymmetry between the two diagnostics is real and is
 * this: one of them is a scalar in both places and one of them is not.
 */
export interface Act1CarriedCounters {
  readonly negativePoolScalingEvents: number;
  readonly offlineCreditedMs: number;
  readonly eventsProcessed: number;
  readonly offlineFallbackCount: number;
}

export const ACT1_NO_CARRIED_COUNTERS: Act1CarriedCounters = {
  negativePoolScalingEvents: 0,
  offlineCreditedMs: 0,
  eventsProcessed: 0,
  offlineFallbackCount: 0,
};

/**
 * The fields capture cannot derive from the simulation.
 *
 * `meta` is here because `Date` is banned by the ESLint determinism guard in
 * `src/sim/` and `src/content/`, which is why timestamps live in `src/save/` and
 * arrive as an argument. That carve-out is correct rather than inconvenient:
 * docs/SIMULATION.md Part 5 puts wall-clock time at the boundary and nowhere
 * else, and a capture function that read the clock would be reading it from
 * inside content.
 */
export interface Act1CaptureContext {
  readonly meta: SaveMetaV1;
  readonly carried: Act1CarriedCounters;
}

/**
 * Everything act 1 knows how to persist.
 *
 * Pool amounts are written BY ID rather than by index. Indices are an
 * implementation detail of `PoolRegistry` and reordering the definition list is
 * a readability change; ids are the contract and reordering them is a migration.
 */
export function captureAct1(
  state: SimulationState,
  meter: Act1Meter,
  unlocked: readonly string[],
  settings: SaveSettingsV1,
  context: Act1CaptureContext,
): SaveV1 {
  const pools: Record<string, number> = {};
  for (let i = 0; i < state.pools.ids.length; i += 1) {
    const id = state.pools.ids[i] as string;
    pools[id] = state.pools.amounts[i] as number;
  }

  let shortfallTicks = 0;
  const perPool = state.diagnostics.shortfallTicks;
  for (let i = 0; i < perPool.length; i += 1) shortfallTicks += perPool[i] as number;

  return {
    schemaVersion: SCHEMA_VERSION,
    meta: context.meta,
    time: {
      elapsedGameMs: elapsedMs(state),
      offlineCreditedMs: context.carried.offlineCreditedMs,
      pendingOfflineMs: state.diagnostics.pendingOfflineMs,
    },
    rng: {
      algorithm: state.prng.algorithm,
      seed: state.prng.seed,
      state: state.prng.state,
    },
    progression: {
      act: 1,
      unlocked: unlocked.slice(),
      // Endosymbiosis is act 3 and there is no shuttle to choose in act 1.
      // Written because both are honestly true of this state, not as placeholders.
      transitionTaken: false,
      shuttleChoice: null,
    },
    pools,
    // No enzyme objects exist until the preparatory phase is decomposed into its
    // ten steps. An empty object is the true statement; an invented level is not.
    enzymes: {},
    environment: {
      // Act 1 really is anaerobic. This zero is a fact about the world, not a default.
      oxygenLevel: 0,
      scheduleIndex: 0,
    },
    stats: {
      // THE ONE NAME MISMATCH, mapped explicitly. The schema's name is permanent
      // and the meter's is not, so this is asymmetric rather than a spread.
      totalAtpProduced: meter.atpProduced,
      glucoseConsumed: meter.glucoseConsumed,
      eventsProcessed: context.carried.eventsProcessed,
      atpSpent: meter.atpSpent,
      atpMaintained: meter.atpMaintained,
      glucoseTakenUp: meter.glucoseTakenUp,
      lactateProduced: meter.lactateProduced,
      nadhProduced: meter.nadhProduced,
    },
    diagnostics: {
      offlineFallbackCount: context.carried.offlineFallbackCount,
      negativePoolScalingEvents: context.carried.negativePoolScalingEvents + shortfallTicks,
      scalingCapHits: state.diagnostics.scalingCapHits,
    },
    settings: { ...settings },
  };
}

/* ===========================================================================
   RESTORE
   =========================================================================== */

export interface Act1Restored {
  readonly state: SimulationState;
  readonly meter: Act1Meter;
  /** Exactly what the save carried, order preserved, unknown ids included. */
  readonly unlocked: readonly string[];
  readonly settings: SaveSettingsV1;
  readonly unlocks: Act1Unlocks;
  readonly carried: Act1CarriedCounters;

  /**
   * Game time discarded by flooring `elapsedGameMs` to a whole tick. Zero unless
   * TICK_MS changed since the save was written, and at most one tick either way.
   * Read the tick alignment note at the top of this file before treating a
   * non-zero value here as a fault.
   */
  readonly discardedMs: number;

  /**
   * Pool ids this build knows that the save did not carry, defaulted to their
   * ACT1_INITIAL value and reported rather than silently filled.
   *
   * docs/SAVE_SCHEMA.md Part 1: a missing field new code can default is not a
   * breaking change. This is that case, and reporting it is what stops it from
   * becoming the other case unnoticed.
   */
  readonly missingPools: readonly string[];
}

export type Act1RestoreResult =
  | { readonly kind: 'ok'; readonly restored: Act1Restored }
  | { readonly kind: 'corrupt'; readonly reason: string };

/**
 * Rebuild act 1 from a validated save.
 *
 * A RESULT RATHER THAN A THROW, for the reason src/save/codec.ts gives for
 * `deserialize`: an unknown pool id is a corruption and a caller must not be
 * able to ignore it. A save carrying a pool this build does not know about came
 * from somewhere, and the honest options are to say so or to guess. This says
 * so.
 */
export function restoreAct1(save: SaveV1): Act1RestoreResult {
  const known = new Set<string>(ACT1_POOL_IDS);
  for (const id of Object.keys(save.pools)) {
    if (!known.has(id)) {
      return { kind: 'corrupt', reason: `save carries unknown pool "${id}"` };
    }
  }

  const initial: Partial<Record<Act1PoolId, number>> = {};
  const missingPools: string[] = [];
  for (const id of ACT1_POOL_IDS) {
    const amount = save.pools[id];
    if (amount === undefined) {
      missingPools.push(id);
      initial[id] = ACT1_INITIAL[id];
      continue;
    }
    initial[id] = amount;
  }

  const unlocks = deriveAct1Unlocks(save.progression.unlocked);

  /**
   * The two fermentation branches and the two glycogen reactions are switched
   * from the unlock list and nothing else is. Every other reaction's flag comes from ACT1_ENABLED, which is the
   * shipped pathway, so a save cannot turn on a reaction the build does not ship
   * enabled or off one it does. The uptake capacity step is a Vmax rather than a
   * flag and belongs to the interface's ladder, so it is reported here and
   * applied by the runtime.
   */
  const state = createAct1({
    initial,
    enabled: {
      ferment: unlocks.fermentEnabled,
      ferment_ethanol: unlocks.ethanolEnabled,
      store: unlocks.glycogenEnabled,
      mobilise: unlocks.glycogenEnabled,
    },
    seed: save.rng.seed,
  });

  state.prng.state = save.rng.state >>> 0;

  // Floors, deliberately. See the tick alignment note at the top of this file.
  const tickCount = Math.floor(save.time.elapsedGameMs / TICK_MS);
  state.tickCount = tickCount;
  const discardedMs = save.time.elapsedGameMs - tickCount * TICK_MS;

  state.diagnostics.pendingOfflineMs = save.time.pendingOfflineMs;
  state.diagnostics.scalingCapHits = save.diagnostics.scalingCapHits;

  const meter = createAct1Meter();
  meter.atpProduced = save.stats.totalAtpProduced;
  meter.atpSpent = save.stats.atpSpent;
  meter.atpMaintained = save.stats.atpMaintained;
  meter.glucoseConsumed = save.stats.glucoseConsumed;
  meter.glucoseTakenUp = save.stats.glucoseTakenUp;
  meter.lactateProduced = save.stats.lactateProduced;
  meter.nadhProduced = save.stats.nadhProduced;

  return {
    kind: 'ok',
    restored: {
      state,
      meter,
      unlocked: save.progression.unlocked.slice(),
      settings: { ...save.settings },
      unlocks,
      carried: {
        negativePoolScalingEvents: save.diagnostics.negativePoolScalingEvents,
        offlineCreditedMs: save.time.offlineCreditedMs,
        eventsProcessed: save.stats.eventsProcessed,
        offlineFallbackCount: save.diagnostics.offlineFallbackCount,
      },
      discardedMs,
      missingPools,
    },
  };
}

/**
 * A restore that throws instead of returning. For tests and for the fixture
 * harness, which have already established the save is valid and would otherwise
 * spend three lines unwrapping a result they know the shape of.
 */
export function restoreAct1OrThrow(save: SaveV1): Act1Restored {
  const result = restoreAct1(save);
  if (result.kind !== 'ok') throw new Error(`restoreAct1: ${result.reason}`);
  return result.restored;
}
