/**
 * A pill. DESIGN.md: 2px outline, radius 999.
 *
 * The small labelled thing the badge in stage 3 is built on, and the same shape
 * used for any short status word. It carries no shadow: DESIGN.md gives the
 * hard offset shadow to cards, and putting it on every small element makes the
 * page read as a pile of stickers rather than a page with stickers on it.
 */

import type { ReactNode } from 'react';
import type { Surface } from './Card';

const SURFACE_CLASS: Readonly<Record<Surface, string>> = {
  page: 'bg-page',
  cream: 'bg-cream',
  pink: 'bg-pink',
  mint: 'bg-mint',
  sky: 'bg-sky',
  lilac: 'bg-lilac',
  white: 'bg-white',
};

export interface PillProps {
  children: ReactNode;
  surface?: Surface;
  /** Dashed outline. DESIGN.md uses it to mean unfinished. */
  dashed?: boolean;
  className?: string;
  /** Inline style for a fill outside the surface set, e.g. a semantic colour. */
  background?: string;
}

export function Pill({
  children,
  surface = 'white',
  dashed = false,
  className = '',
  background,
}: PillProps) {
  return (
    <span
      className={[
        background === undefined ? SURFACE_CLASS[surface] : '',
        'inline-flex items-center gap-1 rounded-pill border-ink text-ink',
        'px-2 py-0.5 text-label font-body font-extrabold uppercase tracking-label',
        dashed ? 'border-dashed' : 'border-solid',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        borderWidth: 'var(--outline-pill)',
        ...(background === undefined ? {} : { backgroundColor: background }),
      }}
    >
      {children}
    </span>
  );
}
