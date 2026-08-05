/**
 * The analytic jump. docs/SIMULATION.md Part 3 steps 3, 4, 5 and 6.
 *
 * The half of the offline path that makes it fast. Steady state is what
 * src/sim/steady.ts establishes; this is what the game does with it.
 *
 * At a steady state every rate is constant, so every pool's future is a
 * straight line and cumulative output is linear in time. Advancing an hour is
 * then a multiplication rather than 72000 tick evaluations. The cost of
 * resolving an absence scales with the number of events in it rather than with
 * its length, which is the property the whole approach exists for.
 *
 * ---------------------------------------------------------------------------
 * ACT 1 HAS ONE EVENT KIND, AND IT NEEDED NO CONTENT-SPECIFIC ENUMERATOR
 * ---------------------------------------------------------------------------
 *
 * Part 3 step 3 lists four candidate event kinds: a finite substrate pool
 * depleting, a storage pool filling to capacity, an environmental schedule
 * boundary, and an unlock threshold crossing. Against act 1:
 *
 *   substrate depleting    REAL. `glucose_env` is finite and unreplenished.
 *   storage at capacity    Does not exist. Glycogen is deferred.
 *   schedule boundary      Does not exist. Nothing is scheduled until act 2.
 *   unlock crossing        Not a simulation event. See below.
 *
 * So one, and it turns out to need nothing act-specific to find. A pool can
 * only change a rate if some enabled reaction consumes it, and that is readable
 * from the reaction table rather than from any knowledge of what the pool
 * means. `substrateMask` computes it once. The soonest such pool to run out is
 * the next event, and locating it is a division.
 *
 * A pool that is never consumed cannot influence any flux, so extrapolating it
 * arbitrarily far is exact rather than merely tolerable. In act 1 that is
 * `lactate`, which is why a terminal product accumulating for eight hours costs
 * nothing and needs no special case.
 *
 * THE SEAM IS LEFT OBVIOUS AND IS NOT PRE-SOLVED. Act 2's oxygen schedule is a
 * boundary in wall-clock rather than in a pool level, and act 4's substrate
 * switching may make the event count grow with the window rather than stay
 * bounded. Neither is answerable from act 1 and neither is guessed at here.
 * When a second event kind exists, `nextEvent` grows a second clause.
 *
 * AN UNLOCK THRESHOLD CROSSED WHILE AWAY IS NOT A SIMULATION EVENT. V3 made
 * unlocks thresholds against a cumulative counter rather than purchases against
 * a pool, and the player is not there to buy anything, so a crossing changes no
 * rate and does not interrupt a jump. It is worth telling the player about on
 * return and that is a different job, done above this file.
 *
 * ---------------------------------------------------------------------------
 * WHAT THE JUMP TOUCHES, AND WHAT IT MUST NOT
 * ---------------------------------------------------------------------------
 *
 * Pool amounts and the tick count, both by the same duration at the same rates.
 * Counters that live outside the simulation move through `OfflineObserver`,
 * because the meter is not simulation state and a jump that advanced the pools
 * and not the meter would silently refund the player's progress toward every
 * unlock.
 *
 * NOT THE PRNG. Act 1 consumes no random numbers, which V4's fixture had to
 * work around and which `reloadDeterminism.test.ts` asserts directly, so there
 * is nothing to advance. Said out loud rather than left implicit because it is
 * true today and will not be true in act 2: the first stochastic reaction makes
 * "how far does the PRNG advance across a jump" a real question with no
 * arithmetic answer, and whoever writes it should find this paragraph rather
 * than an absence.
 *
 * CONSERVATION SURVIVES BY CONSTRUCTION. The rates come from a real tick, which
 * conserves all five quantities, and a conserving vector multiplied by a scalar
 * still conserves. That is the argument; stage 4 is the measurement.
 */

import {
  EVENT_BUDGET,
  MAX_JUMP_DEPLETION_FRACTION,
  OFFLINE_DEPLETED_FRACTION,
  SAFE_VALUE_CEILING,
  SETTLE_MAX_TICKS,
} from './constants';
import { DEV } from './dev';
import type { Reaction, StoichiometryTerm } from './reactions';
import type { SimulationState } from './state';
import { observeSteady, replayUntilSteady, type SteadyDetector } from './steady';
import { tick } from './tick';

/**
 * One flag per pool: does any enabled reaction consume it.
 *
 * Computed once per resolution rather than per jump, and never per tick. A
 * reaction being enabled is the only thing that can change between jumps, and
 * nothing in the offline path enables one, so once is enough.
 */
export function substrateMask(state: SimulationState): Uint8Array {
  const mask = new Uint8Array(state.pools.count);
  for (let r = 0; r < state.reactions.length; r += 1) {
    const reaction = state.reactions[r] as Reaction;
    if (!reaction.enabled) continue;
    const substrates = reaction.substrates;
    for (let i = 0; i < substrates.length; i += 1) {
      mask[(substrates[i] as StoichiometryTerm).poolIndex] = 1;
    }
  }
  return mask;
}

export interface Horizon {
  /**
   * Ticks until the first pool that can influence a rate has changed by its own
   * whole size. Infinite when no such pool is moving.
   */
  readonly ticks: number;
  /** Which pool, or -1. */
  readonly poolIndex: number;
  /** Whether that pool is draining, so the horizon is a real depletion. */
  readonly draining: boolean;
}

/**
 * Time to the next event, in closed form. docs/SIMULATION.md Part 3 step 3.
 *
 * IT IS A DIVISION AND IT IS ALLOWED TO BE NOTHING ELSE. At a steady state the
 * rates are constant, so the amount over the rate of change is the answer
 * exactly. No iteration, no search, no Math.pow, no Math.log. A candidate event
 * that needed more than arithmetic to locate would be evidence that the state
 * it was being located from was not steady after all.
 *
 * BOTH DIRECTIONS, NOT JUST DRAINING, and the difference is measured. Part 3
 * step 3 names a depleting pool as the event, and it is right that a pool
 * hitting zero is one. But what actually invalidates a steady state is a
 * substrate changing enough to move the rate it drives, and a substrate that
 * doubles does that as thoroughly as one that halves. Bounding only the
 * draining ones leaves a jump free to triple a pool in one step, which is what
 * a starved act 1 cell does at the end of a long absence: measured at 998
 * percent out on cumulative ATP over a 24-hour window before this was made
 * symmetric.
 *
 * Only pools some enabled reaction consumes are considered, because those are
 * the only ones that can change a rate. `lactate` accumulates for eight hours
 * and constrains nothing, which is correct rather than an oversight.
 */
export function nextHorizon(
  state: SimulationState,
  rates: Float64Array,
  mask: Uint8Array,
): Horizon {
  let soonest = Number.POSITIVE_INFINITY;
  let poolIndex = -1;
  let draining = false;
  const amounts = state.pools.amounts;
  for (let i = 0; i < amounts.length; i += 1) {
    if (mask[i] === 0) continue;
    const amount = amounts[i] as number;
    if (!(amount > 0)) continue;
    const rate = rates[i] as number;
    if (rate === 0) continue;
    const ticks = amount / Math.abs(rate);
    if (ticks < soonest) {
      soonest = ticks;
      poolIndex = i;
      draining = rate < 0;
    }
  }
  return { ticks: soonest, poolIndex, draining };
}

/**
 * Retire pools that hold nothing worth simulating. Returns how much was
 * discarded, so a caller can assert it is negligible rather than assume it.
 *
 * WHY THIS EXISTS, AND IT IS THE SECOND HALF OF THE SAME FINDING. A pool
 * consumed by a saturating reaction does not deplete: below the Km it decays
 * exponentially with a fixed time constant, so it is always the same distance
 * from empty and it bounds every jump at that distance forever. Act 1 measured
 * it twice, once on `glucose_env` at 1250 ticks and again on `pyruvate` at
 * 1249, and the second one only appeared after the first was fixed.
 *
 * `Math.floor` on the crossing time cannot solve it, because the remainder is
 * what keeps the pool alive. The only way out is to say that a pool holding a
 * trillionth of the largest quantity in the system is empty, and to make it
 * empty. See OFFLINE_DEPLETED_FRACTION.
 *
 * THIS IS THE ONLY PLACE IN THE PROJECT WHERE MATTER IS DISCARDED, and it is
 * bounded rather than hand-waved: at most OFFLINE_DEPLETED_FRACTION of the
 * largest pool, per pool, once each per resolution. Against act 1 that is 8e-8
 * units against a conserved carbon total of 480000, which is 1.7e-13 relative,
 * below the tick's own observed drift of 1.1e-13 and four orders below the
 * conservation tolerance of 1e-9 the project has asserted since V1 stage 5.
 */
export function retireSpentPools(
  state: SimulationState,
  rates: Float64Array,
  peak: Float64Array,
): number {
  let discarded = 0;
  const amounts = state.pools.amounts;
  for (let i = 0; i < amounts.length; i += 1) {
    const amount = amounts[i] as number;
    if (amount > (peak[i] as number)) peak[i] = amount;
    if (amount > 0 && amount <= (peak[i] as number) * OFFLINE_DEPLETED_FRACTION) {
      discarded += amount;
      amounts[i] = 0;
      // The rate goes with it. A pool holding nothing supplies nothing, and a
      // retired pool that kept a negative rate would put the next zero crossing
      // at zero ticks and stall the whole resolution on a pool that is empty.
      rates[i] = 0;
    }
  }
  return discarded;
}

/**
 * Ticks until the first pool of any kind would cross zero. The hard bound.
 *
 * Every pool, not only the ones that can influence a rate, and no spent floor,
 * because a pool going negative is a broken state whatever else is true of it.
 * See the note in `resolveOffline` for what a negative pool does to a
 * Michaelis-Menten flux.
 */
export function nextZeroCrossing(state: SimulationState, rates: Float64Array): Horizon {
  let soonest = Number.POSITIVE_INFINITY;
  let poolIndex = -1;
  const amounts = state.pools.amounts;
  for (let i = 0; i < amounts.length; i += 1) {
    const rate = rates[i] as number;
    if (!(rate < 0)) continue;
    const ticks = (amounts[i] as number) / -rate;
    if (ticks < soonest) {
      soonest = ticks;
      poolIndex = i;
    }
  }
  return { ticks: soonest, poolIndex, draining: poolIndex !== -1 };
}

/** Whether a jump of `ticks` would put any pool below zero. */
function wouldGoNegative(state: SimulationState, rates: Float64Array, ticks: number): boolean {
  const amounts = state.pools.amounts;
  for (let i = 0; i < amounts.length; i += 1) {
    if ((amounts[i] as number) + (rates[i] as number) * ticks < 0) return true;
  }
  return false;
}

/**
 * Advance the state by `ticks` at `rates`. docs/SIMULATION.md Part 3 step 4.
 *
 * The one place in this project where a pool changes without going through the
 * two-phase update, which is why stage 4 asserts conservation across it
 * specifically rather than relying on the tick's own guarantees.
 */
export function applyJump(state: SimulationState, rates: Float64Array, ticks: number): void {
  const amounts = state.pools.amounts;
  for (let i = 0; i < amounts.length; i += 1) {
    amounts[i] = (amounts[i] as number) + (rates[i] as number) * ticks;
  }
  state.tickCount += ticks;
  if (DEV) assertBelowCeiling(state);
}

function assertBelowCeiling(state: SimulationState): void {
  const amounts = state.pools.amounts;
  for (let i = 0; i < amounts.length; i += 1) {
    if ((amounts[i] as number) > SAFE_VALUE_CEILING) {
      throw new Error(
        `[sim] pool "${state.pools.ids[i] as string}" exceeded SAFE_VALUE_CEILING in an ` +
          `offline jump at tick ${state.tickCount}. See docs/SIMULATION.md Part 4.`,
      );
    }
  }
}

/**
 * How the offline path reaches things that are not simulation state.
 *
 * `onTick` mirrors `TickObserver` in loop.ts and runs after every real tick of
 * a bounded replay. `capture` runs once per settle, with the last real tick's
 * scratch arrays still readable, and is where a caller records its own per-tick
 * rates. `advance` multiplies those by the jump length.
 *
 * Three callbacks rather than one because they happen at three different
 * moments, and collapsing them would mean either metering a jump tick by tick,
 * which is the thing being avoided, or capturing a rate from a tick that has
 * already been overwritten.
 */
export interface OfflineObserver {
  onTick?(state: SimulationState): void;
  capture?(state: SimulationState): void;
  advance?(ticks: number): void;
}

export type OfflineEventKind = 'depletion' | 'window-end' | 'no-jump';

export interface OfflineEventRecord {
  readonly kind: OfflineEventKind;
  /** The pool that ran out, or -1. */
  readonly poolIndex: number;
  /** Real ticks replayed at full fidelity before this jump. */
  readonly settleTicks: number;
  /** Ticks covered by the jump itself. */
  readonly jumpTicks: number;
  /** `state.tickCount` after the jump. */
  readonly atTick: number;
}

export interface OfflineOutcome {
  /**
   * Whether the whole window was resolved by the piecewise path. False means
   * the system failed to settle and the caller owes a fallback, which
   * docs/SIMULATION.md Part 3 calls a bug signal rather than a normal
   * condition.
   */
  readonly resolved: boolean;
  readonly ticksResolved: number;
  readonly ticksRemaining: number;
  /** Whether EVENT_BUDGET ran out. Not the same thing as failing to settle. */
  readonly budgetExhausted: boolean;
  /**
   * Total amount discarded by retiring spent pools, in pool units. The only
   * matter the offline path does not conserve exactly, and it is reported
   * rather than hidden. See `retireSpentPools`.
   */
  readonly discarded: number;
  readonly events: readonly OfflineEventRecord[];
}

/**
 * Resolve an offline window. docs/SIMULATION.md Part 3, all six steps.
 *
 * ---------------------------------------------------------------------------
 * WHY THE SETTLE SPENDS ITS WHOLE BUDGET INSTEAD OF STOPPING WHEN IT SETTLES
 * ---------------------------------------------------------------------------
 *
 * Measured in UPDATELOGV8.md stage 3, and it is the difference between a jump
 * that works and one that does not. The steady test is on curvature, so a pool
 * relaxing exponentially with a long time constant passes it while its rate is
 * still meaningfully non-zero: curvature is roughly rate over time constant, so
 * a large time constant makes a real rate look flat.
 *
 * At the top glycolytic rung, stopping at first detection leaves `nad` with a
 * residual of -2.028e-3 per tick, which extrapolates to an empty NAD+ pool in
 * 8971 ticks. NAD+ is not draining. It is filling toward its steady level and
 * the residual is a transient. Spending the remaining 740 ticks of the budget
 * takes that residual to -9.701e-6, and the binding event stops being a
 * numerical artifact and becomes `glucose_env` at 83544 ticks, which is the
 * real one.
 *
 * The cost was already promised. Part 3 step 1 budgets SETTLE_MAX_TICKS of
 * full-fidelity replay per event and this spends exactly that, so the bound the
 * algorithm rests on is unchanged. What changes is that the rate handed to the
 * jump is a steady rate rather than the last value of a decaying one.
 *
 * ---------------------------------------------------------------------------
 * WHY A JUMP STOPS SHORT OF THE EVENT IT FOUND
 * ---------------------------------------------------------------------------
 *
 * Part 3 assumes piecewise-constant rates between discrete events. Act 1 does
 * not have that, and no act with a finite unreplenished substrate pool will:
 * `uptake` is Michaelis-Menten in `glucose_env`, so the rate drifts downward
 * continuously as the environment drains rather than holding until it empties.
 * Jumping the whole way to the linear depletion time is out by 7.5 percent on
 * cumulative ATP, measured.
 *
 * So a jump covers MAX_JUMP_DEPLETION_FRACTION of the distance and then the
 * state re-settles at the new substrate level, which re-derives every rate from
 * full-fidelity replay. That is Part 3 step 5 doing exactly what it says, with
 * the drift treated as the thing that invalidated the steady state. The
 * environment is chased down geometrically and the event count stays bounded.
 *
 * The re-settle is also what keeps intermediate-pool error from accumulating.
 * Each one derives the intermediates from real ticks, so an error a jump
 * introduces is corrected by the next settle rather than carried forward. Only
 * the cumulative quantities carry error across steps, and those are the ones
 * that extrapolate accurately.
 */
export function resolveOffline(
  state: SimulationState,
  detector: SteadyDetector,
  windowTicks: number,
  observer?: OfflineObserver,
): OfflineOutcome {
  const events: OfflineEventRecord[] = [];
  const mask = substrateMask(state);
  const onTick = observer?.onTick;

  // The spent floor is per pool and relative to the most that pool has held
  // during this resolution, which `retireSpentPools` keeps up to date. Not the
  // pool's starting amount, because a pool that begins at zero would get a
  // floor of zero and never be retirable, and not one scalar across the system,
  // because a floor sized against an 80000-unit environment is 2e-9 of a
  // 40-unit adenylate total and that is above the conservation tolerance. See
  // OFFLINE_DEPLETED_FRACTION.
  const peak = Float64Array.from(state.pools.amounts);
  let discarded = 0;

  let remaining = windowTicks;
  let resolved = true;
  let budgetExhausted = false;

  while (remaining > 0) {
    if (events.length >= EVENT_BUDGET) {
      budgetExhausted = true;
      break;
    }

    // Steps 1 and 2. Bounded full-fidelity replay, then the steady test.
    const settleBudget = Math.min(SETTLE_MAX_TICKS, remaining);
    const settle = replayUntilSteady(state, detector, settleBudget, onTick);
    remaining -= settle.ticksRun;
    let settleTicks = settle.ticksRun;

    if (!settle.settled) {
      // Either the window ran out mid-replay, which is fine and complete, or
      // the configuration will not settle, which is the fallback signal.
      if (remaining > 0) resolved = false;
      break;
    }

    // Spend the rest of the settle budget refining the rate. See above.
    const refine = Math.min(SETTLE_MAX_TICKS - settle.ticksRun, remaining);
    for (let i = 0; i < refine; i += 1) {
      tick(state);
      if (onTick !== undefined) onTick(state);
      observeSteady(detector, state);
    }
    remaining -= refine;
    settleTicks += refine;

    if (remaining <= 0) break;
    if (!detector.settled) {
      // It stopped being steady while the rate was being refined, which means
      // something changed under it. Not a fallback: go round again and settle
      // against whatever it is now.
      continue;
    }

    // Anything left below the spent floor is retired before the horizons are
    // computed, because otherwise it bounds every remaining jump at its own
    // exponential time constant. See `retireSpentPools`.
    discarded += retireSpentPools(state, detector.previousDelta, peak);

    // Step 3. The next event, in closed form.
    const horizon = nextHorizon(state, detector.previousDelta, mask);

    /*
     * PART OF THE WAY, OR ALL OF IT.
     *
     * The usual case is part of the way: cover MAX_JUMP_DEPLETION_FRACTION of
     * the distance and re-settle, so the rate drift is bounded.
     *
     * THE OTHER CASE IS WHY ACT 1 TERMINATES AT ALL, and it was found by
     * measurement rather than by design. `uptake` is Michaelis-Menten, so once
     * `glucose_env` falls below its Km the pool decays exponentially with a
     * fixed time constant of Km over Vmax, which is 1250 ticks in act 1. A
     * fraction of a fixed time constant is a fixed jump length, so the
     * fractional rule chases the environment down forever in 312-tick steps and
     * never reaches it. Measured: 64 events, 76800 real ticks and 3.9 game-hours
     * out of a 24-hour window, which is precisely the capped-replay failure Part
     * 3 rejects by name.
     *
     * `glucose_env` never depletes. It is asymptotic, so "time to event" is not
     * a division and Part 3 step 3's assumption does not hold for it. That is
     * the honest finding and this is the repair: WHEN A JUMP WOULD BUY LESS TIME
     * THAN THE REPLAY THAT SET IT UP, THE PIECEWISE PATH IS LOSING TO PLAIN
     * REPLAY, so go the whole way instead and let the pool land on empty.
     *
     * No new constant. The comparison is against the real ticks just spent,
     * which is the cost the jump has to beat to be worth making. Landing the
     * pool on empty slightly early is a real state rather than an approximation
     * of one: `Math.floor` guarantees it never lands below zero, every pool
     * moves by the same conserving rate vector so all five quantities still
     * balance exactly, and the carbon that leaves the environment arrives in
     * the cell rather than disappearing. It is the depletion event of Part 3
     * step 3, applied.
     */
    const fractional = Number.isFinite(horizon.ticks)
      ? Math.floor(horizon.ticks * MAX_JUMP_DEPLETION_FRACTION)
      : remaining;

    /*
     * THE HARD BOUND, WHICH IS NOT THE SAME AS THE ACCURACY BOUND, AND THE
     * DIFFERENCE IS A BUG THIS STAGE SHIPPED AND THEN FOUND.
     *
     * The horizon above answers "how long until a rate has drifted too far",
     * and it deliberately skips pools already spent, because a pool at a
     * billionth of its starting amount cannot move a rate. That is right for
     * accuracy and catastrophic on its own: a spent pool is still draining, and
     * a jump long enough to be worth making takes it negative. A negative pool
     * makes Michaelis-Menten return a negative flux, which runs a reaction
     * backwards, which manufactures matter. Measured: a four-hour absence
     * ending with `glucose_env` at NaN and 236953 lactate against a carbon
     * ceiling of 160000.
     *
     * So the non-negativity bound is separate, covers every pool rather than
     * only the ones that can influence a rate, and ignores the spent floor
     * entirely. It is the same division.
     */
    const zero = nextZeroCrossing(state, detector.previousDelta);
    const hard = Number.isFinite(zero.ticks) ? Math.floor(zero.ticks) : remaining;

    /*
     * A jump that buys less time than the replay that set it up is losing to
     * plain replay, so go the whole way to the crossing instead of a fraction
     * of it. That is the branch that makes act 1 terminate.
     */
    let bound = Math.min(fractional, hard);
    if (bound < settleTicks) bound = Math.min(hard, remaining);
    bound = Math.min(bound, hard);

    // Floating point can put `amount + rate * floor(amount / -rate)` a hair
    // below zero. One tick of margin is enough and costs nothing.
    while (bound > 0 && wouldGoNegative(state, detector.previousDelta, bound)) bound -= 1;

    if (bound < 1) {
      // The event is less than one tick away, so there is nothing to gain by
      // jumping to it. Replay instead, which the top of the loop does.
      events.push({
        kind: 'no-jump',
        poolIndex: horizon.poolIndex,
        settleTicks,
        jumpTicks: 0,
        atTick: state.tickCount,
      });
      continue;
    }

    // Step 4. Jump to the earlier of the event and the end of the window.
    const jumpTicks = Math.min(remaining, bound);
    if (observer?.capture !== undefined) observer.capture(state);
    applyJump(state, detector.previousDelta, jumpTicks);
    if (observer?.advance !== undefined) observer.advance(jumpTicks);
    remaining -= jumpTicks;

    events.push({
      kind: jumpTicks < bound ? 'window-end' : 'depletion',
      poolIndex: jumpTicks < bound ? -1 : horizon.poolIndex,
      settleTicks,
      jumpTicks,
      atTick: state.tickCount,
    });

    // Step 5. Return to step 1 against the state the jump landed in.
  }

  return {
    resolved,
    ticksResolved: windowTicks - remaining,
    ticksRemaining: remaining,
    budgetExhausted,
    discarded,
    events,
  };
}
