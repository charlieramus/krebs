charlie

# krebs, V13: The Act Jump
# Work on one stage at a time. Do NOT combine stages.

---

## Context

Read `NOW.md` first, then `docs/PROGRESSION.md` "Gating rules", then the act boundary machinery Spine A built.

**This is the first half of teacher mode and it arrives early for a reason that has partly expired.** `docs/designs/game-spine-and-four-acts.md` splits E6 and moves the act jump ahead of the rest of teacher mode, justified as "so act 3 is reachable in minutes rather than in six hours". That reasoning assumed acts arriving in order. **They are not.** Act 3 is scheduled next and act 2 last, so at the moment this log runs, act 3 will follow act 1 at 45 to 90 minutes rather than at six hours.

**Say that plainly rather than shipping on a stale justification.** The remaining reasons are still good and they are different ones. A jump makes act 3 testable without playing act 1 first, every time, for the whole of V14. It makes act 3 reviewable by somebody who has ten minutes rather than an afternoon, which is the shape of every reader this project has failed to find. And building it before V14 rather than during it means V14 does not carry a debugging tool in its stage list.

**The thing that makes this log dangerous is small and specific.** A jump has to produce a legal act 3 starting state: pool amounts, an unlocked list, `transitionTaken`, `shuttleChoice`. **The act boundary machinery already defines that state**, because that is what a boundary hands over. Two definitions of the same fact is exactly what `NOW.md` settled against on 2026-07-31: `progression.unlocked` is the single source of truth for what has been bought, reaction flags are derived from it and never persisted alongside it, and two copies of one fact is the specific way save formats rot.

**And the gating rule is not negotiable.** `docs/PROGRESSION.md` says acts are strictly sequential. This is a teacher and development affordance, not a player-facing skip. `src/ui/scenario.ts` is the existing precedent: `?glucose=500` and `?ferment=on`, a development door that documents itself as one, and whose known limitation is that `?ferment=on` does not survive a reload because it enables a reaction without minting an unlock id.

## Decisions

- **The jump does not define an act's start state. It asks the boundary machinery for it.** One definition, one code path, tested once. If the boundary handover is not currently expressed as something a caller can request, making it so is the first stage and the jump is a thin wrapper over it.
- **A jumped-to session is marked as such, in the save, permanently.** A save produced by a jump is not a save produced by play, and the two should not be indistinguishable. This is diagnostic rather than punitive: a player-submitted save that skipped four hours of play should say so, for the same reason `meta.buildId` exists.
- **It is not reachable by normal play and there is no button on the act screen.** Acts are strictly sequential. A skip-ahead affordance in the interface would be a different product decision, and `docs/PILLARS.md` does not obviously forbid it, which is exactly why it should not be smuggled in through a log about a debugging tool.
- **Determinism is scoped honestly rather than claimed.** A jumped state is fabricated, so the run after it is not the run a player would have had. What must hold is the narrower property: the same jump produces the same state every time, and the session after a jump is internally deterministic and reloads identically. That is the same shape as `docs/SIMULATION.md` Part 5's Scope section, which says three separate things about determinism rather than one.
- **The jump target list comes from the act registry**, so an act that does not exist is not jumpable, and adding act 2 later makes it jumpable with no edit here. Spine A already built the future-act refusal for the save side of this.
- Small feature, and its risk is entirely in not duplicating a definition: four stages.

---

# Stage 1 — One definition of an act's start state

```
Before the jump exists, make sure there is exactly one answer to "what does act
N look like at its beginning".

1. Read Spine A's act boundary machinery. When act 1 ends and hands over, what
   produces the next act's starting state? Report the answer as it is, not as
   it should be. If the handover is inline in the boundary path rather than a
   thing a caller can ask for, that is the finding and step 2 is the fix.

2. Extract it if it needs extracting: a function that, given an act descriptor,
   returns that act's legal starting state. The boundary calls it. The jump
   will call it. Nothing else defines one.

   This is a structural change with no behaviour change, so the regression bar
   applies: both canonical hashes unchanged, the suite green, and the headless
   playthrough still reaching the same end state.

3. What a starting state has to contain, enumerated rather than assumed: pool
   amounts, the unlocked id list, progression.act, transitionTaken and
   shuttleChoice, and whatever else docs/SAVE_SCHEMA.md's progression and pools
   sections carry. Derived things stay derived: reaction enabled flags come
   from progression.unlocked at load and are never a second copy, which V4
   settled and reloadDeterminism.test.ts asserts.

4. A test that the two callers agree. Reach act N by boundary, reach act N by
   jump, compare the states. They must be identical, not merely compatible. If
   this test is hard to write, the extraction in step 2 did not go far enough.

5. Do not build the jump in this stage.

Verify: one function, two callers, and a test that they agree exactly. Report
what the handover looked like before, the extraction, the enumerated contents
of a starting state, and the regression bar.
```

## Stage 1 Report

**The handover does not exist, and not in the sense the stage anticipated. There is no inline version to extract, because the act boundary does not produce a state at all.**

Step 1 asked what produces the next act's starting state when act 1 ends. Reported as it is: **nothing does.** `src/ui/boundary.ts` is a detector. `ActBoundary` has exactly two members, `isComplete(snapshot)` and `nextContentAtp(snapshot, meter)`, and neither returns a state or could. `App.tsx` responds to the boundary by opening `EndOfContent`, the screen V11 authored to say where the game currently ends while the cell keeps ticking underneath. The stage offered two possibilities, a handover a caller can request or a handover inline in the boundary path, and the answer is a third one.

**That is the correct state of the project rather than a gap.** V11 built the boundary and refused to author what is on the other side of it, and `src/content/acts.ts` says why in as many words: a descriptor designed against a sample size of one is a wrong sentence in a specification waiting for something to be built on top of it. A handover written before act 2 exists would have been exactly that.

**So the definition this stage had to find was one level down from where it was looking, and it did exist.** There is precisely one answer in the project to "what does act N look like at its beginning", and before this stage it was **five expressions spread across thirty lines of `createActRuntime`**, each on the far side of its own `restoredOk === null` ternary:

```
  runtime.ts:585   const state    = restoredOk === null ? descriptor.create(options.create) : ...
  runtime.ts:587   const meter    = restoredOk === null ? descriptor.createMeter()          : ...
  runtime.ts:590   const unlocked = restoredOk === null ? []                                : ...
  runtime.ts:606   let   settings = restoredOk === null ? {}                                : ...
  runtime.ts:613   let   carried  = restoredOk?.carried ?? descriptor.noCarriedCounters
```

**Unreachable without building a whole runtime**, which is the part that mattered. A jump that wanted a legal act 1 state had two options before this stage: construct a runtime and throw away everything except its state, or rewrite those five expressions. The second is the second definition the log's Decisions section forbids, and it is the same defect as two copies of one fact in a save, one level up.

**The extraction.** `src/content/actStart.ts`, one function:

```
  actStartState(descriptor: ActDescriptor, options?: ActCreateOptions): ActStartState
```

It reads the descriptor and nothing else. It does not import `src/ui/`, so the runtime and the jump can both call it without either one owning it, and the import direction `src/content/README.md` protects is unchanged.

**The two paths in the runtime unified rather than moving, which was not the plan and is the better outcome.** Once the new-game side is a value rather than five expressions, a restored session and a fresh one differ only in where the same five values come from, so the five ternaries collapse to one `??`:

```
  const start = restoredOk ?? actStartState(descriptor, options.create);
```

`??` short-circuits, so a restored session still never runs the act's constructor. What `restoredOk` still answers below is only what a **load** can answer: the yield-correction baseline, the missing pools, the discarded milliseconds and the derived unlock flags at lines 671, 765 to 798 and 987 to 989. `src/ui/runtime.ts` is 35 lines longer and 5 shorter, and most of the addition is the comment explaining why.

**What a starting state contains, enumerated against docs/SAVE_SCHEMA.md rather than assumed.** Six things, and the schema section each one answers for:

```
  act        progression.act                    read off the descriptor
  state      pools, rng, time.elapsedGameMs     one object, tickCount 0
  meter      stats                              every field zero
  unlocked   progression.unlocked               [], the source of truth
  settings   settings                           {}, an open bag
  carried    the four counters capture cannot read off a simulation
```

**Three groups are deliberately NOT on it and the largest of them is named by step 3, so it is flagged rather than quietly dropped.** `progression.transitionTaken` and `progression.shuttleChoice` are listed by step 3 as things a starting state has to contain. They are not on `ActStartState`, because **the act's own `capture` already decides them**: `captureAct1` writes `false` and `null` with a comment saying both are honestly true of the state rather than placeholders. Putting them on the start state as well would be two copies of one fact, which is the exact defect the stage exists to prevent, and it would put act 3's vocabulary into a function abstracting over one act, which `src/content/acts.ts` forbids in its header. `enzymes` and `environment` are absent for the same reason and captured the same way, and the derived reaction enabled flags are absent because V4 settled that they come from `unlocked` at load and are never a second copy.

**What replaces them is an assertion rather than a comment.** A test captures a start state and asserts the act's values come back, so the start state and the act's capture cannot drift apart without the suite noticing. When V14 gives act 3 a beginning where `transitionTaken` is true, that test is where the decision has to be made rather than discovered.

**Step 4's test as written cannot be built at stage 1, and this is the one place the stage contradicts itself.** It asks to reach act N by the boundary, reach act N by the jump, and compare. The boundary does not hand over, per the finding above. The jump is stage 2, and step 5 of this stage forbids building it here. Stage 2's own Verify line already says "the jump produces a state identical to the boundary's", so **the boundary-versus-jump comparison is stage 2's test and it is left there.**

**What was built instead is the same property over the two callers that exist**, and they are the two that matter for the defect: the runtime's new-game path, which was the only definition before this stage, and a direct call, which is the shape the jump will use. Identical rather than merely compatible, in five assertions:

```
  hashState(runtime.state) === hashState(start.state)     byte-identical state
  pool amounts, tickCount, prng seed and prng state       field for field
  unlocked, settings and all four carried counters        through a capture
  the WHOLE captured save, meta excluded                  toEqual, one assertion
  runtime.state !== start.state                           not the same object
```

**The fourth is the one worth having.** The others compare the pieces a test happens to name; that one compares the entire persisted document, so a field a later log adds to the save is covered on the day it is added rather than on the day somebody remembers to widen a list. `meta` is the only exclusion, because it carries wall-clock timestamps and the build id, none of which is a fact about an act's beginning.

**And a fresh-allocation test, which exists because without it four of the others pass for the wrong reason.** Two calls must not return the same object. If they did, every comparison above would be comparing an object with itself, and the jump would hand the runtime a state a previous session had already ticked.

**The registry is walked rather than named.** The per-act test iterates `ACTS`, so an act V14 registers is covered the day it is registered. Same posture as the two guards V11 found had stopped agreeing with their own hand-written lists.

**The regression bar, which is what licenses a structural change of this size.**

```
  suite            973 passed across 57 files, up from 960 across 55
                   13 tests added, 0 changed, 0 removed
  toy canonical    172f83fb   unmoved, asserted in the suite
  act1 canonical   65b43d27   unmoved, asserted in the suite
  playthrough      10 purchases, 228226.225 ATP live
                              228210.962 across the absence
                   0.0067 percent disagreement against a 2 percent tolerance
                   139 ms continuous, 111 ms across the absence
  git diff         EMPTY across all three tuning files, docs/SCIENCE.md
                   and docs/ECONOMY.md
  tsc --noEmit     clean
  eslint           clean, including the determinism guard over src/content/**
```

The playthrough reproduces V11's figures to the digit, which is the assertion that the new-game path did not move: it starts a fresh cell, makes all ten purchases in order, meets the NAD+ wall and recovers, and lands on the identical tick both ways.

**No tuned number was added, so docs/ECONOMY.md is owed nothing.** `actStartState` introduces no scalar at all. Every number in a start state was already a number the act owned.

**The jump is not built, per step 5.** Nothing calls `actStartState` except the runtime and its tests.

---

# Stage 2 — The jump

```
The thin wrapper. Read stage 1's report first.

1. Jump to act N, where N comes from the act registry, so an act that does not
   exist is not offered. Today that is act 1 and act 3 if V14 has landed, which
   it has not, so at the time this log runs the list is short and that is fine.
   The mechanism is what is being built.

2. The mark in the save. A jumped session records that it was jumped and to
   which act. Diagnostic only, never branched on, exactly the posture
   docs/SAVE_SCHEMA.md Part 2 sets for meta.buildId. Then assert nothing
   branches on it, the same way V9 stage 4 was told to assert nothing branches
   on buildId. A field that becomes meaningful is a field somebody will be
   tempted to read.

   Check whether this needs a schema bump. Spine A's schema decision stage
   should have named when the next bump was expected; this may be it, or
   settings may absorb it as an additive scalar the way firstRunSeen did in V6.
   Whichever it is, follow hard rule 7 exactly: a bump needs a migration and a
   fixture captured while the previous version is live.

3. Determinism, in the narrow form. The same jump produces the same state every
   time. A session begun by a jump is internally deterministic. A jumped
   session saved and reloaded produces an identical hash. Do NOT claim that a
   jumped session matches a played one, because it does not and cannot, and
   docs/SIMULATION.md Part 5 already models how to scope a determinism claim
   into separate statements rather than one.

4. The offline path, against a jumped state. It is a legal state so it should
   just work, and "should just work" is the phrase this project has learned to
   distrust. Run the offline sweep from a jumped act 1 state and report the
   figures against V12's.

5. What the jump must not touch: the boundary set piece. A jump lands the
   player in an act; it does not play the transition. Those are different
   things and conflating them would mean the set piece has two triggers and one
   of them is a debugging tool.

Verify: the jump produces a state identical to the boundary's, the mark is
persisted and unbranched, determinism holds in the three narrow forms, and the
offline sweep is green from a jumped state. Report the schema decision, the
three determinism results, and the sweep figures.
```

## Stage 2 Report

**The jump exists, it is nine lines, and every hard question in this stage turned out to be about what happens around it rather than in it.**

```
  src/content/actJump.ts     resolveActJump(act, options?) -> ActJump | null
                             JUMPED_TO_ACT = 'jumpedToAct'
```

`findAct` answers, so an act this build does not have is not jumpable and registering act 3 makes it jumpable with no edit to that file. Null rather than a throw and rather than clamping, which is the posture V11 built `findAct` to make possible: clamping succeeds, quietly, at something other than what was asked. Asserted over the registry rather than over act 1, plus the four refusals: an act above the highest known, 0, a negative, and `1.5`, `NaN` and `Infinity`, which are numbers that are not act numbers at all.

**It defines no state. It asks stage 1's function for one**, and a test compares the jump's state against `actStartState`'s by hash and field for field. That is the whole of the log's stated risk and it is closed by construction rather than by discipline.

### The schema decision: no bump, and the reason it is not a judgement call

`settings` is `Readonly<Record<string, boolean | number | string>>`, an open bag the codec carries through untouched, and `jumpedToAct` is an additive key new code defaults. That is the V6 `firstRunSeen` case and the V11 `boundarySeen` case exactly, and it makes three additive settings keys shipped at version 1.

**docs/SAVE_SCHEMA.md Part 1 already named when the next bump is expected and this is not it.** V11 was told not to leave that decision as a silence and did not: the next bump is **the act 2 log**, forced by per-reaction Vmax becoming hashed simulation state, because there is no correct default for how damaged an enzyme is. A jump mark has a correct default, and the default is "absent means played". So hard rule 7 is not engaged, no migration is owed, and no fixture is needed.

**A number rather than a boolean**, because "was this jumped" and "to which act" are one fact rather than two. Two fields could disagree with each other and one cannot.

### The mark, and the four things asserted about it

Applied at construction rather than on the first write, because a mark applied later needs a flag to remember to apply it, which is a second copy of the same fact. Read from `settings` rather than from the `jump` option, which is the distinction that makes a reload work: **a session that reloaded a jumped save has no jump option and is still a jumped session.**

```
  written             capture().settings.jumpedToAct === 1, played saves have no key
  survives a reload   second runtime, no jump option, jumpedToAct() === 1
  preserved beside    firstRunSeen and boundarySeen written by two different
    other keys        sessions, all three present after a full save and load
  not simulation      1200 ticks marked and unmarked, hashes identical
```

**And a guard, on the V9 model, which fails the build if anything branches on it.** Ten patterns for comparison, regex, prefix tests, `switch` and `if`, applied to the settings key and to the `jumpedToAct()` accessor, plus a file-mention allowlist, plus a fourth assertion V9's version does not have: **no file under `src/ui/components/` or `App.tsx` may mention it at all.** That is the stronger property and it is the one stage 3 needs, because acts are sequential and nothing rendered should say a session skipped play.

**Proved by planting `if (runtime.jumpedToAct() === 3)` in `App.tsx` and reading the failure.** Three of the four assertions fired independently, on the mention list, on the branching patterns and on the interface-surface rule, and the planted line was reverted.

**Why this guard is worth more than the one it copies, recorded because it is the reason to keep it.** A build id is opaque, so branching on it is obviously wrong. A jump mark says a player skipped four hours of content, which is exactly the sort of fact a later log could reach for: to hide an achievement, to skip a teaching beat, to change what the endgame summary says. Every one of those turns a diagnostic into a game rule and makes a save that says something about itself into a save punished for saying it. The log's Decisions section rules that out in three words, "diagnostic rather than punitive".

**One small finding, which is V9's guard working exactly as designed.** `buildId.test.ts` failed the moment `actJump.ts` cited `meta.buildId` in a doc comment, because the guard is a substring search with an allowlist of files that legitimately **use** the field. The fix was to reword the comment rather than to widen the allowlist, because an allowlist that admits citations means two things at once, and the property worth keeping is that outside tests **a mention is a use**. It cost one sentence.

### Determinism, in three narrow forms, and the fourth claim measured rather than assumed

```
  1. the same jump produces the same state every time            PASS
  2. a session begun by a jump is internally deterministic       PASS
     including under irregular frame delivery, 7 51 3 120 16
     16 240 9 ms against the same game time in even ticks
  3. a jumped session saved and reloaded is hash-identical       PASS
     3000 ticks, buy fermentation, 1200 more, save, reload
```

Form 3 carries the thing stage 2 step 2 warned about. **`?ferment=on` does not survive a reload** because it enables a reaction without minting an unlock id, so a restored save has no ferment in `progression.unlocked`. A jump cannot have that bug because it produces a real state rather than a runtime override, and the test asserts the unlock list and `fermentUnlocked` come back rather than just the hash.

**The fourth claim is that a jumped session matches a played one, and it was measured. It came out TRUE, which is the opposite of what the test was written to assert.** Act 1, 1200 ticks each way, one cell jumped and one played with fermentation bought: **identical hashes.** Two reasons, and both are act 1 facts rather than jump facts:

1. **act 1's jump target is its own beginning**, because it is act 1, so there is nothing for a jump to fabricate
2. **unlock state is not hashed.** NOW.md has recorded since V4 that `setReactionEnabled` and `setReactionVmax` touch no pool, no tick count and no PRNG, which is precisely why `progression.unlocked` had to be persisted separately

So the hashes agree even though one cell has bought fermentation and the other has not. **Neither reason survives act 3**, where a jump has to fabricate a compartment and a transition that a played session earned. The test asserts the agreement in the direction it actually holds, so the day it stops being true the failure lands on a test that explains what changed.

**And this is the measurement that justifies the mark.** Two sessions whose simulation states are byte-identical: without the mark, a submitted save that skipped play would be indistinguishable from one that did not. Asserted directly, by capturing both and comparing the whole document with `settings` blanked. **The two saves differ in exactly two places, the settings key and the unlock list, and in nothing else.**

### The offline path against a jumped state

**Green, and the sweep figures are V12's rather than merely close to them, for a reason stronger than a comparison.**

```
  npm run offline:validate, 48 cases, seed 20260805

  worst ATP disagreement       3.903e-3   at case 13, glycogen-charged, 24.6 min
  worst, in ATP                88.9 of 22695 produced
  worst misplaced fraction     1.923e-2   at case 18, glycolytic-4
  worst conservation drift     1.417e-10  at case 15, glycolytic-4
  tolerance, ATP               2e-2
  tolerance, misplaced         1e-1
  fallbacks                    0
  budget exhaustions           0
  reference side               12.3 s against 0.77 s for the offline path

  every case inside tolerance.
```

**The sweep provably cannot have moved.** `git diff --name-only` for this whole stage is one file, `src/ui/runtime.ts`, and the sweep's import graph is `src/sim/**` plus `src/content/act1/**` and reaches the interface nowhere. So these are V12's figures because they are computed by V12's code.

**What that does not check is a jumped state going through the offline path**, so that was run separately and through the runtime. An eight-hour absence credited from a jumped save and from a played save agree on `creditedMs`, on `atpProduced` and on the resulting state hash, with `fellBack` false and `offlineFallbackCount` 0. A one-hour absence from a jumped save likewise does not fall back and does not exhaust the budget. **"It is a legal state so it should just work" is now measured rather than assumed**, which was the stage's own reason for asking.

### What the jump does not touch

**The boundary set piece has one trigger and it is still the act ending.** A jumped session 60 ticks in reports `actComplete` false and `boundarySeen` false, asserted, because a debugging tool that could fire an authored moment would give that moment two triggers.

**A descriptor mismatch throws.** A jump carries its own descriptor and the caller passes one positionally, so the two can disagree, and a runtime built on a disagreement would run one act's chemistry against another act's starting pools without complaining. `createActRuntime` refuses, with a message naming both acts. Same posture as `boundaryFor`, which throws on an act with no end condition.

### The one real cost, measured, and it is worse than the obvious guess

**A jump destroys the player's most recent save on its first write, and leaves no copy of it.**

The obvious guess is that the played save lands in the backup slot and is recoverable for one write. It does not. `createSaveStore` starts `activeKnownGood` at **false**, and its own comment says why: "a store that has never been loaded from has not established that its active slot is worth preserving, and refusing to promote costs one generation of backup depth on the first write of a session." That is correct for every session that existed before this log. **A jump is the first session in the project's history that deliberately does not load**, so it is the first one for which the active slot genuinely is worth preserving and the store has no way to know it.

Measured over three generations:

```
  session 1   new game, save            active = gen1   backup = none
  session 2   loads gen1, save          active = gen2   backup = gen1
  jump        does not load, save       active = jumped backup = gen1

  gen2, the player's most recent save, is in neither slot.
```

**So the player loses their latest save and keeps an older one**, which is the worst of the three possible outcomes to have to explain. Recorded as a passing test rather than as a note, so a later log that changes the behaviour fails there.

**Not fixed in this stage, deliberately.** Stage 2 builds the mechanism and stage 3 decides who can reach it, and this is the number stage 3 has to decide against rather than a defect stage 2 should have quietly patched. Nothing here is player-reachable yet, because nothing calls `resolveActJump` outside tests.

### Verify

```
  tsc --noEmit     clean
  eslint .         clean
  suite            1001 passed across 60 files, up from stage 1's 973 across 57
                   28 tests added, 3 files
  toy canonical    172f83fb   unmoved
  act1 canonical   65b43d27   unmoved
  offline sweep    48 cases, every case inside tolerance, 0 fallbacks
  git diff         one file, src/ui/runtime.ts. All three tuning files,
                   docs/SCIENCE.md and docs/ECONOMY.md untouched
```

No tuned number was added, so docs/ECONOMY.md is owed nothing.

---

# Stage 3 — Who can reach it

```
Access, and the rule it must not break.

1. docs/PROGRESSION.md says acts are strictly sequential. This affordance does
   not change that and must not become the thing that quietly does. No button
   on the act screen, nothing in the unlock shelf, nothing a player finds by
   exploring.

2. The route, and follow the existing precedent rather than inventing one.
   src/ui/scenario.ts already implements a development door as a query
   parameter and documents itself as one. Use the same mechanism and the same
   file if it fits.

   And learn from its one recorded flaw: ?ferment=on does not survive a reload,
   because it enables a reaction without minting an unlock id, so a restored
   save has no ferment in progression.unlocked. NOW.md records this so the next
   person is not confused by it. A jump must not have the equivalent bug, which
   means it produces a real state that persists rather than a runtime override.

3. What a teacher actually needs, which is the reason this is teacher mode's
   first half rather than a dev tool with a nice name. Someone with ten minutes
   wants to show a class the 2 to 30 payoff. Someone reviewing the science
   wants to reach the chemiosmosis beat without playing an act first.

   Whether a query parameter serves that or whether it needs a real surface is
   a product question, and this log should answer it in the report rather than
   assume the developer answer. If the honest answer is that a teacher will not
   type a query string, say so and record what V15 has to build.

4. Discoverability, deliberately low, and stated. This is not hidden because it
   is embarrassing. It is not surfaced because acts are sequential and a skip
   in the interface is a product decision nobody has taken.

Verify: the jump is reachable by the development route and by no player path.
Report the route, confirmation that a jumped state survives a reload including
the unlock ids, the honest answer to step 3, and a check that no interface
surface exposes it.
```

## Stage 3 Report

_Pending._

---

# Stage 4 — Coherence

```
Close the log out.

1. Full verify: npm run typecheck, npm run lint, npm run build, npm test,
   npm run sim, npm run sim:act1, npm run offline:validate, the headless
   playthrough. Report the test count and bundle size against V12's.

2. Confirm no simulation change and no visual change. This log adds a door. If
   a canonical hash moved, something was built that should not have been.

3. Update NOW.md:
   - Build state table: V13 done, with its "does not" column, which includes
     the whole of the rest of teacher mode.
   - The act jump under a short section, with the one definition rule from
     stage 1 stated as settled, because that is the durable decision here and
     the jump itself is the smaller half.
   - The determinism scoping in its three narrow forms, alongside the offline
     path's, because a reader who finds one and not the other will assume the
     wrong thing.
   - The honest answer to stage 3 step 3, as work V15 inherits.
   - "Next, in order": V14, act 3. And the act ordering decision, which is
     still open and which V14 is now blocked on.

4. State the open ordering decision as blocking for the first time. It has been
   open since the engineering review and it has cost nothing because everything
   before this could proceed. V14 cannot. Act 3's payoff needs oxygen as the
   terminal electron acceptor and act 2 is what supplies it, so V14 either
   accepts a placeholder oxygen constant with a DEPARTURE row and a rebalance
   when act 2 lands, or the order flips and V14 becomes act 2.

   That is a decision for a person, and this log is the last one that can be
   finished without it.

Verify: everything green, no canonical hash moved. Report the test count, the
bundle size, the NOW.md diff summary, and the ordering decision stated as
blocking with both exits named.
```

## Stage 4 Report

_Pending._

---

# After These Stages

- Act 3 is reachable in a minute, which is what makes V14 testable at all. Every stage of V14 would otherwise begin by playing act 1.
- **There is one definition of what an act looks like at its beginning**, and the jump is a second caller of it rather than a second copy. That is the durable thing this log produced and it is worth more than the door.
- The original justification for scheduling this early has partly expired and the log says so instead of repeating it. Act 3 follows act 1 directly while act 2 is unbuilt, so nobody is skipping six hours.
- A jumped save says it was jumped, and nothing branches on that, which is the same posture `meta.buildId` has carried since V4 and has never been tested until now.
- **The act ordering decision is now blocking.** It has been open since the engineering review and cost nothing until this moment, because everything scheduled before V14 could proceed without it. V14 cannot start until somebody decides.
