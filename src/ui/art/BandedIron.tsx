/**
 * A banded iron formation. docs/SCIENCE.md Part 6, stop 4.
 *
 * DESIGN.md keeps this figure knowing it does not cleanly mark the Great
 * Oxidation Event: peak deposition is roughly 2.5 Ga, just before atmospheric
 * oxygenation, and deposition runs on to roughly 1.85 Ga. The cleaner marker,
 * the redox-sensitive detrital mineral record, has no legible cartoon
 * silhouette. Banded iron has an unmistakable striped one.
 *
 * So the figure and the label carry different facts and the label is where the
 * honesty lives. What the figure has to do is read as stripes, which is why the
 * bands are ink rules rather than a second fill: with fills off it is still a
 * banded rock.
 */

import { ArtFrame } from './ArtFrame';

export function BandedIron({ size }: { size: number }) {
  return (
    <ArtFrame size={size}>
      <rect x="7" y="6" width="34" height="36" rx="4" fill="var(--color-loss)" />
      <path d="M8 15 L40 15" fill="none" />
      <path d="M8 24 L40 24" fill="none" />
      <path d="M8 33 L40 33" fill="none" />
    </ArtFrame>
  );
}
