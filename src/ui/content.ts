/**
 * Every player-facing string in the slice, in one file, each paired with its
 * badge.
 *
 * ---------------------------------------------------------------------------
 * THIS FILE DOES NOT INVENT A VOICE
 * ---------------------------------------------------------------------------
 *
 * docs/CONTENT_STYLE.md does not exist and V3 does not write it. So what is here
 * is molecule names, reaction names, two unlock labels and the one coach mark
 * the NAD+ wall needs, and nothing that reads as authored prose. Inventing a
 * tone before the document that decides the tone lands means rewriting all of it
 * twice. The same restraint is already recorded in src/content/act1/pools.ts,
 * whose display names are molecule names and nothing more, and those names are
 * reused here rather than restated.
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
 * Numbers in strings are rare on purpose. Where one appears it traces to
 * docs/SCIENCE.md by line, and the audit is in the stage 3 report.
 */

import { sourced, tuned, type BadgeSpec } from './components/Badge';
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
  maintain: {
    text: 'Maintenance',
    // The stoichiometry is real: ATP hydrolyses to ADP and inorganic phosphate.
    // What is invented is that the whole rest of cellular metabolism is one
    // Michaelis-Menten reaction in ATP.
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
    badge: sourced(`${PART2}, lactate dehydrogenase reduces pyruvate to lactate, oxidizing NADH`),
  },
  uptakeCapacity: {
    text: 'Uptake capacity',
    badge: tuned('A finite ladder of transport steps. Neither the steps nor their number is sourced'),
  },
} as const satisfies Readonly<Record<string, Entry>>;

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

export interface CoachMark {
  readonly heading: Entry;
  readonly body: readonly Entry[];
  readonly action: Entry;
  /** Mandatory. DESIGN.md: a coach mark without a source row does not ship. */
  readonly source: string;
}

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
  source: `${PART2}, the NAD+ constraint`,
};

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

/**
 * No saves in V3. DESIGN.md does not cover this and neither does docs/SCIENCE.md,
 * because it is a fact about the build rather than about a cell. Say it on
 * screen rather than letting a player discover it by refreshing.
 */
export const NO_SAVES: Entry = {
  text: 'No saves yet. A refresh loses the run.',
  badge: tuned('A statement about this build, not about biology. Saves land in V4'),
};
