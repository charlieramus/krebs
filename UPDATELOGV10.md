charlie

# krebs, V10: Act 1 Completion
# Work on one stage at a time. Do NOT combine stages.

---

## Context

Read `NOW.md` first, then `docs/PROGRESSION.md` act 1, then `docs/ECONOMY.md`. Then read `NOW.md` blocking item 2, twice, because this log exists to close it and it has survived one attempt already.

**Act 1 has nine unlocks in `docs/PROGRESSION.md` and six of them are built.** Glucose uptake, glycolysis as a single pathway then decomposed into two phases, the uptake capacity ladder, the glycolytic capacity ladder, NAD+ pool visibility and lactate fermentation. The three that are not: **individual glycolytic enzymes as efficiency upgrades, ethanol fermentation as an alternate branch, and glycogen storage as a buffer against substrate scarcity.**

**Blocking item 2 is what those three are for.** V4 shipped act 1 with six discrete events, every one inside the first 5m13s, and then 84m47s in which nothing happened at all. V5 added the glycolytic capacity ladder and took that to seven events with a worst gap of 13m51s and the last purchase at 61m57s. That is inside the 45 to 90 minute target and it is still fourteen minutes of a screen that reads 0.00 on every net rate. V5 said out loud what it could not do: the remaining gap is a content question rather than a balance one, and the three unbuilt unlocks all extend the pathway, which V5's scope forbade.

**One of the two founding assumptions came back negative and this is the log that answers it.** `docs/BRIEF.md` line 110 asks whether saturating kinetics feel like a game. `NOW.md` records the answer as no, not yet, and records the reason: once act 1 is solved the screen stops changing, so there is nothing arriving for the kinetics to respond to. More things to buy is the whole of the fix that is available without leaving act 1.

**This log adds content to the simulation, which no log since V2 has done.** That has three consequences it must handle deliberately rather than discover. The act 1 canonical hash `49ea08d3` **will move**, because starting amounts are hashed state and new pools have starting amounts. Every new tuned scalar needs a row in `docs/ECONOMY.md` or `divergenceTable.test.ts` fails the build. And the new unlock ids become contract surface the same way `ferment` and `uptake-capacity-N` did in V4.

**And it touches biology that `docs/SCIENCE.md` may not cover**, which is why stage 1 is a documentation stage and no code is written until it is done. Ethanol fermentation is a real pathway with real stoichiometry and it produces carbon dioxide, which lactate fermentation does not. Nothing in act 1 has ever released carbon from the cell.

## Decisions

- **Stage 1 is documentation and it comes first, for the reason V2 stage 1 came first.** The coefficients of a pathway are biology and hard rule 1 says a player-facing number has to trace to `docs/SCIENCE.md`. If ethanol fermentation is not in there, adding it is legitimate new biological ground truth rather than a balance pass, so hard rule 2 does not forbid it. What hard rule 2 forbids is touching `docs/SCIENCE.md` in stages 2 to 6, and that ban is absolute.
- **Ethanol fermentation releases CO2, so act 1 gets a carbon dioxide pool.** Pyruvate decarboxylase removes a carbon before alcohol dehydrogenase reduces the rest, which is why the ethanol branch and the lactate branch are not two flavours of the same thing. **Carbon stays conserved because the carbon goes into a pool rather than out of the model.** A reaction that made carbon vanish would fail the conservation property test, and it should, because a cell that deletes matter is the thing the whole invariant exists to catch. The pool is a real product with a real name, not an accounting device.
- **"Individual glycolytic enzymes" means the three regulated steps, not all ten.** Decomposing glycolysis into ten reactions would add nine intermediate pools, nine sets of kinetic constants, nine divergence rows and one new teaching beat, which is a bad ratio. Hexokinase, phosphofructokinase-1 and pyruvate kinase are the three committed and regulated steps in the real pathway, `prep` already carries a Hill exponent attributed to PFK-1, and `docs/PROGRESSION.md` act 4 already plans allosteric control of PFK-1 as its own beat. **Three named enzymes that the player recognises later is worth more than ten they meet once.** If stage 1's reading of `docs/SCIENCE.md` says this is wrong, stage 1 says so and the decision changes there rather than being worked around in stage 4.
- **Glycogen storage is a buffer and its teaching beat is that a buffer is not a yield.** It stores glucose and gives it back. It produces no ATP, it costs ATP to charge, and it exists so the cell survives a gap in supply. That is the same shape as the fermentation beat and it should be allowed to be: an upgrade that buys nothing except the ability to keep running.
- **The ethanol branch is a choice and the game does not tell the player which is right, because neither is.** Lactate and ethanol both regenerate NAD+ and neither yields ATP. What differs is what leaves and what is kept. That is a real fork with a real trade and it is the first decision in the game that is not simply an upgrade.
- **The canonical hash moves and the assertion says why, in the assertion.** V3 and V5 both moved it and both wrote the reason into the test rather than into a commit message. Same here. A hash that moves with an explanation attached is a record; a hash that moves silently is a bug that has not been noticed yet.
- **Nothing in this log touches the interface beyond what the new content requires.** No timeline, no beast, no act boundary. Those are V11 and V12 and this log inherits nothing from them and hands them nothing except more content to render.
- **The pacing target is not "fill every gap".** `docs/PILLARS.md` rules out engagement mechanics and an idle game where something is always happening is an idle game that never lets you leave. The target is the one `docs/PROGRESSION.md` already sets, 45 to 90 minutes, with a gap short enough that a player who is watching has a reason to keep watching and long enough that a player who is not is not being nagged. Stage 5 measures and names it rather than inheriting a number from this paragraph.
- Large content feature, first simulation change since V2, and the hash moves: six stages.

## What act 1 looks like now, transcribed so no stage paraphrases it

```
  reactions      uptake     glucose_env               ->  glucose
                 prep       glucose + 2 atp           ->  2 g3p + 2 adp
                 payoff     g3p + nad + 2 adp + pi    ->  pyruvate + nadh + 2 atp
                 ferment    pyruvate + nadh           ->  lactate + nad
                 maintain   atp                       ->  adp + pi

  conserved      carbon  phosphate  redox  nicotinamide  adenylate

  purchases      7, last at 61m57s, worst gap 13m51s
  environment    lasts to 92m42s
  target         45 to 90 minutes
  canonical      49ea08d3
  ledger         4 ATP gross, 2 net, 2 NADH, 2 pyruvate per glucose
```

The ledger is the claim act 1 exists to make and **no stage in this log may move it.** Enzyme upgrades increase throughput and never yield, `docs/PROGRESSION.md` says so, and it is asserted across nine purchasable configurations as of V5. This log adds configurations and the assertion has to still hold across all of them.

---

# Stage 1 — The biology, before any code

```
A documentation stage. No TypeScript is written and no test is added. Read
docs/SCIENCE.md end to end before deciding anything.

1. Ethanol fermentation. Establish whether docs/SCIENCE.md covers it and to
   what depth. It needs, at minimum: the two enzymes, pyruvate decarboxylase
   and alcohol dehydrogenase; the stoichiometry including the carbon dioxide;
   the fact that it regenerates NAD+ and yields no ATP, which is the same claim
   the lactate branch makes and has to be stated for this branch too; and which
   organisms actually do it, because act 1 is an anaerobic prokaryote and the
   textbook example is yeast.

   If it is absent or thin, write it, with citations, in the same form the
   existing Parts use. This is new biological ground truth rather than a
   balance change, so hard rule 2 permits it HERE and nowhere else in this log.
   Say in the report exactly what was added and why it was not already there.

2. The carbon dioxide question, and answer it in the document rather than in
   the code. One carbon leaves pyruvate before the reduction. Where does it go
   in a model whose carbon is a conserved quantity asserted to 1e-9?

   The answer this log takes is a co2 pool, so carbon is conserved and the
   cell accumulates a real product. Check that against docs/SCIENCE.md and say
   whether it holds. In particular: does anything downstream in act 2, act 3 or
   act 4 consume CO2, or is it terminal in this game the way lactate is? The
   answer changes whether the pool is a sink or a reservoir and act 3 has a TCA
   cycle in it, so this is worth five minutes now and a migration later.

3. The individual glycolytic enzymes question. This log's Decisions say three
   regulated steps rather than ten reactions. Test that against
   docs/SCIENCE.md rather than against convenience.

   Specifically: are hexokinase, phosphofructokinase-1 and pyruvate kinase the
   three committed and regulated steps, does the existing Hill exponent in prep
   attribute to PFK-1 as src/content/act1/tuning.ts claims, and does upgrading
   a single enzyme in a lumped two-reaction model say anything true? That last
   one is the real question. If the honest answer is that a named enzyme
   upgrade on a lumped reaction is a lie, say so and the log takes the other
   path in stage 4 rather than shipping a label with nothing behind it.

4. Glycogen storage. Establish the stoichiometry and the cost. Glycogenesis
   and glycogenolysis are not each other's inverse in a real cell and they do
   not cost the same, and a storage system that returns exactly what it took is
   a simpler and less true thing than one that charges for the service. Decide
   which this game models and record the reason.

5. docs/PROGRESSION.md, act 1. Its unlock list is nine items and three are
   about to become real. Check the list still says what this log is going to
   build, and if the wording has drifted from what stages 2 to 4 will do, fix
   the document rather than letting the code disagree with it. Do not add
   numbers: that file says it contains no tuned numbers and that is still true.

6. Name every new pool and unlock id in this stage, in one list, and treat
   them as permanent from here. docs/SAVE_SCHEMA.md Part 3 says pool ids are
   permanent, V4 made act 1 unlock ids contract surface, and the day to choose
   them carefully is before anything writes them into a save.

Verify: docs/SCIENCE.md covers all three unlocks with citations, or already
did. Report what was added, the CO2 decision with its act 3 implication, the
enzyme-count decision with the honest answer to step 3's real question, the
glycogen cost decision, any docs/PROGRESSION.md correction, and the permanent
id list. Confirm no code changed and no tuned number moved.
```

## Stage 1 Report

_Pending._

---

# Stage 2 — Ethanol fermentation, and the first carbon that leaves

```
The second NAD+ recycling branch. Read stage 1's report before starting and
build what it decided rather than what this prompt assumes.

1. The pools and the reaction, in src/content/act1/. A co2 pool and an ethanol
   pool, with conserved weights read from the same table everything else reads,
   so the illustration geometry follows for free and nobody draws anything.

   The reaction as stage 1 established it. If it is modelled as one lumped
   step, say so and say what is lost; if as two, say why the acetaldehyde
   intermediate earns a pool. Prefer whichever the teaching beat needs, which
   is probably one step, because the beat is about what the branch produces
   rather than about how it gets there.

2. Conservation first, before anything renders. Extend the property test that
   already asserts all five quantities over the reaction list. Carbon must
   balance exactly across the ethanol branch WITH the CO2 accounted for, and
   the test must fail if the CO2 is dropped. Write that failure deliberately
   and quote it, because a conservation test that has never seen the violation
   it exists to catch is a test nobody has checked.

3. The ledger, unchanged, and asserted. Gross 4 ATP and net 2 per completed
   glucose, on the ethanol branch exactly as on the lactate branch, to the same
   nine decimal places V2 and V5 asserted it to. If the two branches disagree
   by so much as a float, the model is wrong and this is where it surfaces.

4. The unlock, and the choice. It is a purchase like the others and it does not
   remove the lactate branch. A cell with both is a cell that can route
   pyruvate two ways, and what the player has bought is an option rather than
   an upgrade.

   Decide and record what happens when both are unlocked: does flux split, and
   on what? Do not invent a routing mechanic. The simplest true answer is that
   both reactions run against the same substrate under their own kinetics and
   the split falls out of the constants, which is what a real cell does and
   what this engine already does everywhere else.

5. Measure what the branch actually changes, and be willing to report that it
   changes little. Time to the wall, recovery time, ATP per second at steady
   state, and the split if both are unlocked. If ethanol is strictly worse than
   lactate at every constant, that is a purchasable configuration that makes
   the cell worse and V5's rule applies: do not ship one.

6. Determinism and the hash. This adds pools with starting amounts, so
   49ea08d3 moves. Record the new value, and put the reason in the assertion
   itself the way V3 and V5 did rather than in a commit message.

Verify: conservation holds across all five quantities with the CO2 in place and
fails without it, the ledger is unchanged to nine decimal places on both
branches, and the suite is green. Report the new canonical hash with its reason
in the assertion, the quoted conservation failure from step 2, the step 5
measurements, and the routing decision from step 4.
```

## Stage 2 Report

_Pending._

---

# Stage 3 — Glycogen storage, and what a buffer is worth

```
The unlock that produces no ATP. Read stage 1's cost decision first.

1. A glycogen pool and the two reactions, storage and mobilisation, at whatever
   asymmetry stage 1 decided. Carbon conserved through both. Same property
   test, same tolerance, no exceptions.

2. What it is FOR, decided before it is tuned. Act 1's environment is a finite
   unreplenished pool that lasts to 92m42s and the act's content ends at
   61m57s, so a player who keeps going watches the food run out. A buffer that
   is charged while supply is plentiful and drawn down when it is not is
   exactly the shape of that problem, and it is the first thing in the game
   that rewards looking ahead.

   That is the beat. Build toward it: the storage should be visibly useful in
   the late act rather than a number that goes up. If the tuning cannot make it
   useful, say so plainly rather than shipping a purchase that does nothing,
   and say what would have to change.

3. What it must NOT become. It is not a second currency, it is not an idle
   accumulator that pays out while away, and it does not raise yield. Buying it
   buys survival across a gap and nothing else. Anything that turns it into a
   score is docs/PILLARS.md rule 2 arriving through the back door.

4. The interaction with offline progress, and check this rather than assume it.
   A pool that fills and drains is a pool the steady-state detector has an
   opinion about. src/sim/steady.ts tests the second difference, so a pool
   changing at a constant rate is fine and a pool changing at a changing rate
   is not. Run the offline validation sweep with glycogen unlocked and report
   whether settle times or fallback counts moved. If they did, that is a
   finding about the offline path rather than about glycogen.

5. Tuning, with every scalar getting its docs/ECONOMY.md row in the same stage
   it is introduced rather than in stage 6. divergenceTable.test.ts counts
   scalars rather than names and it will fail otherwise, which is the guard
   doing its job.

Verify: conservation holds, the ledger is unchanged, the offline sweep is
green with glycogen unlocked, and every new scalar has a row. Report the
storage cost asymmetry as built, the late-act measurement from step 2 including
the honest version if it is not useful, and the settle and fallback figures
from step 4 against V8's.
```

## Stage 3 Report

_Pending._

---

# Stage 4 — The named enzymes

```
Three regulated steps, or whatever stage 1 decided instead. Read stage 1's
answer to its own step 3 before writing anything, and if it said a named
upgrade on a lumped reaction is a lie, build what it proposed rather than this.

1. The upgrades, as named enzymes attached to the reactions they actually
   regulate. Each one raises a specific kinetic parameter and each one has a
   reason in docs/SCIENCE.md for being the step that matters.

   The constraint V5 measured and settled applies here and it is not
   negotiable: payoff Vmax must strictly exceed twice prep Vmax, because the
   preparatory phase makes two trioses per glucose. Every configuration at
   exactly twice died. An enzyme upgrade that can be bought in an order that
   violates that is a purchasable configuration that kills the cell, and V5's
   answer to that was to sell the two phases together. Apply the same reasoning
   or show why it does not reach here.

2. Yield, unmoved, asserted across every new configuration. This is the claim
   act 1 exists to make. The number of purchasable configurations goes up
   again with this stage, and gross 4 and net 2 has to hold across all of them
   the way V5 asserted it across nine.

3. Diminishing returns, and make them legible. docs/BRIEF.md line 110's second
   question is whether saturating kinetics feel like a game, and the answer
   recorded in NOW.md is that the curves behave and there was nothing arriving
   for them to respond to. Three more purchases is more arriving. Whether each
   one visibly gives less than the last is the thing to measure, and it is the
   closest this log gets to answering that question.

4. Check for the trap V5 found and fixed. Raising a phase without the phase
   that pays for it produced an unrecoverable state at every constant, and
   bootstrap.test.ts asserts the repair including its mechanism. Run every new
   configuration against it. An enzyme upgrade that reintroduces the ATP
   bootstrap trap is the exact failure that test exists to catch, so it should
   catch it, and if it does not then the test is narrower than it looks and
   that is a more important finding than the enzymes.

5. Every scalar gets its docs/ECONOMY.md row in this stage, with the
   DEPARTURE or UNSOURCED classification decided honestly. A named enzyme with
   a real Vmax in the literature and a game value that does not match it is a
   DEPARTURE and the row says both numbers. A threshold is UNSOURCED and its
   real-behaviour cell stays empty.

Verify: yield unchanged across every configuration, bootstrap.test.ts green
against all of them, the payoff-over-twice-prep constraint held or shown not to
apply, and every scalar has a row. Report the configuration count, the
diminishing-return measurement from step 3, and the result of running step 4
against the trap.
```

## Stage 4 Report

_Pending._

---

# Stage 5 — Re-derive the act, and answer blocking item 2

```
The measurement stage. Nothing new is built here. This is where the log finds
out whether it worked.

1. Instrument a full act 1 run the way V5 stage 5 did, with every unlock now
   available. Report, for two players: one who buys everything the instant it
   is affordable, and one who checks every five game-minutes.

     total purchases
     time to each one
     the longest gap between two
     time to the last one
     when the environment runs out
     ATP per second at each configuration

   V5's figures are the comparison: 7 purchases, last at 61m57s, worst gap
   13m51s, food to 92m42s, target 45 to 90 minutes.

2. Blocking item 2, answered in one of three ways, and the third is allowed.

   CLOSED: the worst gap is short enough that the screen has something arriving
   often enough to be worth watching, and the act is still inside its target.
   Say what "short enough" means as a number and why that number, rather than
   asserting the gap is fine because it got smaller.

   NARROWED AGAIN: it improved and it is not fixed. Say by how much, say what
   is left, and say what would close it. This is what V5 reported and it was
   the right report. Repeating it honestly is better than closing the item on a
   number that merely looks better.

   NOT CLOSED BY CONTENT: the gap is a display problem rather than a content
   problem, and the answer is DESIGN.md open question 7 and the beast, which
   is V12. NOW.md has suspected this since V5 and this log is the one with the
   standing to say it, because it is the log that spent all the remaining act 1
   content on the problem.

3. The act's duration against its target. Three more purchases push the last
   one later. If the last purchase now lands past 90 minutes the act is outside
   its target and that is a tuning result, not a failure. Report it and say
   what moves: thresholds come down, or docs/PROGRESSION.md's target is wrong
   and should be argued rather than silently exceeded.

4. The empty tail. Content ended at 61m57s and food lasted to 92m42s, so there
   were 28 minutes of nothing at the end that NOW.md records as deliberate and
   unannounced. Re-measure it. If the tail is now longer, that is worse rather
   than better and it belongs in the report, because a bigger act with a bigger
   silence at the end of it has moved the problem rather than solved it.

5. docs/BRIEF.md line 110, question 2. "Do saturating kinetics feel like a
   game?" The recorded answer is no, not yet, and the recorded reason is that
   nothing was arriving. Say what this log changed about that, and say it with
   the standing caveat NOW.md has carried since V3 attached: this is the person
   who built it, who knows where every purchase lands, and that is the least
   reliable possible reader. Do not upgrade the answer to yes. Say what changed
   and leave the verdict to somebody who has not seen it before.

Verify: a full instrumented run for both player models. Report every figure in
step 1 against V5's, the blocking item 2 verdict in one of the three shapes
with its reasoning, the duration against target, the re-measured tail, and the
line 110 statement with its caveat intact.
```

## Stage 5 Report

_Pending._

---

# Stage 6 — Coherence, and the documents

```
Close the log out. No new content.

1. docs/ECONOMY.md. Every scalar this log introduced has a row and the
   document's own stated count matches what it contains, because
   divergenceTable.test.ts checks that too. Report the new total against V5's
   thirty-seven and the DEPARTURE to UNSOURCED split against 25 and 12.

2. Confirm docs/SCIENCE.md is untouched since stage 1. Hard rule 2 permits the
   stage 1 edit and forbids every other one, so `git diff` across stages 2 to 6
   on that file must be empty. Report the diff as evidence rather than the
   claim.

3. Player-facing text for everything new, in src/ui/content.ts, under
   docs/CONTENT_STYLE.md. Every figure carries a badge or it does not compile.
   The three teaching beats this log adds are worth writing carefully rather
   than functionally:
     - ethanol and lactate both recycle NAD+ and neither makes ATP, so the
       choice is about what the cell keeps rather than about which is better
     - a buffer is not a yield
     - a named enzyme upgrade raises throughput and not yield, which is the
       act's central claim arriving for the third time

   contentStyle.test.ts enforces the mechanics. It does not test voice and it
   should not, so the voice is on whoever writes it.

4. Full verify: npm run typecheck, npm run lint, npm run build, npm test,
   npm run sim, npm run sim:act1, npm run offline:validate. Report the test
   count against V8's 503 and the bundle size against V8's 278.31 kB.

5. Update NOW.md:
   - Status: what a player can now do that they could not.
   - Build state table: V10 done, with the date, and its "does not" column.
   - A "What act 1 contains" section, or fold it into the content layer
     section, with the full pathway transcribed the way this log's Context
     transcribes the old one. That block is the single most useful thing in
     NOW.md for anyone picking the project up and it goes stale silently.
   - The new canonical hash, with the reason it moved, alongside 172f83fb.
   - Blocking item 2: whichever of the three verdicts stage 5 reached. If it
     closed, strike it through with the date the way item 1 was struck. If it
     narrowed, say by how much and leave it open.
   - docs/BRIEF.md line 110 question 2: what changed, caveat intact.
   - The permanent id list from stage 1, recorded as contract surface the way
     V4 recorded the storage keys and the unlock ids.
   - "Next, in order": V11, Spine A. Point at
     docs/designs/game-spine-and-four-acts.md rather than restating it.

6. Report what this log did NOT do, explicitly. Act 1 is complete as content
   and it still has no ending, no timeline, no beast and no act boundary. Those
   are V11 and V12. A reader of NOW.md should not be able to mistake a complete
   unlock list for a complete act.

Verify: everything green. Report the ECONOMY.md counts, the empty SCIENCE.md
diff across stages 2 to 6, the test count, the bundle size, the canonical
hashes, and the NOW.md diff summary including which of the three blocking item
2 verdicts landed.
```

## Stage 6 Report

_Pending._

---

# After These Stages

- **Act 1's unlock list is complete for the first time.** `docs/PROGRESSION.md` has listed nine since 2026-07-29 and six was the reference implementation for "one complete act per log". Nine is what that phrase actually means.
- The negative half of `docs/BRIEF.md` line 110 has been given the only answer act 1 can give it. Whether it is enough is a question for a reader and the standing caveat still applies with full force.
- Blocking item 2 has been worked on by the log with the standing to close it. If it did not close, the report says so and says why, and the remaining half is a display question that V12 owns.
- Act 1 releases carbon for the first time, into a real pool with a real name, and conservation still holds to 1e-9 across five quantities. **The invariant survived the first content change that could have broken it**, which is the strongest evidence yet that it is a property rather than a coincidence of a small pathway.
- The player has a decision that is not an upgrade. Lactate or ethanol, neither better, differing in what the cell keeps. It is small and it is the first one.
- What act 1 still does not have is an ending. It has all its content and nothing that says the content is over, which is exactly the state `NOW.md` has described for its last 28 minutes since V5 and which V11 is the log that fixes.
