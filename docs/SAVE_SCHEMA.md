# Save Schema

Last updated: 2026-08-24
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

**Permanent from the moment something ships with it, and not before.** Recorded 2026-08-24 because V10 stage 1 named three enzyme ids that were never minted, and V10 stage 4 measured that two of the three enzymes could not be sold at all. The ids were dropped without cost, because no build had ever written one. A name in a document is a reservation. A name in a shipped save is a contract.

## Compartments are a convention in the pool id

Added 2026-08-24 by UPDATELOGV14.md stage 1. Act 3 gives a pool a location for the first time. This section sets the naming convention; UPDATELOGV14.md stage 2 owns what a compartment means to the kernel and may still find that the convention has to change, in which case it changes here before anything is minted.

**A pool id is `species` or `species_compartment`, and an id with no compartment suffix means the cytosol.**

    env    the environment outside the cell
    cyt    the cytosol
    ims    the intermembrane space
    imm    the inner mitochondrial membrane
    mtx    the mitochondrial matrix

The unsuffixed case is a dated exception rather than a second rule, and it exists because act 1's thirteen pool ids shipped in V4 and cannot be renamed. `glucose`, `pyruvate`, `nad`, `nadh`, `atp`, `adp` and `pi` are all cytosolic and all keep their bare names forever. `glucose_env` already carries a compartment and is the precedent this convention generalises.

**Every pool minted from V14 onward carries an explicit suffix, including cytosolic ones.** So the malate that the shuttle reduces in the cytosol is `malate_cyt` and not `malate`. A reader in five months needs one sentence to decode the set: no suffix means cytosol and means act 1, and everything else says where it is.

### The collision this convention was checked against

`g3p` is act 1's **glyceraldehyde-3-phosphate**, minted in V2 and shipped in the V4 fixture.

The glycerol phosphate shuttle runs on **glycerol-3-phosphate**, which is a different molecule that is also routinely abbreviated G3P in the literature.

They are three carbons and one phosphate each, they sit two steps apart in the same pathway, and one of them is already a permanent id. **The shuttle's metabolite is `glycerol3p_cyt` and it is never `g3p` under any suffix.** Written down here rather than left to be noticed, because the failure mode is a conservation test that passes while the economy is quietly wrong, which is the exact hazard `src/content/act1/pools.ts` warns about for redox weights.

### Reserved act 3 pool ids

Reservations, not contracts, by the rule at the head of this section. UPDATELOGV14.md stages 2 to 5 decide which are minted and a name that is never minted costs nothing.

    o2_env             molecular oxygen. See "The placeholder oxygen level" in
                       docs/ECONOMY.md: act 2 is what raises this and act 2 does
                       not exist

    glycerol3p_cyt     glycerol-3-phosphate. NOT g3p. See above
    dhap_cyt           dihydroxyacetone phosphate
    malate_cyt         the malate-aspartate shuttle, cytosolic leg
    oxaloacetate_cyt
    aspartate_cyt
    glutamate_cyt
    akg_cyt            alpha-ketoglutarate

    h_ims              protons, the high side of the gradient
    cytc_ox_ims        cytochrome c, oxidised
    cytc_red_ims       cytochrome c, reduced

    q_imm              ubiquinone
    qh2_imm            ubiquinol

    pyruvate_mtx       the first thing to cross, on a proton symport
    acetylcoa_mtx
    coa_mtx            free coenzyme A. A carrier pair with acetylcoa_mtx and
                       succinylcoa_mtx, conserved the way nicotinamide is
    citrate_mtx        the eight TCA intermediates, docs/SCIENCE.md Part 4
    isocitrate_mtx
    akg_mtx
    succinylcoa_mtx
    succinate_mtx
    fumarate_mtx
    malate_mtx
    oxaloacetate_mtx
    aspartate_mtx      the shuttle's return leg
    glutamate_mtx
    nad_mtx            the matrix nicotinamide pair, SEPARATE from cytosolic
    nadh_mtx           nad and nadh. Two shuttles exist because these are two
                       pools rather than one, so merging them would delete the
                       reason act 3 has a choice in it
    fad_mtx            the flavin pair
    fadh2_mtx
    co2_mtx            see the note below
    h_mtx              protons, the low side of the gradient
    h2o_mtx            water. See the note below
    atp_mtx            reserved and likely not minted. If the translocase is
    adp_mtx            lumped into ATP synthase, the synthase produces into
    pi_mtx             cytosolic atp and these three never exist

**`h2o_mtx` is the pool that makes protons conservable and it is the same move V10 made for carbon.** Complex IV consumes four matrix protons per O2 in making two water molecules and ATP synthase consumes one per ATP, so without somewhere for those protons to go a conserved proton total falls on the first tick. V10's ethanol branch had exactly this shape: carbon left pyruvate and stayed conserved because `co2` is a real pool with the carbon still in it. Water is that pool for protons. UPDATELOGV14.md stage 2 owns the weight table and the proof.

The conserved quantity is named `proton` and it counts free protons plus those locked into water. **It is not a hydrogen atom balance** and must not be described as one, because NADH, the TCA intermediates and every organic acid in the model carry hydrogen that this quantity ignores. Same status as `redox`, which docs/SCIENCE.md Part 1 already discloses as a counting convention rather than a chemical property.

**`co2_mtx` is reserved and the question of whether it is a distinct pool is stage 2's.** Carbon dioxide is a small neutral gas that crosses both membranes without a carrier, so the physical case for a separate pool is weak, and the convention's case for one is that location is in the id. The deciding rule is the one stage 2 sets: a compartment suffix earns its place when location changes what a species can react with. Act 4's pyruvate carboxylase is a matrix enzyme that consumes carbon dioxide, so the answer may not be the same in act 3 and act 4, and that is worth knowing before the id is minted rather than after.

### Reserved act 3 unlock ids

Unlock ids are kebab-case, matching `ferment-ethanol`, `glycogen-storage` and `enzyme-pfk1-pk`.

    endosymbiont-kept          the transition. UPDATELOGV14.md stage 3 owns both
    endosymbiont-digested      of these and may find that progression.transitionTaken
                               carries the whole fact and neither id is needed

    pyruvate-transport
    pdh-complex
    tca-cycle                  the cycle as one unit
    tca-decomposed             and then decomposed, docs/PROGRESSION.md act 3 item 3
    etc-complex-1              acquired in sequence, docs/PROGRESSION.md item 4
    etc-complex-2
    etc-complex-3
    etc-complex-4
    atp-synthase
    shuttle-malate-aspartate
    shuttle-glycerol-phosphate
    gene-transfer-N            per rung, a finite ladder
    mitochondria-N             per rung, a finite ladder

**The two shuttle unlock ids are not the two `shuttleChoice` values and the difference is load-bearing.** `progression.shuttleChoice` is documented in Part 2 as `"malate-aspartate" | "glycerol-phosphate"`, it has been in the schema since V4, and those strings are the contract. An unlock id records that a route was bought. The choice field records which one is running. Under a switchable shuttle a player can own both ids while the field names one, and a design that conflates them cannot express that.

**Both ladders are finite and the id shape says so.** `gene-transfer-N` and `mitochondria-N` follow `uptake-capacity-N` and `glycolysis-capacity-N` exactly, including that rung 0 is the shipped default and is not purchasable, so the first id a save can carry is rung 1. docs/PILLARS.md rules out infinite scaling and a per-rung id is what makes the ceiling a fact about the id set rather than a promise.

**None of these forces a schema bump.** Part 1 already records the reasoning: a save from an older build carries no id with a new prefix and derives the base state, and `Act1Unlocks.unknown` carries unrecognised ids through capture untouched. The bump that is still expected is act 2's, forced by per-reaction Vmax becoming hashed state. UPDATELOGV14.md stage 3 may force one earlier if the transition snapshot needs a slot, and it is told to follow hard rule 7 exactly if so.

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
