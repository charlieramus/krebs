/**
 * The present. A eukaryotic cell with a mitochondrion in it.
 *
 * The one stop with no docs/SCIENCE.md Part 6 entry behind it, because it is not
 * a claim about the record. It is where the cell the player is running ends up,
 * and it is locked until the game is finished.
 *
 * The mitochondrion is the same closed sub-outline the endosymbiosis figure
 * carries, on purpose: the thing acquired down there is the thing still running
 * up here, and drawing it twice is the only way the column says so.
 */

import { ArtFrame } from './ArtFrame';

export function ModernCell({ size }: { size: number }) {
  return (
    <ArtFrame size={size}>
      <path
        d="M24 4 C36 4 44 13 44 24 C44 35 36 44 24 44 C12 44 4 35 4 24 C4 13 12 4 24 4 Z"
        fill="var(--color-mint)"
      />
      <circle cx="18" cy="19" r="6.5" fill="var(--color-white)" />
      <ellipse cx="31" cy="31" rx="8" ry="5" fill="var(--color-white)" />
      <path d="M27 31 L35 31" fill="none" />
    </ArtFrame>
  );
}
