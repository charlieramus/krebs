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
   UNLOCKS. UPDATELOGV3.md stage 6.

   TWO PURCHASABLE THINGS, BOTH FINITE.

   Neither subtracts from the ATP pool. The adenylate pool is fixed, closed and
   conserved, so taking ATP out of it to pay for something breaks the
   conservation test on the tick it happens. That is the true reason and it is
   also the more honest statement about a cell: a cell does not save up ATP, it
   produces it at a rate. Costs are therefore THRESHOLDS against the cumulative
   counter in src/content/act1/meter.ts, which already lives outside the
   simulation for exactly this reason. Do not "fix" this by making it a purchase.
   =========================================================================== */

/**
 * Cumulative gross ATP before lactate dehydrogenase can be bought.
 *
 * CONSTRAINED FROM ABOVE BY A MEASUREMENT, not chosen freely. With ferment
 * disabled the nicotinamide pool is the ceiling on everything: each NAD+ that
 * becomes NADH yields its 2 ATP once and never again, so cumulative ATP
 * converges to exactly 60 and stops there forever. Any threshold at or above 60
 * is unbuyable and leaves the player at a wall whose solution they can never
 * afford. See src/ui/__tests__/unlockPacing.report.test.ts, which asserts that
 * ceiling exists rather than trusting this comment.
 *
 * 55 puts the unlock in reach just as the pathway dies, so the wall and its
 * answer arrive together. Whether that is the right beat, or whether the answer
 * should appear only after the player has sat in the stall for a while, is
 * precisely what stage 7 plays to find out.
 */
export const FERMENT_ATP_THRESHOLD = 55;

/**
 * Uptake Vmax by capacity step. ENUMERATED, NOT A MULTIPLIER.
 *
 * CLAUDE.md hard rule 3 forbids infinite scaling, and an upgrade with no last
 * step is infinite scaling wearing a small number. There are three entries here
 * and there will never be a fourth without someone editing this array, which is
 * the point.
 *
 * THE LADDER STOPS AT 12 BECAUSE MEASUREMENT SAYS IT MUST, and this replaced a
 * planned ladder of 8, 12, 18, 26. `prep` runs at Vmax 12 in
 * src/content/act1/tuning.ts, so uptake above 12 delivers glucose the
 * preparatory phase cannot consume. Measured, in
 * unlockPacing.report.test.ts: uptake 8 reaches 30000 cumulative ATP in 17m05s,
 * 12 reaches it in 11m24s, and 14 and 18 both reach it in 11m03s. The last two
 * steps of the planned ladder would have sold the player nothing.
 *
 * This log's Decisions section says uptake is rate-limiting by construction and
 * therefore the one lever worth selling. That is true only up to 12. Selling a
 * step past the knee would be a purchase that does nothing, and the fact that
 * it would LOOK like it should work is exactly why it must not ship.
 *
 * The first entry is the shipped default and is not purchasable.
 */
export const UPTAKE_VMAX_STEPS: readonly number[] = [8, 10, 12];

/**
 * Cumulative gross ATP for each purchasable uptake step.
 *
 * One entry per step above the first, so index 0 buys step 1. Spaced from the
 * measurement in unlockPacing.report.test.ts against stage 7's play session
 * rather than against docs/PROGRESSION.md's 45 to 90 minutes for the whole act:
 * V3 has two unlocks and act 1 will eventually have many, so pacing the slice to
 * the full act's length would put both purchases in the first two minutes and
 * leave eighty-eight with nothing in them.
 *
 * At the default Vmax these land at roughly one minute and roughly seven.
 */
export const UPTAKE_ATP_THRESHOLDS: readonly number[] = [1500, 12000];

/* ===========================================================================
   THE ENVIRONMENT

   Sized in stage 6 from stage 1's measurement. The reasoning is in the stage 6
   report and the value itself lives in src/content/act1/tuning.ts, because the
   environment is content rather than interface. Named here only so the search
   for "where do the act 1 numbers live" finds both files.
   =========================================================================== */

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
  fermentThreshold: tuned(
    'Bounded above by the measured cumulative-ATP ceiling of a walled cell, which is 60. Above that the unlock is unbuyable',
  ),
  uptakeThreshold: tuned(
    'Spaced so the capacity ladder is climbed across act 1 rather than in its first minute',
  ),
  uptakeVmax: tuned('A finite ladder of four steps. Hard rule 3 forbids an upgrade with no last step'),
} as const satisfies Readonly<Record<string, BadgeSpec>>;
