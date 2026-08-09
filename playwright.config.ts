/**
 * Playwright, added by UPDATELOGV9.md stage 2.
 *
 * THE COST, STATED RATHER THAN SLIPPED IN. This is the first substantial
 * devDependency the project has added since V1, and it exists to test one claim:
 * that hard rule 5 buys what it says it buys. Three engines from one dependency
 * is the cheapest honest way to get Chromium, Firefox and WebKit, and the
 * alternative is asserting cross-browser determinism forever without ever having
 * run the simulation in a browser. That is a reasonable trade and it is a trade.
 *
 * The browser binaries are ~350 MB and are NOT vendored. CI installs them with
 * `npx playwright install`, which is why that is its own step.
 */

import { defineConfig, devices } from '@playwright/test';

/**
 * Its own port, with strictPort, so this never quietly attaches to a dev server
 * somebody already has running on 5173 with different code in it. A probe that
 * measured a stale bundle would be worse than no probe.
 */
const PORT = 5174;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,

  /**
   * 200000 ticks of a nonlinear integrator, four times, inside an interpreter
   * that has to warm up first. Node does it in about 1.2s; a cold browser is
   * slower and WebKit slower again. Generous because the failure this timeout
   * would cause is a false red on the one measurement the log exists to take.
   */
  timeout: 180_000,

  reporter: [['list']],

  use: {
    baseURL: `http://localhost:${PORT}`,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/probe/`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
