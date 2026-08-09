/**
 * Every number in the game goes through here. Nothing else in src/ui/ may
 * render one.
 *
 * WHY THIS IS A COMPONENT AND NOT A CONVENTION. DESIGN.md says column alignment
 * is the credibility mechanism and calls tabular figures not optional. A rule
 * that is not optional should be structurally impossible to omit rather than
 * reliably remembered, so the tabular-nums declaration lives in one place and
 * every figure inherits it by having no other way in. The lint rule in
 * eslint.config.js is the other half: `toFixed` and friends are banned in every
 * .tsx file under src/ui/ except this one, so a number formatted at a call site
 * fails the build rather than shipping misaligned.
 *
 * WHY IT KNOWS ABOUT THE RUNTIME. Most figures on this screen change twenty
 * times a second. Routing them through React state would re-render the tree at
 * tick rate, which src/ui/runtime.ts exists to avoid. So Figure takes either a
 * static `value` or a `read` function sampled from the snapshot every frame,
 * and the live path writes text into its own node without a render. Both paths
 * format through the same function, so a live figure and a static one can never
 * disagree about how a number looks.
 */

import { useLive } from '../RuntimeContext';
import type { ActSnapshot } from '../runtime';
import { Badge, badgeTrace, type BadgeSpec } from './Badge';
import { useOpenProvenance } from './ProvenanceContext';
import { INFO_GLYPH, MEASURED_OPEN } from '../content/provenance';

/**
 * DESIGN.md's type scale, restricted to the sizes a figure can legitimately
 * take. There is no `wordmark` here because a wordmark is not a number.
 */
export type FigureSize = 'headline' | 'body' | 'label' | 'micro';

const SIZE_CLASS: Readonly<Record<FigureSize, string>> = {
  // DESIGN.md: headline num, 26 to 40px, Nunito 900, tracking -0.02em.
  headline: 'text-headline-num font-body font-black tracking-headline-num',
  body: 'text-body font-body font-semibold',
  label: 'text-label font-body font-extrabold',
  micro: 'text-micro font-body font-bold',
};

interface FigureBaseProps {
  /**
   * Where the badge is drawn.
   *
   * `inline` draws it beside the figure and is the default. `attached` means an
   * ancestor already displays this exact badge and drawing a second copy is
   * noise: a pool card carries one badge for the card, not one per figure on
   * it. The badge is still required, still typed, and still reaches the release
   * gate, so this changes what is drawn and never whether provenance was
   * declared. A component that passes `attached` and then does not display the
   * badge anywhere is a bug, and the only kind of bug in this contract that a
   * type cannot catch.
   */
  badgeDisplay?: 'inline' | 'attached';
  /** A number known at render time. Mutually exclusive with `read`. */
  value?: number;
  /** A number sampled from the simulation snapshot every frame. */
  read?: (snapshot: ActSnapshot) => number;
  /** Decimal places. Fixed rather than significant, so columns align. */
  decimals?: number;
  /**
   * Force a leading + or -. For a net rate, where a falling pool and a rising
   * one have to be distinguishable, and DESIGN.md's tabular figures mean the
   * sign occupies a column of its own rather than shifting the digits.
   */
  signed?: boolean;
  /**
   * A suffix like "/s". Rendered in smaller type and NOT part of the number,
   * so it never enters the tabular column.
   */
  unit?: string;
  size?: FigureSize;
  className?: string;
}

/**
 * PROVENANCE IS REQUIRED AND IT HAS TWO ANSWERS.
 *
 * V3 made the badge a required prop so an unsourced number does not compile.
 * V4 is the first log to render a number the badge contract was not designed
 * for: "you were away for 3 hours" is a quantitative claim in player-facing
 * text, which CLAUDE.md hard rule 1 and docs/PILLARS.md rule 4 govern, and it
 * traces to the system clock rather than to docs/SCIENCE.md. There is no source
 * to cite and no divergence row it could owe, because it is not a game-authored
 * number at all.
 *
 * THE DECISION, made in UPDATELOGV4.md stage 5 and written into DESIGN.md rather
 * than left to each component: **a value measured from the player's own session
 * and the wall clock is exempt from the badge contract.** The contract governs
 * claims about biology and about the game's own tuning, and a readout of how long
 * this tab was closed is neither.
 *
 * THE EXEMPTION IS NARROW AND THIS IS THE LINE. It covers real elapsed time away,
 * save timestamps and storage sizes. It does NOT cover anything the simulation
 * produced. Pool amounts stay badged because they are output of a model whose
 * rates are tuned. Elapsed GAME time stays badged because its badge is a claim
 * about the mapping to real time, which docs/SCIENCE.md Part 1 says does not
 * exist, and that claim is still worth making.
 *
 * NO FOURTH BADGE KIND WAS INVENTED. The pill vocabulary is unchanged, three
 * shipping states and one development-only one. What changed is that provenance
 * now has two possible answers and the author still has to give one: exactly one
 * of `badge` or `measured` is required, so an exempt figure is a decision at the
 * call site rather than a default. `measured` takes a sentence saying what is
 * being measured, so it cannot be used as a silent escape hatch.
 */
export type FigureProps = FigureBaseProps &
  (
    | { badge: BadgeSpec; measured?: undefined }
    | { badge?: undefined; measured: string }
  );

/**
 * The one formatting function. Live and static both call it.
 *
 * `toFixed` rather than Intl.NumberFormat: no locale-dependent grouping
 * separators, because a figure whose width depends on the reader's locale
 * defeats the column alignment the whole component exists to produce.
 */
export function formatFigure(value: number, decimals: number, signed: boolean): string {
  // A pool that has decayed to a denormal is zero as far as a reader is
  // concerned, and "-0.00" is a distracting lie about a value that is not
  // negative. Normalise before formatting rather than after.
  const safe = Number.isFinite(value) ? value : 0;
  const text = Math.abs(safe).toFixed(decimals);
  if (safe < 0 && Number(text) !== 0) return `-${text}`;
  if (signed) return Number(text) === 0 ? ` ${text}` : `+${text}`;
  return text;
}

export function Figure({
  badge,
  measured,
  badgeDisplay = 'inline',
  value,
  read,
  decimals = 2,
  signed = false,
  unit,
  size = 'body',
  className = '',
}: FigureProps) {
  if ((value === undefined) === (read === undefined)) {
    throw new Error('Figure: pass exactly one of `value` or `read`');
  }

  return (
    <span
      // The trace is on the figure itself, not only on the badge, so hovering
      // the number answers "where did this come from" even where the badge is
      // attached to a container. A measured value answers the same question with
      // what was measured, since there is no document to point at.
      title={badge === undefined ? `Measured: ${measured}` : badgeTrace(badge)}
      className={`inline-flex items-baseline gap-0.5 tabular-nums ${SIZE_CLASS[size]} ${className}`}
    >
      {read === undefined ? (
        <StaticNumber value={value as number} decimals={decimals} signed={signed} />
      ) : (
        <LiveNumber read={read} decimals={decimals} signed={signed} />
      )}
      {unit === undefined ? null : (
        <span className="text-micro font-bold text-ink2 tabular-nums">{unit}</span>
      )}
      {badge !== undefined && badgeDisplay === 'inline' ? (
        <Badge badge={badge} className="ml-1 self-center" />
      ) : null}
      {badge === undefined ? <MeasuredAffordance measured={measured as string} /> : null}
    </span>
  );
}

/**
 * The provenance affordance for a value that carries no badge.
 *
 * A measured value is exempt from the badge contract, so there is no pill for
 * the panel to open from, and asking where it came from is still a fair
 * question with a real answer. It gets the 16px circular info affordance
 * DESIGN.md already defines for a coach mark, which is this system's existing
 * vocabulary for "there is more here if you want it", rather than a fourth pill
 * that would imply provenance is an open question about it.
 *
 * Renders nothing where nothing is offering to answer, so the offline return and
 * the save panel look exactly as they did in every existing assertion.
 */
function MeasuredAffordance({ measured }: { measured: string }) {
  const open = useOpenProvenance();
  if (open === null) return null;
  return (
    <button
      type="button"
      aria-label={MEASURED_OPEN.text}
      onClick={() => open(null, measured)}
      className="ml-1 h-4 w-4 shrink-0 self-center rounded-pill border-ink bg-white text-micro font-body font-extrabold leading-none text-ink"
      style={{ borderWidth: 'var(--outline-pill)' }}
    >
      {INFO_GLYPH}
    </button>
  );
}

function StaticNumber({
  value,
  decimals,
  signed,
}: {
  value: number;
  decimals: number;
  signed: boolean;
}) {
  return <span className="tabular-nums">{formatFigure(value, decimals, signed)}</span>;
}

function LiveNumber({
  read,
  decimals,
  signed,
}: {
  read: (snapshot: ActSnapshot) => number;
  decimals: number;
  signed: boolean;
}) {
  const ref = useLive<HTMLSpanElement>((snapshot) =>
    formatFigure(read(snapshot), decimals, signed),
  );
  return <span ref={ref} className="tabular-nums" />;
}
