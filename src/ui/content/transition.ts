/**
 * The one irreversible decision in the game, as words.
 * UPDATELOGV14.md stage 3.
 *
 * ---------------------------------------------------------------------------
 * THIS IS THE LARGEST AUTHORED MOMENT IN THE GAME AND IT IS STILL SHORT
 * ---------------------------------------------------------------------------
 *
 * docs/CONTENT_STYLE.md Part 5 gives a one-screen surface three paragraphs and
 * this takes three. The temptation on the biggest beat in the project is to
 * spend more of them, and the reason not to is the rule DESIGN.md states in its
 * own terms: a concept carried by shape or colour must not also be carried by a
 * paragraph. The compartment is drawn. The words say what the choice is.
 *
 * ---------------------------------------------------------------------------
 * THE DIGEST PATH TEACHES AND DOES NOT SCOLD
 * ---------------------------------------------------------------------------
 *
 * docs/PROGRESSION.md is explicit that the soft lock is the lesson rather than a
 * punishment, so the text after digesting states what the cell got and what it
 * can no longer reach, and stops. No "you should have", no second chance framed
 * as mercy, and no enthusiasm about the meal to make the loss land harder. The
 * player made a real choice, they got exactly what it offered, and the undo is
 * offered in the same plain voice on both branches rather than only on the one
 * this build would prefer.
 *
 * ---------------------------------------------------------------------------
 * WHAT IS LOST IS NAMED, WITH THE MOLECULE THAT DOES IT
 * ---------------------------------------------------------------------------
 *
 * "Losing control silently reads as a bug; losing it with a stated reason reads
 * as biology", which is the stage's own sentence. So the kept branch names the
 * two enzymes the player bought and names citrate, and the badge points at
 * docs/SCIENCE.md Part 2, Regulation, which has said since the document was
 * written that phosphofructokinase-1 is allosterically inhibited by citrate.
 * The player can check it. That is the difference.
 *
 * NO TUNED NUMBER APPEARS IN A STRING HERE. The digest yield is rendered through
 * `Figure` with its Tuned badge, because a tuned number written into prose is a
 * quantitative claim with its provenance stripped off, which is the thing the
 * badge contract exists to make impossible.
 */

import { sourced, tuned } from '../components/Badge';
import type { Entry } from './common';
import { PART2, PART4, ABOUT_THE_BUILD } from './common';

export interface TransitionArrival {
  readonly heading: Entry;
  /** At most three, per docs/CONTENT_STYLE.md Part 5. */
  readonly body: readonly Entry[];
  readonly keep: Entry;
  readonly digest: Entry;
  readonly source: string;
}

export interface TransitionOutcome {
  readonly heading: Entry;
  readonly body: readonly Entry[];
  readonly dismiss: Entry;
  /** The undo, offered identically on both branches. */
  readonly undo: Entry;
  readonly undoNote: Entry;
  readonly source: string;
}

export const TRANSITION_ARRIVAL: TransitionArrival = {
  heading: {
    text: 'Something swam in',
    badge: sourced(`${PART4}, origin of mitochondria`),
  },
  body: [
    {
      text: 'There is a smaller cell inside this one and it is still alive. It carries its own genome, its own membranes and its own metabolism, and none of those are yours.',
      badge: sourced(
        `${PART4}, origin of mitochondria. Double membrane, own circular genome, division by binary fission`,
      ),
    },
    {
      text: 'Keep it and the cell gains a compartment. It also stops having full authority over its own glycolysis, because the thing that throttles the committed step is made in there.',
      badge: sourced(`${PART2}, Regulation. PFK-1 is inhibited by citrate`),
    },
    {
      text: 'Digest it and the cell gets a meal instead. There is no way back to this moment afterwards, so the state you are in right now has been kept.',
      badge: tuned(ABOUT_THE_BUILD),
    },
  ],
  keep: { text: 'Keep it', badge: tuned(ABOUT_THE_BUILD) },
  digest: { text: 'Digest it', badge: tuned(ABOUT_THE_BUILD) },
  source: `${PART4}, endosymbiosis`,
};

export const TRANSITION_KEPT: TransitionOutcome = {
  heading: {
    text: 'You kept it',
    badge: sourced(`${PART4}, origin of mitochondria`),
  },
  body: [
    {
      text: 'There is a membrane inside the cell now, and a space between it and the one outside. Nothing crosses it yet.',
      badge: sourced(`${PART4}, pyruvate transport into the matrix`),
    },
    {
      text: 'Phosphofructokinase-1 and pyruvate kinase have stopped paying. You still own them. What slows the first of them is citrate, and citrate is made in the compartment you do not have the genes for.',
      badge: sourced(
        `${PART2}, Regulation. PFK-1 is allosterically inhibited by ATP and citrate`,
      ),
    },
    {
      text: 'Moving those genes across is how the cell takes the control back. That is what the rest of this act is for.',
      badge: sourced(`${PART4}, endosymbiotic gene transfer to the host genome`),
    },
  ],
  dismiss: { text: 'Carry on', badge: tuned(ABOUT_THE_BUILD) },
  undo: { text: 'Put it back', badge: tuned(ABOUT_THE_BUILD) },
  undoNote: {
    text: 'This returns the cell to the moment before the choice. It works once.',
    badge: tuned(ABOUT_THE_BUILD),
  },
  source: `${PART2}, Regulation`,
};

export const TRANSITION_DIGESTED: TransitionOutcome = {
  heading: {
    text: 'You digested it',
    badge: tuned(ABOUT_THE_BUILD),
  },
  body: [
    {
      text: 'The cell broke it down and took the carbon. Added to the environment as glucose:',
      badge: tuned(
        'The size of the meal is a game decision. Nothing in docs/SCIENCE.md says what one cell is worth as food',
      ),
    },
    {
      text: 'There is no compartment, so every reaction this cell will ever run happens in the space it already had. The yield stays at 2 net ATP per glucose.',
      badge: sourced(`${PART2}, 4 ATP gross and 2 net per glucose`),
    },
    {
      text: 'That was the choice and this is what it gave. The state from before it is still here.',
      badge: tuned(ABOUT_THE_BUILD),
    },
  ],
  dismiss: { text: 'Carry on', badge: tuned(ABOUT_THE_BUILD) },
  undo: { text: 'Go back', badge: tuned(ABOUT_THE_BUILD) },
  undoNote: {
    text: 'This returns the cell to the moment before the choice. It works once.',
    badge: tuned(ABOUT_THE_BUILD),
  },
  source: `${PART2}, net per glucose`,
};

/**
 * What the live region says. Three events, not five.
 *
 * The arrival, and one per branch. The undo is not announced, because it is
 * followed immediately by a reload and the session that comes back announces
 * nothing about how it got there. UPDATELOGV7.md's rule: announce events, and
 * an event nobody is left in the room for is not one.
 */
export const TRANSITION_ANNOUNCEMENTS = {
  arrived: {
    text: 'Another cell has entered this one. Keep it or digest it.',
    badge: sourced(`${PART4}, origin of mitochondria`),
  },
  kept: {
    text: 'The endosymbiont was kept. The cell has a compartment, and the phosphofructokinase-1 and pyruvate kinase upgrade has stopped applying.',
    badge: sourced(`${PART2}, Regulation`),
  },
  digested: {
    text: 'The endosymbiont was digested. Its carbon went into the environment and the cell has no compartment.',
    badge: tuned(ABOUT_THE_BUILD),
  },
} as const satisfies Readonly<Record<string, Entry>>;
