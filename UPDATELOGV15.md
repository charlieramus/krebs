charlie

# krebs, V15: Teacher Mode
# Work on one stage at a time. Do NOT combine stages.

---

## Context

Read `NOW.md` first, then `docs/PILLARS.md`, then `UPDATELOGV13.md` stage 3's report, which asked a question this log inherits.

**E6 was split and this is the other half.** V13 built the act jump early so act 3 was reachable in a minute. What was deferred is lesson pacing and a printable summary, and both of those are about a person who is not the player.

**V13 asked the question this log has to answer and refused to answer it itself.** Its stage 3 step 3 says: someone with ten minutes wants to show a class the 2 to 30 payoff, someone reviewing the science wants to reach the chemiosmosis beat without playing an act first, and whether a query parameter serves that or whether it needs a real surface is a product question. It reported the honest answer rather than assuming the developer one. **Read that report before designing anything here.**

**The constraint that shapes the whole log: there is no backend.** `docs/PILLARS.md` rule 7 rules out accounts, servers and network dependency for core play. So teacher mode cannot have classrooms, rosters, shared links or saved lesson plans on anybody's server. What it can have is a URL, a save file and a printer.

**That last one is more interesting than it sounds.** A print stylesheet is the only export this game has other than a JSON save, and it is the only one that produces something a person can hand to another person. `docs/SAVE_SCHEMA.md` Part 4 already makes exported saves plain readable JSON on the grounds that there is nothing to protect, which is the same reasoning.

**And the platonic ideal in the design doc ends on this.** "The game then tells you exactly which of what you learned is measured, which is tuned for pacing, and which is still argued about in 2026. A teacher can put that screen in front of a class." Provenance shipped in V12 and the contested beat shipped in V14. **The screen exists. What does not exist is any way to get it in front of a class in the time a class lasts.**

## Decisions

- **A class period is the unit and everything in this log is measured against it.** The game is roughly eight hours across four acts. A lesson is forty to fifty minutes. That ratio is the entire design problem and no amount of interface work makes eight hours fit into fifty minutes, so what teacher mode does is choose which beat a period reaches.
- **Teacher mode changes access and pacing. It does not change the simulation.** No sped-up tick rate, no altered constants, no easier act. `TICK_RATE_HZ` is frozen since deployment under hard rule 6 and the tuned numbers are what the game is. What a teacher gets is a way to start somewhere and a way to move on, not a different game.
- **The printable summary is a print stylesheet, not a generated document.** No PDF library, no export pipeline, no dependency. The browser prints the page. That keeps the bundle honest, it keeps the content in `content.ts` where the writing contract reaches it, and it means the printed thing and the screen thing cannot drift because they are the same thing.
- **Print is a surface and `docs/CONTENT_STYLE.md` reaches it.** It has its own length ceilings and its own contrast situation, which is black ink on white paper with no hover, no focus and no live region. The accessibility guard computes pairs from tokens and print is a different medium, so what carries meaning on screen has to still carry it on paper.
- **The session event list export lands here, because this is where it makes sense.** `TODOS.md` carries it as deferred, depending on Spine A and wanted before a reader gate opens. `Announcer.tsx` already assembles the complete event set because the accessibility layer needed it, so exporting it is close to free. A session that produces a printable record of what happened is exactly what turns one anecdote into a baseline, which is the thing this project has lost once already.
- **No account, no roster, no shared link, no analytics.** Rule 7, and also the thing that would make a teacher not use it.
- Medium feature, no simulation change, and its hardest problem is a product question rather than a technical one: five stages.

---

# Stage 1 — What a teacher actually needs

```
A decision stage. Little code. Read UPDATELOGV13.md stage 3's report first,
because it left this question open deliberately and its answer is the input
here.

1. State the ratio plainly and design against it. Four acts, roughly eight
   hours, targets of 45 to 90, 90 to 150, 120 to 180 and 150 to 240 minutes.
   A lesson is forty to fifty minutes with setup and packing up inside that.

   So a period reaches one beat. Which beats are worth a period is the whole
   design and it is a content question rather than an interface one.

2. Enumerate the candidate beats, with what each one teaches and roughly how
   long it takes to reach and land from a jump:
     - the NAD+ wall and fermentation, which is act 1's whole argument and the
       one NOW.md calls the strongest thing in the build
     - the yield ceiling: throughput goes up, yield does not, which is act 1's
       other claim and the one most likely to be misread
     - oxygen as a poison before it is fuel, which is act 2 and needs act 2
     - chemiosmosis: the chain pumps, the gradient pays, which is act 3's beat
       and the least intuitive idea in the game
     - the 2 to 30 payoff and the contested beat, which is where the game says
       its own headline number is argued about

   Report which of these a period can actually reach, measured rather than
   estimated, using V13's jump to start each one.

3. Answer V13's open question. Is a query parameter enough, or does a teacher
   need a surface? Answer it as a product question. A teacher preparing a
   lesson the night before is not typing a query string they read in a
   repository, and if that is the honest conclusion then this stage's
   deliverable is a small real surface rather than documentation of a door.

4. What teacher mode explicitly does NOT do, written down before anything is
   built, because each of these will look tempting later: no accounts, no
   rosters, no shared links, no progress tracking, no assessment, no analytics.
   Rule 7 covers most of it and the rest is that a science game with a grading
   feature is a different product.

5. Whether teacher mode is a mode at all, or a set of affordances that exist
   for everyone. A mode implies a switch, a switch implies state, and state
   implies a schema question. The alternative is that everything here is simply
   available and a teacher is a player who uses it differently. Decide, and if
   it is a mode, say what makes the switch worth its cost.

Verify: the candidate beats are measured from a jump rather than estimated, and
V13's question has an answer with reasoning. Report the beat table with real
timings, the answer to step 3, the explicit not-doing list, and the mode
decision from step 5.
```

## Stage 1 Report

_Pending._

---

# Stage 2 — Lesson pacing

```
Getting to a beat inside a period, and stopping there. Build stage 1's
decisions.

1. Start at a beat rather than at an act. V13's jump lands the player at the
   start of an act, and stage 1's table is about beats, which are moments
   inside acts. A beat needs the state that precedes it: to teach the NAD+
   wall you need a cell about to hit it, and to teach chemiosmosis you need a
   cell with a compartment and no synthase.

   Reuse V13's single definition rather than adding a second. That log
   extracted one function that produces an act's legal starting state and made
   the jump a caller of it. A beat start is the same problem one level finer,
   and if it needs the function to grow a parameter then it grows one, in one
   place.

2. What a beat needs beyond a starting state: something that says when it has
   landed. A teacher watching a class needs to know the moment has happened,
   and the game already knows, because the live region announces exactly these
   events and Spine A made act boundaries one of them.

   Do not build a second event system. Announcer.tsx assembles the event set
   already.

3. Pacing controls, and be careful here, because this is where an engagement
   mechanic could enter wearing a lab coat. Nothing speeds up the simulation.
   TICK_RATE_HZ is frozen and the tuned numbers are the game.

   What is legitimate: starting at a beat, which is V13's jump refined, and
   moving to the next beat, which is the same mechanism again. What is not:
   a fast-forward, a skip button in normal play, or anything that makes the
   game shorter for a player rather than for a class.

4. Determinism, in the narrow form V13 established. The same beat start
   produces the same state every time, and a session begun at a beat is
   internally deterministic and reloads identically. Do not claim it matches a
   played session, because it does not.

5. Whatever surface stage 1 decided, built. If stage 1 said a query parameter
   is not enough, this is where the real thing lands, and it should be
   reachable without being in a player's way. The about panel is the existing
   home for things that are true and not urgent.

Verify: every beat in stage 1's table is reachable and lands inside a period.
Report the reachable beats with measured times from start to beat, the
mechanism reused from V13 rather than duplicated, the determinism results, and
confirmation that nothing changed the tick rate or a tuned number.
```

## Stage 2 Report

_Pending._

---

# Stage 3 — The printable summary

```
The screen a teacher can put in front of a class, on paper. A print stylesheet
and no dependency.

1. What it contains, decided before it is styled. The platonic ideal names it:
   which of what you learned is measured, which is tuned for pacing, and which
   is still argued about in 2026.

   Everything needed already exists. Provenance shipped in V12 with four
   destinations. docs/ECONOMY.md holds the divergence table and its DEPARTURE
   and UNSOURCED split. V14 shipped the contested beat. **This stage is
   composition rather than invention**, and if it feels like it needs new
   content then something in the chain is missing and that is the finding.

2. A print stylesheet, and nothing else. No PDF library, no export pipeline, no
   headless renderer, no new dependency. The browser prints the page.

   That is not a compromise. It keeps the printed thing and the screen thing
   the same thing, so they cannot drift, and it keeps every string inside
   content.ts where contentStyle.test.ts reaches it. A generated document is a
   second copy of the content and NOW.md has settled what two copies of one
   fact does.

3. Print as a medium, treated properly rather than as a screenshot. No hover,
   no focus, no live region, no colour guaranteed. Everything that carries
   meaning through hover or through a semantic colour has to carry it another
   way on paper.

   This is the same argument V7 made about colour and the same one V12 made
   about the beast, arriving in a third place. The channel table is the right
   tool: for each thing on the printed page, name the channel that carries it
   when the page is black ink on white paper.

4. Length, under docs/CONTENT_STYLE.md, which has ceilings per surface and does
   not have one for print yet. Add it. A summary that runs to four pages is not
   a summary and a teacher will not photocopy it.

5. The badge contract on paper. Every figure carries a badge as a required prop
   and V7 found that badge fills flatten to black on white under forced-colors,
   so Sourced, Tuned and Contested become typographically identical and are
   told apart only by the word. Print has exactly that problem and it is not a
   bug there either. Confirm the word does the work.

Verify: the page prints to something a teacher would photocopy, every meaning
survives the loss of hover, focus and colour, and the length ceiling is written
into docs/CONTENT_STYLE.md. Report the contents, the channel table for print,
the page count, and confirmation that no dependency was added.
```

## Stage 3 Report

_Pending._

---

# Stage 4 — The session record

```
What happened in this session, exportable. This closes an item TODOS.md has
carried since 2026-08-05.

1. Read TODOS.md's entry first. The argument is already made there: the reader
   gate puts a stranger in front of the game and the only thing currently taken
   away is what the observer remembers. Announcer.tsx already builds the
   complete event list, sixteen events across act 1, because the accessibility
   layer needed it. Exporting it is close to free and it is what turns one
   anecdote into a baseline the next reader can be measured against.

2. Build it from the existing event set. Do not assemble a second one. If the
   announcer's set is not quite right for this, widen it once rather than
   forking it, and say what was widened and why.

3. Two forms, because they serve two people. Alongside the save file, for
   reconstructing a session from a bug report, which matters because there is
   no backend and this is the whole of the project's debugging channel. And on
   the printed summary, for a teacher or an observer who wants a record of what
   the class saw.

4. What it must not become: telemetry. Nothing is sent anywhere. Rule 7, and
   also the difference between a record the player exports and a record the
   game collects.

5. The comparison this makes possible, stated in the report. V6's stages 2 and
   5 were designed as a cold-read baseline and a cold-read re-test and both
   went unrun, and NOW.md records that the comparison V6 was built around is
   permanently lost. A session record does not recover that. What it does is
   make sure the next loss is not the same loss.

Verify: the record exports alongside a save and appears on the printed
summary, built from the announcer's existing event set. Report the export
format, what was widened if anything, and confirmation that nothing leaves the
machine.
```

## Stage 4 Report

_Pending._

---

# Stage 5 — Coherence

```
Close the log out.

1. Full verify: npm run typecheck, npm run lint, npm run build, npm test,
   npm run sim, npm run sim:act1, npm run offline:validate, the headless
   playthrough. Report the test count and bundle size against V14's.

2. Confirm no simulation change. This log adds access, pacing and a stylesheet.
   Every canonical hash unmoved, every tuning file diff empty, docs/SCIENCE.md
   and docs/ECONOMY.md untouched. A teacher mode that moved a tuned number
   changed the game rather than how it is reached.

3. Confirm the bundle barely moved. A print stylesheet is CSS and a session
   record is a serializer. If this log added meaningful weight, something was
   built that stage 1 said not to build.

4. Update docs/CONTENT_STYLE.md with the print ceiling from stage 3, in its
   decisions log with the reason.

5. Update NOW.md:
   - Build state table: V15 done, with its "does not" column.
   - A short "What teacher mode does" section: which beats a period reaches,
     what it deliberately is not, and the answer to V13's open question with
     its reasoning.
   - The session record, and TODOS.md's item struck through with the date the
     way completed items are.
   - The print surface, and that it is a stylesheet rather than a document,
     because the next person will want to add a PDF library and should find the
     reason not to.
   - "Next, in order": V16, act 2. And say plainly that act 2 is the highest
     risk beat in the game, that docs/PROGRESSION.md has listed its shape as an
     open question for the prototype since 2026-07-29, and that V16 opens with
     a repair rather than with content.

6. Move the TODOS.md session event item to Completed with its date.

Verify: everything green, no hash moved, the bundle barely moved. Report the
test count, the bundle delta, the docs/CONTENT_STYLE.md addition, the TODOS.md
move, and the NOW.md diff summary.
```

## Stage 5 Report

_Pending._

---

# After These Stages

- **The screen the design doc's platonic ideal ends on can be put in front of a class**, on paper, in the time a class lasts. It has existed since V12 and V14 and there has been no way to reach it.
- A period reaches one beat, chosen deliberately and measured rather than estimated, and the game is honest that eight hours does not fit in fifty minutes.
- Teacher mode changed access and pacing and did not change the simulation. No faster ticks, no easier act, no tuned number moved. **A teacher gets a different way in, not a different game.**
- The printed page is the same page, because a print stylesheet cannot drift from the screen it styles and a generated document would have been a second copy of every string.
- A session now produces a record of what happened in it, built from the event set the accessibility layer already assembled. It does not recover the comparison V6 lost permanently. It makes sure the next loss is a different one.
- What is left is the act that explains why oxygen matters, and it is the highest-risk beat in the game. It is also the only one that opens with a repair.
