/**
 * Starting conditions from the URL, so both failure states can be reached
 * without editing code.
 *
 * UPDATELOGV3.md stage 6 requires that walled and starved are distinguishable at
 * a glance, and stage 7 requires playing both. A player only ever meets the
 * walled state, because the environment is sized so the starved one is out of
 * reach inside act 1, which is stage 6's own decision. So there has to be a door
 * to it, and a query parameter is the smallest one.
 *
 *     /                    the real act. Ferment locked, environment full
 *     /?glucose=500        starved. Every flux low together, nothing piling up
 *     /?ferment=on         skip the wall, for looking at the solved state
 *     /?jump=1             begin in act 1, ignoring the save. UPDATELOGV13.md
 *
 * NOT A SANDBOX. DESIGN.md's screen inventory has a Sandbox screen with all
 * unlocks and an adjustable environment, and this is not it: no interface, no
 * discoverability, and nothing here changes what a player who types no query
 * string sees. It is a development affordance and it should be replaced by the
 * real sandbox when that is built.
 *
 * ---------------------------------------------------------------------------
 * `?jump` IS THE SAME DOOR AND NOT THE SAME KIND OF THING
 * ---------------------------------------------------------------------------
 *
 * UPDATELOGV13.md stage 3 asked for the existing precedent rather than a new
 * mechanism, and this is it. Two differences are worth stating rather than
 * leaving to be discovered.
 *
 * IT PRODUCES A REAL STATE, WHICH `?ferment=on` DOES NOT. That parameter enables
 * a reaction without minting an unlock id, so a restored save has no `ferment`
 * in `progression.unlocked` and the setting evaporates on reload. NOW.md records
 * that as a known flaw. A jump cannot have it: it asks for an act's legal
 * starting state and the runtime persists that state like any other, unlock ids
 * and all.
 *
 * IT IGNORES THE SAVE, WHICH NOTHING ELSE HERE DOES. `?glucose=500` seeds a pool
 * for a NEW game and is silently ignored when a save exists, because the runtime
 * only calls the act's constructor when there is nothing to restore. A jump has
 * to override, or jumping to act 3 with an act 1 save on disk would load act 1
 * and do nothing. **So this is the one parameter in this file that can cost a
 * player their save**, and it costs them the most recent one with no copy kept.
 * See the stage 2 and stage 3 reports for the measurement.
 */

import { resolveActJump, type ActJump } from '../content/actJump';
import type { ActCreateOptions } from '../content/acts';
import type { Act1Options } from '../content/act1/reactions';

export function scenarioFromLocation(search: string): Partial<Act1Options> {
  const params = new URLSearchParams(search);
  const options: {
    initial?: Partial<Act1Options['initial']>;
    enabled?: Partial<Act1Options['enabled']>;
  } = {};

  const glucose = Number(params.get('glucose'));
  if (Number.isFinite(glucose) && glucose >= 0 && params.get('glucose') !== null) {
    options.initial = { glucose_env: glucose };
  }

  if (params.get('ferment') === 'on') {
    options.enabled = { ferment: true };
  }

  return options;
}

/**
 * `?jump=N`, or null when the parameter is absent, malformed or names an act
 * this build does not have.
 *
 * NULL FOR ALL THREE, AND THEY ARE NOT DISTINGUISHED. `?jump=banana` and
 * `?jump=3` against a build that knows one act both mean "no jump", and the
 * player gets the real act rather than an error. That is the behaviour every
 * other parameter in this file already has, and it is the right one for a door
 * with no interface: there is nowhere to show a message, and a development
 * affordance that can break the game for a typo is worse than one that quietly
 * does nothing.
 *
 * `create` is threaded through so `?jump=1&glucose=500` composes rather than one
 * parameter silently winning.
 */
export function jumpFromLocation(search: string, create?: ActCreateOptions): ActJump | null {
  const raw = new URLSearchParams(search).get('jump');
  if (raw === null) return null;

  const act = Number(raw);
  // `Number('')` is 0 and `Number(' 1 ')` is 1, so the guard is on the value
  // rather than on the text. A non-integer is not an act number, and
  // `resolveActJump` refuses one anyway; this is the cheaper half of the same
  // refusal and it keeps the registry lookup honest about what it was asked.
  if (!Number.isInteger(act)) return null;

  return resolveActJump(act, create);
}
