/**
 * The two cheap checks UPDATELOGV9.md stage 2 step 4 asks for, both of which
 * needed a real browser and neither of which had ever had one.
 *
 * 1. THE SAVE ROUND TRIP AGAINST REAL localStorage. Every storage test in the
 *    project injects a fake `Storage`. That was the right call for testability
 *    and it means the real thing has been exercised only by hand. A fake cannot
 *    reproduce quota behaviour, cross-document persistence, or the fact that a
 *    reload genuinely tears the page down.
 *
 * 2. THE REDUCED-MOTION TRANSITION. NOW.md records the app's half as passing and
 *    the OS-to-browser half as verified, and then says what remains unobserved:
 *    "a player flipping the toggle mid-session, which `usePrefersReducedMotion`
 *    listens for and which nothing has watched happen." Windows made that
 *    unobservable for V7, because `SPI_SETCLIENTAREAANIMATION` is a no-op on
 *    this build and the value is cached per session. `emulateMedia` on a live
 *    page is exactly that event, with no reload, in three engines.
 */

import { expect, test } from '@playwright/test';

const ACTIVE_KEY = 'krebs.save.active';

/**
 * Force an autosave rather than waiting out AUTOSAVE_INTERVAL_MS.
 *
 * `visibilitychange` is one of the three real autosave triggers, so this drives
 * a shipped code path rather than reaching into the runtime. Waiting 30s per
 * browser would test the same write through a timer instead, three times over.
 */
async function forceAutosave(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

test('writes, restores and continues a save in real localStorage', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(`${error.name}: ${error.message}`));

  await page.goto('/');
  await page.waitForSelector('[data-reaction]');

  // Let the cell actually run, so elapsed game time is unambiguously non-zero
  // and the NAD+ wall has been reached and passed through.
  await page.waitForTimeout(4000);
  await forceAutosave(page);

  const first = await page.waitForFunction(
    (key) => window.localStorage.getItem(key),
    ACTIVE_KEY,
    { timeout: 40_000 },
  );
  const firstText = (await first.jsonValue()) as string;
  const firstSave = JSON.parse(firstText) as {
    schemaVersion: number;
    meta: { buildId: string; lastSavedAt: number };
    time: { elapsedGameMs: number };
    progression: { act: number };
  };

  expect(firstSave.schemaVersion, 'schema version in a real browser save').toBe(1);
  expect(firstSave.time.elapsedGameMs, 'elapsed game time').toBeGreaterThan(0);
  expect(firstSave.progression.act).toBe(1);

  const elapsedBefore = firstSave.time.elapsedGameMs;

  // A genuine teardown, not a soft reset.
  await page.reload();
  await page.waitForSelector('[data-reaction]');
  await page.waitForTimeout(4000);
  await forceAutosave(page);

  await page.waitForFunction(
    ([key, before]) => {
      const text = window.localStorage.getItem(key as string);
      if (text === null) return false;
      const save = JSON.parse(text) as { time: { elapsedGameMs: number } };
      return save.time.elapsedGameMs > (before as number);
    },
    [ACTIVE_KEY, elapsedBefore] as const,
    { timeout: 40_000 },
  );

  const secondText = (await page.evaluate((key) => window.localStorage.getItem(key), ACTIVE_KEY)) as string;
  const secondSave = JSON.parse(secondText) as { time: { elapsedGameMs: number } };

  /**
   * The assertion that makes this a round trip rather than two writes. If the
   * reload had started a fresh cell, elapsed would have reset to roughly zero
   * and climbed back to about 4s. It is strictly greater than where it was, so
   * the second session continued the first from disk.
   */
  expect(secondSave.time.elapsedGameMs).toBeGreaterThan(elapsedBefore);
  expect(pageErrors, 'page errors across the round trip').toEqual([]);
});

test('swaps the motion channel mid-session, with no reload', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await page.waitForSelector('[data-reaction]');

  // Flowing state: the dashed flow line exists, and the numeric rate is present
  // in the DOM but hidden from sight because the dashes carry it.
  const flowingDashes = await page.locator('line[stroke-dasharray]').count();
  expect(flowingDashes, 'flowing dash lines under no-preference').toBeGreaterThan(0);

  const hiddenFigures = await page.locator('.sr-only').count();
  expect(hiddenFigures, 'rate figures hidden while dashes carry the rate').toBeGreaterThan(0);

  /**
   * THE EVENT NOBODY HAD EVER WATCHED. No reload, no navigation: the media query
   * changes underneath a running page and `usePrefersReducedMotion` has to
   * notice via its change listener.
   */
  await page.emulateMedia({ reducedMotion: 'reduce' });

  await expect
    .poll(() => page.locator('line[stroke-dasharray]').count(), {
      message: 'dash lines should disappear when reduced motion turns on mid-session',
      timeout: 10_000,
    })
    .toBe(0);

  // And the channel is replaced rather than removed: the rate that the dashes
  // were carrying is now visible as a number.
  await expect
    .poll(() => page.locator('[data-reaction] .sr-only').count(), {
      message: 'rate figures should become visible when the dashes stop',
      timeout: 10_000,
    })
    .toBe(0);

  const visibleRates = page.locator('[data-reaction]').first();
  await expect(visibleRates).toContainText('/s');

  // And back again, because a one-way listener would pass everything above.
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect
    .poll(() => page.locator('line[stroke-dasharray]').count(), {
      message: 'dash lines should return when reduced motion turns off',
      timeout: 10_000,
    })
    .toBeGreaterThan(0);
});
