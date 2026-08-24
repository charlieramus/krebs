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
 * answer arrive together.
 *
 * THIS NUMBER CANNOT BE TUNED TO CHANGE THAT, AND STAGE 4 MEASURED THE RANGE.
 * V3 left open whether the answer should instead appear only after the player
 * has sat in the stall for a while. It cannot, by moving this. Cumulative ATP
 * converges on 60 in the same breath as the pathway dies:
 *
 *     50      reached at 2.45s      0.50s BEFORE the wall
 *     55                 2.60s      0.35s before
 *     58                 2.70s      0.25s before
 *     59.9               2.90s      0.05s before
 *     59.99              3.05s      0.10s after
 *
 * The wall arrives at 2.95s. The whole usable range of this number spans half a
 * second either side of it, and the top of the range is unbuyable. **A delay
 * between the wall and its answer is not a threshold decision**, it is an
 * interface one, and it belongs with the coach mark rather than here.
 *
 * 55 is kept rather than raised. It sits 8 percent below the ceiling, where a
 * later change that lowers the nicotinamide total has room to move before this
 * becomes unbuyable, and the alternative buys nothing measurable.
 */
export const FERMENT_ATP_THRESHOLD = 55;

/**
 * Cumulative gross ATP before the ethanol branch can be bought. Added by
 * UPDATELOGV10.md stage 2 and derived from a clock in stage 5.
 *
 * UNLIKE FERMENT_ATP_THRESHOLD, THIS ONE HAS A RANGE. That number is trapped
 * between a wall at 2.95 game-seconds and an unbuyable ceiling of 60, so it has
 * half a second to live in. This one is a spacing decision like the two ladders:
 * the branch is not an answer to anything, it is a second option offered to a
 * player whose cell is already running, so it can land wherever the act needs a
 * beat.
 *
 * ALSO GATED, AND THE GATE IS NOT THIS NUMBER. `canBuyEthanol` refuses until the
 * lactate branch has been bought, whatever the meter says. The NAD+ wall gets
 * one answer, not a fork between two things a player has no way to tell apart
 * yet. docs/PROGRESSION.md lists lactate at 7 and ethanol at 8.
 */
export const ETHANOL_ATP_THRESHOLD = 52000;

/**
 * Cumulative gross ATP before glycogen storage can be bought. Added by
 * UPDATELOGV10.md stage 3 and derived from a clock in stage 5.
 *
 * IT IS THE LAST PURCHASE IN THE ACT AND THAT IS WHAT THE NUMBER SAYS. The
 * glycolytic ladder's last rung lands at 61m57s on 195000 cumulative ATP, and
 * `canBuyGlycogen` refuses until that ladder is finished, so this number only
 * ever binds after it. It is placed so the reserve is offered while there is
 * still food left to charge it out of, which at the top rung means before about
 * 75 game-minutes.
 *
 * PROVISIONAL, like ETHANOL_ATP_THRESHOLD, and for the same reason: stage 3 has
 * no instrumented run of the whole act to read it off. Stage 5 re-derives it.
 */
export const GLYCOGEN_ATP_THRESHOLD = 36000;

/* ===========================================================================
   THE REGULATED GLYCOLYTIC ENZYMES. UPDATELOGV10.md stage 4.

   docs/PROGRESSION.md act 1 item 5, and docs/SCIENCE.md Part 2, Regulation:
   hexokinase, phosphofructokinase-1 and pyruvate kinase are the three steps of
   glycolysis held far from equilibrium, which is what makes a step controllable
   at all. The other seven follow their substrates and an upgrade to one of them
   would move nothing.

   THREE ENZYMES, ONE PURCHASE, AND ALL THREE REDUCTIONS WERE MEASURED RATHER
   THAN REASONED. Stage 4 built all three, swept all eight on-and-off
   combinations across all five glycolytic rungs, and climbed the ladder live
   rather than only starting cold. Two of the three did not survive it.

     PFK-1 ALONE KILLS THE CELL. It raises `prep` Vmax, and V5's stability
     condition is that `payoff` Vmax must strictly exceed twice `prep` Vmax. At
     the top of the uptake ladder that margin is 2.00, so any rise in `prep`
     spends it. Measured at rung 0: 42.2175 ATP per second to 0.0000, with 3838
     glucose piled up inside a corpse.

     PYRUVATE KINASE ALONE BUYS NOTHING. Exactly 0.00 percent at every rung,
     because the payoff phase is not the bottleneck in any configuration act 1
     reaches. Raising a ceiling nothing is touching changes no flux.

     HEXOKINASE IS NOT SHIPPED AT ALL, and it is the finding rather than the
     casualty. Modelled as an affinity upgrade it multiplies `ACT1_KM.prep`, and
     that K is shared across glucose and ATP, which docs/SCIENCE.md Part 1
     discloses as a simplification. Measured at the top of the uptake ladder,
     `sat(glucose)` is 0.999998 with the upgrade and 0.999998 without it. **The
     glucose term is fully saturated and hexokinase moves it by nothing.** All of
     its 6.07 percent came from `sat(atp)`, 0.879530 to 0.932951, which is the
     preparatory phase gripping ATP harder. That is not what hexokinase does, and
     it is the exact property UPDATELOGV5.md's bootstrap repair depends on: it
     stops `prep` backing off as ATP falls. Climbed live it killed the cell at
     rung 4 on its own and at rung 1 alongside the other two. A label with the
     wrong thing behind it does not ship.

   So the two that survive are one purchase, on exactly the reasoning
   UPDATELOGV5.md used for the two phases of glycolysis. **Pyruvate kinase's
   function in this game is to make phosphofructokinase-1 safe**, which is a true
   statement about the pathway rather than a bookkeeping convenience: the exit
   has to be widened before the entrance can be.
   =========================================================================== */

/**
 * What phosphofructokinase-1 and pyruvate kinase do together to the two phases.
 *
 * ONE FACTOR ON BOTH, AND THE EQUALITY IS WHAT MAKES IT SAFE. V5's condition is
 * that `payoff` Vmax strictly exceeds twice `prep` Vmax, which is a statement
 * about their RATIO, so scaling both by the same number preserves it exactly at
 * every rung of the capacity ladder. Checked at all five:
 *
 *     rung   prep   payoff   payoff - 2*prep
 *        0   13.8     29.9              2.30
 *        1   16.1     34.5              2.30
 *        2   18.4     41.4              4.60
 *        3   20.7     46.0              4.60
 *        4   23.0     50.6              4.60
 *
 * WHAT IT ACTUALLY BUYS, MEASURED ON A LIVE CLIMB THROUGH THE WHOLE LADDER WITH
 * A DRAIN-FREE LARDER, ATP per second settled fifteen minutes into each rung:
 *
 *     factor    rung 0   rung 1   rung 2   rung 3   rung 4
 *       1.00    42.217   50.462   58.849   67.384   76.093
 *       1.05    44.676   53.381   62.244   71.279   80.527
 *       1.10    47.147   56.317   65.665   67.997   75.996
 *       1.15    49.631   59.272   59.997   67.997   75.996
 *       1.20    52.128   51.997   59.997   67.997   75.996
 *
 * **The ceiling is four times the uptake Vmax and the enzymes are how the cell
 * reaches it.** 51.997, 59.997, 67.997 and 75.996 are 4 x 13, 15, 17 and 19: at
 * and above 1.10 the preparatory phase consumes everything transport delivers
 * and more enzyme buys nothing, because there is nothing left to buy. The
 * figures above the ceiling are a cell eating its own stockpile, which is real
 * ATP and is not a rate.
 *
 * **So the permanent gain is at rung 0 and the rest is a drawdown.** NOW.md
 * records that the top of the uptake ladder over-delivers permanently, pushing
 * intracellular glucose up by about 87 a minute forever, and calls it a feature
 * with a purchase attached. This is that purchase. At 1.15 the pile at rung 0
 * falls from 3454 to 1786 over fifteen minutes and keeps falling, and the cell
 * runs at 49.631 against a baseline of 42.217 while it does.
 *
 * 1.15 rather than 1.20 because 1.20 puts rung 1 straight onto the transport
 * ceiling and the purchase stops being visible one rung later. 1.15 leaves the
 * drawdown running across two rungs.
 */
export const PFK1_PK_VMAX_FACTOR = 1.15;

/**
 * Cumulative gross ATP before the phosphofructokinase-1 and pyruvate kinase
 * purchase. Provisional, derived from a clock in stage 5.
 *
 * THE WINDOW IS ONE RUNG WIDE AND STAGE 4 MEASURED IT. The purchase is worth
 * 17.6 percent at glycolytic rung 0 and nothing at all at rung 4, because it
 * raises the preparatory phase and the preparatory phase is only the bottleneck
 * while transport is over-delivering, which is exactly the state the top of the
 * uptake ladder leaves the cell in. So it is gated to sit between the two
 * ladders, and the glycolytic ladder is gated behind it.
 */
export const PFK1_PK_ATP_THRESHOLD = 68000;

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
 * One entry per step above the first, so index 0 buys step 1.
 *
 * RE-DERIVED FROM A CLOCK IN UPDATELOGV5.md STAGE 4, was 1500 and 12000. V3
 * spaced these against its own play session and said so, on the argument that a
 * two-unlock slice paced to a full act would put both purchases in the first two
 * minutes and leave eighty-eight with nothing in them. Act 1 has seven purchases
 * now, so that argument has expired and the act's own target is usable for the
 * first time.
 *
 * HOW THEY WERE DERIVED. Target times were chosen first, then a run was
 * instrumented to record what cumulative ATP stood at when it reached them.
 * These are those readings, rounded: 2m00s and 9m00s. Adjusting a threshold by
 * feel and then measuring where it landed is the loop this replaces.
 */
export const UPTAKE_ATP_THRESHOLDS: readonly number[] = [4000, 20000];

/* ===========================================================================
   GLYCOLYTIC CAPACITY. UPDATELOGV5.md stage 3.

   THE SECOND LADDER, AND IT EXISTS BECAUSE THE FIRST ONE RUNS OUT AFTER FIVE
   MINUTES. Measured in stage 3: act 1 as shipped has six discrete events, every
   one of them inside the first 5m13s, and then 84m47s in which nothing happens
   at all, against a target act length of 45 to 90 minutes. That is NOW.md
   blocking item 2 with a number on it.

   WHY IT IS ONE PURCHASE MOVING THREE RATES RATHER THAN THREE LADDERS.
   NOW.md names preparatory-phase capacity as the natural next thing to sell.
   Measured, selling it alone KILLS THE CELL. Raising `prep` without raising
   `payoff` makes the investment phase spend ATP faster than the payoff phase
   returns it, and the cell collapses into the state stage 2 spent its length
   repairing. The boundary is exact and it is the stoichiometric ratio: the
   preparatory phase makes two trioses per glucose, so a configuration survives
   only when payoff Vmax is STRICTLY GREATER than twice prep Vmax. Every
   configuration at exactly twice died and every one above it lived:

     prep 12  dies at payoff 22, lives at 26
     prep 13  dies at payoff 26, lives at 28
     prep 14  dies at payoff 28, lives at 30
     prep 16  dies at payoff 32, lives at 36
     prep 18  dies at payoff 36, lives at 40
     prep 20  dies at payoff 40, lives at 44

   Selling the two separately would mean shipping a purchasable configuration
   that kills the player's cell. Moving them together means every reachable
   configuration is one of the five rows below, and every one of them is
   measured. `ferment` moves with `payoff` for the same reason: it recycles the
   NAD+ the payoff phase consumes, and a payoff phase that outruns it walls
   itself. Measured too, at prep 16 with payoff 36 and ferment left at 26 the
   cell dies.

   WHY UPTAKE MOVES BY LESS THAN PREP. `prep` never reaches its Vmax, because it
   is second order in ATP and settles around 88 percent of nameplate. V3 sized
   the uptake ladder's top rung against prep's Vmax of 12 rather than against its
   realized 10.554, which is why intracellular glucose grows by about 87 a minute
   forever once that rung is bought. Each rung below sets uptake just under the
   prep flux it will actually achieve, and the accumulation closes as the ladder
   is climbed: +23.0 a minute at rung 1, +17.2 at rung 2, +9.2 at rung 3 and
   -1.5 at rung 4. **The pile of unusable glucose that appears when uptake is
   maxed is drained away by the phase that consumes it**, which is the same
   lesson the ladder teaches, told on the pool card instead of in a number.

   THE LADDER STOPS AT FOUR BECAUSE THE FIFTH RUNG IS DEAD. A rung at uptake 21,
   prep 22 and payoff 48 collapses the cell, measured both from a cold start and
   by climbing to it from rung 4, even though 48 is above twice 22. Rung 4 is the
   last configuration that survives, so rung 4 is the last rung. There will never
   be a fifth without someone editing this array and measuring what they added.
   =========================================================================== */

/** One rung of the glycolytic capacity ladder. Three Vmax values that move together. */
export interface GlycolysisStep {
  readonly uptake: number;
  readonly prep: number;
  /** Applied to `payoff` and to `ferment`. They cannot diverge, see above. */
  readonly payoff: number;
}

/**
 * The rungs. ENUMERATED, NOT A MULTIPLIER, same as UPTAKE_VMAX_STEPS and for
 * the same reason.
 *
 * Rung 0 is the state at the top of the uptake ladder and is not purchasable.
 * This ladder only opens once UPTAKE_VMAX_STEPS is finished, so the two are
 * sequential rather than interleaved and every save has exactly one of them in
 * progress.
 *
 * Measured ATP per second at each rung, settled 15 game-minutes, against a
 * shipped 31.998: 42.217 at rung 0, then 50.462, 58.849, 67.384 and 76.093.
 * Every rung gains between 12.9 and 19.5 percent, so no rung sells nothing,
 * which is the failure V3 stage 6 caught in the uptake ladder and which would be
 * worse to repeat than to have never learned.
 */
export const GLYCOLYSIS_STEPS: readonly GlycolysisStep[] = [
  { uptake: 12, prep: 12, payoff: 26 },
  { uptake: 13, prep: 14, payoff: 30 },
  { uptake: 15, prep: 16, payoff: 36 },
  { uptake: 17, prep: 18, payoff: 40 },
  { uptake: 19, prep: 20, payoff: 44 },
];

/**
 * Cumulative gross ATP for each purchasable glycolytic step.
 *
 * One entry per rung above the first, so index 0 buys rung 1.
 *
 * DERIVED FROM A CLOCK IN STAGE 4, was 40000, 90000, 160000 and 250000 as
 * first-fit values in stage 3. Those landed at 16m16s, 32m47s, 52m37s and
 * 74m52s, so the gaps between events grew from 11m03s to 22m16s across the act,
 * which is the wrong shape: the longest wait fell where the player has least
 * reason to still be watching.
 *
 * Targets of 22, 35, 48 and 62 game-minutes were chosen first, then a run was
 * instrumented to record cumulative ATP at each, and these are those readings
 * rounded. The gap is roughly 13 minutes throughout instead of growing.
 *
 * WHY THE LAST ONE IS AT 62 MINUTES AND NOT AT 90. docs/PROGRESSION.md gives act
 * 1 45 to 90 minutes and six gaps have to fit inside it. Pushing the last rung
 * to 75 minutes stretches every gap to 16.5, and the longest gap is the number
 * NOW.md blocking item 2 is about. 62 minutes is inside the target and it keeps
 * the worst wait at 14.
 */
export const GLYCOLYSIS_ATP_THRESHOLDS: readonly number[] = [87000, 108000, 131000, 158000];

/* ===========================================================================
   SAVE MANAGEMENT. UPDATELOGV4.md stage 5.
   =========================================================================== */

/**
 * Real milliseconds away below which the return line is not shown at all.
 *
 * FOUND BY RELOADING THE REAL PAGE. A refresh takes a second or two, which is a
 * positive offline delta, so the panel dutifully rendered "Away for 0 min" every
 * single time. The number was true and the sentence was noise, and a save panel
 * that announces a nothing-event on every reload teaches the player to stop
 * reading it, which is exactly the wrong thing to teach on the one panel that
 * has to be believed when it says something went wrong.
 *
 * One minute, because the readout's own resolution is minutes and there is no
 * point announcing a duration that rounds to zero. It is a legibility threshold
 * reasoned from the display unit rather than a measurement, which is what makes
 * it tuning.
 */
export const OFFLINE_REPORT_THRESHOLD_MS = 60000;

/* ===========================================================================
   THE ENVIRONMENT

   Sized in stage 6 from stage 1's measurement. The reasoning is in the stage 6
   report and the value itself lives in src/content/act1/tuning.ts, because the
   environment is content rather than interface. Named here only so the search
   for "where do the act 1 numbers live" finds both files.
   =========================================================================== */

/* ===========================================================================
   THE TRANSITION. UPDATELOGV14.md stage 3.
   =========================================================================== */

/**
 * What digesting the endosymbiont yields, as GLUCOSE. docs/ECONOMY.md row U24.
 *
 * ---------------------------------------------------------------------------
 * IT IS NOT AN ATP NUMBER, AND TWO INDEPENDENT THINGS FORBID ONE
 * ---------------------------------------------------------------------------
 *
 * docs/PROGRESSION.md says digesting gives "a large one-off ATP payout".
 * Delivered literally, as ATP, that is impossible here twice over.
 *
 * IT CANNOT GO INTO THE POOL. The adenylate total is fixed, closed and
 * conserved at 40, so adding ATP to `atp` breaks conservation on the tick it
 * happens. docs/ECONOMY.md already records that constraint as the reason
 * unlocks are thresholds against a lifetime counter rather than purchases.
 *
 * IT CANNOT GO INTO THE METER EITHER, and this is the one that had to be found
 * rather than remembered. `atpPerCompletedGlucose` is `meter.atpProduced`
 * divided by the glucose that finished the pathway. `atpProduced` is the
 * numerator of act 1's ledger. **A credit there makes the game report more than
 * 4 gross ATP per glucose**, which is the single claim act 1 exists to make,
 * which has been asserted to nine decimal places since V2 and across all nine
 * purchasable configurations since V5. A payout that quietly falsified it would
 * be the worst possible trade for a moment of drama.
 *
 * ---------------------------------------------------------------------------
 * SO IT IS SUBSTRATE, WHICH IS BOTH POSSIBLE AND TRUER
 * ---------------------------------------------------------------------------
 *
 * Digesting a cell yields its body. The endosymbiont's biomass enters
 * `glucose_env` and the player's own glycolysis turns it into ATP at the yield
 * they have had all act. Nothing is credited, nothing is asserted, and the
 * ledger is untouched because the ATP arrives the way every other ATP in the
 * game has arrived.
 *
 * **The ATP figure is therefore derived rather than picked**, which is the
 * whole reason this is the better shape:
 *
 *   10000 glucose  x  4 gross ATP per glucose  =  40000 gross ATP
 *
 * and the 4 is sourced, docs/SCIENCE.md Part 2. The size is set against the two
 * measured figures that make the lesson legible:
 *
 *   act 1's environment            80000 glucose     320000 gross ATP
 *   this payout                    10000 glucose      40000 gross ATP
 *   act 3 at roughly fifteen times                   ~4.8M
 *
 * An eighth of the act's whole larder arriving at once, which is the largest
 * single good thing that has ever happened to the cell, against under one
 * percent of what refusing the compartment costs. docs/PROGRESSION.md calls the
 * digest path a teaching moment about short-term versus structural gains and
 * that is the arithmetic of it, rendered by stage 6's payoff surface.
 *
 * ---------------------------------------------------------------------------
 * THE ONE SCRIPTED MATTER INPUT IN THE GAME, DISCLOSED
 * ---------------------------------------------------------------------------
 *
 * Carbon appears in the system at a moment that is not t=0. That is a real
 * departure and it has a structural entry in docs/ECONOMY.md rather than being
 * hidden inside this row: the carbon is the endosymbiont's body, the
 * endosymbiont swam in from outside, and the amount is exact and accounted.
 * `transition.test.ts` asserts that the carbon total rises by exactly
 * 10000 x 6 and that nothing else in the pool array moves.
 */
export const DIGEST_GLUCOSE_YIELD = 10000;

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
  enzymeFactor: tuned(
    'That these are two of the three regulated steps is sourced. How much capacity the purchase adds is not, and it is sized against the transport ceiling',
  ),
  enzymeThreshold: tuned(
    'Placed between the two capacity ladders, because that is the one configuration where the preparatory phase is the bottleneck',
  ),
  glycogenThreshold: tuned(
    'Placed so the reserve is offered while there is still food left to charge it out of. The last purchase in the act',
  ),
  ethanolThreshold: tuned(
    'A spacing decision rather than a constraint. The branch answers nothing, so it can land wherever the act needs a beat',
  ),
  uptakeThreshold: tuned(
    'Spaced so the capacity ladder is climbed across act 1 rather than in its first minute',
  ),
  // WAS "four steps" AND THE ARRAY HAS THREE. Written for the planned ladder of
  // 8, 12, 18, 26 and never updated when V3 stage 6 measured it down to three,
  // which made it a wrong number in player-facing text. Found by the stage 1
  // cross-check, corrected here in stage 3, and it is the reason step 1 of that
  // stage was worth doing.
  uptakeVmax: tuned('A finite ladder of three steps. Hard rule 3 forbids an upgrade with no last step'),
  glycolysisVmax: tuned(
    'Four steps and no fifth. The preparatory phase cannot be raised without the payoff phase, so one purchase moves both',
  ),
  glycolysisThreshold: tuned(
    'Spaced across the back of the act, because every earlier unlock lands inside its first five minutes',
  ),
  digestYield: tuned(
    'The endosymbiont as substrate. Large against the act you have played and small against the one you are refusing, and nothing in biology says what a digested cell is worth',
  ),
} as const satisfies Readonly<Record<string, BadgeSpec>>;
