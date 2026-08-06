/**
 * Act 1 pools. The first content in this repository that is not synthetic.
 *
 * Twelve pools covering glucose uptake, both phases of glycolysis, the two
 * fermentation branches and what each of them leaves behind, the nicotinamide
 * carrier pair, the adenylate pair and free phosphate. Every conserved weight
 * below traces to docs/SCIENCE.md Part 2. UPDATELOGV2.md settles the balance
 * sheet the first ten are transcribed from and UPDATELOGV10.md stage 2 adds the
 * ethanol branch's two products.
 *
 * ---------------------------------------------------------------------------
 * THE REDOX COUNTING CONVENTION
 * ---------------------------------------------------------------------------
 *
 * `redox` counts electron pairs relative to the fully fermented state. Glucose
 * carries 2 and lactate carries 1, so glucose to 2 lactate is redox neutral,
 * and glucose to 2 pyruvate plus 2 NADH balances. NADH carries 1 and NAD+
 * carries 0, which is what makes the carrier pair the visible cost of running
 * the payoff phase.
 *
 * This is a modeling convention, not a chemical property. Oxidation state is a
 * property of individual atoms and there is no scalar "redox content" of a
 * molecule; real electron bookkeeping is done per reaction, in named carriers.
 * The zero point is set at the fully fermented state because it makes act 1's
 * weights small integers, not because that state is physically privileged.
 *
 * Disclosed in docs/SCIENCE.md Part 1, "Redox is counted as electron pairs
 * relative to the fully fermented state". Read that entry before adding a pool.
 * A weight guessed here rather than derived from that convention will not fail
 * loudly. It will fail as a conservation test that passes while the economy is
 * quietly wrong.
 *
 * ---------------------------------------------------------------------------
 * FIVE CONSERVED QUANTITIES, AND A NAMING PROBLEM STAGE 6 OWNS
 * ---------------------------------------------------------------------------
 *
 * docs/SIMULATION.md line 90 names three: "Carbon, phosphate and redox
 * equivalents are conserved quantities." Under the decomposition below,
 * `nicotinamide` (NAD+ plus NADH) and `adenylate` (ATP plus ADP) are conserved
 * too, and they are the more useful invariants of the two, because they are
 * what turn the NAD+ wall into a testable property rather than a felt one.
 *
 * docs/SIMULATION.md is deliberately NOT edited here. Recorded for V2 stage 6
 * to decide whether Part 2's wording needs updating.
 */

import type { PoolDefinition } from '../../sim/pools';
import {
  ACT1_ADP_INITIAL,
  ACT1_ATP_INITIAL,
  ACT1_GLUCOSE_ENV_INITIAL,
  ACT1_NICOTINAMIDE_TOTAL,
  ACT1_PI_INITIAL,
} from './tuning';

export type Act1PoolId =
  | 'glucose_env'
  | 'glucose'
  | 'g3p'
  | 'pyruvate'
  | 'lactate'
  | 'ethanol'
  | 'co2'
  | 'nad'
  | 'nadh'
  | 'atp'
  | 'adp'
  | 'pi';

/**
 * Permanent. docs/SAVE_SCHEMA.md: "Ids are permanent". Chosen once, chosen
 * plainly, and a rename after V4 ships costs a migration.
 *
 * Definition order. The kernel indexes pools in this order and sorts conserved
 * quantity names independently, so this order is a readability choice rather
 * than a load-bearing one. It runs the pathway forward: environment, uptake,
 * glycolysis, the end product, then the two carrier pairs and free phosphate.
 */
export const ACT1_POOL_IDS: readonly Act1PoolId[] = [
  'glucose_env',
  'glucose',
  'g3p',
  'pyruvate',
  'lactate',
  'ethanol',
  'co2',
  'nad',
  'nadh',
  'atp',
  'adp',
  'pi',
];

export type Act1ConservedId = 'adenylate' | 'carbon' | 'nicotinamide' | 'phosphate' | 'redox';

/** Sorted, matching what PoolRegistry produces. The test asserts they agree. */
export const ACT1_CONSERVED_IDS: readonly Act1ConservedId[] = [
  'adenylate',
  'carbon',
  'nicotinamide',
  'phosphate',
  'redox',
];

/**
 * Display names. Not player-facing prose: docs/CONTENT_STYLE.md does not exist
 * yet and inventing a voice before it does would mean rewriting all of this
 * when it lands. Molecule name only, and nothing that reads as a description.
 */
const LABELS: Readonly<Record<Act1PoolId, string>> = {
  glucose_env: 'Glucose (environment)',
  glucose: 'Glucose',
  g3p: 'Glyceraldehyde 3-phosphate',
  pyruvate: 'Pyruvate',
  lactate: 'Lactate',
  ethanol: 'Ethanol',
  co2: 'Carbon dioxide',
  nad: 'NAD+',
  nadh: 'NADH',
  atp: 'ATP',
  adp: 'ADP',
  pi: 'Phosphate',
};

/**
 * Conserved weights. docs/SCIENCE.md Part 2 for the molecules, the convention
 * above for redox.
 *
 * Carbon is carried at 6 and 3 only, because act 1 never cleaves below a
 * triose. Phosphate distinguishes ATP at 3 from ADP at 2 from free phosphate
 * at 1, which is what makes `maintain` balance rather than being a sink.
 *
 * g3p carries phosphate 1 rather than 2. It is the triose the preparatory
 * phase hands to the payoff phase, and the second phosphate the payoff phase
 * needs comes from the `pi` pool at the sourced GAPDH step, not from the
 * carbon skeleton it arrives on.
 *
 * ---------------------------------------------------------------------------
 * THE TWO ETHANOL-BRANCH PRODUCTS, AND THE FIRST CARBON WEIGHTS BELOW THREE
 * ---------------------------------------------------------------------------
 *
 * Added by UPDATELOGV10.md stage 2. docs/SCIENCE.md Part 2, "Ethanol
 * fermentation": pyruvate decarboxylase removes one carbon as carbon dioxide to
 * give acetaldehyde, and alcohol dehydrogenase reduces that to ethanol while
 * reoxidising NADH.
 *
 *   ethanol   carbon 2, redox 1     two of pyruvate's three carbons, carrying
 *                                   the electron pair taken off NADH
 *   co2       carbon 1, redox 0     the third carbon. Fully oxidised, so it
 *                                   carries no reducing power at all
 *
 * The redox weights are not free choices. Under the convention above, the
 * branch has to balance: pyruvate at 0 plus NADH at 1 must equal ethanol plus
 * co2 plus NAD+ at 0. Carbon dioxide is the most oxidised form carbon takes and
 * is the natural zero, which leaves ethanol at 1 and no other pair works.
 *
 * CARBON DIOXIDE IS A RESERVOIR AND NOT A SINK, which was established in stage 1
 * rather than assumed here. Act 3 produces far more of it at pyruvate
 * dehydrogenase and around the TCA cycle, and act 4's pyruvate carboxylase
 * consumes it, so a later act reads this pool. It must not be capped, discarded,
 * or treated as write-only accounting. docs/SCIENCE.md Part 2, "Carbon dioxide,
 * and whether anything in this game consumes it".
 */
const CONSERVED: Readonly<Record<Act1PoolId, Readonly<Record<string, number>>>> = {
  glucose_env: { carbon: 6, redox: 2 },
  glucose: { carbon: 6, redox: 2 },
  g3p: { carbon: 3, phosphate: 1, redox: 1 },
  pyruvate: { carbon: 3 },
  lactate: { carbon: 3, redox: 1 },
  ethanol: { carbon: 2, redox: 1 },
  co2: { carbon: 1 },
  nad: { nicotinamide: 1 },
  nadh: { nicotinamide: 1, redox: 1 },
  atp: { phosphate: 3, adenylate: 1 },
  adp: { phosphate: 2, adenylate: 1 },
  pi: { phosphate: 1 },
};

/**
 * Starting amounts. NOT A TUNING FILE, and as of UPDATELOGV5.md stage 5 there
 * is no longer a tuned number written down here.
 *
 * Every non-zero value below is imported from tuning.ts. UPDATELOGV2.md wrote
 * three of them, atp, adp and pi, as literals in this file while its own header
 * said they owed a row in the divergence table, and they then sat outside the
 * three tuning files for three logs while every count of the debt omitted them.
 * `docs/ECONOMY.md` has a row for each now and a test asserts the rule that put
 * them there: a tuned number lives in exactly one of the three tuning files.
 *
 * The zeros are structural rather than tuned. A pathway with no intermediates in
 * it at t=0 is a cell that has not run yet, and that is not a balance decision.
 *
 * Two of the imports carry the act rather than merely starting it:
 *
 *   nad + nadh   the nicotinamide total, and the entire act 1 mechanic.
 *                docs/SCIENCE.md Part 2, "The NAD+ constraint", sources that the
 *                pool is small and fixed. It does not source how small, so the
 *                number is ours. All of it starts as NAD+, so the wall is
 *                approached rather than started at.
 *
 *   atp + adp    the adenylate total. Fixed and closed, because ATP is a flux
 *                and not a score. `maintain` hydrolyses ATP back to ADP and Pi,
 *                which is what a cell does with it. Cumulative ATP produced is
 *                a counter, not a pool, so it cannot leak into conservation.
 */
export const ACT1_INITIAL: Readonly<Record<Act1PoolId, number>> = {
  glucose_env: ACT1_GLUCOSE_ENV_INITIAL,
  glucose: 0,
  g3p: 0,
  pyruvate: 0,
  lactate: 0,
  ethanol: 0,
  co2: 0,
  nad: ACT1_NICOTINAMIDE_TOTAL,
  nadh: 0,
  atp: ACT1_ATP_INITIAL,
  adp: ACT1_ADP_INITIAL,
  pi: ACT1_PI_INITIAL,
};

/**
 * The twelve pool definitions, in ACT1_POOL_IDS order.
 *
 * `initial` overrides let a test or a harness scenario start from anywhere
 * without a second definition table. The conservation property test in stage 5
 * randomizes through this door.
 */
export function act1PoolDefinitions(
  initial: Readonly<Partial<Record<Act1PoolId, number>>> = {},
): readonly PoolDefinition[] {
  return ACT1_POOL_IDS.map((id) => ({
    id,
    label: LABELS[id],
    initial: initial[id] ?? ACT1_INITIAL[id],
    conserved: CONSERVED[id],
  }));
}
