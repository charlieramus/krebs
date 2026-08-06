/**
 * A save naming an act this build does not have. UPDATELOGV11.md stage 5.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS IS A REAL FAILURE AND NOT A HYPOTHETICAL ONE
 * ---------------------------------------------------------------------------
 *
 * `progression.act` has been written by every save since V4 and read by nothing
 * until this log. It selects an act now, and acts ship one log at a time, so
 * builds knowing different numbers of acts will exist at once: a cached bundle
 * in somebody's browser, or a deploy rolled back after a bad release. There is
 * no backend, no accounts and no way to push a fix to one player.
 *
 * The failure without a refusal is the bad kind. The lookup returns nothing and
 * the crash surfaces wherever the first property access happens rather than at
 * load, which is a stack trace in a component with no relation to the cause.
 *
 * ---------------------------------------------------------------------------
 * IT REFUSES RATHER THAN CLAMPING, AND THE DIFFERENCE IS THE WHOLE POINT
 * ---------------------------------------------------------------------------
 *
 * Clamping to the highest known act loads successfully and silently rewrites
 * somebody's progress, which is worse than refusing. `migrations.ts` already
 * settled the posture for the schema version: refuse a newer save and refuse to
 * migrate downward, ever. This is the same case one level up.
 */

import { beforeAll, describe, expect, it } from 'vitest';

import { setShortfallLogging } from '../../sim/tick';
import { ACT1, KNOWN_ACT_NUMBERS } from '../../content/acts';
import { createActRuntime, type ActRuntime } from '../../ui/runtime';
import { deserialize, serialize } from '../codec';
import { createMemoryStore, createSaveStore, STORAGE_KEYS } from '../storage';
import type { SaveV1 } from '../schema';

beforeAll(() => {
  setShortfallLogging(false);
});

/** A controllable browser, cut down to what this file needs. */
function harness(seed: Readonly<Record<string, string>> = {}) {
  const backing = createMemoryStore(seed);
  /** Both slots as they stand on disk, for the assertions that nothing moved. */
  const slots = (): Record<string, string | null> => ({
    active: backing.getItem(STORAGE_KEYS.active),
    backup: backing.getItem(STORAGE_KEYS.backup),
  });
  const timers = new Map<number, { callback: () => void; ms: number }>();
  const listeners = new Map<string, Set<() => void>>();
  let nextHandle = 1;
  return {
    backing,
    slots,
    armed: () => timers.size,
    listening: () => [...listeners.values()].reduce((n, set) => n + set.size, 0),
    fireTimers: () => {
      for (const timer of [...timers.values()]) timer.callback();
    },
    dispatch: (event: string) => {
      for (const handler of [...(listeners.get(event) ?? [])]) handler();
    },
    persistence: () => ({
      store: createSaveStore({ store: backing }),
      epochClock: () => 1785000000000,
      startTimer: (callback: () => void, ms: number) => {
        const handle = nextHandle;
        nextHandle += 1;
        timers.set(handle, { callback, ms });
        return handle;
      },
      stopTimer: (handle: number) => {
        timers.delete(handle);
      },
      listen: (event: string, handler: () => void) => {
        const set = listeners.get(event) ?? new Set<() => void>();
        set.add(handler);
        listeners.set(event, set);
        return () => set.delete(handler);
      },
    }),
  };
}

function build(h: ReturnType<typeof harness>): ActRuntime {
  return createActRuntime(ACT1, {
    schedule: () => 0,
    cancel: () => {},
    persistence: h.persistence(),
  });
}

/** A real save, written by a real runtime, with its act number moved. */
function saveAtAct(act: number): { text: string; save: SaveV1 } {
  const scratch = harness();
  const runtime = build(scratch);
  runtime.frame(0);
  runtime.frame(50);
  const save = runtime.capture();
  const moved: SaveV1 = { ...save, progression: { ...save.progression, act } };
  return { text: serialize(moved), save: moved };
}

/** A harness whose active slot already holds a save at `act`. */
function seeded(act: number) {
  const { text } = saveAtAct(act);
  return { h: harness({ [STORAGE_KEYS.active]: text }), text };
}

const UNKNOWN_ACT = Math.max(...KNOWN_ACT_NUMBERS) + 1;

describe('a save at an act this build does not have', () => {
  it('refuses without throwing, and says which act it found', () => {
    const { h } = seeded(UNKNOWN_ACT);
    const runtime = build(h);
    expect(runtime.session.kind).toBe('future-act');
    expect(runtime.session.futureAct).toBe(UNKNOWN_ACT);
    // A new game in memory, exactly as a future schema version produces. The
    // player gets a running cell rather than a blank page.
    expect(runtime.state.tickCount).toBe(0);
    expect(runtime.unlocked).toEqual([]);
  });

  it('leaves both slots exactly as they were', () => {
    const { h, text } = seeded(UNKNOWN_ACT);
    const before = h.slots();
    const runtime = build(h);
    runtime.start();
    runtime.frame(0);
    runtime.frame(1000);
    expect(h.slots()).toEqual(before);
    expect(h.slots().active).toBe(text);
  });

  it('never arms the autosave timer, even after start', () => {
    // V4's finding, applied to a new refusal: a half-initialised session that
    // writes is how a refusal turns into data loss.
    const { h } = seeded(UNKNOWN_ACT);
    const runtime = build(h);
    runtime.start();
    expect(h.armed()).toBe(0);
    expect(h.listening()).toBe(0);
  });

  it('writes nothing when a purchase is made in the refused session', () => {
    // The hole this stage found. Every purchase called `autosave?.saveNow`
    // directly rather than going through the sealed check, so a sealed session
    // that bought an unlock wrote anyway.
    const { h, text } = seeded(UNKNOWN_ACT);
    const runtime = build(h);
    runtime.start();
    runtime.frame(0);
    for (let f = 1; f <= 200; f += 1) runtime.frame(f * 50);
    expect(runtime.buyFerment()).toBe(true);
    expect(h.slots().active).toBe(text);
  });

  it('writes nothing when a save is asked for explicitly', () => {
    const { h, text } = seeded(UNKNOWN_ACT);
    const runtime = build(h);
    expect(runtime.save().kind).toBe('failed');
    expect(h.slots().active).toBe(text);
  });
});

describe('a save at an act this build does have', () => {
  it('is completely unaffected', () => {
    const { h } = seeded(1);
    const runtime = build(h);
    expect(runtime.session.kind).toBe('loaded');
    expect(runtime.session.futureAct).toBeNull();
    runtime.start();
    expect(h.armed()).toBeGreaterThan(0);
  });

  it('still autosaves on a purchase', () => {
    const { h, text } = seeded(1);
    const runtime = build(h);
    runtime.start();
    runtime.frame(0);
    for (let f = 1; f <= 200; f += 1) runtime.frame(f * 50);
    expect(runtime.buyFerment()).toBe(true);
    expect(h.slots().active).not.toBe(text);
  });
});

describe('an act that is not a positive integer is malformed', () => {
  // Rejected the way any other malformed field is, by the codec, rather than
  // reaching a registry lookup that has no answer for it.
  it.each([0, -1, 2.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects progression.act of %s as corrupt',
    (act) => {
      const { text } = saveAtAct(1);
      const parsed = JSON.parse(text) as { progression: { act: unknown } };
      parsed.progression.act = act;
      const outcome = deserialize(JSON.stringify(parsed));
      expect(outcome.kind).toBe('corrupt');
    },
  );

  it('rejects a missing act, and accepts a whole one', () => {
    const { text } = saveAtAct(1);
    const parsed = JSON.parse(text) as { progression: Record<string, unknown> };
    delete parsed.progression.act;
    expect(deserialize(JSON.stringify(parsed)).kind).toBe('corrupt');
    expect(deserialize(text).kind).toBe('ok');
  });

  it('accepts an act number this build does not have, because that is not corruption', () => {
    // The distinction the whole stage rests on: a well-formed save from a newer
    // build is refused, not rejected. The codec has no opinion about which acts
    // exist and must not acquire one.
    const { text } = saveAtAct(UNKNOWN_ACT);
    expect(deserialize(text).kind).toBe('ok');
  });
});

describe('what did NOT need touching', () => {
  it('carries unknown unlock ids through untouched, which V5 already settled', () => {
    // `Act1Unlocks.unknown` keeps ids this build does not recognise in the file
    // rather than deleting them, so a build loading a save with newer unlock ids
    // does not silently discard the purchase. Still true, asserted here so the
    // next person does not rebuild it.
    const { save } = saveAtAct(1);
    const withUnknown: SaveV1 = {
      ...save,
      progression: { ...save.progression, unlocked: ['ferment', 'oxygen-tolerance-1'] },
    };
    const h = harness({ [STORAGE_KEYS.active]: serialize(withUnknown) });
    const runtime = build(h);
    expect(runtime.session.kind).toBe('loaded');
    expect(runtime.session.unknownUnlocks).toEqual(['oxygen-tolerance-1']);
    expect(runtime.unlocked).toContain('oxygen-tolerance-1');
    expect(runtime.capture().progression.unlocked).toContain('oxygen-tolerance-1');
  });
});
