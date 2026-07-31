charlie

# krebs, V4: Persistence, Version 1 and the Migration Harness
# Work on one stage at a time. Do NOT combine stages.

---

## Context

Read `NOW.md` first, then `docs/SAVE_SCHEMA.md` in full. It is the most completely specified document in the project and V4 implements it rather than deciding it. Then read `docs/SIMULATION.md` Part 5, because determinism across reload is the property this whole log exists to protect.

V1 built the kernel, V2 built act 1, V3 built the interface. **The slice is playable and every second of it evaporates on refresh.** `src/sim/prng.ts` already exposes its internal state as a plain writable field, with a header saying it does so because `docs/SAVE_SCHEMA.md` Part 3 requires it and that saves are not in that log. `src/sim/loop.ts` already exports `elapsedMs(state)` and calls it "the boundary conversion, and the only one. Saves persist this, not tick counts." `src/sim/hash.ts` already produces a canonical state hash. Three logs have been leaving the door open for this one.

This log builds save, load, storage, corruption handling, export and import, and the migration harness with its fixture discipline. It does **not** build offline progress. Offline progress is V5 and it is a genuinely hard algorithm with its own validation requirement in `docs/SIMULATION.md` Part 3. V4 computes the offline delta at load, caps it, stores it and credits nothing, which is the seam that lets V5 start from a real number instead of from zero.

Also not built: cloud sync, accounts, any network call, compression and anything under `enzymes` or `environment` beyond the values that are honestly true of act 1.

**A save is not the state, it is a claim about the state that a later build has to honour.** Every decision below follows from that.

## Decisions

- **Version 1 ships with no migration to write and that is exactly why the harness gets built now.** Hard rule 7 forbids bumping the schema version without a migration and a fixture test from the previous version. At version 1 there is no previous version, so the harness has nothing to do, and the first time it does have something to do it will be running on a stranger's machine against a save that cannot be recreated. Build it and prove it while nothing is at stake.
- **The most valuable artifact in this log is a committed version 1 fixture.** Hard rule 7 makes a real predecessor save a precondition for every future schema change, and a version 1 fixture can only be captured while version 1 is what the code produces. Miss the window and whoever writes version 2 is fabricating the thing they are supposed to be migrating.
- **Hard rule 7 becomes mechanism, not discipline.** A test asserts that for every version from 1 to the current one there is a committed fixture, and that for every step between them there is a migration. Bumping the version without both then fails the suite rather than failing review. Same posture as V1's ESLint determinism guard and V3's `Needs source` release gate.
- **Every field in `docs/SAVE_SCHEMA.md` Part 2 is written, and none of them is a placeholder.** Act 1 makes all of them honestly true: no enzymes exist, the world is anaerobic so `oxygenLevel` really is zero, no transition has been taken, no shuttle has been chosen. A field written with a number nobody believes is worse than an absent field, and Part 1 already says a missing field that new code can default is not a breaking change. Nothing is written that is not true.
- **No fact is stored twice.** `progression.unlocked` is the source of truth for what the player has bought and the reaction `enabled` flags are derived from it at load, never persisted alongside it. Two copies of one fact is a migration hazard and it is the specific way save formats rot.
- **`src/save/` is content-blind and nothing in `src/sim/` or `src/content/` depends on it.** The arrow points the same way it has since V2: `src/save/` may import the kernel and the schema, act 1's mapping lives in `src/content/act1/save.ts`, and the kernel imports neither. Timestamps live in `src/save/` because `Date` is banned by ESLint in the other two directories and that carve-out is correct rather than inconvenient.
- **The meter has to persist or V3's unlocks break.** V3 gates unlocks on cumulative ATP from `src/content/act1/meter.ts`, so a meter that resets on reload either re-locks something the player bought or lets them buy it twice. `stats.totalAtpProduced` and `stats.glucoseConsumed` are the schema's names for two of the meter's seven fields and those names are permanent, so the mapping is explicit and asymmetric rather than a spread. The other five are additive.
- **Autosave writes on a timer and on `visibilitychange`, not on `beforeunload`.** `beforeunload` is unreliable in every modern browser and a save system whose durability depends on it is a save system that loses the last session. The write path is verify-then-swap per Part 1, so it has to be cheap enough to run often.
- **localStorage can be absent or full, and neither may crash the game.** Private browsing, disabled storage and `QuotaExceededError` all fall back to an in-memory store with a visible and honest warning that progress will not survive the tab. `docs/PILLARS.md` rule 7 gives no fallback to a backend, so there is nowhere else to go and the player should be told rather than discovering it.
- **`docs/SAVE_SCHEMA.md` gets edited in the final stage, additively and without a version bump.** Part 2 is explicitly illustrative, and the additive fields this log ships should be recorded there or the contract drifts from the code within one release. Part 1's policy is not touched and the version stays 1. Stage 6 states plainly that this is documentation catching up with an additive change rather than a schema change, so hard rule 7 is not in play.
- **`docs/ECONOMY.md` is still not written by this log.** V3 stage 7 made the recommendation. V4 adds an autosave interval to the pile of provisional numbers and it goes in `src/save/tuning.ts` with the same header treatment as the other two tuning files.
- Large system, tightly specified: six stages.

## The version 1 save, field by field

Settled here so the stages map rather than invent. Left column is the schema field, right column is where the value comes from.

```
  schemaVersion                          1, literal

  meta.createdAt                         epoch ms at new game, never rewritten
  meta.lastSavedAt                       epoch ms at every write
  meta.buildId                           import.meta.env, diagnostic only, never branched on

  time.elapsedGameMs                     elapsedMs(state), src/sim/loop.ts
  time.offlineCreditedMs                 0, nothing credits it until V5
  time.pendingOfflineMs                  state.diagnostics.pendingOfflineMs      ADDITIVE

  rng.algorithm                          state.prng.algorithm
  rng.seed                               state.prng.seed
  rng.state                              state.prng.state

  progression.act                        1
  progression.unlocked                   V3's unlock shelf, insertion ordered
  progression.transitionTaken            false, endosymbiosis is act 3
  progression.shuttleChoice              null, act 3

  pools                                  PoolRegistry, all ten act 1 ids

  enzymes                                {}, no enzyme objects until the decomposition
  environment.oxygenLevel                0, and act 1 really is anaerobic
  environment.scheduleIndex              0, the act 2 oxygen schedule

  stats.totalAtpProduced                 meter.atpProduced        NAME MISMATCH, map it
  stats.glucoseConsumed                  meter.glucoseConsumed
  stats.eventsProcessed                  0, offline events, V5
  stats.atpSpent                         meter.atpSpent                          ADDITIVE
  stats.atpMaintained                    meter.atpMaintained                     ADDITIVE
  stats.glucoseTakenUp                   meter.glucoseTakenUp                    ADDITIVE
  stats.lactateProduced                  meter.lactateProduced                   ADDITIVE
  stats.nadhProduced                     meter.nadhProduced                      ADDITIVE

  diagnostics.offlineFallbackCount       0, V5
  diagnostics.negativePoolScalingEvents  from state.diagnostics.shortfallTicks
  diagnostics.scalingCapHits             state.diagnostics.scalingCapHits        ADDITIVE

  settings                               UI only, never affects simulation
```

`tickCount` is deliberately absent and that is the single most important rule in `docs/SAVE_SCHEMA.md`. It is reconstructed at load as `elapsedGameMs / TICK_MS`.

## The tick alignment problem, named here so no stage finds it late

Storing milliseconds decouples the save from `TICK_RATE_HZ`, which is what hard rule 6 depends on: the rate stays movable during development and is frozen at launch. It decouples the duration. **It does not decouple the tick alignment.**

`elapsedGameMs` is always a whole multiple of the `TICK_MS` that produced it. Reconstructing `tickCount` by dividing is exact while the rate is unchanged. Change `TICK_MS` from 50 to 40 during development and a save written at 60050 ms reconstructs to 1501.25 ticks, which is not a tick count.

This is not a bug in the rule, it is the cost the rule was chosen to pay: game time survives the rate change and tick alignment does not. Stage 1 makes it explicit. Load floors to the whole tick and discards the sub-tick remainder, at most one tick of game time, and a save whose `elapsedGameMs` is not a whole multiple of the current `TICK_MS` is not corrupt and must not be rejected as corrupt. Stage 2's corruption handling has to know the difference.

---

# Stage 1 — The schema, the codec and the act 1 mapping

```
Pure functions over plain objects. No storage, no timers, no UI, no browser.
This stage should be entirely testable in node.

1. src/save/schema.ts. The version 1 shape as TypeScript types, matching
   docs/SAVE_SCHEMA.md Part 2 field for field plus the additive fields in this
   log's table. Export SCHEMA_VERSION as 1, typed as the literal 1 rather than
   number, in the same spirit as src/sim/constants.ts.

   Every type is readonly. A save object that code can mutate after validation
   is a save object that can be mutated between validation and use.

2. src/save/codec.ts. serialize and deserialize, both pure, neither touching
   storage or the clock. deserialize takes unknown and returns a discriminated
   result rather than throwing: ok, corrupt with a reason or future with the
   version it found. Callers must not be able to ignore the difference, which
   an exception makes easy and a result type makes hard.

   Validate structurally rather than trusting the parse. A JSON blob with the
   right shape and a string where a number belongs is the realistic corruption,
   not a truncated file.

3. src/content/act1/save.ts. The act 1 mapping, both directions.

   captureAct1(state, meter, unlocked, settings) -> SaveV1
   restoreAct1(save) -> { state, meter, unlocked, settings }

   Rules the mapping obeys, all of which this log's table already fixes:
     - Pool amounts by id, never by index. Indices are an implementation
       detail and ids are the contract.
     - The meter mapping is explicit and asymmetric. atpProduced becomes
       totalAtpProduced because that is the schema's permanent name.
     - Reaction enabled flags are DERIVED from progression.unlocked on
       restore and never written. One fact, one field.
     - Unknown pool ids in a save are a corruption, not a shrug. A save
       carrying a pool this build does not know about came from somewhere and
       the loader should say so.
     - Missing pool ids default to the ACT1_INITIAL value and are reported,
       because Part 1 says a defaultable missing field is not a breaking
       change and this is that case.

4. tickCount reconstruction, and read this log's tick alignment section first.
   Reconstruct as Math.floor(elapsedGameMs / TICK_MS). A remainder is NOT
   corruption, it is a development-time tick rate change, and it costs at most
   one tick of game time. Return it in the restore result so stage 2 can tell
   the two cases apart and stage 5 can report it. Comment the reasoning, since
   the obvious reading of a non-integer tick count is that something is wrong.

5. src/save/__tests__/codec.test.ts. Round trip first, per docs/SAVE_SCHEMA.md
   Part 5: capture, serialize, deserialize, restore and assert deep equality
   on every field. Then capture from the restored state again and assert the
   two serialized strings are byte-identical. Deep equality can pass while a
   float has been reformatted, and a save that is not byte-stable is a save
   whose fixture comparisons will drift.

   Then the structural corruption cases as unit tests on deserialize alone:
   wrong types, missing required fields, a null where an object belongs.

Verify: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
Report the full serialized version 1 save for a fresh act 1 state as JSON, the
test count against V3's total and confirm nothing in src/sim/ or
src/content/act1/ other than save.ts gained an import from src/save/.
```

## Stage 1 Report

Three files of code and one of tests. Nothing here touches storage, a timer, a browser or a clock, and the whole stage runs in node.

`src/save/schema.ts` is the version 1 shape and nothing else. `SCHEMA_VERSION` is `1 as const`, so it is the literal type rather than `number` and the `schemaVersion: 1` field is a discriminant rather than a comment. Every type is readonly, including the pool, enzyme and settings records. `docs/SAVE_SCHEMA.md` Part 2 field for field plus this log's eight additive fields: `time.pendingOfflineMs`, `stats.atpSpent`, `stats.atpMaintained`, `stats.glucoseTakenUp`, `stats.lactateProduced`, `stats.nadhProduced` and `diagnostics.scalingCapHits`. `settings` is typed as a bag of scalars rather than an empty interface, so adding one later is additive rather than a shape change. It is empty at version 1 because V3 shipped no persisted setting: reduced motion is read from the OS media query, not stored.

`src/save/codec.ts` is `serialize`, `serializeReadable` and `deserialize`. Serialisation REBUILDS the object in a fixed field order rather than stringifying what it is handed, so byte stability is a property of the function rather than of every caller that ever constructs a save. `deserialize` takes a string or an already-parsed value and returns `ok | corrupt(reason) | future(version)`. The version is read first, before any other field is looked at, exactly as Part 1 requires: a `{schemaVersion: 99, whatever: true}` blob comes back `future` rather than as a wall of validation errors about fields it never had. Every field is checked structurally, and a validated save is REBUILT through the same canonical constructor rather than cast, so a hostile file's extra keys are dropped instead of being handed back attached to a `SaveV1` reference. Failure reasons name the path, `pools.nad must be a finite number, got a string`, because a reason a player can paste into a bug report is worth more than a boolean.

`src/content/act1/save.ts` is the mapping and the only file in `src/content/` that imports `src/save/`. It also mints the act 1 unlock ids, which did not previously exist: V3 tracked what had been bought as a boolean and an integer on the runtime snapshot, and a save needs names. `ferment` for lactate dehydrogenase, `uptake-capacity-N` for each rung of the capacity ladder, numbered by index into `UPTAKE_VMAX_STEPS`. Both are contract surface now.

**Two deviations from the spec's literal signatures, both forced and both reported rather than smoothed over.**

`captureAct1` takes a fifth argument, a context carrying `meta` and the counters that cannot be read back off the simulation. `meta` has to be passed because `Date` is banned in `src/content/**` by the ESLint determinism guard, which is this log's own stated reason for timestamps living in `src/save/`. The carried counters are subtler. `diagnostics.negativePoolScalingEvents` maps from `state.diagnostics.shortfallTicks`, which is a per-pool `Int32Array`, and the schema stores one number, so the mapping is a sum and a sum cannot be inverted. Restoring the total into any single pool's slot would be a lie in the data, so a restored session starts its per-pool counters at zero and adds its own work to the carried total. `offlineCreditedMs`, `eventsProcessed` and `offlineFallbackCount` ride along for the same reason at one remove: they belong to V5, they are zero in every save this build writes, and a field that silently resets on reload is worse than one honestly absent. `scalingCapHits` is deliberately not carried, because it is a plain scalar on `state.diagnostics` and restores onto the state exactly. The asymmetry between the two diagnostics is real and it is that one of them is a scalar in both places and one is not.

`restoreAct1` returns a result union rather than the bare object, for the reason the spec itself gives for `deserialize`. An unknown pool id is a corruption and a caller must not be able to ignore it. `restoreAct1OrThrow` exists for tests and the fixture harness, which have already established the save is valid.

The mapping obeys all five rules. Pool amounts are written by id and read by id. The meter mapping is explicit and asymmetric, `atpProduced` to `totalAtpProduced`, and a test asserts `'atpProduced' in save.stats` is false so the mismatch cannot be quietly "fixed". Reaction `enabled` flags are derived from `progression.unlocked` and never written, asserted by capturing a state with `ferment` running under an empty unlock list and confirming the restore turns it off, plus `JSON.stringify(save)` not containing the string `enabled` at all. Unknown pool ids are a corruption. Missing pool ids default to `ACT1_INITIAL` and are reported in `missingPools`.

Unknown UNLOCK ids are treated differently from unknown pool ids and deliberately: they are preserved, reported in `unlocks.unknown`, and round-trip byte-identically. Part 1 says an additive change new code can default is not breaking, and an unlock this build has not heard of is that case seen from the other side. Loading an unfamiliar save and saving it again must not quietly delete something.

Tick reconstruction floors, and the discarded remainder is returned as `discardedMs` rather than swallowed. A save whose `elapsedGameMs` is not a whole multiple of the current `TICK_MS` deserialises `ok`, restores, and reports the remainder. That is asserted directly, because stage 2's corruption handling has to be able to tell it apart from a real fault and the obvious reading of a non-integer tick count is that something is wrong. The reasoning is written at the top of the file rather than at the line.

**The full serialized version 1 save for a fresh act 1 state**, 762 bytes compact:

```json
{
  "schemaVersion": 1,
  "meta": { "createdAt": 1785000000000, "lastSavedAt": 1785000600000, "buildId": "test" },
  "time": { "elapsedGameMs": 0, "offlineCreditedMs": 0, "pendingOfflineMs": 0 },
  "rng": { "algorithm": "mulberry32", "seed": 20260729, "state": 20260729 },
  "progression": { "act": 1, "unlocked": [], "transitionTaken": false, "shuttleChoice": null },
  "pools": {
    "glucose_env": 80000,
    "glucose": 0,
    "g3p": 0,
    "pyruvate": 0,
    "lactate": 0,
    "nad": 30,
    "nadh": 0,
    "atp": 20,
    "adp": 20,
    "pi": 40
  },
  "enzymes": {},
  "environment": { "oxygenLevel": 0, "scheduleIndex": 0 },
  "stats": {
    "totalAtpProduced": 0,
    "glucoseConsumed": 0,
    "eventsProcessed": 0,
    "atpSpent": 0,
    "atpMaintained": 0,
    "glucoseTakenUp": 0,
    "lactateProduced": 0,
    "nadhProduced": 0
  },
  "diagnostics": { "offlineFallbackCount": 0, "negativePoolScalingEvents": 0, "scalingCapHits": 0 },
  "settings": {}
}
```

`meta` is the fixed test meta rather than a real clock reading, because stage 1 reads no clock. Every other value is what a fresh act 1 state actually holds: the 80000 environmental glucose V3 stage 6 sized, the nicotinamide pool fully oxidised at 30, the closed adenylate pair at 20 and 20. `enzymes` is empty and `oxygenLevel` is zero because both are true of act 1, not because they are placeholders.

**Verify.** `npm run typecheck` clean. `npm run lint` clean, after one fix: `SCHEMA_VERSION: 1 = 1` tripped `@typescript-eslint/prefer-as-const` and is now `1 as const`, which is the same literal type. `npm run build` clean, bundle unchanged at 229.44 kB, 72.36 kB gzipped, since nothing in this stage is imported by the app yet. `npm test` 189 passed across 19 files, up from V3's 160 across 18. The 29 new tests are all in `src/save/__tests__/codec.test.ts`.

**Import direction.** `grep` across `src/` for imports of `src/save/` returns exactly two files: `src/content/act1/save.ts`, which is the sanctioned one, and the test. Nothing in `src/sim/` imports `src/save/` and nothing in `src/content/act1/` other than `save.ts` does. The arrow points the same way it has since V2.

---

# Stage 2 — Storage, corruption handling and forward compatibility

```
docs/SAVE_SCHEMA.md Part 1 and Part 4. The rules here are written to prevent
one specific outcome, which Part 1 names as the worst possible one: losing
progress silently in a game with a 6 to 10 hour arc.

1. src/save/storage.ts. localStorage behind an interface, injected rather than
   reached for, so the tests drive a fake and never touch a browser global.

   Keys under a stable prefix. One active slot, one backup slot, one temporary
   key. The prefix is contract surface once a build ships, so choose it once
   and write down that it is permanent.

2. The write path, exactly as Part 1 specifies and in this order: write to the
   temporary key, read it back, parse it, verify it matches, promote the
   current active save to backup, then swap the temporary into active. Never
   overwrite a known-good save with an unverified write.

   The failure mode to get right is a crash between steps. Enumerate the
   states the storage can be left in if the process dies at each step and
   assert that every one of them still loads something valid. Report the
   enumeration.

3. The load path:
     - Parse the active slot. If ok, done.
     - If corrupt, do not overwrite it. Try the backup and offer recovery
       rather than silently starting a new game. The corrupt primary is
       evidence and it stays on disk.
     - If schemaVersion exceeds SCHEMA_VERSION, this is a save from a newer
       build. Do not load it, do not guess, do not migrate downward and
       preserve the file untouched. This is a distinct outcome from corruption
       and the player-facing message is different.
     - If no save exists at all, that is a new game and not an error.

4. Storage that is not there. Private browsing, disabled storage and
   QuotaExceededError all fall back to an in-memory store. The game keeps
   running and the player is told plainly that progress will not survive the
   tab. docs/PILLARS.md rule 7 means there is no backend to fall back to, so
   an honest warning is the entire mitigation and it must not be a silent one.

   QuotaExceededError specifically must not destroy the existing save. The
   temporary key write is what fails and the active slot is untouched, which
   is a property of the ordering in step 2 rather than an accident. Test it.

5. src/save/__tests__/storage.test.ts. Every case in docs/SAVE_SCHEMA.md Part 5
   that belongs to this stage: truncated JSON, malformed JSON, a future
   schemaVersion, backup recovery from a corrupted primary, a quota failure
   mid-write and storage absent entirely. Each asserts both the outcome and
   that no existing good data was destroyed.

   Include the tick alignment case from this log's named section, asserting a
   remainder loads successfully and is NOT classified as corruption.

Verify: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
Report the crash-state enumeration from step 2 as a table with the outcome for
each, the storage key names with a statement that they are now permanent and
the test count.
```

## Stage 2 Report

`src/save/storage.ts` and `src/save/__tests__/storage.test.ts`. localStorage sits behind a three-method `KeyValueStore` interface and is injected, so every test in the file drives a plain map and none of them touches a browser global. That is what makes the crash-state enumeration expressible at all: a store that dies after its second write is a four-line object here and is not something you can ask a real browser for.

The store reads no clock. `write` takes a save whose `meta.lastSavedAt` the caller has already set, which keeps wall-clock time at the boundary where docs/SIMULATION.md Part 5 puts it and leaves stage 5 to wire it. It also carries no prose: it reports `durable` and a `NonDurableReason` of `unavailable` or `quota`, and the words a player reads stay in `src/ui/content.ts` with every other player-facing string, which is where V3 put them and where the badge contract can see them.

**The storage keys, and they are permanent from here.**

```
  krebs.save.active     the save
  krebs.save.backup     the previous save, one slot
  krebs.save.temp       written first, verified, swapped in, never loaded from
```

`STORAGE_PREFIX` is `krebs.save.` and it is contract surface exactly as pool ids and unlock ids are: a player's progress is addressed by that string and renaming it orphans every save in existence with no error and no way back. **The prefix is the repository name and deliberately not the game's title**, which docs/BRIEF.md line 4 still records as TBD. A prefix derived from a title nobody has chosen would either change when the title lands, which orphans saves, or survive as a stale name forever. A prefix that was never claiming to be the title cannot go stale.

**The write path** runs Part 1's order exactly: write to temp, read it back, byte-compare and parse it, promote the current active into backup, swap temp into active, drop temp. The byte-compare catches a store that silently truncates and the parse catches one that does not. The active slot is not touched until step 5, which is after the new bytes have proved they survive a round trip through storage.

**The crash-state enumeration.** The write path is recorded as an ordered list of mutations and every prefix of that list is replayed onto a fresh store and loaded from. Writing over an existing save produces four mutations, asserted as such so the table cannot silently gain a step:

| Died after | Storage holds | `load()` returns | Lost |
| --- | --- | --- | --- |
| 0 of 4, before anything | active = previous | `loaded`, previous save, 10000 ms | the write in flight |
| 1 of 4, `set temp` | active = previous, temp = new | `loaded`, previous save, 10000 ms | the write in flight |
| 2 of 4, `set backup` | active = previous, backup = previous, temp = new | `loaded`, previous save, 10000 ms | the write in flight |
| 3 of 4, `set active` | active = new, backup = previous, temp = new | `loaded`, new save, 30000 ms | nothing |
| 4 of 4, `remove temp` | active = new, backup = previous | `loaded`, new save, 30000 ms | nothing |

Every reachable state loads a valid save and there is no window in which neither the old nor the new one comes back. The worst case is the write that was in flight, which is the interval since the last autosave. A stale temp key survives two of the five states and nothing ever loads from it; the next clean write overwrites it and then removes it, which is asserted rather than assumed.

The first write of a fresh game is enumerated too. It is three mutations rather than four, because there is nothing to promote: crashing before the active swap leaves `new-game`, which is exactly what it was.

**One thing the spec did not name and the enumeration made obvious.** Step 4 promotes the active slot into the backup slot. If the active slot is corrupt, that promotion overwrites a good backup with garbage on the first autosave after the corruption is noticed, which destroys the only recoverable copy while the recovery offer is still on screen. The store therefore tracks whether the active slot is known to parse, set on a successful write, set on a successful load, cleared when a load finds it bad, and starting false. A corrupt primary is never promoted. Re-parsing the active slot on every write would be the other way to do it and it doubles the parse cost of something that runs on a timer. There is a test whose entire name is `never promotes a corrupt primary into the backup slot`.

**The load path** has five outcomes and they are not interchangeable. `loaded` is the ordinary case. `future` is a save from a newer build: not loaded, not guessed at, not migrated downward, and specifically not silently replaced by an older backup, which would be a silent downgrade. `new-game` is nothing stored, which is not an error. `unreadable` is both slots failing, and both stay on disk byte for byte. `recoverable` is a corrupt primary with a good backup and it is an **offer rather than an action**: the save comes back attached to the outcome, nothing has moved, and the caller asks. Part 1 says offer recovery rather than silently starting a new game, and offering means the player decides.

`acceptRecovery` promotes the backup into active and moves the corrupt primary into the backup slot rather than deleting it. That looks backwards and is not: it is the only copy of the evidence, the backup has just vacated that slot, and the alternative is throwing away the one artifact that would let anyone diagnose it.

**Storage that is not there.** `probeLocalStorage` wraps the access itself, not just the write, because private browsing and disabled-storage settings throw on reading the global, and it does a probe write and delete because Safari's private mode presents an object whose every write throws. Absent storage, disabled storage and `QuotaExceededError` all fall back to an in-memory store, and the contents of the three keys are **copied into it** rather than abandoned, so a quota failure mid-session does not make the running game believe there is no save. `quotaLike` checks four spellings, `QuotaExceededError`, `NS_ERROR_DOM_QUOTA_REACHED`, code 22 and code 1014, because getting it wrong means telling the player storage is missing when the disk is full, which is a different sentence.

The quota case is tested against a store whose every `setItem` throws, and the assertion is on the raw map: `krebs.save.active` still holds the previous save byte for byte, and no temp key was left behind. That is a property of the write ORDER rather than an accident, and it is the reason the read-back cannot be skipped for speed.

**Verify.** `npm run typecheck` clean, `npm run lint` clean, `npm run build` clean with the bundle unchanged at 229.44 kB, 72.36 kB gzipped, since nothing in this stage is imported by the app yet. `npm test` 212 passed across 20 files, up from stage 1's 189 across 19. The 23 new tests are all in `src/save/__tests__/storage.test.ts`.

Every Part 5 case that belongs to this stage is covered and each one asserts twice, once on the outcome and once on the raw storage map: truncated JSON, malformed JSON, a structurally wrong save whose reason names `pools.nad`, a future `schemaVersion`, backup recovery from a corrupted primary, a quota failure mid-write, and storage absent entirely. The tick alignment case from this log's named section is in there too, and it loads `ok`: a save whose `elapsedGameMs` is 17 ms off a whole tick is a development-time rate change and is not corruption.

---

# Stage 3 — The migration harness, the fixture discipline and hard rule 7 as mechanism

```
The stage with nothing to migrate, and the reason it is built now rather than
later is in this log's Decisions. Read them before starting.

1. src/save/migrations.ts. An ordered array of pure functions, each taking a
   save at version N and returning one at version N+1, per docs/SAVE_SCHEMA.md
   Part 1. At version 1 the array is empty and the runner is a no-op.

   The runner takes a save and a target version, applies every migration in
   sequence and fails loudly on a gap. Migrations are pure, total and never
   edited after release: put all three in a header comment with Part 1's
   reasoning, because the third one is the one a future maintainer will want
   to break and the reason it exists is that players may have already run it.

2. Prove the runner works without inventing a version 0 that never shipped.

   Test the chain-runner itself against fabricated migrations in the test file,
   1 to 2 to 3 as pure test doubles, asserting order, composition, that a gap
   in the chain fails, that a save already at target passes through untouched
   and that the input object is not mutated. The runner is what has to be
   correct and it can be proven correct today.

   Do NOT commit a synthetic version 0 fixture. Part 1 says the fixture set is
   the regression suite for the entire save history, and a fabricated
   predecessor pollutes exactly the thing whose value is being real.

3. Commit the version 1 fixture. src/save/__tests__/fixtures/v1.json, generated
   from a real act 1 run rather than hand-written, with enough state in it to
   be worth migrating: some pools moved off their initial values, a non-zero
   meter, at least one unlock bought, a PRNG state that is not the seed and a
   non-zero elapsed time.

   A README beside it stating that fixtures are never deleted, never edited
   and never regenerated, and that this one exists because hard rule 7 makes a
   real predecessor a precondition for schema version 2. Record how it was
   generated so version 2's fixture can be generated the same way.

4. Hard rule 7 as mechanism. A test that reads SCHEMA_VERSION and asserts:
     - a committed fixture exists for every version from 1 to SCHEMA_VERSION
     - a migration exists for every step between consecutive versions
     - every fixture loads through the chain to the current version and
       produces a state that passes the same validation a fresh save does
   Bumping the version without both then fails the suite rather than failing
   review. This is the V1 ESLint guard and the V3 release gate trick applied to
   the one hard rule that has no other enforcement.

   Prove it fires the way those two were proved. Bump SCHEMA_VERSION to 2 in a
   scratch edit, run the suite, quote the failure verbatim, revert it, confirm
   the suite is clean again.

Verify: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
Report the committed fixture in full, the gate output from step 4 verbatim and
a plain statement of what a future version 2 will have to do to satisfy hard
rule 7 mechanically.
```

## Stage 3 Report

`src/save/migrations.ts`, `src/save/fixture.ts`, the committed fixture and its README, and two test files. The chain is empty and the runner is proven.

`MIGRATIONS` is an ordered array of `{ from, to, migrate }`, each step advancing exactly one version so every step is testable alone. The header carries all three of Part 1's requirements with the reasoning attached, and the third one gets the most space because it is the one a future maintainer will want to break: a released migration that was wrong has already produced wrong data on real machines, and editing it only changes what happens to the players who have not loaded yet, which splits the population into two incompatible groups with no field in the save saying which one anybody is in. The fix for a wrong migration is a new migration.

`runMigrations(save, from, target, chain)` applies each step in sequence, returns `ok` with a count, `gap` when a step is missing, and `future` when asked to migrate downward. A save already at the target comes back as the same reference, because the honest statement about a no-op is that nothing happened rather than that a copy was made.

**The chain is wired into the real load path rather than parked beside it.** `parseAndMigrate` is parse, read the version, migrate, validate, and `src/save/storage.ts` now calls it instead of `deserialize` in all four load-side places. At version 1 the migration step is a no-op and the behaviour is identical, which is exactly the point: the day the chain has work to do it is already wired and already tested rather than being added under pressure alongside the first real migration. `codec.ts` grew two small exports, `parseSave` and `readSchemaVersion`, so the chain can read a version off a save it cannot yet validate. A version 3 save does not have the version 5 shape and validating it against one would report a schema history as a corruption.

**The runner is proven against fabricated migrations**, a three-link 1 to 2 to 3 chain that exists only inside `migrations.test.ts`. Twelve tests: order and composition, asserted on a trail each double appends to rather than on the version number alone, because a runner that ran 2-to-3 first would still arrive at version 3 having run the wrong transform on the wrong shape. Stopping at a target short of the chain's end. Pass-through by identity. A gap failing loudly. A chain whose step jumps two versions being rejected as a gap. Non-mutation of the input. And a refusal to migrate downward.

**No synthetic version 0 fixture is committed, deliberately.** Part 1 says the fixture set is the regression suite for the entire save history, and a fabricated predecessor pollutes exactly the thing whose value is being real. A fabricated migration inside a test file pollutes nothing, because nothing outside that file can see it. The distinction is the whole of step 2.

**The committed version 1 fixture**, `src/save/__tests__/fixtures/v1.json`, 1377 bytes, generated by `npm run save:fixture -- --write` from a real act 1 run:

```json
{
  "schemaVersion": 1,
  "meta": { "createdAt": 1785585600000, "lastSavedAt": 1785586200000, "buildId": "v4-fixture" },
  "time": { "elapsedGameMs": 240000, "offlineCreditedMs": 0, "pendingOfflineMs": 0 },
  "rng": { "algorithm": "mulberry32", "seed": 20260729, "state": 4251286828 },
  "progression": {
    "act": 1,
    "unlocked": ["ferment", "uptake-capacity-1"],
    "transitionTaken": false,
    "shuttleChoice": null
  },
  "pools": {
    "glucose_env": 77853.5982197197,
    "glucose": 95.97458505882689,
    "g3p": 13.68292215324192,
    "pyruvate": 13.68292215230058,
    "lactate": 4073.488546138107,
    "nad": 16.31707784769942,
    "nadh": 13.68292215230058,
    "atp": 16.608971573994832,
    "adp": 23.391028426005143,
    "pi": 29.708106272762876
  },
  "enzymes": {},
  "environment": { "oxygenLevel": 0, "scheduleIndex": 0 },
  "stats": {
    "totalAtpProduced": 8174.342936580805,
    "glucoseConsumed": 2050.427195221823,
    "eventsProcessed": 0,
    "atpSpent": 4100.854390443646,
    "atpMaintained": 4076.879574563168,
    "glucoseTakenUp": 2146.4017802806497,
    "lactateProduced": 4073.488546138107,
    "nadhProduced": 4087.1714682904026
  },
  "diagnostics": { "offlineFallbackCount": 0, "negativePoolScalingEvents": 0, "scalingCapHits": 0 },
  "settings": {}
}
```

Four game-minutes: 1200 ticks into the NAD+ wall with `ferment` disabled, `ferment` enabled and 1200 more, uptake Vmax raised from 8 to 10 and 2400 more. It has pools off their initial values, a non-zero meter, two unlocks in the order a player buys them, a PRNG state that is not the seed, and 240000 ms of elapsed time. Timestamps are fixed constants rather than clock readings, so the artifact is a function of the procedure alone and does not differ per machine, which is what makes stage 1's byte-stability property observable in the one file where it matters most.

**One thing about the fixture is not what act 1 does by itself, and it is disclosed rather than hidden.** Act 1 consumes no random numbers. `src/sim/tick.ts` never touches the PRNG, confirmed by grep, so a real act 1 run of any length finishes with `rng.state` exactly equal to `rng.seed`. A fixture like that cannot exercise the field docs/SAVE_SCHEMA.md Part 5 calls the one most likely to be dropped, because a loader that rebuilt the generator from the seed alone would produce an identical result. The generator therefore draws seven values from the stream after the run, standing in for a later act that uses it. Everything else in the file came out of the simulation. This is written into the generator header, the fixture README and a test whose name is `has a PRNG state that is not the seed, which is the point of it`. **It also matters for stage 4**, whose mutilation test would pass vacuously against any real act 1 state.

The generator is committed so the procedure is reproducible even though the artifact is not to be reproduced. It refuses to write without `--write` and prints a reminder that fixtures are never regenerated.

**Hard rule 7 as mechanism**, `src/save/__tests__/schemaVersionGate.test.ts`. It reads `SCHEMA_VERSION` and asserts a committed fixture for every version from 1 to it, a migration for every step between consecutive versions, every fixture loading through the chain to the current version, and every fixture restoring into a running act 1 that re-captures and re-validates through the same door a fresh save goes through. Two extra guards: no migration may run past `SCHEMA_VERSION`, and no fixture may exist for a version that has not shipped, which is the fabricated-predecessor case caught from the other side. Of the seven hard rules this was the only one with no other enforcement: 4 and 5 are the ESLint guard, 1 is V3's `Needs source` release gate, 6 is a constant nobody can move quietly. 7 was a sentence review had to remember.

**Proving it fires.** `SCHEMA_VERSION` bumped to 2 as a scratch edit, verbatim:

```
 ❯ src/save/__tests__/schemaVersionGate.test.ts (9 tests | 7 failed)
   × hard rule 7, mechanically > has a committed fixture for every version from 1 to the current one
     → CLAUDE.md hard rule 7: no committed fixture for schema version 2.
Expected src/save/__tests__/fixtures/v2.json.
A fixture at version N can only be captured while version N is what the code produces.
If you have just bumped SCHEMA_VERSION, the fixture for the PREVIOUS version had to be
committed before the bump. See src/save/__tests__/fixtures/README.md.: expected false to be true
   × hard rule 7, mechanically > has a migration for every step between consecutive versions
     → CLAUDE.md hard rule 7: no migration from schema version 1 to 2.
Add one to MIGRATIONS in src/save/migrations.ts. It must be pure, total, and
never edited after release.: expected false to be true
   ✓ hard rule 7, mechanically > has no migration for a step that does not exist
   × hard rule 7, mechanically > loads every fixture through the chain to the current version
     → The version 1 fixture does not load through the migration chain.
no migration from schema version 1 toward 2
The fixture is the evidence and the code is the suspect. Do not regenerate it.: expected 'corrupt' to be 'ok'
```

The first run of that probe exposed a defect in the gate itself and it is worth recording. The version-1-specific describe read the fixture at module scope, so the throw aborted the whole file before any of the messages above were printed, and the only thing a person who had just bumped the version would have seen was `Error: the version 1 fixture does not load`. A gate has to report the rule, not the first symptom of breaking it. The read moved inside each test. Reverted, and the suite is clean again.

**What a future version 2 has to do to satisfy hard rule 7 mechanically.** Three things, in this order, and the first one is the one with a deadline.

1. **Before the bump**, confirm `src/save/__tests__/fixtures/v1.json` is committed and untouched. It already is. This is the step that cannot be done afterwards.
2. Add a `{ from: 1, to: 2, migrate }` entry to `MIGRATIONS` in `src/save/migrations.ts`. Pure, total, and never edited once released.
3. Generate `v2.json` from a version 2 build, the same way `v1.json` was generated, and commit it beside the version 1 one. `src/save/fixture.ts` is the recorded procedure.

Then `SCHEMA_VERSION` moves to 2 and the gate goes green. Nothing else is required and nothing less will do, because the gate checks all three.

**Verify.** `npm run typecheck` clean, `npm run lint` clean, `npm run build` clean with the bundle unchanged at 229.44 kB, 72.36 kB gzipped. `npm test` 233 passed across 22 files, up from stage 2's 212 across 20. The 21 new tests are 12 in `migrations.test.ts` and 9 in `schemaVersionGate.test.ts`.

---

# Stage 4 — Determinism across reload

```
docs/SAVE_SCHEMA.md Part 5 lists five required tests and closes by saying the
last one is the one that catches missing RNG state and the one most likely to
be skipped. This stage is that test, and the project is unusually well placed
to write the strong version of it because src/sim/hash.ts already exists.

1. src/save/__tests__/reloadDeterminism.test.ts.

   Run act 1 for N ticks uninterrupted and hash the result. Separately, run it
   for N/2 ticks, capture, serialize, deserialize, restore into a fresh
   simulation, run the remaining N/2, and hash that. Assert the two hashes are
   identical strings.

   Identical hashes, not close pool values. hashState covers pool amounts in
   registry order, tickCount and the PRNG algorithm, seed and state, which is
   exactly the surface a save has to carry. A comparison on pool amounts alone
   would pass with the RNG state dropped, which is the specific failure Part 5
   warns about.

2. Prove the test can fail, because a determinism test that has never failed is
   a determinism test nobody has checked. Temporarily drop rng.state from the
   round trip so restore reconstructs from the seed alone, confirm the test
   fails, quote it, restore the field. Do the same for tickCount.

   If either mutilation still passes, that is a finding about the hash rather
   than a convenience, and it should be reported rather than worked around.

3. Repeat across a seeded sweep rather than at one split point: several seeds,
   several values of N and split points early, mid and late in the run,
   including a split during the NAD+ stall and one during fermentation
   recovery. The stall is the state where most pools are static and the RNG is
   the only thing still moving, which makes it the split most likely to hide a
   dropped field.

4. Save through a mid-tick moment. The runtime V3 built advances whole ticks
   and holds a sub-tick accumulator remainder, and that remainder is render
   state that is deliberately not saved. Assert that saving between frames
   rather than exactly on a tick boundary changes nothing about the restored
   hash, which is the property that makes the autosave timer in stage 5 safe
   to fire whenever it likes.

5. The remaining Part 5 tests that stages 1 to 3 have not already covered.
   Check them off explicitly in the report against Part 5's list of five and
   name any that are covered elsewhere with the file and test that covers them.

Verify: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
Report the sweep size and the split points, the two mutilation failures from
step 2 verbatim and the Part 5 checklist with all five accounted for. Confirm
the act 1 canonical hash is still e9b720a8 and the toy pathway hash 172f83fb.
```

## Stage 4 Report

`src/save/__tests__/reloadDeterminism.test.ts`, twelve tests. The comparison is on `hashState` strings and never on pool values, because the whole point of Part 5's last item is that a comparison on pool amounts alone passes with the RNG state dropped.

**The finding that would have made this whole file theatre, found before it was written rather than after.**

Act 1 consumes no random numbers. `src/sim/tick.ts` never touches the PRNG, confirmed by grep, so a real act 1 run of any length finishes with `prng.state` exactly equal to `prng.seed`. Every test in this file would have passed with `rng.state` deleted from the save entirely, not because the save is correct but because the field never moves. The one Part 5 calls out as most likely to be skipped would have been present, green, and worth nothing.

V1 stage 5 named the same hole from the other side, and `src/content/act1/__tests__/determinism.test.ts` already closed it with a fixed input script: every 50 ticks, roll the PRNG and SET `ferment` from the result, so the roll value reaches the pools rather than only the bookkeeping. This file reuses that shape, and where a scenario needs `ferment` held still it draws from the stream anyway and discards the value. The bare fact is asserted directly, in a test called `the guard exists because act 1 does not use the PRNG at all`, so a future reader does not have to rediscover why the script is there.

It is the same finding stage 3 recorded about the fixture and it has the same shape: the PRNG is a field act 1 cannot exercise on its own, so anything that depends on it exercising has to arrange it and say so.

**One thing about the harness is worth naming.** The script is a function of `state.tickCount` rather than of a loop counter. A restore that reconstructed the tick count wrongly then rolls on the wrong ticks as well as hashing wrongly, which is what a real game would do, and it is what makes the tickCount mutilation fail for the right reason instead of only because the hash covers the field.

**The sweep. 36 cases:** 4 seeds by 3 lengths by 3 split points.

```
  seeds   1, 7, 20260729, 4294967295
  lengths 400, 1200, 4000 ticks
  splits  10%, 50%, 90%
```

Every case runs N ticks uninterrupted and hashes, then runs to the split, captures, serializes, deserializes, restores into a fresh simulation, runs the remainder and hashes that. Identical strings in all 36. The reload goes through the real codec, not a shortcut, so the round trip under test is the one the game performs.

Two more splits beyond the grid. **During the NAD+ stall**, which is the split most likely to hide a dropped field, because the pools are static and the RNG is the only thing still moving: the test asserts the stall is real, NAD+ below 0.05 and NADH unchanged across a hundred ticks, and that `prng.state` moved over the same interval, before it asserts the hashes match. **During fermentation recovery**, at 2 ticks, 10 ticks and 100 ticks after the wall comes down, because V3 measured the payoff phase restarting after 2 ticks and a split at 1502 lands inside the recovery rather than after it.

**Saving between frames.** The runtime advances whole ticks and holds a sub-tick accumulator remainder, which is render state and is deliberately not saved. A run driven 500 whole ticks and then 30 ms into the next one, saved at that moment, restored and continued, hashes identically to an uninterrupted 1000. That is the property that makes stage 5's autosave timer safe to fire whenever it likes rather than only on a tick boundary. A second test pins the mechanism: a 49 ms remainder never reaches `elapsedGameMs`, because it is derived from the tick count rather than accumulated.

**The mutilations. Both fail, and here they are verbatim.**

Dropping `rng.state` from the round trip, so `restoreAct1` reconstructs the generator from the seed alone:

```
 ❯ src/save/__tests__/reloadDeterminism.test.ts (12 tests | 7 failed)
   ✓ reload determinism, the premise > the guard exists because act 1 does not use the PRNG at all
   × reload determinism, the sweep > matches an uninterrupted run at every seed, length and split point
     → seed 1, 400 ticks, split at 200: expected '15c7943b' to be '3fc9a722'
   × reload determinism, the sweep > survives a split during the NAD+ stall, where the RNG is the only thing moving
     → expected '6c499300' to be '63c118af'
   × reload determinism, the sweep > survives a split during fermentation recovery
     → expected '23c78dec' to be 'ffa76dcc'
   × reload determinism, saving mid-tick > is unchanged by a sub-tick accumulator remainder
     → expected '4bd1e9ec' to be '0f4c302d'
```

Dropping `tickCount`, so the restore reconstructs it as zero:

```
 ❯ src/save/__tests__/reloadDeterminism.test.ts (12 tests | 7 failed)
   × reload determinism, the sweep > matches an uninterrupted run at every seed, length and split point
     → seed 1, 400 ticks, split at 40: expected '9b657243' to be '3fc9a722'
   × reload determinism, the sweep > survives a split during the NAD+ stall, where the RNG is the only thing moving
     → expected '5c9dd378' to be '63c118af'
   × reload determinism, the sweep > survives a split during fermentation recovery
     → expected '497f2039' to be 'ffa76dcc'
   × reload determinism, saving mid-tick > is unchanged by a sub-tick accumulator remainder
     → expected 'c3e4a9d2' to be '0f4c302d'
```

Both mutilations were scratch edits to `src/content/act1/save.ts`, reverted, and the suite is clean again. Neither passed, so there is no finding about the hash to report: `hashState` covers all three of pool amounts, tick count and PRNG state, and dropping any one of them is visible.

The same three mutilations also exist as **permanent tests**, asserting divergence rather than being one-off probes, so the file would notice if the hash ever stopped covering one of these fields. A fourth is the control: an unmutilated round trip must NOT diverge, because not every omission is a defect and the sub-tick remainder is the one field deliberately not carried.

**Unlocks are not hashed state, and that gets its own two tests.** V3's `src/ui/runtime.ts` flagged it: `setReactionVmax` replaces a kinetics descriptor and `setReactionEnabled` flips a flag, and neither touches a pool, the tick count or the PRNG, so buying an upgrade does not move the canonical hash. A reload that dropped unlock state would therefore pass every determinism test in the project while silently refunding every purchase. Both are now demonstrated failing on purpose and then passing: a capacity step not re-applied at restore diverges, and the same restore with the Vmax re-applied the way the runtime does matches; a `ferment` purchase captured with an empty unlock list diverges, and captured with `['ferment']` matches. This is NOW.md's open item `Buying an unlock is not part of hashed state, and V4 has to persist it`, closed with evidence.

**The Part 5 checklist, all five accounted for.**

| Part 5 test | Where | Which test |
| --- | --- | --- |
| Round trip | `src/save/__tests__/codec.test.ts` | `restores every field of a played save and re-captures it identically`, plus byte identity |
| Migration chain | `src/save/__tests__/schemaVersionGate.test.ts` | `loads every fixture through the chain to the current version` and `produces from every fixture a state that passes the same validation a fresh save does` |
| Corruption | `src/save/__tests__/storage.test.ts` | truncated, malformed and a future `schemaVersion`, each asserting the raw slot is untouched; the structural cases are in `codec.test.ts` |
| Backup recovery | `src/save/__tests__/storage.test.ts` | `offers recovery from backup rather than silently starting a new game`, plus `never promotes a corrupt primary into the backup slot` |
| Determinism across reload | `src/save/__tests__/reloadDeterminism.test.ts` | the 36-case sweep, the stall split, the recovery split and the mid-tick save |

**The canonical hashes, and a correction to this stage's own spec.** The toy pathway hash is `172f83fb`, unchanged, in `src/sim/__tests__/determinism.test.ts`. **The act 1 canonical hash is `657594cb`, not `e9b720a8` as this stage's spec asks me to confirm.** The spec is out of date rather than the code: V3 stage 6 raised `ACT1_GLUCOSE_ENV_INITIAL` from 10000 to 80000 to move the ATP bootstrap trap beyond the horizon of act 1, starting amounts are hashed state, and the hash moved with it. NOW.md records the move in bold, `src/content/act1/__tests__/determinism.test.ts` line 120 carries the divergence entry, and nothing in V4 has touched either hash. Flagged rather than quietly reported as matching, per CLAUDE.md's working style.

**Verify.** `npm run typecheck` clean, `npm run lint` clean, `npm run build` clean with the bundle unchanged at 229.44 kB, 72.36 kB gzipped. `npm test` 245 passed across 23 files, up from stage 3's 233 across 22.

---

# Stage 5 — Autosave, the offline delta and save management

```
Where persistence becomes visible. Reuse V3's Card, Button, Figure and Badge
primitives and add no new visual vocabulary. Read DESIGN.md's screen inventory
entry for save management before starting.

1. Autosave. src/save/autosave.ts, wired into V3's runtime module rather than
   into React.

     - a timer, interval in src/save/tuning.ts as a provisional number with the
       same header treatment as the other two tuning files and a
       docs/ECONOMY.md row owed
     - visibilitychange to hidden, which is the reliable one
     - after any unlock purchase, because losing a purchase is the loss a
       player notices

   Not beforeunload as the primary mechanism. It does not fire reliably in any
   modern browser and a durability story that depends on it loses the last
   session. Wire it as a best-effort extra if you like, and say in the report
   that it is not load-bearing.

   Autosave must never block a frame. Stage 2's write path is synchronous
   localStorage plus a read-back, so measure it and report the cost in
   milliseconds. If it is a problem, that is a finding for V5 rather than a
   reason to skip the read-back, since the read-back is what Part 1 requires.

2. The offline delta at load. Compute now minus meta.lastSavedAt once, at the
   boundary, exactly as docs/SAVE_SCHEMA.md Part 3 specifies. Reject negatives
   and credit zero, because a negative means the clock moved backwards. Cap the
   positive at MAX_OFFLINE_HOURS, which is already in src/sim/constants.ts.

   Then do nothing with it except add it to time.pendingOfflineMs and show it.
   V4 does not simulate a single tick of it. This is the seam: V5 starts from a
   real accumulated number rather than from zero, and the time a player spent
   away during the V4 release is not silently thrown out.

   Show it honestly. A line saying how long they were away and that it has not
   been simulated yet. Do not imply a reward is coming and do not imply it was
   lost, because neither is true.

3. Save management, per DESIGN.md's screen inventory: export to file, import
   from file and backup recovery offered on a failed parse. Exported saves are
   plain readable JSON per Part 4 and there is nothing to protect.

   Import runs the full stage 1 deserialize and the stage 3 migration chain,
   and a future-version import gets the same refusal as a future-version load.
   An import that fails must not touch the existing save.

4. The badge contract meets a number it was not designed for, and V4 is the
   first log to hit it. "You were away for 3 hours" is a quantitative claim in
   player-facing text, which docs/PILLARS.md rule 4 and hard rule 1 govern, and
   it traces to the system clock rather than to docs/SCIENCE.md. So does
   elapsed game time, and so does every pool amount V3 already renders.

   Do not invent a badge state to paper over it. Decide whether measured
   runtime values are exempt from the badge contract, say why, and if they are
   exempt then write the exemption into DESIGN.md in stage 6 rather than
   leaving it as something each component decides for itself. The contract
   governs claims about biology, and a readout of the player's own session may
   simply not be one of those.

Verify: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` and
`npm run dev` with a real reload: play, refresh, confirm the state comes back.
Report the measured autosave cost in milliseconds, the badge exemption decision
with its reasoning and what the screen shows after a genuine multi-hour gap
produced by editing lastSavedAt in the exported file.
```

## Stage 5 Report

Where persistence becomes visible. `src/save/autosave.ts`, `src/save/offline.ts`, `src/save/meta.ts`, `src/save/tuning.ts`, `src/ui/components/SavePanel.tsx`, persistence wired into `src/ui/runtime.ts`, and the save strings added to `src/ui/content.ts`. No new visual vocabulary: Card, Button, Figure and Badge, all V3's, and not one colour, radius or motion value that DESIGN.md does not already name.

**Autosave** is `src/save/autosave.ts`, wired into the runtime rather than into React, for the reason V3 put the loop outside React: a save is not a render, and a component unmounting must not be able to stop the game saving. Three triggers. A timer at `AUTOSAVE_INTERVAL_MS`. `visibilitychange` to hidden, and only to hidden, because a tab becoming visible has nothing new to write. And every unlock purchase, immediately, because losing a purchase is the loss a player notices and it is the one thing autosave should never be thirty seconds late for.

`beforeunload` is wired as a best-effort extra and **it is not load-bearing.** It is skipped on mobile backgrounding, on tab discard under memory pressure, and by the bfcache path on iOS Safari. Delete it and every guarantee here is unchanged, because `visibilitychange` to hidden fires first in every case where a tab actually goes away. It later turned out to be worse than useless in one specific place, which is the second finding below.

**The autosave interval is 30 seconds** and it lives in `src/save/tuning.ts`, a new third tuning file with the same header treatment as the other two. Act 1's two purchases sit roughly one and roughly seven minutes in, measured in `unlockPacing.report.test.ts`, so half a minute never costs a whole beat, and purchases save independently anyway, which makes this really the granularity of losing progress TOWARD the next one. It owes docs/ECONOMY.md a divergence row. The count is now twenty-one provisional numbers across three files. A second number joined the pile late, see below, taking it to twenty-two.

**The measured cost of a write. Median 0.016 ms, worst 0.060 ms over 200 writes, against a 16.667 ms frame at 60Hz**, on a 981-byte save. That is capture, canonical serialize, the write, the verification read-back, the byte compare and a full structural parse, which is the whole of Part 1's verify-then-swap path. **The honest caveat: the store underneath is a Map, not localStorage**, because the measurement runs in node. What is measured is everything except the browser's own storage I/O, and that is the part I did not measure rather than the part I am claiming is free. Nothing about the number suggests dropping the read-back, which Part 1 requires and which is what makes the crash-state enumeration in stage 2 true.

**The offline delta**, `src/save/offline.ts`. Now minus `meta.lastSavedAt`, once, at the boundary. A negative delta credits zero and does not error, because a player whose machine changed time zone has done nothing wrong and a game that refuses to load is a worse answer. The positive side caps at `MAX_OFFLINE_HOURS`, which already existed in `src/sim/constants.ts`. Then it is added to `state.diagnostics.pendingOfflineMs` and **nothing else happens to it.** V4 does not simulate a single tick of it. That is the seam: V5 starts from a real accumulated number rather than from zero, and the time players spend away during the V4 release is not silently thrown out. A test asserts the accumulation survives a second reload rather than being recomputed from zero.

**The badge exemption, decided and mechanised rather than left to each component.**

"You were away for 5 hours" is a quantitative claim in player-facing text, which hard rule 1 and docs/PILLARS.md rule 4 govern, and it traces to the system clock rather than to docs/SCIENCE.md. **The decision: a value measured from the player's own session and the wall clock is exempt from the badge contract.** The contract governs claims about biology and about the game's own tuning, and a readout of how long this tab was closed is neither. There is no source it could cite and no divergence row it could owe, because it is not a game-authored number at all. Badging it would imply provenance is an open question about it, which is the opposite of true.

**The exemption is narrow and this is the line.** It covers real elapsed time away, save timestamps and storage sizes. It does not cover anything the simulation produced. V3's existing figures are not re-badged and should not be: pool amounts stay badged because they are output of a model whose rates are tuned, and elapsed GAME time stays badged because its badge is a claim about the mapping to real time, which docs/SCIENCE.md Part 1 says does not exist, and that claim is still worth making.

**No fourth badge kind was invented**, per the spec's instruction not to paper over it. The pill vocabulary is unchanged: three shipping states and one development-only one, and `vite/needsSourceGate.ts` is untouched. What changed is that `Figure` now requires exactly one of `badge` or `measured`, so provenance still does not compile if it is skipped; it just has two possible answers, and the author has to pick one at the call site. `measured` takes a sentence saying what is being measured, so it cannot be a silent escape hatch, and it becomes the `title` attribute: `Measured: real time between the last save and this load, from the system clock`. Stage 6 writes the rule into DESIGN.md with a decisions-log row.

**Save management.** Export writes readable JSON through a Blob, per Part 4, where there is nothing to protect. Import goes through a real file input wrapped in a styled label rather than a Button clicking a hidden input through a ref, because the native control is the accessible one. An import runs the full stage 1 deserialize, the stage 3 migration chain and then the act 1 mapping, which is the only layer that knows an unknown pool id is a corruption, and **nothing is written until all three have passed**. A future-version import gets the same refusal a future-version load gets. Backup recovery is offered rather than applied: the runtime starts a new game in memory, the corrupt primary and the good backup both stay on disk untouched, and the player presses the button.

**Two things the browser found that no test would have.** `npm run dev`, played, refreshed, on a real page.

**One: an import was silently undone by its own reload.** `importSave` writes the imported file to the active slot and the interface reloads. `beforeunload` fires on that reload and autosaves the still-running session over the file that was just imported. The import appears to succeed, the page comes back, and the player is looking at the save they were trying to replace. Accepting a backup had the identical hole. Fixed by **sealing**: after an import or an accepted recovery the timer and both listeners are torn down and every remaining write path refuses, so there is nothing left that can write rather than a reload that has to outrun the things that can. It is also the honest state to be in, since once the active slot holds a save this session did not produce, this session is stale by definition. Two tests now cover it, and both dispatch `beforeunload` and fire the timers after the import to prove the writes are refused rather than merely late. This is the sharpest possible illustration of `beforeunload` not being load-bearing: its only observable effect here was to destroy data.

Writing those two tests exposed a defect in the test harness itself, which is worth recording because it was hiding the bug. Its `stopTimer` was a no-op and its listener teardown returned an empty function, so a stopped runtime's autosave stayed alive in the harness and a test that fired every timer was writing from the wrong runtime. Both now really remove.

**Two: the panel announced a non-event on every refresh.** A reload takes a second or two, which is a positive offline delta, so it dutifully rendered "Away for 0 min" every single time. The number was true and the sentence was noise, and a save panel that cries wolf on every reload teaches the player to stop reading the one panel that has to be believed when something has actually gone wrong. `OFFLINE_REPORT_THRESHOLD_MS` is now 60000 in `src/ui/tuning.ts`, one minute, because the readout's own resolution is minutes and there is no point announcing a duration that rounds to zero. That is the twenty-second provisional number and it owes a divergence row too. In the same pass, a restored session that had not yet autosaved was reporting "Not saved yet" on a screen the reload had visibly just restored, which is technically true and reads as a failure; it now reports on whether a save EXISTS rather than on whether this session wrote one.

**The real reload, measured.** Loaded the page, waited for the first autosave: `krebs.save.active` appeared at 1005 bytes with `elapsedGameMs` 30000. Bought lactate dehydrogenase, and the save updated instantly at 49650 ms rather than on the next 30-second boundary, with `unlocked: ["ferment"]` and `totalAtpProduced` 60.000000000000014, which is exactly V3's measured cumulative-ATP ceiling for a walled cell. Played on to 89950 ms with lactate at 904.663, then refreshed. **Game time continued from 89950 rather than resetting**, lactate kept climbing to 1177.875, `ferment` stayed unlocked and the shelf still read "Running". No console errors at any point.

**What the screen shows after a genuine multi-hour gap.** Produced the way the spec asks, by editing `lastSavedAt` in the exported file: exported the save, subtracted 5 hours from `meta.lastSavedAt`, and imported the edited file back through the real file input. Verbatim from the page after the import reloaded it:

```
SAVE
TUNED
Away for
5.0
h

None of it has been simulated. It is being kept, not spent.
TUNED

Saved automatically
TUNED

Export to file
Import from file
```

"5.0" and "h" are one `Figure` carrying `measured` and no badge, which is the exemption doing its job on the first number it was written for. The wording is honest in both directions: no reward is implied and no loss is implied, because neither is true. Thirty-five seconds later, when the next autosave landed, `time.pendingOfflineMs` read 18055661, which is the five hours plus about 55 seconds of catch-up overflow from a headless tab that is not being given animation frames, and `time.offlineCreditedMs` read 0. Accumulated, credited to nothing, which is precisely the seam this stage exists to leave for V5.

**One thing persistence quietly broke before it was noticed, fixed in the same stage.** The completed-glucose correction in `meter.ts` subtracts a g3p baseline taken at construction. A restored runtime's construction-time g3p is the RESTORED pool level, not the level the run started at, so the correction would have been measured from the reload rather than from the beginning and ATP per glucose would have read wrong after every refresh. A restored runtime now uses zero, which is `ACT1_INITIAL.g3p` and is the true start of the metered window. The development scenario door can seed a non-zero starting g3p and a save written from one of those restores against zero rather than against the seed; that is a stated limit of a door that only exists behind a query string.

**Verify.** `npm run typecheck` clean, `npm run lint` clean, `npm run build` clean. `npm test` 269 passed across 24 files, up from stage 4's 245 across 23; the 24 new tests are in `src/save/__tests__/persistence.test.ts`. Bundle 251.29 kB, 78.79 kB gzipped, up from 229.44 kB and 72.36 kB, which is the save layer and the panel reaching the app for the first time. `npm run dev` with a real reload, as above.

---

# Stage 6 — Coherence, verify, docs and NOW.md

```
Close the log out.

1. Coherence sweep over src/save/. No Math.random and no Math.pow, Math.exp or
   Math.log anywhere that reaches a saved value, and no import from src/save/
   in either src/sim/ or src/content/ other than src/content/act1/save.ts. Fix
   what you find rather than reporting it.

   Then decide whether the ESLint determinism guard should extend to
   src/save/**, the way V2 stage 6 decided it should extend to src/content/**.
   The argument is not identical: save code legitimately needs Date, which is
   why it lives outside the guarded directories at all. Make the call, and if
   the answer is a partial scope then say exactly which rules apply and which
   do not. Prove whatever you apply fires with a probe file, quote the error,
   delete the probe.

2. Full verify: `npm run typecheck`, `npm run lint`, `npm run build`,
   `npm test`. Report the test count and the bundle size against V3's figures.

3. Walk a save by hand, in prose, in the report. Take a real act 1 run with an
   unlock bought and a non-trivial meter, and narrate every field: what it
   holds, where it came from and what would break if it were absent. If the
   walkthrough and the code disagree, the code is what shipped and the
   walkthrough is the bug report.

   Then narrate one load of that save, in the same way, including the tick
   reconstruction and the derivation of the reaction enabled flags from
   progression.unlocked.

4. docs/SAVE_SCHEMA.md, additively and without a version bump. Part 2 is
   explicitly illustrative and the additive fields this log shipped belong in
   it, or the contract drifts from the code inside one release. Add them, mark
   them as added by V4, and update the Last updated line.

   State in the report, plainly, that this is documentation catching up with an
   additive change rather than a schema change, that Part 1's policy says
   additive changes need no bump and that hard rule 7 is therefore not in
   play. Do not touch Part 1. Do not touch the version.

5. DESIGN.md. Add the save management screen to whatever V3 stage 7 left of the
   screen inventory, and write in the badge exemption stage 5 decided, as a
   rule rather than as a note, with a row in the decisions log.

6. Update NOW.md:
   - Status: the slice persists. A refresh no longer costs the run.
   - Build state table: V4 done, with the date.
   - A "What the save layer does" section, sibling to the kernel, content and
     interface sections, same shape. It should name the fixture and say why it
     matters, because that is the part a future maintainer needs and the part
     least visible from the code.
   - Blocking: anything this log found. Say plainly whether the backgrounded
     tab hole from V3 stage 1 is narrower now that pendingOfflineMs persists,
     and be clear that narrower is not closed.
   - "Open, not blocking": the autosave interval and its ECONOMY.md debt, the
     tick alignment cost of a development-time rate change, and the offline
     delta that V4 accumulates and does not spend.
   - The next log is V5, offline progress, and its first task is still
     validating STEADY_EPSILON and STEADY_WINDOW against a real configuration.
     Act 1 has been that configuration since V2 and is now a configuration
     that can be saved mid-run, which is what makes the Part 3 validation test
     practical to write.

7. Do not write docs/ECONOMY.md. V3 stage 7 made the recommendation and V4 adds
   one more row to what it owes. Restate the recommendation with the updated
   list rather than acting on it.

Verify: everything above clean. Report the ESLint decision from step 1 with its
probe output, the test count, the bundle size, the save and load walkthroughs,
the docs/SAVE_SCHEMA.md and DESIGN.md and NOW.md diff summaries and both
canonical hashes unchanged.
```

## Stage 6 Report

_Pending._

---

# After These Stages

- The slice persists. Every property the project has been treating as tested is now tested across a reload as well, which is a stronger claim than any previous log could make and the one `docs/SAVE_SCHEMA.md` Part 5 says is most often skipped.
- Hard rule 7 stops depending on anyone remembering it. A committed version 1 fixture exists, the harness that will consume it exists, and a version bump without a migration and a fixture fails the suite. That fixture cannot be created later and this is the only log that could create it.
- V5 is next and it is offline progress, the hardest algorithm in `docs/SIMULATION.md`. It inherits a real `pendingOfflineMs` rather than a zero, a save it can restore mid-run and a hash it can validate the piecewise steady state path against. Its first task is still validating `STEADY_EPSILON` and `STEADY_WINDOW`, which have been unvalidated placeholders since V1.
- Still deferred on purpose, see `NOW.md`: the ethanol branch, glycogen storage, the ten-enzyme decomposition, the timeline, the beast and all of act 2. Nothing under `enzymes` or `environment` carries a value in a version 1 save that act 1 does not honestly make true.
