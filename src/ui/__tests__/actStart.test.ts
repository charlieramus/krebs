/**
 * The two callers agree. UPDATELOGV13.md stage 1 step 4.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS FILE ASSERTS, AND WHAT IT CANNOT ASSERT YET
 * ---------------------------------------------------------------------------
 *
 * Stage 1 step 4 asks for a test that reaches act N by the boundary, reaches act
 * N by the jump, and compares the two states. **Neither caller exists at stage
 * 1** and the stage's own step 5 forbids building one of them here.
 *
 * The boundary does not hand over. `src/ui/boundary.ts` is a detector with two
 * members, `isComplete` and `nextContentAtp`, and neither returns a state; the
 * screen on the other side of it is `EndOfContent`, which says where the game
 * currently ends. And the jump is stage 2, whose own Verify line is "the jump
 * produces a state identical to the boundary's", so the boundary-versus-jump
 * comparison is stage 2's test rather than this one's. See the stage 1 report.
 *
 * What DOES have two callers at stage 1 is `actStartState`, and they are the two
 * that matter for the defect the stage is preventing: the runtime's new-game
 * path, which was the only definition of act N's beginning before this stage,
 * and a direct call, which is the shape the jump will use. This file asserts
 * they are not merely compatible but identical.
 *
 * ---------------------------------------------------------------------------
 * WHY IT LIVES IN src/ui/__tests__/
 * ---------------------------------------------------------------------------
 *
 * It has to build a runtime, and nothing in `src/content/` imports the
 * interface. The content half of these assertions is in
 * `src/content/__tests__/actStart.test.ts`.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { ACT1 } from '../../content/acts';
import { actStartState } from '../../content/actStart';
import { hashState } from '../../sim/hash';
import { setShortfallLogging } from '../../sim/tick';
import { createActRuntime } from '../runtime';

beforeAll(() => {
  setShortfallLogging(false);
});

/**
 * A runtime with persistence off.
 *
 * Off rather than pointed at a memory store, because a store would make this a
 * test about loading. The property under test is what a session starts from when
 * there is nothing to start from.
 */
function newGame() {
  return createActRuntime(ACT1, { persistence: { enabled: false } });
}

describe('the runtime new-game path is actStartState rather than a second copy of it', () => {
  it('produces a byte-identical simulation state', () => {
    const runtime = newGame();
    const start = actStartState(ACT1);

    expect(hashState(runtime.state)).toBe(hashState(start.state));
    expect(Array.from(runtime.state.pools.amounts)).toEqual(
      Array.from(start.state.pools.amounts),
    );
    expect(runtime.state.tickCount).toBe(start.state.tickCount);
    expect(runtime.state.prng.seed).toBe(start.state.prng.seed);
    expect(runtime.state.prng.state).toBe(start.state.prng.state);
  });

  it('produces the same unlocked list, settings and carried counters', () => {
    const runtime = newGame();
    const start = actStartState(ACT1);
    const save = runtime.capture();

    expect(save.progression.unlocked).toEqual(start.unlocked);
    expect(save.settings).toEqual(start.settings);
    expect(save.diagnostics.offlineFallbackCount).toBe(start.carried.offlineFallbackCount);
    expect(save.diagnostics.negativePoolScalingEvents).toBe(
      start.carried.negativePoolScalingEvents,
    );
    expect(save.time.offlineCreditedMs).toBe(start.carried.offlineCreditedMs);
    expect(save.stats.eventsProcessed).toBe(start.carried.eventsProcessed);
  });

  it('captures the same save a start state captures, field for field', () => {
    /*
     * THE STRONGEST FORM OF THE CLAIM, AND THE ONE WORTH HAVING. The two
     * assertions above compare the pieces this test happens to name. This one
     * compares the whole persisted document, so a field added to the save by a
     * later log is covered on the day it is added rather than on the day
     * somebody remembers to widen a list.
     *
     * `meta` is excluded and it is the only exclusion. It carries wall-clock
     * timestamps and the build id, none of which is a fact about an act's
     * beginning, and `src/save/meta.ts` is deliberately the one file in the
     * project allowed to read a clock.
     */
    const runtime = newGame();
    const start = actStartState(ACT1);

    const fromRuntime = runtime.capture();
    const fromStart = ACT1.capture(start.state, start.meter, start.unlocked, start.settings, {
      meta: fromRuntime.meta,
      carried: start.carried,
    });

    expect(fromStart).toEqual(fromRuntime);
  });

  it('passes construction overrides through the same way, so the scenario door still works', () => {
    const glucose = ACT1.poolIndex('glucose');
    const create = { initial: { glucose: 500 }, enabled: { ferment: true } };

    const runtime = createActRuntime(ACT1, { create, persistence: { enabled: false } });
    const start = actStartState(ACT1, create);

    expect(runtime.state.pools.amounts[glucose]).toBe(500);
    expect(hashState(runtime.state)).toBe(hashState(start.state));
  });

  it('does not share a state object between a runtime and a start state', () => {
    // The runtime ticks its state in place. If a start state were the same
    // object, a second session would begin wherever the first one stopped.
    const runtime = newGame();
    const start = actStartState(ACT1);

    expect(runtime.state).not.toBe(start.state);
    expect(runtime.state.pools.amounts).not.toBe(start.state.pools.amounts);
  });
});
