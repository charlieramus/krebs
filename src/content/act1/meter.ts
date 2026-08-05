/**
 * Act 1 counters.
 *
 * ATP IS NOT A SCORE. The adenylate pool is fixed and closed, so there is no
 * pool anywhere whose value is "ATP produced so far", and there must not be:
 * a pool like that would have to carry a conserved weight, and whatever weight
 * it carried would break conservation the moment the counter moved. Cumulative
 * production is a counter kept beside the simulation, never inside it.
 *
 * Everything here reads what the tick actually applied rather than what it
 * intended to. `state.fluxes[r]` is the flux computed against the tick-start
 * snapshot and `state.scales[r]` is the proportional shortfall factor the tick
 * resolved for it, so their product is the flux that really ran. Reading the
 * unscaled flux would over-count exactly in the situations that matter, which
 * are the ones where a pool ran short.
 *
 * Coefficients are read out of the reaction table at construction, not written
 * down here. The ledger this produces then traces to the same source the
 * stoichiometry test asserts against, and a coefficient change cannot leave a
 * counter quietly measuring the old pathway.
 */

import { TICK_SECONDS } from '../../sim/constants';
import type { Reaction, StoichiometryTerm } from '../../sim/reactions';
import type { SimulationState } from '../../sim/state';
import type { Act1PoolId } from './pools';
import type { Act1ReactionId } from './reactions';

export interface Act1Meter {
  /** Gross ATP produced by the payoff phase. Not net of the preparatory spend. */
  atpProduced: number;
  /** ATP consumed by the preparatory phase. */
  atpSpent: number;
  /** ATP hydrolysed by baseline maintenance. */
  atpMaintained: number;
  /** Glucose committed to glycolysis. The denominator that means anything. */
  glucoseConsumed: number;
  /** Glucose imported from the environment. Not the same number, and the gap is the point. */
  glucoseTakenUp: number;
  lactateProduced: number;
  nadhProduced: number;
}

interface Probe {
  readonly reactionIndex: number;
  readonly coefficient: number;
}

/**
 * Resolved once. The hot path reads two typed arrays and multiplies, with no
 * lookups by id and no object-key iteration.
 */
export interface Act1MeterProbes {
  readonly atpFromPayoff: Probe;
  readonly atpIntoPrep: Probe;
  readonly atpIntoMaintain: Probe;
  readonly glucoseIntoPrep: Probe;
  readonly glucoseFromUptake: Probe;
  readonly lactateFromFerment: Probe;
  readonly nadhFromPayoff: Probe;
}

function probe(
  state: SimulationState,
  reactionId: Act1ReactionId,
  side: 'substrates' | 'products',
  poolId: Act1PoolId,
): Probe {
  const reactionIndex = state.reactions.findIndex((r) => r.id === reactionId);
  if (reactionIndex === -1) throw new Error(`Act1Meter: no reaction "${reactionId}"`);
  const poolIndex = state.pools.indexOf(poolId);

  let coefficient = 0;
  for (const term of (state.reactions[reactionIndex] as Reaction)[side] as readonly StoichiometryTerm[]) {
    if (term.poolIndex === poolIndex) coefficient += term.coefficient;
  }
  if (coefficient === 0) {
    throw new Error(`Act1Meter: "${reactionId}" has no ${poolId} among its ${side}`);
  }
  return { reactionIndex, coefficient };
}

export function createAct1Meter(): Act1Meter {
  return {
    atpProduced: 0,
    atpSpent: 0,
    atpMaintained: 0,
    glucoseConsumed: 0,
    glucoseTakenUp: 0,
    lactateProduced: 0,
    nadhProduced: 0,
  };
}

export function createAct1MeterProbes(state: SimulationState): Act1MeterProbes {
  return {
    atpFromPayoff: probe(state, 'payoff', 'products', 'atp'),
    atpIntoPrep: probe(state, 'prep', 'substrates', 'atp'),
    atpIntoMaintain: probe(state, 'maintain', 'substrates', 'atp'),
    glucoseIntoPrep: probe(state, 'prep', 'substrates', 'glucose'),
    glucoseFromUptake: probe(state, 'uptake', 'products', 'glucose'),
    lactateFromFerment: probe(state, 'ferment', 'products', 'lactate'),
    nadhFromPayoff: probe(state, 'payoff', 'products', 'nadh'),
  };
}

/** Units moved by one probe in the tick that just ran. */
function moved(state: SimulationState, p: Probe): number {
  return (
    (state.fluxes[p.reactionIndex] as number) *
    (state.scales[p.reactionIndex] as number) *
    TICK_SECONDS *
    p.coefficient
  );
}

/** Call once immediately after `tick`, before the next one. */
export function recordAct1Tick(
  state: SimulationState,
  probes: Act1MeterProbes,
  meter: Act1Meter,
): void {
  meter.atpProduced += moved(state, probes.atpFromPayoff);
  meter.atpSpent += moved(state, probes.atpIntoPrep);
  meter.atpMaintained += moved(state, probes.atpIntoMaintain);
  meter.glucoseConsumed += moved(state, probes.glucoseIntoPrep);
  meter.glucoseTakenUp += moved(state, probes.glucoseFromUptake);
  meter.lactateProduced += moved(state, probes.lactateFromFerment);
  meter.nadhProduced += moved(state, probes.nadhFromPayoff);
}

/* ===========================================================================
   THE OFFLINE PATH. UPDATELOGV8.md stage 3.

   The meter lives outside the simulation, so a jump that advanced the pools and
   not this would silently refund the player's progress toward every unlock. It
   is the easy one to forget precisely because it is not simulation state.

   Both halves read the same `moved` above, so the per-tick path and the jump
   path cannot measure different pathways. A coefficient change moves both or
   neither.
   =========================================================================== */

/** One tick's worth of every counter, captured at a steady state. */
export interface Act1MeterRates {
  atpProduced: number;
  atpSpent: number;
  atpMaintained: number;
  glucoseConsumed: number;
  glucoseTakenUp: number;
  lactateProduced: number;
  nadhProduced: number;
}

export function createAct1MeterRates(): Act1MeterRates {
  return createAct1Meter();
}

/**
 * Read the per-tick rate of every counter off the tick that just ran.
 *
 * Call immediately after a `tick`, for the same reason `recordAct1Tick` has to
 * be: `state.fluxes` and `state.scales` are scratch and the next tick
 * overwrites them.
 */
export function captureAct1MeterRates(
  state: SimulationState,
  probes: Act1MeterProbes,
  rates: Act1MeterRates,
): void {
  rates.atpProduced = moved(state, probes.atpFromPayoff);
  rates.atpSpent = moved(state, probes.atpIntoPrep);
  rates.atpMaintained = moved(state, probes.atpIntoMaintain);
  rates.glucoseConsumed = moved(state, probes.glucoseIntoPrep);
  rates.glucoseTakenUp = moved(state, probes.glucoseFromUptake);
  rates.lactateProduced = moved(state, probes.lactateFromFerment);
  rates.nadhProduced = moved(state, probes.nadhFromPayoff);
}

/** Advance every counter by `ticks` at the captured rates. Part 3 step 4. */
export function advanceAct1Meter(
  meter: Act1Meter,
  rates: Act1MeterRates,
  ticks: number,
): void {
  meter.atpProduced += rates.atpProduced * ticks;
  meter.atpSpent += rates.atpSpent * ticks;
  meter.atpMaintained += rates.atpMaintained * ticks;
  meter.glucoseConsumed += rates.glucoseConsumed * ticks;
  meter.glucoseTakenUp += rates.glucoseTakenUp * ticks;
  meter.lactateProduced += rates.lactateProduced * ticks;
  meter.nadhProduced += rates.nadhProduced * ticks;
}

/**
 * Gross ATP per glucose committed to glycolysis. The sourced figure is 4.
 *
 * The denominator is glucose consumed by the preparatory phase, not glucose
 * imported. During a stall those diverge badly: uptake keeps running and
 * intracellular glucose piles up unprocessed, so dividing by imports would
 * report a collapsing yield when what actually collapsed was throughput. Yield
 * per glucose that entered the pathway does not move, which is the entire point
 * fermentation is there to make.
 */
export function atpPerGlucose(meter: Act1Meter): number {
  if (meter.glucoseConsumed === 0) return 0;
  return meter.atpProduced / meter.glucoseConsumed;
}

/** Net of the preparatory phase's own spend. The sourced figure is 2. */
export function netAtpPerGlucose(meter: Act1Meter): number {
  if (meter.glucoseConsumed === 0) return 0;
  return (meter.atpProduced - meter.atpSpent) / meter.glucoseConsumed;
}

/**
 * Glucose that finished the pathway, as opposed to glucose that entered it.
 *
 * `g3pDelta` is the change in the g3p pool across the metered window. Every
 * glucose the preparatory phase consumes becomes two trioses, so trioses left
 * sitting in the pool at the end represent glucose that was paid for and has
 * not yet paid out. Half the leftover triose is the glucose still in flight.
 *
 * This correction is not bookkeeping fussiness, it is the difference between a
 * true statement and a false one. A stalled pathway strands its intermediates
 * permanently, so its raw ATP-per-glucose-consumed reads low forever, and
 * comparing that raw figure against a running pathway would show fermentation
 * apparently improving yield. It does not. What it does is stop stranding
 * carbon. Correct for the carbon in flight and both come out at the sourced
 * figure exactly.
 *
 * Two independent measurements meet here: `glucoseConsumed` comes from the flux
 * the tick applied to `prep`, and `g3pDelta` comes from the pool itself. They
 * only reconcile to exactly 4 if the stoichiometry is right.
 */
export function completedGlucose(meter: Act1Meter, g3pDelta: number): number {
  return meter.glucoseConsumed - g3pDelta / 2;
}

/** Gross ATP per glucose that finished the pathway. Exactly 4, stall or no stall. */
export function atpPerCompletedGlucose(meter: Act1Meter, g3pDelta: number): number {
  const completed = completedGlucose(meter, g3pDelta);
  if (completed === 0) return 0;
  return meter.atpProduced / completed;
}

/**
 * Net ATP per glucose that finished the pathway. Exactly 2, stall or no stall.
 *
 * The preparatory spend is prorated to the glucose that completed. It has to
 * be: the cell paid 2 ATP for every glucose it committed, including the ones
 * still sitting in the g3p pool, and those have not bought their ATP back yet.
 * Charging the full spend against only the completed glucose would report a
 * stalled pathway as running at a loss, which is a statement about timing
 * dressed up as a statement about yield.
 *
 * The prorating uses the measured spend rather than the coefficient, so this
 * still fails if the preparatory phase does not cost exactly 2.
 */
export function netAtpPerCompletedGlucose(meter: Act1Meter, g3pDelta: number): number {
  const completed = completedGlucose(meter, g3pDelta);
  if (completed === 0 || meter.glucoseConsumed === 0) return 0;
  const spentOnCompleted = meter.atpSpent * (completed / meter.glucoseConsumed);
  return (meter.atpProduced - spentOnCompleted) / completed;
}
