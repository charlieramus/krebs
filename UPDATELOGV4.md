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

_Pending._

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

_Pending._

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

_Pending._

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
