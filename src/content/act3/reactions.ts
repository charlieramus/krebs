/**
 * Act 3 reactions. UPDATELOGV14.md stage 4.
 *
 * Thirteen reactions. Act 1 had eight.
 *
 * ---------------------------------------------------------------------------
 * EVERY COEFFICIENT BELOW IS SOURCED AND NOT ONE OF THEM IS TUNED
 * ---------------------------------------------------------------------------
 *
 * docs/SCIENCE.md Part 4, written by stage 1 for exactly this. The proton counts
 * at each complex, the protons per ATP, the carriers per turn of the cycle and
 * the yield that falls out of all of it are the document's figures.
 * `tuning.ts` holds rates and half-saturation constants and nothing that changes
 * what a glucose is worth.
 *
 * **This is what makes act 3's headline claim checkable rather than asserted.**
 * The ledger is computed from this table by `ledger.test.ts` and compared
 * against the range docs/SCIENCE.md Part 4 gives.
 *
 * ---------------------------------------------------------------------------
 * THE ORDER IS THE TEACHING AND THE DISABLED FLAGS ARE HOW
 * ---------------------------------------------------------------------------
 *
 * docs/PROGRESSION.md act 3: the mechanics have to force the chemiosmosis beat,
 * so the player builds the gradient before they can spend it. Everything from
 * `pyruvate_transport` down ships disabled and is bought in sequence.
 *
 * **A player who owns complexes I to IV and not ATP synthase is the point.**
 * Protons pile into `proton_ims`, the gradient climbs, and no ATP arrives,
 * because nothing in this table converts a gradient into ATP except the synthase
 * they have not bought. That is not an unbalanced state to be avoided. It is the
 * least intuitive idea in the game, happening to them.
 *
 * ---------------------------------------------------------------------------
 * WHAT IS LUMPED, AND THE PRECEDENT IS ACT 1'S OWN
 * ---------------------------------------------------------------------------
 *
 * `tca` is one reaction standing for eight enzymes, exactly as act 1's `prep`
 * and `payoff` stand for ten. **Every intermediate of the cycle is regenerated,
 * so the lumped form needs no intermediate pools at all**: oxaloacetate goes in
 * and comes back out, and it cancels.
 *
 * docs/PROGRESSION.md asks for the cycle "initially as one unit, then
 * decomposed". Act 1's list says the same thing about glycolysis and act 1 ships
 * two lumped phases, because the decomposition that is worth selling is the
 * three regulated steps rather than all eight. Those are sold as throughput
 * upgrades on this reaction, which is what `enzyme-pfk1-pk` already does to
 * `prep`. Stage 4's report says what that costs.
 *
 * `pdh` is likewise one reaction for a three-enzyme complex, which is honest
 * because the complex really is one assembly and the intermediates never leave
 * it. docs/SCIENCE.md Part 4.
 */

import { PoolRegistry } from '../../sim/pools';
import { createPrng } from '../../sim/prng';
import { hill, michaelisMenten, type Reaction } from '../../sim/reactions';
import { createSimulation, type SimulationState } from '../../sim/state';
import { act3PoolDefinitions, type Act3PoolId } from './pools';
import {
  ACT3_HILL_N,
  ACT3_KM,
  ACT3_MAINTAIN_HILL_N,
  ACT3_SYNTHASE_HILL_N,
  ACT3_VMAX,
} from './tuning';

export type Act3ReactionId =
  | 'uptake'
  | 'prep'
  | 'payoff'
  | 'ferment'
  | 'pyruvate_transport'
  | 'pdh'
  | 'tca'
  | 'complex_1'
  | 'complex_2'
  | 'complex_3'
  | 'complex_4'
  | 'proton_leak'
  | 'atp_synthase'
  | 'ant'
  | 'shuttle_malate_aspartate'
  | 'shuttle_glycerol_phosphate'
  | 'maintain';

export const ACT3_REACTION_IDS: readonly Act3ReactionId[] = [
  'uptake',
  'prep',
  'payoff',
  'ferment',
  'pyruvate_transport',
  'pdh',
  'tca',
  'complex_1',
  'complex_2',
  'complex_3',
  'complex_4',
  'proton_leak',
  'atp_synthase',
  'ant',
  'shuttle_malate_aspartate',
  'shuttle_glycerol_phosphate',
  'maintain',
];

/**
 * What ships on. Glycolysis and maintenance, and nothing else.
 *
 * The cell arrives able to do exactly what it could do at the end of act 1, plus
 * a compartment it cannot yet use. Everything that uses the compartment is
 * bought, in the order docs/PROGRESSION.md lists.
 */
export const ACT3_ENABLED: Readonly<Record<Act3ReactionId, boolean>> = {
  uptake: true,
  prep: true,
  payoff: true,
  ferment: true,
  pyruvate_transport: false,
  pdh: false,
  tca: false,
  complex_1: false,
  complex_2: false,
  complex_3: false,
  complex_4: false,
  proton_leak: true,
  atp_synthase: false,
  ant: false,
  shuttle_malate_aspartate: false,
  shuttle_glycerol_phosphate: false,
  maintain: true,
};

export interface Act3Options {
  initial: Readonly<Partial<Record<Act3PoolId, number>>>;
  vmax: Readonly<Partial<Record<Act3ReactionId, number>>>;
  km: Readonly<Partial<Record<Act3ReactionId, number>>>;
  enabled: Readonly<Partial<Record<Act3ReactionId, boolean>>>;
  seed: number;
}

export function createAct3(options: Partial<Act3Options> = {}): SimulationState {
  const initial = options.initial ?? {};
  const vmax = options.vmax ?? {};
  const km = options.km ?? {};
  const enabled = options.enabled ?? {};

  const pools = new PoolRegistry(act3PoolDefinitions(initial));
  const at = (id: Act3PoolId): number => pools.indexOf(id);
  const v = (id: Act3ReactionId): number => vmax[id] ?? ACT3_VMAX[id];
  const k = (id: Act3ReactionId): number => km[id] ?? ACT3_KM[id];
  const on = (id: Act3ReactionId): boolean => enabled[id] ?? ACT3_ENABLED[id];

  const reactions: readonly Reaction[] = [
    /* -------------------------------------------------------------------
       GLYCOLYSIS, UNCHANGED FROM ACT 1 AND THAT IS THE POINT

       Same three reactions, same coefficients, same ids. The cell did not get
       better at glycolysis. It got somewhere to send the pyruvate.

       FERMENTATION IS HERE, ENABLED, AND STAGE 5 MEASURED THAT IT HAD TO BE.

       It was left out first, on the argument that a eukaryote with a working
       chain does not ferment. **That is true of a cell at the END of act 3 and
       false of one at the beginning**, and the measurement was unambiguous: with
       no fermentation the cell walls on cytosolic NAD+ within seconds, exactly
       as act 1 does, and NOTHING PURCHASABLE RELIEVES IT. Both shuttles hand the
       pair to a carrier the chain has to re-oxidise, so the first thing that
       unwalls the cell is the whole chain, and the whole chain costs ATP the
       walled cell can never make. Act 3 could not start. Gross ATP reached 1 of
       19 purchases and stopped.

       The lactate branch is what the cell already has. It arrives holding
       everything act 1 taught it, it keeps regenerating NAD+ at no yield, and
       **the shuttles become a real choice against it rather than a replacement
       for it**: send the pair to the chain and it is worth ATP, or dump it into
       lactate and it is worth nothing, which is act 1's lesson being paid off
       rather than restated.

       Only lactate, not ethanol. One route is enough to unwall the cell and the
       ethanol branch is act 1's content.
       ------------------------------------------------------------------- */
    {
      id: 'uptake',
      substrates: [{ poolIndex: at('glucose_env'), coefficient: 1 }],
      products: [{ poolIndex: at('glucose'), coefficient: 1 }],
      kinetics: michaelisMenten(v('uptake'), k('uptake')),
      enabled: on('uptake'),
    },
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
      kinetics: hill(v('prep'), k('prep'), ACT3_HILL_N),
      enabled: on('prep'),
    },
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
     * Lactate fermentation, carried over from act 1 unchanged.
     *
     *     pyruvate + NADH  ->  lactate + NAD+
     *
     * docs/SCIENCE.md Part 2, Fermentation. Zero ATP, which is the act 1
     * misconception this game exists to correct, and it is the reason the
     * shuttles are worth buying: the same pair is worth nothing here and
     * roughly two and a half ATP through the chain.
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

    /* -------------------------------------------------------------------
       INTO THE COMPARTMENT

       THE FIRST CROSSING IN THE GAME, AND IT IS ELECTRONEUTRAL HERE WHILE THE
       REAL CARRIER IS NOT.

       docs/SCIENCE.md Part 4: the mitochondrial pyruvate carrier imports
       pyruvate in symport with a proton, driven by the pH difference across the
       inner membrane. **This model does not charge that proton, and the reason
       is a circularity the coupling creates rather than a wish to make the act
       easier.**

       Measured. A cell that has just acquired a compartment has no gradient,
       because a gradient is made by a chain it has not switched on yet. If
       getting the substrate in costs a proton from outside, then no pyruvate
       crosses, so no NADH is made in the matrix, so nothing pumps, so no proton
       ever reaches the outside. **A cell that starts flat can never start.**
       Stage 5 tried it with a resting gradient stocked in advance and the basal
       leak drained it in about three game-seconds, which is what a leak does to
       a gradient with no source.

       So the coupling is dropped and disclosed. It costs the act one true fact
       about a carrier and it buys the act the ability to begin. docs/ECONOMY.md
       carries the row. What is NOT dropped is the gradient's cost at the
       translocase, which is where the sourced protons-per-ATP figure actually
       lives.
       ------------------------------------------------------------------- */
    {
      id: 'pyruvate_transport',
      substrates: [{ poolIndex: at('pyruvate'), coefficient: 1 }],
      products: [{ poolIndex: at('pyruvate_matrix'), coefficient: 1 }],
      kinetics: michaelisMenten(v('pyruvate_transport'), k('pyruvate_transport')),
      enabled: on('pyruvate_transport'),
    },

    /**
     * The link reaction. docs/SCIENCE.md Part 4, "Pyruvate oxidation".
     *
     *     pyruvate + CoA + NAD+  ->  acetyl-CoA + CO2 + NADH
     *
     * One reaction for a three-enzyme complex, which is honest rather than
     * lumped: the assembly really is one machine and the intermediates never
     * leave it.
     *
     * **This is the decarboxylation the player already bought once.** E1 uses
     * thiamine pyrophosphate exactly as act 1's pyruvate decarboxylase does, on
     * the same substrate, releasing the same carbon dioxide into the same `co2`
     * pool. What act 3 sells is not the reaction, it is where the two-carbon
     * fragment goes.
     */
    {
      id: 'pdh',
      substrates: [
        { poolIndex: at('pyruvate_matrix'), coefficient: 1 },
        { poolIndex: at('coa_matrix'), coefficient: 1 },
        { poolIndex: at('nad_matrix'), coefficient: 1 },
      ],
      products: [
        { poolIndex: at('acetyl_coa_matrix'), coefficient: 1 },
        { poolIndex: at('co2'), coefficient: 1 },
        { poolIndex: at('nadh_matrix'), coefficient: 1 },
      ],
      kinetics: michaelisMenten(v('pdh'), k('pdh')),
      enabled: on('pdh'),
    },

    /**
     * The TCA cycle, as one unit. docs/SCIENCE.md Part 4, the eight steps.
     *
     *     acetyl-CoA + 3 NAD+ + FAD + ADP + Pi
     *       ->  CoA + 2 CO2 + 3 NADH + FADH2 + ATP
     *
     * Every intermediate is regenerated, so the lumped form carries none of
     * them. Oxaloacetate enters at step 1 and leaves at step 8 and cancels.
     *
     * THE ATP HERE IS THE CYCLE'S ONLY SUBSTRATE-LEVEL PHOSPHORYLATION, at
     * succinyl-CoA synthetase, and the document notes that it is really GTP and
     * is energetically equivalent. **Eleven of the twelve energy-carrying
     * products of two turns are reduced carrier**, which is worth nothing until
     * the chain and the gradient exist. That is the act's teaching beat visible
     * in the stoichiometry rather than stated in a paragraph.
     *
     * FADH2 is produced as a free pool here where in the cell it never leaves
     * succinate dehydrogenase, which is complex II and is in the membrane. That
     * is a consequence of lumping the cycle and it is disclosed in
     * docs/ECONOMY.md rather than hidden: complex_2 below consumes it, so the
     * electrons reach the quinone pool by the same route and in the same
     * amount.
     */
    {
      id: 'tca',
      substrates: [
        { poolIndex: at('acetyl_coa_matrix'), coefficient: 1 },
        { poolIndex: at('nad_matrix'), coefficient: 3 },
        { poolIndex: at('fad_matrix'), coefficient: 1 },
        { poolIndex: at('adp_matrix'), coefficient: 1 },
        { poolIndex: at('pi_matrix'), coefficient: 1 },
      ],
      products: [
        { poolIndex: at('coa_matrix'), coefficient: 1 },
        { poolIndex: at('co2'), coefficient: 2 },
        { poolIndex: at('nadh_matrix'), coefficient: 3 },
        { poolIndex: at('fadh2_matrix'), coefficient: 1 },
        { poolIndex: at('atp_matrix'), coefficient: 1 },
      ],
      kinetics: michaelisMenten(v('tca'), k('tca')),
      enabled: on('tca'),
    },

    /* -------------------------------------------------------------------
       THE CHAIN, COMPLEX BY COMPLEX

       Every proton count below is docs/SCIENCE.md Part 4, per two electrons.

           complex I     4 pumped, plus 2 taken from the matrix to make QH2
           complex II    0. Not a pump and it has no proton path
           complex III   4 appear outside, 2 taken from the matrix
           complex IV    2 pumped, plus 2 consumed to make the water

       Per NADH the chain moves 10 protons and per FADH2 it moves 6, and that
       difference of exactly 4 is complex I's pump, which is the entire reason
       the shuttle choice in stage 5 is a real choice.
       ------------------------------------------------------------------- */
    {
      id: 'complex_1',
      substrates: [
        { poolIndex: at('nadh_matrix'), coefficient: 1 },
        { poolIndex: at('q_membrane'), coefficient: 1 },
        // Four. The two that reduce the quinone are the carrier's own hydrogen
        // and are implicit, per the note on `proton` in pools.ts.
        { poolIndex: at('proton_matrix'), coefficient: 4 },
      ],
      products: [
        { poolIndex: at('nad_matrix'), coefficient: 1 },
        { poolIndex: at('qh2_membrane'), coefficient: 1 },
        { poolIndex: at('proton_ims'), coefficient: 4 },
      ],
      kinetics: michaelisMenten(v('complex_1'), k('complex_1')),
      enabled: on('complex_1'),
    },
    {
      id: 'complex_2',
      substrates: [
        { poolIndex: at('fadh2_matrix'), coefficient: 1 },
        { poolIndex: at('q_membrane'), coefficient: 1 },
      ],
      products: [
        { poolIndex: at('fad_matrix'), coefficient: 1 },
        { poolIndex: at('qh2_membrane'), coefficient: 1 },
      ],
      kinetics: michaelisMenten(v('complex_2'), k('complex_2')),
      enabled: on('complex_2'),
    },
    /**
     * Complex III, and the Q cycle is why the protons come from two places.
     *
     * Four protons appear outside per ubiquinol: two are pumped across and two
     * are released by oxidising the ubiquinol on the outer face, which is where
     * ubiquinol's own pair of protons goes. Two are taken from the matrix.
     *
     * CYTOCHROME C IS COUNTED IN PAIRS HERE AND THE REAL CARRIER TAKES ONE
     * ELECTRON. docs/SCIENCE.md Part 4 records that the mismatch between a
     * two-electron donor and a one-electron acceptor is exactly what the Q cycle
     * exists to handle, and that leaving a single electron on a quinone is how a
     * respiring cell makes superoxide. One unit of `cytc_red_ims` is two
     * molecules, so the conserved weights stay integers. docs/ECONOMY.md.
     */
    {
      id: 'complex_3',
      substrates: [
        { poolIndex: at('qh2_membrane'), coefficient: 1 },
        { poolIndex: at('cytc_ox_ims'), coefficient: 1 },
        // Four appear outside per ubiquinol: two pumped and two released by
        // oxidising it on the outer face. All four are drawn from the matrix
        // here, because the two the ubiquinol was holding are implicit.
        { poolIndex: at('proton_matrix'), coefficient: 4 },
      ],
      products: [
        { poolIndex: at('q_membrane'), coefficient: 1 },
        { poolIndex: at('cytc_red_ims'), coefficient: 1 },
        { poolIndex: at('proton_ims'), coefficient: 4 },
      ],
      kinetics: michaelisMenten(v('complex_3'), k('complex_3')),
      enabled: on('complex_3'),
    },
    /**
     * Complex IV, the terminal step, and the only reaction in the game that
     * disposes of reducing power outside the carbon.
     *
     *     O2 + 4 e- + 4 H+  ->  2 H2O
     *
     * Per pair: half an oxygen, one water, two protons pumped and two consumed
     * from the matrix to make the water. Both raise the gradient and only the
     * first is pumping.
     *
     * OXYGEN IS NOT A SUBSTRATE HERE AND THAT IS THE ORDERING DECISION MADE
     * VISIBLE. It is `environment.oxygenLevel`, a level rather than a pool, held
     * at `ACT3_OXYGEN_SATURATION` so this reaction's oxygen term is 0.9901 and
     * effectively 1. docs/ECONOMY.md row C25 carries the placeholder and the
     * constraint it puts on act 2, and docs/SCIENCE.md Part 4 records that a
     * real cytochrome c oxidase in an oxygenated world genuinely is saturated.
     *
     * **Water is here because redox has to go somewhere.** Act 1 never needed
     * it: both fermentation branches hand the electrons back to carbon. If this
     * reaction had no product carrying the pair, the conservation test would
     * fail on the tick this fires, on the reaction most worth testing.
     */
    {
      id: 'complex_4',
      substrates: [
        { poolIndex: at('cytc_red_ims'), coefficient: 1 },
        // Two, pumped. The two consumed making the water are that water's own
        // hydrogen and are implicit, per the note on `proton` in pools.ts.
        { poolIndex: at('proton_matrix'), coefficient: 2 },
      ],
      products: [
        { poolIndex: at('cytc_ox_ims'), coefficient: 1 },
        { poolIndex: at('water'), coefficient: 1 },
        { poolIndex: at('proton_ims'), coefficient: 2 },
      ],
      kinetics: michaelisMenten(v('complex_4'), k('complex_4')),
      enabled: on('complex_4'),
    },

    /* -------------------------------------------------------------------
       SPENDING THE GRADIENT
       ------------------------------------------------------------------- */
    /**
     * Basal proton leak. Enabled from the first tick and never purchasable.
     *
     * docs/SCIENCE.md Part 4, "Where the range comes from": the inner membrane
     * is not perfectly proton tight, some protons return without turning the
     * rotor, and **basal proton leak is a substantial fraction of resting
     * respiration**. It is one of the five reasons a real cell never reaches the
     * theoretical yield.
     *
     * IT IS HERE BECAUSE THE MODEL COULD NOT RUN WITHOUT IT, WHICH IS THE BEST
     * KIND OF REASON. Stage 5 measured that a chain with no synthase pumps until
     * `proton_matrix` reaches exactly 0 and then stops dead, taking the whole
     * cell with it: gross ATP fell from a baseline of 25.38 per game-second to
     * 0.36, with every proton in the cell outside the matrix and the cytosol
     * walled on NAD+.
     *
     * **A real gradient cannot do that**, because the proton-motive force builds
     * a back-pressure that slows the pumps rather than a finite count that runs
     * out. This model has a finite count, so it needs a return path, and the
     * return path a real membrane has is a leak. The gradient now settles where
     * pumping and leaking balance, which is what a resting mitochondrion
     * actually does.
     *
     * IT IS NOT A CONVENIENCE AND IT COSTS THE PLAYER SOMETHING. Every proton
     * that leaks is a proton the synthase did not spend, so the leak is a
     * permanent tax on yield, exactly as it is in a real cell.
     */
    {
      id: 'proton_leak',
      substrates: [{ poolIndex: at('proton_ims'), coefficient: 1 }],
      products: [{ poolIndex: at('proton_matrix'), coefficient: 1 }],
      kinetics: michaelisMenten(v('proton_leak'), k('proton_leak')),
      enabled: on('proton_leak'),
    },
    /**
     * ATP synthase. Three protons per ATP made in the matrix.
     *
     * docs/SCIENCE.md Part 4: one revolution turns three catalytic sites and
     * costs as many protons as the rotor has c subunits, which is 8 in mammals,
     * so the real figure is about 2.7. **Three rather than 2.7 because the
     * kernel takes integer coefficients**, and the rounding is a departure with
     * a docs/ECONOMY.md row rather than a silent tidy-up.
     *
     * HILL RATHER THAN MICHAELIS-MENTEN, and it is the act's teaching beat in a
     * kinetic form. A hyperbolic synthase starts turning at any gradient at all,
     * so ATP would trickle from the first proton and there would never be a
     * moment where the pile is visibly building and nothing is coming out. A
     * real proton-motive force also has to exceed the phosphorylation potential
     * before the rotor turns, so the switch-like shape is not a fabrication.
     * The exponent is ours. See `ACT3_SYNTHASE_HILL_N`.
     */
    {
      id: 'atp_synthase',
      substrates: [
        { poolIndex: at('proton_ims'), coefficient: 3 },
        { poolIndex: at('adp_matrix'), coefficient: 1 },
        { poolIndex: at('pi_matrix'), coefficient: 1 },
      ],
      products: [
        { poolIndex: at('proton_matrix'), coefficient: 3 },
        { poolIndex: at('atp_matrix'), coefficient: 1 },
      ],
      kinetics: hill(v('atp_synthase'), k('atp_synthase'), ACT3_SYNTHASE_HILL_N),
      enabled: on('atp_synthase'),
    },
    /**
     * The adenine nucleotide translocase AND the phosphate carrier, as one
     * exchange. **The ATP the cell can spend is not the ATP the synthase made,
     * and the difference is one more proton.**
     *
     *     ATP(matrix) + ADP + Pi + H+(out)
     *       ->  ADP(matrix) + Pi(matrix) + ATP + H+(in)
     *
     * docs/SCIENCE.md Part 4 describes two transporters. The translocase
     * exchanges matrix ATP for cytosolic ADP one for one, moving a net negative
     * charge outward. The phosphate carrier imports inorganic phosphate in
     * symport with a proton. **Their combined cost is the "about one further
     * proton equivalent per ATP delivered to the cytosol" that the sourced
     * figure of roughly four protons per ATP is built from**, so modelling them
     * as one exchange charging one proton reproduces that figure exactly rather
     * than approximating it.
     *
     * AND MODELLING THEM SEPARATELY DOES NOT WORK, which stage 5 measured twice
     * rather than reasoned about. A standalone phosphate carrier is
     * one-directional and has no reason to stop: it pumped the entire cytosolic
     * phosphate pool into the matrix, `payoff` lost the phosphate it needs, and
     * glycolysis stopped at 0.05 gross ATP per game-second against a baseline of
     * 25.38. **A carrier that only moves phosphate when it moves ATP cannot do
     * that**, because the thing it is coupled to is the thing that needs it.
     *
     * The exchange also balances phosphate exactly. Three plus two plus one goes
     * in and two plus one plus three comes out.
     */
    {
      id: 'ant',
      substrates: [
        { poolIndex: at('atp_matrix'), coefficient: 1 },
        { poolIndex: at('adp'), coefficient: 1 },
        { poolIndex: at('pi'), coefficient: 1 },
        { poolIndex: at('proton_ims'), coefficient: 1 },
      ],
      products: [
        { poolIndex: at('adp_matrix'), coefficient: 1 },
        { poolIndex: at('pi_matrix'), coefficient: 1 },
        { poolIndex: at('atp'), coefficient: 1 },
        { poolIndex: at('proton_matrix'), coefficient: 1 },
      ],
      kinetics: michaelisMenten(v('ant'), k('ant')),
      enabled: on('ant'),
    },

    /**
     * Maintenance. Act 1's `maintain`, at act 1's Hill order 3 and for act 1's
     * reason: it is the ATP bootstrap repair rather than a claim about anything.
     * See docs/ECONOMY.md C5 and C14.
     */
    {
      id: 'maintain',
      substrates: [{ poolIndex: at('atp'), coefficient: 1 }],
      products: [
        { poolIndex: at('adp'), coefficient: 1 },
        { poolIndex: at('pi'), coefficient: 1 },
      ],
      kinetics: hill(v('maintain'), k('maintain'), ACT3_MAINTAIN_HILL_N),
      enabled: on('maintain'),
    },
  ];

  return createSimulation(pools, reactions, createPrng(options.seed ?? 20260820));
}
