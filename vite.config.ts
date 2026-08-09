import { execSync } from 'node:child_process';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { needsSourceGate } from './vite/needsSourceGate';
import { bundleBudget } from './vite/bundleBudget';

/**
 * THE BUILD ID. UPDATELOGV9.md stage 4 step 4.
 *
 * docs/SAVE_SCHEMA.md Part 3 puts `meta.buildId` in every save and says it is
 * diagnostic only and never branched on. It has existed since V4 and has never
 * held anything useful: `src/save/meta.ts` falls back to the Vite mode, so every
 * save ever written says "production" or "test". The entire purpose of the field
 * is that a player-submitted save says which build produced it, and it could not.
 *
 * Set here rather than in a `.env` file so it cannot drift from the commit, and
 * read through `import.meta.env`, which Vite populates from `process.env` for
 * anything carrying the `VITE_` prefix. No change to src/save/meta.ts was needed.
 *
 * Falls back to `unknown-<mode>` rather than throwing. A build from a tarball
 * with no git history is a legitimate thing to do, and a save saying "unknown" is
 * a better outcome than a build that will not run.
 */
function buildId(): string {
  try {
    const sha = execSync('git rev-parse --short HEAD', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    const dirty = execSync('git status --porcelain', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return dirty === '' ? sha : `${sha}-dirty`;
  } catch {
    return 'unknown';
  }
}

process.env['VITE_BUILD_ID'] = buildId();

export default defineConfig({
  // needsSourceGate is the mechanical enforcement of CLAUDE.md hard rule 1. It
  // only applies to production builds and it fails them. See the file for why
  // it scans the emitted bundle rather than the source.
  // bundleBudget is UPDATELOGV9.md stage 4. Like needsSourceGate it applies to
  // production builds only and it fails them, so `npm run build` is the one
  // command that runs both.
  plugins: [react(), tailwindcss(), needsSourceGate(), bundleBudget()],

  build: {
    /**
     * SOURCE MAPS SHIP. UPDATELOGV9.md stage 4 step 3.
     *
     * The reasoning is the reasoning that already made saves readable.
     * docs/SAVE_SCHEMA.md Part 4 exports plain readable JSON on the grounds that
     * there is nothing to protect, and docs/PILLARS.md success condition 3 is
     * that somebody with a biochemistry background reviews this and finds no
     * error. That person cannot review minified output. A game whose whole claim
     * is that its economy is real and checkable has an argument FOR shipping the
     * means to check it, not against.
     *
     * They cost a player nothing: a .map is fetched only when devtools are open,
     * so it is not part of what anybody downloads to play. The bundle budget
     * counts them in their own category for that reason.
     */
    sourcemap: true,
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    environment: 'node',
    /**
     * WHY THIS IS SET, AND WHY IT IS NOT A GUESS. Added by UPDATELOGV9.md stage 1.
     *
     * Vitest defaults to 5000ms per test. Three tests in this suite exceed that
     * on an idle machine, measured alone, one file at a time:
     *
     *   src/content/act1/__tests__/conservation.test.ts  12763ms
     *   src/sim/__tests__/conservation.test.ts            7961ms
     *   src/ui/__tests__/unlockPacing.report.test.ts      5151ms
     *
     * All three are property tests rather than slow unit tests. Two run 50
     * randomized configurations to completion checking no pool goes negative;
     * the third plays act 1 end to end twice. They are the tests most worth
     * having and they are inherently long.
     *
     * `npm test` therefore failed intermittently before CI existed, with a
     * different subset of the three timing out on each run depending on machine
     * load, and nothing ran it automatically so nobody saw it. That is the exact
     * failure mode this log exists to end, so it is fixed here rather than
     * absorbed into a red first build.
     *
     * 60000 is deliberate and it is not a performance budget. Nothing in this
     * project has ever asked for one and a timeout is a poor place to smuggle
     * one in. Its job is to distinguish a hung test from a slow one, and a hang
     * is unbounded, so the only property that matters is clearing the slowest
     * real test by enough that a loaded CI runner cannot close the gap. 60000 is
     * 4.7x the worst observed, which survives a runner three times slower than
     * this machine.
     */
    testTimeout: 60000,
  },
});
