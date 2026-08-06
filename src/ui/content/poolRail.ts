/**
 * The pool rail. The figures on a card, and what a blob says about itself.
 */

import { sourced, tuned } from '../components/Badge';
import { MIN_POLYGON_SIDES } from '../components/Blob';
import type { Entry } from './common';
import { PART2, ABOUT_THE_BUILD } from './common';

/**
 * The pool card figures. Flux is the headline and stock is the subscript,
 * DESIGN.md's biggest deliberate departure.
 */
export const POOL_FIGURES = {
  netRate: {
    text: 'net rate',
    badge: tuned('Rates are tuned for pacing and are not measured values, per docs/SCIENCE.md Part 1'),
  },
  stock: {
    text: 'in the cell',
    badge: tuned('Pool sizes are tuned. Only the ratios the stoichiometry fixes are sourced'),
  },
} as const satisfies Readonly<Record<string, Entry>>;

/**
 * The carrier's state, in bands, for the accessible name on the blob.
 *
 * WHY BANDS AND NOT A PERCENTAGE. The picture carries a level, and a level is
 * read at a glance as roughly how full, not as a figure. A precise number would
 * also be a quantitative claim with nowhere to put a badge, and the exact
 * amounts are already on the same card as two badged figures, so a screen
 * reader user who wants them has them. This says what the shape says.
 *
 * Five bands rather than three, because act 1's beat is the carrier filling up
 * and three bands would jump from "mostly NAD+" to "all NADH" through nothing.
 *
 * "The carrier" means the pair and never one member, per docs/CONTENT_STYLE.md
 * Part 3, which is why every band names both or names the one that is left.
 */
export function carrierState(reducedFraction: number): Entry {
  const f = Math.min(1, Math.max(0, Number.isFinite(reducedFraction) ? reducedFraction : 0));
  /**
   * The thresholds are symmetric about a half and they were corrected once, by
   * reading the tree on a running cell. The first pair, 0.25 and 0.6, described
   * a carrier at 0.288 as "about half NADH", which is not what the level looks
   * like and not what the two stock figures beside it say.
   */
  const band =
    f <= 0 ? 'All NAD+, none of it carrying electrons'
    : f < 0.35 ? 'Mostly NAD+'
    : f < 0.65 ? 'About half NADH'
    : f < 1 ? 'Mostly NADH'
    : 'All NADH, and the pathway has nothing left to reduce';
  return {
    text: `NAD+ and NADH. ${band}.`,
    badge: sourced(`${PART2}, the NAD+ constraint`),
  };
}

/**
 * Accessible names for figures whose meaning is carried by position or size.
 *
 * DESIGN.md's flux-is-the-headline decision says which of two numbers on a pool
 * card is the rate by making it large, and type size is not a channel speech
 * has. Stage 1 read the tree and found a card announcing as "Glucose, SOURCED,
 * +7.95, /s, GLUCOSE, 944.72": two numbers with nothing saying which is which.
 */
export const FIGURE_LABELS = {
  netRate: { text: 'net rate', badge: tuned(ABOUT_THE_BUILD) },
} as const satisfies Readonly<Record<string, Entry>>;

/**
 * What a blob says about itself, composed from the same conserved-weight table
 * the geometry is drawn from.
 *
 * THE CHEAPEST COMPREHENSION WIN AVAILABLE, because the information is already
 * on screen and simply unlabelled. docs/CONTENT_STYLE.md Part 6 says a concept
 * carried by shape must not be carried by a paragraph; this is the pointer at
 * the shape rather than a description of it.
 *
 * Numbers in player-facing text, which is what makes this the first real load on
 * hard rule 1. Every one of them is a conserved weight out of
 * src/content/act1/pools.ts, which traces to docs/SCIENCE.md Part 2, and the
 * badge below is the one the pool card already renders for every figure on it.
 * Composed here rather than in the component, so no .tsx formats a number.
 */
/**
 * The carrier's readout, which is the one blob whose encoding is not geometry.
 *
 * DESIGN.md calls `reduced` and `oxidized` at the same silhouette "the single
 * most important colour decision in the system", and item 11 of
 * UPDATELOGV6.md's thirteen-item table records that nothing on the screen had
 * ever said so. This says it, on the shape that is doing it.
 *
 * REWRITTEN IN UPDATELOGV7.md STAGE 2, FOR TWO REASONS. The carrier now carries
 * a level as well as a colour, and a readout that names one of two channels
 * describes a picture the game no longer draws. And the direction was wrong.
 * NOW.md and DESIGN.md both record that DESIGN.md's "colour leaving" sentence
 * is backwards, because `oxidized` is the desaturated end, so as NAD+ drains
 * the colour ARRIVES. The old text said "full colour means NADH", which is true
 * and says nothing about which way the beat runs. This says which way.
 */
export const CARRIER_READOUT: Entry = {
  text: 'NAD+ and NADH. One shape, and the filled part is NADH. The level rises and the colour arrives as NAD+ is spent.',
  badge: sourced(`${PART2}, the NAD+ constraint`),
};

export function blobReadout(name: string, carbon: number, phosphate: number): Entry {
  const parts = [name];
  // BELOW THREE CARBONS THE SHAPE IS BEADS AND THE SENTENCE HAS TO SAY SO.
  // UPDATELOGV10.md stage 2. A polygon needs three sides, so ethanol and carbon
  // dioxide are drawn as one round bead per carbon, and a readout that said
  // "1 sides, 1 carbons" would be describing a shape that is not on the screen
  // as well as being ungrammatical. The count is still the whole of the claim.
  if (carbon >= MIN_POLYGON_SIDES) parts.push(`${carbon} sides, ${carbon} carbons`);
  else if (carbon === 1) parts.push('1 bead, 1 carbon');
  else if (carbon > 0) parts.push(`${carbon} beads, ${carbon} carbons`);
  if (phosphate > 0) parts.push(`${phosphate} phosphate`);
  return { text: parts.join('. '), badge: sourced(`${PART2}, stoichiometry`) };
}
