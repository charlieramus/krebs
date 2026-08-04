/**
 * DESIGN.md's accessibility obligation, asserted.
 *
 * "Because motion carries information, `prefers-reduced-motion` must not simply
 * disable it. Reduced motion swaps flowing dashes for a static arrow plus an
 * explicit numeric rate. Nothing in the game may be encoded in movement alone."
 *
 * That is the strongest sentence in DESIGN.md's motion section and it is the one
 * most likely to rot, because the reduced path is the one nobody looks at. So it
 * is a test rather than an intention: every arrow must state its rate as a
 * number when motion is off, and that number must go through Figure with a
 * badge like every other number in the game.
 *
 * Rendered through renderToStaticMarkup. Effects do not run, so the live
 * subscriptions never fire and the figures render empty, which is exactly what
 * is wanted here: this asserts that the numeric channel EXISTS in the reduced
 * path, not what it currently reads.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ARROW_TREATMENT, PathwayArrow } from '../components/PathwayArrow';
import { RuntimeProvider } from '../RuntimeContext';
import { ACT1_REACTION_IDS, type Act1ReactionId } from '../../content/act1/reactions';
import { REACTIONS } from '../content';
import { badgeTrace } from '../components/Badge';
import { formatFigure } from '../components/Figure';

function render(reaction: Act1ReactionId, reducedMotion: boolean): string {
  return renderToStaticMarkup(
    <RuntimeProvider>
      <PathwayArrow reaction={reaction} reducedMotion={reducedMotion} />
    </RuntimeProvider>,
  );
}

describe('reduced motion replaces the channel rather than removing it', () => {
  it.each(ACT1_REACTION_IDS)('%s renders a numeric rate when motion is reduced', (reaction) => {
    const markup = render(reaction, true);
    // Figure emits the unit as its own span. Matched as element content rather
    // than as a bare substring, because "/s" also occurs inside every "</svg>"
    // on the card and the loose version passed for the wrong reason.
    expect(markup).toContain('>/s<');
  });

  it.each(ACT1_REACTION_IDS)('%s renders that rate through Figure, badged', (reaction) => {
    const markup = render(reaction, true);
    // Figure puts the badge trace on the figure itself as a title, so a reader
    // can ask any number where it came from. No trace means the number did not
    // go through Figure.
    expect(markup).toContain(badgeTrace(REACTIONS[reaction].badge));
    expect(markup).toContain('tabular-nums');
  });

  it.each(ACT1_REACTION_IDS)('%s shows no numeric rate when motion is allowed', (reaction) => {
    // Not pedantry. If the number were always shown, the animation would be
    // redundant decoration rather than the channel DESIGN.md says it is, and
    // the reduced path would be untested by construction because it would look
    // identical.
    expect(render(reaction, false)).not.toContain('>/s<');
  });

  it('draws a flowing dash line only when motion is allowed', () => {
    expect(render('uptake', false)).toContain('stroke-dasharray');
    expect(render('uptake', true)).not.toContain('stroke-dasharray');
  });

  it('keeps the arrow and its track in both paths, so nothing disappears', () => {
    for (const reducedMotion of [true, false]) {
      const markup = render('payoff', reducedMotion);
      // The track line and the arrowhead triangle.
      expect(markup).toContain('<line');
      expect(markup).toContain('<path');
      expect(markup).toContain(REACTIONS.payoff.text);
    }
  });
});

describe('the other two rows of UPDATELOGV7.md stage 1 channel table', () => {
  it('never dims a stopped arrow to ink3, which is under the non-text floor', () => {
    // UPDATELOGV7.md stage 2 step 4. `ink3` on the cream pathway card measures
    // 2.83:1, under the 3:1 WCAG 2.2 floor for non-text that carries meaning,
    // and every one of the stopped state's four channels is drawn in that one
    // colour, so all four failed together.
    //
    // Asserted against ARROW_TREATMENT rather than against rendered markup, and
    // that is the whole reason the constant exists. The first version of this
    // test rendered the component and searched the output, and it PASSED with
    // ink3 restored, because every colour an arrow uses is written from a
    // per-frame callback and none of it is in the static markup. Probed, caught,
    // and the component changed rather than the assertion being weakened.
    for (const treatment of Object.values(ARROW_TREATMENT)) {
      for (const value of Object.values(treatment)) {
        expect(value).not.toContain('--color-ink3');
      }
    }
  });

  it('carries the stopped state on four channels, only one of which is colour', () => {
    // The channel count still matters, it just was not sufficient on its own
    // while all four channels shared a colour that was too faint to see.
    const { flowing, stopped } = ARROW_TREATMENT;
    expect(stopped.width).not.toBe(flowing.width);
    expect(stopped.dash).not.toBe(flowing.dash);
    expect(stopped.headFill).not.toBe(flowing.headFill);
    expect(stopped.stroke).not.toBe(flowing.stroke);
    // The dash is the one that has to be absent rather than merely different,
    // because a stopped arrow with a dash pattern reads as slow rather than
    // stopped whether it is animating or not.
    expect(stopped.dash).toBe('none');
  });

  it('still reaches the DOM, so naming the treatments did not orphan them', () => {
    // Guard the guard. ARROW_TREATMENT is only worth asserting on if the
    // component actually renders from it, and a constant nothing reads would
    // pass every assertion above.
    const markup = render('uptake', false);
    expect(markup).toContain(`stroke-width="${ARROW_TREATMENT.flowing.width}"`);
    expect(markup).toContain(`stroke-dasharray="${ARROW_TREATMENT.flowing.dash}"`);
    expect(markup).toContain(`fill="${ARROW_TREATMENT.flowing.headFill}"`);
  });
});

describe('a net rate says which way it is going without colour', () => {
  // The other row UPDATELOGV7.md stage 2 step 4 asks to confirm: the sign has to
  // be a character that is actually rendered, not a minus suppressed in favour
  // of a colour. `formatFigure` was exported and never tested, so this is the
  // first thing that holds it.
  it('renders an explicit sign on every non-zero rate', () => {
    expect(formatFigure(7.95, 2, true)).toBe('+7.95');
    expect(formatFigure(-7.95, 2, true)).toBe('-7.95');
    expect(formatFigure(0.004, 2, true)).toBe(' 0.00');
    expect(formatFigure(-0.004, 2, true)).toBe(' 0.00');
  });

  it('never writes a negative zero, and never signs an unsigned figure', () => {
    // A pool decayed to a denormal is zero to a reader, and "-0.00" is a
    // distracting claim about a value that is not negative. The space keeps the
    // column aligned under DESIGN.md's tabular figures.
    expect(formatFigure(-1e-320, 2, true)).toBe(' 0.00');
    expect(formatFigure(-1e-320, 2, false)).toBe('0.00');
    expect(formatFigure(944.72, 2, false)).toBe('944.72');
  });

  it('keeps the sign in its own column, so the digits do not shift', () => {
    // Why the zero case is a space rather than an empty string. Without it a
    // rate crossing zero would jog sideways, which reads as the number changing
    // when only its sign did.
    const widths = [formatFigure(7.95, 2, true), formatFigure(-7.95, 2, true), formatFigure(0, 2, true)];
    expect(new Set(widths.map((w) => w.length)).size).toBe(1);
  });
});

describe('every act 1 reaction is on the pathway card', () => {
  it('names all five, so none is drawn without a label', () => {
    for (const reaction of ACT1_REACTION_IDS) {
      expect(render(reaction, false)).toContain(REACTIONS[reaction].text);
    }
    expect(ACT1_REACTION_IDS).toHaveLength(5);
  });
});
