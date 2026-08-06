/**
 * The first run, the about panel, and the disclosure both of them carry.
 */

import { sourced, tuned } from '../components/Badge';
import type { Entry } from './common';
import { PART1, PART2, ABOUT_THE_BUILD } from './common';

/* ===========================================================================
   DISCLOSURE

   docs/SCIENCE.md Part 1 requires this text in-game, in the about screen and on
   first launch, "not buried in a repo file". There is no about screen in the
   slice, so it goes on the act screen. Quoted verbatim rather than paraphrased,
   because a paraphrase of a required disclosure is not the required disclosure.
   =========================================================================== */

export const DISCLOSURE: Entry = {
  text: 'Reaction rates in this game use the Michaelis-Menten saturation curve, which is real. The specific speed and saturation values are tuned for playability and are not measured laboratory values. Stoichiometry, ATP yields, pathway order and enzyme names are accurate and sourced. Rates are not. Do not use this game as a reference for experimental work.',
  badge: sourced(`${PART1}, required disclosure text`),
};

/* ===========================================================================
   THE FIRST RUN AND THE ABOUT PANEL. UPDATELOGV6.md stage 3.

   ONE SCREEN, THREE PARAGRAPHS, AND IT NEVER BLOCKS THE SIMULATION. The cell is
   alive from t=0 and the tick loop does not wait for a reader. docs/PILLARS.md
   rule 2 forbids anything that exists to extend session length, and a gated
   multi-step tutorial in an idle game is usually exactly that. What is needed is
   smaller: what the player is running, what the currency is, and what counts as
   playing, before the first thing happens.

   THE DISCLOSURE IS INSIDE IT, VERBATIM. docs/SCIENCE.md Part 1 requires the
   text "in the about screen and on first launch". V3 had neither surface and put
   it in the act screen footer as a substitute. Both halves are now met literally
   rather than approximately: the first run carries it on first launch and the
   about panel carries it permanently. The words are untouched in both, because a
   paraphrase of a required disclosure is not the required disclosure.

   THERE IS NO INVENTED OBJECTIVE HERE. Act 1's real goal is to keep the pathway
   running and to find out what stops it, and the game ends after four acts per
   docs/PILLARS.md rule 1. A first run that promised a score or a target would be
   a worse failure than a first run that said nothing, because the player would
   play towards it.
   =========================================================================== */

/** docs/SCIENCE.md Part 6, the geological timeline. */
const PART6 = 'docs/SCIENCE.md Part 6';

export interface FirstRun {
  readonly heading: Entry;
  /** At most three, per docs/CONTENT_STYLE.md Part 5. */
  readonly body: readonly Entry[];
  readonly action: Entry;
  /** Mandatory, to the same contract a coach mark has. */
  readonly source: string;
}

export const FIRST_RUN: FirstRun = {
  heading: {
    text: 'This is one cell',
    badge: sourced(`${PART6}, microbial mats at roughly 3.48 to 3.43 Ga`),
  },
  body: [
    {
      text: 'A single cell, roughly 3.5 billion years ago, in water with no oxygen in it.',
      badge: sourced(
        `${PART6}, microbial mats at roughly 3.48 to 3.43 Ga, long before oxygen accumulated`,
      ),
    },
    {
      // Mixed provenance under the weaker badge, and the badge names both halves.
      // Same shape as UNLOCKS.glycolyticCapacity, which is the established way
      // this file handles a sentence that is half sourced and half modeled.
      text: 'ATP is the currency. The cell makes it by breaking glucose down, and spends it again on everything else it does.',
      badge: tuned(
        `Glycolysis making ATP is sourced, ${PART2}. That one reaction stands in for everything else a cell spends ATP on is not`,
      ),
    },
    {
      text: 'There is no score and nothing to click. The pathway runs by itself, and the game is about what stops it.',
      badge: tuned(
        'A statement about this build, not about biology. docs/PILLARS.md rule 2: nothing in the design exists to extend session length',
      ),
    },
  ],
  action: { text: 'Let it run', badge: tuned(ABOUT_THE_BUILD) },
  source: `${PART1}, required disclosure text`,
};

export const ABOUT = {
  /** The permanent affordance that reopens it. DESIGN.md: always visible. */
  open: {
    text: 'About',
    badge: tuned(ABOUT_THE_BUILD),
  },
  heading: {
    text: 'About this game',
    badge: tuned(ABOUT_THE_BUILD),
  },
  /**
   * What a badge means, which is item 12 of UPDATELOGV6.md's thirteen-item table
   * and was answered nowhere at all. It is a statement about the build, so it
   * lives on the one permanent surface that is about the build.
   */
  badges: {
    text: 'Every claim here carries a badge. Sourced means it traces to a published source and can be checked. Tuned means the game chose the number for pacing and says so.',
    badge: tuned(`${ABOUT_THE_BUILD}. DESIGN.md, The badge contract`),
  },
  close: {
    text: 'Close',
    badge: tuned(ABOUT_THE_BUILD),
  },
} as const satisfies Readonly<Record<string, Entry>>;
