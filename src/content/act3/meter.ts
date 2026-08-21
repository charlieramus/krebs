/**
 * Act 3's meter. UPDATELOGV14.md stage 5.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS EXISTS AND WHAT IT COUNTS THAT ACT 1'S DOES NOT
 * ---------------------------------------------------------------------------
 *
 * Kept beside the simulation and never in it, exactly as act 1's is: the kernel
 * does not know what a pool means and a meter is a content question.
 *
 * IT READS APPLIED FLUX RATHER THAN POOL LEVELS, which act 1's meter also does
 * and which stage 5 rediscovered the hard way. A first version of the pacing
 * harness measured cumulative ATP as the sum of increases in the `atp` pool.
 * **At steady state production equals consumption and the pool does not move**,
 * so a cell producing 25 ATP per game-second metered 0.00 and act 3 appeared
 * unable to reach its second purchase. The pool level is a state and the meter
 * needs a rate.
 *
 * ---------------------------------------------------------------------------
 * ACT 3 MAKES ATP IN THREE PLACES AND ONLY TWO OF THEM ARE NEW
 * ---------------------------------------------------------------------------
 *
 *     payoff          substrate-level, in the cytosol. Act 1's, unchanged
 *     tca             substrate-level, in the matrix, at succinyl-CoA
 *                     synthetase. Really GTP and energetically equivalent
 *     atp_synthase    the gradient, in the matrix
 *
 * **`ant` is deliberately not counted.** It moves ATP from the matrix to the
 * cytosol and makes none, so counting it would count the synthase's output twice
 * and would put act 3's yield at roughly 58 rather than 31. That is the exact
 * shape of error the ledger test exists to catch, and it is worth naming here
 * because "every reaction with ATP on the product side" is the obvious wrong
 * rule.
 */

import { TICK_SECONDS } from '../../sim/constants';
import type { SimulationState } from '../../sim/state';

export interface Act3Meter {
  /** Cumulative gross ATP produced, anywhere in the cell. Rises only. */
  atpProduced: number;
  /** Cumulative ATP spent by the preparatory phase. Rises only. */
  atpSpent: number;
  /** Cumulative ATP consumed by maintenance. */
  atpMaintained: number;
  /** Cumulative glucose taken up from the environment. */
  glucoseTakenUp: number;
  /** Cumulative glucose committed to the pathway. */
  glucoseConsumed: number;
  /** Cumulative lactate produced, which is the yield the cell threw away. */
  lactateProduced: number;
  /** Cumulative pairs delivered to the chain. Act 3's own figure. */
  nadhProduced: number;
  /** Cumulative water made at complex IV, which is the chain's turnover. */
  waterProduced: number;
}

export function createAct3Meter(): Act3Meter {
  return {
    atpProduced: 0,
    atpSpent: 0,
    atpMaintained: 0,
    glucoseTakenUp: 0,
    glucoseConsumed: 0,
    lactateProduced: 0,
    nadhProduced: 0,
    waterProduced: 0,
  };
}

interface Probe {
  readonly reactionIndex: number;
  readonly coefficient: number;
}

export interface Act3MeterProbes {
  readonly atpFromPayoff: Probe;
  readonly atpFromTca: Probe;
  readonly atpFromSynthase: Probe;
  readonly atpIntoPrep: Probe;
  readonly atpIntoMaintain: Probe;
  readonly glucoseFromUptake: Probe;
  readonly glucoseIntoPrep: Probe;
  readonly lactateFromFerment: Probe;
  readonly nadhFromPayoff: Probe;
  readonly waterFromComplex4: Probe;
}

/**
 * Resolve every probe once, at construction.
 *
 * The same posture `usePoolIndex` took after V11 found a linear scan on the
 * per-frame path: a lookup that can be done once is done once, and the hot path
 * sees indices.
 */
export function createAct3MeterProbes(state: SimulationState): Act3MeterProbes {
  const at = (id: string): number => {
    const index = state.reactions.findIndex((r) => r.id === id);
    if (index === -1) throw new Error(`act 3 meter: no reaction "${id}"`);
    return index;
  };
  const coefficientOf = (id: string, side: 'substrates' | 'products', pool: string): number => {
    const reaction = state.reactions[at(id)];
    if (reaction === undefined) return 0;
    const poolIndex = state.pools.indexOf(pool);
    for (const term of reaction[side]) if (term.poolIndex === poolIndex) return term.coefficient;
    throw new Error(`act 3 meter: "${id}" has no ${side.slice(0, -1)} "${pool}"`);
  };

  return {
    atpFromPayoff: { reactionIndex: at('payoff'), coefficient: coefficientOf('payoff', 'products', 'atp') },
    atpFromTca: { reactionIndex: at('tca'), coefficient: coefficientOf('tca', 'products', 'atp_matrix') },
    atpFromSynthase: {
      reactionIndex: at('atp_synthase'),
      coefficient: coefficientOf('atp_synthase', 'products', 'atp_matrix'),
    },
    atpIntoPrep: { reactionIndex: at('prep'), coefficient: coefficientOf('prep', 'substrates', 'atp') },
    atpIntoMaintain: {
      reactionIndex: at('maintain'),
      coefficient: coefficientOf('maintain', 'substrates', 'atp'),
    },
    glucoseFromUptake: {
      reactionIndex: at('uptake'),
      coefficient: coefficientOf('uptake', 'products', 'glucose'),
    },
    glucoseIntoPrep: { reactionIndex: at('prep'), coefficient: coefficientOf('prep', 'substrates', 'glucose') },
    lactateFromFerment: {
      reactionIndex: at('ferment'),
      coefficient: coefficientOf('ferment', 'products', 'lactate'),
    },
    nadhFromPayoff: { reactionIndex: at('payoff'), coefficient: coefficientOf('payoff', 'products', 'nadh') },
    waterFromComplex4: {
      reactionIndex: at('complex_4'),
      coefficient: coefficientOf('complex_4', 'products', 'water'),
    },
  };
}

/** Applied flux through one probe over `seconds`. Act 1's `moved`, unchanged. */
function moved(state: SimulationState, p: Probe, seconds: number): number {
  return (
    (state.fluxes[p.reactionIndex] as number) *
    (state.scales[p.reactionIndex] as number) *
    seconds *
    p.coefficient
  );
}

/**
 * Call once immediately after `tick`, before the next one.
 *
 * `seconds` is the length of the step, TICK_SECONDS for every caller but the
 * offline fallback, which takes 1Hz steps. A meter that assumed the tick length
 * would undercount a coarse step twentyfold and the error would look like lost
 * progress rather than like a bookkeeping bug.
 */
export function recordAct3Tick(
  state: SimulationState,
  probes: Act3MeterProbes,
  meter: Act3Meter,
  seconds: number = TICK_SECONDS,
): void {
  meter.atpProduced +=
    moved(state, probes.atpFromPayoff, seconds) +
    moved(state, probes.atpFromTca, seconds) +
    moved(state, probes.atpFromSynthase, seconds);
  meter.atpSpent += moved(state, probes.atpIntoPrep, seconds);
  meter.atpMaintained += moved(state, probes.atpIntoMaintain, seconds);
  meter.glucoseTakenUp += moved(state, probes.glucoseFromUptake, seconds);
  meter.glucoseConsumed += moved(state, probes.glucoseIntoPrep, seconds);
  meter.lactateProduced += moved(state, probes.lactateFromFerment, seconds);
  meter.nadhProduced += moved(state, probes.nadhFromPayoff, seconds);
  meter.waterProduced += moved(state, probes.waterFromComplex4, seconds);
}

/** Net ATP per glucose committed to the pathway. Zero before anything runs. */
export function act3NetAtpPerGlucose(meter: Act3Meter): number {
  if (meter.glucoseConsumed <= 0) return 0;
  return (meter.atpProduced - meter.atpSpent) / meter.glucoseConsumed;
}
