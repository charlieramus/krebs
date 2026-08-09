/**
 * The browser side of the cross-engine determinism probe. UPDATELOGV9.md stage 2.
 *
 * Loaded by probe/index.html, which is served by the Vite dev server and is NOT
 * part of the production build: Vite's build input is index.html alone, so this
 * page and this module never reach the deployed artifact. Confirmed against the
 * emitted bundle rather than assumed.
 *
 * The result goes on `window` for Playwright to read, and onto the page as text
 * so a person can open the URL and look at it. Both come from the same object,
 * so what a human reads and what CI compares cannot drift apart.
 */

import { runDeterminismProbe, type ProbeResult } from './determinismProbe';

declare global {
  interface Window {
    __PROBE_RESULT__?: ProbeResult;
    __PROBE_ERROR__?: string;
    __PROBE_ELAPSED_MS__?: number;
  }
}

try {
  const started = performance.now();
  const result = runDeterminismProbe();
  const elapsed = Math.round(performance.now() - started);

  window.__PROBE_RESULT__ = result;
  window.__PROBE_ELAPSED_MS__ = elapsed;

  const rows = [
    ['canonical ticks', String(result.ticks.canonical)],
    ['long ticks', String(result.ticks.long)],
    ['toy   canonical', result.toyCanonical],
    ['act1  canonical', result.act1Canonical],
    ['toy   long', result.toyLong],
    ['act1  long', result.act1Long],
    ['elapsed ms', String(elapsed)],
  ];

  const pre = document.createElement('pre');
  pre.id = 'probe-output';
  pre.textContent = rows.map(([k, v]) => `${(k as string).padEnd(18)}${v as string}`).join('\n');
  document.body.appendChild(pre);
} catch (error) {
  // A thrown probe must be visible rather than silent, or Playwright waits for a
  // result that is never coming and reports a timeout instead of the real cause.
  window.__PROBE_ERROR__ = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  const pre = document.createElement('pre');
  pre.id = 'probe-error';
  pre.textContent = window.__PROBE_ERROR__;
  document.body.appendChild(pre);
}
