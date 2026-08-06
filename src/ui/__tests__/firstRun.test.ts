/**
 * The first run, as persisted state. UPDATELOGV6.md stage 3.
 *
 * The card itself is prose in src/ui/content.ts and a React component, and
 * neither is what breaks. What breaks is the bookkeeping: a flag that does not
 * survive a reload shows the opening card to a player on every visit, and a flag
 * that survives too well shows it to nobody. Both are silent.
 *
 * The claims under test, in order of how badly they would fail unnoticed:
 *
 *   1. It round-trips through a real save and a real reload.
 *   2. A save written before this build existed defaults to unseen, which is
 *      the compatibility claim that let this ship without a schema bump.
 *   3. It writes immediately rather than at the next autosave interval.
 *   4. It touches nothing the simulation reads.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { ACT1 } from '../../content/acts';

import { TICK_MS } from '../../sim/constants';
import { hashState } from '../../sim/hash';
import { setShortfallLogging } from '../../sim/tick';
import { serialize } from '../../save/codec';
import { createMemoryStore, createSaveStore, STORAGE_KEYS } from '../../save/storage';
import { createActRuntime, type ActPersistenceOptions, type ActRuntime } from '../runtime';

beforeAll(() => {
  setShortfallLogging(false);
});

function harness(seed: Readonly<Record<string, string>> = {}) {
  const backing = createMemoryStore(seed);
  let epoch = 1785000000000;
  const persistence = (): ActPersistenceOptions => ({
    store: createSaveStore({ store: backing }),
    epochClock: () => epoch,
    // No timer and no listeners. Every write in this file is an explicit one,
    // so a timer that could also fire would make "it wrote immediately"
    // unfalsifiable.
    startTimer: () => 0,
    stopTimer: () => {},
    listen: () => () => {},
  });
  return { backing, persistence, advance: (ms: number) => (epoch += ms) };
}

function makeRuntime(h: ReturnType<typeof harness>): ActRuntime {
  return createActRuntime(ACT1, { schedule: () => 0, cancel: () => {}, persistence: h.persistence() });
}

function play(runtime: ActRuntime, ticks: number): void {
  let nowMs = 0;
  runtime.frame(nowMs);
  for (let i = 0; i < ticks; i += 1) {
    nowMs += TICK_MS;
    runtime.frame(nowMs);
  }
}

describe('the first run flag', () => {
  it('is unseen on a brand new game', () => {
    const h = harness();
    expect(makeRuntime(h).firstRunSeen()).toBe(false);
  });

  it('survives a save and a reload', () => {
    const h = harness();
    const first = makeRuntime(h);
    first.start();
    play(first, 40);
    first.markFirstRunSeen();
    expect(first.firstRunSeen()).toBe(true);
    first.stop();

    const second = makeRuntime(h);
    expect(second.firstRunSeen()).toBe(true);
  });

  it('lands in the save under settings, where docs/SAVE_SCHEMA.md Part 3 puts presentation', () => {
    const h = harness();
    const runtime = makeRuntime(h);
    runtime.start();
    runtime.markFirstRunSeen();

    const raw = h.backing.getItem(STORAGE_KEYS.active);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string) as { settings: Record<string, unknown> };
    expect(parsed.settings.firstRunSeen).toBe(true);
  });

  /**
   * THE COMPATIBILITY CLAIM THAT LET THIS SHIP AT SCHEMA VERSION 1.
   *
   * docs/SAVE_SCHEMA.md Part 1: a missing field new code can default is additive
   * and needs no bump. Every save V4 and V5 wrote has `settings: {}`, because
   * V3 shipped no persisted setting. Such a save must load and report unseen.
   */
  it('defaults to unseen for a save written before this build existed', () => {
    const h = harness();
    const source = makeRuntime(h);
    source.start();
    play(source, 100);
    const legacy = source.capture();
    expect(legacy.settings).toEqual({});
    source.stop();

    const restored = harness({ [STORAGE_KEYS.active]: serialize(legacy) });
    const runtime = makeRuntime(restored);
    expect(runtime.firstRunSeen()).toBe(false);
  });

  it('carries an unknown setting through untouched rather than dropping it', () => {
    // The other half of the same policy. A build that knows a key and a build
    // that does not must be able to share a file without deleting each other's
    // work, and this is the direction nobody tests.
    const h = harness();
    const source = makeRuntime(h);
    source.start();
    const base = source.capture();
    const withUnknown = { ...base, settings: { ...base.settings, futureSetting: 'kept' } };
    source.stop();

    const restored = harness({ [STORAGE_KEYS.active]: serialize(withUnknown) });
    const runtime = makeRuntime(restored);
    runtime.start();
    runtime.markFirstRunSeen();

    const parsed = JSON.parse(
      restored.backing.getItem(STORAGE_KEYS.active) as string,
    ) as { settings: Record<string, unknown> };
    expect(parsed.settings).toEqual({ futureSetting: 'kept', firstRunSeen: true });
  });

  it('writes immediately, with its own reason, rather than waiting for the interval', () => {
    // Thirty seconds is the autosave interval and a player who reads the card,
    // dismisses it and closes the tab inside that window must not be shown it
    // again. There is no timer in this harness, so a write here is this write.
    const h = harness();
    const runtime = makeRuntime(h);
    runtime.start();
    expect(runtime.lastSave).toBeNull();

    runtime.markFirstRunSeen();
    expect(runtime.lastSave?.reason).toBe('setting');
    expect(runtime.lastSave?.outcome.kind).toBe('written');
  });

  it('is idempotent and does not write a second time', () => {
    const h = harness();
    const runtime = makeRuntime(h);
    runtime.start();
    runtime.markFirstRunSeen();
    const first = h.backing.getItem(STORAGE_KEYS.active);

    h.advance(60000);
    runtime.markFirstRunSeen();
    // A second write would refresh lastSavedAt, so byte equality is the check.
    expect(h.backing.getItem(STORAGE_KEYS.active)).toBe(first);
  });

  /**
   * docs/SAVE_SCHEMA.md Part 3: anything under settings is presentation and
   * never affects simulation. Asserted rather than asserted-in-prose, because
   * this is the exact property that makes a settings key safe to add.
   */
  it('does not touch anything the simulation reads', () => {
    const h = harness();
    const runtime = makeRuntime(h);
    runtime.start();
    play(runtime, 200);

    const before = hashState(runtime.state);
    const ticksBefore = runtime.snapshot.tickCount;
    runtime.markFirstRunSeen();

    expect(hashState(runtime.state)).toBe(before);
    expect(runtime.snapshot.tickCount).toBe(ticksBefore);
  });
});
