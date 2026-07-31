/**
 * CLAUDE.md HARD RULE 7, AS MECHANISM.
 *
 * "Never bump the save schema version without adding a migration and a test that
 * loads a fixture from the previous version."
 *
 * Of the seven hard rules, this is the only one with no other enforcement. Rules
 * 4 and 5 are the ESLint determinism guard. Rule 1 is the V3 `Needs source`
 * release gate, which scans the emitted production bundle. Rule 6 is a constant
 * nobody can move without the whole suite noticing. Rule 7 was, until this file,
 * a sentence in a document that review had to remember.
 *
 * It is now a test. Bump SCHEMA_VERSION without a migration and a committed
 * fixture and the suite fails, with a message that says which of the two is
 * missing and where to put it.
 *
 * The failure messages in here are written for someone who has just bumped the
 * version and does not know why the build broke. That is the entire audience.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { deserialize, serialize } from '../codec';
import { MIGRATIONS, parseAndMigrate } from '../migrations';
import { SCHEMA_VERSION } from '../schema';
import { captureAct1, restoreAct1 } from '../../content/act1/save';

const FIXTURE_DIR = fileURLToPath(new URL('./fixtures/', import.meta.url));

function fixturePath(version: number): string {
  return `${FIXTURE_DIR}v${version}.json`;
}

describe('hard rule 7, mechanically', () => {
  it('has a committed fixture for every version from 1 to the current one', () => {
    for (let version = 1; version <= SCHEMA_VERSION; version += 1) {
      expect(
        existsSync(fixturePath(version)),
        `CLAUDE.md hard rule 7: no committed fixture for schema version ${version}.\n` +
          `Expected src/save/__tests__/fixtures/v${version}.json.\n` +
          `A fixture at version N can only be captured while version N is what the code produces.\n` +
          `If you have just bumped SCHEMA_VERSION, the fixture for the PREVIOUS version had to be\n` +
          `committed before the bump. See src/save/__tests__/fixtures/README.md.`,
      ).toBe(true);
    }
  });

  it('has a migration for every step between consecutive versions', () => {
    for (let from = 1; from < SCHEMA_VERSION; from += 1) {
      const step = MIGRATIONS.find((migration) => migration.from === from);
      expect(
        step !== undefined,
        `CLAUDE.md hard rule 7: no migration from schema version ${from} to ${from + 1}.\n` +
          `Add one to MIGRATIONS in src/save/migrations.ts. It must be pure, total, and\n` +
          `never edited after release.`,
      ).toBe(true);
      if (step === undefined) continue;
      expect(
        step.to,
        `Migration from version ${from} must produce version ${from + 1}, not ${step.to}.\n` +
          `The chain moves one step at a time so every step is testable alone.`,
      ).toBe(from + 1);
    }
  });

  it('has no migration for a step that does not exist', () => {
    for (const migration of MIGRATIONS) {
      expect(
        migration.from >= 1 && migration.to <= SCHEMA_VERSION,
        `Migration ${migration.from} to ${migration.to} runs past SCHEMA_VERSION ${SCHEMA_VERSION}.\n` +
          `A migration toward a version that does not exist cannot have been tested against one.`,
      ).toBe(true);
    }
  });

  it('loads every fixture through the chain to the current version', () => {
    for (let version = 1; version <= SCHEMA_VERSION; version += 1) {
      const path = fixturePath(version);
      if (!existsSync(path)) continue; // the first test already failed on this
      const text = readFileSync(path, 'utf8');

      const outcome = parseAndMigrate(text);
      expect(
        outcome.kind,
        `The version ${version} fixture does not load through the migration chain.\n` +
          `${outcome.kind === 'corrupt' ? outcome.reason : outcome.kind}\n` +
          `The fixture is the evidence and the code is the suspect. Do not regenerate it.`,
      ).toBe('ok');
      if (outcome.kind !== 'ok') continue;

      expect(outcome.save.schemaVersion).toBe(SCHEMA_VERSION);
    }
  });

  it('produces from every fixture a state that passes the same validation a fresh save does', () => {
    for (let version = 1; version <= SCHEMA_VERSION; version += 1) {
      const path = fixturePath(version);
      if (!existsSync(path)) continue;

      const outcome = parseAndMigrate(readFileSync(path, 'utf8'));
      expect(outcome.kind).toBe('ok');
      if (outcome.kind !== 'ok') continue;

      const restored = restoreAct1(outcome.save);
      expect(
        restored.kind,
        `The version ${version} fixture migrates but does not restore into a running act 1.`,
      ).toBe('ok');
      if (restored.kind !== 'ok') continue;

      // Re-captured and re-validated through the same door a fresh save goes
      // through. A migration that produces something only the loader tolerates
      // has to fail here rather than three screens later.
      const recaptured = captureAct1(
        restored.restored.state,
        restored.restored.meter,
        restored.restored.unlocked,
        restored.restored.settings,
        { meta: outcome.save.meta, carried: restored.restored.carried },
      );
      expect(deserialize(serialize(recaptured)).kind).toBe('ok');
    }
  });

  it('carries no fixture for a version that has not shipped', () => {
    const strays = readdirSync(FIXTURE_DIR)
      .filter((name) => /^v\d+\.json$/.test(name))
      .map((name) => Number(name.slice(1, -5)))
      .filter((version) => version > SCHEMA_VERSION);

    expect(
      strays,
      `Fixtures exist for versions this build does not produce: ${strays.join(', ')}.\n` +
        `A fixture for a version that never shipped is a fabricated predecessor, which\n` +
        `pollutes the one thing the fixture set is for. See fixtures/README.md.`,
    ).toEqual([]);
  });
});

describe('the version 1 fixture, specifically', () => {
  /**
   * Read inside each test rather than at module scope. A throw at module scope
   * aborts the whole file, which would hide the two tests above whose failure
   * messages are the ones written for someone who has just bumped the version.
   * The gate has to report the rule, not the first symptom of breaking it.
   */
  function v1() {
    const outcome = parseAndMigrate(readFileSync(fixturePath(1), 'utf8'));
    if (outcome.kind !== 'ok') throw new Error('the version 1 fixture does not load');
    return outcome.save;
  }

  it('is worth migrating: it has been somewhere', () => {
    const save = v1();
    // The properties the fixture was generated to have. If a future edit to the
    // generator produces something thinner, this is where it is noticed.
    expect(save.time.elapsedGameMs).toBeGreaterThan(0);
    expect(save.stats.totalAtpProduced).toBeGreaterThan(0);
    expect(save.progression.unlocked.length).toBeGreaterThan(0);
    expect(save.pools['lactate']).toBeGreaterThan(0);
    expect(save.pools['glucose_env']).toBeLessThan(80000);
  });

  it('has a PRNG state that is not the seed, which is the point of it', () => {
    const save = v1();
    // Act 1 consumes no random numbers, so a real run leaves state === seed and
    // a loader that rebuilt the generator from the seed alone would look
    // correct. The fixture generator draws from the stream for exactly this
    // reason, and it is disclosed in fixtures/README.md.
    expect(save.rng.state).not.toBe(save.rng.seed);
    expect(save.rng.algorithm).toBe('mulberry32');
  });

  it('is byte-stable through a round trip', () => {
    const save = v1();
    // The fixture on disk is what `serializeReadable` produced, so the compact
    // form has to survive parse and re-serialise unchanged or fixture
    // comparisons in a future migration test will drift.
    expect(serialize(save)).toBe(serialize(deserializeOk(serialize(save))));
  });
});

function deserializeOk(text: string) {
  const result = deserialize(text);
  if (result.kind !== 'ok') throw new Error(`did not deserialize: ${JSON.stringify(result)}`);
  return result.save;
}
