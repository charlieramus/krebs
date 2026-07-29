/**
 * The visual contract, as a mechanism rather than a paragraph.
 *
 * DESIGN.md makes two claims that are load-bearing and easy to erode one commit
 * at a time. The hard offset shadow produces the paper cutout read, and a
 * blurred one collapses the whole direction into generic soft UI. And there are
 * no gradients anywhere. Both are the kind of rule that survives being written
 * down for about three sprints, so they are asserted here instead.
 *
 * The third assertion is narrower and stricter: the token block in
 * src/index.css must define exactly the colours DESIGN.md names, no more and no
 * fewer, at exactly the values DESIGN.md gives. A token that exists because a
 * component wanted it is how a design system becomes a suggestion, and this is
 * what stops that from happening quietly.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '..', '..', '..');
const DESIGN_DOC = join(ROOT, 'DESIGN.md');
const INDEX_CSS = join(ROOT, 'src', 'index.css');

/** Text files carrying style. The fonts and the licences are not scanned. */
const SCANNED_EXTENSIONS = ['.ts', '.tsx', '.css'];

function collect(directory: string, into: string[] = []): string[] {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      collect(path, into);
    } else if (SCANNED_EXTENSIONS.some((extension) => entry.endsWith(extension))) {
      into.push(path);
    }
  }
  return into;
}

/**
 * This file is excluded from its own scan.
 *
 * Not a convenience. The patterns below have to spell out `linear-gradient` and
 * the rest in order to look for them, so a scanner that scans itself reports
 * five violations on a clean repository, and a guard that cries wolf on day one
 * gets deleted by day thirty. Nothing here renders to a page, so there is no
 * style in it to protect.
 */
const SCANNER = join(ROOT, 'src', 'ui', '__tests__', 'designSystem.test.ts');

const STYLED_FILES = [
  ...collect(join(ROOT, 'src', 'ui')).filter((path) => path !== SCANNER),
  join(ROOT, 'src', 'index.css'),
  join(ROOT, 'src', 'App.tsx'),
];

/**
 * Comments are stripped before scanning.
 *
 * A rule nobody may write the name of is a rule nobody can explain, and both
 * DESIGN.md's prose and this repository's comments discuss blurred shadows and
 * gradients by name precisely in order to forbid them. Scanning the comments
 * would make documenting the rule a violation of it.
 *
 * Line comments are only stripped when the `//` is not preceded by a colon, so
 * a `https://` inside a string survives.
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function withoutComments(): { path: string; source: string }[] {
  return STYLED_FILES.map((path) => ({
    path: path.slice(ROOT.length + 1).replace(/\\/g, '/'),
    source: stripComments(readFileSync(path, 'utf8')),
  }));
}

describe('no blurred shadows anywhere in the interface', () => {
  it('declares no box-shadow or shadow token with a non-zero third length', () => {
    // The third length in a box-shadow is the blur radius. DESIGN.md, Spacing:
    // "shadow 4px 4px 0 ink, no blur, ever".
    const offenders: string[] = [];

    for (const { path, source } of withoutComments()) {
      // The value runs to the end of the line rather than to the first quote.
      // A CSS-in-JS shadow is often a conditional expression rather than a bare
      // string, and stopping at the opening quote of `cond ? 'a' : 'b'` reads
      // the condition and misses both branches. Found by this test failing to
      // fire against a deliberate violation in stage 2, which is the reason the
      // stage asks for the violation to be planted rather than assumed.
      const declarations = source.matchAll(
        /(box-shadow|boxShadow|--shadow-[a-z-]*)\s*:\s*([^;\n]+)/g,
      );
      for (const declaration of declarations) {
        // Function calls go first, so the commas inside rgba() and var() do not
        // split one shadow layer into three.
        const value = (declaration[2] as string)
          .replace(/['"`]/g, '')
          .replace(/\b[\w-]+\([^)]*\)/g, '');
        for (const layer of value.split(',')) {
          const lengths = layer
            .replace(/\binset\b/g, '')
            .trim()
            .split(/\s+/)
            .filter((token) => /^-?[\d.]+(px|rem|em|%)?$/.test(token));
          const blur = lengths[2];
          if (blur !== undefined && Number.parseFloat(blur) !== 0) {
            offenders.push(`${path}: ${layer.trim()}`);
          }
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('uses no Tailwind shadow utility that carries a blur', () => {
    // Every shadow in Tailwind's default scale is blurred. Ours is shadow-hard,
    // built from the --shadow-hard token, and it is the only one permitted.
    const offenders: string[] = [];
    for (const { path, source } of withoutComments()) {
      for (const match of source.matchAll(/\bshadow-(2xs|xs|sm|md|lg|xl|2xl|inner)\b/g)) {
        offenders.push(`${path}: ${match[0] as string}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('applies no blur filter', () => {
    const offenders: string[] = [];
    for (const { path, source } of withoutComments()) {
      for (const match of source.matchAll(/\bblur\(|\bbackdrop-blur\b|\bblur-(sm|md|lg|xl|\[)/g)) {
        offenders.push(`${path}: ${match[0] as string}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('no gradients anywhere in the interface', () => {
  it('declares no CSS gradient function', () => {
    const offenders: string[] = [];
    for (const { path, source } of withoutComments()) {
      for (const match of source.matchAll(
        /\b(linear-gradient|radial-gradient|conic-gradient|repeating-linear-gradient|repeating-radial-gradient)\b/g,
      )) {
        offenders.push(`${path}: ${match[0] as string}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('uses no Tailwind gradient utility', () => {
    // bg-gradient on its own is the act 3 proton motive force colour token and
    // is legitimate. bg-gradient-to-* is Tailwind v3's gradient utility and
    // bg-linear-*, bg-radial-*, bg-conic-* are v4's.
    const offenders: string[] = [];
    for (const { path, source } of withoutComments()) {
      for (const match of source.matchAll(
        /\bbg-gradient-to-|\bbg-(linear|radial|conic)-|\bfrom-\[|\bvia-\[|\bto-\[/g,
      )) {
        offenders.push(`${path}: ${match[0] as string}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('the colour tokens are exactly the ones DESIGN.md defines', () => {
  /**
   * DESIGN.md writes its palette as four-space indented `name  #HEX  note`
   * lines inside the Colour section. Parsed rather than transcribed, so this
   * test fails when DESIGN.md changes and index.css does not, which is the
   * direction the dependency should run.
   */
  const declared = new Map<string, string>();
  {
    const doc = readFileSync(DESIGN_DOC, 'utf8');
    for (const line of doc.split('\n')) {
      const match = /^ {4}([a-z][a-z0-9]*)\s+(#[0-9A-Fa-f]{6})(\s|$)/.exec(line);
      if (match !== null) declared.set(match[1] as string, (match[2] as string).toLowerCase());
    }
  }

  const emitted = new Map<string, string>();
  {
    const css = readFileSync(INDEX_CSS, 'utf8');
    for (const match of css.matchAll(/^\s*--color-([a-z0-9-]+):\s*(#[0-9A-Fa-f]{6});/gm)) {
      emitted.set(match[1] as string, (match[2] as string).toLowerCase());
    }
  }

  it('found DESIGN.md is still writing its palette in the expected shape', () => {
    // If this fails, the parser above is reading nothing and the two assertions
    // below would pass vacuously. Guard the guard.
    expect(declared.size).toBeGreaterThanOrEqual(15);
    expect(declared.get('ink')).toBe('#16162e');
  });

  it('emits every colour DESIGN.md names, at DESIGN.md value', () => {
    const missing: string[] = [];
    const wrong: string[] = [];
    for (const [name, hex] of declared) {
      const value = emitted.get(name);
      if (value === undefined) missing.push(name);
      else if (value !== hex) wrong.push(`${name}: DESIGN.md ${hex}, index.css ${value}`);
    }
    expect({ missing, wrong }).toEqual({ missing: [], wrong: [] });
  });

  it('emits no colour DESIGN.md does not name', () => {
    const extra = [...emitted.keys()].filter((name) => !declared.has(name));
    expect(extra).toEqual([]);
  });
});
