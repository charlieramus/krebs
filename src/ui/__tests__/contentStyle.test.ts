/**
 * docs/CONTENT_STYLE.md, the half of it that can be mechanism.
 *
 * ---------------------------------------------------------------------------
 * WHY ONLY HALF, STATED FIRST SO NOBODY READS THIS AS THE WHOLE DOCUMENT
 * ---------------------------------------------------------------------------
 *
 * Voice is not testable. There is no regular expression for whether a sentence
 * sounds like a person who knows what they are talking about, and a test that
 * pretended otherwise would fail good writing and pass bad writing with equal
 * confidence. Neither is Part 6, which asks whether a paragraph should have been
 * a shape, and which is a judgement every time. docs/CONTENT_STYLE.md Part 8
 * says both of those out loud and this file only implements what it listed as
 * testable.
 *
 * What IS testable is where a string lives and what characters are in it, and
 * both are the kind of rule that survives being written down for about three
 * sprints. Same shape as designSystem.test.ts, which parses DESIGN.md's Colour
 * section, and divergenceTable.test.ts, which parses docs/ECONOMY.md.
 *
 * ---------------------------------------------------------------------------
 * ONE FILE IS EXEMPT AND THE REASON IS STRUCTURAL RATHER THAN A CONVENIENCE
 * ---------------------------------------------------------------------------
 *
 * src/ui/components/Badge.tsx renders the four words "Sourced", "Tuned",
 * "Contested" and "Needs source". They cannot come from src/ui/content/, because
 * every file in that directory imports Badge in order to build its badges, and
 * the import would be circular. They are also not authored copy: they are the
 * badge vocabulary DESIGN.md defines, and DESIGN.md is their document of record
 * the way it is for the colour tokens. An exemption with a reason in it is a
 * rule; an allowlist that grows is not, so this list has one entry and any
 * addition to it should be argued in a log.
 *
 * THE SPLIT DID NOT REMOVE IT, WHICH UPDATELOGV11.md STAGE 3 ASKED ABOUT. The
 * cycle moved one level down rather than going away: `common.ts` holds the
 * `Entry` type and imports `BadgeSpec` from Badge, so Badge would still have to
 * import its own four words back out of the directory that types itself against
 * Badge. Removing it properly means moving `BadgeSpec` out of the component,
 * which is a change to the badge contract rather than to where strings live.
 * Kept, with the reasoning updated to say where the cycle now sits.
 *
 * ---------------------------------------------------------------------------
 * BOTH HALVES WALK, AND BOTH HAVE A GUARD-THE-GUARD
 * ---------------------------------------------------------------------------
 *
 * The .tsx half has walked `src/` since V6 and had a guard-the-guard on the
 * walk. The content half pointed at exactly one path, `src/ui/content.ts`, and
 * had neither. That was survivable while the strings were in one file and it is
 * the silent failure mode as soon as they are not: a content file the guard does
 * not reach is a file whose strings are never style-checked, and nothing says
 * so. It walks `src/ui/content/` now and asserts it reached everything in it.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(import.meta.dirname, '..', '..', '..');
const CONTENT_DIR = join(ROOT, 'src', 'ui', 'content');

/** See the header. One entry, structural, argued. */
const EXEMPT = ['src/ui/components/Badge.tsx'];

function collect(directory: string, into: string[] = []): string[] {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) collect(path, into);
    else if (entry.endsWith('.tsx')) into.push(path);
  }
  return into;
}

const relative = (path: string): string => path.slice(ROOT.length + 1).replace(/\\/g, '/');

/**
 * Comments stripped before scanning, for the reason designSystem.test.ts gives:
 * this repository explains its rules in prose beside the code, and scanning the
 * explanations would make documenting a rule a violation of it.
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/** Every .tsx that renders, minus the tests, minus the one exemption. */
function renderingFiles(): { path: string; source: string }[] {
  return collect(join(ROOT, 'src'))
    .map(relative)
    .filter((path) => !path.includes('__tests__'))
    .filter((path) => !EXEMPT.includes(path))
    .map((path) => ({ path, source: stripComments(readFileSync(join(ROOT, path), 'utf8')) }));
}

/**
 * Text that looks like something a player reads, rather than like code.
 *
 * Deliberately conservative. A guard with false positives gets disabled, and
 * this one has to survive a codebase full of SVG path data, Tailwind class
 * strings and type annotations containing `=>`.
 *
 * FOUND BY ITS OWN PROBE. The first version was an allowlist of characters,
 * `^[A-Za-z][A-Za-z0-9 ,.'+/()-]*$`, and the probe `<h2>Resources so far!</h2>`
 * walked straight through it, because the exclamation mark was not in the list.
 * A guard that only catches politely punctuated violations is worse than no
 * guard, since it reads as coverage. So the test is inverted: anything with a
 * letter in it is prose unless it looks like code, and the code tells are the
 * characters that cannot appear in a sentence a player reads.
 */
function isProse(candidate: string): boolean {
  const text = candidate.trim();
  if (text.length === 0) return false;
  if (text.includes('\n')) return false;
  if (!/[A-Za-z]/.test(text)) return false;
  if (/[=;$_]/.test(text)) return false;
  return true;
}

describe('every player-facing string lives in src/ui/content/', () => {
  it('renders no literal text node from a component file', () => {
    const offenders: string[] = [];
    for (const { path, source } of renderingFiles()) {
      // A complete tag body written as a literal: >Unlocks</
      for (const match of source.matchAll(/>\s*([^<>{}]+?)\s*<\//g)) {
        const text = (match[1] as string).trim();
        if (isProse(text)) offenders.push(`${path}: >${text}<`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('passes no literal to a prop the player can read', () => {
    // aria-label and title reach a player through assistive technology and
    // through a tooltip respectively, which docs/CONTENT_STYLE.md Part 1 says
    // makes them player-facing exactly like a visible label.
    const offenders: string[] = [];
    for (const { path, source } of renderingFiles()) {
      for (const match of source.matchAll(
        /\b(aria-label|title|alt|placeholder|label|detail|buyLabel|infoLabel)="([^"]+)"/g,
      )) {
        const text = (match[2] as string).trim();
        if (isProse(text)) offenders.push(`${path}: ${match[1] as string}="${text}"`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('found something to scan, so the two assertions above are not vacuous', () => {
    // Guard the guard. A glob that matched nothing would make this file a
    // rubber stamp, and a rubber stamp is worse than no test at all.
    const files = renderingFiles();
    expect(files.length).toBeGreaterThanOrEqual(10);
    expect(files.some((file) => file.path === 'src/App.tsx')).toBe(true);
  });
});

describe("CLAUDE.md's prose rules hold in player-facing text", () => {
  /** Every .ts under src/ui/content/, walked rather than listed. */
  function contentFiles(): string[] {
    return readdirSync(CONTENT_DIR)
      .filter((entry) => entry.endsWith('.ts'))
      .map((entry) => join(CONTENT_DIR, entry));
  }

  /** Every quoted string in the content directory. Comments are stripped first. */
  function strings(): string[] {
    const found: string[] = [];
    for (const file of contentFiles()) {
      const source = stripComments(readFileSync(file, 'utf8'));
      for (const match of source.matchAll(
        /'([^'\\]*(?:\\.[^'\\]*)*)'|`([^`\\]*(?:\\.[^`\\]*)*)`/g,
      )) {
        const text = (match[1] ?? match[2] ?? '') as string;
        if (text.length > 0) found.push(text);
      }
    }
    return found;
  }

  it('found the strings, so the assertions below are not vacuous', () => {
    expect(strings().length).toBeGreaterThanOrEqual(60);
  });

  /**
   * GUARD THE GUARD, AND IT IS THE HALF THAT WAS MISSING.
   *
   * The .tsx walk above has had one since V6. This one did not, because it
   * pointed at a single path, and a single path either exists or throws. A walk
   * fails the other way: it reaches fewer files and every assertion under it
   * passes.
   *
   * Asserted against the directory listing rather than against a count, so a
   * surface file the walk somehow misses fails here rather than passing quietly.
   * `index.ts` is scanned too, and deliberately: a string smuggled into the
   * barrel file is exactly what a walk keyed on "the files that hold strings"
   * would let through.
   */
  it('reaches every file in the content directory', () => {
    const onDisk = readdirSync(CONTENT_DIR).filter((entry) => entry.endsWith('.ts'));
    const reached = contentFiles().map((path) => path.slice(CONTENT_DIR.length + 1));
    expect([...reached].sort()).toEqual([...onDisk].sort());
    expect(onDisk.length).toBeGreaterThanOrEqual(10);
    expect(onDisk).toContain('index.ts');
    expect(onDisk).toContain('common.ts');
  });

  it('uses no em dash and no en dash, including inside ranges', () => {
    // CLAUDE.md, and docs/CONTENT_STYLE.md Part 2 restates it for player text.
    // "45 to 90 minutes", never "45-90 minutes".
    const offenders = strings().filter((text) => /[—–]/.test(text));
    expect(offenders).toEqual([]);
  });

  it('uses no exclamation mark anywhere', () => {
    // docs/CONTENT_STYLE.md Part 2: not one, anywhere in the game. The game does
    // not perform enthusiasm and it does not congratulate.
    const offenders = strings().filter((text) => text.includes('!'));
    expect(offenders).toEqual([]);
  });

  it('uses no curly quote or curly apostrophe', () => {
    const offenders = strings().filter((text) => /[‘’“”]/.test(text));
    expect(offenders).toEqual([]);
  });

  it('never calls the preparatory phase the investment phase', () => {
    // docs/CONTENT_STYLE.md Part 3. docs/PROGRESSION.md uses "investment phase"
    // in design prose and the pathway is labelled "Preparatory phase", and two
    // names for one arrow is a puzzle handed to the player for nothing.
    const offenders = strings().filter((text) => /investment phase/i.test(text));
    expect(offenders).toEqual([]);
  });

  it('spells -ise rather than -ize', () => {
    // docs/CONTENT_STYLE.md Part 2. It was inconsistent across two strings that
    // render on the same shelf, which is what settled the convention.
    //
    // A LIST RATHER THAN A SUFFIX PATTERN, and this is not laziness. The first
    // version of this assertion was /\w+iz(e|ed|es|ing)\b/ and it flagged "Pool
    // sizes are tuned", because English spells "size" with a z and no suffix
    // rule distinguishes it from "oxidize". A guard with false positives gets
    // disabled, so this matches the verbs the domain actually uses and grows
    // when the vocabulary does.
    const ZED = /\b(oxidiz|reoxidiz|catalyz|hydrolyz|isomeriz|polymeriz|analyz|neutraliz|stabiliz|synthesiz|utiliz|metaboliz)/i;
    const offenders = strings().filter((text) => ZED.test(text));
    expect(offenders).toEqual([]);
  });

  it('forbids the words that tell a stuck reader they are the problem', () => {
    // docs/CONTENT_STYLE.md Part 2: no "simply", "just", "obviously", "of
    // course". "just" is matched as a whole word so "adjust" survives.
    const offenders = strings().filter((text) =>
      /\b(simply|obviously)\b|\bof course\b/i.test(text),
    );
    expect(offenders).toEqual([]);
  });
});
