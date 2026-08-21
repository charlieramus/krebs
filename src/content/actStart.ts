/**
 * What an act looks like at its beginning, in exactly one place.
 *
 * UPDATELOGV13.md stage 1.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS FILE IS FOR
 * ---------------------------------------------------------------------------
 *
 * V13 builds a jump: a development and teacher affordance that drops a session
 * straight into act N without playing the acts before it. A jump has to produce
 * a legal starting state, and the one thing that must not happen is a second
 * definition of one. `docs/SAVE_SCHEMA.md` Part 3 settled the general form of
 * that argument on 2026-07-31 and NOW.md repeats it: `progression.unlocked` is
 * the source of truth for what has been bought, reaction flags are derived from
 * it and never persisted alongside it, because two copies of one fact is the
 * specific way save formats rot. A second definition of a starting state is that
 * defect one level up.
 *
 * So this function is the definition and everything else asks it.
 *
 * ---------------------------------------------------------------------------
 * WHERE THE DEFINITION USED TO LIVE, WHICH IS NOT WHERE THE STAGE EXPECTED
 * ---------------------------------------------------------------------------
 *
 * Stage 1 asked what the act boundary machinery produces when act 1 ends and
 * hands over. The answer is nothing, and not in the sense of being inline: there
 * is no handover at all. `src/ui/boundary.ts` is a DETECTOR. `ActBoundary` has
 * two members, `isComplete` and `nextContentAtp`, and neither returns a state.
 * `App.tsx` responds to the boundary by opening `EndOfContent`, a screen that
 * says where the game currently ends while the cell keeps ticking underneath.
 * Nothing produces act 2's starting state because act 2 does not exist, and
 * V11 was explicit that it would not invent one.
 *
 * What DID exist is one definition of "act N at its beginning" for N = 1, and it
 * was five expressions spread across thirty lines of `createActRuntime`, each on
 * the far side of its own `restoredOk === null` ternary: the constructor call,
 * the meter, an empty unlocked list, an empty settings bag and the act's zero
 * counters. A caller could not ask for that state without building a runtime,
 * and a jump that rebuilt those five expressions itself would be the second
 * definition. Hoisting them here is the whole of stage 1.
 *
 * ---------------------------------------------------------------------------
 * WHAT A STARTING STATE CONTAINS, AND WHAT IT DELIBERATELY DOES NOT
 * ---------------------------------------------------------------------------
 *
 * Enumerated against `docs/SAVE_SCHEMA.md`'s sections rather than assumed, which
 * is what stage 1 step 3 asks for. Five things are here:
 *
 *   state       pools, rng and tickCount, so the schema's `pools`, `rng` and
 *               `time.elapsedGameMs` all follow from it
 *   meter       the schema's `stats`
 *   unlocked    `progression.unlocked`, the source of truth
 *   settings    `settings`
 *   carried     the four counters `capture` cannot read off a simulation
 *
 * And `act`, which is `progression.act` and is read off the descriptor.
 *
 * THREE GROUPS ARE NOT HERE AND EACH ABSENCE IS A DECISION.
 *
 * `progression.transitionTaken` and `progression.shuttleChoice` are named by
 * stage 1 step 3 and are deliberately absent. They are decided by the act's own
 * `capture`, which already writes act 1's values as `false` and `null` with a
 * comment saying both are honestly true of the state rather than placeholders.
 * Putting them here as well would put the same two facts in two places, which is
 * the exact defect this file exists to prevent, and it would put act 3's
 * vocabulary into a function that abstracts over one act. `actStart.test.ts`
 * asserts that a captured start state carries the act's values, so the two
 * cannot drift apart without the suite noticing.
 *
 * `enzymes` and `environment` are absent for the same reason and are captured
 * the same way. So are the derived reaction enabled flags, which come from
 * `unlocked` at load and are never a second copy: V4 settled that and
 * `reloadDeterminism.test.ts` asserts it.
 *
 * ---------------------------------------------------------------------------
 * THE IMPORT DIRECTION
 * ---------------------------------------------------------------------------
 *
 * `src/content/` may import `src/sim/` and never the reverse, and it may not
 * import `src/ui/`. This file imports neither the interface nor the boundary
 * table. It reads the descriptor and nothing else, so the runtime and the jump
 * can both call it without either one owning it.
 */

import type { SimulationState } from '../sim/state';
import type { SaveSettingsV1 } from '../save/schema';
import type {
  ActCarriedCounters,
  ActCreateOptions,
  ActDescriptor,
  ActMeter,
} from './acts';

/**
 * An act at tick zero, before a player has touched it.
 *
 * Mutable where the thing itself is mutable and readonly where it is not.
 * `state` and `meter` are live objects the runtime ticks and meters, so freezing
 * them would be a lie; `unlocked`, `settings` and `carried` are values the
 * runtime copies or replaces rather than edits, which is the posture
 * `createActRuntime` already takes on all three.
 */
export interface ActStartState {
  /** `progression.act`. Read off the descriptor, never passed in. */
  readonly act: number;
  /** Pools at their initial amounts, a seeded PRNG, and tickCount of zero. */
  readonly state: SimulationState;
  /** A zeroed meter. The schema's `stats`. */
  readonly meter: ActMeter;
  /**
   * Nothing has been bought.
   *
   * Empty rather than absent, and it is the source of truth rather than a
   * summary of one: every reaction flag the runtime applies at load is derived
   * from this list.
   */
  readonly unlocked: readonly string[];
  /**
   * No interface setting has been chosen.
   *
   * Empty rather than defaulted, which matters. `settings` is an open bag and
   * every consumer already reads it with a default: `firstRunSeen` absent means
   * the first run has not been seen, and `boundarySeen` absent means the act
   * boundary has not been. Writing those keys as `false` here would say the
   * same thing in more bytes and would make a build that does not know a key
   * indistinguishable from one that does.
   */
  readonly settings: SaveSettingsV1;
  /** The four counters at zero. The act's own, not this file's. */
  readonly carried: ActCarriedCounters;
}

/**
 * Act N at its beginning.
 *
 * THE ONLY DEFINITION. `createActRuntime` calls it for a new game and the jump
 * calls it to land somewhere; nothing else builds one of these by hand.
 *
 * `options` is passed straight through to the act's constructor and exists for
 * the development scenario door, which seeds pool amounts from a query string.
 * A start state built with overrides is still a legal state and is still the
 * same shape; it is just not the state a fresh player gets. That is the same
 * carve-out `src/ui/scenario.ts` already documents about itself.
 *
 * ALLOCATES A NEW STATE EVERY CALL, and callers depend on it. Two calls must not
 * hand back the same `Float64Array` behind two names, because a test that
 * compares one start state against another would then be comparing an object
 * with itself and would pass for the wrong reason.
 */
export function actStartState(
  descriptor: ActDescriptor,
  options?: ActCreateOptions,
): ActStartState {
  return {
    act: descriptor.act,
    state: descriptor.create(options),
    meter: descriptor.createMeter(),
    unlocked: [],
    settings: {},
    carried: descriptor.noCarriedCounters,
  };
}
