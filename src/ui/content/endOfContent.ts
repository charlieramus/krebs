/**
 * The act boundary, and the state on the other side of it.
 * UPDATELOGV11.md stage 4.
 *
 * ---------------------------------------------------------------------------
 * THIS SCREEN EXISTS BECAUSE ACT 2 IS FOUR LOGS AWAY
 * ---------------------------------------------------------------------------
 *
 * `docs/designs/game-spine-and-four-acts.md` schedules act 2 last, so a player
 * who finishes act 1 on the deployed build has nowhere to go, and that is the
 * state the game will be in for most of the remaining roadmap. It is also the
 * state any cold reader will see if they get that far.
 *
 * So it is authored rather than left to happen. A screen that keeps ticking
 * after the last content with nothing saying so reads as the game breaking, and
 * NOW.md has carried the smaller version of this since V5: content ends at
 * 54m03s and the food lasts to 93m07s, with nothing saying the act is over.
 *
 * ---------------------------------------------------------------------------
 * THE CELL IS STILL RUNNING UNDERNEATH AND THE TEXT HAS TO SAY SO
 * ---------------------------------------------------------------------------
 *
 * Same rule the first run holds. An idle game that stops when its content stops
 * has told the player something false about what it is, so the overlay is
 * undimmed, the simulation keeps ticking, and the second paragraph says out loud
 * that it will keep going. docs/CONTENT_STYLE.md Part 5's ceiling for a one
 * screen surface applies: three paragraphs, and it uses three.
 *
 * ---------------------------------------------------------------------------
 * IT DOES NOT PROMISE ANYTHING AND IT DOES NOT CONGRATULATE
 * ---------------------------------------------------------------------------
 *
 * docs/CONTENT_STYLE.md Part 2 bans the exclamation mark and the game does not
 * perform enthusiasm. It also does not say "coming soon", because a build with
 * no date attached saying "soon" is a claim nobody has made. What it says is
 * where the game currently ends, which is true, checkable, and the thing a
 * player at this point actually wants to know.
 */

import { sourced, tuned } from '../components/Badge';
import type { Entry } from './common';
import { PART2, ABOUT_THE_BUILD } from './common';

export interface EndOfContent {
  readonly heading: Entry;
  /** At most three, per docs/CONTENT_STYLE.md Part 5. */
  readonly body: readonly Entry[];
  readonly action: Entry;
  /** Mandatory, to the same contract a coach mark and the first run have. */
  readonly source: string;
}

export const END_OF_CONTENT: EndOfContent = {
  heading: {
    text: 'That is all of act 1',
    badge: tuned(ABOUT_THE_BUILD),
  },
  body: [
    {
      text: 'Every enzyme act 1 has to offer has been built. The cell is running the fastest anaerobic glycolysis it can, down both fermentation branches, with a glycogen reserve behind it.',
      badge: sourced(`${PART2}, glycolysis and both fermentation branches`),
    },
    {
      text: 'The yield did not move. It is still 2 net ATP per glucose, exactly as it was at the first purchase, because nothing on the shelf changes what one glucose is worth without oxygen.',
      badge: sourced(`${PART2}, 4 ATP gross and 2 net per glucose`),
    },
    {
      text: 'The cell keeps running from here, and this build ends here. Act 2 is where the oxygen arrives.',
      badge: tuned(
        `${ABOUT_THE_BUILD}. Act 2 is planned and not built, see docs/PROGRESSION.md`,
      ),
    },
  ],
  action: { text: 'Keep watching it', badge: tuned(ABOUT_THE_BUILD) },
  source: `${PART2}, net per glucose`,
};

/**
 * What the live region says when the act ends. Once, and it does not narrate the
 * set piece.
 *
 * UPDATELOGV7.md's rule holds: announce events, expose rates on demand, never
 * narrate the tick. This is the single most significant event in the game so
 * far and it is still one sentence.
 */
export const ACT_COMPLETE_ANNOUNCEMENT: Entry = {
  text: 'Act 1 is complete. Every unlock has been built and the cell is still running.',
  badge: tuned(ABOUT_THE_BUILD),
};
