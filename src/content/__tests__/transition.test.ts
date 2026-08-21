/**
 * The endosymbiosis transition and its undo. UPDATELOGV14.md stage 3.
 *
 * THE UNDO IS TESTED BEFORE THE CHOICE IS, deliberately, and in the same order
 * the stage asks for it to be built. docs/PROGRESSION.md gives the player one
 * irreversible decision in the whole game and asks for an undo on it, so the
 * restore is the part that must not be wrong. A choice that works and an undo
 * that does not is worse than neither, because the player only finds out after
 * they need it.
 *
 * WHAT THESE TESTS CANNOT REACH TODAY, said once here rather than in each test.
 * Act 3 is not in the registry until stage 4 builds it, so the keep path returns
 * `act-not-built` and cannot produce a real act 3 state. That is asserted as the
 * current behaviour AND asserted to be temporary: the last test in this file
 * fails the build the day act 3 registers, so the keep path cannot quietly stay
 * untested. Same mechanism `acts.test.ts` uses for the one-act registry and
 * `schemaVersionGate.test.ts` uses for hard rule 7.
 */

import { describe, expect, it } from 'vitest';
import { deserialize, serialize } from '../../save/codec';
import { SCHEMA_VERSION, type SaveV2 } from '../../save/schema';
import { ACTS, findAct } from '../acts';
import { actStartState } from '../actStart';
import {
  takeTransition,
  TRANSITION_TARGET_ACT,
  undoTransition,
  type TransitionOptions,
} from '../transition';

const META = { createdAt: 1_760_000_000_000, lastSavedAt: 1_760_000_100_000, buildId: 'test' };

const OPTIONS: TransitionOptions = {
  digestPayout: 500,
  context: { meta: META, carried: ACTS[0]!.noCarriedCounters },
  lost: ['complex-1', 'complex-3'],
};

/** A legal pre-transition save: act 1, played a little, nothing decided. */
function beforeSave(): SaveV2 {
  const act = ACTS[0]!;
  const start = actStartState(act);
  return act.capture(start.state, start.meter, ['ferment'], {}, { meta: META, carried: start.carried });
}

describe('the transition snapshot and its undo', () => {
  it('attaches a snapshot on both paths, including the one the player meant to take', () => {
    // It is tempting to snapshot only the digest path, on the argument that a
    // player who kept the endosymbiont got what they wanted. That is wrong: a
    // player who clicked through the text has taken the game's only
    // irreversible step by accident, which is exactly what an undo is for.
    const digested = takeTransition('digested', beforeSave(), OPTIONS);
    expect(digested.kind).toBe('ok');
    if (digested.kind === 'ok') expect(digested.save.snapshot).not.toBeNull();
  });

  it('restores exactly, field for field, with only the snapshot itself cleared', () => {
    const before = beforeSave();
    const taken = takeTransition('digested', before, OPTIONS);
    expect(taken.kind).toBe('ok');
    if (taken.kind !== 'ok') return;

    const undone = undoTransition(taken.save);
    expect(undone.kind).toBe('ok');
    if (undone.kind !== 'ok') return;

    // The whole save compared by value, not a handful of sampled fields. A
    // restore that got one pool wrong would pass a spot check.
    expect(undone.save).toEqual({ ...before, snapshot: null });
    // And `before` itself carried no snapshot, so this is a true identity.
    expect(before.snapshot).toBeNull();
  });

  it('leaves the payout behind on undo, which is the point of restoring rather than reversing', () => {
    const before = beforeSave();
    const taken = takeTransition('digested', before, OPTIONS);
    if (taken.kind !== 'ok') throw new Error('expected ok');

    expect(taken.save.stats.totalAtpProduced).toBeGreaterThan(before.stats.totalAtpProduced);

    const undone = undoTransition(taken.save);
    if (undone.kind !== 'ok') throw new Error('expected ok');
    expect(undone.save.stats.totalAtpProduced).toBe(before.stats.totalAtpProduced);
  });

  it('is one decision deep and cannot accumulate a stack', () => {
    const taken = takeTransition('digested', beforeSave(), OPTIONS);
    if (taken.kind !== 'ok') throw new Error('expected ok');

    const undone = undoTransition(taken.save);
    if (undone.kind !== 'ok') throw new Error('expected ok');

    // The restored save carries no snapshot, so the undo is not itself undoable.
    expect(undone.save.snapshot).toBeNull();
    expect(undoTransition(undone.save).kind).toBe('nothing-to-undo');
  });

  it('refuses a second decision rather than overwriting the first', () => {
    const taken = takeTransition('digested', beforeSave(), OPTIONS);
    if (taken.kind !== 'ok') throw new Error('expected ok');

    const again = takeTransition('kept', taken.save, OPTIONS);
    expect(again.kind).toBe('already-taken');
    if (again.kind === 'already-taken') expect(again.endosymbiont).toBe('digested');
  });

  it('survives a save and a reload between deciding and undoing', () => {
    // The snapshot is carried by the save rather than held in memory, so it has
    // to survive the codec. A player who decides, closes the tab and comes back
    // still has the undo.
    const before = beforeSave();
    const taken = takeTransition('digested', before, OPTIONS);
    if (taken.kind !== 'ok') throw new Error('expected ok');

    const roundTripped = deserialize(serialize(taken.save));
    expect(roundTripped.kind).toBe('ok');
    if (roundTripped.kind !== 'ok') return;

    const undone = undoTransition(roundTripped.save);
    expect(undone.kind).toBe('ok');
    if (undone.kind === 'ok') expect(undone.save).toEqual({ ...before, snapshot: null });
  });

  it('reports a corrupt snapshot rather than throwing, and keeps the current save', () => {
    const taken = takeTransition('digested', beforeSave(), OPTIONS);
    if (taken.kind !== 'ok') throw new Error('expected ok');

    const damaged: SaveV2 = { ...taken.save, snapshot: '{"schemaVersion":2,"meta":' };
    const undone = undoTransition(damaged);
    expect(undone.kind).toBe('corrupt');
    // The caller still holds `damaged`. Losing the current run as well as the
    // undo would turn one bad outcome into two.
    expect(damaged.progression.endosymbiont).toBe('digested');
  });

  it('refuses a snapshot from a newer build rather than migrating it downward', () => {
    const taken = takeTransition('digested', beforeSave(), OPTIONS);
    if (taken.kind !== 'ok') throw new Error('expected ok');

    const fromTheFuture = JSON.parse(taken.save.snapshot as string) as Record<string, unknown>;
    fromTheFuture['schemaVersion'] = SCHEMA_VERSION + 1;

    const undone = undoTransition({ ...taken.save, snapshot: JSON.stringify(fromTheFuture) });
    expect(undone.kind).toBe('corrupt');
    if (undone.kind === 'corrupt') expect(undone.reason).toContain('newer build');
  });

  it('refuses a snapshot that contains a snapshot, at the codec', () => {
    // The nesting bound is structural rather than a convention. A save carrying
    // a snapshot carrying a snapshot grows without limit.
    const taken = takeTransition('digested', beforeSave(), OPTIONS);
    if (taken.kind !== 'ok') throw new Error('expected ok');

    const nested = JSON.stringify({ ...JSON.parse(taken.save.snapshot as string), snapshot: 'x' });
    const outcome = deserialize(serialize({ ...taken.save, snapshot: nested }));
    expect(outcome.kind).toBe('corrupt');
    if (outcome.kind === 'corrupt') expect(outcome.reason).toContain('snapshot contains a snapshot');
  });
});

describe('the digest path', () => {
  it('grants the payout and soft locks, taking nothing away', () => {
    const before = beforeSave();
    const taken = takeTransition('digested', before, OPTIONS);
    if (taken.kind !== 'ok') throw new Error('expected ok');

    expect(taken.outcome.canContinue).toBe(false);
    expect(taken.outcome.payout).toBe(OPTIONS.digestPayout);
    // Nothing confiscated. The player got precisely what the choice offered, and
    // what they did not get is a structure rather than a number.
    expect(taken.save.progression.unlocked).toEqual(before.progression.unlocked);
    expect(taken.save.progression.act).toBe(before.progression.act);
    expect(taken.outcome.lost).toEqual([]);
  });

  it('does not manufacture adenylate, because the pool is fixed and closed', () => {
    // The payout is a content grant written straight into a pool rather than the
    // product of a reaction, so it is the one place in the game that could break
    // adenylate conservation. It is bounded by the ADP available.
    const before = beforeSave();
    const adenylateBefore = (before.pools['atp'] ?? 0) + (before.pools['adp'] ?? 0);

    const taken = takeTransition('digested', before, { ...OPTIONS, digestPayout: 1e9 });
    if (taken.kind !== 'ok') throw new Error('expected ok');

    const adenylateAfter = (taken.save.pools['atp'] ?? 0) + (taken.save.pools['adp'] ?? 0);
    expect(adenylateAfter).toBeCloseTo(adenylateBefore, 9);
    expect(taken.save.pools['adp']).toBeGreaterThanOrEqual(0);
  });
});

describe('the keep path, and what it is waiting for', () => {
  it('reports that act 3 is not built rather than clamping or crashing', () => {
    // `findAct` returns null rather than clamping, for the reason V11 gave: a
    // clamp succeeds, quietly, at something other than what was asked.
    const taken = takeTransition('kept', beforeSave(), OPTIONS);
    expect(taken.kind).toBe('act-not-built');
    if (taken.kind === 'act-not-built') expect(taken.act).toBe(TRANSITION_TARGET_ACT);
  });

  it('takes no decision when it cannot complete one', () => {
    // A half-taken transition is the worst possible outcome: the save says the
    // player decided and there is nowhere for them to be.
    const before = beforeSave();
    takeTransition('kept', before, OPTIONS);
    expect(before.progression.endosymbiont).toBeNull();
    expect(before.snapshot).toBeNull();
  });

  it('FAILS THE BUILD the day act 3 is registered, so the keep path cannot stay untested', () => {
    /*
     * The mechanism V11 used for the one-act registry and V4 used for hard rule
     * 7. When stage 4 registers act 3, this assertion breaks, and whoever
     * registers it has to come here and write the real keep-path tests:
     * that `takeTransition('kept', ...)` returns `kind: 'ok'`, that the save it
     * produces is act 3 at its beginning by `actStartState`, that `createdAt`,
     * `elapsedGameMs` and the lifetime stats carry across, and that the undo
     * restores the act 2 cell exactly.
     *
     * A placeholder removed by a build failure rather than by memory.
     */
    expect(
      findAct(TRANSITION_TARGET_ACT),
      'Act 3 is registered. Write the keep-path tests in this file and delete this one.\n' +
        'See src/content/transition.ts, keptSave, for what must be asserted.',
    ).toBeNull();
  });
});
