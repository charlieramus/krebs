/**
 * The paper cutout. DESIGN.md: 2.5px ink outline, hard offset shadow with no
 * blur, radius 16.
 *
 * The `surface` prop is restricted to DESIGN.md's surface names, which is the
 * point of it being a prop at all. A card that takes an arbitrary colour is a
 * card that will eventually be given one that is not in the palette.
 */

import type { ReactNode, Ref } from 'react';

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
  /**
   * Handle on the card element. Added by UPDATELOGV7.md stage 3, for focus
   * management: a card is where focus has to go when the control inside it
   * stops being focusable, and where a coach mark's first control is found.
   */
  containerRef?: Ref<HTMLDivElement>;
  /**
   * Makes the card a focus TARGET without making it a tab stop. Used when a
   * purchase disables the button focus was on and there is nowhere left inside
   * the card for it to go.
   */
  focusable?: boolean;
}

export function Card({
  children,
  surface = 'white',
  className = '',
  dimmed = false,
  dashed = false,
  containerRef,
  focusable = false,
}: CardProps) {
  return (
    <div
      ref={containerRef}
      tabIndex={focusable ? -1 : undefined}
      /*
       * THE HOOK THE forced-colors BLOCK IN index.css REACHES FOR.
       * UPDATELOGV12.md stage 5, closing NOW.md blocking item 4.
       *
       * Only on a card that actually carries the shadow. A dashed slot has none,
       * so there is nothing to substitute for and drawing a second outline
       * around it would say "separate piece of paper" about the one thing on the
       * screen that is deliberately not one yet.
       */
      data-paper={dashed ? undefined : ''}
      className={[
        SURFACE_CLASS[surface],
        // `relative` so the forced-colours pseudo-element has something to be
        // absolute against. Layout-neutral with no offsets.
        'relative rounded-card border-ink text-ink',
        dashed ? 'border-dashed' : 'border-solid',
        // 85 rather than 55, changed by UPDATELOGV7.md stage 5.
        //
        // A locked slot is dimmed AND dashed AND shadowless AND its button is
        // disabled, so lockedness has four channels. At 0.55 the dim was
        // destroying the other three: the slot's title measured 3.85:1, its
        // detail line 2.36:1 and its button label 1.65:1, which is under the
        // floor for a decorative border, let alone for text. At 0.85 they are
        // 11.00, 4.51 and 4.51, and the dashed border with no shadow still says
        // locked at a glance. DESIGN.md wants locked content visible, and it
        // was not.
        dimmed ? 'opacity-85' : '',
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
