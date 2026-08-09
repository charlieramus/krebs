/**
 * A stromatolite, drawn as the layers rather than as the dome.
 * docs/SCIENCE.md Part 6, stop 2.
 *
 * The stop is on the timeline for mat construction, which is behaviour, and
 * DESIGN.md notes that the mats themselves are morphology while the anoxygenic
 * phototrophy on the card is what earns the place. So the figure is the
 * laminations, which are the record of a mat trapping sediment one layer at a
 * time, and they are ink. The dome is the fill and carries nothing.
 */

import { ArtFrame } from './ArtFrame';

export function MicrobialMat({ size }: { size: number }) {
  return (
    <ArtFrame size={size}>
      <path d="M4 44 L4 33 Q24 12 44 33 L44 44 Z" fill="var(--color-oxidized)" />
      <path d="M9 44 Q24 22 39 44" fill="none" />
      <path d="M15 44 Q24 30 33 44" fill="none" />
    </ArtFrame>
  );
}
