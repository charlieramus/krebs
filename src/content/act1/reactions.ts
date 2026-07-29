/**
 * Act 1 reactions. Glucose uptake and glycolysis, plus the ATP sink that keeps
 * the adenylate pool honest.
 *
 * Every stoichiometric coefficient below traces to docs/SCIENCE.md Part 2.
 * Every rate lives in tuning.ts and traces to nothing. That split is deliberate
 * and it is the sourcing posture of the whole project: stoichiometry is
 * accurate, rates are tuned, and the game never implies otherwise.
 *
 *   uptake     glucose_env                   ->  glucose
 *   prep       glucose + 2 atp               ->  2 g3p + 2 adp
 *   payoff     g3p + nad + 2 adp + pi        ->  pyruvate + nadh + 2 atp
 *   ferment    pyruvate + nadh               ->  lactate + nad          disabled
 *   maintain   atp                           ->  adp + pi
 *
 * Net per glucose across uptake, prep and two turns of payoff: 2 ATP net, 4
 * gross, 2 NADH, 2 pyruvate. docs/SCIENCE.md Part 2 lines 89 to 96. The
 * stoichiometry test computes those four numbers from the table above rather
 * than asserting them from memory.
 *
 * FERMENTATION SHIPS DISABLED. The wall has to exist before the way around it
 * does. Run this pathway as it comes and it stalls with a full glucose pool,
 * which is the entire teaching beat of act 1. Enabling `ferment` recovers
 * throughput and does not move yield by a single ATP, which is the thing most
 * players arrive expecting to be false.
 *
 * WHY `maintain` EXISTS. ATP is not a score. The adenylate pool is fixed and
 * closed, and a cell hydrolyses ATP back to ADP and phosphate continuously to
 * do the work of being alive. Without that reaction, ATP accumulates against
 * the adenylate ceiling, ADP runs out, and the payoff phase stalls on a
 * substrate it should never be short of. With it, ATP is a flux with a stock
 * underneath rather than a number that only goes up, which is what NOW.md means
 * by flux being the headline and stock the subscript.
 *
 * WHY THE ENVIRONMENT IS A POOL. `glucose_env` is a real pool with real carbon
 * in it, not a substrate-free influx. A reaction with no substrates runs at
 * Vmax and manufactures carbon from nothing, which breaks conservation on the
 * first tick. Lactate is a real end pool for the same reason.
 */

import type { Reaction } from '../../sim/reactions';
import { hill, michaelisMenten } from '../../sim/reactions';
import { PoolRegistry } from '../../sim/pools';
import { createPrng } from '../../sim/prng';
import { createSimulation, type SimulationState } from '../../sim/state';
import { act1PoolDefinitions, type Act1PoolId } from './pools';
import { ACT1_HILL_N, ACT1_KM, ACT1_VMAX } from './tuning';

export type Act1ReactionId = 'uptake' | 'prep' | 'payoff' | 'ferment' | 'maintain';

export const ACT1_REACTION_IDS: readonly Act1ReactionId[] = [
  'uptake',
  'prep',
  'payoff',
  'ferment',
  'maintain',
];

export interface Act1Options {
  initial: Readonly<Partial<Record<Act1PoolId, number>>>;
  vmax: Readonly<Partial<Record<Act1ReactionId, number>>>;
  km: Readonly<Partial<Record<Act1ReactionId, number>>>;
  /**
   * Per-reaction enabled flag. Only `ferment` ships disabled, and this is the
   * whole unlock mechanism in V2: no cost, no threshold, no purchase. Unlock
   * gating needs an interface to be gated from and that is V3.
   */
  enabled: Readonly<Partial<Record<Act1ReactionId, boolean>>>;
  seed: number;
}

/**
 * Which reactions are running at the start of act 1.
 *
 * `ferment` is false because the wall has to be reachable. A player who starts
 * with lactate dehydrogenase never meets the NAD+ constraint, and the
 * constraint is the act.
 */
export const ACT1_ENABLED: Readonly<Record<Act1ReactionId, boolean>> = {
  uptake: true,
  prep: true,
  payoff: true,
  ferment: false,
  maintain: true,
};

/**
 * Build the act 1 pathway.
 *
 * The option shape mirrors `createToyPathway` on purpose, down to the partial
 * records. The conservation property test in stage 5 randomizes initial
 * amounts, Vmax and Km against the toy pathway, and it should be able to do the
 * same thing to this one through the same door rather than growing a second
 * code path for real biology.
 */
export function createAct1(options: Partial<Act1Options> = {}): SimulationState {
  const initial = options.initial ?? {};
  const vmax = options.vmax ?? {};
  const km = options.km ?? {};
  const enabled = options.enabled ?? {};

  const pools = new PoolRegistry(act1PoolDefinitions(initial));

  /**
   * Pool indices are resolved through the registry, never written as numbers.
   * `indexOf` throws on an unknown id, which is the point of using it: a typo
   * in a pool name fails at construction instead of silently addressing
   * whichever pool happens to sit at that index.
   */
  const at = (id: Act1PoolId): number => pools.indexOf(id);

  const v = (id: Act1ReactionId): number => vmax[id] ?? ACT1_VMAX[id];
  const k = (id: Act1ReactionId): number => km[id] ?? ACT1_KM[id];
  const on = (id: Act1ReactionId): boolean => enabled[id] ?? ACT1_ENABLED[id];

  const reactions: readonly Reaction[] = [
    /**
     * Transport across the membrane. No transporter is named and no energetic
     * cost is charged.
     *
     * That is a disclosed simplification, not an omission. docs/SCIENCE.md does
     * not cover the uptake mechanism, and a prokaryote of this period may well
     * have used a phosphotransferase system, which costs one PEP and would
     * change the act 1 ATP ledger away from the sourced net of 2 per glucose.
     * Charging a guessed cost is worse than charging none and saying so. See
     * docs/SCIENCE.md Part 1, "Glucose uptake is modeled as untyped transport".
     */
    {
      id: 'uptake',
      substrates: [{ poolIndex: at('glucose_env'), coefficient: 1 }],
      products: [{ poolIndex: at('glucose'), coefficient: 1 }],
      kinetics: michaelisMenten(v('uptake'), k('uptake')),
      enabled: on('uptake'),
    },

    /**
     * Preparatory phase, steps 1 to 5. docs/SCIENCE.md Part 2: the cell spends
     * 2 ATP to phosphorylate glucose and destabilise it, and the six-carbon
     * skeleton is cleaved into two three-carbon fragments.
     *
     * COOPERATIVITY: AN ATTRIBUTION, NOT A MEASUREMENT.
     *
     * This is the one reaction in act 1 using the Hill form. The sigmoidal
     * response being modeled belongs to PFK-1, which docs/SCIENCE.md Part 2
     * names as the committed step of the pathway and the one enzyme where
     * cooperativity matters enough to model explicitly.
     *
     * PFK-1 is step 3 of five. This log does not decompose the phase into its
     * individual enzymes, so the phase reaction carries the committed step's
     * kinetics on its behalf. That means the whole preparatory phase responds
     * sigmoidally to glucose, where in reality only one step inside it does.
     *
     * Someone reading `hill(...)` here will otherwise read it as sourced. It is
     * an attribution: correct about which enzyme is cooperative, wrong about
     * what the cooperativity is attached to. When the phase is decomposed into
     * ten enzymes the Hill form moves onto PFK-1 alone and everything else in
     * the phase reverts to Michaelis-Menten.
     */
    {
      id: 'prep',
      substrates: [
        { poolIndex: at('glucose'), coefficient: 1 },
        { poolIndex: at('atp'), coefficient: 2 },
      ],
      products: [
        { poolIndex: at('g3p'), coefficient: 2 },
        { poolIndex: at('adp'), coefficient: 2 },
      ],
      kinetics: hill(v('prep'), k('prep'), ACT1_HILL_N),
      enabled: on('prep'),
    },

    /**
     * Payoff phase, steps 6 to 10. docs/SCIENCE.md Part 2: each three-carbon
     * fragment yields 2 ATP and 1 NADH, and two fragments run per glucose, so 4
     * ATP and 2 NADH gross.
     *
     * The `pi` on the substrate side is the free phosphate GAPDH incorporates
     * at step 6, which is also where NAD+ is reduced. It is not decoration: it
     * is what makes the phosphate balance close without the triose having to
     * arrive carrying a phosphate it does not have.
     *
     * NAD+ is a substrate here and this is the only reaction in act 1 that
     * consumes it. That single fact is the whole act. docs/SCIENCE.md Part 2
     * line 108: the cellular NAD+ pool is small and fixed, and if NADH is not
     * reoxidised, glycolysis halts within seconds regardless of glucose.
     */
    {
      id: 'payoff',
      substrates: [
        { poolIndex: at('g3p'), coefficient: 1 },
        { poolIndex: at('nad'), coefficient: 1 },
        { poolIndex: at('adp'), coefficient: 2 },
        { poolIndex: at('pi'), coefficient: 1 },
      ],
      products: [
        { poolIndex: at('pyruvate'), coefficient: 1 },
        { poolIndex: at('nadh'), coefficient: 1 },
        { poolIndex: at('atp'), coefficient: 2 },
      ],
      kinetics: michaelisMenten(v('payoff'), k('payoff')),
      enabled: on('payoff'),
    },

    /**
     * Lactate fermentation. One step, lactate dehydrogenase reducing pyruvate
     * to lactate and oxidising NADH back to NAD+. docs/SCIENCE.md Part 2 line
     * 116.
     *
     * SHIPS DISABLED, AND THAT IS THE DESIGN. The wall has to be reachable. A
     * player who starts with this reaction running never meets the NAD+
     * constraint, and docs/PROGRESSION.md line 40 makes the constraint the
     * teaching beat of the entire act.
     *
     * WHAT THIS REACTION IS NOT. It produces no ATP. Look at the products:
     * lactate and NAD+, and nothing else. docs/SCIENCE.md Part 2 line 114 says
     * framing fermentation as an energy pathway is a common misconception and
     * the game should correct it directly, so the stoichiometry has to be able
     * to carry that correction on its own. It does. There is no ATP term here
     * to remove and none that could have been added without inventing one.
     *
     * What it buys is throughput. Recycling NAD+ lets the payoff phase keep
     * running, so ATP per second goes up while ATP per glucose does not move at
     * all. The nadWall test asserts exactly that, because a claim the player is
     * expected to find surprising should be a claim the test suite can prove.
     */
    {
      id: 'ferment',
      substrates: [
        { poolIndex: at('pyruvate'), coefficient: 1 },
        { poolIndex: at('nadh'), coefficient: 1 },
      ],
      products: [
        { poolIndex: at('lactate'), coefficient: 1 },
        { poolIndex: at('nad'), coefficient: 1 },
      ],
      kinetics: michaelisMenten(v('ferment'), k('ferment')),
      enabled: on('ferment'),
    },

    /**
     * Baseline ATP hydrolysis. Not a glycolytic step and not from
     * docs/SCIENCE.md Part 2, which describes the pathway rather than what the
     * cell spends its output on.
     *
     * The stoichiometry is nonetheless not invented: ATP hydrolyses to ADP and
     * inorganic phosphate, which is why phosphate stays conserved across it.
     * What is invented is that the cell does this at a Michaelis-Menten rate in
     * ATP, which is a modeling convenience standing in for the entire rest of
     * cellular metabolism. Its Vmax is in tuning.ts with everything else.
     */
    {
      id: 'maintain',
      substrates: [{ poolIndex: at('atp'), coefficient: 1 }],
      products: [
        { poolIndex: at('adp'), coefficient: 1 },
        { poolIndex: at('pi'), coefficient: 1 },
      ],
      kinetics: michaelisMenten(v('maintain'), k('maintain')),
      enabled: on('maintain'),
    },
  ];

  return createSimulation(pools, reactions, createPrng(options.seed ?? 20260729));
}
