/**
 * The migration chain. docs/SAVE_SCHEMA.md Part 1.
 *
 * ---------------------------------------------------------------------------
 * THE THREE PROPERTIES, AND WHY THE THIRD IS THE ONE THAT WILL BE ATTACKED
 * ---------------------------------------------------------------------------
 *
 * PURE. No side effects, no reads outside the passed object. A migration that
 * reads a clock, a global or the store produces a different result depending on
 * when it runs, and the whole point of the chain is that a version 3 save
 * becomes the same version 7 save on every machine that ever loads it.
 *
 * TOTAL. Handles every valid save at its input version, including ones with
 * missing optional fields. A migration that throws on a save some player
 * actually has is a migration that permanently strands that player, and there is
 * no support channel, no backend and no way to ship them a fix for their file.
 *
 * NEVER EDITED AFTER RELEASE. This is the one a future maintainer will want to
 * break, and the reason it exists is that players may have already run it. A
 * released migration that was wrong has already produced wrong data on real
 * machines, and editing it only changes what happens to the players who have not
 * loaded yet, which splits the population into two incompatible groups with no
 * field in the save saying which one anybody is in. The fix for a wrong
 * migration is a NEW migration that corrects the damage.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS FILE EXISTS AT VERSION 1, WITH NOTHING IN IT
 * ---------------------------------------------------------------------------
 *
 * CLAUDE.md hard rule 7 forbids bumping the schema version without a migration
 * and a fixture test from the previous version. At version 1 there is no
 * previous version, so the chain has nothing to do. The first time it does have
 * something to do, it will be running on a stranger's machine against a save
 * that cannot be recreated and that represents hours nobody can give back.
 *
 * Build it and prove it while nothing is at stake. The runner is what has to be
 * correct, and the runner can be proven correct today against fabricated
 * migrations that never ship.
 */

import {
  deserialize,
  parseSave,
  readSchemaVersion,
  type DeserializeResult,
} from './codec';
import { SCHEMA_VERSION } from './schema';

/** A save at some version, before it is known to have the current shape. */
export type UnversionedSave = Readonly<Record<string, unknown>>;

export interface Migration {
  /** The version this migration reads. */
  readonly from: number;
  /** Always `from + 1`. The chain moves one step at a time so every step is testable alone. */
  readonly to: number;
  /** Pure. Returns a new object; never mutates its argument. */
  readonly migrate: (save: UnversionedSave) => UnversionedSave;
}

/**
 * The chain, in order, one entry per version step.
 *
 * EMPTY AT VERSION 1 and that is not an oversight. Adding an entry here is half
 * of what CLAUDE.md hard rule 7 requires; the other half is a committed fixture
 * at the input version, and `schemaVersionGate.test.ts` fails the suite if
 * either is missing.
 */
export const MIGRATIONS: readonly Migration[] = [];

export type MigrationOutcome =
  | { readonly kind: 'ok'; readonly save: UnversionedSave; readonly applied: number }
  /** No migration exists for a step the chain needs. Loud, per the spec. */
  | { readonly kind: 'gap'; readonly at: number; readonly target: number }
  /** The save is newer than this build. Nothing is migrated downward, ever. */
  | { readonly kind: 'future'; readonly version: number };

/**
 * Apply every migration from `from` up to `target`.
 *
 * A save already at the target passes through UNTOUCHED, returned as the same
 * reference it arrived as, because the honest statement about a no-op is that
 * nothing happened rather than that a copy was made.
 *
 * A gap fails loudly rather than skipping. Skipping a version means running a
 * migration against a shape it was not written for, which produces a save that
 * validates and is wrong, and a save that validates and is wrong is worse than
 * one that refuses to load.
 *
 * `chain` is a parameter so the runner can be tested against fabricated
 * migrations. It defaults to the real chain and no shipping caller passes it.
 */
export function runMigrations(
  save: UnversionedSave,
  from: number,
  target: number = SCHEMA_VERSION,
  chain: readonly Migration[] = MIGRATIONS,
): MigrationOutcome {
  if (from > target) return { kind: 'future', version: from };
  if (from === target) return { kind: 'ok', save, applied: 0 };

  let current = save;
  let version = from;
  let applied = 0;

  while (version < target) {
    const step = chain.find((migration) => migration.from === version);
    if (step === undefined) return { kind: 'gap', at: version, target };
    if (step.to !== version + 1) {
      return { kind: 'gap', at: version, target };
    }
    current = step.migrate(current);
    version = step.to;
    applied += 1;
  }

  return { kind: 'ok', save: current, applied };
}

/**
 * The whole load-side pipeline: parse, read the version, migrate, validate.
 *
 * This is what storage calls, so the chain sits on the real load path rather
 * than beside it. At version 1 the migration step is a no-op and the behaviour
 * is identical to calling `deserialize` directly, which is exactly the point:
 * the day the chain has work to do, it is already wired in and already tested
 * rather than being added under pressure alongside the first real migration.
 */
export function parseAndMigrate(
  input: unknown,
  chain: readonly Migration[] = MIGRATIONS,
): DeserializeResult {
  const parsed = parseSave(input);
  if (parsed.kind !== 'ok') return parsed;

  const version = readSchemaVersion(parsed.value);
  if (version === null) {
    return { kind: 'corrupt', reason: 'schemaVersion must be a positive integer' };
  }
  if (version > SCHEMA_VERSION) return { kind: 'future', version };
  if (version === SCHEMA_VERSION) return deserialize(parsed.value);

  const migrated = runMigrations(parsed.value, version, SCHEMA_VERSION, chain);
  if (migrated.kind === 'future') return { kind: 'future', version: migrated.version };
  if (migrated.kind === 'gap') {
    return {
      kind: 'corrupt',
      reason: `no migration from schema version ${migrated.at} toward ${migrated.target}`,
    };
  }

  /**
   * The migrated save is validated by the same validator a fresh save goes
   * through. A migration that produces something the current build cannot read
   * has to fail here rather than three screens later, and reusing the validator
   * is what makes that automatic instead of a second set of rules that drifts.
   */
  return deserialize(migrated.save);
}
