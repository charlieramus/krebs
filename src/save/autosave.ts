/**
 * Autosave. Three triggers, and the one everybody reaches for first is not among
 * them as a primary.
 *
 *   a timer                   the interval lives in src/save/tuning.ts
 *   visibilitychange, hidden  the reliable one
 *   after an unlock purchase  because losing a purchase is the loss a player notices
 *
 * NOT `beforeunload` AS THE PRIMARY MECHANISM. It does not fire reliably in any
 * modern browser: it is skipped on mobile backgrounding, skipped when a tab is
 * discarded under memory pressure, and skipped by the bfcache path on iOS
 * Safari. A durability story that depends on it is a durability story that
 * loses the last session, and losing progress silently is what
 * docs/SAVE_SCHEMA.md Part 1 names as the worst possible outcome. It is wired as
 * a best-effort extra and IT IS NOT LOAD-BEARING; delete it and the guarantees
 * are unchanged, because `visibilitychange` to hidden fires first in every case
 * where a tab actually goes away.
 *
 * WIRED INTO THE RUNTIME, NOT INTO REACT. Same reason V3 put the loop outside
 * React: a save is not a render, it does not belong in an effect, and a
 * component unmounting must not be able to stop the game saving.
 *
 * Everything injectable. The timer, the clock and the event target are all
 * parameters, so the tests drive real behaviour without waiting for real time
 * and without a browser.
 */

import type { SaveV1 } from './schema';
import type { SaveStore, WriteOutcome } from './storage';
import { AUTOSAVE_INTERVAL_MS } from './tuning';

/** Why a write happened. Diagnostics, and the report's cost table. */
export type SaveReason = 'interval' | 'hidden' | 'unlock' | 'unload' | 'manual';

export interface AutosaveRecord {
  readonly reason: SaveReason;
  readonly outcome: WriteOutcome;
  /** Wall-clock cost of the whole verify-then-swap write, in milliseconds. */
  readonly durationMs: number;
}

export interface AutosaveOptions {
  readonly store: SaveStore;
  /** Builds the save. Called on every write, so it must be cheap and must not allocate a simulation. */
  readonly capture: () => SaveV1;
  readonly intervalMs?: number;
  /** Monotonic milliseconds, for measuring the write. Defaults to performance.now. */
  readonly monotonic?: () => number;
  /** Timer, injectable. Defaults to setInterval. */
  readonly startTimer?: (callback: () => void, ms: number) => number;
  readonly stopTimer?: (handle: number) => void;
  /** Where visibilitychange and beforeunload are listened for. Defaults to the document and the window. */
  readonly listen?: (event: string, handler: () => void) => () => void;
  /** Called after every write. The interface uses it to show when the last save happened. */
  readonly onSaved?: (record: AutosaveRecord) => void;
}

export interface Autosave {
  start(): void;
  stop(): void;
  /** Write now. Returns the outcome so a caller that cares can react. */
  saveNow(reason: SaveReason): WriteOutcome;
  /** The most recent write, or null if none has happened. */
  readonly last: AutosaveRecord | null;
  /** Worst write cost seen this session, in milliseconds. For the stage 5 measurement. */
  readonly worstDurationMs: number;
}

/**
 * The default listener binding.
 *
 * `visibilitychange` is on the document and `beforeunload` is on the window,
 * which is a browser quirk rather than a choice. Both are absent under node, so
 * the whole thing degrades to a no-op rather than throwing at import time.
 */
function defaultListen(event: string, handler: () => void): () => void {
  const target: EventTarget | undefined =
    event === 'visibilitychange'
      ? (globalThis as { document?: EventTarget }).document
      : (globalThis as { window?: EventTarget }).window;

  if (target === undefined || typeof target.addEventListener !== 'function') return () => {};
  target.addEventListener(event, handler);
  return () => target.removeEventListener(event, handler);
}

function documentIsHidden(): boolean {
  const doc = (globalThis as { document?: { visibilityState?: string } }).document;
  // No document means no visibility to change, and the tests drive the handler
  // directly. Treating "unknown" as hidden would save on every call.
  return doc?.visibilityState === 'hidden';
}

export function createAutosave(options: AutosaveOptions): Autosave {
  const intervalMs = options.intervalMs ?? AUTOSAVE_INTERVAL_MS;
  const monotonic = options.monotonic ?? (() => performance.now());
  const startTimer =
    options.startTimer ?? ((callback: () => void, ms: number) => setInterval(callback, ms) as unknown as number);
  const stopTimer = options.stopTimer ?? ((handle: number) => clearInterval(handle));
  const listen = options.listen ?? defaultListen;

  let handle: number | null = null;
  let unlisten: (() => void)[] = [];
  let last: AutosaveRecord | null = null;
  let worstDurationMs = 0;

  function saveNow(reason: SaveReason): WriteOutcome {
    const started = monotonic();
    const outcome = options.store.write(options.capture());
    const durationMs = monotonic() - started;

    if (durationMs > worstDurationMs) worstDurationMs = durationMs;
    last = { reason, outcome, durationMs };
    options.onSaved?.(last);
    return outcome;
  }

  return {
    start(): void {
      if (handle !== null) return;
      handle = startTimer(() => {
        saveNow('interval');
      }, intervalMs);

      unlisten = [
        listen('visibilitychange', () => {
          // Only on the way out. A tab becoming visible has nothing new to write.
          if (documentIsHidden()) saveNow('hidden');
        }),
        // Best effort. See the header: this is not load-bearing.
        listen('beforeunload', () => {
          saveNow('unload');
        }),
      ];
    },

    stop(): void {
      if (handle !== null) stopTimer(handle);
      handle = null;
      for (const off of unlisten) off();
      unlisten = [];
    },

    saveNow,

    get last() {
      return last;
    },
    get worstDurationMs() {
      return worstDurationMs;
    },
  };
}
