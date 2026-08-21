/**
 * The jump is a wrapper and not a second definition. UPDATELOGV13.md stage 2.
 *
 * The content half. The runtime half, which is where the mark, the three
 * determinism forms and the offline path live, is in
 * `src/ui/__tests__/actJump.test.ts`.
 *
 * WHAT THIS FILE IS DEFENDING. The log's Decisions section says the jump's whole
 * risk is in not duplicating a definition. So the assertion that matters here is
 * not that the jump works, it is that the jump's state and `actStartState`'s
 * state are the same state, and that the jump's target list is the registry
 * rather than a list somebody typed.
 */

import { describe, expect, it } from 'vitest';
import { ACT1, ACTS, KNOWN_ACT_NUMBERS } from '../acts';
import { actStartState } from '../actStart';
import { JUMPED_TO_ACT, resolveActJump } from '../actJump';
import { hashState } from '../../sim/hash';

describe('the jump target list is the act registry', () => {
  it('resolves every act this build knows', () => {
    for (const act of ACTS) {
      const jump = resolveActJump(act.act);
      expect(jump, `act ${act.act} is registered and did not resolve`).not.toBeNull();
      expect(jump?.act).toBe(act);
    }
  });

  it('refuses an act this build does not have, rather than clamping to one it does', () => {
    /*
     * Clamping is the failure mode V11 rejected on the save side: it succeeds,
     * quietly, at something other than what was asked. The highest known act is
     * asserted alongside so this does not silently start passing on the day act
     * 3 is registered.
     */
    const highest = Math.max(...KNOWN_ACT_NUMBERS);
    expect(resolveActJump(highest + 1)).toBeNull();
    expect(resolveActJump(99)).toBeNull();
    expect(resolveActJump(0)).toBeNull();
    expect(resolveActJump(-1)).toBeNull();
  });

  it('refuses a number that is not an act number at all', () => {
    expect(resolveActJump(1.5)).toBeNull();
    expect(resolveActJump(Number.NaN)).toBeNull();
    expect(resolveActJump(Number.POSITIVE_INFINITY)).toBeNull();
  });
});

/** Resolves or fails the test, so nothing below has to narrow a null away. */
function jumpTo(act: number, options?: Parameters<typeof resolveActJump>[1]) {
  const jump = resolveActJump(act, options);
  if (jump === null) throw new Error(`act ${act} did not resolve`);
  return jump;
}

describe('a jump asks for a starting state rather than building one', () => {
  it('lands on exactly the state actStartState defines', () => {
    const jump = jumpTo(ACT1.act);
    const start = actStartState(ACT1);

    expect(hashState(jump.start.state)).toBe(hashState(start.state));
    expect(jump.start.act).toBe(start.act);
    expect(jump.start.unlocked).toEqual(start.unlocked);
    expect(jump.start.settings).toEqual(start.settings);
    expect(jump.start.carried).toBe(start.carried);
  });

  it('produces the same state every time, which is the only determinism a jump claims', () => {
    // NOT that a jumped session matches a played one. It does not and cannot.
    // The other two narrow forms are asserted through the runtime, in
    // src/ui/__tests__/actJump.test.ts.
    const a = jumpTo(ACT1.act);
    const b = jumpTo(ACT1.act);

    expect(hashState(a.start.state)).toBe(hashState(b.start.state));
    expect(a.start.state).not.toBe(b.start.state);
  });

  it('composes with the scenario door rather than fighting it', () => {
    const glucose = ACT1.poolIndex('glucose');
    const jump = jumpTo(ACT1.act, { initial: { glucose: 500 } });

    expect(jump.start.state.pools.amounts[glucose]).toBe(500);
    expect(jump.start.state.tickCount).toBe(0);
  });
});

describe('the mark', () => {
  it('is one key naming the target rather than a flag and a number', () => {
    // Two fields could disagree with each other and one cannot. Absent means
    // played, present means jumped and says to where.
    expect(JUMPED_TO_ACT).toBe('jumpedToAct');
  });

  it('is not applied by the jump itself, because settings belong to the runtime', () => {
    // The jump returns an act's beginning, and an act's beginning has empty
    // settings by definition. The runtime applies the mark at construction. If
    // this ever fails, a start state has grown a second opinion about settings.
    expect(jumpTo(ACT1.act).start.settings).toEqual({});
  });
});
