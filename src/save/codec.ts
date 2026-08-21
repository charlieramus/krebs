/**
 * Serialisation and structural validation. Pure, both directions.
 *
 * Nothing here touches storage and nothing here reads a clock. A save is a plain
 * object in and a string out, or a string in and a discriminated result out.
 * That is what makes the whole of stage 1 testable in node with no browser and
 * no fake timers.
 *
 * WHY A RESULT TYPE RATHER THAN AN EXCEPTION. There are three outcomes and a
 * caller must not be able to treat them as one. A corrupt save is evidence and
 * must not be overwritten. A save from a newer build is not corrupt at all and
 * gets a different message. A valid save loads. An exception makes ignoring the
 * difference the path of least resistance, which for a game with a 6 to 10 hour
 * arc means losing a run to a `catch` block someone wrote in a hurry.
 * docs/SAVE_SCHEMA.md Part 1 names silent progress loss as the worst possible
 * outcome, so the type system is where that gets prevented.
 *
 * WHY VALIDATE STRUCTURALLY RATHER THAN TRUST THE PARSE. `JSON.parse` returns
 * `any` and TypeScript believes it. The realistic corruption is not a truncated
 * file, which fails at the parse, but a blob with the right shape and a string
 * where a number belongs, which parses cleanly and then produces NaN pool
 * amounts forever. Every field is checked.
 */

import {
  SCHEMA_VERSION,
  type SaveDiagnosticsV2,
  type SaveEnzymesV2,
  type SaveEnvironmentV2,
  type SaveMetaV2,
  type SavePoolsV2,
  type SaveProgressionV2,
  type SaveRngV2,
  type SaveSettingsV2,
  type SaveStatsV2,
  type SaveTimeV2,
  type SaveV2,
} from './schema';

export type DeserializeResult =
  | { readonly kind: 'ok'; readonly save: SaveV2 }
  | { readonly kind: 'corrupt'; readonly reason: string }
  | { readonly kind: 'future'; readonly version: number };

/* ===========================================================================
   SERIALISE
   =========================================================================== */

/**
 * Canonical JSON for a save.
 *
 * The object is REBUILT in a fixed field order rather than handed to
 * `JSON.stringify` as it arrives, so byte stability is a property of this
 * function rather than of every caller that ever constructs a save. Two saves
 * that are equal produce identical strings, which is what makes the fixture
 * comparisons in stage 3 mean anything: a fixture that drifts by key order looks
 * like a schema change and is not one.
 *
 * Floats are left to `JSON.stringify`, which emits the shortest decimal string
 * that parses back to the same float64, exactly as src/sim/hash.ts relies on for
 * the canonical state form. Round tripping a pool amount is therefore exact.
 *
 * Pool, enzyme and settings keys keep their insertion order rather than being
 * sorted. Capture emits pools in pool-registry order, which runs the pathway
 * forward and makes a committed fixture readable, and `JSON.parse` preserves
 * that order for every key act 1 uses.
 */
export function serialize(save: SaveV2): string {
  return JSON.stringify(canonical(save));
}

/** Same bytes, indented. docs/SAVE_SCHEMA.md Part 4: exported saves are plain readable JSON. */
export function serializeReadable(save: SaveV2): string {
  return JSON.stringify(canonical(save), null, 2);
}

function canonical(save: SaveV2): SaveV2 {
  return {
    schemaVersion: SCHEMA_VERSION,
    meta: {
      createdAt: save.meta.createdAt,
      lastSavedAt: save.meta.lastSavedAt,
      buildId: save.meta.buildId,
    },
    time: {
      elapsedGameMs: save.time.elapsedGameMs,
      offlineCreditedMs: save.time.offlineCreditedMs,
      pendingOfflineMs: save.time.pendingOfflineMs,
    },
    rng: {
      algorithm: save.rng.algorithm,
      seed: save.rng.seed,
      state: save.rng.state,
    },
    progression: {
      act: save.progression.act,
      unlocked: save.progression.unlocked.slice(),
      endosymbiont: save.progression.endosymbiont,
      shuttleChoice: save.progression.shuttleChoice,
    },
    pools: { ...save.pools },
    enzymes: copyEnzymes(save.enzymes),
    environment: {
      oxygenLevel: save.environment.oxygenLevel,
      scheduleIndex: save.environment.scheduleIndex,
    },
    stats: {
      totalAtpProduced: save.stats.totalAtpProduced,
      glucoseConsumed: save.stats.glucoseConsumed,
      eventsProcessed: save.stats.eventsProcessed,
      atpSpent: save.stats.atpSpent,
      atpMaintained: save.stats.atpMaintained,
      glucoseTakenUp: save.stats.glucoseTakenUp,
      lactateProduced: save.stats.lactateProduced,
      nadhProduced: save.stats.nadhProduced,
    },
    diagnostics: {
      offlineFallbackCount: save.diagnostics.offlineFallbackCount,
      negativePoolScalingEvents: save.diagnostics.negativePoolScalingEvents,
      scalingCapHits: save.diagnostics.scalingCapHits,
    },
    settings: { ...save.settings },
    snapshot: save.snapshot,
  };
}

function copyEnzymes(enzymes: SaveEnzymesV2): SaveEnzymesV2 {
  const out: Record<string, { level: number; damage: number }> = {};
  for (const id of Object.keys(enzymes)) {
    const enzyme = enzymes[id];
    if (enzyme === undefined) continue;
    out[id] = { level: enzyme.level, damage: enzyme.damage };
  }
  return out;
}

/* ===========================================================================
   DESERIALISE
   =========================================================================== */

export type ParsedSave =
  | { readonly kind: 'ok'; readonly value: Record<string, unknown> }
  | { readonly kind: 'corrupt'; readonly reason: string };

/**
 * JSON in, an object out, with no opinion about what is in it.
 *
 * Exported because the migration chain in migrations.ts has to read the version
 * off a save it cannot yet validate: a version 3 save does not have the version
 * 5 shape and validating it against one would report a schema history as a
 * corruption.
 */
export function parseSave(input: unknown): ParsedSave {
  let value: unknown = input;

  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch (error) {
      return { kind: 'corrupt', reason: `not JSON: ${(error as Error).message}` };
    }
  }

  if (!isRecord(value)) {
    return { kind: 'corrupt', reason: `save must be an object, got ${describe(value)}` };
  }

  return { kind: 'ok', value };
}

/**
 * The version, or null if the field is not a positive integer.
 *
 * docs/SAVE_SCHEMA.md Part 1: "It is the first field read and it is read before
 * anything else is parsed."
 */
export function readSchemaVersion(value: Record<string, unknown>): number | null {
  const version = value['schemaVersion'];
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) return null;
  return version;
}

/**
 * Parse and validate at the CURRENT version. Takes a JSON string, or an
 * already-parsed value so an imported file or a migrated object can be checked
 * through the same door.
 *
 * THE VERSION IS READ FIRST, before anything else is validated, exactly as
 * docs/SAVE_SCHEMA.md Part 1 requires. A save from a newer build is refused on
 * the strength of one integer, with no attempt to interpret fields whose meaning
 * this build does not know.
 */
export function deserialize(input: unknown): DeserializeResult {
  const parsed = parseSave(input);
  if (parsed.kind !== 'ok') return parsed;
  const value = parsed.value;

  const version = readSchemaVersion(value);
  if (version === null) {
    return {
      kind: 'corrupt',
      reason: `schemaVersion must be a positive integer, got ${describe(value['schemaVersion'])}`,
    };
  }

  if (version > SCHEMA_VERSION) {
    return { kind: 'future', version };
  }

  if (version < SCHEMA_VERSION) {
    /**
     * A save older than this build. It is not corrupt, it needs migrating, and
     * migrating is migrations.ts's business rather than this file's: the codec
     * knows one version and the chain knows the history. `parseAndMigrate` runs
     * the chain before it gets here, and it is what storage calls, so a caller
     * only reaches this line by handing an unmigrated old save straight to the
     * codec.
     *
     * Unreachable at version 1, because there is nothing below 1. The branch
     * exists so that the day there is something below the current version, the
     * failure is a sentence rather than a validation error about a field that
     * used to be called something else.
     */
    return {
      kind: 'corrupt',
      reason: `schemaVersion ${version} predates this build and was not migrated first`,
    };
  }

  return validate(value);
}

/**
 * A serialised save whose own `snapshot` field is not null.
 *
 * Matched textually rather than by parsing, because the check is a refusal and
 * not a read: parsing an untrusted nested payload to decide whether to refuse it
 * is more work than refusing it. `canonical` writes the field in one fixed form,
 * so a string this matches was either written by a build that nested snapshots
 * or was edited by hand, and neither is loadable.
 */
const NESTED_SNAPSHOT = /"snapshot"\s*:\s*"/;

function validate(root: Record<string, unknown>): DeserializeResult {
  const meta = section(root, 'meta');
  if (typeof meta === 'string') return corrupt(meta);
  const metaProblem =
    finite(meta, 'meta.createdAt', 'createdAt') ??
    finite(meta, 'meta.lastSavedAt', 'lastSavedAt') ??
    text(meta, 'meta.buildId', 'buildId');
  if (metaProblem !== null) return corrupt(metaProblem);

  const time = section(root, 'time');
  if (typeof time === 'string') return corrupt(time);
  const timeProblem =
    nonNegative(time, 'time.elapsedGameMs', 'elapsedGameMs') ??
    nonNegative(time, 'time.offlineCreditedMs', 'offlineCreditedMs') ??
    nonNegative(time, 'time.pendingOfflineMs', 'pendingOfflineMs');
  if (timeProblem !== null) return corrupt(timeProblem);

  const rng = section(root, 'rng');
  if (typeof rng === 'string') return corrupt(rng);
  const rngProblem =
    text(rng, 'rng.algorithm', 'algorithm') ??
    finite(rng, 'rng.seed', 'seed') ??
    finite(rng, 'rng.state', 'state');
  if (rngProblem !== null) return corrupt(rngProblem);

  const progression = section(root, 'progression');
  if (typeof progression === 'string') return corrupt(progression);
  const progressionProblem =
    /*
     * A POSITIVE INTEGER RATHER THAN MERELY FINITE. UPDATELOGV11.md stage 5.
     *
     * `finite` was correct while nothing read this field. It selects an act now,
     * so 0, -1, 2.5 and NaN are all malformed rather than merely unusual, and
     * they are rejected here alongside every other malformed field rather than
     * reaching a registry lookup that has no answer for them.
     *
     * An act number this build does not HAVE is a different case and is not
     * corruption: the save is well formed and came from a newer build. That gets
     * a refusal rather than a rejection. See src/ui/runtime.ts.
     */
    positiveInteger(progression, 'progression.act', 'act') ??
    stringArray(progression, 'progression.unlocked', 'unlocked') ??
    /*
     * A CLOSED SET RATHER THAN A NULLABLE STRING. Schema version 2.
     *
     * Version 1 had `transitionTaken: boolean` here, which could say that
     * something happened and not which of two things happened. The replacement
     * has three states and every one of them is meaningful, so an unrecognised
     * fourth value is malformed rather than merely unusual and is rejected
     * alongside every other malformed field.
     *
     * `shuttleChoice` beside it stays a nullable string on purpose. Its values
     * are unlock ids and act 3 has not minted them yet, so a closed set here
     * would be this build asserting a list it does not have.
     */
    oneOf(progression, 'progression.endosymbiont', 'endosymbiont', ['kept', 'digested']) ??
    nullableText(progression, 'progression.shuttleChoice', 'shuttleChoice');
  if (progressionProblem !== null) return corrupt(progressionProblem);

  const pools = section(root, 'pools');
  if (typeof pools === 'string') return corrupt(pools);
  for (const id of Object.keys(pools)) {
    const problem = finite(pools, `pools.${id}`, id);
    if (problem !== null) return corrupt(problem);
  }

  const enzymes = section(root, 'enzymes');
  if (typeof enzymes === 'string') return corrupt(enzymes);
  for (const id of Object.keys(enzymes)) {
    const enzyme = section(enzymes, id, `enzymes.${id}`);
    if (typeof enzyme === 'string') return corrupt(enzyme);
    const problem =
      finite(enzyme, `enzymes.${id}.level`, 'level') ??
      finite(enzyme, `enzymes.${id}.damage`, 'damage');
    if (problem !== null) return corrupt(problem);
  }

  const environment = section(root, 'environment');
  if (typeof environment === 'string') return corrupt(environment);
  const environmentProblem =
    finite(environment, 'environment.oxygenLevel', 'oxygenLevel') ??
    finite(environment, 'environment.scheduleIndex', 'scheduleIndex');
  if (environmentProblem !== null) return corrupt(environmentProblem);

  const stats = section(root, 'stats');
  if (typeof stats === 'string') return corrupt(stats);
  const statsProblem =
    finite(stats, 'stats.totalAtpProduced', 'totalAtpProduced') ??
    finite(stats, 'stats.glucoseConsumed', 'glucoseConsumed') ??
    finite(stats, 'stats.eventsProcessed', 'eventsProcessed') ??
    finite(stats, 'stats.atpSpent', 'atpSpent') ??
    finite(stats, 'stats.atpMaintained', 'atpMaintained') ??
    finite(stats, 'stats.glucoseTakenUp', 'glucoseTakenUp') ??
    finite(stats, 'stats.lactateProduced', 'lactateProduced') ??
    finite(stats, 'stats.nadhProduced', 'nadhProduced');
  if (statsProblem !== null) return corrupt(statsProblem);

  const diagnostics = section(root, 'diagnostics');
  if (typeof diagnostics === 'string') return corrupt(diagnostics);
  const diagnosticsProblem =
    finite(diagnostics, 'diagnostics.offlineFallbackCount', 'offlineFallbackCount') ??
    finite(diagnostics, 'diagnostics.negativePoolScalingEvents', 'negativePoolScalingEvents') ??
    finite(diagnostics, 'diagnostics.scalingCapHits', 'scalingCapHits');
  if (diagnosticsProblem !== null) return corrupt(diagnosticsProblem);

  const settings = section(root, 'settings');
  if (typeof settings === 'string') return corrupt(settings);
  for (const key of Object.keys(settings)) {
    const value = settings[key];
    const kind = typeof value;
    if (kind !== 'boolean' && kind !== 'string' && !(kind === 'number' && Number.isFinite(value))) {
      return corrupt(`settings.${key} must be a boolean, a finite number or a string, got ${describe(value)}`);
    }
  }

  /*
   * THE SNAPSHOT, and the one structural rule it carries. Schema version 2.
   *
   * It is a serialised save rather than a nested object, so this layer checks
   * only that it is a string or null. What is inside it is checked when it is
   * used, by `parseAndMigrate`, exactly as a save from disk is, which is what
   * lets a snapshot taken at an older schema version migrate on the way out.
   *
   * BOUNDED AT ONE LEVEL, and that IS checked here, cheaply and without parsing.
   * A snapshot is taken before the transition, when this field is null, so its
   * payload's own snapshot is always null. A save carrying a snapshot that
   * carries a snapshot is a bug in whatever wrote it, and it grows without
   * limit, so it is refused rather than loaded.
   */
  const snapshotProblem = nullableText(root, 'snapshot', 'snapshot');
  if (snapshotProblem !== null) return corrupt(snapshotProblem);
  const snapshotText = root['snapshot'];
  if (typeof snapshotText === 'string' && NESTED_SNAPSHOT.test(snapshotText)) {
    return corrupt('snapshot contains a snapshot, which is never written and cannot be loaded');
  }

  /**
   * Rebuilt rather than cast. The validated value is a `Record<string, unknown>`
   * that happens to have passed every check, and handing it back as a `SaveV2`
   * would hand the caller a reference to the parse result with every extra key a
   * hostile file put in it still attached. `canonical` drops those and freezes
   * nothing the caller did not ask for.
   */
  return {
    kind: 'ok',
    save: canonical({
      schemaVersion: SCHEMA_VERSION,
      meta: meta as unknown as SaveMetaV2,
      time: time as unknown as SaveTimeV2,
      rng: rng as unknown as SaveRngV2,
      progression: progression as unknown as SaveProgressionV2,
      pools: pools as unknown as SavePoolsV2,
      enzymes: enzymes as unknown as SaveEnzymesV2,
      environment: environment as unknown as SaveEnvironmentV2,
      stats: stats as unknown as SaveStatsV2,
      diagnostics: diagnostics as unknown as SaveDiagnosticsV2,
      settings: settings as unknown as SaveSettingsV2,
      snapshot: root['snapshot'] as string | null,
    }),
  };
}

/* ===========================================================================
   THE CHECKS

   Each returns null when the field is fine and a sentence naming the path when
   it is not. A reason a player can paste into a bug report is worth more than a
   boolean, and it is the difference between "save corrupt" and "pools.nad is a
   string".
   =========================================================================== */

function corrupt(reason: string): DeserializeResult {
  return { kind: 'corrupt', reason };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The named object, or a sentence saying what was there instead. */
function section(
  host: Record<string, unknown>,
  key: string,
  path: string = key,
): Record<string, unknown> | string {
  const value = host[key];
  if (value === undefined) return `${path} is missing`;
  if (!isRecord(value)) return `${path} must be an object, got ${describe(value)}`;
  return value;
}

function finite(host: Record<string, unknown>, path: string, key: string): string | null {
  const value = host[key];
  if (value === undefined) return `${path} is missing`;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return `${path} must be a finite number, got ${describe(value)}`;
  }
  return null;
}

/**
 * A whole number, one or greater. docs/SAVE_SCHEMA.md documents
 * `progression.act` as 1 to 4.
 */
function positiveInteger(host: Record<string, unknown>, path: string, key: string): string | null {
  const problem = finite(host, path, key);
  if (problem !== null) return problem;
  const value = host[key] as number;
  if (!Number.isInteger(value) || value < 1) {
    return `${path} must be a whole number of 1 or more, got ${describe(host[key])}`;
  }
  return null;
}

function nonNegative(host: Record<string, unknown>, path: string, key: string): string | null {
  const problem = finite(host, path, key);
  if (problem !== null) return problem;
  if ((host[key] as number) < 0) return `${path} must not be negative, got ${describe(host[key])}`;
  return null;
}

function text(host: Record<string, unknown>, path: string, key: string): string | null {
  const value = host[key];
  if (value === undefined) return `${path} is missing`;
  if (typeof value !== 'string') return `${path} must be a string, got ${describe(value)}`;
  return null;
}

function nullableText(host: Record<string, unknown>, path: string, key: string): string | null {
  const value = host[key];
  if (value === undefined) return `${path} is missing`;
  if (value !== null && typeof value !== 'string') {
    return `${path} must be a string or null, got ${describe(value)}`;
  }
  return null;
}

/**
 * A field that is null or one of a named set of strings.
 *
 * The set is passed in rather than inferred, so adding a state to a union in
 * schema.ts without adding it here fails a save that is legal by the type, which
 * is the direction this should fail in.
 */
function oneOf(
  host: Record<string, unknown>,
  path: string,
  key: string,
  allowed: readonly string[],
): string | null {
  const value = host[key];
  if (value === undefined) return `${path} is missing`;
  if (value === null) return null;
  if (typeof value !== 'string') {
    return `${path} must be a string or null, got ${describe(value)}`;
  }
  if (!allowed.includes(value)) {
    return `${path} must be null or one of ${allowed.join(', ')}, got ${JSON.stringify(value)}`;
  }
  return null;
}

/*
 * A `boolean` check stood here until 2026-08-20 and is gone rather than
 * silenced. Schema version 2 replaced `progression.transitionTaken`, which was
 * the only boolean field in the shape, so the check had no caller. Settings are
 * an open bag validated inline and do not use it. It comes back when a field
 * needs it, and a disabled-lint stub in the meantime would be a claim that one
 * does.
 */

function stringArray(host: Record<string, unknown>, path: string, key: string): string | null {
  const value = host[key];
  if (value === undefined) return `${path} is missing`;
  if (!Array.isArray(value)) return `${path} must be an array, got ${describe(value)}`;
  for (let i = 0; i < value.length; i += 1) {
    if (typeof value[i] !== 'string') {
      return `${path}[${i}] must be a string, got ${describe(value[i])}`;
    }
  }
  return null;
}

/** Short, safe description of whatever was found. Never dumps a whole save into a message. */
function describe(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return `an array of ${value.length}`;
  const kind = typeof value;
  if (kind === 'number' || kind === 'boolean') return `${kind} ${String(value)}`;
  if (kind === 'string') return `a string`;
  return `a ${kind}`;
}
