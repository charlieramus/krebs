/**
 * docs/PILLARS.md rule 5, as a mechanism rather than a promise.
 *
 * Rule 5 says every departure from real behaviour gets recorded in the
 * divergence table. For three logs that was a sentence in a doc and three source
 * headers apologising for owing it. UPDATELOGV5.md stage 1 wrote the table and
 * stage 5 makes it a build failure to add a tuned number without a row.
 *
 * THE MODEL IS THE DESIGN.md COLOUR TEST from V3 stage 2, and it is the same
 * shape: a document and a file that must agree, checked by the suite rather than
 * by a reader. That one has already proved the approach works. This one turns
 * hard rule 5's sibling into the same kind of guard as hard rules 1, 4, 5 and 7.
 *
 * WHAT IT CHECKS, AND WHY IT COUNTS ELEMENTS RATHER THAN NAMES. A row per
 * constant would pass while somebody adds a fourth rung to a ladder or a sixth
 * Vmax to a record, which is exactly the change most likely to slip through: the
 * constant already has a row, so a name check sees nothing new. The table counts
 * scalars, so this counts scalars, and the two counts have to match.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as contentTuning from '../../content/act1/tuning';
import * as saveTuning from '../../save/tuning';
import * as uiTuning from '../tuning';

const ROOT = join(import.meta.dirname, '..', '..', '..');
const ECONOMY = readFileSync(join(ROOT, 'docs', 'ECONOMY.md'), 'utf8');

/**
 * Exports that are not tuned numbers, named one by one rather than pattern
 * matched.
 *
 * An allowlist that a regular expression fills in is an allowlist that grows
 * silently. Every entry here has to be a deliberate decision, so every entry has
 * to be typed out.
 */
const NOT_TUNING: Readonly<Record<string, string>> = {
  TUNING_BADGES: 'badge strings, not numbers. Every one of them points at a value that does have a row',
};

/**
 * How many tuned scalars an export represents.
 *
 * A number is one. A record of numbers is its key count, which is why ACT1_VMAX
 * is five rows. An array of numbers is its length, which is why the uptake
 * ladder is three. An array of objects is its length and NOT its length times
 * its field count, because a rung's three Vmax values cannot be moved
 * independently: two measured constraints bind them, and docs/ECONOMY.md's
 * decisions log records why that makes them one tuned decision rather than
 * three tuned numbers.
 */
function scalarCount(value: unknown): number | null {
  if (typeof value === 'number') return 1;
  if (Array.isArray(value)) return value.length;
  if (typeof value === 'object' && value !== null) {
    const values = Object.values(value as Record<string, unknown>);
    return values.every((v) => typeof v === 'number') ? values.length : null;
  }
  return null;
}

/** Every `Where` cell in the table, as the constant name it names. */
function rowsNaming(constant: string): number {
  // The Where column is the only place a constant is written in backticks with
  // an optional `.field` or `[index]` after it. Prose elsewhere in the document
  // names constants too, so this is anchored to a table cell.
  const pattern = new RegExp(
    `\\|\\s*\`${constant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\.[A-Za-z0-9_]+|\\[\\d+\\])?\`\\s*\\|`,
    'g',
  );
  return (ECONOMY.match(pattern) ?? []).length;
}

const MODULES: readonly (readonly [string, Record<string, unknown>])[] = [
  ['src/content/act1/tuning.ts', contentTuning as unknown as Record<string, unknown>],
  ['src/ui/tuning.ts', uiTuning as unknown as Record<string, unknown>],
  ['src/save/tuning.ts', saveTuning as unknown as Record<string, unknown>],
];

describe('the divergence table', () => {
  it('has a row for every tuned scalar in the three tuning files', () => {
    const missing: string[] = [];
    for (const [file, module] of MODULES) {
      for (const [name, value] of Object.entries(module)) {
        if (name in NOT_TUNING) continue;
        const expected = scalarCount(value);
        if (expected === null) continue;
        const found = rowsNaming(name);
        if (found !== expected) {
          missing.push(
            `${file} ${name}: ${expected} tuned value(s), ${found} row(s) in docs/ECONOMY.md`,
          );
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('has no row naming a constant that no longer exists', () => {
    // The other direction. A row left behind by a deleted constant is a table
    // that describes an economy the game does not have, which is worse than a
    // missing row because it reads as true.
    const known = new Set(MODULES.flatMap(([, module]) => Object.keys(module)));
    const cited = new Set<string>();
    for (const match of ECONOMY.matchAll(/\|\s*`([A-Z][A-Z0-9_]*)(?:\.[A-Za-z0-9_]+|\[\d+\])?`\s*\|/g)) {
      cited.add(match[1] as string);
    }
    const orphaned = [...cited].filter((name) => !known.has(name));
    expect(orphaned).toEqual([]);
  });

  it('agrees with the count the document states about itself', () => {
    // docs/ECONOMY.md opens with a per-file count and a total. A table that
    // cannot count its own rows is not a contract, which is the sentence
    // UPDATELOGV5.md stage 1 exists because of: NOW.md said twenty-two, twice,
    // while listing twenty-three things.
    let total = 0;
    for (const [file, module] of MODULES) {
      let count = 0;
      for (const [name, value] of Object.entries(module)) {
        if (name in NOT_TUNING) continue;
        count += scalarCount(value) ?? 0;
      }
      total += count;
      expect(ECONOMY, `${file} states its own count`).toContain(`${file}    `.slice(0, 30).trimEnd());
      const stated = new RegExp(`${file.replace(/[/.]/g, '\\$&')}\\s+(\\d+)`).exec(ECONOMY);
      expect(stated?.[1], `stated count for ${file}`).toBe(String(count));
    }
    const statedTotal = /^\s{34,}(\d+)$/m.exec(ECONOMY);
    expect(statedTotal?.[1], 'stated total').toBe(String(total));
  });
});
