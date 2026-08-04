charlie

# krebs, V6: Comprehension, docs/CONTENT_STYLE.md and the Teaching Layer
# Work on one stage at a time. Do NOT combine stages.

---

## Context

Read `NOW.md` first, then `docs/PILLARS.md` success conditions, `DESIGN.md`'s coach mark and screen inventory sections, and `src/ui/content.ts` end to end. `src/ui/content.ts` is 317 lines and it is every player-facing string in the game.

The slice is playable, it persists, and V5 settled the economy. What it does not do is explain itself. **A player who opens `npm run dev` cold sees eight pool cards, five arrows, an unlock shelf and a paragraph of disclosure, with no statement anywhere of what they are looking at, what they are supposed to do, or what would count as doing it well.** The first thing that happens is that a pathway they were not told about stalls for a reason they were not told about.

`NOW.md` already records why nobody knows whether this is a problem: the V3 play readings came from "the person who built it, who knows where the wall is and what solves it, and that is the least reliable possible reader of whether a teaching beat teaches". `docs/PILLARS.md` success condition 1 is that a biology teacher uses it with a class, and condition 2 is that a player finishes and can correctly explain why aerobic respiration yields roughly fifteen times more ATP than fermentation. **Neither is testable while nobody can tell what is happening on the screen.**

**docs/CONTENT_STYLE.md is the blocker and this log writes it.** V2 stage 2 kept pool labels to molecule names because that document did not exist and inventing a voice before it landed would mean rewriting all ten. V3 stage 3 kept every string minimal for the same reason. `CLAUDE.md` says it is written last. Last has arrived: the economy is settled, so text written now is text written against numbers that are not about to move, which is exactly the reason V5 went first.

This log builds the content style guide, a first run and the teaching layer. It does **not** change the economy, add unlocks, change any tuned number, build the timeline or the beast, or touch act 2. If a comprehension problem turns out to have an economic cause, it is reported and handed back rather than fixed here.

## Decisions

- **The measurement is real people who have never seen it, and the builder's opinion is not a substitute.** `NOW.md` says so in its own words about V3. Stage 2 establishes a cold-read baseline before anything is written and stage 5 re-tests against it. If no cold reader can be found, **say so plainly and report the log as unvalidated** rather than filling the gap with the judgement of the person who built it. An honest "not measured" is the outcome this project prefers and there is precedent in V2 stage 6 refusing to claim more than a console could show.
- **Comprehension is measured by what a reader says, not by whether they finish.** A player can reach the end of act 1 by clicking the only affordable button and understand nothing. The thing being tested is whether they can say what the wall was and why fermentation fixed it, which is a smaller version of success condition 2.
- **Teach through the interface first and through prose second.** `DESIGN.md`'s whole premise is that every visual property carries simulation state and that the illustration teaches at no extra cost. A comprehension failure that can be fixed by making the picture say it should be fixed that way, and a paragraph is the fallback rather than the first move. A game that has to be read is a game that will not be.
- **Two paragraphs is a hard ceiling on a coach mark and `DESIGN.md` means it.** A concept that needs more needs the teaching panel, which is specified in the screen inventory and has never been built. This log builds it, because the moment there is more than one thing to explain the ceiling starts binding.
- **The source row stays mandatory.** `DESIGN.md`: a coach mark without a source row does not ship. More coach marks means more source rows, and every one of them has to resolve to a real `docs/SCIENCE.md` section. If a teaching beat has no source, that is a finding about the beat.
- **Hard rule 1 gets harder as text grows and that is the point.** Every number in new player-facing text needs a badge that resolves. The V3 gate already fails a production build on a surviving `Needs source`, so the mechanism is in place and this log is the first real load on it.
- **The coach mark trigger gets decided by a reader rather than by its author.** `COACH_MARK_TRIGGER` is `'auto'`, and `NOW.md` records that it was "chosen but weakly", by the person who built it, which it calls the least reliable possible reader. Both behaviours are still built and switching is a one-word edit. Stage 5 has actual readers and they decide it.
- **No new tuned numbers if it can be helped, and any that appear owe a divergence row.** V5 built a guard that fails the build when a tuning constant has no row in `docs/ECONOMY.md`. This log should mostly not be adding tuning constants, and if it adds one, the guard will say so before review does.
- **The disclosure paragraph stays verbatim.** `src/ui/content.ts` quotes `docs/SCIENCE.md` Part 1's required text word for word, with a comment saying a paraphrase of a required disclosure is not the required disclosure. That holds. If it is hard to read, the fix is where and how it is presented, never what it says.
- Large system, and the measurement brackets it: six stages.

## What a cold reader currently has to work out unaided

Settled here so stage 2 has a checklist to watch against rather than a vibe.

```
  What the screen never says          Where a player could learn it today

  that they are running a cell        nowhere
  what ATP is for                     nowhere
  what the goal is                    nowhere
  that flux is the big number and     nowhere. DESIGN.md calls this the
    stock is the small one              system's biggest deliberate departure
  what "net rate" means               the label, which says "net rate"
  what NAD+ does                      the one coach mark, after the stall
  why the pathway stopped             the same coach mark
  what "preparatory phase" is         the label
  what g3p is                         the label, which says the full name
  that shape means carbon count       nowhere. It is the design's core claim
  that colour means redox state       nowhere. DESIGN.md's most important
                                        colour decision, never stated
  what a badge means                  nowhere
  what buying uptake capacity does    nowhere
```

Thirteen things. Twelve of them are answered nowhere at all, and the design's two central teaching devices, shape-equals-carbon and colour-equals-redox, are both in the "nowhere" column. The illustration is doing real work and nothing tells the player it is doing any.

---

# Stage 1 — docs/CONTENT_STYLE.md

```
Documentation only. No code, no strings changed. This is the document V2 and V3
both deferred to and it has to exist before anything is written against it.

1. Create docs/CONTENT_STYLE.md. It governs every player-facing string in the
   game and its audience is whoever writes the next one, which will mostly be
   an agent working from a stage prompt.

   Cover at minimum:
     - Voice. What the game sounds like, in two or three sentences, with
       examples of a sentence that fits and one that does not. Note that
       CLAUDE.md's prose rules apply to player-facing text as well: no Oxford
       commas, no em dashes or en dashes, "to" for ranges.
     - Person and tense. Does the game address the player, describe the cell,
       or neither. Pick one and hold it.
     - Naming. When to use "NAD+" and when to use "the carrier". When the full
       name of a molecule is right and when the abbreviation is. g3p is the
       hard case and it is already on the screen as "Glyceraldehyde
       3-phosphate".
     - Numbers in prose. Hard rule 1 and the badge contract. A number in a
       sentence needs a badge the same way a number in a Figure does, and the
       document should say what that looks like inside a paragraph.
     - Length ceilings. DESIGN.md gives coach marks two paragraphs. State what
       a label, a tooltip and a teaching panel get.
     - What the game never says. It never implies a tuned rate is measured, it
       never asserts a contested claim as settled, and it never says a number
       nobody can defend. Those are docs/PILLARS.md rules 4, 5 and 6 restated
       as writing rules, which is what makes them usable at the keyboard.

2. Add a rule the other documents do not have and this project needs: teach
   through the interface first. State that if a concept can be carried by shape,
   colour, position or motion then it should be, and prose is the fallback. Cite
   DESIGN.md's illustration rules, which already do this and are the reason it
   works. A style guide that only governs sentences will produce a game made of
   sentences.

3. Audit the existing 317 lines of src/ui/content.ts against the document you
   just wrote and report where it already complies and where it does not. Do
   not rewrite anything yet. Stage 3 and stage 4 do that with the cold-read
   findings in hand, and rewriting now means rewriting twice.

4. Add docs/CONTENT_STYLE.md to CLAUDE.md's "Where things live" list, which
   currently describes it as written last, and to NOW.md's "What exists" list,
   which currently has it under the not-written heading beside
   docs/ECONOMY.md. Both entries are now wrong.

Verify: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`. No
code changed, so `git diff --stat` shows docs/CONTENT_STYLE.md, CLAUDE.md and
NOW.md only. Report the document in full and the audit from step 3 as a table
of every string that does not comply, with the rule it breaks.
```

## Stage 1 Report

**docs/CONTENT_STYLE.md exists. 286 lines, eight parts and a decisions log.** It is the last of the three documents CLAUDE.md listed as deferred, and the reason it comes after docs/ECONOMY.md is the same reason V5 came before V6: text written against numbers that are about to move is text that gets written twice.

Structure, and what each part decides:

    Part 1  Where strings live       one file, every string badged, badge reasons
                                     are player-facing, sections not line numbers
    Part 2  Voice                    three sentences that fit and three that do
                                     not, person and tense, no teleology, prose
                                     mechanics inherited from CLAUDE.md
    Part 3  Naming                   molecules, the G3P ruling, "the carrier",
                                     enzymes and phases, what the game calls itself
    Part 4  Numbers in prose         four rules, and which badge each kind of
                                     number takes
    Part 5  Length ceilings          nine surfaces, and the escalation rule
    Part 6  Teach through the        the rule the other documents do not have,
            interface first          with a three step test to apply first
    Part 7  What the game never says docs/PILLARS.md rules 4, 5 and 6 restated as
                                     writing rules
    Part 8  How much is mechanism    five testable rules, three that are not, and
                                     a note that stage 6 decides which get built

**The rulings that were genuinely open, rather than restatements.**

**Person is third for biology and the possessive is banned.** No "you", no "your cell". A possessive turns a system being modeled into a pet being kept, and the pet reading is available to a player looking at a blob with a face on it. Second person is allowed only where the subject is the build rather than a cell, which is the first run, the disclosure and the save panel, because those sentences have no cell in them to describe. That leaves stage 3 the room it needs without licensing praise.

**One exception is carved for something already shipping.** A coach mark's action row speaks in the player's voice, not the game's: "Show me what recycles it". First person is correct there and only there. It was kept deliberately rather than by inertia, and it reads as the player pulling the next thing towards them rather than the game pushing it.

**No teleology, with a narrow exception for function.** A cell does not want, try, decide or need. A reaction may be said to have a function, because that is a statement about what it does in the pathway rather than about intent, and docs/PROGRESSION.md's own "its entire function is recycling NAD+" is the sentence being protected.

**ATP and NAD+ are never expanded.** Adenosine triphosphate tells a reader nothing they can use. The third phosphate dot leaving the blob teaches the same fact better and the illustration already draws it. That is Part 6 applied to a naming question rather than a separate rule.

**The G3P ruling.** A pool card is a definition site, so the card keeps "Glyceraldehyde 3-phosphate", because the "3-phosphate" in it is what explains the phosphate dot. Prose uses the full name on first appearance within one coach mark or panel and may use "G3P" after that. Lowercase `g3p` is a pool id, it is code, and it never reaches a player.

**"The carrier" means the pair and never one member.** "The carrier runs out" is false in exactly the way act 1 exists to correct: NAD+ runs out and the carrier is all still there, as NADH.

**Part 5 sets a ceiling on nine surfaces, not one.** DESIGN.md gave a coach mark two paragraphs and gave nothing else anything, which was fine while there was one coach mark and stops being fine the moment there is a second thing to explain. Micro label 3 words and 18 characters, card title 4 words, button 4 words, slot detail 2 sentences and 160 characters, tooltip 1 sentence and 200 characters, coach mark heading 6 words, coach mark body 2 paragraphs and 400 characters, teaching panel 6 paragraphs and 1400 characters with a mandatory source row, first run 3 screens of 1 paragraph each. The disclosure is exempt from all of it, verbatim, and the document says why. A concept that will not fit escalates one surface rather than overflowing, which is the mechanism the ceiling exists to force.

**Part 6 is the rule step 2 asked for and it is written to outrank Part 2.** If a concept can be carried by shape, colour, position or motion, it must be, and prose is the fallback. The three step test is: is this fact already on the screen, could it be cheaply, and only then write the sentence. The tell between a pointer and a description is length, and the document gives the pair. "Six sides, six carbons" points. The paragraph that describes the same thing is longer than the thing it describes.

---

## The audit of src/ui/content.ts

**What complies, and most of it does.** The file was written by V3 under a deliberate refusal to invent a voice, and that restraint turns out to have been the right bet: almost nothing in it has to be unwritten.

    Rule                                          Status
    -----------------------------------------------------------------------
    Part 1  every string carries a badge          Complies. It is the Entry type
    Part 1  source names a section, not a line    Complies. PART1 and PART2 are
                                                  section constants
    Part 2  no exclamation marks                  Complies. Zero in the file
    Part 2  no em dash, no en dash                Complies. Zero in the file
    Part 2  no "simply", "just", "obviously"      Complies. Zero
    Part 2  third person, no "you" or "your"      Complies. Zero occurrences
    Part 2  present tense                         Complies throughout
    Part 2  no teleology                          Complies. "fermentation exists
                                                  to regenerate NAD+" is function
                                                  language and is inside the
                                                  exception
    Part 2  no congratulation                     Complies. Nothing praises
    Part 3  one name per pool, taken from
            src/content/act1/pools.ts             Complies, by import
    Part 3  enzymes called by their real name     Complies. "Lactate dehydrogenase"
    Part 4  numbers in prose                      Complies vacuously. See below
    Part 5  coach mark 2 paragraphs, 400 chars    Complies at 2 and 277
    Part 5  coach mark heading 6 words            Complies at 4
    Part 5  tooltip 200 characters                Complies. Longest badge trace
                                                  in the file is 131

**There is not one number inside a player-facing sentence in the entire game.** Every digit in a `text:` field is the 3 in "Glyceraldehyde 3-phosphate", which is part of a name. So Part 4 and hard rule 1 both pass today and neither has ever been under load. **That is the finding, not the pass.** The badge contract, the `Needs source` gate and hard rule 1 have all been mechanism since V3 and none of them has yet been asked to stop anything, because there has been nothing to stop. Stages 3 and 4 are the first real load on all three.

**What does not comply. Nine strings, and eight of them are in one file that is not content.ts.**

| # | String | Where | Rule it breaks |
| --- | --- | --- | --- |
| 1 | `"Reduces pyruvate to lactate and oxidises NADH back to NAD+. Produces no ATP."` | `src/ui/components/UnlockShelf.tsx:208` | Part 1, a player-facing string outside content.ts |
| 2 | `"At the top of the ladder. Uptake is no longer the limiting step."` | `UnlockShelf.tsx:223` | Part 1 |
| 3 | `"More transport across the membrane. A fixed number of steps, and this is not the last."` | `UnlockShelf.tsx:224` | Part 1 |
| 4 | `"At the top of the ladder. Both phases are running as fast as act 1 allows."` | `UnlockShelf.tsx:240` | Part 1 |
| 5 | `"Both phases of glycolysis together. The investment phase cannot be raised without the phase that pays it back."` | `UnlockShelf.tsx:242` | Part 1, **and Part 3**, "investment phase" |
| 6 | `"Opens once uptake is at the top of its ladder."` | `UnlockShelf.tsx:243` | Part 1 |
| 7 | `"Express it"`, `"Add capacity"`, `"Raise both phases"` | `UnlockShelf.tsx:212, 229, 252` | Part 1. All three are inside the 4 word button ceiling |
| 8 | `"Unlocks"` heading, `aria-label="Unlocks"`, `aria-label="Pools"`, `` `About ${...}` `` | `UnlockShelf.tsx:197, 200`, `PoolRail.tsx:16`, `PoolCard.tsx:190` | Part 1. An `aria-label` is a player-facing string and the rule says so explicitly |
| 9 | `oxidizing` in the ferment unlock badge | `src/ui/content.ts:160` | Part 2, spelling. It renders four inches from `oxidises` in row 1 |

**Row 5 is the one worth naming separately.** The unlock shelf calls the preparatory phase the "investment phase", on a card that sits under a pathway arrow labelled "Preparatory phase". docs/PROGRESSION.md uses "investment phase" in design prose and that is where it came from, which is how a document's internal vocabulary leaks onto a screen. Part 3 bans it from player-facing text for that reason.

**Row 9 is the whole -ise and -ize question and it decided the rule rather than the other way round.** The game currently spells it both ways in two strings that render on the same screen. The document picks -ise and -yse, because the science documents already do, so one convention covers both halves.

**One finding that is not a string and is not in the table.** `SAVE.awayNotSimulated` carries the badge reason "Offline progress lands in V5", which renders into a `title` attribute and is therefore on screen. V5 shipped and it was the economy log, not the offline one. The claim is now false to any player who hovers it. It is listed here rather than in the table because it is a badge reason rather than a string, and Part 1 is explicit that the distinction does not save it: badge reasons are player-facing text and this one was written as a note to the next developer. It is stage 4's or stage 6's to fix.

**Two stale comments, recorded and not fixed.** `src/ui/content.ts`'s header says "docs/CONTENT_STYLE.md does not exist and V3 does not write it", which is now false, and says numbers in strings trace to docs/SCIENCE.md "by line", which V5 banned in favour of section names. `src/ui/components/Badge.tsx`'s `divergenceRow` doc comment says docs/ECONOMY.md does not exist. All three are comments rather than strings and none is fixed here, because step 3 says do not rewrite anything yet and rewriting now means rewriting twice.

**Nothing was rewritten.** Stages 3 and 4 do that with the cold-read findings in hand.

**Step 4, both index entries were wrong and both are fixed.** CLAUDE.md's "Where things live" said "docs/CONTENT_STYLE.md and content entries. Written last." NOW.md's "What exists" said "not written, deliberate, next". Both now describe a document that exists.

**Verify, all clean.** `npm test` 285 passed across 27 files, unchanged from V5. `npm run typecheck` and `npm run lint` silent. `npm run build` 253.48 kB and 79.41 kB gzipped, unchanged from V5 to the byte, which is the expected result of a stage that changed no code. `git diff --stat` shows `CLAUDE.md` and `NOW.md` at one line each, with `docs/CONTENT_STYLE.md` new and untracked. That is the three files the stage predicted, plus this log's own report.

---

# Stage 2 — The cold-read baseline

```
Measurement before change, which is the posture V2 stage 5 established. This
stage writes almost no code and it is the most important stage in the log.

1. Find readers who have never seen the game. Aim for three, accept one, and
   report honestly how many you got. Say for each what they already know about
   biology, because a reader who knows what NAD+ is and a reader who does not
   are measuring different things and both are useful.

   The primary audience per DESIGN.md is high school and undergraduate
   students. A reader outside that band is still worth having and the report
   should say which band each reader was in rather than treating them as
   equivalent.

   IF YOU CANNOT GET A COLD READER, STOP AND SAY SO. Do not substitute your own
   reading. Report the stage as unrun, note that stages 3 and 4 are proceeding
   on reasoning rather than measurement, and make stage 5 the place the log
   admits what it could not check. That is a worse log and an honest one, and
   this project has a precedent for preferring that.

2. The protocol, and hold to it. Open `npm run dev` at a fresh state, hand it
   over, and say nothing. No explanation of what the game is. Ask them to think
   aloud. Do not answer questions during the run, write them down instead,
   because a question asked is a comprehension failure located precisely.

   Let it run at least until the NAD+ wall and ideally until fermentation is
   bought. Note the wall arrives about three seconds in, so this is a short
   observation, not a long one.

3. Record, per reader:
     - The first thing they said.
     - Every question they asked, in order, with the timestamp.
     - What they did when the pathway stalled. Did they notice. How long did
       it take. What did they think had happened.
     - Whether they found the unlock shelf unprompted.
     - What they thought buying lactate dehydrogenase would do, BEFORE buying
       it. This is the misconception docs/PROGRESSION.md line 40 says most
       players arrive with and it is the single most valuable data point in
       this stage.
     - What they thought had happened AFTER buying it.

4. Then ask three questions, in this order, and write the answers verbatim:
     - What is this game about?
     - Why did it stop?
     - Did buying that make you more energy, faster energy, both or neither?

   The third is success condition 2 in miniature. The correct answer is faster,
   not more, and V3 measured that the screen shows it: ATP per second went 0.00
   to 41.87 while glucose per second stayed at exactly 7.95 in the readout right
   beside it. Whether that reads is the thing being tested.

5. Score the thirteen items in this log's "What a cold reader currently has to
   work out unaided" table. For each, did any reader work it out, and from
   what. Report it as a table. This is stage 5's baseline and it only means
   something if it is recorded before anything is written.

Verify: no code changed beyond any instrumentation you added, and if you added
instrumentation say what and remove it if it reaches the player. Report the
reader count and their backgrounds, the full observation record, the verbatim
answers to the three questions, and the scored thirteen-item table.
```

## Stage 2 Report

**UNRUN. Zero readers. The stage was not run and nothing below is a measurement.**

This is the outcome step 1 of the stage prompt named and told the log to take rather than avoid, so it is reported at the top rather than buried under the work that was done anyway.

**Reader count: 0 of a target of 3, accepting 1.** Backgrounds: not applicable, there were none.

**Why, plainly.** This stage was executed by an agent in a terminal on the builder's machine. It has no way to put a running `npm run dev` in front of a person who has never seen the game, no way to hand over control, and no way to hear anybody think aloud. Every input it could produce would be its own, and its own reading is the one thing this stage exists to exclude. There is no partial version of this that is worth having: a protocol whose entire method is "say nothing and write down what a stranger says" cannot be run by the party who is supposed to be silent.

**What was explicitly not done, because doing it would have been the failure rather than the workaround.**

- No simulated reader. Not a persona, not a role-played undergraduate, not a second agent primed to know nothing. A model asked to pretend it has never seen NAD+ is not a reader who has never seen NAD+, and the transcript would be indistinguishable in format from a real one and worthless in content. That is worse than an empty report, because an empty report cannot be mistaken for data.
- No substitution of the builder's reading. `NOW.md` already says why, in its own words about V3: the readings came from "the person who built it, who knows where the wall is and what solves it, and that is the least reliable possible reader of whether a teaching beat teaches". Filling this stage with the same kind of reading would be reintroducing the exact defect V6 exists to remove.
- No instrumentation was added, so there is none to remove. `git diff` for this stage is this report and nothing else.

**The three questions have no answers.** Not "inconclusive". No reader was asked them.

    What is this game about?                                    no answer recorded
    Why did it stop?                                            no answer recorded
    Did buying that make you more energy, faster energy,
      both or neither?                                          no answer recorded

**The thirteen-item table, scored as required and every row reading the same thing.** It is reproduced in full rather than collapsed to a sentence, because stage 5 has to be able to read the two side by side and a missing table is harder to compare against than a table of nulls.

| # | What the screen never says | Did any reader work it out | From what |
| --- | --- | --- | --- |
| 1 | that they are running a cell | not measured | no reader |
| 2 | what ATP is for | not measured | no reader |
| 3 | what the goal is | not measured | no reader |
| 4 | that flux is the big number and stock is the small one | not measured | no reader |
| 5 | what "net rate" means | not measured | no reader |
| 6 | what NAD+ does | not measured | no reader |
| 7 | why the pathway stopped | not measured | no reader |
| 8 | what "preparatory phase" is | not measured | no reader |
| 9 | what g3p is | not measured | no reader |
| 10 | that shape means carbon count | not measured | no reader |
| 11 | that colour means redox state | not measured | no reader |
| 12 | what a badge means | not measured | no reader |
| 13 | what buying uptake capacity does | not measured | no reader |

**The single most valuable data point in the stage is the one most conspicuously absent.** Step 3 asks what a reader thinks buying lactate dehydrogenase will do *before* they buy it, because docs/PROGRESSION.md says most players arrive expecting fermentation to be an energy upgrade and it is not. That misconception is the thing act 1 is built to correct and nobody has ever watched it be corrected or fail to be. It is unmeasured before this log and it is unmeasured after it.

**Consequences for the rest of the log, stated here so stages 3 and 4 inherit them rather than discover them.**

1. **Stages 3 and 4 proceed on reasoning rather than measurement.** They are designed against the thirteen-item table, which is a list of things nothing on the screen says. That list is a fact about the build and was established by reading the code, so it is still true and still actionable. What is not available is any evidence about which of the thirteen actually bite a reader, so both stages have to treat all thirteen as live rather than prioritising by observed damage.
2. **Every "stage 2 showed" instruction in stages 3, 4 and 5 has no antecedent.** Stage 3 step 1 says design the first run against the first-question list, stage 3 step 4 says fix the flux inversion if it was misread, stage 4 step 2 says pick coach marks from the evidence and stage 4 step 4 says decide the glossary from the evidence. There is no evidence. Each of those steps will say in its own report that it decided on reasoning and will state the reasoning, so a later reader can tell which decisions rest on argument and which rest on data. **None of them rest on data.**
3. **Stage 5 is an uncompared measurement at best.** Its own step 1 says so. If it also finds no readers, this log ships unvalidated and should say that in `NOW.md` in those words.
4. **The COACH_MARK_TRIGGER decision has lost the thing that was supposed to decide it.** Stage 5 step 3 gives the choice to readers precisely because `NOW.md` records that the builder chose it and calls that the least reliable possible reader. Without readers the honest outcome is to leave it where it is and leave the `NOW.md` entry open, not to re-decide it with the same unreliable reader and call the entry closed. Recorded here so stage 5 cannot quietly close it.

**This stage is re-runnable and should be re-run.** Nothing in stages 3 to 6 makes it harder: a cold reader in three months reads a different build, which measures that build rather than this one, and the baseline this stage was supposed to establish is gone for good. **The baseline is the loss.** A pre-change reading can only be taken before the change, and after stage 3 lands there is no way back to a build that says nothing. Anybody re-running this later gets a post-change measurement with nothing to compare it to, which is stage 5's job and not this one's.

**Verify.** No code changed and no instrumentation added, so there was nothing to verify beyond that. `npm test` 285 passed across 27 files, `npm run typecheck` and `npm run lint` silent, `npm run build` 253.48 kB and 79.41 kB gzipped. All unchanged from stage 1.

---

# Stage 3 — The first run

```
What the player sees before the simulation matters. Everything here is governed
by docs/CONTENT_STYLE.md from stage 1 and pointed by the findings from stage 2.

1. A first run is not a tutorial and this log is not building one. docs/PILLARS.md
   rule 2 forbids anything that exists to extend session length, and a gated
   multi-step tutorial in an idle game is usually that. What is needed is
   smaller: a player should know what they are running, what the currency is
   and what they are trying to do, before the first thing happens.

   Design it against stage 2's first-question list. If every reader asked "what
   am I?" then that is the sentence to write, and if none did then do not write
   it.

2. Whatever it is, it obeys these:
     - It is skippable and it is skippable on the first screen, not the third.
     - It never blocks the simulation. The cell is alive from t=0 and the tick
       loop does not wait for a reader. Blocking it would make the first thing
       the player learns a lie about what kind of game this is.
     - It is shown once and it is reachable again afterwards. A player who
       skipped it and then wants it must be able to get it, which means it
       lives somewhere permanent as well as appearing once.
     - Whether it has been seen is UI state and belongs under settings in the
       save, which docs/SAVE_SCHEMA.md Part 3 says never affects simulation.
       That is exactly what settings is for and it needs no schema bump,
       because Part 1 says a defaultable missing field is additive.

3. The disclosure paragraph. It is required in-game by docs/SCIENCE.md Part 1
   "in the about screen and on first launch, not buried in a repo file", it is
   quoted verbatim in src/ui/content.ts, and src/App.tsx renders it on the act
   screen because there is no about screen in the slice.

   Two things to settle and neither is a licence to change the words. Does a
   first run make the "on first launch" half of that requirement properly met
   rather than approximately met. And is a dense paragraph on the permanent act
   screen the right place for the "about screen" half, or does the slice now
   want the about screen the inventory has always specified. Decide, and if you
   build an about screen then the act screen's copy can move rather than
   duplicate.

4. Stage 2 will probably have found that the flux-is-the-headline inversion is
   misread, because DESIGN.md calls it the system's biggest deliberate departure
   from genre convention and a departure from convention is the thing a player
   brings the wrong expectation to. If it was misread, fix it here, and prefer
   a change to the readout over a sentence explaining the readout. If it was
   not misread, say so and change nothing.

5. Do not add a goal that the game does not have. Act 1's real goal is to keep
   the pathway running and to learn why it stops, and the game ends after four
   acts per docs/PILLARS.md rule 1. Say the true thing. An invented objective
   is the failure mode here and it would be a worse one than saying nothing.

Verify: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`,
`npm run dev` from a cleared localStorage so the first run actually fires.
Report what you built, which stage 2 findings each part answers, the disclosure
decision from step 3, and confirm the tick loop is running during the first run
rather than waiting for it.
```

## Stage 3 Report

**Every design decision in this stage rests on argument, not on evidence, because stage 2 was unrun.** Each step below says what it decided and what it decided from. Nothing here is described as answering a finding, because there are no findings.

### What was built

    src/ui/components/Overlay.tsx        the overlay shell, plus the context that
                                         suppresses an automatic coach mark
    src/ui/components/FirstRunCard.tsx   the first run. One card, three lines
    src/ui/components/About.tsx          the about panel DESIGN.md has specified
                                         since 2026-07-28
    src/ui/content.ts                    FIRST_RUN and ABOUT, plus ABOUT_THE_BUILD
                                         moved above its first use
    src/ui/runtime.ts                    firstRunSeen and markFirstRunSeen
    src/save/autosave.ts                 SaveReason gains 'setting'
    src/ui/components/TopBar.tsx         the permanent About affordance
    src/ui/components/CoachMark.tsx      auto-fire defers while an overlay is up
    src/App.tsx                          the wiring, and the footer removed

**The card says three things and nothing else.** That there is one cell, roughly 3.5 billion years ago, in water with no oxygen in it. That ATP is the currency, made by breaking glucose down and spent again on everything else. That there is no score and nothing to click, the pathway runs by itself, and the game is about what stops it. 292 characters of prose across three paragraphs, and a test asserts it stays under 300.

**It is one screen, and step 1's "a first run is not a tutorial" is why.** docs/PILLARS.md rule 2 forbids anything that exists to extend session length. Three screens of one line each is a sequence a player has to get through, which is a tutorial in shape even at that length. One card with three lines is smaller than three cards with one.

**That cost docs/CONTENT_STYLE.md a correction on its first contact with real work, one stage after it was written.** Part 5 said "3 screens maximum, 1 paragraph each". It now says one screen, three paragraphs, 300 characters, with the disclosure exempt and not counted. The decisions log carries the row and says the old rule was wrong rather than inconvenient.

**No goal was invented, per step 5.** "The game is about what stops it" is docs/PROGRESSION.md's own act 1 teaching beat stated as a sentence. There is no target, no score and no promise of an ending inside act 1, because the game has none of those and a player told otherwise would play towards a thing that does not exist.

### Step 2, the four constraints, each checked in a browser rather than argued

**Skippable, and on the first screen.** There is one screen, one button, and Escape also closes it. There is no second step to get past.

**It never blocks the simulation, and this is the constraint the build is shaped around.** `Overlay` takes a `dim` flag. The first run passes it false, so there is no scrim: the act screen stays lit, stays clickable and keeps ticking under the card. `pointer-events-none` on the overlay frame with `pointer-events-auto` on the card is what stops it swallowing clicks meant for the unlock shelf underneath. Measured in a real browser with the card open: elapsed game time read 0.4 min, then 0.5 min three seconds later, glucose held at 7.95/s and ATP per second sat at 0.00 because **the NAD+ wall arrived while the card was still on screen**, which is the strongest possible demonstration that nothing waited. The about panel passes `dim` true, because it is a reference surface the player opened on purpose and what is behind it is not what they are looking at.

**Shown once and reachable again.** The about panel is where it lives permanently, and it renders the same `FIRST_RUN` entries rather than a second copy of them. Reached from a permanent About button in the top bar, which is where DESIGN.md's layout puts things that are always visible. A footer under eight pool cards, a pathway and an unlock shelf is not always visible, which is why it is not there.

**UI state, under `settings`, no schema bump.** `settings.firstRunSeen`, a boolean. docs/SAVE_SCHEMA.md Part 3 defines settings as presentation that never affects simulation, and Part 1 makes a defaultable missing field additive. A V4 or V5 save has no such key, defaults to false and shows the card once, **which is the right outcome rather than a tolerated one**: that player has never seen it either. Verified end to end in the browser, `krebs.save.active` carries `settings.firstRunSeen: true` after one dismissal and the card does not return across a reload.

### Step 3, the disclosure, decided both ways it was asked

docs/SCIENCE.md Part 1 requires the text "in the about screen and on first launch, not buried in a repo file". **Neither half was properly met and V3 knew it**: `src/App.tsx` carried a comment saying there is no about screen in the slice so it goes on the act screen. A permanent footer meets "on first launch" only in the sense that it is also there on every other launch, which is not what the sentence asks for.

**Both halves are now met literally. The first run carries the disclosure verbatim and the about panel carries it verbatim, and the act screen footer is gone rather than duplicated.** That is the option step 3 offered and it is the right one: the same 350 characters rendered in three places is three places for it to drift.

**The words did not move and now they cannot.** `disclosure.test.tsx` parses the blockquote out of docs/SCIENCE.md's "Required disclosure text" section and asserts `DISCLOSURE.text` matches it character for character, then asserts both required surfaces render it. Same shape as V3's colour test, and the dependency runs the right way: editing the document fails the build rather than silently disagreeing with the game. **Nothing had ever checked this before**, which is uncomfortable given it is the one string in the project that a document orders the game to print.

**One honest cost, recorded rather than smoothed.** The disclosure used to be on screen without any action. It is now one click away and shown once unprompted. Part 1's own words are "in the about screen and on first launch", so this is compliance rather than a reduction, but a player who dismisses the card without reading it has to open About to find it, and before this stage they did not. If that reads wrong to a cold reader, it is stage 5's finding to make.

### Step 4, the flux inversion, deliberately untouched

**Changed nothing, and the reason is not that it reads well.** Nobody has read it. Step 4 says fix it if stage 2 showed it was misread, and DESIGN.md says flux-is-the-headline "should not be reversed without a reason". A speculative change to the system's biggest deliberate departure, made by its author, in a log whose entire point is that the author is the least reliable reader, would be the exact failure this log exists to remove. **A sentence explaining the readout was also considered and rejected**, because step 4 prefers a change to the readout over prose about the readout, and because docs/CONTENT_STYLE.md Part 6 says a paragraph describing something already on screen is a bug report against the picture. Item 4 of the thirteen-item table is unanswered and stays unanswered.

### One defect found while building, and it would have been silent

**On a fresh run the coach mark fired underneath the first run card and spent its one firing where nobody could see it.** The NAD+ wall arrives about three game-seconds in and `useCoachMark` opens automatically on `walled`, once, by design. A mark that fires once and fires under an overlay is a mark that never fired.

Fixed by deferring rather than queueing. `OverlayOpenProvider` publishes whether anything is on top and the automatic branch returns early while it is. `walled` stays true until fermentation is bought, so the first snapshot after the card closes still reports it and the mark opens then. If the player buys their way out while the card is open the mark never fires, which is correct, because there is no longer a wall to explain. **Confirmed in the browser**: with the card open the mark was absent, and one second after dismissing it the mark was on screen. It defaults to false with no provider, so every existing test behaves exactly as before.

This was found by building it, not by reasoning about it. It is also the first thing in the log that suggests the teaching layer has ordering problems of its own, which stage 4 inherits.

### Verify

`npm run typecheck` and `npm run lint` silent. `npm test` **300 passed across 29 files**, up from 285 across 27. `npm run build` clean at **257.99 kB, 80.51 kB gzipped**, up from V5's 253.48 kB and 79.41 kB, which is 4.51 kB for three components, an overlay shell and a context.

**15 tests added, in two files.** `src/ui/__tests__/firstRun.test.ts` covers the persistence: unseen on a new game, survives save and reload, lands under `settings`, defaults to unseen for a save written before this build existed, carries an unknown setting through untouched, writes immediately with reason `setting` rather than waiting for the thirty second interval, is idempotent, and leaves `hashState` and the tick count untouched. `src/ui/__tests__/disclosure.test.tsx` covers the required text and the first run's ceiling.

**`npm run dev` from a cleared localStorage, and everything in step 2 was checked there rather than asserted.** The card fires, the numbers tick under it, the wall arrives while it is open, dismissing it persists, a reload does not bring it back, the About button reopens it, and the about panel carries the first run body, the badge explanation and the disclosure. Two screenshots were taken and read.

**The coach mark deferral is the one thing in this stage with no test behind it and the report says so.** `vite.config.ts` sets the test environment to `node` and the suite renders through `renderToStaticMarkup`, so effects never run and a subscription-driven behaviour cannot be exercised. It was verified in a real browser instead. That is weaker than a test and it is what is available.

**No tuned number moved.** The three tuning files are untouched by this stage and the V5 divergence guard passes. The act 1 canonical hash is unchanged, asserted by the suite rather than by inspection.

---

# Stage 4 — The teaching layer

```
Coach marks beyond one, the teaching panel DESIGN.md has always specified, and
whatever the illustration can be made to say for itself.

1. The teaching panel. DESIGN.md's screen inventory has it as "overlay for
   concepts too long for a bubble" and the coach mark section says two
   paragraphs is a hard ceiling and a concept needing more needs a panel. It
   has never been built and the ceiling has never bound because there has only
   ever been one coach mark.

   Build it, to the same contract a coach mark has: a heading with a badge, the
   body, and a mandatory source row. Longer than two paragraphs is the whole
   reason it exists, but it is not unbounded and stage 1's style guide should
   have given it a ceiling.

2. Coach marks for the concepts stage 2 showed are not landing. Candidates,
   from the thirteen-item table, and pick from the evidence rather than from
   this list:
     - what ATP is and what the cell spends it on
     - what the carrier pair is and why its total is fixed
     - what the preparatory phase buys with its 2 ATP
     - why yield does not move when throughput does

   That last one is success condition 2 in act 1 form and it is the single
   most important thing in the game to get across. If stage 2's third question
   came back wrong, this is the coach mark that has to work.

   Every one gets a source row that resolves to a real docs/SCIENCE.md section.
   If a beat has no source, report that rather than writing a plausible one.

3. Make the illustration say what it already encodes. This is the "teach
   through the interface first" rule from stage 1 and it is the cheapest
   comprehension win available, because the information is already on screen
   and simply unlabelled.

   Shape equals carbon count and colour equals redox state are the design's two
   central claims and the "What a cold reader has to work out unaided" table
   puts both in the nowhere column. A player who is told once that a six-sided
   blob has six carbons can read the whole pathway from then on without being
   told anything else, because the arithmetic of one six becoming two threes is
   visible. That is DESIGN.md's own argument for the rule and nothing currently
   makes the argument to the player.

   Prefer the smallest thing that does it. A one-time annotation, a hover
   readout, a caption on the first blob. Not a legend panel nobody opens.

4. A glossary, only if stage 2 showed one is needed. Every molecule name on the
   screen is already the real one, which is correct and sourced and also means
   the screen is full of terms like "Glyceraldehyde 3-phosphate". If readers
   stumbled on the names, a glossary is the fix. If they ignored the names and
   read the shapes, then the shapes are doing their job and a glossary is
   furniture. Decide from the evidence.

5. Every string in this stage goes through src/ui/content.ts and obeys
   docs/CONTENT_STYLE.md. Nothing renders a player-facing string from a
   component file. That rule already holds and this stage is the biggest load
   it has taken, so check it rather than assume it.

Verify: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`,
`npm run dev`. Report every coach mark and panel added with its source row,
which stage 2 finding each answers, what you did to make the illustration
self-describing, the glossary decision with its evidence and confirm every new
string lives in content.ts with a resolving badge.
```

## Stage 4 Report

**As with stage 3, every choice below is reasoned rather than measured, because stage 2 was unrun.** Where the stage prompt says "pick from the evidence", the report says what was picked and from what argument.

**The strongest thing found in this stage is that docs/SCIENCE.md Part 2 contains two direct orders to the interface and neither had ever been carried out.** They are not implications, they are sentences addressed to the game:

    "The 2 ATP figure is net of the 2 ATP investment. This is worth surfacing
     in-game because the gross figure of 4 is a common point of confusion."

    "Framing it as an energy pathway is a common misconception and the game
     should correct it directly."

Three logs have shipped interface since those were written. The teaching panel is built around discharging both, which turned "which concept goes in the panel" from a judgement call into a reading of the science document. A test asserts the panel states both figures and makes the fermentation correction, so neither instruction can quietly lapse again.

### 1. The teaching panel

`src/ui/components/TeachingPanel.tsx`, and `YIELD_PANEL` in `src/ui/content.ts`. **The screen inventory has listed it since 2026-07-28 and this is the first log to build it.**

Same contract a coach mark has: heading with its badge, body, mandatory source row. Five paragraphs and 822 characters, against the 6 and 1400 that docs/CONTENT_STYLE.md Part 5 allows, and a test asserts both bounds plus the lower one that matters more, that it is longer than two paragraphs. **"Longer than a bubble" is not "unbounded"**, and a panel that grew without a ceiling would just be the coach mark problem again at a larger size.

Its subject is the one V3 named when it said what would not fit in a bubble. `CoachMark.tsx`'s header has read, since V3: "What did NOT fit is the part players find most surprising, that fermentation buys throughput and buys exactly zero yield. That is reported in stage 3 rather than crammed in, and it belongs on the unlock or in a teaching panel." **It is now on both.**

It says: prep spends 2 to make two 3-carbon pieces, payoff makes 2 from each, so 4 made and 2 spent and 2 net. That the 4 is the number people remember and the 2 is the one that leaves the cell better off. That nothing on the unlock shelf moves the 2. That lactate fermentation makes no ATP at all and buys rate and nothing else. And that the two headline numbers therefore do different things.

**It is success condition 2 in the only form act 1 can state it.** docs/PILLARS.md wants a player who can explain the roughly fifteenfold difference between fermentation and aerobic respiration. Act 1 has one pathway and cannot make that comparison. What it can establish is the half in front of the player, and the panel deliberately stops there: **an earlier draft ended with a line pointing at aerobic respiration and it was cut**, because the build has one act and a sentence promising act 3 is a promise the build cannot keep. Same reasoning as stage 3 step 5.

**Two ways in, because one would have been a lottery.** The two new coach marks escalate into it through their action rows, which is the escalation Part 5 describes. It also hangs off the fermentation slot on the unlock shelf, so a player who never opened a coach mark still reaches the most important thing in the act. **It does not open automatically and that is deliberate**: the obvious trigger, the moment fermentation is bought, is also the moment the two headline numbers visibly diverge on screen, and whether that moment wants an overlay on top of it is a comprehension question. Handed to stage 5 rather than guessed.

### 2. The coach marks, from one to three

    Card          Mark                        Answers, from the thirteen-item table
    ---------------------------------------------------------------------------
    nicotinamide  NAD+ has run out            6, what NAD+ does. 7, why it stopped
                  (V3, unchanged)             Automatic. The only automatic one
    g3p           6 carbons, split in two     8, what the preparatory phase is
                  223 chars, 2 paragraphs     10, that shape means carbon count
    adenylate     ATP does not pile up        2, what ATP is for
                  243 chars, 2 paragraphs

**The g3p card is where sides-equal-carbons goes, and the card is the argument.** DESIGN.md's case for illustration rule 1 is that a player told once that a six-sided blob has six carbons can read the whole pathway afterwards, because one six becoming two threes is visible. **Told ONCE. Nothing in the game had ever told them**, so the design's central claim was being made to nobody. The g3p card is the only place on screen where both halves of the arithmetic are visible at the same time, so the telling goes there rather than on either glucose card.

**The ATP mark went on the adenylate card because that card's headline sits at 0.00 once the cell is in steady state.** A player looking at a currency that has stopped going up is exactly the player who needs to be told it was never going to.

**Its source row is the finding, not its text.** Step 2 says if a beat has no source, report that rather than writing a plausible one. **docs/SCIENCE.md says nothing about the adenylate total being fixed, and a real cell synthesises adenine nucleotides.** What is sourced is the stoichiometry: every act 1 reaction converts one of the pair into the other, so under this pathway the sum does not move. Closing the pool is the game's model and it is one of the three structural departures docs/ECONOMY.md records without a row. **So the mark's heading and both paragraphs carry Tuned badges whose reasons name the sourced half and the invented half separately**, and it would have been very easy to write `sourced(PART2)` there and have nobody notice.

**Two of the three marks are manual by construction rather than by `COACH_MARK_TRIGGER`.** Only the NAD+ mark has a simulation event worth interrupting for. A card that opens an unrequested bubble whenever some condition happens to be true is what turns teaching into nagging, and neither of the new ones has such a condition. The trigger constant still governs the one mark it always governed, so stage 5's decision about it is unchanged in scope.

**Every source row resolves, and that is now mechanism.** `teaching.test.tsx` parses the `# Part N:` headings out of docs/SCIENCE.md and asserts each mark's and the panel's source row names a Part that exists, with a guard-the-guard assertion so the parser cannot pass vacuously. It also asserts the two paragraph ceiling and the 400 character body ceiling per mark, which had never been checked because there had only ever been one mark to check.

### 3. Making the illustration say what it encodes

**The smallest thing that does it, per step 3: every blob now says what it is.** `Blob` renders a `<title>`, which is a native hover tooltip, carrying the same string as its `aria-label`. The string is composed by `blobReadout` in `src/ui/content.ts` from the conserved weights in `src/content/act1/pools.ts`, which is the same table the geometry is drawn from. Read out of the running page:

    Glucose (environment). 6 sides, 6 carbons
    Glucose. 6 sides, 6 carbons
    Glyceraldehyde 3-phosphate. 3 sides, 3 carbons. 1 phosphate
    Pyruvate. 3 sides, 3 carbons

**Derived, not written, and a test asserts the derivation rather than the strings.** It checks that glucose's count is twice g3p's and that ATP carries exactly one more phosphate than ADP, both read from the pool table. A stoichiometry change moves the picture, the readout and the test together. Composed in a `.ts` file so no `.tsx` formats a number, which keeps the tabular-figures lint rule intact.

**This is the first player-facing text in the project's history with numbers in it.** Stage 1's audit found the count was zero. Every number here is a conserved weight tracing to docs/SCIENCE.md Part 2, and the badge is the one the pool card already renders for every figure on it.

**Colour-equals-redox gets the same treatment on the one blob that uses it.** `CARRIER_READOUT`: "NAD+ and NADH. One shape, and the colour is which one it is. Full colour means NADH, carrying electrons." Item 11 of the thirteen, which DESIGN.md calls "the single most important colour decision in the system" and which nothing on the screen had ever stated. A legend panel was considered and rejected on step 3's own instruction to prefer the smallest thing and not build a panel nobody opens.

**One honest limit: a hover readout needs a pointer.** It is not reachable by touch and it is not reachable by keyboard. The `aria-label` covers screen readers and the coach mark covers the argument, so the information exists on three channels, but a touch player gets two of the three. That is an accessibility gap and it belongs to the next log, which is the accessibility pass.

### 4. The glossary: not built

**Decided on reasoning, and the reasoning is against it.** Step 4 says build one only if stage 2 showed one is needed, and stage 2 showed nothing. Three arguments, in order of weight. Every molecule name on screen is already the real one, which is correct and sourced, and the three coach marks now name the hard ones in context, which is where a definition is actually usable. docs/CONTENT_STYLE.md Part 6 says a concept carried by shape must not be carried by prose, and the blob readouts now make the shapes self-describing, which is the failure mode a glossary would have been papering over. And a glossary is a surface a player has to decide to open, which is the same objection that killed the legend panel one paragraph above.

**Recorded as a reversible decision rather than a closed one.** If stage 5's readers stumble on the names, the finding is specific and the fix is cheap.

### 5. Where the strings live

**Every string this stage added is in `src/ui/content.ts` with a badge that resolves.** Checked rather than assumed, as step 5 asks: three coach marks, the panel, the panel affordance, the carrier readout and the blob readout function, all exported from that file, all typed as `Entry` or a shape built from it, and no component in this stage writes a literal to the player.

**The pre-existing violations from stage 1's audit are still there and are still stage 6's.** `UnlockShelf.tsx` renders ten literals, and building on it in this stage surfaced an eleventh the audit missed: `{bought ? 'Running' : buyLabel}` on line 119. Fixing them here would have mixed a coherence pass into a feature stage; the count is now eleven and stage 6 has it.

### One correction to docs/CONTENT_STYLE.md, made by its own test

**The button ceiling was 4 words and V3's best line is 5.** `teaching.test.tsx` failed on "Show me what recycles it", which V3's play reading calls the strongest beat in the build. Rewriting the best line in the game to satisfy a rule that was one day old and had never been measured is the tail wagging the dog, so **the ceiling moved to 5 and the decisions log says why**. 5 is the widest button that ships and nothing else in the game exceeds 4, so it is set at what is there rather than at a rounder number.

**That is the second ceiling this document has lost on contact with real work in two stages**, after the first run's three-screens rule in stage 3. Both were written without checking them against what already existed. The pattern is worth naming: **the parts of docs/CONTENT_STYLE.md that were derived from the shipped build have held, and the parts that were chosen have not.** Neither correction weakened a rule that was doing work.

### Verify

`npm run typecheck` and `npm run lint` silent. `npm test` **319 passed across 30 files**, up from 300 across 29. `npm run build` clean at **262.79 kB, 81.78 kB gzipped**, up from stage 3's 257.99 kB and 80.51 kB.

**19 tests added in `src/ui/__tests__/teaching.test.tsx`**, plus one existing test amended. `illustration.test.ts` failed correctly when the `<title>` landed, because it compares the NAD+ and NADH markup for identity after normalising away what is legitimately different. The readout is text about the shape rather than the shape, so it joins the fill and the `aria-label` in the normaliser, and the comment says why. **The test caught a real change and the fix did not weaken it.**

**`npm run dev`, checked in a browser from a cleared localStorage.** All four affordances present with meaningful accessible names, which is an improvement in itself: the info buttons are now named by their coach mark headings rather than by "About NAD+ / NADH". The carbon mark opens, its action opens the panel, the panel states both figures and the fermentation correction and renders its source row, and the four blob readouts above were read out of the live DOM rather than from the source. Screenshots taken and read.

**No tuned number moved.** The three tuning files are untouched, the V5 divergence guard passes and the act 1 canonical hash is unchanged.

---

# Stage 5 — Re-test cold, and decide the coach mark trigger

```
The other half of the bracket. Same protocol as stage 2, fresh readers, and the
comparison is the deliverable.

1. Fresh readers. Nobody from stage 2, because a second reading by the same
   person is not a cold read and the whole method depends on that. Same
   protocol, same three questions, same thirteen-item scoring.

   Report the same shape of record so the two stages can be read side by side.
   If stage 2 was unrun for want of readers, say so again here and report this
   stage as an uncompared measurement rather than an improvement.

2. Score against the baseline. Which of the thirteen moved, which did not, and
   which got worse. Something getting worse is a real possibility once there is
   more on the screen and it should be reported rather than smoothed.

   The three questions are the headline. Report the verbatim answers next to
   stage 2's.

3. Decide COACH_MARK_TRIGGER from what the readers did. NOW.md records that it
   is 'auto', that the choice was weak, that under 'manual' nothing on the
   screen explains the stall at all, and that it was chosen by the person who
   built it. This stage has readers, so this stage decides it.

   If stage 3 or 4 added something that explains the stall without the coach
   mark, then 'manual' may now be viable where it was not, and that is a real
   change in the argument rather than a change of taste. Say which it is.

4. Report what is still not understood. There will be something. Name it, say
   whether it is a text problem, an interface problem or an economy problem,
   and hand economy problems back to docs/ECONOMY.md rather than fixing them
   here.

5. Success condition 2 in miniature: how many readers answered "faster, not
   more" to the third question. Report the number and the denominator. This is
   the closest thing the project has yet had to a measurement of whether it
   teaches, and it deserves to be reported as a bare fraction rather than as a
   characterisation.

Verify: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
Report both reader sets side by side, the thirteen-item comparison with
anything that regressed called out, the verbatim answers to all three questions
from both rounds, the COACH_MARK_TRIGGER decision with the reader evidence, and
the bare fraction from step 5.
```

## Stage 5 Report

**UNRUN, for the same reason stage 2 was. Zero readers, and this log ships unvalidated.**

Step 1 says that if stage 2 was unrun for want of readers, say so again here and report this stage as an uncompared measurement rather than an improvement. **It is worse than uncompared. There is nothing on either side of the comparison.**

**Step 5, the headline, reported as the bare fact step 5 asks for rather than as a characterisation.**

    Readers who answered "faster, not more" to the third question:  0
    Readers asked:                                                  0

**There is no fraction, because there is no denominator.** 0 of 3 would be a finding and this is not one. The closest thing this project has yet had to a measurement of whether it teaches is still nothing, and V6 has not changed that. **What V6 changed is what there is to measure**, which is a different claim and a smaller one, and NOW.md should say it in those words.

**The three questions, side by side with stage 2's, as step 2 requires.**

    Question                                    Stage 2      Stage 5
    -----------------------------------------------------------------------
    What is this game about?                    no answer    no answer
    Why did it stop?                            no answer    no answer
    More energy, faster energy, both, neither?  no answer    no answer

No reader was asked either time. Nothing was simulated, role-played or substituted, for the reasons stage 2 gave at length.

### What can honestly be said instead, and what it is not

The thirteen-item table below records **whether the build now says the thing at all**. That is a fact about the code, established by reading it, and it is the same kind of claim the log's own "What a cold reader currently has to work out unaided" table made before any of this was built. **It is not a comprehension measurement and must never be reported as one.** A screen that says something and a reader who understands it are different facts, and the entire point of stages 2 and 5 was to get the second one.

    #   What the screen never said        Now          Where, and on what surface
    ------------------------------------------------------------------------------
    1   that they are running a cell      SAID         first run, about panel
    2   what ATP is for                   SAID         first run, ATP coach mark
    3   what the goal is                  SAID         first run, and it says the
                                                       true thing: no score, and
                                                       the game is about what stops
    4   flux is the big number            NOT SAID     deliberately. Stage 3 step 4
                                                       changed nothing without a
                                                       reader. Unmoved
    5   what "net rate" means             NOT SAID     nothing was added. See below
    6   what NAD+ does                    SAID         NAD+ coach mark, unchanged
                                                       since V3, plus the carrier
                                                       readout
    7   why the pathway stopped           SAID         NAD+ coach mark, and now the
                                                       teaching panel says it again
                                                       from the other direction
    8   what "preparatory phase" is       SAID         carbon coach mark, panel
    9   what g3p is                       SAID         blob readout plus the carbon
                                                       mark. Indirect: it says what
                                                       it is made of and where it
                                                       came from, not its role
    10  shape means carbon count          SAID         carbon coach mark, and every
                                                       blob readout
    11  colour means redox state          SAID         carrier readout. HOVER ONLY.
                                                       See the caveat below
    12  what a badge means                SAID         about panel
    13  what buying uptake does           SAID         panel, and the slot detail

**Eleven of thirteen are now stated somewhere. Two are not, and they are different cases.**

Item 4 is unstated on purpose and stage 3 explained why: changing DESIGN.md's biggest deliberate departure on the author's speculation, in a log built to remove the author's speculation, would have been the failure this log exists to prevent. **It is unmoved rather than unaddressed.**

**Item 5 is a genuine miss and nothing in this log noticed it until now.** "Net rate" appears on eight pool cards. It is the most repeated phrase in the interface, it is jargon, and its only explanation remains the label, which says "net rate". Three coach marks and a panel were added and not one of them mentions it. **It is a text problem, it is cheap, and it is not fixed here** because stage 5 is a measurement stage and adding a coach mark in it would be building in the stage whose job is to find out whether the building worked.

**The item 11 caveat, restated because a SAID with a condition on it is not a SAID.** The carrier readout is a `<title>`, so it is a hover tooltip. A player on a touch screen cannot reach it and a keyboard player cannot reach it. The `aria-label` covers screen readers and the coach mark covers the argument for item 10, but colour-equals-redox is the one claim that exists on the hover channel alone for a sighted touch player. That is an accessibility gap and it belongs to the next log.

### Step 3, the COACH_MARK_TRIGGER decision

**It stays `'auto'`, it was not decided by a reader, and the NOW.md entry stays open.**

Stage 5 exists to take this decision away from the person who built it, because NOW.md calls that person the least reliable possible reader. **With no readers, re-deciding it would hand the choice straight back to the reader the stage was designed to exclude, and then close the entry as though it had been settled.** That would be worse than leaving it, because a closed entry stops anybody looking at it again.

**Step 3's real question can be answered, though, and the answer is no.** It asks whether stage 3 or 4 added something that explains the stall without the coach mark, which would make `'manual'` viable where it was not, and says to name which it is. Checked against the build:

- The first run frames the stall as the subject of the game and does not explain it.
- The teaching panel does explain it, in the fermentation paragraph: NADH goes back to NAD+, "which is the only thing that was stopping the pathway."
- The carrier readout says the colour is the redox state, which is the wall arriving, but not that it is a wall.

So under `'manual'` there is now a second route to an explanation where there was one. **But NOW.md's objection was never that there was only one route. It was that the player has to find a 16px info affordance, and the new route is also a 16px info affordance.** The argument for `'auto'` is slightly weaker and it is not overturned. **That is a change in the argument rather than a change of taste, and the change is not large enough to move the setting.**

### Step 4, what is still not understood

**Everything.** Not one comprehension claim in this project has been checked by anybody who was not its author, and V6 was the log that was supposed to change that. Named specifically, and typed as step 4 asks:

- **Whether any of the thirteen land. Unknown, and it is not a text, interface or economy problem. It is a measurement problem** and it is the only one on this list that no amount of building can close.
- **Whether "faster, not more" is the answer a player gives. Unknown.** This is success condition 2 in miniature and it is the single most valuable unmeasured thing in the project.
- **Whether the panel is reachable in practice. Unknown, and it is an interface problem.** The most important explanation in the act sits behind two 16px affordances and a coach mark action. Whether it should open itself at the moment fermentation is bought, which is the moment the two headline numbers visibly diverge, is exactly the kind of question stage 5 was meant to answer.
- **Whether "net rate" reads. It is a text problem, it is item 5, and it is unfixed.**
- **Whether moving the disclosure off the act screen cost anything. It is an interface problem.** Stage 3 met docs/SCIENCE.md Part 1 more literally than V3 did and made the text one click away instead of always visible. That is compliance, and whether it reads as burial is a reader's call.
- **Whether the first run is read or clicked through. It is an interface problem.** It has one button and no gate, which is correct by docs/PILLARS.md rule 2 and also the easiest thing in the world to skip.

**Nothing on that list was handed back to docs/ECONOMY.md, and that is a result rather than an omission.** Step 4 says economy problems go back rather than being fixed here. No comprehension problem found in this log has an economic cause: every one of them is about what the screen says or whether anybody read it. The economy V5 settled was not implicated once in six stages.

### Verify

`npm run typecheck` and `npm run lint` silent. `npm test` **319 passed across 30 files**, unchanged from stage 4. `npm run build` **262.79 kB, 81.78 kB gzipped**, unchanged from stage 4 to the byte, which is the expected result of a stage that changed no code and, in this case, could not.

---

# Stage 6 — Coherence, verify and NOW.md

```
Close the log out.

1. Coherence pass over every player-facing string. Every one lives in
   src/ui/content.ts, every one obeys docs/CONTENT_STYLE.md, every number in one
   carries a badge that resolves, and no component file renders a literal
   string to the player. Fix what you find.

   Then decide whether the content style guide should be mechanism rather than
   discipline, the way V3 made the badge contract mechanism and V5 made the
   divergence table mechanism. Some of it can be: a test that no .tsx file
   outside content.ts contains a player-facing string literal, and the CLAUDE.md
   prose rules are greppable. Voice is not testable and should not be faked.
   Make the call, apply whatever half is real, and prove it fires with a probe.

2. Confirm no tuned number moved. This log was not supposed to touch the
   economy. `git diff` across the whole log against the three tuning files must
   be empty, and the V5 guard must still pass. If a stage did add a tuning
   constant, it owes a docs/ECONOMY.md row and the guard will already have said
   so. Report either way.

3. Full verify: `npm run typecheck`, `npm run lint`, `npm run build`,
   `npm test`. Report the test count and bundle size against V5's figures.
   Confirm the act 1 canonical hash is unchanged from whatever V5 left it at,
   because a comprehension log that moved the simulation hash has changed the
   simulation and that is a defect.

4. Update NOW.md:
   - Status: whether the game explains itself, stated with the stage 5 fraction
     rather than characterised.
   - Build state table: V6 done, with the date.
   - A "What the teaching layer does" section, sibling to the others.
   - Blocking: anything stage 5 found that is not fixed. Be specific about
     which are text, which are interface and which were handed back to the
     economy.
   - "Open, not blocking": close the COACH_MARK_TRIGGER entry with the reader
     decision. Close or update the entry recording that the builder is the
     least reliable reader, since this log is the first to have other readers,
     and say how many.
   - "Next, in order": the accessibility pass, then offline progress. Say why
     accessibility follows this log rather than preceding it: it inherits this
     log's text and its job is making that text and the illustration
     perceivable, which needs them to exist first.

5. Update DESIGN.md. The teaching panel is built, so the screen inventory entry
   is no longer aspirational. Add decisions-log rows for anything this log
   decided, including the coach mark trigger, with the reader evidence as the
   rationale rather than an argument.

6. Do not update docs/SCIENCE.md. Nothing in this log is a biological finding,
   and hard rule 2's sibling posture applies: a comprehension pass records what
   readers did, not what cells do.

Verify: everything above clean. Report the step 1 mechanism decision with its
probe output, the confirmation that no tuned number moved, the test count, the
bundle size, the unchanged canonical hash and the NOW.md and DESIGN.md diff
summaries.
```

## Stage 6 Report

### Step 1, the coherence pass, and what it found

**The audit in stage 1 listed nine non-compliant strings. The true count was fifteen, and the guard found the last two.**

Eleven strings moved out of `UnlockShelf.tsx` into `src/ui/content.ts`, plus one aria-label from `PoolRail.tsx` and two pieces of coach mark furniture from `CoachMark.tsx`, the "i" and the "Dismiss". Stage 4 had already found an eleventh in the shelf that stage 1's audit missed, `{bought ? 'Running' : buyLabel}`. **Then the guard, run for the first time, found two more that three separate manual passes had walked past:**

    src/ui/components/TopBar.tsx: >krebs<
    src/ui/components/UnlockShelf.tsx: >of<

**The wordmark is the find worth naming.** It is the string in this game most likely to change, because DESIGN.md open question 1 and docs/BRIEF.md both record that the working title is still TBD and that "krebs" names an act 3 mechanic that unlocks roughly four hours into a game whose first 45 to 90 minutes are anaerobic. It was hardcoded in a component through six logs. It is now `WORDMARK` in `content.ts` with a badge saying the title is provisional, so choosing one is a one-line edit rather than a search. **Three human passes looked for hardcoded strings and none of them saw the game's own name**, which is the whole argument for the guard rather than the discipline.

**Two content corrections came with the move rather than after it.** "The investment phase" was a third name for the preparatory phase on a card sitting under an arrow labelled "Preparatory phase", banned by docs/CONTENT_STYLE.md Part 3. And "oxidizing" in the ferment badge disagreed with "oxidises" in the ferment detail, four inches apart on the same shelf, settled at -ise.

**One badge reason was false on screen and is fixed.** `SAVE.awayNotSimulated` read "Offline progress lands in V5". V5 was the economy log. A badge reason renders into a `title` attribute, so this was a stale claim a player could hover, not a stale note to a developer. It now names no version at all, so it cannot go stale again by a log shipping something else.

### Step 1, the mechanism decision

**Built, and the call was to build every one of the five rules docs/CONTENT_STYLE.md Part 8 listed as testable.** `src/ui/__tests__/contentStyle.test.ts`, ten assertions in two groups.

    no player-facing literal text node in any .tsx
    no player-facing literal passed to aria-label, title, alt, placeholder,
      label, detail, buyLabel or infoLabel
    no em dash and no en dash, including inside ranges
    no exclamation mark, anywhere
    no curly quote or curly apostrophe
    no "investment phase"
    no -ize spelling
    no "simply", "obviously" or "of course"
    plus a guard-the-guard assertion on each half

**Voice is not tested and was not faked.** Part 8 said so before this stage existed and this stage did not quietly reinterpret it. Neither is Part 6, which asks whether a paragraph should have been a shape, and which is a judgement every time.

**One exemption, and the reason is structural rather than a convenience.** `src/ui/components/Badge.tsx` renders "Sourced", "Tuned", "Contested" and "Needs source". They cannot come from `content.ts` because `content.ts` imports `Badge` to build every badge in the game, and the import would be circular. They are also DESIGN.md's vocabulary rather than authored copy, the way the colour tokens are. The allowlist has one entry and the header says any addition should be argued in a log.

### The probe, and the two holes it found in the guard

**Planted `<h2>Resources so far!</h2>` and `aria-label="Your resources"` in `PoolRail.tsx`.** The aria-label assertion fired. **The text node assertion did not**, and that is the most useful thing in this stage.

The prose detector was a character allowlist, `^[A-Za-z][A-Za-z0-9 ,.'+/()-]*$`, and the exclamation mark was not in the list, so the probe walked straight through. **A guard that only catches politely punctuated violations is worse than no guard, because it reads as coverage.** Inverted: anything containing a letter is prose unless it contains a character that cannot appear in a sentence a player reads. Re-probed, and both assertions fire:

    src/ui/components/PoolRail.tsx: >Resources so far!<
    src/ui/components/PoolRail.tsx: aria-label="Your resources"

**The second hole was in the -ise rule and it was a false positive rather than a false negative.** The first version was the suffix pattern `\w+iz(e|ed|es|ing)\b` and it flagged **"Pool sizes are tuned"**, because English spells "size" with a z and no suffix rule separates it from "oxidize". It is now a list of the verbs the domain actually uses, and the comment says why a list rather than a pattern: a guard with false positives gets disabled.

**Both were found by running the guard against a violation rather than by reading it**, which is the same lesson V3's stage 2 recorded when its shadow test failed to fire against a deliberate blur. Probe removed, repository clean.

### Step 2, no tuned number moved

**Confirmed by diff across the whole log rather than by assertion.**

    git diff ba0c405 -- src/content/act1/tuning.ts src/ui/tuning.ts src/save/tuning.ts
    (empty)

The V5 divergence guard passes, 3 tests. No stage added a tuning constant, so no stage owed a docs/ECONOMY.md row, and the table still holds 37.

**docs/SCIENCE.md is untouched across every commit of this log**, confirmed the same way and required by step 6. A comprehension pass records what readers did, not what cells do, and in this log's case it recorded that there were none.

### Step 3, full verify

    npm run typecheck    silent
    npm run lint         silent
    npm test             329 passed across 31 files    V5: 285 across 27
    npm run build        263.44 kB, 81.90 kB gzipped   V5: 253.48 kB, 79.41 kB

**44 tests added across four new files**: `firstRun.test.ts` 8, `disclosure.test.tsx` 7, `teaching.test.tsx` 19, `contentStyle.test.ts` 10. One existing test amended, `illustration.test.ts`, which failed correctly when the blob `<title>` landed and now normalises it away with a comment saying why.

**The act 1 canonical hash is `49ea08d3`, unchanged from what V5 left it at**, asserted by `determinism.test.ts` rather than by inspection. A comprehension log that moved the simulation hash would have changed the simulation, and that would be a defect rather than a note.

**9.96 kB of bundle for the whole teaching layer**, 2.49 kB gzipped: three components, an overlay shell, two contexts, three coach marks, a panel and every string.

### Step 4, NOW.md

Updated. Status now opens on the fraction rather than on a characterisation, and states the distinction the rest of the page depends on: **what changed is not that the game teaches, it is that there is now something to measure.** Build state gains V6 as done and unvalidated, and gains real rows for V7, V8 and V9, which were read off the existing log files rather than invented. A "What the teaching layer does" section sits beside the kernel, content, interface, save and economy sections.

**Blocking gains item 0, "Nobody who is not the author has ever looked at this game."** It is stated as blocking rather than as an open question for two reasons: it gates docs/PILLARS.md's first two success conditions, and **no amount of further building closes it.** It also records the loss honestly, that a pre-change baseline can only be taken before the change and cannot now be recovered.

**Blocking gains item 3, the one text gap: "net rate" is unexplained.** Eight cards carry it, it is the most repeated phrase in the interface, and three coach marks and a panel went by without mentioning it.

**Blocking item 2 gains a warning against counting this log as progress against it.** V6 gave a solved act 1 two coach marks and a panel a player can open while nothing is happening. That is reading material rather than an event.

**The COACH_MARK_TRIGGER entry stays open and says why it stayed open**, which is the opposite of what step 4 asked for and is the honest version of it. Step 4 says close it with the reader decision. **There was no reader decision.** Closing it on the same unreliable reader's second opinion would stop anybody looking at it again, which is worse than leaving it. The entry now records the one thing that did move: the teaching panel explains the stall too, so `'manual'` has two routes rather than one, and both are 16px affordances, so the objection stands.

**The "builder is the least reliable reader" entry is updated and not closed, and it says how many.** Zero. It is cross-referenced to Blocking item 0, where it now lives as work rather than as a caveat.

**"Next, in order" gains a step 0 that is not a log**, find one cold reader, and says explicitly that it does not block V7 and V7 should not wait for it. It then puts accessibility first with the dependency argument step 4 asked for: **before V6 there was one coach mark, no panel, no first run and no readout on any blob, so an accessibility pass would have been auditing an empty room and would have had to run again over everything V6 added.**

### Step 5, DESIGN.md

The screen inventory no longer describes the teaching panel or the about screen as aspirational, and gains a first run row that was never in the original inventory. The coach mark section records that its two load-bearing sentences, the mandatory source row and the two-paragraph ceiling, are mechanism as of today and had never been checked. A "What V6 found" block sits beside "What survived contact", carrying four findings, of which the sharpest is that **an encoding nobody is told about is a decoration**: rules 1 to 3 have been correctly implemented and derived since V3 and this document's own argument for rule 1 turns on the player being told once, and nothing had told them.

Six decisions-log rows added, each with reader evidence as its rationale where there was any and an explicit statement of its absence where there was not. **The COACH_MARK_TRIGGER row leads with "Not a reader decision, because V6 found no readers"**, so a later reader of that table cannot mistake it for one.

### What this log is, said plainly

**V6 built the thing that was supposed to be measured and did not measure it.** docs/CONTENT_STYLE.md exists, which was the last document CLAUDE.md listed as deferred. The teaching panel DESIGN.md specified on 2026-07-28 exists. Eleven of thirteen unstated things are now stated. Two explicit instructions sitting unexecuted in docs/SCIENCE.md Part 2 are discharged. The style guide is mechanism and its guard found the game's own name hardcoded in a component.

**And the number that decides whether any of it works is 0, out of 0 asked.** The log's own "After These Stages" section says it would give the project "a reading of whether it teaches that did not come from the person who built it". It did not. That promise is unkept, it is recorded as Blocking item 0 rather than softened, and it is the one thing on this project's list that building cannot fix.

---

# After These Stages

- `docs/CONTENT_STYLE.md` exists, which was the last of the three documents `CLAUDE.md` listed as deferred. `docs/ECONOMY.md` landed in V5 and this one lands here, so every document the index promises is now real.
- The project has, for the first time, a reading of whether it teaches that did not come from the person who built it. `docs/PILLARS.md` success condition 2 has a miniature version with a number attached to it.
- The teaching panel that `DESIGN.md` has specified since 2026-07-28 exists, and the two-paragraph coach mark ceiling now binds against something rather than being a rule with nothing to stop.
- Deliberately not done: the timeline, the beast, act 2 and any change to the economy. A comprehension problem with an economic cause was handed back rather than patched with a sentence.
- The next log is accessibility. It inherits this log's text and its job is to make the text and the illustration perceivable to readers this log's protocol never reached.
