charlie

# krebs, V17: Act 4, Complete
# Work on one stage at a time. Do NOT combine stages.

---

## Context

Read `NOW.md` first, then `docs/PROGRESSION.md` act 4 and its "Structural decision" section, then `docs/SIMULATION.md` Part 5 on determinism.

**Act 4 has no transition to lean on and `docs/PROGRESSION.md` flagged that as a risk on the day it was written.** "With a single reset, act 4 has to carry its own pacing without a transition beat to lean on. If act 4 drags, the fix is cutting act 4 content, not adding a second reset." The design doc puts a second hard transition in NOT in scope for the same reason. **So this log has a licence to cut and it should use it rather than padding.**

**The teaching beat is a change of goal rather than another step.** Efficiency stops being the goal and control becomes the goal. Fat yields far more ATP per gram than glucose but mobilizes slowly, so the correct strategy depends on demand profile rather than on raw yield. The act should feel like managing a portfolio rather than climbing a ladder.

**And the win condition is not a number.** "The player runs a cell that maintains stable ATP output across a randomized substrate availability sequence without manual intervention. Metabolic homeostasis, not a number threshold."

**Two words in that sentence make this the most technically distinctive log since V8.**

**Randomized.** Hard rule 4 bans `Math.random` in simulation code and mandates the seeded PRNG, and determinism is a tested property. That has been free so far because **act 1 consumes no random numbers at all.** `NOW.md` records the consequence: a real run of any length ends with `rng.state` exactly equal to `rng.seed`, so the committed version 1 fixture had to draw seven values artificially to exercise the field `docs/SAVE_SCHEMA.md` Part 5 calls the one most likely to be dropped, and `reloadDeterminism.test.ts` drives a scripted PRNG consumer for the same reason. **Act 4 is the first act where any of that is real rather than simulated by a test.**

**Without manual intervention.** The player configures a policy and then does not touch it. That is a different verb from every other act, where the player buys things. The last thing they buy is a decision about how the cell decides.

**Act 4 also needs a kinetic form the engine does not have.** Feedback inhibition and allosteric control are not Michaelis-Menten and not Hill activation. `src/sim/reactions.ts` has two forms and this act needs a third, under hard rule 5, built from multiplication because `Math.pow`, `Math.exp` and `Math.log` are banned.

## Decisions

- **Two threads run in parallel and they should be purchasable in either order.** `docs/PROGRESSION.md` gives substrate breadth four unlocks and regulation four, and says the threads run in parallel. A player who buys all of one and then the other should reach the same place as one who alternates, and any ordering that kills the cell must not ship, which is V5's rule applied to a wider space than it has faced before.
- **Gluconeogenesis is separate reactions rather than glycolysis run backwards.** A real cell does not reverse the three irreversible steps, it bypasses them with different enzymes at an ATP cost, and that is also the simpler thing to build: the engine's reactions have a direction and adding reversibility to the kernel to model a thing cells do not do would be wrong twice.
- **Nitrogen becomes a conserved quantity.** Amino acid catabolism introduces nitrogen as a waste product requiring disposal, and this project's answer to a new element is always a pool and a conserved total: carbon got one in V10 when the ethanol branch released CO2, protons got one in V14. **Six conserved quantities in act 4, and the property test is the same property test.**
- **The randomized sequence is seeded, reproducible and part of the save.** The PRNG state is already persisted and `reloadDeterminism.test.ts` already proves a dropped `rng.state` fails. This act is where that proof stops being hypothetical.
- **The win condition is measured by the simulation rather than claimed by a screen.** Stable ATP output across the sequence, without intervention, is a property the engine can assert. It should be a test before it is a screen, in the same spirit as every other claim this project makes.
- **Cut before padding.** `docs/PROGRESSION.md` says so explicitly and it is the only act with that instruction attached. If the act drags at eight unlocks, ship six.
- **The beast at act 4, and the last stop on the timeline.** The design doc's platonic ideal ends with the cell standing at the top of the column with a mitochondrion visible inside it. That is act 4's picture and V12 built the machinery for it.
- Large content log, a new kinetic form, and the first act where the PRNG matters: seven stages.

---

# Stage 1 — The biology, and the documents

```
A documentation stage, as V10, V14 and V16 all opened with. No TypeScript.

1. Check docs/SCIENCE.md covers act 4's chemistry and write what is missing,
   with citations:
     - beta oxidation, and why fat is high yield and slow to mobilize
     - amino acid catabolism, and nitrogen disposal, and what the waste
       actually is for the organism this game models
     - gluconeogenesis, the bypass steps, and their ATP cost
     - allosteric control of PFK-1, which the existing Hill exponent in prep
       already attributes to, so this is a claim the game has been making since
       V2 and is only now building on
     - feedback inhibition as a mechanism, generally, because stage 3 needs a
       kinetic form and the form should follow the biology

2. The ATP per gram claim, carefully, because it is the act's headline. Fat
   yields far more per gram than glucose and mobilizes slowly. Both halves need
   a number and a source, and the second half is the one that makes the act a
   portfolio problem rather than a ranking.

3. Nitrogen as a conserved quantity. Establish what carries it, what the waste
   product is, and whether it leaves the cell or accumulates. Carbon leaves as
   CO2 into a pool in V10, so there is a precedent and it should be followed
   rather than reinvented.

4. Metabolic homeostasis, as biology. The win condition is stable output across
   varying supply without intervention, and that is a real thing cells do with
   real mechanisms. docs/SCIENCE.md should say what those are, because the
   alternative is that the game's win condition is a game design idea wearing a
   biology label.

5. docs/PROGRESSION.md's remaining open question: is act 4 self-sustaining
   without a transition beat, or does it need cutting? This stage cannot answer
   it, stage 6 measures it, and stage 7 records it. Note here what would count
   as an answer, so stage 6 is measuring against something chosen in advance
   rather than something chosen afterwards.

6. Name every pool, unlock and conserved quantity id permanently.

Verify: docs/SCIENCE.md covers step 1 with citations, the ATP per gram claim
has both halves sourced, and nitrogen's disposal is established. Report what
was added, the homeostasis mechanisms, the answer criteria for step 5, and the
permanent id list.
```

## Stage 1 Report

_Pending._

---

# Stage 2 — The PRNG stops being theoretical

```
Act 4 is the first act to consume random numbers. Everything about that has
been built and tested and never actually used.

1. State the situation back before changing anything. Act 1 consumes no random
   numbers, so a real run of any length ends with rng.state exactly equal to
   rng.seed. The committed v1 fixture draws seven values after the run
   specifically so it can exercise a field that a real save could not.
   reloadDeterminism.test.ts drives a scripted PRNG consumer for the same
   reason, and asserts the bare fact directly so nobody has to rediscover it.

   All of that was correct and all of it was a stand-in. Act 4 makes it real.

2. The substrate availability sequence, generated from the seeded PRNG.
   mulberry32, state persisted, no Math.random anywhere, and the ESLint guard
   already covers src/sim/ and src/content/.

   Design it as a sequence rather than as per-tick noise. A cell that faces a
   different substrate mix every tick is facing noise, and a cell that faces
   a mix that changes on a schedule it cannot predict is facing an environment.
   The second one is the win condition's subject.

3. Determinism across reload, and this is the stage's real deliverable.
   reloadDeterminism.test.ts is a 36-case sweep on hash equality, four seeds by
   three lengths by three split points. Extend it to act 4, where the PRNG is
   genuinely advancing, and confirm both mutilations Part 5 warns about still
   fail: dropping rng.state and dropping tickCount.

   Those two are kept as permanent divergence tests and they have never been
   run against a consumer that was not scripted. Now they can be.

4. The offline path, against a sequence. This is the interesting one. The jump
   extrapolates rates between events, and a substrate change is an event that
   is not a pool crossing zero, which is the same shape as the act boundary
   problem Spine A solved by stopping the jump.

   Decide, consistently with that precedent. A substrate change is scheduled
   state rather than a threshold, so it may be locatable in closed form in a
   way an act boundary is not. Whichever way, report the settle ticks against
   SETTLE_MAX_TICKS and event counts against EVENT_BUDGET, and remember act 2
   already pushed both.

5. A new fixture, captured while act 4 is live, if the schema moves. And note
   the thing that makes this fixture different from every other one: it is the
   first that will have a genuinely advanced rng.state from real play rather
   than from a scripted draw.

Verify: the sequence is seeded and reproducible, the reload sweep is green
across act 4, and both mutilations still fail. Report the sequence design, the
sweep results, the offline decision with its figures, and the fixture if one
was captured.
```

## Stage 2 Report

_Pending._

---

# Stage 3 — A third kinetic form

```
Feedback inhibition. src/sim/reactions.ts has Michaelis-Menten and Hill and
this act needs one more.

1. The form, chosen from stage 1's biology rather than from convenience.
   Allosteric inhibition is not a Michaelis-Menten with a smaller Vmax and it
   is not Hill activation with a negative exponent. Establish what it actually
   is and build that.

2. Hard rule 5, absolutely. No Math.pow, no Math.exp, no Math.log. The existing
   Hill implementation uses integer exponents by repeated multiplication for
   exactly this reason and the ESLint guard enforces it across src/sim/ and
   src/content/. Whatever form is chosen has to be expressible in multiply,
   divide, add and subtract, all exactly specified under IEEE754.

   If the biologically correct form cannot be, say so and say what the
   approximation is, with a divergence row, because that is a departure and
   docs/PILLARS.md rule 5 requires departures to be recorded.

3. Cross-engine determinism. V9 measured the canonical hashes across Chromium,
   Firefox and WebKit and froze them as assertions. A new kinetic form is
   exactly the change that would break one engine and not another, and it is
   the first new arithmetic in the kernel since V1. Run the cross-engine check
   as part of this stage rather than waiting for CI to find it.

4. Test it as a property, the way the existing forms are tested. Monotonicity,
   behaviour at zero inhibitor, behaviour at saturating inhibitor, and the
   boundary cases. src/sim/__tests__/kinetics.test.ts is the pattern.

5. PFK-1 first, because the game already claims it. prep carries a Hill
   exponent attributed to PFK-1 since V2 and docs/PROGRESSION.md act 4's first
   regulation unlock is allosteric control of PFK-1. **The game has been
   pointing at this since the second log** and this is where the claim becomes
   a mechanic.

6. Conservation and the hash. A kinetic form changes rates and never matter, so
   conservation must be untouched, and every canonical hash moves because the
   flux computation changed. Record with reasons.

Verify: the form is implemented within hard rule 5, tested as a property,
agrees across all four engines, and conservation is unaffected. Report the
form with its biological justification, any approximation with its divergence
row, the four engine hashes, and the kinetics test results.
```

## Stage 3 Report

_Pending._

---

# Stage 4 — Substrate breadth

```
The first thread. Four unlocks, and fat is the interesting one.

1. Beta oxidation. High yield per gram, slow to mobilize, and both halves have
   to be felt rather than stated. A player who buys it and sees a bigger number
   has learned the wrong thing; a player who buys it and finds it is slow to
   start and enormous once running has learned the right one.

   The mobilization delay is the mechanic and it should come from kinetics
   rather than from a timer. This engine has saturating kinetics and a slow
   substrate is one with its own constants, not one with a countdown attached.

2. Amino acid catabolism, and nitrogen. A sixth conserved quantity, a waste
   product, and disposal. Conservation across all six, same tolerance, same
   property test.

   Disposal that costs something is the point. A substrate that yields ATP and
   also produces something you have to deal with is the first substrate in the
   game with a downside, and it is the clearest statement the act makes that
   yield is not the only axis.

3. Gluconeogenesis. Separate bypass reactions at an ATP cost, not glycolysis in
   reverse. Running the pathway backwards costs energy and the player is
   choosing to spend ATP to make glucose, which is only ever correct in a
   particular situation.

   That situation has to exist in the game or the unlock is decoration. Say
   what it is and measure that it arises.

4. Substrate switching under varying supply, which is where this thread meets
   stage 2's sequence. The player can now respond to what is available.
   Manually, at this stage. Automatically is the regulation thread's job and
   the win condition.

5. Conservation, yield and the trap, across every configuration. The
   configuration count is now the largest in the game by a wide margin because
   two threads multiply rather than add. Report the count and say how it was
   covered, because enumerating every combination may not be feasible and a
   property over the space is better than a sample of it.

Verify: all four unlocks work, conservation holds across six quantities, and
no configuration kills the cell. Report the mobilization measurement for beta
oxidation, the nitrogen disposal cost, the situation in which gluconeogenesis
is correct with evidence that it arises, and the configuration coverage
approach.
```

## Stage 4 Report

_Pending._

---

# Stage 5 — Regulation

```
The second thread, and the one that changes the verb.

1. Allosteric control of PFK-1, using stage 3's form. The claim the game has
   carried since V2 becomes a mechanic the player operates.

2. Feedback inhibition across pathways. A product inhibiting an upstream step
   is the cell regulating itself, and it is the first mechanic in the game
   where buying something makes a rate go DOWN on purpose. Make sure that reads
   as control rather than as a downgrade, which is a text problem as much as a
   mechanical one and docs/CONTENT_STYLE.md is the contract.

3. Compartment-specific conditions, which act 3 made possible by giving pools a
   location. Different conditions in the matrix and in the cytosol is a real
   thing and it is only expressible because V14 established the convention.
   Check that convention holds up under this weight, and if it does not, say
   so, because that is a finding about V14's architecture rather than about
   act 4.

4. Metabolic flexibility: automatic switching based on availability. **This is
   the unlock that ends the game's core verb.** Every act until now has been
   buy a thing, watch a rate change. This one is configure a policy and stop
   touching it.

   Design it so the player is choosing a strategy rather than setting a
   number. A slider that says how much fat to burn is a setting. A policy that
   says what to do when glucose runs low is a decision, and the difference is
   whether the player has to understand the cell to choose well.

5. The two threads together, in both orders and interleaved. Report that no
   ordering produces a configuration that kills the cell, and if enumeration is
   infeasible then a property that covers the space, as in stage 4.

Verify: all four unlocks work, feedback inhibition reads as control, the
compartment convention holds, and no thread ordering kills the cell. Report
the PFK-1 mechanic, the policy design from step 4 with why it is a decision
rather than a setting, the compartment finding, and the ordering coverage.
```

## Stage 5 Report

_Pending._

---

# Stage 6 — Metabolic homeostasis

```
The win condition, and it is a test before it is a screen.

1. Assert it in the engine. A cell with the flexibility unlocks configured,
   run against stage 2's randomized substrate sequence, maintains ATP output
   inside a stated band, without intervention, for a stated duration.

   Every number in that sentence is a decision: the band, the duration, the
   sequence's harshness. Choose them, say why, and put them in
   docs/ECONOMY.md as tuned scalars with rows, because they are balance
   decisions rather than biology.

2. Prove it is winnable and prove it is not trivially winnable. A player who
   configured nothing must fail. A player who configured well must succeed. If
   there is no configuration space between those, the win condition is a
   checkbox and stage 5's policy design is what needs revisiting.

   Report both cases with numbers.

3. What the player sees. It is the end of the game's last act and it is a
   condition rather than a threshold, so it cannot be a progress bar. What
   makes it legible is that the cell is visibly riding out changes it did not
   choose, and the interface already has the vocabulary: rates, the beast, the
   timeline at its last stop.

4. Act 4's pacing, measured against the 150 to 240 minute target and against
   docs/PROGRESSION.md's warning. Two player models, purchases, gaps, time to
   the last one, as every content log has done since V5.

   **And answer the open question with stage 1's criteria.** Is act 4
   self-sustaining without a transition beat, or does it need cutting? If it
   drags, the instruction is explicit and old: cut act 4 content, do not add a
   second reset. Cutting here is following the plan rather than failing it.

5. The boundary out of act 4, into the endgame V18 builds. Spine A's machinery,
   and the end-of-content state until V18 lands, which is the same honest
   placeholder act 1 got.

Verify: the win condition is asserted in a test, is winnable and not trivially
winnable, and act 4 lands inside its target or is cut. Report the band,
duration and sequence with their rows, both cases from step 2 with numbers, the
pacing measurement, and the answer to the open question with what was cut if
anything.
```

## Stage 6 Report

_Pending._

---

# Stage 7 — Coherence, and the documents

```
Close the last content log out.

1. Full verify: everything, across all four acts. npm run typecheck, lint,
   build, test, every harness, npm run offline:validate, the headless
   playthrough extended to act 4, and the cross-engine check from V9. Report
   the test count and bundle size against V16's.

2. docs/ECONOMY.md: the new total and the split. This is the last content log
   so this is close to the final count, and it is worth reporting as such.

3. docs/SCIENCE.md untouched since stage 1. Diff as evidence.

4. Every canonical hash, with reasons. Stage 3 moved them all with the new
   kinetic form.

5. Update NOW.md:
   - Status: the game has four acts. Say it plainly, once.
   - Build state table: V17 done. The "does not" column is the endgame and
     nothing else.
   - A "What act 4 contains" section with both threads transcribed.
   - The third kinetic form, as a settled kernel fact, with its hard rule 5
     treatment and its cross-engine result.
   - Nitrogen as the sixth conserved quantity, and the list of all six, because
     docs/SIMULATION.md line 90 still names three and NOW.md has carried that
     discrepancy as an open item since V2. **This is the log that makes the
     document's wording untenable rather than merely imprecise.** Recommend the
     spec edit and say it should be deliberate rather than incidental, which is
     what that open item has always said.
   - The PRNG, now genuinely consumed, and what that changed about the fixture
     and the reload sweep.
   - The win condition, as a tested property.
   - docs/PROGRESSION.md's act 4 open question, answered, with what was cut.
   - "Next, in order": V18, the endgame. And note that it is the last one.

6. docs/PROGRESSION.md: record the act 4 answer. All of its open questions for
   the prototype are now answered except the two that need a reader, and say
   which those are.

Verify: everything green across four acts and four engines. Report the test
count, the bundle, the ECONOMY.md counts, the empty SCIENCE.md diff, every hash,
the six conserved quantities, and the NOW.md diff summary.
```

## Stage 7 Report

_Pending._

---

# After These Stages

- **The game has four acts.** `docs/PROGRESSION.md` described them on 2026-07-29 and has been ahead of the build ever since. It is not any more.
- Efficiency stopped being the goal and control became it. The last thing a player buys is a decision about how the cell decides, and the win condition is that they stop touching it and it holds.
- **The PRNG is real for the first time.** Act 1 consumed no random numbers, so the version 1 fixture had to draw seven artificially and the reload sweep had to script a consumer. Both of those were correct stand-ins for a day that has now arrived, and both mutilations Part 5 warned about were finally tested against a genuine consumer.
- A third kinetic form entered the kernel under hard rule 5, built from multiplication, and agreed across four engines. The first new arithmetic in the kernel since V1.
- Six conserved quantities, and the property test is the same property test it was when there were three. **The invariant has now survived carbon leaving the cell, protons crossing a membrane and nitrogen arriving, which is a stronger claim than any single act could make.**
- The claim about PFK-1 that `prep` has carried in a comment since V2 is a mechanic the player operates.
- What is left is the endgame, and it is the log where the game says what it simplified.
