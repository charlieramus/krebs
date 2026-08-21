/**
 * The endosymbiosis set piece. UPDATELOGV14.md stage 3.
 *
 * ---------------------------------------------------------------------------
 * THE LARGEST AUTHORED MOMENT IN THE GAME
 * ---------------------------------------------------------------------------
 *
 * A stranger swims in and the player decides whether to eat it. Every other
 * decision in this game is a purchase. This one is the single hard transition
 * docs/PROGRESSION.md allows, it happens once, and the game has no second one to
 * fall back on if it lands badly.
 *
 * ---------------------------------------------------------------------------
 * THE DIGEST PATH TEACHES AND DOES NOT SCOLD, AND THAT IS THE HARD PART
 * ---------------------------------------------------------------------------
 *
 * docs/PROGRESSION.md is explicit that the soft lock is a teaching moment about
 * short-term against structural gains rather than a punishment. So the text
 * after digesting has three jobs and only three: say what the player got, say
 * what it cost, and say that it can be undone. It does not say they were wrong,
 * it does not say "unfortunately", and it does not perform disappointment.
 *
 * **They made a real choice and they got exactly what it offered.** A game that
 * offers a choice and then editorialises about it did not offer a choice.
 *
 * The one thing the text is allowed to be firm about is the fact: this is where
 * this cell's line ends. That is not a judgement, it is what happened, and
 * hiding it would be worse than saying it plainly.
 *
 * ---------------------------------------------------------------------------
 * WHAT IS LOST HAS TO BE SAID OUT LOUD
 * ---------------------------------------------------------------------------
 *
 * Keeping the endosymbiont takes some direct control away, because it has its
 * own genome. An idle game that removes an upgrade is doing something unusual,
 * and **losing control silently reads as a bug while losing it with a stated
 * reason reads as biology.** The kept path therefore names the loss in the same
 * breath as the gain, before the player can discover it by finding a control
 * that stopped working.
 *
 * ---------------------------------------------------------------------------
 * BADGES
 * ---------------------------------------------------------------------------
 *
 * The biology is Sourced to docs/SCIENCE.md Part 4. The timing and the
 * "mitochondria early or late" question are Contested, and Part 6 stop 5 already
 * has both sides authored, which is V12's provenance work paying for itself. The
 * payout figure and the soft lock are statements about this build.
 */

import { contested, sourced, tuned } from '../components/Badge';
import type { Entry } from './common';
import { ABOUT_THE_BUILD } from './common';

/** docs/SCIENCE.md Part 4, endosymbiosis and aerobic respiration. */
export const PART4 = 'docs/SCIENCE.md Part 4';
/** The contested topic V12 authored, which this set piece is the first thing to use. */
export const ENDOSYMBIOSIS_CONTESTED = 'docs/SCIENCE.md Part 6, stop 5';

export interface TransitionArrival {
  readonly heading: Entry;
  /** At most three, per docs/CONTENT_STYLE.md Part 5. */
  readonly body: readonly Entry[];
  readonly keep: Entry;
  readonly digest: Entry;
  readonly source: string;
}

/**
 * The arrival. Neither option is recommended and neither is styled as the
 * default, because a set piece that has already decided is not a decision.
 *
 * What the text does give the player is the shape of the trade, in the terms the
 * game has been using all along: one is a structure and one is a number.
 */
export const TRANSITION_ARRIVAL: TransitionArrival = {
  heading: {
    text: 'Something else is inside you',
    badge: sourced(`${PART4}, origin of mitochondria`),
  },
  body: [
    {
      text: 'A smaller cell is in your cytosol and it is intact. It has its own membrane, its own circular genome and its own ribosomes, and it is running a version of respiration you cannot do.',
      badge: sourced(`${PART4}, the physical evidence for an alphaproteobacterial endosymbiont`),
    },
    {
      text: 'You can break it down. It is made of the same things you are, so that returns a large amount of usable material at once, and then it is gone.',
      badge: tuned(ABOUT_THE_BUILD),
    },
    {
      text: 'Or you can leave it alone and find out what it does. Nobody agrees on when this happened or on whether the host was already complex when it did.',
      badge: contested(ENDOSYMBIOSIS_CONTESTED),
    },
  ],
  keep: { text: 'Leave it alone', badge: sourced(`${PART4}, origin of mitochondria`) },
  digest: { text: 'Break it down', badge: tuned(ABOUT_THE_BUILD) },
  source: `${PART4}, origin of mitochondria`,
};

export interface TransitionAftermath {
  readonly heading: Entry;
  readonly body: readonly Entry[];
  readonly action: Entry;
  readonly source: string;
}

/**
 * After keeping. The gain and the loss in the same breath.
 *
 * The loss is named before the player can find it, and the reason is given in
 * the same sentence, because the reason is what makes it read as biology rather
 * than as a bug. The third paragraph is the promise that it comes back, which is
 * true: endosymbiotic gene transfer is a real mechanism and a real act 3 unlock.
 */
export const TRANSITION_KEPT: TransitionAftermath = {
  heading: {
    text: 'You have a compartment',
    badge: sourced(`${PART4}, the two membranes and which one is the barrier`),
  },
  body: [
    {
      text: 'There is now an inside to your inside. It has a membrane that nothing crosses without a carrier, and that membrane is the thing everything after this depends on.',
      badge: sourced(`${PART4}, the two membranes and which one is the barrier`),
    },
    {
      text: 'Some of your controls no longer respond. The genes for what happens in there are in its genome and not in yours, so you own the compartment and you do not yet run it.',
      badge: sourced(`${PART4}, endosymbiotic gene transfer`),
    },
    {
      text: 'You get them back by moving its genes into your own genome, which is what actually happened. Most of that genome ended up in the host and only a handful of genes stayed behind.',
      badge: sourced(`${PART4}, endosymbiotic gene transfer`),
    },
  ],
  action: { text: 'Look inside', badge: tuned(ABOUT_THE_BUILD) },
  source: `${PART4}, origin of mitochondria`,
};

/**
 * After digesting. Three sentences, no scolding, and the undo offered plainly.
 *
 * The first says what they got. The second says what it cost, as a fact rather
 * than as a verdict. The third says it can be taken back, and it is offered
 * without arguing for it, because a player who meant to do this should not have
 * to read a paragraph about why they were wrong.
 */
export const TRANSITION_DIGESTED: TransitionAftermath = {
  heading: {
    text: 'You broke it down',
    badge: tuned(ABOUT_THE_BUILD),
  },
  body: [
    {
      text: 'It was a whole cell and now it is material you can use. That is the largest single return you have ever had.',
      badge: tuned(ABOUT_THE_BUILD),
    },
    {
      text: 'It was also the only one of those you were ever going to meet. Every cell that went on to breathe oxygen kept theirs, and this line stops here.',
      badge: sourced(`${PART4}, origin of mitochondria`),
    },
    {
      text: 'That decision can be taken back. It is the only one in this game that can.',
      badge: tuned(ABOUT_THE_BUILD),
    },
  ],
  action: { text: 'Take it back', badge: tuned(ABOUT_THE_BUILD) },
  source: `${PART4}, origin of mitochondria`,
};

/**
 * What the live region says, once per event.
 *
 * V7's rule: announce events, expose rates on demand, never narrate the tick.
 * This is the largest event in the game and it is still one sentence, for the
 * same reason the act boundary's is.
 */
export const TRANSITION_ANNOUNCEMENTS: Readonly<Record<string, Entry>> = {
  arrived: {
    text: 'Another cell is inside yours. You can keep it or break it down.',
    badge: sourced(`${PART4}, origin of mitochondria`),
  },
  kept: {
    text: 'You kept it. You have a compartment, and some controls no longer respond.',
    badge: sourced(`${PART4}, endosymbiotic gene transfer`),
  },
  digested: {
    text: 'You broke it down. The material is yours and this line stops here. It can be taken back.',
    badge: tuned(ABOUT_THE_BUILD),
  },
  undone: {
    text: 'That is undone. The cell is back to where it was before the choice.',
    badge: tuned(ABOUT_THE_BUILD),
  },
};
