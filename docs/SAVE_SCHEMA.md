# Save Schema

Last updated: 2026-07-31
Current schema version: 1

The data contract. Treated as frozen in the same sense as the MyLifeInARepo contract: additive changes are cheap, breaking changes require a migration and a test, and nothing ships that can silently corrupt a save.

---

# Part 1: Policy

## Versioning

Every save carries an integer schemaVersion at the top level. It is the first field read and it is read before anything else is parsed.

Additive changes that new code can handle by defaulting a missing field do not require a version bump.

Any of the following require a bump and a migration: renaming a field, changing a field's type, changing units, changing the meaning of a value, or removing a field that older code depended on.

## Migration

Migrations are an ordered array of pure functions, each taking a save at version N and returning one at version N+1. Loading a save at version N with current version M applies migrations N through M-1 in sequence.

Requirements per migration:

- Pure. No side effects, no reads outside the passed object.
- Total. Handles every valid save at its input version, including ones with missing optional fields.
- Accompanied by a fixture. A real save file at the input version, committed to the repo under test fixtures, with a test asserting the migration produces the expected output.

Fixtures are never deleted. The fixture set is the regression suite for the entire save history.

Migrations are never edited after release. If a released migration is wrong, the fix is a new migration that corrects the damage, not an edit to the old one, because players may have already run it.

## Forward compatibility

If schemaVersion exceeds the current version, the save came from a newer build. Do not attempt to load it. Do not attempt to guess. Show a clear message and preserve the file untouched.

## Corruption handling

Before writing a save, write to a temporary key, verify it reads back and parses, then swap. Never overwrite a known-good save with an unverified write.

Retain the previous save as a single backup slot. On a failed parse of the primary, offer recovery from backup rather than silently starting a new game. Losing progress silently is the worst possible outcome for a game with a 6 to 10 hour arc.

---

# Part 2: Shape

Illustrative rather than exhaustive. Field names are the contract, the structure below is the intended organization.

Fields marked `// V4` were added by UPDATELOGV4.md when version 1 was implemented. They are additive, so under Part 1's policy they required no version bump, and the version stayed 1. They are recorded here because Part 2 is the contract's description of itself and a description that lags the code by a release is how the two stop agreeing.

    {
      schemaVersion: 1,

      meta: {
        createdAt:        number,   // epoch ms, save creation
        lastSavedAt:      number,   // epoch ms, used for offline delta
        buildId:          string    // diagnostic only, never branched on
      },

      time: {
        elapsedGameMs:    number,   // total game time simulated, integer ms
        offlineCreditedMs: number,  // cumulative, for stats and audit
        pendingOfflineMs: number    // V4. accumulated, not yet credited
      },

      rng: {
        algorithm:        string,   // "mulberry32"
        seed:             number,
        state:            number    // current internal state
      },

      progression: {
        act:              number,   // 1 to 4
        unlocked:         string[], // unlock ids, insertion ordered
        transitionTaken:  boolean,  // endosymbiosis, one way
        shuttleChoice:    string | null  // "malate-aspartate" | "glycerol-phosphate"
      },

      pools: {
        // id to current amount. ids stable forever once released.
        [poolId: string]: number
      },

      enzymes: {
        [enzymeId: string]: {
          level:          number,
          damage:         number    // act 2 ROS degradation, 0 to 1
        }
      },

      environment: {
        oxygenLevel:      number,
        scheduleIndex:    number    // position in the act 2 oxygen schedule
      },

      stats: {
        totalAtpProduced: number,
        glucoseConsumed:  number,
        eventsProcessed:  number,

        // V4. The rest of the act 1 counter set. Unlocks are gated on the
        // cumulative meter, so a meter that does not survive a reload either
        // re-locks something the player bought or lets them buy it twice.
        atpSpent:         number,
        atpMaintained:    number,
        glucoseTakenUp:   number,
        lactateProduced:  number,
        nadhProduced:     number
      },

      diagnostics: {
        offlineFallbackCount: number,  // steady state not reached, see docs/SIMULATION.md Part 3
        negativePoolScalingEvents: number,
        scalingCapHits:   number       // V4. shortfall scaling hit its pass cap
      },

      settings: {
        // UI only. Never affects simulation.
        // Empty at version 1. Values are scalars: boolean, number or string.
      }
    }

`tickCount` is absent and that is deliberate. See Part 3, "Time is stored in milliseconds, never in ticks". It is reconstructed at load as `elapsedGameMs / TICK_MS`.

---

# Part 3: Rules on specific fields

## Time is stored in milliseconds, never in ticks

This is the single most important rule in the file.

Storing tick counts would make TICK_RATE_HZ load-bearing for save compatibility. Changing the tick rate would then silently rescale every existing save. Storing milliseconds decouples the two, which is what allows the rate to be tuned freely during development and frozen cleanly at launch. See docs/SIMULATION.md Part 1.

**It decouples the duration. It does not decouple the tick alignment.** Added by V4, which is the log that had to implement the reconstruction and found the gap.

`elapsedGameMs` is always a whole multiple of the TICK_MS that produced it, so dividing is exact while the rate is unchanged. Change TICK_MS from 50 to 40 during development and a save written at 60050 ms reconstructs to 1501.25 ticks, which is not a tick count. Load therefore floors to the whole tick and discards the sub-tick remainder, which is at most one tick of game time.

A save whose `elapsedGameMs` is not a whole multiple of the current TICK_MS **is not corrupt and must not be rejected as corrupt.** It is the cost this rule was chosen to pay, and corruption handling has to be able to tell the two apart.

## lastSavedAt is the only wall-clock input

Offline duration is computed as now minus lastSavedAt at load, once, at the boundary. Wall-clock time never enters the tick loop.

A negative delta means the system clock moved backwards. Credit zero, do not error. Cap the positive delta at MAX_OFFLINE_HOURS.

## RNG state is part of the save

Determinism requires that a reloaded save continue the same random sequence. Persisting the seed alone is insufficient. The current internal state must persist too.

## Ids are permanent

Pool ids, enzyme ids and unlock ids are contract surface. Once a build ships with an id, that id is never reused for a different meaning. Renaming requires a migration.

## Diagnostics are not decoration

offlineFallbackCount, negativePoolScalingEvents and scalingCapHits record simulation conditions that should not occur in a well-tuned build. They persist so that a player-submitted save file carries evidence of a balance bug. Surface them in a development overlay.

**negativePoolScalingEvents is a projection and it cannot be inverted.** Added by V4. The kernel counts shortfall ticks per pool and the schema stores one number, so the mapping is a sum. A restored session therefore carries the saved total as a baseline and adds its own work to it, and the per-pool breakdown is session-scoped. The total is what the field has always meant, so nothing about the contract changes; what changes is that a reader now knows the number spans the whole history of the save and the breakdown does not.

## Settings never affect simulation

Anything under settings is presentation. If a setting would change simulation output, it belongs elsewhere and it needs to be reasoned about as a determinism hazard.

---

# Part 4: Storage

localStorage, keyed with a stable prefix. Single active save slot plus one backup slot.

Serialized as JSON. No compression at version 1. Revisit only if a real save approaches storage limits, which is unlikely for this shape.

No cloud sync, no accounts, no backend. See docs/PILLARS.md rule 7.

Export and import to a file should exist, both because it lets players move between devices without infrastructure and because it makes bug reports actionable. Exported saves are plain JSON and readable, which is fine. There is nothing to protect.

---

# Part 5: Tests required before version 1 ships

- Round trip. Serialize, deserialize, assert deep equality.
- Migration chain. Every fixture from every historical version loads to current and produces valid state.
- Corruption. Truncated JSON, malformed JSON and a future schemaVersion each fail safely without destroying the existing save.
- Backup recovery. A corrupted primary recovers from backup.
- Determinism across reload. Save mid-run, reload, continue, and assert the resulting state matches an uninterrupted run of the same length.

That last test is the one that catches missing RNG state, and it is the one most likely to be skipped.
