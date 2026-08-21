# Now

Last updated: 2026-08-20, by V13

Where the project actually is. Read this before the spec docs.

This file holds state. CLAUDE.md holds instruction and changes rarely. This changes most sessions. Durable decisions belong in the decisions log of the relevant spec doc, not here, so this file stays short enough to be read rather than skimmed.

If this file disagrees with a spec doc, the spec doc wins and this file is stale. Fix it.

## Status

**V14 cannot start until somebody decides which act comes next, and V13 is the last log that could be finished without that decision.**

That is the first thing on this page because it is the only thing on it that no amount of building resolves. See "The act ordering decision", below, which states it as blocking for the first time and names both exits.

**There is one definition of what an act looks like at its beginning, and that is worth more than the door V13 was scheduled to build.**

The jump itself is nine lines. What took the log is that **the act boundary does not hand over and never did.** `src/ui/boundary.ts` is a detector with two members and neither returns a state; the screen on the far side of it is `EndOfContent`, which says where the game currently ends. So there was no handover to extract. What existed instead was **five expressions spread across thirty lines of `createActRuntime`**, unreachable without building a whole runtime, and that was the project's only answer to "what does act N look like at its beginning". It is `src/content/actStart.ts` now, the runtime asks it, the jump asks it, and nothing else defines one. **The two paths in the runtime unified rather than moving**: five `restoredOk === null` ternaries became one `??`, because a restored session and a fresh one differ only in where the same five values come from.

**A jumped save says it was jumped, nothing branches on it, and that is a build failure rather than a promise.** `settings.jumpedToAct` names the target act. Ten patterns for comparison, regex, `switch` and `if` fail the build if anything reads it to do something different, plus a rule V9's equivalent does not have: **no file under `src/ui/components/` or `App.tsx` may mention it at all.** Proved by planting a branch in `App.tsx` and reading three of the four assertions fire independently.

**The determinism claim is three statements and the fourth one was measured rather than assumed.** The three that hold: the same jump produces the same state every time, a session begun by a jump is internally deterministic including under irregular frame delivery, and a jumped session saved and reloaded is hash-identical. **The fourth, that a jumped session matches a played one, came out TRUE in act 1 and it is not a property of the jump.** Two act 1 facts do it: act 1's jump target is its own beginning, and unlock state is not hashed, which V4 established and is exactly why `progression.unlocked` had to be persisted separately. So two cells with identical hashes differ in whether fermentation has been bought. **Neither reason survives act 3**, where a jump has to fabricate a compartment and a transition a played session earned.

**And that measurement is what justifies the mark.** Two saves whose simulation states are byte-identical differ in exactly two places, the settings key and the unlock list, and in nothing else. Without the key a submitted save that skipped four hours of play would be indistinguishable from one that did not.

**The jump costs a player their most recent save, it was measured, and it is not fixed.** See Blocking item 7. `createSaveStore` starts `activeKnownGood` false on the argument that a store which has never been loaded from has not established its active slot is worth preserving. That is right for every session that existed before this log. **A jump is the first session in the project's history that deliberately does not load**, so it is the first one where the active slot genuinely is worth preserving and the store cannot know it. The player loses their latest save and keeps an older one.

**A query string does not serve a teacher and the reason is not the query string.** A jump lands at an act's **beginning**; a lesson wants a **beat**. Those coincide exactly once, in act 1, where the NAD+ wall arrives about three seconds in. Jumping to act 3 to show a class chemiosmosis buys a cell at the start of a 120 to 180 minute act against a 40 to 50 minute period. **So the jump makes act 3 reachable for a developer, which is what this log needed, and not for a teacher.** V15 stage 1 inherits a named-beat selector as work rather than as a question.

**The game has a spine, a character, a map through deep time and an answer for every number on screen, and it has one act.**

That is the strange state this log leaves the project in and it is worth stating first, because a reader of this page would otherwise have to work it out: **V12 built the connective tissue for four acts and wrapped it around one.** The timeline draws seven stops from the Hadean to now and the player's marker sits on the second of them. The beast reads a cell that has two of its four states available. Provenance answers for every badge in a game whose science is act 1's. **None of that is waste and all of it is early**, because everything after this is content going into a frame that already fits it, which is the opposite of the position the last nine logs were in.

**The two elements DESIGN.md says supply the game's meaning exist for the first time.** Both were cut in V3's Decisions section and neither was ever rescheduled, so the interface spent nine logs being the design working exactly as specified with both of its connective elements removed. `npm run dev` now gives three columns: deep time, the pools, the pathway. Left to right is where am I, what is happening, why.

**Eleven hand-drawn assets entered a project where every illustration was computed from a table, and the governance rule was written before the first one.** `Blob.tsx` contains no path data by rule, so the computed set inherits the palette for free and cannot name a colour it should not. Drawn assets inherit none of that: the accessibility guard reads colours out of `index.css` and an SVG `fill` presentation attribute is neither a token nor a class, and `forced-colors` does not force `fill` either. **A drawn asset was the one thing in this game that could leave the palette and ignore a user's colour setting at once, in a file nobody diffs.** The seventh guard walks `src/ui/art/` and fails the build on a colour literal, a stroke weight outside 3 to 3.5, an asset with no stroked path, or any gradient, filter, raster or opacity below 0.85. Proved by planting `#E8503C` in place of `var(--color-loss)`, which is the identical colour, and reading the failure. **No asset needed an exception.**

**The art was never the risk and the budget is what says so.** V9 built a size budget one log before this moment specifically for it. Eleven assets plus two components cost **21.04 kB of a 460 kB ceiling**, and the total went from 382.98 kB to 404.02 kB. Application sits at 89.55 kB against 130 kB.

**Two open questions from 2026-07-29 are closed and the second was closed by connecting two things DESIGN.md already contained.** Open question 7 asked what distinguishes holding at a high rate from stopped. The beast's state table has said Lively is high flux and Sluggish is flux near zero since 2026-07-28. Question and answer sat in two sections of one file for eleven days of build logs. **The join is real rather than verbal**: the beast reads gross throughput and every pool card shows a net rate, and a net rate is genuinely the same 0.00 whether a lot is happening steadily or nothing is happening at all.

**The beast makes the quiet legible. It does not make the quiet shorter, and blocking item 2 does not close here.** A picture of a cell holding steady is not a thing to do in a fourteen-minute gap. Worse for the claim and recorded anyway: act 1 produces **three beast transitions across 84000 frames and two of them are inside the first four seconds**, so across the gap itself the beast changes zero times. It is legible during the quiet and it is not eventful during it.

**The second channel is measured rather than argued, at 9.03:1 against a colour channel that peaks at 1.68:1.** DESIGN.md proposed motion for three of the four beast states and V7's rule bans movement or colour alone, so the collision had to be resolved in design. The answer is the stroked silhouette: posture, eye form, mouth form, and for Powered a closed sub-outline inside the body. Thirty measurements across six pairs and five viewing conditions, using the Machado 2009 matrices Chromium's own emulation uses, all above V7's 5.70:1 standard. **Lively and Powered share a fill outright**, so between those two the colour channel is 1.00:1 in every condition, which is not a weak channel but no channel at all.

**The game will now tell you, on demand, which of its numbers are measured, which are tuned for pacing, and which have no real counterpart at all.** Every science game claims accuracy. Per docs/ECONOMY.md the tuned scalars are 33 DEPARTURE and 15 UNSOURCED, **so for most numbers on screen the honest answer is a divergence row rather than a paper**, and the panel says so without softening it: "There is no real counterpart at all. Nothing in biology corresponds to this number and the row leaves its real behaviour column empty on purpose." A test fails the build if that sentence ever acquires the words approximately, roughly, based on or inspired.

**A timeline that can say "we do not know when" at full confidence is making the same move.** Two of the seven stops carry no date and that is a sourcing result rather than a gap: the 2.7 Ga oxygenic photosynthesis figure was removed by a 2015 contamination result and the vent stop is a proposal about a mechanism. **An undated stop is not a missing date, it is a one-sided ordering constraint**, so the date column carries a word at a figure's own weight and the spine carries a bracket running off its open end without a cap. Nothing in the treatment is dashed, dimmed or grey, because this system uses those to mean unfinished and these are the two stops where the sourcing was done hardest. The one dashed card on the view is the locked one, and that contrast is asserted.

**Blocking item 4 is closed.** Under `forced-colors: active` the offset shadow is switched off and a second outline is drawn outside the border in `CanvasText`. It was a conflict rather than a bug and both sides stay right: the substitution says what the shadow said in the one channel forced colours guarantees. **V7's decision to draw the focus indicator INSIDE is what made it affordable**, two logs before anything needed it, because the two rings never collide.

**The wordmark is fixed after four logs, and what forced it is that the timeline needed the band.** 60 to 104px is a title scale and on the act screen the wordmark is chrome. It was recorded as wrong on 2026-07-29 and no log fixed it because the fix is a design decision and none of them had a design stage. **The largest type in the game should be the thing that changes rather than the thing that never does**, which is Direction's own flux-is-the-headline applied to the chrome.

**Three of stage 1's own decisions were corrected by the build, and the corrections are the useful part.** The beast's dead band was designed in on sound general reasoning and measured out: a bare threshold and a band with the off level at half the on level produce the same 3 transitions, because act 1 does not wander across that line. The undated bracket's length carries nothing, because the thing at its far end is exactly what is not known. And the beast sits on the marker's card rather than on the spine, because 20px is not enough to draw a second channel in.

**The beast brings no tuned number, which is why this log owes docs/ECONOMY.md nothing.** Its lively boundary is `ZERO_FLUX_THRESHOLD`, the number the pathway arrows already use and the stall detector already shares. One threshold, three readings, nothing that can drift.

**Provenance cost tab stops and the cost is paid rather than hidden.** The badge is the affordance, which gives complete coverage with no call-site edits, and it took the pool rail from 3 tab stops to 13 and added 9 more on the timeline. **That inverts a decision V7 took and V7 wrote down the condition for revisiting it**: "if a later log makes pool cards interactive this fails, which is the right moment to revisit it." It failed. The skip link is built. V7's argument was right on its numbers and its numbers changed, which is a better outcome than either being wrong.

**A screen reader hears exactly what it heard before, and that number was checked rather than assumed.** 17 announcements across a full act, counted by replaying the announcer's own event derivation against a real run, against an upper bound of 17. **V12 added zero.** The timeline would have announced the act boundary a second time and the beast would have restated the stall and the recovery, and two announcements about one fact is the same defect as two copies of one fact in a save.

**Nobody who is not the author has still looked at this game.** Blocking items 0 and 0b are exactly where V6 and V7 left them. V12 added a timeline, a character, seven dated stops and a provenance panel for a reader who does not exist to fail to understand.

**The guards run now, the determinism claim is measured rather than argued, and the game is still not deployed.**

Six mechanisms that fail a build on purpose accumulated across five logs, each built deliberately, each proved to fire, and **not one of them ran unless a person typed a command.** They run on every push. Two more joined them, so the count is eight. See "What CI enforces".

**The first thing CI found was that the test suite was already failing.** Three property tests exceed vitest's default 5000ms timeout, measured alone on an idle machine at 12763ms, 7961ms and 5151ms, and which subset times out varies with load. Two consecutive baseline runs on a clean checkout gave `1 failed` and then `3 failed`. **`npm test` had been intermittently red for some time and the silence was total, because nothing ran it.** Fixed in `vite.config.ts` with a measured `testTimeout`, and the reasoning is in the comment: a timeout separates a hung test from a slow one, and it is not a performance budget.

**Hard rule 5 is vindicated by measurement.** Chromium, Firefox, WebKit and node produce byte-identical state on two pathways at 1200 ticks and at 200000 ticks. Four engines, four hashes, character for character:

```
                  toy canonical   act1 canonical   toy 200000    act1 200000
  node            172f83fb        65b43d27         f9292a7e      35d7c4b8
  chromium        172f83fb        65b43d27         f9292a7e      35d7c4b8
  firefox         172f83fb        65b43d27         f9292a7e      35d7c4b8
  webkit          172f83fb        65b43d27         f9292a7e      35d7c4b8
```

**Two of those columns are the values the whole suite is already built on**, frozen since V1 and V10, which is the point: the browsers reproduce what CI asserts rather than a second opinion computed the same afternoon. **What this does not cover is ARM**, and every measurement is x86-64. See "Open, not blocking".

**The game is configured to deploy and has not been deployed.** `CLAUDE.md` claimed "Deployed to Cloudflare Pages" from V1 to V9 and it was never true; it now says what is actually the case. The origin, the strict content security policy, the caching headers and the gated deploy job all exist. What is missing is Cloudflare credentials. **So none of the freezes have taken effect**: hard rule 6's "after launch" has not begun and `TICK_RATE_HZ` is still movable. See "What deploying will freeze".

**The strict CSP was not a compromise and nothing had to be loosened.** `default-src 'self'` with `connect-src 'none'`, verified against the real artifact under the real headers in three engines: zero violations, zero console errors, and **zero requests leaving the origin**, which is docs/PILLARS.md rule 7 checked rather than asserted for the first time.

**The act 2 oxygen constraint is written down before act 2 exists**, in docs/SIMULATION.md Part 3. It was scheduled for V8, that window closed, and it is the only thing in V9 a later log depends on.

**The project can run an act rather than the act, and act 1 has an ending.**

`src/ui/runtime.ts` was 1142 lines and every type it exported was named for act 1. It now takes an act descriptor, and the eight types are `ActSnapshot`, `ActSnapshotListener`, `ActPersistenceOptions`, `ActSession`, `ActOfflineReport`, `ActRuntimeOptions`, `ActRuntime` and `createActRuntime`. **What moved is not only names.** A walled-cell threshold, five literal pool and reaction ids, the constructor, the meter, the offline observer and the save mapping all come from `src/content/acts.ts` now, and act 1 chemistry is out of the `CardKind` type union.

**Nothing outside one fenced stage changed behaviour, and it is proved rather than claimed.** Both canonical hashes are unmoved at `172f83fb` and `65b43d27`, `git diff` is empty across the three tuning files, docs/SCIENCE.md and docs/ECONOMY.md for the whole log, and the 47-case offline sweep reports V10's figures to the digit. That is what made the largest rename in the project's history affordable: 540 tests, both hashes, a 36-case reload sweep and a 47-case offline sweep already existed, and not one of them was written for this refactor.

**The descriptor is honest about knowing one act.** It has exactly the fields a caller in `runtime.ts` needs and nothing speculative: no oxygen schedule, no damage model, no compartments, and no unlock model. Four of its types are act 1's shapes under act-neutral names and the file says so. `src/sim/jump.ts` refuses the same temptation about act 2's seam, and NOW.md has recorded twice that a wrong sentence in a specification survives until something is built on top of it.

**The runtime finally holds the rule the kernel has held since V1.** `poolIndex` was `ACT1_POOL_IDS.indexOf(id)`, a linear scan, called once per render from `PoolCard`, from V3 to V11. **All 559 tests passed through every one of those logs**, because every one of them asserts a value and a scan produces the same value a map does. It resolves once now, at construction, and nine assertions hold it: zero array scans and zero map writes per resolution, zero resolutions across 500 frames, and exactly one resolution per rail slot on a mount, computed from the card table rather than written down.

**Two guards stopped agreeing with their own lists.** `accessibility.test.ts` named ten component paths while `src/ui/components/` held twenty, and **nine of the ten it was missing shipped after it was written**, so the hole widened every log and widened silently. `contentStyle.test.ts` pointed at one file and had no guard-the-guard on the content side at all. Both walk now and both assert what they reached against the directory listing. The widened accessibility guard found **nothing to repair**: all ten of the newly covered components are clean of semantic colour as text, which is luck rather than diligence and is mechanism from here.

**Act 1 has an ending and the state on the other side of it is authored.** The boundary is a content condition, every one of the ten purchases made, and it fires once. The offline path stops at it rather than gaining an event kind. And the screen after it says where the game currently ends, with the cell still running underneath, because act 2 is four logs away and a screen that keeps ticking after the last content reads as the game breaking. **A test fails the build the moment a second act exists**, so the placeholder is removed by a build failure rather than by memory.

**The first end-to-end assertion in the project's history exists.** A fresh cell, 70 game-minutes, all ten purchases in order, the NAD+ wall met and recovered from, the boundary once, the ledger held at 4 gross and 2 net throughout. Run twice, the second with ten game-minutes resolved through the offline path, agreeing to **0.0067 percent on cumulative ATP against a 2 percent tolerance** and landing on the identical tick. 225 ms for both.

**Act 1's unlock list is complete, and the longest silence in the act is half what it was.**

`docs/PROGRESSION.md` has listed nine act 1 unlocks since 2026-07-29 and six were built. All nine are built now. Measured end to end with every unlock available, a player who buys the instant a purchase is affordable makes **ten purchases, the last at 54m03s, with a worst gap of 6m43s**, against V5's seven purchases, last at 61m57s, worst gap 13m51s. **The act is inside its 45 to 90 minute target at both ends and the worst gap in it now belongs to V5's uptake ladder rather than to anything V10 added**: the seven gaps this log placed are all between 6m19s and 6m37s.

**The cell now survives its own food running out.** Glycogen storage keeps it producing for 10m58s after the environment empties, against a cell without it that drops under half an ATP per second on the tick the food ends and produces five more ATP in total. **Total gross ATP over a full run is 320000 either way**, which is 80000 glucose times the sourced gross of 4: the reserve moves carbon in time and creates none of it.

**Act 1 releases carbon for the first time and conservation held.** The ethanol branch decarboxylates pyruvate, `co2` is a real pool with the carbon still in it, and drift across five conserved quantities is 1.819e-15 worst on carbon. The invariant survived the first content change that could have broken it.

**And the player has a decision that is not an upgrade.** Lactate or ethanol. Measured, they are identical in every number except the one they exist to differ in: recovery 2 ticks, ATP per second 31.7867, total NAD+ regeneration flux 15.8934, on either branch and with both running. What differs is what the cell is left holding.

**A player who leaves for eight hours comes back to a cell that kept running, and the game can now tell them what happened to it rather than handing them a total.**

Measured, in a real browser, against a real save: eight hours away returns a cell at **482.5 elapsed game-minutes with 160000 lactate, an empty environment and 320000 cumulative ATP**, from a save that left off at 110 game-seconds. It costs **24.6 milliseconds**, which is under two frames, against 1459 milliseconds for the full replay it stands in for. `time.offlineCreditedMs` and `stats.eventsProcessed` are non-zero for the first time in the project's history.

**docs/SIMULATION.md is fully implemented.** Part 3 was written before any code existed, it calls itself the hard problem and the one most idle games get wrong, and it is the last part to land. Every constant it left for the prototype has a measured value and both `UNVALIDATED PLACEHOLDER` blocks are gone.

**Neither of the two constants it left survived contact with measurement.** `STEADY_EPSILON` moves from 1e-6 to 1e-5 because 1e-6 sits outside the usable band. `STEADY_WINDOW` moves from 20 to 250 because 20 is an order of magnitude below its measured floor. And **the criterion those constants attach to was wrong too**: Part 3 step 2 asked for pool derivatives below epsilon, which is unsatisfiable in act 1 at any usable value and contradicts step 4 of the same algorithm. All three were corrected in the document rather than worked around in the code.

**The one thing that was implemented exactly as specified and then measured is the fallback, and it destroys the cell.** See Blocking item 6.

**The game is now perceivable without colour, without a pointer and without sight, and the one thing it still cannot be is read by somebody who has never seen it.**

That is V7's sentence and it should be read against V6's, which is still true and still first below. What V7 changed is the set of people who can reach the thing V6 built. **Act 1 is completable from the keyboard alone**, which it turns out it always was, and is now legible while you do it. **The NAD+ wall is readable without hue**, which it was not: the axis DESIGN.md calls the single most important colour decision in the system measured 7.64 dE end to end under protanopia, and a second channel now carries it at 5.70:1 or better under every deficiency and in greyscale. **A screen reader hears sixteen events across a whole act and never hears the tick.**

**None of that is a comprehension claim and none of it needs a reader to be true.** Contrast is arithmetic, a tab order is a fact about the DOM, and a level rule is either drawn or it is not. What still needs a person is whether any of it *reads*, and V7 adds a second name to that list: nobody who uses a screen reader has heard this game either. See Blocking.

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
| V7 | Accessibility, and the colour-alone problem: the redox second channel, keyboard and focus, the screen reader layer, and DESIGN.md's accessibility rule | New content, new teaching beats, the economy, the simulation | Done 2026-08-04 |
| V8 | Offline progress: steady-state detection, the analytic jump, the Part 3 validation test, crediting, and the offline return screen | New content, act 2, the economy, any change to a tuned number | Done 2026-08-05 |
| V9 | CI, cross-engine determinism and deployment: the workflow, the eight guards running on every push, the four-engine determinism measurement, the Cloudflare configuration and the strict CSP, the bundle budget, a real build id, and the act 2 oxygen constraint | Any simulation, content, economy or interface change. **And the deploy itself**, which is configured and gated and was not run for want of credentials | Done 2026-08-09, **not deployed** |
| V10 | Act 1 completion: ethanol fermentation and the first carbon released, glycogen storage, the named glycolytic enzymes, and the act re-derived end to end | An ending for act 1, the timeline, the beast, the act boundary, act 2, and any change to docs/SCIENCE.md outside stage 1 | Done 2026-08-06 |
| V11 | Spine A, the structural half: the act registry, the runtime de-specialised, content.ts as a directory, the act boundary and act 1's ending, the future-act refusal, the guards walking, and the first end-to-end playthrough | The timeline, the beast, provenance-on-click, any new visual surface, a second act, the descriptor's full shape, and any change to a tuned number | Done 2026-08-06 |
| V12 | Spine B, the surface half: the DESIGN.md stage and its six decisions, the timeline as the spine with a discrete marker, the beast and its four states, provenance on click with four destinations, the rail reading the running act, the viewport story, and the first eleven hand-drawn assets under a governance rule and a guard | A second act. Anything that makes ATP spendable. The endgame summary, the sandbox, act 3's compartment and gradient illustration rules, the pool rail regrouped for act 3, per-claim citation anchors in docs/SCIENCE.md, and any change to a tuned number | Done 2026-08-09 |
| V13 | The act jump: one definition of an act's starting state, the jump as a second caller of it, the diagnostic mark and its unbranched guard, the determinism scoping in three narrow forms, and `?jump=N` behind the existing development door | A second act. **The rest of teacher mode**, which is lesson pacing, the printable summary, the session record and the named-beat selector, all V15. A repair for the save the jump overwrites. Any interface surface for the jump. Any simulation, content, economy or visual change | Done 2026-08-20 |

**docs/SIMULATION.md is finished and that changes what the table is for.** Every part of the engine specification is implemented: the tick loop in V1, reaction kinetics in V1 and V2, offline progress in V8, number representation in V1, determinism throughout and the constants summary as of this log. It has been the document every log was measured against since V1 and there is nothing left in it to build. **What is left in the project's specifications is content**, which is docs/PROGRESSION.md acts 2 to 4, and process, which is V9.

**V10 is the log that finishes act 1's content and it is explicit about what that does not mean.** Nine unlocks built is not a finished act. Act 1 still has no ending, no timeline, no beast and no act boundary, and its last 39 minutes before the food runs out are as quiet as they ever were. See "What V10 did not do" below.

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

## What act 1 contains

Transcribed in full, because this block is the single most useful thing in this file for anyone picking the project up and it goes stale silently. Correct as of 2026-08-06, after V11.

```
  pools          glucose_env  glucose  g3p  pyruvate  lactate  ethanol  co2
                 glycogen  nad  nadh  atp  adp  pi

  reactions      uptake           glucose_env             ->  glucose
                 prep             glucose + 2 atp         ->  2 g3p + 2 adp
                 payoff           g3p + nad + 2 adp + pi  ->  pyruvate + nadh + 2 atp
                 ferment          pyruvate + nadh         ->  lactate + nad        disabled
                 ferment_ethanol  pyruvate + nadh         ->  ethanol + co2 + nad  disabled
                 store            glucose + atp           ->  glycogen + adp + pi  disabled
                 mobilise         glycogen                ->  glucose              disabled
                 maintain         atp                     ->  adp + pi

  conserved      carbon  phosphate  redox  nicotinamide  adenylate

  purchases      10, last at 54m03s, worst gap 6m43s
                 lactate fermentation      0m03s
                 uptake capacity 1         2m07s
                 uptake capacity 2         8m50s
                 glycogen storage         15m09s
                 ethanol fermentation     21m37s
                 PFK-1 and pyruvate kinase 28m06s
                 glycolytic capacity 1    34m38s
                 glycolytic capacity 2    41m07s
                 glycolytic capacity 3    47m27s
                 glycolytic capacity 4    54m03s

  environment    empties at 93m07s
  the cell stops 104m05s, on glycogen after the food is gone
  act boundary   the tenth purchase. A content condition, added by V11
  target         45 to 90 minutes
  canonical      65b43d27
  ledger         4 ATP gross, 2 net, 2 NADH, 2 pyruvate per glucose
  total ATP      320000 over a full run, with or without the reserve
```

**The ledger is the claim act 1 exists to make and nothing in V10 moved it.** Gross 4.000000000 and net 2.000000000, asserted down both fermentation branches to nine decimal places and as float identity, and measured across all nine purchasable configurations.

**The pool ids and unlock ids are contract surface and are permanent.** docs/SAVE_SCHEMA.md Part 3.

    pools     glucose_env glucose g3p pyruvate lactate ethanol co2 glycogen
              nad nadh atp adp pi
    unlocks   ferment                     lactate. Means lactate permanently
              ferment-ethanol
              glycogen-storage            turns on `store` and `mobilise` together
              enzyme-pfk1-pk              two enzymes, one purchase
              uptake-capacity-N           per rung
              glycolysis-capacity-N       per rung

**`ferment` means lactate and cannot be renamed.** V4 minted it before there was a second branch to distinguish it from and Part 3 makes a shipped id permanent.

**Three ids named in V10 stage 1 were never minted.** `enzyme-hexokinase`, `enzyme-pfk1` and `enzyme-pyruvate-kinase` became the single `enzyme-pfk1-pk`, because stage 4 measured that neither PFK-1 nor pyruvate kinase can be sold alone and that hexokinase cannot be modelled here at all. An id is permanent from the moment something ships with it, and none of these ever existed in a build.

## What V10 added to the content layer

**Three pools, three reactions, one Hill form and no change to the ledger.**

`ethanol` at carbon 2 and redox 1, `co2` at carbon 1 and redox 0, `glycogen` at carbon 6 and redox 2. The redox weights are not free choices: carbon dioxide is the most oxidised form carbon takes and carries no reducing power, which is the only pair that lets the ethanol branch balance. Glycogen matches glucose exactly, because a stored glucosyl residue is a glucose.

**Carbon dioxide is a reservoir and not a sink, and that was established before any code was written.** Act 3 produces far more of it at pyruvate dehydrogenase and around the TCA cycle, and **act 4's pyruvate carboxylase consumes it**, taking its carbon from bicarbonate. So a later act reads this pool and it must not be capped, discarded or treated as write-only accounting. docs/SCIENCE.md Part 2 gained a section saying so.

**`store` is the third Hill form in act 1 and the second that is a repair rather than a claim.** It spends ATP and produces none, which `bootstrap.test.ts` said only `maintain` did. Built as Michaelis-Menten it is first order in ATP against `prep`'s second and **NOW.md blocking item 1 came straight back**: from a starting ATP of 0.01, a cell without storage settles at 9.304 and produces 19048 ATP while a cell with it fell to 8.937e-29 and produced nothing. `ACT1_STORE_HILL_N` is 3. The assertion that caught it is rewritten as a property over every ATP-consuming reaction that produces none, rather than as a case naming `maintain`.

**Act 1 ships a futile cycle and cannot regulate it away.** A real cell controls glycogen synthesis and degradation reciprocally. `computeFlux` takes the minimum of per-substrate saturation terms and `Kinetics` has no inhibition term, so a reaction can be slowed by a scarce substrate and never by an abundant regulator. It is bounded by substrate saturation and by the arithmetic that makes the reserve self-limiting, and what would suppress it is allosteric control, which is act 4's theme. docs/SCIENCE.md Part 5 already names the same failure mode for glycolysis against gluconeogenesis.

The pathway, as V2 shipped it and before V10 extended it:

    uptake     glucose_env               ->  glucose
    prep       glucose + 2 atp           ->  2 g3p + 2 adp
    payoff     g3p + nad + 2 adp + pi    ->  pyruvate + nadh + 2 atp
    ferment    pyruvate + nadh           ->  lactate + nad          ships disabled
    maintain   atp                       ->  adp + pi

Five conserved quantities rather than three. `carbon`, `phosphate` and `redox` as docs/SIMULATION.md names them, plus `nicotinamide` (NAD+ plus NADH) and `adenylate` (ATP plus ADP). The carrier totals are what make the NAD+ wall a testable property rather than a felt one.

95 tests across the whole suite, up from V1's 65. Every reaction balances all five quantities exactly, asserted as a property over the reaction list rather than as hand-written cases. The ledger is 4 ATP gross, 2 net, 2 NADH and 2 pyruvate per glucose, computed from the reaction table and matching docs/SCIENCE.md Part 2. Act 1 conservation drift is 2.351e-13 worst observed, slightly above the toy pathway's 1.964e-13 and still three orders below tolerance. The act 1 canonical hash is `e9b720a8`.

The determinism lint guard was extended from `src/sim/**` to `src/content/**` in V2 stage 6, because content builds the descriptors the kernel runs and the hashed state is a function of content. Hard rules 4 and 5 are mechanism in both directories now.

**The act 1 canonical hash has moved four times and it is `65b43d27`.** V3 stage 6 took it from `e9b720a8` to `657594cb` by raising `ACT1_GLUCOSE_ENV_INITIAL` from 10000 to 80000, because starting amounts are hashed state. V5 stage 2 took it to `49ea08d3` by repairing the ATP bootstrap trap: `maintain` from Michaelis-Menten to Hill with `ACT1_MAINTAIN_HILL_N` of 3, and `ACT1_KM.maintain` from 20 to 12 in the same edit, because the K is derived from the form and there is no version of the repair that makes only one of them. Both reasons are written into the assertion itself. **V5 stages 3 and 4 moved no shipped default**, so the ladder and every re-derived threshold left the hash alone, which is the result rather than the absence of one: a stage that added unlock content and moved the canonical hash would have changed the starting state by accident.

**V10 moved it twice and neither move changed a number**, which is the first time that has happened. `49ea08d3` to `2b18a4bc` when stage 2 added `ethanol` and `co2`, and to `65b43d27` when stage 3 added `glycogen`. The canonical form is a function of the pool set and its order, all three pools start at zero, and the canonical script never enables the reactions that fill them. **Verified rather than argued**: the same fixture run against the previous code gives every pool amount it already had identical to seventeen significant figures, with the same tick count and the same PRNG state. A maintainer comparing act 1 before and after V10 should not go looking for an economy change that is not there. The assertion says so.

**One kinetic form changed in V5, and it is the second Hill in act 1.** `maintain` is Hill n = 3 rather than Michaelis-Menten. Unlike `prep`'s Hill, which is an attribution to PFK-1 and a claim about a real enzyme, this one is not a claim about anything. It is the ATP bootstrap repair and it has a divergence row saying so.

Not built, deliberately: the ethanol branch, glycogen storage, the ten-enzyme decomposition.

## What the interface does

`src/ui/`, added by V3. Depends on `src/content/` and `src/sim/`; neither may ever depend on it.

    runtime.ts          the bridge. Simulation, loop, meter, snapshot, rAF, unlocks
    RuntimeContext.tsx  the React side. Provider, useAct, usePoolIndex,
                        useReactionIndex, useLiveNode, useLive, useSnapshotEffect
    content/            every player-facing string, one file per surface, each
                        paired with its badge. Twelve files, was one of 1120 lines
    boundary.ts         when an act is finished, keyed by act number
    tuning.ts           every provisional interface number, all Tuned
    poolCards.ts        ten pools to eight cards, geometry read from the pool table
    scenario.ts         `?glucose=500` and `?ferment=on`, a development door
    drain.ts            `npm run sim:drain`, how long the environment lasts
    fonts/              Fredoka and Nunito as woff2, self-hosted, OFL
    components/         Card Pill Button Figure Badge Blob PoolCard PoolRail
                        PathwayCard PathwayArrow UnlockShelf CoachMark TopBar

**Three clocks, and none of them is React's.** The simulation runs at a fixed 20Hz over a mutable `Float64Array`. The display runs at whatever `requestAnimationFrame` gives. React re-renders only on discrete events: an unlock bought, a stall detected, a coach mark opened. Subscribers read one preallocated snapshot and write text, fills and classes straight to DOM nodes.

**Four things are mechanism rather than discipline.** Every number goes through `Figure`, which applies tabular figures itself, and a lint rule bans number formatting in every other `.tsx`. Every figure carries a badge as a required prop, so an unsourced number does not compile. A test parses DESIGN.md's Colour section and fails the build if `src/index.css` adds, omits or changes a colour. And a Vite plugin fails a production build if a `Needs source` badge survives into the emitted bundle, which closes DESIGN.md open question 6.

**The interface grew by one pool card, three pathway rows and three unlock slots in V10**, and by one extension to DESIGN.md's first illustration rule. The card carries ethanol and carbon dioxide together, for the reason the carrier pairs share cards: two of pyruvate's carbons staying while one leaves is the whole difference between the branches, and on two cards it is two numbers going up together.

**Illustration geometry is derived, not drawn.** There is no path data anywhere in `Blob.tsx`. A blob takes a carbon weight and a phosphate weight out of `src/content/act1/pools.ts` and draws itself, so glucose has six sides because glucose carries six carbon, and ATP shows three phosphate dots against ADP's two and free phosphate's one because that is what the conserved weights say. Asserted as a property over the pool table rather than as eight hand-written cases.

**And rule 1 reached the edge of its domain in V10, which is a change to DESIGN.md rather than to this file.** A straight-edged polygon needs three sides to enclose an area, and act 1 had no molecule under three carbons until the ethanol branch added a two-carbon one and a one-carbon one. Below three, the count moves channel and stays a count: **one round bead per carbon**, so carbon dioxide is one bead and ethanol is two. Pyruvate's three sides splitting into two beads and one bead still reads as 3 = 2 + 1, which is the arithmetic rule 1 exists to make visible and the only thing it promises. **Beads and phosphate dots are both countable circles and the collision is asserted rather than noted**: `illustration.test.ts` fails the build if a molecule below three carbons ever carries a phosphate.

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

**`progression.act` stopped being decorative in V11, and the failure that creates has a refusal rather than a crash.** It has been written by every save since V4 and read by nothing. A save naming an act this build does not have gets `session.kind === 'future-act'`, a new game in memory, both slots left on disk untouched and a line in the save panel saying so. **The same posture as the future-schema refusal and deliberately beside it**: `migrations.ts` refuses a newer save and refuses to migrate downward, ever, because this build cannot know what the fields mean. It is not clamped to the highest known act, because that loads successfully and silently rewrites somebody's progress.

The failure is real rather than hypothetical. Acts ship one log at a time and builds knowing different numbers of acts will exist at once, in a cached bundle or after a rolled-back deploy, and there is no backend and no way to push a fix to one player.

**Two different failures, kept apart.** An act that is not a whole number of 1 or more is malformed and the codec rejects it as corrupt, alongside every other malformed field. A well-formed act this build does not have is refused one layer up, and the codec has no opinion about which acts exist. Asserted directly, so a later log does not tidy the check into the codec and turn a refusal into a corruption.

**Sealing was bypassable and V11 closed it.** `save()` checked the flag while eight purchase paths and three settings writes called `autosave.saveNow` directly. Harmless while sealing only followed an import, because that session reloads immediately. Not harmless once a refused act seals a session the player can keep clicking in: buying fermentation would have written a fresh act 1 save straight over the file the refusal exists to protect. Every direct write goes through one function that checks the flag now, and `start()` no longer arms the timer or its listeners while sealed.

## What the economy does

`docs/ECONOMY.md`, added by V5. The record docs/PILLARS.md rule 5 requires and the place CLAUDE.md hard rule 2 sends balance numbers. Not a design document, and no number in it may be cited as biology.

**Forty-eight rows, one per tuned number, split by the file the number lives in.** V5 wrote thirty-seven and V10 added eleven: two for the ethanol branch, five for glycogen storage including its Hill repair, two for the enzyme purchase and one threshold each for ethanol and glycogen. Counting scalars consistently gives **24** in `src/content/act1/tuning.ts`, **23** in `src/ui/tuning.ts` and **1** in `src/save/tuning.ts`.

**Two rows were written and then deleted rather than shipped.** Hexokinase's factor and its threshold, removed when V10 stage 4 measured that the enzyme cannot be modelled against a phase that shares one half-saturation constant across its substrates. A row describes a number the game has; the measurements that killed those two are in the structural departures section instead.

**Every row is DEPARTURE or UNSOURCED and the split is 33 and 15**, against V5's 25 and 12.

**V5's original count, kept because the correction it records is still the useful part.** Thirty-seven rows, one per tuned number, split by the file the number lives in. Thirteen were expected. The count was wrong three times before this log settled it: NOW.md said twenty-two twice while enumerating twenty-three things, `src/save/tuning.ts` said twenty-one, and both undercounted the same thing, the uptake ladder. Counting scalars consistently gives 17 in `src/content/act1/tuning.ts`, 19 in `src/ui/tuning.ts` and 1 in `src/save/tuning.ts`.

**Every row is DEPARTURE or UNSOURCED and the split is the point.** 25 and 12 at V5, 33 and 15 at V10.

    DEPARTURE   a number standing where a real quantity could have stood, that
                does not match it. Every rate, pool size, starting amount and
                kinetic exponent in act 1.

    UNSOURCED   a number with no real counterpart at all. A dash length in
                pixels, a purchase threshold, an autosave interval. Its "real
                behaviour" cell is EMPTY, and that emptiness is the content of
                the row rather than a gap in it.

Rule 5 requires departures to be recorded. It does not require inventing a departure for a number that never departed from anything, and a plausible sentence in an UNSOURCED row would be the exact failure the table exists to prevent.

**Six departures are structural and have no row, because no single number carries them**: unlocks are thresholds against a lifetime ATP counter, the environment is a finite unreplenished pool, the game refuses a death a real cell can die, the glycogen storage cost is charged at the wrong end of the cycle, act 1 ships a futile cycle it cannot regulate away, and two of the three regulated glycolytic enzymes cannot be sold on their own while the third cannot be modelled at all. They are written out in their own section.

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

## What the accessibility layer does

`DESIGN.md`'s Accessibility section plus five components and one guard, added by V7. The part of the interface whose job is to make every other part reachable.

    DESIGN.md, Accessibility  the rule, promoted out of Motion and widened
    Blob.tsx                  the redox level, and the state label
    Announcer.tsx             one live region, and the event set
    index.css, focus section  the indicator, drawn inside
    Overlay.tsx               focus in, trapped, and given back
    accessibility.test.ts     the fifth guard

**The rule DESIGN.md should have had from the start is one word longer than the one it had.** "Nothing in the game may be encoded in movement alone" becomes "in movement or colour alone". It is the same argument, it was already accepted for motion on 2026-07-28, and the only reason it was not written for colour is that colour was decided first and never revisited. It is its own section now rather than a clause under Motion.

**It is a measurement rather than an argument, and the number is 7.64.** V7 stage 1 simulated the three common colour vision deficiencies against real screenshots using the Machado 2009 matrices Chromium's own emulation uses. `reduced` to `oxidized` is 37.50 dE end to end in normal vision, 17.35 under deuteranopia and **7.64 under protanopia**, with the two states act 1 actually moves between 3.21 apart against a just-noticeable difference of 2.3. Tritanopia is fine and always was, at 35.47, because the axis is a red-channel difference and a blue-yellow deficiency leaves it alone. **The design got that for free and did not know it.**

**The second channel is a level, and it is a truer encoding than the one it replaces.** The carrier is filled `oxidized`, the reduced fraction overlaid in `reduced`, and the boundary drawn as a hard ink rule whose height is the reading. The rule measures 5.70:1 or better against both sides of the boundary under every deficiency and in greyscale, against a colour channel that peaks at 1.58:1. And a pool at 56 percent reduced does not contain a substance of intermediate colour: it contains real NAD+ and real NADH in that proportion, which is what the simulation holds in two pool amounts. **The mix said the carrier is somewhat reduced. The level says 56 percent of the carriers are.**

**The silhouette did not move and neither end of the axis did.** A fully oxidized carrier is the flat blob V3 shipped, to the pixel, and so is a fully reduced one, which needed `redoxLevelY` written as a weighted sum rather than as the obvious subtraction that lands three ulps short. The claim is identical, not nearly identical, and a test asserts it.

**The channel has one blind spot and the electron dots cover it.** A level gauge carries no signal at its own ends, so at exactly 0 and exactly 1 the rule sits on the outline and vanishes in both cases. Those two are told apart by the two ink electron dots, which DESIGN.md rule 3 already gives NADH and denies NAD+, verified against a starved cell held at exactly 0. **The level is load-bearing across the range and the dot count is load-bearing at the ends**, which was not designed and is the better outcome.

**The keyboard finding went the other way and the log's own premise was wrong.** V7's Decisions section said "the game cannot be played at all without a pointer", from a grep that found no `tabIndex` and no key handlers. **Every control is a native `<button>`, which needs neither**, and act 1 was completable by keyboard before this log touched it. What was actually broken was narrower: import was unreachable because its file input carried `display: none` since V4, the focus ring was the browser default at **1.02:1 against the ink border it was drawn on**, buying an unlock dropped focus to `document.body` and threw the player past the whole shelf, and two panels claimed `aria-modal="true"` while all nine controls behind them stayed tabbable.

**The focus indicator is drawn inside the element and the hard offset shadow is why.** An outer ring is clean along the top and left and merges into the shadow along the other two, and an indicator visible on two sides is not an indicator. 3px of ink at `outline-offset: -6px`, on `:focus-visible`, at 14.19:1 or better against every surface it can appear on. Small controls take it outside, because 16px has no room inside and a pill has no shadow to collide with.

**A coach mark takes focus only when the player asked for it.** Applied literally, "opening a coach mark moves focus into it" would move focus on the automatic NAD+ mark, three seconds in, with nobody having touched anything. That is the one thing a screen reader user experiences as the page grabbing them. Manual marks take focus and give it back on Escape; the automatic one draws itself and leaves the keyboard alone.

**Speech announces events, exposes rates on demand, and never narrates the tick.** The line is the one the three-clocks architecture already draws. One polite atomic live region, nothing else on the screen carrying `aria-live` at all, and **sixteen announcements across a whole act against roughly 74000 ticks.** Measured on the real page: five in the first two minutes, covering affordability, the wall, the purchase and the recovery, and then a hundred seconds of silence while the cell held steady state.

**The rates a screen reader reads are the same figures the reduced-motion path renders, not a parallel set.** The figure is now in the DOM in both motion modes and merely `sr-only` when the dashes are carrying it. A parallel readout is how two numbers about one fact drift apart.

**An accessible name states the reading, not the legend.** The carrier announced as "One shape, and the colour is which one it is", which told a screen reader user the colour means something and never what it currently was. It says the state, in bands rather than as a figure, because **a number in an `aria-label` has nowhere to put a badge** and would be a quantitative claim with no provenance. The hover `<title>` keeps the encoding, because a sighted pointer user asking a shape what it means needs the encoding. They differ on exactly one blob.

**The palette did not move and the rule that fell out of the measurement is why.** Eight of stage 1's contrast failures were a semantic colour used as text. They cannot be fixed by darkening the token: taking `gain` far enough to read as micro text drops the ink word on the Sourced badge from 6.54:1 to 3.30:1. **The palette is built so ink reads on every semantic colour, and a colour with that property cannot also read as text on a pale surface.** So the rule is a usage rule, `a semantic colour fills and ink writes`, and `src/index.css` is byte-identical: the top bar figures, the pool card net rates and the unlock progress went to ink, and none of them lost a channel.

**`ink3` can carry nothing and now carries nothing.** 2.96:1 on white at full opacity, under the text floor on every surface, and 2.83:1 as a mark on cream, under the non-text floor too. It was the disabled button label and the stopped arrow. Both moved to `ink2`. The token stays defined and unused, and DESIGN.md says why.

**Dimming compounds, and the locked slot is the place it showed.** At `opacity-55` a locked slot's title measured 3.85:1, its detail 2.36:1 and its button label **1.65:1**, which is under the floor for a decorative border let alone for text. The dim is 0.85 now, where the three are 11.00, 4.51 and 4.51. The dashed border with no shadow still says locked, which is the point: lockedness was always on four channels and the dim was destroying the other three.

**The fifth guard.** `accessibility.test.ts`, after the determinism lint, the `Needs source` release gate, the colour test and the divergence-row test. It computes every rendered pair from the tokens in `index.css` **and from the dim read out of `Card.tsx`**, so a palette change or a dim change fails the build rather than failing a user. It bans a semantic colour as text by both routes, the class and the live style write, and it holds every meaning in the channel table to naming a second channel. Probed three ways and the probe found a hole: the dim had been written into the test as a literal, so restoring `opacity-55` left the whole block passing. **A guard that agrees with itself is not a guard.**

**Voice, taste and "does it read" are not tested and are not faked**, for the same reason `contentStyle.test.ts` refuses to test voice.

86 tests were added, taking the suite to **415 across 34 files**, and the bundle to **268.94 kB, 83.73 kB gzipped**. **The act 1 canonical hash is `49ea08d3` and no tuned number moved**: `git diff main` across the three tuning files, `docs/SCIENCE.md`, `docs/ECONOMY.md`, `src/sim/` and `src/content/` is empty for the whole log.

## What the offline path does

`src/sim/steady.ts` and `src/sim/jump.ts` in the kernel, `src/content/act1/offline.ts` and `offlineValidation.ts` in content, `creditPendingOffline` in the runtime and one overlay. Added by V8. docs/SIMULATION.md Part 3, which is the last part of that document to be implemented.

    src/sim/steady.ts            the detector, and bounded replay
    src/sim/jump.ts              horizons, the jump, the loop, the fallback
    src/content/act1/offline.ts  eleven lines carrying the meter across a jump
    offlineValidation.ts         the Part 3 sweep and the three tolerances
    validate.ts                  npm run offline:validate, the slow band
    OfflineReturn.tsx            what happened while away, with the sequence

**The two constants that had been placeholders since V1 are measured, and neither kept its value.**

`STEADY_EPSILON` is **1e-5**, was 1e-6. The usable band is 3e-6 to 1e-4, a factor of 33. Below it the walled cell stops fitting inside `SETTLE_MAX_TICKS` and every absence spent at the NAD+ wall falls back. Above it a linear extrapolation is wrong: cumulative ATP over an hour is out by 1.68e-2 at 3e-4, against a floor of 1.47e-3 that is the environment draining rather than the transient. **The shipped placeholder was outside the band.**

`STEADY_WINDOW` is **250**, was 20. The band is 142 to 436. The floor is measured: buying fermentation produces a two-timescale recovery, and between the visible restart and the slow drain of the glucose that piled up during the stall, the system sits below threshold for **141 consecutive ticks** while still moving. Declaring steady there is 20 to 33 percent out on cumulative ATP. **The smallest window that clears the gap is also the window that lands the declaration where the extrapolation is right**, which was not designed and is the reason to trust it. The ceiling is arithmetic: the window adds to every settle tick one for one and the walled cell settles at 784 plus the window.

**Part 3 step 2's criterion was wrong and the document says so now.** It asked for every pool's derivative below epsilon as a fraction of pool size. That is unsatisfiable in act 1 at any epsilon below 1e-3, because `glucose_env` drains and `lactate` accumulates linearly forever and their fractional derivative decays only as one over elapsed time. It also contradicts step 4, which advances the state by rate multiplied by duration and therefore assumes pools that are still changing. **What has to stop changing is the rate**, so the test is on the second difference. The old sentence is kept on the page with the correction, in the same spirit as V7's handling of DESIGN.md's colour sentence.

**Three constants exist that Part 3 never named, all measured, all with Part 6 entries.** `MAX_JUMP_DEPLETION_FRACTION` at 0.25, because Part 3 assumes piecewise-constant rates and a Michaelis-Menten uptake from a finite pool does not have them. `OFFLINE_DEPLETED_FRACTION` at 1e-12, because a pool consumed by a saturating reaction never actually depletes and the enumeration would not terminate. `OFFLINE_TAIL_FRACTION` at 1e-4, which decides when a pool is deep enough in its tail to finish off in one jump. **None of them is a nicety and each was added after measuring the thing that went wrong without it.**

**The Part 3 validation test exists and it is what that document says the whole approach depends on.** Two bands over one implementation: 40 cases up to eighty minutes on every `npm test`, and `npm run offline:validate` across all eleven duration bands including twenty-four hours. Seeded at 20260805, so a failure is reproducible.

    worst relative disagreement, cumulative gross ATP    7.038e-3
    worst absolute disagreement                          617.8 ATP of 306482
    worst misplaced fraction                             2.509e-2
    worst conservation drift                             1.417e-10
    fallbacks                                            0
    budget exhaustions                                   0

**The tolerance is 2e-2 on cumulative ATP and it cannot be the conservation tolerance.** V1 set 1e-9 for conservation against 1.964e-13 observed, a margin of five thousand, which is right for an invariant whose true answer is zero. The offline path's error is a designed quantity rather than an accident: roughly the jump fraction multiplied by how far the rates drift across one jump, so halving the fraction halves it. **2.8x above the worst observed, chosen so that doubling `MAX_JUMP_DEPLETION_FRACTION` cannot pass silently**, because that is the change somebody makes to speed the path up and it is what the test exists to catch.

**The pool comparison is not pool by pool and that is a better test rather than a laxer one.** At the end of a long absence a starved cell's intermediates hold 1e-4 units and disagree by 15 percent of that, which says nothing about whether the path works. What is measured is how much of each conserved quantity sits in a different pool than replay put it in, weighted and divided by that quantity's total. The question is how much of the carbon is in the wrong place.

**THE DETERMINISM GUARANTEE IS NARROWER AND IT IS THE THING A FUTURE MAINTAINER IS MOST LIKELY TO TRIP OVER.** docs/SIMULATION.md Part 5 has a Scope section now, saying three things separately:

    full replay          bit-identical, seed for seed. Unchanged, 172f83fb and 49ea08d3
    an offline jump      agrees within tolerance and is NOT bit-identical
    the offline path     reproduces itself exactly, same state in, same state out

**V13 adds three more statements to that list and they are about a different thing, so they are written here rather than beside the offline path's.** A reader who finds one set and not the other will assume the wrong thing, which is the whole reason Part 5 has a Scope section at all.

    the same jump         produces the same state every time
    a jumped session      is internally deterministic, including under
                          irregular frame delivery
    a jumped save         reloads to an identical hash, unlock ids and all

    a jumped session      is NOT the run a player would have had, and no
      versus a played one test in the project claims it is

**The fourth line is the one that needs the qualifier, because in act 1 it is measured to be false.** A jumped act 1 and a played act 1 at the same tick count hash identically, for two reasons that are both facts about act 1 rather than about jumping: act 1's jump target is its own beginning, and unlock state is not hashed. So two cells with the same hash differ in whether fermentation has been bought. **Neither reason survives act 3.** The test asserts the agreement in the direction it actually holds, so the day it stops holding the failure lands somewhere that explains what changed.

**The second is asserted rather than merely not asserted**: the test requires the two hashes to differ. A change that made them identical would mean the jump had stopped jumping, and asserting the difference is what turns a scoped guarantee into a tested one. **The narrowing was always implied by Part 3 living in the same document**, which has said since it was written that closed-form integration is unavailable and the approach is piecewise. What did not exist until now was the code, so nothing forced the sentence to be written. Same pattern V7 found: a missing statement in a specification survives until something is built on top of it.

**One thing the offline path does that nothing else in the project does: it discards matter.** Retiring a spent pool is the only place. It is bounded at `OFFLINE_DEPLETED_FRACTION` of that pool's peak, which is 1.7e-13 relative against act 1's carbon, below the tick's own observed drift of 1.113e-13, and `OfflineOutcome.discarded` reports the total so nobody has to take the bound on trust. Measured across a full day: 7.47e-17 to 4.35e-10.

**The return screen shows the sequence and collapses it, and the collapse is the design rather than a shortcut.** A day away produces up to 51 events and most of them are `glucose_env` draining a little further. Fifty lines that all say the same thing is the algorithm's step count made visible rather than the event sequence. Consecutive events on one pool become one row, which leaves the sentence DESIGN.md wrote as its own target: steady for six hours, glucose ran low, steady again. **The quiet case gets its own line and it is a claim about cells rather than an apology**, because act 1 mostly produces one event or none and designing for the interesting case would make the screen worst where it is seen most.

12 tests were added for the screen, 7 for the fallback, 26 for the jump, 28 for the detector and 10 for the validation sweep. The suite is **503 across 41 files**, up from V7's 415 across 34, and the bundle is **278.31 kB, 86.59 kB gzipped**, up from 268.94 kB and 83.73 kB.

**Both canonical hashes are unchanged and no tuned number moved** across V8: `172f83fb` and `49ea08d3`, and `git diff` across the three tuning files, docs/SCIENCE.md and docs/ECONOMY.md is empty for that whole log.

**V10 takes the suite to 540 across 42 files and the bundle to 285.18 kB, 88.58 kB gzipped.** One new test file, `src/ui/__tests__/enzymes.test.ts`. The measured act, both player models, is a report test in `unlockPacing.report.test.ts` rather than a figure in a log, so it can be re-run. The toy pathway's hash is still `172f83fb` and act 1's is `65b43d27`.

**V13 takes the suite to 1011 across 61 files and the bundle to 404.78 kB total, 309.43 kB of JavaScript at 95.89 kB gzipped**, up from V12's 404.02 kB. Application is **90.24 kB against a 130 kB budget**, up 0.69 kB. Six new test files: the start state on both sides of the import rule, the jump on both sides of it, the diagnostic guard, and the route. **Two subjects are split in two because nothing in `src/content/` may import `src/ui/`**, and asserting that the runtime's new-game path IS the start-state function needs a runtime. **Both canonical hashes are unchanged and no tuned number moved across the whole log**: `git diff` across the three tuning files, docs/SCIENCE.md and docs/ECONOMY.md is empty from V12's tip to V13's, and all four probe hashes reproduce V9's values, `172f83fb`, `65b43d27`, `f9292a7e` and `35d7c4b8`.

**V11 takes the suite to 624 across 47 files and the bundle to 290.65 kB, 89.92 kB gzipped.** Five new test files: the act registry's own shape and the import direction, index resolution on both hot paths, the act boundary, the future-act refusal, and the playthrough. **Both hashes are unchanged and no tuned number moved across the whole log**, including the one stage that adds behaviour: `git diff` across the three tuning files, docs/SCIENCE.md and docs/ECONOMY.md is empty from V10's tip to V11's.

## What the act layer does

`src/content/acts.ts`, plus `src/ui/boundary.ts` and the card table in `src/ui/poolCards.ts`. Added by V11. The part of the project that knows an act is a thing.

    src/content/acts.ts     the descriptor, the registry, and the unknown-act case
    src/content/actStart.ts what an act looks like at its beginning. V13
    src/content/actJump.ts  landing in one without playing to it. V13
    src/ui/boundary.ts      when an act is finished, keyed by act number
    src/ui/poolCards.ts     what an act looks like, keyed by the same number

**`actStart.ts` is the one V13 exists for and it is six fields.** `act`, `state`, `meter`, `unlocked`, `settings`, `carried`. `actStartState(descriptor, options?)` is the ONLY definition of an act's beginning; the runtime's new-game path calls it and the jump calls it, and a test compares the two by hash and by the whole captured save with `meta` excluded.

**Three groups are deliberately absent and each absence is a decision rather than a gap.** `progression.transitionTaken` and `progression.shuttleChoice` are named by the stage as things a start state must carry, and they are **decided by the act's own `capture` instead**, which already writes act 1's `false` and `null` with a comment saying both are honestly true of the state. Carrying them here as well would be two copies of one fact, which is the defect the whole file exists to prevent, and would put act 3's vocabulary into a function abstracting over one act. `enzymes` and `environment` are absent for the same reason. Reaction enabled flags are absent because V4 settled that they derive from `unlocked` at load. **A test captures a start state and asserts the act's values come back, so the two cannot drift apart unnoticed.**

**`actJump.ts` is nine lines and its target list is the registry.** `resolveActJump(n)` returns null for an act this build does not have, which makes act 3 jumpable the day it is registered with no edit. Null rather than clamping, for the reason V11 built `findAct` to return null: clamping succeeds, quietly, at something other than what was asked.

**Eighteen members, and every one of them has a caller in `src/ui/runtime.ts` today.**

    act                        the registry key, and progression.act
    poolIds, reactionIds       the snapshot's layout
    poolIndex, reactionIndex   map-backed, built once at module load
    create                     was createAct1(options.act1 ?? {})
    createMeter, createMeterProbes, recordTick, createOfflineObserver
    yieldBaselinePoolId        was the literal 'g3p'
    atpPerCompletedGlucose, netAtpPerCompletedGlucose
    isWalled                   was WALLED_NAD plus three inline conditions
    capture, restore, noCarriedCounters

**`isWalled` is a predicate rather than a threshold and it is the design decision in the whole registry.** A field called `walledNad` keeps act 1's chemistry in a general interface. A field called `walledPoolId` plus a number is worse, because it also asserts that every act's wall is one pool crossing one level, and act 2's is not. So the act answers the question, closing over three indices resolved at module load, allocating nothing, callable from the per-frame path.

**What it deliberately does not have, which is the point of it.** No oxygen schedule. No damage model. No compartments. No act boundary condition, because that is a stage's worth of decision on its own. **No unlock model**: act 1's two ladders, its thresholds and its purchase gates stay on the runtime, because a generic unlock descriptor designed against one act's two sequential ladders and one two-enzyme purchase is an abstraction over a sample size of one. `src/sim/jump.ts` leaves act 2's oxygen seam obvious rather than pre-solving it and says why; the same paragraph is in `acts.ts`.

**Four type aliases point at act 1 and the file says so rather than hiding it.** `ActMeter`, `ActMeterProbes`, `ActRestoreResult` and `ActCarriedCounters` are act 1's shapes under act-neutral names. Act 2 is what widens them, with two instances to be right about.

**Two things could not move into the descriptor and the reason is the import rule rather than a preference.** The card layout carries a `Surface`, a `CoachMark` and player-facing strings, and the boundary counts rungs that live in `src/ui/tuning.ts`. Content may not import the interface. So the descriptor answers what an act is and two tables in `src/ui/` answer what it looks like and when it is finished, keyed by the same act number. When the ladders move into content, the boundary moves with them.

**The act boundary is a content condition.** Every purchase made: both fermentation branches, glycogen storage, the two enzymes, and both ladders to the top. Ten, counted from the ladders rather than written down. Not a time and not an ATP total, because docs/PROGRESSION.md requires every branch to complete first, and a clock would end the act with content on the shelf while a total would end it for a player who bought nothing.

`snapshot.actComplete` is derived exactly as `walled` is, six boolean comparisons in `fill()`, so a restored save that is already complete arrives complete rather than waiting for a purchase that will never come.

**The boundary stops the offline jump rather than becoming an event kind.** `src/sim/jump.ts` locates every event in closed form from a pool crossing a level, computes the substrate mask once per absence on that assumption, and says in its own header that an unlock crossing is not a simulation event. So `OfflineStop` is one method, `ticksUntil(state)`, asked twice per iteration because the caller learns the rate of its own counter from the settle. Five cases are tested at exact ticks: crossing before the next pool event, not crossing, crossing at the end of the window, crossing at tick zero, and the boundary already behind.

**The gap between the last purchase being made and being available is real and is stated at both ends.** A purchase is a player action, so the boundary can never fire during an absence. What the offline path can see is the moment the last purchase becomes possible, and it stops there so the authored moment plays live on return. Time past that point is dropped rather than deferred, because deferring it is a trap: the same stop would fire at zero ticks on every later load until the player clicked the right button.

**And act 1's ending is authored rather than left to happen.** Three paragraphs: every enzyme built, the yield did not move and is still 2 net per glucose, and the cell keeps running from here while this build ends here. The overlay is undimmed and the simulation ticks under it, which is `FirstRunCard`'s rule at the other end of the act. It does not congratulate and it does not say "soon". `settings.boundarySeen` is the second persisted UI setting and needed no schema bump.

**One test fails the build when act 2 lands**, asserting the registry holds one act while the copy names act 2. Same mechanism `schemaVersionGate.test.ts` uses for hard rule 7.

## What the spine does

`src/ui/timeline.ts`, `src/ui/components/Timeline.tsx`, `src/ui/components/Beast.tsx`, `src/ui/art/` and `src/ui/content/provenance.ts`, added by V12.

    timeline.ts       seven stops, the admission rule, the marker mapping.
                      No player-facing string in it
    Timeline.tsx      the column. Landmark, heading, focusable scroll region
    Beast.tsx         four states as React state, and nothing continuous
    art/              ArtFrame plus eleven drawings, and a README carrying
                      the governance rule the guard enforces
    provenance.ts     four destinations, composed from the badge

**The seven stops, newest first, with the marker on the second from the bottom.**

```
  Now                modern eukaryotic cell        Tuned      locked
  ~1.7 to 1.5 Ga     early aerobic eukaryotes      Sourced    act 4
  ~2.2 to 1.5 Ga     mitochondrial endosymbiosis   Contested  act 3
  ~2.4 to 2.0 Ga     Great Oxidation Event         Sourced    act 2
  unresolved         oxygenic photosynthesis       Contested
  ~3.48 to 3.43 Ga   microbial mats                Sourced    act 1, YOU ARE HERE
  hypothesis         alkaline hydrothermal vents   Contested
```

**Every date traces to docs/SCIENCE.md Part 6 and the citations resolve against the document rather than against a list.** Six of the seven carry a Part citation and the count is asserted at six, so the seventh cannot quietly acquire one or lose it. The seventh is `Now`, which is not a claim about the record at all.

**The admission rule has real load on it for the first time and three stops do not pass cleanly.** A figure earns its place by its metabolism, not its morphology, settled 2026-07-28 as the guardrail against drifting into the tree of life. Making the timeline the frame is exactly what raises the pressure it exists to resist. The rule is written in the file somebody edits to add a stop, as four things that disqualify a candidate, and asserted.

```
  eukaryotes   PASSES ONLY ON THE REFRAME. Part 6 stop 6 says it "fails as
               drafted, passes if reframed". Eukaryotic identity in the
               Proterozoic record is size, wall and ornamentation, all
               morphology. It is on the view because the same fossils sit
               almost entirely in oxygenated bottom water

  mats         NARROW. The mats themselves are morphology. What earns the
               place is the anoxygenic phototrophy on the card

  now          DOES NOT PASS AND IS NOT MEANT TO. It is where the player's own
               cell ends up rather than a claim about the record, so it carries
               a Tuned badge and no Part. A deliberate exemption, recorded so
               nobody counts seven sourced stops
```

**The marker is discrete and its signature is the proof.** `markerStopId(act: number)` takes an act number and nothing else, so it cannot read cumulative ATP, elapsed time or a pool level, because it is not given one. **A marker that slides with a running total is a progress bar however it is drawn**, and this is the largest always-on surface in the game, so it is also where the project's central architectural claim would break first.

**Asserted twice, from two directions, and the first version of the assertion could not have failed.** The markup identity check built a runtime, drove it 200000 frames, then rendered through `RuntimeProvider`, which builds its **own** runtime and ignores the one the test aged. Both sides were a fresh cell at tick 0, so a timeline wired straight to `snapshot.tickCount` passed it. **The probe found that, not review.** It is fixed with a driver component rendered inside the provider, and re-probing fails as it should. A source-level check that the module names none of `useLive`, `useLiveNode`, `useSnapshotEffect` or `.subscribe(` sits beside it, and **the two are complementary rather than redundant**: the planted violation used `useRuntime().snapshot` directly, which the source scan does not name and did not catch.

**The beast's four states, and act 1 reaches two.**

```
  lively    the act's gross throughput is at or above the stopped threshold
  sluggish  below it. Covers the walled cell AND the starved cell
  sick      the act reports active damage.     unreachable in act 1
  powered   the act has a compartment.         unreachable in act 1
```

**No fifth state for starvation, and that was the real question.** A walled cell and a starved cell are both stopped, which is what the beast says, and which one it is sits on the pool rail where the cause lives. **The beast says the cell has stopped, the rail says why.** A fifth state means a state per cause and a character that is a status bar with legs. Decisive on timing too: act 1's environment empties at 93m07s and its authored ending fires at about 54m03s, so **starvation is a post-content condition**, reached forty minutes after the game has said the act is over.

**Powered is the only topological change in the illustration set**, asserted directly: a closed sub-outline inside a closed outline is a compartment, nothing else the game draws has one, and it reads with every fill removed because a hole in a shape is not a colour. The same sub-outline is on the timeline's endosymbiosis figure, so the moment on the column and the moment on the body are drawn as one event.

**Provenance has four destinations and the fourth was missing from the design doc's first version.**

```
  Sourced     its docs/SCIENCE.md Part, plus what that Part covers. Subject
              lines authored for all seven, not only the three cited today
  Tuned       its docs/ECONOMY.md row, and the row's verdict in the row's own
              words. UNSOURCED is a table category and not a badge, so this
              branch cannot be taken from the badge alone
  Contested   what is argued about, and who argues which side
  measured    your own session and the system clock. It points nowhere
```

**Contested is the one that had nowhere to go and it is the one that matters most later**, because the act 3 log makes a contested-science beat a headline feature. Three topics are authored from Part 6: the vent hypothesis with Jackson 2016 against and Lane 2017 in reply, oxygenic photosynthesis with the 2015 contamination result, and endosymbiosis with mitochondria-early against mitochondria-late.

**`divergenceRow` was shaped by V3 for exactly this and had never been populated by anything.** Four badges name a row now, chosen so both verdicts are reachable in play: `C5` and `C20` on the pathway, `U7` on the shelf, and `S1` on the save panel, which is the UNSOURCED one. `U7`'s badge already named the row **in prose**, where no panel could reach it.

**The verdict is derived from the document rather than transcribed.** docs/ECONOMY.md's own "How to read a row" says the real behaviour column is left empty where the science says nothing, so the guard reads the fourth cell and calls an empty one UNSOURCED. Guard-the-guarded on `C1` giving DEPARTURE and `U1` giving UNSOURCED, so a parser reading the wrong column stops disagreeing and fails.

**All three guard checks were broken deliberately and the failures are quoted in UPDATELOGV12.md stage 4.** A Part that does not exist, a Contested badge with nothing authored, and a Tuned badge naming a real row nobody wrote a verdict for. **Where the third check does not have teeth is stated rather than implied**: a Tuned badge naming no row falls to the build-statement destination and the only thing checked is that it carries a reason, because the guard cannot know whether a sentence about this build should have been a row.

**Nothing about focus or Escape is reimplemented.** The panel is `Overlay` plus a `Card`, and a test asserts `ProvenancePanel.tsx` contains no `addEventListener`, no `Escape`, no `activeElement` and no `focus()` outside its comments. Overlay has held all of it since V7 stage 3.

**The rail reads the running act for the last thing that was still act 1's.** Spine A made the card table act-keyed; `poolCards.ts` was still building its conserved-weight map from `act1PoolDefinitions()` directly, so illustration rules 1 and 2 would have drawn act 2's molecules with act 1's weights. The descriptor gains `poolDefinitions()` and the map is built from the registry. **One map across all acts rather than one per act**, because docs/SAVE_SCHEMA.md Part 3 makes a pool id permanent contract surface, so its conserved weights are a property of the pool rather than of the act reading it. A test fails if two acts ever disagree about a shared id.

## What CI enforces

`.github/workflows/ci.yml`, added by V9. On every push and every pull request, `ubuntu-latest`, Node pinned to the exact patch `24.11.1` in `.nvmrc`, which Cloudflare Pages reads too so CI and the deploy build cannot drift.

Every command is its own step, deliberately, because "CI failed" is a worse signal than "lint failed" and the guards were built to say specific things.

**Eight guards. What each protects, where it comes from, and how it was proved to fail.**

| Guard | Protects | From | Proved to fail |
| --- | --- | --- | --- |
| `eslint.config.js` determinism rules | no `Math.random`, `Math.pow`, `Math.exp`, `Math.log` in sim, content or save; the clock read in exactly one file | hard rules 4 and 5, docs/SIMULATION.md Part 5 | V9 stage 1, locally |
| `vite/needsSourceGate.ts` | no `Needs source` badge in a production bundle | hard rule 1, DESIGN.md badge contract | V9 stage 1 locally, **and stage 4 in CI** |
| `designSystem.test.ts` | `src/index.css` defines exactly the colours DESIGN.md names | DESIGN.md Colour | V9 stage 1 locally, **and stage 5 in CI** |
| `schemaVersionGate.test.ts` | a fixture and a migration for every schema version | hard rule 7 | V9 stage 1, locally |
| `divergenceTable.test.ts` | every tuned scalar has a docs/ECONOMY.md row, and the stated count matches | docs/PILLARS.md rule 5, hard rule 2 | V9 stage 1 locally, **and stage 5 in CI** |
| `accessibility.test.ts` | nothing encoded in colour alone; a semantic colour fills and ink writes | DESIGN.md Accessibility | V9 stage 1 locally, **and stage 5 in CI** |
| `vite/bundleBudget.ts` | four size budgets, so growth is a decision rather than a drift | V9 stage 4 | V9 stage 4, locally |
| `e2e/determinism.spec.ts` | the two canonical hashes reproduce in Chromium, Firefox and WebKit | hard rule 5, docs/SIMULATION.md Part 5 | not yet failed; see below |

**Five of the eight have now been proved to go red in CI rather than only on a developer's machine**, across two scratch branches that were pushed, observed and deleted. The other three were proved locally with the identical command CI runs.

**Two honest notes on that table.**

`schemaVersionGate.test.ts` **cannot** be probed in CI the way stage 1 probed it locally, and finding out why was worth the attempt: bumping `SCHEMA_VERSION` to 2 fails `tsc` before the suite ever runs, because the literal type is `1` in three places. So in CI hard rule 7 is defended twice and the **outer** defence is the type system. The guard is what catches a bump that typechecks.

The cross-engine spec has never gone red, because nothing has yet made it. It asserts values that have not moved since V1 and V10 respectively.

**Also running, and not guards.** `npm run sim` and `npm run sim:act1`, the two harnesses. `npm run offline:validate`, the 200-case sweep V8 deliberately kept out of `npm test` on the grounds that a suite taking a minute is a suite people stop running, and which NOW.md then named as the argument for CI existing at all. It is 16s in CI.

**The whole run is 2m48s** with all three browser engines, against 185s for the non-browser commands alone on the Windows development machine. Before Playwright was added it was 59 seconds on a cold cache. The eighteen browser tests cost 80 seconds in CI against 3.0 minutes locally, so the runner is faster at this too.

**And a deploy job that is gated on all of it.** `needs: guards`, only on `main`. Proved rather than argued: on both probe branches the Guards job failed and **the Deploy job was skipped**. A build the guards rejected was demonstrably unable to reach the deploy path.

## What deploying will freeze

Reviewed by V9 stage 3 and **not yet in force**, because nothing has been deployed. Recorded here because it is the entry a future maintainer will need most and look for least.

```
  TICK_RATE_HZ = 20            hard rule 6, "never change after launch"
  TICK_MS = 50                 the literal type derived from it
  SCHEMA_VERSION = 1           every future version migrates from it
  krebs.save.active            V4 declared these permanent
  krebs.save.backup
  krebs.save.temp
  the origin                   krebs.pages.dev
  pool ids, unlock ids         docs/SAVE_SCHEMA.md Part 3, already permanent
```

**The list was reviewed rather than skipped and nothing should change before it freezes.** `TICK_RATE_HZ` at 20 is the value every measurement in the project was taken at. `SCHEMA_VERSION` 1 is what the committed v1 fixture records, and V4 captured that fixture for exactly this moment.

**The origin is the other half of the save's identity and that is the part most likely to be forgotten.** `localStorage` is origin-scoped, so a save's real address is the origin plus the key, and moving the origin orphans every save exactly as completely and exactly as silently as renaming a key would. `krebs.pages.dev` was chosen by V4's argument rather than defaulted: it is the repository name and not the title, because docs/BRIEF.md line 4 still records the title as TBD and **a name that was never claiming to be the title cannot go stale.** Recorded in `wrangler.toml` and in the THE KEYS block of `src/save/storage.ts`, which also says the thing that is easy to miss: serving the same build from a second origin does not migrate a save, it creates an empty one.

## What the guards do

Thirteen now. V11 is the log that stopped two of them agreeing with their own lists, and V9 is the log that made all of them run without being asked. **The count here is larger than the eight in "What CI enforces" because that table counts build-failing guards and this one counts every mechanism, including the sweeps and the two V9 added for its own instruments.**

    determinism lint          Math.random, Math.pow, Math.exp, Math.log, Date
    Needs source release gate scans the emitted production bundle
    DESIGN.md colour test     parses the Colour section against index.css
    divergence-row test       parses docs/ECONOMY.md against the tuned scalars
    accessibility test        every rendered pair, and the channel table
    Part 3 validation sweep   40 cases in the suite, 200 beside it
    content style test        where a string lives, and what characters are in it
    schema version gate       a fixture and a migration per version
    bundle budget             four categories, V9. Growth becomes a decision
    cross-engine determinism  four engines, two pathways, V9
    buildId is diagnostic     never compared, matched or switched on, V9
    jumpedToAct is diagnostic same ten patterns, plus no component may
                              mention it at all, V13
    no player path to a jump  one caller each for the resolver and the
                              route, and App reads it from the URL only, V13

**The two V13 added are the V9 guard applied twice, and the second application is the stronger one.** `settings.jumpedToAct` gets the same treatment `meta.buildId` gets, plus an assertion V9's does not have: **no file under `src/ui/components/` or `App.tsx` may mention it.** That is not about branching, it is about rendering. docs/PROGRESSION.md makes acts strictly sequential, so nothing on screen may say a session skipped play, and a player cannot find by exploring a thing no rendered file knows exists. Proved by planting a branch in `App.tsx` and reading three of the four assertions fire independently.

**V9's guard also caught V13, which is the best evidence that it works.** `buildId.test.ts` failed the moment `actJump.ts` cited the field in a doc comment, because the guard is a substring search with an allowlist of files that legitimately **use** it. The comment was reworded rather than the allowlist widened, because an allowlist admitting citations means two things at once. The property kept is that outside tests, **a mention is a use.**

**The buildId guard exists because V9 made the field meaningful.** `meta.buildId` has been in every save since V4 and held the Vite mode, so every save ever written said "production". Nobody branches on a constant. It is the short commit SHA now, with `-dirty` when the tree is not clean, and a field that becomes meaningful is a field somebody will be tempted to branch on, so the temptation is new and the guard is new. docs/SAVE_SCHEMA.md Part 3 has said "never branched on" since V4 and nothing checked it.

**The bundle budget's own reasoning was measured after being guessed, and the guess was badly wrong.** The application and dependency shares were estimated at 102.6 kB and 188.1 kB before measuring and are **75.28 kB and 215.43 kB**. The first build carrying real budgets failed on numbers its own author had written minutes earlier. That is the argument for printing the figure on every build rather than estimating it in review.

**`accessibility.test.ts` listed ten component paths in an array while `src/ui/components/` held twenty**, and nine of the ten missing shipped after the guard was written, so the hole had been widening every log. It walks now, with a guard-the-guard comparing what it read against `readdirSync`, a floor of twenty, an assertion naming the ten that were outside it, and one assertion that the contents rather than only the filenames are in the scanned string.

**What the widening found: nothing to repair.** Zero uses of a semantic colour as a Tailwind text utility, zero writes of one into `style.color`, zero uses of `ink3`, across all ten. `PathwayCard.tsx` holds four semantic colours and all four are blob fills, which is exactly what V7's rule permits. **Four logs of palette discipline held by habit and nothing was checking it.**

**`contentStyle.test.ts` pointed at one path and had no guard-the-guard on the content half at all.** That was survivable while every string was in one file and it is the silent failure the moment they are not: a path throws, a walk quietly reaches fewer files and every assertion under it passes. It walks `src/ui/content/` now and asserts it reached everything in it, `index.ts` and `common.ts` included.

**All four probes fired**, each by breaking the thing the guard guards rather than by reading it. The most useful was narrowing the accessibility walk back to V7's exact ten, which fails in six places rather than one, because `Blob.tsx` was reachable only through the walk.

**One residual hole, named rather than fixed.** The contrast pair table in `accessibility.test.ts` is still enumerated by hand: `pairs()` lists what the act screen renders rather than deriving it from the components. The tokens and the dim are read from source, so it cannot drift on values, only on coverage. Deriving rendered pairs from component source is its own piece of work.

## What the playthrough proves

`src/ui/__tests__/playthrough.test.ts`, added by V11. The first end-to-end assertion in the project's history, through vite-node like every other harness here rather than through a browser runner.

    all ten purchases, once each, in shelf order
    both ladders to the top, all three of V10's unlocks
    the NAD+ wall arrived and was recovered from
    the act boundary fired exactly once
    the ledger held at 4 gross and 2 net throughout, worst error below 1e-6
    run twice: continuous, and with ten game-minutes resolved offline
    final tick identical, cumulative ATP within 0.0067 percent of 2 percent
    118 ms and 107 ms

**Shape, never timings.** A tuning change is expected to move timings and `unlockPacing.report.test.ts` already reports them; a suite that fails on an intended balance change teaches people to edit the expectation.

**Not bit-identical, asserted as a claim rather than left as a permission.** A run that came out identical would mean the resolution had quietly replayed instead of jumping, and the whole argument for the offline path is that it does not.

**One finding, and it is about the measurement rather than the game.** A player who buys on the exact frame a threshold is crossed buys lactate dehydrogenase at about 3.0 game-seconds, and the NAD+ wall forms at about 3.05. **So the instant-buy player bought the answer before the problem existed and `walled` was never true across a whole 70-minute run.** The player looks once a game-second now, which is the coarsest cadence that still makes every purchase in order and is the honest one.

**It proves nothing about whether any of it reads**, and that sentence is in the test file rather than only here.

## What V10 did not do

Written out because a reader of this file should not be able to mistake a complete unlock list for a complete act.

**Act 1 has no ending.** Nothing on screen says the content is over. The last purchase lands at 54m03s, the food runs out at 93m07s, and the cell stops at 104m05s, and the game says nothing about any of it. That is V11.

**There is no timeline, no beast and no act boundary.** DESIGN.md has specified the first two since 2026-07-28 and neither exists. V11 and V12.

**Act 2 is not started and is not closer to being decidable than V8 left it.** The comprehension question is still unanswered and docs/PROGRESSION.md still lists act 2's shape as an open question for the prototype.

**No tuned number outside the three tuning files moved, and docs/SCIENCE.md was edited in exactly one stage.** Hard rule 2 permits the stage 1 edit and forbids every other one; `git diff` on that file across stages 2 to 6 is empty.

**Blocking item 2 did not close.** It narrowed by half and the log says plainly that content cannot close what is left.

**Nobody who is not the author has still looked at this game.** Blocking items 0 and 0b are exactly where V6 and V7 left them, and V10 added four more things for a reader who does not exist to fail to understand.

## What V11 did not do

Written out for the same reason V10's section exists: a reader should not be able to mistake a project that could run a second act for one that has one.

**There is still no timeline, no beast and no provenance-on-click.** DESIGN.md has specified the first two since 2026-07-28. That is V12, Spine B, and it is the half of the spine that is entirely looking.

**There is no second act, and the descriptor is deliberately not designed for one.** It has act 1's fields. Act 2 widens it, and widening it against two instances is the whole reason it was not widened against one.

**The act 1 ending is machinery, not a set piece.** `docs/designs/game-spine-and-four-acts.md` E9 makes act boundaries authored set pieces. What ships is the thing that fires, so V12 can make it look like anything without also inventing when it happens, what stops the offline credit, and what the state on the other side of it is.

**The unlock ladder is still act 1's, sitting on `ActRuntime`.** `buyFerment`, `buyGlycogen`, the two ladders and their twelve methods did not move. Generalising them means designing an unlock model against one act, which is the abstraction this log exists to avoid.

**Nobody who is not the author has still looked at this game.** Blocking items 0 and 0b are exactly where V6 and V7 left them. V11 added an ending, a boundary and a refusal screen for a reader who does not exist to fail to understand.

**No tuned number moved and docs/SCIENCE.md was not touched at all.** Not in any stage, including stage 4, which is the one stage that adds behaviour.

## What V13 did not do

**It built a door and a definition. It built no game.** Nothing a player without a query string can see changed, no simulation number moved, and both canonical hashes are where V10 left them.

- **The rest of teacher mode.** Lesson pacing, the printable summary and the session record are all V15, and so is the named-beat selector V13 stage 3 found was needed. The design doc split E6 and V13 is the first half of that split, not the whole of it.
- **A repair for the save a jump overwrites.** Measured in stage 2, sized in stage 3, left open as Blocking item 7. The fix is a flag on `SaveStoreOptions` and it did not belong in a stage about routing.
- **Any interface surface for the jump.** Deliberately, and asserted five ways. Acts are strictly sequential and a skip in the interface is a product decision nobody has taken.
- **A boundary handover.** The finding was that none exists. `actStartState` is what one would call when act 2 or act 3 makes one necessary, and building the handover before there is a second act to hand over to is exactly the wrong sentence in a specification this project has now recorded three times.
- **Anything about act 3 or act 2.** `?jump=3` returns null today and will work the day an act 3 descriptor is registered, with no edit to `actJump.ts`.
- **The cold read.** Blocking item 0 is where V6 and V7 left it. V13 added a door for a developer to a game no outside reader has seen.

## What V12 did not do

**The game has the connective tissue for four acts wrapped around one, and that is the honest way to describe what it is now.** Everything below follows from it.

**It did not make ATP weigh anything, and a well-drawn character must not be read as having done so.** DESIGN.md's argument for the beast is that nothing else in the design consumes ATP, so the game produces a currency with no visible sink. **A state readout is not a sink.** The sharper version of the problem, found while answering it: the game already HAS an ATP sink and it is `maintain`, one of act 1's five reactions, turning ATP into ADP and phosphate every tick, entirely invisible. Two different things are missing.

    visible     `maintain` runs constantly and nothing attributes it to
                anything. The beast is the obvious place to attribute it,
                because the cell costs ATP to keep running and the character IS
                the cell. That is a readout change and a later log could do it
                cheaply

    spendable   purchases are thresholds against a LIFETIME ATP counter and
                debit nothing. docs/ECONOMY.md lists that as structural
                departure 1 and src/ui/tuning.ts says it outright: the adenylate
                pool is fixed, closed and conserved. Making ATP spendable is an
                economy change, a docs/ECONOMY.md pass and a re-derivation of
                act 1's pacing

**It did not shorten the quiet.** See Blocking item 2, which does not close and now says why in its own words. The beast makes the quiet legible and changes zero times across the fourteen-minute gap.

**It did not add an act, a pathway, a pool, a reaction or a tuned number.** `git diff` is empty across `src/sim/`, the three tuning files, `docs/SCIENCE.md` and `docs/ECONOMY.md` for the whole log, and both canonical hashes are unmoved at `172f83fb` and `65b43d27`. One file under `src/content/` changed and it is `acts.ts`, which gained `vitality()` and `poolDefinitions()` because stage 3 and stage 5 both require the act to answer a question rather than a component to assume one. **Neither is read by any simulation code.**

**It did not regroup the pool rail for act 3, and that is a decision written into `poolCards.ts` and asserted.** Act 3's pools are not written down anywhere, docs/PROGRESSION.md gives act 3 eight unlocks and names no pools, and the design doc's own risk table defers act 3's compartment and gradient illustration rules to the act 3 log. A grouping designed against an imagined act 3 gets redesigned there anyway, so the cost is paid twice and the version in between is worse than either.

**It did not build per-claim citation anchors in docs/SCIENCE.md**, which stays deferred to its own log. Provenance cites a Part, which is honest about its own resolution: the panel names the Part and says what the Part covers, and never implies it is pointing at a sentence.

**It did not run spike C.** The art spike was a named gate in `docs/designs/game-spine-and-four-acts.md`, two figures before committing to eleven, and it was meant to price execution and answer governance. **Governance was answered, in the design stage, before any asset was drawn, and the guard landed with the first seven.** Execution was not priced in advance; it was priced by doing it, and the answer is that eleven assets and two components cost 21.04 kB against a 460 kB ceiling. The gate was skipped and it is recorded as skipped rather than as satisfied.

**And nobody who is not the author has still looked at this game.** Blocking items 0 and 0b are exactly where V6 and V7 left them.

## What a second act would still need

The honest measure of whether this log worked is how short this list is. Concretely, and not a plan.

**Content.** `src/content/act2/` with pools, reactions, tuning, a meter, a save mapping and an offline observer, to the same shape act 1's has. One entry added to `ACTS` in `src/content/acts.ts`.

**Three things the descriptor does not yet answer, and each is a field it gains rather than a redesign.** A wall that is not a NAD+ level, which `isWalled` already accommodates because it is a predicate. An oxygen schedule, which is a boundary in wall-clock rather than in a pool level and which `jump.ts` says out loud it has not pre-solved. And a damage model.

**A kernel concept that does not exist.** Per-reaction Vmax varying dynamically as hashed simulation state. `Reaction.kinetics` is readonly and the runtime already casts through it in one place for unlocks; ROS damage makes it a live quantity with determinism and schema consequences.

**A schema bump, with a migration and a version 1 fixture.** The fixture already exists and is committed. This is the log the bump is expected in. See "The schema decision" above.

**Two tables in `src/ui/`, keyed by act number**: a card layout and a boundary condition. Both are a map entry and a literal.

**Whatever act 2's unlocks are, on the runtime.** This is the largest remaining item and it is the one V11 deliberately left: two acts is the sample size at which a general unlock model can be designed rather than guessed.

**A repaired offline fallback, first.** Blocking item 6. Act 2 breaks both halves of the reason the fallback is harmless today.

**And the thing that is not code.** docs/PROGRESSION.md still lists act 2's shape as an open question for the prototype, and act 2 introduces damage, which is the first mechanic that can take something away from a player. Whether that reads as a metabolic consequence or as a punishment is a comprehension question. See Blocking item 0.

## The schema decision

**No bump. Version 1 still, and V13 is the fourth log to decide that rather than to assume it.**

**V13 added `settings.jumpedToAct`, a number naming the act a session was jumped to, absent on every save produced by play.** That is the same additive case as the two settings keys before it and it makes three keys shipped at version 1. **The decision was not a judgement call**, because V11 was told not to leave the expiry as a silence and did not: docs/SAVE_SCHEMA.md Part 1 names the act 2 log as the next expected bump, and a jump mark has a correct default while a damaged enzyme does not. So hard rule 7 is not engaged, no migration is owed, and no fixture is needed.

The only persisted state V11 added is `settings.boundarySeen`, which a save written by V10 defaults to false. docs/SAVE_SCHEMA.md Part 1 makes a field new code can default an additive change, and the project has now proved it three times: V5's two unlock id families, V6's `settings.firstRunSeen` and this. `progression.act` was already in the version 1 shape, documented as 1 to 4, and V11 reads it rather than adding it.

**The next bump is expected in the act 2 log, and the thing that forces it is per-reaction Vmax as hashed state.** ROS damage means each reaction carries a current Vmax that is part of the simulation rather than a constant read from a tuning file, so a save has to carry it or a reload silently repairs the cell. That is not a field new code can default, because there is no correct default for how damaged an enzyme is: the honest answers are the saved value or a different game.

**Two things that will not force it, recorded so they are not mistaken for it.** The oxygen schedule index is already reserved under `environment`. And a new act's unlock ids are additive by V5's argument, in both directions.

Written into docs/SAVE_SCHEMA.md Part 1 rather than only here, because a decision that lives in a state file is a decision that goes stale.

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

    docs/ECONOMY.md        tuned numbers and the divergence table, 48 rows
    docs/CONTENT_STYLE.md  the writing contract, eight parts and a decisions log
    src/ui/art/README.md   the governance rule for hand-authored art, and the
                           guard that enforces it. Added by V12

**Every document CLAUDE.md's index promises is now real.** docs/ECONOMY.md landed in V5 and docs/CONTENT_STYLE.md in V6, and they were the last two the index described as deferred.

**docs/CONTENT_STYLE.md lost two of its own rules on contact with real work, in the two stages immediately after it was written, and neither loss weakened a rule that was doing anything.** Part 5 said a first run was three screens of one paragraph; V6 stage 3 corrected it to one screen of three, because three screens of one line is a sequence a player has to get through, which is a tutorial in shape and docs/PILLARS.md rule 2 rules a tutorial out. Part 5 said a button was 4 words; V6 stage 4's own test failed on V3's "Show me what recycles it", which V3's play reading calls the strongest beat in the build, and the ceiling moved to 5 rather than the line moving. **The pattern is worth naming: the parts of that document derived from the shipped build have held and the parts that were chosen have not.**

    UPDATELOGV1.md         the kernel build log, five stages, all reported
    UPDATELOGV2.md         the act 1 content log, six stages, all reported
    UPDATELOGV3.md         the first interface log, seven stages, all reported
    UPDATELOGV4.md         the persistence log, six stages, all reported
    UPDATELOGV5.md         the economy log, five stages, all reported
    UPDATELOGV6.md         the comprehension log, five stages, two unrun
    UPDATELOGV7.md         the accessibility log, five stages, all reported
    UPDATELOGV8.md         the offline progress log, six stages, all reported
    UPDATELOGV10.md        the act 1 completion log, six stages, all reported
    UPDATELOGV11.md        Spine A, the structural half, seven stages, all reported
    UPDATELOGV12.md        Spine B, the surface half, six stages, all reported

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

## Settled 2026-08-20, by V13

- **There is one definition of what an act looks like at its beginning and it is `actStartState`.** The runtime's new-game path calls it and the jump calls it. Nothing else may build one, and the test that holds it compares the whole captured save with `meta` excluded rather than a list of fields somebody remembered.
- **The act boundary does not hand over and never has.** `ActBoundary` is a detector with two members, neither of which returns a state. Recorded as settled because three logs' worth of planning assumed otherwise, and because the handover a later act needs now has an obvious thing to call rather than an obvious place to reinvent.
- **`transitionTaken` and `shuttleChoice` belong to the act's `capture` and not to its start state.** They are named by the stage as start-state contents and are deliberately not, because two copies of one fact is the defect the file exists to prevent and because act 3's vocabulary has no business in a function abstracting over one act. A test asserts the two agree.
- **A determinism claim about a jump is three statements and never one.** The same jump reproduces; a jumped session is internally deterministic; a jumped save reloads identically. **Not that a jumped session matches a played one**, which is measured TRUE in act 1 for two act 1 reasons and will be false in act 3.
- **The jump mark is diagnostic and never punitive.** `settings.jumpedToAct` says a session skipped play and nothing may read it to behave differently. That is a build failure rather than a convention, and no rendered file may mention it at all.
- **A jump is not a player feature and is not hidden because it is embarrassing.** Acts are strictly sequential per docs/PROGRESSION.md. A skip in the interface is a product decision nobody has taken, and it must not arrive through a log about a debugging tool.
- **The jump reaches acts and a lesson needs beats.** Answered rather than assumed, per the stage. V15 inherits a named-beat selector as work.

## Settled 2026-08-09, by V12

- **An undated timeline stop gets a word where a figure goes and a bracket where a node goes.** DESIGN.md open question 5, open since 2026-07-29. An undated stop is not a missing date, it is a one-sided ordering constraint, and both of the two turned out to be one-sided in the same direction because a stop is undated precisely when one side of it has no evidence. Nothing in the treatment is dashed, dimmed or grey. Five alternatives are recorded with the reason each lost, including a central estimate with an error bar, which would have restored a number through the back door.
- **The bracket's length carries nothing.** It cannot be drawn to scale because the thing at its far end is exactly what is not known, so the cap is the reading and the length is a fixed overhang.
- **The beast is the answer to DESIGN.md open question 7, and the answer was already in the document.** Question and answer sat in two sections of one file since 2026-07-28. The join is real because the beast reads gross throughput while every pool card reads a net rate, and a net rate is the same 0.00 in both situations.
- **The claim stops at legibility.** The quiet becomes readable and does not become shorter. Blocking item 2 does not close.
- **Every beast state is distinguishable by its stroked silhouette alone**, at 9.03:1 worst against a colour channel that peaks at 1.68:1 and is 1.00:1 between Lively and Powered. Posture is not motion: a figure drawn mid-stride does not move.
- **Four beast states and no fifth for starvation.** The beast is a readout of one quantity and not a diagnosis of its cause. A fifth state means a state per cause. Starvation is also a post-content condition, reached forty minutes after act 1's authored ending.
- **The beast has no dead band, and stage 1's reasoning for one was measured out rather than argued out.** A bare threshold and a band at half the on level both give 3 transitions across 84000 frames.
- **The beast brings no tuned number.** Its boundary is `ZERO_FLUX_THRESHOLD`, already shared between the pathway arrows and the stall detector. One threshold, three readings.
- **Hand-authored art is governed by a rule with a mechanism, written before the first asset.** Tokens only and by reference, ink carries the reading with every fill removed, one stroke band, and nothing the rest of the system already forbids. Assets live in one directory and the seventh guard walks it.
- **Under `forced-colors` the offset shadow is dropped and a second outline is drawn outside the border.** Blocking item 4, closed. A substitution rather than a removal, and V7's inside focus ring is what made it affordable.
- **The wordmark gets a compact scale and the act screen uses it.** The largest type in the game should be the thing that changes rather than the thing that never does.
- **The badge is the provenance affordance, and it cost tab stops.** The rail went from 3 to 13 and the timeline added 9, which inverted V7's decision to skip a skip link on the condition V7 itself wrote down. The skip link is built.
- **Below `lg` the timeline is first and capped at 20rem, and nothing is hidden at any width.** Decided by what the player loses: where am I is asked on arrival, what is happening and why are watched.

**The bundle, and the budget V9 built one log early for this moment.**

```
                              V11         V12       delta   budget
  application (apportioned)  75.28 kB   89.55 kB   +14.27   130.00 kB
  dependencies (apportioned)  215.42     219.12     +3.70   230.00 kB
  fonts                        68.86      68.86      0.00    72.00 kB
  styles                       19.57      22.64     +3.07    32.00 kB
  other (html, _headers)        3.85       3.85      0.00         -
  total                     382.98 kB  404.02 kB   +21.04   460.00 kB

  emitted JS                290.70 kB  308.67 kB   +17.97
  gzipped JS                 89.97 kB   95.54 kB    +5.57
```

**Nothing was cut and the ceiling was not raised.** Eleven drawn assets, two components, a stop table, three content files, a context and a panel cost 21.04 kB. The apportioned dependency figure moved without a dependency being added, which is the apportionment doing what its own header says it does when application modules are added; the total is the exact figure and it is the one to read.

## Settled 2026-08-06, by V11

- **An act is a thing rather than an assumption, and the descriptor is honest about knowing one of them.** Every field has a caller in `src/ui/runtime.ts` today and nothing speculative was added. A registry that is right about one act and says so is worth more than one that is confidently wrong about four.
- **A capability that varies per act is a predicate on the act, not a number in the caller.** `WALLED_NAD` was the test case and it settled the shape. A named threshold keeps one act's chemistry in a general interface, and a generic pool-and-threshold pair is worse, because it also asserts that every act's wall is one pool crossing one level.
- **A type alias that points at one act is honest; a structural interface invented from one act is not.** Four of the descriptor's types are act 1's shapes under act-neutral names, and the file says so. Act 2 is what widens them.
- **Ids resolve to indices at construction, in the interface as well as in the kernel.** `src/sim/pools.ts` and `src/sim/steady.ts` have held the rule since V1. The runtime did not, and `poolIndex` was a linear scan called once per render from V3 to V11 with 559 tests passing over it, **because every test in this project asserts a value and a scan produces the same value a map does.** The class of defect a value assertion cannot see needs its own assertions.
- **A guard that is told where to look stops looking.** `accessibility.test.ts` named ten files while the directory held twenty and nine of the missing ten shipped after it was written. A hand-written list fails loudly when a path is wrong and silently when a path is absent. Both guards walk now and both assert what they reached against the directory listing.
- **An act boundary is a content condition.** Every branch complete, counted from the ladders. Not a time and not a cumulative total: a clock ends the act with content on the shelf, and a total ends it for a player who bought nothing.
- **A threshold on a running total stops the offline jump rather than becoming an event kind.** Every event `jump.ts` finds is a pool crossing a level, located by a division, and the substrate mask is computed once per absence on that assumption. Stopping is the only way to add one without weakening the bound the whole algorithm rests on.
- **Uncredited time past an act boundary is dropped, not deferred.** Deferring it is a trap: the stop fires on a counter that does not go back down, so a player who does not make the purchase accrues nothing on every later load until they do. A game that quietly stops crediting is worse than one that says the act ended.
- **A save naming an act this build does not have is refused, exactly as a newer schema version is.** Not clamped. Clamping loads successfully and silently rewrites somebody's progress. A well-formed act number this build lacks is a refusal; an act that is not a whole number of 1 or more is malformed and the codec rejects it, and the codec must not acquire an opinion about which acts exist.
- **A refusal that leaves a write path armed is not a refusal.** Sealing was bypassable: `save()` checked the flag while eight purchase paths and three settings writes called `autosave.saveNow` directly. Harmless after an import, because that session reloads immediately; not harmless once a refused act seals a session the player can keep clicking in.
- **An end-to-end test asserts shape and never timings.** Timings belong where a tuning change is expected to move them. Correctness belongs where it is not.
- **A player who buys on the exact frame a threshold is crossed is not a player.** The instant-buy model completed act 1 without the NAD+ wall ever forming, because the answer became affordable 50 milliseconds before the problem existed. A measurement that models nobody measures nothing.
- **A placeholder for content that does not exist yet gets a test that deletes it.** The act 1 ending says act 2 is where the oxygen arrives, and the build fails the moment a second act is in the registry. Same mechanism hard rule 7 already uses.
- **The schema decision is a decision only if it names its own expiry.** No bump, and the next one is expected in the act 2 log, forced by per-reaction Vmax becoming hashed state. Written into docs/SAVE_SCHEMA.md rather than only into this file.

## Settled 2026-08-06, by V10

- **A complete unlock list is not a complete act.** Act 1 has all nine of the unlocks docs/PROGRESSION.md gives it and it still has no ending, no timeline, no beast and no act boundary. A reader of this file should not be able to mistake one for the other.
- **A branch that is a choice must be identical in everything except what it is a choice about.** The two fermentation branches are given the same kinetics, because nothing sources a rate for either enzyme and inventing one would settle the game's first real decision on a number nobody can check. Measured, they agree exactly on recovery time, ATP per second and NAD+ regeneration flux.
- **Carbon dioxide is a reservoir and not a sink.** Act 4's pyruvate carboxylase consumes it. A pool a later act reads from cannot be capped, discarded or treated as write-only accounting now.
- **A buffer is not a yield, and it is provable rather than promised.** Total gross ATP over a full run is 320000 with the reserve and 320000 without it, because the total is the carbon times the sourced gross of 4. The reserve moves carbon in time.
- **Every reaction that spends ATP and produces none must fall off faster in ATP than the preparatory phase does.** Not just `maintain`. Glycogen synthesis broke that premise the moment it existed and reopened blocking item 1, and the guard is a property over the reaction table now rather than a case naming one reaction.
- **A disclosed simplification eventually costs something, and this is the one that did.** "One Km per reaction, shared across all of its substrates" has been a paragraph in docs/SCIENCE.md Part 1 since 2026-07-29. It is why hexokinase cannot be sold: modelled as the affinity upgrade the enzyme actually is, it moves the preparatory phase's glucose saturation from 0.999998 to 0.999998 and its ATP saturation from 0.879530 to 0.932951. **The label would have had the wrong thing behind it.**
- **An id is permanent from the moment something ships with it, not from the moment it is written down.** Three enzyme ids were named as permanent in stage 1 and never minted, because stage 4 measured that the thing they named could not be built.
- **A purchase that raises a ceiling nothing is touching is a purchase that does nothing.** Pyruvate kinase alone buys 0.00 percent at every rung. Its function is to make phosphofructokinase-1 safe, which is a true statement about the pathway and not a bookkeeping convenience.
- **Illustration rule 1 does not reach below three carbons and now says so.** A straight-edged polygon needs three sides to enclose an area, and SVG independently defines a closed one-edged path out of existence. Below three the count moves channel and stays a count: one round bead per carbon. Pyruvate's three sides splitting into two beads and one bead still reads as 3 = 2 + 1.
- **A wrong sentence in a specification survives until something is built on top of it, and V10 found three of its own.** Stage 1's correction to docs/PROGRESSION.md item 5 was itself a prediction that stage 4 overturned. Stage 3's gate on glycogen had a stated reason that stage 5's instrumented run showed backwards. And DESIGN.md rule 1 was silent about its own domain. **V7 wrote the rule, V8 made it a pattern, and V10 is the first log to catch itself with it inside a single log.**

## Settled 2026-08-05, by V8

- **A steady state is a state whose rates have stopped changing, not one whose pools have.** A pool changing at a constant rate is exactly what the analytic jump extrapolates, so a criterion that forbids it contradicts the algorithm it belongs to. docs/SIMULATION.md Part 3 step 2 says so now and keeps the wrong sentence on the page with the correction.
- **A tolerance for a designed approximation cannot be set the way a tolerance for an invariant is.** Conservation's true answer is zero, so 1e-9 against 1.964e-13 observed is right. The offline path's error is a quantity the design chose, so its tolerance is set close enough that the change most likely to break it, a larger jump fraction, cannot pass silently.
- **Determinism is two claims, not one.** Full replay is bit-identical seed for seed. An offline jump agrees within tolerance and is not bit-identical, and the difference is asserted rather than merely not asserted, because a change that made them identical would mean the jump had stopped jumping.
- **A substrate consumed by a saturating reaction does not deplete.** Below the Km it decays exponentially with a fixed time constant, so there is always a next depletion event, always the same distance away. Any act with a Michaelis-Menten uptake from a finite pool has this, and act 1 met it twice, on `glucose_env` and then on `pyruvate` after the first was handled.
- **A pool going negative is not a small error.** Michaelis-Menten with a negative substrate returns a negative flux, which runs a reaction backwards and manufactures matter. The accuracy bound and the non-negativity bound are therefore separate, cover different sets of pools, and the second one has no exemptions.
- **The offline path discards matter, in exactly one place, bounded and reported.** Retiring a spent pool. It is the only exception to conservation in the project, it is four orders below the tolerance, and the amount is on the result object so nobody has to take the bound on trust.
- **Spending a full settle budget on every event is cheaper than it looks and buys the rate estimate.** The steady test is on curvature, so a slow mode passes it while its rate is still real. The budget was already promised by Part 3 step 1; spending it turns a decaying transient into a steady rate and moved a residual by two orders of magnitude.
- **An event list is shown collapsed.** The sequence is what changed, not how many steps the algorithm took to get there. Fifty rows that all say the same thing is the step count made visible.
- **A screen that opens on load must read well in the case it will mostly be in.** Act 1's absences mostly contain one event or none, so the quiet case gets its own line and that line is a claim about cells rather than an apology.
- **A wrong sentence in a specification survives until something is built on top of it.** V7 wrote this about DESIGN.md's colour sentence. V8 found three in docs/SIMULATION.md Part 3, a document written before any code existed and careful enough to reject four approaches with reasons. **It is a pattern rather than an anecdote now, and the lesson is about when a specification can be trusted rather than about how carefully it was written.**

## Settled 2026-08-04, by V7

- **Nothing in the game may be encoded in movement or colour alone.** DESIGN.md's Accessibility section, promoted out of Motion and widened. The same argument the motion rule already had, applied to the property it should always have covered.
- **Redundant encoding, never replacement.** Colour stays and keeps being the fast channel. A second channel is added alongside so the information survives losing the first. Replacing colour with a pattern for everyone would make the game worse for the majority to serve a minority.
- **A semantic colour fills, and ink writes.** The palette is built so ink reads on every semantic colour, which is what makes the badge contract work, and a colour with that property cannot also read as text on a pale surface. Measured, not preferred: darkening `gain` enough to read as micro text takes the Sourced badge word from 6.54:1 to 3.30:1.
- **`ink3` may not carry meaning.** Under the text floor on every surface in the palette and under the non-text floor on most. Still defined, used by nothing.
- **Dimming compounds and has to be measured that way.** A pair table that lists flat colours misses the case where an ancestor's opacity is what breaks the text. The locked slot is the example and it was the worst ratio on the screen at 1.65:1.
- **The focus indicator is drawn inside the element.** The hard offset shadow makes an outer ring clean on two edges and invisible on the other two.
- **Speech announces events, exposes rates on demand, and never narrates the tick.** Sixteen events in a whole act against roughly 74000 ticks. The rates a screen reader reads are the same figures the reduced-motion path renders, never a parallel set.
- **An accessible name states the reading, not the legend**, and it carries no figure, because an `aria-label` has nowhere to put a badge.
- **Focus moves into an overlay only when the player opened it.** An automatic coach mark draws itself and leaves the keyboard alone. Announcing it is the alternative and it is what the live region is for.
- **A guard that agrees with itself is not a guard.** Two of V7's five probes found the assertion rather than the code: a contrast test that hardcoded the value it was checking, and an arrow-colour test that searched markup no per-frame callback ever writes to. **Probe every guard by breaking the thing it guards, not by reading it.**

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

**V13 added one, and it is the first item on this list that is a cost the log measured on itself rather than a defect it inherited.**

7. **A jump overwrites the player's most recent save and leaves no copy of it.** Opened 2026-08-20 by V13 stage 2, measured in stage 2 and sized rather than repaired in stage 3.

   **The mechanism is a V4 decision working exactly as designed against a case that did not exist until now.** `createSaveStore` starts `activeKnownGood` at false, and its own comment gives the reason: "a store that has never been loaded from has not established that its active slot is worth preserving, and refusing to promote costs one generation of backup depth on the first write of a session." **Every session in the project's history before this one loads before it writes.** A jump is the first that deliberately does not, so it is the first for which the active slot genuinely is worth preserving and the store has no way to know it.

   Measured over three generations:

   ```
     session 1   new game, save            active = gen1   backup = none
     session 2   loads gen1, save          active = gen2   backup = gen1
     jump        does not load, save       active = jumped backup = gen1

     gen2, the player's most recent save, is in neither slot.
   ```

   **So the player loses their latest save and keeps an older one**, which is the worst of the three possible outcomes to have to explain. Recorded as a passing test in `src/ui/__tests__/actJump.test.ts` rather than as a note, so a later log that changes the behaviour fails there.

   **It is blocking rather than urgent, and the reason is the same shape as item 6's.** Nothing reaches it by accident: the door is a query parameter with no interface, asserted by five tests to have no player path, and it is the same exposure `?glucose=500` already has against a smaller risk. It is on this list because **a code path that silently destroys a save should not sit in the build unexamined**, which is the sentence item 6 already carries about the offline fallback.

   **The fix, for whoever takes it.** The store has to be told that its active slot is worth preserving without having loaded from it, which is one flag on `SaveStoreOptions` and a line in the jump's persistence options. It is a `src/save/` change, it was out of scope for a stage about routing, and it is small. What is NOT small and should not be smuggled in with it is any question about whether a jump should refuse to write at all, because that would break the reload property stage 2 exists to provide.

**V9 added nothing to this list and closed nothing on it.** The cross-engine measurement came back clean, so the finding it was built to surface does not exist: there is no engine divergence to report and nothing in stages 1 to 5 produced a new blocking item. The two things V9 leaves undone, the deploy and its live verification, are recorded under "Open, not blocking" because neither blocks any planned log.

**The list is still headed by a person rather than a feature, and V9 does not change that.** Item 0 has been open since 2026-08-04 and is the only item on this page that no amount of building advances.

**V8 added one, and it is the first item on this list that is a defect in a specification rather than a gap in the build.**

6. **The offline fallback, implemented exactly as docs/SIMULATION.md Part 3 specifies, destroys the cell.** Opened 2026-08-05 by V8 stage 5, which ran it deliberately because the stage said a fallback nobody has ever executed is not a fallback.

   **Coarse replay at 1Hz credits exactly zero ATP, from every act 1 configuration, at every window length.** Measured against full replay: a fermenting cell that makes 114287 ATP over an hour makes 0. A cell at the top glycolytic rung that makes 269820 makes 0.

   **The mechanism is act 1's own bootstrap trap, reached by the integrator rather than by the economy.** `prep` costs 2 ATP per unit of flux and a one-second step asks for twenty times what a tick asks for, against an adenylate pool of 40. The proportional scaling saves conservation and nothing else: ATP goes to the floor on the first step, the preparatory phase can no longer pay its entry cost, and the payoff phase never runs again. **This is the state blocking item 1 closed, arrived at from a healthy cell in one step.**

   **Part 3 predicted the shape and understated the size.** Its own rejection of coarse replay as a method says explicit Euler with a large step "produces wrong answers rather than approximate ones". The wrong answer is total.

   **The implementation is not what is wrong with it.** The fallback conserves all five quantities to better than 1e-9, never drives a pool negative, and covers a window that is not a whole number of coarse steps rather than dropping the remainder. What is wrong is the specification.

   **Nothing reaches it in normal play**, which is why this is blocking rather than urgent: act 1 always settles, asserted over 200 randomized absences and every configuration. It is on this list because a code path that silently destroys a player's cell should not sit in the build unexamined, and because the flag it raises, `diagnostics.offlineFallbackCount`, would tell a maintainer a bug had happened without telling them the save was ruined.

   **The measured alternative, for whoever decides.** Part 3 rejected full replay because "the cost is unbounded in elapsed time", and `MAX_OFFLINE_HOURS` bounds it. A full-fidelity replay of the maximum credit is **1459 milliseconds**, measured. That is a visible stall and it is correct, against 22 milliseconds that is not. Changing Part 3's fallback is a specification decision and V8 stage 5 was a wiring stage, so it was measured and reported rather than taken. `fallback.test.ts` asserts the zero, so the day somebody fixes it the test fails and this entry can be deleted rather than left stale.

**V6 added one, V7 widened it and added two conflicts.**

0b. **Nobody who uses a screen reader has heard this game, and no screen reader has been run against it at all.** Opened 2026-08-04 by V7 stages 1 and 4, which both had to report the same limitation.

   **What was done instead is Chrome's computed accessibility tree, before and after, on the real page.** That tree is what Chrome hands to the platform accessibility API, so it is what a screen reader consumes, and every defect stage 1 named is visible in it as fixed: landmarks 3 to 8, headings 3 to 4, live regions 0 to 1, the carrier's name from the encoding to the reading, the pathway from unreachable by structure to a region with a heading.

   **What a tree cannot tell you is how it sounds, how long it takes, or whether it is bearable**, and every claim V7 makes is of the first kind. NVDA and JAWS are not installed on this machine and Narrator exposes no way to capture what it said, so driving one would have meant reporting the builder's reading of the page as a reading of the page. **That is the substitution UPDATELOGV6.md stages 2 and 5 refused and it was refused again here.**

   **This is a smaller ask than item 0 and it is a different person.** One screen reader user, ten minutes, `npm run dev` at a fresh state. Or, much cheaper and worth doing first: install NVDA and run act 1 end to end, which at least turns "unrun" into a builder's reading, which is worth less than a real one and more than nothing.

0. **Nobody who is not the author has ever looked at this game.** Opened 2026-08-04 by V6, which was built to close it and could not. It is stated as blocking rather than as an open question because **it blocks the two things docs/PILLARS.md lists as its first and second success conditions**, and because no amount of further building closes it. Every other item on this page can be worked on; this one cannot be worked around.

   **What is needed is small.** One person who has never seen it, ten minutes, `npm run dev` at a fresh state, and somebody silent in the room writing down what they say. UPDATELOGV6.md stages 2 and 5 carry the full protocol and the three questions, and stage 2's report explains why an agent cannot run it.

   **The single most valuable data point named in the protocol is unmeasured and it is the one docs/PROGRESSION.md predicts**: what a player thinks buying lactate dehydrogenase will do, asked before they buy it. Most players arrive expecting fermentation to be an energy upgrade. Nobody has watched that expectation be corrected or fail to be.

   **One thing is permanently lost and should be recorded rather than hoped away.** Stage 2 was a pre-change baseline and the change has now landed. A cold read taken today measures this build, with the first run and the teaching layer in it, against nothing. **The comparison V6 was designed around cannot be recovered.** A single post-change reading is still worth far more than none.

4. ~~**Forced-colors mode removes the hard offset shadow without removing it, and this is a conflict rather than a bug.**~~ **Closed 2026-08-09 by V12**, decided in stage 1 and shipped in stage 5. Struck rather than deleted, because the reasoning is the useful part and both sides of it stayed right.

   **The fix is a substitution, not a removal.** Under `forced-colors: active` the offset shadow is switched OFF rather than recoloured, because a shadow in a system colour participates in a palette it was never designed against, and a second rule is drawn outside the card's own border in `CanvasText` at `inset: -6px`. What the shadow says is "this is a separate piece of paper above the page", and a second outline says it in the one channel forced colours guarantees.

   **V7's decision to draw the focus indicator INSIDE is what made it affordable**, taken two logs before anything needed it. The focus ring is at `outline-offset: -6px`, inside the border, and this rule is outside it, so the two never collide and a focused card under forced colours reads as separated and focused at once. Had focus been an outer ring, this fix would have had to fight it. It is a pseudo-element rather than an `outline` for the same reason: `outline` is spoken for.

   **Only cards that carry a shadow are marked.** A dashed slot has none, so there is nothing to substitute for, and drawing a second outline around it would say "separate piece of paper" about the one thing on the screen that is deliberately not one yet.

   **It took a design stage rather than a repair, which is why four logs did not fix it.** V7 declined inside an audit stage and said so. V12 stage 1 is the first design stage since, and it took it.

   The original entry, kept because it is the record of what was measured:

4b. **The original finding, 2026-08-04 by V7 stage 1.**

   In `forced-colors: active` the page goes black ground, white text, white outlines. Text and card outlines are fine and every card still reads as a card. `box-shadow` is not forced, so DESIGN.md's `4px 4px 0` ink shadow is still painted, onto a black ground, where it is invisible while the layout still reserves its offset. **The paper cutout read collapses entirely**, and DESIGN.md calls that shadow load-bearing.

   **It is recorded as a conflict because both sides are right.** A user setting says "remove your colours, use mine" and a design decision says "this shadow is what makes the system legible". Naming it a defect implies somebody was careless and nobody was. The available fix is a `forced-colors` block that swaps the shadow for a second outline, and it is a design decision rather than a repair, so it was not taken inside an audit stage.

   **Two things that survived and should not be lost.** The badge fills flatten to black-on-white, so Sourced, Tuned and Contested become typographically identical and are told apart only by the word, which is exactly what V7's channel table predicted. And SVG `fill` set as a presentation attribute is not forced, so the blobs keep their colours and the redox axis keeps working: **forced-colors is not a second route to the colour-alone problem.**

5. **`prefers-contrast: more` does nothing, and "nothing" is exact.** Opened 2026-08-04 by V7 stage 1. The query matches and the rendered page is indistinguishable from the default, because there is no `prefers-contrast` block anywhere in `src/index.css` and no component reads it.

   This is an absence rather than a regression, and it is the cheapest item on this page: the failing pairs are all enumerated, the guard already computes them, and after V7 every one of them clears AA anyway. What a `prefers-contrast` block would buy is AAA for a user who asked for it, and nobody has decided whether that is worth a second palette.

**One item closed, one narrowed, and nothing new added.** Both belonged to docs/ECONOMY.md, which is why neither moved for three logs.

1. ~~**Act 1 as tuned has an unrecoverable state.**~~ **Closed 2026-08-03 by V5 stage 2.** Open since V2 stage 5, deferred by V3 stage 6 and again by V4.

   **It was worse than this entry described.** "Below roughly 400 environmental glucose" was not the boundary: every environment size from 10 to 2000 killed a healthy cell, and what was constant was the damage, exactly 169.57 glucose stranded inside a corpse at every size large enough to have it. The unrecoverable part was measured directly for the first time by emptying an environment and then refilling it: ATP at refeed 3.953e-323 and 0.00 ATP produced over the following ten game-minutes, with a full larder in front of the cell.

   **The cause was an ordering fact rather than a tuning one.** `prep` is Hill n = 2 in ATP so its flux falls as the square at low ATP, while Michaelis-Menten maintenance falls only linearly, so consumption beat production below some level for every possible choice of constants. Sweeping `ACT1_KM.maintain` from 5 to 500 repairs it at no value. The repair makes maintenance fall off faster than the preparatory phase does: `maintain` moved to the Hill form with n of 3, its K derived at 12 so the new curve passes through the old one at act 1's steady-state ATP. **The healthy economy did not move.** ATP per second, gross and net yield, the walled ceiling of 60 and the wall's arrival time are all unchanged.

   **What is not fixed and never will be, stated plainly.** ATP of exactly zero with no stranded g3p is still absorbing, because `prep` is the only route to g3p and making ATP from no ATP would break conservation. Recovery time from a near-zero ATP scales as 1/atp. The repair works by making the collapse not happen, not by making those levels survivable. `src/content/act1/__tests__/bootstrap.test.ts` asserts both halves including the mechanism, so a later balance pass that drops maintenance back to Michaelis-Menten fails there rather than reintroducing this quietly.

2. **A solved act 1 is a static screen. NARROWED, NOT CLOSED**, and it stays in Blocking rather than being downgraded, because V5 stage 3 existed to fix it and got most of the way rather than all of it.

   **The measurement was much worse than this entry described.** Act 1 as V4 shipped it had six discrete events, every one inside the first 5m13s, and then **84m47s in which nothing happened at all**, against a 45 to 90 minute target. "Roughly ten minutes of nothing between two events" understated it by an order of magnitude. One correction to the old wording: the screen is not literally frozen. The displayed ATP per second declines monotonically as the environment drains, crossing a two-decimal boundary every one to three minutes. A number very slowly going down is not an event, which is why it reads as nothing happening.

   **What V5 did.** More unlocks, chosen over a varying environment because docs/SIMULATION.md Part 3 builds offline progress on the system reaching steady state, and an environment that never settles would make the next log's central mechanism fall back to coarse replay permanently. The glycolytic capacity ladder adds four purchases. **Events went from 6 to 7 and the longest gap from 84m47s to 13m51s**, with the last purchase at 61m57s instead of 5m13s.

   **What V5 said was left, and V10 built all of it.** V5's entry said shortening the gap needed more things to sell, and that act 1's three remaining unbuilt unlocks all extend the pathway, which its scope forbade. V10's scope was exactly those three.

   **V10 halved it. NARROWED AGAIN, and the content is now spent.** Ten purchases, last at 54m03s, **worst gap 6m43s against V5's 13m51s**, act inside its 45 to 90 minute target at both ends. Seven of the nine gaps are between 6m19s and 6m37s.

   **The gap that is left is V5's and not V10's.** The longest wait in act 1 is now between uptake capacity 1 at 2m07s and uptake capacity 2 at 8m50s, which is `UPTAKE_ATP_THRESHOLDS[1]`, row U9. Everything after it is already evenly spaced, so pulling it earlier would only move the longest gap somewhere else.

   **Why this is not closed, and the standard is the one the stage set rather than a feeling.** Closing it requires saying what "short enough" means as a number and why. **No such number exists in this project and nobody here has the standing to invent one.** 6m43s is shorter than 13m51s; whether it is short enough to watch is a question about a person, and every figure above was produced by the person who chose the thresholds that produced them.

   **CONTENT CANNOT CLOSE IT FROM HERE, and V10 is the log with the standing to say so.** docs/PROGRESSION.md's act 1 unlock list is nine items and all nine are built. There is no tenth thing to sell, no configuration left unpurchased, and the gaps are even. Whatever remains after 6m43s is DESIGN.md open question 7 and the beast, which is V12.

   **One thing did change about the quiet and it is recorded rather than counted as progress.** V6's note under this item says "every net rate reads 0.00 for fourteen minutes". That is no longer true: with storage bought the glycogen card's net rate is non-zero for most of the act, charging while the environment is full and discharging as it drains. Whether a slowly moving number counts as something happening is exactly the question this item has never been able to answer without a reader.

   **V12 built the beast and this item still does not close, and V10's own entry above predicted exactly that.** V10 wrote that whatever remains after 6m43s is DESIGN.md open question 7 and the beast, which is V12. **Open question 7 is closed. This item is not, and the two are different claims.**

   **What the beast actually changed.** A solved act 1 and a walled act 1 both show 0.00 on every net rate, and no pool card can tell them apart because the number is genuinely the same number. The beast reads gross throughput, which is the quantity that differs, so **the quiet is now legible: Sluggish is a picture of a cell holding steady rather than an absence of information.** That reading exists nowhere else on the screen and it did not exist before.

   **What it did not change, in the terms this project uses.** A picture is not a thing to do. And the measurement is worse for the claim than the argument is: act 1 produces **three beast transitions across 84000 frames, and two of them land inside the first four seconds**. Across the fourteen-minute gap itself **the beast changes zero times.** It is legible during the quiet and it is not eventful during it, and anybody reading "the beast answers open question 7" should read it with that number attached.

   **So the standard this item has always set is still unmet and still cannot be met from inside.** Closing it requires saying what "short enough" means as a number and why, no such number exists in this project, and nobody here has the standing to invent one. **Content cannot close it, V10 established that with all nine unlocks built, and now a visual treatment cannot close it either.** What is left is a reader. See Blocking item 0.

   **And the tail got worse, which belongs here rather than in a footnote.** The last purchase moved from 61m57s to 54m03s and the environment still empties around 93 minutes, so the silence between the end of the content and the end of the food grew from 30m45s to **39m03s**. Eleven of those minutes are now the cell running down its reserve rather than nothing, and the other twenty-eight are not. Act 1 has all its content and still no ending. That is V11.

   **V6 gave a solved act 1 something to do and it is not a fix for this.** There are now two coach marks and a teaching panel a player can open while nothing is happening. That is reading material rather than an event, it is all optional, and none of it changes that every net rate reads 0.00 for fourteen minutes. Recorded so nobody counts it as progress against this item.

3. **The teaching layer's one text gap: "net rate" is unexplained.** Opened 2026-08-04 by V6 stage 5, which found it while scoring the thirteen-item table.

   It appears on eight pool cards, it is the most repeated phrase in the interface, it is jargon, and its only explanation is the label, which says "net rate". **V6 added three coach marks and a teaching panel and not one of them mentions it.** It is a text problem, it is cheap, and it was left unfixed because it was found in stage 5, which is a measurement stage, and building in the stage whose job is to find out whether the building worked is how a bracket stops being a bracket.

## Open, not blocking

- **A jump reaches an act. A lesson needs a beat. Those coincide exactly once and V15 inherits the gap.** Opened 2026-08-20 by V13 stage 3, which was told to answer this rather than assume the developer answer.

   **The obvious objection is that a teacher will not type a query parameter. That is true and it is the less important half.** The real mismatch is that `?jump=N` lands at an act's **beginning**, and the thing a teacher wants to put in front of a class is a **beat** inside one:

   ```
     act 1   45 to 90 min     NAD+ wall at ~3 s from the start.  REACHABLE
     act 2   90 to 150 min    oxygen as poison before fuel, inside the act
     act 3   120 to 180 min   chemiosmosis, and the 2 to 30 payoff at the END
     act 4   150 to 240 min   regulation, across the whole act

     a school period          40 to 50 min including setup and packing up
   ```

   **Jumping to act 3 to show a class chemiosmosis buys a cell at the start of a 120 to 180 minute act.** The period ends before the beat arrives. So the jump makes act 3 reachable for a developer, which is what V13 needed and what it claims, and it does not make act 3's argument reachable for a teacher.

   **What V15 has to build, so its stage 1 has an input rather than a question.** A **named beat** a teacher selects, resolving to an act plus a state within it plus whatever purchases that state implies. `resolveActJump` is the right substrate and is deliberately not that: it takes an act number, and a beat selector takes a beat id and returns a jump. **Which beats are worth a period is a content decision** and it is exactly what V15 stage 1 is for, which is why V13 declined to take it on a teacher's behalf.

   **One property of the query string is worth keeping rather than replacing.** A URL is shareable, bookmarkable and survives being written on a whiteboard. docs/PILLARS.md rule 7 rules out a backend, so a URL is the only thing this game can hand somebody that is not a file.

- **The browser step failed once in CI and nobody has read why. THE HEAD OF `updatelogv9` IS RED.** Opened 2026-08-09 by V9 stage 5.

   ```
   run 31335999868   d047eab   SUCCESS   2m48s   e2e step   80s
   run 31336229937   0c6b518   FAILURE   5m42s   e2e step   4m17s
   ```

   **Every step before the browsers passed on both runs**, at the usual times, and the two commits differ only by two timeout ceilings and documentation. Locally the suite passes in all three engines repeatedly, 18 tests in 1.9m, including a run taken immediately after this failure.

   **4m17s against 80s is almost exactly one test hitting the 180 second per-test timeout**, which points at a hang rather than a bad assertion. That is inference. **The actual failure text has not been read by anybody**: `gh` is not installed and this session had no authenticated route to the run logs, and the first failure left nothing behind because the runner was destroyed with the report on it.

   **What changed is that the next one will be readable**: `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`, and an `if: failure()` artifact upload of the report and traces with 14 day retention. Plus `retries: 1` in CI, which is a mitigation and not a fix, and which buys the word **`flaky`** as a third outcome so instability stays visible rather than becoming a green tick.

   **This does not put the cross-engine result in doubt.** Four engines and four hashes were measured locally in all three browsers and `d047eab` reproduced them in CI. What is in question is the harness in one environment, not the numbers.

   The two ceilings from the same stage, a 15 minute `globalTimeout` and a 25 minute job limit, are unrelated and were not reached: 4m17s is well inside both.

- **The determinism measurement is x86-64 only, and ARM is the gap.** Opened 2026-08-09 by V9 stage 2. Three engines agreeing on one machine is not three engines agreeing on every machine: the local run is x86-64 Windows and CI is x86-64 Linux. Float behaviour can vary with CPU architecture as well as with engine, and **Apple Silicon and ARM Android are a large fraction of any real audience.** Closing it is a CI matrix entry rather than new code, since the probe already exists and takes under a second per engine.

   Three smaller limits, recorded together so nobody has to re-derive them. It is three **engines**, not three browsers: Playwright's WebKit is not Safari. It is one build of each, which is the argument for the step running on every push rather than once. And it does not prove the rule is **necessary**, only that the codebase obeying it is portable; the ECMAScript specification permits the divergence whether or not today's engines exhibit it, so a measurement that happened to agree would be the worst possible reason to relax hard rule 5.

- **The game is configured to deploy and nobody has pressed the button.** Opened 2026-08-09 by V9 stage 3. `wrangler.toml`, `public/_headers` and the gated deploy job all exist and the job skips itself, loudly, while `CLOUDFLARE_API_TOKEN` is unset. Adding that secret and `CLOUDFLARE_ACCOUNT_ID` deploys with no further edit.

   **What stays unverified until then**, and it is a short list because the policy and the artifact were checked locally against the real `dist/` under the real headers: Cloudflare's own handling of `_headers`, TLS and the edge cache honouring `immutable` and `must-revalidate`, survival across a genuine browser restart rather than a reload, the offline return against the deployed origin, and `e2e/smoke.spec.ts`, which has never run against a live URL and skips itself rather than passing vacuously.

- **`WORDMARK` carries a badge that nothing renders.** Opened 2026-08-09 by V9 stage 1, found by accident. The first attempt at the `Needs source` probe put the badge on the wordmark and **the build passed**, emitting a byte-identical bundle, because `TopBar.tsx` reads `WORDMARK.text` and never `WORDMARK.badge`, so the minifier drops the property. The entry under "the working title is still TBD" below implies that badge makes the provisionality visible. It does not.

   **It also bounds the release gate honestly.** `needsSourceGate` fires on a badge that is rendered and cannot fire on one that is dead data. That is arguably correct, since hard rule 1 is about numbers in player-facing text and a badge nobody renders is not player-facing, but the gate's own header claims a property value survives "written anywhere" and what survives minification does not survive being unreachable. Not fixed, because the fix is a UI decision about whether the wordmark should carry a badge at all.

- **The worst reachable ATP and the worst recoverable ATP are a tenth of a unit apart at the top of the capacity ladder, and nothing had measured it.** Opened 2026-08-06 by V10 stage 4. `bootstrap.test.ts` probes recovery from an ATP of 0.05, on the stated argument that a starved cell bottoms out around 0.13 to 0.18 so 0.05 is below anything a run reaches. **That was measured at the shipped default Vmax and the file never varied the capacity.**

   |capacity|floor when the food runs dry|climbs out from 0.20|
   | --- | --- | --- |
   |shipped default, uptake 8|2.0457|yes|
   |glycolytic rung 0, uptake 12|0.6292|yes|
   |glycolytic rung 2|0.3863|yes|
   |glycolytic rung 3|0.3244|yes|
   |glycolytic rung 4|0.2895|NO|

   **A faster cell holds less ATP and falls closer to its own boundary.** The top rung already sat there before V10 existed, at no enzyme factor at all. **Nothing in act 1 crosses it**: the floor is above the boundary at every rung, and `enzymes.test.ts` asserts recovery from the floor starvation actually produces across every purchasable configuration by running the larder dry and refeeding it. `bootstrap.test.ts` now pins the top rung's floor above 0.2, so a balance pass that lowers it fails there. **It is open because the margin is thin and undesigned**, not because anything is broken.

- **Act 1's last 39 minutes are quiet and eleven of them are not.** V10 moved the last purchase from 61m57s to 54m03s while the environment still empties around 93m07s, so the silence grew by eight minutes. The cell then runs on its glycogen reserve until 104m05s, which is the most eventful the end of the act has ever been and is still a decline rather than an event. **Making the act end when its content ends is V11 and shortening the environment is the alternative V5 measured and rejected on pacing grounds.**

- **The glycogen reserve and the named enzymes want the same glucose, and the order they are bought in decides who gets it.** Opened 2026-08-06 by V10 stage 5. The reserve charges from the intracellular pile the top of the uptake ladder creates; the enzyme purchase exists to consume that pile. Bought after the enzymes the reserve peaked at 462 units and bought 7m35s of tail; bought before them it peaks at 1548 and buys 10m58s, which is why it is gated on the uptake ladder rather than on the glycolytic one. **The two are in tension by construction and the current order resolves it in the reserve's favour.** Nobody has decided whether that is the right way round.

- **Working title is still TBD, and the wordmark is now one edit rather than a search.** docs/BRIEF.md line 4 says so and no naming shortlist exists. `krebs` names an act 3 mechanic that unlocks roughly four hours into a game whose first 45 to 90 minutes are anaerobic. **V6's content guard found it hardcoded in `TopBar.tsx`**, which the audit that went looking for hardcoded strings had missed, and it now lives in `src/ui/content.ts` as `WORDMARK` with a badge saying the title is provisional.
- **The teaching panel sits behind two 16px affordances and nobody knows whether it is reached.** It carries the most important thing in act 1, docs/PILLARS.md success condition 2 in the only form act 1 can state it, and it opens from the ferment unlock slot or from either of the two new coach marks. **The obvious automatic trigger was identified and deliberately not built**: the moment fermentation is bought is also the moment the two headline numbers visibly diverge, and whether that moment wants an overlay on top of it is a comprehension question. It was left for the readers V6 did not find.
- **The blob readout is still a hover tooltip, and V7 removed the reason that mattered rather than the tooltip.** The entry used to say colour-equals-redox exists on the hover channel alone for a sighted touch player. It does not: the level rule carries it on the shape itself, with no affordance to find and nothing to hover. What is still hover-only is the *explanation* of the encoding, which is a smaller thing than the state it explains. A touch player now reads the carrier without ever opening anything.
- **Moving the disclosure off the act screen is compliance and it has a cost nobody has measured.** docs/SCIENCE.md Part 1 asks for it "in the about screen and on first launch" and it is now in both, verbatim, with a test parsing the document. It used to be visible without any action and is now one click away after being shown once. Whether that reads as burial is a reader's call and there has been no reader.
- **The first run has one button and no gate, which is correct and also the easiest thing in the world to skip.** docs/PILLARS.md rule 2 rules out a gated tutorial, so this is the right shape. Whether it is read or clicked through is unmeasured.
- **The divergence debt is discharged and the obligation to keep it discharged is new.** This entry used to be a count of what docs/ECONOMY.md was owed. It is now a count of what it holds: **thirty-seven rows across three tuning files**, 17 in `src/content/act1/tuning.ts`, 19 in `src/ui/tuning.ts` and 1 in `src/save/tuning.ts`. The old count of twenty-two was wrong in three places at once and the correction is recorded under "What the economy does". What replaces the debt is a standing rule with a test behind it: **a tuned number lives in exactly one of the three tuning files and has exactly one row.** Three numbers had been sitting outside those files since V2, the atp, adp and phosphate starting amounts in `pools.ts`, in a file whose own header said they owed a row. They were moved at unchanged values in V5 stage 5 and the guard is what found them.
- **The coach mark trigger is chosen but weakly, and V6 could not fix that. STILL OPEN, deliberately.** `COACH_MARK_TRIGGER` in `src/ui/components/CoachMark.tsx` is `'auto'`, picked in V3 stage 7 because under `'manual'` nothing on the screen explains the stall at all and the player has to find a 16px info affordance. Both behaviours are built and switching is a one-word edit. The choice was made by the person who built it, which is the least reliable possible reader.

   **V6 stage 5 existed to take this decision away from that reader and found no readers, so it left it alone rather than re-deciding it.** Closing this entry on the same unreliable reader's second opinion would be worse than leaving it open, because a closed entry stops anybody looking again.

   **One thing in the argument did move and it is recorded rather than acted on.** V6's teaching panel explains the stall too, in its fermentation paragraph, so under `'manual'` there are now two routes to an explanation where there was one. But the objection was never the count: it was that the player has to find a 16px info affordance, and the new route is also a 16px info affordance. **The case for `'auto'` is slightly weaker and it is not overturned.**

- **The scope of "the builder is the least reliable reader" is unchanged, and V6 is the log that was supposed to change it.** This page has carried that caveat since V3 and it applies to every comprehension claim in the project with exactly the same force today. **Readers found: 0. Readers asked: 0.** V6 built the thing to be read and did not get it read. See Blocking item 0, which is where this now lives as work rather than as a caveat.
- **The uptake ladder stops at 12, and V5 both confirmed the reason and found it had been overstated.** Re-measured after the bootstrap repair, time to 30000 cumulative ATP is 11m51.7s at Vmax 12 and 11m51.4s at 26, so everything above the knee sells three tenths of a second. The figures this entry used to quote, 11m24s and 11m03s, were measured before V3 stage 6 raised the environment in the same stage and were never re-run. **The lead this entry recorded was acted on and it was wrong as stated.** Preparatory-phase capacity is not sellable on its own: raising `prep` without `payoff` kills the cell, so V5 sells them together as the glycolytic capacity ladder.
- ~~**The top of the uptake ladder over-delivers, permanently.**~~ **Closed 2026-08-06 by V10 stage 4.** The purchase this entry predicted is `enzyme-pfk1-pk`, phosphofructokinase-1 and pyruvate kinase together, and it closes the gap completely: measured at glycolytic rung 0 it takes ATP per second from 42.217 to the transport ceiling of 48 and the intracellular pile from 3454 down and falling. **The ceiling is four times the uptake Vmax and the enzymes are how the cell reaches it**, which is why a larger factor buys nothing. The original entry is kept below because its measurements are still the reason the purchase exists.

- **The top of the uptake ladder over-delivers, permanently, and that is now a feature with a purchase attached.** `prep` never reaches its Vmax of 12, settling near 10.554 because it is second order in ATP, so uptake at 12 pushes intracellular glucose up by about 87 a minute forever. V3 sized that rung against a nameplate rather than a realized rate. Each rung of the glycolytic ladder narrows the gap, to +23.0 a minute, then +17.2, then +9.2, then -1.5 at the top, so the pile of unusable glucose visibly drains as the phase that consumes it is bought.
- ~~**A backgrounded tab still loses game time.**~~ **Closed 2026-08-05 by V8 stage 5.** Open since V3, narrowed by V4, which made `pendingOfflineMs` survive a reload and said plainly that narrower is not closed because nothing spent it. It is spent now. Both sources feed one field and both are credited the same way: time the loop routed there when a catch-up exceeded `MAX_CATCHUP_TICKS`, which is the backgrounded tab, and time measured at load from a genuine absence. **The player gets their time back rather than an honest account of losing it.**
- ~~**The offline delta is accumulated and never credited, on purpose.**~~ **Closed 2026-08-05 by V8 stages 5 and 6.** `time.offlineCreditedMs` and `stats.eventsProcessed` are non-zero in a written save for the first time, and they accumulate across sessions rather than resetting, which is what docs/SAVE_SCHEMA.md asks of them. **The save panel sentence is gone rather than softened.** It said "None of it has been simulated. It is being kept, not spent." It now says all of it has been simulated and the cell kept running, and `offlineReturn.test.tsx` fails if the old wording comes back.
- **The autosave interval is 30 seconds and it is provisional.** `AUTOSAVE_INTERVAL_MS` in `src/save/tuning.ts`, reasoned from the unlock pacing measurement rather than measured. It is row S1 in docs/ECONOMY.md and the pacing it was reasoned from has since moved: purchases now sit 13 to 14 minutes apart rather than one and seven, so half a minute is a smaller fraction of a beat than it was. Nothing about that makes it wrong, and nobody has measured what tolerable loss is.
- **`FERMENT_ATP_THRESHOLD` has no usable range and V5 measured it.** V3 left open whether the wall's answer should appear only after the player has sat in the stall for a while. It cannot be done with this number: cumulative ATP converges on the walled ceiling of 60 in the same breath as the pathway dies, so 50 is reached 0.50s before the wall and 59.99 is reached 0.10s after it. **A delay between the wall and its answer is an interface decision**, and it belongs with the coach mark rather than with a threshold.
- **A development-time tick rate change costs one tick of game time per save, and that is the price of the rule rather than a defect.** `elapsedGameMs` is a whole multiple of the TICK_MS that wrote it, so reconstruction is exact while the rate is unchanged and floors when it is not. Storing milliseconds decouples the duration from `TICK_RATE_HZ`, which is what hard rule 6 depends on; it does not decouple the alignment. A save with a remainder is not corrupt and the loader must never treat it as corrupt. Written into docs/SAVE_SCHEMA.md Part 3 by V4.
- ~~**Buying an unlock is not part of hashed state, and V4 has to persist it.**~~ Closed 2026-07-31. It still is not hashed state, which is why it needed saying: `setReactionVmax` and `setReactionEnabled` touch no pool, no tick count and no PRNG, so a reload that dropped unlock state would pass every determinism test in the project while silently refunding every purchase. `progression.unlocked` persists it and the runtime re-applies the capacity Vmax at load. Two tests in `reloadDeterminism.test.ts` fail on purpose without each half.
- **The reduced-motion media query has now run in a browser, and the entry is narrowed rather than closed.** Two halves, and only one of them was ever in doubt.

   **The app's half passes outright.** A real Chrome launched with the feature true at the platform layer, on the running act screen: `matchMedia` true, zero animated dash lines rendered, and all five reactions showing an explicit numeric rate. Photographed. A running reaction is a solid dark track with a filled arrowhead reading 7.95 /s and a stopped one is a thin grey hairline with a hollow head reading 0.00 /s. **DESIGN.md's obligation is discharged in full and it is the only part of the V7 audit that needed nothing.**

   **The OS to browser link is live and was verified.** A headed Chrome, no forced flags, reported `prefers-reduced-motion: reduce` as false, and `SPI_GETCLIENTAREAANIMATION` independently reported animations on. They agree, and the browser was confirmed headed rather than headless, so the query is being evaluated against the real setting rather than stubbed.

   **What could not be observed is the transition, and the reason is Windows rather than the code.** `SPI_SETCLIENTAREAANIMATION` is a no-op on this Windows 11 build. The setting's real home, bit `0x02` of byte 2 of `HKCU\Control Panel\Desktop\UserPreferencesMask`, took the write and broadcast `WM_SETTINGCHANGE`, and the running session kept reporting animations on, because that value is cached per session and Chrome reads the cache. Confirming it needs a sign out. The original mask was restored byte for byte and verified. **What remains unobserved is a player flipping the toggle mid-session, which `usePrefersReducedMotion` listens for and which nothing has watched happen.**
- ~~**DESIGN.md's "colour leaving" sentence is backwards as written.**~~ **Closed 2026-08-04 by V7 stage 5.** The Colour section says colour arrives now, and keeps the old sentence on the page with the correction rather than deleting it, because the wrong version is the more useful record. The player-facing text was corrected too: the carrier's readout says "The level rises and the colour arrives as NAD+ is spent", which is the first player-facing string in the game to say which way the beat runs.

   **What is worth keeping is why it took two logs.** It was recorded as wrong on 2026-07-29 and nothing depended on it, so nothing forced it. V7 had to describe the axis correctly in order to build a second channel for it, and that is what finally moved it. **A wrong sentence in a specification survives until something is built on top of it.**
- **The wordmark scale does not fit a persistent top bar.** DESIGN.md gives it 60 to 104px, which is a hero scale, and on the act screen it takes a permanent 100px band for a word that never changes. Implemented as specified and recorded as wrong.
- **docs/SIMULATION.md line 90 names three conserved quantities and act 1 has five.** It says "carbon, phosphate and redox equivalents". `nicotinamide` and `adenylate` are conserved too under the act 1 decomposition and are the more useful invariants, because they are what turn the NAD+ wall into a testable property. V2 deliberately did not edit docs/SIMULATION.md. Recommendation is that Part 2's wording be widened to say the conserved set is content's to declare, since act 3 will add more, but that is a spec edit and should be deliberate rather than incidental.
- **The timeline date column has no treatment for a stop with no date.** Two stops now carry `unresolved` and `hypothesis` instead of a figure. They need to read as deliberate statements at the same visual weight as a real date, and the non-linear axis has to place an undated stop by ordering constraint alone. See DESIGN.md open question 5.
- **Recovery from the NAD+ wall is instantaneous, and V3 found it is not anticlimactic.** Measured from a 20000-tick stall, which is 16.7 minutes: the payoff phase restarts after 2 ticks, 100 milliseconds. The way back in is the stranded g3p, 6.8 units left sitting in the pool for the whole stall, because ATP is at denormal by then and the preparatory phase cannot pay its entry cost. Asserted in `src/ui/__tests__/stallRecovery.test.ts`, mechanism as well as outcome, so a future balance change that consumes g3p during a stall fails there rather than silently making the wall unsolvable. On screen it reads as a whole dead pathway coming alive at once, which is the opposite of anticlimactic. The worry was misplaced.
- ~~**`STEADY_EPSILON` and `STEADY_WINDOW` shipped in V1 as unvalidated placeholders.**~~ **Closed 2026-08-05 by V8 stage 1. It was the oldest entry on this page.** Both are measured, both moved, and 1e-6 turns out to have been outside the usable band rather than merely unjustified. They are still not tuned numbers in the docs/ECONOMY.md sense, because they are engine tolerances rather than balance decisions, and they still live in `src/sim/constants.ts`. **What replaces the entry is an obligation**: the band is a factor of 33 wide and its lower half is set by how fast a walled cell's ATP decays, so a balance pass touching `ACT1_MAINTAIN_HILL_N` or the environment size has to re-run stage 1's measurement rather than assume the constant survived. See "What the offline path does".
- **The act's last 28 minutes are empty on purpose and nothing says so on screen.** Content ends at 61m57s and the food lasts to 92m42s. The environment should outlast the act rather than define it, but a player who keeps going gets half an hour of nothing at the end. Whether the act should announce it is over, or whether act 2 arrives there, is docs/PROGRESSION.md's question.
- **The two capacity ladders are sequential and nothing has watched a player meet the second one.** The glycolytic slot reads "Opens once uptake is at the top of its ladder" until it opens, which was checked in a browser and looks right. Whether a locked slot with no progress readout reads as a promise or as a dead card is a comprehension question.
- **`?ferment=on` does not survive a reload.** The development scenario door enables the reaction without minting an unlock id, so a restored save has no `ferment` in `progression.unlocked` and the reaction comes back disabled. No player path reaches it and `src/ui/scenario.ts` documents itself as a development affordance. Recorded so the next person to use that door is not confused by it.

## Next, in order

0. **Find one cold reader.** Not a log and not a stage. It is listed first because it is the only item on this page that no amount of building advances, because it gates docs/PILLARS.md's first two success conditions, and because every log after this one adds more to a screen nobody outside this project has looked at. See Blocking item 0. It does not block V9 and V9 should not wait for it.

1. **Act 3, and it cannot start.** `UPDATELOGV14.md`, seven stages, written and unrun. **BLOCKED ON THE ACT ORDERING DECISION**, which is stated as blocking below for the first time.

   **What V13 leaves it.** An act registry a jump reads, one definition of an act's starting state that a boundary handover will also have to use, and `?jump=3` working the day act 3 is registered with no edit to the jump. **Every stage of V14 would otherwise have begun by playing act 1**, which is the reason the jump was scheduled ahead of it and the reason that still holds.

   **What V14 must not inherit by accident.** `actStartState` is the only definition of an act's beginning and act 3's entry has to go through it, not beside it. Two of its assumptions are act 1 facts that V14 breaks: a jumped act 3 will not match a played act 3, and act 3's beginning is not "everything at its initial amount" because a transition happened. Both are flagged in `actStart.ts` and in `actJump.test.ts` at the exact assertions that will fail.

   ~~**The act jump.**~~ **Done 2026-08-20.** `UPDATELOGV13.md`, four stages, all reported. See the Status block and "What the act layer does" above. **The finding was that the act boundary does not hand over at all**, so there was nothing to extract and the definition had to be built from the runtime's new-game branch instead.

   ~~**Spine B, the surface half.**~~ **Done 2026-08-09.** `UPDATELOGV12.md`, six stages, all reported. See "What the spine does" above. Spike C, the art spike that was meant to gate the illustration scope, **was not run and the log went ahead without it**: governance was answered in the design stage instead, before any asset was drawn, and the guard that enforces it landed with the first seven. Recorded rather than glossed, because the spike was a named gate and it was skipped.

   ~~**Spine A, the structural half.**~~ **Done 2026-08-06.** `UPDATELOGV11.md`, seven stages, all reported.

   **THE ACT ORDERING DECISION IS NOW BLOCKING, AND V13 IS THE LAST LOG THAT COULD BE FINISHED WITHOUT IT.**

   It has been open since the engineering review and it has cost nothing, because everything scheduled before V14 could proceed either way: two spine logs and a jump are all act-agnostic by construction. **V14 is not.** It has to write act 3's chemistry, and act 3's payoff is yield going from 2 to roughly 30, which needs oxygen as the terminal electron acceptor, and **act 2 is what supplies the oxygen.**

   **Two exits, and both are real.**

   ```
     A.  act 3 next, as the design doc schedules it
         Price: a placeholder oxygen constant, a DEPARTURE row in
         docs/ECONOMY.md that says so, and an act 3 rebalance when act 2
         lands. The 2 to 30 figure ships against a number act 2 will move.

     B.  flip the order, V14 becomes act 2
         Price: withdraw the value-ordering argument that put act 3 first,
         which was that act 3 carries the game's headline claim and should
         exist earliest. Act 2 is also the higher-risk act, because damage
         is the first mechanic that takes something away from a player and
         nobody outside this project has read anything yet.
   ```

   **This is a decision for a person and no measurement resolves it.** What has been removed from it: V9 wrote act 2's oxygen schedule constraint into docs/SIMULATION.md Part 3, so whichever act introduces a rising environment inherits a shape rather than inventing one; and docs/SAVE_SCHEMA.md Part 1 names the act 2 log as the next expected schema bump either way, forced by per-reaction Vmax becoming hashed state. **Neither of those picks an order.**

   `UPDATELOGV14.md` opens with a BLOCKED UNTIL A DECISION IS TAKEN block naming this file as where the answer goes. **Nothing else in the project is waiting**, which is the only reason this has been affordable for five logs and is why it stops being affordable now.

2. ~~**CI, cross-engine determinism and deployment.**~~ **Done 2026-08-09.** `UPDATELOGV9.md`, five stages, all reported. See "What CI enforces" above rather than a restatement here. The one piece left undone is the deploy itself and it is under "Open, not blocking".

   **The rest of the roadmap lives in `docs/designs/game-spine-and-four-acts.md` and not here.** That document runs to V18: the two spine logs, an act jump, three more acts, teacher mode and an endgame. A roadmap in two places drifts in one of them, so this file points at it rather than copying it.

   **One decision does still belong here, by the standard this page has applied since V3, and it is open.** The design doc schedules act 3 ahead of act 2 and its own engineering review found a reason that may not survive: **act 3's payoff is yield going from 2 to roughly 30 and that needs oxygen as the terminal electron acceptor, which act 2 is what supplies.** `src/save/schema.ts` reserves `environment.oxygenLevel` and act 1 writes it as a literal 0 with a comment saying that is not a placeholder. So act 3 first requires a placeholder oxygen constant carrying a DEPARTURE row, and an act 3 rebalance when act 2 lands.

   The design doc prices that and leaves it unresolved on purpose. **It is recorded here as open rather than settled**, because a roadmap entry reads as a decision and this one has not been taken. `UPDATELOGV14.md` will not start until it is: that log opens with a BLOCKED UNTIL A DECISION IS TAKEN block naming this file as where the answer goes. Nothing before V14 waits on it.

   **V9 removed one input to that decision.** Act 2's oxygen schedule now has a written constraint in docs/SIMULATION.md Part 3, so whichever order is chosen, the act that introduces a rising environment inherits a shape rather than inventing one.

3. **Act 2, and it is decidable for the first time.** Not scheduled and not written. What changed is that every reason to defer it has been discharged: the economy is settled and documented, the text has a style guide, the interface is perceivable, saves migrate, and the engine specification is fully implemented rather than partly. **Act 2 was never blocked on the engine and it is now not blocked on anything technical.**

   **What is still true is the reason it has never been on the table.** docs/PROGRESSION.md lists act 2's shape as an open question for the prototype, and act 2 is the highest-risk beat in the game because it introduces damage, which is the first mechanic that can take something away from a player. Whether that reads as a metabolic consequence or as a punishment is a comprehension question, and this project has never had a reader.

   **What would have to be true before an act 2 row could be written without it being fiction.** One of two things. Either **a cold reader has played act 1**, which turns act 2's teaching beats from guesses into decisions, and Blocking item 0 is the whole of that. Or **the act 2 shape is settled in docs/PROGRESSION.md** the way act 1's was before V2, with the two damage mechanisms, the oxygen schedule and the unlock order written down and argued rather than sketched. **Writing an act 2 row today would be inventing content in a state file.**

**The ordering notes from three logs are all discharged and the pattern in them is worth keeping.** docs/ECONOMY.md before saves, and V4 built on a known hole anyway and V5 paid it. docs/CONTENT_STYLE.md before offline progress, because text written against numbers that are about to move gets written twice. Accessibility before offline progress, for text rather than for numbers. **Every one of those was an argument that a foundation should be laid before something is built on it, and every one was right.**

**V8 is the log that tested the pattern against a specification rather than against code, and the specification lost.** docs/SIMULATION.md Part 3 was written in July before any code existed and it called itself the hard problem. Three of its statements turned out to be wrong once something was built on them: the steady-state criterion, the assumption of piecewise-constant rates, and the fallback. **None of them could have been found by reading it more carefully.** V7 found the same shape in DESIGN.md and wrote it down as a rule: a wrong sentence in a specification survives until something is built on top of it. **V8 is the second instance and it is now a pattern rather than an anecdote.**

**And one ordering claim V6 still cannot make, unchanged.** V5's entry here said the comprehension pass "owns the question this project most needs answered by someone who is not its author". It did own it. **It did not answer it**, and nothing since has either.

## The vertical slice

Scope is fixed by docs/BRIEF.md line 110 and should not grow: tick loop, one pool, glycolysis, the NAD+ constraint, fermentation, no UI polish.

Done in V1: fixed timestep accumulator, pools, Michaelis-Menten flux, two-phase update, negative pool proportional scaling, seeded PRNG, the conservation property test and the determinism test.

Done in V2: one pool, glycolysis, the NAD+ constraint, fermentation.

Done in V3: the interface. **The slice is complete.**

Done in V4, outside the slice: persistence. Every property this project treats as tested is now tested across a reload as well, which is a stronger claim than any earlier log could make.

Done in V6, outside the slice: the comprehension pass. **It is the first log whose deliverable cannot be verified by the test suite**, and it is the first to end with a number that is zero rather than a measurement.

Done in V7, outside the slice: the accessibility pass. **It is the first log that repaired defects in every earlier one**: V3's focus ring, V4's unreachable file input, V3's colour axis and a DESIGN.md sentence wrong since 2026-07-29. It is also the first whose central claim is arithmetic rather than judgement, so most of it is now a test, and the part that is not is the same part every log has left open: whether it reads.

Done in V8, outside the slice: offline progress. **It is the first log whose central deliverable was specified in full before any code existed, and the first to find that the specification was wrong in three places.** The steady-state criterion could not be satisfied, the assumption of piecewise-constant rates does not hold for a Michaelis-Menten uptake from a finite pool, and the fallback destroys the cell. All three were found by building the thing rather than by reading the document again. It is also the log that finishes docs/SIMULATION.md.

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
