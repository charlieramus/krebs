/**
 * The migration runner, proven against fabricated migrations.
 *
 * The chain is empty at version 1 and will be for as long as version 1 is
 * current, so there is nothing real to run. The RUNNER is what has to be
 * correct, and the runner can be proven correct today: order, composition, gap
 * detection, pass-through and non-mutation are all properties of the runner
 * rather than of any particular migration.
 *
 * The migrations below are TEST DOUBLES and they never ship. That distinction
 * matters: docs/SAVE_SCHEMA.md Part 1 says the fixture set is the regression
 * suite for the entire save history, so a fabricated version 0 FIXTURE would
 * pollute exactly the thing whose value is being real. A fabricated migration
 * inside a test file pollutes nothing, because nothing outside this file can see
 * it.
 */

import { describe, expect, it } from 'vitest';

import { deserialize, serialize } from '../codec';
import { MIGRATIONS, parseAndMigrate, runMigrations, type Migration } from '../migrations';
import { SCHEMA_VERSION } from '../schema';
import v1Fixture from './fixtures/v1.json';

/** A three-link chain that exists only here. 1 to 2 to 3, each leaving a mark. */
const DOUBLES: readonly Migration[] = [
  {
    from: 1,
    to: 2,
    migrate: (save) => ({ ...save, schemaVersion: 2, trail: [...asTrail(save), 'one'] }),
  },
  {
    from: 2,
    to: 3,
    migrate: (save) => ({ ...save, schemaVersion: 3, trail: [...asTrail(save), 'two'] }),
  },
];

function asTrail(save: Readonly<Record<string, unknown>>): readonly string[] {
  const trail = save['trail'];
  return Array.isArray(trail) ? (trail as string[]) : [];
}

describe('migration runner', () => {
  it('applies every step in order and composes them', () => {
    const outcome = runMigrations({ schemaVersion: 1, value: 'x' }, 1, 3, DOUBLES);
    expect(outcome.kind).toBe('ok');
    if (outcome.kind !== 'ok') return;

    expect(outcome.applied).toBe(2);
    expect(outcome.save['schemaVersion']).toBe(3);
    // Order, not just presence. A runner that applied 2-to-3 first would still
    // arrive at version 3 and would have run the wrong transform on the wrong shape.
    expect(outcome.save['trail']).toEqual(['one', 'two']);
    expect(outcome.save['value']).toBe('x');
  });

  it('stops at the target rather than running the whole chain', () => {
    const outcome = runMigrations({ schemaVersion: 1 }, 1, 2, DOUBLES);
    expect(outcome.kind).toBe('ok');
    if (outcome.kind !== 'ok') return;
    expect(outcome.applied).toBe(1);
    expect(outcome.save['trail']).toEqual(['one']);
  });

  it('passes a save already at the target through untouched', () => {
    const save = { schemaVersion: 3, value: 'x' };
    const outcome = runMigrations(save, 3, 3, DOUBLES);
    expect(outcome.kind).toBe('ok');
    if (outcome.kind !== 'ok') return;
    expect(outcome.applied).toBe(0);
    // The same reference. A no-op that returns a copy is claiming something happened.
    expect(outcome.save).toBe(save);
  });

  it('fails loudly on a gap rather than skipping the missing step', () => {
    const gapped: readonly Migration[] = [DOUBLES[0] as Migration]; // 1 to 2 only
    const outcome = runMigrations({ schemaVersion: 1 }, 1, 3, gapped);

    expect(outcome.kind).toBe('gap');
    if (outcome.kind !== 'gap') return;
    expect(outcome.at).toBe(2);
    expect(outcome.target).toBe(3);
  });

  it('fails on a chain whose step does not advance exactly one version', () => {
    const jumping: readonly Migration[] = [{ from: 1, to: 3, migrate: (save) => save }];
    expect(runMigrations({ schemaVersion: 1 }, 1, 3, jumping).kind).toBe('gap');
  });

  it('does not mutate the object it is given', () => {
    const input: Record<string, unknown> = { schemaVersion: 1, value: 'x' };
    const before = JSON.stringify(input);

    runMigrations(input, 1, 3, DOUBLES);

    expect(JSON.stringify(input)).toBe(before);
    expect('trail' in input).toBe(false);
  });

  it('refuses to migrate downward from a newer version', () => {
    const outcome = runMigrations({ schemaVersion: 9 }, 9, 3, DOUBLES);
    expect(outcome.kind).toBe('future');
    if (outcome.kind !== 'future') return;
    expect(outcome.version).toBe(9);
  });

  it('holds exactly one step per version, with no gaps and nothing past the current version', () => {
    /*
     * This test asserted `MIGRATIONS` was EMPTY from V4 to V14, which was the
     * right assertion while version 1 was current and became a wrong one the
     * moment version 2 shipped. Rewritten on 2026-08-20 into the property that
     * was always the point: the chain covers every step from 1 to
     * SCHEMA_VERSION exactly once, in order, and runs past neither end.
     *
     * Stated that way it never needs editing again, which is the difference
     * between a test about the current version and a test about the chain.
     */
    expect(MIGRATIONS.length).toBe(SCHEMA_VERSION - 1);
    for (let from = 1; from < SCHEMA_VERSION; from += 1) {
      const steps = MIGRATIONS.filter((m) => m.from === from);
      expect(steps.length, `exactly one migration from version ${from}`).toBe(1);
      expect(steps[0]?.to).toBe(from + 1);
    }
  });
});

describe('parseAndMigrate, the load-side pipeline', () => {
  it('validates a current-version save exactly as deserialize does', () => {
    /*
     * `v1Fixture` is no longer at the current version, so it is migrated first
     * and the CURRENT-version save is what comes out. Before 2026-08-20 the two
     * were the same object and this test could not tell the difference.
     */
    const migrated = parseAndMigrate(JSON.stringify(v1Fixture));
    expect(migrated.kind).toBe('ok');
    if (migrated.kind !== 'ok') return;
    const text = serialize(migrated.save);
    expect(parseAndMigrate(text)).toEqual(deserialize(text));
  });

  it('reports a future version without touching the chain', () => {
    const future = { ...(v1Fixture as Record<string, unknown>), schemaVersion: SCHEMA_VERSION + 1 };
    const outcome = parseAndMigrate(JSON.stringify(future));
    expect(outcome.kind).toBe('future');
  });

  it('reports a gap as a corruption rather than skipping the step', () => {
    /*
     * A save one version old against a chain that has nothing for it.
     *
     * REACHABLE THROUGH THE REAL ENTRY POINT SINCE 2026-08-20, which it was not
     * before. At version 1 this branch could only be forced by calling the
     * runner directly, because a version 1 save was already at target and the
     * comment here said so. Version 2 is the first time a save can genuinely be
     * behind, so the injected empty chain now exercises the gap the way a
     * missing migration actually would.
     */
    const old = { ...(v1Fixture as Record<string, unknown>), schemaVersion: 1 };
    const outcome = parseAndMigrate(JSON.stringify(old), []);
    expect(outcome.kind).toBe('corrupt');
    if (outcome.kind === 'corrupt') expect(outcome.reason).toContain('1');

    // And directly, so the runner's own branch is covered independently of what
    // the current version happens to be.
    const gapped = runMigrations({ schemaVersion: 1 }, 1, 2, []);
    expect(gapped.kind).toBe('gap');
  });

  it('rejects a non-JSON blob before it looks for a version', () => {
    expect(parseAndMigrate('nonsense').kind).toBe('corrupt');
    expect(parseAndMigrate(JSON.stringify({ schemaVersion: 'one' })).kind).toBe('corrupt');
  });
});

/*
 * `deserializeOk` stood here and had one caller, in the current-version test
 * above, which now goes through `parseAndMigrate` because the version 1 fixture
 * is no longer at the current version. Removed rather than kept unused.
 */
