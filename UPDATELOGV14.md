charlie

# krebs, V14: Act 3, Complete
# Work on one stage at a time. Do NOT combine stages.

---

## THE DECISION IS TAKEN. ACCEPT, HARDENED. 2026-08-20

**Act 3 is next, as the design doc schedules it, and the placeholder is oxygen at saturation rather than at an arbitrary level.** Stage 1 owns the constant, its `docs/ECONOMY.md` DEPARTURE row and the constraint that row places on act 2. This log is unblocked.

The grounds are kept below rather than deleted, because a decision recorded without them is a decision that gets reopened.

Act 3's payoff is yield per glucose going from 2 to roughly 30, and that requires oxygen as the terminal electron acceptor. Act 2 is what supplies oxygen. `src/save/schema.ts` reserves `environment.oxygenLevel` and act 1 writes it as a literal `0`, with the comment saying that is not a placeholder. So act 3 built before act 2 needs a nonzero oxygen level that comes from nowhere.

Two exits were open and both were legitimate. ACCEPT was taken, in the hardened form.

**Oxygen threatens act 3's pacing and not act 3's claim.** Yield per glucose is stoichiometric. Oxygen as terminal electron acceptor sets rate, not yield, so the 2 to 30 figure traces to `docs/SCIENCE.md` and survives act 2 landing untouched. What a placeholder puts at risk is electron transport and ATP synthase Vmax tuning, which is what `docs/ECONOMY.md` exists for. There are 33 DEPARTURE rows already.

**Pinning the placeholder at saturation converts most of the rebalance into a constraint.** `docs/SIMULATION.md` Part 3 fixes the shape of the oxygen schedule and leaves its step size, its number of steps and its total duration to act 2. Act 3 declaring oxygen non-limiting at its beginning makes act 2's job "reach saturation by the boundary", which act 2 inherits rather than negotiates. That is the move V9 made with the schedule shape, one log ahead of the log that has to satisfy it. **It is not a number act 2 will move. It is a target act 2 must hit.**

**Act 3 first gives act 2 an authored destination.** V13's finding is that the act boundary does not hand over. The endosymbiosis handover is authored exactly once whichever order is chosen, and writing act 3's beginning first means act 2 is built toward a known end state rather than act 3 accepting whatever act 2 happens to produce.

**The argument against, weighed rather than missed.** The engineering review's own later amendment says unverifiable work goes first, and act 2's damage beat, whether losing something reads as a metabolic consequence or as a punishment, is the more unverifiable one. Building act 2 first does not make it verifiable. It commits the guess earlier and at higher stakes with still zero readers. Act 3's chemiosmosis beat is forced by the mechanics, so it is the one act that can be checked without a reader.

**What this costs, written here so no stage discovers it.** The act descriptor is widened by the largest act in the game rather than by the smaller one, under seven stages, a new illustration language and the compartment decision.

**And three sites currently say a zero oxygen level is a fact rather than a placeholder**: `src/save/schema.ts` line 102, `src/content/act1/save.ts` line 388 and the assertion at `src/content/__tests__/actStart.test.ts` line 123. **Act 1's zero stays a fact and nothing in this log makes that sentence less true.** Act 1 really is anaerobic. What changes is that act 3 introduces a second, nonzero value which is a placeholder, so those comments have to stop implying that no oxygen level anywhere is one.

Every later stage inherits the knowledge that act 3's rates are provisional and that act 3's yield is not.

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

1. The ordering decision is taken. ACCEPT, hardened, 2026-08-20, recorded in
   NOW.md and in the block at the top of this file. This stage owns three
   things that follow from it.

   The placeholder oxygen constant, at saturation. Not an arbitrary nonzero
   level. Act 3's subject is chemiosmosis and not oxygen availability, so
   oxygen is a substrate that is present and not limiting, and the level is
   whatever makes the terminal reaction's saturation term effectively 1.

   Its docs/ECONOMY.md row, which says in plain words that the number stands in
   for a schedule act 2 has not built, and which states the constraint the
   other way round too: act 2's oxygen schedule must reach saturation by the
   act 2 to act 3 boundary, or act 3 is rebalanced.

   And the same constraint written into docs/SIMULATION.md Part 3, beside the
   schedule shape V9 put there, for V9's reason: a constraint written by the
   log that has to satisfy it is not a constraint. Part 3 already says step
   size, step count and total duration are act 2's balance decisions and this
   does not touch any of them. It fixes only where the schedule ends up.

   A number that is knowingly wrong and labelled as such is fine. A number that
   is knowingly wrong and looks like the others is not, and the divergence
   table exists for exactly this.

   Say in the report which of act 3's numbers this makes provisional and which
   it does not. Yield per glucose is stoichiometric and is not provisional.
   Rates are.

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
range is established with its reasons, the shuttle question is answered, the
saturation placeholder has a docs/ECONOMY.md row, and docs/SIMULATION.md Part 3
carries the act 2 terminal constraint. Report the placeholder and both halves
of its constraint, everything added to docs/SCIENCE.md, the yield range, the
shuttle answer, and the permanent id list with its compartment convention.
```

## Stage 1 Report

**The ordering decision is recorded, and the physiology turned out to be on its side rather than merely tolerating it.**

ACCEPT, hardened, 2026-08-20, by the author, on the grounds in the block at the top of this file and in NOW.md. This stage owns the placeholder, its docs/ECONOMY.md row and the constraint that row places on act 2, and all three exist.

**The saturation placeholder is not a free number and the rule that fixes it is written down.** `ACT3_OXYGEN_SATURATION` is **100 times the terminal reaction's own Km**. The saturation term is `[S] / (Km + [S])`, requiring it within one percent of 1 gives `[S] >= 99 * Km`, and 100 yields 0.9901. It is derived from a constant act 3 sets rather than chosen, so the stage that mints it does not get to pick.

**And the reason the pin is honest rather than convenient is a sourced fact that was not in the document before this stage.** Cytochrome c oxidase half-saturates in oxygen in the **sub-micromolar range**, far below ordinary intracellular oxygen, so respiration runs at essentially full rate until oxygen falls very low. **A real respiring cell in an oxygenated world really is saturated in oxygen**, and oxygen really does set when respiration is possible rather than how fast it runs. The decision block argued oxygen threatens act 3's pacing and not act 3's claim on stoichiometric grounds. The enzyme kinetics say the same thing independently, and that is a second leg the decision did not have this morning.

**Both halves of the constraint, and the second half is written where act 2 will read it.**

```
  toward act 3   the constant stands in for a schedule act 2 has not built.
                 It is replaced by a schedule value rather than retuned

  toward act 2   the oxygen schedule must reach at least this level by the
                 act 2 to act 3 boundary and hold there. A target act 2 must
                 hit, not a number act 2 may move
```

docs/SIMULATION.md Part 3 gained "Where the oxygen schedule has to end up", sitting directly under V9's "Constraint on environmental schedules" and citing V9's own reason for being there a log early. **It adds one endpoint and touches none of act 2's three balance decisions**: step size, step count and total duration are still act 2's, and a four-step schedule and a forty-step schedule both satisfy it.

**What this makes provisional is sharper than the decision block claimed, and the correction is in act 3's favour.** The block said act 3's rates are provisional. Measured against the arithmetic, they are **conditional rather than provisional**: if act 2 lands at or above the target, no act 3 rate moves at all, because a saturation term of 0.9901 is what every act 3 rate was tuned against. Only a miss triggers a rebalance, and then it takes every rate downstream of the terminal step and every unlock threshold derived from them. Not provisional: yield per glucose, the proton counts, the carrier counts and the conserved weights, all of which are stoichiometry. **The row is a contingency and not a debt.**

### The docs/ECONOMY.md row is outside the divergence table, and the guard is why

**A row written ahead of its constant is the same defect as a row left behind by a deleted one, and V5's guard cannot tell them apart.** Planted in the table and run rather than reasoned about:

```
  FAIL  the divergence table > has no row naming a constant that no longer exists
  AssertionError: expected [ 'ACT3_OXYGEN_SATURATION' ] to deeply equal []
```

That guard's own comment says such a row "is a table that describes an economy the game does not have, which is worse than a missing row because it reads as true", and it is right in both directions. So the row lives in a new section, "Rows owed by a constant that does not exist yet", carrying the full seven columns as a labelled block rather than as table cells, with the failure above quoted in place. **The id C25 is reserved and the table still says 48 rows for 48 constants that exist.** The stage that creates the constant moves the row in and updates the counts in the same edit.

This is a deviation from the stage's wording, which says the placeholder gets "a docs/ECONOMY.md row" and assumes the table. Weakening the guard to fit was the alternative and it was not taken.

### What was added to docs/SCIENCE.md

Part 4 goes from 90 lines to roughly 210. Everything below is new unless marked.

**The two membranes, and which one is the barrier.** The document called the matrix a location and never said what makes it one, which is the fact the whole compartment mechanic rests on. The outer membrane is porous up to roughly 5 kDa through voltage-dependent anion channels, so **the intermembrane space is the cytosol on the other side of a pore**. The inner membrane is the barrier. Three transporters and each one charges something: the mitochondrial pyruvate carrier imports pyruvate in **proton symport**, so getting the substrate in costs gradient; the phosphate carrier does the same for phosphate; and the adenine nucleotide translocase exchanges ATP4- out for ADP3- one for one, moving a net negative charge and spending the membrane potential. **The ATP the cell gets to spend is not the ATP that ATP synthase made, and the difference is one more proton.**

**The proton-motive force is mostly voltage, not concentration.** Roughly 150 to 180 millivolts of membrane potential against under one pH unit. A membrane holds very little charge, so pumping builds a large voltage long before it builds a large concentration difference, and the porous outer membrane could not hold a bulk difference anyway. **This is the single most important qualification on the act's central mechanic and it is written before the mechanic, on purpose.** Any model representing the gradient as an amount in a compartment is departing from it, and the departure is named for the stage that builds the pool rather than left to be discovered afterwards.

**Pyruvate oxidation, expanded from three paragraphs.** The equation, the three enzymes E1, E2 and E3, the five cofactors, and the regulation by a dedicated kinase and phosphatase that the products themselves stimulate. Two joins the stage asked for and one it did not:

```
  back to act 1   E1 decarboxylates pyruvate using thiamine pyrophosphate,
                  which is exactly what pyruvate decarboxylase does in V10's
                  ethanol branch. Same fragment, same cofactor. In act 1 it
                  leaves as acetaldehyde and becomes waste; here it never
                  leaves the complex and becomes fuel. The player already
                  bought this decarboxylation once

  back to act 2   Part 3 says anaerobes run PFOR for this step, that oxygen
                  inactivates it irreversibly and that it cannot be repaired.
                  PDH is the oxygen-stable replacement. The enzyme act 3
                  hands over is the one act 2 takes away
```

**The TCA cycle decomposed into its eight steps**, with enzyme names and per-step stoichiometry, since docs/PROGRESSION.md sells the cycle as a unit and then decomposes it and the decomposition had nowhere to read from. Four findings came out of writing it down:

Step 4's alpha-ketoglutarate dehydrogenase complex is **structurally homologous to the link reaction's complex**, same three-enzyme architecture, same five cofactors, and E3 is literally the same protein. Step 6's succinate dehydrogenase is **in the inner membrane and is also complex II**, so the cycle and the chain share an enzyme rather than handing a metabolite between them. Step 5 is the **only substrate-level phosphorylation**, so eleven of the twelve energy-carrying products of two turns are promissory, which is the act's teaching beat visible in the stoichiometry. And **the two CO2 released in a turn are not the two carbons that entered in that turn**, shown by isotope labelling since the 1940s; the mass balance is exact either way, so a model conserving carbon as a total is correct and a model claiming to track which carbon is not.

**The chain complex by complex, with the numbers.** The document said which complexes pump and never how much, and the yield range is computed from exactly those figures.

```
  complex I     4 H+ per 2 electrons
  complex II    0. Not a pump, no proton path
  complex III   4 H+ appear outside per ubiquinol, 2 pumped and 2 scalar,
                2 taken from the matrix, net charge moved 2
  complex IV    2 H+ pumped, plus 2 consumed from the matrix to make water
                --
  per NADH      10        per FADH2  6
```

**That single difference of four is the entire reason the shuttle choice is a choice**, and it is also why succinate is worth less than malate. Two things fell out that the stage did not ask for and that later stages want: **complex III has to split a two-electron carrier into a one-electron carrier**, which is what the Q cycle exists for, because cytochrome c takes one electron and NADH and ubiquinol carry two; and **complexes I and III are the main sites of endogenous superoxide production**, so act 3's payoff engine is act 2's hazard, generated by the player this time instead of by the environment.

**ATP synthase and the price of a proton.** One revolution turns three catalytic sites, so one revolution makes 3 ATP, and the proton cost of a revolution is the c-ring size. **That size is not universal**: 8 in mammals, 10 in yeast, 15 reported in a cyanobacterium. Plus about one proton for transport. **So a spendable ATP costs roughly 4 protons, about 3 for the rotor and about 1 for transport**, and 10 over 4 and 6 over 4 are where 2.5 and 1.5 come from. The two figures the yield section quotes are a proton count divided by a proton price, and both halves carry real uncertainty.

**Oxygen as the terminal electron acceptor, and the stage's premise here was wrong in a useful way.** Step 4 says the fact "is currently implicit". It is not: line 431 stated it explicitly and in bold terms. **What was missing was every number attached to it.** The section now carries the reduction equation, the arithmetic that 24 electrons per glucose means **6 O2 consumed and 6 H2O produced**, the sub-micromolar half-saturation, and the corollary that the danger in oxygen is chemistry rather than scarcity. Reported rather than quietly satisfied, because the stage asked for a sentence that already existed and the useful work was one level down.

**Both shuttles, with their mechanisms.** Malate-aspartate is four enzymes and two carriers, ending in a transamination because oxaloacetate has no carrier of its own, and it is reversible so it only imports while the cytosolic ratio exceeds the matrix ratio. Glycerol 3-phosphate crosses nothing at all: the mitochondrial isoform is an FAD enzyme facing the intermembrane space and it hands electrons straight into the quinone pool from outside. **One number is the whole difference, the entry point**, and the two confidences are separated rather than quoted together: the yield half is arithmetic on the proton counts, and the speed half rests on irreversibility and on where the shuttle is found, which is a good argument and not a rate constant.

### The yield range, decomposed into five causes

The document already gave a range, so step 3's worry did not materialise. What it did not do is say what the range is made of, and stage 6 renders this, so a spread reported as a spread would have made that stage decorative.

```
  1  the stoichiometry above it is not disputed. 4 ATP direct, 10 NADH and
     2 FADH2 per glucose is the same in every source
  2  P/O ratios are not integers. The old 36 to 38 assumed 3 and 2
  3  the denominator is itself uncertain. c-ring 8 gives 3.67 rather than 4
     protons per ATP, which moves a glucose from 32 to about 34
  4  shuttle choice moves it by 2. 32 against 30
  5  leak and slip put real cells below every figure above
```

**The load-bearing sentence for stage 6 is that the disagreement is not about how many reduced carriers a glucose makes. It is about what a reduced carrier is worth.** Nothing disputes the carrier counts. That distinction is what makes this a contested beat that can be rendered rather than a vague one, and Part 7's known unknown 2 was rewritten to carry it.

The honest statement, unchanged in substance: about 30 to 32 by modern accounting, about 29 to 32 across published estimates, roughly 30 if one figure is needed, 36 to 38 in older sources for a reason worth telling. **The uncertainty is four modelling assumptions and not measurement noise**, three of which the player can be shown and one of which the player gets to make.

### The shuttle question, answered

**Switchable, and both shuttles are ownable.** Recorded in docs/PROGRESSION.md act 3 item 6 with the reasoning, and the open question at the foot of that file is struck through rather than deleted.

Three reasons and the third decides it. **A permanent choice would be a second one-way door**, standing a few unlocks from the real one, and this game has exactly one hard transition by structural decision. **Permanent is the departure and switchable is the biology**: real cells run both, in tissue-specific proportions that shift with cytosolic redox state, and malate-aspartate is reversible by construction. **And act 1 already taught the player what a choice in this game is.** Lactate and ethanol are both buyable, both run at once, and V10 measured that running both changes nothing except what the cell is left holding. A fork here would mean the game's second real choice contradicts the shape of its first.

Costs recorded rather than glossed: the tradeoff becomes continuous, so the yield difference has to be legible while both run or the choice reads as free.

### The id registry, and the convention that is the binding part

In docs/SAVE_SCHEMA.md Part 3, which is the file that owns id permanence, under a new rule stated first: **an id becomes permanent when a build ships with it, not when a document writes it down.** V10 named three enzyme ids that measurement deleted, and nothing was owed to them because no build carried them. So the list is a proposal and the convention is the contract.

**Pool ids end in a suffix naming where the pool is. No suffix means the cytosol.**

```
  (none)     the cytosol. Every act 1 pool id, unchanged
  _env       the environment. glucose_env, since V2
  _matrix    the mitochondrial matrix
  _ims       the intermembrane space
  _membrane  in the inner membrane, for the quinone pool
```

**This renames nothing and needs no migration.** Act 1's ids already had a location and it was already the cytosol; `glucose_env` already used a suffix for exactly this. What is new is that the absence of a suffix is now a statement, which is a thing a guard can check.

Three boundaries of the convention, each a fact about the cell rather than a convenience. **Carbon dioxide gets no suffix** because it crosses membranes by simple diffusion, so the existing `co2` pool serves the matrix too. **`_ims` is used only where the gradient makes the distinction real**, since the outer membrane's pores make the intermembrane space continuous with the cytosol for everything else. **`_membrane` is the inner membrane and there is no other**, and it exists because the chain is sold complex by complex and the complexes hand off through the quinone pool.

Pools named: eighteen matrix, five membrane and intermembrane, one cytosolic. Unlocks named: fourteen, including `complex-1` to `complex-4`. **The complexes are Arabic where the biology is Roman**, because `complex-i` and `complex-ii` differ by one character in a string a reader skims and a migration matches exactly, and the cost of the mismatch is one sentence of player-facing text.

**`complex-2` is succinate dehydrogenase, which is also TCA step 6**, so it is the one unlock that could belong to two purchases. Reserved either way. **And the three named TCA enzymes are exactly the shape V10 got wrong**: they are the regulated steps by the same argument Part 2 makes for glycolysis, and the same measurement that collapsed three glycolytic enzymes into one purchase has to be run before any of them is minted.

### Three findings that belong to later stages, named here so nothing discovers them

**Act 3 is the first time the game disposes of reducing power outside the model, and it breaks redox conservation unless water is a pool.** Both act 1 fermentation branches hand the electrons back to carbon, so `redox` balances. The terminal step hands them to oxygen. If oxygen and water are both outside the model, redox is destroyed on that tick and the conservation test fails on the reaction most worth testing. **`water` is in the registry for this reason and no other**, and the alternative was exempting the terminal reaction from the invariant.

**Oxygen is deliberately absent from the pool list.** `environment.oxygenLevel` already exists as a scalar that act 2's schedule writes. An `oxygen_env` pool would be a second representation of one fact, which is the defect docs/SAVE_SCHEMA.md exists to prevent, and it would make oxygen a quantity one cell can draw down, which the atmosphere is not. **It cannot be both** and the stage that builds the terminal reaction chooses.

**`progression.transitionTaken` is a boolean and the transition has three states**: not yet chosen, kept, digested. docs/PROGRESSION.md gives the player a keep-or-digest choice where digesting is a payout and a soft lock, and a boolean cannot say which of two things happened. **`progression.shuttleChoice` has the matching problem** now that the answer is "both", being a single nullable string documented as holding one of two names. Both are version 1 fields that no build has ever written as anything but `false` and `null`, so both are still free to change shape without a migration. Recorded in docs/SAVE_SCHEMA.md beside the registry.

### Verify

`npx tsc --noEmit` clean. `npm run build` clean, total **404.78 kB against a 460 kB budget**, application 90.24 kB against 130 kB, unmoved by a documentation stage as expected. `npm test` **1011 passed across 61 files, zero failures**, including the divergence table guard whose failure is quoted above and which is green now that the row sits outside the table. Act 1 conservation drift 1.113e-13 worst, unchanged. No TypeScript was written and no tuned number moved.

Files touched: `docs/SCIENCE.md`, `docs/ECONOMY.md`, `docs/SIMULATION.md`, `docs/PROGRESSION.md`, `docs/SAVE_SCHEMA.md`. Four of the five had their "Last updated" line moved to 2026-08-20.

**Deviations from the spec, all three reported above rather than absorbed.** Step 4's premise that oxygen as terminal acceptor is implicit was wrong and the sentence already existed; the numbers did not, and those were written. Step 1's docs/ECONOMY.md row could not go in the divergence table without breaking a V5 guard, so it is a labelled section beside it with the guard's failure quoted. And the stage's claim that the placeholder makes act 3's rates provisional is sharpened to conditional, which is a correction in act 3's favour and is stated as one.

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

**The flat kernel holds, and the stage found the one thing it does not protect.**

### The decision, with the alternative considered rather than assumed away

**A compartment is nothing to the kernel.** `src/sim/pools.ts` stays a flat `Float64Array` with a frozen id-to-index map, `tick.ts` keeps iterating by index, and `totalConserved` stays one linear pass over a weight matrix. What a compartment gets is a suffix convention in pool ids, a grouping the descriptor can read, and transport reactions. **A proton crossing a membrane is a reaction and not a special case.**

The stage asked for the alternative to be tested rather than dismissed, and for the report to name what would force a real kernel compartment if anything did. **Four candidates were considered and none of them survives.**

```
  per-compartment volumes      would matter if flux were computed from
                               concentration. It is not: docs/SCIENCE.md
                               Part 1 says pools are abstracted amounts and
                               not molar concentrations in a defined volume,
                               so there is no volume anywhere to divide by

  a pool that must not mix     containment is already total. Two ids are two
                               array slots and nothing mixes them. Geography
                               in the kernel would be a way to express a
                               separation the flat model already has

  conservation per compartment the invariant that matters is over the whole
                               system, because matter crossing a boundary is
                               matter that stayed. A per-compartment total is
                               a diagnostic, computable from ids at any time,
                               and asserting it would assert transport is a
                               leak

  the membrane potential       this is the one that could have forced it, and
                               it is answered by the model rather than the
                               kernel. See rule 9 and the departure below
```

**What would force it, stated so a later act can check itself against it: a rule that is a function of a compartment rather than of a pool.** A volume, a per-compartment pH driving every rate inside it, or a capacity on a place rather than on a substance. Act 3 has none, and act 4's compartment-specific conditions are the place to re-ask.

**And the flat model is not merely adequate, it is what makes act 3 cheap.** Every pool the act adds is a slot in an array the tick loop already walks. Transport is a reaction the reaction table already runs. **Nothing in `src/sim/` changed in this stage at all**, which is the strongest form the decision could take.

### Conservation across transport, and the failure it exists to catch

`src/sim/__tests__/fixtures/toyCompartment.ts` is a synthetic two-compartment pathway in the spirit of `toyPathway.ts` beside it, clearly marked as not biology, with act 3's shape and none of its chemistry:

```
  t_import:  S_out + H_out  ->  S_in + H_in    symport, the way the real
                                               pyruvate carrier works
  t_pump:    H_in           ->  H_out          a carrier crossing a membrane
  r_use:     S_in           ->  W_in           work inside, so transport has
                                               a reason to keep running
```

Two conserved quantities, chosen so each catches a different mistake. `carbon` is carried at the same weight on both sides of the boundary, which is the entire claim a compartment makes. `proton` exists only on the two carrier pools, so the gradient the fixture builds is a difference across a fixed total rather than an amount from nowhere.

`src/sim/__tests__/compartment.test.ts` is eight tests. **Conservation holds** for the default configuration over 5000 ticks, across 200 randomized configurations, and under shortfall scaling with the carrier scarce on the pumped side, which is the path most likely to leak because it is the one place a flux is altered after it was computed. **Worst honest drift across 60 long runs is 2.316e-13**, against a 1e-9 tolerance, sitting beside the toy pathway's 1.964e-13 and act 1's 1.113e-13. One test asserts the fixture actually moves something, because a simulation in which no transport happens conserves everything trivially.

**The first planted violation is the one the flat array invites, and it fires enormously.**

```
  planted leak "pump-forgets-the-far-side": proton 60.000000 -> 0.000000,
    relative drift 1.000e+0
```

The pump decrements the near pool and never increments the far one, which in a `Float64Array` is two unrelated indices with nothing about the shape of the data saying one is the far side of the other. Every proton in the system is gone.

### The second planted violation refused the assertion, and that is the stage's real finding

**A twin-weight disagreement is not caught by conservation in the way the test first claimed, and the measurement is what said so.**

The second leak gives `S_in` a carbon weight of 2 where `S_out` carries 3, which is the mistake the new location convention invites: two ids for one substance, drifting apart in their weights. Every reaction still reads one in and one out. Nothing is unbalanced read reaction by reaction.

The test asserted a relative drift above 1e-3, on the sibling file's argument that a leak destroys an O(1) share of throughput. **It measured 6.051e-4 and would not move**, at 400 ticks or at 2000. Probed rather than retuned:

```
  t=100    lost 5.341016   S_in 5.341016
  t=400    lost 5.445547   S_in 5.445547
  t=2000   lost 5.445547   S_in 5.445547
  t=6000   lost 0.000000   S_in 0.000000    substrate exhausted
```

**The loss equals the amount standing in the mismatched pool, to every digit, because the two errors cancel through the pathway.** The crossing destroys one carbon per unit and `r_use` creates one back, since `W_in` carries the true weight and `S_in` carries the corrupted one. So the drift is bounded by a pool level rather than by flux, it does not grow with throughput, and **run to substrate exhaustion the books balance exactly with the corruption still in the table**:

```
  the same corrupted table, run to exhaustion:
    carbon 9000.000000 -> 9000.000000, undetectable
```

**So the most valuable invariant in the project has a blind spot exactly where this stage's naming convention creates a hazard.** A conservation check comparing a start total against an end total can miss a twin-weight disagreement completely, because the mismatched pool is empty at both ends of a complete run.

The test now asserts the mechanism instead of a magnitude it does not have: that the drift is six orders above tolerance, that the loss equals the standing amount to nine decimal places, and separately that it vanishes at exhaustion. **A test that had been tuned until it passed would have recorded none of that.**

### So the convention got a structural guard, which it would not otherwise have had

`src/content/__tests__/compartmentIds.test.ts`, five tests, over every registered act's pool definitions rather than over a written list.

**Two ids differing only by a location suffix are one substance, and one substance has one set of conserved weights.** The guard splits every pool id into a substance and a place, groups by substance, and fails on any disagreement. **It has real coverage the day it lands rather than waiting for act 3: `glucose` and `glucose_env` are a twin pair today**, both `{ carbon: 6, redox: 2 }`, and a test asserts the guard reached them so it cannot pass by finding nothing. The suffix list is written out rather than pattern matched, for `divergenceTable.test.ts`'s reason about allowlists, so a new compartment has to be a deliberate edit.

Two more assertions cover the parsing rather than the traversal: a planted `pyruvate` against `pyruvate_matrix` at differing weights is detected, and a substance whose name merely ends in a suffix word is not mistaken for a twin, since stripping is anchored to the underscore.

**Its sibling is V12's cross-act check.** That one holds a pool id to one meaning across acts. This one holds a substance to one meaning across places.

### The three illustration rules

In DESIGN.md, written before any component renders them, which is V12 stage 1's ordering.

**Rule 7. A compartment is a closed sub-outline, and a pool inside it is drawn inside it.** No new mark and no emblem: the drawing gains a region and the molecules in it sit inside. **The precedent was already drawn.** The Beast section settled in V12 that a closed sub-outline inside a closed outline is a compartment, that nothing else in the language has one, and that it reads with every fill removed. Rule 7 says the same topology means the same thing on the rail, so **the moment on the character and the moment on the pools are one drawing of one event.** Which compartment a pool is in comes from its id suffix, so it is derived exactly as rules 1 to 3 are derived from the weight table.

**Rule 8. A transport arrow crosses the membrane, and every other arrow does not.** Computed from the reaction: substrates and products resolve to compartments through their ids, so a crossing is a reaction whose two sides disagree about where they are. **A flag would be a second copy of a fact the ids already carry**, which is the defect `actStart.ts` exists to prevent one level up. It makes the pyruvate carrier legible for free, since import is proton symport and under rules 7 and 8 that is one arrow crossing the boundary carrying a proton the wrong way, as geometry rather than as a sentence.

**Rule 9. A gradient is a step in a rule, and it is the first rule in the system that reads two pools.** Two levels share the membrane line as a baseline and the reading is the offset. That is recorded as a structural change rather than a sixth bullet, because it breaks what the illustration code is built on: **`Blob` takes a pool and draws itself, and a gradient is not a pool.**

**Rule 9 was chosen for its null state.** At zero gradient the two levels line up and the boundary is one continuous rule, so the invisibility says the true thing. Rule 3's redox level goes blind at both ends and needs the electron dots to cover them; this one goes blind at exactly one value and that value means no gradient. **And it makes the act's beat mechanical on the surface as well as in the simulation**: a player with the chain and no synthase watches the step grow while no ATP arrives, so the picture of chemiosmosis is a line that does not join up.

### Second channels, one per rule, none of them motion or colour

```
  rule 7   containment is topology. Survives greyscale, every colour vision
           deficiency, forced-colors and a photocopy. Fast channel is the
           compartment's surface tint, carrying nothing on its own
  rule 8   position. An arrow that crosses reads as crossing when frozen,
           which is the test the Beast section applies to posture. The dash
           motion still carries rate and rule 8 adds no meaning to it
  rule 9   the step is position and is load-bearing. The higher side's fill
           is colour and is the fast channel, which is V7's division for
           redox and V12's for the beast. The figure carries the number
```

**And one departure is named now rather than discovered.** docs/SCIENCE.md Part 4 records that the real proton-motive force is mostly membrane voltage and only slightly a concentration difference, and that the intermembrane space is not a sealed room. **A step drawn between two levels is a departure and it is the act's central one.** It is taken because the model represents the gradient as an amount, and a voltage across a membrane is not something a player can be given a count of. It owes a docs/ECONOMY.md row when the pool exists, and DESIGN.md says so where the stage that writes it will look.

### Bundle

**Zero. Total 404.78 kB against a 460 kB budget, application 90.24 kB against 130 kB, identical to stage 1 to the hundredth of a kilobyte.**

All three rules are derivable, so nothing is drawn, the Hand-authored art clauses and the art guard do not apply, and no asset enters `src/ui/art/`. A compartment is one closed path, a membrane is that same path, and a gradient is two rectangles and a rule. Against V12's eleven drawn assets at 21.04 kB, **this is the one architectural decision in the log that is free**, and that was a consequence of choosing containment over an emblem rather than a goal.

### Verify

`npx tsc --noEmit` clean. `npm run build` clean, total unchanged at 404.78 kB. `npm test` **1024 passed across 63 files, zero failures**, up from stage 1's 1011 across 61: eight transport conservation tests and five id convention tests. Act 1's canonical hash and every act 1 figure unmoved, since nothing in `src/sim/` or `src/content/act1/` was touched. No tuned number moved and docs/SCIENCE.md was not edited in this stage.

Files added: `src/sim/__tests__/fixtures/toyCompartment.ts`, `src/sim/__tests__/compartment.test.ts`, `src/content/__tests__/compartmentIds.test.ts`. Files edited: `DESIGN.md`, four decisions-log rows and the rules.

**Deviation, and it is the stage's most useful output.** Step 2 says to prove conservation fails if a transport reaction leaks and to quote the failure. One planted leak does exactly that. The second does not fail the way the stage assumed, and rather than retuning the fixture until it did, the behaviour was measured, the cancellation was identified, and the gap it exposes was closed with a structural guard the stage did not ask for. **The conservation test is not sufficient for the hazard this stage's own convention creates, and that is now written down in three places rather than in nobody's head.**

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

**The bump this stage was told to predict is the bump this stage took, and it is the first one in the project's history.**

### Schema version 2, and hard rule 7 followed exactly

Step 2 said the snapshot slot "may be the bump Spine A's decision stage was told to predict. Follow hard rule 7 exactly if so." It was, and both halves of the rule had been waiting since V4.

**One bump carries two changes**, because a schema version is a step in a chain rather than a label on a change:

```
  progression.transitionTaken   boolean                      removed
  progression.endosymbiont      'kept' | 'digested' | null   added
  snapshot                      string | null                added
```

**The boolean was the wrong shape and stage 1 said so before anything depended on it.** Three states exist, not two: not offered, kept, digested. A save written after digesting was indistinguishable from one written after keeping, which is the single most load-bearing bit in the file once act 3 exists. **There is deliberately no second field saying whether the transition happened**, because `endosymbiont !== null` already says so and two copies of one fact is the defect the document warns about.

**The migration is total in a branch that is unreachable, and that is the point.** `false` maps to `null`, absent maps to `null`, and `true` maps to `'kept'`. No build ever wrote `true`, so the third branch cannot fire through the normal path. It is written because a migration that throws on an input it did not expect permanently strands whoever has that file, and there is no backend to ship them a fix. `'kept'` rather than `'digested'` for that case because keeping is the only path forward, so a save that got anywhere with the transition taken must have kept.

**The gate fired on the bump, before the fixture existed, and it said the right thing.**

```
  FAIL  hard rule 7, mechanically > has a committed fixture for every version
  CLAUDE.md hard rule 7: no committed fixture for schema version 2.
  Expected src/save/__tests__/fixtures/v2.json.
  A fixture at version N can only be captured while version N is what the code produces.
```

Eight of that file's nine tests passed at that moment, **including the one that loads the version 1 fixture through the chain**, so the first real migration in the project's history was green before its own gate was. The version 2 fixture was then generated by the recorded procedure, 1446 bytes, carrying `endosymbiont: null`, `snapshot: null` and an rng state of 4251286828 against a seed of 20260729, which is the field the fixture README says is the one most likely to be dropped.

**Two things about the generator were wrong and were found by using it.** It wrote `v1.json` as a string literal, so the first bump would have overwritten the one artifact its own twenty-line header says is never regenerated. It names the file from `SCHEMA_VERSION` now and **refuses to overwrite an existing fixture** unless forced.

**The type rename is 105 references and it is churn.** `SaveV1` and its eleven siblings became `SaveV2` across twelve files. Recorded as a cost rather than a feature: **the suffix on the CURRENT shape carries nothing `SCHEMA_VERSION` does not already carry, and it guarantees this churn on every future bump.** No historical shape type is needed, because migrations operate on `UnversionedSave`. The recommendation for the act 2 bump is to drop the suffix from the current shape and keep versioned names for historical ones only. Not taken here, because inventing a naming convention is a bigger decision than a stage already carrying a schema bump should make alone.

### The undo, built first and tested first

`src/content/transition.ts`. Pure, in `src/content/`, importing nothing from `src/ui/`. Every function takes a save and returns a save, so the whole thing is tested by value rather than by driving a runtime.

**The snapshot is the save as it stood before anything changed, serialised, attached to the save it produces.** So the undo is carried by the thing it undoes: a player who decides, closes the tab and comes back still has it, and a player who never decides never carries one. Asserted through the codec.

**Both paths get a snapshot, including the keep path, and that was a real decision.** It is tempting to snapshot only the digest path on the argument that a player who kept it got what they wanted. **A player who clicked through the text has taken the game's only irreversible step by accident, which is exactly what an undo is for.**

**What it is not, said in the file and asserted in the tests.** Not save-scumming: one decision, one snapshot, and `takeTransition` refuses a second rather than overwriting the first. Not generalisable: the restored save carries `snapshot: null`, so the undo is not itself undoable and no stack accumulates. Not a second save slot: `storage.ts`'s backup protects a failed write and this is content.

**The restore is compared by value across the whole save**, not by sampling fields, because a restore that got one pool wrong would pass a spot check. `expect(undone.save).toEqual({ ...before, snapshot: null })`.

**Three refusals, each reported rather than thrown.** A corrupt snapshot leaves the current save intact, because losing the run as well as the undo turns one bad outcome into two. A snapshot from a newer build is refused rather than migrated downward, which is `migrations.ts`'s standing rule applying to a payload rather than a file. And **a snapshot containing a snapshot is refused at the codec**, matched textually rather than by parsing, because the check is a refusal and not a read.

### The digest path takes nothing away, and one thing about it is a real departure

**The soft lock is the lesson and the text does not scold.** The cell stays exactly where it was, in the act it was in, with everything it had, plus the payout. Nothing is confiscated. **A game that also took something here would be arguing with the player about their own decision**, and docs/PROGRESSION.md is explicit that the lock teaches rather than punishes.

**The payout is bounded by the adenylate pool and the reason is conservation.** It is a content grant written straight into a pool rather than the product of a reaction, so it is the one place in the game that could manufacture adenylate. ATP is a flux against a fixed closed total, and a payout larger than the available ADP has no acceptor to phosphorylate. Asserted with a payout of 1e9 against a total of 40: adenylate is unmoved to nine decimal places and ADP never goes negative.

**It owes docs/ECONOMY.md a row when it has a number, and it has no number yet.** The figure is an argument to the function rather than a constant, so no tuned number entered `src/content/` outside a tuning file. Digesting an endosymbiont really does liberate its material, so a real cell gains from real chemistry, and the model has no pools for an endosymbiont's contents because it is not a set of pools until it is kept. That is the departure, named now.

### What is lost, and why it is not modelled as deletion

**Deleting unlock ids would destroy the record of what the player earned**, and endosymbiotic gene transfer is the act 3 mechanic that gives control back, so the game has to know what it is giving back. The loss is therefore a property of act 3's own unlock gating: the reactions the endosymbiont runs are not tunable until the matching `gene-transfer-N` rung is bought. That is act 3 content and it belongs to stage 5.

**What this stage owns is that the transition says so.** `TransitionOutcome.lost` carries the act 3 unlock ids the player cannot tune, and the kept path's text names the loss in the same breath as the gain, with the reason attached, before the player can find a control that stopped working. **Losing control silently reads as a bug. Losing it with a stated reason reads as biology.**

### The set piece

`src/ui/content/transition.ts`, in the content directory beside the other fifteen surfaces, at docs/CONTENT_STYLE.md Part 5's three-paragraph ceiling for a one-screen surface.

**The arrival does not recommend either option and neither is styled as a default**, because a set piece that has already decided is not a decision. What it gives the player is the shape of the trade in the terms the game has used all along: **one is a structure and one is a number.**

```
  heading   Something else is inside you
  keep      Leave it alone
  digest    Break it down
```

**The digest aftermath is three sentences and none of them is a verdict.** What they got, what it cost as a fact, and that it can be taken back, offered without arguing for it. "It was also the only one of those you were ever going to meet. Every cell that went on to breathe oxygen kept theirs, and this line stops here." That is what happened rather than a judgement, and hiding it would be worse than saying it plainly.

**The Contested badge finally has something to point at, and V12 authored the destination two logs early.** The arrival's third paragraph is `contested('docs/SCIENCE.md Part 6, stop 5')`, which is mitochondria-early against mitochondria-late with both sides already written. **This is the first thing in the game to use it.** Nine of the module's Sourced badges cite docs/SCIENCE.md Part 4, which stage 1 is the reason exists in usable form.

### The offline path, checked structurally rather than by sampling

Step 6 asks for confirmation that a player cannot return from eight hours to find the decision made for them. Spine A's machinery is act-keyed and gets act 3's boundary for free, and `boundary.test.ts` and `persistence.test.ts` already assert the behaviour. **What a behavioural test cannot say is that nothing else reaches the transition**, and the failure here is not a wrong number.

`src/content/__tests__/transitionOffline.test.ts`, four tests. Seven named files on the offline path and in the kernel may not import it. The list is checked to consist of files that exist, so it cannot rot into a list of nothing, which is the failure mode `accessibility.test.ts` shipped with for nine logs. And **the whole tree is walked from the other direction**: exactly one non-test file in `src/` mentions `takeTransition` or `undoTransition`, which is the module itself. A stage that wires it into the interface adds a component to that list as a deliberate edit.

### What could not be reached, and the mechanism that stops it staying unreached

**Act 3 is not in the registry until stage 4, so the keep path returns `act-not-built` and cannot produce a real act 3 state.** `findAct` returns null rather than clamping, for V11's reason: a clamp succeeds, quietly, at something other than what was asked. Asserted alongside the property that matters more, that **a failed keep takes no decision at all**, since a half-taken transition where the save says the player decided and there is nowhere for them to be is the worst available outcome.

**And it is removed by a build failure rather than by memory.** The last test in `transition.test.ts` asserts `findAct(3)` is null, with a message naming what has to be written when it is not: that the keep path returns ok, that the save is act 3 at its beginning by `actStartState`, that `createdAt`, `elapsedGameMs` and the lifetime stats carry across, and that the undo restores the act 2 cell exactly. Same mechanism V11 used for the one-act registry.

**`keptSave` is written and typechecked and is `actStartState`'s third caller**, after the runtime's new-game path and the jump. A transition that built act 3's opening state by hand would be the second definition V13 exists to prevent. Three things survive the boundary and each is a decision: `meta.createdAt` and `buildId`, because this is the same run and a new `createdAt` would say the player started over; `time`, because the clock does not reset at an act boundary; and `stats`, because cumulative ATP is a lifetime figure the endgame summary reads.

### Five existing tests broke and every one of them was a test about version 1

Not collateral damage. Each named a fact that stopped being true, and each was rewritten into the property that was always the point rather than patched to the new number.

```
  migrations.test.ts   "is empty at version 1" asserted MIGRATIONS was []. Now
                       asserts the CHAIN property: one step per version from 1
                       to SCHEMA_VERSION, in order, past neither end. Stated
                       that way it never needs editing again
  migrations.test.ts   the current-version test used the v1 fixture as if it
                       were current. The two were the same object and the test
                       could not tell the difference
  migrations.test.ts   the gap branch was unreachable through the real entry
                       point at version 1 and its own comment said so. Version 2
                       is the first version a save can be BEHIND, so it is
                       reachable now and is exercised that way
  persistence.test.ts  asserted the literal `"schemaVersion": 1` in an export.
                       Reads SCHEMA_VERSION now: a version bump should not break
                       a test about readability
  buildId.test.ts      the allowlist guard caught transition.ts on its first
                       run. A legitimate new mention, added with its reason:
                       buildId is CARRIED across the act boundary and never
                       inspected, which is exactly what Part 3 allows
```

**The buildId guard finding is the one worth keeping.** It is an allowlist that has to be edited by hand, it fired on a file written twenty minutes earlier, and the rule it protects, that nothing branches on the build id, still holds over the new file.

### Verify

`npx tsc --noEmit` clean. `npm run build` clean, total **405.48 kB against 460 kB**, application 91.32 kB against 130 kB, up 0.70 kB from stage 2 for the transition module and its strings. `npm test` **1050 passed across 65 files, zero failures**, up from stage 2's 1024 across 63.

The choice works both ways, the undo restores the whole save by value, `endosymbiont` persists through the codec and through the migration chain, and an absence cannot reach the transition. Act 1's canonical hash is unmoved and no tuned number moved.

Files added: `src/content/transition.ts`, `src/content/__tests__/transition.test.ts`, `src/content/__tests__/transitionOffline.test.ts`, `src/ui/content/transition.ts`, `src/save/__tests__/fixtures/v2.json`. Files edited: the schema, the codec, the migration chain, the fixture generator, act 1's capture, five tests and `docs/SAVE_SCHEMA.md`.

**Two act 1 comments were corrected, which the decision block at the top of this file listed as inherited work.** `src/save/schema.ts` and `src/content/act1/save.ts` said a zero oxygen level is a fact and not a placeholder. **That sentence stays true and is now scoped**: act 1 really is anaerobic, and what changed is that act 3 introduces a second nonzero level which IS a placeholder carrying row C25. The assertion at `actStart.test.ts` is unchanged and gained a comment saying why it did not need to change.

**Deviation.** The stage assumes a live transition and there is no live path to one, because act 2 does not exist and act 3 is not registered until stage 4. The mechanism, the undo, the schema, the text and the offline guard are all built and tested; the set piece is not rendered by any component and the keep path cannot complete. **Both gaps are held open by a test that fails when act 3 registers**, rather than by a note.

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

**The act's headline claim is computed from the reaction table and lands inside the sourced range, and four things had to be measured out before it did.**

`src/content/act3/` is twenty-seven pools, sixteen reactions, ten conserved quantities and fifty-one tuned numbers. Act 1 has thirteen, eight, five and twenty-four.

### The yield, which is the thing the whole game is built toward

```
  malate-aspartate    31.00   glycolysis 2, cycle 2, synthase 27.00, 112 protons
  glycerol-phosphate  29.00   glycolysis 2, cycle 2, synthase 25.00, 104 protons
  sourced range       29 to 32
  multiplier          15.50x against act 1's net of 2
```

**Nothing reads a number out of a file.** `ledger.test.ts` traces one glucose through `reactions.ts` at run time, so every figure above is a consequence of coefficients that are all sourced to docs/SCIENCE.md Part 4. A change to any of them moves this number and the test says so.

**Three results fell out rather than being put in.** The chain moves **ten protons per matrix NADH and six per quinone pair**, which is Part 4's own headline, read off the complexes. Ten matrix NADH and two FADH2 per glucose, which is the part of the accounting nothing disputes. And **the shuttle spread is exactly 2**, which is the figure the document attributes to shuttle choice alone and which is not in the model anywhere: it is two cytosolic pairs missing complex I's four protons each, divided by the four protons an exported ATP costs.

**The 2 to roughly 30 claim is 2 to 31 and it is checkable.** That is the first time the game's biggest number has been anything other than a sentence in a design document.

### The chemiosmosis beat, measured

```
  after 4000 ticks
    cycle only        protons outside  11.17   cytosolic ATP  0.00
    cycle plus chain  protons outside 400.00   cytosolic ATP  0.00
    plus the synthase protons outside 355.71   cytosolic ATP 19.78
    synthase, no chain                         cytosolic ATP  0.00
```

**Buying the chain moves every proton in the cell to the wrong side of the membrane and the player gets nothing for it.** 400.00 of a total of 400, from a resting 20. That is not a number changing later, it is a thing to watch build, which is the test the stage set.

**And it costs the chain its own throughput, which is respiratory control arriving without being designed in.** With nothing to return the protons, the chain pumps until `proton_matrix` is empty and then stalls against its own product.

**One assertion in this file was wrong and the correction is the useful part.** It asserted that matrix ATP would not move when the chain was bought. It moves, from 27.11 to 34.96. **That is not the chain making ATP, which it cannot: no reaction in the chain has ATP on either side.** It is the chain regenerating NAD+ so the cycle can keep turning, and the extra is the cycle's own substrate-level phosphorylation running more often. Kept as an assertion rather than tidied away, because it is the act's misconception seen from the other side: buying electron transport really does make more ATP appear, and not by making any.

### Conservation, ten quantities, no exemptions

Worst drift **7.493e-15** across 60 randomized configurations with everything enabled, against a 1e-9 tolerance, per quantity:

```
  adenylate 8.5e-15   carbon 5.0e-15   coa 5.7e-15   cytochrome 1.6e-14
  flavin 2.9e-14   nicotinamide 3.9e-14   phosphate 5.1e-15
  proton 7.0e-15   quinone 4.3e-15   redox 1.5e-15
```

Act 1's is 1.112e-13, so act 3 is an order tighter. The first test is a property over the reaction table rather than a run, because a run hides an imbalance behind a reaction that never fires.

**Carbon dioxide is the same pool act 1 has and stage 2's convention decided it**, which the stage asked to be checked rather than assumed. `co2` carries no location suffix because it crosses membranes by simple diffusion, so PDH and the cycle write into V10's pool. One of the few places where the honest model and the cheap model agree.

### Four things the measurements overturned

**One. The redox zero point could not express act 3 and act 1's weights had to move.** Under a zero at the fully fermented state, oxidising pyruvate to carbon dioxide is oxidation below zero: acetyl-CoA would carry minus one and carbon dioxide minus five, and `PoolRegistry` rejects a negative weight, correctly. The zero is the fully oxidised state now, and **act 1's weights moved with it rather than act 3 inventing its own scale**, because a pool id is permanent contract surface and two acts sharing `glucose` share what a glucose is.

Nothing about act 1 behaves differently and that was measured, not argued: conserved weights are read by the conservation test and by nothing in the tick loop. **Exactly two assertions in the whole suite changed, and both are arithmetic totals**, 276 to 1661 and 2 to 12 per glucose. Act 1's canonical hash, every rate and every tuned number are untouched.

docs/SCIENCE.md Part 1's entry is rewritten with the old wording kept, because that entry said in as many words that the zero point was "a convention chosen because it makes the act 1 numbers small integers, not because the fully fermented state is physically privileged". **It was right about both halves and act 3 is what reached past it.**

**Two. The `proton` quantity counts free protons and not hydrogen atoms, and the property test forced it.** The first version gave ubiquinol and FADH2 two protons each for the hydrogen they carry, and `tca: proton 0 in, 2 out` fired on the first run. Counting carrier hydrogen would mean tracking a cytosolic proton pool that has nothing to do with the gradient, for a distinction no player can see. **What falls out of the decision is Part 4's own arithmetic**: ten protons reach the intermembrane space per NADH and six per FADH2.

Water lost its proton weight for the same reason and a harder one. **A dead-end pool inside a fixed total is a slow leak with a plausible-looking cause.** At proton 2 the cell pumped until the matrix was empty with 70 protons locked in water, and the whole chain stalled.

**Three. The phosphate carrier was described and not built.** The translocase sends matrix ATP out carrying three phosphates and brings ADP back carrying two, so every export strips one from the matrix and nothing returned it. Measured: `pi_matrix` drained to zero, the synthase stopped for want of substrate, and every proton ended up outside at 400.00 of 400. docs/SCIENCE.md Part 4 names the carrier and stage 1 put it there. **Described and not built is a better failure than the reverse and it is still a failure.**

It is electroneutral here and the real carrier is a proton symport, which is not a convenience: the sourced four protons per exported ATP is three for the rotor plus **one for transport**, and that one already covers both carriers. Charging a proton here as well double-counts and takes the yield from 31 to about 25, outside the sourced range.

**Four. Act 3 has act 1's bootstrap trap twice over.** The pyruvate carrier imports in symport with a proton, so with every proton starting in the matrix nothing crosses in, nothing pumps, and no proton ever reaches the outside. Measured at zero: tick 4000 with `proton_ims` still exactly 0. **A cell that starts with a perfectly flat gradient can never start one.** The repair is a resting gradient, which is also the truer statement, because a newly acquired endosymbiont is a bacterium that has been maintaining its own membrane potential all along.

The second half is ATP. Act 3 produces roughly 248 per game-second against act 1's 32, so its maintenance reaction is sized to match, and that reaction against act 1's adenylate total of 40 empties the cell before the pathway spins up. Measured at act 1's values: **tick 4000 with `atp` at 0.018 and 1586 glucose piled up inside a cell climbing out at 1e-4 per second.** That is NOW.md blocking item 1 exactly. Repaired with an adenylate total of 400 and a maintenance K of 60, which is again the truer statement: a eukaryote with a mitochondrion is a much larger cell.

**And the rates themselves were picked and had to be measured out.** Sized to look like act 1's, the cell pinned at the cytosolic NAD+ wall. **Glycolysis delivers twelve reduced carriers per glucose to the chain where act 1 delivered two and handed them straight back to pyruvate**, so a chain running at glycolysis's own rate is twelve times too slow. Every rate downstream of the payoff phase is `uptake` times the number of times that reaction runs per glucose, with headroom, so the whole table is one number and a stoichiometry.

### The settle budget, which the stage called blocking if it failed

**It does not fail, and the one place it strains is bounded and measured.**

```
  from a running cell   251 ticks, every configuration, margin 79.1 percent
  act 1's slowest       1120 ticks, margin 6.7 percent
  from cold, worst      1369 ticks, 7 of 13 configurations over 1200
```

**An absence resolves from wherever the player left off, and a saved cell is a running cell.** At 251 ticks act 3 has four times act 1's margin despite twenty-seven pools and sixteen reactions, because `observeSteady` tests the second difference and act 3's steady state is genuinely steady.

The cold case overruns by at most 169 ticks, which is 14 percent. **Every configuration settles**; none is oscillating, which is the distinction the fallback exists for. It is confined to the opening transient and **clears the moment either shuttle is bought**, at 732 to 756 ticks. Since act 3 has no fermentation, the cell is walled without a shuttle, so the first shuttle is the act's first real purchase rather than a late one.

`SETTLE_MAX_TICKS` was not raised to fit and a test asserts it is still 1200. The bound is asserted so that a later change making the transient longer fails there rather than turning a 14 percent overrun into an unbounded one.

### Act 1's ledger, scoped rather than loosened

`src/content/__tests__/ledgerScope.test.ts`, five tests. Act 1's 4 gross and 2 net traced from act 1's own table, unchanged. **Act 3's glycolysis is identical, still 4 and 2**, which is the honest framing: glycolysis did not change, what changed is where the pyruvate goes.

**The scoping is structural rather than incidental.** `act1/__tests__/stoichiometry.test.ts` was already act-scoped by construction, living in act 1's directory and calling `createAct1`. What was never checked is that no act-neutral module hardcodes the figure, so the four files every act runs through are scanned with comments stripped, and the descriptor route is asserted by name so a refactor that inlines it fails.

**One debt is enumerated rather than fixed.** Six player-facing strings across three surfaces say "2 net per glucose", all correct today, none keyed by act. The count is pinned so a seventh cannot be added silently, and keying player text by act is a surface decision that belongs to a later stage.

### The divergence table more than doubled

**Fifty-one rows, C25 to C75, all DEPARTURE.** The table goes from 48 rows at 33 and 15 to **99 rows at 84 and 15**. `src/content/act3/tuning.ts` is the fourth tuning file and is wired into `divergenceTable.test.ts`, which counts scalars and agrees: 51 and 51.

**C25 moved into the table**, which is what stage 1 said would happen. The "Rows owed by a constant that does not exist yet" section is kept rather than deleted, with the guard failure it recorded quoted in place, because the mechanism is worth having a name for.

**Three rows carry a measurement that overturned a first attempt** rather than a justification for one: C32 for the chain's capacity, C38 for the phosphate carrier, C63 for the bootstrap trap. **And what is not in the table is the point of the act**: every stoichiometric coefficient is sourced, and not one number in the fifty-one can move the yield.

`ACT3_INITIAL` sits in `pools.ts` rather than the tuning file, because its twenty-seven values are copies of constants above it and the guard would otherwise demand twenty-seven rows for values nobody can move independently. Act 1 keeps `ACT1_INITIAL` there for the same reason.

### Verify

`npx tsc --noEmit` clean. `npm run build` clean, **405.49 kB against 460 kB**, application 91.33 kB against 130 kB, up 0.01 kB from stage 3: act 3's content layer is not imported by anything the bundle reaches yet. `npm test` **1077 passed across 70 files, zero failures**, up from stage 3's 1050 across 65.

Files added: `src/content/act3/pools.ts`, `reactions.ts`, `tuning.ts`, and four test files under `act3/__tests__/`, plus `src/content/__tests__/ledgerScope.test.ts`. Files edited: `src/content/act1/pools.ts` and its pool test for the redox rescale, `docs/SCIENCE.md` Part 1, `docs/ECONOMY.md`, and `divergenceTable.test.ts`.

**Three deviations, all reported above rather than absorbed.**

**The TCA cycle ships lumped and is not decomposed into eight steps.** docs/PROGRESSION.md asks for it "initially as one unit, then decomposed", and act 1's list says the same about glycolysis while act 1 ships two lumped phases. Every intermediate of the cycle is regenerated, so the lumped form needs no intermediate pools at all. **The decomposition worth selling is the three regulated steps**, which stage 1 named and which V10's precedent says to measure before minting, and that is stage 5's work.

**Act 3 is not registered in the act registry.** `ACTS` still holds one act, so the transition's keep path still returns `act-not-built` and act 3 is not playable. Registration needs a meter, a save mapping, a boundary entry and a card table entry, and stage 5 is the first stage that cannot proceed without them. The content layer is complete and fully tested underneath.

**Act 3 is not balanced and no threshold exists.** The rates are sized by stoichiometric demand so the pathway works and the beat lands; they are not paced. docs/PROGRESSION.md gives act 3 120 to 180 minutes and stage 5 step 5 owns measuring against it. **Every number in the divergence table is honest about being a first pass**, and C75 says in as many words that how long the environment lasts is a measurement stage 5 owns.

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

_In progress (red)._

**Act 3's economy does not close, and the reason is now understood rather than suspected. 1071 of 1082 tests pass, 11 fail across 5 files.**

### What is built and green

`src/content/act3/meter.ts`, which act 3 had no equivalent of. Reads applied flux through probes resolved once at construction, exactly as act 1's does. **It counts `payoff`, `tca` and `atp_synthase` and deliberately not `ant`**, because the translocase moves ATP rather than making it and counting it would put act 3's yield near 58.

`src/content/act3/unlocks.ts`, the act's three kinds of unlock, in content rather than in `src/ui/` where act 1's ladders sit. Two enabling purchases, three finite ladders, `ACT3_CONTENT_PURCHASES` counted from the tables.

`src/content/act3/__tests__/pacing.test.ts`, the V5 stage 5 instrument: two player models, purchase times, gaps, environment drain, and a rung-by-rung check of V5's no-worse-configuration rule.

Lactate fermentation is back in act 3 and that is settled. **Act 3 could not start without it**, measured at 1 purchase of 19 and then a stall. Both shuttles hand the pair to a carrier the chain must re-oxidise, so before the chain exists nothing regenerates cytosolic NAD+. The cell arrives holding what act 1 taught it, and the shuttles become a real choice against fermentation rather than a replacement for it.

### The root cause, which took five measurements to isolate

**Every intermediate configuration between an act 1 cell and a working chain makes the cell worse, and several kill it.** Transport is one-directional, so buying it alone sends pyruvate into a matrix that cannot process it while starving the fermentation that was regenerating NAD+.

That is V5's lethal-intermediate problem and V5's answer applies: bind them. The enabling purchases are now two, `mitochondrial-import` and `atp-synthase`, and the chemiosmosis beat survives intact because the split is exactly chain against synthase.

**Four separate drains were found and three are fixed:**

```
  phosphate carrier   one-directional with no return path. Pumped the whole
                      cytosolic phosphate pool into the matrix, payoff lost
                      its phosphate, glycolysis stopped. 0.05 gross ATP per
                      game-second against a baseline of 25.38
                      FIXED: folded into `ant` as one exchange, which is what
                      the sourced four-protons-per-ATP figure already bundles

  chain pumps dry     with no synthase the chain moved every proton out and
                      stopped at proton_matrix 0.00, taking the cell with it
                      FIXED: `proton_leak`, which docs/SCIENCE.md Part 4
                      already records as a substantial fraction of resting
                      respiration and as one of the five reasons a real cell
                      never reaches the theoretical yield

  transport symport   coupling substrate import to the gradient is circular:
                      a cell with no gradient cannot import, so cannot pump,
                      so never gets one. A stocked resting gradient drained in
                      about three game-seconds once the leak existed
                      FIXED: transport is electroneutral and disclosed

  import still walls  NOT FIXED. See below
```

### What is still failing, with the numbers

```
  5 files, 11 tests

  act3/conservation.test.ts   2 fail. The reaction count moved from 16 to 15
                              and the proton assertion names pyruvate_transport,
                              which no longer touches a proton
  act3/chemiosmosis.test.ts   1 fail. Its configuration lists pi_transport,
                              which no longer exists, and its pile-up assertion
                              reads 1.27e-35 protons outside
  act3/steady.test.ts         2 fail. Worst settle 30315 ticks against a budget
                              of 1200. Was 251 before stage 5
  act3/pacing.test.ts         4 fail. 1 purchase of 14 reached. Rung 1 measures
                              1.5033 against rung 0's 1.5482, so the
                              mitochondrial ladder violates V5's rule
  divergenceTable.test.ts     2 fail. The document states 51 rows for
                              act3/tuning.ts and the file now holds 87 scalars
```

**The one that matters is the pacing stall and it is the same wall in a new place.** With the import purchase enabled the cytosol still reaches `nad` 0.00. The malate-aspartate shuttle is inside that purchase and should be regenerating it, so either the shuttle is not running or something upstream stopped first. **That is the next thing to measure and it has not been measured.**

### Next steps, concretely

1. **Probe the post-import state printing `nadh` alongside `nad`.** Every diagnosis so far printed `nad` only, and `nad` 0.00 with `nadh` unprinted cannot distinguish a walled carrier from a stopped cell. The nicotinamide total is fixed at 30, so the two numbers together say which.
2. If the shuttle is running and the cell is still walled, the wall is ATP rather than NAD+: check `atp` against `prep`'s Hill K of 4 before assuming a carrier problem. Three of the five failures so far were ATP starvation wearing a different mask.
3. Re-derive `ACT3_UNLOCK_ATP_THRESHOLDS` from the harness once the cell runs, by the V5 loop: pick the target time, instrument, read cumulative gross ATP at that moment. Every threshold in the file today was written before the cell worked and none of them is derived.
4. Re-tune `ACT3_MITOCHONDRIA_MAINTENANCE` so every rung is strictly an improvement. Rung 1 currently loses 0.045 gross ATP per game-second against rung 0.
5. Repair the three stale test references, which are mechanical: the reaction count, `pi_transport` in two configuration lists, and the proton assertion's reaction list.
6. Re-run the settle sweep. **30315 ticks against a budget of 1200 is not a tuning problem**, it is a cell that never reaches steady state, and it will resolve or not resolve with the pacing stall rather than separately.
7. Regenerate the act 3 divergence rows for the 87 scalars the file now holds and restate the per-file count. The generator is committed at `scripts/economyRowsAct3.py`, it reads the tuning file directly, and it writes `scratch_rows.md` for pasting into the table, so it does not need rewriting.

### What is not yet started in this stage

Gene transfer has a ladder and constants and **no player-facing text**, which step 2 asks for specifically and calls the most conceptually interesting unlock in the game. Act 3 is still not registered in the act registry. Neither has been attempted.

**Stage 4's green numbers are unaffected.** The ledger still computes 31 and 29 against a sourced range of 29 to 32, conservation still holds across ten quantities, and act 1 is untouched.

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
