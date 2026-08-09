/**
 * The keyboard path, asserted. UPDATELOGV7.md stage 3.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS FILE CAN AND CANNOT HOLD, STATED UP FRONT
 * ---------------------------------------------------------------------------
 *
 * The test environment is `node` and there is no DOM in it, which is deliberate
 * everywhere else in this suite: the illustration is a pure function of the pool
 * table and the pathway is a pure function of the reaction table, so both are
 * asserted by rendering to a string and reading the geometry. Focus is not like
 * that. Moving focus into an overlay, trapping it, and giving it back are
 * behaviours of a live document, and a string cannot have an active element.
 *
 * So this file holds the half that is structural, and it holds it tightly:
 *
 *   - every control is a real button or input, so it is operable by keyboard
 *     without a handler, which is why V3 got this right without knowing it
 *   - the tab order is the reading order, asserted as a sequence rather than as
 *     a set, because DOM order IS tab order once nothing sets a positive
 *     tabindex, and nothing here does
 *   - the file input is focusable, which is the one place it was not
 *   - the focus indicator exists, uses :focus-visible, and is drawn inside
 *   - an overlay's aria-modal and its focus trap cannot disagree, because one
 *     prop drives both
 *
 * The other half, verified in a real browser by keyboard and reported in the
 * stage 3 report rather than faked here: focus moving into an overlay, the trap
 * holding, focus returning to the opener, and focus surviving a purchase. Making
 * those testable needs a DOM implementation this project does not depend on, and
 * adding one to close an assertion is a decision worth taking deliberately
 * rather than inside an accessibility stage.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { App } from '../../App';
import { Overlay } from '../components/Overlay';
import { Card } from '../components/Card';

const CSS = readFileSync(new URL('../../index.css', import.meta.url), 'utf8');

const SCREEN = renderToStaticMarkup(<App />);

/**
 * Every tag in document order that a browser will make a tab stop.
 *
 * Reads the markup rather than a list the components published about
 * themselves, for the same reason illustration.test.ts counts edges in the path
 * data: a component that reports its own focusability can be wrong about it in
 * exactly the way this test exists to catch.
 */
function tabStops(markup: string): { tag: string; name: string }[] {
  const stops: { tag: string; name: string }[] = [];
  for (const match of markup.matchAll(/<(button|input|a|select|textarea)\b([^>]*)>/g)) {
    const tag = match[1] as string;
    const attrs = match[2] as string;
    if (/\bdisabled\b/.test(attrs)) continue;
    if (/tabindex="-1"/i.test(attrs)) continue;
    if (/\baria-hidden\b/.test(attrs)) continue;
    const label = /aria-label="([^"]*)"/.exec(attrs)?.[1];
    stops.push({ tag, name: label ?? '' });
  }
  return stops;
}

describe('the game is operable without a pointer', () => {
  it('makes every control a native element rather than a handler on a div', () => {
    // This is why V3's keyboard path worked without anybody building one, and
    // UPDATELOGV7.md's own Decisions section got it wrong by grepping for
    // tabIndex and finding none. A real button needs no tabIndex.
    const stops = tabStops(SCREEN);
    expect(stops.length).toBeGreaterThan(0);
    // `a` joins the list in UPDATELOGV12.md stage 4 and only because a skip link
    // arrived. An anchor with an href is a native control and the right element
    // for in-page navigation, which is the one thing on this screen that is
    // navigation rather than an action.
    for (const stop of stops) {
      expect(['button', 'input', 'a']).toContain(stop.tag);
    }
  });

  it('puts no positive tabindex anywhere, so DOM order is tab order', () => {
    // A positive tabindex jumps the element ahead of everything in document
    // order and is the standard way a tab order stops matching the layout. The
    // reading-order guarantee below depends on there being none.
    expect(/tabindex="[1-9]/i.test(SCREEN)).toBe(false);
  });

  it('follows the reading order of the layout: top bar, timeline, rail, shelf, save', () => {
    // DESIGN.md's layout, top to bottom. The pathway card contributes no stop,
    // because a reaction arrow is not a control. Positions are read as offsets
    // into the markup rather than as indices into a label list, because the top
    // bar's About button is named by its text and the rail's affordances by
    // aria-label, and mixing the two is how this assertion first got written
    // wrong.
    //
    // THE TIMELINE IS IN THIS LIST AS OF UPDATELOGV12.md STAGE 2, and adding it
    // broke this assertion in the useful way. The shelf was located as the first
    // `<section` in the markup, which was true for exactly as long as the shelf
    // was the only section on the screen. It is found by its own heading now, so
    // a third section landing above it moves nothing here.
    const at = (needle: string): number => SCREEN.indexOf(needle);

    const header = at('<header');
    const timeline = at('Deep time');
    const rail = at('<nav');
    const shelf = at('>Unlocks<');
    const carbon = at('6 carbons, split in two');
    const nad = at('NAD+ has run out');
    const atp = at('ATP does not pile up');
    const yieldPanel = at('About the yield');
    const exportAction = at('Export');

    for (const index of [
      header,
      timeline,
      rail,
      shelf,
      carbon,
      nad,
      atp,
      yieldPanel,
      exportAction,
    ]) {
      expect(index).toBeGreaterThan(-1);
    }

    // The five regions, in order. Left to right in the layout is where am I,
    // what is happening, why, so the timeline reads before the rail.
    expect(header).toBeLessThan(timeline);
    expect(timeline).toBeLessThan(rail);
    expect(rail).toBeLessThan(shelf);
    expect(shelf).toBeLessThan(exportAction);
    // The rail's three affordances, in pathway order, which is the order the
    // cards are read top to bottom.
    expect(rail).toBeLessThan(carbon);
    expect(carbon).toBeLessThan(nad);
    expect(nad).toBeLessThan(atp);
    // The shelf's affordance comes after the whole rail, not interleaved.
    expect(atp).toBeLessThan(yieldPanel);
    expect(yieldPanel).toBeLessThan(exportAction);
  });

  it('starts the tab order in the top bar', () => {
    const first = /<(button|input)\b/.exec(SCREEN)?.index ?? -1;
    expect(first).toBeGreaterThan(SCREEN.indexOf('<header'));
    expect(first).toBeLessThan(SCREEN.indexOf('<nav'));
  });

  it('has a skip link, because the rail stopped being cheap to traverse', () => {
    /**
     * THIS ASSERTION USED TO SAY THE OPPOSITE AND THE INVERSION IS THE POINT.
     *
     * UPDATELOGV7.md stage 3 step 5 asked for a skip link past eight pool cards.
     * Stage 3 declined and measured why: a pool card is not focusable and only
     * three carry an info affordance, so the rail was THREE stops and a skip
     * link over three stops is more furniture than it saves. It also wrote down
     * the condition for revisiting: "if a later log makes pool cards interactive
     * this fails, which is the right moment to revisit it."
     *
     * UPDATELOGV12.md stage 4 is that log. Provenance-on-click makes every badge
     * an affordance, so the rail is 13 stops and the timeline above it is 9.
     * V7's argument was right on its numbers and its numbers changed.
     */
    const rail = SCREEN.slice(SCREEN.indexOf('<nav'), SCREEN.indexOf('</nav>'));
    expect(tabStops(rail).length).toBeGreaterThan(4);
    expect(SCREEN).toContain('href="#pathway-column"');
    expect(SCREEN).toContain('id="pathway-column"');
    // First tab stop inside main, so it is the first thing a keyboard user meets
    // on the way into the columns.
    const main = SCREEN.indexOf('<main');
    expect(SCREEN.indexOf('href="#pathway-column"')).toBeGreaterThan(main);
    expect(SCREEN.indexOf('href="#pathway-column"')).toBeLessThan(SCREEN.indexOf('Deep time'));
  });

  it('leaves the file input focusable, so import is reachable at all', () => {
    // THE ONE CONTROL THAT WAS UNREACHABLE. It carried Tailwind's `hidden`,
    // which is display: none, which removes an element from the tab order.
    // Export worked by keyboard and import did not, from V4 until stage 3 of
    // this log. `sr-only` clips it to one pixel and leaves it focusable.
    const input = /<input[^>]*type="file"[^>]*>/.exec(SCREEN)?.[0] ?? '';
    expect(input).not.toBe('');
    expect(input).not.toMatch(/class="[^"]*\bhidden\b/);
    expect(input).toMatch(/class="[^"]*\bsr-only\b/);
    expect(input).not.toMatch(/\bdisabled\b/);
    // And it is a tab stop by the same reading the rest of this file uses.
    expect(tabStops(input).length).toBe(1);
  });
});

describe('the focus indicator', () => {
  it('exists, and is drawn on :focus-visible rather than on :focus', () => {
    // :focus fires for a pointer too, and a ring that appears when you click a
    // button is the thing that made everybody turn focus rings off.
    expect(CSS).toMatch(/:focus-visible\s*\{[^}]*outline:/);
    expect(CSS).not.toMatch(/[^-]:focus\s*\{/);
  });

  it('draws it inside the element, not outside, because of the offset shadow', () => {
    // A NEGATIVE offset is the whole design. DESIGN.md's 4px 4px 0 shadow is a
    // solid ink copy of the shape down and to the right, so an outer ring is
    // clean on two edges and merges into the shadow on the other two.
    const rule = /:focus-visible\s*\{([^}]*)\}/.exec(CSS)?.[1] ?? '';
    const offset = /outline-offset:\s*(-?[\d.]+)px/.exec(rule)?.[1];
    expect(offset).toBeDefined();
    expect(Number(offset)).toBeLessThan(0);
  });

  it('draws it in ink, which clears 3:1 against every surface it can sit on', () => {
    // Measured in stage 1: ink is 14.19:1 or better against all seven surfaces,
    // against a 3:1 requirement for a non-text indicator. Asserted against the
    // token rather than a ratio, because designSystem.test.ts already holds
    // index.css to DESIGN.md's palette.
    const rule = /:focus-visible\s*\{([^}]*)\}/.exec(CSS)?.[1] ?? '';
    expect(rule).toContain('var(--color-ink)');
  });

  it('gives small controls the outer variant, since they have no room inside', () => {
    expect(CSS).toMatch(/\[data-focus-ring='outer'\]:focus-visible\s*\{[^}]*outline-offset:\s*\d/);
    // And something actually asks for it, so the rule is not dead.
    expect(SCREEN).toContain('data-focus-ring="outer"');
  });
});

describe('an overlay cannot claim to be modal without behaving like one', () => {
  const render = (dim: boolean): string =>
    renderToStaticMarkup(
      <Overlay onDismiss={() => {}} label="probe" dim={dim}>
        <button type="button">inside</button>
      </Overlay>,
    );

  it('names itself as a dialog and can hold focus even when empty', () => {
    const markup = renderToStaticMarkup(
      <Overlay onDismiss={() => {}} label="probe">
        <span>no controls</span>
      </Overlay>,
    );
    expect(markup).toContain('role="dialog"');
    expect(markup).toContain('aria-label="probe"');
    // A focus target, never a tab stop.
    expect(markup).toContain('tabindex="-1"');
  });

  it('ties aria-modal to the same prop that drives the trap', () => {
    // Stage 1 found the About panel claiming aria-modal="true" while all nine
    // controls behind it were still tabbable, which is worse than no dialog
    // role: assistive technology hides a background the keyboard walks into.
    // One prop now drives both, so they cannot drift apart again.
    expect(render(true)).toContain('aria-modal="true"');
    expect(render(false)).toContain('aria-modal="false"');
  });

  it('keeps the scrim out of the tab order', () => {
    // It is a click target for a pointer and it is not a control.
    const scrim = /<button[^>]*aria-hidden[^>]*>/.exec(render(true))?.[0] ?? '';
    expect(scrim).toContain('tabindex="-1"');
  });
});

describe('a card can take focus without becoming a tab stop', () => {
  it('is a target only when asked, and never a stop', () => {
    // Where focus goes when a purchase disables the button it was on.
    expect(renderToStaticMarkup(<Card focusable>x</Card>)).toContain('tabindex="-1"');
    expect(renderToStaticMarkup(<Card>x</Card>)).not.toContain('tabindex');
  });
});
