/**
 * The art governance rule, as mechanism. DESIGN.md, Hand-authored art.
 *
 * The seventh guard in this project, after the determinism lint, the `Needs
 * source` release gate, the DESIGN.md colour test, the divergence-row test, the
 * accessibility test and the content-style test. Built to look like them: it
 * parses the thing that is the source of record and fails the build when the
 * code stops agreeing with it.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS EXISTS AT ALL
 * ---------------------------------------------------------------------------
 *
 * Every illustration in this game before UPDATELOGV12.md is computed from the
 * conserved-weight table, so it inherits the palette for free: it cannot use a
 * colour that is not a token because it never names a colour. Eleven drawn
 * assets inherit none of that. `accessibility.test.ts` computes contrast pairs
 * from `index.css` and from component classes, and an SVG `fill` set as a
 * presentation attribute is neither. `forced-colors` does not force `fill`
 * either. A drawn asset is the one thing here that can leave the palette and
 * ignore a user's colour setting at once, in a file nobody diffs.
 *
 * ---------------------------------------------------------------------------
 * THE DEPENDENCY RUNS DESIGN.md TO index.css TO THE ART
 * ---------------------------------------------------------------------------
 *
 * Token names are read out of `src/index.css`, which `designSystem.test.ts`
 * already holds to DESIGN.md's Colour section. So a colour renamed in DESIGN.md
 * fails the art too, rather than the art quietly diverging from the palette.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ART_DIR = fileURLToPath(new URL('../art', import.meta.url));
const CSS = readFileSync(new URL('../../index.css', import.meta.url), 'utf8');

/** Every token `index.css` actually defines, read rather than listed. */
const TOKENS = new Set(
  [...CSS.matchAll(/--color-([a-z0-9-]+):/g)].map((match) => match[1] as string),
);

function assetPaths(): string[] {
  return readdirSync(ART_DIR)
    .filter((entry) => entry.endsWith('.tsx'))
    .sort()
    .map((entry) => join(ART_DIR, entry));
}

function assets(): { name: string; source: string }[] {
  return assetPaths().map((path) => ({
    name: path.slice(ART_DIR.length + 1),
    source: readFileSync(path, 'utf8'),
  }));
}

/**
 * Comments stripped, for the reason `designSystem.test.ts` gives: this
 * repository explains its rules beside the code, and the headers in `src/ui/art/`
 * discuss hex literals and gradients precisely in order to forbid them.
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/**
 * Clause 1 as a function, so the guard-the-guard below can feed it a violation
 * rather than a file.
 *
 * Permitted: `var(--color-X)` where X is a token, `none`, `currentColor`. That
 * is the whole list. A hex literal that happens to equal a token is still a
 * violation, because a literal is untraceable and cannot be redirected by a
 * `forced-colors` block, which is the point of requiring a reference.
 */
export function colourViolation(value: string): string | null {
  const text = value.trim();
  if (text === 'none' || text === 'currentColor') return null;
  const reference = /^var\(--color-([a-z0-9-]+)\)$/.exec(text);
  if (reference === null) return `not a token reference: ${text}`;
  const name = reference[1] as string;
  if (!TOKENS.has(name)) return `names a token index.css does not define: ${text}`;
  return null;
}

/** Every colour-valued attribute in a source, as written. */
function colourAttributes(source: string): { attribute: string; value: string }[] {
  const found: { attribute: string; value: string }[] = [];
  for (const match of source.matchAll(
    /\b(fill|stroke|stopColor|floodColor|lightingColor)=["{']+([^"'}]+)["'}]*/g,
  )) {
    found.push({ attribute: match[1] as string, value: match[2] as string });
  }
  return found;
}

describe('the guard looks at everything it should', () => {
  it('walks src/ui/art/ by listing rather than by memory', () => {
    const onDisk = readdirSync(ART_DIR).filter((entry) => entry.endsWith('.tsx'));
    const read = assetPaths().map((path) => path.slice(ART_DIR.length + 1));
    expect([...read].sort()).toEqual([...onDisk].sort());
    // Seven figures plus the frame. A walk that reached fewer would make every
    // assertion below pass quietly, which is how the accessibility guard lost
    // half the component tree.
    expect(onDisk.length).toBeGreaterThanOrEqual(8);
  });

  it('read the tokens, so the colour rule is not vacuous', () => {
    expect(TOKENS.size).toBeGreaterThanOrEqual(15);
    expect(TOKENS.has('ink')).toBe(true);
    expect(TOKENS.has('loss')).toBe(true);
  });

  it('has the contents in hand rather than only the filenames', () => {
    const source = assets()
      .map((asset) => asset.source)
      .join('\n');
    expect(source).toContain('ArtFrame');
    expect(source).toContain('var(--color-ink)');
  });
});

describe('clause 1: tokens only, and by reference', () => {
  it.each(assets())('$name names no colour outside the token set', ({ source }) => {
    const offenders: string[] = [];
    for (const { attribute, value } of colourAttributes(stripComments(source))) {
      const problem = colourViolation(value);
      if (problem !== null) offenders.push(`${attribute}: ${problem}`);
    }
    expect(offenders).toEqual([]);
  });

  it('rejects the four things a drawn asset is most likely to arrive carrying', () => {
    // Guard the guard. If these pass, the check above is agreeing with itself.
    expect(colourViolation('#16162E')).not.toBeNull();
    expect(colourViolation('rgb(22, 22, 46)')).not.toBeNull();
    expect(colourViolation('rebeccapurple')).not.toBeNull();
    expect(colourViolation('var(--color-nosuchtoken)')).not.toBeNull();
    // And accepts the three that are legal, so it is not simply rejecting.
    expect(colourViolation('var(--color-ink)')).toBeNull();
    expect(colourViolation('none')).toBeNull();
    expect(colourViolation('currentColor')).toBeNull();
  });

  it('finds the attributes it claims to check', () => {
    const found = colourAttributes('<path fill="var(--color-mint)" stroke="none" />');
    expect(found).toEqual([
      { attribute: 'fill', value: 'var(--color-mint)' },
      { attribute: 'stroke', value: 'none' },
    ]);
  });
});

describe('clause 2: ink carries the reading', () => {
  it.each(assets())('$name strokes in ink and would survive its fills going away', ({ name, source }) => {
    const stripped = stripComments(source);
    // The frame declares the stroke for the whole set, so an asset satisfies
    // this through the frame. What is not permitted is an asset that draws only
    // filled shapes with no stroke reaching them at all.
    const inked = stripped.includes('var(--color-ink)') || stripped.includes('<ArtFrame');
    expect({ name, inked }).toEqual({ name, inked: true });
  });

  it.each(assets())('$name draws at least one shape that is fill none', ({ name, source }) => {
    // A shape carrying no fill is a shape that exists only as ink, which is the
    // cheapest proof that the outline is doing work. The frame is exempt: it
    // draws nothing itself.
    if (name === 'ArtFrame.tsx') return;
    const values = colourAttributes(stripComments(source))
      .filter((entry) => entry.attribute === 'fill')
      .map((entry) => entry.value.trim());
    expect(values).toContain('none');
  });
});

describe('clause 3: one stroke band', () => {
  it.each(assets())('$name sets no stroke weight outside 3 to 3.5', ({ source }) => {
    const offenders: string[] = [];
    for (const match of stripComments(source).matchAll(/strokeWidth=\{?["']?([\d.]+)/g)) {
      const weight = Number.parseFloat(match[1] as string);
      if (!(weight >= 3 && weight <= 3.5)) offenders.push(match[0] as string);
    }
    expect(offenders).toEqual([]);
  });

  it('the frame sets the weight and the round join for the whole set', () => {
    const frame = readFileSync(join(ART_DIR, 'ArtFrame.tsx'), 'utf8');
    expect(frame).toContain('strokeLinejoin="round"');
    expect(frame).toMatch(/strokeWidth=\{ART_STROKE\}/);
    expect(frame).toMatch(/ART_STROKE = 3(\.\d+)?/);
  });
});

describe('clause 4: nothing the rest of the system already forbids', () => {
  const BANNED = [
    ['a gradient', /Gradient|gradient-|linearGradient|radialGradient/],
    ['a filter or blur', /\bfilter=|feGaussianBlur|backdrop/],
    ['a raster image', /<image\b|data:image\/(png|jpe?g|gif|webp)/],
  ] as const;

  it.each(assets())('$name carries none of them', ({ source }) => {
    const stripped = stripComments(source);
    const offenders = BANNED.filter(([, pattern]) => pattern.test(stripped)).map(([what]) => what);
    expect(offenders).toEqual([]);
  });

  it.each(assets())('$name sets no opacity below 0.85', ({ source }) => {
    // DESIGN.md's locked-slot dim is 0.85 and V7 measured why: dimming compounds
    // with whatever it dims, and below that the channels underneath stop
    // clearing the contrast floor.
    const offenders: string[] = [];
    for (const match of stripComments(source).matchAll(
      /\b(opacity|fillOpacity|strokeOpacity)=\{?["']?([\d.]+)/g,
    )) {
      if (Number.parseFloat(match[2] as string) < 0.85) offenders.push(match[0] as string);
    }
    expect(offenders).toEqual([]);
  });

  it('catches a banned pattern when one is present, so the rule is not vacuous', () => {
    const probe = '<linearGradient id="x" />';
    expect(BANNED.some(([, pattern]) => pattern.test(probe))).toBe(true);
  });
});

describe('every asset is silent to assistive technology', () => {
  it('names the figure on the card rather than inside the drawing', () => {
    // A `<title>` inside an asset would be a player-facing string outside
    // `src/ui/content/`, which contentStyle.test.ts exists to prevent, and it
    // would be a second name for a thing the card already names.
    const frame = readFileSync(join(ART_DIR, 'ArtFrame.tsx'), 'utf8');
    expect(frame).toContain('aria-hidden="true"');
    for (const { name, source } of assets()) {
      // Comments stripped, because ArtFrame's own header explains why there is
      // no title element by naming one.
      const stripped = stripComments(source);
      expect({ name, hasTitle: /<title[\s>]/.test(stripped) }).toEqual({ name, hasTitle: false });
    }
  });
});
