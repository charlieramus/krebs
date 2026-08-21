/**
 * One definition of an act's beginning. UPDATELOGV13.md stage 1.
 *
 * The content half. The other half, that the runtime's new-game path IS this
 * function rather than merely agreeing with it, is in
 * `src/ui/__tests__/actStart.test.ts`, because asserting it needs the runtime
 * and nothing in `src/content/` may import the interface.
 *
 * WHAT THESE TESTS ARE PROTECTING. V13 stage 2 builds a jump that lands a
 * session in an act without playing the acts before it. The jump asks this
 * function for the state it lands in. The failure this file exists to catch is
 * the jump, or a later act, growing its own answer to "what does act N look
 * like at its beginning", because two definitions of one fact is the specific
 * way save formats rot and `progression.unlocked` has been the single source of
 * truth for exactly that reason since 2026-07-31.
 */

import { describe, expect, it } from 'vitest';
import { ACT1, ACTS } from '../acts';
import { actStartState } from '../actStart';
import { ACT1_INITIAL } from '../act1/pools';
import { hashState } from '../../sim/hash';
import type { SaveMetaV2 } from '../../save/schema';

const META: SaveMetaV2 = { createdAt: 0, lastSavedAt: 0, buildId: 'test' };

describe('an act at its beginning', () => {
  it('is at tick zero with nothing bought, nothing metered and nothing set', () => {
    const start = actStartState(ACT1);

    expect(start.act).toBe(ACT1.act);
    expect(start.state.tickCount).toBe(0);
    expect(start.unlocked).toEqual([]);
    expect(start.settings).toEqual({});
    expect(start.carried).toBe(ACT1.noCarriedCounters);

    // A zeroed meter, asserted over every field it has rather than over the two
    // this test happens to remember. A meter that gained a field and started it
    // at something other than zero would otherwise pass here.
    for (const [name, value] of Object.entries(start.meter)) {
      expect(value, `meter.${name} does not start at zero`).toBe(0);
    }
  });

  it('starts the pools where the act says they start, by id and not by index', () => {
    const start = actStartState(ACT1);

    for (const [id, expected] of Object.entries(ACT1_INITIAL)) {
      const index = ACT1.poolIndex(id);
      expect(index, `${id} is not a pool of this act`).toBeGreaterThanOrEqual(0);
      expect(start.state.pools.amounts[index], `${id} does not start at its initial`).toBe(
        expected,
      );
    }
  });

  it('is the same state every time, which is the narrow determinism a jump can claim', () => {
    // Not that a jumped session matches a played one. It does not and cannot.
    // See UPDATELOGV13.md stage 2 step 3, and docs/SIMULATION.md Part 5's Scope
    // section, which already models a determinism claim as several separate
    // statements rather than one.
    expect(hashState(actStartState(ACT1).state)).toBe(hashState(actStartState(ACT1).state));
  });

  it('hands back a fresh state every call rather than one shared object', () => {
    /*
     * WHY THIS IS ASSERTED. Every other test in this file compares one start
     * state against another. If two calls returned the same object, all of them
     * would compare an object with itself and pass for the wrong reason, and the
     * jump would hand the runtime a state a previous session had already ticked.
     */
    const a = actStartState(ACT1);
    const b = actStartState(ACT1);

    expect(a.state).not.toBe(b.state);
    expect(a.state.pools.amounts).not.toBe(b.state.pools.amounts);
    expect(a.meter).not.toBe(b.meter);

    a.state.pools.amounts[0] = 12345;
    expect(b.state.pools.amounts[0]).not.toBe(12345);
  });

  it('passes construction overrides through, because the scenario door needs them', () => {
    const glucose = ACT1.poolIndex('glucose');
    const start = actStartState(ACT1, { initial: { glucose: 500 } });

    expect(start.state.pools.amounts[glucose]).toBe(500);
    // Still a legal start state in every other respect.
    expect(start.state.tickCount).toBe(0);
    expect(start.unlocked).toEqual([]);
  });
});

describe('what a starting state deliberately does not carry', () => {
  /*
   * `progression.transitionTaken` and `progression.shuttleChoice` are named by
   * UPDATELOGV13.md stage 1 step 3 as things a starting state has to contain,
   * and they are not on `ActStartState`. That is a decision rather than an
   * omission and this is the test that holds it.
   *
   * They are decided by the act's own `capture`, which writes act 1's values
   * with a comment saying both are honestly true of the state rather than
   * placeholders. Carrying them on the start state as well would put the same
   * two facts in two places, which is the defect the whole stage exists to
   * prevent, and would put act 3's vocabulary into a function abstracting over
   * one act. The same argument covers `enzymes` and `environment`.
   *
   * What has to hold is that capturing a start state produces the act's values,
   * so the two cannot drift apart unnoticed.
   */
  it('captures act 1 progression flags from the act rather than from the start state', () => {
    const start = actStartState(ACT1);
    const save = ACT1.capture(start.state, start.meter, start.unlocked, start.settings, {
      meta: META,
      carried: start.carried,
    });

    expect(save.progression.act).toBe(start.act);
    expect(save.progression.unlocked).toEqual([]);
    expect(save.progression.endosymbiont).toBeNull();
    expect(save.progression.shuttleChoice).toBeNull();
    expect(save.enzymes).toEqual({});
    // Act 1's zero is a fact and stays one. UPDATELOGV14.md stage 1 introduced
    // act 3's nonzero placeholder without touching this assertion, which is the
    // point: the two are different statements about different acts.
    expect(save.environment).toEqual({ oxygenLevel: 0, scheduleIndex: 0 });
  });

  it('captures a start state into a save with no elapsed time and no history', () => {
    const start = actStartState(ACT1);
    const save = ACT1.capture(start.state, start.meter, start.unlocked, start.settings, {
      meta: META,
      carried: start.carried,
    });

    expect(save.time.elapsedGameMs).toBe(0);
    expect(save.time.offlineCreditedMs).toBe(0);
    expect(save.time.pendingOfflineMs).toBe(0);
    expect(save.stats.totalAtpProduced).toBe(0);
    expect(save.diagnostics.offlineFallbackCount).toBe(0);
    expect(save.diagnostics.negativePoolScalingEvents).toBe(0);
    // The PRNG has not been drawn from. Act 1 consumes no random numbers at all,
    // which `reloadDeterminism.test.ts` asserts directly; at tick zero it is true
    // of every act.
    expect(save.rng.state).toBe(save.rng.seed);
  });
});

describe('every act this build knows can answer for its own beginning', () => {
  /*
   * Walks the registry rather than naming act 1, so an act added by a later log
   * is covered the day it is registered rather than the day somebody remembers
   * to widen this file. Same posture as the guards V11 made walk their own
   * directories after both of them stopped agreeing with their hand-written
   * lists.
   */
  it.each(ACTS.map((act) => [act.act, act] as const))(
    'act %i produces a legal start state',
    (_number, act) => {
      const start = actStartState(act);

      expect(start.act).toBe(act.act);
      expect(start.state.pools.count).toBe(act.poolIds.length);
      expect(start.state.reactions.length).toBe(act.reactionIds.length);
      expect(start.state.tickCount).toBe(0);
      expect(start.unlocked).toEqual([]);
    },
  );
});
