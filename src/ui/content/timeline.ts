/**
 * The timeline. Seven stops, their dates, and the axis disclosure.
 *
 * ---------------------------------------------------------------------------
 * ONE BADGE PER STOP, AND IT IS NOT THE WEAKER OF TWO
 * ---------------------------------------------------------------------------
 *
 * docs/CONTENT_STYLE.md Part 4 rule 2 says one Entry, one provenance claim, and
 * that a paragraph carrying two numbers WHOSE PROVENANCE DIFFERS is two entries
 * with two badges rather than one with the weaker.
 *
 * On this view the provenance does not differ within a stop. A stop's date and
 * its one-line reading both come from the same docs/SCIENCE.md Part 6 stop
 * entry, and where the date is contested the reading is contested for the same
 * reason and by the same argument: the 2.7 Ga photosynthesis figure and the
 * sentence saying when it began is not known are one finding. So the badge sits
 * on the card and covers both, and it is the stop's real kind rather than a
 * softened one.
 *
 * ---------------------------------------------------------------------------
 * THE TWO UNDATED STOPS CARRY A WORD, NOT A BLANK
 * ---------------------------------------------------------------------------
 *
 * DESIGN.md, The undated stop. `unresolved` and `hypothesis` are set where a
 * date would be, at the date's own size and weight, and nothing about them is
 * dimmed, dashed or grey, because this system uses those to mean unfinished and
 * these are the two stops where the sourcing was done hardest.
 */

import { contested, sourced, tuned } from '../components/Badge';
import type { StopId } from '../timeline';
import type { Entry } from './common';
import { PART6, ABOUT_THE_BUILD } from './common';

export interface StopContent {
  /** Card title. 4 words, no full stop. docs/CONTENT_STYLE.md Part 5. */
  readonly title: string;
  /**
   * The date column. A range with digits, or the one word that says why there
   * is no range. Written exactly as DESIGN.md's stop table writes it.
   */
  readonly date: string;
  /** The reading. Slot-detail ceiling: 2 sentences, 160 characters. */
  readonly note: string;
  /** One badge, covering both. See the header. */
  readonly badge: Entry['badge'];
}

/**
 * Every date below is player-facing and falls under CLAUDE.md hard rule 1. All
 * five ranges trace to docs/SCIENCE.md Part 6, stop by stop, and the two words
 * trace to the same document declining to supply one.
 */
export const TIMELINE_CONTENT: Readonly<Record<StopId, StopContent>> = {
  now: {
    title: 'Modern eukaryotic cell',
    date: 'Now',
    note: 'Where the cell you are running ends up. Locked until the game is finished.',
    // Not a claim about the record. It is the endpoint of this build, which is
    // why it is the one stop the admission rule does not reach. See timeline.ts.
    badge: tuned(ABOUT_THE_BUILD),
  },
  eukaryotes: {
    title: 'Early aerobic eukaryotes',
    date: '~1.7 to 1.5 Ga',
    note: 'The oldest eukaryote fossils sit almost entirely in oxygenated bottom water. They were benthic aerobes.',
    badge: sourced(`${PART6}, stop 6`),
  },
  endosymbiosis: {
    title: 'Mitochondrial endosymbiosis',
    date: '~2.2 to 1.5 Ga',
    note: 'One cell took another in and kept it. Both the date and the ordering are disputed.',
    badge: contested(`${PART6}, stop 5`),
  },
  goe: {
    title: 'Great Oxidation Event',
    date: '~2.4 to 2.0 Ga',
    note: 'Banded iron is biological oxygen meeting dissolved iron. Its peak sits just before the rise, not during it.',
    badge: sourced(`${PART6}, stop 4`),
  },
  photosynthesis: {
    title: 'Oxygenic photosynthesis',
    date: 'unresolved',
    note: 'Oxygen production has to predate the rise in the air above. When it began is not known.',
    badge: contested(`${PART6}, stop 3`),
  },
  mats: {
    title: 'Microbial mats',
    date: '~3.48 to 3.43 Ga',
    note: 'Mats built by microbes. Any phototrophy this early used something other than water, so no oxygen yet.',
    badge: sourced(`${PART6}, stop 2`),
  },
  vents: {
    title: 'Alkaline hydrothermal vents',
    date: 'hypothesis',
    note: 'A proposal for where chemiosmosis came from. It is disputed on mechanism, not only on timing.',
    badge: contested(`${PART6}, stop 1`),
  },
};

export const TIMELINE = {
  /** The heading, and the landmark's name. */
  heading: { text: 'Deep time', badge: tuned(ABOUT_THE_BUILD) },
  /** Micro label ceiling: 3 words, 18 characters, no full stop. */
  marker: { text: 'You are here', badge: tuned(ABOUT_THE_BUILD) },
  /** The one locked stop. Same ceiling. */
  locked: { text: 'Locked', badge: tuned(ABOUT_THE_BUILD) },
  /**
   * THE AXIS DISCLOSURE, AND IT IS ON THE VIEW RATHER THAN IN A DOCUMENT.
   *
   * DESIGN.md: all four acts sit between roughly 4.0 and 1.5 Ga, so a linear
   * axis would spend most of its length on eras containing no gameplay. The
   * compression is necessary and silent compression of a real timescale is
   * exactly the failure mode this project exists to avoid.
   */
  axis: {
    text: 'Spacing is not to scale. It is weighted to the era the game happens in.',
    badge: tuned(ABOUT_THE_BUILD),
  },
} as const satisfies Readonly<Record<string, Entry>>;

/**
 * What a screen reader is told about the marker, composed here so no component
 * writes prose.
 *
 * IT STATES THE READING RATHER THAN THE LEGEND, which is the rule V7 settled on
 * the carrier blob. "Marker" would name the mechanism. This names the place.
 */
export function markerReading(title: string): Entry {
  return { text: `You are here. ${title}.`, badge: tuned(ABOUT_THE_BUILD) };
}

/**
 * What a screen reader is told about an undated stop.
 *
 * IT STATES THE CONSTRAINT, NOT THE ABSENCE. "No date" would be the legend
 * again, and it would also be wrong: something is known about where these two
 * sit and it is the only thing that is known about them.
 */
export const UNDATED_READING: Readonly<Record<'unresolved' | 'hypothesis', Entry>> = {
  unresolved: {
    text: 'When this began is unresolved. It sits below the stop above it and nothing bounds it below.',
    badge: contested(`${PART6}, stop 3`),
  },
  hypothesis: {
    text: 'This is a hypothesis rather than a dated event. It sits below the stop above it and nothing bounds it below.',
    badge: contested(`${PART6}, stop 1`),
  },
};
