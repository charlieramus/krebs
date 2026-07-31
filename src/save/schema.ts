/**
 * The version 1 save shape, as types.
 *
 * docs/SAVE_SCHEMA.md Part 2 field for field, plus the additive fields
 * UPDATELOGV4.md settles in its "The version 1 save, field by field" table.
 * Part 2 is explicitly illustrative rather than exhaustive and Part 1 says an
 * additive field new code can default is not a breaking change, so the additive
 * fields ship at version 1 without a bump. Stage 6 writes them back into the
 * document.
 *
 * EVERY TYPE IS READONLY. A save object that code can mutate after validation is
 * a save object that can be mutated between validation and use, and the whole
 * point of the codec returning a discriminated result is that a validated save
 * is a thing a caller can rely on. Freezing the type is the cheap half of that;
 * the codec never hands out a reference to anything it did not build.
 *
 * NO LOGIC LIVES HERE. This file is the contract. Serialisation is codec.ts,
 * storage is storage.ts, and the act 1 mapping is src/content/act1/save.ts,
 * because the save layer is content-blind and does not know what a pool means.
 */

/**
 * The literal 1, not `number`.
 *
 * Same spirit as src/sim/constants.ts: a later edit that widens this is visible
 * at every call site rather than silently absorbed. It is also what makes the
 * `schemaVersion: 1` field below a discriminant rather than a comment.
 *
 * CLAUDE.md hard rule 7 forbids bumping this without a migration and a fixture
 * test from the previous version. Stage 3 makes that mechanism rather than
 * discipline: a bump without both fails the suite.
 */
export const SCHEMA_VERSION = 1 as const;

export interface SaveMetaV1 {
  /** Epoch ms at new game. Written once and never rewritten. */
  readonly createdAt: number;
  /** Epoch ms at every write. The only wall-clock input, docs/SAVE_SCHEMA.md Part 3. */
  readonly lastSavedAt: number;
  /** Diagnostic only. docs/SAVE_SCHEMA.md Part 2: never branched on. */
  readonly buildId: string;
}

export interface SaveTimeV1 {
  /** Total game time simulated, integer ms. Never a tick count, docs/SAVE_SCHEMA.md Part 3. */
  readonly elapsedGameMs: number;
  /** Cumulative offline time actually credited. Zero until V5 credits any. */
  readonly offlineCreditedMs: number;
  /**
   * ADDITIVE, UPDATELOGV4.md. Game time that exceeded MAX_CATCHUP_TICKS and was
   * routed to the offline path without being simulated.
   *
   * V3 surfaced this on the snapshot and nothing consumed it, so a backgrounded
   * tab silently lost game time. Persisting it does not credit it. It means V5
   * starts from a real accumulated number rather than from zero, and the time a
   * player spent away during the V4 release is not thrown out.
   */
  readonly pendingOfflineMs: number;
}

export interface SaveRngV1 {
  /** "mulberry32". Matches src/sim/prng.ts. */
  readonly algorithm: string;
  readonly seed: number;
  /**
   * Current internal state. docs/SAVE_SCHEMA.md Part 3: persisting the seed
   * alone is insufficient, because a reloaded save has to continue the same
   * sequence rather than restart it. Stage 4 is the test that proves it.
   */
  readonly state: number;
}

export interface SaveProgressionV1 {
  /** 1 to 4. Act 1 is the only one that exists. */
  readonly act: number;
  /**
   * Unlock ids, insertion ordered. THE SOURCE OF TRUTH for what the player has
   * bought. Reaction enabled flags are derived from this at load and are never
   * persisted alongside it, because two copies of one fact is the specific way
   * save formats rot.
   */
  readonly unlocked: readonly string[];
  /** Endosymbiosis, one way. Act 3. */
  readonly transitionTaken: boolean;
  /** "malate-aspartate" | "glycerol-phosphate". Act 3. */
  readonly shuttleChoice: string | null;
}

/** Pool id to current amount. Ids are permanent, docs/SAVE_SCHEMA.md Part 3. */
export type SavePoolsV1 = Readonly<Record<string, number>>;

export interface SaveEnzymeV1 {
  readonly level: number;
  /** Act 2 ROS degradation, 0 to 1. */
  readonly damage: number;
}

/** Empty at version 1. The ten-enzyme decomposition does not exist yet. */
export type SaveEnzymesV1 = Readonly<Record<string, SaveEnzymeV1>>;

export interface SaveEnvironmentV1 {
  /** Zero, and act 1 really is anaerobic. Not a placeholder. */
  readonly oxygenLevel: number;
  /** Position in the act 2 oxygen schedule. */
  readonly scheduleIndex: number;
}

export interface SaveStatsV1 {
  /**
   * The meter's `atpProduced` under the schema's permanent name. THE ONE NAME
   * MISMATCH in the whole mapping, and it is mapped explicitly rather than
   * spread, because the schema name is the contract and the meter name is not.
   */
  readonly totalAtpProduced: number;
  readonly glucoseConsumed: number;
  /** Offline events resolved. V5. */
  readonly eventsProcessed: number;

  /* ADDITIVE, UPDATELOGV4.md. The other five fields of src/content/act1/meter.ts.
     V3 gates unlocks on the meter, so a meter that does not survive a reload
     either re-locks something the player bought or lets them buy it twice. */
  readonly atpSpent: number;
  readonly atpMaintained: number;
  readonly glucoseTakenUp: number;
  readonly lactateProduced: number;
  readonly nadhProduced: number;
}

export interface SaveDiagnosticsV1 {
  /** Steady state not reached, docs/SIMULATION.md Part 3. V5. */
  readonly offlineFallbackCount: number;
  /**
   * Ticks in which a pool ran short and its consumers were scaled, summed over
   * every pool and over the whole history of the save.
   *
   * A PROJECTION, and it cannot be inverted. The kernel counts this per pool in
   * an Int32Array and the schema stores one number, so a restored session
   * carries the saved total as a baseline and adds its own to it. The per-pool
   * breakdown is session-scoped. Said out loud in src/content/act1/save.ts,
   * where the mapping lives.
   */
  readonly negativePoolScalingEvents: number;
  /**
   * ADDITIVE, UPDATELOGV4.md. Ticks in which the shortfall scaling loop hit its
   * pass cap. docs/SAVE_SCHEMA.md Part 3 says diagnostics are not decoration:
   * they persist so a player-submitted save carries evidence of a balance bug,
   * and this one is the sharper of the two signals.
   */
  readonly scalingCapHits: number;
}

/**
 * UI only. docs/SAVE_SCHEMA.md Part 3: if a setting would change simulation
 * output it belongs elsewhere and has to be reasoned about as a determinism
 * hazard.
 *
 * Empty at version 1, because V3 shipped no persisted setting: reduced motion is
 * read from the OS media query rather than stored. The type is a bag of scalars
 * rather than an empty interface so that adding one later is additive.
 */
export type SaveSettingsV1 = Readonly<Record<string, boolean | number | string>>;

/**
 * The whole version 1 save.
 *
 * `tickCount` IS DELIBERATELY ABSENT and that is the single most important rule
 * in docs/SAVE_SCHEMA.md. Storing ticks would make TICK_RATE_HZ load-bearing for
 * save compatibility, which is exactly what CLAUDE.md hard rule 6 depends on not
 * being true. It is reconstructed at load from `time.elapsedGameMs`. See the
 * tick alignment note in src/content/act1/save.ts for what that costs.
 */
export interface SaveV1 {
  readonly schemaVersion: 1;
  readonly meta: SaveMetaV1;
  readonly time: SaveTimeV1;
  readonly rng: SaveRngV1;
  readonly progression: SaveProgressionV1;
  readonly pools: SavePoolsV1;
  readonly enzymes: SaveEnzymesV1;
  readonly environment: SaveEnvironmentV1;
  readonly stats: SaveStatsV1;
  readonly diagnostics: SaveDiagnosticsV1;
  readonly settings: SaveSettingsV1;
}
