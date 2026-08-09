/**
 * Provenance on click. What the game says when you ask where a number came from.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS FEATURE IS FOR, WRITTEN DOWN SO IT IS NOT LOST
 * ---------------------------------------------------------------------------
 *
 * Per docs/ECONOMY.md the tuned scalars are DEPARTURE or UNSOURCED, 33 and 15 as
 * of V10. **So for most numbers on screen the honest answer to "where does this
 * come from" is a divergence row rather than a paper.** The feature that says so
 * is a better feature than one that pretends otherwise.
 *
 * The temptation during implementation is to soften the UNSOURCED case, because
 * "there is no real counterpart at all" reads as an admission. It is not an
 * admission, it is the content of the row: docs/ECONOMY.md says the real
 * behaviour column is EMPTY on purpose and that the emptiness is the row rather
 * than a gap in it. The wording below says that and does not apologise for it.
 *
 * **Every science game claims accuracy. A game that will tell you on demand
 * which of its numbers are measured and which it invented for pacing is doing
 * something else.**
 *
 * ---------------------------------------------------------------------------
 * AUTHORED, NOT BUNDLED
 * ---------------------------------------------------------------------------
 *
 * Nothing in `src/` has ever read a doc at runtime. The tests that parse
 * SCIENCE.md and ECONOMY.md use Node's file reader under Vitest, which never
 * happens in a browser, and V9's content security policy permits zero network
 * requests so fetching is not available either. Bundling raw markdown would also
 * put 654 lines of prose written for a biochemist in front of a player and break
 * `contentStyle.test.ts` in the same move.
 *
 * So the prose is authored here under docs/CONTENT_STYLE.md and
 * `provenance.test.tsx` parses both documents to prove every citation resolves.
 * Same mechanism as `disclosure.test.tsx` and `divergenceTable.test.ts`, which
 * is this project's answer to exactly this problem, for the third time.
 *
 * ---------------------------------------------------------------------------
 * DEFERRED, AND IT STAYS DEFERRED
 * ---------------------------------------------------------------------------
 *
 * Per-claim citation identifiers in docs/SCIENCE.md. That document has a flat
 * topical bibliography and no per-claim anchors, so linking a figure to an exact
 * passage is a refactor across 654 lines plus every call site plus a guard. This
 * feature cites a Part, which is honest about its own resolution.
 */

import type { BadgeSpec } from '../components/Badge';
import type { Entry } from './common';
import { tuned } from '../components/Badge';
import { ABOUT_THE_BUILD } from './common';

export type ProvenanceKind = 'sourced' | 'tuned' | 'contested' | 'measured';

export interface Provenance {
  readonly kind: ProvenanceKind;
  /** Coach-mark heading ceiling: 6 words, a statement rather than a question. */
  readonly heading: string;
  /** The place this opens. Empty only for a measured value, which opens nowhere. */
  readonly destination: string;
  /** Paragraphs, in order. Teaching-panel ceiling. */
  readonly body: readonly string[];
}

/* ===========================================================================
   WHAT EACH docs/SCIENCE.md PART COVERS

   One line each, all seven, so a figure citing any Part has somewhere to land
   the day something cites it. Written from the document's own headings rather
   than summarised freely.
   =========================================================================== */

export const PART_SUBJECTS: Readonly<Record<string, string>> = {
  '1': 'How the model was built, and every simplification it makes on purpose.',
  '2': 'Act 1: glycolysis, the NAD+ constraint, and both fermentation branches.',
  '3': 'Act 2: the Great Oxidation Event, reactive oxygen species and damage.',
  '4': 'Act 3: endosymbiosis, aerobic respiration and where the yield comes from.',
  '5': 'Act 4: substrate breadth, and regulation as the theme.',
  '6': 'The geological timeline, and where every date on it comes from.',
  '7': 'Known unknowns. The things that are still argued about in 2026.',
};

/* ===========================================================================
   WHAT IS ARGUED ABOUT, AND WHO ARGUES WHICH SIDE

   Contested is the destination the first version of the design doc left out
   entirely, which matters because the act 3 log makes a contested-science beat a
   headline feature. The badge carrying the game's most interesting claim had
   nowhere to go.

   Keyed by the badge's own source string, so a new Contested badge with nothing
   authored for it fails the build rather than opening a panel that says the
   science is unsettled and stops there.
   =========================================================================== */

export interface ContestedTopic {
  /** What the disagreement is about. One sentence. */
  readonly argued: string;
  /** Who holds which position. One line each, and both sides get one. */
  readonly sides: readonly string[];
}

export const CONTESTED: Readonly<Record<string, ContestedTopic>> = {
  'docs/SCIENCE.md Part 6, stop 1': {
    argued:
      'Whether natural proton gradients in alkaline vents had anything to do with the origin of chemiosmosis. The dispute is about mechanism, not only about timing.',
    sides: [
      'For: the vent fluid and the early ocean differ in pH by about the same amount a living cell maintains, and ATP synthase is universal while no proton pump is, so using a gradient looks older than making one.',
      'Against: Jackson argued in 2016 that the barrier arrangement produces no electrical potential difference and that a cell this dependent on a vent could never leave it. Lane rebutted it directly in 2017. Reactor yields remain very low.',
    ],
  },
  'docs/SCIENCE.md Part 6, stop 3': {
    argued:
      'When oxygenic photosynthesis began. The widely quoted 2.7 Ga figure is not usable and nothing has replaced it.',
    sides: [
      'The 2.7 Ga date came from biomarkers reported in 1999. French and colleagues showed in 2015 that the molecules were younger contamination, and the precursor lipids were never diagnostic for cyanobacteria anyway.',
      'What can be said: oxygen production has to predate the rise in the atmosphere. Molecular clocks put it somewhere between 2.7 and 2.0 Ga, and the oldest direct evidence of thylakoids is about 1.75 Ga. The span is several hundred million years wide.',
    ],
  },
  'docs/SCIENCE.md Part 6, stop 5': {
    argued:
      'When one cell took another in, and whether the host was already complex when it did. Estimates vary by roughly twofold and the disagreement is structural rather than statistical.',
    sides: [
      'Mitochondria late: a 2025 dated duplication analysis puts the event near 2.2 Ga with a host that already had a nucleus, an endomembrane system and the machinery to engulf things.',
      'Mitochondria early: other analyses put eukaryogenesis at 2.2 to 1.5 Ga and tie it to the rise of oxygen, against the view that the two are decoupled. The molecular clock estimates span roughly a billion years.',
    ],
  },
};

/* ===========================================================================
   THE TWO VERDICTS A docs/ECONOMY.md ROW CAN CARRY

   UNSOURCED is a divergence-table category and not a badge, so this branch
   cannot be taken from the badge alone: a Tuned figure is DEPARTURE or
   UNSOURCED and only the row knows which.
   =========================================================================== */

export const VERDICTS: Readonly<Record<'DEPARTURE' | 'UNSOURCED', string>> = {
  DEPARTURE:
    'The row is a DEPARTURE. A real quantity could have stood here and this is not it. The row says what the real behaviour is and what the game does instead.',
  // DO NOT SOFTEN THIS. docs/ECONOMY.md: the "real behaviour" cell of an
  // UNSOURCED row is EMPTY, and that emptiness is the content of the row rather
  // than a gap in it. Inventing a plausible sentence here would be the exact
  // failure the table exists to prevent.
  UNSOURCED:
    'The row is UNSOURCED. There is no real counterpart at all. Nothing in biology corresponds to this number and the row leaves its real behaviour column empty on purpose.',
};

/**
 * Rows a badge can name, with the verdict the document gives them.
 *
 * The verdict is authored here and checked against docs/ECONOMY.md by
 * `provenance.test.tsx`, which reads the row and derives the verdict from
 * whether its real behaviour cell is empty. So the panel cannot claim DEPARTURE
 * about a row the document leaves blank.
 */
export const TUNED_ROWS: Readonly<Record<string, 'DEPARTURE' | 'UNSOURCED'>> = {
  C5: 'DEPARTURE',
  C20: 'DEPARTURE',
  U7: 'DEPARTURE',
  S1: 'UNSOURCED',
};

/**
 * A Tuned badge that names no row, which is most of them.
 *
 * NOT AN EMPTY PANEL AND NOT A DEFAULT. These are statements about this build
 * rather than about a tuned quantity: what a button does, which surface a thing
 * lives on, that a save was written. There is no scalar behind them, so there is
 * no divergence row to owe, and saying so is the honest destination rather than
 * a missing one. The badge's own reason is shown verbatim underneath.
 */
export const BUILD_STATEMENT =
  'This one names no divergence row, because there is no tuned number behind it. It is a statement about how this build works rather than about a quantity, and docs/ECONOMY.md tracks quantities.';

/** A value from the player's own session, which is exempt from the contract. */
export const MEASURED_NOTE = [
  'This came from your own session and the system clock. It is not a claim about biology and not a number the game chose.',
  'It carries no badge for that reason. The badge contract covers claims about a cell and claims about how this game is tuned, and how long a tab was closed is neither.',
];

/* ===========================================================================
   THE HEADINGS AND THE AFFORDANCE LABEL
   =========================================================================== */

export const PROVENANCE = {
  sourced: { text: 'Where this comes from', badge: tuned(ABOUT_THE_BUILD) },
  tuned: { text: 'This number was chosen', badge: tuned(ABOUT_THE_BUILD) },
  contested: { text: 'This one is argued about', badge: tuned(ABOUT_THE_BUILD) },
  measured: { text: 'This came from your session', badge: tuned(ABOUT_THE_BUILD) },
  close: { text: 'Close', badge: tuned(ABOUT_THE_BUILD) },
  argued: { text: 'What is argued', badge: tuned(ABOUT_THE_BUILD) },
} as const satisfies Readonly<Record<string, Entry>>;

/**
 * The accessible name of the affordance that opens the panel.
 *
 * The visible word stays inside the name, so the label is still contained in it.
 */
export function openLabel(word: string): Entry {
  return { text: `${word}. Where this comes from`, badge: tuned(ABOUT_THE_BUILD) };
}

/** The measured figure's affordance, which has no badge word to sit on. */
export const MEASURED_OPEN: Entry = {
  text: 'Where this comes from',
  badge: tuned(ABOUT_THE_BUILD),
};

/**
 * The mark inside the 16px circular affordance.
 *
 * A lower case i rather than a question mark. A question mark asks something; an
 * i offers something, and DESIGN.md calls this an info affordance.
 */
export const INFO_GLYPH = 'i';

/* ===========================================================================
   THE COMPOSITION. FOUR DESTINATIONS, NOT THREE.
   =========================================================================== */

/** The Part number a citation names, or null if it names none. */
export function citedPart(source: string): string | null {
  return /docs\/SCIENCE\.md Part (\d+)/.exec(source)?.[1] ?? null;
}

/**
 * What the panel shows for a badge, or for a measured value.
 *
 * Returns null when the destination is incomplete, which is what
 * `provenance.test.tsx` fails the build on. A badged figure with no entry should
 * fail the build rather than open an empty panel, which is what makes provenance
 * complete by construction rather than by diligence.
 */
export function provenanceFor(badge: BadgeSpec | null, measured?: string): Provenance | null {
  if (badge === null) {
    if (measured === undefined || measured.length === 0) return null;
    return {
      kind: 'measured',
      heading: PROVENANCE.measured.text,
      destination: '',
      body: [...MEASURED_NOTE, `What was measured: ${measured}.`],
    };
  }

  if (badge.kind === 'sourced') {
    const part = citedPart(badge.source);
    const subject = part === null ? undefined : PART_SUBJECTS[part];
    if (part === null || subject === undefined) return null;
    return {
      kind: 'sourced',
      heading: PROVENANCE.sourced.text,
      destination: badge.source,
      body: [
        'A biochemist can check this against the document. That is what the Sourced badge claims and it is the only thing it claims.',
        subject,
      ],
    };
  }

  if (badge.kind === 'contested') {
    const part = citedPart(badge.source);
    const topic = CONTESTED[badge.source];
    if (part === null || PART_SUBJECTS[part] === undefined || topic === undefined) return null;
    return {
      kind: 'contested',
      heading: PROVENANCE.contested.text,
      destination: badge.source,
      body: [topic.argued, ...topic.sides],
    };
  }

  if (badge.kind === 'tuned') {
    if (badge.reason.length === 0) return null;
    const row = badge.divergenceRow;
    if (row === undefined) {
      return {
        kind: 'tuned',
        heading: PROVENANCE.tuned.text,
        destination: 'docs/ECONOMY.md',
        body: [
          'The game chose this for pacing and says so. It is not a measurement and no biochemist can check it.',
          BUILD_STATEMENT,
          `Why it was chosen: ${badge.reason}.`,
        ],
      };
    }
    const verdict = TUNED_ROWS[row];
    if (verdict === undefined) return null;
    return {
      kind: 'tuned',
      heading: PROVENANCE.tuned.text,
      destination: `docs/ECONOMY.md row ${row}`,
      body: [
        'The game chose this for pacing and says so. It is not a measurement and no biochemist can check it.',
        VERDICTS[verdict],
        `Why it was chosen: ${badge.reason}.`,
      ],
    };
  }

  // The development-only badge. It reaches a release build over the release
  // gate's dead body, so there is nothing to author for it.
  return null;
}
