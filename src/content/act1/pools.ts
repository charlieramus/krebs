/**
 * Act 1 pools. The first content in this repository that is not synthetic.
 *
 * Ten pools covering glucose uptake, both phases of glycolysis, the
 * nicotinamide carrier pair, the adenylate pair and free phosphate. Every
 * conserved weight below traces to docs/SCIENCE.md Part 2. UPDATELOGV2.md
 * settles the balance sheet these are transcribed from.
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
import { ACT1_GLUCOSE_ENV_INITIAL, ACT1_NICOTINAMIDE_TOTAL } from './tuning';

export type Act1PoolId =
  | 'glucose_env'
  | 'glucose'
  | 'g3p'
  | 'pyruvate'
  | 'lactate'
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
 */
const CONSERVED: Readonly<Record<Act1PoolId, Readonly<Record<string, number>>>> = {
  glucose_env: { carbon: 6, redox: 2 },
  glucose: { carbon: 6, redox: 2 },
  g3p: { carbon: 3, phosphate: 1, redox: 1 },
  pyruvate: { carbon: 3 },
  lactate: { carbon: 3, redox: 1 },
  nad: { nicotinamide: 1 },
  nadh: { nicotinamide: 1, redox: 1 },
  atp: { phosphate: 3, adenylate: 1 },
  adp: { phosphate: 2, adenylate: 1 },
  pi: { phosphate: 1 },
};

/**
 * PROVISIONAL. Not measurements, not balanced, introduced by UPDATELOGV2.md.
 *
 * These are starting amounts chosen so the pathway runs, in the same status as
 * the rates in tuning.ts and under the same obligation: a row in the
 * docs/ECONOMY.md divergence table once that document exists. docs/SCIENCE.md
 * Part 1 forbids implying they are anything else. Nothing here may reach
 * player-facing text.
 *
 * Two of them are structural rather than arbitrary:
 *
 *   nad + nadh   the nicotinamide total, and the entire act 1 mechanic.
 *                docs/SCIENCE.md Part 2 line 108 sources that the pool is small
 *                and fixed. It does not source how small, so the number is ours
 *                and it lives in tuning.ts with the rates, sized in stage 4
 *                against how long the stall takes to arrive. All of it starts
 *                as NAD+, so the wall is approached rather than started at.
 *
 *   atp + adp    the adenylate total. Fixed and closed, because ATP is a flux
 *                and not a score. `maintain` hydrolyses ATP back to ADP and Pi,
 *                which is what a cell does with it. Cumulative ATP produced is
 *                a counter, not a pool, so it cannot leak into conservation.
 *
 *   glucose_env  the environment. Also in tuning.ts, and raised there from
 *                10000 to 80000 by UPDATELOGV3.md stage 6 to move the ATP
 *                bootstrap trap beyond the horizon of act 1. Read the comment
 *                on it before changing it: it is a deferral rather than a fix,
 *                and the NOW.md blocking item it defers is still open.
 */
export const ACT1_INITIAL: Readonly<Record<Act1PoolId, number>> = {
  glucose_env: ACT1_GLUCOSE_ENV_INITIAL,
  glucose: 0,
  g3p: 0,
  pyruvate: 0,
  lactate: 0,
  nad: ACT1_NICOTINAMIDE_TOTAL,
  nadh: 0,
  atp: 20,
  adp: 20,
  pi: 40,
};

/**
 * The ten pool definitions, in ACT1_POOL_IDS order.
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
