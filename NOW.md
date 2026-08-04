# Now

Last updated: 2026-07-31

Where the project actually is. Read this before the spec docs.

This file holds state. CLAUDE.md holds instruction and changes rarely. This changes most sessions. Durable decisions belong in the decisions log of the relevant spec doc, not here, so this file stays short enough to be read rather than skimmed.

If this file disagrees with a spec doc, the spec doc wins and this file is stale. Fix it.

## Status

**The slice is playable and it persists. A refresh no longer costs the run.** `npm run dev` gives an act 1 screen: a top bar, eight pool cards, the pathway with dashes flowing at the rate each reaction is running, an unlock shelf, one coach mark and a save panel. The NAD+ wall arrives about three seconds in, the coach mark opens on it, and buying lactate dehydrogenase brings the cell back inside two ticks. The game autosaves every thirty seconds, on the way out of a tab, and the instant anything is bought.

Verified in a real browser rather than only in tests: played to 89950 ms of game time with lactate at 904.663 and fermentation bought, refreshed, and game time continued from 89950 rather than resetting. Lactate kept climbing, the unlock stayed bought, no console errors.

V3 answered one of the two questions in docs/BRIEF.md line 110 and half of the other. See "What the interface answered" below, which replaces the old "Why the UI waits" section. The short version: the NAD+ wall reads as interesting, and saturating kinetics do not yet feel like a game, because once act 1 is solved the screen stops changing.

## Build state

One sentence per log. The "does not" column is the fence each stage doc inherits, so a log claims its own row and defers everything held by the rows below it.

| Log | Builds | Does not | Status |
| --- | --- | --- | --- |
| V1 | The engine kernel: constants, seeded PRNG, pools, reactions, tick, loop, conservation and determinism tests | Any content, any interface, saves | Done 2026-07-28 |
| V2 | Act 1 content: glucose uptake, glycolysis, the NAD+ pool, lactate fermentation | Any interface, the ethanol branch, glycogen storage | Done 2026-07-29 |
| V3 | The first interface, only what is needed to play the slice and answer the two questions in docs/BRIEF.md line 110 | The timeline, the beast, the rest of DESIGN.md, saves | Done 2026-07-29 |
| V4 | Persistence: save and load against docs/SAVE_SCHEMA.md version 1, plus the migration harness and its fixture test | Offline progress, any network or account | Done 2026-07-31 |
| V5 | Offline progress: steady-state detection, the analytic jump to the next event, and validation of STEADY_EPSILON and STEADY_WINDOW | New content, any interface beyond a return summary | Not started |
| V6+ | Unplanned, deliberately | Anything written here now would be fiction | Held |

The horizon is V5 and it is a real horizon rather than laziness. Act 2 is the highest-risk beat in the game and docs/PROGRESSION.md lists its shape as an open question for the prototype, so it is not decidable until the slice has been played. docs/ECONOMY.md gets written in the same window for the same reason.

**The table is deliberately NOT extended past V5, and V3 having answered the questions is the reason rather than an exception to it.** Line 30 used to say "do not extend until V3 has answered the two questions". V3 has now attempted both, and the answers do not license an extension: question 1 came back negative. Saturating kinetics do not currently feel like a game, because a solved act 1 is a static screen. That is a finding about the economy, not about act 2, and writing a V6 row for act 2 content while act 1's own loop has a hole in it would be planning on top of a known defect. What the answers do license is docs/ECONOMY.md, which is now unblocked and is the next thing that should be written. Extending this table is a decision for after that.

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

**The act 1 canonical hash moved once, in V3 stage 6, from `e9b720a8` to `657594cb`.** Exactly one thing changed it: `ACT1_GLUCOSE_ENV_INITIAL` from 10000 to 80000, and starting amounts are hashed state. No coefficient, pool, ordering, rate or kinetic form was touched. The reason is written into the assertion itself.

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

The ESLint determinism guard now covers `src/save/**` too, in two halves. Hard rules 4 and 5 apply in full, because a save carries pool amounts and a PRNG state that go straight back into the tick loop. The clock ban applies everywhere except `src/save/meta.ts`, because docs/SAVE_SCHEMA.md Part 3 makes `lastSavedAt` the only wall-clock input in the system and exactly one file has to read it. The property worth keeping is not "save code may read the clock", it is that the places that read the clock are countable. There is one.

Not built, deliberately: offline progress, cloud sync, accounts, compression, and any value under `enzymes` or `environment` that act 1 does not honestly make true.

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

    docs/ECONOMY.md        not written, deliberate, needs a prototype first
    docs/CONTENT_STYLE.md  not written, deliberate, written last

    UPDATELOGV1.md         the kernel build log, five stages, all reported
    UPDATELOGV2.md         the act 1 content log, six stages, all reported
    UPDATELOGV3.md         the first interface log, seven stages, all reported
    UPDATELOGV4.md         the persistence log, six stages, all reported

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

**V4 found nothing new for this list.** Both items below are the ones V3 left, both belong to docs/ECONOMY.md, and neither is touched by persistence. That is the point of the ordering note at the end of this file: saves were built on top of an economy known to have a hole in it, so the hole is now saved too.

1. **Act 1 as tuned has an unrecoverable state. Still open, now deferred rather than fixed.** Below roughly 400 environmental glucose, baseline maintenance drains ATP faster than the pathway can bootstrap. ATP decays to denormal, the preparatory phase can no longer pay its 2 ATP entry cost, and nothing restarts it: `prep` needs ATP and `payoff` needs the g3p that only `prep` makes. Glucose keeps arriving and the cell stays dead.

   V3 measured when a player actually reaches it and moved it out of reach rather than repairing it. `ACT1_GLUCOSE_ENV_INITIAL` went from 10000 to 80000, which puts the crossing at 114m14s at the top of the capacity ladder and out of the window entirely at the default rate, against docs/PROGRESSION.md's 45 to 90 minutes for act 1. A replenishment boundary flux was rejected because a reaction producing carbon from nothing breaks conservation on its first tick and teaching the V1 conservation test to treat the environment as a boundary is not a UI log's edit to make. Repairing the trap itself was rejected as an economy decision: it needs either a maintenance rate that backs off as ATP falls or a floor under the preparatory phase, and both are docs/ECONOMY.md's to own.

   **The trap still exists.** Any change that raises uptake capacity, lengthens the act, or lowers the environment size brings it straight back. Reproduce with `npm run dev` at `/?glucose=500&ferment=on`, or `npm run sim:drain`.

2. **A solved act 1 is a static screen, and this is the finding V3 exists to have produced.** Once fermentation is running, the pathway reaches steady state in about a minute and then nothing on the screen changes. Every net rate reads exactly 0.00 except lactate, ATP per second sits at 31.80 to twelve decimal places, and it stays that way indefinitely. Observed for eight consecutive minutes with an affordable upgrade sitting unbought. The only thing moving is a cumulative counter the player cannot see.

   This is correct simulation. A metabolic steady state is genuinely steady, and the flux-is-the-headline inversion is what surfaces it honestly rather than hiding it behind a stock that keeps climbing. It is also the reason question 1 came back negative. Act 1 currently has two events in it, the wall and the ladder, and roughly ten minutes of nothing between them.

   The fix is an economy question and not an interface one, so it belongs to docs/ECONOMY.md. Candidates, none chosen: more unlocks so there is always something approaching, an environment that varies so the steady state is disturbed, or accepting that an idle game's mid-game is meant to be quiet and making the quiet legible rather than empty. That last one is also DESIGN.md open question 7.

## Open, not blocking

- **Working title is still TBD.** docs/BRIEF.md line 4 says so and no naming shortlist exists. The wordmark is drawn as `krebs`, but the Krebs cycle unlocks roughly four hours in and does not exist during act 1.
- **docs/ECONOMY.md exists as of V5 stage 1, and the count it was owed was wrong.** There is a playable prototype, which is the thing it was waiting for. **Twenty-four provisional numbers across three files** owe it a divergence row: thirteen in `src/content/act1/tuning.ts` (five Vmax, five Km, the Hill coefficient, the nicotinamide total and the environment size), ten in `src/ui/tuning.ts` (the zero-flux threshold, dash speed, dash length, the ferment threshold, the three rungs of the uptake ladder, its two thresholds, and the offline report threshold), and one in `src/save/tuning.ts` (the autosave interval). This entry said twenty-two for two logs, and it said seven for `src/ui/tuning.ts` while listing eight things. Counted from the files with one rule applied consistently, the unit being the scalar a balance pass can move on its own, the ladder is three numbers and not one. Each of the three files exists as a single file full of provisional numbers specifically so the divergence table has three places to point rather than twenty-four. The tension with hard rule 2 is resolvable rather than merely recorded, and V5 is the log resolving it.
- **The coach mark trigger is chosen but weakly.** `COACH_MARK_TRIGGER` in `src/ui/components/CoachMark.tsx` is `'auto'`, picked in V3 stage 7 because under `'manual'` nothing on the screen explains the stall at all and the player has to find a 16px info affordance. Both behaviours are built and switching is a one-word edit. The choice was made by the person who built it, which is the least reliable possible reader.
- **The uptake ladder stops at 12 because `prep` runs at Vmax 12.** Above that, uptake delivers glucose the preparatory phase cannot consume, measured: Vmax 12 reaches 30000 cumulative ATP in 11m24s and Vmax 18 reaches it in 11m03s. A longer capacity ladder needs preparatory-phase capacity to be sellable too. That is the shape of act 1's next unlock and it is a real design lead rather than a defect.
- **A backgrounded tab still loses game time. The hole is narrower and it is not closed.** What changed: `pendingOfflineMs` now survives a reload, and real time away is measured at load, capped at `MAX_OFFLINE_HOURS` and added to the same field. So the time is no longer thrown away, it is recorded, and it accumulates across sessions rather than resetting. What has not changed: **nothing spends it.** Not one tick of it is simulated, the player still sees no progress for it, and the field just grows. Narrower means the accounting is now honest, not that the player gets their time back. V5 owns spending it, and it now starts from a real number instead of from zero.
- **The offline delta is accumulated and never credited, on purpose.** `time.offlineCreditedMs` is 0 in every save this build writes. The save panel says the time away is being kept and not spent, which is the honest sentence, and it will stay wrong-sounding until V5 makes it true.
- **The autosave interval is 30 seconds and it is provisional.** `AUTOSAVE_INTERVAL_MS` in `src/save/tuning.ts`, reasoned from the unlock pacing measurement rather than measured. Along with `OFFLINE_REPORT_THRESHOLD_MS` in `src/ui/tuning.ts` it takes the docs/ECONOMY.md debt to twenty-four provisional numbers across three files.
- **A development-time tick rate change costs one tick of game time per save, and that is the price of the rule rather than a defect.** `elapsedGameMs` is a whole multiple of the TICK_MS that wrote it, so reconstruction is exact while the rate is unchanged and floors when it is not. Storing milliseconds decouples the duration from `TICK_RATE_HZ`, which is what hard rule 6 depends on; it does not decouple the alignment. A save with a remainder is not corrupt and the loader must never treat it as corrupt. Written into docs/SAVE_SCHEMA.md Part 3 by V4.
- ~~**Buying an unlock is not part of hashed state, and V4 has to persist it.**~~ Closed 2026-07-31. It still is not hashed state, which is why it needed saying: `setReactionVmax` and `setReactionEnabled` touch no pool, no tick count and no PRNG, so a reload that dropped unlock state would pass every determinism test in the project while silently refunding every purchase. `progression.unlocked` persists it and the runtime re-applies the capacity Vmax at load. Two tests in `reloadDeterminism.test.ts` fail on purpose without each half.
- **The media query behind reduced motion has never run in a browser.** The reduced path itself was verified by forcing the flag, and it works. `usePrefersReducedMotion` is small and ordinary, but small and ordinary is not tested, and `Emulation.setEmulatedMedia` is not on the browse tool's CDP allowlist. It needs one check through real OS settings.
- **DESIGN.md's "colour leaving" sentence is backwards as written.** It says the player watches the NAD+ wall arrive as colour leaving, but `oxidized` is the desaturated end of the axis, so as NAD+ drains colour arrives. V3 encodes the reduced fraction, which is monotonic and reads well, but it is not what the sentence says. Recorded in DESIGN.md's "What survived contact".
- **The wordmark scale does not fit a persistent top bar.** DESIGN.md gives it 60 to 104px, which is a hero scale, and on the act screen it takes a permanent 100px band for a word that never changes. Implemented as specified and recorded as wrong.
- **docs/SIMULATION.md line 90 names three conserved quantities and act 1 has five.** It says "carbon, phosphate and redox equivalents". `nicotinamide` and `adenylate` are conserved too under the act 1 decomposition and are the more useful invariants, because they are what turn the NAD+ wall into a testable property. V2 deliberately did not edit docs/SIMULATION.md. Recommendation is that Part 2's wording be widened to say the conserved set is content's to declare, since act 3 will add more, but that is a spec edit and should be deliberate rather than incidental.
- **The timeline date column has no treatment for a stop with no date.** Two stops now carry `unresolved` and `hypothesis` instead of a figure. They need to read as deliberate statements at the same visual weight as a real date, and the non-linear axis has to place an undated stop by ordering constraint alone. See DESIGN.md open question 5.
- **Recovery from the NAD+ wall is instantaneous, and V3 found it is not anticlimactic.** Measured from a 20000-tick stall, which is 16.7 minutes: the payoff phase restarts after 2 ticks, 100 milliseconds. The way back in is the stranded g3p, 6.8 units left sitting in the pool for the whole stall, because ATP is at denormal by then and the preparatory phase cannot pay its entry cost. Asserted in `src/ui/__tests__/stallRecovery.test.ts`, mechanism as well as outcome, so a future balance change that consumes g3p during a stall fails there rather than silently making the wall unsolvable. On screen it reads as a whole dead pathway coming alive at once, which is the opposite of anticlimactic. The worry was misplaced.
- `STEADY_EPSILON` and `STEADY_WINDOW` shipped in V1 as unvalidated placeholders, 1e-6 and 20. docs/SIMULATION.md Part 6 marks them tune during prototype and no measurement exists yet. V5 validates them, and that measurement is the first thing it has to do.

## Next, in order

1. **docs/ECONOMY.md.** Recommended by V3 stage 7, not acted on, and V4 has now added a row to what it owes rather than writing it. It owns two things no log so far has been able to: the ATP bootstrap trap in blocking item 1, which is a balance decision rather than an interface one, and the static mid-game in blocking item 2, which is the reason question 1 came back negative. Twenty-four provisional numbers across `src/content/act1/tuning.ts`, `src/ui/tuning.ts` and `src/save/tuning.ts` owe it divergence rows.
2. **V5, offline progress.** Its first task is still validating `STEADY_EPSILON` and `STEADY_WINDOW` against a real configuration, which have been unvalidated placeholders since V1. Act 1 has been that configuration since V2 and is now a configuration that **can be saved mid-run**, which is exactly what makes the docs/SIMULATION.md Part 3 validation practical to write: the piecewise steady state path can be checked against a full-fidelity replay from a saved state, on hash equality, using the harness `reloadDeterminism.test.ts` already established. V5 also inherits a real accumulated `pendingOfflineMs` rather than a zero.

docs/ECONOMY.md went first before V4 and it did not get written, so V4 built saves on top of an economy known to have a hole in it, which means the hole is now saved too. That was the predicted cost and it is now the actual one. It should go first before V5 for the same reason and with one more log's worth of evidence behind it.

## The vertical slice

Scope is fixed by docs/BRIEF.md line 110 and should not grow: tick loop, one pool, glycolysis, the NAD+ constraint, fermentation, no UI polish.

Done in V1: fixed timestep accumulator, pools, Michaelis-Menten flux, two-phase update, negative pool proportional scaling, seeded PRNG, the conservation property test and the determinism test.

Done in V2: one pool, glycolysis, the NAD+ constraint, fermentation.

Done in V3: the interface. **The slice is complete.**

Done in V4, outside the slice: persistence. Every property this project treats as tested is now tested across a reload as well, which is a stronger claim than any earlier log could make.

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

**On ATP per second jumping while ATP per glucose does not move.** The intended conclusion is available and it is not forced. On unlocking fermentation, ATP per second went 0.00 to 41.87 while glucose per second stayed at exactly 7.95, unchanged, in the readout right beside it. Two headline numbers side by side, one of which moved enormously and one of which did not, is as clean a statement of "this bought throughput and not yield" as the screen can make without a sentence. Whether a player draws that conclusion or the opposite one is the single thing here most in need of a reader who is not me.

**On the two failure states.** They are distinguishable at a glance with no text label. Walled is one live arrow among four hairlines with a large number in the glucose card. Starved is all five arrows alive and slow with every intracellular pool near zero and every net rate a small red negative. They do not look alike at all. A player only ever meets the walled one, because the environment is now sized so the starved one is out of reach inside act 1.

V2 is the first log that can say anything, and here is what it can honestly say. A console cannot answer a question about feel, so everything below is the shape of the thing rather than the experience of it.

**On the NAD+ wall.** It is legible as an event. The pathway starts, reaches full flux, holds it, then decays to zero over about a second, stalling at 3.05 game-seconds. At the stall, 9543 of 10000 environmental glucose remains and 438 units have piled up inside the cell, so the cause is visibly not starvation. That pile is the signal a player would read. It arrives fast enough to be met rather than waited for, and it took a tuning change to get there: at a nicotinamide pool of 10 the payoff phase peaked and died in the same breath, with no interval in which a working cell existed to lose. It is 30 now.

The number that makes the beat work is the yield. Stalled and fermenting runs both give 4.000000000 ATP per glucose gross and 2.000000000 net, agreeing to nine decimal places, while throughput between them differs by a factor of 37. Fermentation buys throughput and buys exactly zero yield, and that is an assertion in the test suite rather than an intention in a doc.

**On saturating kinetics.** Less can be said, and pretending otherwise would be the failure mode this project exists to avoid. The curves behave, `uptake` is rate-limiting by construction and everything downstream sits at whatever saturation matches its supply, but nothing here tests whether diminishing returns feel like a physical property of enzymes or like a designer's throttle. That question needs a number moving on a screen.

**What V3 has to measure.** Whether the stall reads as an interesting constraint or as the game breaking. Whether an instantaneous recovery on unlocking fermentation is satisfying or anticlimactic, because the simulation gives no ramp at all. Whether a player who sees ATP per second jump while ATP per glucose does not move draws the intended conclusion or the opposite one. And whether the two failure modes, stalled and starved, are distinguishable at a glance when they are rendered rather than printed.
