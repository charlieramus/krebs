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
 * The literal 2, not `number`.
 *
 * Same spirit as src/sim/constants.ts: a later edit that widens this is visible
 * at every call site rather than silently absorbed. It is also what makes the
 * `schemaVersion: 2` field below a discriminant rather than a comment.
 *
 * CLAUDE.md hard rule 7 forbids bumping this without a migration and a fixture
 * test from the previous version. V4 stage 3 made that mechanism rather than
 * discipline: a bump without both fails the suite.
 *
 * BUMPED TO 2 ON 2026-08-20 by UPDATELOGV14.md stage 3, which is the first bump
 * in the project. Both halves of hard rule 7 were already waiting for it: the
 * version 1 fixture has been committed since V4 and could only ever have been
 * captured while version 1 was what the code produced, and `migrations.ts` has
 * carried a proven runner with an empty chain since the same log.
 *
 * ONE BUMP CARRIES TWO CHANGES, deliberately, because a schema version is a
 * step in a chain rather than a label on a change:
 *
 *   progression.transitionTaken  boolean         ->  removed
 *   progression.endosymbiont     'kept' | 'digested' | null   new
 *   snapshot                     string | null                new
 */
export const SCHEMA_VERSION = 2 as const;

export interface SaveMetaV2 {
  /** Epoch ms at new game. Written once and never rewritten. */
  readonly createdAt: number;
  /** Epoch ms at every write. The only wall-clock input, docs/SAVE_SCHEMA.md Part 3. */
  readonly lastSavedAt: number;
  /** Diagnostic only. docs/SAVE_SCHEMA.md Part 2: never branched on. */
  readonly buildId: string;
}

export interface SaveTimeV2 {
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

export interface SaveRngV2 {
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

/**
 * What became of the endosymbiont. Act 3, and the reason schema version 2
 * exists.
 *
 * THREE STATES, AND VERSION 1 HAD A BOOLEAN. `transitionTaken` could say that
 * something happened and could not say which of two things happened, so a save
 * written after digesting the endosymbiont was indistinguishable from one
 * written after keeping it. docs/PROGRESSION.md act 3 gives the player a real
 * choice between the two and calls the digest path a teaching moment rather
 * than a dead end, which makes the difference between them the single most
 * load-bearing bit in the file.
 *
 * `null` is not "false". It is "the choice has not been offered or has not been
 * made", which is a third real state and the one every save before act 3 is in.
 */
export type EndosymbiontState = 'kept' | 'digested' | null;

export interface SaveProgressionV2 {
  /** 1 to 4. Act 1 is the only one that exists. */
  readonly act: number;
  /**
   * Unlock ids, insertion ordered. THE SOURCE OF TRUTH for what the player has
   * bought. Reaction enabled flags are derived from this at load and are never
   * persisted alongside it, because two copies of one fact is the specific way
   * save formats rot.
   */
  readonly unlocked: readonly string[];
  /**
   * Endosymbiosis, one way. Act 3.
   *
   * Replaces version 1's `transitionTaken: boolean`. There is deliberately no
   * second field beside it saying whether the transition happened, because
   * `endosymbiont !== null` already says so and two copies of one fact is the
   * defect the whole document warns about.
   */
  readonly endosymbiont: EndosymbiontState;
  /** "malate-aspartate" | "glycerol-phosphate". Act 3. */
  readonly shuttleChoice: string | null;
}

/** Pool id to current amount. Ids are permanent, docs/SAVE_SCHEMA.md Part 3. */
export type SavePoolsV2 = Readonly<Record<string, number>>;

export interface SaveEnzymeV2 {
  readonly level: number;
  /** Act 2 ROS degradation, 0 to 1. */
  readonly damage: number;
}

/** Empty at version 1. The ten-enzyme decomposition does not exist yet. */
export type SaveEnzymesV2 = Readonly<Record<string, SaveEnzymeV2>>;

export interface SaveEnvironmentV2 {
  /** Zero, and act 1 really is anaerobic. Not a placeholder. */
  readonly oxygenLevel: number;
  /** Position in the act 2 oxygen schedule. */
  readonly scheduleIndex: number;
}

export interface SaveStatsV2 {
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

export interface SaveDiagnosticsV2 {
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
export type SaveSettingsV2 = Readonly<Record<string, boolean | number | string>>;

/**
 * The whole version 1 save.
 *
 * `tickCount` IS DELIBERATELY ABSENT and that is the single most important rule
 * in docs/SAVE_SCHEMA.md. Storing ticks would make TICK_RATE_HZ load-bearing for
 * save compatibility, which is exactly what CLAUDE.md hard rule 6 depends on not
 * being true. It is reconstructed at load from `time.elapsedGameMs`. See the
 * tick alignment note in src/content/act1/save.ts for what that costs.
 */
export interface SaveV2 {
  readonly schemaVersion: 2;
  readonly meta: SaveMetaV2;
  readonly time: SaveTimeV2;
  readonly rng: SaveRngV2;
  readonly progression: SaveProgressionV2;
  readonly pools: SavePoolsV2;
  readonly enzymes: SaveEnzymesV2;
  readonly environment: SaveEnvironmentV2;
  readonly stats: SaveStatsV2;
  readonly diagnostics: SaveDiagnosticsV2;
  readonly settings: SaveSettingsV2;
  /**
   * The pre-transition snapshot, as a serialised save, or null.
   *
   * THE ONLY SNAPSHOT THIS GAME EVER TAKES. docs/PROGRESSION.md act 3 asks for
   * an undo on the keep-or-digest decision and on no other decision anywhere,
   * because that one is the single irreversible structural change in the game
   * and a player who took it by accident has lost the rest of their run.
   *
   * WHAT IT IS NOT, written here because a field like this attracts uses:
   *
   *   not a save-scumming mechanic. One decision, one snapshot. There is no
   *     way to take a second one and no code that takes one anywhere else
   *   not generalisable. It is not a rewind buffer, not an undo stack, and
   *     nothing else in the game may write to it
   *   not a second save slot. `storage.ts` already has a backup slot and this
   *     is not it. That one protects against a failed write; this one is
   *     content
   *
   * A STRING RATHER THAN A NESTED OBJECT, for two reasons. A nested save is a
   * recursive type, and a serialised one goes back through `parseAndMigrate` on
   * the way out, so a snapshot taken at an older schema version migrates on
   * restore exactly as a save from disk does.
   *
   * BOUNDED AT ONE LEVEL and asserted. The snapshot is taken before the choice,
   * when this field is null, so the payload's own `snapshot` is always null. A
   * save containing a snapshot containing a snapshot is a bug.
   */
  readonly snapshot: string | null;
}
