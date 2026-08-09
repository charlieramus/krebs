/**
 * A filament of cyanobacteria, with oxygen leaving it.
 * docs/SCIENCE.md Part 6, stop 3.
 *
 * The two escaping bubbles are the claim and they are the only thing in the
 * drawing that is not the organism. This stop is undated and the figure must not
 * quietly supply the confidence the date column refuses: what is drawn is the
 * process, not a moment.
 */

import { ArtFrame } from './ArtFrame';

export function Cyanobacterium({ size }: { size: number }) {
  return (
    <ArtFrame size={size}>
      <rect x="5" y="21" width="31" height="15" rx="7.5" fill="var(--color-reduced)" />
      <path d="M15.5 21.5 L15.5 35.5" fill="none" />
      <path d="M25.5 21.5 L25.5 35.5" fill="none" />
      <circle cx="40" cy="12" r="4.5" fill="none" />
      <circle cx="31" cy="6" r="3" fill="none" />
    </ArtFrame>
  );
}
