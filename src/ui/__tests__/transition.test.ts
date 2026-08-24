/**
 * The one irreversible decision in the game. UPDATELOGV14.md stage 3.
 *
 * Five groups, matching the five things the stage has to be right about: the
 * decision as a reading of two fields, the undo, what is lost, the digest path,
 * and the offline behaviour across the boundary.
 *
 * THE UNDO IS TESTED BEFORE THE CHOICE IS, in the same order it was built. A
 * snapshot that does not restore exactly turns the one moment in the game that
 * cannot be retried into the one moment that quietly eats a save.
 */

import { beforeAll, describe, expect, it } from 'vitest';

import { ACT1 } from '../../content/acts';
import {
  ACT3_UNLOCK_DIGESTED,
  pfk1PkActive,
  transitionDecisionFrom,
  transitionDecisionOf,
  TRANSITION_SUSPENDS,
} from '../../content/transition';
import { setShortfallLogging } from '../../sim/tick';
import { TICK_MS } from '../../sim/constants';
import { createMemoryStore, createSaveStore, STORAGE_KEYS } from '../../save/storage';
import { deserialize } from '../../save/codec';
import type { SaveV1 } from '../../save/schema';
import { createActRuntime, type ActRuntime } from '../runtime';
import { DIGEST_GLUCOSE_YIELD, GLYCOLYSIS_STEPS, PFK1_PK_VMAX_FACTOR } from '../tuning';

beforeAll(() => {
  setShortfallLogging(false);
});

function harness() {
  const backing = createMemoryStore();
  let epoch = 1785000000000;
  return {
    backing,
    persistence: () => ({
      store: createSaveStore({ store: backing }),
      epochClock: () => epoch,
      startTimer: () => 1,
      stopTimer: () => {},
      listen: () => () => {},
    }),
    away: (ms: number) => {
      epoch += ms;
    },
    /** The active slot, parsed. What a reload would actually read. */
    active: (): SaveV1 => {
      const text = backing.getItem(STORAGE_KEYS.active);
      if (text === null) throw new Error('no active save');
      const parsed = deserialize(text);
      if (parsed.kind !== 'ok') throw new Error('active save does not parse');
      return parsed.save;
    },
  };
}

function build(h: ReturnType<typeof harness>): ActRuntime {
  return createActRuntime(ACT1, {
    schedule: () => 0,
    cancel: () => {},
    persistence: h.persistence(),
  });
}

function play(runtime: ActRuntime, ticks: number): void {
  let nowMs = 0;
  runtime.frame(nowMs);
  for (let i = 0; i < ticks; i += 1) {
    nowMs += TICK_MS;
    runtime.frame(nowMs);
  }
}

/**
 * Buy all ten, so the act is complete and the decision is available.
 *
 * The meter is written to directly, which is the door `actBoundary.test.ts`
 * already documents: it is a plain counter outside the simulation, so setting it
 * puts the runtime where a 54-minute playthrough would without spending 54
 * minutes of game time. No pool is touched.
 */
function completeAct1(runtime: ActRuntime): void {
  runtime.snapshot.meter.atpProduced = 1e6;
  expect(runtime.buyFerment()).toBe(true);
  while (runtime.buyUptakeStep()) {
    /* to the top */
  }
  expect(runtime.buyGlycogen()).toBe(true);
  expect(runtime.buyEthanol()).toBe(true);
  expect(runtime.buyPfk1Pk()).toBe(true);
  while (runtime.buyGlycolysisStep()) {
    /* to the top */
  }
  runtime.frame(1);
  expect(runtime.snapshot.actComplete).toBe(true);
}

/** Vmax of a reaction, read off the live simulation. */
function vmaxOf(runtime: ActRuntime, reactionId: string): number {
  const reaction = runtime.state.reactions[ACT1.reactionIndex(reactionId)];
  if (reaction === undefined) throw new Error(`no reaction ${reactionId}`);
  const kinetics = reaction.kinetics;
  return kinetics.vmax;
}

/* ===========================================================================
   THE DECISION IS A READING OF TWO FIELDS
   =========================================================================== */

describe('the decision is read and never stored twice', () => {
  it('is undecided, kept or digested and nothing else', () => {
    expect(transitionDecisionFrom(false, [])).toBe('undecided');
    expect(transitionDecisionFrom(true, [])).toBe('kept');
    expect(transitionDecisionFrom(false, [ACT3_UNLOCK_DIGESTED])).toBe('digested');
  });

  it('refuses a state that claims both, because such a state cannot be read', () => {
    expect(() => transitionDecisionFrom(true, [ACT3_UNLOCK_DIGESTED])).toThrow(
      /both kept and digested/,
    );
  });

  it('reads the same answer off a real save as off the live session', () => {
    const h = harness();
    const runtime = build(h);
    play(runtime, 20);
    completeAct1(runtime);
    expect(runtime.offerTransition()).toBe(true);
    expect(runtime.keepEndosymbiont()).toBe(true);

    expect(runtime.transitionDecision()).toBe('kept');
    expect(transitionDecisionOf(h.active())).toBe('kept');
  });

  it('mints exactly one id, and it is the digest one', () => {
    // UPDATELOGV14.md stage 1 reserved `endosymbiont-kept` too and stage 3 does
    // not mint it, because `progression.transitionTaken` already carries that
    // fact and two copies of one fact is the defect the schema exists to refuse.
    const h = harness();
    const runtime = build(h);
    play(runtime, 20);
    completeAct1(runtime);
    expect(runtime.offerTransition()).toBe(true);
    expect(runtime.keepEndosymbiont()).toBe(true);

    const unlocked = h.active().progression.unlocked;
    expect(unlocked).not.toContain('endosymbiont-kept');
    expect(unlocked).not.toContain(ACT3_UNLOCK_DIGESTED);
    expect(h.active().progression.transitionTaken).toBe(true);
  });
});

/* ===========================================================================
   THE UNDO, BUILT AND TESTED FIRST
   =========================================================================== */

describe('the undo', () => {
  it('is not offered before the act is complete', () => {
    const h = harness();
    const runtime = build(h);
    play(runtime, 20);
    expect(runtime.transitionAvailable()).toBe(false);
    expect(runtime.offerTransition()).toBe(false);
    expect(runtime.canUndoTransition()).toBe(false);
  });

  it('is written before the choice can be taken, and the choice refuses without it', () => {
    const h = harness();
    const runtime = build(h);
    play(runtime, 20);
    completeAct1(runtime);

    // No snapshot yet, so neither branch may be taken. This is the ordering the
    // whole stage rests on: the undo is proved to work before the irreversible
    // choice is put in front of anybody.
    expect(runtime.keepEndosymbiont()).toBe(false);
    expect(runtime.digestEndosymbiont()).toBe(false);
    expect(runtime.transitionDecision()).toBe('undecided');

    expect(runtime.offerTransition()).toBe(true);
    expect(runtime.keepEndosymbiont()).toBe(true);
  });

  it('does not move once taken, so a reload between offer and choice returns to the same moment', () => {
    const h = harness();
    const runtime = build(h);
    play(runtime, 20);
    completeAct1(runtime);
    expect(runtime.offerTransition()).toBe(true);
    const first = h.backing.getItem(STORAGE_KEYS.snapshot);

    // Time passes, the cell keeps running, and the player thinks about it.
    play(runtime, 200);
    expect(runtime.offerTransition()).toBe(true);
    expect(h.backing.getItem(STORAGE_KEYS.snapshot)).toBe(first);
  });

  it('restores the save exactly, field for field', () => {
    const h = harness();
    const runtime = build(h);
    play(runtime, 20);
    completeAct1(runtime);
    expect(runtime.offerTransition()).toBe(true);

    const before = deserialize(h.backing.getItem(STORAGE_KEYS.snapshot) as string);
    if (before.kind !== 'ok') throw new Error('snapshot does not parse');

    expect(runtime.digestEndosymbiont()).toBe(true);
    expect(h.active().progression.unlocked).toContain(ACT3_UNLOCK_DIGESTED);

    expect(runtime.undoTransition()).toBe(true);
    // The whole save, not a field of it. `meta` included: the snapshot is the
    // bytes that were written, so a restore that changed anything at all would
    // show here.
    expect(h.active()).toEqual(before.save);
    expect(transitionDecisionOf(h.active())).toBe('undecided');
  });

  it('is one decision deep and the second press does nothing', () => {
    const h = harness();
    const runtime = build(h);
    play(runtime, 20);
    completeAct1(runtime);
    expect(runtime.offerTransition()).toBe(true);
    expect(runtime.digestEndosymbiont()).toBe(true);
    expect(runtime.canUndoTransition()).toBe(true);

    expect(runtime.undoTransition()).toBe(true);
    // The snapshot is gone, so the choice made after an undo is made for real.
    expect(h.backing.getItem(STORAGE_KEYS.snapshot)).toBeNull();
    expect(runtime.canUndoTransition()).toBe(false);
    expect(runtime.undoTransition()).toBe(false);
  });

  it('seals the session, so nothing writes over the restored save', () => {
    // The V4 defect, one level up: `beforeunload` fires during the reload that
    // follows an undo and would autosave the post-decision session over the
    // state the undo just restored.
    const h = harness();
    const runtime = build(h);
    play(runtime, 20);
    completeAct1(runtime);
    expect(runtime.offerTransition()).toBe(true);
    expect(runtime.keepEndosymbiont()).toBe(true);
    expect(runtime.undoTransition()).toBe(true);

    const restored = h.active();
    expect(runtime.save().kind).toBe('failed');
    expect(h.active()).toEqual(restored);
  });

  it('keeps the state it undid, in the backup slot', () => {
    // Undoing is a decision too, and the backup is the only copy of what it
    // discarded. Same posture as `acceptRecovery` keeping the corrupt primary.
    const h = harness();
    const runtime = build(h);
    play(runtime, 20);
    completeAct1(runtime);
    expect(runtime.offerTransition()).toBe(true);
    expect(runtime.keepEndosymbiont()).toBe(true);
    expect(runtime.undoTransition()).toBe(true);

    const backup = deserialize(h.backing.getItem(STORAGE_KEYS.backup) as string);
    if (backup.kind !== 'ok') throw new Error('backup does not parse');
    expect(backup.save.progression.transitionTaken).toBe(true);
  });
});

/* ===========================================================================
   WHAT IS LOST
   =========================================================================== */

describe('what keeping the endosymbiont takes away', () => {
  it('is one capability, and the list says so', () => {
    expect(TRANSITION_SUSPENDS).toEqual(['enzyme-pfk1-pk']);
  });

  it('suspends the factor rather than the purchase', () => {
    const h = harness();
    const runtime = build(h);
    play(runtime, 20);
    completeAct1(runtime);

    const withEnzymes = vmaxOf(runtime, 'prep');
    expect(runtime.pfk1PkPaying()).toBe(true);

    expect(runtime.offerTransition()).toBe(true);
    expect(runtime.keepEndosymbiont()).toBe(true);

    expect(runtime.pfk1PkPaying()).toBe(false);
    // The factor is gone from both phases, and by exactly the factor.
    expect(vmaxOf(runtime, 'prep')).toBeCloseTo(withEnzymes / PFK1_PK_VMAX_FACTOR, 10);
    // The purchase is still owned. A save that forgot would refund it on load.
    expect(runtime.snapshot.pfk1PkBought).toBe(true);
    expect(h.active().progression.unlocked).toContain('enzyme-pfk1-pk');
  });

  it('is not restored by a reload, which is the failure a second code path would cause', () => {
    const h = harness();
    const first = build(h);
    play(first, 20);
    completeAct1(first);
    expect(first.offerTransition()).toBe(true);
    expect(first.keepEndosymbiont()).toBe(true);
    const suspended = vmaxOf(first, 'prep');

    const second = build(h);
    expect(second.transitionDecision()).toBe('kept');
    expect(second.pfk1PkPaying()).toBe(false);
    expect(vmaxOf(second, 'prep')).toBeCloseTo(suspended, 10);
  });

  it('is not taken from a player who digested', () => {
    const h = harness();
    const runtime = build(h);
    play(runtime, 20);
    completeAct1(runtime);
    const withEnzymes = vmaxOf(runtime, 'prep');

    expect(runtime.offerTransition()).toBe(true);
    expect(runtime.digestEndosymbiont()).toBe(true);

    expect(runtime.pfk1PkPaying()).toBe(true);
    expect(vmaxOf(runtime, 'prep')).toBeCloseTo(withEnzymes, 10);
  });

  it('comes back when genes are transferred, which is stage 5 and is asserted now', () => {
    // The ladder does not exist yet and the rule that governs it does. Asserted
    // against the pure function so stage 5 inherits a decision rather than a
    // question, exactly as V13 left the named-beat selector.
    const kept = { bought: true, decision: 'kept' } as const;
    expect(pfk1PkActive({ ...kept, genesTransferred: 0 })).toBe(false);
    expect(pfk1PkActive({ ...kept, genesTransferred: 1 })).toBe(true);
    // And a purchase never made does not start paying because of a transition.
    expect(
      pfk1PkActive({ bought: false, decision: 'kept', genesTransferred: 3 }),
    ).toBe(false);
  });
});

/* ===========================================================================
   THE DIGEST PATH
   =========================================================================== */

describe('digesting the endosymbiont', () => {
  it('adds exactly its carbon to the environment and moves nothing else', () => {
    const h = harness();
    const runtime = build(h);
    play(runtime, 20);
    completeAct1(runtime);
    expect(runtime.offerTransition()).toBe(true);

    const pools = runtime.state.pools;
    const before = Array.from(pools.amounts);
    const carbonBefore = pools.totalConserved('carbon');

    expect(runtime.digestEndosymbiont()).toBe(true);

    const after = Array.from(pools.amounts);
    const envIndex = ACT1.poolIndex('glucose_env');
    for (let i = 0; i < after.length; i += 1) {
      if (i === envIndex) continue;
      expect(after[i], `pool ${pools.ids[i] as string} moved`).toBe(before[i]);
    }
    expect((after[envIndex] as number) - (before[envIndex] as number)).toBe(
      DIGEST_GLUCOSE_YIELD,
    );

    // Glucose carries 6 carbon, so the input is exact rather than approximately
    // right. docs/ECONOMY.md records this as the one scripted matter input in
    // the game.
    expect(pools.totalConserved('carbon') - carbonBefore).toBeCloseTo(
      DIGEST_GLUCOSE_YIELD * 6,
      6,
    );
  });

  it('does not touch the ATP pool, because the adenylate total is closed', () => {
    const h = harness();
    const runtime = build(h);
    play(runtime, 20);
    completeAct1(runtime);
    expect(runtime.offerTransition()).toBe(true);

    const adenylateBefore = runtime.state.pools.totalConserved('adenylate');
    expect(runtime.digestEndosymbiont()).toBe(true);
    expect(runtime.state.pools.totalConserved('adenylate')).toBeCloseTo(adenylateBefore, 9);
  });

  it('does not touch the meter, because that is the numerator of act 1s ledger', () => {
    /*
     * THE ONE THAT HAD TO BE FOUND RATHER THAN REMEMBERED.
     * `atpPerCompletedGlucose` is `meter.atpProduced` over the glucose that
     * finished, so a payout credited there makes the game report more than 4
     * gross ATP per glucose. That is the single claim act 1 exists to make and
     * it has been asserted to nine decimal places since V2.
     */
    const h = harness();
    const runtime = build(h);
    play(runtime, 20);
    completeAct1(runtime);
    expect(runtime.offerTransition()).toBe(true);

    const produced = runtime.snapshot.meter.atpProduced;
    const consumed = runtime.snapshot.meter.glucoseConsumed;
    expect(runtime.digestEndosymbiont()).toBe(true);
    expect(runtime.snapshot.meter.atpProduced).toBe(produced);
    expect(runtime.snapshot.meter.glucoseConsumed).toBe(consumed);
  });

  it('leaves transitionTaken false, because digesting is the refusal of the transition', () => {
    const h = harness();
    const runtime = build(h);
    play(runtime, 20);
    completeAct1(runtime);
    expect(runtime.offerTransition()).toBe(true);
    expect(runtime.digestEndosymbiont()).toBe(true);

    expect(h.active().progression.transitionTaken).toBe(false);
    expect(transitionDecisionOf(h.active())).toBe('digested');
  });
});

/* ===========================================================================
   THE DECISION IS MADE ONCE
   =========================================================================== */

describe('the decision cannot be made twice', () => {
  it('refuses the other branch once one is taken', () => {
    const h = harness();
    const runtime = build(h);
    play(runtime, 20);
    completeAct1(runtime);
    expect(runtime.offerTransition()).toBe(true);
    expect(runtime.keepEndosymbiont()).toBe(true);

    expect(runtime.transitionAvailable()).toBe(false);
    expect(runtime.digestEndosymbiont()).toBe(false);
    expect(runtime.keepEndosymbiont()).toBe(false);
  });

  it('is not offered again on the next session', () => {
    const h = harness();
    const first = build(h);
    play(first, 20);
    completeAct1(first);
    expect(first.offerTransition()).toBe(true);
    expect(first.keepEndosymbiont()).toBe(true);

    const second = build(h);
    second.frame(1);
    expect(second.snapshot.actComplete).toBe(true);
    expect(second.transitionAvailable()).toBe(false);
  });
});

/* ===========================================================================
   THE OFFLINE PATH ACROSS THIS BOUNDARY
   =========================================================================== */

describe('an absence never makes the decision', () => {
  /**
   * SPINE A SAID THE OFFLINE CREDIT STOPS AT AN ACT BOUNDARY AND THIS CONFIRMS
   * IT AGAINST THIS BOUNDARY SPECIFICALLY, which is what stage 3 step 6 asks
   * for. It matters more here than anywhere: a player must not return from eight
   * hours to find the one irreversible decision in the game already made.
   *
   * There are two independent reasons it cannot happen and both are asserted,
   * because either one alone would be a single point of failure on the thing
   * that must not fail.
   */
  it('cannot reach the boundary while away, because the last step is a purchase', () => {
    const h = harness();
    const first = build(h);
    play(first, 100);
    first.snapshot.meter.atpProduced = 1e6;
    expect(first.buyFerment()).toBe(true);
    while (first.buyUptakeStep()) {
      /* to the top */
    }
    expect(first.buyGlycogen()).toBe(true);
    expect(first.buyEthanol()).toBe(true);
    expect(first.buyPfk1Pk()).toBe(true);
    for (let i = 0; i < GLYCOLYSIS_STEPS.length - 2; i += 1) {
      expect(first.buyGlycolysisStep()).toBe(true);
    }
    // Back under the last threshold before leaving, so the stop is the one being
    // tested rather than a stop that fires at tick zero.
    first.snapshot.meter.atpProduced = 0;
    play(first, 20);
    first.save();

    h.away(8 * 60 * 60 * 1000);
    const second = build(h);

    // The absence stopped, and the act is not complete on the other side of it.
    expect(second.session.offline.stoppedAtBoundary).toBe(true);
    second.frame(1);
    expect(second.snapshot.actComplete).toBe(false);
    expect(second.transitionAvailable()).toBe(false);
    expect(second.transitionDecision()).toBe('undecided');
  });

  it('leaves an undecided save undecided across an eight hour absence', () => {
    // The second reason, independent of the stop: nothing on the offline path
    // writes either field, so even a session that came back with the act
    // complete would come back undecided.
    const h = harness();
    const first = build(h);
    play(first, 20);
    completeAct1(first);
    first.save();

    h.away(8 * 60 * 60 * 1000);
    const second = build(h);
    second.frame(1);

    expect(second.snapshot.actComplete).toBe(true);
    expect(second.transitionDecision()).toBe('undecided');
    expect(second.transitionAvailable()).toBe(true);
    expect(h.active().progression.transitionTaken).toBe(false);
  });
});
