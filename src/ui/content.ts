/**
 * Every player-facing string in the slice, in one file, each paired with its
 * badge.
 *
 * ---------------------------------------------------------------------------
 * docs/CONTENT_STYLE.md GOVERNS EVERY STRING BELOW
 * ---------------------------------------------------------------------------
 *
 * V3 wrote this file with no voice on purpose, because the document that decides
 * the voice did not exist and inventing a tone before it landed meant rewriting
 * all of it twice. That document exists as of UPDATELOGV6.md stage 1. Voice,
 * person, naming, numbers in prose and a length ceiling per surface are all
 * settled there, and a string that disagrees with it is wrong rather than
 * stylish. The restraint V3 recorded still holds where it applies: molecule
 * names come from src/content/act1/pools.ts and are reused here rather than
 * restated, so the interface and the simulation cannot drift into calling the
 * same pool two different things.
 *
 * ---------------------------------------------------------------------------
 * EVERY STRING CARRIES A BADGE, INCLUDING THE ONES WITHOUT NUMBERS
 * ---------------------------------------------------------------------------
 *
 * DESIGN.md applies the badge to every quantitative claim. This file goes wider
 * and badges every string, because a molecule name and a reaction name are
 * claims too: "Glyceraldehyde 3-phosphate is what the preparatory phase hands
 * to the payoff phase" is checkable, and the badge is where a reader finds out
 * whether anyone checked it. Where a name is really a modeling decision rather
 * than biology, the badge says Tuned and says why, which is the case that would
 * otherwise pass silently.
 *
 * Numbers in strings are rare on purpose. Where one appears it traces to a
 * NAMED SECTION of docs/SCIENCE.md rather than to a line number, because V5
 * found five line citations that had drifted 42 lines and all five had landed in
 * the wrong Part. docs/CONTENT_STYLE.md Part 1 makes that a rule.
 */

import { sourced, tuned, type BadgeSpec } from './components/Badge';
import { MIN_POLYGON_SIDES } from './components/Blob';
import type { Act1PoolId } from '../content/act1/pools';
import type { Act1ReactionId } from '../content/act1/reactions';

export interface Entry {
  readonly text: string;
  readonly badge: BadgeSpec;
}

/** docs/SCIENCE.md Part 2, glycolysis and the NAD+ constraint. */
const PART2 = 'docs/SCIENCE.md Part 2';
/** docs/SCIENCE.md Part 1, the disclosed simplifications. */
const PART1 = 'docs/SCIENCE.md Part 1';

/**
 * The Tuned reason for a string that is a statement about the BUILD rather than
 * about a cell. Declared here rather than beside the save strings that first
 * needed it, because the first run and the about panel need it too and a module
 * constant used above its declaration is a temporal dead zone error at import.
 */
const ABOUT_THE_BUILD = 'A statement about this build, not about biology';

/* ===========================================================================
   MOLECULES

   Names, and nothing that reads as a description. Every one of these is the
   label already carried by src/content/act1/pools.ts, so the interface and the
   simulation cannot drift into calling the same pool two different things.
   =========================================================================== */

export const MOLECULES: Readonly<Record<Act1PoolId, Entry>> = {
  glucose_env: {
    text: 'Glucose (environment)',
    // Not a molecule name claim but a modeling one: the environment is a finite
    // pool the cell draws down, which is a decision about the game rather than
    // a fact about a cell in a mat.
    badge: tuned('The environment is modeled as a finite pool so uptake has something to deplete'),
  },
  glucose: { text: 'Glucose', badge: sourced(PART2) },
  g3p: { text: 'Glyceraldehyde 3-phosphate', badge: sourced(PART2) },
  pyruvate: { text: 'Pyruvate', badge: sourced(PART2) },
  lactate: { text: 'Lactate', badge: sourced(PART2) },
  ethanol: { text: 'Ethanol', badge: sourced(`${PART2}, ethanol fermentation`) },
  co2: { text: 'Carbon dioxide', badge: sourced(`${PART2}, ethanol fermentation`) },
  glycogen: { text: 'Glycogen', badge: sourced(`${PART2}, glycogen and what storage costs`) },
  nad: { text: 'NAD+', badge: sourced(PART2) },
  nadh: { text: 'NADH', badge: sourced(PART2) },
  atp: { text: 'ATP', badge: sourced(PART2) },
  adp: { text: 'ADP', badge: sourced(PART2) },
  pi: { text: 'Phosphate', badge: sourced(PART2) },
};

/**
 * The two carrier pairs share a card each, because their sum is the conserved
 * quantity and the sum is what teaches. Watching NAD+ drain while NADH fills on
 * one card is the wall arriving; watching them on two cards is two unrelated
 * numbers.
 */
export const CARRIER_PAIRS: Readonly<Record<'nicotinamide' | 'adenylate', Entry>> = {
  nicotinamide: { text: 'NAD+ / NADH', badge: sourced(PART2) },
  adenylate: { text: 'ATP / ADP', badge: sourced(PART2) },
};

/**
 * The ethanol branch makes both of these at once, one apiece, so they share a
 * card for the same reason the carrier pairs do. Two of pyruvate's carbons stay
 * and one leaves, and the pair is what says so.
 */
export const BRANCH_PRODUCTS: Readonly<Record<'ethanol', Entry>> = {
  ethanol: { text: 'Ethanol / CO2', badge: sourced(`${PART2}, ethanol fermentation`) },
};

/* ===========================================================================
   REACTIONS
   =========================================================================== */

export const REACTIONS: Readonly<Record<Act1ReactionId, Entry>> = {
  uptake: {
    text: 'Uptake',
    // No transporter is named and no energetic cost is charged. That is a
    // disclosed simplification rather than an omission, so the badge points at
    // the disclosure rather than claiming a mechanism.
    badge: sourced(`${PART1}, glucose uptake is modeled as untyped transport`),
  },
  prep: { text: 'Preparatory phase', badge: sourced(`${PART2}, steps 1 to 5`) },
  payoff: { text: 'Payoff phase', badge: sourced(`${PART2}, steps 6 to 10`) },
  ferment: { text: 'Lactate fermentation', badge: sourced(`${PART2}, fermentation`) },
  ferment_ethanol: {
    text: 'Ethanol fermentation',
    // One arrow standing for two enzymes, which is the same posture `prep` and
    // `payoff` take for five each. The badge names the pathway rather than an
    // enzyme, because naming one of the two would say the other is not there.
    badge: sourced(`${PART2}, ethanol fermentation`),
  },
  store: {
    text: 'Glycogen synthesis',
    // The stoichiometry is sourced and the placement of the cost is not. See
    // the `store` comment in src/content/act1/reactions.ts and the structural departure in docs/ECONOMY.md: the
    // real cycle costs 2 ATP in and refunds 1 on the way out, this charges the
    // net of 1 at the front, and the badge says which half is which.
    badge: tuned(
      'Storing and retrieving a glucose really costs 1 ATP equivalent, which is sourced. Charging all of it at the storing end is not',
    ),
  },
  mobilise: {
    text: 'Glycogen breakdown',
    badge: sourced(`${PART2}, glycogen phosphorylase spends no ATP`),
  },
  maintain: {
    text: 'Maintenance',
    // The stoichiometry is real: ATP hydrolyses to ADP and inorganic phosphate.
    // What is invented is that the whole rest of cellular metabolism is one
    // saturating reaction in ATP, and since UPDATELOGV5.md stage 2, that its
    // response is cooperative. The badge below says the invented part out loud
    // and does not name a curve, which is why it did not have to change.
    badge: tuned(
      'ATP hydrolysis to ADP and phosphate is real. Standing in for the entire rest of cellular metabolism with one reaction is not',
    ),
  },
};

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

/* ===========================================================================
   THE COACH MARK

   One, on the carrier card. DESIGN.md's anatomy: heading with badge, at most
   two paragraphs, an action, and a mandatory source row.

   TWO PARAGRAPHS IS A HARD CEILING and this fits inside it, which is a finding
   rather than an accident: the constraint is genuinely one idea. The pool is
   small and fixed, and the payoff phase is the only thing that spends it. What
   did NOT fit is the part players find most surprising, that fermentation buys
   throughput and buys exactly zero yield. That is reported in stage 3 rather
   than crammed in, and it belongs on the unlock or in a teaching panel.
   =========================================================================== */

/**
 * What a coach mark's action button does.
 *
 * DESIGN.md's anatomy makes the action row part of a coach mark, so it is not
 * optional and this is how a mark with nothing to sell still has one. Two of the
 * three marks escalate to the teaching panel instead, which is the escalation
 * docs/CONTENT_STYLE.md Part 5 describes: a concept that will not fit its
 * ceiling moves up one surface rather than overflowing.
 */
export type CoachMarkAction = 'buy-ferment' | 'open-panel';

export interface CoachMark {
  readonly heading: Entry;
  readonly body: readonly Entry[];
  readonly action: Entry;
  readonly actionKind: CoachMarkAction;
  /** Mandatory. DESIGN.md: a coach mark without a source row does not ship. */
  readonly source: string;
}

/** The mark's own furniture. DESIGN.md's 16px info affordance and the way out. */
export const COACH = {
  affordance: { text: 'i', badge: tuned(ABOUT_THE_BUILD) },
  dismiss: { text: 'Dismiss', badge: tuned(ABOUT_THE_BUILD) },
} as const satisfies Readonly<Record<string, Entry>>;

export const NAD_COACH_MARK: CoachMark = {
  heading: { text: 'NAD+ has run out', badge: sourced(`${PART2}, the NAD+ constraint`) },
  body: [
    {
      text: 'The payoff phase reduces NAD+ to NADH, and it is the only reaction here that spends NAD+. The pool is small and fixed, so once it is all NADH the pathway stops.',
      badge: sourced(`${PART2}, the NAD+ constraint`),
    },
    {
      text: 'Glucose is still arriving and the cell is still full of it. This is not starvation. Nothing is recycling the carrier.',
      badge: sourced(`${PART2}, glycolysis halts within seconds regardless of glucose availability`),
    },
  ],
  action: {
    text: 'Show me what recycles it',
    badge: sourced(`${PART2}, fermentation exists to regenerate NAD+`),
  },
  actionKind: 'buy-ferment',
  source: `${PART2}, the NAD+ constraint`,
};

/* ===========================================================================
   THE TEACHING LAYER. UPDATELOGV6.md stage 4.

   TWO MORE COACH MARKS AND THE TEACHING PANEL DESIGN.md HAS SPECIFIED SINCE
   2026-07-28. The two-paragraph ceiling has never bound, because there has only
   ever been one mark and V3 reported that the NAD+ constraint is genuinely one
   idea. It binds now, and the thing it binds against is the one V3 named when it
   said what did not fit: that fermentation buys throughput and buys exactly zero
   yield. That went to the panel rather than being crammed into a bubble.

   THE PANEL IS DISCHARGING TWO EXPLICIT INSTRUCTIONS FROM docs/SCIENCE.md, NOT
   ANSWERING A DESIGN PREFERENCE. Part 2 says of the net figure: "This is worth
   surfacing in-game because the gross figure of 4 is a common point of
   confusion." And of fermentation: "Framing it as an energy pathway is a common
   misconception and the game should correct it directly." Both are orders to the
   interface and neither had been carried out.
   =========================================================================== */

/**
 * Sides equal carbons, on the card where the arithmetic is visible.
 *
 * DESIGN.md's argument for illustration rule 1 is that a player told once that a
 * six-sided blob has six carbons can read the whole pathway from then on. Told
 * ONCE. Nothing in the game had ever told them, so the design's central claim
 * was being made to nobody. This is the once, and the g3p card is where it goes,
 * because the split is the only place the arithmetic is on screen.
 */
export const CARBON_COACH_MARK: CoachMark = {
  heading: {
    text: '6 carbons, split in two',
    badge: sourced(`${PART2}, glycolysis, one glucose is cleaved into two trioses`),
  },
  body: [
    {
      text: 'Every blob on this screen has one side per carbon, so glucose has 6 sides and this has 3.',
      // The counts are sourced and the drawing convention is not, which is the
      // distinction this badge exists to keep. Same shape as the mixed-provenance
      // badges elsewhere in this file.
      badge: tuned(
        `Carbon counts are sourced, ${PART2}. Drawing a carbon as a side is this game's convention and is not`,
      ),
    },
    {
      text: 'The preparatory phase splits one glucose into two of these, so the payoff phase runs twice for every turn the preparatory phase takes.',
      badge: sourced(`${PART2}, glycolysis, the payoff phase runs on each of two fragments`),
    },
  ],
  action: {
    text: 'Show me the yield',
    badge: sourced(`${PART2}, 4 ATP gross and 2 net per glucose`),
  },
  actionKind: 'open-panel',
  source: `${PART2}, glycolysis`,
};

/**
 * What ATP is, on the card that shows it not going up.
 *
 * THE CLOSED ADENYLATE POOL IS NOT SOURCED AND THE BADGE SAYS SO. docs/SCIENCE.md
 * says nothing about the adenylate total being fixed, and a real cell synthesises
 * adenine nucleotides. What IS sourced is the stoichiometry: every reaction in
 * act 1 converts one of the pair into the other, so under this pathway the sum
 * does not move. Closing the pool is the game's decision and it has a structural
 * entry in docs/ECONOMY.md rather than a row. Writing a plausible Sourced badge
 * here would have been the failure the badge contract exists to prevent.
 */
export const ATP_COACH_MARK: CoachMark = {
  heading: {
    text: 'ATP does not pile up',
    badge: tuned(
      `Every act 1 reaction converts one of the pair into the other, which is sourced, ${PART2}. That the total is closed is this game's model of a cell`,
    ),
  },
  body: [
    {
      text: 'ATP and ADP are one pool. Making ATP spends ADP and spending ATP makes ADP back, so the two always add up to the same number.',
      badge: tuned(
        `The conversions are sourced, ${PART2}. A cell with a fixed adenylate total is a simplification this game makes`,
      ),
    },
    {
      text: 'So the amount is not a score. Everything else the cell does spends ATP again, and what changes is how fast it arrives.',
      badge: tuned(
        'One reaction stands in for everything else a cell spends ATP on. See the Maintenance step on the pathway',
      ),
    },
  ],
  action: {
    text: 'Show me the yield',
    badge: sourced(`${PART2}, 4 ATP gross and 2 net per glucose`),
  },
  actionKind: 'open-panel',
  source: `${PART2}, glycolysis`,
};

/* ===========================================================================
   THE TEACHING PANEL

   DESIGN.md's screen inventory: "overlay for concepts too long for a bubble".
   Same contract a coach mark has, a heading with a badge and a mandatory source
   row, and docs/CONTENT_STYLE.md Part 5 caps it at 6 paragraphs and 1400
   characters. Longer than two paragraphs is the whole reason it exists. It is
   not unbounded, and a concept that will not fit here is two concepts.

   THIS IS SUCCESS CONDITION 2 IN ACT 1 FORM. docs/PILLARS.md wants a player who
   can explain why aerobic respiration yields roughly fifteen times more ATP than
   fermentation. Act 1 cannot make that comparison, because it has one pathway.
   What it can do is establish the half of the claim that is in front of the
   player: what one glucose is worth here, that nothing on the shelf changes it,
   and that fermentation adds none of it.
   =========================================================================== */

export interface TeachingPanel {
  readonly heading: Entry;
  readonly body: readonly Entry[];
  /** Mandatory, to the same contract a coach mark has. */
  readonly source: string;
  readonly close: Entry;
}

export const YIELD_PANEL: TeachingPanel = {
  heading: {
    text: 'What one glucose is worth',
    badge: sourced(`${PART2}, net per glucose`),
  },
  body: [
    {
      text: 'The preparatory phase spends 2 ATP to split one glucose into two 3-carbon pieces. The payoff phase makes 2 ATP from each piece. That is 4 made and 2 spent, so 2 net.',
      badge: sourced(`${PART2}, glycolysis, 4 ATP gross and 2 net per glucose`),
    },
    {
      // docs/SCIENCE.md Part 2, verbatim on the point: "The 2 ATP figure is net
      // of the 2 ATP investment. This is worth surfacing in-game because the
      // gross figure of 4 is a common point of confusion."
      text: 'The 4 is the number most people remember and the 2 is the one that leaves the cell better off. Both are true and they are not the same claim.',
      badge: sourced(`${PART2}, the gross figure of 4 is a common point of confusion`),
    },
    {
      text: 'Nothing on the unlock shelf moves that 2. More transport brings glucose in faster. More glycolytic capacity runs both phases faster. Neither changes what one glucose is worth.',
      badge: sourced(`${PART2}, the net yield is fixed by the stoichiometry of the pathway`),
    },
    {
      // Part 2 again, verbatim: "Framing it as an energy pathway is a common
      // misconception and the game should correct it directly."
      text: 'Lactate fermentation makes no ATP at all. It takes the NADH the payoff phase made and turns it back into NAD+, which is the only thing that was stopping the pathway. It buys rate and nothing else.',
      badge: sourced(`${PART2}, fermentation produces zero additional ATP`),
    },
    {
      text: 'So the two headline numbers do different things. ATP per second climbs every time something is bought. ATP per glucose sits at 2 and stays there.',
      badge: tuned(
        `The ceiling of 2 net is sourced, ${PART2}. That the top bar is where a player would notice it is a claim about this interface`,
      ),
    },
  ],
  source: `${PART2}, glycolysis and fermentation`,
  close: { text: 'Close', badge: tuned(ABOUT_THE_BUILD) },
};

/**
 * The affordance that opens the panel from the unlock shelf.
 *
 * The two new coach marks escalate into the panel, but a player who dismissed
 * both, or who never opened either, would never reach the most important thing
 * in the act. So it also hangs off the fermentation slot, which is the purchase
 * the panel is about. V3's own note said this belongs "on the unlock or in a
 * teaching panel"; it is on both.
 */
export const PANEL_AFFORDANCE: Entry = {
  text: 'About the yield',
  badge: tuned(ABOUT_THE_BUILD),
};

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

/* ===========================================================================
   SAVE MANAGEMENT. UPDATELOGV4.md stage 5.

   DESIGN.md's screen inventory: "Save management, export to file, import,
   backup recovery on failed parse".

   Every string here is a statement about the BUILD rather than about a cell,
   which is the same case V3's "No saves yet" line was in and it takes the same
   badge treatment: Tuned, with a reason that says so. The numbers these
   sentences sit beside are a different question, and it is the one stage 5
   decided: a value measured from the player's own session and the wall clock is
   exempt from the badge contract and goes through `Figure`'s `measured` prop.
   See src/ui/components/Figure.tsx.
   =========================================================================== */

/* ===========================================================================
   THE OFFLINE RETURN. UPDATELOGV8.md stage 6.

   DESIGN.md's screen inventory has had it since 2026-07-28 as "what happened
   while away, with the event sequence", and DESIGN.md answers the open question
   docs/SIMULATION.md left: show the sequence rather than a total, because the
   piecewise steady state algorithm produces a genuine bounded event list, so
   showing it is honest and instructive. It teaches that metabolism is
   homeostatic between shocks rather than smoothly accumulating.

   IT HAS TO READ WELL IN THE BORING CASE, which is the one act 1 mostly
   produces. Most absences contain one event or none, so the design target is
   "nothing happened, and here is how much of it happened" rather than a
   highlight reel. The quiet line below is the one most players will see and it
   is not an apology.
   =========================================================================== */

export const OFFLINE_RETURN = {
  heading: {
    text: 'While you were away',
    badge: tuned(`${ABOUT_THE_BUILD}. Resolved at load, docs/SIMULATION.md Part 3`),
  },
  away: {
    text: 'Away for',
    badge: tuned(`${ABOUT_THE_BUILD}. Measured from the system clock at load`),
  },
  made: {
    text: 'ATP made while away',
    badge: sourced(`${PART2}, the payoff phase makes 4 ATP per glucose gross`),
  },
  /** The headline of the boring case, and it is a claim about cells rather than an apology. */
  steady: {
    text: 'The cell held steady the whole time. That is what a cell does between shocks.',
    badge: sourced(`${PART2}, the pathway settles once NAD+ is being recycled`),
  },
  sequenceHeading: {
    text: 'What happened',
    badge: tuned(`${ABOUT_THE_BUILD}. The event list the offline path produced`),
  },
  /** One row per run of steady state. The pool name is filled in from POOLS. */
  steadyFor: {
    text: 'Steady for',
    badge: tuned(`${ABOUT_THE_BUILD}. Time the rates did not change`),
  },
  thenRanLow: {
    text: 'then it ran low',
    badge: sourced(`${PART2}, glycolysis is limited by what the cell can take up`),
  },
  toTheEnd: {
    text: 'and it still is',
    badge: tuned(ABOUT_THE_BUILD),
  },
  /** The environment emptying is the one thing in act 1 worth saying out loud. */
  larderEmpty: {
    text: 'The food outside the cell is gone. Nothing is coming in.',
    badge: sourced(`${PART1}, the environment is a finite pool and is not replenished`),
  },
  source: `${PART2}, glycolysis and fermentation. The event list is this build's`,
  close: { text: 'Back to the cell', badge: tuned(ABOUT_THE_BUILD) },
} as const satisfies Readonly<Record<string, Entry | string>>;

export const SAVE = {
  heading: {
    text: 'Save',
    badge: tuned(ABOUT_THE_BUILD),
  },
  autosaved: {
    text: 'Saved automatically',
    badge: tuned(`${ABOUT_THE_BUILD}. Autosave interval is provisional and lives in src/save/tuning.ts`),
  },
  neverSaved: {
    text: 'Not saved yet',
    badge: tuned(ABOUT_THE_BUILD),
  },
  exportAction: {
    text: 'Export to file',
    badge: tuned(`${ABOUT_THE_BUILD}. Exported saves are plain readable JSON`),
  },
  importAction: {
    text: 'Import from file',
    badge: tuned(ABOUT_THE_BUILD),
  },

  /* Storage that cannot promise anything. docs/PILLARS.md rule 7 rules out a
     backend, so an honest warning is the entire mitigation and it must not be
     silent. */
  storageUnavailable: {
    text: 'This browser is not letting the game store anything. The run will not survive this tab.',
    badge: tuned(`${ABOUT_THE_BUILD}. There is no backend to fall back to, by design`),
  },
  storageFull: {
    text: 'Browser storage is full. The run will not survive this tab, and the save already on disk has not been touched.',
    badge: tuned(`${ABOUT_THE_BUILD}. The existing save is preserved by the write order`),
  },

  /* The three load outcomes that are not an ordinary load. */
  recoveryOffer: {
    text: 'The save could not be read. There is a backup from just before it.',
    badge: tuned(`${ABOUT_THE_BUILD}. The unreadable save is kept rather than deleted`),
  },
  recoveryAction: {
    text: 'Load the backup',
    badge: tuned(ABOUT_THE_BUILD),
  },
  unreadable: {
    text: 'The save could not be read and neither could the backup. Both have been left exactly as they are.',
    badge: tuned(`${ABOUT_THE_BUILD}. Nothing is overwritten, so the files stay available`),
  },
  future: {
    text: 'This save was written by a newer version of the game. It has not been loaded and it has not been changed.',
    badge: tuned(`${ABOUT_THE_BUILD}. Guessing at a newer format is how saves get destroyed`),
  },

  /* The offline delta. Honest in both directions: no reward is implied and no
     loss is implied, because neither is true. */
  away: {
    text: 'Away for',
    badge: tuned(`${ABOUT_THE_BUILD}. Time away is measured, not simulated`),
  },
  awaySimulated: {
    // WAS "None of it has been simulated. It is being kept, not spent." That
    // was true from V4 to V7 and NOW.md called it the honest sentence that
    // would stay wrong-sounding until offline progress made it false. It is
    // false now, so the sentence goes. Replaced by UPDATELOGV8.md stage 6.
    //
    // It says "all of it" rather than naming a duration, because the duration
    // is already on the line above with a figure attached, and repeating a
    // number in prose is what docs/CONTENT_STYLE.md Part 1 is about.
    text: 'All of it has been simulated. The cell kept running.',
    badge: tuned(`${ABOUT_THE_BUILD}. docs/SIMULATION.md Part 3 resolves it at load`),
  },
  awayPartlySimulated: {
    // The budget-exhaustion case. Act 1 never reaches it, measured over 200
    // randomized absences, and the line exists because a player who did reach
    // it would otherwise be told nothing at all.
    text: 'Some of it could not be simulated and has not been counted.',
    badge: tuned(`${ABOUT_THE_BUILD}. EVENT_BUDGET in docs/SIMULATION.md Part 6`),
  },
  awayFellBack: {
    text: 'The cell did not settle while you were away, so what happened to it is a rough reading.',
    badge: tuned(`${ABOUT_THE_BUILD}. docs/SIMULATION.md Part 3 calls this a bug signal`),
  },
  awayCapped: {
    text: 'Time away is capped, and the cap was reached.',
    badge: tuned(`${ABOUT_THE_BUILD}. The cap is MAX_OFFLINE_HOURS in docs/SIMULATION.md Part 6`),
  },
  clockBackwards: {
    text: 'The system clock moved backwards since the last save, so no time away was counted.',
    badge: tuned(`${ABOUT_THE_BUILD}. docs/SAVE_SCHEMA.md Part 3 says credit zero rather than error`),
  },

  importFailed: {
    text: 'That file is not a save this version can read. Nothing was changed.',
    badge: tuned(`${ABOUT_THE_BUILD}. A failed import never touches the existing save`),
  },
  importFuture: {
    text: 'That file was written by a newer version of the game. Nothing was changed.',
    badge: tuned(ABOUT_THE_BUILD),
  },
} as const satisfies Readonly<Record<string, Entry>>;
