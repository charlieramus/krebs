/**
 * The post-deploy smoke test. UPDATELOGV9.md stage 4 step 5.
 *
 * Runs against the DEPLOYED origin, not a local build, because the class of
 * failure it exists to catch only appears once real hosting is involved: a
 * broken asset path, a CSP the edge rewrote, a caching mistake, a build that
 * uploaded but did not finish. Everything in e2e/deployedArtifact.spec.ts is the
 * same artifact under the same headers served by a local process, and passing
 * there says nothing about whether Cloudflare served it.
 *
 * Small on purpose. It answers "is the thing that just shipped alive", and the
 * suite answers everything else.
 *
 * ---------------------------------------------------------------------------
 * IT IS SKIPPED WHEN THERE IS NOTHING TO SMOKE, AND IT SAYS SO
 * ---------------------------------------------------------------------------
 *
 * Set SMOKE_URL to run it. The CI deploy job sets it from the deployment. With
 * it unset the whole file skips, because a smoke test with no deployment is not
 * a passing smoke test and should not be able to look like one.
 *
 * At the time this was written the deploy job had never run, so this file has
 * never executed against a live origin. Stage 4's report says so plainly rather
 * than letting a green suite imply otherwise.
 */

import { expect, test } from '@playwright/test';

const SMOKE_URL = process.env.SMOKE_URL;

test.skip(
  SMOKE_URL === undefined || SMOKE_URL === '',
  'SMOKE_URL is not set, so there is no deployment to smoke test',
);

test.use({ baseURL: SMOKE_URL ?? 'http://localhost' });

test('the deployed game loads, runs the pathway and writes a save', async ({ page }) => {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.name}: ${error.message}`));
  page.on('requestfailed', (request) => {
    problems.push(`requestfailed: ${request.url()} ${request.failure()?.errorText ?? ''}`);
  });

  const response = await page.goto('/');
  expect(response?.status(), 'the deployed shell responds').toBe(200);

  // The pathway rendered at all, which means the chunk loaded and React mounted.
  await page.waitForSelector('[data-reaction]');

  // A few seconds of game time, then force the write rather than waiting out
  // the 30 second autosave interval.
  await page.waitForTimeout(4000);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });

  const saved = await page.waitForFunction(() => window.localStorage.getItem('krebs.save.active'), undefined, {
    timeout: 40_000,
  });
  const save = JSON.parse((await saved.jsonValue()) as string) as {
    schemaVersion: number;
    meta: { buildId: string };
    time: { elapsedGameMs: number };
    pools: Record<string, number>;
  };

  expect(save.schemaVersion).toBe(1);
  expect(save.time.elapsedGameMs).toBeGreaterThan(0);

  // The pathway produced ATP, which is the one thing this game has to do.
  expect(save.pools.atp as number).toBeGreaterThan(0);
  expect(save.pools.pyruvate as number).toBeGreaterThan(0);

  /**
   * And the build identifies itself. Stage 4 tied buildId to the commit, so a
   * deployed save saying "production" would mean the deploy build did not have
   * git history and the field is back to being useless.
   */
  expect(save.meta.buildId, 'the deployed build identifies its commit').not.toBe('production');
  expect(save.meta.buildId.length).toBeGreaterThan(0);

  expect(problems, 'errors on the deployed origin').toEqual([]);
});
