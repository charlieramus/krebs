/**
 * Molecule names, and the two cards that carry a pair.
 *
 * NOT A SURFACE, WHICH IS WHY IT IS ITS OWN FILE. Every other file in this
 * directory is a screen. These are the names the pool rail, the pathway card and
 * the coach marks all say, and a name that lived on one surface would be
 * restated on the other two, which is the drift docs/CONTENT_STYLE.md Part 3
 * exists to stop.
 */

import { sourced, tuned } from '../components/Badge';
import type { Act1PoolId } from '../../content/act1/pools';
import type { Entry } from './common';
import { PART2 } from './common';

/* ===========================================================================
   MOLECULES

   Names, and nothing that reads as a description. Every one of these is the
   label already carried by src/content/act1/pools.ts, so the interface and the
   simulation cannot drift into calling the same pool two different things.
   =========================================================================== */

export const MOLECULES: Readonly<Record<Act1PoolId, Entry>> = {
  glucose_env: {
    text: 'Glucose (environment)',
    // Not a molecule name claim but a modeling one: the environment is a finite
    // pool the cell draws down, which is a decision about the game rather than
    // a fact about a cell in a mat.
    badge: tuned('The environment is modeled as a finite pool so uptake has something to deplete'),
  },
  glucose: { text: 'Glucose', badge: sourced(PART2) },
  g3p: { text: 'Glyceraldehyde 3-phosphate', badge: sourced(PART2) },
  pyruvate: { text: 'Pyruvate', badge: sourced(PART2) },
  lactate: { text: 'Lactate', badge: sourced(PART2) },
  ethanol: { text: 'Ethanol', badge: sourced(`${PART2}, ethanol fermentation`) },
  co2: { text: 'Carbon dioxide', badge: sourced(`${PART2}, ethanol fermentation`) },
  glycogen: { text: 'Glycogen', badge: sourced(`${PART2}, glycogen and what storage costs`) },
  nad: { text: 'NAD+', badge: sourced(PART2) },
  nadh: { text: 'NADH', badge: sourced(PART2) },
  atp: { text: 'ATP', badge: sourced(PART2) },
  adp: { text: 'ADP', badge: sourced(PART2) },
  pi: { text: 'Phosphate', badge: sourced(PART2) },
};

/**
 * A molecule's name by pool id, for a caller that holds a `string` rather than
 * an `Act1PoolId`.
 *
 * The card layout in src/ui/poolCards.ts stopped being typed against act 1's
 * pool union in UPDATELOGV11.md stage 2, because a union of act 1 molecule names
 * in a shared type is exactly what stopped a second act being drawable. The
 * table above keeps its exhaustive act 1 typing, which is what makes a missing
 * name a compile error while act 1 is the act; this is the door for everything
 * that no longer knows which act's id it is holding.
 *
 * Throws on an unknown id. A card naming a pool the act does not have is a build
 * mistake, and a blank label is the most confusing possible way to report one.
 */
export function moleculeName(id: string): Entry {
  const entry = (MOLECULES as Readonly<Record<string, Entry | undefined>>)[id];
  if (entry === undefined) throw new Error(`content: no molecule name for pool "${id}"`);
  return entry;
}

/**
 * The two carrier pairs share a card each, because their sum is the conserved
 * quantity and the sum is what teaches. Watching NAD+ drain while NADH fills on
 * one card is the wall arriving; watching them on two cards is two unrelated
 * numbers.
 */
export const CARRIER_PAIRS: Readonly<Record<'nicotinamide' | 'adenylate', Entry>> = {
  nicotinamide: { text: 'NAD+ / NADH', badge: sourced(PART2) },
  adenylate: { text: 'ATP / ADP', badge: sourced(PART2) },
};

/**
 * The ethanol branch makes both of these at once, one apiece, so they share a
 * card for the same reason the carrier pairs do. Two of pyruvate's carbons stay
 * and one leaves, and the pair is what says so.
 */
export const BRANCH_PRODUCTS: Readonly<Record<'ethanol', Entry>> = {
  ethanol: { text: 'Ethanol / CO2', badge: sourced(`${PART2}, ethanol fermentation`) },
};
