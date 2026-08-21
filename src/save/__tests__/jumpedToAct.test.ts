/**
 * `settings.jumpedToAct` is diagnostic and is never branched on.
 * UPDATELOGV13.md stage 2 step 2.
 *
 * THE SAME GUARD `meta.buildId` HAS CARRIED SINCE V9, AND FOR THE SAME REASON,
 * which stage 2 names explicitly: a field that becomes meaningful is a field
 * somebody will be tempted to read. `buildId.test.ts` states the general form of
 * the argument and this file applies it to the second such field.
 *
 * WHAT MAKES THIS ONE MORE TEMPTING THAN THE BUILD ID, AND WHY THE GUARD IS
 * WORTH MORE HERE. A build id is opaque, so branching on it is obviously wrong.
 * A jump mark says "this player skipped four hours of content", which is exactly
 * the sort of fact a later log could reach for: to hide an achievement, to skip
 * a teaching beat, to change what the endgame summary says. Every one of those
 * would turn a diagnostic into a game rule, and would make a save that says
 * something about itself into a save that is punished for saying it. The log's
 * Decisions section rules that out in as many words: "diagnostic rather than
 * punitive".
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { JUMPED_TO_ACT } from '../../content/actJump';

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
  // Declares the key and documents the posture.
  'content/actJump.ts',
  // Writes it at construction, and reads it back to report it.
  'ui/runtime.ts',
  // This file.
  'save/__tests__/jumpedToAct.test.ts',
];

describe('settings.jumpedToAct is diagnostic only', () => {
  const files = walk(SRC).map((f) => ({
    path: f.replace(/\\/g, '/'),
    source: readFileSync(f, 'utf8'),
  }));

  it('found the source tree, so nothing below is vacuous', () => {
    expect(files.length).toBeGreaterThan(30);
    expect(files.some((f) => f.source.includes(JUMPED_TO_ACT))).toBe(true);
  });

  it('is mentioned only where the jump declares it and the runtime writes it', () => {
    /*
     * Tests are excluded from THIS assertion and not from the next one, which is
     * the split `buildId.test.ts` settled: a test constructs whole saves, so it
     * necessarily writes the field, and requiring each to be listed here turns a
     * guard into a file inventory that fails whenever somebody adds a
     * save-shaped fixture. The rule worth enforcing is that nothing BRANCHES on
     * the field, and the assertion below applies that to tests too.
     */
    const mentions = files
      .filter((f) => f.source.includes(JUMPED_TO_ACT))
      .map((f) => f.path.slice(f.path.indexOf('/src/') + 5))
      .filter((path) => !path.includes('__tests__'))
      .filter((path) => !ALLOWED.some((allowed) => path.endsWith(allowed)));

    expect(
      mentions,
      'jumpedToAct appeared somewhere new; it is diagnostic, see UPDATELOGV13.md stage 2',
    ).toEqual([]);
  });

  it('is never compared, matched or switched on, anywhere', () => {
    /*
     * The assertion that carries the rule. Reading the field to report it is
     * fine; asking what it IS, in order to do something different, is the thing
     * forbidden. Comparison, regex, prefix tests and switch are the four shapes
     * that would take.
     *
     * `runtime.ts` reads it through `settings[JUMPED_TO_ACT]` and type-tests the
     * RESULT rather than the value, which none of these patterns match and which
     * is the correct shape: `typeof marked === 'number'` asks whether the key is
     * present, not which act it names.
     */
    const branching = [
      /jumpedToAct\s*===/,
      /jumpedToAct\s*!==/,
      /jumpedToAct\s*==[^=]/,
      /===\s*[\w.]*\bjumpedToAct\b/,
      /jumpedToAct\s*\.\s*(startsWith|endsWith|includes|match)\s*\(/,
      /switch\s*\([^)]*jumpedToAct/,
      /if\s*\([^)]*\bjumpedToAct\b[^)]*\)/,
      // The accessor is the other route to the same value.
      /jumpedToAct\(\)\s*(===|!==|==[^=]|>|<|>=|<=)/,
      /if\s*\([^)]*jumpedToAct\(\)/,
      /switch\s*\([^)]*jumpedToAct\(\)/,
    ];

    const offenders: string[] = [];
    for (const file of files) {
      if (file.path.endsWith('__tests__/jumpedToAct.test.ts')) continue;
      for (const pattern of branching) {
        if (pattern.test(file.source)) {
          offenders.push(`${file.path.slice(file.path.indexOf('/src/') + 5)}  ${pattern.source}`);
        }
      }
    }

    expect(offenders, 'jumpedToAct is diagnostic and is never branched on').toEqual([]);
  });

  it('no interface component reads it at all, which is the stronger statement', () => {
    /*
     * The patterns above stop the field CHANGING behaviour. This stops it
     * REACHING the screen, which is a different property and the one stage 3
     * cares about: acts are strictly sequential and a jump is not a player
     * feature, so nothing rendered should mention that a session was jumped.
     *
     * `src/ui/runtime.ts` is excluded because it is the writer. Everything under
     * `src/ui/components/` and `src/App.tsx` is not.
     */
    const surfaces = files
      .filter((f) => f.path.includes('/src/ui/components/') || f.path.endsWith('/src/App.tsx'))
      .filter((f) => f.source.includes('jumpedToAct'))
      .map((f) => f.path.slice(f.path.indexOf('/src/') + 5));

    expect(surfaces, 'a jump has no interface surface; see UPDATELOGV13.md stage 3').toEqual([]);
  });
});
