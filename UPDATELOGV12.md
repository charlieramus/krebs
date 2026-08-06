charlie

# krebs, V12: Spine B, the Surface Half
# Work on one stage at a time. Do NOT combine stages.

---

## Context

Read `NOW.md` first, then `DESIGN.md` end to end including its open questions and its decisions log, then `docs/designs/game-spine-and-four-acts.md`.

**This is the log that gives the game the two things `DESIGN.md` says supply its meaning, and that were cut first and never rescheduled.**

`DESIGN.md` says of the beast: "Nothing else in the design consumes ATP, so the game produces a currency with no visible sink, which is what makes idle numbers feel weightless." It says of the timeline: "It answers where am I and how much is left, which the act screens cannot, and it gives ATP a visible destination." **Both were deferred in V3's Decisions and neither was ever picked back up.** What is on screen is eight pool cards and a pathway diagram, which is the design working exactly as specified with both of its connective elements removed.

**The timeline stops back to 2026-07-29 and the design work is further along than the code suggests.** `NOW.md` records it as settled: the stop list is sourced, every stop traces to `docs/SCIENCE.md` Part 6, no `Needs source` badge survives on the view, the GOE stop keeps banded iron as its figure, and the eukaryote stop is reframed from morphology to metabolism. Seven stops. **Two of them carry no date at all**, and that is a sourcing result rather than a gap: oxygenic photosynthesis is unresolved, and the vent stop is a hypothesis about mechanism rather than a dated event.

**This log ships the first hand-authored art in the project's history and that is a bigger deal than it sounds.** Every illustration so far is computed. `Blob.tsx` contains no path data by rule: a blob reads carbon and phosphate weights out of the pool table and draws itself, so glucose has six sides because glucose carries six carbon. **The beast's four states and the seven timeline figures cannot be derived from anything.** Eleven hand-drawn assets, on the critical path, in a project where nothing has ever been drawn.

**Spine A ran first and this log depends on it.** The act registry exists, the runtime takes a descriptor, act 1 has an ending, and the guards walk their directories rather than reading a list. That last one matters here more than anywhere: every component this log adds is covered by the accessibility guard on the day it lands, which was not true for nine of the twenty components already in the tree.

## Decisions

- **The DESIGN.md stage comes first and nothing is built until it is done.** Six edits, two of them open questions that have been open since 2026-07-28. This is the same ordering V6 used for `docs/CONTENT_STYLE.md` and V7 used for the accessibility rule, and `NOW.md` records that every ordering claim of this shape has been right: a foundation gets laid before something is built on it.
- **The timeline marker is discrete and reads the act. It never moves smoothly.** The plan insists the timeline is not a progress bar, and a marker that slides with cumulative ATP or elapsed time is a progress bar whatever the art looks like. It also protects the project's central architectural claim: the timeline is the largest always-on surface in the game, and React never re-renders at tick rate. Discrete transitions on discrete events, and there is no continuous quantity wired to position at all.
- **The beast has four discrete states, they are React state, and it never animates on a timer.** `DESIGN.md` already says the second part. Breaking it converts the character into a pet with engagement hooks and loses `docs/PILLARS.md` rule 2. Anything continuous about it goes on the per-frame DOM write path that `PoolCard` already uses.
- **The beast is the answer to open question 7, and answering it creates a collision that has to be resolved in stage 1 rather than discovered in stage 3.** Open question 7 asks for something that distinguishes holding at a high rate from stopped, which is the fourteen-minute problem in visual form. The beast's state table already answers it: Lively is high flux, Sluggish is flux near zero. Two pictures of the same 0.00, both specified in V3, filed in different sections and never connected. **But the signal `DESIGN.md` proposes for it is motion, and V7 widened the accessibility rule to say nothing may be encoded in movement or colour alone.** So every beast state needs a second channel and that is a design decision, not an implementation detail.
- **Provenance says what is true, including when the true thing is unflattering.** A Sourced figure opens its `docs/SCIENCE.md` Part. A Tuned figure opens its `docs/ECONOMY.md` row, which itself says DEPARTURE or UNSOURCED. A Contested figure says what is argued about and who argues which side. A `measured` figure says it came from the player's own session. **Every science game claims accuracy. A game that will tell you on demand which of its numbers are measured and which it invented for pacing is doing something else.**
- **The documents do not get bundled.** Nothing in `src/` has ever read a doc at runtime and this log is not the one that starts. `docs/SCIENCE.md` is 654 lines written for a biochemist, with no length ceiling and no badge on any number, and putting it on screen would break `contentStyle.test.ts` and violate the writing contract in one move. V9's content security policy permits zero network requests, so nothing can be fetched either. The prose is authored and a guard parses the documents to prove the citations resolve, which is the mechanism `disclosure.test.tsx` and `divergenceTable.test.ts` already use twice.
- **Timeline figures earn their place by metabolism, not morphology.** `NOW.md` settled this on 2026-07-28 as the guardrail that keeps the timeline from drifting into the tree of life. Making the timeline the frame raises the pressure to add interesting-looking creatures, and the rule now has real load on it for the first time.
- **The pool rail reads the running act and is not resized for act 3.** Act 3's pools are not written down anywhere and its compartment and gradient illustration rules are deferred to its own log by the design doc's own risk table. Designing a grouping against both would be a guess that the act 3 log redesigns anyway.
- **The bundle budget V9 built is load-bearing in this log and nowhere else so far.** Eleven hand-drawn assets is the first real payload the project has added. SVG is text and gzips well, so nothing looks alarming at figure one and it looks alarming at figure eleven, by which point the art is drawn. Report the delta as each stage lands rather than at the end.
- Large visual feature, first hand-authored art, two open design questions: six stages.

## What DESIGN.md still owes, transcribed so stage 1 works from a list

```
  open question 5   two timeline stops have no date and the view has no
                    component for that. The date column is specified as a date.
                    unresolved and hypothesis need a treatment that reads as a
                    deliberate statement at the same visual weight, and the
                    non-linear axis has to place an undated stop by ordering
                    constraint alone

  open question 7   a solved act 1 shows 0.00 on every net rate for fourteen
                    minutes and the design has no treatment for equilibrium.
                    The beast's state table is the answer and the two have
                    never been connected on the page

  blocking item 4   forced-colors removes the hard offset shadow without
                    removing it. box-shadow is not forced, so the ink shadow
                    paints onto black where it is invisible while the layout
                    still reserves its offset. Both sides are right and the fix
                    is a design decision rather than a repair

  the beast's       DESIGN.md proposes motion. V7's rule bans motion alone.
  second channel    Unresolved on the page

  art governance    nothing constrains a hand-drawn asset to the token palette.
                    The accessibility guard computes pairs from index.css, and
                    SVG fill as a presentation attribute is not forced by
                    forced-colors

  the wordmark      DESIGN.md gives it 60 to 104px, a hero scale, and on the
  scale             act screen it takes a permanent 100px band for a word that
                    never changes. Implemented as specified and recorded as
                    wrong
```

---

# Stage 1 — DESIGN.md, before anything is drawn

```
A design stage. No component is written. Six edits, and two of them have been
open since the day the design system was chosen.

1. Open question 5, the undated stop. Two of seven stops carry unresolved and
   hypothesis rather than a date, and that is a result rather than a gap:
   sourcing killed two dates rather than supplying them.

   Design the treatment. It has to read as a deliberate statement at the same
   visual weight as a real date, not as a missing value, because a blank where
   a number should be reads as unfinished and this system uses dashed borders
   to mean unfinished on purpose. And the axis is non-linear, so an undated
   stop has to be placed by ordering constraint alone: it sits after one thing
   and before another and that is all that is known about it.

   This is the most interesting problem in the log. A timeline that can say
   "we do not know when" at full confidence is making the same move provenance
   makes, one section down.

2. Open question 7, and connect it to the thing that already answers it. The
   question asks what distinguishes holding at a high rate from stopped. The
   beast's state table says Lively is high flux and Sluggish is flux near zero.
   Both were specified in V3 and filed in different sections and nothing ever
   joined them. Join them on the page.

   Then resolve the collision this creates, which is the real work. The signal
   DESIGN.md proposes for beast state is motion. The Accessibility section says
   nothing may be encoded in movement or colour alone, widened by V7 from a
   rule that had covered motion since 2026-07-28. So each of the four states
   needs a second channel that is neither motion nor colour.

   The precedent is V7's redox level: the second channel it added turned out to
   be a truer encoding than the one it supplemented, because a pool at 56
   percent reduced does not contain a substance of an intermediate colour. Look
   for that rather than for a texture. A beast state that carries real
   simulation state in its shape is worth more than a pattern overlay.

3. The beast's four states, each pinned to a simulation condition rather than
   to a mood. What flux, what pools, what threshold. Spine A moved the
   walled-cell question into the act descriptor, so the descriptor is where the
   condition lives and the beast reads the answer.

   And say what the fourth state is for. Lively and Sluggish are two. A walled
   cell and a starving cell are visibly different situations that NOW.md
   records as distinguishable at a glance already, and whether the beast should
   say so is a design call.

4. Art governance, and this is the one nobody asks for. Eleven hand-drawn
   assets are about to enter a project where every illustration is computed
   from a table. Nothing currently constrains a drawn asset to the token
   palette: the accessibility guard reads colours out of index.css, and SVG
   fill set as a presentation attribute is not forced by forced-colors.

   Write the rule. What colours a drawn asset may use, what the outline weight
   is, whether it may carry a fill that is not a token, and what mechanism
   checks it. A rule with no mechanism is a habit, and this project's whole
   method is to turn rules into mechanisms.

5. Blocking item 4, the forced-colors shadow. It is recorded as a conflict
   because both sides are right: a user setting says use my colours and a
   design decision says this shadow is what makes the system legible. The
   available fix is a forced-colors block that swaps the shadow for a second
   outline. V7 declined to take it inside an audit stage because it is a design
   decision. This is a design stage. Take it.

   It gets more expensive with every surface, and this log adds the two largest
   ones.

6. The wordmark scale, recorded as wrong since V3 and never fixed. DESIGN.md
   gives it 60 to 104px, which is a hero scale, and on the act screen it takes
   a permanent 100px band for a word that never changes. The timeline is about
   to compete for vertical space with it. Decide.

Verify: DESIGN.md carries all six decisions with reasoning, and its decisions
log has a row for each with the date. Report each decision, and for open
questions 5 and 7 report the alternatives considered rather than only the
answer, because those two have been open longest and the reasoning is the part
that will be re-litigated. Confirm no component changed and the suite is green.
```

## Stage 1 Report

_Pending._

---

# Stage 2 — The timeline, as the spine

```
The view that answers where am I and how much is left. Build stage 1's
decisions rather than this prompt's assumptions where they differ.

1. Seven stops, sourced. Every one traces to docs/SCIENCE.md Part 6 and no
   Needs source badge survives into a production build, which needsSourceGate
   enforces against the emitted bundle. The GOE stop keeps banded iron. The
   eukaryote stop is early aerobic eukaryotes, framed by metabolism rather than
   morphology. Two stops carry no date and get stage 1's treatment.

2. The marker, and it is discrete. It reads which act is running and moves at
   act boundaries. Nothing continuous is wired to position.

   Two reasons and both are load-bearing. The design doc says the timeline is
   not a progress bar, and a marker that slides with cumulative ATP is one
   however it is drawn. And React never re-renders at tick rate, which is the
   project's central architectural claim, and this is the largest always-on
   surface in the game.

   Assert the second one. A test that the timeline does not re-render across
   many ticks, in the same spirit as the poolIndex assertions Spine A added.
   This is the class of regression no value assertion can catch.

3. The admission rule, with real load on it for the first time. Timeline
   figures earn their place by metabolism, not morphology. NOW.md settled that
   on 2026-07-28 as the guardrail against drifting into the tree of life, and
   making the timeline the frame is exactly what raises the pressure it exists
   to resist.

   Write it where a future contributor will hit it: in the file that defines
   the stops, as a comment that says what disqualifies a candidate. Then check
   the seven against it and report any that pass only narrowly.

4. It is the spine rather than a second view, which is a layout problem before
   it is a component problem. It is on screen with the act, always, and the act
   screen already holds a top bar, eight pool cards, the pathway, an unlock
   shelf and a save panel. Something gives. Say what, and if the answer is the
   wordmark band then stage 1's decision on it is what pays for this.

5. Accessibility, from the start rather than in a later pass. The guard walks
   the component directory now, so this component is checked on the day it
   lands. Beyond contrast: it needs a heading and a landmark so it is reachable
   by structure, keyboard reachability, and an accessible name that states the
   reading rather than the legend, which is the rule V7 settled.

   The announcement question: an act boundary moves the marker and that is the
   most significant event in the game. Spine A already announces the boundary
   once. The timeline must not announce it a second time. Two announcements
   about one fact is the same defect as two copies of one fact in a save.

6. The bundle. Seven figures land here. Report the delta against V9's budget in
   this stage rather than at the end of the log, because the point of catching
   it early is catching it early.

Verify: seven stops render with the two undated ones reading as deliberate, the
marker moves only on act boundaries, and the no-re-render assertion passes.
Report the layout decision from step 4, the admission-rule check on all seven
stops, the accessibility results, confirmation that the boundary is announced
once in total, and the bundle delta.
```

## Stage 2 Report

_Pending._

---

# Stage 3 — The beast

```
The character, and the answer to open question 7. Read stage 1's resolution of
the motion collision before drawing anything.

1. Four states, each pinned to a simulation condition through the act
   descriptor rather than to a threshold hardcoded in a component. Spine A
   moved the walled-cell question into the descriptor precisely so this
   component can ask an act about itself rather than ask act 1 about NAD+.

2. The two rules, together, because they interact. The four states are React
   state and change only on discrete transitions. Anything continuous about the
   beast goes on the per-frame DOM write path PoolCard already uses. React
   never re-renders at tick rate.

   And it never animates on a timer. DESIGN.md already says this. A character
   that moves because time passed rather than because the cell changed is a pet
   with an engagement hook attached, which is docs/PILLARS.md rule 2 arriving
   through the door marked charm.

   Assert both: no re-render across many ticks, and no animation driven by
   anything except a state change.

3. Stage 1's second channel, built. Every state has to be distinguishable
   without motion and without colour. Test it the way V7 tested the redox axis:
   in greyscale, and under each of the three common colour vision deficiencies
   using the Machado matrices Chromium's own emulation uses. V7 measured 5.70:1
   or better for its second channel against a colour channel that peaked at
   1.58:1, and that is the standard to clear rather than an inspiration.

4. Open question 7, answered on the page and in the build. A solved act 1 shows
   0.00 on every net rate for fourteen minutes, and NOW.md's blocking item 2
   explicitly warns against counting a static addition as progress against it.
   So be careful about the claim.

   What the beast can honestly say: the quiet is legible. Sluggish is a picture
   of a cell holding steady rather than an absence of information. That is a
   real improvement and it is not the same as the gap being shorter. State it
   in exactly those terms and do not upgrade it.

5. The ATP sink question, which is the beast's other job and the harder one.
   DESIGN.md's argument is that the game produces a currency with no visible
   sink, which is what makes idle numbers feel weightless. A state readout is
   not a sink. Say plainly whether this log delivers that half or only the
   first half, and if only the first, say what the second would take. Do not
   let a well-drawn character stand in for an economic claim it does not make.

6. Accessibility. An accessible name that states the reading rather than the
   legend. No figure in the aria-label, because an aria-label has nowhere to
   put a badge and would be a quantitative claim with no provenance, which is
   the rule V7 settled on the carrier blob. Whether the beast joins the live
   region is a decision: it changes rarely, which argues yes, and it is a
   restatement of state announced elsewhere, which argues no.

7. Bundle delta for four assets, reported here.

Verify: four states, each distinguishable in greyscale and under all three
deficiencies at V7's standard, no re-render across ticks, no timer-driven
animation. Report the state-to-condition mapping, the second channel with its
measured numbers, the open question 7 claim in the careful form from step 4,
the honest answer to step 5, and the bundle delta.
```

## Stage 3 Report

_Pending._

---

# Stage 4 — Provenance on click

```
The feature that says which numbers are real. Four destinations, not three.

1. The four kinds, and get this right because the first version of the design
   doc got two of them wrong.

     Sourced     opens its docs/SCIENCE.md Part
     Tuned       opens its docs/ECONOMY.md row, which says DEPARTURE or
                   UNSOURCED. UNSOURCED is a divergence-table category and not
                   a badge, so this branch cannot be taken from the badge alone
     Contested   what is argued about, and who argues which side
     measured    this came from your own session, not from anywhere

   Contested is the one that was missing and it is the one that matters most
   later, because the act 3 log makes a contested-science beat a headline
   feature. The badge that carries the game's most interesting claim had
   nowhere to go.

2. How the content reaches the screen: authored, not bundled. Nothing in src/
   has ever read a doc at runtime. The ten tests that parse SCIENCE.md and
   ECONOMY.md use Node's file reader under Vitest, which never happens in a
   browser. And V9's content security policy permits zero network requests, so
   fetching is not available either.

   So the prose is authored under docs/CONTENT_STYLE.md, in the content
   directory Spine A created, and a guard parses both documents to prove every
   citation resolves. Same mechanism as disclosure.test.tsx, which parses the
   disclosure blockquote out of SCIENCE.md and fails the build if the game
   disagrees by a character, and divergenceTable.test.ts, which fails if a
   tuned scalar has no row. This is that pattern a third time.

3. The guard, and it does three things:
     - every cited SCIENCE.md Part name resolves to a real heading
     - every cited ECONOMY.md row id resolves to a real row
     - every figure carrying a badge has a provenance entry

   That third one is the important one. A badged figure with no entry should
   fail the build rather than open an empty panel, which makes provenance
   complete by construction rather than by diligence.

4. The interaction. It opens from the figure, it is dismissible, Escape
   returns focus to the figure that opened it, and it does not take focus
   unless the player asked for it. Overlay.tsx already holds all of that
   behaviour and the rules were settled by V7. Reuse it rather than
   reimplementing it.

5. What this feature is FOR, written into the report so it is not lost. Per
   docs/ECONOMY.md the thirty-seven tuned scalars are twenty-five DEPARTURE and
   twelve UNSOURCED, so for most numbers on screen the honest answer to "where
   does this come from" is a divergence row rather than a paper. The feature
   that says so is a better feature than one that pretends otherwise, and the
   temptation during implementation will be to soften the UNSOURCED case.
   Do not.

6. What is deferred and stays deferred: per-claim citation identifiers in
   docs/SCIENCE.md. That document has a flat topical bibliography and no
   per-claim anchors, so linking a figure to an exact passage is a refactor
   across 654 lines plus every call site plus a guard. It gets its own log. This
   feature cites a Part, which is honest about its own resolution.

Verify: all four destinations work, the guard fails the build on an unresolved
citation and on a badged figure with no entry, and focus returns correctly.
Report the four mappings, the three guard probes each broken deliberately and
quoted, the UNSOURCED wording as shipped, and the bundle delta.
```

## Stage 4 Report

_Pending._

---

# Stage 5 — The pool rail, and the viewport

```
Two smaller pieces of surface work, and one thing deliberately not done.

1. The pool rail reads the running act's pool table. Spine A made acts data and
   poolCards.ts already derives blob geometry from the conserved-weight table,
   so what is left is the grouping: which pools share a card and why.

   The rule stays what it is. Carrier pairs share a card because their sum is
   what is conserved and the sum is what teaches: NAD+ draining while NADH
   fills, on one card, is the wall arriving, and on two cards it is two
   unrelated numbers moving in opposite directions with the player left to join
   them up. Make that rule read the act's own table instead of act 1's.

2. What this stage does NOT do, stated as a decision rather than an omission:
   it does not regroup the rail for act 3's scale. Act 3's pools are not
   written down anywhere, docs/PROGRESSION.md gives act 3 eight unlocks and
   names no pools, and the design doc's own risk table defers act 3's
   compartment and gradient illustration rules to the act 3 log.

   A grouping designed against an imagined act 3 gets redesigned there anyway,
   so the cost is paid twice and the version in between is worse than either.
   Report this as a deliberate deferral so nobody reads it as forgotten.

3. The viewport story. The act screen now carries a top bar, the timeline as a
   permanent spine, eight pool cards, the pathway, an unlock shelf, the beast
   and a save panel. That is a lot, and until now the layout has never been
   under real pressure.

   Decide what happens as width comes down, and decide it by what the player
   loses rather than by what fits. The timeline answers where am I. The pool
   cards answer what is happening. The pathway answers why. Something is least
   load-bearing at 400px and naming which is the actual design work.

4. Reduced motion, across everything this log added. The rule is that nothing
   is encoded in movement alone, and V7's implementation is the standard: a
   running reaction is a solid dark track with a filled arrowhead reading a
   rate, and a stopped one is a thin grey hairline with a hollow head reading
   0.00. Whatever the timeline and the beast do in motion, they say in a second
   way when motion is off.

5. Full accessibility pass over every new surface, now that the guard walks.
   Contrast, keyboard, focus order with the timeline in the layout, and the
   screen reader path. Report the announcement count across a full act against
   V8's sixteen. If the number has grown a lot, the new surfaces are narrating
   rather than announcing, and that is a regression against the line V7 drew.

Verify: the rail reads the running act, the layout holds at every breakpoint
tested, reduced motion covers the new surfaces, and the accessibility guard is
green over all of them. Report the breakpoint decisions with what is lost at
each, the deliberate deferral from step 2, and the announcement count against
sixteen.
```

## Stage 5 Report

_Pending._

---

# Stage 6 — Coherence, and the documents

```
Close the log out. No new surface.

1. Full verify: npm run typecheck, npm run lint, npm run build, npm test,
   npm run sim, npm run sim:act1, npm run offline:validate, and the headless
   playthrough Spine A added. Report the test count against V11's.

2. The bundle, against V9's budget, with the three-way breakdown that budget
   was built to give: application code, fonts and dependencies. Eleven
   hand-drawn assets landed in this log and the budget existed for exactly this
   moment. If it was exceeded, say by how much and what was cut, and do not
   quietly raise the ceiling. Raising it is an edit somebody has to justify,
   which is the whole point of having one.

3. Confirm no simulation change. This log is surface work: git diff across
   src/sim/, src/content/ except content strings, the three tuning files,
   docs/SCIENCE.md and docs/ECONOMY.md should be empty, and both canonical
   hashes unmoved. A visual log that moved a hash changed the simulation by
   accident.

4. Update DESIGN.md's decisions log with anything stages 2 to 5 settled that
   stage 1 did not anticipate. Implementation finds things design does not, and
   V6 and V7 both record cases where the shipped build corrected the document.
   NOW.md names the pattern: the parts of a document derived from the shipped
   build have held and the parts that were chosen have not.

5. Update NOW.md:
   - Status: what the game now looks like, in one sentence, the way each log
     has led.
   - Build state table: V12 done, with its "does not" column.
   - A "What the spine does" section covering the timeline and the beast.
   - Open questions 5 and 7: both closed by stage 1, with how. Blocking item 4
     closed if stage 1 took it. Strike them through rather than deleting them,
     the way item 1 was struck, because the reasoning is the useful part.
   - The beast and open question 7, in the careful form stage 3 was told to
     use. It makes the quiet legible. It does not make fourteen minutes
     shorter. Blocking item 2 does not close here and NOW.md should say why in
     its own words.
   - The art governance rule from stage 1, and whether any drawn asset needed
     an exception.
   - The bundle figures.
   - "Next, in order": V13, the act jump. And the open act ordering decision,
     which is still open and still does not block anything before V14.

6. Say what the game still cannot do, plainly. It has a spine, a character, a
   timeline and provenance, and it has one act. That is the state this log
   leaves the project in and it is a strange one: the connective tissue for
   four acts, wrapped around one. Say it, because it is the thing a reader of
   NOW.md would otherwise have to work out.

Verify: everything green, no canonical hash moved, the bundle inside its budget
or the excess justified. Report the test count, the three-way bundle
breakdown, the empty simulation diff, the DESIGN.md decisions-log additions,
and the NOW.md diff summary.
```

## Stage 6 Report

_Pending._

---

# After These Stages

- **The two elements `DESIGN.md` says supply the game's meaning exist.** Both were cut in V3 and neither was ever rescheduled, and the interface has spent nine logs being the design working exactly as specified with both of its connective elements removed.
- Two open questions from 2026-07-28 are closed, and the second one was closed by connecting two things the same document already contained. The beast's state table was always the answer to the equilibrium question. They were filed in different sections and nobody had joined them.
- The game will tell you, on demand, which of its numbers are measured, which are tuned for pacing, and which have no real counterpart at all. **Every science game claims accuracy. This is a different claim and it is a harder one to make.**
- Eleven hand-drawn assets entered a project where every illustration was computed from a table, under a governance rule written before the first one was drawn and a size budget built one log earlier for this exact moment.
- The accessibility guard covered every new surface on the day it landed, which was not true for nine of the twenty components already in the tree before Spine A widened it.
- **And the game still has one act.** The spine is built for four. That is the strange state this log leaves behind and it is the right one to be in, because everything after this is content going into a frame that already fits it.
