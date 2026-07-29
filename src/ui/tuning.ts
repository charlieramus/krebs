/**
 * =========================================================================
 *  PROVISIONAL. NOT MEASUREMENTS. NOT BALANCED. DO NOT CITE ANY OF THIS.
 * =========================================================================
 *
 * Every interface number that is a game decision rather than a design token.
 * All of them, in this file, and nowhere else. If one appears outside this
 * file, that is the bug.
 *
 * Same header treatment and same status as src/content/act1/tuning.ts, because
 * these are the same kind of number: first-fit values chosen so the interface
 * behaves, never played, never balanced, and not derived from anything.
 *
 * WHAT LIVES HERE AND WHAT DOES NOT. Design tokens live in src/index.css and
 * come from DESIGN.md, which is a specification, so they are not tuning. These
 * are the numbers nobody has specified: a threshold below which an arrow reads
 * as stopped, how fast a dash should travel, what an unlock costs. They exist
 * because the interface had to pick something.
 *
 * THE DEBT. Every value below owes a row in the divergence table in
 * docs/ECONOMY.md once that document exists. It does not exist yet and should
 * not: NOW.md is explicit that it needs a playable prototype first, and this log
 * is the one that produces the prototype. Stage 7 makes the recommendation to
 * write it. Every one of these renders with a Tuned badge wherever it reaches
 * the screen.
 *
 * Introduced by UPDATELOGV3.md, stage 5 for the motion values and stage 6 for
 * the unlocks.
 */

import { tuned, type BadgeSpec } from './components/Badge';

/* ===========================================================================
   MOTION. UPDATELOGV3.md stage 5.
   =========================================================================== */

/**
 * Applied flux, in pool units per game-second, below which an arrow stops being
 * drawn as moving and drops to the inert treatment.
 *
 * WHY THIS NUMBER MATTERS MORE THAN ITS VALUE. A dash animation that
 * asymptotically slows reads as "working, but slowly" when the truth is
 * "stopped", and stopped is exactly the walled state. A player who reads the
 * NAD+ wall as a slowdown never finds out there is a wall, so the whole of act
 * 1's teaching beat depends on an arrow that is doing nothing looking like it
 * is doing nothing.
 *
 * HOW 0.25 WAS PICKED. At DASH_PIXELS_PER_FLUX_UNIT below, a flux of 0.25 moves
 * a dash at 1.5 pixels per second, which is under the rate at which movement is
 * perceptible against a static background at normal viewing distance. Above it
 * the motion is visible; below it the arrow would be claiming to be alive while
 * showing a player nothing they can see. For scale, act 1's fluxes run between
 * roughly 7 and 26 at full tilt, so this fires only when a reaction is doing
 * about one to three percent of its working rate.
 *
 * It is a perception threshold reasoned from a pixel rate, not a measurement,
 * and nobody has watched it with fresh eyes yet. Stage 7 does that.
 */
export const ZERO_FLUX_THRESHOLD = 0.25;

/**
 * Pixels of dash travel per unit of applied flux per game-second.
 *
 * Sets how fast the pathway looks. At 6, uptake's working flux of about 7.6
 * moves a dash roughly 46 pixels per second, which clears one dash period every
 * third of a second: brisk enough to read as flowing, slow enough to track with
 * the eye. Chosen by watching it, which is the only way to choose it, and
 * therefore exactly the kind of number that owes a divergence row.
 */
export const DASH_PIXELS_PER_FLUX_UNIT = 6;

/** Dash and gap length in pixels. One period is twice this. */
export const DASH_LENGTH = 8;

/* ===========================================================================
   THE BADGE

   Everything in this file is a game decision, so everything in this file
   renders Tuned. The reason string is per value rather than shared, because
   "Tuned" without a reason is a badge that says nothing.
   =========================================================================== */

export const TUNING_BADGES = {
  zeroFluxThreshold: tuned(
    'Below this an arrow reads as stopped rather than slow. A perception threshold, not a measurement',
  ),
  dashSpeed: tuned('How fast the pathway looks. Chosen by watching it'),
} as const satisfies Readonly<Record<string, BadgeSpec>>;
