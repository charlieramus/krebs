charlie

# krebs, V5: The Economy Pass and docs/ECONOMY.md
# Work on one stage at a time. Do NOT combine stages.

---

## Context

Read `NOW.md` first, all of it, then `docs/PILLARS.md` rules 4 and 5 and `docs/PROGRESSION.md` act 1. Then read the three tuning files end to end, because their headers are the argument this log is here to settle.

`NOW.md` "Next, in order" has named this document first for two logs running. V3 stage 7 recommended writing it. V4 stage 6 restated the recommendation and added a row to what it owes rather than acting on it. `NOW.md` line 240 records the cost in its own words: **V4 built saves on top of an economy known to have a hole in it, which means the hole is now saved too.** Writing a third log against the same economy repeats that a third time.

**A divergence row is one tuned number, the value the game uses, the real behaviour it departs from and why it departs.** That is `docs/PILLARS.md` rule 5, and the divergence table is where rule 5 stops being a promise.

This log writes `docs/ECONOMY.md` and fixes the two things in `NOW.md` Blocking. It does **not** edit `docs/SCIENCE.md`, which hard rule 2 forbids during a balance pass and which is the single most important constraint on this log. It does not add content, does not build act 2, does not extend the pathway and does not touch the timeline or the beast. It builds no new interface beyond whatever a balance change makes necessary to read, and the steady-state display problem in `DESIGN.md` open question 7 is the interface half of blocking item 2 and belongs to a later log.

**The divergence table is the record. The two blocking items are the work.** A log that produced a beautiful table and left act 1 with an unrecoverable state and a ten-minute dead interval would have missed the point entirely.

## Decisions

- **The count of provisional numbers is wrong in two places and stage 1 settles it from source.** `NOW.md` says twenty-two, twice, and then lists what it calls seven `src/ui/tuning.ts` entries while enumerating eight of them. `src/save/tuning.ts` says the total went from twenty across two files to twenty-one across three. Counting the files: thirteen in `src/content/act1/tuning.ts`, eight in `src/ui/tuning.ts`, one in `src/save/tuning.ts`, so twenty-two. The total in `NOW.md` is right and both parentheticals are off by one. A divergence table that cannot count its own rows is not a contract, so stage 1 counts from the code and both documents are corrected to agree with it.
- **`docs/SCIENCE.md` is read-only for the whole of this log.** Hard rule 2 says balance numbers go in `docs/ECONOMY.md` with a divergence entry and never into `docs/SCIENCE.md`. This is the first log where that rule is live, because it is the first log that changes tuned numbers on purpose. If a stage finds a genuine biological error, it reports it and stops rather than fixing it here.
- **The bootstrap trap gets repaired rather than moved again.** V3 moved it beyond act 1's horizon by raising `ACT1_GLUCOSE_ENV_INITIAL` from 10000 to 80000 and said in the file that this is a deferral and not a fix. `src/content/act1/tuning.ts` names the two real candidates: a maintenance rate that backs off as ATP falls, or a floor under the preparatory phase. Stage 2 measures both and picks one. Moving it a third time is not on the list.
- **The static mid-game is an economy problem and stage 3 treats it as one.** `NOW.md` blocking item 2 lists three candidates: more unlocks so something is always approaching, an environment that varies so the steady state is disturbed, or accepting that an idle mid-game is meant to be quiet and making the quiet legible. The third is a display decision and belongs to `DESIGN.md` open question 7, so stage 3 chooses between the first two and says why the third is not this log's to make.
- **Hard rule 3 still binds.** Whatever stage 3 adds is finite and enumerated. "More unlocks" means a named list with a last entry, not a generator. The uptake ladder already stops at 12 for a measured reason and that reason does not go away.
- **Every tuned change moves the act 1 canonical hash and each stage owns its own move.** The hash is `657594cb`. A stage that changes a tuned value updates the assertion in the same stage, reports the old value, the new value and the single cause, and writes the reason into the assertion the way V3 stage 6 did. No stage leaves the suite red for a later stage to clean up, and no stage batches two causes into one hash move.
- **`docs/ECONOMY.md` is the first new specification document since the project started and it inherits the house rules.** A decisions log at the bottom, dates in YYYY-MM-DD, no number in it that is not traceable to either the code or a measurement in this log. It is not a design document and it does not restate `docs/PROGRESSION.md`.
- **Measurement before choice, in every stage.** This is the posture V2 stage 5 established and V3 stage 6 inherited: measure first, decide second, and if the measurement contradicts the plan then report the contradiction rather than tuning until the plan is true. The existing harnesses are `npm run sim:act1`, `npm run sim:drain` and `src/ui/__tests__/unlockPacing.report.test.ts`, all three of which were built to be reused here.
- **`docs/CONTENT_STYLE.md` is still not written by this log.** It is the next log's, and it needs a settled economy to write against, which is the whole reason this one goes first.
- Medium feature, heavy on measurement: five stages.

## The divergence row, settled here

Settled so stage 1 fills a shape rather than inventing one. One row per tuned number.

```
  | Id | Value | Where | The real behaviour | What the game does instead | Why | Introduced |
```

`Id` is stable and permanent once written, because later logs will cite rows. `The real behaviour` is what biology does, cited to `docs/SCIENCE.md` where the science says anything at all, and **left explicitly empty where it says nothing**. That empty cell is not a gap to be filled with a plausible sentence. Most of these numbers depart from nothing, because nothing was ever claimed: a dash speed in pixels per flux unit has no biological counterpart and pretending it does would be the exact failure this table exists to prevent.

So the table has two kinds of row and stage 1 must keep them visibly apart:

```
  DEPARTURE     a number that stands where a real quantity could have stood
                and does not match it. ACT1_NICOTINAMIDE_TOTAL is one: the
                pool being small and fixed is sourced, its size is ours.

  UNSOURCED     a number with no real counterpart at all. DASH_LENGTH is one.
                It owes disclosure, not a comparison.
```

Rule 5 says departures get recorded. It does not say invent a departure for a number that never departed from anything.

## The twenty-two, counted from the code

```
  src/content/act1/tuning.ts                                            13
    ACT1_VMAX          uptake 8, prep 12, payoff 26, ferment 26, maintain 50
    ACT1_KM            uptake 500, prep 4, payoff 2, ferment 2, maintain 20
    ACT1_HILL_N        2
    ACT1_NICOTINAMIDE_TOTAL      30
    ACT1_GLUCOSE_ENV_INITIAL     80000

  src/ui/tuning.ts                                                       8
    ZERO_FLUX_THRESHOLD          0.25
    DASH_PIXELS_PER_FLUX_UNIT    6
    DASH_LENGTH                  8
    FERMENT_ATP_THRESHOLD        55
    UPTAKE_VMAX_STEPS            [8, 10, 12]
    UPTAKE_ATP_THRESHOLDS        1500
    UPTAKE_ATP_THRESHOLDS        12000
    OFFLINE_REPORT_THRESHOLD_MS  60000

  src/save/tuning.ts                                                     1
    AUTOSAVE_INTERVAL_MS         30000
```

Stage 1 verifies this against the files rather than trusting it. If it is wrong, the table is right and this section is the bug report.

---

# Stage 1 — The recount, and docs/ECONOMY.md as it stands today

```
Documentation and measurement only. No tuned value changes in this stage. The
table has to describe the economy that exists before it can describe the one
stages 2 to 4 produce.

1. Count the provisional numbers from the three tuning files themselves. Report
   the count per file and the total. Then correct both places that disagree
   with it: NOW.md's parenthetical that says seven src/ui entries while listing
   eight, and src/save/tuning.ts's header that says the total went to
   twenty-one. Do not correct them to this log's number. Correct them to the
   number you counted, and if that is not twenty-two then say so and this
   log's Context section is the thing that was wrong.

2. Create docs/ECONOMY.md. Structure it like the other spec docs: a status
   header with the date, a short statement of what the document is for, the
   divergence table, then a decisions log at the bottom.

   State at the top, plainly, what this document is and is not. It is the
   record required by docs/PILLARS.md rule 5 and the place CLAUDE.md hard rule
   2 sends balance numbers. It is not a design document, it does not restate
   docs/PROGRESSION.md, and no number in it may be cited as biology.

3. Fill one row per tuned number, using this log's settled row shape, and tag
   each row DEPARTURE or UNSOURCED. Most of the interface and save numbers are
   UNSOURCED and that is the honest classification, not a lazy one.

   The reasoning is already written. Every one of these numbers carries a long
   comment in its tuning file explaining how it was picked, several of them
   citing measurements from V2, V3 and V4 stage reports. Mine those rather than
   inventing new justifications, and where a comment gives a measurement,
   carry the measurement into the row.

   Where a value was already changed once, the row records both. ACT1_NICOTINAMIDE_TOTAL
   went 10 to 30 in V2 stage 4 and ACT1_GLUCOSE_ENV_INITIAL went 10000 to 80000
   in V3 stage 6. A divergence table that shows only the current value hides the
   thing that makes it a decision.

4. Two rows will not fit the shape and both are findings rather than problems.

   ACT1_GLUCOSE_ENV_INITIAL is a number whose stated purpose in its own comment
   is to hide a defect. Its row has to say that, in the table, where anyone
   reading the economy will see it, rather than only in a source comment.

   UPTAKE_VMAX_STEPS is an array whose last entry was chosen by measurement and
   whose first entry is not purchasable. Decide how the table represents a
   ladder and say why.

5. Cross-check every row against the code rather than against the comments. A
   comment that has drifted from its value is exactly what a first divergence
   pass should catch, and finding one is a better outcome for this stage than
   finding none. Report any you find.

Verify: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`. No
tuned value changed, so `git diff --stat` shows docs/ECONOMY.md, NOW.md and
src/save/tuning.ts only, and the act 1 canonical hash is still 657594cb. Report
the count per file, the full table, any comment-versus-code drift found and a
plain statement of how many rows are DEPARTURE and how many are UNSOURCED.
```

## Stage 1 Report

**The count is 24, not 22, and this log's Context section is the thing that was wrong.** Counted from the three files with one rule applied consistently:

    src/content/act1/tuning.ts    13    5 Vmax, 5 Km, Hill n, nicotinamide total, environment size
    src/ui/tuning.ts              10    4 scalars, 3 ladder rungs, 2 thresholds, offline report
    src/save/tuning.ts             1    autosave interval
                                  --
                                  24

**The rule is the whole disagreement.** The unit is the scalar value a balance pass can move on its own. `ACT1_VMAX` is a record of five and everybody has always counted it as five, so `UPTAKE_VMAX_STEPS` is an array of three and counts as three. This log's "twenty-two, counted from the code" block counts the ladder as one line while counting its sibling array `UPTAKE_ATP_THRESHOLDS` as two lines, which is two rules in one table. Apply either rule consistently and the answer is 24 or 21, never 22. **The number 22 was reachable only by switching rules halfway down an eight line list.**

So both parentheticals and the total were wrong, which is one more error than the log predicted. `NOW.md` said twenty-two three times and enumerated eight things while calling them seven. `src/save/tuning.ts` said V4 took the count from twenty across two files to twenty-one across three. Both are corrected to 24, and both headers now say what they undercounted and why, because a count that was wrong twice in the same direction should say which thing it kept missing. It was the ladder, both times.

**docs/ECONOMY.md exists.** Status header, what it is, what it is not, the divergence table split by file, structural departures, known hazards and a decisions log. It states at the top that it is the record docs/PILLARS.md rule 5 requires and the place CLAUDE.md hard rule 2 sends balance numbers, that it is not a design document, that it does not restate docs/PROGRESSION.md and that no number in it may be cited as biology.

**24 rows. 16 DEPARTURE and 8 UNSOURCED.** The split is not arbitrary and it falls in one place: every number in `src/content/act1/tuning.ts` is a rate or a pool size and is therefore a DEPARTURE, the three ladder rungs in `src/ui/tuning.ts` are Vmax values and are the same kind of number, and everything else in the interface and save files is a perception threshold, a purchase gate or a display cutoff with no real counterpart at all. Eight rows have an empty real behaviour cell and that emptiness is the content of the row rather than a gap in it.

**Vmax and Km rows are DEPARTURE and the alternative reading was real.** They could have been called UNSOURCED on the grounds that docs/SCIENCE.md Part 1 refuses to name a literature value, so there is no cited counterpart to depart from. That was rejected: real enzymes do have Vmax and Km values, the project declines to use them for a stated reason, and telling a reader there is nothing there to depart from would be false. The real behaviour cell for those rows says the real values exist, vary by an order of magnitude across sources, and are deliberately not used.

**Step 4, the two rows that do not fit the shape.**

`ACT1_GLUCOSE_ENV_INITIAL` is row C13 and its Why cell opens with **"This number's stated purpose is to hide a defect and its row has to say so."** It then gives the crossing at 114m14s, names NOW.md blocking item 1, and says it is a deferral rather than a fix. That sentence was in a source comment where only a contributor would find it. It is now in the economy document, in the table, at the same weight as every other row.

`UPTAKE_VMAX_STEPS` becomes **one row per rung**, U5 U6 and U7. Three reasons, and the third decides it: the counting unit is the scalar, a rung is moved independently by a balance pass and V3 replacing 8, 12, 18, 26 with 8, 10, 12 is not one edit, and **the three rungs do not share a justification.** U5 mirrors a content constant and is not purchasable, U7 is fixed by a measurement, U6 is the only freely chosen number in the ladder. One row cannot carry three different Why cells honestly.

**Step 5, the cross-check against code found four things and the log hoped for one.**

**1. The ladder measurement in the source comment is stale, and the conclusion it supports is not.** `src/ui/tuning.ts` cites "uptake 8 reaches 30000 cumulative ATP in 17m05s, 12 reaches it in 11m24s, and 14 and 18 both reach it in 11m03s". Re-measured today:

    uptake Vmax    time to 30000 cumulative ATP    comment says
    8              15m44.6s                        17m05s
    10             12m36.1s                        -
    12             11m03.0s                        11m24s
    14             11m02.9s                        11m03s
    18             11m02.8s                        11m03s
    26             11m02.6s                        -

The cause is in V3's own stage 6 report. That table was measured **before** step 5 of the same stage raised `ACT1_GLUCOSE_ENV_INITIAL` from 10000 to 80000, and it was never re-run afterwards. A larger environment keeps uptake nearer saturation for longer, so every row got faster, and the two rows that moved most are the two the game actually ships. **The knee is still exactly at 12**, and 14, 18 and 26 now sell four tenths of a second between them rather than the twenty-one seconds the old table showed, so the argument for stopping the ladder at 12 came out of the re-measurement stronger than it went in. Row U7 carries the new numbers.

**2. A badge string on the screen says the ladder has four steps and it has three.** `TUNING_BADGES.uptakeVmax` in `src/ui/tuning.ts` reads "A finite ladder of four steps". V3's own stage 6 report gives the same badge as "A finite ladder of three steps", so the string was written for the planned 8, 12, 18, 26 and was not updated when measurement cut the ladder. This is **player-facing text with a wrong number in it**, which is the worst kind of drift this project can have, and it is the only finding here that a player could see. It is not fixed in this stage, because this stage changes no code and because stage 3 may rewrite the ladder and the string with it. **If stage 3 does not touch it, stage 5 fixes it.**

**3. Five docs/SCIENCE.md line citations in source comments are stale by 42 lines.** `tuning.ts`, `pools.ts` and `reactions.ts` cite "Part 2 line 108" for the NAD+ constraint, now line 150, "Part 2 lines 89 to 96" for the glycolysis ledger, now 133 to 138, and "Part 2 line 114" and "line 116" for fermentation, now 156 and 158. All five now land inside Part 1. docs/SCIENCE.md gained three "deliberately wrong and why" entries on 2026-07-29 after those comments were written. Every citation still names the right Part and the right claim so nothing is unsourced, but hard rule 1's traceability is exactly what those pointers exist to serve. The durable fix is citing section headings rather than line numbers, and it is a comment-only edit deferred to stage 5's coherence pass. The docs/SIMULATION.md citations were checked too and both are still correct.

**4. `UPTAKE_VMAX_STEPS[0]` is never applied as a Vmax by the game.** `src/ui/runtime.ts` line 498 only calls `setReactionVmax` when a restored save's step is above 0, and a fresh run takes `ACT1_VMAX.uptake`, so the first rung is an index placeholder rather than a value. It mirrors `ACT1_VMAX.uptake` and nothing enforces that it keeps doing so. The hazard is not in play, it is in measurement: `npm run sim:drain` and `unlockPacing.report.test.ts` both iterate the ladder, and if the two 8s diverged, every figure in docs/ECONOMY.md that says "at the shipped default Vmax" would be reported under a Vmax the game never runs at. Recorded under "Known hazards" with the one line assertion that closes it.

Two smaller things checked and found sound rather than drifted. `ZERO_FLUX_THRESHOLD`'s comment claims the threshold fires at one to three percent of working rate; realized act 1 flux measured today runs 7.949 to 22.684 across the ladder, so 0.25 is 3.1 percent at the bottom and 1.1 percent at the top and the claim is exactly right. Its "roughly 7 and 26 at full tilt" is the Vmax range rather than the realized one, since realized flux tops out at 22.684, but the conclusion it supports does not depend on it. `UPTAKE_ATP_THRESHOLDS`'s "roughly one minute and roughly seven" measures at 0m48.1s and 6m18.3s, which is one rounding generous at the top end and not wrong.

**Verify, all clean.** `npm run typecheck` and `npm run lint` silent. `npm test` 269 passed across 24 files, unchanged from V4. `npm run build` 251.29 kB and 78.79 kB gzipped, unchanged from V4 to the byte, which is the expected result of a stage that changed one comment block and no code. The act 1 canonical hash is **still `657594cb`** and no tuned value moved. `git diff --stat` shows `NOW.md` and `src/save/tuning.ts`, with `docs/ECONOMY.md` new and untracked, which is the three files the stage predicted.

---

# Stage 2 — The ATP bootstrap trap, repaired rather than moved

```
NOW.md blocking item 1, open since V2 stage 5 found it and deferred twice.
Read the ACT1_GLUCOSE_ENV_INITIAL comment in src/content/act1/tuning.ts before
starting: it states plainly that it is a deferral and not a fix, and it names
the two real candidates.

1. Reproduce it and characterise it properly, which no log has done yet.
   `npm run dev` at /?glucose=500&ferment=on, and `npm run sim:drain`.

   Report the actual boundary rather than "roughly 400". Sweep environmental
   glucose and find the threshold below which a cell that starts healthy cannot
   recover, to whatever precision the sweep supports. Report what ATP does on
   the way down, because "decays to denormal" is a description of the end state
   and the shape of the approach is what a fix has to change.

2. The trap is a bootstrapping failure and it has two candidate repairs, both
   named in the tuning file. Implement BOTH, behind a flag, and measure them.
   Do not pick first.

   a. Maintenance backs off as ATP falls. maintain is currently
      Michaelis-Menten on ATP with Km 20, so it already backs off, and the
      measurement to make is whether it backs off fast enough or whether the
      Km is simply in the wrong place. This may be a one-number change rather
      than a new mechanism, and if it is, that is the better answer.

   b. A floor under the preparatory phase. prep cannot pay its 2 ATP entry
      cost, so the pathway cannot restart. Some form of guaranteed minimum
      entry, or a reduced-cost path at very low ATP.

   For each: does the cell recover from a cold start at every environmental
   glucose level down to zero, and what does it cost elsewhere? Measure the
   cost. A fix that repairs the trap and moves the NAD+ wall, changes the yield,
   or breaks the walled-versus-starved distinction has traded the act's teaching
   beat for a robustness property and is not a fix.

3. Whichever wins, it must be defensible as biology or disclosed as not being.
   A cell really can be too ATP-poor to start glycolysis, which is why this trap
   is not nonsense. A game that cannot be lost to it is departing from that, so
   the departure gets a divergence row in the shape stage 1 settled, with the
   real behaviour cited and the game behaviour stated. If the honest row says
   "real cells do die this way and the game refuses to let the player", write
   that row.

4. Then reconsider ACT1_GLUCOSE_ENV_INITIAL. It is 80000 because the trap
   existed. With the trap repaired, is 80000 still the right number, or was it
   only ever a shield? Measure the act length at the new value and at the old
   10000 against docs/PROGRESSION.md's 45 to 90 minutes, and choose on pacing
   rather than on safety. Report both.

5. Assert the repair rather than trusting it. A test that starts act 1 from ATP
   at or near zero, at several environmental glucose levels including zero, and
   asserts the pathway recovers whenever there is any glucose at all. This is
   the test that stops a future balance change from quietly reintroducing the
   trap, and it is worth more than the fix.

Verify: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`,
`npm run sim:act1`, `npm run sim:drain`. Report the measured threshold from step
1, both candidate measurements from step 2 with their costs, which won and why
the other lost, the ACT1_GLUCOSE_ENV_INITIAL decision with its pacing numbers,
the new act 1 canonical hash with its single cause, and the new divergence rows.
State plainly whether NOW.md blocking item 1 is closed or still open.
```

## Stage 2 Report

_Pending._

---

# Stage 3 — The static mid-game

```
NOW.md blocking item 2, and the reason docs/BRIEF.md line 110's first question
came back negative. Read "What the interface answered" in NOW.md before
starting, particularly the paragraph about eight consecutive minutes with ATP
per second pinned to twelve decimal places.

1. Measure the dead interval rather than reasoning about it. Instrument a run
   and report, for a player who buys everything as soon as it is affordable:
   how long the act is end to end, how many discrete events it contains, and
   the duration of every gap between them. V3 reported roughly ten minutes of
   nothing between two events. Get the real distribution.

   An event is anything that changes what the screen shows: the wall arriving,
   an unlock becoming affordable, an unlock being bought, a rate changing. A
   steady state that persists is the absence of events and that is the thing
   being measured.

2. Choose between the two economy candidates from NOW.md blocking item 2. The
   third candidate, making the quiet legible, is a display decision, it is
   DESIGN.md open question 7, and it is not this log's to make. Say so in the
   report rather than silently taking it.

   a. More unlocks, so something is always approaching. NOW.md already names
      the shape of the next one: the uptake ladder stops at 12 because prep
      runs at Vmax 12, so preparatory-phase capacity is the natural next thing
      to sell and it lengthens the uptake ladder as a side effect. That is a
      real design lead recorded in NOW.md rather than a new invention.

   b. An environment that varies, so the steady state is disturbed. Note the
      hazard before choosing it: docs/SIMULATION.md Part 3 builds offline
      progress on the system reaching steady state, and an environment that
      never settles makes the offline path fall back to coarse replay every
      time. That fallback is described in Part 3 as a bug signal rather than a
      normal condition. Choosing (b) has a cost in the next log and the report
      must say so.

3. Whatever is added is finite and enumerated. Hard rule 3 forbids infinite
   scaling and docs/PILLARS.md rule 1 says the game ends. If the answer is more
   unlocks, there is a last one, it is in a list, and the list is short enough
   to read.

   If the answer is a preparatory-phase capacity ladder, it obeys the same
   measured constraint the uptake ladder does: measure where the next
   bottleneck moves to, and stop the ladder there rather than one rung past it.
   A step that sells nothing is the specific failure V3 stage 6 caught and
   documented, and it would be worse to repeat it than to have never learned it.

4. Every unlock delivers real biology or it does not ship. docs/PILLARS.md rule
   3: education is the reward, not the wrapper, and a mechanic that teaches
   nothing needs a separate justification. Preparatory-phase capacity teaches
   that the investment phase is itself rate-limited. Say for each thing added
   what it teaches, in one sentence, and if the sentence is hard to write then
   the unlock is filler.

5. Re-measure step 1 after the change. Report the new event count and the new
   gap distribution against the old. If the longest gap did not shrink, the
   change did not work and reporting that is the correct outcome.

Verify: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`,
`npm run dev` played to the end of the act. Report both gap distributions,
which candidate you chose and why the other lost, what each new unlock teaches,
the cost to the offline path if you chose (b), the new act 1 canonical hash with
its single cause, and the new divergence rows. State plainly whether NOW.md
blocking item 2 is closed, narrowed or still open.
```

## Stage 3 Report

_Pending._

---

# Stage 4 — Balance the act end to end

```
Stages 2 and 3 each changed the economy for a local reason. This stage is the
only one that looks at the whole thing at once, against the one external target
the project has committed to.

1. docs/PROGRESSION.md gives act 1 a target duration of 45 to 90 minutes. That
   is the only pacing figure the project has ever written down and nothing has
   ever been measured against it. Measure it now, three ways:
     - buying everything the moment it is affordable
     - buying nothing at all, to find the floor
     - a plausible middle, and say what made it plausible

   Report all three. If the act is outside 45 to 90 minutes, the thresholds
   move, and if it cannot be brought inside without something else breaking,
   report that instead of forcing it.

2. Re-derive the unlock thresholds from the measurement rather than adjusting
   them by feel. FERMENT_ATP_THRESHOLD is bounded above at 60 by a hard
   measurement, the cumulative ATP ceiling of a walled cell, asserted in
   unlockPacing.report.test.ts. That bound survives whatever stage 2 and 3 did
   unless they changed the nicotinamide total, in which case re-derive the
   bound first and say what it became.

3. Confirm the act's teaching beats still land after two stages of change. All
   of these are already asserted somewhere in the suite and this step is
   checking the assertions still mean what they meant:
     - the NAD+ wall still arrives as an event, at a legible time
     - yield is still exactly 4 gross and 2 net per completed glucose
     - fermentation still buys throughput and exactly zero yield
     - walled and starved are still distinguishable at a glance
     - conservation still holds on all five quantities

   Any of those moving is a regression that outranks pacing. Report each.

4. Fill in every divergence row that stages 2 to 4 created or changed, and give
   each changed row its before value as well as its after. Then read the whole
   table back and check it against the code one more time. This is the last
   stage that changes a number, so this is the moment the table is true.

5. Report what the economy still cannot answer. There will be things: pacing
   measured by the person who built it is the same unreliable reading NOW.md
   already flags for the teaching beats, and 45 to 90 minutes is itself a
   target nobody has validated against a real player. Say what would settle it.

Verify: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`,
`npm run sim:act1`, `npm run sim:drain`, `npm run dev` played end to end.
Report the three act durations, the re-derived thresholds, the five teaching
beats each confirmed or regressed, the completed divergence table and the act
1 canonical hash with the cause of every move it made in this log.
```

## Stage 4 Report

_Pending._

---

# Stage 5 — Coherence, verify and NOW.md

```
Close the log out.

1. Coherence pass. Every tuned number still lives in exactly one of the three
   tuning files and nowhere else, every one of them has a divergence row, and
   every row matches the code. Grep for numeric literals that escaped into
   src/content/, src/ui/ and src/save/ during stages 2 to 4 and pull them back.

   Then make it mechanism rather than discipline, which is what this project
   does with rules it intends to keep. A test that asserts every exported
   constant in the three tuning files has a row in docs/ECONOMY.md, by parsing
   both. The DESIGN.md colour test from V3 stage 2 is the model and it already
   proves the approach works: a document and a file that must agree, checked by
   the suite rather than by a reader. Adding a tuned number without a
   divergence row then fails the build, which turns docs/PILLARS.md rule 5 into
   the same kind of guard as hard rules 1, 4, 5 and 7.

   Prove it fires. Add a probe constant with no row, run the suite, quote the
   failure, remove the probe.

2. Confirm hard rule 2 held. `git log` and `git diff` across every stage of this
   log must show docs/SCIENCE.md untouched. State it plainly with the evidence,
   because this is the first log where that rule was live and a log that
   quietly edited it would have broken the project's sourcing posture rather
   than a lint rule.

3. Full verify: `npm run typecheck`, `npm run lint`, `npm run build`,
   `npm test`. Report the test count and bundle size against V4's 269 tests and
   251.29 kB.

4. Update NOW.md:
   - Status: what the economy is now, and whether act 1 is inside its target
     duration.
   - Build state table: V5 done, with the date. The table has been held at V5
     since V3 because the answers did not license an extension. State whether
     they do now, and if the static mid-game is closed then say what that
     unlocks and what it does not. Act 2 is still not decidable by this log.
   - Blocking: close, narrow or restate both items with the stage 2 and stage 3
     results. If either is still open, say so plainly rather than downgrading it
     to "open, not blocking" because this log was supposed to fix it.
   - "Open, not blocking": the twenty-two count is now settled and the entry
     changes shape rather than disappearing, because the debt is discharged and
     the obligation to keep it discharged is new.
   - A "What the economy does" section, sibling to the kernel, content,
     interface and save sections, same shape. It should say where the table is,
     what the DEPARTURE and UNSOURCED split means, and that the guard from step
     1 keeps them in step.
   - "Next, in order": docs/CONTENT_STYLE.md and the comprehension pass is next,
     and it needed a settled economy to write text against, which is the reason
     this log went first. Offline progress follows.

5. Update docs/PROGRESSION.md only if stage 3 added unlocks. Its act 1 unlock
   order is a seven-item list and a new purchasable thing belongs in it. Do not
   restate the economy there. Numbers stay in docs/ECONOMY.md.

Verify: everything above clean. Report the step 1 guard output verbatim, the
hard rule 2 evidence, the test count, the bundle size, the NOW.md and
docs/PROGRESSION.md diff summaries, and the final act 1 canonical hash with the
full list of causes that moved it in this log.
```

## Stage 5 Report

_Pending._

---

# After These Stages

- `docs/PILLARS.md` rule 5 has somewhere to point. Twenty-two tuned numbers carry a divergence row each, split honestly between departures from real behaviour and numbers that never had a real counterpart, and a test keeps the table and the code in step the way the colour test keeps `DESIGN.md` and `src/index.css` in step.
- Hard rule 2 has been exercised for the first time. Every balance decision in this log went into `docs/ECONOMY.md` and `docs/SCIENCE.md` was not touched, which is the whole reason the two documents are separate.
- Both `NOW.md` blocking items belonged to this document and neither could be fixed by any earlier log. The ATP bootstrap trap was deferred twice before it was repaired, and the static mid-game is the finding V3 existed to produce.
- The next log is comprehension: `docs/CONTENT_STYLE.md`, a first run, and the teaching layer. It needed a settled economy to write against, because text written against numbers that are about to move is text that gets written twice.
- Offline progress follows, and `docs/SIMULATION.md` Part 3 depends on the system reaching steady state. If stage 3 chose a varying environment, that log inherits a cost and this one said so.
