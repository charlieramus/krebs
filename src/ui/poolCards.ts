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

import { ACTS, type ActDescriptor } from '../content/acts';
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

/**
 * Conserved weights by pool id, read from EVERY act this build knows.
 *
 * UPDATELOGV12.md stage 5. It was `act1PoolDefinitions()`, which was the last
 * place in the interface that named act 1 by hand after Spine A, and it meant
 * act 2's blobs would have had act 1's geometry or none.
 *
 * ONE MAP ACROSS ALL ACTS RATHER THAN ONE PER ACT, and that is a decision with a
 * reason rather than a convenience. docs/SAVE_SCHEMA.md Part 3 makes a pool id
 * permanent contract surface the moment anything ships with it, so a pool id is
 * globally unique and a pool's conserved weights are a property of the pool
 * rather than of the act reading it. Two acts that share `pyruvate` share its
 * three carbons by definition, and `illustration.test.ts` fails the build if two
 * acts ever disagree about a shared id.
 *
 * Built once at module load, from the registry, so adding an act adds its pools
 * without an edit here.
 */
const WEIGHTS: Readonly<Record<string, { carbon: number; phosphate: number }>> = Object.fromEntries(
  ACTS.flatMap((act) => act.poolDefinitions()).map((definition) => [
    definition.id,
    {
      carbon: definition.conserved.carbon ?? 0,
      phosphate: definition.conserved.phosphate ?? 0,
    },
  ]),
);

/** Sides for this pool's blob. DESIGN.md illustration rule 1. */
export function carbonOf(id: string): number {
  return WEIGHTS[id]?.carbon ?? 0;
}

/** Countable dots for this pool's blob. DESIGN.md illustration rule 2. */
export function phosphateOf(id: string): number {
  return WEIGHTS[id]?.phosphate ?? 0;
}

export interface BlobSpec {
  readonly poolId: string;
  /** Semantic colour. Never a surface: fill carries state, surfaces do not. */
  readonly fill: string;
  /** Fixes the wobble. Shared between NAD+ and NADH so they are one silhouette. */
  readonly seed: number;
  readonly electrons?: number;
}

/**
 * WHAT A CARD IS, NOT WHAT IT CONTAINS. UPDATELOGV11.md stage 2.
 *
 * These four were `'simple' | 'nicotinamide' | 'adenylate' | 'branch-products'`,
 * which put act 1 chemistry into a TypeScript type: a component switching on
 * `'nicotinamide'` cannot draw act 3's proton gradient however the card is
 * declared, and act 2 could not add a card kind without teaching this union the
 * name of a molecule. Each name below says what the card DOES with the pools it
 * is given, so the same four kinds are available to every act and a fifth is
 * added when a fifth arrangement exists rather than when a fifth molecule does.
 *
 * The card table under each kind is unchanged: `nicotinamide` became `mix`,
 * `adenylate` became `pair`, `branch-products` became `products`, and nothing
 * that reads them behaves differently.
 */
export type CardKind =
  /** One pool, one blob. */
  | 'simple'
  /**
   * Two pools that are one conserved quantity in two states, drawn as ONE
   * silhouette whose level is the proportion between them.
   *
   * Act 1's is NAD+ and NADH. Rule 3: the two are the same molecule reduced or
   * oxidised, so drawing two shapes would be drawing one shape twice and
   * throwing away the encoding.
   */
  | 'mix'
  /**
   * Two pools that differ by a countable thing, drawn as TWO blobs side by side.
   *
   * Act 1's is ATP and ADP, which differ by one phosphate dot, and putting them
   * next to each other is what makes "spending energy removes a dot" visible.
   */
  | 'pair'
  /**
   * Two pools produced together in a fixed ratio by one reaction, on one card.
   * Ethanol and carbon dioxide, added by UPDATELOGV10.md stage 2.
   *
   * One card rather than two for the reason the mix gets one: the pair is what
   * teaches. Pyruvate has three carbons, two of them stay as ethanol and one
   * leaves as gas, and putting those two counts side by side is the whole of
   * what distinguishes this branch from the lactate branch. On two cards they
   * are two numbers going up together and the player does the joining up.
   */
  | 'products';

export interface PoolCardSpec {
  readonly id: string;
  readonly kind: CardKind;
  readonly title: Entry;
  readonly surface: Surface;
  /** Pools whose stock is shown under the headline, in order. */
  readonly stocks: readonly string[];
  /** The pool whose net rate is the headline figure. */
  readonly headline: string;
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
const ACT1_POOL_CARDS: readonly PoolCardSpec[] = [
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
    kind: 'products',
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
    kind: 'mix',
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
    kind: 'pair',
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

/**
 * The card layout for each act this build knows.
 *
 * ONE ENTRY, KEYED BY ACT NUMBER, AND IT LIVES IN src/ui/ RATHER THAN IN THE
 * DESCRIPTOR. `src/content/acts.ts` cannot hold this: content may not import the
 * interface, and a card carries a `Surface`, a `CoachMark` and player-facing
 * `Entry` strings, all of which are interface things. So the descriptor answers
 * what the act IS and this table answers what it LOOKS like, keyed by the same
 * number.
 *
 * The grouping is the part that is not derived. Geometry already comes from the
 * conserved-weight table, so a blob's sides and dots cannot drift from the
 * pathway. WHICH pools share a card is a teaching decision and stays written
 * down.
 *
 * ---------------------------------------------------------------------------
 * THE RAIL IS NOT REGROUPED FOR ACT 3, AND THAT IS A DECISION RATHER THAN AN
 * OMISSION. UPDATELOGV12.md stage 5 step 2.
 * ---------------------------------------------------------------------------
 *
 * Act 3's pools are not written down anywhere. docs/PROGRESSION.md gives act 3
 * eight unlocks and names no pools, and `docs/designs/game-spine-and-four-acts.md`
 * defers act 3's compartment and gradient illustration rules to the act 3 log by
 * its own risk table, because nothing in the illustration language encodes a
 * membrane, a compartment or a proton gradient today.
 *
 * A grouping designed against an imagined act 3 gets redesigned in the act 3 log
 * anyway, so the cost is paid twice and the version in between is worse than
 * either. **Read this as deferred rather than as forgotten.** What this log does
 * is make the rule read the running act's table. What it does not do is guess
 * what that table will contain.
 */
const CARDS_BY_ACT: ReadonlyMap<number, readonly PoolCardSpec[]> = new Map([
  [1, ACT1_POOL_CARDS],
]);

/**
 * The running act's cards.
 *
 * Throws rather than returning an empty rail, because an act with no cards is a
 * build mistake and a blank left column is the most confusing possible way to
 * report one. Stage 5 refuses an act this build does not know at load, so this
 * is unreachable from a save and reachable only from a new act added without
 * its layout.
 */
export function poolCardsFor(act: ActDescriptor): readonly PoolCardSpec[] {
  const cards = CARDS_BY_ACT.get(act.act);
  if (cards === undefined) throw new Error(`poolCards: act ${act.act} has no card layout`);
  return cards;
}

/** Act 1's cards, for the tests and reports that are about act 1 specifically. */
export { ACT1_POOL_CARDS };
