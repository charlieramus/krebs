/**
 * The unlock shelf. Every slot, and the furniture around them.
 */

import { sourced, tuned } from '../components/Badge';
import type { Entry } from './common';
import { PART2, ABOUT_THE_BUILD } from './common';

/* ===========================================================================
   UNLOCKS

   Two, both finite. Labels only: the costs and thresholds are stage 6's and
   live in src/ui/tuning.ts, and every one of them renders with a Tuned badge.
   =========================================================================== */

export const UNLOCKS = {
  ferment: {
    text: 'Lactate dehydrogenase',
    // "oxidising", not "oxidizing". docs/CONTENT_STYLE.md Part 2 settles the
    // spelling at -ise and -yse, because this string used to render four inches
    // from an "oxidises" on the same shelf.
    badge: sourced(`${PART2}, lactate dehydrogenase reduces pyruvate to lactate, oxidising NADH`),
  },
  ethanolFerment: {
    text: 'Pyruvate decarboxylase',
    // Named for the enzyme that makes this branch a different branch. Alcohol
    // dehydrogenase is the step that touches NADH and it is the step the lactate
    // branch already has an equivalent of, so the decarboxylation is what the
    // player is actually buying. The detail line names the other one.
    badge: sourced(
      `${PART2}, pyruvate decarboxylase removes CO2 to give acetaldehyde and alcohol dehydrogenase reduces it to ethanol`,
    ),
  },
  pfk1Pk: {
    text: 'PFK-1 and pyruvate kinase',
    // Two enzymes in one slot, and the badge says which claim is sourced: that
    // these are two of the three regulated steps. That they have to be bought
    // together is a fact about this model's stability, not about a cell, and it
    // is in the detail line rather than dressed up as biology here.
    badge: sourced(
      `${PART2}, phosphofructokinase-1 is the committed step and pyruvate kinase is the third regulated step`,
    ),
  },
  glycogenStorage: {
    text: 'Glycogen synthase',
    // Named for the enzyme that builds the chain. ADP-glucose pyrophosphorylase
    // is the committed and regulated step and is the harder name; glycogen
    // phosphorylase is the other half of the purchase and is in the detail
    // line. docs/CONTENT_STYLE.md Part 5 gives a card title four words.
    badge: sourced(
      `${PART2}, glycogen synthase transfers a glucosyl unit onto the chain and glycogen phosphorylase takes it back off`,
    ),
  },
  uptakeCapacity: {
    text: 'Uptake capacity',
    badge: tuned('A finite ladder of transport steps. Neither the steps nor their number is sourced'),
  },
  glycolyticCapacity: {
    text: 'Glycolytic capacity',
    // One purchase raising both phases, because the preparatory phase spends the
    // ATP the payoff phase makes and raising it alone bankrupts the cell. The
    // 2:1 relationship IS sourced, in Part 2: one glucose becomes two trioses,
    // so the payoff phase runs twice per preparatory turn. What is tuned is the
    // rungs. The badge names the sourced half and the tuned half separately.
    badge: tuned(
      'The payoff phase runs twice per preparatory turn, which is sourced. How much capacity each rung buys is not',
    ),
  },
} as const satisfies Readonly<Record<string, Entry>>;

/* ===========================================================================
   THE UNLOCK SHELF. Moved here by UPDATELOGV6.md stage 6.

   ELEVEN STRINGS THAT HAD BEEN RENDERED FROM A COMPONENT FILE SINCE V3. The
   rule that every player-facing string lives in this file was written down in
   V3, restated in docs/CONTENT_STYLE.md Part 1 and never enforced, and this is
   where it was broken. A string in a component is a string nobody can audit,
   because the audit reads one file.

   Two corrections came with the move rather than after it. "The investment
   phase" was a third name for the preparatory phase, on a card sitting under an
   arrow labelled "Preparatory phase"; docs/CONTENT_STYLE.md Part 3 bans it. And
   "oxidises" here disagreed with "oxidizing" in the badge two entries above.
   =========================================================================== */

export const SHELF = {
  heading: {
    text: 'Unlocks',
    badge: tuned(ABOUT_THE_BUILD),
  },
  /** The progress readout's unit, beside a Figure that carries the badge. */
  progressUnit: {
    text: 'ATP made',
    badge: sourced(`${PART2}, cumulative ATP produced by the pathway`),
  },
  /** The word between the two figures in "60 of 55 ATP made". */
  progressOf: {
    text: 'of',
    badge: tuned(ABOUT_THE_BUILD),
  },
  /** What a bought slot's button says. Not an action, a state. */
  bought: {
    text: 'Running',
    badge: tuned(ABOUT_THE_BUILD),
  },

  fermentDetail: {
    text: 'Reduces pyruvate to lactate and oxidises NADH back to NAD+. Produces no ATP.',
    badge: sourced(`${PART2}, fermentation produces zero additional ATP`),
  },
  fermentBuy: {
    text: 'Express it',
    badge: tuned(ABOUT_THE_BUILD),
  },

  ethanolDetail: {
    // THREE CLAIMS IN TWO SENTENCES, AND THE ORDER IS THE POINT. What differs
    // comes first, because that is what the player is choosing between. What is
    // the same comes second, because that is the beat: both branches recycle
    // NAD+ and neither makes ATP, so the choice is about what the cell keeps
    // rather than about which is better. docs/PROGRESSION.md act 1 item 8.
    //
    // "exactly like lactate" rather than "unlike" anything. The sentence must
    // not read as this branch being the upgrade, because it is not one, and a
    // comparative would put a thumb on a scale that is level.
    text: 'The other way out of pyruvate: two carbons stay as ethanol and one leaves as gas. Recycles NAD+ and makes no ATP, exactly like lactate.',
    badge: sourced(`${PART2}, ethanol fermentation yields no ATP and releases one CO2 per pyruvate`),
  },
  ethanolLocked: {
    text: 'Opens once the cell has a way to recycle NAD+ at all.',
    badge: tuned(ABOUT_THE_BUILD),
  },
  ethanolBuy: {
    // NOT "Express it", which is the slot to the left. Two buttons reading the
    // same two words side by side is the defect V3 stage 4 found on the two
    // capacity slots, and it is worse read aloud than on screen.
    text: 'Open the other route',
    badge: tuned(ABOUT_THE_BUILD),
  },

  pfk1PkDetail: {
    // THE ACT'S CENTRAL CLAIM, ARRIVING FOR THE THIRD TIME. Fermentation made
    // it, the two capacity ladders made it, and a named enzyme is the version a
    // player is most likely to expect to be false: an enzyme upgrade sounds like
    // it should make the cell better at extracting energy, and it makes it
    // faster at moving the same amount.
    //
    // The first sentence is why the two are one purchase. It is a statement
    // about this pathway rather than about this build: two trioses per glucose
    // means the payoff phase runs twice per preparatory turn, so it has to have
    // room before the preparatory phase is given more.
    text: 'Both at once, because the exit has to widen before the entrance can. More throughput, and what one glucose is worth does not move.',
    badge: tuned(
      'That these are two of the three regulated steps is sourced. That raising one without the other kills this cell is measured, not biology',
    ),
  },
  pfk1PkLocked: {
    text: 'Opens once uptake is at the top of its ladder.',
    badge: tuned(ABOUT_THE_BUILD),
  },
  pfk1PkBuy: {
    text: 'Express both',
    badge: tuned(ABOUT_THE_BUILD),
  },

  glycogenDetail: {
    // A BUFFER IS NOT A YIELD, and the second sentence is the whole of it: it
    // says what the purchase does not do, which is the only thing every other
    // slot on this shelf says it does. It is also the one purchase in act 1
    // whose ATP per second goes DOWN when it is bought, measured at 42.217 to
    // 41.187, so the sentence has to be true about that rather than soften it.
    text: 'Stores glucose while there is spare and gives it back when there is not. Costs ATP, makes none, and buys no yield.',
    badge: sourced(`${PART2}, a store and retrieve cycle costs 1 ATP equivalent and yields nothing`),
  },
  glycogenLocked: {
    text: 'Opens once glycolysis is at the top of its ladder.',
    badge: tuned(ABOUT_THE_BUILD),
  },
  glycogenBuy: {
    text: 'Build a reserve',
    badge: tuned(ABOUT_THE_BUILD),
  },

  uptakeDetail: {
    text: 'More transport across the membrane. A fixed number of steps, and this is not the last.',
    badge: tuned('A finite ladder. Neither the steps nor their number is sourced'),
  },
  uptakeDone: {
    text: 'At the top of the ladder. Uptake is no longer the limiting step.',
    badge: tuned('Measured at the shipped tuning, not derived. docs/ECONOMY.md row U7'),
  },
  uptakeBuy: {
    text: 'Add capacity',
    badge: tuned(ABOUT_THE_BUILD),
  },

  glycolysisDetail: {
    // WAS "The investment phase cannot be raised without the phase that pays it
    // back". docs/PROGRESSION.md calls it the investment phase in design prose
    // and the pathway calls it the preparatory phase, and two names for one
    // arrow is a puzzle handed to the player for nothing.
    text: 'Both phases of glycolysis together. The preparatory phase cannot be raised without the phase that pays it back.',
    badge: sourced(`${PART2}, the payoff phase runs twice per preparatory turn`),
  },
  glycolysisLocked: {
    // WAS "Opens once uptake is at the top of its ladder". Correct until
    // UPDATELOGV10.md stage 4 put the two enzyme purchases between the ladders
    // and gated this one behind them, because this ladder raises transport and
    // drops the enzymes from 12.96 percent to 2.37 the moment it does.
    text: 'Opens once the named enzymes are running.',
    badge: tuned(`${ABOUT_THE_BUILD}. The ladders and the enzymes are sequential by design`),
  },
  glycolysisDone: {
    text: 'At the top of the ladder. Both phases are running as fast as act 1 allows.',
    badge: tuned('The top of the ladder is a tuned stopping point, not a real ceiling'),
  },
  glycolysisBuy: {
    // NOT "Add capacity", which is the slot to the left's label. V3's stage 4
    // browser check found two buttons reading the same three words side by side,
    // which is a worse problem read aloud than it is read on screen.
    text: 'Raise both phases',
    badge: tuned(ABOUT_THE_BUILD),
  },
} as const satisfies Readonly<Record<string, Entry>>;
