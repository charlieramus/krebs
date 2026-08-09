/**
 * `meta.buildId` is diagnostic and is never branched on.
 * UPDATELOGV9.md stage 4 step 4.
 *
 * docs/SAVE_SCHEMA.md Part 3: the field exists so that a player-submitted save
 * says which build produced it, "and for nothing else. Branching on it would
 * make it a version field, and there already is one."
 *
 * WHY THIS TEST ARRIVES NOW RATHER THAN IN V4. Until this stage the field held
 * the Vite mode, so every save ever written said "production" or "test". Nobody
 * would branch on a constant. Stage 4 tied it to the commit, which makes it
 * meaningful, and a field that becomes meaningful is a field somebody will be
 * tempted to branch on. The temptation is new, so the guard is new.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { currentBuildId } from '../meta';

const SRC = join(__dirname, '..', '..');

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

/** Every place the identifier legitimately appears, and why each is allowed. */
const ALLOWED = [
  // Declares the field.
  'save/schema.ts',
  // Produces it. The only place that may read the environment for it.
  'save/meta.ts',
  // Serialises and validates it, which is reading it to write it down.
  'save/codec.ts',
  // Writes it into a new save.
  'ui/runtime.ts',
  // A recorded fixture, which is a save on disk.
  'save/fixture.ts',
  // This file.
  'save/__tests__/buildId.test.ts',
];

describe('meta.buildId is diagnostic only', () => {
  const files = walk(SRC).map((f) => ({ path: f.replace(/\\/g, '/'), source: readFileSync(f, 'utf8') }));

  it('found the source tree, so nothing below is vacuous', () => {
    expect(files.length).toBeGreaterThan(30);
    expect(files.some((f) => f.source.includes('buildId'))).toBe(true);
  });

  it('is a real identifier rather than a placeholder', () => {
    // In a test run there is no VITE_BUILD_ID, so this falls through to the
    // mode. What is asserted is the contract: a non-empty string, always.
    const id = currentBuildId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('is mentioned only where the schema, the codec, the writer and the fixture need it', () => {
    /**
     * Tests are excluded from THIS assertion and not from the next one, which is
     * the split that matters. A test constructs whole saves, so it necessarily
     * writes the field, and three existing ones do: codec, storage and
     * reloadDeterminism. Requiring each to be listed here would turn this into a
     * file inventory that fails whenever somebody adds a save-shaped fixture,
     * which is a guard people delete. The rule worth enforcing is that nothing
     * BRANCHES on the field, and the assertion below applies that to tests too.
     */
    const mentions = files
      .filter((f) => f.source.includes('buildId'))
      .map((f) => f.path.slice(f.path.indexOf('/src/') + 5))
      .filter((path) => !path.includes('__tests__'))
      .filter((path) => !ALLOWED.some((allowed) => path.endsWith(allowed)));

    expect(mentions, 'buildId appeared somewhere new; see docs/SAVE_SCHEMA.md Part 3').toEqual([]);
  });

  it('is never compared, matched or switched on, anywhere', () => {
    /**
     * The assertion that carries the rule. Reading the field to write it into a
     * save is fine; asking what it IS, in order to do something different, is the
     * thing Part 3 forbids. Comparison, regex, prefix tests and switch are the
     * four shapes that would take.
     */
    const branching = [
      /buildId\s*===/,
      /buildId\s*!==/,
      /buildId\s*==[^=]/,
      /===\s*[\w.]*\bbuildId\b/,
      /buildId\s*\.\s*(startsWith|endsWith|includes|match)\s*\(/,
      /switch\s*\([^)]*buildId/,
      /if\s*\([^)]*\bbuildId\b[^)]*\)/,
    ];

    const offenders: string[] = [];
    for (const file of files) {
      if (file.path.endsWith('__tests__/buildId.test.ts')) continue;
      for (const pattern of branching) {
        if (pattern.test(file.source)) {
          offenders.push(`${file.path.slice(file.path.indexOf('/src/') + 5)}  ${pattern.source}`);
        }
      }
    }

    expect(offenders, 'docs/SAVE_SCHEMA.md Part 3: buildId is never branched on').toEqual([]);
  });
});
