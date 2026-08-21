# Save Schema

Last updated: 2026-08-20
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

**The same rule applies to `progression.act`, added by V11.** A save naming an act this build does not have is a well-formed file from a newer build, exactly as a higher schemaVersion is, and it gets the same treatment: refused, not loaded, not changed, with a message that says so. It is specifically not clamped to the highest known act, because that loads successfully and silently rewrites somebody's progress, which is worse than refusing. An act value that is not a whole number of 1 or more is a different thing and is malformed, rejected by the codec alongside every other malformed field.

## The version 1 window, and when it is expected to close

**No bump has been needed yet and V11 is the third log to decide that rather than to assume it.** V5 added two unlock id families, V6 added `settings.firstRunSeen` and V11 added `settings.boundarySeen`, and all three are additive changes new code can default, so all three shipped at version 1. The version 1 shape was written for four acts: `progression.act` is documented as 1 to 4, `transitionTaken` and `shuttleChoice` are labelled act 3, `enzymes[].damage` and `environment.scheduleIndex` are labelled act 2, and `settings` is an open bag of scalars.

**A decision that never names its own expiry is a silence, so this one names it.** The next bump is expected in **the act 2 log**, and the thing that forces it is per-reaction Vmax varying dynamically as hashed simulation state. `docs/designs/game-spine-and-four-acts.md` lists it as a kernel concept that does not yet exist: ROS damage means each reaction carries a current Vmax that is part of the simulation's state rather than a constant read from a tuning file, so a save has to carry it or a reload silently repairs the cell. That is not a field new code can default, because there is no correct default for "how damaged is this enzyme"; the honest answers are the saved value or a different game.

Two things that will NOT force a bump, recorded so they are not mistaken for it. The oxygen schedule index is already reserved under `environment`. And a new act's unlock ids are additive by the V5 argument: a save from an older build carries no id with the new prefix and derives the base state, while `Act1Unlocks.unknown` carries ids this build does not recognise through capture untouched.

`schemaVersionGate.test.ts` is the mechanism behind CLAUDE.md hard rule 7 and it asserts a committed fixture for every version from 1 to `SCHEMA_VERSION`, a migration for every step, and every fixture loading through the chain. Until the act 2 log it exercises one version, which is the correct answer and not a dormant one.

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

**An id becomes permanent when a build ships with it and not when a document writes it down.** Recorded 2026-08-20, because the act 3 registry below names ids for things that are not built. V10 stage 1 named `enzyme-hexokinase`, `enzyme-pfk1` and `enzyme-pyruvate-kinase` and stage 4 measured that none of the three could be sold as written, so all three disappeared and `enzyme-pfk1-pk` shipped instead. Nothing was owed to the names, because no build had ever carried them. **A list like the one below is a proposal with a naming convention attached, and the convention is the part that is binding.**

## The location convention for pool ids

Added 2026-08-20 by UPDATELOGV14.md stage 1, ahead of act 3, because act 3 is the first act in which the same molecule exists in two places at once and a save that cannot tell them apart is a save that has lost the act's subject.

**A pool id ends in a suffix naming where the pool is. No suffix means the cytosol.**

```
  (none)     the cytosol. Every act 1 pool id, unchanged
  _env       the environment, outside the cell. glucose_env, since V2
  _matrix    the mitochondrial matrix
  _ims       the intermembrane space
  _membrane  in the inner membrane itself, for the quinone pool
```

**This renames nothing and needs no migration.** Act 1's ids already had a location and it was already the cytosol, and `glucose_env` already used a suffix for exactly this purpose. What is new is that the absence of a suffix is now a statement rather than an accident, and a guard can check it.

Three notes on the boundaries of the convention, each of which is a real fact about the cell rather than a convenience.

**Carbon dioxide is not compartmented and gets no suffix.** It crosses membranes by simple diffusion, so the existing `co2` pool serves the matrix reactions that produce it as well as the act 1 branch that already does. This is one of the few places where the honest model and the cheap model agree.

**The intermembrane space is chemically continuous with the cytosol for everything except protons.** docs/SCIENCE.md Part 4 records that the outer membrane is porous up to roughly 5 kDa. So `_ims` is used only where the inner membrane's gradient makes the distinction real, and a metabolite that would be identical on both sides does not get an `_ims` twin.

**`_membrane` is the inner membrane and there is no other membrane pool.** It exists for ubiquinone and ubiquinol, which are dissolved in the lipid rather than in either aqueous compartment, and which have to be a pool because the electron transport chain is sold complex by complex and the complexes hand off through them.

## The act 3 id registry

Added 2026-08-20 by UPDATELOGV14.md stage 1, which owns naming and owns no code. **Every id below is a proposal under the permanence rule above.** The stage that mints one makes it permanent; the stage that measures it away costs nothing.

Pools, matrix:

```
  pyruvate_matrix        acetyl_coa_matrix      coa_matrix
  citrate_matrix         isocitrate_matrix      akg_matrix
  succinyl_coa_matrix    succinate_matrix       fumarate_matrix
  malate_matrix          oxaloacetate_matrix
  nad_matrix             nadh_matrix
  fad_matrix             fadh2_matrix
  atp_matrix             adp_matrix             pi_matrix
  proton_matrix
```

Pools, inner membrane and intermembrane space:

```
  q_membrane             qh2_membrane
  cytc_ox_ims            cytc_red_ims
  proton_ims
```

Pools, cytosol, new:

```
  water                  where the electrons end up. See the note below
```

`akg_matrix` is alpha-ketoglutarate, shortened because the full name is long and the abbreviation is the one every source uses. `cytc_ox_ims` and `cytc_red_ims` are oxidised and reduced cytochrome c.

**`water` is the one addition that is not obviously content, and the reason is a conservation law.** docs/SCIENCE.md Part 1 says water is mostly implicit, and it can stay implicit everywhere except one reaction. Act 1 never disposed of reducing power outside the model: both fermentation branches hand the electrons back to carbon, so `redox` balances. **Act 3's terminal step hands them to oxygen, and if oxygen and water are both outside the model then redox is destroyed on that tick and the conservation test fails.** Giving water a pool with a redox weight closes the loop and keeps the invariant that Part 1 calls the reason redox is modelled as a conserved quantity at all. The alternative is to exempt the terminal reaction from the conservation test, which would remove the check from the exact reaction most worth checking.

**Oxygen is deliberately absent from this list and that is an open question rather than an omission.** `environment.oxygenLevel` already exists in this schema as a scalar set by act 2's schedule. A pool called `oxygen_env` would be a second representation of the same fact, which is the defect this document exists to prevent, and it would also make oxygen a quantity one cell can draw down, which the atmosphere is not. The stage that builds the terminal reaction decides whether oxygen is a level it reads or a pool it consumes, and it cannot be both.

Compartments:

```
  env        cytosol        matrix        ims        membrane
```

The first two exist implicitly today and are named here so the set is complete.

Unlocks:

```
  pyruvate-transport
  pyruvate-dehydrogenase
  tca-cycle                      the cycle as one unit
  enzyme-citrate-synthase        the three regulated steps, sold by name,
  enzyme-isocitrate-dh             the way enzyme-pfk1-pk is sold in act 1
  enzyme-akg-dh
  complex-1  complex-2  complex-3  complex-4
  atp-synthase
  shuttle-malate-aspartate
  shuttle-glycerol-phosphate
  gene-transfer-N                per rung
  mitochondria-count-N           per rung
```

**The complexes are numbered in Arabic and the biology numbers them in Roman, on purpose.** `complex-i` and `complex-ii` differ by one character in a string that a reader skims and a migration matches exactly, and the cost of the mismatch with the literature is one sentence of player-facing text.

**`complex-2` is succinate dehydrogenase, which is also step 6 of the TCA cycle**, so it is the one unlock in the list that could belong to two purchases. docs/SCIENCE.md Part 4 records that the cycle and the chain share this enzyme rather than handing a metabolite between them. Whether the game sells it once or twice is a content decision and the id is reserved either way.

**The three named TCA enzymes are the ones act 1's precedent says to be careful about.** V10 named three glycolytic enzymes and shipped one purchase, because measurement said two of them could not be sold alone. These three are the regulated steps by the same argument docs/SCIENCE.md Part 2 makes for glycolysis, and the same measurement has to be run before any of them is minted.

Progression fields, and one finding that belongs to a later stage:

**`progression.transitionTaken` is a boolean and the transition has three states.** Not yet offered or not yet chosen, kept, and digested. docs/PROGRESSION.md act 3 gives the player a choice to keep or digest the endosymbiont, where digesting is a large one-off payout and a soft lock with an undo. A boolean can record that something happened and cannot record which of two things happened, so a save written after a digest is indistinguishable from one written after a keep. This is a version 1 field that no build has ever written as `true`, so it is still free to change shape, and the stage that builds the transition inherits it.

**`progression.shuttleChoice` is a single nullable string and the answer to the shuttle question is that a cell can run both.** docs/PROGRESSION.md act 3 item 6 settled that on 2026-08-20. The field as documented holds one of two names, which is the permanent-choice model that was rejected. Same situation as above: never written as anything but `null`, so still free.

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
