/**
 * Act 3 pools. UPDATELOGV14.md stage 4.
 *
 * Twenty-seven pools across four places. Act 1 had thirteen in one.
 *
 * ---------------------------------------------------------------------------
 * THE LOCATION CONVENTION, WHICH IS THE WHOLE OF WHAT A COMPARTMENT IS HERE
 * ---------------------------------------------------------------------------
 *
 * docs/SAVE_SCHEMA.md Part 3, "The location convention for pool ids", set by
 * stage 1 and confirmed by stage 2's decision that a compartment is nothing to
 * the kernel:
 *
 *     (none)     the cytosol
 *     _env       the environment, outside the cell
 *     _matrix    the mitochondrial matrix
 *     _ims       the intermembrane space
 *     _membrane  in the inner membrane itself
 *
 * `src/sim/pools.ts` is still a flat Float64Array and `tick.ts` still iterates
 * by index. **A compartment is a suffix, a grouping and transport reactions.**
 *
 * TWO IDS DIFFERING ONLY BY SUFFIX ARE ONE SUBSTANCE and must carry identical
 * conserved weights. `nad` and `nad_matrix` are the same molecule in two rooms.
 * `compartmentIds.test.ts` fails the build if any pair disagrees, which stage 2
 * built after measuring that the conservation test cannot be relied on to catch
 * it: the error cancels through the pathway and vanishes at exhaustion.
 *
 * ---------------------------------------------------------------------------
 * THREE THINGS THAT ARE DELIBERATELY NOT COMPARTMENTED
 * ---------------------------------------------------------------------------
 *
 * CARBON DIOXIDE. `co2` has no suffix and serves the matrix reactions that
 * produce it as well as act 1's ethanol branch. It crosses membranes by simple
 * diffusion, so this is one of the few places where the honest model and the
 * cheap model agree. docs/SCIENCE.md Part 4.
 *
 * WATER. `water` has no suffix for the same reason and exists for one reason
 * only, which is a conservation law rather than content. Act 1 never disposed of
 * reducing power outside the model: both fermentation branches hand the
 * electrons back to carbon. **Act 3's terminal step hands them to oxygen, and if
 * oxygen and water are both outside the model then redox is destroyed on that
 * tick** and the conservation test fails on the reaction most worth testing.
 * Water carries one redox pair and closes the loop.
 *
 * OXYGEN, which is absent, and that is the decision stage 1 left open. It is
 * `environment.oxygenLevel` in the save, a level set by act 2's schedule rather
 * than a quantity one cell draws down. A pool would be a second representation
 * of one fact and would make the atmosphere finite. See `ACT3_OXYGEN_SATURATION`
 * in tuning.ts and docs/ECONOMY.md row C25.
 *
 * ---------------------------------------------------------------------------
 * THE REDOX ZERO POINT IS THE FULLY OXIDISED STATE
 * ---------------------------------------------------------------------------
 *
 * A weight counts electron pairs a pool holds above carbon dioxide. Act 1's
 * weights moved to this scale on 2026-08-20 rather than act 3 inventing its own,
 * because a pool id is permanent contract surface and two acts sharing `glucose`
 * share what a glucose is. See src/content/act1/pools.ts and docs/SCIENCE.md
 * Part 1.
 *
 *     glucose 12   g3p 6   pyruvate 5   acetyl-CoA 4   co2 0
 *     every carrier holds 1 per pair. water holds 1
 *
 * Acetyl-CoA at 4 is the TCA cycle's whole output read off a weight: three NADH
 * and one FADH2 per turn.
 *
 * ---------------------------------------------------------------------------
 * FOUR NEW CONSERVED QUANTITIES, AND EACH ONE IS A CARRIER THAT CYCLES
 * ---------------------------------------------------------------------------
 *
 *     proton      the gradient. proton_matrix plus proton_ims plus the two
 *                 held in each water is fixed, and that is what makes building
 *                 it before spending it real rather than decorative.
 *
 *                 IT COUNTS FREE PROTONS AND NOT HYDROGEN ATOMS, which is a
 *                 decision the property test forced rather than a preference.
 *                 NADH, FADH2 and ubiquinol all carry hydrogen as part of their
 *                 chemistry, and counting that hydrogen here would mean tracking
 *                 a cytosolic proton pool that has nothing to do with the
 *                 gradient, for a distinction the player cannot see. So a
 *                 carrier's own hydrogen is implicit, exactly as
 *                 docs/SCIENCE.md Part 1 says water and protons mostly are, and
 *                 what this quantity tracks is **what crosses the membrane**.
 *
 *                 The arithmetic that falls out is Part 4's own headline: ten
 *                 protons reach the intermembrane space per NADH and six per
 *                 FADH2.
 *     coa         acetyl-CoA plus free coenzyme A
 *     flavin      FAD plus FADH2
 *     quinone     ubiquinone plus ubiquinol
 *     cytochrome  oxidised plus reduced cytochrome c
 *
 * Same discipline as act 1's `nicotinamide` and `adenylate`: a carrier pool that
 * is small and fixed is what turns a bottleneck into a testable property.
 *
 * CYTOCHROME C IS COUNTED IN PAIRS AND THAT IS A DEPARTURE. The real carrier
 * takes one electron, which is why complex III needs the Q cycle at all, and
 * docs/SCIENCE.md Part 4 says so. One unit of `cytc_red_ims` here is two
 * molecules, so the weights stay integers. docs/ECONOMY.md carries the row.
 */

import type { PoolDefinition } from '../../sim/pools';
import {
  ACT3_ADP_INITIAL,
  ACT3_ADP_MATRIX_INITIAL,
  ACT3_ATP_INITIAL,
  ACT3_ATP_MATRIX_INITIAL,
  ACT3_COA_TOTAL,
  ACT3_CYTOCHROME_TOTAL,
  ACT3_FLAVIN_TOTAL,
  ACT3_GLUCOSE_ENV_INITIAL,
  ACT3_NICOTINAMIDE_MATRIX_TOTAL,
  ACT3_NICOTINAMIDE_TOTAL,
  ACT3_PI_INITIAL,
  ACT3_PI_MATRIX_INITIAL,
  ACT3_PROTON_IMS_INITIAL,
  ACT3_PROTON_TOTAL,
  ACT3_QUINONE_TOTAL,
} from './tuning';

export type Act3PoolId =
  // Cytosol, shared with act 1 and carrying act 1's ids unchanged.
  | 'glucose_env'
  | 'glucose'
  | 'g3p'
  | 'pyruvate'
  | 'lactate'
  | 'co2'
  | 'nad'
  | 'nadh'
  | 'atp'
  | 'adp'
  | 'pi'
  // Cytosol, new. The electron sink.
  | 'water'
  // Matrix.
  | 'pyruvate_matrix'
  | 'acetyl_coa_matrix'
  | 'coa_matrix'
  | 'nad_matrix'
  | 'nadh_matrix'
  | 'fad_matrix'
  | 'fadh2_matrix'
  | 'atp_matrix'
  | 'adp_matrix'
  | 'pi_matrix'
  | 'proton_matrix'
  // The inner membrane.
  | 'q_membrane'
  | 'qh2_membrane'
  // The intermembrane space.
  | 'cytc_ox_ims'
  | 'cytc_red_ims'
  | 'proton_ims';

/**
 * Definition order. The kernel indexes in this order and sorts conserved ids
 * separately, so this order is layout and not meaning. Grouped by place, because
 * a person reading it is looking for a room.
 */
export const ACT3_POOL_IDS: readonly Act3PoolId[] = [
  'glucose_env',
  'glucose',
  'g3p',
  'pyruvate',
  'lactate',
  'co2',
  'water',
  'nad',
  'nadh',
  'atp',
  'adp',
  'pi',
  'pyruvate_matrix',
  'acetyl_coa_matrix',
  'coa_matrix',
  'nad_matrix',
  'nadh_matrix',
  'fad_matrix',
  'fadh2_matrix',
  'atp_matrix',
  'adp_matrix',
  'pi_matrix',
  'proton_matrix',
  'q_membrane',
  'qh2_membrane',
  'cytc_ox_ims',
  'cytc_red_ims',
  'proton_ims',
];

export type Act3ConservedId =
  | 'adenylate'
  | 'carbon'
  | 'coa'
  | 'cytochrome'
  | 'flavin'
  | 'nicotinamide'
  | 'phosphate'
  | 'proton'
  | 'quinone'
  | 'redox';

/** Sorted, as the kernel sorts them. Nine in act 1 terms plus five new. */
export const ACT3_CONSERVED_IDS: readonly Act3ConservedId[] = [
  'adenylate',
  'carbon',
  'coa',
  'cytochrome',
  'flavin',
  'nicotinamide',
  'phosphate',
  'proton',
  'quinone',
  'redox',
];

const LABELS: Readonly<Record<Act3PoolId, string>> = {
  glucose_env: 'Glucose (environment)',
  glucose: 'Glucose',
  g3p: 'Glyceraldehyde-3-phosphate',
  pyruvate: 'Pyruvate',
  lactate: 'Lactate',
  co2: 'Carbon dioxide',
  water: 'Water',
  nad: 'NAD+',
  nadh: 'NADH',
  atp: 'ATP',
  adp: 'ADP',
  pi: 'Phosphate',
  pyruvate_matrix: 'Pyruvate (matrix)',
  acetyl_coa_matrix: 'Acetyl-CoA',
  coa_matrix: 'Coenzyme A',
  nad_matrix: 'NAD+ (matrix)',
  nadh_matrix: 'NADH (matrix)',
  fad_matrix: 'FAD',
  fadh2_matrix: 'FADH2',
  atp_matrix: 'ATP (matrix)',
  adp_matrix: 'ADP (matrix)',
  pi_matrix: 'Phosphate (matrix)',
  proton_matrix: 'Protons (matrix)',
  q_membrane: 'Ubiquinone',
  qh2_membrane: 'Ubiquinol',
  cytc_ox_ims: 'Cytochrome c (oxidised)',
  cytc_red_ims: 'Cytochrome c (reduced)',
  proton_ims: 'Protons (intermembrane space)',
};

/**
 * Every weight, and the ten reactions in reactions.ts balance all ten quantities
 * against this table. `conservation.test.ts` asserts that as a property over the
 * reaction list rather than as hand-written cases.
 *
 * THE FIVE SHARED IDS CARRY ACT 1'S WEIGHTS EXACTLY, and a test asserts it
 * rather than a comment claiming it. `glucose`, `g3p`, `pyruvate`, `co2` and the
 * three adenylates are the same molecules act 1 has.
 */
const CONSERVED: Readonly<Record<Act3PoolId, Readonly<Record<string, number>>>> = {
  glucose_env: { carbon: 6, redox: 12 },
  glucose: { carbon: 6, redox: 12 },
  g3p: { carbon: 3, phosphate: 1, redox: 6 },
  pyruvate: { carbon: 3, redox: 5 },
  /*
   * ACT 1'S LACTATE, AT ACT 1'S WEIGHTS, AND ACT 3 KEEPS IT.
   *
   * Stage 5 measured that act 3 could not start without it. A eukaryote that has
   * just acquired a mitochondrion does not stop being able to ferment, and the
   * cell arrives at this act holding everything act 1 taught it.
   */
  lactate: { carbon: 3, redox: 6 },
  co2: { carbon: 1 },
  /*
   * One redox pair, and NO PROTON WEIGHT, which was measured rather than
   * reasoned about and is the second half of the `proton` decision above.
   *
   * The pair is what oxygen took off the chain and it has to be counted, or the
   * terminal reaction destroys reducing power. The two hydrogens the water is
   * made of are the carriers' case again and are implicit for the same reason.
   *
   * **Counting them here drains the gradient.** Water is a dead end: nothing
   * consumes it, so every proton written into it is removed from circulation
   * permanently. Measured at proton 2, the cell pumped until `proton_matrix`
   * reached zero and the whole chain stalled against its own product, with 330
   * protons outside and 70 locked in water out of a total of 400. The gradient
   * is a difference across a fixed total and a sink inside that total is a slow
   * leak with a plausible-looking cause.
   */
  water: { redox: 1 },
  nad: { nicotinamide: 1 },
  nadh: { nicotinamide: 1, redox: 1 },
  atp: { phosphate: 3, adenylate: 1 },
  adp: { phosphate: 2, adenylate: 1 },
  pi: { phosphate: 1 },

  pyruvate_matrix: { carbon: 3, redox: 5 },
  // Two carbons and four pairs: three NADH and one FADH2 per turn of the cycle.
  acetyl_coa_matrix: { carbon: 2, coa: 1, redox: 4 },
  coa_matrix: { coa: 1 },
  nad_matrix: { nicotinamide: 1 },
  nadh_matrix: { nicotinamide: 1, redox: 1 },
  fad_matrix: { flavin: 1 },
  fadh2_matrix: { flavin: 1, redox: 1 },
  atp_matrix: { phosphate: 3, adenylate: 1 },
  adp_matrix: { phosphate: 2, adenylate: 1 },
  pi_matrix: { phosphate: 1 },
  proton_matrix: { proton: 1 },

  q_membrane: { quinone: 1 },
  qh2_membrane: { quinone: 1, redox: 1 },
  cytc_ox_ims: { cytochrome: 1 },
  cytc_red_ims: { cytochrome: 1, redox: 1 },
  proton_ims: { proton: 1 },
};

/**
 * Starting amounts for every pool, assembled from the constants above.
 *
 * NOT A TUNING TABLE, AND IT LIVES HERE FOR THAT REASON. Every non-zero value is
 * one of the constants in tuning.ts, so none of them is independently movable and
 * none of them owes a docs/ECONOMY.md row of its own. It sat in tuning.ts first
 * and `divergenceTable.test.ts` would have demanded twenty-seven rows for
 * twenty-seven values that are copies. Act 1 keeps `ACT1_INITIAL` here for the
 * same reason.
 *
 * THE GRADIENT STARTS AT REST AND THAT IS THE ACT'S OPENING STATEMENT. Twenty of
 * four hundred protons are outside, which is enough to import substrate and far
 * short of what the synthase needs. The cell begins able to feed its compartment
 * and unable to get anything out of it, and everything the player buys moves that
 * one number. See `ACT3_PROTON_IMS_INITIAL`.
 */
export const ACT3_INITIAL: Readonly<Record<Act3PoolId, number>> = {
  glucose_env: ACT3_GLUCOSE_ENV_INITIAL,
  glucose: 0,
  g3p: 0,
  pyruvate: 0,
  lactate: 0,
  co2: 0,
  water: 0,
  nad: ACT3_NICOTINAMIDE_TOTAL,
  nadh: 0,
  atp: ACT3_ATP_INITIAL,
  adp: ACT3_ADP_INITIAL,
  pi: ACT3_PI_INITIAL,
  pyruvate_matrix: 0,
  acetyl_coa_matrix: 0,
  coa_matrix: ACT3_COA_TOTAL,
  nad_matrix: ACT3_NICOTINAMIDE_MATRIX_TOTAL,
  nadh_matrix: 0,
  fad_matrix: ACT3_FLAVIN_TOTAL,
  fadh2_matrix: 0,
  atp_matrix: ACT3_ATP_MATRIX_INITIAL,
  adp_matrix: ACT3_ADP_MATRIX_INITIAL,
  pi_matrix: ACT3_PI_MATRIX_INITIAL,
  proton_matrix: ACT3_PROTON_TOTAL - ACT3_PROTON_IMS_INITIAL,
  q_membrane: ACT3_QUINONE_TOTAL,
  qh2_membrane: 0,
  cytc_ox_ims: ACT3_CYTOCHROME_TOTAL,
  cytc_red_ims: 0,
  proton_ims: ACT3_PROTON_IMS_INITIAL,
};

export function act3PoolDefinitions(
  overrides: Readonly<Partial<Record<Act3PoolId, number>>> = {},
): readonly PoolDefinition[] {
  return ACT3_POOL_IDS.map((id) => ({
    id,
    label: LABELS[id],
    initial: overrides[id] ?? ACT3_INITIAL[id],
    conserved: CONSERVED[id],
  }));
}

/** For the tests that check act 3 against act 1 on the ids they share. */
export const ACT3_CONSERVED_WEIGHTS = CONSERVED;
