/**
 * The teaching layer's contracts, as mechanism. UPDATELOGV6.md stage 4.
 *
 * Three of these are rules that existed in prose and had never been checked,
 * and all three were cheap to keep while there was one coach mark and stop being
 * cheap the moment there are three and a panel:
 *
 *   1. DESIGN.md: "The source row is mandatory. A coach mark without one does
 *      not ship." And UPDATELOGV6.md's Decisions: "every one of them has to
 *      resolve to a real docs/SCIENCE.md section." Both are asserted, and the
 *      Part is resolved against the document rather than against a list here.
 *   2. DESIGN.md: "Two paragraphs is a hard ceiling." It has never bound,
 *      because there has only ever been one mark.
 *   3. docs/CONTENT_STYLE.md Part 5's ceilings for the panel and the headings.
 *
 * The fourth is different in kind. `blobReadout` puts numbers into player-facing
 * text for the first time in the project's history, so what matters is not that
 * it says something but that what it says is DERIVED from the conserved-weight
 * table rather than typed. A readout that claims six carbons for a molecule the
 * pathway no longer makes with six is worse than no readout.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { TeachingPanel } from '../components/TeachingPanel';
import {
  ATP_COACH_MARK,
  CARBON_COACH_MARK,
  CARRIER_READOUT,
  NAD_COACH_MARK,
  YIELD_PANEL,
  blobReadout,
  type CoachMark,
} from '../content';
import { ACT1_POOL_CARDS, carbonOf, phosphateOf } from '../poolCards';

const SCIENCE = join(import.meta.dirname, '..', '..', '..', 'docs', 'SCIENCE.md');

const MARKS: readonly (readonly [string, CoachMark])[] = [
  ['NAD_COACH_MARK', NAD_COACH_MARK],
  ['CARBON_COACH_MARK', CARBON_COACH_MARK],
  ['ATP_COACH_MARK', ATP_COACH_MARK],
];

/** The `# Part N:` headings docs/SCIENCE.md actually has. */
function parts(): Set<string> {
  const found = new Set<string>();
  for (const line of readFileSync(SCIENCE, 'utf8').split('\n')) {
    const match = /^# (Part \d+):/.exec(line);
    if (match !== null) found.add(match[1] as string);
  }
  return found;
}

const words = (text: string): number => text.trim().split(/\s+/).length;
const characters = (entries: readonly { text: string }[]): number =>
  entries.reduce((total, entry) => total + entry.text.length, 0);

describe('every coach mark honours the contract DESIGN.md sets', () => {
  it('found docs/SCIENCE.md is still writing its Parts in the expected shape', () => {
    // Guard the guard. If this parser reads nothing, the assertion below passes
    // vacuously and a source row could name anything at all.
    expect(parts().size).toBeGreaterThanOrEqual(6);
    expect(parts().has('Part 2')).toBe(true);
  });

  it.each(MARKS)('%s carries a source row that resolves to a real Part', (_name, mark) => {
    expect(mark.source.length).toBeGreaterThan(0);
    const part = /^docs\/SCIENCE\.md (Part \d+)/.exec(mark.source)?.[1];
    expect(part).toBeDefined();
    expect(parts().has(part as string)).toBe(true);
  });

  it.each(MARKS)('%s stays inside the two paragraph ceiling', (_name, mark) => {
    expect(mark.body.length).toBeLessThanOrEqual(2);
    // docs/CONTENT_STYLE.md Part 5: 400 characters across the body.
    expect(characters(mark.body)).toBeLessThanOrEqual(400);
  });

  it.each(MARKS)('%s keeps its heading and action inside their ceilings', (_name, mark) => {
    expect(words(mark.heading.text)).toBeLessThanOrEqual(6);
    // 5, not 4. This assertion is why: it failed on V3's "Show me what recycles
    // it", and docs/CONTENT_STYLE.md was corrected rather than the best line in
    // the game. See its decisions log, 2026-08-04.
    expect(words(mark.action.text)).toBeLessThanOrEqual(5);
  });

  it('puts each mark on the card that shows the thing it is about', () => {
    const carrying = ACT1_POOL_CARDS.filter((card) => card.coach !== undefined).map((card) => card.id);
    expect(carrying).toEqual(['g3p', 'nicotinamide', 'adenylate']);
  });
});

describe('the teaching panel', () => {
  it('carries a source row that resolves to a real Part', () => {
    const part = /^docs\/SCIENCE\.md (Part \d+)/.exec(YIELD_PANEL.source)?.[1];
    expect(part).toBeDefined();
    expect(parts().has(part as string)).toBe(true);
  });

  it('is longer than a coach mark, which is the whole reason it exists', () => {
    expect(YIELD_PANEL.body.length).toBeGreaterThan(2);
  });

  it('stays inside its docs/CONTENT_STYLE.md ceiling, which is looser and not absent', () => {
    expect(YIELD_PANEL.body.length).toBeLessThanOrEqual(6);
    expect(characters(YIELD_PANEL.body)).toBeLessThanOrEqual(1400);
  });

  it('renders its heading, every paragraph and the source row', () => {
    const markup = renderToStaticMarkup(
      <TeachingPanel content={YIELD_PANEL} onDismiss={() => {}} />,
    );
    expect(markup).toContain(YIELD_PANEL.heading.text);
    for (const paragraph of YIELD_PANEL.body) expect(markup).toContain(paragraph.text);
    expect(markup).toContain(YIELD_PANEL.source);
  });

  /**
   * The act 1 ceiling, in the one place the game states it as a sentence rather
   * than as a moving figure. docs/SCIENCE.md Part 2: "The 2 ATP figure is net of
   * the 2 ATP investment. This is worth surfacing in-game because the gross
   * figure of 4 is a common point of confusion." Both numbers have to be there
   * or the panel is not doing what the document asked for.
   */
  it('states both the gross and the net figure, which is what Part 2 asks for', () => {
    const prose = YIELD_PANEL.body.map((entry) => entry.text).join(' ');
    expect(prose).toContain('4');
    expect(prose).toContain('2 net');
    expect(prose.toLowerCase()).toContain('no atp at all');
  });
});

describe('the blob readout is derived, not written', () => {
  it('says the carbon count the pool table says', () => {
    // Six sides because glucose carries six carbon, three because a triose
    // carries three. If the stoichiometry moves, so does this.
    expect(blobReadout('Glucose', carbonOf('glucose'), phosphateOf('glucose')).text).toContain(
      `${carbonOf('glucose')} sides, ${carbonOf('glucose')} carbons`,
    );
    expect(carbonOf('glucose')).toBe(2 * carbonOf('g3p'));
  });

  it('counts phosphate for the carriers and says nothing about carbon they do not have', () => {
    const atp = blobReadout('ATP', carbonOf('atp'), phosphateOf('atp'));
    expect(atp.text).toContain(`${phosphateOf('atp')} phosphate`);
    expect(atp.text).not.toContain('carbons');
    expect(phosphateOf('atp')).toBe(phosphateOf('adp') + 1);
  });

  it('gives every readout a badge, including the carrier one', () => {
    expect(blobReadout('Glucose', 6, 0).badge.kind).toBe('sourced');
    expect(CARRIER_READOUT.badge.kind).toBe('sourced');
  });
});
