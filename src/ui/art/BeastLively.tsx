/**
 * The cell, working. DESIGN.md, The cell as beast: high flux.
 *
 * THE SECOND CHANNEL IS THE POSTURE AND IT IS NOT MOTION. This drawing does not
 * move. It is a figure caught mid-stride, one leg forward and one behind, with
 * the body high and off its own centre of balance, and that reads as going
 * somewhere in a single frame, in greyscale, under every colour vision
 * deficiency, because it is a difference in where the ink is.
 *
 * Distinguishable from BeastSluggish by outline alone: the body is taller than
 * it is squat, the legs disagree with each other, the eyes are open rings and
 * the mouth is a curve rather than a rule.
 */

import { ArtFrame } from './ArtFrame';

export function BeastLively({ size }: { size: number }) {
  return (
    <ArtFrame size={size}>
      {/* Mid-stride. The back leg is shorter because it is behind. */}
      <path d="M20 33 L16 42" fill="none" />
      <path d="M29 33 L34 40" fill="none" />
      <path
        d="M24 5 C33 5 40 12 40 21 C40 29 33 34 24 34 C15 34 8 29 8 21 C8 12 15 5 24 5 Z"
        fill="var(--color-mint)"
      />
      <circle cx="19" cy="19" r="2.6" fill="var(--color-white)" />
      <circle cx="30" cy="19" r="2.6" fill="var(--color-white)" />
      <path d="M19 26 Q24 30 29 26" fill="none" />
    </ArtFrame>
  );
}
