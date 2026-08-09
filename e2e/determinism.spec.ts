/**
 * Cross-engine determinism. UPDATELOGV9.md stage 2.
 *
 * docs/SIMULATION.md Part 5: "same seed plus same input sequence must produce a
 * bit-identical state hash across runs, machines and browsers". The last word in
 * that sentence had never been tested. This is the test.
 *
 * The node reference is not recomputed here. It is the two hashes the existing
 * suite already freezes, plus two long-run hashes committed below, so this spec
 * compares browsers against the values CI asserts in node rather than against a
 * second opinion computed the same afternoon.
 */

import { expect, test } from '@playwright/test';
import type { ProbeResult } from '../src/probe/determinismProbe';

/**
 * The node reference, measured by `npm run probe:determinism`.
 *
 * The first two are NOT new numbers. `172f83fb` has been frozen in
 * src/sim/__tests__/determinism.test.ts since V1 and `65b43d27` in
 * src/content/act1/__tests__/determinism.test.ts since V10 stage 3. Repeating
 * them here is the point: if a browser reproduces these, it reproduces the
 * values the whole test suite is built on, not merely a value that agrees with
 * itself.
 *
 * The two long-run hashes are new and were produced by the node reference in the
 * same commit that added them. A kernel arithmetic change moves all four.
 */
const NODE_REFERENCE = {
  toyCanonical: '172f83fb',
  act1Canonical: '65b43d27',
  toyLong: 'f9292a7e',
  act1Long: '35d7c4b8',
} as const;

test('reproduces every node hash exactly, in this engine', async ({ page }, testInfo) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(`${error.name}: ${error.message}`));

  await page.goto('/probe/');

  // Wait for the probe to finish rather than for a fixed delay. A thrown probe
  // sets __PROBE_ERROR__, so this resolves on failure too and the assertion
  // below reports the real cause instead of a timeout.
  await page.waitForFunction(
    () => window.__PROBE_RESULT__ !== undefined || window.__PROBE_ERROR__ !== undefined,
    undefined,
    { timeout: 150_000 },
  );

  const probeError = await page.evaluate(() => window.__PROBE_ERROR__);
  expect(probeError, 'the probe threw in the page').toBeUndefined();

  const result = (await page.evaluate(() => window.__PROBE_RESULT__)) as ProbeResult;
  const elapsed = await page.evaluate(() => window.__PROBE_ELAPSED_MS__);

  // Reported rather than merely asserted, so the run log carries the four hashes
  // per engine and a person can read the comparison rather than trust it.
  console.log(
    `\n  ${testInfo.project.name.padEnd(9)} ` +
      `toy=${result.toyCanonical} act1=${result.act1Canonical} ` +
      `toyLong=${result.toyLong} act1Long=${result.act1Long} ` +
      `(${result.ticks.long} ticks, ${String(elapsed)} ms)\n`,
  );

  expect(result.ticks.canonical).toBe(1200);
  expect(result.ticks.long).toBe(200000);

  expect(result.toyCanonical, 'toy pathway canonical hash').toBe(NODE_REFERENCE.toyCanonical);
  expect(result.act1Canonical, 'act 1 canonical hash').toBe(NODE_REFERENCE.act1Canonical);
  expect(result.toyLong, 'toy pathway 200000-tick hash').toBe(NODE_REFERENCE.toyLong);
  expect(result.act1Long, 'act 1 200000-tick hash').toBe(NODE_REFERENCE.act1Long);

  expect(consoleErrors, 'console errors during the probe').toEqual([]);
});
