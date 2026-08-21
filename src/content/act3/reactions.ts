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
  | 'pyruvate_transport'
  | 'pdh'
  | 'tca'
  | 'complex_1'
  | 'complex_2'
  | 'complex_3'
  | 'complex_4'
  | 'atp_synthase'
  | 'ant'
  | 'pi_transport'
  | 'shuttle_malate_aspartate'
  | 'shuttle_glycerol_phosphate'
  | 'maintain';

export const ACT3_REACTION_IDS: readonly Act3ReactionId[] = [
  'uptake',
  'prep',
  'payoff',
  'pyruvate_transport',
  'pdh',
  'tca',
  'complex_1',
  'complex_2',
  'complex_3',
  'complex_4',
  'atp_synthase',
  'ant',
  'pi_transport',
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
  pyruvate_transport: false,
  pdh: false,
  tca: false,
  complex_1: false,
  complex_2: false,
  complex_3: false,
  complex_4: false,
  atp_synthase: false,
  ant: false,
  pi_transport: false,
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

       FERMENTATION IS ABSENT AND IT IS A DECISION RATHER THAN AN OMISSION. Act
       1's two branches exist to regenerate NAD+ and nothing else. In act 3 the
       shuttles do that job, by handing the cytosolic pair to the matrix or to
       the quinone pool, which is what a cell with a working chain actually
       does. A eukaryote ferments when oxygen runs out, and act 3's premise is
       that it does not. Reintroducing lactate under hypoxia is act 4's kind of
       problem.
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

    /* -------------------------------------------------------------------
       INTO THE COMPARTMENT

       THE FIRST CROSSING IN THE GAME, AND IT COSTS GRADIENT.

       docs/SCIENCE.md Part 4: the mitochondrial pyruvate carrier imports
       pyruvate in symport with a proton, driven by the pH difference across the
       inner membrane. So a proton comes back in with every pyruvate.

       That is not a tax invented to make the act harder. It is why the two
       halves of the act are coupled: the gradient the chain builds is spent by
       the synthase AND by getting the substrate in, so a cell that pumps
       nothing cannot feed itself either. Under DESIGN.md illustration rule 8
       this draws as one arrow crossing the boundary carrying two things in
       opposite senses, which is the whole fact as geometry.
       ------------------------------------------------------------------- */
    {
      id: 'pyruvate_transport',
      substrates: [
        { poolIndex: at('pyruvate'), coefficient: 1 },
        { poolIndex: at('proton_ims'), coefficient: 1 },
      ],
      products: [
        { poolIndex: at('pyruvate_matrix'), coefficient: 1 },
        { poolIndex: at('proton_matrix'), coefficient: 1 },
      ],
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
     * The adenine nucleotide translocase. **The ATP the cell can spend is not
     * the ATP the synthase made, and the difference is one more proton.**
     *
     * docs/SCIENCE.md Part 4: it exchanges matrix ATP for cytosolic ADP one for
     * one, moving a net negative charge outward, driven by the membrane
     * potential. That surcharge is where a large part of the published yield
     * spread comes from, and modelling it is what makes the game's ledger land
     * near 2.5 ATP per NADH rather than near 2.7.
     */
    {
      id: 'ant',
      substrates: [
        { poolIndex: at('atp_matrix'), coefficient: 1 },
        { poolIndex: at('adp'), coefficient: 1 },
        { poolIndex: at('proton_ims'), coefficient: 1 },
      ],
      products: [
        { poolIndex: at('adp_matrix'), coefficient: 1 },
        { poolIndex: at('atp'), coefficient: 1 },
        { poolIndex: at('proton_matrix'), coefficient: 1 },
      ],
      kinetics: michaelisMenten(v('ant'), k('ant')),
      enabled: on('ant'),
    },

    /**
     * The phosphate carrier, and it was missing until the cell measured out
     * stalled without it.
     *
     * THE TRANSLOCASE ABOVE IS A PHOSPHATE LEAK ON ITS OWN. It sends matrix ATP
     * out carrying three phosphates and brings cytosolic ADP back carrying two,
     * so every export strips one phosphate from the matrix and nothing returns
     * it. Measured with the whole chain and the synthase enabled, `pi_matrix`
     * drained to zero, the synthase stopped for want of substrate, and every
     * proton in the cell ended up outside: `proton_ims` 400.00 of a total of
     * 400.
     *
     * docs/SCIENCE.md Part 4 names the carrier and it was written into that Part
     * by stage 1. It was described and not built, which is a better failure than
     * the reverse and is still a failure.
     *
     * ELECTRONEUTRAL HERE, AND THE REAL CARRIER IS A PROTON SYMPORT. That is not
     * a simplification of convenience: the sourced figure of roughly four
     * protons per ATP delivered to the cytosol is about three for the rotor plus
     * **one for transport**, and that one already covers both this carrier and
     * the translocase. Charging a proton here as well would count the same
     * proton twice and would take act 3's yield from 31 to about 25, outside the
     * range docs/SCIENCE.md Part 4 gives. docs/ECONOMY.md carries the row.
     */
    {
      id: 'pi_transport',
      substrates: [{ poolIndex: at('pi'), coefficient: 1 }],
      products: [{ poolIndex: at('pi_matrix'), coefficient: 1 }],
      kinetics: michaelisMenten(v('pi_transport'), k('pi_transport')),
      enabled: on('pi_transport'),
    },

    /* -------------------------------------------------------------------
       THE TWO SHUTTLES

       THE REACTIONS ARE HERE AND THE CHOICE IS STAGE 5'S. They are part of the
       pathway rather than an addition to it: cytosolic NADH cannot cross the
       inner membrane, act 3 has no fermentation to reoxidise it, and without a
       shuttle the cell hits act 1's NAD+ wall with no answer. So the pathway is
       not closed until these exist and the yield cannot be computed without
       them. What stage 5 owns is the purchase, the switching and the text.

       docs/SCIENCE.md Part 4, "The two NADH shuttles". Both ship disabled and
       BOTH ARE OWNABLE, which is what docs/PROGRESSION.md act 3 item 6 settled
       on 2026-08-20: real cells run both in proportions that shift, and a cell
       that owns one forever is the departure.

       ONE NUMBER IS THE WHOLE DIFFERENCE AND IT IS THE ENTRY POINT. Malate-
       aspartate delivers the pair as matrix NADH, which enters at complex I and
       is worth ten protons. Glycerol phosphate hands it straight to the quinone
       pool, entering after complex I, and is worth six. Nothing else about them
       differs here.
       ------------------------------------------------------------------- */
    /**
     * Malate-aspartate. Four enzymes and two carriers in the cell, one reaction
     * here, ending with the pair as matrix NADH.
     *
     * Lumped for act 1's reason: the intermediates are regenerated and the
     * shuttle is a cycle. Oxaloacetate, malate, aspartate and glutamate all come
     * back to where they started, so a decomposed form would carry four pools
     * that sum to zero over a turn.
     */
    {
      id: 'shuttle_malate_aspartate',
      substrates: [
        { poolIndex: at('nadh'), coefficient: 1 },
        { poolIndex: at('nad_matrix'), coefficient: 1 },
      ],
      products: [
        { poolIndex: at('nad'), coefficient: 1 },
        { poolIndex: at('nadh_matrix'), coefficient: 1 },
      ],
      kinetics: michaelisMenten(v('shuttle_malate_aspartate'), k('shuttle_malate_aspartate')),
      enabled: on('shuttle_malate_aspartate'),
    },
    /**
     * Glycerol 3-phosphate. **Nothing crosses the inner membrane at all.**
     *
     * docs/SCIENCE.md Part 4: the mitochondrial isoform is an FAD enzyme
     * anchored in the inner membrane facing the intermembrane space, and it
     * passes the electrons directly into the quinone pool from outside. So this
     * reaction reduces ubiquinone from the cytosolic side and the pair never
     * enters the matrix as a carrier at all.
     *
     * That is why it is worth four protons less: it joins the chain after
     * complex I and misses its pump.
     */
    {
      id: 'shuttle_glycerol_phosphate',
      substrates: [
        { poolIndex: at('nadh'), coefficient: 1 },
        { poolIndex: at('q_membrane'), coefficient: 1 },
      ],
      products: [
        { poolIndex: at('nad'), coefficient: 1 },
        { poolIndex: at('qh2_membrane'), coefficient: 1 },
      ],
      kinetics: michaelisMenten(v('shuttle_glycerol_phosphate'), k('shuttle_glycerol_phosphate')),
      enabled: on('shuttle_glycerol_phosphate'),
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
