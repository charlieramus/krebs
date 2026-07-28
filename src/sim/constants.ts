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
 * UNVALIDATED PLACEHOLDER. docs/SIMULATION.md Part 6 marks this "tune during
 * prototype" and gives no value, so this number is not a decision and carries
 * no justification. It is a slot with a plausible magnitude in it so the type
 * exists and the offline code has something to reference.
 *
 * Threshold for "the derivative is small enough to call this steady", expressed
 * as a fraction of pool size per tick. docs/SIMULATION.md Part 3 step 2.
 *
 * Validated by the offline progress log, which is neither V1 nor V2. That log's
 * first task is measuring real settling behaviour against a real act 1
 * configuration and replacing this value with a measured one. Do not treat it
 * as tuned before then, and do not cite it anywhere player-facing.
 */
export const STEADY_EPSILON = 1e-6;

/**
 * UNVALIDATED PLACEHOLDER. Same status as STEADY_EPSILON above, same doc line,
 * same log validates it. No justification is offered for 20 because none exists
 * yet.
 *
 * Consecutive ticks all derivatives must stay below STEADY_EPSILON before the
 * system counts as settled. docs/SIMULATION.md Part 3 step 2.
 */
export const STEADY_WINDOW = 20;

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
