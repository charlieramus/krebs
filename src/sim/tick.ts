/**
 * One simulation step. Time enters the system here.
 *
 * The order is fixed by docs/SIMULATION.md Part 2 and is not negotiable:
 * compute every flux against the state at the start of the tick, resolve
 * shortfalls by proportional scaling, then apply every delta. Computing and
 * applying reaction by reaction makes the result depend on reaction ordering,
 * which is both wrong and a determinism hazard.
 */

import { SAFE_VALUE_CEILING, TICK_RATE_HZ, TICK_SECONDS } from './constants';
import { DEV } from './dev';
import { computeFlux, type Reaction, type StoichiometryTerm } from './reactions';
import type { SimulationState } from './state';

/**
 * Passes of the shortfall scaling loop before it gives up and takes the
 * factors it has.
 *
 * Scaling one reaction reduces its demand on its other substrates, which can
 * resolve a shortfall elsewhere, so one pass is not always enough. Convergence
 * is fast because every pass multiplies the scales by factors in (0, 1], and
 * four passes covers any pathway shape act 1 to act 4 will contain.
 *
 * Hitting the cap is safe rather than merely tolerable. The factors from the
 * final pass are still applied, and applying factors that are all at most 1 can
 * only reduce demand, so no pool can be driven negative by stopping early. What
 * is lost is exactness: a pool may land slightly above zero instead of on it.
 *
 * ON EXACTNESS. With a single consumer a starved pool lands on exactly zero,
 * because the factor is `available / demanded` and multiplying it back through
 * the same expression round-trips. With two or more consumers the residual has
 * to be split, and the sum of the split parts is within one ulp of the whole
 * rather than equal to it, so the pool lands a fraction above zero. It is never
 * below: every factor is at most 1 and demand only ever decreases.
 *
 * The last ulp could be bought by handing the residual to whichever consumer
 * happens to sit last in the reaction array. That is deliberately not done. It
 * would privilege one reaction for no reason other than array position, and one
 * ulp of a pool is far below any tolerance the conservation test uses or any
 * quantity the player can see.
 */
const MAX_SCALING_PASSES = 4;

/**
 * Whether the development shortfall log writes to the console.
 *
 * The counters on the diagnostics object are always kept. This only silences
 * the text. A configuration that runs short every tick emits one line per pool
 * per game-second, which is correct for a running game and useless in a harness
 * run or a test suite, where it buries the thing you were actually reading.
 */
let shortfallLogging = true;

export function setShortfallLogging(enabled: boolean): void {
  shortfallLogging = enabled;
}

export function tick(state: SimulationState): void {
  const { pools, reactions, fluxes, scales, demand, poolFactors, consumed, produced } = state;
  const amounts = pools.amounts;
  const reactionCount = reactions.length;
  const poolCount = pools.count;

  // Indices are dense and in range by construction, so the `as` casts below are
  // safe. They exist because noUncheckedIndexedAccess types every read from a
  // Float64Array as possibly undefined, and the hot path cannot afford a branch
  // per element to prove otherwise.

  // (a) Flux against the tick-start snapshot. Scratch arrays, no allocation.
  for (let r = 0; r < reactionCount; r += 1) {
    fluxes[r] = computeFlux(reactions[r] as Reaction, amounts);
    scales[r] = 1;
  }

  state.shortfallSeen.fill(0);

  // (b, c) Demand, then proportional scaling until no pool is over-demanded.
  let passes = 0;
  for (; passes < MAX_SCALING_PASSES; passes += 1) {
    demand.fill(0);
    for (let r = 0; r < reactionCount; r += 1) {
      const consumedUnits = (fluxes[r] as number) * (scales[r] as number) * TICK_SECONDS;
      if (consumedUnits === 0) continue;
      const substrates = (reactions[r] as Reaction).substrates;
      for (let i = 0; i < substrates.length; i += 1) {
        const term = substrates[i] as StoichiometryTerm;
        demand[term.poolIndex] =
          (demand[term.poolIndex] as number) + consumedUnits * term.coefficient;
      }
    }

    let anyShort = false;
    for (let i = 0; i < poolCount; i += 1) {
      const demanded = demand[i] as number;
      if (demanded > (amounts[i] as number)) {
        anyShort = true;
        // Never clamped. docs/SIMULATION.md line 84: clamping hides a stability
        // problem and quietly breaks conservation of mass, which manufactures
        // ATP from nowhere. Every consumer of this pool shares the shortfall in
        // proportion to what it asked for.
        poolFactors[i] = (amounts[i] as number) / demanded;
        recordShortfall(state, i);
      } else {
        poolFactors[i] = 1;
      }
    }

    if (!anyShort) break;

    for (let r = 0; r < reactionCount; r += 1) {
      const substrates = (reactions[r] as Reaction).substrates;
      // A reaction touching two shortfall pools takes the smaller factor.
      let factor = 1;
      for (let i = 0; i < substrates.length; i += 1) {
        const poolFactor = poolFactors[(substrates[i] as StoichiometryTerm).poolIndex] as number;
        if (poolFactor < factor) factor = poolFactor;
      }
      if (factor < 1) scales[r] = (scales[r] as number) * factor;
    }
  }

  if (passes === MAX_SCALING_PASSES) state.diagnostics.scalingCapHits += 1;

  // (d) Apply deltas. Consumption and production are accumulated separately per
  // pool and applied in one write, so a pool's result does not depend on the
  // order its consumers happen to sit in the reaction array.
  consumed.fill(0);
  produced.fill(0);
  for (let r = 0; r < reactionCount; r += 1) {
    const units = (fluxes[r] as number) * (scales[r] as number) * TICK_SECONDS;
    if (units === 0) continue;
    const reaction = reactions[r] as Reaction;
    const substrates = reaction.substrates;
    for (let i = 0; i < substrates.length; i += 1) {
      const term = substrates[i] as StoichiometryTerm;
      consumed[term.poolIndex] = (consumed[term.poolIndex] as number) + units * term.coefficient;
    }
    const products = reaction.products;
    for (let i = 0; i < products.length; i += 1) {
      const term = products[i] as StoichiometryTerm;
      produced[term.poolIndex] = (produced[term.poolIndex] as number) + units * term.coefficient;
    }
  }

  for (let i = 0; i < poolCount; i += 1) {
    amounts[i] = (amounts[i] as number) - (consumed[i] as number) + (produced[i] as number);
  }

  // (e) Game time is an integer count. docs/SIMULATION.md Part 5 forbids
  // accumulating it as a float. Conversion to milliseconds is a boundary
  // concern and lives in loop.ts.
  state.tickCount += 1;

  if (DEV) assertBelowCeiling(state);
}

/**
 * Count the shortfall once per pool per tick, and log it at most once per pool
 * per game-second.
 *
 * Per-tick logging at 20Hz makes the console useless, which means the signal
 * gets turned off, which means the balance bug it was surfacing goes unnoticed.
 */
function recordShortfall(state: SimulationState, poolIndex: number): void {
  if (state.shortfallSeen[poolIndex] === 1) return;
  state.shortfallSeen[poolIndex] = 1;
  state.diagnostics.shortfallTicks[poolIndex] =
    (state.diagnostics.shortfallTicks[poolIndex] as number) + 1;

  if (!DEV || !shortfallLogging) return;
  const last = state.diagnostics.lastShortfallLogTick[poolIndex] as number;
  if (state.tickCount - last < TICK_RATE_HZ) return;
  state.diagnostics.lastShortfallLogTick[poolIndex] = state.tickCount;
  const id = state.pools.ids[poolIndex] as string;
  const count = state.diagnostics.shortfallTicks[poolIndex] as number;
  console.warn(
    `[sim] pool "${id}" ran short at tick ${state.tickCount} (${count} ticks so far). ` +
      `Consumers scaled proportionally. Frequent scaling means the pool is too small ` +
      `or the tick is too coarse, see docs/SIMULATION.md Part 2.`,
  );
}

/**
 * docs/SIMULATION.md Part 4. This is a tripwire for a balance change
 * reintroducing unbounded growth, which is the specific failure the
 * no-big-number-library decision depends on not happening. It throws. Softening
 * it to a warning would defeat the purpose.
 */
function assertBelowCeiling(state: SimulationState): void {
  const amounts = state.pools.amounts;
  for (let i = 0; i < amounts.length; i += 1) {
    if ((amounts[i] as number) > SAFE_VALUE_CEILING) {
      throw new Error(
        `[sim] pool "${state.pools.ids[i] as string}" exceeded SAFE_VALUE_CEILING ` +
          `(${amounts[i] as number} > ${SAFE_VALUE_CEILING}) at tick ${state.tickCount}. ` +
          `float64 is only exact to about 9.0e15, so this is unbounded growth, ` +
          `see docs/SIMULATION.md Part 4.`,
      );
    }
  }
}
