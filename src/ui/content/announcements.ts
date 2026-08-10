/**
 * What assistive technology is told. Landmarks, and the live region.
 */

import { sourced, tuned } from '../components/Badge';
import type { Entry } from './common';
import { PART2, ABOUT_THE_BUILD } from './common';

/* ===========================================================================
   LANDMARKS

   Region names for assistive technology. An aria-label is a player-facing
   string, docs/CONTENT_STYLE.md Part 1 says so explicitly, and these were the
   two that had been sitting in component files since V3.
   =========================================================================== */

export const LANDMARKS = {
  pools: { text: 'Pools', badge: tuned(ABOUT_THE_BUILD) },
  /**
   * The four regions of the layout, so a screen reader user can navigate to
   * them rather than reading through. UPDATELOGV7.md stage 1 found three
   * landmarks and no heading or landmark on the pathway card, which is the
   * centre of the screen and the thing the game is about.
   */
  readouts: { text: 'Rates', badge: tuned(ABOUT_THE_BUILD) },
  pathway: { text: 'Pathway', badge: tuned(ABOUT_THE_BUILD) },
  /** Named "Events" rather than "Announcements", which is a word about the machinery. */
  events: { text: 'Events', badge: tuned(ABOUT_THE_BUILD) },
  /**
   * THE SKIP LINK, AND V7 WAS RIGHT NOT TO BUILD IT UNTIL NOW.
   *
   * UPDATELOGV7.md stage 3 step 5 asked for one past the pool rail and stage 3
   * declined, measuring three tab stops in the rail and calling a skip link over
   * three stops more furniture than it saves. That argument was correct and it
   * has inverted: provenance-on-click makes every badge an affordance, so the
   * timeline and the rail together are 21 stops before the shelf.
   *
   * Button ceiling is 5 words. This is 4.
   */
  skip: { text: 'Skip to the pathway', badge: tuned(ABOUT_THE_BUILD) },
} as const satisfies Readonly<Record<string, Entry>>;

/* ===========================================================================
   WHAT A SCREEN READER IS TOLD. UPDATELOGV7.md stage 4.

   THE RULE IS ANNOUNCE EVENTS, EXPOSE RATES ON DEMAND, NEVER NARRATE THE TICK.
   It comes straight from the architecture: React already re-renders only on
   discrete events while the display samples per frame, and that same line is
   the right one for speech. An unlock becoming affordable is an event. The flux
   going from 7.601 to 7.602 is not, and a live region carrying it would produce
   continuous speech and be worse than silence.

   Nothing below contains a number, which is not a coincidence. A figure in an
   aria-label cannot carry a badge, so it would be a quantitative claim in
   player-facing text with no provenance attached, which is the exact thing
   CLAUDE.md hard rule 1 and the badge contract exist to prevent. Every number
   stays where a badge can reach it, and speech gets the event.
   =========================================================================== */

export const ANNOUNCEMENTS = {
  walled: {
    text: 'The pathway has stopped. NAD+ has run out.',
    badge: sourced(`${PART2}, the NAD+ constraint`),
  },
  recovered: {
    text: 'The pathway is running again.',
    badge: sourced(`${PART2}, glycolysis and fermentation`),
  },
} as const satisfies Readonly<Record<string, Entry>>;

/** An unlock has become affordable. Composed here, so no component writes prose. */
export function unlockAffordable(name: string): Entry {
  return { text: `${name} can now be expressed.`, badge: tuned(ABOUT_THE_BUILD) };
}

/** An unlock has been bought. */
export function unlockBought(name: string): Entry {
  return { text: `${name} is running.`, badge: tuned(ABOUT_THE_BUILD) };
}
