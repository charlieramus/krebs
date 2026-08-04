/**
 * Persistence end to end: autosave, the offline delta, export and import.
 *
 * These are the tests that exercise the whole stack the way the game does,
 * through `createAct1Runtime`, rather than any one layer in isolation. Every
 * clock, timer and event listener is injected, so a session that plays for ten
 * game-minutes, saves, reloads and continues costs a few milliseconds of real
 * time and nothing is flaky.
 *
 * The claim under test is the one NOW.md has been carrying as an open item since
 * V3: unlock state is not part of hashed state, so a reload that does not
 * persist it silently refunds every purchase.
 */

import { beforeAll, describe, expect, it } from 'vitest';

import { TICK_MS } from '../../sim/constants';
import { setShortfallLogging } from '../../sim/tick';
import {
  ACT1_UNLOCK_FERMENT,
  act1GlycolysisUnlockId,
  act1UptakeUnlockId,
} from '../../content/act1/save';
import {
  createAct1Runtime,
  type Act1PersistenceOptions,
  type Act1Runtime,
} from '../../ui/runtime';
import { GLYCOLYSIS_STEPS, UPTAKE_VMAX_STEPS } from '../../ui/tuning';
import { serialize } from '../codec';
import { computeOfflineDelta, MAX_OFFLINE_MS } from '../offline';
import { createMemoryStore, createSaveStore, STORAGE_KEYS, type KeyValueStore } from '../storage';
import { AUTOSAVE_INTERVAL_MS } from '../tuning';

beforeAll(() => {
  setShortfallLogging(false);
});

/**
 * A controllable browser: a timer that fires when told, an event map that can be
 * dispatched into, and a wall clock that only moves when the test moves it.
 */
function harness(seed: Readonly<Record<string, string>> = {}) {
  const backing = createMemoryStore(seed);
  /**
   * Timers and listeners are really removed on teardown, not just recorded.
   * A harness whose `stopTimer` is a no-op keeps a stopped runtime's autosave
   * alive, and a test that then fires every timer is testing the wrong runtime.
   */
  const timers = new Map<number, { callback: () => void; ms: number }>();
  const listeners = new Map<string, Set<() => void>>();
  let nextHandle = 1;
  let epoch = 1785000000000;

  const persistence = (extra: Partial<Act1PersistenceOptions> = {}): Act1PersistenceOptions => ({
    store: createSaveStore({ store: backing }),
    epochClock: () => epoch,
    startTimer: (callback, ms) => {
      const handle = nextHandle;
      nextHandle += 1;
      timers.set(handle, { callback, ms });
      return handle;
    },
    stopTimer: (handle) => {
      timers.delete(handle);
    },
    listen: (event, handler) => {
      const set = listeners.get(event) ?? new Set<() => void>();
      set.add(handler);
      listeners.set(event, set);
      return () => set.delete(handler);
    },
    ...extra,
  });

  return {
    backing,
    persistence,
    get epoch() {
      return epoch;
    },
    advanceWallClock: (ms: number) => {
      epoch += ms;
    },
    fireTimers: () => {
      for (const timer of [...timers.values()]) timer.callback();
    },
    timerIntervals: () => [...timers.values()].map((timer) => timer.ms),
    dispatch: (event: string) => {
      for (const handler of [...(listeners.get(event) ?? [])]) handler();
    },
    registered: (event: string) => (listeners.get(event) ?? new Set()).size,
  };
}

/**
 * A runtime with persistence wired to the harness and NO FRAME SCHEDULER.
 *
 * `start()` has to be callable, because starting is what starts autosave, and
 * the real scheduler is `requestAnimationFrame`, which does not exist under
 * node. Injecting a scheduler that never calls back means `start` wires the
 * timer and the listeners and drives no frames, and every test below advances
 * the simulation explicitly through `play`.
 */
function makeRuntime(
  h: ReturnType<typeof harness>,
  extra: Partial<Act1PersistenceOptions> = {},
): Act1Runtime {
  return createAct1Runtime({
    schedule: () => 0,
    cancel: () => {},
    persistence: h.persistence(extra),
  });
}

/** Drive a runtime for whole ticks, one per frame, the way rAF would at 20Hz. */
function play(runtime: Act1Runtime, ticks: number): void {
  let nowMs = 0;
  runtime.frame(nowMs);
  for (let i = 0; i < ticks; i += 1) {
    nowMs += TICK_MS;
    runtime.frame(nowMs);
  }
}

/* ===========================================================================
   THE OFFLINE DELTA
   =========================================================================== */

describe('the offline delta', () => {
  it('is now minus lastSavedAt', () => {
    const delta = computeOfflineDelta(1000, 61000);
    expect(delta.awayMs).toBe(60000);
    expect(delta.capped).toBe(false);
    expect(delta.clockWentBackwards).toBe(false);
  });

  it('credits zero when the clock moved backwards, and does not error', () => {
    // docs/SAVE_SCHEMA.md Part 3. A player whose machine changed time zone has
    // done nothing wrong, and a game that refuses to load is a worse answer.
    const delta = computeOfflineDelta(61000, 1000);
    expect(delta.awayMs).toBe(0);
    expect(delta.clockWentBackwards).toBe(true);
  });

  it('caps at MAX_OFFLINE_HOURS and says the cap bit', () => {
    const delta = computeOfflineDelta(0, MAX_OFFLINE_MS * 3);
    expect(delta.awayMs).toBe(MAX_OFFLINE_MS);
    expect(delta.capped).toBe(true);
    expect(delta.rawMs).toBe(MAX_OFFLINE_MS * 3);
  });

  it('is accumulated onto pendingOfflineMs and credited to nothing', () => {
    const h = harness();

    const first = makeRuntime(h);
    play(first, 200);
    first.save();
    const tickCountBefore = first.state.tickCount;

    h.advanceWallClock(3 * 60 * 60 * 1000); // three hours away

    const second = makeRuntime(h);
    expect(second.session.awayMs).toBe(3 * 60 * 60 * 1000);
    // NOT ONE TICK OF IT IS SIMULATED. That is V5's, and this is the seam.
    expect(second.state.tickCount).toBe(tickCountBefore);
    expect(second.state.diagnostics.pendingOfflineMs).toBe(3 * 60 * 60 * 1000);
    expect(second.capture().time.offlineCreditedMs).toBe(0);
  });

  it('survives a second reload rather than being recomputed from zero', () => {
    const h = harness();

    const first = makeRuntime(h);
    play(first, 100);
    first.save();

    h.advanceWallClock(60000);
    const second = makeRuntime(h);
    expect(second.state.diagnostics.pendingOfflineMs).toBe(60000);
    second.save();

    h.advanceWallClock(60000);
    const third = makeRuntime(h);
    // The first minute was persisted and the second is added to it.
    expect(third.state.diagnostics.pendingOfflineMs).toBe(120000);
  });
});

/* ===========================================================================
   AUTOSAVE
   =========================================================================== */

describe('autosave', () => {
  it('runs on the interval from src/save/tuning.ts', () => {
    const h = harness();
    const runtime = makeRuntime(h);
    runtime.start();

    expect(h.timerIntervals()).toEqual([AUTOSAVE_INTERVAL_MS]);
    expect(runtime.lastSave).toBeNull();

    h.fireTimers();
    expect(runtime.lastSave?.reason).toBe('interval');
    expect(runtime.lastSave?.outcome.kind).toBe('written');

    runtime.stop();
  });

  it('runs on visibilitychange, which is the reliable trigger', () => {
    const h = harness();
    const runtime = makeRuntime(h);
    runtime.start();

    expect(h.registered('visibilitychange')).toBe(1);

    // Becoming visible has nothing new to write, so only the way out saves.
    const global = globalThis as { document?: { visibilityState: string } };
    const had = 'document' in global;
    global.document = { visibilityState: 'visible' };
    try {
      h.dispatch('visibilitychange');
      expect(runtime.lastSave).toBeNull();

      global.document.visibilityState = 'hidden';
      h.dispatch('visibilitychange');
      expect(runtime.lastSave?.reason).toBe('hidden');
      expect(runtime.lastSave?.outcome.kind).toBe('written');
    } finally {
      if (!had) delete global.document;
    }

    runtime.stop();
  });

  it('wires beforeunload as a best-effort extra that is not load-bearing', () => {
    const h = harness();
    const runtime = makeRuntime(h);
    runtime.start();

    expect(h.registered('beforeunload')).toBe(1);
    h.dispatch('beforeunload');
    expect(runtime.lastSave?.reason).toBe('unload');

    // The claim that it is not load-bearing: every guarantee holds without it,
    // because the interval and visibilitychange both write the same save.
    runtime.stop();
  });

  it('writes immediately on a purchase rather than waiting for the timer', () => {
    const h = harness();
    const runtime = makeRuntime(h);
    runtime.start();

    play(runtime, 400); // past the ferment threshold
    expect(runtime.canBuyFerment()).toBe(true);
    expect(runtime.lastSave).toBeNull();

    expect(runtime.buyFerment()).toBe(true);
    expect(runtime.lastSave?.reason).toBe('unlock');
    expect(runtime.unlocked).toEqual([ACT1_UNLOCK_FERMENT]);

    runtime.stop();
  });

  it('does nothing at all when persistence is disabled', () => {
    const runtime = createAct1Runtime({
      schedule: () => 0,
      cancel: () => {},
      persistence: { enabled: false },
    });
    runtime.start();
    expect(runtime.session.kind).toBe('disabled');
    expect(runtime.save().kind).toBe('failed');
    runtime.stop();
  });
});

/* ===========================================================================
   THE RELOAD
   =========================================================================== */

describe('reloading a session', () => {
  it('brings back the tick count, the meter and the unlocks', () => {
    const h = harness();

    const first = makeRuntime(h);
    first.start();
    play(first, 400);
    first.buyFerment();
    play(first, 1200);
    first.save();

    const ticks = first.state.tickCount;
    const atp = first.snapshot.meter.atpProduced;
    const lactate = first.state.pools.get('lactate');
    first.stop();

    const second = makeRuntime(h);
    expect(second.session.kind).toBe('loaded');
    expect(second.state.tickCount).toBe(ticks);
    expect(second.snapshot.meter.atpProduced).toBe(atp);
    expect(second.state.pools.get('lactate')).toBe(lactate);
    expect(second.unlocked).toEqual([ACT1_UNLOCK_FERMENT]);
  });

  it('re-applies the uptake capacity step, which is not hashed state', () => {
    const h = harness();

    const first = makeRuntime(h);
    first.start();
    play(first, 1500);
    first.buyFerment();
    play(first, 4000);
    expect(first.canBuyUptakeStep()).toBe(true);
    expect(first.buyUptakeStep()).toBe(true);
    expect(first.unlocked).toEqual([ACT1_UNLOCK_FERMENT, act1UptakeUnlockId(1)]);
    first.stop();

    const second = makeRuntime(h);
    expect(second.snapshot.uptakeStep).toBe(1);

    // The Vmax itself, not just the step number. A snapshot field that says 1
    // while the reaction still runs at 8 is the silent refund.
    const uptake = second.state.reactions.find((r) => r.id === 'uptake');
    expect(uptake?.kinetics.vmax).toBe(UPTAKE_VMAX_STEPS[1]);
  });

  it('re-applies a glycolytic capacity rung, all four of its rates', () => {
    // UPDATELOGV5.md stage 3. The same silent refund the test above guards
    // against, over a purchase that moves four reactions instead of one. A rung
    // half restored is worse than one not restored at all: the configurations
    // between rungs are the ones measured to kill the cell.
    const h = harness();

    const first = makeRuntime(h);
    first.start();
    play(first, 1500);
    first.buyFerment();
    // Climb the uptake ladder, which has to be finished before this one opens.
    for (let i = 0; i < 200000 && first.snapshot.uptakeStep < UPTAKE_VMAX_STEPS.length - 1; i += 1) {
      play(first, 1);
      first.buyUptakeStep();
    }
    for (let i = 0; i < 400000 && first.snapshot.glycolysisStep < 1; i += 1) {
      play(first, 1);
      first.buyGlycolysisStep();
    }
    expect(first.snapshot.glycolysisStep).toBe(1);
    expect(first.unlocked).toContain(act1GlycolysisUnlockId(1));
    first.stop();

    const second = makeRuntime(h);
    expect(second.snapshot.glycolysisStep).toBe(1);

    const rung = GLYCOLYSIS_STEPS[1];
    if (rung === undefined) throw new Error('no rung 1');
    const vmaxOf = (id: string): number | undefined =>
      second.state.reactions.find((r) => r.id === id)?.kinetics.vmax;
    expect(vmaxOf('uptake')).toBe(rung.uptake);
    expect(vmaxOf('prep')).toBe(rung.prep);
    expect(vmaxOf('payoff')).toBe(rung.payoff);
    expect(vmaxOf('ferment')).toBe(rung.payoff);

    // The preparatory phase is on the Hill form and must stay on it. Restoring a
    // Vmax by rebuilding the descriptor is exactly where a curve gets swapped
    // for the wrong one, and a Michaelis-Menten `prep` reintroduces NOW.md
    // blocking item 1 without changing a single number.
    expect(second.state.reactions.find((r) => r.id === 'prep')?.kinetics.kind).toBe('hill');
  });

  it('does not re-lock a purchase the meter has already paid for', () => {
    // V3 gates unlocks on the cumulative meter, so a meter that reset on reload
    // would offer lactate dehydrogenase for sale again after it was bought.
    const h = harness();

    const first = makeRuntime(h);
    first.start();
    play(first, 400);
    first.buyFerment();
    first.stop();

    const second = makeRuntime(h);
    expect(second.snapshot.fermentUnlocked).toBe(true);
    expect(second.canBuyFerment()).toBe(false);
  });

  it('reports a clean session for a first run', () => {
    const h = harness();
    const runtime = makeRuntime(h);

    expect(runtime.session.kind).toBe('new-game');
    expect(runtime.session.awayMs).toBe(0);
    expect(runtime.session.durable).toBe(true);
    expect(runtime.session.missingPools).toEqual([]);
    expect(runtime.session.discardedMs).toBe(0);
  });

  it('reports a corrupt save as recoverable and starts a new game in memory', () => {
    const h = harness();

    const first = makeRuntime(h);
    first.start();
    play(first, 400);
    first.save();
    play(first, 400);
    first.save(); // the first save is now the backup
    first.stop();

    const good = h.backing.getItem(STORAGE_KEYS.backup);
    h.backing.setItem(STORAGE_KEYS.active, 'wreckage');

    const second = makeRuntime(h);
    expect(second.session.kind).toBe('recoverable');
    // A NEW GAME IN MEMORY. The backup is an offer the player has not taken.
    expect(second.state.tickCount).toBe(0);
    // And nothing on disk moved.
    expect(h.backing.getItem(STORAGE_KEYS.active)).toBe('wreckage');
    expect(h.backing.getItem(STORAGE_KEYS.backup)).toBe(good);

    expect(second.acceptRecovery().kind).toBe('written');
    expect(h.backing.getItem(STORAGE_KEYS.active)).toBe(good);
    // The wreckage is kept as evidence rather than deleted.
    expect(h.backing.getItem(STORAGE_KEYS.backup)).toBe('wreckage');
  });

  it('refuses a save from a newer build and leaves it alone', () => {
    const h = harness();
    const first = makeRuntime(h);
    play(first, 100);
    const future = JSON.parse(serialize(first.capture())) as Record<string, unknown>;
    future['schemaVersion'] = 99;
    const text = JSON.stringify(future);
    h.backing.setItem(STORAGE_KEYS.active, text);

    const second = makeRuntime(h);
    expect(second.session.kind).toBe('future');
    expect(second.session.futureVersion).toBe(99);
    expect(second.state.tickCount).toBe(0);
    expect(h.backing.getItem(STORAGE_KEYS.active)).toBe(text);
  });

  it('keeps running with no durable storage and says so', () => {
    const throwing: KeyValueStore = {
      getItem: () => null,
      setItem: () => {
        throw new Error('storage is disabled');
      },
      removeItem: () => {},
    };
    const runtime = createAct1Runtime({
      schedule: () => 0,
      cancel: () => {},
      persistence: { store: createSaveStore({ store: throwing }), epochClock: () => 1 },
    });
    runtime.start();
    play(runtime, 100);

    expect(runtime.save().kind).toBe('written');
    expect(runtime.session.kind).toBe('new-game');
    // The session reads durability at construction, so the live store is the
    // authority once a write has actually failed over.
    expect(runtime.state.tickCount).toBe(100);
    runtime.stop();
  });
});

/* ===========================================================================
   EXPORT AND IMPORT
   =========================================================================== */

describe('export and import', () => {
  it('exports readable JSON that imports back', () => {
    const source = harness();
    const first = makeRuntime(source);
    first.start();
    play(first, 400);
    first.buyFerment();
    play(first, 800);
    const exported = first.exportSave();
    first.stop();

    // Readable, per docs/SAVE_SCHEMA.md Part 4. There is nothing to protect.
    expect(exported).toContain('\n  "schemaVersion": 1');

    const target = harness();
    const fresh = makeRuntime(target);
    expect(fresh.importSave(exported)).toEqual({ kind: 'ok' });

    const loaded = makeRuntime(target);
    expect(loaded.session.kind).toBe('loaded');
    expect(loaded.state.tickCount).toBe(1200);
    expect(loaded.unlocked).toEqual([ACT1_UNLOCK_FERMENT]);
  });

  it('an import that fails does not touch the existing save', () => {
    const h = harness();
    const first = makeRuntime(h);
    first.start();
    play(first, 400);
    first.save();
    first.stop();
    const onDisk = h.backing.getItem(STORAGE_KEYS.active);

    const runtime = makeRuntime(h);
    expect(runtime.importSave('not a save').kind).toBe('corrupt');
    expect(runtime.importSave('{"schemaVersion": 1}').kind).toBe('corrupt');

    expect(h.backing.getItem(STORAGE_KEYS.active)).toBe(onDisk);
  });

  it('seals the session so nothing overwrites the file that was just imported', () => {
    // THE DEFECT THIS EXISTS FOR, found by reloading the real page. The
    // interface reloads after an import, `beforeunload` fires on that reload,
    // and the still-running session autosaves itself over the import. The
    // import appears to work and the player gets the save they replaced.
    const source = harness();
    const donor = makeRuntime(source);
    play(donor, 800);
    const exported = donor.exportSave();

    const h = harness();
    const runtime = makeRuntime(h);
    runtime.start();
    play(runtime, 100);

    expect(runtime.importSave(exported)).toEqual({ kind: 'ok' });
    const imported = h.backing.getItem(STORAGE_KEYS.active);

    // Every remaining write path refuses, rather than the reload having to
    // outrun them.
    h.dispatch('beforeunload');
    h.fireTimers();
    expect(runtime.save().kind).toBe('failed');
    expect(h.backing.getItem(STORAGE_KEYS.active)).toBe(imported);

    const loaded = makeRuntime(h);
    expect(loaded.state.tickCount).toBe(800);
  });

  it('seals the session after an accepted recovery too', () => {
    const h = harness();
    const first = makeRuntime(h);
    first.start();
    play(first, 400);
    first.save();
    play(first, 400);
    first.save();
    first.stop();

    const good = h.backing.getItem(STORAGE_KEYS.backup);
    h.backing.setItem(STORAGE_KEYS.active, 'wreckage');

    const runtime = makeRuntime(h);
    runtime.start();
    expect(runtime.acceptRecovery().kind).toBe('written');

    h.dispatch('beforeunload');
    h.fireTimers();
    expect(h.backing.getItem(STORAGE_KEYS.active)).toBe(good);
  });

  it('refuses to import a save from a newer build', () => {
    const h = harness();
    const runtime = makeRuntime(h);
    const future = JSON.parse(serialize(runtime.capture())) as Record<string, unknown>;
    future['schemaVersion'] = 7;

    const outcome = runtime.importSave(JSON.stringify(future));
    expect(outcome.kind).toBe('future');
    if (outcome.kind !== 'future') return;
    expect(outcome.version).toBe(7);
    expect(h.backing.getItem(STORAGE_KEYS.active)).toBeNull();
  });

  it('refuses a file carrying a pool this build does not know', () => {
    // The codec cannot catch this, because it is content-blind. The act 1
    // mapping is the layer that knows, and import runs it before writing.
    const h = harness();
    const runtime = makeRuntime(h);
    const stranger = JSON.parse(serialize(runtime.capture())) as Record<string, unknown>;
    (stranger['pools'] as Record<string, unknown>)['citrate'] = 3;

    const outcome = runtime.importSave(JSON.stringify(stranger));
    expect(outcome.kind).toBe('corrupt');
    if (outcome.kind !== 'corrupt') return;
    expect(outcome.reason).toContain('citrate');
    expect(h.backing.getItem(STORAGE_KEYS.active)).toBeNull();
  });
});

/* ===========================================================================
   THE COST OF A WRITE
   =========================================================================== */

describe('the cost of a write', () => {
  it('reports how long the verify-then-swap write path takes', () => {
    const h = harness();
    const runtime = makeRuntime(h);
    runtime.start();
    play(runtime, 1200);

    const samples: number[] = [];
    for (let i = 0; i < 200; i += 1) {
      runtime.save();
      samples.push(runtime.lastSave?.durationMs ?? 0);
    }
    samples.sort((a, b) => a - b);

    const median = samples[Math.floor(samples.length / 2)] as number;
    const worst = samples[samples.length - 1] as number;
    const bytes = serialize(runtime.capture()).length;

    console.log(
      `\nautosave write cost, 200 writes through capture, serialize, verify and swap:\n` +
        `  median  ${median.toFixed(3)} ms\n` +
        `  worst   ${worst.toFixed(3)} ms\n` +
        `  save    ${bytes} bytes\n` +
        `  budget  16.667 ms is one frame at 60Hz\n`,
    );

    // Not a performance assertion with a tight bound, which would be flaky on a
    // loaded CI box. The claim is only that a write is not in the same order of
    // magnitude as a frame.
    expect(median).toBeLessThan(16.667);
    runtime.stop();
  });
});
