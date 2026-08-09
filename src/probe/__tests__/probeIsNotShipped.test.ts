/**
 * The probe must never reach a player. UPDATELOGV9.md stage 2.
 *
 * src/probe/ imports the real kernel and runs 200000 ticks on load. It is a
 * development instrument and it has no business in the artifact: it would be
 * dead weight against the bundle budget stage 4 sets, and probe/index.html would
 * be a second entry point on the deployed origin.
 *
 * WHAT GUARANTEES IT, IN ORDER OF STRENGTH.
 *
 * Vite's production build input is index.html and nothing else unless
 * `build.rollupOptions.input` says otherwise. So probe/index.html is served by
 * `npm run dev` and never emitted. That is a fact about Vite rather than about
 * this repository, so the two things this repository controls are asserted here:
 * that nothing in the shipped module graph imports the probe, and that the entry
 * document does not reference it.
 *
 * Verified empirically once when this was written, by building and grepping
 * dist/ for `determinismProbe`, `runDeterminismProbe` and `PROBE_RESULT`: no
 * matches, and dist/ contains index.html plus four assets and nothing else.
 * Stage 4 re-checks it against the artifact CI actually deploys, which is the
 * only place it finally matters.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(__dirname, '..', '..', '..');

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe('the determinism probe is a development instrument and stays out of the build', () => {
  const sourceFiles = walk(join(ROOT, 'src'));

  it('found the source tree, so nothing below is vacuous', () => {
    expect(sourceFiles.length).toBeGreaterThan(30);
    expect(sourceFiles.some((f) => f.includes(join('src', 'probe')))).toBe(true);
  });

  it('is imported by nothing outside src/probe', () => {
    const offenders: string[] = [];

    for (const file of sourceFiles) {
      if (file.includes(join('src', 'probe'))) continue;
      const source = readFileSync(file, 'utf8');
      // Any relative import that lands in the probe directory.
      if (/from\s+['"][^'"]*\/probe\/[^'"]*['"]/.test(source) || /from\s+['"]\.\.?\/probe['"]/.test(source)) {
        offenders.push(file.slice(ROOT.length + 1).replace(/\\/g, '/'));
      }
    }

    expect(offenders, 'these files pull the probe into the shipped module graph').toEqual([]);
  });

  it('is not referenced by the entry document, which is the whole build input', () => {
    const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
    expect(html).not.toContain('probe');
  });

  it('keeps the build input at the Vite default, so probe/index.html is not a second entry', () => {
    // If a later log adds `rollupOptions.input`, it has to decide deliberately
    // whether the probe page is in it. This assertion is what forces that.
    const config = readFileSync(join(ROOT, 'vite.config.ts'), 'utf8');
    expect(config).not.toContain('rollupOptions');
  });
});
