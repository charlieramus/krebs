/**
 * DESIGN.md's accessibility obligation, as mechanism. UPDATELOGV7.md stage 5.
 *
 * The fifth guard in this project, after the determinism lint, the `Needs
 * source` release gate, the DESIGN.md colour test and the divergence-row test,
 * and it is built to look like them: it parses the thing that is the source of
 * record and fails the build when the code stops agreeing with it.
 *
 * ---------------------------------------------------------------------------
 * WHAT IS TESTABLE HERE AND WHAT IS NOT
 * ---------------------------------------------------------------------------
 *
 * DESIGN.md's rule is "nothing in the game may be encoded in movement or colour
 * alone". Half of that is arithmetic and half of it is judgement.
 *
 * TESTED, because it is arithmetic:
 *
 *   - every colour pair the act screen actually renders clears its WCAG 2.2 AA
 *     threshold, computed from the tokens in index.css rather than from a table
 *     somebody typed. A future palette change fails the build rather than
 *     failing a user.
 *   - no semantic colour is used as a text colour anywhere, which is the rule
 *     that fell out of the measurement: these colours are chosen so INK reads
 *     on them, and a colour with that property cannot also read as text on a
 *     pale surface.
 *   - every meaning in UPDATELOGV7.md's channel table names a second channel,
 *     and that channel is present in the markup.
 *
 * NOT TESTED, and deliberately not faked: whether a channel READS. Whether an
 * ink rule across a blob says "half the carrier is reduced" to somebody who has
 * never seen the game is the same kind of question as whether the voice in
 * docs/CONTENT_STYLE.md is right, and contentStyle.test.ts refuses to fake that
 * one for the same reason. It needs a reader. See NOW.md.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const CSS = readFileSync(new URL('../../index.css', import.meta.url), 'utf8');

/**
 * EVERY COMPONENT, WALKED. UPDATELOGV11.md stage 3.
 *
 * This was an array of ten paths written out by hand while
 * `src/ui/components/` held twenty. About.tsx, Announcer.tsx, Blob.tsx,
 * CoachMark.tsx, FirstRunCard.tsx, OfflineReturn.tsx, Overlay.tsx,
 * PathwayCard.tsx, PoolRail.tsx and TeachingPanel.tsx were outside the
 * semantic-colour-as-text rule entirely, and NINE OF THE TEN SHIPPED AFTER THIS
 * GUARD WAS WRITTEN. The hole widened every log, and it widened silently,
 * because a list that does not include a file cannot report that it does not.
 *
 * V7's own rule is what this is: a guard that agrees with its own list is not a
 * guard.
 */
const COMPONENTS_DIR = fileURLToPath(new URL('../components', import.meta.url));

function componentPaths(): string[] {
  return readdirSync(COMPONENTS_DIR)
    .filter((entry) => entry.endsWith('.tsx'))
    .sort()
    .map((entry) => join(COMPONENTS_DIR, entry));
}

const UI_FILES = componentPaths()
  .map((path) => readFileSync(path, 'utf8'))
  .join('\n');

/** The tokens, read out of index.css so this cannot drift from what ships. */
const TOKENS: Readonly<Record<string, string>> = Object.fromEntries(
  [...CSS.matchAll(/--color-([a-z0-9]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1] as string, m[2] as string]),
);

function channels(colour: string): [number, number, number] {
  const n = Number.parseInt(colour.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function luminance(colour: string): number {
  const [r, g, b] = channels(colour).map((c) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
/** A colour composited over another at some alpha, for the dimmed locked slot. */
function over(fg: string, bg: string, alpha: number): string {
  const f = channels(fg);
  const b = channels(bg);
  return (
    '#' +
    f
      .map((c, i) => Math.round(c * alpha + (b[i] as number) * (1 - alpha)))
      .map((c) => c.toString(16).padStart(2, '0'))
      .join('')
  );
}

/**
 * Every pair the act screen renders, enumerated from the components rather than
 * as DESIGN.md's cross product, and each with the threshold that applies to it.
 *
 *   4.5   body and micro text, and any bold text under 18.66px
 *   3.0   text at 24px or above, and non-text that carries meaning
 *
 * The locked slot is composited rather than listed as a flat pair, because its
 * text is dimmed by an ancestor's opacity and the flat ratio is not what a
 * player sees. That compounding is exactly what stage 1 found and what a naive
 * pair table would have missed.
 */
/**
 * The dim a locked card actually ships with, READ OUT OF THE COMPONENT.
 *
 * It was written here as a literal first, and probing caught it: dropping
 * `Card.tsx` back to `opacity-55` left this whole block passing, because the
 * test was asserting a number nobody had to honour. A guard that agrees with
 * itself is not a guard.
 */
const CARD_SOURCE = readFileSync(new URL('../components/Card.tsx', import.meta.url), 'utf8');
const DIM = Number(/dimmed \? 'opacity-(\d+)'/.exec(CARD_SOURCE)?.[1]) / 100;
function pairs(): { what: string; fg: string; bg: string; need: number }[] {
  const t = (name: string): string => TOKENS[name] as string;
  const rows: { what: string; fg: string; bg: string; need: number }[] = [];
  const surfaces = ['page', 'cream', 'pink', 'mint', 'sky', 'lilac', 'white'];

  for (const s of surfaces) {
    rows.push({ what: `ink text on ${s}`, fg: t('ink'), bg: t(s), need: 4.5 });
    rows.push({ what: `ink outline on ${s}`, fg: t('ink'), bg: t(s), need: 3 });
  }
  for (const s of ['page', 'cream', 'pink', 'mint', 'sky', 'white']) {
    rows.push({ what: `ink2 text on ${s}`, fg: t('ink2'), bg: t(s), need: 4.5 });
  }

  // The badge words. Label size, so 4.5 even though they are extrabold.
  for (const fill of ['gain', 'atp', 'lilac']) {
    rows.push({ what: `the badge word on ${fill}`, fg: t('ink'), bg: t(fill), need: 4.5 });
  }

  // A locked unlock slot: a white card dimmed over the page, with its own text
  // dimmed by the same ancestor opacity.
  const card = over(t('white'), t('page'), DIM);
  for (const [name, token] of [['title', 'ink'], ['detail', 'ink2'], ['disabled button', 'ink2']] as const) {
    rows.push({
      what: `a locked slot's ${name}, at opacity ${DIM}`,
      fg: over(t(token), card, DIM),
      bg: card,
      need: 4.5,
    });
  }

  /**
   * Non-text that carries meaning, and the pairs here are chosen by the same
   * reading stage 1 made rather than by listing every colour that touches
   * another.
   *
   * WCAG 1.4.11 governs the contrast of what is REQUIRED to understand the
   * content, against its ADJACENT colours. For an ink-outlined shape the
   * identifying boundary is the ink outline, which is 14:1 or better on every
   * surface, so a blob fill against the card behind it is not the governing
   * pair. What the fill has to do is distinguish that shape from another shape,
   * and those pairs are all above 85 dE under every deficiency stage 1
   * simulated.
   *
   * The same reading applies to a pathway arrow. Its presence is the track,
   * which is `ink` when running and `ink2` when stopped, and both clear the
   * floor against cream. Its STATE is carried by stroke width, by the dash, by
   * the arrowhead being filled or hollow and by colour, four channels of which
   * three are shape. `substrate` against cream measures 2.44, and it is not
   * asserted here because it is not what identifies anything: an arrow whose
   * colour vanished would still be six pixels of dashes with a solid head
   * against two pixels of solid line with a hollow one.
   */
  rows.push({ what: 'a stopped arrow track on cream', fg: t('ink2'), bg: t('cream'), need: 3 });
  rows.push({ what: 'a running arrow track on cream', fg: t('ink'), bg: t('cream'), need: 3 });
  // THE REDOX LEVEL, which is the whole reason this log exists. The rule is ink
  // and it has to clear against BOTH sides of the boundary it marks.
  rows.push({ what: 'the redox level rule against oxidized', fg: t('ink'), bg: t('oxidized'), need: 3 });
  rows.push({ what: 'the redox level rule against reduced', fg: t('ink'), bg: t('reduced'), need: 3 });

  return rows;
}

describe('every pair the act screen renders clears WCAG 2.2 AA', () => {
  it('found the tokens and the dim, so nothing below is vacuous', () => {
    expect(Object.keys(TOKENS).length).toBeGreaterThan(10);
    expect(TOKENS.ink).toBeDefined();
    expect(TOKENS.oxidized).toBeDefined();
    // The dim is read from Card.tsx rather than written here. If the regex
    // stops matching, DIM is NaN and every locked-slot row would pass
    // vacuously, so this is the assertion that keeps them honest.
    expect(Number.isFinite(DIM)).toBe(true);
    expect(DIM).toBeGreaterThan(0);
    expect(DIM).toBeLessThanOrEqual(1);
  });

  it.each(pairs())('$what clears $need to 1', ({ fg, bg, need }) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(need);
  });
});

describe('a semantic colour fills, and ink writes', () => {
  /**
   * The rule stage 5 derived from the measurement rather than chose. Darkening
   * `gain` far enough to read as text on a pale surface takes the ink word on
   * the Sourced badge from 6.54:1 to 3.30:1, so the same token cannot serve
   * both jobs. It fills.
   */
  const SEMANTIC = ['atp', 'reduced', 'oxidized', 'substrate', 'loss', 'gain', 'gradient', 'nitrogen'];

  it('uses no semantic colour as a Tailwind text utility', () => {
    for (const name of SEMANTIC) {
      // Comments name the tokens while explaining why they are not used, so the
      // match is against the class attribute rather than the whole file.
      for (const match of UI_FILES.matchAll(/className=\{?["'`]([^"'`]*)["'`]/g)) {
        expect(match[1]).not.toMatch(new RegExp(`\\btext-${name}\\b`));
      }
    }
  });

  it('writes no semantic colour into an element style colour', () => {
    /**
     * The other route, and the one the pool card and the unlock shelf both
     * used: `element.style.color = 'var(--color-gain)'` from a per-frame
     * callback, which no class scan would ever see.
     *
     * Scoped to the variable a `style.color` assignment reads, rather than to
     * the file, because a semantic colour appearing anywhere in a file is not
     * the rule. `PathwayArrow` legitimately holds `var(--color-substrate)` as a
     * STROKE, and a stroke is a fill by another name. The rule is about text.
     */
    const writes = [...UI_FILES.matchAll(/style\.color\s*=\s*(\w+)/g)].map((m) => m[1] as string);
    expect(writes.length).toBeGreaterThan(0);
    for (const variable of writes) {
      // The declaration of whatever is being assigned, wherever it is.
      const declaration = new RegExp(`const ${variable}\\b[\\s\\S]{0,400}?;`);
      const source = declaration.exec(UI_FILES)?.[0] ?? '';
      expect(source).not.toBe('');
      for (const name of SEMANTIC) {
        expect(source).not.toContain(`--color-${name}`);
      }
    }
  });

  it('proves the rule was needed, by keeping the arithmetic that forced it', () => {
    // Guard the guard, and record the reason where it cannot be lost. If a later
    // log finds a way to make `gain` readable as text, this is the assertion
    // that should be revisited rather than the rule quietly relaxed.
    const gain = TOKENS.gain as string;
    expect(contrast(gain, TOKENS.white as string)).toBeLessThan(4.5);
    expect(contrast(TOKENS.ink as string, gain)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps ink3 out of everything, because it can carry nothing', () => {
    // Measured: 2.96:1 on white at full opacity, so it is under the text floor
    // on every surface in the palette, and 2.83:1 as a mark on cream, so it is
    // under the non-text floor too. DESIGN.md still names it and index.css
    // still defines it, and nothing may use it to carry meaning.
    expect(TOKENS.ink3).toBeDefined();
    expect(contrast(TOKENS.ink3 as string, TOKENS.white as string)).toBeLessThan(4.5);
    expect(UI_FILES).not.toContain('text-ink3');
    expect(UI_FILES).not.toContain("'var(--color-ink3)'");
  });
});

describe('nothing is encoded in colour alone', () => {
  /**
   * UPDATELOGV7.md's channel table, as a manifest rather than as prose. Each
   * meaning names the non-colour channel that carries it and a marker that
   * proves the channel is in the build. The markers are deliberately things
   * that would disappear if the channel were removed rather than renamed.
   */
  const TABLE = [
    ['redox state', 'a level rule in ink', 'redox-level'],
    ['carbon count', 'the polygon side count', "'silhouette'"],
    ['phosphate count', 'countable dots', 'data-role="phosphate"'],
    ['reaction running or stopped', 'stroke width and dash', "dash: 'none'"],
    ['net rate direction', 'an explicit sign character', 'signed'],
    ['locked or unlocked', 'a dashed border', 'border-dashed'],
    ['badge kind', 'the badge word', 'Sourced'],
  ] as const;

  it.each(TABLE)('%s survives the loss of colour, through %s', (_meaning, _channel, marker) => {
    // Blob.tsx is inside UI_FILES since the walk landed. It used to be read
    // separately here, which is the shape of the same defect: the one component
    // the list did not have was pulled in by hand at the one call site that
    // needed it, and nothing else in the file could see it.
    expect(UI_FILES).toContain(marker);
  });

  it('covers every meaning the log enumerated, so the table cannot shrink', () => {
    expect(TABLE.length).toBe(7);
  });
});

/**
 * GUARD THE GUARD, ON THE WALK ITSELF.
 *
 * A hand-written list fails loudly when a path is wrong and silently when a path
 * is missing, which is how this one lost half the component tree. A walk fails
 * the same silent way if the directory moves or the extension filter stops
 * matching, so the walk is asserted against the directory listing rather than
 * trusted.
 */
describe('the guard looks at everything it should', () => {
  it('reads every .tsx in src/ui/components, by listing rather than by memory', () => {
    const onDisk = readdirSync(COMPONENTS_DIR).filter((entry) => entry.endsWith('.tsx'));
    const read = componentPaths().map((path) => path.slice(COMPONENTS_DIR.length + 1));
    expect([...read].sort()).toEqual([...onDisk].sort());
    expect(onDisk.length).toBeGreaterThanOrEqual(20);
  });

  it('names the ten components that were outside it until this log', () => {
    // Recorded as an assertion rather than as a comment, because the point of
    // the widening is that these ten are now covered and a future narrowing
    // should have to delete this line on purpose.
    const wereMissing = [
      'About.tsx', 'Announcer.tsx', 'Blob.tsx', 'CoachMark.tsx', 'FirstRunCard.tsx',
      'OfflineReturn.tsx', 'Overlay.tsx', 'PathwayCard.tsx', 'PoolRail.tsx', 'TeachingPanel.tsx',
    ];
    const read = componentPaths().map((path) => path.slice(COMPONENTS_DIR.length + 1));
    for (const name of wereMissing) expect(read).toContain(name);
  });

  it('actually has their contents in the string it scans', () => {
    // The walk could find the paths and read nothing. One string only these
    // files contain proves the contents are in UI_FILES rather than just the
    // filenames being in an array.
    expect(UI_FILES).toContain('redox-level');
    expect(UI_FILES).toContain('aria-live');
  });
});
