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
import type { Act1Snapshot } from '../runtime';
import { Badge, badgeTrace, type BadgeSpec } from './Badge';

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

export interface FigureProps {
  /**
   * REQUIRED. DESIGN.md says an unsourced number should look visibly broken
   * because the badge slot is empty. A required prop is stronger than that: it
   * does not compile. There is no default and there must never be one, because
   * a default is a decision about provenance made by whoever wrote the
   * component rather than by whoever wrote the number.
   */
  badge: BadgeSpec;
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
  read?: (snapshot: Act1Snapshot) => number;
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
      // attached to a container.
      title={badgeTrace(badge)}
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
      {badgeDisplay === 'inline' ? <Badge badge={badge} className="ml-1 self-center" /> : null}
    </span>
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
  read: (snapshot: Act1Snapshot) => number;
  decimals: number;
  signed: boolean;
}) {
  const ref = useLive<HTMLSpanElement>((snapshot) =>
    formatFigure(read(snapshot), decimals, signed),
  );
  return <span ref={ref} className="tabular-nums" />;
}
