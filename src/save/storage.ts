/**
 * Storage. docs/SAVE_SCHEMA.md Part 1 and Part 4.
 *
 * Every rule in this file is written to prevent one outcome, which Part 1 names
 * as the worst possible one: losing progress silently in a game with a 6 to 10
 * hour arc. Nothing here ever overwrites something it has not read back, nothing
 * here deletes evidence, and nothing here starts a new game on its own.
 *
 * localStorage sits behind an interface and is INJECTED rather than reached for.
 * The tests drive a fake and never touch a browser global, which is what lets
 * the crash-state enumeration below exist at all: a store that throws on its
 * fourth write is a three-line object here and is not expressible against a real
 * browser.
 *
 * NO CLOCK. `write` takes a save whose `meta.lastSavedAt` the caller has already
 * set. Wall-clock time enters at the boundary, which is the runtime, and stage 5
 * is where that gets wired. Storage stays a pure function of what it is handed
 * and what is already on disk.
 *
 * NO PROSE. This file reports `durable` and a reason code. The words a player
 * reads live in src/ui/content.ts with every other player-facing string, which
 * is where V3 put them and where the badge contract can see them.
 */

import { deserialize, serialize } from './codec';
import type { SaveV1 } from './schema';

/* ===========================================================================
   THE KEYS

   PERMANENT. These become contract surface the moment a build ships, in exactly
   the same way pool ids and unlock ids do: a player's progress is addressed by
   this string and renaming it orphans every save in existence with no error
   message and no way back. Chosen once, here, and written down as permanent.

   The prefix is the repository name and NOT the game's title, which docs/BRIEF.md
   line 4 still records as TBD. That is deliberate. A prefix derived from a title
   that has not been chosen would either have to change when the title lands,
   which orphans saves, or survive as a stale name forever. A prefix that was
   never claiming to be the title cannot go stale.
   =========================================================================== */

export const STORAGE_PREFIX = 'krebs.save.';

export const STORAGE_KEYS = {
  /** The save. */
  active: `${STORAGE_PREFIX}active`,
  /** The previous save. One slot, per Part 1. */
  backup: `${STORAGE_PREFIX}backup`,
  /** Written first, read back, verified, then swapped in. Never loaded from. */
  temp: `${STORAGE_PREFIX}temp`,
} as const;

/* ===========================================================================
   THE STORE INTERFACE
   =========================================================================== */

/** The three operations localStorage provides, and nothing else. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Why a store cannot promise the save survives the tab. */
export type NonDurableReason = 'unavailable' | 'quota';

export type WriteOutcome =
  | { readonly kind: 'written'; readonly durable: boolean }
  | { readonly kind: 'failed'; readonly reason: string; readonly durable: boolean };

export type LoadOutcome =
  /** The active slot parsed. The ordinary case. */
  | { readonly kind: 'loaded'; readonly save: SaveV1 }
  /**
   * The active slot did not parse and the backup did.
   *
   * NOT APPLIED. Part 1 says to offer recovery rather than silently starting a
   * new game, and offering means the caller asks. The corrupt primary stays on
   * disk untouched, because it is evidence and because a player who is about to
   * lose ten minutes should be the one who decides to.
   */
  | {
      readonly kind: 'recoverable';
      readonly save: SaveV1;
      readonly reason: string;
    }
  /**
   * The active slot came from a newer build. Not corruption, and the message a
   * player sees is different. Nothing is guessed, nothing is migrated downward
   * and the file is preserved untouched.
   */
  | { readonly kind: 'future'; readonly version: number }
  /** Nothing stored. A new game, and not an error. */
  | { readonly kind: 'new-game' }
  /** Both slots failed. Everything that is on disk stays on disk. */
  | {
      readonly kind: 'unreadable';
      readonly reason: string;
      readonly backupReason: string | null;
    };

export interface SaveStore {
  /** False when writes are going to memory and will not survive the tab. */
  readonly durable: boolean;
  /** Why, when `durable` is false. Null when it is true. */
  readonly nonDurableReason: NonDurableReason | null;

  write(save: SaveV1): WriteOutcome;
  load(): LoadOutcome;

  /** The raw active text, unparsed. Export, and evidence for a bug report. */
  readActive(): string | null;
  readBackup(): string | null;

  /**
   * Accept a recovery offer: make the backup the save.
   *
   * The corrupt primary is moved into the backup slot rather than deleted, which
   * looks backwards and is not. It is the only copy of the evidence, the backup
   * has just been promoted out of that slot, and the alternative is throwing
   * away the one artifact that would let anyone work out what went wrong.
   */
  acceptRecovery(): WriteOutcome;

  /** Remove every key this store owns. Development and tests. */
  clear(): void;
}

/* ===========================================================================
   THE STORES
   =========================================================================== */

export function createMemoryStore(seed?: Readonly<Record<string, string>>): KeyValueStore {
  const map = new Map<string, string>(seed === undefined ? [] : Object.entries(seed));
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

/**
 * The browser's localStorage, or null if there is not one that works.
 *
 * Private browsing modes and disabled-storage settings throw on ACCESS, not just
 * on write, so even reading the global is inside the try. The probe write is
 * what catches the Safari private-browsing case where the object exists and
 * every write throws.
 */
export function probeLocalStorage(): KeyValueStore | null {
  try {
    const candidate = (globalThis as { localStorage?: KeyValueStore }).localStorage;
    if (candidate === undefined || candidate === null) return null;
    const probeKey = `${STORAGE_PREFIX}probe`;
    candidate.setItem(probeKey, '1');
    candidate.removeItem(probeKey);
    return candidate;
  } catch {
    return null;
  }
}

export interface SaveStoreOptions {
  /** Injected. Defaults to localStorage, or to memory if there is not one. */
  readonly store?: KeyValueStore;
}

export function createSaveStore(options: SaveStoreOptions = {}): SaveStore {
  const injected = options.store;
  const probed = injected ?? probeLocalStorage();

  /**
   * There is nowhere else to go. docs/PILLARS.md rule 7 rules out a backend, so
   * the entire mitigation for storage being absent is an in-memory store and an
   * honest warning. The game keeps running. The player is told. Neither of those
   * is optional and the second is the one that is easy to skip.
   */
  let store: KeyValueStore = probed ?? createMemoryStore();
  let durable = probed !== null;
  let nonDurableReason: NonDurableReason | null = probed === null ? 'unavailable' : null;

  /**
   * Whether the active slot is known to hold a save that parses.
   *
   * THE POINT OF THIS FLAG. Step 4 of the write path promotes the active save
   * into the backup slot. If the active slot is corrupt, that promotion
   * overwrites a good backup with garbage and destroys the only recoverable copy
   * on the first autosave after the corruption is noticed. Guarding it by
   * re-parsing the active slot on every write would double the parse cost of a
   * write that runs on a timer, so the fact is remembered instead: set when a
   * write succeeds, set when a load succeeds, cleared when a load finds the
   * active slot bad.
   *
   * Starts false. A store that has never been loaded from has not established
   * that its active slot is worth preserving, and refusing to promote costs one
   * generation of backup depth on the first write of a session.
   */
  let activeKnownGood = false;

  /**
   * Fall back to memory.
   *
   * Whatever is already on disk stays exactly where it is and is COPIED into the
   * memory store rather than abandoned. A quota failure mid-session must not make
   * the running game believe there is no save: the disk copy is still the truth
   * until the tab closes, and starting the in-memory store empty would turn a
   * storage problem into an apparent new game.
   */
  function fallBackToMemory(reason: NonDurableReason): void {
    if (!durable) return;
    const carried: Record<string, string> = {};
    for (const key of [STORAGE_KEYS.active, STORAGE_KEYS.backup, STORAGE_KEYS.temp]) {
      try {
        const value = store.getItem(key);
        if (value !== null) carried[key] = value;
      } catch {
        // A store that throws on read as well has nothing to carry.
      }
    }
    store = createMemoryStore(carried);
    durable = false;
    nonDurableReason = reason;
  }

  /**
   * THE WRITE PATH, in the order docs/SAVE_SCHEMA.md Part 1 specifies and for
   * the reason it specifies it: never overwrite a known-good save with an
   * unverified write.
   *
   *   1. write the new save to the temporary key
   *   2. read it back
   *   3. parse it and verify it matches what was written
   *   4. promote the current active save to backup
   *   5. swap the temporary into active, then drop the temporary
   *
   * The active slot is not touched until step 5, which is after the new bytes
   * have been proven to have survived a round trip through storage. A quota
   * failure therefore lands on step 1, where the only thing that can be lost is
   * a write that had not happened yet.
   */
  function write(save: SaveV1): WriteOutcome {
    const text = serialize(save);

    // 1. Temporary key first. This is the write that fails when the quota is full.
    try {
      store.setItem(STORAGE_KEYS.temp, text);
    } catch (error) {
      fallBackToMemory(quotaLike(error) ? 'quota' : 'unavailable');
      try {
        store.setItem(STORAGE_KEYS.temp, text);
      } catch (retryError) {
        return { kind: 'failed', reason: describeError(retryError), durable };
      }
    }

    // 2 and 3. Read back, byte-compare, and parse. Byte-compare catches a store
    // that silently truncates; the parse catches one that does not.
    const readBack = store.getItem(STORAGE_KEYS.temp);
    if (readBack !== text) {
      return { kind: 'failed', reason: 'verification read did not match what was written', durable };
    }
    if (deserialize(readBack).kind !== 'ok') {
      return { kind: 'failed', reason: 'verification read did not parse', durable };
    }

    // 4. Promote, but never with something that does not parse. See activeKnownGood.
    const current = store.getItem(STORAGE_KEYS.active);
    if (current !== null && activeKnownGood) {
      try {
        store.setItem(STORAGE_KEYS.backup, current);
      } catch (error) {
        // The backup is a nicety and the save is not. A promotion that fails
        // leaves the previous backup in place, which is older but still valid,
        // and the write carries on.
        fallBackToMemory(quotaLike(error) ? 'quota' : 'unavailable');
      }
    }

    // 5. Swap. `setItem` on one key is atomic, so there is no torn active slot.
    try {
      store.setItem(STORAGE_KEYS.active, text);
    } catch (error) {
      return { kind: 'failed', reason: describeError(error), durable };
    }
    store.removeItem(STORAGE_KEYS.temp);

    activeKnownGood = true;
    return { kind: 'written', durable };
  }

  /**
   * THE LOAD PATH.
   *
   * Four outcomes and they are not interchangeable. A corrupt save is evidence
   * and is never overwritten or deleted here. A save from a newer build is not
   * corrupt at all. Nothing stored is a new game and not an error. And a corrupt
   * primary with a readable backup is an OFFER, because Part 1 says to offer
   * recovery rather than silently starting a new game.
   */
  function load(): LoadOutcome {
    const activeText = store.getItem(STORAGE_KEYS.active);

    if (activeText === null) {
      const backupText = store.getItem(STORAGE_KEYS.backup);
      if (backupText === null) {
        activeKnownGood = false;
        return { kind: 'new-game' };
      }
      // An active slot that vanished with a backup still present is the one
      // crash state that loses the newer save, and the backup is still a save.
      const backup = deserialize(backupText);
      if (backup.kind === 'ok') {
        activeKnownGood = false;
        return { kind: 'recoverable', save: backup.save, reason: 'the save slot is empty' };
      }
      activeKnownGood = false;
      return {
        kind: 'unreadable',
        reason: 'the save slot is empty',
        backupReason: backup.kind === 'future' ? `backup is version ${backup.version}` : backup.reason,
      };
    }

    const active = deserialize(activeText);

    if (active.kind === 'ok') {
      activeKnownGood = true;
      return { kind: 'loaded', save: active.save };
    }

    activeKnownGood = false;

    if (active.kind === 'future') {
      // Do not load, do not guess, do not migrate downward, do not touch it.
      return { kind: 'future', version: active.version };
    }

    const backupText = store.getItem(STORAGE_KEYS.backup);
    if (backupText !== null) {
      const backup = deserialize(backupText);
      if (backup.kind === 'ok') {
        return { kind: 'recoverable', save: backup.save, reason: active.reason };
      }
      return {
        kind: 'unreadable',
        reason: active.reason,
        backupReason: backup.kind === 'future' ? `backup is version ${backup.version}` : backup.reason,
      };
    }

    return { kind: 'unreadable', reason: active.reason, backupReason: null };
  }

  return {
    get durable() {
      return durable;
    },
    get nonDurableReason() {
      return nonDurableReason;
    },

    write,
    load,

    readActive: () => store.getItem(STORAGE_KEYS.active),
    readBackup: () => store.getItem(STORAGE_KEYS.backup),

    acceptRecovery(): WriteOutcome {
      const backupText = store.getItem(STORAGE_KEYS.backup);
      if (backupText === null) {
        return { kind: 'failed', reason: 'there is no backup to recover', durable };
      }
      const backup = deserialize(backupText);
      if (backup.kind !== 'ok') {
        return { kind: 'failed', reason: 'the backup does not parse either', durable };
      }

      const corruptPrimary = store.getItem(STORAGE_KEYS.active);
      try {
        store.setItem(STORAGE_KEYS.active, backupText);
        // The evidence goes where the backup was, rather than into the bin.
        if (corruptPrimary === null) store.removeItem(STORAGE_KEYS.backup);
        else store.setItem(STORAGE_KEYS.backup, corruptPrimary);
      } catch (error) {
        return { kind: 'failed', reason: describeError(error), durable };
      }

      activeKnownGood = true;
      return { kind: 'written', durable };
    },

    clear(): void {
      store.removeItem(STORAGE_KEYS.active);
      store.removeItem(STORAGE_KEYS.backup);
      store.removeItem(STORAGE_KEYS.temp);
      activeKnownGood = false;
    },
  };
}

/* ===========================================================================
   ERRORS
   =========================================================================== */

/**
 * Whether a thrown error is the quota.
 *
 * Browsers disagree about how they say it. The DOMException name is
 * `QuotaExceededError` almost everywhere and `NS_ERROR_DOM_QUOTA_REACHED` on
 * older Firefox, and the legacy numeric code is 22 or 1014. All four are checked
 * rather than one, because getting this wrong means reporting a full disk as a
 * missing storage API, which is a different sentence to the player.
 */
function quotaLike(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const name = (error as { name?: unknown }).name;
  const code = (error as { code?: unknown }).code;
  return (
    name === 'QuotaExceededError' ||
    name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    code === 22 ||
    code === 1014
  );
}

function describeError(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const name = (error as { name?: unknown }).name;
    const message = (error as { message?: unknown }).message;
    if (typeof name === 'string' && typeof message === 'string') return `${name}: ${message}`;
    if (typeof message === 'string') return message;
  }
  return String(error);
}
