/**
 * The timeline's stops, and the rule that decides what may become one.
 *
 * UPDATELOGV12.md stage 2. DESIGN.md, The timeline view, is the source of
 * record for the seven below and docs/SCIENCE.md Part 6 is the source of record
 * for every date on them.
 *
 * ---------------------------------------------------------------------------
 * THE ADMISSION RULE. READ THIS BEFORE ADDING A STOP.
 * ---------------------------------------------------------------------------
 *
 * A FIGURE EARNS ITS PLACE BY ITS METABOLISM, NOT BY ITS MORPHOLOGY.
 *
 * Settled 2026-07-28 and written here rather than only in DESIGN.md because
 * this is the file somebody edits when they want to add one. What disqualifies
 * a candidate:
 *
 *   - it is on the list because it is an interesting looking organism. The
 *     timeline is not the tree of life and docs/PILLARS.md rules an ecology out
 *     explicitly. A creature with no metabolic claim is decoration
 *   - its claim is about what a cell LOOKED like rather than about what it did.
 *     "First eukaryote fossils" failed exactly here and is on the view only
 *     because the same fossils carry an oxygen dependency, which is a metabolic
 *     statement about the same rock
 *   - the metabolism it names connects to no pathway the player ever runs.
 *     docs/SCIENCE.md Part 6 considered nitrogen fixation and methanogenesis on
 *     these grounds and rejected both, and both are ancient and important
 *   - it needs a date the record does not support. An absent date is fine and
 *     two stops here have none. An invented one is not
 *
 * Making the timeline the frame is what raises the pressure this rule exists to
 * resist, so it has real load on it for the first time as of this log.
 *
 * ---------------------------------------------------------------------------
 * NO STRING IN THIS FILE
 * ---------------------------------------------------------------------------
 *
 * Every player-facing word lives in `src/ui/content/timeline.ts`, keyed by the
 * ids below, because `contentStyle.test.ts` walks that directory and not this
 * one. What is here is structure: order, the date's KIND, the ordering
 * constraint, and which act each stop belongs to.
 */

/** The seven, newest first, which is the order they render top to bottom. */
export type StopId =
  | 'now'
  | 'eukaryotes'
  | 'endosymbiosis'
  | 'goe'
  | 'photosynthesis'
  | 'mats'
  | 'vents';

/**
 * How a stop's date column reads.
 *
 * THREE KINDS RATHER THAN A NULLABLE DATE, WHICH IS THE WHOLE OF OPEN QUESTION
 * 5. DESIGN.md, The undated stop: an undated stop is not a date that is
 * missing, it is a one-sided ordering constraint, and `unresolved` and
 * `hypothesis` are not synonyms. `unresolved` says the event happened and its
 * start is not known. `hypothesis` says the thing may not be a dated event at
 * all, because it is a proposal about a mechanism.
 *
 * A single `date: string | null` would have collapsed the two into one absence,
 * which is what the sourcing pass in docs/SCIENCE.md Part 6 spent its effort
 * pulling apart.
 */
export type DateKind = 'dated' | 'unresolved' | 'hypothesis';

export interface TimelineStop {
  readonly id: StopId;
  readonly date: DateKind;
  /**
   * The act this stop is, if it is one. Act stops take a tinted card and are
   * where the marker can land. DESIGN.md gives act 4 the eukaryote stop.
   */
  readonly act?: number;
  /**
   * A stop the player has not reached yet and cannot read as history.
   *
   * One of them: the present, which is the endpoint rather than a finding.
   * Locked content stays visible and dimmed rather than hidden, which is the
   * genre's engine and this system's existing dashed vocabulary.
   */
  readonly locked?: boolean;
  /** DESIGN.md: lilac means contested, and only that. */
  readonly contested?: boolean;
}

/**
 * The stops, newest at the top. DESIGN.md: down is older, up is newer, which is
 * stratigraphic, because deeper means deposited earlier.
 *
 * THE TWO UNDATED ONES ARE NOT ADJACENT AND THAT IS NOT A CHOICE. `vents` sits
 * at the bottom because a proposal about the origin of chemiosmosis precedes the
 * earliest evidence of life, and `photosynthesis` sits under the GOE because
 * oxygen production must predate atmospheric accumulation. Both constraints are
 * one-sided and both open downward, which is why neither can be given a node.
 */
export const TIMELINE_STOPS: readonly TimelineStop[] = [
  { id: 'now', date: 'dated', locked: true },
  { id: 'eukaryotes', date: 'dated', act: 4 },
  { id: 'endosymbiosis', date: 'dated', act: 3, contested: true },
  { id: 'goe', date: 'dated', act: 2 },
  { id: 'photosynthesis', date: 'unresolved', contested: true },
  { id: 'mats', date: 'dated', act: 1 },
  { id: 'vents', date: 'hypothesis', contested: true },
];

/**
 * Where the marker sits, and it reads the act.
 *
 * DISCRETE, AND THERE IS NO CONTINUOUS QUANTITY WIRED TO POSITION AT ALL. The
 * signature is the proof: this takes an act number and nothing else. It cannot
 * read cumulative ATP, elapsed time or a pool amount, because it is not given
 * one.
 *
 * Two reasons and both are load-bearing. The timeline is not a progress bar, and
 * a marker that slides with a running total is one however it is drawn. And
 * React never re-renders at tick rate, which is this project's central
 * architectural claim, and this is the largest always-on surface in the game.
 *
 * Returns null for an act with no stop, which cannot happen for the four acts
 * that exist and is representable rather than thrown, because a marker that is
 * absent is a smaller failure than a screen that is.
 */
export function markerStopId(act: number): StopId | null {
  for (const stop of TIMELINE_STOPS) {
    if (stop.act === act) return stop.id;
  }
  return null;
}

/** The surface an act stop's card takes. DESIGN.md, Colour, Act distribution. */
export function stopSurface(stop: TimelineStop): 'white' | 'sky' | 'pink' | 'mint' | 'lilac' {
  // Contested wins, because lilac means contested and only that, and a stop
  // that is both an act and a live dispute is still a live dispute.
  if (stop.contested === true) return 'lilac';
  if (stop.act === 1) return 'sky';
  if (stop.act === 2) return 'pink';
  if (stop.act === 4) return 'mint';
  return 'white';
}
