/**
 * Thirteen pools, ten cards, and where each blob's geometry comes from.
 *
 * THE TWO CARRIER PAIRS SHARE A CARD EACH. Their sum is what is conserved and
 * the sum is what teaches. NAD+ draining while NADH fills, on one card, is the
 * wall arriving. On two cards it is two unrelated numbers going in opposite
 * directions and the player has to do the joining up themselves, which is
 * exactly the work the interface is supposed to be doing for them.
 *
 * The conserved weights are READ from src/content/act1/pools.ts rather than
 * written here. That file is the same table the conservation test asserts
 * against, so a stoichiometry change moves the picture and cannot quietly leave
 * the illustration describing an older pathway.
 */

import { act1PoolDefinitions, type Act1PoolId } from '../content/act1/pools';
import type { Surface } from './components/Card';
import {
  ATP_COACH_MARK,
  BRANCH_PRODUCTS,
  CARBON_COACH_MARK,
  CARRIER_PAIRS,
  MOLECULES,
  NAD_COACH_MARK,
  type CoachMark,
  type Entry,
} from './content';

/** Conserved weights by pool id, derived once from the act 1 pool definitions. */
const WEIGHTS: Readonly<Record<string, { carbon: number; phosphate: number }>> = Object.fromEntries(
  act1PoolDefinitions().map((definition) => [
    definition.id,
    {
      carbon: definition.conserved.carbon ?? 0,
      phosphate: definition.conserved.phosphate ?? 0,
    },
  ]),
);

/** Sides for this pool's blob. DESIGN.md illustration rule 1. */
export function carbonOf(id: Act1PoolId): number {
  return WEIGHTS[id]?.carbon ?? 0;
}

/** Countable dots for this pool's blob. DESIGN.md illustration rule 2. */
export function phosphateOf(id: Act1PoolId): number {
  return WEIGHTS[id]?.phosphate ?? 0;
}

export interface BlobSpec {
  readonly poolId: Act1PoolId;
  /** Semantic colour. Never a surface: fill carries state, surfaces do not. */
  readonly fill: string;
  /** Fixes the wobble. Shared between NAD+ and NADH so they are one silhouette. */
  readonly seed: number;
  readonly electrons?: number;
}

export type CardKind =
  /** One pool, one blob. */
  | 'simple'
  /** NAD+ and NADH. One silhouette whose saturation is the redox state. */
  | 'nicotinamide'
  /** ATP and ADP. Two blobs differing only in how many phosphate dots they carry. */
  | 'adenylate'
  /**
   * Two pools produced together in a fixed ratio by one reaction, on one card.
   * Ethanol and carbon dioxide, added by UPDATELOGV10.md stage 2.
   *
   * One card rather than two for the reason the carrier pairs get one: the pair
   * is what teaches. Pyruvate has three carbons, two of them stay as ethanol and
   * one leaves as gas, and putting those two counts side by side is the whole of
   * what distinguishes this branch from the lactate branch. On two cards they
   * are two numbers going up together and the player does the joining up.
   */
  | 'branch-products';

export interface PoolCardSpec {
  readonly id: string;
  readonly kind: CardKind;
  readonly title: Entry;
  readonly surface: Surface;
  /** Pools whose stock is shown under the headline, in order. */
  readonly stocks: readonly Act1PoolId[];
  /** The pool whose net rate is the headline figure. */
  readonly headline: Act1PoolId;
  readonly blobs: readonly BlobSpec[];
  /**
   * The coach mark this card teaches, if it teaches one.
   *
   * Three of eight cards do. Which card a mark belongs on is a content decision
   * rather than a component one, so it is declared here beside the card it
   * annotates instead of being a `kind === 'nicotinamide'` branch inside
   * PoolCard, which is what it was while there was exactly one.
   */
  readonly coach?: CoachMark;
}

/** DESIGN.md, Colour: substrate blue is carbon skeletons. */
const SUBSTRATE = 'var(--color-substrate)';
const ATP_ORANGE = 'var(--color-atp)';
/** The oxidized end of the redox axis. The reduced end is applied live. */
const OXIDIZED = 'var(--color-oxidized)';

/**
 * DESIGN.md, Colour: sky is substrate cards, pink is pools and stores.
 *
 * The five carbon pools are substrates and take sky. The three carrier and
 * store cards take pink.
 */
export const POOL_CARDS: readonly PoolCardSpec[] = [
  {
    id: 'glucose_env',
    kind: 'simple',
    title: MOLECULES.glucose_env,
    surface: 'sky',
    stocks: ['glucose_env'],
    headline: 'glucose_env',
    blobs: [{ poolId: 'glucose_env', fill: SUBSTRATE, seed: 11 }],
  },
  {
    id: 'glucose',
    kind: 'simple',
    title: MOLECULES.glucose,
    surface: 'sky',
    stocks: ['glucose'],
    headline: 'glucose',
    blobs: [{ poolId: 'glucose', fill: SUBSTRATE, seed: 23 }],
  },
  {
    id: 'g3p',
    kind: 'simple',
    title: MOLECULES.g3p,
    surface: 'sky',
    stocks: ['g3p'],
    headline: 'g3p',
    blobs: [{ poolId: 'g3p', fill: SUBSTRATE, seed: 37 }],
    // Sides equal carbons goes here rather than on either glucose card, because
    // this is the only place on the screen where the arithmetic is visible: a
    // six-sided blob upstream and a three-sided one here, two of them per
    // glucose. DESIGN.md's argument for rule 1 is exactly that split.
    coach: CARBON_COACH_MARK,
  },
  {
    id: 'pyruvate',
    kind: 'simple',
    title: MOLECULES.pyruvate,
    surface: 'sky',
    stocks: ['pyruvate'],
    headline: 'pyruvate',
    blobs: [{ poolId: 'pyruvate', fill: SUBSTRATE, seed: 41 }],
  },
  {
    id: 'lactate',
    kind: 'simple',
    title: MOLECULES.lactate,
    surface: 'sky',
    stocks: ['lactate'],
    headline: 'lactate',
    blobs: [{ poolId: 'lactate', fill: SUBSTRATE, seed: 59 }],
  },
  {
    id: 'ethanol',
    kind: 'branch-products',
    title: BRANCH_PRODUCTS.ethanol,
    surface: 'sky',
    stocks: ['ethanol', 'co2'],
    // Ethanol's net rate. Carbon dioxide's is the same number by construction,
    // since one reaction makes both at one apiece, so showing it twice would be
    // showing the same figure twice.
    headline: 'ethanol',
    // Two beads and one bead. DESIGN.md rule 1 below three carbons: a polygon
    // needs three sides, so the count is beads here and the arithmetic against
    // pyruvate's three sides still reads.
    blobs: [
      { poolId: 'ethanol', fill: SUBSTRATE, seed: 97 },
      { poolId: 'co2', fill: SUBSTRATE, seed: 103 },
    ],
  },
  {
    id: 'glycogen',
    kind: 'simple',
    title: MOLECULES.glycogen,
    // Pink. DESIGN.md, Colour: sky is substrate cards and pink is pools and
    // stores. Every other carbon pool on this rail is sky because every other
    // one is on its way somewhere. This one is the only store in act 1 and it
    // is the card the rule was written for.
    surface: 'pink',
    stocks: ['glycogen'],
    headline: 'glycogen',
    // Six sides, exactly like both glucose cards, because a stored glucosyl
    // residue IS a glucose. The shape saying so is the encoding doing its job:
    // storing changes where a glucose is and not what it is.
    blobs: [{ poolId: 'glycogen', fill: SUBSTRATE, seed: 109 }],
  },
  {
    id: 'nicotinamide',
    kind: 'nicotinamide',
    title: CARRIER_PAIRS.nicotinamide,
    surface: 'pink',
    stocks: ['nad', 'nadh'],
    // NADH's net rate, which is the payoff phase reducing the carrier minus
    // fermentation reoxidising it. Positive means the wall is approaching.
    headline: 'nadh',
    // ONE blob. Rule 3: NAD+ and NADH are the same silhouette and only the
    // saturation differs, so drawing two would be drawing the same shape twice
    // and throwing away the encoding.
    blobs: [{ poolId: 'nad', fill: OXIDIZED, seed: 67, electrons: 2 }],
    coach: NAD_COACH_MARK,
  },
  {
    id: 'adenylate',
    kind: 'adenylate',
    title: CARRIER_PAIRS.adenylate,
    surface: 'pink',
    stocks: ['atp', 'adp'],
    headline: 'atp',
    // TWO blobs, because rule 2 governs this pair rather than rule 3. ATP and
    // ADP differ by a countable phosphate dot, and putting them side by side is
    // what makes "spending energy removes a dot" visible at all.
    blobs: [
      { poolId: 'atp', fill: ATP_ORANGE, seed: 73 },
      { poolId: 'adp', fill: ATP_ORANGE, seed: 73 },
    ],
    // What ATP is, on the card whose headline sits at 0.00 once the cell is in
    // steady state. A player looking at a currency that has stopped going up is
    // exactly the player who needs to be told it was never going to.
    coach: ATP_COACH_MARK,
  },
  {
    id: 'pi',
    kind: 'simple',
    title: MOLECULES.pi,
    surface: 'pink',
    stocks: ['pi'],
    headline: 'pi',
    blobs: [{ poolId: 'pi', fill: 'var(--color-white)', seed: 83 }],
  },
];
