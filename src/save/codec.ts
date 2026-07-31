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
  type SaveDiagnosticsV1,
  type SaveEnzymesV1,
  type SaveEnvironmentV1,
  type SaveMetaV1,
  type SavePoolsV1,
  type SaveProgressionV1,
  type SaveRngV1,
  type SaveSettingsV1,
  type SaveStatsV1,
  type SaveTimeV1,
  type SaveV1,
} from './schema';

export type DeserializeResult =
  | { readonly kind: 'ok'; readonly save: SaveV1 }
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
export function serialize(save: SaveV1): string {
  return JSON.stringify(canonical(save));
}

/** Same bytes, indented. docs/SAVE_SCHEMA.md Part 4: exported saves are plain readable JSON. */
export function serializeReadable(save: SaveV1): string {
  return JSON.stringify(canonical(save), null, 2);
}

function canonical(save: SaveV1): SaveV1 {
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
      transitionTaken: save.progression.transitionTaken,
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
  };
}

function copyEnzymes(enzymes: SaveEnzymesV1): SaveEnzymesV1 {
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

/**
 * Parse and validate. Takes a JSON string, or an already-parsed value so an
 * imported file or a migrated object can be checked through the same door.
 *
 * THE VERSION IS READ FIRST, before anything else is validated, exactly as
 * docs/SAVE_SCHEMA.md Part 1 requires. A save from a newer build is refused on
 * the strength of one integer, with no attempt to interpret fields whose meaning
 * this build does not know.
 */
export function deserialize(input: unknown): DeserializeResult {
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

  const version = value['schemaVersion'];
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    return {
      kind: 'corrupt',
      reason: `schemaVersion must be a positive integer, got ${describe(version)}`,
    };
  }

  if (version > SCHEMA_VERSION) {
    return { kind: 'future', version };
  }

  if (version < SCHEMA_VERSION) {
    /**
     * A save older than this build. It is not corrupt, it needs migrating, and
     * migrating is stage 3's chain rather than this file's business: the codec
     * knows one version and the chain knows the history. `loadSave` runs the
     * chain before it gets here, so a caller only reaches this line by handing
     * an unmigrated old save straight to the codec.
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
    finite(progression, 'progression.act', 'act') ??
    stringArray(progression, 'progression.unlocked', 'unlocked') ??
    boolean(progression, 'progression.transitionTaken', 'transitionTaken') ??
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

  /**
   * Rebuilt rather than cast. The validated value is a `Record<string, unknown>`
   * that happens to have passed every check, and handing it back as a `SaveV1`
   * would hand the caller a reference to the parse result with every extra key a
   * hostile file put in it still attached. `canonical` drops those and freezes
   * nothing the caller did not ask for.
   */
  return {
    kind: 'ok',
    save: canonical({
      schemaVersion: SCHEMA_VERSION,
      meta: meta as unknown as SaveMetaV1,
      time: time as unknown as SaveTimeV1,
      rng: rng as unknown as SaveRngV1,
      progression: progression as unknown as SaveProgressionV1,
      pools: pools as unknown as SavePoolsV1,
      enzymes: enzymes as unknown as SaveEnzymesV1,
      environment: environment as unknown as SaveEnvironmentV1,
      stats: stats as unknown as SaveStatsV1,
      diagnostics: diagnostics as unknown as SaveDiagnosticsV1,
      settings: settings as unknown as SaveSettingsV1,
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

function boolean(host: Record<string, unknown>, path: string, key: string): string | null {
  const value = host[key];
  if (value === undefined) return `${path} is missing`;
  if (typeof value !== 'boolean') return `${path} must be a boolean, got ${describe(value)}`;
  return null;
}

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
