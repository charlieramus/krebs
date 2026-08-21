/**
 * The jump, through the runtime. UPDATELOGV13.md stage 2.
 *
 * The content half is `src/content/__tests__/actJump.test.ts`, which asserts the
 * jump is a wrapper over `actStartState` rather than a second definition of one.
 * This file asserts what only a runtime can show: that a jump ignores the save,
 * that the mark persists and survives a reload, that determinism holds in the
 * three narrow forms stage 2 step 3 names and in no wider one, and that the
 * offline path works against a jumped state.
 *
 * ---------------------------------------------------------------------------
 * THE DETERMINISM CLAIM IS THREE STATEMENTS AND NOT ONE
 * ---------------------------------------------------------------------------
 *
 * A jumped state is fabricated, so the run after it is NOT the run a player
 * would have had, and no test here says otherwise. docs/SIMULATION.md Part 5's
 * Scope section already models this shape: it makes three separate statements
 * about determinism rather than one general one, because a single sentence
 * covering all of them would be false. The three that hold are:
 *
 *   1. the same jump produces the same state every time
 *   2. a session begun by a jump is internally deterministic
 *   3. a jumped session saved and reloaded produces an identical hash
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { ACT1 } from '../../content/acts';
import { actStartState } from '../../content/actStart';
import { JUMPED_TO_ACT, resolveActJump, type ActJump } from '../../content/actJump';
import { TICK_MS } from '../../sim/constants';
import { hashState } from '../../sim/hash';
import { setShortfallLogging } from '../../sim/tick';
import {
  createMemoryStore,
  createSaveStore,
  STORAGE_KEYS,
  type KeyValueStore,
} from '../../save/storage';
import { createActRuntime, type ActRuntimeOptions } from '../runtime';

beforeAll(() => {
  setShortfallLogging(false);
});

const EPOCH = 1785000000000;

function jumpTo(act: number): ActJump {
  const jump = resolveActJump(act);
  if (jump === null) throw new Error(`act ${act} did not resolve`);
  return jump;
}

/** A save store over an inspectable memory backing. */
function disk(seed: Readonly<Record<string, string>> = {}) {
  const backing: KeyValueStore = createMemoryStore(seed);
  return {
    backing,
    persistence: () => ({
      store: createSaveStore({ store: backing }),
      epochClock: () => EPOCH,
      // No timers and no listeners. Every write in this file is explicit, so a
      // firing autosave would make it unclear which write is being asserted.
      startTimer: () => 1,
      stopTimer: () => {},
      listen: () => () => {},
    }),
  };
}

/** Runs a runtime forward by whole ticks, at exactly one tick per frame. */
function run(runtime: ReturnType<typeof createActRuntime>, ticks: number) {
  let nowMs = 0;
  runtime.frame(nowMs);
  for (let t = 0; t < ticks; t += 1) {
    nowMs += TICK_MS;
    runtime.frame(nowMs);
  }
  return runtime;
}

function jumped(act: number, extra: Partial<ActRuntimeOptions> = {}) {
  const jump = jumpTo(act);
  return createActRuntime(jump.act, {
    jump,
    persistence: { enabled: false },
    ...extra,
  });
}

describe('a jump lands in an act rather than in whatever is on disk', () => {
  it('starts from the act beginning even when a real save is sitting there', () => {
    /*
     * THE PROPERTY THAT MAKES IT A JUMP. A jump that loaded the save and then
     * ran the act from it would do nothing at all.
     */
    const store = disk();
    const played = createActRuntime(ACT1, { persistence: store.persistence() });
    run(played, 600);
    played.buyFerment();
    played.save();

    const before = hashState(played.state);
    const jump = jumpTo(ACT1.act);
    const runtime = createActRuntime(jump.act, { jump, persistence: store.persistence() });

    expect(hashState(runtime.state)).not.toBe(before);
    expect(hashState(runtime.state)).toBe(hashState(actStartState(ACT1).state));
    expect(runtime.state.tickCount).toBe(0);
    expect(runtime.unlocked).toEqual([]);
  });

  it('reports the session as jumped', () => {
    expect(jumped(ACT1.act).session.kind).toBe('jumped');
    // And a jump with persistence on says the same thing, because a jump with a
    // store is still a jump.
    const store = disk();
    const jump = jumpTo(ACT1.act);
    const runtime = createActRuntime(jump.act, { jump, persistence: store.persistence() });
    expect(runtime.session.kind).toBe('jumped');
  });

  it('throws rather than running one act against another act starting pools', () => {
    const jump = jumpTo(ACT1.act);
    const wrongAct = { ...ACT1, act: 3 };

    expect(() => createActRuntime(wrongAct, { jump, persistence: { enabled: false } })).toThrow(
      /jump targets act 1 and the descriptor is act 3/,
    );
  });

  it('destroys the most recent played save on its first write, with no copy of it anywhere', () => {
    /*
     * THE COST OF THE DOOR, MEASURED RATHER THAN ASSUMED, because "it is only
     * behind a query string" is not an argument about what happens after
     * somebody types it. It came out worse than the obvious guess and the reason
     * is a V4 decision working exactly as designed.
     *
     * `createSaveStore` starts `activeKnownGood` at false, and its comment says
     * why: "a store that has never been loaded from has not established that its
     * active slot is worth preserving, and refusing to promote costs one
     * generation of backup depth on the first write of a session." That is
     * correct for every session that existed before this log. A JUMP IS THE
     * FIRST SESSION IN THE PROJECT'S HISTORY THAT DELIBERATELY DOES NOT LOAD,
     * so it is the first one for which the active slot IS known to be worth
     * preserving and the store cannot know it.
     *
     * The result, asserted below: the jump's first write overwrites the player's
     * most recent save and does not promote it, so that save is gone. What
     * survives in the backup slot is the generation BEFORE it, which the played
     * session put there. The player loses their latest save and keeps an older
     * one, which is the worst of the three outcomes to have to explain.
     *
     * NOT FIXED HERE. Stage 2 builds the mechanism and stage 3 decides who can
     * reach it, and this is the number stage 3 has to decide against. Recorded
     * as a passing test rather than a note, so a later log that changes it fails
     * here rather than silently improving something nobody remeasures.
     */
    const store = disk();

    // Generation 1, then generation 2 from a session that loaded generation 1.
    const first = createActRuntime(ACT1, { persistence: store.persistence() });
    run(first, 600);
    first.save();
    const generation1 = store.backing.getItem(STORAGE_KEYS.active);

    const second = createActRuntime(ACT1, { persistence: store.persistence() });
    run(second, 600);
    second.save();
    const generation2 = store.backing.getItem(STORAGE_KEYS.active);

    expect(generation1).not.toBeNull();
    expect(generation2).not.toBe(generation1);
    expect(store.backing.getItem(STORAGE_KEYS.backup)).toBe(generation1);

    // The jump. Nothing is touched until it writes.
    const jump = jumpTo(ACT1.act);
    const runtime = createActRuntime(jump.act, { jump, persistence: store.persistence() });
    expect(store.backing.getItem(STORAGE_KEYS.active)).toBe(generation2);

    runtime.save();

    const active = store.backing.getItem(STORAGE_KEYS.active);
    const backup = store.backing.getItem(STORAGE_KEYS.backup);

    expect(active).not.toBe(generation2);
    expect(JSON.parse(active as string).settings[JUMPED_TO_ACT]).toBe(ACT1.act);
    // The latest played save is in neither slot.
    expect(active).not.toBe(generation2);
    expect(backup).not.toBe(generation2);
    // And the one that survives is the older generation.
    expect(backup).toBe(generation1);
  });

  it('does not play the act boundary set piece', () => {
    /*
     * Stage 2 step 5. A jump lands a player in an act; the set piece is what the
     * game shows when an act ENDS. Two triggers for one authored moment, one of
     * them a debugging tool, is what this asserts against.
     */
    const runtime = jumped(ACT1.act);
    run(runtime, 60);

    expect(runtime.snapshot.actComplete).toBe(false);
    expect(runtime.boundarySeen()).toBe(false);
  });
});

describe('the mark', () => {
  it('names the act in settings, and a played session carries no key at all', () => {
    const store = disk();
    const jump = jumpTo(ACT1.act);
    const runtime = createActRuntime(jump.act, { jump, persistence: store.persistence() });

    expect(runtime.jumpedToAct()).toBe(ACT1.act);
    expect(runtime.capture().settings[JUMPED_TO_ACT]).toBe(ACT1.act);

    const playedStore = disk();
    const played = createActRuntime(ACT1, { persistence: playedStore.persistence() });
    expect(played.jumpedToAct()).toBeNull();
    expect(JUMPED_TO_ACT in played.capture().settings).toBe(false);
  });

  it('survives a write and a reload, and the reloaded session was not jumped by anything', () => {
    /*
     * The mark travels with the save rather than with the option, which is the
     * distinction `jumpedToAct` reads settings for. The second runtime has no
     * jump option and is still a jumped session.
     */
    const store = disk();
    const jump = jumpTo(ACT1.act);
    const first = createActRuntime(jump.act, { jump, persistence: store.persistence() });
    run(first, 400);
    first.save();

    const reloaded = createActRuntime(ACT1, { persistence: store.persistence() });

    expect(reloaded.session.kind).toBe('loaded');
    expect(reloaded.jumpedToAct()).toBe(ACT1.act);
  });

  it('is preserved by a session that knows nothing about it, alongside other settings', () => {
    // The open-bag property: a build that does not know a key must not delete
    // it. Asserted by writing a foreign key beside the mark and reading both
    // back through a full save and load.
    const store = disk();
    const jump = jumpTo(ACT1.act);
    const first = createActRuntime(jump.act, { jump, persistence: store.persistence() });
    first.markFirstRunSeen();
    first.save();

    const reloaded = createActRuntime(ACT1, { persistence: store.persistence() });
    reloaded.markBoundarySeen();

    const settings = reloaded.capture().settings;
    expect(settings[JUMPED_TO_ACT]).toBe(ACT1.act);
    expect(settings['firstRunSeen']).toBe(true);
    expect(settings['boundarySeen']).toBe(true);
  });

  it('does not reach the simulation, so it cannot move a hash', () => {
    /*
     * docs/SAVE_SCHEMA.md Part 3: anything under `settings` is presentation and
     * never affects simulation. Two cells run the same number of ticks from the
     * same beginning, one marked and one not, and their states must be
     * identical. That is the whole content of "diagnostic".
     */
    const marked = jumped(ACT1.act);
    const plain = createActRuntime(ACT1, { persistence: { enabled: false } });
    run(marked, 1200);
    run(plain, 1200);

    expect(hashState(marked.state)).toBe(hashState(plain.state));
  });
});

describe('determinism, in the three narrow forms and no wider one', () => {
  it('1. the same jump produces the same state every time', () => {
    expect(hashState(jumped(ACT1.act).state)).toBe(hashState(jumped(ACT1.act).state));
  });

  it('2. a session begun by a jump is internally deterministic', () => {
    const a = run(jumped(ACT1.act), 2400);
    const b = run(jumped(ACT1.act), 2400);

    expect(hashState(a.state)).toBe(hashState(b.state));
    expect(Array.from(a.snapshot.amounts)).toEqual(Array.from(b.snapshot.amounts));

    // And it survives an irregular frame delivery, which is what a real
    // requestAnimationFrame produces. Same game time, different frames.
    const irregular = jumped(ACT1.act);
    let nowMs = 0;
    irregular.frame(nowMs);
    for (const delta of [7, 51, 3, 120, 16, 16, 240, 9]) {
      nowMs += delta;
      irregular.frame(nowMs);
    }
    const even = run(jumped(ACT1.act), Math.floor(nowMs / TICK_MS));
    expect(hashState(irregular.state)).toBe(hashState(even.state));
  });

  it('3. a jumped session saved and reloaded produces an identical hash', () => {
    const store = disk();
    const jump = jumpTo(ACT1.act);
    const first = createActRuntime(jump.act, { jump, persistence: store.persistence() });
    run(first, 3000);
    first.buyFerment();
    run(first, 1200);
    first.save();

    const before = hashState(first.state);
    const reloaded = createActRuntime(ACT1, { persistence: store.persistence() });

    expect(hashState(reloaded.state)).toBe(before);
    // The unlock ids come back too, which is the recorded flaw in the existing
    // scenario door that a jump must not repeat: `?ferment=on` enables a
    // reaction without minting an id, so a restored save has no ferment in
    // `progression.unlocked`. A jump mints real ids because it produces a real
    // state.
    expect(reloaded.unlocked).toEqual(first.unlocked);
    expect(reloaded.snapshot.fermentUnlocked).toBe(true);
  });

  it('makes no fourth claim, and act 1 is the worst possible act to check that against', () => {
    /*
     * THE STATEMENT A READER WILL ASSUME FROM THE THREE ABOVE, MEASURED RATHER
     * THAN ARGUED, AND IT CAME OUT THE OTHER WAY.
     *
     * The fourth claim is that a jumped session matches a played one, and it is
     * the one a jump can never make in general. In act 1 it happens to be TRUE,
     * and the two reasons are both act 1 facts rather than jump facts:
     *
     *   1. act 1's jump target IS its own beginning, because it is act 1, so
     *      there is nothing for a jump to fabricate
     *   2. unlock state is not hashed. NOW.md has recorded since V4 that
     *      `setReactionEnabled` and `setReactionVmax` touch no pool, no tick
     *      count and no PRNG, which is exactly why `progression.unlocked` had to
     *      be persisted separately
     *
     * So the hashes below agree even though one cell has bought fermentation and
     * the other has not. Neither reason survives act 3, where a jump has to
     * fabricate a compartment and a transition that a played session earned.
     * Asserted in this direction so that the day it stops being true, the
     * failure lands on a test that explains what changed instead of on a test
     * asserting a difference for a reason that had quietly moved.
     */
    const store = disk();
    const played = createActRuntime(ACT1, { persistence: store.persistence() });
    run(played, 1200);
    played.buyFerment();
    played.save();

    const jumpedRuntime = jumped(ACT1.act);
    run(jumpedRuntime, 1200);

    expect(hashState(jumpedRuntime.state)).toBe(hashState(played.state));
    expect(played.unlocked).not.toEqual(jumpedRuntime.unlocked);
  });

  it('is still distinguishable from a played session, which is what the mark is for', () => {
    /*
     * AND THIS IS WHY THE MARK EXISTS. The test above shows two sessions whose
     * simulation states are byte-identical. If the save carried nothing else,
     * a submitted save that skipped play would be indistinguishable from one
     * that did not, which is the outcome the log's Decisions section rules out.
     * One key separates them and it is the only difference in the whole
     * document besides the unlock list.
     */
    const jumpStore = disk();
    const jump = jumpTo(ACT1.act);
    const jumpedRuntime = createActRuntime(jump.act, {
      jump,
      persistence: jumpStore.persistence(),
    });
    const playedStore = disk();
    const played = createActRuntime(ACT1, { persistence: playedStore.persistence() });

    run(jumpedRuntime, 1200);
    run(played, 1200);

    const fromJump = jumpedRuntime.capture();
    const fromPlay = played.capture();

    expect(hashState(jumpedRuntime.state)).toBe(hashState(played.state));
    expect(fromJump.settings).toEqual({ [JUMPED_TO_ACT]: ACT1.act });
    expect(fromPlay.settings).toEqual({});
    // Everything outside `settings` is the same document.
    expect({ ...fromJump, settings: {} }).toEqual({ ...fromPlay, settings: {} });
  });
});

describe('the offline path against a jumped state', () => {
  /*
   * Stage 2 step 4. "It is a legal state so it should just work" is the phrase
   * this project has learned to distrust, so it is run rather than argued.
   *
   * FOR ACT 1 THE JUMP TARGET IS THE ACT'S OWN BEGINNING, so a jumped act 1 and
   * a new game are the same state, which stage 1's agreement test already
   * asserts. That makes this a check that the jump produces a state the offline
   * path handles identically rather than a new sweep with new figures, and the
   * honest way to show it is to run both and compare. The 47-case sweep itself
   * is unchanged and reported in the stage 4 coherence run.
   */
  it('credits an absence from a jumped save exactly as it credits one from a played save', () => {
    const away = 8 * 60 * 60 * 1000;

    const jumpStore = disk();
    const jump = jumpTo(ACT1.act);
    const first = createActRuntime(jump.act, { jump, persistence: jumpStore.persistence() });
    run(first, 2400);
    first.buyFerment();
    first.save();

    const plainStore = disk();
    const plain = createActRuntime(ACT1, { persistence: plainStore.persistence() });
    run(plain, 2400);
    plain.buyFerment();
    plain.save();

    const returnedFromJump = createActRuntime(ACT1, {
      persistence: { ...jumpStore.persistence(), epochClock: () => EPOCH + away },
    });
    const returnedFromPlay = createActRuntime(ACT1, {
      persistence: { ...plainStore.persistence(), epochClock: () => EPOCH + away },
    });

    expect(returnedFromJump.session.offline.creditedMs).toBe(
      returnedFromPlay.session.offline.creditedMs,
    );
    expect(returnedFromJump.session.offline.atpProduced).toBe(
      returnedFromPlay.session.offline.atpProduced,
    );
    expect(returnedFromJump.session.offline.fellBack).toBe(false);
    expect(returnedFromJump.session.offline.creditedMs).toBeGreaterThan(0);
    expect(hashState(returnedFromJump.state)).toBe(hashState(returnedFromPlay.state));
  });

  it('does not fall back, which is the signal docs/SIMULATION.md Part 3 calls a bug', () => {
    const store = disk();
    const jump = jumpTo(ACT1.act);
    const first = createActRuntime(jump.act, { jump, persistence: store.persistence() });
    run(first, 1200);
    first.buyFerment();
    first.save();

    const returned = createActRuntime(ACT1, {
      persistence: { ...store.persistence(), epochClock: () => EPOCH + 60 * 60 * 1000 },
    });

    expect(returned.session.offline.fellBack).toBe(false);
    expect(returned.session.offline.budgetExhausted).toBe(false);
    expect(returned.capture().diagnostics.offlineFallbackCount).toBe(0);
  });
});
