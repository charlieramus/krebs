/**
 * The top bar. Three headline readouts and the wordmark.
 */

import { sourced, tuned } from '../components/Badge';
import type { Entry } from './common';
import { PART2 } from './common';

/* ===========================================================================
   THE TOP BAR
   =========================================================================== */

export const READOUTS = {
  atpRate: {
    text: 'ATP',
    badge: sourced(`${PART2}, 4 ATP gross and 2 net per glucose`),
  },
  glucoseRate: {
    text: 'Glucose',
    badge: tuned('Uptake rate is a tuned Vmax. The pathway it feeds is sourced'),
  },
  elapsed: {
    text: 'Elapsed',
    // docs/SCIENCE.md Part 1: "Real cells complete glycolysis in milliseconds.
    // Game time is arbitrary and does not map to any real timescale." Badging
    // the clock Sourced would imply a game-second means something.
    badge: tuned('Game time is arbitrary and maps to no real timescale, per docs/SCIENCE.md Part 1'),
  },
} as const satisfies Readonly<Record<string, Entry>>;

/**
 * The wordmark, which is the string in this game most likely to change and was
 * the one hardcoded in a component.
 *
 * Found by the guard in contentStyle.test.ts rather than by the audit that went
 * looking for exactly this, which is the argument for the guard. docs/BRIEF.md
 * still says the working title is TBD and DESIGN.md open question 1 records that
 * "krebs" names an act 3 mechanic that unlocks roughly four hours into a game
 * whose first 45 to 90 minutes are anaerobic. So the badge says the title is
 * provisional, and when one is chosen this is a one-line edit rather than a
 * search through the components.
 */
export const WORDMARK: Entry = {
  text: 'krebs',
  badge: tuned('The working title is still TBD. docs/BRIEF.md, and DESIGN.md open question 1'),
};
