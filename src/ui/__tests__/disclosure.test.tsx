/**
 * The required disclosure, as a mechanism rather than an intention.
 *
 * docs/SCIENCE.md Part 1 does not ask for a disclosure, it prints one and says
 * "the following must appear in-game, in the about screen and on first launch,
 * not buried in a repo file". That is three separate obligations and until
 * UPDATELOGV6.md stage 3 none of them was checked by anything:
 *
 *   1. The words match. src/ui/content.ts quotes them, and a quotation drifts.
 *      Parsed out of docs/SCIENCE.md rather than transcribed here, so the
 *      dependency runs the right way and editing the document fails the build
 *      rather than silently disagreeing with the game.
 *   2. It appears on first launch. The first run card carries it.
 *   3. It appears in the about screen. The about panel carries it.
 *
 * Same shape as designSystem.test.ts, which parses DESIGN.md's Colour section
 * and fails when src/index.css disagrees with it.
 *
 * Rendered through renderToStaticMarkup, so effects never run and the live
 * subscriptions never fire. That is fine: what is being asserted is that the
 * text is in the markup at all, which is a structural claim.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { About } from '../components/About';
import { FirstRunCard } from '../components/FirstRunCard';
import { DISCLOSURE, FIRST_RUN } from '../content';

const SCIENCE = join(import.meta.dirname, '..', '..', '..', 'docs', 'SCIENCE.md');

/**
 * The blockquote under docs/SCIENCE.md's "Required disclosure text" heading.
 *
 * Read as the first `> ` line after that heading rather than by line number,
 * because V5 found five line citations that had drifted 42 lines into the wrong
 * Part. A section heading is the durable anchor.
 */
function requiredText(): string {
  const lines = readFileSync(SCIENCE, 'utf8').split('\n');
  const heading = lines.findIndex((line) => line.trim() === '## Required disclosure text');
  expect(heading).toBeGreaterThan(-1);
  const quote = lines.slice(heading + 1).find((line) => line.startsWith('> '));
  expect(quote).toBeDefined();
  return (quote as string).slice(2).trim();
}

/**
 * HTML entities, undone. renderToStaticMarkup escapes nothing in this text
 * today, but a future edit that adds an apostrophe would turn a passing
 * assertion into a confusing failure about `&#x27;` rather than about wording.
 */
function decode(markup: string): string {
  return markup
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&');
}

describe('the required disclosure', () => {
  it('is quoted in src/ui/content.ts word for word from docs/SCIENCE.md', () => {
    // A paraphrase of a required disclosure is not the required disclosure.
    expect(DISCLOSURE.text).toBe(requiredText());
  });

  it('appears on first launch', () => {
    const markup = decode(renderToStaticMarkup(<FirstRunCard onDismiss={() => {}} />));
    expect(markup).toContain(requiredText());
  });

  it('appears in the about panel', () => {
    const markup = decode(renderToStaticMarkup(<About onDismiss={() => {}} />));
    expect(markup).toContain(requiredText());
  });
});

describe('the first run', () => {
  it('says all three of its paragraphs and its action', () => {
    const markup = decode(renderToStaticMarkup(<FirstRunCard onDismiss={() => {}} />));
    for (const paragraph of FIRST_RUN.body) expect(markup).toContain(paragraph.text);
    expect(markup).toContain(FIRST_RUN.action.text);
  });

  it('carries a source row, to the same contract a coach mark has', () => {
    const markup = renderToStaticMarkup(<FirstRunCard onDismiss={() => {}} />);
    expect(FIRST_RUN.source.length).toBeGreaterThan(0);
    expect(markup).toContain(FIRST_RUN.source);
  });

  /**
   * docs/CONTENT_STYLE.md Part 5: one screen, three paragraphs, 300 characters
   * of prose. The disclosure is exempt and is not counted, which is why this
   * measures FIRST_RUN.body rather than the rendered card.
   */
  it('stays inside its docs/CONTENT_STYLE.md ceiling', () => {
    expect(FIRST_RUN.body.length).toBeLessThanOrEqual(3);
    const prose = FIRST_RUN.body.reduce((total, entry) => total + entry.text.length, 0);
    expect(prose).toBeLessThanOrEqual(300);
  });

  it('is reachable again from the about panel after it has been dismissed', () => {
    // The requirement is that it lives somewhere permanent as well as appearing
    // once, and the about panel is that somewhere. Same entries, not a copy.
    const markup = decode(renderToStaticMarkup(<About onDismiss={() => {}} />));
    for (const paragraph of FIRST_RUN.body) expect(markup).toContain(paragraph.text);
  });
});
