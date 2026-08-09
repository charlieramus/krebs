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

/**
 * A second server, added by stage 3, serving dist/ under public/_headers.
 *
 * The dev server cannot answer stage 3's questions: it has an inline HMR client,
 * a websocket back to itself and unhashed modules, so a content security policy
 * that passes there proves nothing about the artifact that ships.
 */
const STATIC_PORT = 5175;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  /**
   * ONE RETRY IN CI, AND IT IS NOT A FIX. Added by UPDATELOGV9.md stage 5.
   *
   * The first run of this suite on a runner failed after 4m17s where the run
   * before it passed the same step in 80s, and locally it passes in 1.9m every
   * time. The duration is the clue: one test hitting the 180s per-test timeout
   * accounts for almost exactly the difference. It was not diagnosed, because a
   * CI failure with no retained artifact leaves nothing to diagnose from.
   *
   * A retry does NOT make a flaky test correct. What it buys is that Playwright
   * reports a test that failed then passed as `flaky` rather than as either
   * `passed` or `failed`, so the instability stays visible in the run output
   * instead of being hidden by a green tick or blocking the branch on a wobble.
   * If something here is genuinely flaky, the word `flaky` in CI is what should
   * send somebody to the trace below.
   */
  retries: process.env.CI ? 1 : 0,
  workers: 1,

  /**
   * 200000 ticks of a nonlinear integrator, four times, inside an interpreter
   * that has to warm up first. Node does it in about 1.2s; a cold browser is
   * slower and WebKit slower again. Generous because the failure this timeout
   * would cause is a false red on the one measurement the log exists to take.
   */
  timeout: 180_000,

  /**
   * A CEILING ON THE WHOLE RUN, added after the first CI run hung on it.
   *
   * The per-test timeout above is deliberately generous, because the failure it
   * would otherwise cause is a false red on the one measurement this log exists
   * to take. The cost of that generosity is that a SYSTEMATIC failure, an engine
   * that will not launch on the runner, takes eighteen tests times three minutes
   * to surface, which is most of an hour of a job that had no ceiling of its own.
   *
   * Stage 5's CI run sat on the e2e step for exactly that reason. A hang has to
   * fail rather than wait: this is the ceiling for the whole run, and
   * .github/workflows/ci.yml carries a job-level timeout-minutes behind it.
   */
  globalTimeout: 900_000,

  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: `http://localhost:${PORT}`,

    /**
     * THE REASON THE FIRST CI FAILURE COULD NOT BE READ.
     *
     * It failed, the runner was destroyed, and nothing survived it: no trace, no
     * screenshot, no report. The step said which step and nothing else, so the
     * only honest thing to write in the log was "undiagnosed".
     *
     * A trace on a first retry is the cheapest possible answer to that. It costs
     * nothing on a green run, because it is only retained when a test actually
     * failed at least once, and it records every action, the DOM at each step
     * and the console. `.github/workflows/ci.yml` uploads it on failure.
     */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  webServer: [
    {
      command: `npm run dev -- --port ${PORT} --strictPort`,
      url: `http://localhost:${PORT}/probe/`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      // Requires dist/, so `npm run e2e` builds first. See package.json.
      command: `node e2e/staticServer.mjs`,
      url: `http://localhost:${STATIC_PORT}/`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: { STATIC_PORT: String(STATIC_PORT) },
    },
  ],
});
