# Save fixtures

Real save files at every schema version this project has ever shipped.

## The three rules

**Never deleted. Never edited. Never regenerated.**

docs/SAVE_SCHEMA.md Part 1: "Fixtures are never deleted. The fixture set is the
regression suite for the entire save history." A fixture that gets regenerated
against the current build stops being a record of what an old build produced and
becomes a mirror of what the new one produces, which is the one thing it must
never be. If a fixture and the code disagree, the fixture is the evidence and
the code is the suspect.

## Why `v1.json` exists when there is nothing to migrate

CLAUDE.md hard rule 7 forbids bumping the schema version without a migration and
a fixture test from the previous version. That makes a real version 1 save a
precondition for schema version 2 ever existing.

**A version 1 fixture can only be captured while version 1 is what the code
produces.** Miss the window and whoever writes version 2 is fabricating the thing
they are supposed to be migrating, and the first real test of the first real
migration happens on a stranger's machine against a save nobody can recreate.

`schemaVersionGate.test.ts` enforces the rule mechanically: a fixture for every
version from 1 to `SCHEMA_VERSION`, a migration for every step between them, and
every fixture loading through the chain to a state that passes the same
validation a fresh save does. Bumping the version without both fails the suite
rather than failing review.

## What `v1.json` is

A real act 1 run, four game-minutes deep, produced by `src/save/fixture.ts`:

1. 1200 ticks with `ferment` disabled, which runs the pathway into the NAD+ wall
2. `ferment` enabled, which is what buying lactate dehydrogenase does, then 1200 ticks
3. uptake Vmax raised from 8 to 10, which is the first capacity step, then 2400 ticks
4. seven values drawn from the PRNG

It carries pools off their initial values, a non-zero meter, two unlocks in
purchase order, a PRNG state that is not the seed, and 240000 ms of elapsed game
time. Timestamps are fixed constants rather than clock readings, so the artifact
is a function of the procedure alone and does not differ per machine.

**Step 4 is the one thing act 1 does not do by itself, and it is disclosed rather
than hidden.** Act 1 consumes no random numbers: `src/sim/tick.ts` never touches
the PRNG, so a real run of any length finishes with `rng.state` exactly equal to
`rng.seed`. A fixture like that cannot exercise the field docs/SAVE_SCHEMA.md
Part 5 calls the one most likely to be dropped, because a loader that
reconstructed the generator from the seed alone would produce an identical
result. The seven draws stand in for a later act that uses the stream. Every
other number in the file came out of the simulation.

**There is deliberately no synthetic version 0 fixture.** Version 0 never
shipped, and a fabricated predecessor pollutes exactly the thing whose value is
being real. The migration RUNNER is proven correct against fabricated migrations
in `migrations.test.ts`, which is a different claim and the one that can honestly
be made today.

## How to generate the next one

    npm run save:fixture            print it, write nothing
    npm run save:fixture -- --write overwrite src/save/__tests__/fixtures/v1.json

When version 2 ships, copy `buildV1Fixture` to `buildV2Fixture` against a version
2 build, write `v2.json` beside this file, and leave `v1.json` exactly where it
is. The generator is committed so the procedure is reproducible even though the
artifact is not to be reproduced.
