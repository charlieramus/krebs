/**
 * Act 1 reactions. Glucose uptake and glycolysis, plus the ATP sink that keeps
 * the adenylate pool honest.
 *
 * Every stoichiometric coefficient below traces to docs/SCIENCE.md Part 2.
 * Every rate lives in tuning.ts and traces to nothing. That split is deliberate
 * and it is the sourcing posture of the whole project: stoichiometry is
 * accurate, rates are tuned, and the game never implies otherwise.
 *
 *   uptake           glucose_env             ->  glucose
 *   prep             glucose + 2 atp         ->  2 g3p + 2 adp
 *   payoff           g3p + nad + 2 adp + pi  ->  pyruvate + nadh + 2 atp
 *   ferment          pyruvate + nadh         ->  lactate + nad          disabled
 *   ferment_ethanol  pyruvate + nadh         ->  ethanol + co2 + nad    disabled
 *   store            glucose + atp           ->  glycogen + adp + pi    disabled
 *   mobilise         glycogen                ->  glucose                disabled
 *   maintain         atp                     ->  adp + pi
 *
 * Net per glucose across uptake, prep and two turns of payoff: 2 ATP net, 4
 * gross, 2 NADH, 2 pyruvate. docs/SCIENCE.md Part 2, "Glycolysis". The
 * stoichiometry test computes those four numbers from the table above rather
 * than asserting them from memory.
 *
 * BOTH FERMENTATION BRANCHES SHIP DISABLED. The wall has to exist before the way
 * around it does. Run this pathway as it comes and it stalls with a full glucose
 * pool, which is the entire teaching beat of act 1. Enabling either branch
 * recovers throughput and does not move yield by a single ATP, which is the
 * thing most players arrive expecting to be false.
 *
 * AND THE TWO BRANCHES ARE A CHOICE RATHER THAN A LADDER. Both regenerate NAD+,
 * neither yields ATP, and they are given identical kinetics because nothing
 * sources a rate for either enzyme. What differs is what the cell is left
 * holding: three carbons of lactate kept, or two carbons of ethanol and one
 * carbon released as gas.
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
import {
  ACT1_HILL_N,
  ACT1_KM,
  ACT1_MAINTAIN_HILL_N,
  ACT1_STORE_HILL_N,
  ACT1_VMAX,
} from './tuning';

export type Act1ReactionId =
  | 'uptake'
  | 'prep'
  | 'payoff'
  | 'ferment'
  | 'ferment_ethanol'
  | 'store'
  | 'mobilise'
  | 'maintain';

export const ACT1_REACTION_IDS: readonly Act1ReactionId[] = [
  'uptake',
  'prep',
  'payoff',
  'ferment',
  'ferment_ethanol',
  'store',
  'mobilise',
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
  ferment_ethanol: false,
  store: false,
  mobilise: false,
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
     * to lactate and oxidising NADH back to NAD+. docs/SCIENCE.md Part 2,
     * "Fermentation".
     *
     * SHIPS DISABLED, AND THAT IS THE DESIGN. The wall has to be reachable. A
     * player who starts with this reaction running never meets the NAD+
     * constraint, and docs/PROGRESSION.md act 1, "The teaching beat" makes the constraint the
     * teaching beat of the entire act.
     *
     * WHAT THIS REACTION IS NOT. It produces no ATP. Look at the products:
     * lactate and NAD+, and nothing else. docs/SCIENCE.md Part 2, "Fermentation" says
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
     * Ethanol fermentation. The second NAD+ recycling branch, added by
     * UPDATELOGV10.md stage 2. docs/SCIENCE.md Part 2, "Ethanol fermentation".
     *
     * ONE LUMPED STEP, AND HERE IS WHAT THAT LOSES. The real branch is two
     * reactions: pyruvate decarboxylase removes the carbon dioxide to give
     * acetaldehyde, then alcohol dehydrogenase reduces the acetaldehyde and
     * reoxidises NADH. Only the second one touches the carrier.
     *
     * What lumping loses is that separation. A player cannot see that the
     * decarboxylation happens first and independently of the redox step, and
     * acetaldehyde never appears. What it buys is that the branch is the same
     * SHAPE as the lactate branch, one arrow off pyruvate, so the two sit side
     * by side as a choice rather than as a short route and a long one. The beat
     * is about what the branch produces, not about how it gets there, and an
     * acetaldehyde pool would be a card, a blob, two kinetic constants and two
     * divergence rows for a molecule the player meets once and never reads.
     *
     * Same posture as `prep` and `payoff`, which lump five enzymatic steps each
     * and say so.
     *
     * THE FIRST CARBON THIS GAME LETS OUT OF THE CELL, and it does not leave the
     * model. `co2` is a real pool with the carbon still in it, so carbon stays
     * conserved across this reaction exactly:
     *
     *     carbon        pyruvate 3  ->  ethanol 2 + co2 1
     *     redox     pyruvate 0 + nadh 1  ->  ethanol 1 + co2 0 + nad 0
     *
     * Drop the `co2` term and carbon fails at 3 in against 2 out, on carbon
     * alone and on nothing else. `__tests__/stoichiometry.test.ts` writes that
     * violation deliberately and asserts the failure, because a conservation
     * test that has never seen the thing it exists to catch is a test nobody has
     * checked.
     *
     * NO ATP HERE EITHER, and the claim has to be made for this branch on its
     * own rather than inherited from the lactate one. docs/SCIENCE.md states the
     * zero yield under this branch's own heading for exactly that reason: a
     * decarboxylation looks like it ought to cost or release something and it
     * does neither. There is no ATP term to remove and none that could have been
     * added without inventing one.
     *
     * SHIPS DISABLED, like `ferment`, and it does not replace it. A cell with
     * both runs both, against the same pyruvate and the same NADH, under their
     * own kinetics. What the player bought is an option rather than an upgrade.
     */
    {
      id: 'ferment_ethanol',
      substrates: [
        { poolIndex: at('pyruvate'), coefficient: 1 },
        { poolIndex: at('nadh'), coefficient: 1 },
      ],
      products: [
        { poolIndex: at('ethanol'), coefficient: 1 },
        { poolIndex: at('co2'), coefficient: 1 },
        { poolIndex: at('nad'), coefficient: 1 },
      ],
      kinetics: michaelisMenten(v('ferment_ethanol'), k('ferment_ethanol')),
      enabled: on('ferment_ethanol'),
    },

    /**
     * Glycogen synthesis. The way in. UPDATELOGV10.md stage 3.
     * docs/SCIENCE.md Part 2, "Glycogen, and what storage costs".
     *
     * THE REAL COST IS 2 ATP EQUIVALENTS AND THIS CHARGES 1. That is a
     * departure, it has a row, and here is the whole of it.
     *
     * A real cell pays twice going in: 1 ATP at hexokinase to make
     * glucose-6-phosphate, and 1 ATP equivalent at ADP-glucose
     * pyrophosphorylase to activate the donor, the released pyrophosphate being
     * hydrolysed, which is what makes that step irreversible and why it counts
     * as a whole ATP rather than a fraction. Coming out it pays nothing:
     * glycogen phosphorylase cleaves with inorganic phosphate rather than water
     * and hands back an already phosphorylated sugar, which re-enters glycolysis
     * PAST the hexokinase step. So one of the two is refunded on the way out and
     * a full store-and-retrieve cycle costs exactly 1 ATP equivalent.
     *
     * This model has no glucose-6-phosphate pool. A mobilised unit lands in
     * `glucose` and pays `prep`'s full 2 ATP entry cost like any other, so the
     * refund has nowhere to be realised. Charging 2 here would make a stored
     * glucose yield nothing at all, which is wrong by a factor the real cell
     * does not pay. Charging 1 here reproduces the real NET cost of the cycle
     * exactly and moves only WHERE it is charged.
     *
     * The one observable consequence, disclosed rather than hidden: a unit
     * stored and never retrieved cost 1 where a real cell paid 2. In act 1 the
     * buffer exists to be drawn down, so the retrieved case is the ordinary one.
     *
     * IT PRODUCES NO ATP AND IT NEVER WILL. Look at the sides: a glucose and an
     * ATP go in, a glucosyl residue and the spent adenylate come out. A buffer
     * is not a yield, and docs/PROGRESSION.md act 1 item 9 says so.
     *
     * THE THIRD HILL FORM IN ACT 1, AND THE SECOND THAT IS A REPAIR RATHER THAN
     * A CLAIM. This reaction is the second thing in act 1 that spends ATP and
     * produces none, which is the position `bootstrap.test.ts` says only
     * `maintain` was in. Built as Michaelis-Menten it is first order in ATP
     * against `prep`'s second, and NOW.md blocking item 1 came straight back: a
     * cell starting at an ATP of 0.01 fell to 8.937e-29 and produced nothing,
     * where the same cell without storage recovered to 9.304. Order 3 loses to
     * order 2 at low ATP instead, so the collapse does not start. Read
     * ACT1_STORE_HILL_N in tuning.ts before changing the form here.
     */
    {
      id: 'store',
      substrates: [
        { poolIndex: at('glucose'), coefficient: 1 },
        { poolIndex: at('atp'), coefficient: 1 },
      ],
      products: [
        { poolIndex: at('glycogen'), coefficient: 1 },
        { poolIndex: at('adp'), coefficient: 1 },
        { poolIndex: at('pi'), coefficient: 1 },
      ],
      kinetics: hill(v('store'), k('store'), ACT1_STORE_HILL_N),
      enabled: on('store'),
    },

    /**
     * Glycogen mobilisation. The way out, and it costs nothing, which is the
     * asymmetry the entry is about. docs/SCIENCE.md Part 2, "Glycogen".
     *
     * Glycogen phosphorylase spends no ATP. The inorganic phosphate it uses and
     * the one phosphoglucomutase carries through both belong to the
     * glucose-1-phosphate this model has no pool for, so nothing on either side
     * of this reaction touches phosphate at all and it balances trivially.
     *
     * NOTHING GATES THIS AND NOTHING CAN, WHICH IS A REAL LIMITATION OF THE
     * ENGINE AND IS RECORDED RATHER THAN WORKED AROUND.
     *
     * A real cell regulates synthesis and degradation reciprocally so they do
     * not run hard at once, and the bacterial control point is ADP-glucose
     * pyrophosphorylase being allosterically activated by glycolytic
     * intermediates and inhibited by AMP. `computeFlux` in src/sim/reactions.ts
     * takes the minimum of per-substrate saturation terms and there is no
     * inhibition term anywhere in `Kinetics`, so a reaction can be slowed by a
     * scarce substrate and never by an abundant regulator. Act 1 therefore ships
     * a futile cycle: with both reactions running, the same carbon is stored and
     * retrieved and the cell burns ATP for nothing at the rate of the slower one.
     *
     * THAT IS A REAL FAILURE MODE OF A REAL CELL RATHER THAN A MODELING
     * ARTIFACT. docs/SCIENCE.md Part 5 names the same thing for glycolysis
     * against gluconeogenesis. What suppresses it is allosteric regulation,
     * which is act 4's theme and not act 1's, so act 1 gets a cost it cannot
     * regulate away and act 4 is the act that would fix it.
     *
     * What bounds it instead is arithmetic. Storage runs on glucose, which is
     * scarce whenever the cell is short of it, so the cycle throttles itself
     * exactly when it would hurt. And the two Vmax values set where the pool
     * settles: glycogen grows until mobilisation matches storage and then stops,
     * so the buffer is self-limiting and CLAUDE.md hard rule 3 is not touched by
     * a pool that would otherwise grow forever.
     */
    {
      id: 'mobilise',
      substrates: [{ poolIndex: at('glycogen'), coefficient: 1 }],
      products: [{ poolIndex: at('glucose'), coefficient: 1 }],
      kinetics: michaelisMenten(v('mobilise'), k('mobilise')),
      enabled: on('mobilise'),
    },

    /**
     * Baseline ATP hydrolysis. Not a glycolytic step and not from
     * docs/SCIENCE.md Part 2, which describes the pathway rather than what the
     * cell spends its output on.
     *
     * The stoichiometry is nonetheless not invented: ATP hydrolyses to ADP and
     * inorganic phosphate, which is why phosphate stays conserved across it.
     * What is invented is that the cell does this at one saturating rate in ATP,
     * which is a modeling convenience standing in for the entire rest of
     * cellular metabolism. Its Vmax is in tuning.ts with everything else.
     *
     * THE SECOND HILL FORM IN ACT 1, AND THE ONLY ONE THAT IS NOT AN
     * ATTRIBUTION. `prep` above carries PFK-1's cooperativity on the phase's
     * behalf, which is a claim about a real enzyme. This one is not a claim
     * about anything. It is a repair, and the whole argument for it is in the
     * ACT1_MAINTAIN_HILL_N comment in tuning.ts. The short version: `prep` is
     * second order in ATP at low ATP and Michaelis-Menten consumption is first
     * order, so consumption beat production below some level whatever the
     * constants were, and act 1 had a state it could not come back from. Third
     * order consumption loses to second order production instead, and the cell
     * climbs back out.
     *
     * Read that comment before changing the form here. Dropping back to
     * Michaelis-Menten reintroduces NOW.md blocking item 1, and
     * `__tests__/bootstrap.test.ts` is the thing that will tell you so.
     */
    {
      id: 'maintain',
      substrates: [{ poolIndex: at('atp'), coefficient: 1 }],
      products: [
        { poolIndex: at('adp'), coefficient: 1 },
        { poolIndex: at('pi'), coefficient: 1 },
      ],
      kinetics: hill(v('maintain'), k('maintain'), ACT1_MAINTAIN_HILL_N),
      enabled: on('maintain'),
    },
  ];

  return createSimulation(pools, reactions, createPrng(options.seed ?? 20260729));
}
