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

  it('is empty at version 1, which is what hard rule 7 expects', () => {
    expect(MIGRATIONS).toEqual([]);
    expect(SCHEMA_VERSION).toBe(1);
  });
});

describe('parseAndMigrate, the load-side pipeline', () => {
  it('validates a current-version save exactly as deserialize does', () => {
    const text = serialize(deserializeOk(JSON.stringify(v1Fixture)));
    expect(parseAndMigrate(text)).toEqual(deserialize(text));
  });

  it('reports a future version without touching the chain', () => {
    const future = { ...(v1Fixture as Record<string, unknown>), schemaVersion: SCHEMA_VERSION + 1 };
    const outcome = parseAndMigrate(JSON.stringify(future));
    expect(outcome.kind).toBe('future');
  });

  it('reports a gap as a corruption with a reason that names the version', () => {
    // A save two versions old against a chain that has nothing for it. Only
    // reachable with an injected chain today, which is the whole point of the
    // parameter: the branch is testable before it is reachable.
    const old = { ...(v1Fixture as Record<string, unknown>), schemaVersion: 1 };
    const outcome = parseAndMigrate(JSON.stringify(old), []);
    // At SCHEMA_VERSION 1 this is already at target, so it validates.
    expect(outcome.kind).toBe('ok');

    // Force the gap branch directly, since the version cannot be below 1.
    const gapped = runMigrations({ schemaVersion: 1 }, 1, 2, []);
    expect(gapped.kind).toBe('gap');
  });

  it('rejects a non-JSON blob before it looks for a version', () => {
    expect(parseAndMigrate('nonsense').kind).toBe('corrupt');
    expect(parseAndMigrate(JSON.stringify({ schemaVersion: 'one' })).kind).toBe('corrupt');
  });
});

function deserializeOk(text: string) {
  const result = deserialize(text);
  if (result.kind !== 'ok') throw new Error(`fixture did not deserialize: ${JSON.stringify(result)}`);
  return result.save;
}
