/**
 * Provenance on click, as mechanism. UPDATELOGV12.md stage 4.
 *
 * The eighth guard, and it is the third time this project has used exactly this
 * pattern: `disclosure.test.tsx` parses the disclosure blockquote out of
 * docs/SCIENCE.md and fails the build if the game disagrees by a character, and
 * `divergenceTable.test.ts` parses docs/ECONOMY.md and fails if a tuned scalar
 * has no row. Both exist because nothing in `src/` may read a document at
 * runtime, so the only way a citation can be trusted is for a test to resolve it.
 *
 * ---------------------------------------------------------------------------
 * THREE CHECKS, AND THE THIRD IS THE IMPORTANT ONE
 * ---------------------------------------------------------------------------
 *
 *   1. every cited docs/SCIENCE.md Part resolves to a real heading
 *   2. every cited docs/ECONOMY.md row id resolves to a real row, AND the
 *      verdict the panel claims matches what the document says
 *   3. every badge in the content directory resolves to a complete destination
 *
 * The third makes provenance complete by construction rather than by diligence.
 * A badged figure whose panel would open empty fails the build instead.
 *
 * ---------------------------------------------------------------------------
 * WHERE THE THIRD CHECK HAS TEETH AND WHERE IT DOES NOT, STATED RATHER THAN
 * IMPLIED
 * ---------------------------------------------------------------------------
 *
 * It has real teeth on Sourced and Contested. A badge citing a Part nobody has
 * written a subject line for fails, and a Contested badge with no authored
 * argument fails, which is the case that matters most because the act 3 log
 * makes a contested-science beat a headline feature.
 *
 * On Tuned it is weaker and honestly so. A Tuned badge naming a row must have
 * that row exist and carry the verdict the panel claims. A Tuned badge naming NO
 * row falls to the build-statement destination, which is a real destination
 * rather than an empty panel, and the check on it is only that the badge carries
 * a reason, which the type already requires. That is the honest limit: the guard
 * cannot know whether a sentence about this build should have been a row.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { sourced, contested, tuned, tunedRow, type BadgeSpec } from '../components/Badge';
import { ProvenancePanel } from '../components/ProvenancePanel';
import { ProvenanceProvider } from '../components/ProvenanceContext';
import { Badge } from '../components/Badge';
import {
  CONTESTED,
  PART_SUBJECTS,
  TUNED_ROWS,
  VERDICTS,
  citedPart,
  provenanceFor,
} from '../content';
import * as CONTENT from '../content';

const ROOT = join(import.meta.dirname, '..', '..', '..');
const SCIENCE = readFileSync(join(ROOT, 'docs', 'SCIENCE.md'), 'utf8');
const ECONOMY = readFileSync(join(ROOT, 'docs', 'ECONOMY.md'), 'utf8');
const CONTENT_DIR = join(ROOT, 'src', 'ui', 'content');

/* ===========================================================================
   EVERY BADGE THE GAME SHIPS, FOUND BY WALKING THE EXPORTS

   Walked rather than listed, for the reason Spine A gave when it widened the
   accessibility guard: a list that does not include something cannot report that
   it does not. Every content module is re-exported through `index.ts`, so
   importing the barrel and walking it reaches all of them.
   =========================================================================== */

function isBadge(value: unknown): value is BadgeSpec {
  if (typeof value !== 'object' || value === null) return false;
  const kind = (value as { kind?: unknown }).kind;
  return kind === 'sourced' || kind === 'tuned' || kind === 'contested' || kind === 'needs-source';
}

function collectBadges(value: unknown, seen: Set<unknown>, into: BadgeSpec[]): void {
  if (typeof value !== 'object' || value === null) return;
  if (seen.has(value)) return;
  seen.add(value);
  if (isBadge(value)) {
    into.push(value);
    return;
  }
  for (const entry of Object.values(value as Record<string, unknown>)) {
    collectBadges(entry, seen, into);
  }
}

function shippedBadges(): BadgeSpec[] {
  const found: BadgeSpec[] = [];
  collectBadges(CONTENT as unknown, new Set(), found);
  return found;
}

describe('the guard reaches everything it should', () => {
  it('walks the content directory rather than a list', () => {
    const onDisk = readdirSync(CONTENT_DIR).filter((entry) => entry.endsWith('.ts'));
    const barrel = readFileSync(join(CONTENT_DIR, 'index.ts'), 'utf8');
    for (const file of onDisk) {
      if (file === 'index.ts' || file === 'common.ts') continue;
      expect(barrel).toContain(`'./${file.replace('.ts', '')}'`);
    }
    expect(onDisk.length).toBeGreaterThanOrEqual(12);
  });

  it('found a lot of badges, so nothing below is vacuous', () => {
    const badges = shippedBadges();
    expect(badges.length).toBeGreaterThan(60);
    expect(badges.some((badge) => badge.kind === 'sourced')).toBe(true);
    expect(badges.some((badge) => badge.kind === 'tuned')).toBe(true);
    expect(badges.some((badge) => badge.kind === 'contested')).toBe(true);
  });

  it('ships no development-only badge, which the release gate also enforces', () => {
    expect(shippedBadges().some((badge) => badge.kind === 'needs-source')).toBe(false);
  });
});

/* ===========================================================================
   CHECK 1. EVERY CITED docs/SCIENCE.md PART RESOLVES.
   =========================================================================== */

describe('check 1: every cited Part resolves to a real heading', () => {
  const cited = shippedBadges()
    .filter((badge) => badge.kind === 'sourced' || badge.kind === 'contested')
    .map((badge) => (badge as { source: string }).source);

  it('cites something, so this is not vacuous', () => {
    expect(cited.length).toBeGreaterThan(20);
  });

  it.each([...new Set(cited)])('%s names a Part the document has', (source) => {
    const part = citedPart(source);
    expect(part).not.toBeNull();
    expect(SCIENCE).toContain(`# Part ${part as string}:`);
  });

  it('has a subject line for every Part the document has, not only the cited ones', () => {
    // Written for all seven so a figure citing any of them lands somewhere the
    // day something cites it, rather than the day it is noticed.
    const headings = [...SCIENCE.matchAll(/^# Part (\d+):/gm)].map((m) => m[1] as string);
    expect(headings.length).toBe(7);
    for (const part of headings) expect(PART_SUBJECTS[part]).toBeDefined();
  });
});

/* ===========================================================================
   CHECK 2. EVERY CITED docs/ECONOMY.md ROW RESOLVES, AND THE VERDICT IS RIGHT.
   =========================================================================== */

/**
 * The verdict the DOCUMENT gives a row, derived rather than transcribed.
 *
 * docs/ECONOMY.md, "How to read a row": `The real behaviour` is cited to
 * docs/SCIENCE.md where the science says anything at all and is left EMPTY where
 * it says nothing. So an empty fourth cell is UNSOURCED, which is exactly what
 * makes UNSOURCED a category of the table rather than a badge.
 */
function verdictOf(id: string): 'DEPARTURE' | 'UNSOURCED' | null {
  for (const line of ECONOMY.split('\n')) {
    if (!line.startsWith(`| ${id} |`)) continue;
    const cells = line.split('|').map((cell) => cell.trim());
    // | Id | Value | Where | The real behaviour | ...
    const real = cells[4];
    if (real === undefined) return null;
    return real.length === 0 ? 'UNSOURCED' : 'DEPARTURE';
  }
  return null;
}

describe('check 2: every cited row resolves, and says what the panel claims', () => {
  const rows = shippedBadges()
    .filter((badge) => badge.kind === 'tuned')
    .map((badge) => (badge as { divergenceRow?: string }).divergenceRow)
    .filter((row): row is string => row !== undefined);

  it('some badge actually names a row, which had never been true before', () => {
    // `divergenceRow` was shaped by V3 for exactly this and was populated by
    // nothing until this stage. A guard over an empty set is a rubber stamp.
    expect(rows.length).toBeGreaterThanOrEqual(4);
  });

  it.each([...new Set(rows)])('row %s exists in docs/ECONOMY.md', (row) => {
    expect(verdictOf(row)).not.toBeNull();
  });

  it.each(Object.keys(TUNED_ROWS))('row %s carries the verdict the panel claims', (row) => {
    // The panel cannot say DEPARTURE about a row the document leaves blank.
    expect(TUNED_ROWS[row]).toBe(verdictOf(row));
  });

  it('reads the verdict from the document rather than agreeing with itself', () => {
    // Guard the guard, on the derivation. C1 has a full real-behaviour cell and
    // U1 has an empty one, so if these two ever agree the parser has stopped
    // reading the column it thinks it is reading.
    expect(verdictOf('C1')).toBe('DEPARTURE');
    expect(verdictOf('U1')).toBe('UNSOURCED');
    expect(verdictOf('NOSUCHROW')).toBeNull();
  });

  it('ships both verdicts, so the UNSOURCED wording is reachable in play', () => {
    const shipped = new Set(Object.values(TUNED_ROWS));
    expect(shipped.has('DEPARTURE')).toBe(true);
    expect(shipped.has('UNSOURCED')).toBe(true);
  });
});

/* ===========================================================================
   CHECK 3. EVERY BADGE RESOLVES TO A COMPLETE DESTINATION.
   =========================================================================== */

describe('check 3: no badged figure opens an empty panel', () => {
  it.each(
    [...new Set(shippedBadges().map((badge) => JSON.stringify(badge)))].map((json) => ({
      label: json.slice(0, 70),
      badge: JSON.parse(json) as BadgeSpec,
    })),
  )('$label resolves', ({ badge }) => {
    const provenance = provenanceFor(badge);
    expect(provenance).not.toBeNull();
    expect((provenance as { body: readonly string[] }).body.length).toBeGreaterThanOrEqual(2);
  });

  it('has an authored argument for every Contested badge, both sides', () => {
    for (const badge of shippedBadges()) {
      if (badge.kind !== 'contested') continue;
      const topic = CONTESTED[badge.source];
      expect(topic).toBeDefined();
      expect((topic as { sides: readonly string[] }).sides.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('fails on a Part with no subject line', () => {
    // Probe 1. docs/SCIENCE.md has seven Parts; a citation to an eighth cannot
    // resolve and the panel must not open.
    expect(provenanceFor(sourced('docs/SCIENCE.md Part 9, something'))).toBeNull();
    expect(provenanceFor(sourced('no citation at all'))).toBeNull();
  });

  it('fails on a Contested badge with nothing authored for it', () => {
    // Probe 2, and this is the one the act 3 log depends on. A new contested
    // beat that nobody wrote the argument for fails the build rather than
    // opening a panel that says the science is unsettled and stops there.
    expect(provenanceFor(contested('docs/SCIENCE.md Part 4, a new dispute'))).toBeNull();
  });

  it('fails on a Tuned badge naming a row nobody wrote a verdict for', () => {
    // Probe 3. The row may exist in the document and the panel still cannot
    // claim a verdict for it until one is authored and checked.
    expect(provenanceFor(tunedRow('a reason', 'C2'))).toBeNull();
    expect(provenanceFor(tunedRow('a reason', 'ZZ99'))).toBeNull();
  });
});

/* ===========================================================================
   THE FOUR DESTINATIONS, AND WHAT THEY SAY.
   =========================================================================== */

describe('all four destinations work', () => {
  it('Sourced opens its docs/SCIENCE.md Part', () => {
    const provenance = provenanceFor(sourced('docs/SCIENCE.md Part 2, glycolysis'));
    expect(provenance?.kind).toBe('sourced');
    expect(provenance?.destination).toBe('docs/SCIENCE.md Part 2, glycolysis');
    expect(provenance?.body.join(' ')).toContain(PART_SUBJECTS['2'] as string);
  });

  it('Tuned opens its docs/ECONOMY.md row and says DEPARTURE or UNSOURCED', () => {
    const departure = provenanceFor(tunedRow('a reason', 'C5'));
    expect(departure?.destination).toBe('docs/ECONOMY.md row C5');
    expect(departure?.body.join(' ')).toContain('DEPARTURE');

    const unsourced = provenanceFor(tunedRow('a reason', 'S1'));
    expect(unsourced?.destination).toBe('docs/ECONOMY.md row S1');
    expect(unsourced?.body.join(' ')).toContain('UNSOURCED');
  });

  it('does not soften the UNSOURCED case', () => {
    /**
     * THE ASSERTION THIS FEATURE EXISTS FOR. docs/ECONOMY.md says the real
     * behaviour cell of an UNSOURCED row is empty on purpose and that the
     * emptiness is the content of the row rather than a gap in it. The panel has
     * to say that plainly. Softening it would be the exact failure the table
     * exists to prevent, and the temptation is real because it reads as an
     * admission.
     */
    expect(VERDICTS.UNSOURCED).toContain('no real counterpart at all');
    expect(VERDICTS.UNSOURCED).toContain('on purpose');
    expect(VERDICTS.UNSOURCED).not.toMatch(/approximat|roughly|based on|inspired/i);
  });

  it('Contested says what is argued and who argues which side', () => {
    const provenance = provenanceFor(contested('docs/SCIENCE.md Part 6, stop 3'));
    expect(provenance?.kind).toBe('contested');
    expect(provenance?.body.length).toBeGreaterThanOrEqual(3);
    expect(provenance?.body.join(' ')).toContain('2015');
  });

  it('measured says it came from your own session and points nowhere', () => {
    const provenance = provenanceFor(null, 'real time between two loads');
    expect(provenance?.kind).toBe('measured');
    expect(provenance?.destination).toBe('');
    expect(provenance?.body.join(' ')).toContain('your own session');
    expect(provenance?.body.join(' ')).toContain('real time between two loads');
  });

  it('refuses a measured value with nothing measured', () => {
    expect(provenanceFor(null)).toBeNull();
    expect(provenanceFor(null, '')).toBeNull();
  });

  it('a Tuned badge with no row says it has none and why, rather than nothing', () => {
    const provenance = provenanceFor(tuned('because the button says so'));
    expect(provenance).not.toBeNull();
    expect(provenance?.body.join(' ')).toContain('names no divergence row');
    expect(provenance?.body.join(' ')).toContain('because the button says so');
  });
});

/* ===========================================================================
   THE AFFORDANCE AND THE PANEL.
   =========================================================================== */

describe('the interaction', () => {
  it('makes the badge a button only where something offers to answer', () => {
    const plain = renderToStaticMarkup(<Badge badge={sourced('docs/SCIENCE.md Part 2, x')} />);
    expect(plain).not.toContain('<button');

    const offered = renderToStaticMarkup(
      <ProvenanceProvider onOpen={() => {}}>
        <Badge badge={sourced('docs/SCIENCE.md Part 2, x')} />
      </ProvenanceProvider>,
    );
    expect(offered).toContain('<button');
    // The visible word stays inside the accessible name.
    expect(offered).toContain('aria-label="Sourced. Where this comes from"');
    expect(offered).toContain('>Sourced<');
  });

  it('reuses Overlay rather than reimplementing focus and Escape', () => {
    const source = readFileSync(
      join(ROOT, 'src', 'ui', 'components', 'ProvenancePanel.tsx'),
      'utf8',
    );
    expect(source).toContain("from './Overlay'");
    // Every part of the interaction the stage asks for lives in Overlay and has
    // since V7 stage 3. A second copy here is a second thing to drift. Comments
    // stripped, because the header explains the reuse by naming what it reuses.
    const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
    for (const own of ['addEventListener', 'Escape', 'activeElement', 'focus()']) {
      expect(code).not.toContain(own);
    }
  });

  it('renders as a dimmed dialog, so focus is trapped and returned', () => {
    const provenance = provenanceFor(contested('docs/SCIENCE.md Part 6, stop 1'));
    const markup = renderToStaticMarkup(
      <ProvenancePanel content={provenance as NonNullable<typeof provenance>} onDismiss={() => {}} />,
    );
    expect(markup).toContain('role="dialog"');
    expect(markup).toContain('aria-modal="true"');
    // Lilac means contested, and only that.
    expect(markup).toContain('bg-lilac');
  });
});
