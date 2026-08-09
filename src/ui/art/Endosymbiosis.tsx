/**
 * One cell inside another. docs/SCIENCE.md Part 6, stop 5.
 *
 * A closed sub-outline inside a closed outline, which is the only topological
 * change in this project's illustration set and the thing act 3 is about. It is
 * the same encoding DESIGN.md gives the beast's Powered state, deliberately, so
 * that the moment on the timeline and the moment on the body are drawn as the
 * same event.
 *
 * Legible with every fill removed, because a hole in a shape is not a colour.
 */

import { ArtFrame } from './ArtFrame';

export function Endosymbiosis({ size }: { size: number }) {
  return (
    <ArtFrame size={size}>
      <path
        d="M24 4 C36 4 44 13 44 24 C44 35 36 44 24 44 C12 44 4 35 4 24 C4 13 12 4 24 4 Z"
        fill="var(--color-lilac)"
      />
      <ellipse cx="27" cy="28" rx="9" ry="6.5" fill="var(--color-mint)" />
      <path d="M22 28 L32 28" fill="none" />
    </ArtFrame>
  );
}
