charlie

# krebs, V18: The Endgame
# Work on one stage at a time. Do NOT combine stages.

---

## Context

Read `NOW.md` first, then `docs/PILLARS.md` in full including its success conditions, then `docs/PROGRESSION.md`'s Endgame section, then `docs/ECONOMY.md`'s divergence table.

**This is the last log and it is the one where the game says what it simplified.**

`docs/PROGRESSION.md`: "On completion: a summary of what was built, the real timeline it maps to, the full source list and an explicit statement of what the model simplified. Then a sandbox mode with all unlocks available and adjustable environmental parameters. No score chase, no ascension layer."

**Everything that surface needs already exists and none of it has ever been assembled.** `docs/SCIENCE.md` holds the ground truth and the citations. `docs/ECONOMY.md` holds thirty-seven-plus rows split between DEPARTURE and UNSOURCED, plus three structural departures that have no single row because no single number carries them. Provenance shipped in V12 with four destinations. The contested beat shipped in V14. **The endgame is composition, and if any part of it turns out to need invention then something upstream is missing and that is the finding.**

**The three structural departures are the interesting ones and they have been sitting in `docs/ECONOMY.md` since V5**: unlocks are thresholds against a lifetime ATP counter rather than subtractions, the environment is a finite unreplenished pool, and **the game refuses a death a real cell can die.** No single number carries any of them, which is exactly why they are the ones a summary has to say out loud.

**And this log closes, or fails to close, the project's own success conditions.** `docs/PILLARS.md` has three and this is the first log with standing to report on all of them. Two of them need a person who is not the author, and the third needs someone with a biochemistry background. **If those people were never found, this log says so as its headline rather than as a footnote**, because that is the failure mode this project was built to avoid and the last log is the worst possible place to start avoiding it.

## Decisions

- **The endgame surface is composition and its stage report says so.** Anything that needs writing from scratch is a gap in the documents rather than content for a screen, and the honest move is to fix the document and compose from it.
- **The simplifications section is the most important thing in the game and it goes first.** Every science game claims accuracy. A game that ends by telling you exactly what it got wrong on purpose is making a different claim, and it is the claim `docs/PILLARS.md` and `CLAUDE.md` hard rule 1 have been building toward for eighteen logs.
- **The sandbox has all unlocks and adjustable environmental parameters, and every input is validated and clamped.** A sandbox that lets a player enter a number that breaks conservation, drives a pool negative or produces a state the save cannot represent is a bug generator. The engine already has the tools: `SAFE_VALUE_CEILING` is a tripwire in `tick.ts`, the codec validates structurally, and V5 settled that a purchasable configuration that kills the cell must not ship. **A sandbox parameter is a purchasable configuration with the price removed.**
- **The sandbox is not a mode with a save.** Or if it is, that is a schema decision taken deliberately here rather than absorbed. The cleanest thing is that a sandbox session is explicitly separate from a played one and is marked as such the way V13 marked a jumped session.
- **No score chase, no ascension layer, no new-game-plus.** `docs/PILLARS.md` rule 1 says the game is finite and rule 2 rules out prestige loops and engagement mechanics. The end of the game is the end of the game.
- **The three success conditions get reported honestly, including "not met".** The count that has sat at zero readers out of zero asked since V6 either moved or it did not. A log that ends the project without saying which would be the exact failure the whole project is built to avoid.
- **The endgame does not gate the sandbox behind completion in a way that hides it from a teacher.** Someone with ten minutes should be able to reach it, and V13 and V15 built the mechanism for that already.
- Final log, mostly composition, and its hardest part is telling the truth: five stages.

---

# Stage 1 — What the model simplified

```
The honest accounting. This stage comes first because everything else in the
log composes from it.

1. Assemble the full list of simplifications from what already exists rather
   than from memory:
     - docs/ECONOMY.md's rows, split DEPARTURE and UNSOURCED, with the meaning
       of each category stated rather than assumed
     - the three structural departures that have no row, because no single
       number carries them: unlocks as thresholds against a lifetime counter
       rather than subtractions from a pool, a finite unreplenished
       environment, and a game that refuses a death a real cell can die
     - every disclosed simplification recorded in a source comment or a stage
       report across eighteen logs. src/content/act1/reactions.ts calls one out
       explicitly as a disclosed simplification rather than an omission, and
       there will be others

   If assembling this list surfaces a simplification that was never recorded
   anywhere, **that is the most valuable finding in the log** and it belongs in
   the report in its own paragraph.

2. Sort them by what a player would care about rather than by where they live
   in the codebase. A reader of this screen wants to know which of the things
   they learned are true, not which file a constant sits in.

3. The three structural ones get the most space, and the third gets the most of
   that. The game refuses a death a real cell can die. A player who has spent
   eight hours keeping a cell alive should be told that it was never actually
   going to die, and why that choice was made, because it is the largest
   departure in the game and it is invisible from inside it.

4. Write it under docs/CONTENT_STYLE.md, with a length ceiling, and every
   figure carrying a badge. This screen is the one where an unbadged number
   would be most embarrassing.

5. What this section is NOT: an apology. The divergence table's UNSOURCED rows
   have an empty real-behaviour cell and NOW.md records that the emptiness is
   the content of the row rather than a gap in it. Same tone here. These are
   choices with reasons, not confessions.

Verify: the list is complete and assembled from existing records rather than
written fresh. Report the full list with its sort order, any simplification
that was never previously recorded, the treatment of the three structural
departures, and the length against its ceiling.
```

## Stage 1 Report

_Pending._

---

# Stage 2 — The summary, and the timeline it maps to

```
What you built, and when it really happened.

1. The summary of what was built, from the player's own save. Every act, every
   pathway, every unlock they bought, and their own figures: playtime, ATP
   produced, glucose consumed, yield at act 1 against yield at act 4.

   stats has carried these since V4 and V14's payoff surface was the first
   thing to use them for anything other than unlock thresholds. This is the
   second, and it is the one they were persisted for.

2. The real timeline it maps to, which V12 built as the spine. The cell at the
   top of the column, three and a half billion years from where it started,
   with a mitochondrion visible inside it. That is the design doc's platonic
   ideal and this is the screen it describes.

   The timeline component exists. This is composition, and if it needs a new
   component then V12's marker or its stop treatment is missing something.

3. The full source list, from docs/SCIENCE.md's bibliography. Not a link dump:
   organised so a person could actually follow one up, and honest about the
   difference between a source for a mechanism and a source for a number.

   docs/SCIENCE.md has a flat topical bibliography and no per-claim
   identifiers, which the design doc identified as the reason provenance cites
   a Part rather than a passage. That limitation is visible here too. Say so
   rather than implying a precision the document does not have.

4. The no-history case, as V14 handled it. A player who reached this through
   the act jump or the sandbox has no real figures, and fabricating them would
   be the exact dishonesty the previous stage just spent a screen disavowing.
   Sourced reference figures, labelled as references.

5. Printable, using V15's stylesheet, because this is the screen the design
   doc's platonic ideal says a teacher can put in front of a class. That
   sentence has been in the plan since the CEO review and this is the log that
   makes it literally true.

Verify: the summary composes from the player's own save and from references
when there is none, the timeline renders at its last stop, and the page prints.
Report the summary contents, the source list organisation with its honest
statement about per-claim precision, the no-history case, and the print result.
```

## Stage 2 Report

_Pending._

---

# Stage 3 — The sandbox

```
All unlocks, adjustable environment, and every input clamped.

1. All unlocks available, all four acts, no progression gating. A player can
   configure any cell the game can express.

2. Adjustable environmental parameters, and decide which. Environment size,
   oxygen level, substrate mix, and whatever else the four acts made
   meaningful. Not every constant: a sandbox that exposes STEADY_EPSILON is
   exposing an engine tolerance rather than an environment, and those are
   different things with different consequences.

   Say which parameters are exposed and why each one is an environment rather
   than an internal.

3. Validation and clamping, on every input, and treat this as the stage's real
   work. The failure modes are known and named already:
     - a value that breaks conservation
     - a value that drives a pool negative, which src/sim/tick.ts documents as
       manufacturing matter because Michaelis-Menten with a negative substrate
       runs a reaction backwards
     - a value that trips SAFE_VALUE_CEILING
     - a configuration that kills the cell, which V5 settled must not be
       purchasable and a sandbox parameter is a purchase with the price removed
     - a value the save cannot represent, or that fails the codec's validation

   Clamp at the boundary and say what happened. Silently correcting an input
   teaches the player something false about the model.

4. The bootstrap trap, specifically, because it is the one with history. V5
   found that act 1 had an unrecoverable state at every value of a swept
   constant and repaired it by changing the kinetic form. bootstrap.test.ts
   asserts both halves including the mechanism. A sandbox that can steer a cell
   into an unrecoverable state has reintroduced blocking item 1 through a text
   input.

   Test it directly: sweep the exposed parameters and confirm no reachable
   configuration is unrecoverable. If one is, clamp it out and report it.

5. The sandbox session and the save. A sandbox cell is not a played cell.
   Decide whether it persists at all, and if it does, mark it the way V13
   marked a jumped session: diagnostic, never branched on. A schema question
   answered deliberately rather than absorbed.

6. Determinism holds in the sandbox. Same parameters, same seed, same result.
   It is the same engine and nothing here gets an exemption.

Verify: every exposed parameter is clamped, no reachable configuration is
unrecoverable, and determinism holds. Report the exposed parameter list with
the environment-versus-internal reasoning for each, the clamping behaviour and
what the player is told, the bootstrap sweep result, and the save decision.
```

## Stage 3 Report

_Pending._

---

# Stage 4 — The success conditions

```
The project reports on itself. This stage writes no feature.

1. Read docs/PILLARS.md's three success conditions and report on each one
   plainly. Met, not met, or partly, with evidence.

2. The two that need a person who is not the author. NOW.md has carried
   "readers found: 0, readers asked: 0" since V6 and the design doc put a cold
   read at the top of the roadmap with a two week timebox, named fallbacks and
   a written fail branch.

   Report what actually happened. If readers were found, report what they said
   including whatever was inconvenient, because the design doc's gate section
   says whatever comes back is written into NOW.md whether it is good or not.
   **If no reader was ever found, say that, in the first line of the report.**

   Eighteen logs, a complete game, and nobody outside the project ever looked
   at it would be the single most important sentence in this document, and the
   temptation to put it at the bottom is exactly why it goes at the top.

3. The third condition needs someone with a biochemistry background. The design
   doc scheduled that as item B alongside the cold read. Report the same way.

4. docs/PROGRESSION.md's open questions for the prototype. Four were listed on
   2026-07-29:
     - does act 2 feel like a compelling crisis or an unfair difficulty spike
     - is act 4 self-sustaining without a transition beat
     - should the shuttle choice be permanent or switchable
     - where does the tutorial end and the game begin

   V14 answered the third and V17 answered the second. The first and fourth
   need a reader. Report each with what answered it or what it still needs.

5. The standing caveat, one last time and then never again, because there are
   no more logs to carry it. Every comprehension claim in this project came
   from the person who built it, who knows where every wall is and what solves
   it, and NOW.md has said so since V3. State whether that is still true at the
   end.

Verify: all three success conditions and all four open questions are reported
with evidence. Report the reader outcome in the first line, whatever it is.
```

## Stage 4 Report

_Pending._

---

# Stage 5 — Coherence, and the last NOW.md

```
Close the log, and the project.

1. Full verify: everything, across four acts, four engines and the sandbox.
   Report the final test count and bundle size against V17's, and against V1's
   65 tests and V2's 193.37 kB, because this is the last log and the arc is
   worth stating once.

2. docs/ECONOMY.md's final count and split. The last number this table will
   have unless somebody picks the project up.

3. Every canonical hash, final values. Confirm the sandbox and the endgame
   moved none of them, because this log adds surfaces rather than simulation.

4. docs/SIMULATION.md line 90, which names three conserved quantities against
   the six the game now has. NOW.md has carried that as an open item since V2
   with a recommendation attached: widen Part 2's wording to say the conserved
   set is content's to declare. It has been correct and deferrable for sixteen
   logs. **Take it now, because there is no later.**

5. Update NOW.md, and this is the last time:
   - Status: the game is finished. One sentence.
   - Build state table: V18 done. The "does not" column is empty for the first
     time in the project's history, or it is not, and if it is not then it says
     what is left and that is the honest handover.
   - The success condition report from stage 4, at the top of Blocking if any
     are unmet, because that is where a person picking this up should find it.
   - Every remaining blocking and open item, triaged one final time. Anything
     still open at the end of the last log is inherited by whoever comes next
     and should be readable cold.
   - A closing section: what this project set out to do, what it did, and what
     it did not. The premise was that the economy is not invented, that
     metabolism already is a resource system with real yields and real
     bottlenecks, and that the game surfaces that rather than decorating it.
     **Say whether that held.**

6. CLAUDE.md's Current state section points at NOW.md and that stays true. Do
   not turn CLAUDE.md into a postscript. Check its line count against its own
   hundred-line guidance one last time.

7. TODOS.md: everything still open, triaged. Anything that will never be done
   gets said rather than left implying it might be.

Verify: everything green everywhere. Report the final test count and bundle
against V1 and V2, the final ECONOMY.md counts, the final hashes, the
docs/SIMULATION.md correction, and the NOW.md closing section in full.
```

## Stage 5 Report

_Pending._

---

# After These Stages

- **The game ends by telling you what it got wrong on purpose.** Thirty-seven-plus tuned numbers split into departures and things with no real counterpart at all, three structural departures that no single number carries, and the largest of them stated plainly: the game refuses a death a real cell can die.
- A player can see their own act 1 yield next to their own act 4 yield with their own playtime attached, standing at the top of a column of deep time with a mitochondrion visible inside a cell that started without one.
- The sandbox lets a player build any cell the game can express and cannot be steered into a state the engine calls a bug, because V5's rule about purchasable configurations was applied to a text input.
- The project reported on its own success conditions, including the ones it failed, **in the first line rather than the last**.
- `docs/SIMULATION.md` line 90 finally says three is content's business rather than the engine's, sixteen logs after `NOW.md` first recommended it and correctly deferred it every time until there was no later.
- **`docs/PILLARS.md` rule 1 says the game is finite. It is finished, and there is no ascension layer, no prestige loop and no new game plus.** An idle game that ends is the whole argument, and this is the log where it either held or it did not.
