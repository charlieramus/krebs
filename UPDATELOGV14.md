charlie

# krebs, V14: Act 3, Complete
# Work on one stage at a time. Do NOT combine stages.

---

## BLOCKED UNTIL A DECISION IS TAKEN

**Do not start stage 1 until the act ordering decision is recorded in `NOW.md`.**

Act 3's payoff is yield per glucose going from 2 to roughly 30, and that requires oxygen as the terminal electron acceptor. Act 2 is what supplies oxygen. `src/save/schema.ts` reserves `environment.oxygenLevel` and act 1 writes it as a literal `0`, with the comment saying that is not a placeholder. So act 3 built before act 2 needs a nonzero oxygen level that comes from nowhere.

Two exits and both are legitimate:

**ACCEPT.** Act 3 ships with a placeholder oxygen constant, carrying a DEPARTURE row in `docs/ECONOMY.md` that says plainly it stands in for a schedule act 2 has not built yet, and act 3's balance is re-derived when act 2 lands. The cost is one tuned number that is knowingly wrong and one rebalance.

**FLIP.** Act 2 moves ahead of act 3, this log becomes act 2, and the value-ordering argument in `docs/designs/game-spine-and-four-acts.md` is withdrawn rather than quietly ignored. The cost is that the game's emotional peak arrives later and the highest-risk beat arrives first.

If ACCEPT, stage 1 owns the placeholder and its row, and every later stage inherits the knowledge that act 3's numbers are provisional. If FLIP, this file is not the next log.

---

## Context

Read `NOW.md` first, then `docs/PROGRESSION.md` act 3, then `docs/SCIENCE.md` on the electron transport chain and chemiosmosis, then `DESIGN.md`.

**This is the single hard transition and the emotional peak of the game.** `docs/PROGRESSION.md` rejects repeatable prestige resets and replaces them with one irreversible structural change: endosymbiosis, at the act 2 to act 3 boundary. Multicellularity was cut on 2026-07-27, so this is the only one there will ever be. Some capabilities are lost, a fundamentally different architecture is gained, and the economy rescales because the biology rescaled.

**The teaching beat is the least intuitive idea in the whole game and `docs/PROGRESSION.md` says the mechanics have to force it.** Electron transport does not make ATP. It pumps protons. The gradient makes ATP. The player has to build the gradient before they can spend it, so the two-step structure is felt rather than read.

**Nothing in the illustration language encodes a membrane, a compartment or a proton gradient.** `DESIGN.md`'s rule is that every visual property carries simulation state, and act 1's whole illustration set is derived from a conserved-weight table: sides are carbons, dots are phosphates. A compartment is not a weight. This log writes new illustration rules, which the design doc's risk table flags and defers here on purpose.

**The engine has never had a pool with a location.** `src/sim/pools.ts` is a flat `Float64Array` with a frozen id-to-index map, and `tick.ts` iterates by index and never by key. A compartment could mean a real structure in the kernel, or it could mean nothing to the kernel at all. That decision is stage 2 and it is the largest architectural choice in the log.

**Spine A and Spine B ran, so this log builds content into a frame that already fits it.** Acts are data, the runtime takes a descriptor, the timeline has a stop for this act, the beast exists, provenance works, boundaries fire, and the guards cover every new surface on the day it lands. **This is the first log that gets to find out whether that was worth doing.**

## Decisions

- **Stage 1 is documentation and it comes first, as in V10 and for the same reason.** Act 3's stoichiometry is biology, hard rule 1 says a player-facing number traces to `docs/SCIENCE.md`, and this log adds more new biology than any log since V2. New ground truth is a legitimate `docs/SCIENCE.md` edit; a balance number is not, and hard rule 2 bans the second in every other stage.
- **A compartment is a naming convention in the kernel and a real thing everywhere else.** The kernel stays a flat array of pools with permanent ids, because `tick.ts`'s two-phase update and the conservation property test are the two most valuable things in the project and neither should learn about geography. What a compartment gets is: ids that say where a pool is, a descriptor that knows which pools are in which compartment, and transport reactions that move matter between them. **A proton crossing a membrane is a reaction, not a special case.** If stage 2's reading says this is wrong, stage 2 says so before anything is built on it.
- **The proton gradient is a pool, so building it before spending it is mechanical rather than instructional.** Protons pumped into the intermembrane space are an amount. ATP synthase consumes that amount. A player who has bought the electron transport chain and not ATP synthase watches protons pile up and no ATP arrive, which is the chemiosmosis beat happening to them instead of being explained to them. **That is the whole design of the act in one sentence and every other decision serves it.**
- **Protons are conserved and the invariant proves the beat.** Act 1 has five conserved quantities and V10 kept carbon conserved through a reaction that releases CO2 by giving the CO2 a pool. Same discipline. A proton in the intermembrane space and a proton in the matrix are the same proton in a different place, and if the conservation test does not agree then the gradient is being modelled as magic.
- **The transition is one-way and the undo is one decision deep.** `docs/PROGRESSION.md` says digesting the endosymbiont gives a large one-off ATP payout and a soft lock, deliberately, as a teaching moment about short-term versus structural gains, and says to provide an undo on this one decision. So a snapshot is taken before the choice and it is the only snapshot the game ever takes. It is not a save-scumming mechanic and it does not generalise.
- **The shuttle choice is a real choice with different yields and it is not a trap.** Malate-aspartate and glycerol phosphate differ in ATP yield for real biochemical reasons. `docs/PROGRESSION.md` lists whether it should be permanent or switchable as an open question for the prototype, and this log is the prototype, so it answers it rather than inheriting it.
- **The contested-science beat is interactive and it is the feature nothing else in the genre has.** Provenance already tells a player which numbers are measured and which are tuned. The Contested badge has a destination as of V12 and no content behind it. Act 3 is where it gets some, because the ATP yield of aerobic respiration is genuinely argued about and the honest number is a range.
- **The 15x payoff surface uses the player's own act 1 figures where they exist, and sourced reference figures where they do not.** A player who jumped straight to act 3 has no act 1 history, and showing them a fabricated one would be the exact dishonesty this whole project is built against.
- **The yield claim changes for the first time in the game's history, and that is the point.** Act 1's ledger of 4 gross and 2 net has been asserted since V2 across every configuration. Act 3 breaks it deliberately, to roughly 30, and every assertion that enforces act 1's ledger must be scoped to act 1 rather than loosened.
- Largest content log in the project, one irreversible mechanic, new illustration language, and a kernel-adjacent decision: seven stages.

## What act 3 has to contain, from docs/PROGRESSION.md

```
  1  pyruvate transport into the new compartment
  2  pyruvate dehydrogenase complex
  3  TCA cycle, initially as one unit, then decomposed
  4  electron transport chain, complexes acquired in sequence
  5  ATP synthase
  6  NADH shuttle systems, a real choice between malate-aspartate and
       glycerol phosphate, with different yields
  7  endosymbiotic gene transfer, moving genes to the host genome to
       regain control
  8  mitochondrial replication, scaling the number of mitochondria

  lost at the transition   some direct-control upgrades. The endosymbiont has
                           its own genome and the player does not have full
                           authority over it initially
  gained                   a compartment with a membrane potential across it
  teaching beat            chemiosmosis, forced by the mechanics
  payoff                   2 to roughly 30
  target duration          120 to 180 minutes
```

---

# Stage 1 — The biology, the oxygen decision, and the documents

```
A documentation stage. No TypeScript. Read docs/SCIENCE.md end to end first.

1. Record the ordering decision as taken, at the top of the report. ACCEPT or
   FLIP, who decided, and on what grounds. If ACCEPT, this stage owns the
   placeholder oxygen constant and its docs/ECONOMY.md row, and the row says in
   plain words that the number stands in for a schedule act 2 has not built.

   A number that is knowingly wrong and labelled as such is fine. A number that
   is knowingly wrong and looks like the others is not, and the divergence
   table exists for exactly this.

2. The chemistry act 3 needs, checked against docs/SCIENCE.md and written where
   it is missing:
     - pyruvate transport across a membrane
     - the pyruvate dehydrogenase complex, which is where CO2 appears again and
       where the link to V10's ethanol branch is worth noticing
     - the TCA cycle, as one unit and then decomposed, with what each turn
       actually produces
     - the electron transport chain, complex by complex, and what each pumps
     - ATP synthase, and the stoichiometry of protons per ATP
     - both NADH shuttles, and why their yields differ

3. The yield range, and this is the one to be most careful with. The 2 to
   roughly 30 figure is the game's headline claim and the real number is
   argued about. docs/SCIENCE.md should already say something about this; if it
   says a single number, that is a problem, because the honest answer is a
   range with reasons.

   Establish the range and the reasons. This is the content the contested beat
   in stage 6 renders, so getting it right here is what makes that stage
   possible rather than decorative.

4. Oxygen as the terminal electron acceptor, stated explicitly in the document
   even though it feels obvious. It is the fact the whole ordering decision
   turns on and it is currently implicit.

5. docs/PROGRESSION.md's open question: should the shuttle choice be permanent
   or switchable? Answer it here with reasoning, before any mechanic depends on
   it. The argument for permanent is that it is a real structural difference
   and the game has one irreversible decision already. The argument for
   switchable is that a choice you cannot revisit is a choice most players make
   uninformed. Pick, and say why.

6. Name every pool id, compartment id and unlock id, permanently, in one list.
   Pool ids are permanent per docs/SAVE_SCHEMA.md Part 3. If stage 2 decides
   compartments are encoded in the id, this list is where that convention is
   set, so it has to be readable in five months by somebody who did not choose
   it.

Verify: docs/SCIENCE.md covers everything in step 2 with citations, the yield
range is established with its reasons, and the shuttle question is answered.
Report the ordering decision, the placeholder row if ACCEPT, everything added
to docs/SCIENCE.md, the yield range, the shuttle answer, and the permanent id
list with its compartment convention.
```

## Stage 1 Report

_Pending._

---

# Stage 2 — The compartment, in the data and in the picture

```
The largest architectural decision in the log. Nothing after this stage can be
built until it is settled.

1. What a compartment is to the kernel, and the answer this log takes is
   nothing. src/sim/pools.ts is a flat Float64Array with a frozen id-to-index
   map, tick.ts iterates by index and never by key, and the conservation test
   is a property over a weight matrix. None of those should learn geography.

   So a compartment is: a convention in pool ids, a grouping the act descriptor
   knows about, and transport reactions that move matter across a boundary.
   A proton crossing a membrane is a reaction like any other.

   Test that against the alternative before accepting it. If compartments need
   to be real in the kernel, the reason will be something the flat model cannot
   express, and the report should name what that would be. If nothing does,
   say so, because "we considered it and the flat model holds" is a stronger
   record than silence.

2. Conservation across a compartment boundary. A proton in the intermembrane
   space and a proton in the matrix are the same proton in a different place,
   so the conserved total does not change when one moves. Extend the property
   test to cover a transport reaction and prove it fails if a transport
   reaction leaks. Quote the failure. A conservation test that has not seen the
   violation it exists to catch has not been checked.

3. The illustration rules, new, because nothing in the language encodes a
   membrane, a compartment or a gradient. DESIGN.md's rule is that every
   visual property carries simulation state and nothing in the set is
   decorative, so these have to be derived rather than drawn.

   Three things need a treatment:
     - a compartment, as a place a pool can be
     - a membrane, as a boundary matter crosses
     - a gradient, which is a difference across that boundary rather than an
       amount in a place, and is therefore the genuinely new one

   The gradient is the interesting problem. Every existing rule maps a scalar
   property of one pool to a visual property. A gradient is a relationship
   between two. Whatever encodes it is the first rule in the system that reads
   two pools at once, and that is worth writing down as such in DESIGN.md.

4. Write them into DESIGN.md with the decisions log rows, before any component
   renders them, which is the ordering V12 stage 1 used and every ordering
   claim of this shape in NOW.md has been right.

5. Accessibility from the start. A compartment and a gradient are both new
   meanings, and the channel table has to name a second channel for each that
   is neither motion nor colour. V7's rule, and V12 already applied it to the
   beast.

6. The bundle, and the art governance rule V12 stage 1 wrote. Compartment and
   membrane treatments may be derivable, in which case they cost nothing, or
   they may be drawn, in which case the rule and the budget both apply.

Verify: the flat-kernel decision is taken with the alternative considered,
conservation holds across transport and fails on a leak, and DESIGN.md carries
the three new rules with decisions-log rows. Report the flat-versus-real
reasoning, the quoted conservation failure, the three rules with their second
channels, and the bundle impact.
```

## Stage 2 Report

_Pending._

---

# Stage 3 — The transition

```
The one irreversible decision in the game. Build it carefully and build the
undo first.

1. The arrival. A stranger swims in. The player chooses to keep it or digest
   it. Keeping is the only path forward; digesting gives a large one-off ATP
   payout and a soft lock, deliberately, as a teaching moment about short-term
   versus structural gains.

   docs/PROGRESSION.md is explicit that the soft lock is the lesson rather than
   a punishment, so what the player sees after digesting has to teach rather
   than scold. They made a real choice, they got what it offered, and the game
   should say what it cost without editorialising.

2. The undo, built before the choice is playable. A snapshot taken before the
   decision, restorable, and it is the only snapshot this game ever takes.

   Say in the report what it is not: not a save-scumming mechanic, not
   generalisable to other decisions, not a rewind. One decision, one snapshot,
   because docs/PROGRESSION.md asks for an undo on this one decision and on no
   other.

   The storage question: docs/SAVE_SCHEMA.md has no snapshot slot. Adding one
   is a schema question and it may be the bump Spine A's decision stage was
   told to predict. Follow hard rule 7 exactly if so.

3. transitionTaken and the state after it. The field has been in SaveV1 since
   V4, labelled act 3, written as false and read by nothing. This is where it
   becomes real.

4. What is lost, which is the part that will feel wrong to implement and is
   correct. The endosymbiont is a separate entity with its own genome and the
   player does not have full authority over it initially, so some direct
   control goes away. An idle game that takes away an upgrade is doing
   something unusual and it is the same move act 2 makes with damage.

   The player must be able to tell what happened. Losing control silently reads
   as a bug; losing it with a stated reason reads as biology.

5. The boundary set piece, using the machinery Spine A built and the beast V12
   built. This is the largest authored moment in the game and it is the one the
   design doc's platonic ideal describes: a stranger swims in and you decide
   whether to eat it.

6. The offline path across this boundary. Spine A settled that an act boundary
   stops the jump and the transition is watched live on return, which matters
   more here than anywhere: a player must not come back from eight hours to
   find the single irreversible decision in the game was made while they were
   away. Confirm the machinery does what Spine A said it does, against this
   boundary specifically.

Verify: the choice works both ways, the undo restores exactly, transitionTaken
persists, and an absence spanning the boundary stops at it. Report the snapshot
mechanism with its schema decision, what is lost and how the player is told,
the offline behaviour across the transition, and the digest path's text.
```

## Stage 3 Report

_Pending._

---

# Stage 4 — The pathway, and the gradient that has to be built before it is spent

```
The heart of the act. This is the stage the whole log exists for.

1. The unlocks in sequence: pyruvate transport, the pyruvate dehydrogenase
   complex, the TCA cycle as one unit then decomposed, the electron transport
   chain complex by complex, and ATP synthase.

   The order is the teaching. A player who has the chain and not the synthase
   is the point rather than an unbalanced state to be avoided.

2. The gradient as a pool, which is what makes the beat mechanical. Protons
   pumped into the intermembrane space accumulate. ATP synthase consumes them.
   So:
     - buy the chain, and protons pile up while ATP does not move
     - buy the synthase, and the pile converts

   That sequence is chemiosmosis happening to the player. docs/PROGRESSION.md
   asks for the two-step structure to be felt rather than read and this is the
   whole of how.

   Make sure the pile-up is visible and legible. If the player cannot see
   protons accumulating, the beat is a number changing later rather than a
   thing they watched build.

3. Conservation, every step, all quantities including protons and the ones act
   1 and V10 established. Same tolerance, no exemptions. The TCA cycle releases
   CO2 and act 1 already has a co2 pool from V10's ethanol branch, so check
   whether it is the same pool or whether a compartment makes it a different
   one. That question has a right answer and stage 2's convention decides it.

4. The yield, and the assertion that has to be rescoped rather than relaxed.
   Act 1's ledger of 4 gross and 2 net per glucose has been asserted since V2
   across every configuration, and act 3 breaks it on purpose. Find every
   assertion that enforces it and scope each to act 1 explicitly. Do not
   loosen one. A test that says "yield is 2 unless it is not" protects nothing.

   Then assert act 3's yield the same way, across every purchasable
   configuration, with the range from stage 1 rather than a single number if
   the range is what the science supports.

5. The steady-state and offline implications, checked rather than assumed. Act
   3 has more pools, more reactions and a gradient that fills and drains.
   src/sim/steady.ts tests the second difference so a pool changing at a
   constant rate is fine, but SETTLE_MAX_TICKS is 1200 and a walled act 1 cell
   already settles at 1120, a margin of 6.7 percent. A longer pathway may not
   fit.

   Run the offline validation sweep against act 3 configurations and report
   settle ticks, fallback counts and the worst readings against V12's. **If act
   3 does not settle inside the budget, that is a blocking finding and it is
   more important than anything else in this stage**, because the fallback is
   the path NOW.md blocking item 6 says destroys the cell.

6. Every tuned scalar gets its docs/ECONOMY.md row in this stage. The count is
   about to grow a great deal and divergenceTable.test.ts counts scalars.

Verify: the chain-then-synthase sequence produces a visible pile-up then a
conversion, conservation holds across every new reaction including protons, act
1's ledger assertions are scoped rather than loosened, and the offline sweep is
green against act 3. Report the pile-up measurement, the rescoped assertions,
act 3's asserted yield, the sweep figures with settle ticks against the budget,
and the new ECONOMY.md count.
```

## Stage 4 Report

_Pending._

---

# Stage 5 — The shuttles, the genome, and the mitochondria

```
The three unlocks that come after the pathway works.

1. The NADH shuttles, as the real choice stage 1 decided. Malate-aspartate and
   glycerol phosphate differ in yield for real biochemical reasons, and
   shuttleChoice has been in SaveV1 since V4 as a string or null, labelled act
   3, written as null and read by nothing.

   Build whichever of permanent or switchable stage 1 chose, and if it is
   permanent then the player has to be able to understand the choice before
   making it, because a permanent uninformed choice is a trap rather than a
   decision.

2. Endosymbiotic gene transfer. Moving genes to the host genome to regain the
   control stage 3 took away. This is the payoff for the loss and it should
   feel like one, which means the loss has to have been legible when it
   happened.

   It is also the most conceptually interesting unlock in the game and it is
   easy to render as a generic upgrade. It is the mechanism by which two
   organisms became one. Give it text worth reading, under
   docs/CONTENT_STYLE.md.

3. Mitochondrial replication, scaling the number of mitochondria. The scaling
   question needs care: docs/PILLARS.md rules out infinite scaling, so this is
   a finite ladder like the act 1 capacity ladders rather than a multiplier
   with no ceiling.

   And V5's rule applies to every rung: a purchasable configuration that makes
   the cell worse must not ship. More mitochondria cost maintenance.

4. Conservation and yield, again, across every new configuration. The
   configuration count for act 3 will be larger than act 1's nine and the
   assertion has to hold across all of them.

5. Balance against the target. docs/PROGRESSION.md gives act 3 120 to 180
   minutes. Instrument it the way V5 stage 5 and V10 stage 5 did: two player
   models, purchases, gaps, time to the last one. Report against target.

   And measure the gaps specifically, because blocking item 2 was about act 1's
   dead gap and a longer act with a bigger silence in it has moved the problem
   rather than solved it.

Verify: all three unlocks work, yield holds across every configuration,
no rung makes the cell worse, and act 3 lands inside its target. Report the
shuttle implementation with its permanence decision, the configuration count,
the pacing measurement for both player models, and the worst gap against act
1's.
```

## Stage 5 Report

_Pending._

---

# Stage 6 — The payoff surface, and the contested beat

```
The two features that make this act more than a bigger act 1.

1. The 15x payoff surface. The design doc's platonic ideal describes it: the
   game puts your own act 1 figure next to your own act 3 figure with your own
   playtime attached and lets you look at it.

   Use the player's real history where it exists. stats.totalAtpProduced,
   glucoseConsumed and the rest have been persisted since V4 and this is the
   first thing that has ever needed them for something other than unlock
   thresholds.

   And handle the case where there is no history, honestly. A player who jumped
   to act 3 with V13's door has no act 1 figures. Show sourced reference
   figures and say they are references. Fabricating a history for them would be
   the exact dishonesty this project is built against, and the Figure component
   already has a badge contract that makes the distinction expressible.

2. Every number on that surface carries a badge and opens its provenance, which
   V12 built. This is the highest-stakes screen in the game for hard rule 1: it
   is the moment the game makes its biggest quantitative claim, and it is the
   moment a player is most likely to want to know where the number came from.

3. The contested beat, which is E7 and the thing nothing else in the genre
   does. The ATP yield of aerobic respiration is genuinely argued about and
   stage 1 established the range and the reasons.

   Make it interactive rather than a paragraph. The player has just watched
   their yield go from 2 to roughly 30 and the honest statement is that
   "roughly" is doing work: the number depends on which shuttle they chose,
   on assumptions about proton stoichiometry, and on measurements that
   disagree. **A game that tells you its headline number is contested, at the
   exact moment the number lands, is making a claim about honesty that costs it
   something.** That cost is the feature.

   The Contested badge got a destination in V12 and has had no content behind
   it. This is the content.

4. The beast, at the transition and after it. V12 built four states pinned to
   simulation conditions through the act descriptor. Act 3's conditions are
   different: a cell with a compartment, a gradient and a mitochondrion visible
   inside it. Extend rather than special-case, and if the four states do not
   fit act 3 then the descriptor's shape is what needs to change, which is
   exactly the widening Spine A left for the second act to do.

5. The timeline, at act 3's stop. V12 built the marker as discrete and moving
   only at act boundaries, so this should need nothing but the boundary firing.
   Confirm it, and confirm the act 4 stop is still act 4's rather than having
   been absorbed.

Verify: the payoff surface renders from real history and from references, every
number carries a badge and opens provenance, the contested beat is interactive,
and the beast and timeline both reflect act 3. Report the surface in both
history states, the contested content, whether the beast's four states fitted
or the descriptor widened, and the timeline check.
```

## Stage 6 Report

_Pending._

---

# Stage 7 — Coherence, and the documents

```
Close the largest log in the project out.

1. Full verify: npm run typecheck, npm run lint, npm run build, npm test,
   npm run sim, npm run sim:act1, an act 3 harness if stage 4 added one,
   npm run offline:validate, and the headless playthrough extended to act 3.
   Report the test count and bundle size against V13's.

2. docs/ECONOMY.md. Report the new total and the DEPARTURE to UNSOURCED split.
   If the ordering decision was ACCEPT, the placeholder oxygen row is in there
   and should be called out by name in the report, because it is the one row in
   the table that is knowingly standing in for something.

3. Confirm docs/SCIENCE.md untouched since stage 1. Hard rule 2 permits the
   stage 1 edit and forbids every other one. Report the diff as evidence.

4. The canonical hashes. Act 3 is new content with new pools, so it has its own
   hash. Act 1's must not have moved: this log adds an act and does not touch
   act 1, and a moved act 1 hash means the registry work leaked.

5. Update NOW.md:
   - Status: what a player can now do. This is the biggest one to write since
     V3 and it should say the thing plainly: the cell has a mitochondrion in
     it and makes roughly fifteen times the ATP.
   - Build state table: V14 done, with its "does not" column, which still
     includes act 2 and act 4.
   - A "What act 3 contains" section with the pathway transcribed the way act
     1's is. That block goes stale silently and it is the most useful thing in
     the file for someone picking the project up.
   - The compartment decision from stage 2, as settled, with the flat-kernel
     reasoning. This is the durable architectural record.
   - The three new illustration rules, including the gradient one being the
     first rule in the system that reads two pools at once.
   - The transition, the undo, and that it is the only snapshot the game takes.
   - The shuttle permanence answer, which closes a docs/PROGRESSION.md open
     question for the prototype.
   - The yield, and that act 1's ledger assertions are now scoped to act 1
     rather than global.
   - The offline figures for act 3 against the settle budget, prominently. If
     act 3 sits close to SETTLE_MAX_TICKS, that is a standing hazard act 2 will
     make worse.
   - If ACCEPT: the placeholder oxygen constant as an open item, with the
     rebalance it obliges when act 2 lands.
   - "Next, in order": V15, teacher mode.

6. docs/PROGRESSION.md: its act 3 open question about the shuttle is answered,
   so record the answer there. Do not add numbers; that file says it holds
   none.

Verify: everything green, act 1's hash unmoved, act 3's recorded. Report the
test count, the bundle, the ECONOMY.md counts with the placeholder row named if
it exists, the empty SCIENCE.md diff, and the NOW.md diff summary.
```

## Stage 7 Report

_Pending._

---

# After These Stages

- **The game has its transition.** `docs/PROGRESSION.md` rejected prestige loops on 2026-07-27 and replaced them with one irreversible structural change, and this is it. There will never be another one.
- Chemiosmosis is a thing that happens to the player rather than a thing they are told. Buy the chain and protons pile up and no ATP arrives. Buy the synthase and the pile converts. **The least intuitive idea in the game is delivered by making the player wait for the second half of it.**
- Yield goes from 2 to roughly 30, the claim act 1 spent 45 to 90 minutes making a ceiling is broken on purpose, and act 1's ledger assertions are scoped rather than loosened, so both claims survive.
- A pool has a location for the first time and the kernel never found out. The flat `Float64Array` and the conservation property test are unchanged, and a proton crossing a membrane is a reaction like any other.
- The illustration language gained its first rule that reads two pools at once, because a gradient is a relationship rather than an amount, and every rule before it mapped one scalar to one visual property.
- **The game tells you its headline number is contested at the exact moment that number lands.** Provenance made that expressible in V12 and this is the first content that uses it for something that costs the game credibility rather than earns it.
- What is still missing is the act that explains why any of this happened. Oxygen was a mass extinction before it was fuel, and until act 2 exists the game presents aerobic respiration as the next rung on a ladder, which is the reading `docs/PROGRESSION.md` exists to refuse.
