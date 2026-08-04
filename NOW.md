# Now

Last updated: 2026-08-04

Where the project actually is. Read this before the spec docs.

This file holds state. CLAUDE.md holds instruction and changes rarely. This changes most sessions. Durable decisions belong in the decisions log of the relevant spec doc, not here, so this file stays short enough to be read rather than skimmed.

If this file disagrees with a spec doc, the spec doc wins and this file is stale. Fix it.

## Status

**The game now explains itself, and nobody has checked whether the explanation works. 0 readers, out of 0 asked.**

That is the number V6 exists to report and it is reported as a bare fraction rather than characterised, because there is no fraction: there is no denominator. V6's stages 2 and 5 were a cold-read baseline and a cold-read re-test, and **both were unrun for want of a reader who has never seen the game.** An agent in a terminal cannot hand a running `npm run dev` to a stranger and stay silent while they think aloud, and the stage prompts said in advance that the honest outcome was to report the stage unrun rather than to substitute the builder's reading. Both did.

**So V6 shipped unvalidated and the distinction that matters is this one.** What changed is not that the game teaches. What changed is that there is now something to measure. Eleven of the thirteen things a cold reader previously had to work out unaided are now stated somewhere on screen, up from one, and that is a fact about the code rather than about any reader. **The two open cold reads are the highest-value unblocked work in the project** and they need one person who does not already know where the wall is.

**Act 1 is balanced, it is inside its target duration, and the economy has a document.** `npm run dev` gives an act 1 screen: a top bar, eight pool cards, the pathway with dashes flowing at the rate each reaction is running, an unlock shelf with three slots, one coach mark and a save panel. The NAD+ wall arrives about three seconds in, the coach mark opens on it, and buying lactate dehydrogenase brings the cell back inside two ticks. The game autosaves every thirty seconds, on the way out of a tab, and the instant anything is bought.

**docs/PROGRESSION.md has given act 1 a target of 45 to 90 minutes since 2026-07-29 and V5 is the first log to measure against it.** A player buying everything the instant it is affordable reaches the last purchase at 61m57s. A player who checks every five game-minutes reaches it at 70m00s. Both are inside. There are seven purchases and the longest gap between them is 13m51s, against 84m47s before this log.

**Both NOW.md blocking items belonged to docs/ECONOMY.md and neither could be fixed by any earlier log.** The ATP bootstrap trap is closed. The static mid-game is narrowed from an 85 minute dead tail to a 14 minute worst gap, and it is not closed. See Blocking below.

V3 answered one of the two questions in docs/BRIEF.md line 110 and half of the other. See "What the interface answered" below. The short version: the NAD+ wall reads as interesting, and the reason saturating kinetics did not feel like a game was that a solved act 1 stopped changing. V5 gave it something to keep responding to; whether that is enough is a question for a reader who is not the person who built it.

## Build state

One sentence per log. The "does not" column is the fence each stage doc inherits, so a log claims its own row and defers everything held by the rows below it.

| Log | Builds | Does not | Status |
| --- | --- | --- | --- |
| V1 | The engine kernel: constants, seeded PRNG, pools, reactions, tick, loop, conservation and determinism tests | Any content, any interface, saves | Done 2026-07-28 |
| V2 | Act 1 content: glucose uptake, glycolysis, the NAD+ pool, lactate fermentation | Any interface, the ethanol branch, glycogen storage | Done 2026-07-29 |
| V3 | The first interface, only what is needed to play the slice and answer the two questions in docs/BRIEF.md line 110 | The timeline, the beast, the rest of DESIGN.md, saves | Done 2026-07-29 |
| V4 | Persistence: save and load against docs/SAVE_SCHEMA.md version 1, plus the migration harness and its fixture test | Offline progress, any network or account | Done 2026-07-31 |
| V5 | The economy pass: docs/ECONOMY.md and its divergence table, the ATP bootstrap repair, the glycolytic capacity ladder, and act 1 balanced end to end against its target duration | Offline progress, new pathway content, the steady-state display question | Done 2026-08-03 |
| V6 | The comprehension pass: docs/CONTENT_STYLE.md, the first run, the about panel, the teaching layer, and the style guide as mechanism | The economy, new unlocks, the timeline, the beast, act 2, and any change to a tuned number | Done 2026-08-04, **unvalidated**. Stages 2 and 5 unrun for want of a cold reader |
| V7 | Accessibility, and the colour-alone problem: making V6's text and the illustration perceivable | New content, new teaching beats, the economy | Not started |
| V8 | Offline progress: steady-state detection, the analytic jump to the next event, and validation of STEADY_EPSILON and STEADY_WINDOW | New content, any interface beyond a return summary | Not started |
| V9 | CI, cross-engine determinism and deployment | Not read in detail yet. Scheduled after V8 | Not started |
| V10+ | Unplanned, deliberately | Anything written here now would be fiction | Held |

**The table moved by exactly one row and act 2 is still not on it.** V5 was the horizon for two logs because act 2 is the highest-risk beat in the game and docs/PROGRESSION.md lists its shape as an open question for the prototype. What V5 has changed is that act 1 no longer has a hole in it: the trap is repaired, the act is measured against its target, and every tuned number has a row. That licenses planning on top of act 1, which is what the offline log now is, and it does not license act 2.

**What closing blocking item 1 unlocks, and what it does not.** Act 1 can now be played to the end of its content and past it without reaching an unrecoverable state, so a log can build on it without inheriting a defect. That is the precondition offline progress needed and did not have before. What it does not unlock is act 2, which needs the comprehension question answered by somebody who is not the author, and which needs docs/CONTENT_STYLE.md to exist so its text can be written once rather than twice.

The docs/SCIENCE.md reconciliation that used to gate V2 landed as V2 stage 1. It was a docs-only pass and it is done.

## What the kernel does

`src/sim/`, headless, no UI, no content.

    constants.ts    docs/SIMULATION.md Part 6, literal types, each pointing at the part that decided it
    prng.ts         mulberry32, state exposed for the save, seed 1 reference sequence frozen in a test
    pools.ts        Float64Array amounts, frozen id-to-index map, flat conserved weight matrix
    reactions.ts    Michaelis-Menten and Hill, integer exponents by repeated multiplication
    tick.ts         two-phase update, proportional shortfall scaling, SAFE_VALUE_CEILING tripwire
    loop.ts         fixed timestep accumulator, catch-up cap, excess routed to pendingOfflineMs
    hash.ts         FNV-1a over the canonical state form
    harness.ts      `npm run sim`, three scenarios over the synthetic fixture

Conservation holds to 1.964e-13 relative across randomized runs, against a 1e-9 tolerance. The canonical determinism hash is `172f83fb` and neither V2 nor V3 touched it.

One kernel change in V3: `createLoop` takes an optional read-only `TickObserver`, called immediately after each tick inside the loop. The act 1 meter reads per-tick scratch arrays the next tick overwrites, so a driver that runs three ticks in one frame and meters afterwards counts the third tick three times and the first two not at all. Only the loop can see those snapshots, so the loop hands them out. Additive and optional, every existing call site unchanged.

Not built, deliberately: offline progress, saves and migrations.

## What the content layer does

`src/content/`, added by V2. The part of the simulation that knows what a pool means.

    README.md         the one rule: content depends on src/sim/, never the reverse
    act1/pools.ts     ten pools, five conserved quantities, the redox convention
    act1/reactions.ts five reactions, every coefficient traced to docs/SCIENCE.md
    act1/tuning.ts    every Vmax, Km, the Hill n and the nicotinamide size
    act1/meter.ts     cumulative ATP, kept beside the simulation and never in it
    act1/harness.ts   `npm run sim:act1`, three scenarios

The pathway, all of it:

    uptake     glucose_env               ->  glucose
    prep       glucose + 2 atp           ->  2 g3p + 2 adp
    payoff     g3p + nad + 2 adp + pi    ->  pyruvate + nadh + 2 atp
    ferment    pyruvate + nadh           ->  lactate + nad          ships disabled
    maintain   atp                       ->  adp + pi

Five conserved quantities rather than three. `carbon`, `phosphate` and `redox` as docs/SIMULATION.md names them, plus `nicotinamide` (NAD+ plus NADH) and `adenylate` (ATP plus ADP). The carrier totals are what make the NAD+ wall a testable property rather than a felt one.

95 tests across the whole suite, up from V1's 65. Every reaction balances all five quantities exactly, asserted as a property over the reaction list rather than as hand-written cases. The ledger is 4 ATP gross, 2 net, 2 NADH and 2 pyruvate per glucose, computed from the reaction table and matching docs/SCIENCE.md Part 2. Act 1 conservation drift is 2.351e-13 worst observed, slightly above the toy pathway's 1.964e-13 and still three orders below tolerance. The act 1 canonical hash is `e9b720a8`.

The determinism lint guard was extended from `src/sim/**` to `src/content/**` in V2 stage 6, because content builds the descriptors the kernel runs and the hashed state is a function of content. Hard rules 4 and 5 are mechanism in both directories now.

**The act 1 canonical hash has moved twice and it is `49ea08d3`.** V3 stage 6 took it from `e9b720a8` to `657594cb` by raising `ACT1_GLUCOSE_ENV_INITIAL` from 10000 to 80000, because starting amounts are hashed state. V5 stage 2 took it to `49ea08d3` by repairing the ATP bootstrap trap: `maintain` from Michaelis-Menten to Hill with `ACT1_MAINTAIN_HILL_N` of 3, and `ACT1_KM.maintain` from 20 to 12 in the same edit, because the K is derived from the form and there is no version of the repair that makes only one of them. Both reasons are written into the assertion itself. **V5 stages 3 and 4 moved no shipped default**, so the ladder and every re-derived threshold left the hash alone, which is the result rather than the absence of one: a stage that added unlock content and moved the canonical hash would have changed the starting state by accident.

**One kinetic form changed in V5, and it is the second Hill in act 1.** `maintain` is Hill n = 3 rather than Michaelis-Menten. Unlike `prep`'s Hill, which is an attribution to PFK-1 and a claim about a real enzyme, this one is not a claim about anything. It is the ATP bootstrap repair and it has a divergence row saying so.

Not built, deliberately: the ethanol branch, glycogen storage, the ten-enzyme decomposition.

## What the interface does

`src/ui/`, added by V3. Depends on `src/content/` and `src/sim/`; neither may ever depend on it.

    runtime.ts          the bridge. Simulation, loop, meter, snapshot, rAF, unlocks
    RuntimeContext.tsx  the React side. Provider, useLiveNode, useLive, useSnapshotEffect
    content.ts          every player-facing string, each paired with its badge
    tuning.ts           every provisional interface number, all Tuned
    poolCards.ts        ten pools to eight cards, geometry read from the pool table
    scenario.ts         `?glucose=500` and `?ferment=on`, a development door
    drain.ts            `npm run sim:drain`, how long the environment lasts
    fonts/              Fredoka and Nunito as woff2, self-hosted, OFL
    components/         Card Pill Button Figure Badge Blob PoolCard PoolRail
                        PathwayCard PathwayArrow UnlockShelf CoachMark TopBar

**Three clocks, and none of them is React's.** The simulation runs at a fixed 20Hz over a mutable `Float64Array`. The display runs at whatever `requestAnimationFrame` gives. React re-renders only on discrete events: an unlock bought, a stall detected, a coach mark opened. Subscribers read one preallocated snapshot and write text, fills and classes straight to DOM nodes.

**Four things are mechanism rather than discipline.** Every number goes through `Figure`, which applies tabular figures itself, and a lint rule bans number formatting in every other `.tsx`. Every figure carries a badge as a required prop, so an unsourced number does not compile. A test parses DESIGN.md's Colour section and fails the build if `src/index.css` adds, omits or changes a colour. And a Vite plugin fails a production build if a `Needs source` badge survives into the emitted bundle, which closes DESIGN.md open question 6.

**Illustration geometry is derived, not drawn.** There is no path data anywhere in `Blob.tsx`. A blob takes a carbon weight and a phosphate weight out of `src/content/act1/pools.ts` and draws itself, so glucose has six sides because glucose carries six carbon, and ATP shows three phosphate dots against ADP's two and free phosphate's one because that is what the conserved weights say. Asserted as a property over the pool table rather than as eight hand-written cases.

65 tests were added, taking the suite from V2's 95 to 160.

## What the save layer does

`src/save/`, added by V4. May import `src/sim/`. Nothing in `src/sim/` or `src/content/` imports it except `src/content/act1/save.ts`, which is the act 1 mapping and the only file allowed to know both sides.

    schema.ts      the version 1 shape, readonly throughout, SCHEMA_VERSION as the literal 1
    codec.ts       serialize and deserialize. Canonical field order, structural validation
    storage.ts     localStorage behind an injected interface. Verify-then-swap, one backup slot
    migrations.ts  the ordered chain, its runner, and parseAndMigrate, which storage calls
    autosave.ts    a timer, visibilitychange, and every purchase. Not beforeunload
    offline.ts     now minus lastSavedAt, capped. Accumulated and credited to nothing
    meta.ts        the wall clock and the build id. The only file in the project that reads Date
    tuning.ts      the autosave interval. The third provisional-number file
    fixture.ts     `npm run save:fixture`, the recorded procedure for a fixture

**The committed version 1 fixture is the most valuable thing in the directory and it is the part least visible from the code.** `src/save/__tests__/fixtures/v1.json` is a real act 1 run, four game-minutes deep, past the NAD+ wall, fermenting, one rung up the capacity ladder. Hard rule 7 makes a real predecessor save a precondition for every future schema change, and **a version 1 fixture can only be captured while version 1 is what the code produces.** Miss the window and whoever writes version 2 is fabricating the thing they are supposed to be migrating, on a save nobody can recreate. Never delete it, never edit it, never regenerate it. `src/save/__tests__/fixtures/README.md` says the same thing at length and says how to make the next one.

Hard rule 7 is mechanism now rather than discipline. `schemaVersionGate.test.ts` asserts a committed fixture for every version from 1 to `SCHEMA_VERSION`, a migration for every step between them, and every fixture loading through the chain into a state that passes the same validation a fresh save does. Bumping the version without both fails the suite. Proved by bumping to 2 in a scratch edit and reading the failure.

One thing the fixture does that act 1 does not do by itself, disclosed rather than hidden: it draws seven values from the PRNG after the run. **Act 1 consumes no random numbers**, so a real run of any length ends with `rng.state` exactly equal to `rng.seed`, and a fixture like that cannot exercise the field docs/SAVE_SCHEMA.md Part 5 calls the one most likely to be dropped. The same fact shapes `reloadDeterminism.test.ts`, which drives a scripted PRNG consumer for the same reason and asserts the bare fact directly so nobody has to rediscover it.

Determinism across reload is a 36-case sweep on hash equality, four seeds by three lengths by three split points, plus a split during the NAD+ stall and three during fermentation recovery. Both mutilations Part 5 warns about, dropping `rng.state` and dropping `tickCount`, were confirmed to fail and are kept as permanent divergence tests.

109 tests were added, taking the suite from V3's 160 to 269. Bundle 251.29 kB, 78.79 kB gzipped, up from V3's 229.44 kB and 72.36 kB.

V6 added 44 more, taking the suite to **329 across 31 files**, and the bundle to **263.44 kB, 81.90 kB gzipped**. **The act 1 canonical hash is still `49ea08d3` and no tuned number moved**, which for a comprehension log is the result rather than the absence of one: `git diff` against the three tuning files across the whole log is empty and docs/SCIENCE.md is untouched.

V5 added 16 more, taking the suite to **285 across 27 files**, and the bundle to **253.48 kB, 79.41 kB gzipped**. Act 1 conservation drift improved from 2.351e-13 to 1.113e-13 over the same 60 long runs, as a side effect of the bootstrap repair rather than as a goal.

**Two act 1 unlock ids were added and no schema bump was needed.** `glycolysis-capacity-N` per rung, alongside the existing `ferment` and `uptake-capacity-N`. docs/SAVE_SCHEMA.md Part 1 makes an additive change new code can default a non-breaking one: a V4 save has no id with the new prefix and derives rung 0, which is what it was. Read from the other side, `Act1Unlocks.unknown` already carried unrecognised ids through capture untouched, so a V4 build loading a V5 save keeps the purchase in the file rather than deleting it. The committed version 1 fixture is untouched and still loads.

The ESLint determinism guard now covers `src/save/**` too, in two halves. Hard rules 4 and 5 apply in full, because a save carries pool amounts and a PRNG state that go straight back into the tick loop. The clock ban applies everywhere except `src/save/meta.ts`, because docs/SAVE_SCHEMA.md Part 3 makes `lastSavedAt` the only wall-clock input in the system and exactly one file has to read it. The property worth keeping is not "save code may read the clock", it is that the places that read the clock are countable. There is one.

Not built, deliberately: offline progress, cloud sync, accounts, compression, and any value under `enzymes` or `environment` that act 1 does not honestly make true.

## What the economy does

`docs/ECONOMY.md`, added by V5. The record docs/PILLARS.md rule 5 requires and the place CLAUDE.md hard rule 2 sends balance numbers. Not a design document, and no number in it may be cited as biology.

**Thirty-seven rows, one per tuned number, split by the file the number lives in.** Thirteen were expected. The count was wrong three times before this log settled it: NOW.md said twenty-two twice while enumerating twenty-three things, `src/save/tuning.ts` said twenty-one, and both undercounted the same thing, the uptake ladder. Counting scalars consistently gives 17 in `src/content/act1/tuning.ts`, 19 in `src/ui/tuning.ts` and 1 in `src/save/tuning.ts`.

**Every row is DEPARTURE or UNSOURCED and the split is the point.** 25 and 12.

    DEPARTURE   a number standing where a real quantity could have stood, that
                does not match it. Every rate, pool size, starting amount and
                kinetic exponent in act 1.

    UNSOURCED   a number with no real counterpart at all. A dash length in
                pixels, a purchase threshold, an autosave interval. Its "real
                behaviour" cell is EMPTY, and that emptiness is the content of
                the row rather than a gap in it.

Rule 5 requires departures to be recorded. It does not require inventing a departure for a number that never departed from anything, and a plausible sentence in an UNSOURCED row would be the exact failure the table exists to prevent.

**Three departures are structural and have no row, because no single number carries them**: unlocks are thresholds against a lifetime ATP counter, the environment is a finite unreplenished pool, and the game refuses a death a real cell can die. They are written out in their own section.

**The guard keeps the table and the code in step.** `src/ui/__tests__/divergenceTable.test.ts` parses both and fails the build if a tuned scalar has no row, if a row names a constant that no longer exists, or if the document's own stated count disagrees with what it contains. It counts scalars rather than names, so adding a rung to a ladder fails it too. Proved by adding a probe constant and reading the failure. Same shape as the DESIGN.md colour test from V3 stage 2, and it turns rule 5 into the same kind of mechanism as hard rules 1, 4, 5 and 7.

**Hard rule 2 was live for the first time and it held.** `docs/SCIENCE.md` is untouched across every commit of V5, confirmed by diff. Every balance decision went into docs/ECONOMY.md, which is the whole reason the two documents are separate.

## What the teaching layer does

`docs/CONTENT_STYLE.md` plus five components, added by V6. The part of the interface whose job is to say what everything else is doing.

    docs/CONTENT_STYLE.md    the writing contract. Eight parts, a decisions log
    Overlay.tsx              the shell, plus the context that defers a coach mark
    FirstRunCard.tsx         one card, three lines, over a running simulation
    About.tsx                the about panel, and the first run's permanent home
    TeachingPanel.tsx        the overlay DESIGN.md specified on 2026-07-28
    contentStyle.test.ts     the style guide as mechanism

**The first run never blocks the simulation and that is the point of it.** The overlay is undimmed, so the act screen stays lit, stays clickable and keeps ticking under the card, with `pointer-events-none` on the frame and `pointer-events-auto` on the card. Measured in a browser: the NAD+ wall arrives while the card is still on screen. An idle game that pauses for its own introduction has told the player, in its first sentence, that it pauses.

**Three coach marks, up from one, and only the NAD+ one is automatic.** The other two are manual by construction rather than by `COACH_MARK_TRIGGER`, because neither has a simulation event worth interrupting for. The carbon mark, on the g3p card, says sides equal carbons and that one glucose becomes two of these. The ATP mark, on the adenylate card, says ATP and ADP are one pool and the amount is not a score.

**The teaching panel's subject was read out of docs/SCIENCE.md rather than chosen.** Part 2 contains two direct orders to the interface: that the net figure "is worth surfacing in-game because the gross figure of 4 is a common point of confusion", and that framing fermentation as an energy pathway "is a common misconception and the game should correct it directly". **Three logs shipped interface without discharging either.** The panel discharges both, a test asserts it states the gross figure, the net figure and the fermentation correction, and V3's own note that the yield beat would not fit in a bubble is what put it there.

**The illustration says what it encodes, and until V6 it said nothing.** Rules 1 to 3 have been derived from the conserved-weight table since V3, and DESIGN.md's argument for rule 1 turns on the player being told ONCE what a side means. Nothing had told them. Every blob now carries a readout composed in `content.ts` from the same table the geometry is drawn from: "Glucose. 6 sides, 6 carbons", "Glyceraldehyde 3-phosphate. 3 sides, 3 carbons. 1 phosphate". **An encoding nobody is told about is a decoration**, which is the thing DESIGN.md's first rule exists to prevent.

**These are the first numbers in player-facing prose in the project's history.** V6 stage 1's audit found the count was zero, so hard rule 1, the badge contract and the `Needs source` release gate had all been mechanism since V3 with nothing to stop. Every number in the readouts is a conserved weight tracing to docs/SCIENCE.md Part 2, and a test asserts the derivation rather than the strings: glucose's count must be twice g3p's and ATP must carry exactly one more phosphate than ADP, both read from the pool table.

**docs/SCIENCE.md Part 1's required disclosure is met literally for the first time.** It asks for the text "in the about screen and on first launch". V3 had neither surface and put a permanent footer on the act screen instead, which meets "on first launch" only in the sense that it meets every launch. The first run carries it verbatim and the about panel carries it verbatim, the footer is gone rather than duplicated, and `disclosure.test.tsx` parses the blockquote out of docs/SCIENCE.md and fails the build if the game disagrees with it by a character. **Nothing had ever checked the one string a document orders the game to print.**

**`settings.firstRunSeen` is the first persisted UI setting and it needed no schema bump.** docs/SAVE_SCHEMA.md Part 3 defines settings as presentation that never affects simulation and Part 1 makes a defaultable missing field additive. A V4 or V5 save defaults to unseen and shows the card once, which is right rather than tolerated: that player has never seen it either.

**The style guide is mechanism, in the same way the colour tokens and the divergence table are.** `contentStyle.test.ts` asserts no player-facing literal outside `content.ts`, no em dash, no en dash, no exclamation mark, no curly quote, no "investment phase" and no -ize spelling, with a guard-the-guard assertion on each half. Voice is not tested and should not be faked. **One file is exempt and the reason is structural**: `Badge.tsx` renders the four badge words and `content.ts` imports `Badge`, so they cannot move without a circular import.

**The guard found two strings the audit that went looking for them missed**, which is the argument for building it: the wordmark, hardcoded in `TopBar.tsx` and the string in this game most likely to change, and the "of" in "60 of 55 ATP made". **And its own probe found two holes in it.** The prose detector was a character allowlist and `<h2>Resources so far!</h2>` walked through it, because an exclamation mark was not in the list. The -ise rule was a suffix pattern and flagged "Pool sizes are tuned". Both were fixed before the guard was believed.

## What exists

    docs/BRIEF.md          orientation, the idea and the reasoning
    docs/PILLARS.md        scope contract
    docs/PROGRESSION.md    four acts, unlock order, gating
    docs/SIMULATION.md     engine spec, settled, awaiting implementation
    docs/SAVE_SCHEMA.md    data contract, version 1, frozen
    docs/SCIENCE.md        biological ground truth and citations
    docs/IDEAS.md          loose ideas, not a spec
    docs/MOCKUP.md         mockup pointer
    DESIGN.md              visual contract, direction Honest Cartoon
    NOW.md                 this file

    docs/ECONOMY.md        tuned numbers and the divergence table, 37 rows
    docs/CONTENT_STYLE.md  the writing contract, eight parts and a decisions log

**Every document CLAUDE.md's index promises is now real.** docs/ECONOMY.md landed in V5 and docs/CONTENT_STYLE.md in V6, and they were the last two the index described as deferred.

**docs/CONTENT_STYLE.md lost two of its own rules on contact with real work, in the two stages immediately after it was written, and neither loss weakened a rule that was doing anything.** Part 5 said a first run was three screens of one paragraph; V6 stage 3 corrected it to one screen of three, because three screens of one line is a sequence a player has to get through, which is a tutorial in shape and docs/PILLARS.md rule 2 rules a tutorial out. Part 5 said a button was 4 words; V6 stage 4's own test failed on V3's "Show me what recycles it", which V3's play reading calls the strongest beat in the build, and the ceiling moved to 5 rather than the line moving. **The pattern is worth naming: the parts of that document derived from the shipped build have held and the parts that were chosen have not.**

    UPDATELOGV1.md         the kernel build log, five stages, all reported
    UPDATELOGV2.md         the act 1 content log, six stages, all reported
    UPDATELOGV3.md         the first interface log, seven stages, all reported
    UPDATELOGV4.md         the persistence log, six stages, all reported
    UPDATELOGV5.md         the economy log, five stages, all reported

Mockups live outside the repo at `~/.gstack/projects/krebs/designs/design-system-20260728/`. `preview-cartoon.html` is the current direction. `preview.html` is a rejected earlier direction kept for comparison.

## Settled 2026-07-28

- Visual direction is Honest Cartoon. Thick black outlines, pastel surfaces, hard offset shadows, chunky rounded type. Fredoka and Nunito. See DESIGN.md.
- Every visual property carries simulation state. Shape encodes carbon count, saturation encodes redox state, cracks encode damage.
- Flux is the headline number and stock is the subscript, inverting the genre convention.
- No authentication and no accounts. PILLARS rule 7 considered and upheld.
- The beast is the cell itself, personified. The map is the real geological timeline, scrolling down into the past.
- Timeline figures earn their place by metabolism, not morphology. This is the guardrail that keeps the timeline from drifting into the tree of life.
- Badge contract is Sourced, Tuned, Contested, plus a development-only Needs source.

## Settled 2026-07-29, by V3

- Fonts are self-hosted woff2 rather than linked. A Google Fonts link is a network dependency at first paint and CLAUDE.md forbids one for core play. Costs 68.86 kB.
- React never re-renders at tick rate. The loop lives outside React, `requestAnimationFrame` drives it, the display samples one preallocated snapshot per frame, and React state changes only on discrete events.
- Unlock costs are thresholds against the cumulative ATP counter, never subtractions from the ATP pool. The adenylate pool is fixed and closed, so subtracting from it breaks conservation on the tick it happens. It is also the more honest statement about a cell.
- Every figure carries a badge as a required prop, and the `Needs source` release gate scans the emitted production bundle. DESIGN.md open question 6 is closed by mechanism.
- Illustration geometry is derived from the conserved-weight table rather than drawn. Nothing in the illustration set is decorative, and now nothing in it is hand-authored either.
- Nothing in the game is encoded in movement alone. Reduced motion swaps flowing dashes for a static arrow plus an explicit numeric rate, and dims a stopped arrow in both modes because colour is not motion.

## Settled 2026-07-29

- The timeline stop list is sourced. Every stop traces to docs/SCIENCE.md Part 6 and no `Needs source` badge survives on the view. Two stops ship with no date: oxygenic photosynthesis is unresolved and the vent stop is a hypothesis about mechanism rather than a dated event.
- The GOE stop keeps banded iron as its figure, with the ~2.5 Ga peak labelled on the card as the immediate pre-GOE maximum. The cleaner marker, the redox-sensitive detrital mineral record, has no legible cartoon silhouette.
- The eukaryote stop is reframed from morphology to metabolism, as early aerobic eukaryotes.
- Act 2 models two damage mechanisms, not one. ROS and molecular oxygen have different targets and the antioxidant enzymes only address the first. The target inside act 1's own loop is GAPDH by thiol oxidation.
- Content lives in `src/content/` and the kernel never imports it. The arrow points one way, permanently.
- ATP is a flux, not a score. The adenylate pool is fixed and closed and `maintain` hydrolyses ATP back to ADP and phosphate. Cumulative production is a counter beside the simulation, never a pool inside it.

## Settled 2026-08-03, by V5

- **A tuned number lives in exactly one of the three tuning files and has exactly one row in docs/ECONOMY.md.** Enforced by `divergenceTable.test.ts`, which counts scalars rather than names, so adding a rung to a ladder fails it. This is docs/PILLARS.md rule 5 turned into the same kind of mechanism as hard rules 1, 4, 5 and 7.
- **The unit of a divergence row is the scalar a balance pass can move on its own.** A record of five Vmax values is five rows and a ladder of three rungs is three, for the same reason. The one exception is a glycolytic rung, whose three Vmax values are bound by two measured constraints and cannot be moved independently, so it is one row.
- **The real behaviour column is left empty for numbers that never departed from anything.** Rule 5 requires departures to be recorded and does not require inventing one.
- **`payoff` Vmax must strictly exceed twice `prep` Vmax.** Not a design nicety, a stability condition, measured: every configuration at exactly twice died. The preparatory phase makes two trioses per glucose, so the payoff phase has to run twice per prep turn just to keep up, and it needs headroom over that or the investment phase spends ATP the payoff phase has not made back yet.
- **Preparatory-phase capacity is not sellable on its own, so it is sold with the payoff phase in one purchase.** Selling them separately would ship a purchasable configuration that kills the player's cell.
- **Unlock thresholds are derived from a target time rather than chosen and then measured.** Pick when the purchase should land, instrument a run, read cumulative ATP off it. The loop this replaces is adjusting by feel until the landing looks right, which is how a table of numbers ends up with no reason attached to any of them.
- **Maintenance falls off faster in ATP than the preparatory phase does, and it has to.** Third order against second. Anything else and the cell has a state it cannot come back from, whatever the constants are.
- **Line-number citations into docs/ are banned in favour of section names.** Five docs/SCIENCE.md pointers had drifted 42 lines and all five landed in the wrong Part. Two docs/PROGRESSION.md pointers broke inside V5 itself, when stage 5 edited the act 1 unlock list.

## Settled 2026-07-31, by V4

- Storage keys are permanent from here: `krebs.save.active`, `krebs.save.backup`, `krebs.save.temp`. The prefix is the repository name and deliberately not the game's title, which is still TBD. A prefix that was never claiming to be the title cannot go stale, and renaming one orphans every save in existence with no error and no way back.
- `progression.unlocked` is the single source of truth for what has been bought. Reaction enabled flags and the uptake capacity step are derived from it at load and are never persisted alongside it. Two copies of one fact is the specific way save formats rot.
- Act 1 unlock ids are contract surface now: `ferment`, and `uptake-capacity-N` per rung of the ladder.
- The write path is verify-then-swap and a corrupt primary is never promoted into the backup slot. That last part is not in docs/SAVE_SCHEMA.md and the crash-state enumeration is what surfaced it: promoting a corrupt active destroys the only recoverable copy on the first autosave after the corruption is noticed.
- Recovery from backup is an offer, not an action. A corrupt save starts a new game in memory and both slots stay on disk untouched until the player says otherwise.
- After an import or an accepted recovery the session is sealed: the autosave timer and both listeners are torn down and every write path refuses. Without it, `beforeunload` fires during the post-import reload and autosaves the stale session over the file that was just imported.
- `beforeunload` is wired and is explicitly not load-bearing. It does not fire reliably in any modern browser, and the one place it demonstrably did fire, it destroyed data.
- Measured session values are exempt from the badge contract, declared at the call site through `Figure`'s `measured` prop. No fourth badge kind was added. See DESIGN.md.
- The determinism guard is now in two halves with different scopes. See "What the save layer does".

## Blocking

**V6 added one and it is now the top of the list.**

0. **Nobody who is not the author has ever looked at this game.** Opened 2026-08-04 by V6, which was built to close it and could not. It is stated as blocking rather than as an open question because **it blocks the two things docs/PILLARS.md lists as its first and second success conditions**, and because no amount of further building closes it. Every other item on this page can be worked on; this one cannot be worked around.

   **What is needed is small.** One person who has never seen it, ten minutes, `npm run dev` at a fresh state, and somebody silent in the room writing down what they say. UPDATELOGV6.md stages 2 and 5 carry the full protocol and the three questions, and stage 2's report explains why an agent cannot run it.

   **The single most valuable data point named in the protocol is unmeasured and it is the one docs/PROGRESSION.md predicts**: what a player thinks buying lactate dehydrogenase will do, asked before they buy it. Most players arrive expecting fermentation to be an energy upgrade. Nobody has watched that expectation be corrected or fail to be.

   **One thing is permanently lost and should be recorded rather than hoped away.** Stage 2 was a pre-change baseline and the change has now landed. A cold read taken today measures this build, with the first run and the teaching layer in it, against nothing. **The comparison V6 was designed around cannot be recovered.** A single post-change reading is still worth far more than none.

**One item closed, one narrowed, and nothing new added.** Both belonged to docs/ECONOMY.md, which is why neither moved for three logs.

1. ~~**Act 1 as tuned has an unrecoverable state.**~~ **Closed 2026-08-03 by V5 stage 2.** Open since V2 stage 5, deferred by V3 stage 6 and again by V4.

   **It was worse than this entry described.** "Below roughly 400 environmental glucose" was not the boundary: every environment size from 10 to 2000 killed a healthy cell, and what was constant was the damage, exactly 169.57 glucose stranded inside a corpse at every size large enough to have it. The unrecoverable part was measured directly for the first time by emptying an environment and then refilling it: ATP at refeed 3.953e-323 and 0.00 ATP produced over the following ten game-minutes, with a full larder in front of the cell.

   **The cause was an ordering fact rather than a tuning one.** `prep` is Hill n = 2 in ATP so its flux falls as the square at low ATP, while Michaelis-Menten maintenance falls only linearly, so consumption beat production below some level for every possible choice of constants. Sweeping `ACT1_KM.maintain` from 5 to 500 repairs it at no value. The repair makes maintenance fall off faster than the preparatory phase does: `maintain` moved to the Hill form with n of 3, its K derived at 12 so the new curve passes through the old one at act 1's steady-state ATP. **The healthy economy did not move.** ATP per second, gross and net yield, the walled ceiling of 60 and the wall's arrival time are all unchanged.

   **What is not fixed and never will be, stated plainly.** ATP of exactly zero with no stranded g3p is still absorbing, because `prep` is the only route to g3p and making ATP from no ATP would break conservation. Recovery time from a near-zero ATP scales as 1/atp. The repair works by making the collapse not happen, not by making those levels survivable. `src/content/act1/__tests__/bootstrap.test.ts` asserts both halves including the mechanism, so a later balance pass that drops maintenance back to Michaelis-Menten fails there rather than reintroducing this quietly.

2. **A solved act 1 is a static screen. NARROWED, NOT CLOSED**, and it stays in Blocking rather than being downgraded, because V5 stage 3 existed to fix it and got most of the way rather than all of it.

   **The measurement was much worse than this entry described.** Act 1 as V4 shipped it had six discrete events, every one inside the first 5m13s, and then **84m47s in which nothing happened at all**, against a 45 to 90 minute target. "Roughly ten minutes of nothing between two events" understated it by an order of magnitude. One correction to the old wording: the screen is not literally frozen. The displayed ATP per second declines monotonically as the environment drains, crossing a two-decimal boundary every one to three minutes. A number very slowly going down is not an event, which is why it reads as nothing happening.

   **What V5 did.** More unlocks, chosen over a varying environment because docs/SIMULATION.md Part 3 builds offline progress on the system reaching steady state, and an environment that never settles would make the next log's central mechanism fall back to coarse replay permanently. The glycolytic capacity ladder adds four purchases. **Events went from 6 to 7 and the longest gap from 84m47s to 13m51s**, with the last purchase at 61m57s instead of 5m13s.

   **What is left, and why this log could not do it.** Fourteen minutes between events is still a long time to look at a screen that is not changing. Shortening it needs more things to sell, and act 1's three remaining unbuilt unlocks in docs/PROGRESSION.md, individual glycolytic enzymes, ethanol fermentation and glycogen storage, all extend the pathway, which V5's scope forbade. **The remaining gap is a content question rather than a balance one.** The other half of the answer is making the quiet legible, which is DESIGN.md open question 7, a display decision, and one V5 said out loud it was not taking.

   **V6 gave a solved act 1 something to do and it is not a fix for this.** There are now two coach marks and a teaching panel a player can open while nothing is happening. That is reading material rather than an event, it is all optional, and none of it changes that every net rate reads 0.00 for fourteen minutes. Recorded so nobody counts it as progress against this item.

3. **The teaching layer's one text gap: "net rate" is unexplained.** Opened 2026-08-04 by V6 stage 5, which found it while scoring the thirteen-item table.

   It appears on eight pool cards, it is the most repeated phrase in the interface, it is jargon, and its only explanation is the label, which says "net rate". **V6 added three coach marks and a teaching panel and not one of them mentions it.** It is a text problem, it is cheap, and it was left unfixed because it was found in stage 5, which is a measurement stage, and building in the stage whose job is to find out whether the building worked is how a bracket stops being a bracket.

## Open, not blocking

- **Working title is still TBD, and the wordmark is now one edit rather than a search.** docs/BRIEF.md line 4 says so and no naming shortlist exists. `krebs` names an act 3 mechanic that unlocks roughly four hours into a game whose first 45 to 90 minutes are anaerobic. **V6's content guard found it hardcoded in `TopBar.tsx`**, which the audit that went looking for hardcoded strings had missed, and it now lives in `src/ui/content.ts` as `WORDMARK` with a badge saying the title is provisional.
- **The teaching panel sits behind two 16px affordances and nobody knows whether it is reached.** It carries the most important thing in act 1, docs/PILLARS.md success condition 2 in the only form act 1 can state it, and it opens from the ferment unlock slot or from either of the two new coach marks. **The obvious automatic trigger was identified and deliberately not built**: the moment fermentation is bought is also the moment the two headline numbers visibly diverge, and whether that moment wants an overlay on top of it is a comprehension question. It was left for the readers V6 did not find.
- **The blob readout is a hover tooltip, so a touch player and a keyboard player cannot reach it.** `aria-label` covers screen readers and the carbon coach mark covers the argument for shape-equals-carbon, but **colour-equals-redox exists on the hover channel alone for a sighted touch player**. DESIGN.md calls that its most important colour decision. This is the clearest single item V7 inherits.
- **Moving the disclosure off the act screen is compliance and it has a cost nobody has measured.** docs/SCIENCE.md Part 1 asks for it "in the about screen and on first launch" and it is now in both, verbatim, with a test parsing the document. It used to be visible without any action and is now one click away after being shown once. Whether that reads as burial is a reader's call and there has been no reader.
- **The first run has one button and no gate, which is correct and also the easiest thing in the world to skip.** docs/PILLARS.md rule 2 rules out a gated tutorial, so this is the right shape. Whether it is read or clicked through is unmeasured.
- **The divergence debt is discharged and the obligation to keep it discharged is new.** This entry used to be a count of what docs/ECONOMY.md was owed. It is now a count of what it holds: **thirty-seven rows across three tuning files**, 17 in `src/content/act1/tuning.ts`, 19 in `src/ui/tuning.ts` and 1 in `src/save/tuning.ts`. The old count of twenty-two was wrong in three places at once and the correction is recorded under "What the economy does". What replaces the debt is a standing rule with a test behind it: **a tuned number lives in exactly one of the three tuning files and has exactly one row.** Three numbers had been sitting outside those files since V2, the atp, adp and phosphate starting amounts in `pools.ts`, in a file whose own header said they owed a row. They were moved at unchanged values in V5 stage 5 and the guard is what found them.
- **The coach mark trigger is chosen but weakly, and V6 could not fix that. STILL OPEN, deliberately.** `COACH_MARK_TRIGGER` in `src/ui/components/CoachMark.tsx` is `'auto'`, picked in V3 stage 7 because under `'manual'` nothing on the screen explains the stall at all and the player has to find a 16px info affordance. Both behaviours are built and switching is a one-word edit. The choice was made by the person who built it, which is the least reliable possible reader.

   **V6 stage 5 existed to take this decision away from that reader and found no readers, so it left it alone rather than re-deciding it.** Closing this entry on the same unreliable reader's second opinion would be worse than leaving it open, because a closed entry stops anybody looking again.

   **One thing in the argument did move and it is recorded rather than acted on.** V6's teaching panel explains the stall too, in its fermentation paragraph, so under `'manual'` there are now two routes to an explanation where there was one. But the objection was never the count: it was that the player has to find a 16px info affordance, and the new route is also a 16px info affordance. **The case for `'auto'` is slightly weaker and it is not overturned.**

- **The scope of "the builder is the least reliable reader" is unchanged, and V6 is the log that was supposed to change it.** This page has carried that caveat since V3 and it applies to every comprehension claim in the project with exactly the same force today. **Readers found: 0. Readers asked: 0.** V6 built the thing to be read and did not get it read. See Blocking item 0, which is where this now lives as work rather than as a caveat.
- **The uptake ladder stops at 12, and V5 both confirmed the reason and found it had been overstated.** Re-measured after the bootstrap repair, time to 30000 cumulative ATP is 11m51.7s at Vmax 12 and 11m51.4s at 26, so everything above the knee sells three tenths of a second. The figures this entry used to quote, 11m24s and 11m03s, were measured before V3 stage 6 raised the environment in the same stage and were never re-run. **The lead this entry recorded was acted on and it was wrong as stated.** Preparatory-phase capacity is not sellable on its own: raising `prep` without `payoff` kills the cell, so V5 sells them together as the glycolytic capacity ladder.
- **The top of the uptake ladder over-delivers, permanently, and that is now a feature with a purchase attached.** `prep` never reaches its Vmax of 12, settling near 10.554 because it is second order in ATP, so uptake at 12 pushes intracellular glucose up by about 87 a minute forever. V3 sized that rung against a nameplate rather than a realized rate. Each rung of the glycolytic ladder narrows the gap, to +23.0 a minute, then +17.2, then +9.2, then -1.5 at the top, so the pile of unusable glucose visibly drains as the phase that consumes it is bought.
- **A backgrounded tab still loses game time. The hole is narrower and it is not closed.** What changed: `pendingOfflineMs` now survives a reload, and real time away is measured at load, capped at `MAX_OFFLINE_HOURS` and added to the same field. So the time is no longer thrown away, it is recorded, and it accumulates across sessions rather than resetting. What has not changed: **nothing spends it.** Not one tick of it is simulated, the player still sees no progress for it, and the field just grows. Narrower means the accounting is now honest, not that the player gets their time back. V5 owns spending it, and it now starts from a real number instead of from zero.
- **The offline delta is accumulated and never credited, on purpose.** `time.offlineCreditedMs` is 0 in every save this build writes. The save panel says the time away is being kept and not spent, which is the honest sentence, and it will stay wrong-sounding until V5 makes it true.
- **The autosave interval is 30 seconds and it is provisional.** `AUTOSAVE_INTERVAL_MS` in `src/save/tuning.ts`, reasoned from the unlock pacing measurement rather than measured. It is row S1 in docs/ECONOMY.md and the pacing it was reasoned from has since moved: purchases now sit 13 to 14 minutes apart rather than one and seven, so half a minute is a smaller fraction of a beat than it was. Nothing about that makes it wrong, and nobody has measured what tolerable loss is.
- **`FERMENT_ATP_THRESHOLD` has no usable range and V5 measured it.** V3 left open whether the wall's answer should appear only after the player has sat in the stall for a while. It cannot be done with this number: cumulative ATP converges on the walled ceiling of 60 in the same breath as the pathway dies, so 50 is reached 0.50s before the wall and 59.99 is reached 0.10s after it. **A delay between the wall and its answer is an interface decision**, and it belongs with the coach mark rather than with a threshold.
- **A development-time tick rate change costs one tick of game time per save, and that is the price of the rule rather than a defect.** `elapsedGameMs` is a whole multiple of the TICK_MS that wrote it, so reconstruction is exact while the rate is unchanged and floors when it is not. Storing milliseconds decouples the duration from `TICK_RATE_HZ`, which is what hard rule 6 depends on; it does not decouple the alignment. A save with a remainder is not corrupt and the loader must never treat it as corrupt. Written into docs/SAVE_SCHEMA.md Part 3 by V4.
- ~~**Buying an unlock is not part of hashed state, and V4 has to persist it.**~~ Closed 2026-07-31. It still is not hashed state, which is why it needed saying: `setReactionVmax` and `setReactionEnabled` touch no pool, no tick count and no PRNG, so a reload that dropped unlock state would pass every determinism test in the project while silently refunding every purchase. `progression.unlocked` persists it and the runtime re-applies the capacity Vmax at load. Two tests in `reloadDeterminism.test.ts` fail on purpose without each half.
- **The media query behind reduced motion has never run in a browser.** The reduced path itself was verified by forcing the flag, and it works. `usePrefersReducedMotion` is small and ordinary, but small and ordinary is not tested, and `Emulation.setEmulatedMedia` is not on the browse tool's CDP allowlist. It needs one check through real OS settings.
- **DESIGN.md's "colour leaving" sentence is backwards as written.** It says the player watches the NAD+ wall arrive as colour leaving, but `oxidized` is the desaturated end of the axis, so as NAD+ drains colour arrives. V3 encodes the reduced fraction, which is monotonic and reads well, but it is not what the sentence says. Recorded in DESIGN.md's "What survived contact".
- **The wordmark scale does not fit a persistent top bar.** DESIGN.md gives it 60 to 104px, which is a hero scale, and on the act screen it takes a permanent 100px band for a word that never changes. Implemented as specified and recorded as wrong.
- **docs/SIMULATION.md line 90 names three conserved quantities and act 1 has five.** It says "carbon, phosphate and redox equivalents". `nicotinamide` and `adenylate` are conserved too under the act 1 decomposition and are the more useful invariants, because they are what turn the NAD+ wall into a testable property. V2 deliberately did not edit docs/SIMULATION.md. Recommendation is that Part 2's wording be widened to say the conserved set is content's to declare, since act 3 will add more, but that is a spec edit and should be deliberate rather than incidental.
- **The timeline date column has no treatment for a stop with no date.** Two stops now carry `unresolved` and `hypothesis` instead of a figure. They need to read as deliberate statements at the same visual weight as a real date, and the non-linear axis has to place an undated stop by ordering constraint alone. See DESIGN.md open question 5.
- **Recovery from the NAD+ wall is instantaneous, and V3 found it is not anticlimactic.** Measured from a 20000-tick stall, which is 16.7 minutes: the payoff phase restarts after 2 ticks, 100 milliseconds. The way back in is the stranded g3p, 6.8 units left sitting in the pool for the whole stall, because ATP is at denormal by then and the preparatory phase cannot pay its entry cost. Asserted in `src/ui/__tests__/stallRecovery.test.ts`, mechanism as well as outcome, so a future balance change that consumes g3p during a stall fails there rather than silently making the wall unsolvable. On screen it reads as a whole dead pathway coming alive at once, which is the opposite of anticlimactic. The worry was misplaced.
- `STEADY_EPSILON` and `STEADY_WINDOW` shipped in V1 as unvalidated placeholders, 1e-6 and 20. docs/SIMULATION.md Part 6 marks them tune during prototype and no measurement exists yet. **They are not tuned numbers in the docs/ECONOMY.md sense**, because they are engine tolerances rather than balance decisions, and they live in `src/sim/constants.ts` with the rest of the kernel. The offline log validates them, and that measurement is the first thing it has to do.
- **The act's last 28 minutes are empty on purpose and nothing says so on screen.** Content ends at 61m57s and the food lasts to 92m42s. The environment should outlast the act rather than define it, but a player who keeps going gets half an hour of nothing at the end. Whether the act should announce it is over, or whether act 2 arrives there, is docs/PROGRESSION.md's question.
- **The two capacity ladders are sequential and nothing has watched a player meet the second one.** The glycolytic slot reads "Opens once uptake is at the top of its ladder" until it opens, which was checked in a browser and looks right. Whether a locked slot with no progress readout reads as a promise or as a dead card is a comprehension question.
- **`?ferment=on` does not survive a reload.** The development scenario door enables the reaction without minting an unlock id, so a restored save has no `ferment` in `progression.unlocked` and the reaction comes back disabled. No player path reaches it and `src/ui/scenario.ts` documents itself as a development affordance. Recorded so the next person to use that door is not confused by it.

## Next, in order

0. **Find one cold reader.** Not a log and not a stage. It is listed first because it is the only item on this page that no amount of building advances, because it gates docs/PILLARS.md's first two success conditions, and because every log after this one adds more to a screen nobody outside this project has looked at. See Blocking item 0. It does not block V7 and V7 should not wait for it.

1. **Accessibility, and the colour-alone problem.** `UPDATELOGV7.md`. **It follows this log rather than preceding it, and the reason is direction of dependency: its job is to make text and illustration perceivable, and both had to exist first.** Before V6 there was one coach mark, no panel, no first run and no readout on any blob, so an accessibility pass would have been auditing an empty room and would then have had to run again over everything V6 added. It now inherits a real teaching layer and it inherits three specific defects V6 created or exposed: the blob readout is hover-only, so it is unreachable by touch and by keyboard; colour-equals-redox exists on that channel alone for a sighted touch player; and the media query behind reduced motion has still never run in a browser.

2. **Offline progress.** `UPDATELOGV8.md`, docs/SIMULATION.md Part 3, plus validating `STEADY_EPSILON` and `STEADY_WINDOW`, which have been unvalidated placeholders since V1. Act 1 has been a real configuration to validate them against since V2, can be saved mid-run since V4, and since V5 has a steady state that is genuinely steady and reachable without falling into a trap first. **V5 chose more unlocks over a varying environment specifically to avoid handing this log a permanent fallback to coarse replay**, so it inherits an economy that suits it rather than one that fights it. It also inherits a real accumulated `pendingOfflineMs` rather than a zero, and V6 has corrected the save panel badge that told the player offline progress was landing in V5.

**The ordering note that stood here for two logs is discharged.** It said docs/ECONOMY.md should go first and warned that building on an unsettled economy costs a rewrite, and V4 built saves on top of a known hole anyway. V5 paid that debt. **The same reasoning put docs/CONTENT_STYLE.md ahead of offline progress and it was right for the same reason: text written against numbers that are about to move gets written twice, and the numbers had stopped moving.** It now puts accessibility ahead of offline progress, for text rather than for numbers.

**One ordering claim V6 cannot make.** V5's entry here said the comprehension pass "owns the question this project most needs answered by someone who is not its author". It did own it. **It did not answer it**, and the ordering above deliberately does not put another content log in front of V7 in the hope of answering it by building more, because the thing missing is a person rather than a feature.

## The vertical slice

Scope is fixed by docs/BRIEF.md line 110 and should not grow: tick loop, one pool, glycolysis, the NAD+ constraint, fermentation, no UI polish.

Done in V1: fixed timestep accumulator, pools, Michaelis-Menten flux, two-phase update, negative pool proportional scaling, seeded PRNG, the conservation property test and the determinism test.

Done in V2: one pool, glycolysis, the NAD+ constraint, fermentation.

Done in V3: the interface. **The slice is complete.**

Done in V4, outside the slice: persistence. Every property this project treats as tested is now tested across a reload as well, which is a stronger claim than any earlier log could make.

Done in V6, outside the slice: the comprehension pass. **It is the first log whose deliverable cannot be verified by the test suite**, and it is the first to end with a number that is zero rather than a measurement.

Done in V5, outside the slice: the economy. **The claim the slice exists to make is now asserted over nine purchasable configurations rather than two**: gross ATP per completed glucose is 4.000000000 and net is 2.000000000 at the shipped default and at the top of both ladders, while ATP per second goes from 31.795 to 75.494. docs/PROGRESSION.md says enzyme upgrades increase throughput and never yield, and that is measured across the whole ladder now rather than argued.

Out of scope for the slice: saves, offline progress, the timeline, the beast, and the parts of DESIGN.md the slice did not need.

## What the interface answered

This section replaces "Why the UI waits", which was a section about a thing that has stopped waiting.

The slice existed to answer two questions from docs/BRIEF.md line 110. V3 played it, and here is what it can honestly say. Standing caveat, in the same spirit as V2 stage 6 refusing to claim more than a console could show: these readings come from the person who built it, who knows where the wall is and what solves it, and that is the least reliable possible reader of whether a teaching beat teaches.

**Does the NAD+ wall read as interesting rather than annoying? Yes, and it is the strongest thing in the build.**

It is a genuine event. The pathway reaches full flux, holds it, then decays over about a second and stops at roughly three game-seconds. What sells it is that the failure is visibly not starvation: the environment is still full, glucose is piling up *inside* the cell, and the uptake arrow keeps pumping while the four downstream arrows go to hairlines. A player is looking at a cell that is drowning in food and has stopped eating. The carrier card says why, in colour, before any number is read: the blob goes from dull grey-green to vivid teal over three seconds as NAD+ becomes NADH, and the two electron dots fade in with it.

Buying lactate dehydrogenase brings the whole thing back at once. ATP per second went 0.00 to 36.48 to 41.87 across four seconds, and the entire pathway lit up in one frame. The worry recorded here that instantaneous recovery would be anticlimactic was wrong: it does not read as a cheat, it reads as a cell being unblocked.

**Do saturating kinetics feel like a game? No, not yet, and the reason is not the kinetics.**

The curves behave and the bottleneck is legible. Buying uptake capacity produced an immediate visible change, ATP per second 31.79 to 39.74 and glucose per second 7.95 to 9.94, and then the system re-settled within twenty seconds. Watching a rate step up and level off is a real reading of a saturating system, and the second capacity step gave less than the first, which is the diminishing return the question is about.

The problem is what happens between purchases. **Once act 1 is solved the screen stops changing entirely**, for as long as you leave it. Every net rate reads exactly 0.00 except lactate, ATP per second is pinned to twelve decimal places, and it stayed that way for eight consecutive minutes. That is correct simulation and honest display, and it is also a game with two events in it and ten minutes of nothing in between. Saturating kinetics cannot feel like a game while there is nothing arriving for them to respond to. This is blocking item 2 and it belongs to docs/ECONOMY.md.

**V5 measured that and it was worse than this reading said: six events, all inside the first 5m13s, then 84m47s of nothing.** It is now seven events with a worst gap of 13m51s. **That does not turn question 1's answer positive and nobody should read it that way.** What V5 can say is that the reason the answer was negative has been reduced from an 85 minute void to a 14 minute one. Whether saturating kinetics feel like a game at that spacing is a question about feel, and the standing caveat above applies to it more strongly than to anything else on this page: it was measured by the person who chose the spacing.

**On ATP per second jumping while ATP per glucose does not move.** The intended conclusion is available and it is not forced. On unlocking fermentation, ATP per second went 0.00 to 41.87 while glucose per second stayed at exactly 7.95, unchanged, in the readout right beside it. Two headline numbers side by side, one of which moved enormously and one of which did not, is as clean a statement of "this bought throughput and not yield" as the screen can make without a sentence. Whether a player draws that conclusion or the opposite one is the single thing here most in need of a reader who is not me.

**On the two failure states.** They are distinguishable at a glance with no text label. Walled is one live arrow among four hairlines with a large number in the glucose card. Starved is all five arrows alive and slow with every intracellular pool near zero and every net rate a small red negative. They do not look alike at all. A player only ever meets the walled one, because the environment is now sized so the starved one is out of reach inside act 1.

V2 is the first log that can say anything, and here is what it can honestly say. A console cannot answer a question about feel, so everything below is the shape of the thing rather than the experience of it.

**On the NAD+ wall.** It is legible as an event. The pathway starts, reaches full flux, holds it, then decays to zero over about a second, stalling at 3.05 game-seconds. At the stall, 9543 of 10000 environmental glucose remains and 438 units have piled up inside the cell, so the cause is visibly not starvation. That pile is the signal a player would read. It arrives fast enough to be met rather than waited for, and it took a tuning change to get there: at a nicotinamide pool of 10 the payoff phase peaked and died in the same breath, with no interval in which a working cell existed to lose. It is 30 now.

The number that makes the beat work is the yield. Stalled and fermenting runs both give 4.000000000 ATP per glucose gross and 2.000000000 net, agreeing to nine decimal places, while throughput between them differs by a factor of 37. Fermentation buys throughput and buys exactly zero yield, and that is an assertion in the test suite rather than an intention in a doc.

**On saturating kinetics.** Less can be said, and pretending otherwise would be the failure mode this project exists to avoid. The curves behave, `uptake` is rate-limiting by construction and everything downstream sits at whatever saturation matches its supply, but nothing here tests whether diminishing returns feel like a physical property of enzymes or like a designer's throttle. That question needs a number moving on a screen.

**What V3 has to measure.** Whether the stall reads as an interesting constraint or as the game breaking. Whether an instantaneous recovery on unlocking fermentation is satisfying or anticlimactic, because the simulation gives no ramp at all. Whether a player who sees ATP per second jump while ATP per glucose does not move draws the intended conclusion or the opposite one. And whether the two failure modes, stalled and starved, are distinguishable at a glance when they are rendered rather than printed.
