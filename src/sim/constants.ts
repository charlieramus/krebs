/**
 * Simulation constants.
 *
 * Every value here is transcribed from docs/SIMULATION.md Part 6. That doc says
 * all values other than the two marked for tuning are decisions rather than
 * defaults, and that changing one requires updating the doc with the reason.
 * That only works if the code says where the doc is, so each constant carries a
 * pointer to the part that decided it.
 *
 * Literal types are preserved deliberately. TICK_MS is the type `50`, not
 * `number`, so a later edit that widens one of these is visible at every call
 * site rather than silently absorbed.
 */

/** Fixed simulation rate. docs/SIMULATION.md Part 1. Tunable during development, frozen at launch. */
export const TICK_RATE_HZ = 20;

/**
 * Milliseconds per tick. docs/SIMULATION.md Part 1.
 * 50ms is below the ~100ms immediacy threshold, divides evenly into 1000 so the
 * accumulator does not drift against second boundaries, and gives 20 Euler
 * steps per game-second, which is the headroom the NAD+ pool needs in act 1.
 */
export const TICK_MS = 50;

/**
 * Seconds of game time advanced per tick. Not from Part 6, derived from TICK_MS
 * rather than transcribed, so it cannot drift out of step with it. Kept here so
 * that flux integration never divides by 1000 inline.
 */
export const TICK_SECONDS = TICK_MS / 1000;

/**
 * Spiral of death guard. docs/SIMULATION.md Part 1.
 * 200 ticks is 10 game-seconds. Elapsed time beyond this is not caught up in
 * the loop, it routes to the offline path in Part 3.
 */
export const MAX_CATCHUP_TICKS = 200;

/** Full-fidelity replay budget before the steady state test. docs/SIMULATION.md Part 3 step 1. 1200 ticks is 60 game-seconds. */
export const SETTLE_MAX_TICKS = 1200;

/**
 * MEASURED. UPDATELOGV8.md stage 1, against act 1 as V5 balanced it. Was an
 * unvalidated placeholder of 1e-6 from V1 to V7, and 1e-6 turns out to sit
 * outside the usable band.
 *
 * Threshold for "this system is changing at a constant enough rate to
 * extrapolate", expressed as a fraction of pool size per tick.
 *
 * WHAT IS MEASURED. Not the pool derivative. docs/SIMULATION.md Part 3 step 2
 * used to say all pool derivatives below epsilon as a fraction of pool size,
 * and measurement says that criterion is unsatisfiable in act 1 at any epsilon
 * below 1e-3: `glucose_env` drains and `lactate` accumulates linearly forever,
 * so their fractional derivative decays only as 1/t and never reaches zero. It
 * also contradicts step 4 of the same algorithm, which applies accumulated
 * output as rate times duration and therefore presupposes pools that are still
 * changing. What has to stop changing is the rate, so the quantity tested is
 * the second difference of each pool amount over the pool's own size. Part 3
 * step 2 was corrected to say so in the same stage.
 *
 * THE BAND, AND IT IS NARROW. Measured across the walled cell, the fresh
 * fermenting cell, every rung of both V5 capacity ladders, the transient
 * immediately after fermentation is bought, and the environment down to 400.
 *
 *   too small   the walled cell stops fitting inside SETTLE_MAX_TICKS and
 *               every absence spent at the NAD+ wall falls back to coarse
 *               replay. At STEADY_WINDOW 250 the walled cell settles at 1120
 *               ticks for 3e-6 and 1303 for 2e-6, against a budget of 1200.
 *   too large   a linear extrapolation from the declared settle point is wrong.
 *               Cumulative ATP over an hour is out by 1.68e-2 at 3e-4 and
 *               3.03e-3 at 1e-4, against a floor of 1.47e-3 that is the
 *               environment draining rather than the transient.
 *
 * So the usable band is 3e-6 to 1e-4, a factor of 33. 1e-5 is the round value
 * nearest its geometric centre: 3.3x above the fallback boundary and 10x below
 * the accuracy boundary. A factor of 33 is a real margin and a thin one, and
 * the lower half of it is set by how fast a walled cell's ATP decays, so any
 * balance pass that touches ACT1_MAINTAIN_HILL_N or the environment size has to
 * re-run stage 1's measurement rather than assume this still holds.
 */
export const STEADY_EPSILON = 1e-5;

/**
 * MEASURED. UPDATELOGV8.md stage 1. Was an unvalidated placeholder of 20 from
 * V1 to V7, and 20 is an order of magnitude too small.
 *
 * Consecutive ticks the steady test must hold before the system counts as
 * settled. docs/SIMULATION.md Part 3 step 2.
 *
 * WHAT IT DEFENDS AGAINST, AND ACT 1 HAS ONE. The stage that measured this
 * expected to report that act 1 is too simple to constrain the window. It is
 * not. Buying fermentation produces a two-timescale recovery: the pathway
 * restarts in 2 ticks, which is what V3 measured and what a player sees, and
 * then the intracellular glucose that piled up during the stall drains over
 * several hundred more. Between those two the system goes quiet, and at
 * STEADY_EPSILON it sits below threshold for 141 consecutive ticks before
 * moving again. A window of 20 declares steady inside that gap.
 *
 * WHAT THAT COSTS, MEASURED. Extrapolating from the tick a window of 20 picks
 * is out by 20 to 33 percent on cumulative ATP. From the tick a window of 142
 * picks it is out by 0.001 to 0.15 percent, which is the same answer a window
 * of 900 gives. The smallest window that clears the gap is also the window that
 * lands the declaration where the extrapolation is right, which was not
 * designed and is the reason to trust it.
 *
 * THE BAND. 142 is the measured floor. The ceiling is 436, because the window
 * adds to every settle tick one for one and the walled cell settles at 784 plus
 * the window against a SETTLE_MAX_TICKS of 1200. 250 is the geometric centre of
 * 142 and 436, so both failure modes sit 1.76x away and neither is preferred
 * without a reason. At 250 every act 1 configuration settles inside budget, the
 * worst being the walled cell at 1014, which is 85 percent of it.
 */
export const STEADY_WINDOW = 250;

/** Maximum events processed in one offline resolution before falling back. docs/SIMULATION.md Part 3 step 6. */
export const EVENT_BUDGET = 64;

/** Offline credit cap, in hours. docs/SIMULATION.md Part 3, clock tampering. Also bounds the coarse-replay fallback. */
export const MAX_OFFLINE_HOURS = 24;

/**
 * Development-mode tripwire. docs/SIMULATION.md Part 4.
 * float64 holds integers exactly to about 9.0e15. 1e15 sits below that with
 * room to spare. Exceeding it means a balance change reintroduced unbounded
 * growth, which is the specific failure the no-big-number-library decision
 * depends on not happening. This throws. It is not a warning.
 */
export const SAFE_VALUE_CEILING = 1e15;
