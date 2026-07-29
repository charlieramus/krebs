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
import { PathwayArrow } from '../components/PathwayArrow';
import { RuntimeProvider } from '../RuntimeContext';
import { ACT1_REACTION_IDS, type Act1ReactionId } from '../../content/act1/reactions';
import { REACTIONS } from '../content';
import { badgeTrace } from '../components/Badge';

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

describe('every act 1 reaction is on the pathway card', () => {
  it('names all five, so none is drawn without a label', () => {
    for (const reaction of ACT1_REACTION_IDS) {
      expect(render(reaction, false)).toContain(REACTIONS[reaction].text);
    }
    expect(ACT1_REACTION_IDS).toHaveLength(5);
  });
});
