/**
 * One reaction, drawn as an arrow whose dashes flow at the rate the reaction is
 * actually running.
 *
 * DESIGN.md: motion is load-bearing rather than decorative, and the player reads
 * rate by watching. This is the thing a console cannot do, and it is the reason
 * V3 exists at all.
 *
 * ---------------------------------------------------------------------------
 * APPLIED FLUX, NOT INTENDED FLUX
 * ---------------------------------------------------------------------------
 *
 * The speed comes from `appliedFlux`, which is `state.fluxes[r] * state.scales[r]`,
 * the flux the tick really ran after proportional shortfall scaling. Driving it
 * from the intended flux would keep the dashes flowing through a shortfall that
 * has already stopped the reaction, which is a lie told at exactly the moment
 * the player most needs the truth.
 *
 * ---------------------------------------------------------------------------
 * ZERO FLUX LOOKS STOPPED, NOT SLOW
 * ---------------------------------------------------------------------------
 *
 * A dash animation that asymptotically slows reads as "working, but slowly" when
 * the truth is "stopped", and stopped is the walled state. Below
 * ZERO_FLUX_THRESHOLD the arrow changes treatment outright rather than merely
 * decelerating: the dashes go, the stroke thins to a hairline, the colour drops
 * to `ink2` and the arrowhead hollows out. Two different silhouettes, not two
 * speeds of the same one.
 *
 * THE DIM IS `ink2` RATHER THAN `ink3` AS OF UPDATELOGV7.md STAGE 2, and the
 * reason is a measurement rather than a preference. `ink3` on the cream pathway
 * card is 2.83:1, under the 3:1 WCAG 2.2 floor for non-text that carries
 * meaning. The stopped state is carried on four channels, stroke width, dash,
 * arrowhead fill and colour, and it was being carried on all four AT 2.83:1,
 * because every one of them is drawn in that colour. A channel count does not
 * help when the ink they share is the thing that is too faint. `ink2` is 6.34:1
 * on cream, clears the floor with room, and is still an obvious step down from
 * `ink`, so a stopped arrow still looks stopped and now also looks like it is
 * there. This file's own note that the track is "always present, so a stopped
 * arrow is still an arrow rather than a gap" was not true on a low-contrast
 * display until this change.
 *
 * ---------------------------------------------------------------------------
 * PHASE IS INTEGRATED, AND INTERPOLATED
 * ---------------------------------------------------------------------------
 *
 * `stroke-dashoffset` is written from the snapshot every frame rather than
 * handed to a CSS animation, because a CSS animation has to be restarted when
 * the rate changes and a restart reads as a stutter that carries no information.
 * The phase accumulates as the integral of rate over time, which is what makes a
 * reaction that speeds up and slows down look continuous instead of jumping.
 *
 * The clock it integrates against is game time plus the sub-tick remainder that
 * `loop.advance` returns, which is exactly what docs/SIMULATION.md Part 1 passes
 * to the renderer for. That is what makes 20Hz simulation look smooth at 60fps.
 * It is read only. Nothing here writes to simulation state, and the stage 1 test
 * that frame timing cannot reach the simulation still passes unchanged.
 */

import { useRef } from 'react';
import { useLiveNode, useReactionIndex } from '../RuntimeContext';
import { TICK_MS, type ActSnapshot } from '../runtime';
import type { Act1ReactionId } from '../../content/act1/reactions';
import { REACTIONS } from '../content';
import { Figure } from './Figure';
import { DASH_LENGTH, DASH_PIXELS_PER_FLUX_UNIT, ZERO_FLUX_THRESHOLD } from '../tuning';

const TRACK_HEIGHT = 26;
const MID = TRACK_HEIGHT / 2;

/**
 * The two treatments, named rather than inlined as three pairs of ternaries.
 *
 * WHY THIS IS A CONSTANT AND NOT A CONDITIONAL. Everything an arrow says about
 * itself is written to the DOM from a per-frame callback, so none of it reaches
 * the static markup a test can render. UPDATELOGV7.md stage 2 tried to assert
 * the stopped colour by rendering the component and reading the output, and the
 * assertion passed with the wrong colour in place, because the stopped colour is
 * never in the output until a frame has run. A guard that cannot fail is worse
 * than no guard, so the treatments moved here where they can be read directly.
 *
 * Both are declared in full rather than as a base plus overrides, so "what does
 * a stopped arrow look like" is answerable by reading one object.
 */
export const ARROW_TREATMENT = {
  flowing: {
    stroke: 'var(--color-substrate)',
    width: '6',
    dash: `${DASH_LENGTH} ${DASH_LENGTH}`,
    headFill: 'var(--color-substrate)',
    headStroke: 'var(--color-ink)',
    trackStroke: 'var(--color-ink)',
  },
  stopped: {
    // `ink2`, not `ink3`. See the header note: `ink3` on cream is 2.83:1, and
    // all four of this state's channels are drawn in this one colour.
    stroke: 'var(--color-ink2)',
    width: '2',
    dash: 'none',
    headFill: 'var(--color-white)',
    headStroke: 'var(--color-ink2)',
    trackStroke: 'var(--color-ink2)',
  },
} as const;

export interface PathwayArrowProps {
  reaction: Act1ReactionId;
  /**
   * Swaps flowing dashes for a static arrow and an explicit numeric rate.
   *
   * A normal prop rather than a hook read inside, so the reduced path can be
   * rendered and asserted without faking a media query. PathwayCard reads
   * usePrefersReducedMotion once and passes it down.
   */
  reducedMotion: boolean;
}

/** Continuous game time in seconds, including the sub-tick remainder. */
function gameTimeSeconds(snapshot: ActSnapshot): number {
  return (snapshot.elapsedMs + snapshot.interpolation * TICK_MS) / 1000;
}

export function PathwayArrow({ reaction, reducedMotion }: PathwayArrowProps) {
  const index = useReactionIndex(reaction);
  const entry = REACTIONS[reaction];

  /** Accumulated dash travel in pixels, and the clock reading it was last advanced to. */
  const phase = useRef(0);
  const lastSeconds = useRef<number | null>(null);

  const flowRef = useLiveNode<SVGLineElement>((element, snapshot) => {
    const applied = snapshot.appliedFlux[index] as number;
    const now = gameTimeSeconds(snapshot);
    const previous = lastSeconds.current;
    lastSeconds.current = now;

    const moving = applied >= ZERO_FLUX_THRESHOLD;

    if (moving && previous !== null && now > previous) {
      phase.current -= applied * DASH_PIXELS_PER_FLUX_UNIT * (now - previous);
      // Wrap inside one dash period so the number stays small over a long
      // session. Two dash lengths is one period, so wrapping there is invisible.
      const period = DASH_LENGTH * 2;
      if (phase.current <= -period) phase.current += period;
      // Rounded to hundredths of a pixel without toFixed, which the tabular
      // figures lint rule bans in .tsx and is right to: a dash offset is not a
      // number anybody reads.
      element.setAttribute('stroke-dashoffset', `${Math.round(phase.current * 100) / 100}`);
    }

    // Compared before writing, so a stalled arrow costs nothing per frame.
    const state = moving ? 'flowing' : 'stopped';
    if (element.dataset.flow !== state) {
      element.dataset.flow = state;
      const treatment = ARROW_TREATMENT[state];
      element.setAttribute('stroke', treatment.stroke);
      element.setAttribute('stroke-width', treatment.width);
      element.setAttribute('stroke-dasharray', treatment.dash);
    }
  });

  const headRef = useLiveNode<SVGPathElement>((element, snapshot) => {
    const moving = (snapshot.appliedFlux[index] as number) >= ZERO_FLUX_THRESHOLD;
    const state = moving ? 'flowing' : 'stopped';
    if (element.dataset.flow === state) return;
    element.dataset.flow = state;
    element.setAttribute('fill', ARROW_TREATMENT[state].headFill);
    element.setAttribute('stroke', ARROW_TREATMENT[state].headStroke);
  });

  /**
   * The track dims when the reaction is stopped, in BOTH motion modes.
   *
   * Colour is not motion, so this is available to a reduced-motion player and
   * costs them nothing. Without it a stopped arrow under reduced motion looks
   * exactly like a running one apart from a small number, and DESIGN.md's point
   * is that the reduced path should carry the same reading, not the same
   * reading minus the obvious part.
   */
  const trackRef = useLiveNode<SVGLineElement>((element, snapshot) => {
    const moving = (snapshot.appliedFlux[index] as number) >= ZERO_FLUX_THRESHOLD;
    const state = moving ? 'flowing' : 'stopped';
    if (element.dataset.flow === state) return;
    element.dataset.flow = state;
    element.setAttribute('stroke', ARROW_TREATMENT[state].trackStroke);
  });

  return (
    <span className="flex min-w-0 flex-1 flex-col items-center gap-0.5" data-reaction={reaction}>
      <span className="text-micro font-body font-extrabold uppercase tracking-label text-ink2">
        {entry.text}
      </span>

      <span className="flex w-full min-w-0 items-center">
        <svg className="min-w-0 flex-1" height={TRACK_HEIGHT} aria-hidden="true">
          {/* The track. Always present, so a stopped arrow is still an arrow
              rather than a gap where a reaction used to be. */}
          <line
            ref={trackRef}
            x1="0"
            y1={MID}
            x2="100%"
            y2={MID}
            stroke="var(--color-ink)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {reducedMotion ? null : (
            <line
              ref={flowRef}
              x1="0"
              y1={MID}
              x2="100%"
              y2={MID}
              // The flowing treatment is the initial state, so the arrow looks
              // right on the first paint rather than for one frame looking
              // stopped and then correcting itself. The live callback owns it
              // from the second frame on.
              stroke="var(--color-substrate)"
              strokeWidth="6"
              strokeDasharray={`${DASH_LENGTH} ${DASH_LENGTH}`}
              strokeLinecap="butt"
              fill="none"
            />
          )}
        </svg>

        {/* The arrowhead is its own fixed-width SVG rather than an SVG marker,
            so its fill can be driven from the snapshot like everything else
            without defining one marker per state. */}
        <svg width="13" height={TRACK_HEIGHT} aria-hidden="true" className="shrink-0">
          <path
            ref={headRef}
            d={`M 1 ${MID - 6} L 12 ${MID} L 1 ${MID + 6} Z`}
            fill="var(--color-substrate)"
            stroke="var(--color-ink)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      {/*
        DESIGN.md's accessibility obligation. Reduced motion does not simply
        turn the animation off, it replaces the channel: the rate the dashes
        were carrying is stated as a number instead. Through Figure, with the
        reaction's own badge, like every other number in the game.

        ---------------------------------------------------------------------
        RATES ON DEMAND, AND IT IS THIS NUMBER RATHER THAN A SECOND ONE
        ---------------------------------------------------------------------

        UPDATELOGV7.md stage 4 asks for a screen reader user to be able to ask
        what is happening right now, and warns that a parallel textual readout
        will drift from the visible one. So there is no parallel readout. The
        figure is now rendered in BOTH motion modes and is merely hidden from
        sight when the dashes are carrying the same fact, which is what
        `sr-only` means and is the reason it is the right tool here rather than
        a duplicate string in content.ts.

        It is not in a live region and nothing announces it. It is read when the
        user navigates to it, which is the whole of "on demand", and it is why a
        number that changes twenty times a second can sit in the accessibility
        tree without the page ever talking. The two SVGs above are
        `aria-hidden`, so this is the only thing on an arrow that speech sees.
      */}
      <Figure
        read={(snapshot) => snapshot.appliedFlux[index] as number}
        decimals={2}
        unit="/s"
        size="micro"
        badge={entry.badge}
        badgeDisplay="attached"
        className={reducedMotion ? '' : 'sr-only'}
      />
    </span>
  );
}
