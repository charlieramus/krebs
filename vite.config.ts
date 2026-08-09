import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { needsSourceGate } from './vite/needsSourceGate';

export default defineConfig({
  // needsSourceGate is the mechanical enforcement of CLAUDE.md hard rule 1. It
  // only applies to production builds and it fails them. See the file for why
  // it scans the emitted bundle rather than the source.
  plugins: [react(), tailwindcss(), needsSourceGate()],
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
