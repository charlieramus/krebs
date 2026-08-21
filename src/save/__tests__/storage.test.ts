/**
 * Storage, corruption handling and forward compatibility.
 *
 * Every case in docs/SAVE_SCHEMA.md Part 5 that belongs to this stage, and each
 * one asserts TWO things: what the loader decided, and that no existing good
 * data was destroyed on the way to deciding it. The second assertion is the one
 * that matters. A loader that classifies a corrupt save correctly and then
 * overwrites it has still lost the run.
 *
 * The crash-state enumeration is the centrepiece. A write is five steps and a
 * process can die between any two of them, so the write path is recorded as an
 * ordered list of mutations and every prefix of that list is replayed onto a
 * fresh store and loaded from. The claim is not that crashes are unlikely, it is
 * that every reachable state still loads something valid.
 */

import { describe, expect, it } from 'vitest';

import { TICK_MS } from '../../sim/constants';
import { createLoop } from '../../sim/loop';
import { createAct1Meter, createAct1MeterProbes, recordAct1Tick } from '../../content/act1/meter';
import { createAct1 } from '../../content/act1/reactions';
import {
  ACT1_NO_CARRIED_COUNTERS,
  ACT1_UNLOCK_FERMENT,
  captureAct1,
  type Act1CaptureContext,
} from '../../content/act1/save';
import { serialize } from '../codec';
import { SCHEMA_VERSION, type SaveV2 } from '../schema';
import {
  createMemoryStore,
  createSaveStore,
  STORAGE_KEYS,
  STORAGE_PREFIX,
  type KeyValueStore,
} from '../storage';

const CONTEXT: Act1CaptureContext = {
  meta: { createdAt: 1785000000000, lastSavedAt: 1785000600000, buildId: 'test' },
  carried: ACT1_NO_CARRIED_COUNTERS,
};

/** A save with something in it, so "no progress was destroyed" means something. */
function saveAfter(ticks: number, unlocked: readonly string[] = []): SaveV2 {
  const state = createAct1({ enabled: { ferment: unlocked.includes(ACT1_UNLOCK_FERMENT) } });
  const meter = createAct1Meter();
  const probes = createAct1MeterProbes(state);
  const loop = createLoop(state, (ticked) => {
    recordAct1Tick(ticked, probes, meter);
  });
  for (let i = 0; i < ticks; i += 1) loop.advance(TICK_MS);
  return captureAct1(state, meter, unlocked, {}, CONTEXT);
}

const EARLY = saveAfter(200);
const LATER = saveAfter(600, [ACT1_UNLOCK_FERMENT]);

/** A store backed by a plain map the test can inspect directly. */
function disk(seed: Readonly<Record<string, string>> = {}): {
  store: KeyValueStore;
  data: Map<string, string>;
} {
  const data = new Map<string, string>(Object.entries(seed));
  return {
    data,
    store: {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => {
        data.set(key, value);
      },
      removeItem: (key) => {
        data.delete(key);
      },
    },
  };
}

function quotaError(): Error {
  const error = new Error('The quota has been exceeded.');
  error.name = 'QuotaExceededError';
  return error;
}

/* ===========================================================================
   THE ORDINARY PATH
   =========================================================================== */

describe('save storage, the ordinary path', () => {
  it('writes, reads back and loads', () => {
    const store = createSaveStore({ store: disk().store });
    expect(store.load().kind).toBe('new-game');

    expect(store.write(EARLY)).toEqual({ kind: 'written', durable: true });

    const loaded = store.load();
    expect(loaded.kind).toBe('loaded');
    if (loaded.kind !== 'loaded') return;
    expect(loaded.save).toEqual(EARLY);
  });

  it('leaves no temporary key behind after a clean write', () => {
    const { store: raw } = disk();
    const store = createSaveStore({ store: raw });
    store.load();
    store.write(EARLY);
    expect(raw.getItem(STORAGE_KEYS.temp)).toBeNull();
  });

  it('keeps exactly one backup, the previous save', () => {
    const { store: raw, data } = disk();
    const store = createSaveStore({ store: raw });
    store.load();

    store.write(EARLY);
    // Nothing to promote on the first write of a session.
    expect(data.has(STORAGE_KEYS.backup)).toBe(false);

    store.write(LATER);
    expect(raw.getItem(STORAGE_KEYS.active)).toBe(serialize(LATER));
    expect(raw.getItem(STORAGE_KEYS.backup)).toBe(serialize(EARLY));

    // One slot, not a history. Part 1 says a single backup slot.
    store.write(EARLY);
    expect(raw.getItem(STORAGE_KEYS.backup)).toBe(serialize(LATER));
    expect([...data.keys()].filter((key) => key.startsWith(STORAGE_PREFIX)).sort()).toEqual([
      STORAGE_KEYS.active,
      STORAGE_KEYS.backup,
    ]);
  });
});

/* ===========================================================================
   THE CRASH-STATE ENUMERATION
   =========================================================================== */

type Mutation = { readonly op: 'set'; readonly key: string; readonly value: string } | {
  readonly op: 'remove';
  readonly key: string;
};

/** Record the ordered mutations one write performs against a given starting state. */
function recordWrite(
  initial: Readonly<Record<string, string>>,
  save: SaveV2,
): { readonly log: readonly Mutation[] } {
  const data = new Map<string, string>(Object.entries(initial));
  const log: Mutation[] = [];
  const recorder: KeyValueStore = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      log.push({ op: 'set', key, value });
      data.set(key, value);
    },
    removeItem: (key) => {
      log.push({ op: 'remove', key });
      data.delete(key);
    },
  };
  const store = createSaveStore({ store: recorder });
  // A real session loads before it writes, which is what establishes that the
  // active slot is worth promoting.
  store.load();
  store.write(save);
  return { log };
}

/** Replay the first n mutations onto the starting state and load from the result. */
function afterCrash(
  initial: Readonly<Record<string, string>>,
  log: readonly Mutation[],
  n: number,
) {
  const data: Record<string, string> = { ...initial };
  for (let i = 0; i < n; i += 1) {
    const mutation = log[i];
    if (mutation === undefined) continue;
    if (mutation.op === 'set') data[mutation.key] = mutation.value;
    else delete data[mutation.key];
  }
  return { outcome: createSaveStore({ store: createMemoryStore(data) }).load(), data };
}

describe('save storage, crash states', () => {
  const initial = { [STORAGE_KEYS.active]: serialize(EARLY) };
  const { log } = recordWrite(initial, LATER);

  it('performs exactly the five-step write path', () => {
    expect(log.map((m) => `${m.op} ${m.key.replace(STORAGE_PREFIX, '')}`)).toEqual([
      'set temp',
      'set backup',
      'set active',
      'remove temp',
    ]);
  });

  it('still loads a valid save from every reachable crash state', () => {
    const rows: string[] = [];

    for (let n = 0; n <= log.length; n += 1) {
      const { outcome } = afterCrash(initial, log, n);
      expect(outcome.kind).toBe('loaded');
      if (outcome.kind !== 'loaded') continue;

      const which = outcome.save.time.elapsedGameMs === LATER.time.elapsedGameMs ? 'new' : 'previous';
      rows.push(
        `  after ${n} of ${log.length} steps: loaded, ${which} save (${outcome.save.time.elapsedGameMs} ms)`,
      );
    }

    console.log(`\ncrash-state enumeration, write over an existing save:\n${rows.join('\n')}\n`);
  });

  it('never loses more than the write that was in flight', () => {
    // Before the active swap, the previous save is what comes back. After it,
    // the new one. There is no window in which neither does.
    expect(loadedMs(afterCrash(initial, log, 0).outcome)).toBe(EARLY.time.elapsedGameMs);
    expect(loadedMs(afterCrash(initial, log, 1).outcome)).toBe(EARLY.time.elapsedGameMs);
    expect(loadedMs(afterCrash(initial, log, 2).outcome)).toBe(EARLY.time.elapsedGameMs);
    expect(loadedMs(afterCrash(initial, log, 3).outcome)).toBe(LATER.time.elapsedGameMs);
    expect(loadedMs(afterCrash(initial, log, 4).outcome)).toBe(LATER.time.elapsedGameMs);
  });

  it('leaves at most a stale temporary key, which nothing ever loads from', () => {
    const { data } = afterCrash(initial, log, 3);
    expect(data[STORAGE_KEYS.temp]).toBe(serialize(LATER));
    // And the next clean write clears it.
    const store = createSaveStore({ store: createMemoryStore(data) });
    store.load();
    store.write(LATER);
    expect(store.readActive()).toBe(serialize(LATER));
  });

  it('enumerates the first write of a fresh game too', () => {
    const fresh = recordWrite({}, EARLY);
    expect(fresh.log.map((m) => `${m.op} ${m.key.replace(STORAGE_PREFIX, '')}`)).toEqual([
      'set temp',
      'set active',
      'remove temp',
    ]);

    // No backup promotion, because there is nothing to promote. Crashing before
    // the active swap is a new game, which is exactly what it was.
    expect(afterCrash({}, fresh.log, 0).outcome.kind).toBe('new-game');
    expect(afterCrash({}, fresh.log, 1).outcome.kind).toBe('new-game');
    expect(afterCrash({}, fresh.log, 2).outcome.kind).toBe('loaded');
    expect(afterCrash({}, fresh.log, 3).outcome.kind).toBe('loaded');
  });
});

function loadedMs(outcome: ReturnType<ReturnType<typeof createSaveStore>['load']>): number {
  if (outcome.kind !== 'loaded') throw new Error(`expected loaded, got ${outcome.kind}`);
  return outcome.save.time.elapsedGameMs;
}

/* ===========================================================================
   CORRUPTION
   =========================================================================== */

describe('save storage, corruption', () => {
  it('reports truncated JSON as unreadable and does not touch it', () => {
    const truncated = serialize(EARLY).slice(0, 120);
    const { store: raw } = disk({ [STORAGE_KEYS.active]: truncated });
    const store = createSaveStore({ store: raw });

    const outcome = store.load();
    expect(outcome.kind).toBe('unreadable');
    if (outcome.kind !== 'unreadable') return;
    expect(outcome.backupReason).toBeNull();

    // The evidence stays on disk, byte for byte.
    expect(raw.getItem(STORAGE_KEYS.active)).toBe(truncated);
  });

  it('reports malformed JSON the same way', () => {
    const { store: raw } = disk({ [STORAGE_KEYS.active]: '{"schemaVersion": 1, "meta": }' });
    const outcome = createSaveStore({ store: raw }).load();
    expect(outcome.kind).toBe('unreadable');
    expect(raw.getItem(STORAGE_KEYS.active)).toBe('{"schemaVersion": 1, "meta": }');
  });

  it('reports a structurally wrong save with a reason naming the field', () => {
    const broken = JSON.parse(serialize(EARLY)) as Record<string, unknown>;
    (broken['pools'] as Record<string, unknown>)['nad'] = 'plenty';
    const { store: raw } = disk({ [STORAGE_KEYS.active]: JSON.stringify(broken) });

    const outcome = createSaveStore({ store: raw }).load();
    expect(outcome.kind).toBe('unreadable');
    if (outcome.kind !== 'unreadable') return;
    expect(outcome.reason).toContain('pools.nad');
  });

  it('offers recovery from backup rather than silently starting a new game', () => {
    const corrupt = 'not a save at all';
    const { store: raw } = disk({
      [STORAGE_KEYS.active]: corrupt,
      [STORAGE_KEYS.backup]: serialize(EARLY),
    });
    const store = createSaveStore({ store: raw });

    const outcome = store.load();
    expect(outcome.kind).toBe('recoverable');
    if (outcome.kind !== 'recoverable') return;
    expect(outcome.save).toEqual(EARLY);

    // OFFERED, not applied. Nothing has moved until the player says so.
    expect(raw.getItem(STORAGE_KEYS.active)).toBe(corrupt);
    expect(raw.getItem(STORAGE_KEYS.backup)).toBe(serialize(EARLY));

    expect(store.acceptRecovery()).toEqual({ kind: 'written', durable: true });
    expect(raw.getItem(STORAGE_KEYS.active)).toBe(serialize(EARLY));
    // The corrupt primary is kept as evidence rather than deleted.
    expect(raw.getItem(STORAGE_KEYS.backup)).toBe(corrupt);
  });

  it('never promotes a corrupt primary into the backup slot', () => {
    // THE FAILURE THIS PREVENTS: notice the corruption, keep playing, autosave
    // fires, step 4 promotes the corrupt active into backup, and the one
    // recoverable copy is gone.
    const { store: raw } = disk({
      [STORAGE_KEYS.active]: 'garbage',
      [STORAGE_KEYS.backup]: serialize(EARLY),
    });
    const store = createSaveStore({ store: raw });

    expect(store.load().kind).toBe('recoverable');
    store.write(LATER);

    expect(raw.getItem(STORAGE_KEYS.active)).toBe(serialize(LATER));
    expect(raw.getItem(STORAGE_KEYS.backup)).toBe(serialize(EARLY));
  });

  it('reports both slots failing without destroying either', () => {
    const { store: raw } = disk({
      [STORAGE_KEYS.active]: 'garbage',
      [STORAGE_KEYS.backup]: 'also garbage',
    });
    const outcome = createSaveStore({ store: raw }).load();
    expect(outcome.kind).toBe('unreadable');
    if (outcome.kind !== 'unreadable') return;
    expect(outcome.backupReason).not.toBeNull();
    expect(raw.getItem(STORAGE_KEYS.active)).toBe('garbage');
    expect(raw.getItem(STORAGE_KEYS.backup)).toBe('also garbage');
  });
});

/* ===========================================================================
   FORWARD COMPATIBILITY
   =========================================================================== */

describe('save storage, a save from a newer build', () => {
  const future = JSON.parse(serialize(EARLY)) as Record<string, unknown>;
  future['schemaVersion'] = SCHEMA_VERSION + 1;
  const futureText = JSON.stringify(future);

  it('is a distinct outcome from corruption', () => {
    const outcome = createSaveStore({ store: disk({ [STORAGE_KEYS.active]: futureText }).store }).load();
    expect(outcome.kind).toBe('future');
    if (outcome.kind !== 'future') return;
    expect(outcome.version).toBe(SCHEMA_VERSION + 1);
  });

  it('is preserved untouched and is not recovered from backup instead', () => {
    const { store: raw } = disk({
      [STORAGE_KEYS.active]: futureText,
      [STORAGE_KEYS.backup]: serialize(EARLY),
    });
    const outcome = createSaveStore({ store: raw }).load();

    // Not `recoverable`. Quietly loading an older backup over a newer save is a
    // silent downgrade, which is the thing Part 1's forward compatibility rule
    // exists to prevent.
    expect(outcome.kind).toBe('future');
    expect(raw.getItem(STORAGE_KEYS.active)).toBe(futureText);
    expect(raw.getItem(STORAGE_KEYS.backup)).toBe(serialize(EARLY));
  });

  it('is not overwritten by a subsequent write either', () => {
    const { store: raw } = disk({
      [STORAGE_KEYS.active]: futureText,
      [STORAGE_KEYS.backup]: serialize(EARLY),
    });
    const store = createSaveStore({ store: raw });
    store.load();
    store.write(LATER);

    // The active slot does move, because the game is running and autosaving.
    // What must not happen is the newer save being promoted over the good
    // backup, and it is not: activeKnownGood is false.
    expect(raw.getItem(STORAGE_KEYS.backup)).toBe(serialize(EARLY));
  });
});

/* ===========================================================================
   STORAGE THAT IS NOT THERE
   =========================================================================== */

describe('save storage, no durable storage', () => {
  it('falls back to memory and says so when there is no localStorage', () => {
    const store = createSaveStore({ store: throwingStore() });
    expect(store.durable).toBe(true); // an injected store is taken at its word

    const outcome = store.write(EARLY);
    expect(outcome.kind).toBe('written');
    expect(outcome.durable).toBe(false);
    expect(store.durable).toBe(false);
    expect(store.nonDurableReason).toBe('unavailable');

    // The game keeps running: the save is readable for the life of the tab.
    const loaded = store.load();
    expect(loaded.kind).toBe('loaded');
  });

  it('reports quota separately from unavailable, because the sentence differs', () => {
    const store = createSaveStore({ store: throwingStore(quotaError) });
    store.write(EARLY);
    expect(store.nonDurableReason).toBe('quota');
  });

  it('a quota failure does NOT destroy the existing save', () => {
    // This is a property of the write ORDER rather than an accident. The
    // temporary key is written first, so the write that fails is the one whose
    // failure costs nothing.
    const { store: raw, data } = disk({ [STORAGE_KEYS.active]: serialize(EARLY) });
    const full: KeyValueStore = {
      getItem: raw.getItem,
      setItem: () => {
        throw quotaError();
      },
      removeItem: raw.removeItem,
    };

    const store = createSaveStore({ store: full });
    expect(store.load().kind).toBe('loaded');
    const outcome = store.write(LATER);

    expect(outcome.kind).toBe('written');
    expect(outcome.durable).toBe(false);
    // Untouched on disk. Not truncated, not cleared, not half-written.
    expect(data.get(STORAGE_KEYS.active)).toBe(serialize(EARLY));
    expect(data.has(STORAGE_KEYS.temp)).toBe(false);
  });

  it('carries what was on disk into the memory store rather than abandoning it', () => {
    const { store: raw } = disk({ [STORAGE_KEYS.active]: serialize(EARLY) });
    let allow = true;
    const flaky: KeyValueStore = {
      getItem: raw.getItem,
      setItem: (key, value) => {
        if (allow) raw.setItem(key, value);
        else throw quotaError();
      },
      removeItem: raw.removeItem,
    };
    const store = createSaveStore({ store: flaky });
    expect(store.load().kind).toBe('loaded');

    allow = false;
    store.write(LATER);
    // A storage failure must not read as an apparent new game.
    expect(store.load().kind).toBe('loaded');
  });

  it('probes rather than assuming, and finds no localStorage under node', () => {
    // The suite runs with environment: 'node', so there is no localStorage at
    // all. A default-constructed store must therefore be non-durable rather
    // than throwing on import.
    const store = createSaveStore();
    expect(store.durable).toBe(false);
    expect(store.nonDurableReason).toBe('unavailable');
    expect(store.write(EARLY).kind).toBe('written');
    expect(store.load().kind).toBe('loaded');
  });
});

function throwingStore(error: () => Error = () => new Error('storage is disabled')): KeyValueStore {
  return {
    getItem: () => null,
    setItem: () => {
      throw error();
    },
    removeItem: () => {},
  };
}

/* ===========================================================================
   TICK ALIGNMENT
   =========================================================================== */

describe('save storage, tick alignment', () => {
  it('loads a save whose elapsed time is not a whole number of ticks', () => {
    // What a save written at TICK_MS 50 looks like to a build running at 40.
    // docs/SAVE_SCHEMA.md decouples the duration from the tick rate and does not
    // decouple the alignment. That is the cost of the rule, not a fault, and the
    // loader must not classify it as corruption.
    const skewed: SaveV2 = {
      ...EARLY,
      time: { ...EARLY.time, elapsedGameMs: EARLY.time.elapsedGameMs + 17 },
    };
    const { store: raw } = disk({ [STORAGE_KEYS.active]: serialize(skewed) });

    const outcome = createSaveStore({ store: raw }).load();
    expect(outcome.kind).toBe('loaded');
    if (outcome.kind !== 'loaded') return;
    expect(outcome.save.time.elapsedGameMs).toBe(EARLY.time.elapsedGameMs + 17);
  });
});
