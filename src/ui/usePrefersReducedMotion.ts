/**
 * Whether the player has asked for reduced motion.
 *
 * DESIGN.md is explicit that reduced motion must NOT simply disable the flowing
 * dashes, because motion carries information here and nothing in the game may be
 * encoded in movement alone. What reduced motion does instead is swap the
 * animation for a static arrow plus an explicit numeric rate, so the same fact
 * arrives through a different channel.
 *
 * Reactive rather than read once, because the setting can change while the game
 * is running and a player who turns it on mid-session should not have to reload
 * to be taken seriously.
 */

import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    // Guarded for the server renderer, which the illustration and pathway tests
    // use. Defaulting to false there is correct: the reduced path is exercised
    // by passing the flag explicitly rather than by faking a media query.
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia(QUERY);
    const update = (): void => setReduced(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return reduced;
}
