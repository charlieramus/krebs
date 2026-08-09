/**
 * The cross-engine determinism probe. UPDATELOGV9.md stage 2.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS EXISTS TO SETTLE
 * ---------------------------------------------------------------------------
 *
 * CLAUDE.md hard rule 5 bans Math.pow, Math.exp and Math.log in simulation code,
 * and the reason eslint.config.js gives is that the ECMAScript specification
 * permits implementation-approximated results for them, so they differ between
 * engines and break cross-browser determinism.
 *
 * That rule has been enforced since V1 and never tested. vite.config.ts sets
 * `environment: 'node'`, so every determinism assertion in this project has been
 * checked in node and nowhere else. The claim was an argument from the
 * specification rather than a measurement, and it was the claim this project
 * asserted most confidently and tested least.
 *
 * ---------------------------------------------------------------------------
 * WHY IT LIVES HERE RATHER THAN IN A TEST
 * ---------------------------------------------------------------------------
 *
 * A vitest file cannot run in WebKit. This module is plain TypeScript importing
 * the real kernel and the real act 1 content, so the same code path can be
 * driven from node and from a browser page and the two results mean the same
 * thing. It exercises the shipped kernel rather than a copy: nothing is
 * reimplemented here, and the two run scripts are transcribed from the existing
 * determinism tests so that the canonical hashes below are the ones those tests
 * already assert.
 *
 * If this file ever disagrees with src/sim/__tests__/determinism.test.ts or
 * src/content/act1/__tests__/determinism.test.ts about how a script runs, those
 * files are right and this one is wrong.
 */

import { hashState } from '../sim/hash';
import type { Reaction } from '../sim/reactions';
import type { SimulationState } from '../sim/state';
import { setShortfallLogging, tick } from '../sim/tick';
import { createToyPathway } from '../sim/__tests__/fixtures/toyPathway';
import { createAct1 } from '../content/act1/reactions';

/**
 * The toy pathway script, transcribed from src/sim/__tests__/determinism.test.ts.
 * Every 50 ticks it uses the PRNG to toggle one reaction.
 */
function runToyScript(seed: number, ticks: number): SimulationState {
  const state = createToyPathway({ seed });

  for (let t = 0; t < ticks; t += 1) {
    if (t > 0 && t % 50 === 0) {
      const roll = state.prng.next();
      const index = Math.floor(roll * state.reactions.length);
      const reaction = state.reactions[index];
      if (reaction !== undefined) reaction.enabled = !reaction.enabled;
    }
    tick(state);
  }

  return state;
}

/**
 * The act 1 script, transcribed from src/content/act1/__tests__/determinism.test.ts.
 * Every 50 ticks it SETS `ferment` from the roll rather than toggling, so the
 * roll value reaches the pools rather than only the RNG state field.
 */
function runAct1Script(seed: number, ticks: number): SimulationState {
  const state = createAct1({ seed });
  const ferment = state.reactions.find((r) => r.id === 'ferment') as Reaction;

  for (let t = 0; t < ticks; t += 1) {
    if (t > 0 && t % 50 === 0) {
      ferment.enabled = state.prng.next() < 0.5;
    }
    tick(state);
  }

  return state;
}

/** The two frozen fixture runs. These seeds and tick counts produce the canonical hashes. */
export const TOY_CANONICAL_SEED = 20260728;
export const ACT1_CANONICAL_SEED = 20260729;
export const CANONICAL_TICKS = 1200;

/**
 * THE LONG RUN, AND WHY IT IS THIS LONG.
 *
 * The canonical runs are 1200 ticks, which is 60 seconds of game time. That is
 * the minimum that produces a meaningful hash and it is a weak instrument for
 * this particular question. A last-bit float difference is invisible until it
 * compounds, and the thing that compounds it is the nonlinear integrator: Hill
 * kinetics with integer exponents by repeated multiplication, proportional
 * shortfall scaling, and division by a saturation term that a divergent input
 * moves.
 *
 * 200000 ticks is 10000 seconds of game time, which is 2h46m. Act 1's
 * environment empties at 93m07s and the cell stops at 104m05s, so a run this
 * long carries the pathway through saturation, through the drawdown, through
 * starvation and out the far side into the denormal-ATP regime that NOW.md
 * blocking item 1 is about. Those are the arithmetic conditions most likely to
 * expose an engine difference, and a 1200-tick run never reaches any of them.
 *
 * It costs a few seconds per engine, which is the right price for the one
 * measurement this project has been asserting without.
 */
export const LONG_TICKS = 200000;

export interface ProbeResult {
  /** Must equal the value src/sim/__tests__/determinism.test.ts freezes. */
  readonly toyCanonical: string;
  /** Must equal the value src/content/act1/__tests__/determinism.test.ts freezes. */
  readonly act1Canonical: string;
  /** No frozen expectation. Compared across engines against the node reference. */
  readonly toyLong: string;
  readonly act1Long: string;
  readonly ticks: { readonly canonical: number; readonly long: number };
}

export function runDeterminismProbe(): ProbeResult {
  // Logging only. Off so a 200000-tick starved run does not emit a shortfall
  // line per tick, which would dominate the runtime and prove nothing.
  setShortfallLogging(false);

  return {
    toyCanonical: hashState(runToyScript(TOY_CANONICAL_SEED, CANONICAL_TICKS)),
    act1Canonical: hashState(runAct1Script(ACT1_CANONICAL_SEED, CANONICAL_TICKS)),
    toyLong: hashState(runToyScript(TOY_CANONICAL_SEED, LONG_TICKS)),
    act1Long: hashState(runAct1Script(ACT1_CANONICAL_SEED, LONG_TICKS)),
    ticks: { canonical: CANONICAL_TICKS, long: LONG_TICKS },
  };
}
