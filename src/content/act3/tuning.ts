/**
 * Act 3's tuned numbers. UPDATELOGV14.md stage 4.
 *
 * THE FOURTH TUNING FILE. docs/ECONOMY.md says a tuned number lives in exactly
 * one of the tuning files and nowhere else, and `divergenceTable.test.ts` counts
 * scalars in them and fails the build if any lacks a row. Every scalar below has
 * one.
 *
 * Two facts from docs/SCIENCE.md Part 1 apply to all of them and are not
 * repeated per constant. Literature Km and Vmax values are deliberately not
 * used, because they vary by an order of magnitude across organism, tissue, pH,
 * temperature and assay method. And game time does not map to any real
 * timescale, so no absolute rate here has a real counterpart. **What these
 * numbers claim is their ordering, not their magnitude.**
 *
 * ---------------------------------------------------------------------------
 * WHAT IS NOT TUNED, WHICH IS THE POINT OF THE ACT
 * ---------------------------------------------------------------------------
 *
 * Every stoichiometric coefficient in reactions.ts is sourced and none of it is
 * here. The proton counts at each complex, the protons per ATP, the carriers per
 * turn of the cycle and the yield that falls out of them are docs/SCIENCE.md
 * Part 4 figures. **Act 3's headline claim is a consequence of the reaction
 * table and not of this file**, which is exactly the split act 1 has between its
 * ledger and its rates.
 */


/**
 * THE PLACEHOLDER, AND IT IS NOT A FREE NUMBER. docs/ECONOMY.md row C25.
 *
 * Act 3 holds environmental oxygen at a level chosen so the terminal reaction's
 * saturation term is effectively 1. The rule stage 1 fixed: the saturation term
 * is `[S] / (Km + [S])`, requiring it within one percent of 1 gives
 * `[S] >= 99 * Km`, so the constant is 100 times complex IV's own Km and yields
 * 0.9901.
 *
 * IT STANDS IN FOR A SCHEDULE ACT 2 HAS NOT BUILT, and the constraint runs both
 * ways: act 2's oxygen schedule must reach at least this level by the act 2 to
 * act 3 boundary. **A target act 2 must hit, not a number act 2 may move.**
 * docs/SIMULATION.md Part 3, "Where the oxygen schedule has to end up".
 *
 * The physiology is on the constraint's side rather than merely tolerating it.
 * docs/SCIENCE.md Part 4 records that cytochrome c oxidase half-saturates in the
 * sub-micromolar range, so a real respiring cell in an oxygenated world really
 * is saturated in oxygen.
 */
export const ACT3_OXYGEN_SATURATION = 100 * 2;

/**
 * Maximum velocities, one per reaction. docs/ECONOMY.md C26 to C38.
 *
 * ---------------------------------------------------------------------------
 * SIZED FROM STOICHIOMETRIC DEMAND RATHER THAN PICKED, AND THE FIRST ATTEMPT
 * WAS PICKED AND FAILED
 * ---------------------------------------------------------------------------
 *
 * The first set of values in this file were chosen to look like act 1's, in the
 * range 24 to 44, and the cell measured out pinned at the cytosolic NAD+ wall:
 * `nad` 0.00 and `nadh` 30.00 after 4000 ticks in every configuration, with
 * 1565 glucose piled up inside it. **A cell that cannot reoxidise its carrier is
 * act 1's wall with no fermentation to answer it.**
 *
 * The reason is arithmetic and it is specific to this act. Glycolysis delivers
 * TWELVE reduced carriers per glucose to the chain, ten matrix NADH and two at
 * the quinone pool, where act 1 delivered two and handed them straight back to
 * pyruvate. **So a chain running at glycolysis's own rate is twelve times too
 * slow**, and every rate downstream of the payoff phase has to be scaled by what
 * it is asked to carry rather than by what looks reasonable beside it.
 *
 * Each value below is `uptake` times the number of times that reaction runs per
 * glucose, which makes the whole table one number and a stoichiometry:
 *
 *     uptake              1 per glucose
 *     prep                1
 *     payoff              2      one per triose
 *     pyruvate_transport  2      one per pyruvate
 *     pdh                 2
 *     tca                 2      one per acetyl-CoA
 *     shuttles            2      one per cytosolic pair
 *     complex_1          10      one per matrix NADH
 *     complex_2           2      one per FADH2
 *     complex_3          12      every pair passes through it
 *     complex_4          12      and through it
 *     atp_synthase       27      the ledger's own figure
 *     ant                31      every ATP the cytosol gets
 *
 * HEADROOM IS DELIBERATE AND IT IS WHY THESE ARE NOT EXACTLY THOSE MULTIPLES. A
 * reaction sized at exactly its demand is at Vmax whenever anything upstream is,
 * which makes it the bottleneck by construction. Act 1 does the same thing with
 * `payoff` at 26 against `prep` at 12, and docs/ECONOMY.md C3 says why.
 */
export const ACT3_VMAX = {
  uptake: 8,
  prep: 12,
  payoff: 26,
  pyruvate_transport: 24,
  pdh: 24,
  tca: 24,
  complex_1: 110,
  complex_2: 30,
  complex_3: 130,
  complex_4: 130,
  atp_synthase: 280,
  ant: 320,
  pi_transport: 320,
  shuttle_malate_aspartate: 30,
  shuttle_glycerol_phosphate: 30,
  maintain: 300,
} as const;

/** Half-saturation constants, one per reaction. docs/ECONOMY.md C37 to C47. */
export const ACT3_KM = {
  uptake: 500,
  prep: 4,
  payoff: 2,
  pyruvate_transport: 2,
  pdh: 2,
  tca: 2,
  complex_1: 2,
  complex_2: 2,
  complex_3: 2,
  complex_4: 2,
  atp_synthase: 60,
  ant: 2,
  pi_transport: 2,
  shuttle_malate_aspartate: 2,
  shuttle_glycerol_phosphate: 2,
  maintain: 12,
} as const;

/**
 * The Hill exponent on the preparatory phase, inherited from act 1's C11 for the
 * same reason and with the same disclosed attribution problem. docs/ECONOMY.md.
 */
export const ACT3_HILL_N = 2;

/**
 * Maintenance as Hill of order 3, which is act 1's C14 bootstrap repair.
 *
 * Act 3 needs it for the same reason act 1 does and for one more: `prep` is
 * order 2 in ATP, Michaelis-Menten consumption is order 1, and below some ATP
 * consumption beats production for every choice of constants. Act 3 also spends
 * ATP at the adenine nucleotide translocase and at nothing that can restart from
 * zero, so the same trap exists and is closed the same way.
 */
export const ACT3_MAINTAIN_HILL_N = 3;

/**
 * ATP synthase is cooperative in the gradient, and this is the one kinetic
 * choice in act 3 that is a design decision rather than an inheritance.
 *
 * A Michaelis-Menten synthase starts turning at any gradient at all, which
 * destroys the act's teaching beat: the player buys the chain, protons begin to
 * rise, and ATP begins to trickle immediately, so there is never a moment where
 * the pile is visibly building and nothing is coming out. A sigmoid gives the
 * gradient a threshold to cross.
 *
 * It is also not a fabrication. A real proton-motive force has to exceed the
 * phosphorylation potential before the rotor turns at all, so the response to
 * gradient really is switch-like rather than hyperbolic. The exponent is ours
 * and the shape is not. docs/ECONOMY.md.
 */
export const ACT3_SYNTHASE_HILL_N = 3;

/**
 * The fixed carrier totals. Each one is a small closed pool, which is what makes
 * its bottleneck a testable property rather than a remembered behaviour.
 *
 * `ACT3_PROTON_TOTAL` is the gradient's whole capacity. It is split between the
 * matrix and the intermembrane space and never changes, so a proton in one place
 * came from the other. docs/ECONOMY.md.
 */
export const ACT3_NICOTINAMIDE_TOTAL = 30;
export const ACT3_NICOTINAMIDE_MATRIX_TOTAL = 40;
export const ACT3_FLAVIN_TOTAL = 20;
export const ACT3_QUINONE_TOTAL = 30;
export const ACT3_CYTOCHROME_TOTAL = 30;
export const ACT3_COA_TOTAL = 20;
export const ACT3_PROTON_TOTAL = 400;

/**
 * How much of that total starts OUTSIDE the matrix. docs/ECONOMY.md.
 *
 * ACT 3 HAS A BOOTSTRAP TRAP AND THIS IS THE REPAIR. It is the same shape as
 * act 1's, which cost UPDATELOGV5.md a whole stage and is NOW.md's blocking item
 * 1. The pyruvate carrier imports in symport with a proton, so getting substrate
 * into the matrix costs a proton from outside. With every proton starting in the
 * matrix, nothing can cross in, so no NADH is made, so nothing pumps, so no
 * proton ever reaches the outside. **A cell that starts with a perfectly flat
 * gradient can never start one.**
 *
 * Measured rather than reasoned about: with this at 0 the cell reaches tick 2000
 * with `proton_ims` still exactly 0 and every matrix pool untouched.
 *
 * THE REPAIR IS ALSO THE TRUER STATEMENT, which is the second time that has
 * happened in this project. A newly acquired endosymbiont is a living
 * bacterium that has been maintaining its own membrane potential all along, so a
 * flat gradient was never the honest starting state. What the cell starts with
 * is a RESTING gradient: enough to feed itself, and far short of what the
 * synthase needs.
 *
 * The two constants are read together. At 20 against `ACT3_KM.atp_synthase` of
 * 60 with Hill order 3, the synthase's saturation term is 0.036, so the resting
 * cell makes essentially no ATP from its gradient. The chain has to raise it.
 */
export const ACT3_PROTON_IMS_INITIAL = 20;

/**
 * Starting adenylate, half and half as act 1 has it, and ten times as much.
 * docs/ECONOMY.md.
 *
 * ACT 3 HAS ACT 1'S BOOTSTRAP TRAP AT TEN TIMES THE DEPTH, and the pool size is
 * half the repair. Act 3 produces roughly 248 ATP per game-second at steady
 * state against act 1's 32, so its maintenance reaction is sized to match, and a
 * maintenance reaction that large against act 1's adenylate total of 40 empties
 * the cell in a fraction of a second before the pathway has spun up at all.
 *
 * Measured at 20 and 20: the cell reached tick 4000 with `atp` at 0.018 and 1586
 * glucose piled up inside it, which is NOW.md blocking item 1 exactly. **The
 * cell was not slow. It was in a hole it could climb out of at a rate of
 * 1e-4 ATP per second.**
 *
 * A bigger adenylate pool is also the truer statement, which is the third time
 * that has happened in this log. A eukaryote with a mitochondrion is a much
 * larger cell than an anaerobic prokaryote and it holds more of everything.
 * `ACT3_KM.maintain` is the other half of the repair: at 60 rather than act 1's
 * 12, maintenance backs off across a band the cell actually operates in instead
 * of running at full rate all the way down.
 */
export const ACT3_ATP_INITIAL = 200;
export const ACT3_ADP_INITIAL = 200;
export const ACT3_PI_INITIAL = 200;
export const ACT3_ATP_MATRIX_INITIAL = 50;
export const ACT3_ADP_MATRIX_INITIAL = 50;
export const ACT3_PI_MATRIX_INITIAL = 100;

/** The environment, as act 1's C13 sizes it and for the same pacing reason. */
export const ACT3_GLUCOSE_ENV_INITIAL = 80000;
