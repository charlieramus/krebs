/**
 * The act jump. UPDATELOGV13.md stage 2.
 *
 * ---------------------------------------------------------------------------
 * WHAT IT IS, AND WHAT IT IS NOT
 * ---------------------------------------------------------------------------
 *
 * A development and teacher affordance that begins a session in act N without
 * playing the acts before it. It is NOT a player-facing skip. docs/PROGRESSION.md
 * says acts are strictly sequential and that is not negotiable, so nothing here
 * is reachable from the act screen and nothing in the interface offers it. The
 * existing precedent is `src/ui/scenario.ts`, a development door behind a query
 * string that documents itself as one.
 *
 * ---------------------------------------------------------------------------
 * IT DOES NOT DEFINE A STARTING STATE. IT ASKS FOR ONE.
 * ---------------------------------------------------------------------------
 *
 * This file is a thin wrapper over `actStartState` and it is thin on purpose.
 * Stage 1 established that there is exactly one definition of what act N looks
 * like at its beginning, and the whole risk of this log is a second one
 * appearing here. So the jump resolves an act number to a descriptor and asks
 * the one function for the state. It computes nothing about pools, unlocks or
 * progression itself, and if it ever needs to, the answer is to move that into
 * `actStart.ts` rather than to add it here.
 *
 * ---------------------------------------------------------------------------
 * THE TARGET LIST COMES FROM THE REGISTRY
 * ---------------------------------------------------------------------------
 *
 * `findAct` answers, so an act this build does not have is not jumpable and
 * registering act 3 makes it jumpable with no edit to this file. That is the
 * same lookup the save-side refusal uses: V11 built `findAct` returning null
 * rather than undefined precisely so the unknown case is something a caller has
 * to handle, and this is the second caller that has to handle it.
 *
 * ---------------------------------------------------------------------------
 * WHAT A JUMP DELIBERATELY DOES NOT DO
 * ---------------------------------------------------------------------------
 *
 * It does not play the act transition. A jump lands a session in an act; the
 * boundary set piece is a thing the game shows when an act ENDS, and conflating
 * the two would give that set piece two triggers, one of which is a debugging
 * tool. Act 1's `EndOfContent` is untouched by this file and by everything that
 * calls it.
 *
 * And it makes no determinism claim it cannot keep. A jumped state is fabricated,
 * so the run after it is not the run a player would have had, and nothing here
 * pretends otherwise. What holds is narrower and is asserted in
 * `actJump.test.ts`: the same jump produces the same state every time, a session
 * begun by a jump is internally deterministic, and a jumped session reloads
 * identically. docs/SIMULATION.md Part 5 already models a determinism claim as
 * several separate statements rather than one.
 */

import { findAct, type ActCreateOptions, type ActDescriptor } from './acts';
import { actStartState, type ActStartState } from './actStart';

/**
 * The settings key a jumped save carries.
 *
 * DIAGNOSTIC ONLY, NEVER BRANCHED ON, which is the posture
 * docs/SAVE_SCHEMA.md Part 2 sets for the build id under `meta`, and the reason
 * that field exists: a player-submitted save should say what produced it. A save
 * that skipped four hours of play is exactly that case. `jumpedToAct.test.ts`
 * asserts nothing compares, matches or switches on this key, the same way the
 * matching guard in `src/save/__tests__/` has asserted it for that field
 * since V9.
 *
 * THE IDENTIFIER IS SPELLED OUT IN PROSE ABOVE AND NOT AS CODE, ON PURPOSE. That
 * V9 guard is a substring search over the source tree with an allowlist of files
 * that legitimately USE the field, so a file citing it in a comment fails it.
 * Widening the allowlist for a citation would make the list mean two things at
 * once. It cost this file one reworded sentence and the guard keeps its property:
 * outside tests, a mention is a use.
 *
 * A NUMBER RATHER THAN A BOOLEAN, because "was this jumped" and "to which act"
 * are one fact rather than two: absent means played, present means jumped and
 * names the target. Two fields could disagree with each other and one cannot.
 *
 * NO SCHEMA BUMP. `settings` is an open bag of scalars and this is an additive
 * key new code defaults, which is the V6 `firstRunSeen` and V11 `boundarySeen`
 * case exactly. docs/SAVE_SCHEMA.md Part 1 names the next expected bump as the
 * act 2 log, forced by per-reaction Vmax becoming hashed state, and this is not
 * that.
 */
export const JUMPED_TO_ACT = 'jumpedToAct';

/** An act to run, and the state to run it from. */
export interface ActJump {
  /** The act. Passed to `createActRuntime` as the descriptor. */
  readonly act: ActDescriptor;
  /** Its beginning, from the one definition of one. */
  readonly start: ActStartState;
}

/**
 * Resolve an act number to a jump, or null if this build does not have that act.
 *
 * NULL RATHER THAN A THROW, and rather than clamping to the highest known act.
 * Clamping is the failure mode V11 rejected on the save side for the reason that
 * applies here too: it succeeds, quietly, at something other than what was
 * asked. The caller decides what to do with a jump it cannot make, and the URL
 * door in `src/ui/scenario.ts` ignores it exactly as it ignores a malformed
 * `?glucose=`.
 *
 * `options` reaches the act's constructor, so `?jump=1&glucose=500` composes
 * with the existing scenario door rather than fighting it.
 */
export function resolveActJump(act: number, options?: ActCreateOptions): ActJump | null {
  const descriptor = findAct(act);
  if (descriptor === null) return null;
  return { act: descriptor, start: actStartState(descriptor, options) };
}
