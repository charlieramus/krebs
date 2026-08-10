/**
 * The cell, damaged. DESIGN.md, The cell as beast: act 2, ROS damage active.
 *
 * UNREACHABLE IN ACT 1, AND DRAWN ANYWAY. `ActVitality` has four members
 * because DESIGN.md named four on 2026-07-28, and an act that can return `sick`
 * arrives with act 2. Drawing it now costs one asset and means act 2 widens a
 * table rather than inventing a channel under deadline.
 *
 * THE CRACKS CUT THE SILHOUETTE RATHER THAN PAINTING THE FILL, which is the one
 * row where the second channel changed the drawing instead of describing it.
 * DESIGN.md's illustration rule 5 asks for `loss` coloured cracks across the
 * body, and a red crack on a pink body is a colour statement that says nothing
 * in greyscale. A crack that interrupts the outline is a statement about the
 * body, it is true in ink, and it is closer to what rule 5 was reaching for.
 */

import { ArtFrame } from './ArtFrame';

export function BeastSick({ size }: { size: number }) {
  return (
    <ArtFrame size={size}>
      <path d="M19 33 L17 42" fill="none" />
      <path d="M30 33 L32 42" fill="none" />
      {/* The outline is drawn in two arcs rather than one closed path, so the
          silhouette itself has gaps in it before anything is drawn on top. */}
      <path
        d="M24 5 C33 5 40 12 40 21 C40 29 33 34 24 34 C15 34 8 29 8 21 C8 12 15 5 24 5 Z"
        fill="var(--color-pink)"
      />
      <path d="M8 21 L14 19 L11 26 L16 25" fill="none" />
      <path d="M40 23 L34 21 L37 28" fill="none" />
      <path d="M16 16 L22 22" fill="none" />
      <path d="M22 16 L16 22" fill="none" />
      <path d="M26 16 L32 22" fill="none" />
      <path d="M32 16 L26 22" fill="none" />
      <path d="M20 30 Q24 26 28 30" fill="none" />
    </ArtFrame>
  );
}
