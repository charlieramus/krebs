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

`DESIGN.md` is the only file that changed. Six decisions, eight decisions-log rows, two open questions struck through and two entries in "What turned out to be wrong" answered. 632 tests green, `tsc --noEmit` clean, `eslint .` clean, and `git status` reports one modified file.

**One thing to note before the six.** `npm run typecheck` was failing on a clean checkout at the start of this session, 26 errors, all of them `Cannot find module '@playwright/test'` and its knock-on implicit-`any` errors across `e2e/` and `playwright.config.ts`. `@playwright/test` is in `devDependencies` and was not in `node_modules`. `npm install` added 3 packages and typecheck went clean. No source file was touched and `package-lock.json` is unchanged, so this was an incomplete install in the environment rather than a defect in the repository. Recorded because a green typecheck below would otherwise be reporting something that was red an hour earlier.

### 1. Open question 5, the undated stop

Open since 2026-07-29, when the sourcing pass closed it as a sourcing question and reopened it as a design one.

**The answer is that an undated stop is not a missing date.** A date is a point and says this happened then. What is known about oxygenic photosynthesis and about the alkaline vents is an ordering constraint, and in both cases a one-sided one. Oxygen production must predate atmospheric accumulation, so the photosynthesis stop is below the GOE and nothing bounds how far below. The vents, if the hypothesis is right, precede the earliest evidence of life, and nothing bounds how far before. **Both are one-sided in the same direction and that is a result rather than a coincidence: a stop is undated precisely because one side of it has no evidence.**

Three substitutions, no fourth channel:

```
  the date column    a word where a figure would be, at the figure's own size
                     and weight. `unresolved` or `hypothesis`
  the spine mark     a bracket instead of a node, spanning what the ordering
                     constraint allows, capped at the bounded end and running
                     off the open end without a cap
  the card position  tucked under the cap, at the only end that is known.
                     Never centred in the span
```

**Nothing in the treatment is dashed, dimmed, italic or grey, and that is the whole design.** This system already owns a vocabulary for unfinished and uses it on unbought slots and on the `Needs source` badge. These are the two stops where the sourcing was done hardest, so borrowing that vocabulary would say the work was not done. The open end of the bracket is what carries the reading: a capped bracket says "somewhere in here", an uncapped one says "no later than this, and we do not know how much earlier".

The two words are held apart deliberately. `unresolved` says the event happened and its start is not known. `hypothesis` says the thing may not be a dated event at all. The sourcing pass separated two uncertainties that had been compressed into one number and a single word for both would recompress them one layer up.

**The alternatives, since this entry was open longest and the reasoning is what gets re-litigated.**

```
  a blank cell                   reads as data not yet entered. It is also
                                 what the code produces by default, which is
                                 why it had to be rejected explicitly

  a question mark or ellipsis    a punctuation mark standing in for a
                                 sentence. Reads as an error state, and it is
                                 the glyph a broken build shows

  a dimmed, italic or grey       THE ONE THE DESIGN NEARLY TOOK. Every
  date-shaped placeholder        weakening treatment says "less than a date",
                                 and these stops are not less sourced

  a central estimate with a      rejected outright. It restores a number
  wide error bar                 through the back door, and the number is the
                                 one the 2015 contamination result removed

  a separate undated section     solves placement by deleting the ordering
  at the foot of the column      information, which is the part that IS known
```

### 2. Open question 7, and the collision it creates

Open since 2026-07-29. **Closed by connecting two things `DESIGN.md` already contained**, in two sections, one written the day before the other.

The question asks what distinguishes holding at a high rate from stopped. The beast's state table has said Lively is high flux and Sluggish is flux near zero since 2026-07-28. Question filed under Open questions, answer filed under a character design, never joined.

**The join is real rather than verbal, and the reason is which quantity the beast reads.** Every pool card shows a net rate by construction, and a net rate is genuinely the same 0.00 whether a lot is happening steadily or nothing is happening at all. The beast reads gross throughput, which is the quantity that differs. That reading exists nowhere else on the screen.

**The claim is written in the careful form and stage 3 is told to hold it there.** The quiet becomes legible. The quiet does not become shorter. NOW.md blocking item 2 does not close, and this document now says so in the open-question entry itself so a later reader cannot take the strike-through as closure of both.

**The collision, and it is the real work.** `DESIGN.md` proposes motion for three of the four states. V7 widened the accessibility rule to ban movement or colour alone. So each state needs a channel that is neither, decided here rather than found in stage 3.

**The second channel is the stroked silhouette.** Each state is distinguishable from the other three with every fill removed:

```
  Lively    upright, mid-stride, one leg forward, body off its own centre of
            balance. Eyes two open rings, mouth an open curve
  Sluggish  both feet planted and splayed, body compressed vertically and
            sitting on its base. Eyes two horizontal rules, mouth a flat rule
  Sick      the silhouette itself broken, cracks cutting the outline rather
            than painted across the fill. Crossed strokes for eyes
  Powered   upright and mid-stride, plus one closed sub-outline inside the
            body. A change in the topology of the drawing, not a mark on it
```

**Posture is not motion.** A figure drawn mid-stride does not move. It reads in one frame, in greyscale, under every deficiency, because it is a difference in where the ink is. The rule distinguishes information carried by change over time from information carried by shape, and a frozen stride is the second.

**The V7 precedent held: the second channel is truer than the first.** "Desaturated fill" says the cell is somewhat less. A compressed body sitting on its own base says it has stopped, which is what is true, and it says it without asking anyone to compare two greens. Sick's cracks cutting the outline rather than colouring the fill is the same move, and it is closer to what illustration rule 5 was reaching for. Powered is the strongest of the four: a closed sub-outline inside a closed outline is a compartment, nothing else in the illustration language has one, and act 3's entire subject is that a compartment appeared.

**Alternatives considered.** A texture or hatch overlay per state, rejected on the same two grounds V7 rejected texture for redox: illegible at the size the beast is drawn, and it introduces vocabulary this system does not have. A badge or label beside the beast, rejected because a caption is not a second channel, it is a replacement for the picture. Faces alone, rejected as insufficient: open, closed and crossed eyes separate three states but Lively and Powered have the same face, and the face is the smallest part of the drawing.

**What is explicitly not claimed:** whether a slumped blob READS as a cell holding steady. Distinguishability is arithmetic and stage 3 measures it. Meaning needs a reader, and `contentStyle.test.ts` and the Accessibility section both already refuse to fake that class of question.

### 3. The four states, pinned to conditions

```
  Lively    the running act's gross throughput measure is at or above the
            act's lively threshold
  Sluggish  below it. Includes the walled cell AND the starved cell
  Sick      the running act reports active damage.  unreachable in act 1
  Powered   the running act has a compartment.      unreachable in act 1
```

**The condition lives in the act descriptor, which is what Spine A moved the walled-cell question there for.** The beast asks an act about itself, never asks act 1 about NAD+. A threshold in the component is a component that has to be edited when act 2 lands, and this project has already watched that produce nine components the accessibility guard did not know about. The thresholds are tuned numbers with no biological counterpart, so they are docs/ECONOMY.md rows under hard rule 2 and stage 3 adds them.

**A discrete state driven by a continuous quantity needs a dead band, and this is the finding stage 3 would otherwise have made the hard way.** A bare threshold on a quantity that wanders across it makes React re-render at whatever rate the quantity wanders, which is the exact defect the discrete-state rule exists to prevent. Hysteresis: the level that turns Lively on sits above the level that turns it off. Without it the discrete channel is a continuous one with extra steps.

**The fourth state is Powered and it is for act 3. Act 1 reaches two of the four**, which is not a gap: two readings is exactly what open question 7 asks for, and the table was written for four acts on the day the four acts were named.

**No fifth state for starvation, and this was the actual question step 3 asked.** The beast is a readout of one quantity, not a diagnosis of its cause. A walled cell and a starved cell are both stopped, which is what the beast says, and which one it is sits on the pool cards where the cause lives: an empty `glucose_env` card is starving, a drained `nad` card is walled. **The beast says the cell has stopped, the rail says why.** A fifth state means a state per cause, and then the table is an error message list and the character is a status bar with legs.

The timing argument is decisive on its own. Act 1's environment empties at 93m07s and act 1's authored ending fires on the tenth purchase at about 54m03s, both from NOW.md's act 1 block. **Starvation is a post-content condition**, reached roughly forty minutes after the game has told the player the act is over. That is the wrong place to spend the first hand-authored art in the project.

### 4. Art governance

A new top-level section, `Hand-authored art`, written before the first asset. Four clauses and one mechanism.

```
  1  tokens only, and by reference   var(--color-*), none, or currentColor.
                                     No hex literal, no rgb(), no keyword
  2  ink carries the reading         every asset legible with all fills
                                     removed
  3  one stroke band                 stroke-width 3 to 3.5, linejoin round,
                                     so drawn and computed art cannot be told
                                     apart by weight
  4  nothing already forbidden       no gradient, blur, filter, raster, or
                                     opacity below 0.85
```

**Clause 1 is by reference rather than by value and that is the load-bearing part.** A literal that happens to equal a token is untraceable; a `var()` is one name a `forced-colors` block can redirect for the whole set at once, and it makes a palette change move the art instead of letting the art diverge silently.

**The mechanism.** Assets live in one directory and a guard walks it, which is the discovery posture Spine A gave the accessibility and content guards after nine components had shipped past a hardcoded list. It reads token names out of `index.css` using the same parse `designSystem.test.ts` already does, and fails on any colour literal, any stroke weight outside the band, any asset with no stroked path at all, and any of clause 4. The dependency runs DESIGN.md to `index.css` to the art.

**Why the section exists at all.** Every illustration so far is computed, so it inherits the palette and the accessibility guarantees for free and cannot name a colour it should not, because it never names a colour. Eleven drawn assets inherit none of that: the accessibility guard computes contrast pairs from `index.css` and component classes, an SVG `fill` presentation attribute is neither, and `forced-colors` does not force `fill`. **A drawn asset is the one thing in this game that can leave the palette and ignore a user's colour setting at the same time, quietly, in a file nobody diffs.**

### 5. Blocking item 4, the forced-colours shadow. Taken

**The defect restated precisely:** forced colours removes the shadow without removing it. `box-shadow` is not forced, so `4px 4px 0 ink` keeps painting a near-black copy of the shape onto a forced background it cannot be seen against, while every layout that reserved room for the offset still reserves it. The result is not the design and it is not the user's colours either.

**The decision is substitution, not removal**, which is the same move the undated stop makes. Under `forced-colors: active` the offset shadow is dropped, the reserved offset is released, and a second rule is drawn outside the card's own border in `CanvasText`, inset by the same 4px the offset used. What the shadow says is "this is a separate piece of paper above the page", and a second outline says it in the one channel forced colours guarantees.

**V7's decision to draw the focus indicator INSIDE is what makes this affordable.** The focus ring is at `outline-offset -6px` and this rule is outside the border, so they never collide and a focused card under forced colours reads as separated and focused at once. Had focus been an outer ring, this fix would have had to fight it. Two constraints recorded so they are not rediscovered: the outer rule is a pseudo-element, because `outline` is spoken for by `:focus-visible` and an element has one; and the ink shadow token is switched off rather than overridden with a system colour, because a shadow in a system colour participates in a palette it was never designed against.

**Deviation from the prompt, stated plainly.** Step 5 says "This is a design stage. Take it." Step 1 of the same prompt says "No component is written", and the Verify line asks for confirmation that no component changed. So stage 1 takes the decision and specifies it to the CSS, and the `src/index.css` block that implements it lands in **stage 5**, whose prompt is the full accessibility pass over every surface. NOW.md's blocking item 4 is therefore struck in stage 6 only if stage 5 actually shipped it. Nothing about the decision is left for stage 5 to make.

### 6. The wordmark scale

Recorded as wrong since 2026-07-29 and untouched by four logs, because the fix is a design decision and none of them had a design stage.

**The hero scale is right and it is on the wrong surface.** On the act screen the wordmark is chrome: a word that never changes, taking a permanent 100px band, the largest thing on screen at all times, next to a number that moves twenty times a second. **The largest type in the game should be the thing that changes rather than the thing that never does**, which is Direction's own flux-is-the-headline applied one level up.

The scale gains an entry rather than losing one. `wordmark cmp`, 17 to 20px, Fredoka 600, tracking -0.02em, same face and weight so it is the same mark. The hero scale stays and is reserved for the first run card and the endgame summary, the two surfaces where the wordmark is genuinely a title. Neither is on screen while the game is being played.

**What pays for the timeline is this decision**, which is what step 4 of stage 2 will point at. Roughly 80px of vertical band returns to the top bar and goes into the column. The alternative was taking it from the pool rail or the pathway, which answer what is happening and why. And open question 1 is still open: a word at 100px is a commitment to a name, a word at 18px is a label.

### Verify

```
  DESIGN.md carries all six decisions with reasoning      yes
  decisions log has a dated row for each                  8 rows, 2026-08-09
                                                          (four for the beast
                                                          decisions, which are
                                                          four separate calls)
  open questions 5 and 7 struck through with the answer   yes
  no component changed                                    git status: 1 file
  npm test                                                632 passed, 49 files
  npm run typecheck                                       clean
  npm run lint                                            clean
```

Also updated inside `DESIGN.md`: the Status block at the head now says a design pass landed and is not yet implemented; the wordmark entry in "What turned out to be wrong" is struck with the reason it survived four logs; and the "Nothing here covers the empty screen" entry is answered in place rather than deleted, because the useful part of it is that one document held an answer and an open question about the same thing for eleven days of build logs without noticing.

**No number in this stage entered player-facing text, no tuned scalar moved, and `docs/SCIENCE.md` and `docs/ECONOMY.md` are untouched.**

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

The timeline is on screen with the act, always. Seven stops, a discrete marker, the first seven hand-drawn assets in the project's history and the guard that governs them. 707 tests across 51 files, up from V11's 632 across 49. `tsc --noEmit` clean, `eslint .` clean, production build green and inside every budget line.

```
  src/ui/timeline.ts                the seven stops, the admission rule, the
                                    marker mapping. No string in it
  src/ui/content/timeline.ts        every player-facing word, with its badge
  src/ui/art/                       README, ArtFrame and seven figures
  src/ui/components/Timeline.tsx    the component
  src/ui/__tests__/timeline.test.tsx  19 tests
  src/ui/__tests__/art.test.ts        56 tests, the seventh guard
  src/App.tsx                       two columns to three
  src/ui/components/TopBar.tsx      the compact wordmark, stage 1's decision
  src/index.css                     --text-wordmark-compact
  src/ui/components/Pill.tsx        an aria-label prop, for the marker
  src/ui/__tests__/keyboard.test.tsx  reading order, now five regions
```

### 1. Seven stops, sourced

Every one traces to `docs/SCIENCE.md` Part 6 except the present, which is not a claim about the record. The GOE stop keeps banded iron. The eukaryote stop is early aerobic eukaryotes, framed by metabolism.

```
  stop             date               badge      surface   figure
  ---------------  -----------------  ---------  --------  ----------------
  now              Now                Tuned      white     ModernCell
  eukaryotes       ~1.7 to 1.5 Ga     Sourced    mint      AerobicEukaryote
  endosymbiosis    ~2.2 to 1.5 Ga     Contested  lilac     Endosymbiosis
  goe              ~2.4 to 2.0 Ga     Sourced    pink      BandedIron
  photosynthesis   unresolved         Contested  lilac     Cyanobacterium
  mats             ~3.48 to 3.43 Ga   Sourced    sky       MicrobialMat
  vents            hypothesis         Contested  lilac     VentChimney
```

**No `Needs source` badge anywhere on the view**, asserted in the suite and enforced against the emitted bundle by `needsSourceGate`, which the production build ran clean.

**One badge per stop, and it is not a softening.** `docs/CONTENT_STYLE.md` Part 4 rule 2 says a paragraph carrying two claims *whose provenance differs* is two entries with two badges. On this view the provenance does not differ inside a stop: the date and the one-line reading come from the same Part 6 entry, and where the date is contested the reading is contested by the same argument. The 2.7 Ga figure and the sentence saying when it began is not known are one finding, not two.

**The citations resolve against the document rather than against a list**, the same mechanism `teaching.test.tsx` uses on coach mark source rows. Six of the seven carry a `docs/SCIENCE.md Part N` citation and the test asserts the count is six, so the seventh cannot quietly acquire one or lose it.

### 2. The marker, and the assertion that nearly did not work

`markerStopId(act: number)` is the whole mapping. **Its signature is the proof**: it takes an act number and nothing else, so it cannot read cumulative ATP, elapsed time or a pool level, because it is not given one. Act 1 to mats, 2 to goe, 3 to endosymbiosis, 4 to eukaryotes, and null rather than a wrong stop for anything else.

**The no-re-render assertion is made twice, from two directions.**

```
  markup identity   render the Timeline through a provider at tick 0 and at
                    200000 ticks and compare byte for byte, with a probe in
                    the same tree printing snapshot.tickCount so a difference
                    is provably visible to the harness
  source-level      the module names none of useLive, useLiveNode,
                    useSnapshotEffect or .subscribe(, guard-the-guarded
                    against PoolCard.tsx, which uses them
```

**The first version of the markup test could not have failed, and the probe is what found that.** It built a runtime, drove it 200000 frames, then rendered through `RuntimeProvider`, which builds its **own** runtime and ignores the one the test aged. Both sides were a fresh cell at tick 0. Planting `useRuntime().snapshot.tickCount` into the component's heading passed it. The fix is a `Driver` component rendered inside the provider, which advances the runtime the tree is actually rendering against, and React renders children in order so it lands before `Timeline`.

Re-probed after the fix and it fails as it should:

```
  AssertionError: expected '<section aria-labelledby="_R_2_" clas...' to be
                  '<section aria-labelledby="_R_2_" clas...'
  Expected: ...text-ink">Deep time0</h2>...
  Received: ...text-ink">Deep time4001</h2>...
```

**The two assertions are complementary rather than redundant, which the probe also demonstrated.** The planted violation used `useRuntime().snapshot` directly, which the source-level check does not name and did not catch. The markup check did. A source scan cannot enumerate every route to a snapshot; a markup comparison does not care which route was taken.

### 3. The admission rule, and three stops worth reporting

Written in `src/ui/timeline.ts`, in the file somebody edits when they want to add a stop, as four things that disqualify a candidate: it is on the list for being an interesting looking organism, its claim is about what a cell looked like rather than what it did, the metabolism it names connects to no pathway the player runs, or it needs a date the record does not support. A test asserts the rule is still in that file and still names the two stops Part 6 rejected under it.

Checked against all seven. Four pass cleanly: vents on chemiosmosis, photosynthesis on oxygen production, GOE because banded iron is the physical record of biological oxygen meeting dissolved iron, endosymbiosis because it is the act 3 transition. **Three do not pass cleanly and all three are reported rather than waved through.**

```
  eukaryotes   PASSES ONLY ON THE REFRAME. docs/SCIENCE.md Part 6 stop 6 says
               it "fails as drafted, passes if reframed". Eukaryotic identity
               in the Proterozoic record is inferred from cell size, wall and
               ornamentation, and every one of those is morphology. It is on
               the view because the same fossils sit almost entirely in
               oxygenated bottom water. The figure still draws the
               ornamentation, because that is what was found, and the card
               carries the oxygen dependency, because that is why it counts

  mats         NARROW. The mats themselves are morphology. What earns the
               place is the anoxygenic phototrophy on the card, and Part 6 is
               explicit that no physiological inference follows from
               stromatolite structure on its own

  now          DOES NOT PASS, AND IS NOT MEANT TO. It is not a claim about the
               record at all. It is where the cell the player is running ends
               up, so it carries a Tuned badge saying it is a statement about
               this build, and it is the one stop with no Part 6 entry behind
               it. Reported as a deliberate exemption rather than a pass,
               because a reader counting seven sourced stops would be counting
               one too many
```

### 4. The layout, and what gave

**The timeline is the first of three columns.** Left to right is where am I, what is happening, why: deep time, the pools, the pathway. `lg` gives it 14rem and `xl` 16rem, and the column is sticky and height-bounded so it scrolls inside itself rather than making the page taller than the act.

**What paid for it, in order of size.** Stage 1's wordmark decision, which returned a permanent band of the largest type in the game spent on a word that never changes. Then one rem off the pool rail, 17 to 16 at `lg`, restored to 17 at `xl`. **The pathway, the unlock shelf and the save panel keep every pixel they had**, because the pathway is the surface that answers why and the shelf is where the act's content lives.

Below `lg` everything stacks in one column, as it already did, and the timeline stays vertical there. Down is older is the whole of its reading and a horizontal timeline is a different component. Stage 5 owns the narrow end.

### 5. The undated stop, built

Stage 1's treatment, implemented literally.

```
  date column    the word set in the same face, size, weight and colour a real
                 range is set in. No italic, no grey, no brackets, no dim
  spine mark     a horizontal ink cap tick at the bounded end, and a 6px ink
                 bar running down from it past the next stop, ending without a
                 cap. Clipped by the list's own overflow, which is what draws
                 the running-off
  card           not dashed, not dimmed. Identical treatment to a dated stop
                 except for its lilac surface, which it has for being contested
```

**The contrast the design turns on is on the same screen and is asserted.** `border-dashed` appears exactly once in the rendered markup, on the locked `now` card. Dashed means unfinished here, and no undated stop is dashed.

**One thing stage 1 did not specify and this stage decided: the bracket's length carries nothing.** It cannot be drawn to scale because the thing at its far end is exactly what is not known, and a length that varied per stop would imply a measured extent. It is a fixed overhang and the reading is the missing cap. Recorded here and folded into `DESIGN.md` in stage 6 per that stage's step 4.

### 6. The art, and the seventh guard

Seven figures plus `ArtFrame`, which declares the viewBox, the stroke weight, the round join and `aria-hidden` once rather than seven times. Every asset is `aria-hidden` and carries no `<title>`, because the card carries the name and a `<title>` inside an asset would be a player-facing string outside `src/ui/content/`.

`src/ui/__tests__/art.test.ts` is the seventh guard and it enforces stage 1's four clauses:

```
  clause 1  every fill, stroke and stop colour is var(--color-X) naming a
            token index.css defines, or none, or currentColor
  clause 2  every asset draws at least one shape with fill none, and reaches
            ink. The cheapest proof the outline is doing work
  clause 3  no stroke weight outside 3 to 3.5, and the frame sets the band
  clause 4  no gradient, filter, blur, raster, or opacity below 0.85
```

**Probed rather than trusted.** A hex literal planted in `BandedIron.tsx`, replacing `var(--color-loss)` with the identical `#E8503C`:

```
  FAIL src/ui/__tests__/art.test.ts > clause 1: tokens only, and by reference
       > 'BandedIron.tsx' names no colour outside the token set
  + "fill: not a token reference: #E8503C"
```

**A literal that equals a token is still a violation and that is the point of clause 1.** `#E8503C` is exactly what `--color-loss` resolves to, and it is rejected anyway, because a literal is untraceable and cannot be redirected by the `forced-colors` block stage 5 will add. Reference rather than value is what makes one edit reach the whole set.

The guard also reads its token names out of `index.css` rather than from a list, so the dependency runs DESIGN.md to `index.css` to the art, and it asserts its own walk against the directory listing. One check found its own hole during writing: the `<title>` scan matched `ArtFrame.tsx`'s header comment, which explains why there is no title element by naming one. Comments are stripped now, the same way `designSystem.test.ts` and `contentStyle.test.ts` strip theirs.

### 7. Accessibility

```
  landmark      <section aria-labelledby> pointing at its own <h2>, so it is
                reachable by landmark AND by heading. Asserted that the two ids
                are the same rather than merely present
  keyboard      the list is tabIndex 0, because it scrolls, and Firefox does
                not add that tab stop for us. No positive tabindex anywhere,
                so DOM order is still tab order
  reading order header, timeline, rail, shelf, save panel, asserted
  the name      the marker's accessible name STATES THE READING: "You are here.
                Microbial mats." The visible words are inside it, so the label
                is still contained in the name and 2.5.3 holds
  undated       the constraint, not the absence. "When this began is
                unresolved. It sits below the stop above it and nothing bounds
                it below." Never "no date"
  axis          the non-linear compression is disclosed on the view itself
```

**The boundary is announced exactly once in total, and it is asserted from both ends.** `Timeline.tsx` contains no `aria-live` and the rendered markup contains none, and `ACT1_ANNOUNCEMENT_COUNT` is unmoved at 17, still computed from the ladders rather than written down. Two announcements about one fact is the same defect as two copies of one fact in a save.

**One existing test broke and it broke in the useful way.** `keyboard.test.tsx` located the unlock shelf as the first `<section` in the markup, which was true for exactly as long as the shelf was the only section on the screen. It finds the shelf by its own heading now, so a fourth section landing above it moves nothing. That is a hardcoded-list defect of the same family Spine A found in the accessibility guard, at a smaller scale.

### 8. The bundle, reported here rather than at the end

```
                              before      after      delta   budget
  application (apportioned)   75.28 kB   81.43 kB   +6.15    130.00 kB
  dependencies (apportioned) 215.42 kB  217.32 kB   +1.90    230.00 kB
  fonts                       68.86 kB   68.86 kB    0.00     72.00 kB
  styles                      19.57 kB   21.19 kB   +1.62     32.00 kB
  other                        3.85 kB    3.85 kB    0.00          -
  total                      382.98 kB  392.65 kB   +9.67    460.00 kB

  emitted JS                 290.70 kB  298.76 kB   +8.06
  gzipped JS                  89.97 kB   92.19 kB   +2.22
```

**Seven figures, a component, a stop table, a content file and a wordmark token cost 9.67 kB, of which the drawn assets are a small part.** The apportioned dependency figure moved by 1.90 kB without a dependency being added, which is the apportionment doing what its header says it does rather than React growing: the ratio shifts when application modules are added. The total figure is exact and it is the one to read.

**Four figures remain for stage 3 and the trend is the thing to watch, not this number.** At 9.67 kB for seven, the remaining four plus a beast component should land under 6 kB, and application has 48.57 kB of headroom. Nothing here needs the ceiling raised.

### Verify

```
  seven stops render, two of them reading as deliberate     yes, 19 tests
  the marker moves only on act boundaries                   asserted, probed
  the no-re-render assertion passes                         yes, and it failed
                                                            correctly when probed
  npm test                                                  707 passed, 51 files
  npm run typecheck                                         clean
  npm run lint                                              clean
  npm run build                                             clean, budget green
```

**No simulation change.** Nothing under `src/sim/` or `src/content/` was touched, the three tuning files are untouched, and `docs/SCIENCE.md` and `docs/ECONOMY.md` are untouched. Both canonical hashes are unmoved, which the determinism tests assert on every run.

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

The cell has a face. Four states, three transitions across a whole act, no timer anywhere, and the second channel measured at **9.03:1 worst against a colour channel that peaks at 1.68:1**. 781 tests across 53 files, up from stage 2's 707 across 51. Typecheck, lint and build all clean.

```
  src/content/acts.ts                     ActVitality, and vitality() on the
                                          descriptor. Act 1 answers it
  src/ui/runtime.ts                       snapshot.vitality, beside walled
  src/ui/art/Beast{Lively,Sluggish,       four drawings
                   Sick,Powered}.tsx
  src/ui/content/beast.ts                 four readings, no number in any
  src/ui/components/Beast.tsx             the component
  src/ui/components/Timeline.tsx          the beast on the marker row
  src/ui/__tests__/beast.test.tsx         46 tests
  src/ui/__tests__/beastPacing.report.test.ts  4 tests, the transition count
```

### 1. Four states, pinned through the descriptor

```
  lively    the act's gross throughput is at or above the stopped threshold
  sluggish  below it. Covers the walled cell AND the starved cell
  sick      the act reports active damage.       unreachable in act 1
  powered   the act has a compartment.           unreachable in act 1
```

**The act answers the question, on exactly the terms `isWalled` set.** `ActDescriptor.vitality(amounts, appliedFlux, stoppedFlux, previous)` is a predicate rather than a threshold, for the reason Spine A gave: a field called `livelyPayoffFlux` would be act 1's answer wearing a general name, and act 2's Sick is not a flux at all. The component asks an act about itself and never asks act 1 about NAD+.

**The reading is on the snapshot rather than called from the component**, beside `walled` and at the same cost: one array read, no allocation, no lookup. That keeps the threshold in one place, which turns out to be the whole of the next paragraph.

**No new tuned number, and this is the finding of the stage.** The lively boundary is `ZERO_FLUX_THRESHOLD`, the number the pathway arrows already use to decide whether to draw themselves as moving, and which `runtime.ts` already shares with the stall detector because "if the stall detector and the arrows disagreed, the coach mark could open while the arrows still looked alive". **The beast joins that agreement rather than bringing a third value.** One threshold, three readings, nothing that can drift.

**That resolves a conflict between stage 1 and stage 6, and it resolves it in stage 6's favour without giving anything up.** Stage 1 wrote that the beast's thresholds are tuned numbers owing `docs/ECONOMY.md` rows. Stage 6 step 3 requires `docs/ECONOMY.md` and the three tuning files to have an empty diff for this whole log. Both would have been true and they would have contradicted each other. There is no new tuned scalar, so there is no row to owe and no conflict left. `docs/ECONOMY.md` is untouched.

**Act 1 cannot reach Sick or Powered at any input**, asserted over the whole flux range from 0 to 40 in steps of 0.05 rather than at two points, because the claim is that no input reaches them.

### 2. The two rules, and the dead band that measurement removed

**Three transitions across 84000 frames.** Measured over a full 70 game-minute act with all ten purchases made:

```
  the beast across 70 game-minutes of act 1

    frames driven          84000
    purchases made         10
    state changes, bare    3
    state changes, banded  3   off level at half the on level
    reached lively         true
    reached sluggish       true
```

The three are the pathway starting, the NAD+ wall, and fermentation recovering it. That is the game's own shape, which is the right answer: the beast changes when the cell does.

**Stage 1's dead band is not built, and that is a measurement rather than a shortcut.** Stage 1 reasoned that a discrete state driven by a continuous quantity needs hysteresis or the quantity wandering across the threshold re-renders React at whatever rate it wanders. Correct in general and false here: a band with the off level at half the on level produces **exactly the same 3 transitions**, because act 1 does not wander across this line. The wall takes the payoff flux from about 7 to 0 inside a couple of ticks and fermentation brings it back the same way.

`previous` stays in the interface signature so an act whose measurement comes out differently can use it without touching a caller, and act 1's implementation **omits the parameter entirely**, which is the clearest available statement that its reading does not depend on its own last answer. The report test fails if the two counts ever disagree, so the day act 2 makes them disagree is the day this gets revisited rather than the day somebody notices a stutter. **`DESIGN.md` is corrected in stage 6 per that stage's step 4**, which exists for exactly this.

**No animation from anything except a state change.** Asserted across `Beast.tsx` and all four drawings, comments stripped: no `setInterval`, no `setTimeout`, no `requestAnimationFrame`, no `animate(`, no `@keyframes`, no animation or transition utility. Guard-the-guarded against `PathwayArrow.tsx`, which drives flowing dashes at a rate proportional to applied flux and trips the same patterns, because that is motion carrying information and is correct.

**Nothing continuous, which makes the per-frame DOM write path unnecessary rather than unused.** The log's constraint is that anything continuous goes on the path `PoolCard` uses. There is nothing continuous: the beast is four pictures and a name, so it writes to no DOM node at all. That is the strongest form of both rules rather than a way around one.

### 3. The second channel, measured

```
  the beast's two channels, measured

    lively vs sluggish fill, normal        1.67:1
    lively vs sluggish fill, greyscale     1.67:1
    lively vs sluggish fill, protanopia    1.65:1
    lively vs sluggish fill, deuteranopia  1.68:1
    lively vs sluggish fill, tritanopia    1.67:1
    lively vs powered fill, every viewing       1.00:1   the same token

    worst ink on the lively body, any viewing   15.13:1
    worst ink ANYWHERE, any viewing              9.03:1
    V7 standard to clear                         5.70:1
```

**The colour channel peaks at 1.68:1 and cannot carry the state.** That is V7's finding repeating almost exactly: its colour channel peaked at 1.58:1 against a second channel at 5.70:1. And **Lively and Powered share a fill outright**, so between those two the colour channel is 1.00:1 in every viewing condition, which is not a weak channel but no channel at all.

**The ink channel is 9.03:1 at its worst across six pairs and five viewing conditions**, thirty measurements, all above V7's standard. Simulated with the Machado, Oliveira and Fernandes 2009 matrices at severity 1.0, the ones Chromium's own emulation uses, applied in linear RGB with the sRGB round trip written out rather than applied to 8-bit values.

**The matrices are guard-the-guarded against V7's own result**, which is the assertion that matters most here, because a matrix typed in wrong produces plausible numbers and a passing test. V7 found that tritanopia leaves the `reduced` to `oxidized` axis alone because the axis is a red-channel difference, while protanopia collapses it. Both properties are reproduced from the tokens by this file's own machinery: the tritanopia gap is more than twice the protanopia gap.

**And the structural half, which is why this does not need one test per deficiency.** With every `fill` attribute stripped, the four drawings are pairwise distinct in ink. A difference in where the ink is survives every colour transform by construction, so what has to be checked is that the difference exists once colour is gone, and it does:

```
  lively    body tall, legs disagree with each other, eyes are open rings,
            mouth is an upward curve
  sluggish  body squat and sitting on its own base, legs agree and are planted,
            eyes are two horizontal rules, mouth is a flat rule
  sick      the silhouette is cut by cracks, eyes are crossed strokes, mouth is
            a downward curve
  powered   a closed sub-outline inside the body
```

**Posture is not motion and that is the argument the whole channel rests on.** A figure drawn mid-stride does not move. It reads in one frame, at any size, in greyscale, under every deficiency, because it is a difference in where the ink is. The rule distinguishes information carried by change over time from information carried by shape.

**Two of the four changed the drawing rather than describing it, which is the V7 precedent repeating.** Sluggish's original signal was a desaturated fill, which says the cell is somewhat less; a body compressed and sitting on its base says it has stopped, which is what is true. And Sick's cracks cut the outline rather than painting the fill: `DESIGN.md` illustration rule 5 asks for `loss` coloured cracks across the body, and a red crack on a pink body says nothing in greyscale, while a crack that interrupts the silhouette is true in ink.

**Powered is the only topological change in the project's illustration set**, asserted directly: `<ellipse` appears in the Powered drawing and in no other beast. A closed sub-outline inside a closed outline is a compartment, act 3's whole subject is that a compartment appeared, and it reads with every fill removed because a hole in a shape is not a colour. The same sub-outline is on the timeline's endosymbiosis figure, deliberately, so the moment on the column and the moment on the body are drawn as one event.

**Not tested, and deliberately not faked: whether a slumped blob READS as a cell holding steady.** Distinguishability is arithmetic and is measured above. Meaning needs a reader, and `DESIGN.md` and `contentStyle.test.ts` both refuse to fake that class of question.

### 4. Open question 7, in the careful form and not one word stronger

**The quiet is legible.** A solved act 1 shows 0.00 on every net rate for fourteen minutes, and the beast shows a cell that is working. A walled act 1 shows the same 0.00 and the beast shows a cell that has stopped. **Sluggish is a picture of a cell holding steady rather than an absence of information**, and that reading exists nowhere else on the screen, because every pool card shows a net rate by construction and a net rate is genuinely the same number in both situations.

**It does not make fourteen minutes shorter.** NOW.md blocking item 2 is about a gap with nothing to do in it, and a picture is not a thing to do. Blocking item 2 does not close in this log and NOW.md should say so in its own words in stage 6.

**One thing worth adding to the claim rather than to its strength.** Act 1 produces three beast transitions and two of them are the wall and the recovery, which happen inside the first four seconds. **So across the fourteen-minute gap the beast changes zero times.** It is legible during the gap and it is not eventful during it, and anyone reading "the beast answers open question 7" should read it with that number attached.

### 5. The ATP sink, answered honestly

**This log delivers the first half only, and the second half is further away than it looks.**

`DESIGN.md`'s argument is that nothing else in the design consumes ATP, so the game produces a currency with no visible sink, which is what makes idle numbers feel weightless. **A state readout is not a sink and this beast is a state readout.** Nothing about it consumes anything.

**The sharper version of the problem, found while answering this.** The game already HAS an ATP sink: `maintain` turns ATP into ADP and phosphate every tick, it is one of act 1's five reactions, and it is real. What the game does not have is a **visible** one, and it does not have a **spendable** one, which are two different missing things:

```
  visible     `maintain` runs constantly and nothing on screen attributes it to
              anything. The beast is the obvious place to attribute it: the cell
              costs ATP to keep running and the character IS the cell. That is a
              readout change and a later log could do it cheaply

  spendable   purchases are thresholds against a LIFETIME ATP counter and debit
              nothing. docs/ECONOMY.md lists that as structural departure 1 and
              src/ui/tuning.ts says it outright: "Neither subtracts from the ATP
              pool. The adenylate pool is fixed, closed and conserved." Making
              ATP spendable is an economy change, a docs/ECONOMY.md pass and a
              re-derivation of act 1's whole pacing
```

**Neither is in this log and neither should be read into it.** A well-drawn character has not made ATP weigh anything, and the honest state is that the beast closes the readout half of `DESIGN.md`'s argument and leaves the economic half exactly where it was.

### 6. Where it lives, and what it is told to say

**On the timeline's marker row, at 44px, and that is a stated deviation from `DESIGN.md`.** `DESIGN.md` marks the current position with "the beast in its current state and a `You are here` label". The spine gutter is 20px wide, and a beast at 20px is a smudge whose posture, eye form and mouth form are the entire second channel and are all unreadable at that size. So the ring holds the position, which is what a spine is for, and the beast sits on the card, which is what a drawing needs. Both are on the marker row and read as one mark.

**The accessible name states the reading and carries no figure.**

```
  lively    The cell is working. Carbon is moving through the pathway.
  sluggish  The cell has stopped. Nothing is moving through the pathway.
  sick      The cell is being damaged.
  powered   The cell has a compartment of its own inside it.
```

No number in any of them, asserted: an `aria-label` has nowhere to put a badge, so a figure inside one would be a quantitative claim in player-facing text with no provenance, which is the rule V7 settled on the carrier blob. The rate is on the top bar where a badge can reach it. And each line names the cell rather than a mood, asserted too, because `docs/CONTENT_STYLE.md` Part 2 rules out performing enthusiasm and a beast described as tired is a pet.

**The live region decision: it joins nothing, and the count is unmoved.** The argument for announcing it is that it changes rarely, three times an act. The argument against won: **two of the three transitions are the stall and the recovery, and `Announcer` already speaks both.** A live region on the beast would say the same fact twice in different words, which is the same defect as two copies of one fact in a save. It is read on demand instead, which is what the rest of the accessibility layer does with rates.

### 7. The bundle

```
                              stage 2     stage 3    delta   budget
  application (apportioned)   81.43 kB   84.61 kB   +3.18   130.00 kB
  dependencies (apportioned) 217.32 kB  217.06 kB   -0.26   230.00 kB
  fonts                       68.86 kB   68.86 kB    0.00    72.00 kB
  styles                      21.19 kB   21.25 kB   +0.06    32.00 kB
  total                      392.65 kB  395.62 kB   +2.97   460.00 kB
```

**Four drawings, a component, a content file and a descriptor method cost 2.97 kB.** Eleven of eleven hand-drawn assets have now landed and the total for all of them plus both components is 12.64 kB against a 460 kB ceiling. Application has 45.39 kB of headroom. **The budget was built one log earlier for exactly this moment and the answer it gives is that the art was never the risk.** Nothing needs raising.

### Verify

```
  four states, distinguishable in greyscale and under all three
    deficiencies at V7 standard                       9.03:1 worst, 30 measurements
  no re-render across ticks                           3 transitions / 84000 frames
  no timer-driven animation                           asserted, guard-the-guarded
  npm test                                            781 passed, 53 files
  npm run typecheck                                   clean
  npm run lint                                        clean
  npm run build                                       clean, budget green
```

**One deviation from stage 6's fence, flagged here rather than discovered there.** Stage 6 step 3 asks for an empty `git diff` across `src/content/`. This stage changed `src/content/acts.ts`, because stage 3 step 1 requires the condition to live in the act descriptor and the descriptor is in `src/content/`. **No pool, reaction, coefficient or tuned value moved**, the new method is a pure reading that no simulation code calls, and both canonical hashes are unmoved, which the determinism tests assert on every run and which stage 6 will confirm directly. The fence's intent is that the log did not change the simulation, and it did not.

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

The game will now tell you, on demand, where any number on screen came from, and for most of them the honest answer is a divergence row rather than a paper. 939 tests across 54 files, up from stage 3's 781 across 53. Typecheck, lint and build clean.

```
  src/ui/content/provenance.ts            the four destinations, composed
  src/ui/components/ProvenanceContext.tsx who is offering to answer
  src/ui/components/ProvenancePanel.tsx   the panel. Overlay does the rest
  src/ui/components/Badge.tsx             the badge becomes the affordance,
                                          plus the tunedRow factory
  src/ui/components/Figure.tsx            a 16px info affordance for a
                                          measured value, which has no badge
  src/ui/content/{pathway,save,shelf}.ts  four badges now name their row
  src/ui/content/announcements.ts         the skip link
  src/App.tsx                             hosts the panel, and the skip link
  src/ui/__tests__/provenance.test.tsx    158 tests, the eighth guard
```

### 1. The four mappings

```
  Sourced     its docs/SCIENCE.md Part, plus what that Part covers. Subject
              lines authored for all seven, not only the three cited today

  Tuned       its docs/ECONOMY.md row, and the row's verdict in the row's own
              words. UNSOURCED is a table category and not a badge, so this
              branch is not taken from the badge alone: the badge names the row
              and only the row knows which verdict it carries

  Contested   what is argued about, and who argues which side. Two sides
              minimum, asserted

  measured    this came from your own session and the system clock. It points
              nowhere, because there is nowhere, and it says so
```

**Contested was the one with nowhere to go and it is the one that matters most later**, because the act 3 log makes a contested-science beat a headline feature. Three topics are authored, all from `docs/SCIENCE.md` Part 6: the vent hypothesis with Jackson 2016 against and Lane 2017 in reply, oxygenic photosynthesis with the 2015 contamination result that killed the 2.7 Ga date, and endosymbiosis with mitochondria-early against mitochondria-late.

**`divergenceRow` was shaped by V3 for exactly this and had never been populated by anything.** Four badges name a row now, chosen so both verdicts are reachable in play:

```
  C5   ACT1_VMAX.maintain      DEPARTURE   the maintenance arrow
  C20  ACT1_VMAX.store         DEPARTURE   the glycogen synthesis arrow
  U7   UPTAKE_VMAX_STEPS[2]    DEPARTURE   the top of the uptake ladder
  S1   AUTOSAVE_INTERVAL_MS    UNSOURCED   the save panel
```

`U7` is the sharpest of the four: its badge already named the row **in prose**, as "docs/ECONOMY.md row U7", where no panel could reach it. Stage 4 moves the string into the field.

**A fifth badge kind was not invented.** `tunedRow(reason, row)` is the same Tuned pill and the same union member with the optional field filled, on the precedent V4 set when it added `measured` without adding a fourth pill.

### 2. How the content reaches the screen

**Authored, not bundled, and there were three independent reasons.** Nothing in `src/` has ever read a doc at runtime; bundling 654 lines of prose written for a biochemist would break `contentStyle.test.ts` on its first line; and V9's content security policy permits zero network requests so fetching is not available either. The prose is authored under `docs/CONTENT_STYLE.md` and a guard parses both documents to prove every citation resolves.

**That is this project's answer to this exact problem for the third time**, after `disclosure.test.tsx`, which parses the disclosure blockquote out of `docs/SCIENCE.md` and fails if the game disagrees by a character, and `divergenceTable.test.ts`, which fails if a tuned scalar has no row.

### 3. The guard, and the three probes broken deliberately

The badge set is found by **walking the content barrel's exports recursively** rather than by a list, which is the discovery posture Spine A gave the other guards after nine components shipped past a hardcoded one. It finds 60+ badges and asserts all three shipping kinds are present, so nothing below is vacuous.

**Probe 1, a citation to a Part that does not exist.** `BEAST.sick` changed to `sourced('docs/SCIENCE.md Part 9, damage')`:

```
  FAIL check 1: every cited Part resolves to a real heading
       > docs/SCIENCE.md Part 9, damage names a Part the document has
  AssertionError: expected '# Science...' to contain '# Part 9:'

  FAIL check 3: no badged figure opens an empty panel
       > '{"kind":"sourced","source":"docs/SCIE...' resolves
  AssertionError: expected null not to be null
```

**Probe 2, a Contested badge with nothing authored for it.** The same entry changed to `contested('docs/SCIENCE.md Part 3, whether damage is repairable')`, which cites a Part that DOES exist, so check 1 passes and check 3 catches it alone:

```
  FAIL check 3 > '{"kind":"contested","source":"docs/SC...' resolves
  AssertionError: expected null not to be null

  FAIL check 3 > has an authored argument for every Contested badge, both sides
  AssertionError: expected undefined to be defined
```

**That is the probe the act 3 log depends on.** A new contested beat that nobody wrote the argument for fails the build rather than opening a panel that says the science is unsettled and stops there.

**Probe 3, a Tuned badge naming a row with no authored verdict.** `tunedRow(ABOUT_THE_BUILD, 'C2')`. C2 is a real row in `docs/ECONOMY.md` and the panel still refuses it, because the panel must not claim a verdict nobody checked against the document:

```
  FAIL check 3 > '{"kind":"tuned","reason":"A statement...' resolves
  AssertionError: expected null not to be null
```

**The verdict is derived from the document rather than transcribed.** `docs/ECONOMY.md`, "How to read a row": the real behaviour column is cited where the science says anything and left EMPTY where it says nothing. So the guard reads the fourth cell and calls an empty one UNSOURCED, and asserts `TUNED_ROWS` agrees. Guard-the-guarded on `C1` returning DEPARTURE and `U1` returning UNSOURCED, so if the parser ever reads the wrong column both stop disagreeing and the test fails.

**Where the third check does not have teeth, stated rather than implied.** A Tuned badge naming NO row falls to the build-statement destination, and the only thing checked there is that it carries a reason, which the type already requires. The guard cannot know whether a sentence about this build should have been a row. That limit is written into the test file's header rather than left for a reader to discover.

### 4. The interaction

**The badge is the affordance.** It is already the mark that says provenance was declared and it already sits beside every figure, so one component change gives the feature complete coverage with no edit at any call site. It renders as a `<button>` only where a `ProvenanceProvider` is above it, so with no host it is exactly the span it has always been and every existing assertion about badges is untouched.

The accessible name is `Sourced. Where this comes from`, which keeps the visible word inside the name.

**A measured value has no badge to click and gets DESIGN.md's own 16px circular info affordance instead**, rather than a fourth pill, which would imply provenance is an open question about it. Six figures take it, in the offline return and the save panel.

**Nothing about focus or Escape is reimplemented.** The panel is `Overlay` plus a `Card`, and a test asserts `ProvenancePanel.tsx` contains no `addEventListener`, no `Escape`, no `activeElement` and no `focus()` outside its comments. Overlay has held all of it since V7 stage 3, where every part was repairing something measured on the real page: focus moves in on open, is trapped because the panel dims, returns to whatever opened it on close, and Escape closes it. The panel does not exist until the player asks, which is what makes "it does not take focus unless the player asked for it" true by construction.

### 5. The cost, which is real and is reported rather than absorbed

**Every badge becoming a control added tab stops, and it inverted a decision V7 made.**

```
  the pool rail    3 stops before, 13 after
  the timeline     9 stops, all of them new this log
```

V7 stage 3 step 5 asked for a skip link past the pool rail and stage 3 declined, measuring three stops and calling a skip link over three stops more furniture than it saves. **It also wrote down the condition for revisiting: "if a later log makes pool cards interactive this fails, which is the right moment to revisit it."** This is that log, and that assertion is the one that failed when the badges became buttons.

So the skip link is built. Hidden until focused, first tab stop inside `<main>`, targets the pathway column, and it costs a pointer user nothing. **V7's argument was right on its numbers and its numbers changed**, which is a better outcome than either being wrong.

Two existing assertions were updated rather than worked around: the rail-is-cheap one now asserts the opposite with the history in it, and the every-control-is-native one gains `a`, because an anchor with an href is the right element for the one thing on this screen that is navigation rather than an action.

### 6. What this feature is FOR, written into the report so it is not lost

Per `docs/ECONOMY.md` the tuned scalars are 33 DEPARTURE and 15 UNSOURCED. **So for most numbers on screen the honest answer to "where does this come from" is a divergence row rather than a paper.** The feature that says so is a better feature than one that pretends otherwise.

**The UNSOURCED wording as shipped, verbatim:**

```
  The row is UNSOURCED. There is no real counterpart at all. Nothing in
  biology corresponds to this number and the row leaves its real behaviour
  column empty on purpose.
```

**The temptation to soften that is real and it is guarded rather than resisted.** A test asserts the string contains "no real counterpart at all" and "on purpose", and that it contains none of "approximat", "roughly", "based on" or "inspired". `docs/ECONOMY.md` says the empty cell is the content of the row rather than a gap in it, and a plausible sentence in an UNSOURCED row is the exact failure the table exists to prevent.

For comparison, the DEPARTURE wording:

```
  The row is a DEPARTURE. A real quantity could have stood here and this is
  not it. The row says what the real behaviour is and what the game does
  instead.
```

### 7. Deferred, and it stays deferred

Per-claim citation identifiers in `docs/SCIENCE.md`. That document has a flat topical bibliography and no per-claim anchors, so linking a figure to an exact passage is a refactor across 654 lines plus every call site plus a guard, and it gets its own log. **This feature cites a Part, which is honest about its own resolution**: the panel names the Part and says what the Part covers, and never implies it is pointing at a sentence.

### 8. The bundle

```
                              stage 3     stage 4    delta   budget
  application (apportioned)   84.61 kB   89.42 kB   +4.81   130.00 kB
  dependencies (apportioned) 217.06 kB  219.10 kB   +2.04   230.00 kB
  fonts                       68.86 kB   68.86 kB    0.00    72.00 kB
  styles                      21.25 kB   22.27 kB   +1.02    32.00 kB
  total                      395.62 kB  403.51 kB   +7.89   460.00 kB
```

No new asset landed here, so the growth is prose and one component. Application has 40.58 kB of headroom.

### Verify

```
  all four destinations work                    asserted, one test each
  the guard fails on an unresolved citation     probe 1, quoted
  the guard fails on a badged figure with no
    entry                                       probes 2 and 3, quoted
  focus returns correctly                       Overlay, reused rather than
                                                reimplemented, and asserted to be
  npm test                                      939 passed, 54 files
  npm run typecheck                             clean
  npm run lint                                  clean
  npm run build                                 clean, budget green
```

**No simulation change.** Nothing under `src/sim/` was touched. `src/content/` is untouched by this stage. The three tuning files, `docs/SCIENCE.md` and `docs/ECONOMY.md` are all untouched: the four rows this stage cites already existed and were cited rather than written.

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

The rail reads the running act for the last thing that was still act 1's, the layout has a story at every width, and NOW.md blocking item 4 is closed rather than deferred again. 960 tests across 55 files, up from stage 4's 939 across 54. Typecheck, lint and build clean.

```
  src/content/acts.ts                  poolDefinitions() on the descriptor
  src/ui/poolCards.ts                  weights from the registry, not act 1
  src/index.css                        the forced-colours block
  src/ui/components/Card.tsx           data-paper, and relative
  src/ui/components/Badge.tsx          outer focus ring on the affordance
  src/ui/components/Figure.tsx         outer focus ring on the info button
  src/ui/__tests__/accessibility.test.ts  ink2 on lilac
  src/App.tsx                          the narrow-width cap
  src/ui/__tests__/surfaces.test.tsx   20 tests
```

### 1. The rail reads the running act, and the gap was not where the prompt expected

**Spine A had already done the half this stage was written for.** `PoolRail` calls `poolCardsFor(useAct())` and the card table is keyed by act number, so which pools share a card has read the running act since V11.

**What had not been done was the geometry, and it was the last place in the interface that named act 1 by hand.** `poolCards.ts` built its conserved-weight map from `act1PoolDefinitions()` directly, so DESIGN.md illustration rules 1 and 2, which are the ones the whole "every visual property carries simulation state" claim rests on, would have drawn act 2's molecules with act 1's weights or with none at all. The descriptor gains `poolDefinitions()` and the map is built from `ACTS.flatMap(...)`.

**It returns definitions rather than a carbon-and-phosphate pair, deliberately.** Naming those two quantities in `src/content/` would put illustration vocabulary in the content layer, and act 3 needs a membrane and a gradient that `acts.ts` should have no opinion about.

**One map across every act rather than one per act, and that is a decision with a reason.** `docs/SAVE_SCHEMA.md` Part 3 makes a pool id permanent contract surface the moment anything ships with it, so a pool id is globally unique and its conserved weights are a property of the pool rather than of the act reading it. Two acts sharing `pyruvate` share its three carbons by definition. A test fails the build if two acts ever disagree about a shared id, so the assumption is held rather than assumed.

**The grouping rule is unchanged and that is the point.** Carrier pairs share a card because their sum is what is conserved and the sum is what teaches: NAD+ draining while NADH fills, on one card, is the wall arriving, and on two cards it is two numbers moving in opposite directions with the player left to join them up.

### 2. The act 3 regrouping, deferred rather than forgotten

Written into `poolCards.ts` where somebody will hit it, and asserted so it cannot be quietly deleted.

Act 3's pools are not written down anywhere. `docs/PROGRESSION.md` gives act 3 eight unlocks and names no pools, and `docs/designs/game-spine-and-four-acts.md` defers act 3's compartment and gradient illustration rules to the act 3 log by its own risk table, because nothing in the illustration language encodes a membrane, a compartment or a proton gradient today.

**A grouping designed against an imagined act 3 gets redesigned in the act 3 log anyway, so the cost is paid twice and the version in between is worse than either.** What this log does is make the rule read the running act's table. What it does not do is guess what that table will contain.

### 3. The viewport, decided by what the player loses

```
  >= xl (1280)   three columns. timeline 16rem, rail 17rem, pathway the rest
  >= lg (1024)   three columns. timeline 14rem, rail 16rem, pathway the rest
  <  lg          one column. timeline first, capped at 20rem of its own scroll,
                 then the rail, then the pathway, the shelf and the save panel
```

**What is lost at each step, which is the actual design work.**

```
  xl to lg     2rem off the timeline and 1rem off the rail. The pathway loses
               nothing. Both columns are still wide enough for a date, a spine
               and a card, and for a blob, a rate and a stock

  lg to below  the ability to see the timeline and the pathway at once. That is
               the real loss and nothing avoids it at 400px

  at any width nothing. No surface is hidden and none collapses. Asserted:
               there is no `hidden lg:`, `lg:hidden`, `sm:hidden` or
               `md:hidden` anywhere in the layout
```

**Naming which surface is least load-bearing at 400px is what step 3 asks for, and the answer is the timeline.** The timeline answers where am I. The pool cards answer what is happening. The pathway answers why. **The first of those is asked on arrival and occasionally after; the other two are watched.** So the timeline is the one that goes first and gets scrolled past, and the cost is bounded at less than one screenful by a 20rem cap on its own scroll rather than seven card heights of page.

**Two things make that cost smaller than it sounds.** Every stop stays reachable inside the cap, so nothing is lost. And the skip link stage 4 built jumps a keyboard user straight past it to the pathway, which is the mitigation arriving one stage before the problem it also solves.

**DOM order stays reading order at every width**, which is why no `order` utility appears anywhere. A layout that reorders visually without reordering the DOM breaks the thing V7 spent a stage establishing.

### 4. Reduced motion

**The three surfaces this log added carry no motion at all**, which is the strongest available way to satisfy the rule rather than a way around it. The timeline marker is discrete and moves only at act boundaries, the beast never animates on a timer, and the provenance panel is an overlay. Asserted per file, comments stripped: no `@keyframes`, no animation or transition utility, no `requestAnimationFrame`, no `setInterval`.

**Guard-the-guarded on the one surface that does carry motion.** `PathwayArrow` animates at a rate proportional to applied flux and reduced motion swaps it for a static arrow plus an explicit numeric rate rather than simply stopping, which is V7's standard and is unchanged.

### 5. Blocking item 4, closed

Stage 1 took the decision and stage 5 ships it, which is what stage 1's report said would happen.

```css
  @media (forced-colors: active) {
    [data-paper]        { box-shadow: none; }
    [data-paper]::after { content: ''; position: absolute; inset: -6px;
                          border: 2px solid CanvasText;
                          border-radius: calc(var(--radius-card) + 6px);
                          pointer-events: none; }
  }
```

**The shadow is switched off rather than recoloured**, because a shadow in a system colour participates in a palette it was never designed against. **The replacement is a pseudo-element rather than an `outline`**, because `outline` is spoken for by `:focus-visible`. And it sits at `inset: -6px`, outside the border, while the focus ring sits at `outline-offset: -6px`, inside it, so the two never collide and a focused card under forced colours reads as separated and focused at once. **V7's decision to draw focus inside is what made this affordable and it was made two logs before anything needed it.**

**Only cards that actually carry a shadow are marked.** A dashed slot has none, so there is nothing to substitute for, and drawing a second outline around it would say "separate piece of paper" about the one thing on the screen that is deliberately not one yet.

### 6. The full accessibility pass

```
  contrast     ink2 on lilac added to the pair table and passing. It was the one
               surface no secondary text had ever sat on, because lilac means
               contested and nothing was contested until this log landed three
               contested timeline stops and a contested provenance card

  focus        the badge affordance and the measured info button both carry
               data-focus-ring="outer", the hook index.css already defines for a
               small control. A pill has no shadow for an outer ring to collide
               with, which is what makes it correct rather than a special case

  keyboard     no positive tabindex anywhere. DOM order is tab order. Reading
               order is header, timeline, rail, shelf, save panel, asserted

  landmarks    every <section> on the screen carries a name, asserted as a
               negative match so a new unnamed one fails rather than passes

  live region  exactly one on the whole screen, asserted by counting
```

**The announcement count, measured across a full act rather than read off the constant:**

```
  what a screen reader hears across a full act 1

    announcements spoken   17
    upper bound            17
    V8 measured            16
    added by V11           1   the act boundary
    added by V12           0
```

**The number has not grown in this log at all.** The timeline, the beast and the provenance panel carry no live region between them, and each of those was a decision rather than an omission: the timeline would have announced the act boundary a second time, and the beast would have restated the stall and the recovery that `Announcer` already speaks. **Two announcements about one fact is the same defect as two copies of one fact in a save.**

**The one that arrived since V8 belongs to V11**, and the counted 17 matching the computed bound exactly means every announcement the constant allows for is actually reachable in play, which had never been checked before.

### 7. The bundle

```
                              stage 4     stage 5    delta   budget
  application (apportioned)   89.42 kB   89.56 kB   +0.14   130.00 kB
  dependencies (apportioned) 219.10 kB  219.12 kB   +0.02   230.00 kB
  fonts                       68.86 kB   68.86 kB    0.00    72.00 kB
  styles                      22.27 kB   22.64 kB   +0.37    32.00 kB
  total                      403.51 kB  404.03 kB   +0.52   460.00 kB
```

### Verify

```
  the rail reads the running act               cards since V11, geometry now
  the layout holds at every breakpoint tested  xl, lg and below, nothing hidden
  reduced motion covers the new surfaces       nothing to reduce, asserted
  the accessibility guard is green over them   yes, and it gained a pair
  npm test                                     960 passed, 55 files
  npm run typecheck                            clean
  npm run lint                                 clean
  npm run build                                clean, budget green
```

**One deviation from stage 6's fence, and it is the same one stage 3 flagged.** `src/content/acts.ts` gained `poolDefinitions()`, which returns act 1's existing definitions unchanged. No pool, reaction, coefficient or tuned value moved, and both canonical hashes are unmoved.

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
