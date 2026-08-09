/**
 * The artifact, under the shipping headers, in a real browser.
 * UPDATELOGV9.md stage 3 steps 3 and 5.
 *
 * This runs against dist/ served by e2e/staticServer.mjs with public/_headers
 * applied, NOT against the dev server. The dev server has an inline HMR client,
 * a websocket to itself and unhashed modules, so a CSP that passes there proves
 * nothing about the thing that ships.
 *
 * WHAT IT CANNOT COVER, kept here rather than only in the log: Cloudflare's own
 * handling of _headers, TLS, and the edge cache. Those need the live origin.
 */

import { expect, test } from '@playwright/test';

const ORIGIN = `http://localhost:${process.env.STATIC_PORT ?? 5175}`;

test.use({ baseURL: ORIGIN });

test('runs clean under the shipping content security policy', async ({ page }) => {
  const cspViolations: string[] = [];
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const offOrigin: string[] = [];

  page.on('console', (message) => {
    const text = message.text();
    // Chromium and WebKit report a blocked resource as a console error naming
    // the directive. Collected separately so a CSP failure is not buried in a
    // generic error count.
    if (/Content Security Policy|Refused to/i.test(text)) cspViolations.push(text);
    else if (message.type() === 'error') consoleErrors.push(text);
  });
  page.on('pageerror', (error) => pageErrors.push(`${error.name}: ${error.message}`));

  // docs/PILLARS.md rule 7, checked rather than asserted: nothing may leave the
  // origin at all. Every request the page makes is recorded and compared.
  const sameOrigin: string[] = [];
  page.on('request', (request) => {
    if (request.url().startsWith(ORIGIN)) sameOrigin.push(request.url());
    else offOrigin.push(`${request.method()} ${request.url()}`);
  });

  await page.goto('/');
  await page.waitForSelector('[data-reaction]');

  // Let it run long enough to pass the NAD+ wall and write an autosave.
  await page.waitForTimeout(5000);

  expect(cspViolations, 'content security policy violations').toEqual([]);
  expect(pageErrors, 'uncaught page errors').toEqual([]);
  expect(consoleErrors, 'console errors').toEqual([]);
  expect(offOrigin, 'requests that left the origin').toEqual([]);

  /**
   * Guard the guard. An empty off-origin list means nothing if the listener
   * never fired, and this page legitimately fetches a shell, a chunk, a
   * stylesheet and two fonts. Four or more same-origin requests proves the
   * instrument was watching while it saw nothing leave.
   */
  expect(sameOrigin.length, 'the request listener saw the page load at all').toBeGreaterThanOrEqual(4);
});

test('serves the policy and the cache headers the repository ships', async ({ request }) => {
  const shell = await request.get('/');
  expect(shell.status()).toBe(200);

  const csp = shell.headers()['content-security-policy'];
  expect(csp, 'the shell carries a CSP').toBeDefined();
  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("connect-src 'none'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("base-uri 'none'");

  expect(shell.headers()['x-content-type-options']).toBe('nosniff');
  expect(shell.headers()['referrer-policy']).toBe('no-referrer');

  /**
   * The half that persists after it is fixed. A wrongly cached shell points at
   * asset filenames that no longer exist and no later deploy can reach it.
   */
  expect(shell.headers()['cache-control'], 'the shell must revalidate').toContain('must-revalidate');
  expect(shell.headers()['cache-control']).toContain('max-age=0');

  // And the hashed assets take the opposite policy, which is safe precisely
  // because the filename changes whenever the bytes do.
  const html = await shell.text();
  const asset = /src="(\/assets\/[^"]+\.js)"/.exec(html)?.[1];
  expect(asset, 'found the hashed entry chunk in the shell').toBeDefined();

  const script = await request.get(asset as string);
  expect(script.status()).toBe(200);
  expect(script.headers()['cache-control']).toContain('immutable');
  expect(script.headers()['cache-control']).toContain('max-age=31536000');
});

test('produces ATP and writes a save, from the built artifact', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('[data-reaction]');
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
    time: { elapsedGameMs: number };
    pools: Record<string, number>;
    meta: { buildId: string };
  };

  expect(save.schemaVersion).toBe(1);
  expect(save.time.elapsedGameMs).toBeGreaterThan(0);

  // The pathway ran: the cell has consumed environmental glucose and holds
  // products it can only have made by running glycolysis.
  expect(save.pools.pyruvate as number).toBeGreaterThan(0);
  expect(save.pools.atp as number).toBeGreaterThan(0);
});
