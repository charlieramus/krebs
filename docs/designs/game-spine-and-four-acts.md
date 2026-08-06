# The Game Spine and the Remaining Three Acts

Last updated: 2026-08-05
Status: accepted, amended by an engineering review the same day. The roadmap the next logs are written against.

The plan for getting from one act to four. Read this alongside docs/PROGRESSION.md, which says what the acts contain, and DESIGN.md, which says what they look like. This document says in what order they get built and why the previous order was wrong.

Produced by a scope review on 2026-08-05 against branch updatelogv8, then revised the same day after an independent review found factual errors in the first version. The corrections are recorded in "What the first version got wrong" below rather than quietly fixed, because the wrong version is the more useful record.

Amended on 2026-08-05 by an engineering review, which read the code rather than the document. It moved CI to the front, split the largest log in two, and priced four risks this plan did not carry. Those changes are in "What the engineering review changed" below. Its own outside voice found the sharpest item in the document and it is the act ordering, which is left unresolved on purpose with its price written down. See the risk row "Act 3 has no oxygen".

## The problem this plan exists to solve

Eight logs in, the project has one act of four, no map, no character, no title and no ending. Stated by the person who has been building it: "it has about 1/10th of the stuff we initially talked about. Its visually disconnected and the plot makes no sense, the whole timeline is entirely skipped."

Three things are true and they are not the same thing.

**The content spine has not grown since V3.** V4 through V8 added persistence, an economy pass, a teaching layer, an accessibility layer and offline progress. Each shipped things a player can see, and none of them added a new pathway, a new act, or a new place to be. The game's reach through docs/PROGRESSION.md is unchanged since 2026-07-29.

**The two design elements that supply meaning were cut first and never rescheduled.** DESIGN.md says of the beast: "Nothing else in the design consumes ATP, so the game produces a currency with no visible sink, which is what makes idle numbers feel weightless." It says of the timeline: "It answers where am I and how much is left, which the act screens cannot, and it gives ATP a visible destination." Both were deferred in V3's Decisions section. Neither was ever picked back up. What is left on screen is eight pool cards and a pathway diagram, which is the design working exactly as specified with both of its connective elements removed.

**The project does the work that a test or a document can certify as done.** Tests 65 to 503. Guards 0 to 6. Contrast measured to two decimal places. Thirty-seven divergence rows. Six hundred and twenty lines of NOW.md. Readers 0, readers asked 0. That is a selection bias toward verifiable work rather than an ordering fault, and **it is the root cause.** Changing the unit of work does not touch it. Only putting unverifiable work on the critical path does, which is what the first three items in the roadmap below are for.

**One of the two founding assumptions came back negative and was built on anyway.** docs/BRIEF.md line 110 defines the vertical slice as testing two things. NOW.md records the answers: the NAD+ wall reads as interesting, and "do saturating kinetics feel like a game? No, not yet." That landed on 2026-07-29. The fix for it is not a map and not a character. It is docs/PROGRESSION.md's three unbuilt act 1 unlocks, which NOW.md blocking item 2 names as what closes the remaining fourteen minute dead gap. The plan below builds them before anything else.

## What the first version of this document got wrong

Recorded rather than deleted, because a wrong argument that was acted on is worth more on the page than off it.

- **"V3 was the last log that added anything a player can see as new" is false.** V5 added four purchasable capacity rungs, V6 added the first run card, the about panel, the teaching panel, two coach marks and the per-blob readouts, and V7 added the redox level rule and a visible focus indicator. The defensible claim is narrower and is the one stated above: the content spine has not grown.
- **"Four layers before the second act means paying each layer four times" overstates it.** The save codec, the migration harness, `Figure`, `Badge`, the `Needs source` bundle gate, `Announcer.tsx`, `Overlay.tsx` and the guards are paid once and inherited by every act. What genuinely repeats per act is economy tuning, teaching content, an accessibility pass over new surfaces, and a migration. The multiplier is real and it is not four.
- **"Act 1 is already complete" is false.** docs/PROGRESSION.md lists nine act 1 unlocks and three are unbuilt. The reference implementation for "one complete act per log" was six of nine.
- **The naming urgency was invented.** The first version argued the domain becomes permanent on deploy and renaming orphans every save. At deploy there are zero players and zero saves. V4 chose the `krebs.save.*` prefix over the title precisely so the title could move. Naming is off the critical path.
- **The beast closes half of DESIGN.md open question 7, not all of it.** It distinguishes holding at a high rate from stopped, which is exactly what that question asks for. It does not make fourteen minutes of nothing into something, and NOW.md explicitly warns against counting a static addition as progress against that item.

## What the engineering review changed

Recorded in the same spirit as the section above. This review read the code rather than the document, so most of what it found was a gap between what the plan says and what is actually in `src/`.

**Sequencing, two changes.** CI, cross-engine determinism and deployment move ahead of both spine logs. NOW.md already argued this in its own words and the plan had quietly reversed it: six build-failing guards and a 200-case offline sweep run only when somebody types a command, and the two largest diffs in the project's history were scheduled to land under them. And the twelve-item spine log splits into a structural half and a surface half, because every log this project has shipped has been five or six stages around one idea, and twelve stages around six ideas with a schema bump on top is a different kind of thing.

**The act registry was scoped to the wrong directory.** The plan put it in `src/content/`. The act-1 coupling is in `src/ui/runtime.ts`, whose entire public surface is act-1-named, and which carries act-1 semantics rather than just act-1 names: a walled-NAD threshold, literal pool and reaction ids, and a hand-written eight-card literal with act-1 chemistry in its type union. Roughly 750 lines across 59 files mention act 1.

**Provenance-on-click had no route from docs/ into the app**, and two badge kinds had no destination. See that section, rewritten.

**The schema bump became a schema decision**, because the version 1 shape was already written for four acts.

**Four things had no test and no error path.** A save naming an act this build does not have. An act boundary reached during an offline absence. A per-frame lookup added by the runtime refactor. And the act 1 ending, which ships four logs before act 2 exists and had no defined state on the other side of it.

**The outside voice found the item this document is now least sure about.** Act 3 before act 2 may be incoherent rather than merely bold, because act 3's payoff needs oxygen and act 2 is what supplies it. It is written into the risk table with its price and left open, because it is a product decision rather than an engineering one.

**And it found the shape of the review itself.** Eleven of the thirteen amendments add mechanism, which is the exact bias this document diagnoses as the root cause. Kept, and recorded in the risk table, because a plan that cannot see itself doing the thing it warns about is the plan this one was written to replace.

## Vision

### The subject

The 1x version rebuilds what docs/PROGRESSION.md already describes: four acts of unlock lists, plus a map and a mascot. The 10x version starts from something the docs already believe and have never acted on. **Every upgrade the player buys is a thing that actually happened, once, to a real lineage, at a real moment, and the game can show them when and show them what it knows.** In that version the timeline is not a progress bar, it is the second half of the argument, and it is currently specified as an optional second view.

This is held under docs/PILLARS.md, not against it. The scope stays metabolism inside one cell. Deep time is the frame that metabolism is read in, and the admission rule below is what keeps that from drifting.

### Platonic ideal

You open it. A small cell blinks at you from the bottom of a column of deep time, three and a half billion years down, and the column goes up out of sight. You feed it. It makes two ATP per glucose and you find out, in about three seconds, why that ceiling is real and why fermentation does not lift it.

Then the light changes. Something is killing you and it is oxygen, and the sky behind the cell shifts over the next ninety minutes because that is what actually happened, and you spend that time learning to survive a poison rather than to grow. Banded iron appears on the column beside you. Your cell has cracks in it.

Then a stranger swims in and you decide whether to eat it. You keep it. Everything you know about the economy stops being true. You have to build a gradient before you can spend it, and the number goes from 2 to about 30, and the game puts your own act 1 figure next to your own act 3 figure with your own playtime attached and lets you look at it.

At the end, the cell you have been running for eight hours stands at the top of the column with a mitochondrion visible inside it. The game then tells you exactly which of what you learned is measured, which is tuned for pacing, and which is still argued about in 2026. A teacher can put that screen in front of a class.

## Approach

The unit of work changes. It is no longer a horizontal layer across everything that exists. It is one act delivered end to end: content, interface, economy, teaching, accessibility and save migration in the same log.

The ordering changes twice more, both from the independent review. **Unverifiable work goes first**, because it is the work this project systematically avoids and the only work that can invalidate the expensive bets. And **acts are ordered by value rather than by geological time**, because act 3 carries the only success condition an act can carry and act 2 carries none.

## Roadmap

```
  NOW, NO CODE, IN PARALLEL
    A  Cold read on the CURRENT build. 2 week timebox, named fallbacks,
       and a written fail branch. Nothing below waits on it; everything
       below is informed by it. The protocol runs PAST the wall, to the
       first purchase gap, or it informs nothing below. See the gate.
    B  docs/SCIENCE.md sent for biochemistry review. Same 2 week timebox
       as A. No code, no dependency on A. Discharges a precondition to
       PILLARS success condition 3 rather than the condition itself,
       which asks for a review of the game.
    C  Art spike: one beast state, one timeline figure, to DESIGN.md's
       standard. Gates SPINE B's illustration scope. Prices execution
       and must also answer governance: what mechanism keeps eleven
       hand-drawn assets inside the token palette.

  V8   OFFLINE PROGRESS            done 2026-08-05
       + quantised oxygen schedule written into docs/SIMULATION.md as a
         constraint on act 2, so the steady-state engine survives it.
         V8's window has closed, so this moves into the CI log
       - act boundary as a jump event kind: WITHDRAWN. The boundary
         STOPS the jump instead. See risk row "The boundary is not a
         pool crossing zero"

  --   ACT 1 COMPLETION            the three unbuilt unlocks:
                                   individual glycolytic enzymes,
                                   ethanol fermentation, glycogen storage
                                   act 1 duration re-derived against the
                                   45 to 90 minute target
                                   closes NOW.md blocking item 2 and
                                   answers the negative founding assumption

  --   CI + CROSS-ENGINE + DEPLOY  MOVED UP, ahead of both spine logs.
                                   Six build-failing guards and a 200-case
                                   offline sweep currently run only when
                                   somebody types a command, and the two
                                   largest diffs in the project's history
                                   are next
                                   deploy on any origin, named or not
                                   + post-deploy smoke check
                                   + bundle size guard, baseline 278.31 kB
                                     and 86.59 kB gzipped, measured at V8
                                   + quantised oxygen schedule, inherited
                                     from V8's closed window

  --   SPINE A, STRUCTURAL         act registry, src/content/acts.ts.
                                   MINIMUM SHAPE ONLY: exactly the fields
                                   act 1 needs. Act 2 widens it. Designing
                                   the full descriptor against one act is
                                   the mistake src/sim/jump.ts already
                                   refuses to make
                                   runtime de-specialisation: Act1* to
                                     Act*, and WALLED_NAD, the literal
                                     pool and reaction names and the card
                                     literal move into the descriptor
                                   content.ts becomes a directory
                                   act boundary machinery, act 1 ending,
                                     and an authored end-of-content state
                                   future-act refusal on load
                                   guards discover their inputs
                                   headless playthrough test
                                   NOW.md restructured to its own rule
                                   schema DECISION, not a schema bump

  --   SPINE B, SURFACE            DESIGN.md stage FIRST (six edits,
                                     including designing open question 5)
                                   timeline as the spine, discrete marker
                                   the beast (subject to spike C)
                                   provenance-on-click
                                   pool rail reads the running act
                                   viewport story

  --   ACT JUMP                    first half of teacher mode. Its value
                                   depends on the act ordering below and
                                   it must not become a second definition
                                   of what an act's start state is

  --   ACT 3, COMPLETE             the 15x payoff surface
                                   BLOCKED ON A DECISION: act 3 needs
                                     oxygen and act 2 is what supplies it.
                                     See risk row "Act 3 has no oxygen"
                                   endosymbiosis set piece on the beast
                                   the contested-science beat
                                   transition snapshot slot for the undo
                                   compartment and gradient illustration
                                     rules, currently unspecified

  --   TEACHER MODE                lesson pacing, printable summary

  --   ACT 2, COMPLETE             scope decided after real reactions to
                                   act 3. Quantised oxygen per the CI
                                   log's constraint. Per-reaction Vmax as
                                   hashed state, a kernel concept that
                                   does not yet exist
                                   REQUIRES the offline fallback repaired
                                     first. See risk row "Act 2 falls back
                                     into a path that destroys the cell"

  --   ACT 4, COMPLETE

  --   ENDGAME                     summary, sources, simplifications,
                                   sandbox with validated inputs
```

## The gate, written as a decision rather than a wish

The first version made every remaining log wait on finding two strangers, which is the item that has sat at the top of NOW.md's Next list for three logs without moving. A gate with no timebox, no fallback and no fail branch is how a plan stops permanently. This version does not gate the roadmap. It puts the unverifiable work first and gives it a shape.

**Timebox.** Two weeks from 2026-08-05.

**Fallbacks, in order, if the first is not filled.** One non-technical acquaintance. A paid remote session. A subreddit or forum post with a link. Any of these beats a fourth log with zero readers.

**Timebox for B as well as A.** Two weeks from 2026-08-05. The first version gave A a timebox and left B open, which is how the cheaper of the two items becomes the one that never happens.

**What a pass looks like.** The reader reaches the NAD+ wall without being told, says out loud what they think fermentation will do before buying it, and buys it. Whether their prediction is right is the measurement, not the pass condition.

**And the read does not stop there, because a read that stops there informs nothing below it.** The wall arrives at 3.05 game-seconds and recovery lands inside four, so the pass condition above is a three-minute session. The item directly below this gate is act 1 completion, whose entire purpose is the 13m51s worst gap between purchases. **A three-minute read produces zero data about a fourteen-minute gap.** So the protocol runs to at least the first long gap and records what the reader does inside it: whether they wait, leave, look for something to click, or ask whether the game is broken. That is the observation act 1 completion is actually built against.

**What a negative result changes, decided in advance.** If the wall does not read, act 1 completion is rescoped around the wall rather than around pacing. If fermentation reads as an energy upgrade even after the teaching panel, the teaching layer is wrong rather than absent, and the spine log gains a stage for it. If the reader never finds the teaching panel, `COACH_MARK_TRIGGER` is decided by them rather than left open for a fourth log.

**Recorded.** Whatever comes back is written into NOW.md whether it is good or not, because the failure mode this project is built to avoid is silence about inconvenient results.

## Scope decisions

| # | Proposal | Decision | Where it landed |
|---|----------|----------|-----------------|
| E1 | Timeline as the spine, not a second view | ACCEPTED | Spine log. Act 4 owns the existing early-aerobic-eukaryotes stop |
| E2 | The beast, four states, as the steady-state display | ACCEPTED | Spine log, subject to the art spike. Closes half of DESIGN.md open question 7 |
| E3 | The world visibly changes per act | ACCEPTED | Inside each act log. Not S: per-act palettes re-run the full contrast matrix |
| E4 | A dedicated 15x payoff surface | ACCEPTED | Act 3 log, with sourced reference figures when no personal history exists |
| E5 | Source-on-click | ACCEPTED, REFRAMED | Provenance-on-click. Spine log. See below |
| E6 | Teacher mode | ACCEPTED, SPLIT | Act jump moves early. Lesson pacing and printable stay after act 3 |
| E7 | Contested science as an interactive beat | ACCEPTED | Act 3 log |
| E8 | Name the product | ACCEPTED, OFF THE CRITICAL PATH | Triggered by the first real save, not by deploy |
| E9 | Act boundaries as authored set pieces | ACCEPTED | Boundary machinery and act 1 ending in the spine log, set pieces per act |
| E10 | Endgame summary and sandbox | ACCEPTED | Final log. Sandbox inputs validated and clamped |
| E11 | Cold reader and teacher | ACCEPTED, REDESIGNED | Moved to the front, timeboxed, with fallbacks and a fail branch |

Eleven proposed, eleven accepted, four materially reshaped by the independent review.

### Why provenance-on-click rather than source-on-click

docs/SCIENCE.md has a flat topical bibliography and no per-claim identifiers, so linking a figure to an exact passage is a refactor across a 654-line document plus every call site plus a guard, which is a log rather than a stage. And per docs/ECONOMY.md, the thirty-seven tuned scalars are twenty-five DEPARTURE and twelve UNSOURCED, so for most numbers on screen the honest answer to "where does this come from" is a divergence row rather than a paper.

So the feature says what is true. A Sourced figure opens its docs/SCIENCE.md Part. A Tuned figure opens its docs/ECONOMY.md divergence row, and that row says whether it is DEPARTURE or UNSOURCED, which is what its "real behaviour" cell already means.

**Four destinations, not three, and the first version of this section listed two of them wrong.** The badge contract is Sourced, Tuned and Contested, plus the `measured` exemption V4 added for session values. UNSOURCED is a docs/ECONOMY.md category rather than a badge, so the branch cannot be taken from the badge alone: a Tuned figure is DEPARTURE or UNSOURCED and only the row knows which. **Contested had no destination at all**, which matters because E7 makes a contested-science beat a headline act 3 feature, so the badge that carries the game's most interesting claim was the one with nowhere to go. The mapping is:

    Sourced     its docs/SCIENCE.md Part
    Tuned       its docs/ECONOMY.md row, which names DEPARTURE or UNSOURCED
    Contested   what is argued about, and who argues which side
    measured    this came from your own session, not from anywhere

**How the content reaches the screen.** Not by bundling the documents. Nothing in `src/` has ever read a doc at runtime; the ten tests that parse SCIENCE.md and ECONOMY.md do it with Node's file reader under Vitest. Bundling raw markdown would put 654 lines of internal prose written for a biochemist in front of a player, and it would break `contentStyle.test.ts`, which fails the build on any player-facing string outside the content directory. So the prose is authored under docs/CONTENT_STYLE.md and a new guard parses both documents and fails the build if a cited Part or row does not resolve, or if a badged figure has no entry. Same mechanism as `disclosure.test.tsx` and `divergenceTable.test.ts`, which is the pattern this project already uses for exactly this problem.

**That is a better feature than the one it replaces.** Every science game claims accuracy. A game that will tell you, on demand, exactly which of its numbers are measured and which it invented for pacing is doing something else. Per-claim citation anchors remain worth building and get their own log later.

## Known risks, priced

| Risk | Why it matters | Mitigation |
|---|---|---|
| **Act 3 has no oxygen** | Act 3's whole payoff is 2 to roughly 30 ATP, which needs oxygen as the terminal electron acceptor, and act 2 is what supplies it. `src/save/schema.ts` reserves `environment.oxygenLevel` and act 1 writes it as a literal 0 with the comment that this is not a placeholder. Building act 3 first means inventing a nonzero oxygen constant that act 2 must later take ownership of, and re-deriving act 3's balance when it does. It also inverts the thesis: docs/PROGRESSION.md says aerobic respiration is an opportunistic exploitation of a poison rather than the next rung, and act 3 without act 2 delivers exactly the ladder-climb this game refuses | **UNRESOLVED, ON PURPOSE.** The ordering is a product decision and the price is now written down rather than absorbed. If a placeholder oxygen constant carrying a DEPARTURE row is acceptable, the order stands. If it is not, act 2 moves ahead of act 3 and the value-ordering argument in Approach is withdrawn |
| **Act 2 falls back into a path that destroys the cell** | NOW.md blocking item 6: coarse replay credits exactly zero ATP from every act 1 configuration. It is harmless today only because act 1 always settles. Act 2 breaks both halves of that. `EVENT_BUDGET` is 64 and a day away in act 1 already produces up to 51 events, so a quantised oxygen schedule making every step an event exhausts the budget, and budget exhaustion routes to the fallback. Separately, ROS damage varies Vmax continuously, so the second-difference steady criterion may never pass inside `SETTLE_MAX_TICKS` of 1200 against a walled cell that already settles at 1120, a margin of 6.7 percent | **Repairing the fallback becomes a precondition for act 2 rather than a standing defect.** Blocking item 6 records the measured alternative: full replay of the maximum credit is 1459 milliseconds, which is a visible stall and correct, against 22 milliseconds that is not. That decision gets taken before act 2 is scoped, not during it |
| **The boundary is not a pool crossing zero** | The plan originally added the act boundary as a jump event kind. `src/sim/jump.ts` computes every event in closed form from a pool reaching zero and its own header lists threshold crossings as explicitly not simulation events. The substrate mask is also computed once per absence, and its justification assumes nothing enables a reaction mid-jump | The boundary STOPS the jump. Time is credited up to it, the return screen says the act ended, and the set piece plays live on return. No new event kind, no mid-jump reconstruction, and the bounded cost per event survives |
| **The art does not exist yet** | Every illustration so far is derived from the conserved-weight table. `Blob.tsx` contains no path data by rule. The beast's four states and seven timeline figures are the first hand-authored art in the project, on the critical path. Nothing constrains hand-drawn assets to the token palette: the accessibility guard computes pairs from `index.css`, and SVG `fill` set as a presentation attribute is not forced by `forced-colors` | Spike C. Two figures before the log commits to eleven, and the spike must answer governance as well as execution. Bundle size guard lands in the CI log first |
| **Act 2 never reaches steady state** | Rising oxygen plus accumulating damage is a system that by design does not settle, and V5 chose more unlocks over a varying environment specifically to protect that assumption. The default outcome is permanent coarse replay, which docs/SIMULATION.md calls a bug signal | Quantised oxygen schedule, written into docs/SIMULATION.md while V8 is live |
| **Act 2 needs a kernel concept that does not exist** | ROS damage means per-reaction Vmax varying dynamically as hashed simulation state, with determinism and schema consequences | Unscoped. Named here so the act 2 log inherits it rather than discovers it |
| **Act 3 needs a compartment and a gradient** | Nothing in the illustration language encodes a membrane, a compartment or a proton gradient, and DESIGN.md's rule is that every visual property carries simulation state | New illustration rules, scoped into the act 3 log |
| **Four more schema bumps, re-priced and probably wrong** | The version 1 shape was written for all four acts. `progression.act` is documented as 1 to 4, `transitionTaken` and `shuttleChoice` are labelled act 3, `damage` and the oxygen schedule index are labelled act 2, and `settings` is an open bag of scalars. The project has already added persisted state twice without bumping. So the real count may be one, or zero | Spine A ends with a schema DECISION rather than a schema bump. Default outcome is no bump. **And if the answer is no bump, it must name when the next bump is expected**, because a chain that never runs again is a mechanism going quietly dormant, and `src/save/` calls the migration harness the most valuable thing in the directory |
| **Spine A abstracts over a sample size of one** | The act registry, the content layout and the boundary machinery are all designed against exactly one act. NOW.md states the lesson twice as settled: a wrong sentence in a specification survives until something is built on top of it, found once in DESIGN.md and three times in docs/SIMULATION.md Part 3. `src/sim/jump.ts` already refuses this in the same repository: "THE SEAM IS LEFT OBVIOUS AND IS NOT PRE-SOLVED" | Split the change in two. The de-specialisation is safe and covered by 503 existing tests and both canonical hashes, so it lands in Spine A. **Designing the descriptor's full shape does not.** It gets exactly the fields act 1 needs and act 2 widens it |
| **The review that produced these amendments pushed on the axis this document calls pathological** | Eleven of thirteen amendments add mechanism: guards, assertions, a size budget, a refusal path, a playthrough test. Each is individually correct, and paragraph "The project does the work that a test or a document can certify as done" predicts that nobody would notice | Recorded rather than reversed. Every amendment attaches to work already scheduled rather than adding scope, and the total is about two short stages. **The three parallel items at the top are still the only unverifiable work and they still come first.** If this document ever has to choose between an amendment and item A, item A wins |
| **No stopping rule** | The plan states no total and no budget | The three parallel items at the top exist to produce the evidence a stopping rule would need |

## NOT in scope

| Item | Why |
|---|---|
| Acts beyond the four in docs/PROGRESSION.md | docs/PILLARS.md rule 1, the game is finite |
| Prestige loop, infinite scaling, engagement mechanics | docs/PILLARS.md rule 2 |
| Multicellularity, ecology, the tree of life | The scope contract, and the timeline's admission rule |
| Accounts, backend, network dependency for core play | docs/PILLARS.md rule 7 |
| A second hard transition to give act 4 a pacing beat | docs/PROGRESSION.md: if act 4 drags, cut act 4 content |
| Repairing a cross-engine determinism divergence | UPDATELOGV9.md reports rather than fixes. Its own decision, upheld |
| Per-claim citation identifiers in docs/SCIENCE.md | Deferred to its own log. Provenance-on-click ships first |
| Designing the act descriptor's full shape in Spine A | It would be an abstraction over one act. Act 2 widens it, with two instances to be right about |
| Regrouping the pool rail for act 3 scale in Spine B | Act 3's pools are not written down and its compartment and gradient illustration rules are deferred to the act 3 log. Sizing a component against both would be a guess. Spine B only makes the rail read the running act's pool table |
| A browser-based E2E runner | The headless playthrough test runs through vite-node like the existing harnesses. A second toolchain buys nothing act 1 cannot already assert |
| Repairing NOW.md blocking items 3, 4 and 5 | Named here because nothing in this roadmap repairs anything, which is worth saying out loud in a document whose diagnosis is about what work gets chosen. Item 6 is the exception and it becomes a precondition for act 2 |
| A migration for the act 1 end-of-content state | It persists nothing. It is UI content replaced by act 2's opening, so hard rule 7 does not reach it |

## Constraints this plan must hold

- **The beast is a state readout and never animates on a timer.** DESIGN.md already says this. Breaking it converts the character into a pet with engagement hooks and loses docs/PILLARS.md rule 2.
- **The beast's four discrete states are React state. Anything continuous about it goes on the per-frame DOM write path** that `PoolCard` already uses. React never re-renders at tick rate, which is the project's central architectural claim.
- **The beast may not carry a meaning in movement alone, and this collides with what it was brought in to do.** DESIGN.md open question 7 asks for something that distinguishes holding at a high rate from stopped, and the beast's proposed answer is motion. DESIGN.md's accessibility rule, widened by V7, says nothing may be encoded in movement or colour alone. So every beast state needs a second channel, decided in the DESIGN.md stage rather than discovered during implementation.
- **The timeline marker is discrete and reads the act, never a continuous quantity.** It moves at act boundaries and at nothing else. A marker that slides with cumulative ATP or elapsed time is a progress bar whatever the art looks like, and it would put the largest surface in the game on the per-frame path.
- **Ids resolve to indices at construction, never on the render path.** The kernel already holds this rule and states it in `pools.ts` and `steady.ts`. The runtime does not: `poolIndex` is a linear scan over `ACT1_POOL_IDS` called per render from `PoolCard`. Ten ids today, several times that in act 3. The de-specialisation stage fixes it and asserts it.
- **The act jump must not become a second definition of an act's start state.** It has to synthesize a legal act 3 state, and the boundary machinery already defines one. NOW.md settled the rule this would break: two copies of one fact is the specific way save formats rot.
- **Timeline figures earn their place by metabolism, not morphology.** Making the timeline the frame raises the pressure to add interesting-looking creatures. The admission rule exists to stop that, and it now has load on it.
- **CLAUDE.md hard rule 2 stands.** docs/SCIENCE.md is not edited during a balance pass. Every act's balance numbers go to docs/ECONOMY.md with divergence rows.
- **CLAUDE.md hard rule 7 stands.** Each act's schema bump ships with a migration and a committed fixture from the previous version.
- **A negative result from the cold read is written down.** Including one that invalidates part of this document.

## Implementation Tasks

Synthesized from the engineering review's findings. Each task derives from a specific finding above. P1 blocks the log it sits in, P2 lands in the same log, P3 is a follow-up.

- [ ] **T1 (P1, human: ~0 / CC: ~0)** — roadmap — CI, cross-engine determinism and deploy move ahead of both spine logs
  - Surfaced by: Step 0 — NOW.md "Next, in order" item 1 argues CI is unblocked and next; the plan had reversed it silently
  - Files: this document, UPDATELOGV9.md
  - Verify: the roadmap block above puts CI before SPINE A
- [ ] **T2 (P1, human: ~3 days / CC: ~1 stage)** — src/ui/runtime.ts — de-specialise the runtime, and move act 1 semantics into the descriptor
  - Surfaced by: Architecture issue 1, re-priced by the outside voice. Not a pure rename: `WALLED_NAD = 0.05` at :207, `createAct1(options.act1 ?? {})` at :428, literal `pools.indexOf('g3p')` and `reactionIndex('payoff')` at :480-485, and `poolCards.ts:58` puts act 1 chemistry in a type union
  - Files: src/ui/runtime.ts, src/ui/poolCards.ts, src/ui/RuntimeContext.tsx, src/content/acts.ts
  - Verify: **REGRESSION BAR, mandatory.** `172f83fb` and `49ea08d3` unchanged, 503 tests green, `git diff` empty across the three tuning files, docs/SCIENCE.md and docs/ECONOMY.md
- [ ] **T3 (P1, human: ~half a day / CC: ~1 short stage)** — src/save/ — refuse a save naming an act this build does not have
  - Surfaced by: Code quality issue 6. `codec.ts:260` validates `progression.act` as finite and nothing more; `migrations.ts:76` covers schema version only
  - Files: src/save/codec.ts, src/save/storage.ts, src/ui/components/SavePanel.tsx
  - Verify: a save at act N+1 refuses without throwing, neither slot is written, autosave never arms
- [ ] **T4 (P1, human: ~1 day / CC: ~1 stage)** — src/sim/jump.ts — an act boundary stops the jump
  - Surfaced by: Test review issue 8. Event kinds are pool-only and computed in closed form; `jump.ts:24` lists threshold crossings as not simulation events; the substrate mask is computed once at :385
  - Files: src/sim/jump.ts, src/content/act1/offline.ts, src/ui/components/OfflineReturn.tsx
  - Verify: crossing, not crossing, crossing at window end and crossing at tick 0. The 40-case offline sweep unchanged
- [ ] **T5 (P1, human: ~half a day / CC: ~1 short stage)** — src/ui/__tests__/ — guards discover their inputs
  - Surfaced by: Code quality issue 5, sharpened by the outside voice. `accessibility.test.ts:40-42` lists **10** files; `src/ui/components/` holds **20**. Nine of the ten missing shipped after the guard was written
  - Files: src/ui/__tests__/accessibility.test.ts, src/ui/__tests__/contentStyle.test.ts
  - Verify: probe by breaking the thing each guards, not by reading them
- [ ] **T6 (P1, human: ~0 / CC: ~0)** — decision — act 3 before act 2, priced
  - Surfaced by: the outside voice. Act 3's payoff needs oxygen as terminal electron acceptor and act 2 supplies it
  - Files: this document, docs/PROGRESSION.md
  - Verify: either a placeholder oxygen constant with a DEPARTURE row is accepted in writing, or the order flips
- [ ] **T7 (P1, human: ~2 days / CC: ~1 stage)** — src/sim/ — repair the offline fallback before act 2 is scoped
  - Surfaced by: the outside voice. `EVENT_BUDGET` 64 against up to 51 act 1 events, `SETTLE_MAX_TICKS` 1200 against a walled settle at 1120, plus continuously varying Vmax under ROS
  - Files: src/sim/jump.ts, docs/SIMULATION.md Part 3, NOW.md blocking item 6
  - Verify: `fallback.test.ts` asserts the zero today, so the fix makes it fail and the blocking entry gets deleted rather than left stale
- [ ] **T8 (P2, human: ~1 day / CC: ~1 stage)** — src/content/acts.ts — the act registry, minimum shape only
  - Surfaced by: Architecture issue 1, bounded by the outside voice's n=1 objection
  - Files: src/content/acts.ts, src/content/act1/
  - Verify: the descriptor carries exactly the fields act 1 needs, no speculative act 2 fields
- [ ] **T9 (P2, human: ~1 day / CC: ~1 stage)** — src/ui/content/ — content.ts becomes a directory
  - Surfaced by: the spine log, kept. 957 lines in one file, and the writing-contract guard points at exactly one path
  - Files: src/ui/content.ts, src/ui/__tests__/contentStyle.test.ts
  - Verify: no player-facing literal escapes the guard after the split
- [ ] **T10 (P2, human: ~2 days / CC: ~1 stage)** — act boundary machinery, act 1 ending, end-of-content state
  - Surfaced by: Test review issue 9. Act 2 is scheduled last, so act 1's ending leads nowhere for four logs
  - Files: src/content/acts.ts, src/ui/content/, src/ui/components/
  - Verify: a test asserts the placeholder is gone once act 2 lands
- [ ] **T11 (P2, human: ~1 day / CC: ~1 stage)** — headless playthrough test
  - Surfaced by: Test review. Coverage of the new act 1 end-to-end flow is zero and there is no E2E runner
  - Files: src/content/act1/, package.json
  - Verify: fresh start to boundary, through the wall, both ladders and all three new unlocks
- [ ] **T12 (P2, human: ~half a day / CC: ~1 short stage)** — src/save/ — the schema decision stage
  - Surfaced by: Architecture issue 3. SaveV1 already carries act 2, 3 and 4 fields
  - Files: src/save/schema.ts, docs/SAVE_SCHEMA.md
  - Verify: the decision names either the bump or the date the next bump is expected. Silence is not an outcome
- [ ] **T13 (P2, human: ~1 day / CC: ~1 stage)** — provenance content and its guard, four destinations
  - Surfaced by: Architecture issue 2 plus the outside voice's Contested and `measured` gap
  - Files: src/ui/content/provenance.ts, src/ui/__tests__/provenance.test.ts
  - Verify: every cited SCIENCE Part and ECONOMY row resolves; a badged figure with no entry fails the build
- [ ] **T14 (P2, human: ~2h / CC: ~10min)** — CI — bundle size guard
  - Surfaced by: Performance issue 11. Baseline 278.31 kB, 86.59 kB gzipped, of which fonts are 68.86 kB
  - Files: vite.config.ts or a new test, UPDATELOGV9.md
  - Verify: the build fails past the stated ceiling and reports the delta per build
- [ ] **T15 (P2, human: ~2h / CC: ~10min)** — src/ui/runtime.ts — index resolution at construction
  - Surfaced by: Performance issue 10, sharpened by the outside voice. `runtime.ts:1129` is `ACT1_POOL_IDS.indexOf(id)`, a linear scan called per render from `PoolCard.tsx`
  - Files: src/ui/runtime.ts, src/ui/components/PoolCard.tsx
  - Verify: the map is built once, the render and per-frame paths do no key lookup and allocate nothing
- [ ] **T16 (P3, human: ~30min / CC: ~5min)** — refresh two stale ASCII diagrams
  - Surfaced by: Code quality, diagram maintenance. `src/content/act1/reactions.ts:10-14` and `src/ui/components/PathwayCard.tsx:7-9` both draw act 1's pathway in a comment. After T2 the component renders whichever act is running and the diagram describes one of them
  - Files: src/content/act1/reactions.ts, src/ui/components/PathwayCard.tsx
  - Verify: the diagram says what the file does, or moves to the act 1 descriptor where it is still true

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | CLEAR | 11 proposals, 11 accepted, 0 deferred |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | ISSUES_OPEN | 11 issues, 3 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | — |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

**CROSS-MODEL:** Codex was not installed, so the outside voice ran as an independent Claude subagent with fresh context. It agreed with all eleven engineering findings and added five the review missed: act 3 cannot ship before act 2 because its payoff needs oxygen; the reader gate's pass condition ends three minutes in and cannot inform the fourteen-minute-gap item below it; act 2 plus offline plus the known-broken fallback is an unpriced hazard with real numbers behind it; Spine A abstracts over a sample size of one, which `src/sim/jump.ts` already refuses to do in this repository; and eleven of the review's thirteen amendments push along the exact axis this document diagnoses as the root cause. It also re-priced the runtime refactor, which the review had called a pure rename and is not. Four of the five were absorbed. The act ordering was priced and left open on purpose.

**VERDICT:** CEO CLEARED. ENG NOT CLEARED — one product decision is open and it gates the act 3 log rather than the two logs in front of it. Spine A, Spine B and the CI log are all clear to implement.

**UNRESOLVED DECISIONS:**
- Act 3 before act 2. Act 3's payoff is 2 to roughly 30 ATP and needs oxygen as the terminal electron acceptor, which act 2 supplies, so act 3 first requires a placeholder oxygen constant carrying a DEPARTURE row and an act 3 rebalance when act 2 lands. Either accept that price in writing, or flip the order and withdraw the value-ordering argument in Approach. Nothing before the act 3 log waits on this.
