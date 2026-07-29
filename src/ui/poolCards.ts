/**
 * Ten pools, eight cards, and where each blob's geometry comes from.
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
import { CARRIER_PAIRS, MOLECULES, type Entry } from './content';

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
  | 'adenylate';

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
