/**
 * DESIGN.md: radius 12, and on :active it translates 3px into its own shadow
 * while the shadow drops to zero, over 80ms.
 *
 * That motion is the whole reason this is a component. The press reads as the
 * paper cutout being physically pushed down onto the page, which is the same
 * claim the hard offset shadow makes everywhere else in the system. Done with a
 * blurred shadow or a colour change it reads as a generic button, and DESIGN.md
 * is explicit that the offset shadow is load-bearing.
 *
 * Only transform and box-shadow animate, so a press during a running simulation
 * costs nothing the frame budget notices.
 */

import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import type { Surface } from './Card';

const SURFACE_CLASS: Readonly<Record<Surface, string>> = {
  page: 'bg-page',
  cream: 'bg-cream',
  pink: 'bg-pink',
  mint: 'bg-mint',
  sky: 'bg-sky',
  lilac: 'bg-lilac',
  white: 'bg-white',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  surface?: Surface;
  /**
   * Handle on the button. Added by UPDATELOGV7.md stage 3, so a caller can ask
   * whether the control focus was on has just become unfocusable. React 19
   * passes `ref` as an ordinary prop, so no forwardRef is needed.
   */
  ref?: Ref<HTMLButtonElement>;
}

export function Button({ children, surface = 'white', className = '', ref, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      ref={ref}
      {...rest}
      className={[
        SURFACE_CLASS[surface],
        'rounded-button border-ink border-solid text-ink',
        // DESIGN.md gives Fredoka 600 to every display-face surface.
        'px-4 py-2 font-display font-semibold text-card-title',
        // The 3px is DESIGN.md's, and it is deliberately off the 4px spacing
        // grid: it is a motion distance rather than a layout distance.
        'shadow-hard active:translate-x-[3px] active:translate-y-[3px] active:shadow-none',
        'transition-[transform,box-shadow]',
        'disabled:text-ink3 disabled:cursor-not-allowed',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        borderWidth: 'var(--outline-card)',
        transitionDuration: 'var(--duration-micro)',
        transitionTimingFunction: 'var(--ease-move)',
      }}
    >
      {children}
    </button>
  );
}
