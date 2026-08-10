/**
 * The frame every drawn asset sits in. See src/ui/art/README.md.
 *
 * It exists so the four governance clauses are declared once rather than seven
 * times: the viewBox, the stroke weight, the round linejoin, and `aria-hidden`,
 * because the card that carries a figure carries its name and a `<title>` here
 * would be a player-facing string outside `src/ui/content/`.
 *
 * `strokeWidth` is set on the group rather than per path, so an asset that wants
 * a different weight has to say so at the path and the guard will see it.
 */

import type { ReactNode } from 'react';

/** DESIGN.md, Illustration language: 3 to 3.5, round joins, nothing perfect. */
export const ART_STROKE = 3;

export function ArtFrame({ size, children }: { size: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
      role="presentation"
    >
      <g
        stroke="var(--color-ink)"
        strokeWidth={ART_STROKE}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {children}
      </g>
    </svg>
  );
}
