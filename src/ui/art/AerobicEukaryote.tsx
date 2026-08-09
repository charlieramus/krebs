/**
 * An early aerobic eukaryote, drawn as an ornamented acritarch.
 * docs/SCIENCE.md Part 6, stop 6.
 *
 * THIS IS THE FIGURE THE ADMISSION RULE ALMOST DISQUALIFIED. Eukaryotic identity
 * in the Proterozoic record is inferred from large cell size, a resistant wall
 * and complex ornamentation, and every one of those is morphology. The stop is
 * on the timeline because the same fossils are almost entirely restricted to
 * oxygenated bottom water, which is a metabolic statement about the same rock.
 *
 * Same division of labour as the banded iron figure: the drawing shows what was
 * found and the card says why it counts.
 */

import { ArtFrame } from './ArtFrame';

export function AerobicEukaryote({ size }: { size: number }) {
  return (
    <ArtFrame size={size}>
      <circle cx="24" cy="24" r="13" fill="var(--color-mint)" />
      <path d="M24 11 L24 4" fill="none" />
      <path d="M37 24 L44 24" fill="none" />
      <path d="M24 37 L24 44" fill="none" />
      <path d="M11 24 L4 24" fill="none" />
      <path d="M33 15 L38 10" fill="none" />
      <path d="M15 33 L10 38" fill="none" />
    </ArtFrame>
  );
}
