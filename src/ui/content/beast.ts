/**
 * The beast. What each reading is called, and what a screen reader is told.
 *
 * ---------------------------------------------------------------------------
 * NO NUMBER IN ANY OF IT, AND THAT IS THE RULE RATHER THAN THE OUTCOME
 * ---------------------------------------------------------------------------
 *
 * DESIGN.md settled this on the carrier blob: an accessible name states the
 * reading, not the legend, and a number in an `aria-label` has nowhere to put a
 * badge, so it would be a quantitative claim in player-facing text with no
 * provenance. The beast reads gross throughput and the honest thing to say about
 * it is that the cell is working or that it has stopped. The rate itself is on
 * the top bar, where a badge can reach it.
 *
 * ---------------------------------------------------------------------------
 * THE NAMES ARE OF THE CELL, NOT OF A MOOD
 * ---------------------------------------------------------------------------
 *
 * docs/CONTENT_STYLE.md Part 2 rules out performing enthusiasm, and a beast that
 * is described as happy or sad is a pet. Each line below says what the cell is
 * doing. `Tuned` rather than `Sourced` because "working hard" is a reading of a
 * tuned rate rather than a claim about a cell.
 */

import { tuned } from '../components/Badge';
import type { ActVitality } from '../../content/acts';
import type { Entry } from './common';
import { ABOUT_THE_BUILD } from './common';

/**
 * The accessible name for each reading. Micro-label voice, one clause, no
 * number.
 *
 * `sick` and `powered` are unreachable in act 1 and are written now for the
 * reason the drawings are: act 2 and act 3 widen a table rather than invent a
 * voice under deadline.
 */
export const BEAST: Readonly<Record<ActVitality, Entry>> = {
  lively: {
    text: 'The cell is working. Carbon is moving through the pathway.',
    badge: tuned(ABOUT_THE_BUILD),
  },
  sluggish: {
    // NOT "the cell is dying" and not "something is wrong". A cell holding at a
    // steady state with nothing moving is the game working correctly, and it is
    // most of act 1. The line says what is true and does not editorialise.
    text: 'The cell has stopped. Nothing is moving through the pathway.',
    badge: tuned(ABOUT_THE_BUILD),
  },
  sick: {
    text: 'The cell is being damaged.',
    badge: tuned(ABOUT_THE_BUILD),
  },
  powered: {
    text: 'The cell has a compartment of its own inside it.',
    badge: tuned(ABOUT_THE_BUILD),
  },
};
