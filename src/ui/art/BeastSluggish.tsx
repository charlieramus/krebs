/**
 * The cell, stopped. DESIGN.md, The cell as beast: flux near zero.
 *
 * THE STATE THAT ANSWERS OPEN QUESTION 7, AND THE ONE WHERE THE SECOND CHANNEL
 * TURNED OUT TRUER THAN THE FIRST. DESIGN.md's original signal was a
 * desaturated fill, which says the cell is somewhat less. A body compressed
 * vertically and sitting on its own base, with both feet planted and splayed,
 * says it has stopped, which is what is actually true, and it says it without
 * asking anybody to compare two greens.
 *
 * It covers the walled cell and the starved cell, because both are stopped and
 * the beast is a readout of one quantity rather than a diagnosis of its cause.
 * Which one it is sits on the pool rail, where the cause lives.
 */

import { ArtFrame } from './ArtFrame';

export function BeastSluggish({ size }: { size: number }) {
  return (
    <ArtFrame size={size}>
      {/* Both planted, both splayed, both the same length. Nothing is going
          anywhere and the legs agree about it. */}
      <path d="M17 35 L14 43" fill="none" />
      <path d="M32 35 L35 43" fill="none" />
      <path
        d="M24 14 C34 14 42 19 42 26 C42 32 34 36 24 36 C14 36 6 32 6 26 C6 19 14 14 24 14 Z"
        fill="var(--color-oxidized)"
      />
      {/* Closed, as two horizontal rules. No ring, so the eye count does not
          survive as a count and the shape reads as shut rather than as blank. */}
      <path d="M14 24 L21 24" fill="none" />
      <path d="M27 24 L34 24" fill="none" />
      <path d="M19 30 L29 30" fill="none" />
    </ArtFrame>
  );
}
