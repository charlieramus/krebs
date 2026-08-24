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

**ACCEPT. Taken 2026-08-24 by Charlie. Act 3 goes next and it ships against a placeholder oxygen level.**

Recorded in `NOW.md` before any other edit in this stage, because the log's own gate says stage 1 does not start until it is there. It replaces the Status block's opening sentence, the "Next, in order" item 1 heading, and both places the decision was carried as open. **The two-exit block is struck through rather than deleted**, on the standing argument that a decision with its alternatives erased reads as an inevitability.

**The grounds, and they are not the value-ordering argument.** The design doc puts act 3 first because it carries the headline claim and should exist earliest. That argument was never settled against the counter-argument that act 2 explains why any of it happened, and this stage did not settle it either. **What decided it is that FLIP had nothing to run into.** `docs/PROGRESSION.md` still lists act 2's shape as an open question for the prototype, `NOW.md` item 3 already said in as many words that writing an act 2 row today would be inventing content in a state file, and `UPDATELOGV14.md` is seven stages of act 3. So the exits were not symmetric: ACCEPT buys one knowingly wrong constant and one rebalance, and FLIP buys a decision that could not be acted on, which is the one outcome neither exit was priced for.

**What ACCEPT does not license, written down at the moment it was taken rather than later.** It does not withdraw the reading `docs/PROGRESSION.md` exists to protect. Oxygen was a mass extinction before it was fuel, and until act 2 exists this game presents aerobic respiration as the next rung on a ladder. That is a known cost of the order and not a defect V14 can fix. This log's own "After These Stages" section already says so and it stays true.

### The placeholder, and why it is deliberately not a row

`ACT3_O2_ENV_PLACEHOLDER`, and **the name is doing work.** Step 1 says a number that is knowingly wrong and labelled as such is fine and one that is knowingly wrong and looks like the others is not. `ACT3_O2_ENV_INITIAL` would have looked exactly like `ACT1_GLUCOSE_ENV_INITIAL`. The warning is in the identifier so that it survives a reader who never opens `docs/ECONOMY.md`.

**The row is written in full and it is not in the divergence table, and this is the one deviation in the stage that changes what was delivered.** The stage says this stage owns the constant and its row. It also says, first line of the fenced block, no TypeScript. Those two cannot both be honoured, because `src/ui/__tests__/divergenceTable.test.ts` has a test called "has no row naming a constant that no longer exists" and a third test asserting the document's stated per-file counts against the live modules. **A table row for a constant that does not exist yet fails the suite on the stage that wrote it.** Verified by reading the guard rather than by trying it: the orphan check matches on `` | `NAME` | ``, anchored to a table cell, so prose naming the constant in backticks is not caught and a row is.

So the row's content ships in this stage and its table cell ships in stage 4, which is the stage that mints act 3's tuned scalars and which step 6 already makes responsible for every one of their rows. `docs/ECONOMY.md` gains a section, **"The placeholder oxygen level"**, carrying the real behaviour cited to Part 3, what the game does instead, and the plain-words paragraph step 1 asks for:

> *Act 2 has not been built. This number stands in for a rising oxygen level that act 2 is the act that produces, and nothing in act 3 makes it go up or down. It is not a measurement, it is not tuned against anything real, and it is not a simplification of a process the game models somewhere else. It is a value chosen so that act 3 can be played before the act that explains where oxygen came from exists.*

**The second reason outlives the first and is the better one.** Forty-eight rows say "we chose this and here is why". This one says "we do not know this and act 2 will". A reader skimming a column of identical-looking rows would not catch the difference, which is the failure the table exists to prevent. When it joins the table in stage 4 it keeps the section and the row cites back to it.

The three stated counts in `docs/ECONOMY.md` are untouched at 24, 23 and 1 for a total of 48, because no constant was added. Stage 4 moves them.

### What went into docs/SCIENCE.md

Part 4 goes from 88 lines to roughly 260. Everything that was there is retained; the two sections that were already correct on stoichiometry, "Origin of mitochondria" and "Contested: early or late mitochondria", are untouched. Step 2's six items, in order, with what each one was before:

**Pyruvate transport across a membrane. Absent, now a section.** Two membranes and only one is a barrier: porins pass pyruvate across the outer membrane free, and the inner membrane needs the mitochondrial pyruvate carrier, whose identity was open for roughly forty years and was settled in 2012 by two groups independently as an MPC1 and MPC2 heterocomplex. **It is a proton symport, one pyruvate in with one proton.** That is the fact worth having found: the first unlock of act 3 spends the gradient at a point where the player cannot make one, and the cost falls out of a real carrier's stoichiometry rather than out of a designer adding it.

**The pyruvate dehydrogenase complex. Four lines, now a section with the link the stage asked for.** Three enzymes and five cofactors, a swinging lipoyl arm, substrate channelling, and regulation by phosphorylation rather than by the allostery act 1 uses. **The link to V10's ethanol branch is real and it is a comparison between two things the player has personally bought.** Pyruvate decarboxylase and this complex take the same carbon off the same molecule and are both thiamine pyrophosphate dependent. What differs is the two carbons left over: the decarboxylase releases them as acetaldehyde and the cell reduces it to ethanol purely to recover NAD+, throwing the bond energy away, while the complex oxidises them onto coenzyme A as a thioester and banks the electrons as NADH. **Same decarboxylation, one discards what the other banks**, which is the cleanest available statement of what act 3 changes.

**The TCA cycle, as one unit and then decomposed. Totals only, now the eight steps** with enzyme, substrates and products per step. Four things in that table are load-bearing and none is visible from the totals: the two carbons that leave on a turn come from the oxaloacetate rather than from the acetyl group just delivered, step 6 **is** complex II and is the only place the cycle and the chain are the same protein, step 5 is the cycle's only substrate-level phosphorylation so almost all of the roughly 30 is earned later, and step 4 is the same assembly design as the pyruvate dehydrogenase complex and shares a subunit with it.

**The electron transport chain, complex by complex, and what each pumps. Which complexes pump was there and how much was not**, and how much is what the act's economy is made of. 4 protons at complex I per 2 electrons, 0 at complex II, 4 appearing in the intermembrane space at complex III through the Q cycle, 2 pumped at complex IV with 2 more consumed from the matrix in making water. **Totals of 10 per NADH and 6 per FADH2, and the difference of 4 is complex I, which is the whole of the difference between the two shuttles.**

**Complex IV produced the finding this stage did not go looking for.** Four protons per O2 leave the matrix pool into water rather than crossing back, and ATP synthase consumes one per ATP. **So a conserved proton total falls on the first tick unless water has a pool**, which is V10's carbon dioxide problem with a different atom: carbon stayed conserved through decarboxylation because `co2` is a real pool with the carbon still in it. `h2o_mtx` is that pool for protons. Reserved below and handed to stage 2 with the weight table.

**ATP synthase and protons per ATP. Absent, now a section, and it is the least settled stoichiometry in aerobic respiration.** Three ATP per revolution and the protons per revolution are the c-ring subunit count, so protons per ATP is c over 3 and **c is not universal**: 8 in bovine mitochondria giving 2.7, 10 in yeast giving 3.3, 10 to 15 in bacteria and chloroplasts. There is no reason for it to be an integer and it is not one. Add roughly one further proton for export through the adenine nucleotide translocase and the phosphate carrier and the usual figure is about 4 per cytosolic ATP. **That is where 2.5 comes from: 10 over 4. It is a rounded consequence of two uncertain quantities rather than a measured constant.**

**Both shuttles and why their yields differ. Yields were there, mechanism was not.** Malate-aspartate in full, four transport events and two transaminations, netting one cytosolic NADH into one matrix NADH, entering at complex I at 10 protons. Glycerol phosphate in full, two dehydrogenases with the second FAD-linked on the outer face of the inner membrane, dropping electrons straight into the quinone pool downstream of complex I, 6 protons.

Also added: the gradient has two components and **the membrane potential at roughly 150 to 180 mV is the larger one**, against a pH difference of roughly 0.5 to 1 unit. Recorded because stage 2 has to draw a gradient, and a picture showing only how many protons sit on each side is showing the smaller half of the quantity.

Sixteen source entries added under a new "Act 3 pathway detail, Part 4" block, with a verification-status paragraph in the same shape as the 2026-07-28 and 2026-08-06 passes. Two entries have unverified fields and say so. **No number in the pass came from a game requirement**, and the proton counts, c-ring values and yield band were all written before any act 3 constant existed, which is the ordering hard rule 1 depends on and the reason this stage came first.

### The yield range, and the five reasons

Step 3 warned that a single number here would be a problem. **It was not a single number**: the document already said roughly 30 to 32 with published estimates from about 29 to 32. So the work was consolidation rather than correction, and what was missing is that the reasons were scattered across three sections and one of them was absent.

**The band is 29 to 32, with 30 and 32 the two figures the shuttle picks between**, against an obsolete and still-circulating 36 to 38. The new subsection "The range, and the five reasons for it" is the content stage 6 renders:

```
  1  shuttle choice                worth exactly 2. The only one the player
                                   controls, and the reason the beat can be
                                   interactive rather than stated
  2  ATP synthase c-ring           not an integer, not universal. 8 in bovine,
                                   10 in yeast, 10 to 15 in bacteria. The
                                   largest single source of spread
  3  P/O ratios of 2.5 and 1.5     themselves rounded consensus, replacing the
                                   integers 3 and 2. A correction of a false
                                   precision, not a new one
  4  transport costs               translocase, phosphate carrier and the
                                   pyruvate carrier all spend the gradient.
                                   Pyruvate import alone is 2 per glucose
  5  proton leak                   the membrane is not perfectly tight. In
                                   brown fat it is maximised on purpose by
                                   UCP1, which is the case proving gradient
                                   and ATP are separable
```

**Reasons 2 and 3 are disagreements about what the maximum is. Reasons 4 and 5 are the gap between that maximum and what a cell gets.** Those are two different kinds of uncertainty and a contested-science surface that flattens them into "scientists disagree" has lost the interesting half. Written into the document as such, so stage 6 inherits the distinction rather than having to find it.

The multiplier section gained one paragraph on the same theme: **the 2 is exact** and asserted to nine decimal places since V2, the roughly 30 is the band above, so the honest short form is "about fifteen times" and never a figure with a decimal point in it.

### The shuttle question: SWITCHABLE

`docs/PROGRESSION.md`'s open question, answered here as step 5 asks. Stage 7 records it in that document; this stage puts the biology that licenses it into `docs/SCIENCE.md` and the design reasoning here, which keeps hard rule 2's line intact.

**The deciding argument is that permanent is biologically wrong, and that was not one of the two arguments the stage offered.** Step 5 framed it as structural difference against uninformed choice. Both are real and neither settles it. What settles it is that **both shuttles are present in most tissues at once and the balance between them shifts rather than being set**: malate-aspartate predominates in liver, heart and kidney, glycerol phosphate in skeletal muscle and brown adipose tissue, and it is dominant in insect flight muscle precisely because that tissue runs the highest glycolytic flux in the animal kingdom. A cell does not pick one. A game that makes the choice irreversible is departing from the science rather than modelling it.

**Three arguments agree with that and one of them corrects the stage's own framing.** `docs/PROGRESSION.md` says the game has exactly one hard transition, endosymbiosis, since multicellularity was cut on 2026-07-27. **A permanent shuttle would be a second irreversible decision**, so the stage's "the game has one irreversible decision already" reads as an argument against permanence and not for it. Act 4's theme is regulation and its list item 4 is metabolic flexibility with automatic switching, so a switchable shuttle is the first instance of act 4's theme rather than a loose end. And a permanent uninformed choice is a trap, which stage 5 says in its own step 1.

**Switchable does not mean the choice is free, and the tradeoff is sourced rather than invented.** Malate-aspartate is fully reversible and every step is an equilibrium, so it moves electrons inward only while the cytosol is more reduced than the matrix, and it slows or reverses under high respiratory load. Glycerol phosphate is effectively irreversible because the second step drops the electrons onto an FAD at a potential they cannot climb back from, so it runs regardless of the matrix redox state. **The higher-yielding route is the one that fails under pressure and the lower-yielding one is the one that keeps working.** That is what the document's older shorthand of "speed against yield" was pointing at, and it is now stated as insensitivity to redox back-pressure against yield.

That reading is what makes both branches non-dominated, which is V5's rule about purchasable configurations, and it means neither is a trap even before the switch exists. **`progression.shuttleChoice` keeps its documented values and its meaning**: it names the route currently running, not the route permanently taken, and that reading was already available in the field as written.

### The permanent id list, and the collision in it

Written into `docs/SAVE_SCHEMA.md` Part 3, which is the document that owns id permanence, rather than into this log, because a list of contract surface in an ephemeral build doc is a list nobody will find in five months.

**The convention. A pool id is `species` or `species_compartment`, and no suffix means the cytosol.** Compartments are `env`, `cyt`, `ims`, `imm`, `mtx`. The unsuffixed case is a dated exception rather than a second rule: act 1's thirteen ids shipped in V4 and cannot be renamed, so `glucose`, `pyruvate`, `nad`, `atp` and the rest keep bare names forever. **`glucose_env` is the precedent this generalises** and it is the reason the convention is an underscore suffix rather than anything else. Every pool minted from V14 onward carries an explicit suffix including cytosolic ones, so the shuttle's cytosolic malate is `malate_cyt`. One sentence decodes the whole set.

**The collision, and it is the reason step 6 was worth doing before stage 4 rather than during it.** `g3p` is act 1's **glyceraldehyde-3-phosphate**, minted in V2 and shipped in the committed V4 fixture. The glycerol phosphate shuttle runs on **glycerol-3-phosphate**, a different molecule routinely abbreviated G3P in the literature. Three carbons and one phosphate each, two steps apart in the same pathway, and one of them is already permanent. **The shuttle's metabolite is `glycerol3p_cyt` and it is never `g3p` under any suffix.** Written into the document rather than left to be noticed, because the failure mode is a conservation test that passes while the economy is quietly wrong, which is the exact hazard `src/content/act1/pools.ts` already warns about for redox weights.

Thirty-one pool ids reserved across the five compartments, and twelve unlock ids plus two ladder families. Three things about the list are worth pulling out of it:

**`nad_mtx` and `nadh_mtx` are a separate pool from cytosolic `nad` and `nadh`, and that separation is not an implementation detail.** Two shuttles exist because those are two pools rather than one. Merging them would delete the reason act 3 has a choice in it.

**`h2o_mtx` is reserved for the reason found at complex IV** and `co2_mtx` is reserved with its question left open, because it is exactly the question stage 4 step 3 asks and stage 2's convention decides. The deciding rule is written down: a compartment suffix earns its place when location changes what a species can react with. Carbon dioxide crosses both membranes freely with no carrier, so the physical case is weak, **and act 4's pyruvate carboxylase is a matrix enzyme that consumes it**, so the answer may differ between act 3 and act 4. Better known before the id is minted than after.

**The two shuttle unlock ids are not the two `shuttleChoice` values.** `shuttle-malate-aspartate` records that a route was bought; `"malate-aspartate"` records which one is running. Under a switchable shuttle a player owns both ids while the field names one, and a design that conflates them cannot express that. Stated in the document because the switchable answer above makes it load-bearing.

**Nothing in the list forces a schema bump**, on Part 1's existing reasoning. The expected bump is still act 2's, and stage 3 may force an earlier one if the transition snapshot needs a slot.

**One thing the list is careful not to claim.** Part 3 gained a sentence making explicit what V10 demonstrated: **an id is permanent from the moment something ships with it and not before.** V10 stage 1 named three enzyme ids, V10 stage 4 measured that two of the three enzymes could not be sold at all, and dropping them cost nothing because no build had written one. These thirty-one are reservations. Stages 2 to 5 decide which are minted.

### Deviations

**Step 4's premise is wrong and the step was done anyway.** It says oxygen as the terminal electron acceptor "is currently implicit". It is not: the sentence "Oxygen is the terminal electron acceptor. Its only role is accepting spent electrons at the end of the chain" has been in Part 4 since the document was written. What was true is that it sat four paragraphs into another section, which for the fact the entire ordering decision turns on is the wrong place. **Promoted to its own section rather than added**, and the section says it is a promotion rather than a discovery so nobody reads it as new sourcing.

Promoting it surfaced something worth keeping. Without a terminal acceptor the chain backs up, the matrix NADH pool cannot be reoxidised, and pyruvate oxidation and the TCA cycle stop behind it **for exactly the reason glycolysis stops behind an unreoxidised cytosolic NADH pool in act 1**. It is the NAD+ wall again, one compartment inward. That symmetry is real and it is the best thing act 3 inherits from act 1.

**Step 1's row is a section, per the reasoning above.** The only other deviation.

### Verify

Stage 1's Verify line is documentary and all three clauses hold: step 2's six items are covered with citations, the yield range is established with its five reasons, and the shuttle question is answered. Because the edits touch four files that guards parse, the suite was run as well rather than assumed.

```
  npm run typecheck    exit 0
  npm test             61 files, 1011 tests, 0 failed, 21.65s
```

**1011 is unmoved from V13 and that is the result rather than the absence of one.** This stage adds no test because it adds no behaviour. What it had to not break is the four guards that parse `docs/SCIENCE.md`: `teaching.test.tsx` asserts every cited Part resolves to a real `# Part N:` heading, `provenance.test.tsx` asserts the same for every badge, `disclosure.test.tsx` quotes the required disclosure blockquote word for word, and `timeline.test.tsx` checks the Parts the timeline cites. **No Part was added, removed or renumbered and the disclosure blockquote was not touched**, which is why a 170-line expansion of Part 4 moved nothing. `divergenceTable.test.ts` passes because the placeholder is prose rather than a table cell and the three stated counts are unchanged.

Files changed: `docs/SCIENCE.md`, `docs/SAVE_SCHEMA.md`, `docs/ECONOMY.md`, `NOW.md`. No TypeScript, as the stage requires.

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

**The flat model holds, a transport reaction is a reaction, and the kernel is unchanged. Not one line of `src/sim/` was edited in this stage.**

### The decision, and the alternative priced rather than assumed

Step 1 asked for the alternative to be tested before the flat model is accepted, and for the report to name what would force real compartments if anything does. **Two things would, and act 3 needs neither.** Naming them is the useful part, because "we considered it" is worth nothing without the condition attached.

**An intensive quantity would force it.** Every pool in this kernel is an amount, which is extensive. A membrane potential in millivolts, a pH, or a concentration is intensive: it is an amount divided by a volume, and **the kernel has no volume and no place to put one.** `PoolDefinition` is an id, a label, an initial and a weight map. If act 3 had to model a real 150 to 180 mV potential, a compartment would need to be a real object with a volume and the flat model would be the wrong shape.

It does not have to. Illustration rule 9 draws the gradient as **the step between two amounts**, and docs/SCIENCE.md Part 1 already discloses that concentrations are abstracted to pools rather than modelled in a defined volume. So the departure is not new and it does not need a new mechanism, and stage 1 recorded the honest half in the document: the potential is the larger component of the protonmotive force, so a picture of how many protons sit on each side is showing the smaller half of the real quantity. **That is a disclosed simplification rather than a hole.**

**A compartment count that changes at runtime would force it.** `PoolRegistry` builds its id-to-index map once and freezes it, so the pool set cannot grow while the game runs. **Mitochondrial replication is act 3's eighth unlock and it is the one thing in the act that looked like it needed exactly that.** It does not. N identical matrices with N times the transport capacity and N times the chain capacity are, in a model with no concentrations and no diffusion, arithmetically one matrix whose crossing reactions run N times faster. So replication is a Vmax ladder on the transport and chain reactions rather than a second set of pools, and **the reason it is allowed to be is a simplification Part 1 already discloses** rather than a convenience invented here. Stage 5 builds it and can find otherwise; if it does, this is the decision that has to be reopened rather than worked around.

**Two things that looked like problems and are not.** Selective permeability needs no property, because a species crosses only if a transport reaction exists, which is a stronger and more honest statement than a permeability flag. And diffusion needs nothing, because Part 1 says spatial structure is ignored and always has.

**So what a compartment is: a convention in the pool id, a grouping the act descriptor knows, and transport reactions.** Stage 1 already set the id convention in docs/SAVE_SCHEMA.md Part 3 and this stage did not have to change it. The descriptor holds the grouping because `src/content/acts.ts` is where act-shaped knowledge lives and `src/sim/` may never learn any; the import direction is unchanged and `src/sim/` still imports nothing from `src/content/`.

### Conservation across a boundary, and the leak seen

**The kernel needed nothing.** `PoolRegistry.totalConserved` is one linear pass over a weight matrix and it has no notion of where a pool is, so two pools of the same species in two compartments carrying the same weight already conserve across a reaction that moves between them. **That is the whole technical content of the flat decision** and it is why this stage is a test rather than a change.

The fixture is new rather than an edit, and that mattered. `src/sim/__tests__/fixtures/compartmentPathway.ts`, six pools and four reactions:

```
  pump      H_in            ->  H_out          builds the gradient
  symport   S_out + H_out   ->  S_in + H_in    spends it to import S
  convert   S_in            ->  M_in
  sink      2 H_in          ->  W_in           locks two away in a product

  stuff     S_out 1   S_in 1   M_in 1
  charge    H_out 1   H_in 1   W_in 2
```

**Adding a compartment to `toyPathway.ts` would have moved the canonical hash `172f83fb`**, which is frozen since V1, asserted in `determinism.test.ts` and measured across four engines by V9 at two tick counts. Changing the thing the whole suite is calibrated against, in order to test something it does not have, is the wrong trade. A second fixture costs one file and moves nothing.

**`W_in` is the finding stage 1 handed over and it is load-bearing.** Complex IV consumes matrix protons in making water and ATP synthase consumes one per ATP, so free protons genuinely leave the two compartment pools. Without a pool holding them the conserved total falls on the first tick. `W_in` carries `charge` at a weight of 2 and `sink` takes 2 to make one, which is V10's carbon dioxide move with a different atom.

**The measurements.**

```
  correct, 5000 ticks, default configuration           passes
  correct, 200 randomized configurations, 500 ticks    worst drift 3.022e-15
  act 1 and the toy pathway, unchanged, for comparison worst drift 1.964e-13
```

**Transport conserves better than the toy pathway does**, by two orders. Not a claim about transport being safer, and worth saying so: a transport reaction is one substrate and one product at coefficient 1, so it performs fewer rounded additions per tick than `r1`'s five terms do. The tolerance argument at the top of `conservation.test.ts` is unchanged and still rests on the toy pathway's number, which is the larger one.

**And the violation, seen rather than assumed.** Three leak shapes, because they are three different mistakes a person makes: a dropped coefficient, a missing product term, and a conserved weight that does not match what went into the pool.

```
  'pump'      1 H_in in, 0.9 H_out out          drift 2.508e-1
  'symport'   H consumed, never put down        drift 7.945e-1
  'sink'      1 H into a W_in that carries 2    drift 3.660e-1
```

All three are **eight orders above the 1e-9 tolerance and fourteen above the noise floor**, which is the six-order gap the tolerance argument describes, with the leaks well clear of the top of it. The quoted failure, captured by running the real assertion against the leaked fixture:

```
  AssertionError: expected 0.7945227660791777 to be less than 1e-9
   ❯ conservation across a compartment boundary
     holds through a pump, a symport and a sink over 500 ticks
```

**One extra test that is not in the stage and should be.** A guard-the-guard: if the pump never outran the symport, `H_out` would sit at zero, nothing would ever cross against a gradient, and the conservation test would pass while covering none of what it claims. It asserts `H_out` rises above zero, that matter reached the inside, that the sink ran, and that the outside pool fell. Same posture as the existing `sawShortfall` assertion three tests above it.

**And one proving the leak is the cause.** The three leak cases would also fail if the fixture were broken some other way, so the same run at the same seed with `leak: 'none'` is asserted clean. The only difference between passing and failing is one coefficient.

### The three illustration rules

Written into DESIGN.md before any component renders them, which step 4 asks for and which is the ordering V12 stage 1 used.

**Rules 7, 8 and 9, plus a subsection each and five decisions-log rows.** All three are derived and none is drawn: rule 7 reads the descriptor's compartment grouping, rule 8 reads which reactions have substrates and products in different compartments, and rule 9 reads two pool amounts. **A compartment that gained a pool redraws itself**, in the same way a stoichiometry change moves a blob's side count in the same commit.

**Rule 7, a compartment is an enclosure.** One closed irregular outline in the existing stroke band with the member cards inside it. Containment is the whole encoding, with no tint, no boundary label and no legend, because a card inside an outline already says where it is. **Deliberately not a Card**: a Card carries the hard offset shadow, and a shadow would put the matrix visually on top of the cytosol when it is inside it.

The best thing about rule 7 is that it was already decided. **V12 settled on 2026-08-09 that the beast's Powered state is "a closed sub-outline inside a closed outline, which is a compartment and is the only topological change in the illustration set."** That was a decision about a 44px character and it is the same statement at full size, so rule 7 is the miniature grown up rather than a new idea, and the two are now required not to diverge.

**Rule 8, a membrane is a doubled outline and a crossing is a gap in it.** Two concentric strokes, derived rather than decorative because the mitochondrion has two membranes and only the inner is a barrier, and because the space between them is a real compartment holding a real pool that rule 7 then requires be drawable. **Matter does not pass through an unbroken stroke**, so a transport reaction opens the exact gap it uses and the outline becomes a readable list of what can cross. A player with only the pyruvate carrier sees one gap. An unbought crossing leaves the stroke closed rather than dashing the arrow, which keeps dashed meaning locked-affordance rather than locked-membrane.

**Rule 9, a gradient is the step between two levels, and it is the first rule that reads two pools.** Each face of the inner membrane carries a level and the reading is the step where they meet, with a hard ink rule at each level, which is illustration rule 3's own device used for rule 3's own reason.

Three properties fall out and all three are why it was taken. **At zero gradient the levels are flush and nothing has to be drawn to say the gradient is absent**, which is the state before the chain is bought. **Buying the chain opens the step and the player watches it open** while no ATP arrives, and **buying the synthase brings it down**, so the pile-up and the conversion are one visual quantity moving in two directions rather than two readouts. And unlike rule 3's redox level, which needed the electron dots because a level carries no signal at its own ends, **a step is most legible exactly when the two pools are most unequal**, which is the state the act is about.

Four treatments were rejected and the last is the interesting one. A bare number, which is what the rule exists to avoid. A colour temperature across the membrane, which fails V7's rule alone. Protons drawn in flight, which is flux where a gradient is a stock, and would collide with what movement has meant in this document since 2026-07-28. And **a single bar whose length is the difference, which reads two pools correctly and loses the fact that the two sides are two places**, and that is exactly what rules 7 and 8 had just spent their whole cost establishing.

### Accessibility, and a place the stage's framing needed adjusting

Step 5 asks the channel table to name a second channel for each new meaning that is neither motion nor colour. **Both channels are, for all three, and saying only that would be hiding something.**

V7's rule exists because colour was carrying meaning alone and colour can be lost. **Rules 7 to 9 use colour to carry nothing.** Containment is geometry, a gap in a stroke is geometry, a step between levels is geometry. All three survive greyscale, all three survive every deficiency in the Machado matrices V7 and V12 measured against, and all three survive `forced-colors`, because an outline is the one channel forced colours guarantees. **Manufacturing a second visual channel for something whose first channel is not colour would be the wrong kind of thoroughness**, so the channels named are the ones for the loss that can actually happen here:

```
  compartment      containment              a labelled group in the
                                            accessibility tree
  membrane         a gap in the inner       the crossing arrow's numeric
  crossing         stroke                   rate, already required of every
                                            arrow by the reduced-motion path
  gradient         the step between the     a hard ink rule at each level, so
                   two levels               both heights survive every fill
                                            being removed, plus two announced
                                            events
```

**Two announcements and not a live region.** A proton gradient is a number changing twenty times a second and this document has said since V7 that speech announces events and never narrates the tick. The step opening and the step first falling are the two discrete moments and they are the two beats docs/PROGRESSION.md asks to be felt. **The count is deliberate**: V12 added zero announcements to an act that had seventeen, on the argument that two announcements about one fact is the same defect as two copies of one fact in a save. These two are two different facts.

**One thing is deliberately given no second channel.** Which compartment a card is in is stated once, by containment, and the card does not also carry a compartment name in its own text. That is the "one thing said twice" rule 7 refuses.

**The deviation, and it is the same shape as stage 1's.** `accessibility.test.ts` holds the channel table as a manifest of seven rows, and each row names a marker string that must be present in `src/ui/components/`. **A row added now would fail**, because step 4 of this stage requires the rules be written before any component renders them, so there is no marker to find. The rules and their channels are in DESIGN.md in this stage and the guard rows land with the components in stage 4, where the manifest goes from seven rows to ten and its `TABLE.length` assertion moves with it. Reported rather than quietly deferred, because that assertion exists specifically so the table cannot shrink and it should not be able to lag either.

### The bundle

**Zero. Byte for byte.**

```
  application (apportioned)      90.24 kB  budget 130.00     V13: 90.24
  dependencies (apportioned)    219.19 kB  budget 230.00     V13: 219.19
  fonts                          68.86 kB  budget  72.00     V13: 68.86
  styles                         22.64 kB  budget  32.00     V13: 22.64
  total                         404.78 kB  budget 460.00     V13: 404.78
```

Step 6 asked whether the compartment and membrane treatments are derivable or drawn, because the Hand-authored art rule and the budget both apply to the second case. **All three are derivable, so no asset was drawn, so the art governance rule does not reach them and the budget does not move.** The new fixture and the new tests are test-only and never enter a production bundle. Stage 4 pays for the components.

### Verify

```
  npm run typecheck    exit 0
  npm run lint         exit 0, clean
  npm run build        exit 0, budget green on every line
  npm test             61 files, 1018 tests, 0 failed, 21.99s
```

**1018 against V13's 1011, so this stage adds 7.** Six in the new `conservation across a compartment boundary` block, of which three are the leak cases, plus the leak-is-the-cause control. `designSystem.test.ts` still passes, which is the DESIGN.md guard and the reason to check: the Colour section was not touched and the three new rules add no token.

Files changed: `DESIGN.md`, `src/sim/__tests__/conservation.test.ts`, and one new file `src/sim/__tests__/fixtures/compartmentPathway.ts`. **`src/sim/` proper is untouched**, which is the stage's own claim stated as a diff rather than as an intention.

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
