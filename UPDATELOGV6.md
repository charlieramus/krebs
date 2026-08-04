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

_Pending._

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

_Pending._

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

_Pending._

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

_Pending._

---

# After These Stages

- `docs/CONTENT_STYLE.md` exists, which was the last of the three documents `CLAUDE.md` listed as deferred. `docs/ECONOMY.md` landed in V5 and this one lands here, so every document the index promises is now real.
- The project has, for the first time, a reading of whether it teaches that did not come from the person who built it. `docs/PILLARS.md` success condition 2 has a miniature version with a number attached to it.
- The teaching panel that `DESIGN.md` has specified since 2026-07-28 exists, and the two-paragraph coach mark ceiling now binds against something rather than being a rule with nothing to stop.
- Deliberately not done: the timeline, the beast, act 2 and any change to the economy. A comprehension problem with an economic cause was handed back rather than patched with a sentence.
- The next log is accessibility. It inherits this log's text and its job is to make the text and the illustration perceivable to readers this log's protocol never reached.
