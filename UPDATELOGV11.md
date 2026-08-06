charlie

# krebs, V11: Spine A, the Structural Half
# Work on one stage at a time. Do NOT combine stages.

---

## Context

Read `NOW.md` first, then `docs/designs/game-spine-and-four-acts.md` in full, then `src/ui/runtime.ts` from top to bottom. That last one is the point of this log and reading it is not optional.

**This project can only run act 1, and not because of the content.** The content layer is already act-shaped: `src/content/act1/` holds pools, reactions, tuning and a save mapping, and `src/content/README.md` states the one rule, which is that content depends on `src/sim/` and never the reverse. That rule has held since V2 and it is why act 2's content can be written at all.

**The obstruction is one layer up.** `src/ui/runtime.ts` is 1142 lines and every type it exports is named for act 1: `Act1Snapshot`, `Act1SnapshotListener`, `Act1PersistenceOptions`, `Act1Session`, `Act1OfflineReport`, `Act1RuntimeOptions`, `Act1Runtime`, `createAct1Runtime`. Roughly 750 lines across 59 files mention act 1 by name.

**And it is worse than names.** The runtime carries act 1 *semantics*, hardcoded:

```
  runtime.ts:207   const WALLED_NAD = 0.05
  runtime.ts:428   createAct1(options.act1 ?? {})
  runtime.ts:480   state.pools.indexOf('g3p')
  runtime.ts:483   reactionIndex('payoff')
  runtime.ts:484   reactionIndex('uptake')
  runtime.ts:485   state.pools.indexOf('nad')
  runtime.ts:550   state.reactions[reactionIndex('ferment')]
  runtime.ts:763   amounts[nadPool] < WALLED_NAD
  runtime.ts:1129  ACT1_POOL_IDS.indexOf(id)
  poolCards.ts:58  type CardKind = ... 'nicotinamide' | 'adenylate'
  poolCards.ts:99+ eight cards, hand-written, act 1 pool ids
```

A walled-cell threshold, a hard-coded constructor, five literal pool and reaction ids, act 1 chemistry as a TypeScript union, and a linear scan called once per render. **Act 2 cannot be written on top of this without either copying the file or renaming it mid-log**, and the second of those means a structural change and a behavioural change land in one diff, which is the one thing you never do.

**So this log makes the change easy, and does not make the change.** No new content, no new act, no new visual surface. What ships is a project that could run a second act if a second act existed.

**One thing this log deliberately does not do, and the reason is in this repository already.** It does not design the act descriptor's full shape. `src/sim/jump.ts` refuses the same temptation in as many words: "THE SEAM IS LEFT OBVIOUS AND IS NOT PRE-SOLVED. Act 2's oxygen schedule is a boundary in wall-clock rather than in a pool level. Neither is answerable from act 1 and neither is guessed at here." `NOW.md` states the lesson twice as settled: a wrong sentence in a specification survives until something is built on top of it, found once in DESIGN.md and three times in `docs/SIMULATION.md` Part 3. **An act descriptor designed against one act is that sentence waiting to happen.** It gets exactly the fields act 1 needs. Act 2 widens it, with two instances to be right about.

## Decisions

- **Structural only. Not one behavioural change in the whole log.** Every stage is a move, a rename or a lift. The regression bar is the same one V7 and V8 both closed on and it is absolute: both canonical hashes unchanged, the full suite green, and `git diff` empty across the three tuning files, `docs/SCIENCE.md` and `docs/ECONOMY.md`. **The one exception is stage 4**, which adds an ending act 1 did not have, and it is fenced into that stage for exactly that reason.
- **The act 1 canonical hash is whatever V10 left it at, not `49ea08d3`.** V10 added pools and starting amounts are hashed state, so it moved. Read the current value out of the assertion before stage 1 and treat that as the bar. Do not copy a number out of this document into a test.
- **The descriptor gets act 1's fields and nothing speculative.** No `oxygenSchedule`, no `damageModel`, no `compartments`. If a field has no act 1 caller it does not exist yet. A registry that is right about one act and honest about it is worth more than one that is confidently wrong about four.
- **`WALLED_NAD` is the test case for the whole refactor.** It is a threshold on a specific pool that means "this cell has hit its wall", and act 2's wall is not a NAD+ level. So it cannot stay a module constant and it cannot become a generic. It becomes a thing the act descriptor supplies, and if that shape is awkward for act 1 it will be much worse for act 2, which is what makes it the useful one to get right first.
- **The linear scan gets fixed here because this is the stage that touches it.** `poolIndex` is `ACT1_POOL_IDS.indexOf(id)`, called per render from `PoolCard`. Ten ids today. Act 3 has a compartment in it. The kernel already holds the rule in two places, `pools.ts` freezes an id-to-index map and `steady.ts` says no allocation after construction and indexed loops over typed arrays only. The runtime never got the same rule and this is when it does.
- **The guards learn to look rather than being told where to look.** `accessibility.test.ts` lists ten component paths in an array while `src/ui/components/` holds twenty, and nine of the ten missing shipped after the guard was written, so the hole has been widening every log. V7's own rule applies: a guard that agrees with itself is not a guard. This one agrees with its own list.
- **A schema DECISION, not a schema bump.** `SaveV1` already carries `progression.act` documented as 1 to 4, `transitionTaken` and `shuttleChoice` labelled act 3, `enzymes[].damage` and the oxygen schedule index labelled act 2, and `settings` as an open bag. The project has twice added persisted state without bumping. The default outcome of stage 7 is no bump, and **if it is no bump it must name when the next bump is expected**, because a migration chain that never runs again is a mechanism going quietly dormant.
- **`progression.act` stops being decorative in this log and that creates a new failure.** It is currently written and read by nothing. After stage 1 it selects which act to run. A save naming an act this build does not have becomes an undefined lookup, and there is no backend, no accounts and no way to push a fix to one player. It gets a refusal, mirroring the one `migrations.ts` already has for a future schema version.
- **Act 1 gets an ending and act 2 is four logs away.** `docs/designs/game-spine-and-four-acts.md` schedules act 2 last, so the finish line built in stage 4 leads nowhere for most of the remaining roadmap. That state gets authored rather than left to happen, because a screen that keeps ticking after the last content reads as the game breaking rather than as the game ending, and `NOW.md` has carried the smaller version of this since V5.
- Large structural feature, no behavioural change, and the whole project depends on it afterwards: seven stages.

## The regression bar, stated once so every stage can point at it

```
  both canonical hashes         unchanged from V10's values
  npm test                      green, count not lower than V10's
  git diff, stages 1 to 3 and 5 to 7:
    src/content/act1/tuning.ts    empty
    src/ui/tuning.ts              empty
    src/save/tuning.ts            empty
    docs/SCIENCE.md               empty
    docs/ECONOMY.md               empty
  npm run offline:validate      green, same figures as V10
  reload determinism sweep      36 cases green
```

**This is not a formality and it is the whole safety net.** 503-plus tests, both hashes, a 36-case reload sweep and a 40-case offline sweep already exist and none of them was written for this refactor. That is what makes a rename of this size affordable at all. A stage that cannot clear this bar has changed behaviour and should stop rather than explain.

---

# Stage 1 — The act registry, at minimum shape

```
Make an act a thing rather than an assumption. Add nothing act 1 does not use.

1. src/content/acts.ts. A descriptor per act and a registry over them. Act 1 is
   the only entry. Read src/content/act1/ and let the descriptor's fields fall
   out of what the runtime currently reaches into act 1 for, rather than from
   what act 2 might want.

   The list of what to look for is in this log's Context: the constructor, the
   pool and reaction ids the runtime names literally, the walled threshold, and
   whatever else reading runtime.ts turns up. Report the full list you found
   before you design anything, because that list IS the descriptor's shape and
   anything else is invention.

2. The rule that must not break: src/content/ may import src/sim/ and never the
   reverse, and src/ui/ imports both while neither imports it.
   src/content/README.md states the first half and it has held since V2. A
   registry that the kernel reaches for would break it in the most expensive
   possible place. Check the import direction explicitly and report it.

3. What the descriptor does NOT get, listed in the report as a deliberate
   absence: no oxygen schedule, no damage model, no compartments, no field
   without an act 1 caller. src/sim/jump.ts leaves act 2's seam obvious rather
   than pre-solving it and says why. Do the same and say so.

4. Lookup by act number, and the unknown case is a real case rather than an
   undefined. progression.act is a number the save has always written and
   nothing has ever read. Stage 5 builds the refusal path; this stage just has
   to make the unknown case representable instead of a crash.

5. Do not wire it up. Nothing consumes the registry in this stage. It compiles,
   it is tested for its own shape, and the runtime is untouched. Wiring is
   stage 2 and mixing the two is how a structural change acquires a behaviour
   change nobody meant to make.

Verify: the registry compiles and its own tests pass, the full suite is green,
and the regression bar is clean. Report the list of act 1 reach-ins found in
step 1, the descriptor's fields with a caller for each, the deliberate
absences from step 3, and the import direction check.
```

## Stage 1 Report

`src/content/acts.ts` exists, `src/content/__tests__/acts.test.ts` tests it, and nothing consumes it. The runtime is byte-identical.

**The reach-ins found in `src/ui/runtime.ts`, which is the list the descriptor's shape came from.** Read top to bottom rather than grepped, because four of the eleven are not the word "act1".

```
  line   what the runtime reaches into act 1 for
  ----   ------------------------------------------------------------------
   476   createAct1(options.act1 ?? {})            construction
   477   createAct1MeterProbes(state)              the meter's probes
   478   createAct1Meter()                         the meter
   528   state.pools.indexOf('g3p')                literal, yield baseline
   531   reactionIndex('payoff')                   literal, walled condition 1
   532   reactionIndex('uptake')                   literal, walled condition 2
   533   state.pools.indexOf('nad')                literal, walled condition 3
   228   const WALLED_NAD = 0.05                   the threshold itself
   556   recordAct1Tick(ticked, probes, meter)     metering, per tick
   720   createAct1OfflineObserver(probes, meter)  metering, across a jump
   807   atpPerCompletedGlucose(meter, delta)      yield readout
   808   netAtpPerCompletedGlucose(meter, delta)   yield readout
   713   ACT1_POOL_IDS                             offline report pool naming
   874   captureAct1(...)                          the save mapping, out
   465   restoreAct1(save)                         the save mapping, in
   504   ACT1_NO_CARRIED_COUNTERS                  carried-counter default
  1311   ACT1_POOL_IDS.indexOf(id)                 poolIndex, per render
  1316   ACT1_REACTION_IDS.indexOf(id)             reactionIndex
```

Plus, outside `runtime.ts` and named by the log's Context: `poolCards.ts:59`'s `CardKind` union, which puts act 1 chemistry (`'nicotinamide'`, `'adenylate'`) into a TypeScript type, and the ten-card literal below it written against `Act1PoolId`. Both are interface-side and cannot move into `src/content/`, because content may not import the interface. Stage 2 handles them where they live.

**The descriptor's fields, with the caller each one exists for.** Eighteen members, no field without a caller above.

```
  act                        registry key; progression.act, which stage 5 reads
  poolIds                    snapshot layout, offline report pool naming
  reactionIds                snapshot layout
  poolIndex, reactionIndex   runtime.ts:1311 and :1316, map-backed
  create                     runtime.ts:476
  createMeter                runtime.ts:478
  createMeterProbes          runtime.ts:477
  recordTick                 runtime.ts:556, the loop's tick observer
  createOfflineObserver      runtime.ts:720
  yieldBaselinePoolId        runtime.ts:528, the 'g3p' literal
  atpPerCompletedGlucose     runtime.ts:807
  netAtpPerCompletedGlucose  runtime.ts:808
  isWalled                   runtime.ts:828 to :831, and WALLED_NAD with it
  capture                    runtime.ts:874
  restore                    runtime.ts:465
  noCarriedCounters          runtime.ts:504
```

**`isWalled` is a predicate rather than a threshold and that is the design decision in this stage.** The log calls `WALLED_NAD` the test case for the whole refactor and it is. A field named `walledNad` keeps act 1's chemistry in a general interface. A field named `walledPoolId` plus a number is worse, because it also asserts that every act's wall is one pool crossing one level, which act 2's is not. So the act answers the question: `isWalled(amounts, appliedFlux, stoppedFlux)`, closing over three indices resolved at module load, allocating nothing, callable from the per-frame path. `ACT1_WALLED_NAD = 0.05` now lives beside act 1's descriptor and nowhere else.

**The deliberate absences, listed because they are the point of the stage.** No oxygen schedule. No damage model. No compartments. No act boundary condition, which is stage 4's and would have been a guess here. No unlock model: act 1's ladders, thresholds and purchase gates stay on the runtime, because a generic unlock descriptor designed against one act's two sequential ladders is exactly the abstraction over n=1 that this log's Context forbids. `src/sim/jump.ts` refuses the same temptation about act 2's oxygen seam and says so in its header; the same paragraph is now in `acts.ts`.

**Four type aliases point at act 1 and the file says so rather than hiding it.** `ActMeter`, `ActMeterProbes`, `ActRestoreResult` and `ActCarriedCounters` are act 1's shapes under act-neutral names. Widening them into structural interfaces now would be inventing act 2's requirements out of act 1's. When act 2 brings a meter of its own they become whatever it actually needs.

**The import direction check, run rather than asserted in prose.** `src/content/acts.ts` imports `src/sim/` for types, `src/content/act1/` for the act it registers, and `src/save/schema` for the save shape the mapping returns, which is a path `src/content/act1/save.ts` has already taken since V4. Nothing in `src/sim/` imports it. Four tests in `acts.test.ts` walk both trees and check it: no source file under `src/sim/` imports anything matching `content`, no file under `src/sim/` or `src/content/` imports the interface, and a guard-the-guard asserts both walks found files, so a silent zero cannot pass.

**Verify.** `npm run typecheck` clean, `npm run lint` clean, **559 tests across 43 files, up from V10's 540 across 42**, all green. Regression bar: both canonical hashes unchanged, `172f83fb` and `65b43d27`, asserted by the two determinism tests that were already there. `git diff` empty across `src/content/act1/tuning.ts`, `src/ui/tuning.ts`, `src/save/tuning.ts`, `docs/SCIENCE.md` and `docs/ECONOMY.md`. `npm run offline:validate` green, 47 cases, 0 fallbacks, 0 budget exhaustions, worst ATP disagreement 3.903e-3 against a 2e-2 tolerance, identical to V10.

One test asserts the thing that matters most for stage 2: a simulation built through `ACT1.create()` and one built through `createAct1()` hash identically at construction and again after 200 ticks.

---

# Stage 2 — The runtime, de-specialised

```
The largest rename in the project's history and not one behaviour change in it.
Read the regression bar above before starting and check it after every commit
rather than at the end.

1. The types. Act1Snapshot to ActSnapshot, Act1Runtime to ActRuntime,
   createAct1Runtime to createActRuntime taking a descriptor, and the same for
   Act1SnapshotListener, Act1PersistenceOptions, Act1Session,
   Act1OfflineReport and Act1RuntimeOptions. Follow every call site. There are
   roughly 750 matching lines across 59 files, so expect this to reach further
   than it looks.

2. The semantics, which is the part that is not a rename. Each of these moves
   into the descriptor:
     - WALLED_NAD, currently a module constant at runtime.ts:207. It is "this
       cell has hit its wall" expressed as a NAD+ level, and act 2's wall is
       not a NAD+ level. Give the descriptor a way to answer "is this act
       walled" rather than giving it a number called WALLED_NAD, or the shape
       is wrong in a way that only shows up in act 2.
     - createAct1(options.act1 ?? {}) at :428. Construction comes from the
       descriptor.
     - the literal ids at :480 to :485 and :550. g3p, nad, payoff, uptake,
       ferment. These are act 1 asking itself questions about itself and the
       descriptor is where the questions live now.
     - poolCards.ts:58's CardKind union, which puts act 1 chemistry
       (nicotinamide, adenylate) in a type, and the hand-written eight-card
       literal below it. The geometry already derives from the pool table.
       The grouping does not.

   Do each one as its own commit against the regression bar. If a commit moves
   a hash, the previous commit was not behaviour-preserving and the answer is
   to back it out rather than to update the expected hash.

3. poolIndex, at runtime.ts:1129, is ACT1_POOL_IDS.indexOf(id), a linear scan,
   called per render from PoolCard.tsx. Replace it with a map built once at
   construction, which is what src/sim/pools.ts already does for the kernel and
   what src/sim/steady.ts states as a rule.

   Assert it rather than trusting it: a test that the map is built once, and a
   test that the render path and the per-frame subscriber path do no key lookup
   and allocate nothing across many frames. This is the one class of regression
   the existing 503 tests cannot catch, because every one of them asserts a
   value rather than the shape of the work that produced it.

4. The three clocks do not move. The simulation runs at fixed 20Hz over a
   mutable Float64Array, the display samples one preallocated snapshot per
   requestAnimationFrame, and React re-renders only on discrete events. That is
   the project's central architectural claim. A refactor that put an act lookup
   inside the rAF subscriber would break it silently and pass every test.
   Confirm the boundary is where it was.

5. Nothing else. No new component, no new content string, no tuned number, no
   act 2 anything. If a change feels like an improvement rather than a move,
   it belongs in another log.

Verify: the regression bar, in full, quoted. Report both canonical hashes, the
test count, the five empty diffs, the offline sweep figures, the commit
sequence from step 2 with the bar checked at each, the poolIndex assertions
from step 3, and confirmation that the three-clock boundary is unmoved.
```

## Stage 2 Report

**The regression bar, quoted, checked at every commit and clean at all four.**

```
  both canonical hashes         172f83fb  and  65b43d27      unchanged from V10
  npm test                      568 across 44 files          green, up from 540
  git diff, whole stage:
    src/content/act1/tuning.ts    empty
    src/ui/tuning.ts              empty
    src/save/tuning.ts            empty
    docs/SCIENCE.md               empty
    docs/ECONOMY.md               empty
  npm run offline:validate      47 cases green, 0 fallbacks, 0 budget
                                exhaustions, worst ATP disagreement 3.903e-3
                                against a 2e-2 tolerance. V10's figures
  reload determinism sweep      36 cases green
  npm run sim, npm run sim:act1 green
  npm run build                 286.41 kB, 88.77 kB gzipped
```

**The commit sequence, four commits, the bar checked at each.**

```
  1  the rename          8 types across 17 files. Typecheck, lint, suite green
  2  the semantics       construction, meter, save, offline, walled, the five
                         literal ids. 559 green, hashes unmoved
  3  the cards           CardKind stops naming molecules, the layout goes
                         act-scoped, the rail reads the running act
  4  index resolution    the map, the hooks, and 9 assertions on both paths
```

**Nothing moved a hash, so nothing had to be backed out.** The one place that could have is commit 2, because it replaced the constructor: `ACT1.create()` and `createAct1()` are asserted equal by hash at construction and again after 200 ticks, which stage 1 put in place for exactly this commit.

**1. The rename.** `Act1Snapshot`, `Act1SnapshotListener`, `Act1PersistenceOptions`, `Act1Session`, `Act1OfflineReport`, `Act1RuntimeOptions`, `Act1Runtime` and `createAct1Runtime` are `ActSnapshot`, `ActSnapshotListener`, `ActPersistenceOptions`, `ActSession`, `ActOfflineReport`, `ActRuntimeOptions`, `ActRuntime` and `createActRuntime`. Seventeen files. `ActRuntimeOptions.act1` is `create` and takes `ActCreateOptions` rather than `Partial<Act1Options>`.

**2. The semantics, which is the part that was not a rename.**

- **`WALLED_NAD` is gone from `src/ui/runtime.ts` and the runtime no longer knows what a wall is.** `snapshot.walled` is one line, `descriptor.isWalled(state.pools.amounts, snapshot.appliedFlux, STOPPED_FLUX)`. The three conditions and the 0.05 moved to `src/content/acts.ts` unchanged, with their reasoning attached.
- **Construction, the meter, the offline observer and the save mapping all come from the descriptor.** `descriptor.create(options.create)`, `createMeterProbes`, `createMeter`, `recordTick`, `createOfflineObserver`, `capture`, `restore`, `noCarriedCounters`, `atpPerCompletedGlucose`, `netAtpPerCompletedGlucose`.
- **The five literal ids are gone.** `'g3p'` became `descriptor.yieldBaselinePoolId` and the two locals renamed with it, `g3pIndex` and `g3pInitial` to `baselineIndex` and `baselineInitial`, because a variable named after a molecule is the same defect one level down. `'payoff'`, `'uptake'` and `'nad'` live inside `isWalled`. `'ferment'`, `'ferment_ethanol'` and `'store'` on the snapshot's initial unlock flags go through `descriptor.reactionIndex`.
- **`CardKind` stopped naming molecules.** `'simple' | 'nicotinamide' | 'adenylate' | 'branch-products'` became `'simple' | 'mix' | 'pair' | 'products'`. Each name says what the card does with the pools it is given rather than which pools it was written for, so the four kinds are available to every act. The card table is unchanged under the new names and `PoolCard`'s two `kind === 'nicotinamide'` branches are `kind === 'mix'`.
- **The card layout is act-scoped and stayed in `src/ui/`.** `poolCardsFor(act)` off a map keyed by act number, and `PoolRail` calls it with `useAct()`. It could not move into the descriptor and the reason is the import rule: a card carries a `Surface`, a `CoachMark` and player-facing `Entry` strings, and content may not import the interface. So the descriptor answers what the act is and the card table answers what it looks like, keyed by the same number. `PoolCardSpec.stocks` and `.headline` are `string` rather than `Act1PoolId`, which needed one new accessor, `moleculeName(id)` in `content.ts`, throwing on an unknown id rather than rendering a blank label.

**3. `poolIndex`, and the assertion that no existing test could have made.** The two module-level functions are deleted rather than rewritten. They were `ACT1_POOL_IDS.indexOf(id)`, and they were also the last two places in `runtime.ts` that answered for act 1 on everyone's behalf. The replacement is `descriptor.poolIndex`, backed by a map built once at module load, reached through three new hooks in `RuntimeContext`: `useAct`, `usePoolIndex` and `useReactionIndex`, the last two memoised on the act.

`src/ui/__tests__/indexResolution.test.tsx`, nine assertions in three groups:

```
  the map is built once
    resolving every pool and reaction id does 0 array scans and 0 map writes
    ten thousand resolutions do 0 and 0
    the OLD implementation, restored inline, does more than 0    <- the probe
    every id still resolves to the index the kernel gives it
  the per-frame path
    500 frames: 0 resolutions beyond construction, 0 scans, 0 map writes,
                and the same six typed arrays handed out on all 500
    200 frames with the walled predicate live: 0 resolutions, 0 scans
  the render path
    one mount of the whole rail resolves exactly construction + 25, where
      25 is computed from the card table rather than written down
    rendering the rail does fewer scans than there are cards
    the rail's cards are the act's cards
```

**Two things were found by writing the test rather than by reading the code.** The first assertion of array identity was an `expect` inside the per-frame subscriber, which measured vitest at 264 array scans per frame, because `expect` scans arrays and the probe was live. It counts and asserts afterwards now, and the comment says why. The second was the rail's expected count coming out at 29 against 25: `RuntimeProvider` builds a runtime during the render and construction resolves four ids of its own. The test measures construction separately rather than absorbing four into a hardcoded number.

**What this file honestly cannot assert, said rather than faked.** The test environment is `node` with no DOM, so a mounted tree cannot be re-rendered and "a re-render resolves nothing" is not directly testable here, exactly as `keyboard.test.tsx` says about focus. What is asserted instead is stronger than it sounds: resolution does no scan and no map construction at all, and the per-frame path resolves nothing. A component resolving inside its render body cannot satisfy the render-path count without also failing the per-frame count.

**4. The three clocks have not moved.** The simulation is still fixed 20Hz over a mutable `Float64Array`, the display still samples one preallocated snapshot per `requestAnimationFrame`, and React still re-renders only on discrete events. Two changes were checked against that boundary specifically. `fill()` gained one descriptor call, `isWalled`, which closes over indices resolved at module load and does no lookup, asserted at 0 resolutions across 500 frames. And `useAct()` returns `runtime.act`, one stable reference held in `useState`, so subscribing components do not re-render when it is read. The 500-frame test also asserts the six snapshot arrays are the same six objects on every frame, which is the property the whole architecture rests on and which nothing had ever asserted directly.

**5. What deliberately did not move, reported rather than left to be noticed.** The purchase surface on `ActRuntime` is still act 1's: `buyFerment`, `buyEthanol`, `buyGlycogen`, `buyPfk1Pk`, `buyUptakeStep`, `buyGlycolysisStep` and their six `canBuy` twins, the two ladders in `src/ui/tuning.ts`, and the `ACT1_UNLOCK_*` ids. Generalising them means designing an unlock descriptor against one act's two sequential ladders and one two-enzyme purchase, which is the abstraction over n=1 this log's Context forbids and this log's Decisions fence off. `src/sim/jump.ts` leaves act 2's seam obvious for the same reason. Act 2 is what widens it, with two instances to be right about.

---

# Stage 3 — content.ts becomes a directory, and the guards learn to look

```
Two structural moves that belong together because the second protects the
first.

1. src/ui/content.ts is 957 lines and holds every player-facing string in the
   game. Split it into a directory, grouped by surface rather than by type,
   because a person looking for a string is looking for the screen it is on.

   One import stays circular-adjacent and the reason is structural rather than
   convenient: Badge.tsx renders the four badge words and content.ts imports
   Badge to build every badge in the game. contentStyle.test.ts already carries
   that exemption with its reasoning attached. The split is an opportunity to
   remove it. If it cannot be removed cleanly, keep it and keep the reasoning,
   and say which happened.

2. contentStyle.test.ts points at exactly one path, join(ROOT,'src','ui',
   'content.ts'). After the split that file does not exist. The guard will fail
   loudly, which is correct behaviour, and then it needs to walk the directory
   the way it already walks the component tree.

   The subtle failure to avoid: the .tsx side of that guard walks and has a
   guard-the-guard on the walk. The content side has neither. A content file
   the guard does not reach is a file whose strings are never style-checked,
   and that failure is silent rather than loud. Give the content walk the same
   guard-the-guard the component walk has.

3. accessibility.test.ts lists ten component paths in an array while
   src/ui/components/ holds twenty. About.tsx, Announcer.tsx, Blob.tsx,
   CoachMark.tsx, FirstRunCard.tsx, OfflineReturn.tsx, Overlay.tsx,
   PathwayCard.tsx, PoolRail.tsx and TeachingPanel.tsx are outside the
   semantic-colour-as-text rule entirely. Nine of those shipped after the guard
   was written.

   Make it walk. Add a guard-the-guard on the count. Then report what the
   widened guard finds, because ten components that have never been checked
   will probably not all be clean, and each failure is a real accessibility
   defect that has been shipping since V6.

4. Probe both guards by breaking the thing they guard, not by reading them.
   That is V7's rule and it was earned: two of V7's five probes found the
   assertion rather than the code, including a contrast test that hardcoded the
   value it was checking.

5. Fix whatever step 3 surfaces, or report it as a defect if a fix is a design
   decision rather than a repair. A semantic colour used as text is a repair. A
   contrast failure that can only be fixed by moving a palette token is a
   design decision and belongs to V12's DESIGN.md stage.

Verify: both guards walk, both have a guard-the-guard, both were probed by
breaking their subject, the suite is green and the regression bar is clean.
Report the directory layout, whether the Badge exemption survived, every
finding from the widened accessibility guard with a repair or a referral for
each, and the quoted output of all four probes.
```

## Stage 3 Report

**`src/ui/content.ts` is gone and eleven files stand where it stood. Grouped by surface, because a person looking for a string is looking for the screen it is on.**

```
  src/ui/content/
    index.ts          the barrel. Re-exports only, declares nothing
    common.ts         the Entry shape, PART1, PART2, ABOUT_THE_BUILD
    molecules.ts      MOLECULES, moleculeName, CARRIER_PAIRS, BRANCH_PRODUCTS
    pathway.ts        REACTIONS
    topBar.ts         READOUTS, WORDMARK
    poolRail.ts       POOL_FIGURES, carrierState, FIGURE_LABELS,
                      CARRIER_READOUT, blobReadout
    shelf.ts          UNLOCKS, SHELF
    announcements.ts  LANDMARKS, ANNOUNCEMENTS, unlockAffordable, unlockBought
    teaching.ts       COACH, the three coach marks, YIELD_PANEL,
                      PANEL_AFFORDANCE
    about.ts          DISCLOSURE, FIRST_RUN, ABOUT
    offline.ts        OFFLINE_RETURN
    save.ts           SAVE
```

**One file is not a surface and that is deliberate.** `molecules.ts` holds the names the pool rail, the pathway card and the coach marks all say. A name that lived on one surface would be restated on the other two, which is the drift docs/CONTENT_STYLE.md Part 3 exists to stop. Every other file is a screen.

**`index.ts` is a re-export and nothing else**, so every existing `from '../content'` import resolves unchanged. The split cost zero import edits at the fifty-odd call sites, and a component that wants to be specific can name the surface file directly. No string is declared in it, and the guard scans it anyway, because a string smuggled into a barrel file is exactly what a walk keyed on "the files that hold strings" would let through.

**The Badge exemption survived, and the reasoning changed rather than the rule.** It could not be removed cleanly. The cycle moved one level down instead of going away: `common.ts` holds `Entry`, `Entry` is typed against `BadgeSpec`, and `BadgeSpec` lives in `Badge.tsx`, so `Badge.tsx` would still be importing its own four words back out of the directory that types itself against it. Removing it properly means moving the badge contract out of the component, which is a change to what a badge IS rather than to where strings live, and stage 2's own rule applies: a change that feels like an improvement rather than a move belongs in another log. The exemption's comment now says where the cycle sits.

**Both guards walk and both have a guard-the-guard.**

`contentStyle.test.ts` pointed at `join(ROOT,'src','ui','content.ts')`. It failed loudly the moment that file stopped existing, which is correct behaviour and is what the stage predicted. It walks `src/ui/content/` now. **The subtle failure the stage named was real and is closed**: the `.tsx` half has walked `src/` since V6 and had a guard-the-guard on the walk; the content half had neither, and a walk fails differently from a path. A path throws. A walk quietly reaches fewer files and every assertion under it passes. The new assertion compares what the walk reached against `readdirSync` of the directory, so a file the walk misses fails rather than passing.

`accessibility.test.ts` listed ten component paths in an array while `src/ui/components/` holds twenty. It walks now, and the walk is asserted against the directory listing with a floor of twenty. Two more assertions came with it: the ten that were outside the guard are named explicitly, so a future narrowing has to delete that line on purpose, and one assertion proves the contents are in the scanned string rather than only the filenames being in an array. `Blob.tsx` was being read separately at one call site, which is the same defect one level down, and it is inside the walk now.

**What the widened guard found: nothing to repair, and that is a real result rather than an absent one.**

```
  About.tsx          clean
  Announcer.tsx      clean
  Blob.tsx           clean
  CoachMark.tsx      clean
  FirstRunCard.tsx   clean
  OfflineReturn.tsx  clean
  Overlay.tsx        clean
  PathwayCard.tsx    four semantic colours, all of them FILLS
  PoolRail.tsx       clean
  TeachingPanel.tsx  clean
```

Zero uses of `text-<semantic>`, zero writes of a semantic colour into `style.color`, zero uses of `text-ink3` or `var(--color-ink3)` across all ten. `PathwayCard.tsx`'s four are `SUBSTRATE`, `ATP_ORANGE`, `var(--color-oxidized)` and `var(--color-reduced)` used as blob fills, which is what the rule permits: a semantic colour fills and ink writes. So there is no repair and no referral. **That is luck rather than diligence**, since nine of these ten shipped after the guard was written and nothing was checking them, and the honest reading is that V7's palette discipline held by habit for four logs. It is mechanism now.

**One residual hole, reported rather than fixed.** The contrast pair table in the same file is still enumerated by hand: `pairs()` lists what the act screen renders rather than deriving it from the components. That is a smaller version of the same "guard agrees with its own list" problem, and the tokens and the dim are both read from source so it cannot silently drift on values, only on coverage. Deriving rendered pairs from component source is its own piece of work and is not what this stage asked for. Named here so the next log inherits it rather than discovers it.

**All four probes, run by breaking the thing each guards, output quoted.**

Probe 1, a violating string in a content file the walk newly reaches, `text: 'Welcome back!'` added to `offline.ts`:

```
  FAIL  contentStyle.test.ts > uses no exclamation mark anywhere
  AssertionError: expected [ 'Welcome back!' ] to deeply equal []
    + [ "Welcome back!" ]
```

Probe 2, the content walk narrowed to miss one file:

```
  FAIL  contentStyle.test.ts > reaches every file in the content directory
  AssertionError: expected [ 'about.ts', ...(10) ] to deeply equal [ 'about.ts', ...(11) ]
    -   "offline.ts",
```

Probe 3, `text-gain` added to `About.tsx`, which was outside the guard until this stage:

```
  FAIL  accessibility.test.ts > uses no semantic colour as a Tailwind text utility
  AssertionError: expected 'text-gain flex max-w-[52ch] flex-col ...' not to match /\btext-gain\b/
```

Probe 4, the accessibility walk narrowed back to V7's exact ten:

```
  Failed Tests 6
  FAIL  accessibility.test.ts > redox state survives the loss of colour, through a level rule in ink
  AssertionError: expected '/**\r\n * The badge contract. DESIGN....' to contain 'redox-level'
  ... plus the guard-the-guard on the walk and four more channel rows
```

Probe 4 is the most useful of the four, because it fails in six places rather than one: narrowing the list breaks the channel table as well as the walk assertion, since `Blob.tsx` is only reachable through the walk. The old shape had that file pulled in by hand at the single call site that needed it, and nothing else in the guard could see it.

**Verify.** `npm run typecheck` clean, `npm run lint` clean, **572 tests across 44 files**, all green, up from stage 2's 568. Regression bar clean: both canonical hashes unchanged at `172f83fb` and `65b43d27`, `git diff` empty across the three tuning files, docs/SCIENCE.md and docs/ECONOMY.md. `npm run build` 286.42 kB, 88.79 kB gzipped, unchanged from stage 2 to a hundredth of a kilobyte, which is the expected result for a file split: the bundler was already tree-shaking one module and now tree-shakes eleven.

**One lesson recorded because it cost real work.** The first run of probe 2 was done with the guard's own edits uncommitted, and `git checkout --` to undo the probe took the stage's work with it. Probe after committing, not before.

---

# Stage 4 — The act boundary, and act 1's ending

```
The one stage in this log that adds behaviour. It is fenced here on purpose.

1. Boundary machinery. An act ends when its content is exhausted, which for act
   1 means the last purchase has been made. Not a time, not an ATP total: a
   content condition, because docs/PROGRESSION.md says every branch must
   complete before the act boundary.

   The boundary is an authored moment rather than a state change. E9 in the
   design doc makes act boundaries set pieces. Build the machinery that fires
   one and let V12 make it look like anything.

2. Act 1's ending, and then the state after it, which is the part that needs
   deciding rather than building. Act 2 is four logs away. A player who
   finishes act 1 on the deployed build has nowhere to go, and that is the
   state the game will be in for most of the remaining roadmap. It is also the
   state any cold reader will see if they get that far.

   Author it. An explicit end-of-content state that says this is as far as the
   game goes for now, written under docs/CONTENT_STYLE.md, with the cell still
   running underneath it because this is an idle game and one that stops has
   told the player something false. NOW.md already carries the smaller version
   of this problem: content ends at 61m57s, food lasts to 92m42s, and nothing
   says the act is over.

   Add a test that fails when act 2 exists and this placeholder is still
   reachable, so it is removed by a build failure rather than by memory.

3. The offline path, and this is the subtle one. src/sim/jump.ts resolves an
   absence by finding the next moment a pool crosses zero, in closed form, by
   division. Its header lists unlock crossings as explicitly not simulation
   events, and an act boundary is that same kind of thing: a threshold on a
   running total rather than a pool reaching zero. The substrate mask is also
   computed once per absence at jump.ts:385.

   So the boundary does not become a new event kind. It STOPS the jump. Credit
   time up to the boundary, return a reason saying why, and let the set piece
   play live when the player comes back. Watching a set piece beats reading a
   summary row of it, and this keeps the cost bound the whole algorithm rests
   on.

   Cases to cover: crosses before the next pool event, does not cross, crosses
   exactly at the end of the credit window, crosses at tick zero of the
   absence, and an absence with the boundary already behind it.

4. The interface cases, all four: boundary reached in the foreground, reached
   during an absence, reached with an overlay already open, and reached on the
   same tick as a purchase.

5. Announce it once. The live region carries sixteen events across a whole act
   against roughly 74000 ticks, and the boundary is the single most significant
   event in the game so far. Once, not per tick, and it does not narrate the
   set piece.

Verify: every case in steps 3 and 4 tested. Report the boundary condition as
built and why it is a content condition, the offline figures against V10's with
the sweep green, the end-of-content state text, the test that fails when act 2
lands, and the announcement count across a full act against V8's sixteen.
```

## Stage 4 Report

_Pending._

---

# Stage 5 — The save, and an act this build does not have

```
progression.act becomes load-bearing in this log. This stage handles what that
costs.

1. The problem, stated first so the fix is not bigger than it. src/save/codec.ts
   validates progression.act with finite() and nothing else. That was correct
   when nothing read it. After stage 1 it selects an act out of the registry.

   The failure is real rather than hypothetical, because acts ship one log at a
   time and builds knowing different numbers of acts will exist at once: a
   cached bundle in somebody's browser, or a deploy rolled back after a bad
   release. The save says act 3, the build knows two, the lookup returns
   nothing, and the failure surfaces wherever the first property access happens
   rather than at load.

2. The fix, and it already has a shape in this codebase. src/save/migrations.ts
   returns { kind: 'future' } for a save newer than this build and refuses to
   migrate downward, ever. Do the same for the act: a distinct outcome, a plain
   message, and both save slots left on disk untouched.

   Do NOT clamp the act to the highest known one. That loads successfully and
   silently rewrites somebody's progress, which is worse than refusing, and the
   project's posture is already settled: recovery from backup is an offer
   rather than an action, and a corrupt save starts a new game in memory while
   both slots stay untouched.

3. The autosave interaction, which is the part that does damage if missed.
   After a refusal the session must not start and the autosave timer must never
   arm. V4 found this exact class the hard way: beforeunload fired during a
   post-import reload and autosaved a stale session over a file that had just
   been imported, and the answer was to seal the session. A half-initialised
   session that writes is how a refusal turns into data loss.

4. Tests, both directions and the boundary: a save at act N+1 refuses without
   throwing, neither slot is written after a refusal, a save at a known act is
   completely unaffected, and act values that are not positive integers are
   rejected the way any other malformed field is.

5. Confirm what did NOT need touching. Unlock ids are already safe:
   Act1Unlocks.unknown carries unrecognised ids through capture untouched, so a
   build loading a save with ids it does not know keeps them in the file rather
   than deleting them. That was V5's finding and it still holds. Say so, so the
   next person does not rebuild it.

Verify: all four test cases in step 4 green, the suite green, the regression
bar clean. Report the refusal outcome shape, the message a player sees, proof
that neither slot is written and no timer arms after a refusal, and the step 5
confirmation.
```

## Stage 5 Report

_Pending._

---

# Stage 6 — The headless playthrough test

```
The first end-to-end assertion the project has ever had.

1. What exists to build on, because none of this is new machinery.
   src/content/act1/harness.ts runs scenarios, src/ui/drain.ts measures how
   long the environment lasts, unlockPacing.report.test.ts instruments
   purchases, and src/content/act1/validate.ts runs a 200-case sweep outside
   the suite. All of them run through vite-node.

   This is the same shape. Do not add Playwright or Cypress for it. The
   cross-engine work in V9 already brought a browser runner in for the one job
   that genuinely needs a browser, and act 1's playthrough is not that job.

2. The test: a fresh state, played to the end of act 1's content, headless.
   Through the NAD+ wall, buying fermentation, both capacity ladders, all three
   of V10's unlocks, to the last purchase, to the act boundary, to the
   end-of-content state.

   Assert the shape of the run rather than exact timings: that every purchase
   became affordable in the expected order, that the wall arrived and was
   recovered from, that the boundary fired exactly once, and that the ledger
   held at 4 gross and 2 net throughout. Timings belong in a report test where
   a tuning change is expected to move them; correctness belongs here where it
   is not.

3. Run it both ways: continuous, and with a simulated absence in the middle
   resolved through the offline path. Those are two different code paths to the
   same end state and the second is the one nothing has ever driven end to end.
   The end states should agree within the offline tolerance rather than
   exactly, because docs/SIMULATION.md Part 5's Scope section says an offline
   jump agrees within tolerance and is not bit-identical, and that difference
   is asserted rather than merely permitted.

4. Decide, and say which, whether this runs in npm test or beside it like
   offline:validate. The rule the project already applies: a suite that takes a
   minute is a suite people stop running, and V9 wired the slow band into CI so
   the cost is CI's rather than a person's. Report the runtime and put it
   wherever that number says it belongs.

5. Report what it covers and what it does not. It proves act 1 is completable
   and that the machinery fires. It proves nothing about whether any of it
   reads, and NOW.md's standing caveat applies to this log exactly as to every
   other one.

Verify: the playthrough passes continuous and across an absence, and the two
end states agree within the offline tolerance. Report the assertions chosen and
why timings were excluded, the runtime, the placement decision from step 4, and
the honest coverage statement from step 5.
```

## Stage 6 Report

_Pending._

---

# Stage 7 — The schema decision, and coherence

```
Close the log out. One decision, then the documents.

1. The schema decision, and the default is no bump. For every piece of state
   this log added, ask one question: can a save written by V10 default it?

   docs/SAVE_SCHEMA.md Part 1 makes a field new code can default a non-breaking
   change, and the project has twice proved it. V5 added two unlock id families
   with no bump because a V4 save has no id with the new prefix and derives
   rung 0. V6 added settings.firstRunSeen with no bump because a save without
   it defaults to unseen, which is right rather than tolerated.

   What is already in SaveV1 and needs nothing: progression.act documented as
   1 to 4, transitionTaken and shuttleChoice labelled act 3, enzymes[].damage
   and environment.scheduleIndex labelled act 2, and settings as an open bag of
   scalars. The version 1 shape was written for four acts.

   IF NO BUMP: say so, and then say when the next bump IS expected and what
   would force it. schemaVersionGate.test.ts is the mechanism behind hard rule
   7 and a mechanism that never runs again is one going quietly dormant. A
   named next exercise is the difference between a decision and a silence.

   IF A BUMP: it needs a migration and a fixture captured while version 1 is
   what the code produces, and that window is now. Both, or the suite fails,
   which is the guard working.

2. Confirm the regression bar one final time across the whole log, stages 1 to
   3 and 5 to 7. Stage 4 is the declared exception and its diff is reported
   separately.

3. Full verify: npm run typecheck, npm run lint, npm run build, npm test,
   npm run sim, npm run sim:act1, npm run offline:validate, and the new
   playthrough. Report the test count and bundle size against V10's.

4. Update NOW.md:
   - Status: the project can run an act rather than the act.
   - Build state table: V11 done, with its "does not" column, which is large.
     No timeline, no beast, no provenance, no second act.
   - A "What the act layer does" section, sibling to the kernel, content,
     interface, save, economy, teaching, accessibility and offline sections.
     Say what a descriptor holds and, more importantly, what it deliberately
     does not, with jump.ts's seam paragraph as the precedent.
   - The boundary and the end-of-content state, including that the placeholder
     has a test that removes it.
   - The future-act refusal, alongside the future-schema one, because they are
     the same posture and belong together.
   - The widened accessibility guard's findings from stage 3, since those are
     defects that shipped in V6 to V8.
   - The schema decision with its reasoning and its named next exercise.
   - "Next, in order": V12, Spine B. Point at the design doc.

5. Say what a second act would still need, concretely, as the last section of
   the report. Not a plan, a list. This log's whole purpose is to shorten that
   list and the honest measure of whether it worked is how short it now is.

Verify: everything green, the regression bar clean across the whole log. Report
the schema decision with its named next exercise, both canonical hashes, the
test count, the bundle size, the stage 4 diff reported separately, and the
NOW.md diff summary.
```

## Stage 7 Report

_Pending._

---

# After These Stages

- **An act is a thing rather than an assumption.** `src/content/acts.ts` exists, the runtime takes a descriptor, and roughly 750 lines that said act 1 no longer do. The project could run a second act if a second act existed, which is the entire deliverable.
- **And the descriptor is honest about knowing one act.** It has act 1's fields and nothing speculative, for the reason `src/sim/jump.ts` already gives about act 2's seam and `NOW.md` gives twice about specifications written before the thing built on them. Act 2 widens it with two instances to be right about.
- Not one behavioural change outside stage 4, proved rather than claimed: both canonical hashes unmoved, five empty diffs, and a regression bar checked at every commit of the largest rename in the project's history.
- The runtime finally holds the rule the kernel has held since V1. Ids resolve to indices once, at construction, and the per-frame and render paths allocate nothing. A linear scan called once per render has been there since V3 and no test could have found it.
- Two guards stopped agreeing with their own lists. The accessibility guard was checking half the components it should have been, and the nine it was missing shipped after it was written.
- Act 1 has an ending, and the state on the other side of it is authored rather than accidental. That is the honest thing to ship four logs before act 2, and a test removes the placeholder rather than a memory.
- The first end-to-end assertion in the project's history, run two ways, one of them through the offline path that nothing had ever driven to a real end state.
- **What is still missing is everything you can see.** No timeline, no beast, no provenance, no act 2. This log built the half nobody looks at, and V12 is the half that is entirely looking.
