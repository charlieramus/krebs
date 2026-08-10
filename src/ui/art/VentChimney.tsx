/**
 * An alkaline hydrothermal vent chimney. docs/SCIENCE.md Part 6, stop 1.
 *
 * The metabolic claim is the pore structure, not the rock. A thin inorganic
 * barrier with catalytic iron and nickel sulfide in it, holding a pH difference
 * across itself, is the whole reason this stop is on a timeline about
 * metabolism, so the pores are ink and the chimney is the fill. Fills off, the
 * pores and the escaping fluid are still there.
 */

import { ArtFrame } from './ArtFrame';

export function VentChimney({ size }: { size: number }) {
  return (
    <ArtFrame size={size}>
      <path d="M17 44 L19.5 16 Q24 9 28.5 16 L31 44 Z" fill="var(--color-substrate)" />
      <path d="M21 22 L27 22" fill="none" />
      <path d="M20.5 30 L27.5 30" fill="none" />
      <path d="M20 38 L28 38" fill="none" />
      <circle cx="38" cy="12" r="4" fill="none" />
      <circle cx="31" cy="5.5" r="2.5" fill="none" />
    </ArtFrame>
  );
}
