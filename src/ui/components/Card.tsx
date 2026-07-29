/**
 * The paper cutout. DESIGN.md: 2.5px ink outline, hard offset shadow with no
 * blur, radius 16.
 *
 * The `surface` prop is restricted to DESIGN.md's surface names, which is the
 * point of it being a prop at all. A card that takes an arbitrary colour is a
 * card that will eventually be given one that is not in the palette.
 */

import type { ReactNode } from 'react';

/** DESIGN.md, Colour, Surfaces. These seven and no others. */
export type Surface = 'page' | 'cream' | 'pink' | 'mint' | 'sky' | 'lilac' | 'white';

const SURFACE_CLASS: Readonly<Record<Surface, string>> = {
  page: 'bg-page',
  cream: 'bg-cream',
  pink: 'bg-pink',
  mint: 'bg-mint',
  sky: 'bg-sky',
  lilac: 'bg-lilac',
  white: 'bg-white',
};

export interface CardProps {
  children: ReactNode;
  surface?: Surface;
  className?: string;
  /**
   * Locked content stays visible and dimmed rather than hidden. DESIGN.md:
   * seeing what is coming is the genre's engine.
   */
  dimmed?: boolean;
  /** Dashed outline. DESIGN.md uses dashed to mean unfinished or not yet bought. */
  dashed?: boolean;
}

export function Card({
  children,
  surface = 'white',
  className = '',
  dimmed = false,
  dashed = false,
}: CardProps) {
  return (
    <div
      className={[
        SURFACE_CLASS[surface],
        'rounded-card border-ink text-ink',
        dashed ? 'border-dashed' : 'border-solid',
        dimmed ? 'opacity-55' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        borderWidth: 'var(--outline-card)',
        // The hard offset shadow, from the token. A dashed slot carries no
        // shadow: an unbought upgrade should not sit on the page as solidly as
        // a bought one.
        boxShadow: dashed ? 'none' : 'var(--shadow-hard)',
      }}
    >
      {children}
    </div>
  );
}
