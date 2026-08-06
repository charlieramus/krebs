charlie

# krebs, V16: Act 2, Complete
# Work on one stage at a time. Do NOT combine stages.

---

## Context

Read `NOW.md` first, especially blocking item 6. Then `docs/PROGRESSION.md` act 2, then `docs/SCIENCE.md` Part 3, then `docs/SIMULATION.md` Part 3 including the constraint V9 wrote into it.

**This is the highest-risk beat in the game and `docs/PROGRESSION.md` has said so since 2026-07-29.** It inverts the normal idle-game expectation: a new resource appears and it damages you. Oxygen rises on a fixed schedule the player did not cause and cannot stop, reactive oxygen species scale with it, ROS degrade enzymes the player has already bought, production falls, and **the player watches numbers go down for the first time.**

**Whether that reads as a metabolic consequence or as a punishment is a comprehension question and this project has never had a reader.** `NOW.md` has carried that caveat since V3 and it applies to this log with more force than to any other, because every previous act took nothing away.

**This log opens with a repair rather than with content, and the repair is not optional.**

`NOW.md` blocking item 6: the offline fallback, implemented exactly as `docs/SIMULATION.md` Part 3 specifies, credits **exactly zero ATP from every act 1 configuration at every window length** and destroys the cell. A fermenting cell that makes 114287 ATP over an hour makes 0. It has been harmless because act 1 always settles. **Act 2 breaks that in two independent ways:**

```
  EVENT_BUDGET        64
  act 1, a day away   up to 51 events already
  + a quantised oxygen schedule, every step an event
  -> budget exhaustion, which routes to the fallback

  SETTLE_MAX_TICKS    1200
  walled act 1 cell   settles at 1120, a margin of 6.7 percent
  + ROS degrading Vmax continuously, so the second-difference test
    may never pass at all
  -> settle failure, which routes to the fallback
```

**And the fallback is the path that destroys the cell.** Two roads into one known-broken place, in the act that introduces both. That is why stage 1 is a repair and why it is allowed to stop this log.

**The other thing that does not exist yet is a kernel concept.** ROS damage means per-reaction Vmax varying dynamically as hashed simulation state. Every Vmax in the game today is a constant read from a tuning file, set once at construction and changed only by a purchase. A Vmax that decays under damage and recovers under repair is state, which means it is hashed, which means it is in the save, which means determinism and the schema both have opinions. The design doc named this Unscoped on purpose so this log would inherit it rather than discover it.

**If act 3 shipped first, this log also owes it a reconciliation.** The ordering decision in `UPDATELOGV14.md` had two exits. If ACCEPT was taken, act 3 carries a placeholder oxygen constant with a DEPARTURE row, and this log is where the real schedule replaces it and act 3 is re-derived against it.

## Decisions

- **Stage 1 repairs the offline fallback and it is allowed to escalate into its own log.** V9 set the precedent for this shape: a kernel arithmetic change needs its own conservation and determinism work and a log that cannot give it a stage list should hand it on. If stage 1 finds the repair is bigger than a stage, it stops, reports, and becomes UPDATELOGV17 with act 2 moving after it. **Discovering that is a success rather than a failure of the stage.**
- **The measured alternative is already on the table and it is not obviously wrong.** Part 3 rejected full replay because "the cost is unbounded in elapsed time", and `MAX_OFFLINE_HOURS` bounds it. A full-fidelity replay of the maximum credit is **1459 milliseconds, measured**, against 22 milliseconds for a fallback that produces zero. A visible stall that is correct beats an instant answer that is not. Stage 1 does not have to take that option, but it has to say why if it does not.
- **Two damage mechanisms, not one, and that split IS the act's structure.** `docs/PROGRESSION.md` is explicit: superoxide and hydrogen peroxide inactivate cluster-dependent dehydratases and poison mononuclear iron enzymes, while molecular oxygen inactivates a different set at a rate that does not depend on superoxide or peroxide at all. Superoxide dismutase and catalase buy a visible win against the first and do nothing whatsoever against the second, **so the player discovers that some damage cannot be defended against, only routed around.** That is the actual reason obligate anaerobes are obligate.
- **The target inside act 1's own loop is GAPDH, damaged by thiol oxidation.** Glycolysis contains no iron-sulfur enzymes, which is true and misleading. GAPDH is among the most oxidant-sensitive enzymes in the cell and it is the step that produces NADH, so the crisis lands on the NAD+ wall the player spent act 1 learning to work around rather than beside it. **The act attacks the thing the player is proudest of solving.**
- **The oxygen schedule is quantised and V9 already wrote the constraint into `docs/SIMULATION.md`.** Discrete steps with a settling interval between them long enough for the detector to declare, and the schedule is state rather than a function of wall-clock time. This log implements a constraint it did not write, which is the whole point of writing it a log early.
- **Damage is reversible and repair has its own failure mode.** `docs/PROGRESSION.md` unlock 6 is iron-sulfur cluster repair with the Suf backup assembly system for when the primary Isc system is itself peroxide-inactivated. That is a repair mechanic with a failure mode rather than a flat damage reduction, and flattening it would remove the most interesting thing in the act.
- **The pentose phosphate reroute is the payoff and it is worth building.** GAPDH inactivation acts as a redox switch: shutting down glycolytic flux reroutes carbon into the oxidative pentose phosphate pathway, which makes the NADPH the glutathione and thioredoxin systems run on. **The pathway does not just break under stress, it reroutes**, and the player trades ATP yield for antioxidant capacity through a mechanism the cell actually uses.
- **The act ends when the player is aerotolerant, and they still cannot use oxygen.** That is the honest ending and it is what makes act 3 mean anything. Surviving a poison is not the same as eating it.
- Largest risk in the project, a kernel change, and a repair in front of it: seven stages.

---

# Stage 1 — Repair the offline fallback

```
A precondition, not a feature. This stage is allowed to end this log.

1. Read NOW.md blocking item 6 in full, then src/sim/jump.ts's coarseReplay,
   then fallback.test.ts, which asserts the zero deliberately so that the day
   somebody fixes it the test fails and the entry can be deleted rather than
   left stale. That day is today.

2. State the mechanism back before changing anything. prep costs 2 ATP per unit
   of flux and a one-second step asks for twenty times what a tick asks for,
   against an adenylate pool of 40. Proportional scaling saves conservation and
   nothing else: ATP goes to the floor on the first step, the preparatory phase
   can no longer pay its entry cost, and the payoff phase never runs again.
   That is act 1's own bootstrap trap, reached by the integrator rather than by
   the economy, arrived at from a healthy cell in one step.

   Part 3's own rejection of coarse replay says explicit Euler with a large
   step "produces wrong answers rather than approximate ones". The wrong answer
   is total.

3. Decide the repair, with the measured alternative on the table. Full replay
   of the maximum credit is 1459 milliseconds and correct. The fallback is 22
   milliseconds and produces zero. Options include: full replay bounded by
   MAX_OFFLINE_HOURS, a smaller coarse step chosen against the adenylate pool
   rather than picked, an adaptive step, or something else.

   Whatever is chosen, docs/SIMULATION.md Part 3 is corrected on the page the
   way V8 corrected its step 2 criterion: the wrong sentence stays with the
   correction beside it, because the wrong version is the more useful record.

4. Prove it against the case it fails today. A fermenting cell making 114287
   ATP over an hour, and a cell at the top glycolytic rung making 269820.
   Fallback output must agree with full replay within a stated tolerance rather
   than being zero. Then run the whole Part 3 validation sweep, both bands, and
   report every figure against V8's.

5. THE ESCALATION CLAUSE. If this repair turns out to need its own conservation
   and determinism work rather than fitting in a stage, STOP. Report what was
   found, why a stage cannot hold it, and hand it to its own log with act 2
   moving behind it.

   V9 set this precedent explicitly for a kernel change and it was right to.
   A repair rushed into the front of the riskiest log in the project is how the
   riskiest log acquires a second risk.

6. Do not start stage 2 until fallback.test.ts asserts something other than
   zero, or until the escalation clause has fired.

Verify: the fallback credits a correct amount for both configurations in step
4, the full sweep is green, and the blocking item can be struck. Report the
repair with its reasoning against the alternatives, the docs/SIMULATION.md
correction, every sweep figure against V8's, and either the strike-through or
the escalation.
```

## Stage 1 Report

_Pending._

---

# Stage 2 — The biology, and the two mechanisms

```
A documentation stage, as in V10 and V14, for the same reason. No TypeScript.

1. docs/SCIENCE.md Part 3 covers oxidative damage. Read it and establish
   whether it carries everything this act needs:
     - superoxide and hydrogen peroxide, their targets, and why cluster
       dependent dehydratases and mononuclear iron enzymes are the vulnerable
       classes
     - molecular oxygen as a separate mechanism with separate targets, at a
       rate independent of superoxide and peroxide levels
     - GAPDH and thiol oxidation, and why glycolysis containing no iron-sulfur
       enzymes is true and misleading
     - each defense: superoxide dismutase, catalase, Dps, glutathione and
       peroxiredoxin, Isc and Suf, manganese substitution, isozyme replacement
     - the oxidative pentose phosphate pathway, NADPH, and the redox switch

   Write what is missing, with citations. New ground truth is a legitimate
   edit; a balance number is not, and hard rule 2 bans that in every other
   stage of this log.

2. The Great Oxidation Event itself, at roughly 2.4 billion years ago, and
   whatever the timeline stop already says. V12 built seven stops sourced to
   Part 6 and the GOE stop keeps banded iron as its figure with the ~2.5 Ga
   peak labelled as the immediate pre-GOE maximum. Check the act and the stop
   agree, because they are now two statements about one event.

3. The oxygen schedule as biology before it is a mechanic. Real oxygenation was
   not monotonic and took hundreds of millions of years, and the game gives it
   90 to 150 minutes. That is a compression with a shape, and the shape is a
   modelling decision that belongs in docs/SCIENCE.md's methodology rather than
   in a tuning file comment.

4. Aerotolerance, and what it does and does not confer. The act ends when the
   player can survive oxygen and still cannot use it. That distinction is the
   entire justification for act 3 existing separately, and if docs/SCIENCE.md
   does not make it explicit then act 3's whole premise is resting on an
   implication.

5. Name every pool id, unlock id and damage-state field permanently, in one
   list, as V10 and V14 did.

6. If act 3 shipped first with a placeholder oxygen constant, name it here and
   say what the real schedule makes of it. Stage 6 does the reconciliation;
   this stage establishes what the true value should be.

Verify: docs/SCIENCE.md covers everything in step 1 with citations. Report what
was added, the timeline stop agreement check, the compression decision, the
aerotolerance statement, the permanent id list, and the placeholder assessment
if there is one.
```

## Stage 2 Report

_Pending._

---

# Stage 3 — Vmax as state

```
The kernel concept that does not exist. Read src/sim/reactions.ts,
src/sim/state.ts and src/sim/hash.ts before writing anything.

1. The change, stated precisely. Today every Vmax is a constant read from a
   tuning file at construction, changed only by a purchase through
   setReactionVmax, and NOW.md records that a purchase touches no pool, no tick
   count and no PRNG, which is exactly why V4 had to persist unlocks
   separately. A damaged Vmax is different: it varies continuously with
   simulation state, so it IS simulation state.

2. Three consequences, each of which has to be handled deliberately:

   HASHED. hash.ts is FNV-1a over the canonical state form. If Vmax is state it
   belongs in the hash, and adding it moves every canonical hash in the
   project. That is correct rather than a problem, and the assertion carries
   the reason the way V3, V5 and V10 all did.

   PERSISTED. docs/SAVE_SCHEMA.md already reserves enzymes as a record of
   { level, damage } with damage documented as act 2 ROS degradation, 0 to 1,
   and empty at version 1. The schema anticipated this. Check whether the
   reserved shape fits what stage 5 needs, and if it does then this is
   additive and needs no bump, which is the outcome the whole schema decision
   chain has been pointing at.

   DETERMINISTIC. No Math.random, no Math.pow, no Math.exp, no Math.log. Hard
   rules 4 and 5 and the ESLint guard across src/sim/ and src/content/. Damage
   accumulation and repair are rates like every other rate in this engine and
   they integrate the same way. If a decay curve is wanted, it is built from
   multiplication the way the Hill exponents already are.

3. Where it lives. Damage is a property of an enzyme, an enzyme is content, and
   the kernel does not know what a pool means. So the kernel gains the ability
   for a reaction's Vmax to be state, and content decides what moves it. Same
   arrow as everything else: content depends on src/sim/ and never the reverse.

4. The tick path, and this is the performance-sensitive part. tick.ts is
   two-phase, allocates nothing, and iterates by index and never by key. A
   per-reaction Vmax lookup that allocates or iterates keys would put a cost on
   the hottest loop in the project. Same rule the runtime learned in Spine A.

5. Test it before anything uses it, with a fabricated damage schedule rather
   than with act 2's. Conservation unaffected: damage changes rates and never
   creates or destroys matter. Determinism: same schedule, same hash, every
   time. Reload: a damaged state round-trips exactly.

6. Report every canonical hash's new value with the reason in the assertion.

Verify: Vmax can be state, it is hashed, it persists, it is deterministic, and
the tick path allocates nothing. Report the hash changes with reasons, the
schema finding from step 2, the conservation and determinism results, and a
tick-path allocation check.
```

## Stage 3 Report

_Pending._

---

# Stage 4 — Oxygen arrives

```
The schedule, and the crisis beginning. Implement the constraint V9 wrote.

1. The schedule as docs/SIMULATION.md now constrains it: discrete steps, a
   settling interval between them long enough for the detector to declare, and
   the schedule held as state rather than computed from wall-clock time.
   environment.oxygenLevel and environment.scheduleIndex have been in SaveV1
   since V4 waiting for this.

2. Prove the constraint does what it was written to do, and this is the most
   important measurement in the stage. Run the offline validation sweep across
   act 2 with the schedule live. Report settle ticks against SETTLE_MAX_TICKS
   of 1200, event counts against EVENT_BUDGET of 64, and fallback counts.

   The margin to watch: a walled act 1 cell already settles at 1120, which is
   93 percent of the budget. Act 2 has more reactions and a moving environment.
   **If act 2 does not settle inside the budget, or if the event count
   approaches 64, that is a blocking finding and it outranks everything else in
   this log.** Stage 1 repaired the destination; it did not make arriving there
   acceptable.

3. Oxygen as visible before it is dangerous. The player does not cause it and
   cannot stop it, and docs/PROGRESSION.md says the first unlock is ROS damage
   becoming visible, initially as unexplained enzyme degradation. So there is a
   window where something is wrong and the player does not know what.

   That window is a comprehension risk and it is deliberate. Say how long it
   is, and say what the player can see during it, because "unexplained" has to
   mean not yet explained rather than not signposted. A player who thinks the
   game broke will stop playing, and there has never been a reader to tell you
   which one it reads as.

4. The world visibly changes, which is E3 in the design doc, scoped inside each
   act log. The sky behind the cell shifts over the act because that is what
   happened. Not a per-act palette: the design doc rules that out because it
   would re-run the full contrast matrix. Whatever the treatment is, it goes
   through the accessibility guard like everything else.

5. The beast, with cracks in it. DESIGN.md's original settled list says cracks
   encode damage, from 2026-07-28, and nothing has ever had damage to encode.
   V12 built four states pinned to conditions through the act descriptor. Act 2
   is where the damage channel becomes real, and it must be a second channel
   rather than colour, per V7's rule.

6. The timeline, at the GOE stop, with banded iron beside the cell. V12 made
   the marker discrete and moving only at act boundaries, so this should need
   nothing but the boundary firing.

Verify: the schedule steps, the detector declares between steps, and the sweep
is green. Report settle ticks and event counts against both budgets with the
margin stated plainly, the length of the unexplained window and what is visible
during it, the world change and its contrast results, and the beast's damage
channel with its measurements.
```

## Stage 4 Report

_Pending._

---

# Stage 5 — Damage, defense, and the reroute

```
The ten unlocks, the split that is the act's structure, and the payoff.

1. Both mechanisms, separately, because the split is the act rather than a
   detail. ROS damage scales with oxygen. Molecular oxygen damage runs at a
   rate independent of superoxide and peroxide levels and hits a different set
   of targets. They are not two intensities of one thing.

2. GAPDH, by thiol oxidation, inside act 1's own loop. The crisis lands on the
   NAD+ wall the player spent act 1 learning to work around. Implemented, that
   means the payoff reaction's Vmax degrades, NADH production falls, and the
   wall the player solved comes back for a reason they did not solve.

   That is the sharpest beat in the act and it is also the one most likely to
   read as the game taking away their solution out of spite. Text matters more
   here than anywhere and docs/CONTENT_STYLE.md is the contract.

3. The defenses in order: superoxide dismutase, catalase, Dps, glutathione and
   peroxiredoxin against the first mechanism. Then iron-sulfur cluster repair
   with the Suf backup for when Isc is itself peroxide-inactivated, manganese
   substitution, and isozyme replacement against the second and against damage
   that outruns repair.

   Unlocks 2 to 5 must visibly work and unlocks 6 to 8 must visibly be needed
   anyway. **The discovery is that some damage cannot be defended against, only
   routed around**, and if the first four defenses solve the act then that
   discovery never happens.

4. Repair with a failure mode, not a damage reduction. Isc is the primary and
   peroxide inactivates it, Suf is the backup that works when Isc cannot. A
   repair system that can itself fail is the most interesting mechanic in the
   act and flattening it into a percentage would remove it.

5. The pentose phosphate reroute, which is the payoff. GAPDH inactivation acts
   as a redox switch: glycolytic flux shuts down and carbon reroutes into the
   oxidative pentose phosphate pathway, which makes NADPH, which is what the
   glutathione and thioredoxin systems run on.

   **The pathway does not break, it reroutes.** The player trades ATP yield for
   antioxidant capacity through a mechanism the cell actually uses. That
   inverts the whole act's emotional shape in one unlock and it is worth
   building properly rather than approximating.

6. Aerotolerance, and the ending. The player can survive oxygen and still
   cannot use it. Then the act boundary, using Spine A's machinery, into act 3
   if act 3 exists or into the end-of-content state if the ordering went FLIP.

7. Conservation, yield and the trap, across every configuration, as every
   content log has done. And check bootstrap.test.ts specifically: a cell whose
   payoff Vmax has been degraded by damage is a cell approaching the exact
   state V5 repaired, and if damage can drive the cell into the unrecoverable
   region then that is a defect rather than difficulty.

Verify: both mechanisms behave independently, the first four defenses do not
solve the act, repair can fail, and the reroute works. Report the damage curves
for both mechanisms, the configuration count with yield held, the
bootstrap.test.ts result against damaged configurations, and the pacing against
the 90 to 150 minute target.
```

## Stage 5 Report

_Pending._

---

# Stage 6 — Reconciliation, if act 3 came first

```
Only if UPDATELOGV14.md took the ACCEPT exit. If the order went FLIP, this
stage is a no-op and says so.

1. Find the placeholder oxygen constant and its DEPARTURE row. Replace the
   constant with what the real schedule produces at the act 2 to act 3
   boundary, and delete the row rather than editing it, because the departure
   it described has ended.

2. Re-derive act 3's balance against the real number. Every act 3 tuned scalar
   that was set against the placeholder is now set against something else, and
   docs/ECONOMY.md rows have to move with them.

3. Act 3's yield, re-asserted. The 2 to roughly 30 claim is the game's headline
   and it was made against a placeholder. Re-measure it and report the figure
   against what act 3 shipped with. **If it moved materially, the payoff
   surface V14 built is showing a number that changed**, and that surface is
   the one place in the game where a wrong number does the most damage.

4. Act 3's canonical hash moves. Record it with the reason in the assertion.

5. The contested beat, re-checked. It renders a range and the range came from
   docs/SCIENCE.md rather than from tuning, so it should be unaffected. Confirm
   rather than assume, because a beat about honesty that quietly went stale
   would be the worst possible thing in this project to get wrong.

6. Report what the placeholder cost, honestly, as a record. The ordering
   decision was taken with a stated price and this is the invoice. It is worth
   writing down whether the price was what was expected, because the next
   ordering decision will be taken by somebody reading this.

Verify: the placeholder is gone, act 3 is re-derived, and its yield is
re-asserted. Report the real value against the placeholder, every ECONOMY.md
row that moved, act 3's new hash, the payoff surface check, and the honest
accounting from step 6. If FLIP was taken, report this stage as a no-op with
one line saying why.
```

## Stage 6 Report

_Pending._

---

# Stage 7 — Coherence, and the documents

```
Close the log out.

1. Full verify: npm run typecheck, npm run lint, npm run build, npm test,
   every harness, npm run offline:validate across all acts, and the headless
   playthrough extended to act 2. Report the test count and bundle size
   against V15's.

2. docs/ECONOMY.md: the new total and the DEPARTURE to UNSOURCED split, plus
   any row stage 6 removed or moved.

3. docs/SCIENCE.md untouched since stage 2. Report the diff as evidence.

4. Every canonical hash, with reasons. Stage 3 moved all of them by making
   Vmax hashed state, and stage 6 may have moved act 3's again.

5. Update NOW.md:
   - Status: the player survived oxygen. Say what that cost them.
   - Build state table: V16 done. Its "does not" column is short now, which is
     itself worth noticing.
   - Blocking item 6, struck through with the date, and stage 1's repair
     recorded where the fallback is described. **This is the oldest defect in
     the project and closing it deserves more than a line.**
   - A "What act 2 contains" section with the pathway transcribed.
   - Vmax as state, as a settled architectural fact, with what it cost: every
     hash moved, the schema field that was already reserved, and the
     determinism work.
   - The two mechanisms and why the split is the act, because a future reader
     will be tempted to simplify it into one damage number.
   - The offline figures for act 2 against both budgets, prominently. This is
     the act that was predicted to strain them.
   - Stage 6's accounting, if there was one.
   - docs/PROGRESSION.md's open question about act 2 feeling like a crisis
     rather than an unfair spike. **It is still open. This log cannot close
     it.** Only a reader can, and that has been true of every comprehension
     claim since V3.
   - "Next, in order": V17, act 4.

6. docs/PROGRESSION.md: record what the prototype answered about act 2's shape,
   which it has listed as an open question since 2026-07-29. Answer what can be
   answered and leave what cannot.

Verify: everything green across every act. Report the test count, the bundle,
the ECONOMY.md counts, the empty SCIENCE.md diff, every hash with its reason,
and the NOW.md diff summary including the blocking item 6 strike-through.
```

## Stage 7 Report

_Pending._

---

# After These Stages

- **The oldest defect in the project is closed.** The offline fallback credited exactly zero ATP from every configuration and destroyed the cell, and it sat in the build because nothing reached it. Act 2 reached it, which is why act 2 had to repair it first.
- A Vmax can be state. Every canonical hash moved to say so, the schema field was reserved for it in V4 by somebody who saw this coming, and hard rules 4 and 5 held through a change that wanted an exponential.
- **The player watched numbers go down and the game did not apologise for it.** Oxygen was a mass extinction before it was fuel, and an idle game that takes something away is doing the unusual thing this whole project exists to do.
- Some damage cannot be defended against, only routed around. Four defenses work, and the act is not over, and that is the moment the player learns what obligate means.
- The pathway does not break under stress, it reroutes, and the player trades ATP yield for antioxidant capacity through a mechanism a real cell uses. **The best beat in the act is the one where the damage turns out to be a switch.**
- The act ends with a cell that can survive oxygen and cannot use it, which is the only ending that makes act 3 mean anything.
- **And whether any of it reads as a crisis rather than as an unfair spike is still unmeasured.** `docs/PROGRESSION.md` has asked that question since 2026-07-29, this log is the prototype it was asking for, and the standing caveat applies with more force here than anywhere: it was built by the person who chose the damage rates.
