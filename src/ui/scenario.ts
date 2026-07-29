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
 *
 * NOT A SANDBOX. DESIGN.md's screen inventory has a Sandbox screen with all
 * unlocks and an adjustable environment, and this is not it: no interface, no
 * discoverability, and nothing here changes what a player who types no query
 * string sees. It is a development affordance and it should be replaced by the
 * real sandbox when that is built.
 */

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
