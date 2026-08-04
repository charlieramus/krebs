# Content Style

Last updated: 2026-08-03

The writing contract. It governs every player-facing string in the game, the same way DESIGN.md governs every visual decision. If a sentence conflicts with anything here, the sentence loses.

Its audience is whoever writes the next string, which will mostly be an agent working from a stage prompt. So it is written to be usable at the keyboard rather than to be admired: rules first, examples beside them, and a ceiling on everything that has one.

## What this document is

CLAUDE.md listed this file as written last, and last has arrived. V2 stage 2 kept pool labels to molecule names because this document did not exist. V3 stage 3 kept every string minimal for the same reason and said so in the header of `src/ui/content.ts`. Both deferred here rather than inventing a voice that would have to be rewritten once this landed.

The reason it comes after docs/ECONOMY.md is the same reason V5 came before V6. Text written against numbers that are about to move is text that gets written twice. The economy is settled, every tuned number has a row and a guard keeps them in step, so text written now is text written once.

## What this document is not

It is not a copy deck. It does not contain the strings. Those live in `src/ui/content.ts` and nowhere else.

It is not a style guide for the repository's prose. CLAUDE.md owns that, and its rules apply here as well rather than instead. See "Prose mechanics" below.

It does not decide what a screen says. docs/PROGRESSION.md owns the teaching beats and DESIGN.md owns the surfaces they land on. This document decides how a beat sounds once somebody has decided it is a beat.

---

# Part 1: Where strings live

**Every player-facing string lives in `src/ui/content.ts`.** No component file renders a literal to the player, including button labels, headings, empty states and `aria-label` values. A string in a component is a string nobody can audit, because the audit reads one file.

**Every string carries a badge, including the ones with no number in them.** DESIGN.md applies the badge contract to every quantitative claim. This project went wider in V3 and badges every string, because a molecule name is a claim too: "Glyceraldehyde 3-phosphate is what the preparatory phase hands to the payoff phase" is checkable, and the badge is where a reader finds out whether anyone checked it. That decision is kept.

**The badge reason is player-facing.** `badgeTrace` renders into a `title` attribute, so every word of a `tuned()` reason and every `sourced()` reference is on screen to anyone who hovers. Write them as text, not as notes to yourself. A reason that will read as stale in three logs is a string that will be stale in three logs.

**A source reference names a section, never a line number.** `docs/SCIENCE.md Part 2, the NAD+ constraint`, not `docs/SCIENCE.md line 148`. Settled in V5 after five references had drifted 42 lines and all five landed in the wrong Part.

---

# Part 2: Voice

The game sounds like a competent person explaining something they find genuinely interesting, to somebody they assume is capable. It states what is happening and why. It does not sell, congratulate, apologise or perform enthusiasm.

Three sentences that fit:

    The pool is small and fixed, so once it is all NADH the pathway stops.
    Glucose is still arriving and the cell is still full of it. This is not starvation.
    Produces no ATP. Its entire function is recycling the carrier.

Three that do not, and why:

    Uh oh, your cell is out of NAD+!
        Performs alarm the screen already carries, and calls it your cell.

    Great work! You've unlocked lactate dehydrogenase!
        Congratulates. Nothing in the sentence is information, and praise for
        clicking the only affordable button is praise for nothing.

    Simply buy fermentation to get your energy flowing again!
        "Simply" tells a reader who is stuck that they are the problem, "energy"
        is doing the work "ATP" should be doing, and the exclamation mark is the
        third one in three lines.

**The interesting thing is the mechanism, so the mechanism is what the sentence is about.** The strongest string in the build is "Glucose is still arriving and the cell is still full of it. This is not starvation." It works because it names what the player can see and then rules out the wrong reading, which is the entire teaching move. Nothing in it is decoration.

## Person and tense

**Present tense, always.** The simulation is happening while the sentence is being read.

**Third person for anything about biology.** The game describes the cell and the chemistry. It does not say "you" and it does not say "we", and it never says "your cell". The cell on the screen is a cell, and the possessive quietly turns a system being modeled into a pet being kept.

**Second person is allowed only in text about the build**, which means the first run, the disclosure, the save panel and anything else whose subject is the game rather than a cell. There is no cell in those sentences to describe. Use it sparingly and never as encouragement.

**One deliberate exception, and it is the action row of a coach mark.** A coach mark's button speaks in the player's voice rather than the game's: "Show me what recycles it". That is a request the player is making, so first person is correct there and only there. It reads as the player pulling the next thing towards them rather than the game pushing it.

**No teleology.** A cell does not want, try, decide, need or prefer. It has no strategy and nothing is for anything in the sense a reader will hear. Write the mechanism and the reader supplies the rest.

    No    The cell needs to recycle NAD+ so it can keep making energy.
    Yes   Nothing here oxidises NADH back to NAD+, so the payoff phase has
          nothing left to reduce.

The exception, and it is narrow: a reaction may be said to have a function, because that is a statement about what it does in the pathway rather than about intent. "Its entire function is recycling NAD+" is docs/PROGRESSION.md's own sentence and it is fine.

## Prose mechanics

CLAUDE.md's rules apply to player-facing text exactly as they apply to the repository. Restated here because this is the file somebody will have open while writing a string:

- No Oxford commas.
- No em dashes and no en dashes, anywhere, including inside numeric ranges. Use "to". `45 to 90 minutes`, never `45-90 minutes`.
- Dates in YYYY-MM-DD.
- File paths use forward slashes.
- ASCII apostrophes and ASCII quotes. A curly quote in a string is a diff nobody can read.

Additional, specific to player-facing text:

- **No exclamation marks.** Not one, anywhere in the game.
- **No "simply", "just", "obviously" or "of course".** All four tell a stuck reader that being stuck is a personal failing.
- **No ampersands.** Write "and".
- **No parenthetical asides in a coach mark or a panel.** If it fits in brackets it fits in the sentence or it is cut. Parentheses are allowed in a label where they disambiguate a pool, as in "Glucose (environment)", which is naming rather than aside.
- **British or American spelling, pick and hold.** This project is inconsistent today: `src/ui/content.ts` has "oxidizing" and `src/ui/components/UnlockShelf.tsx` has "oxidises" in strings that render four inches apart. **The game spells -ise and -yse.** Chosen because the science documents already do, so one convention covers both halves. `oxidise`, `oxidised`, `oxidises`, `glycolysis` unaffected.

---

# Part 3: Naming

## Molecules

**A pool has exactly one name and it is the one in `src/content/act1/pools.ts`.** The interface reuses it rather than restating it, so the simulation and the screen cannot drift into calling the same pool two different things. This is already how `MOLECULES` in `src/ui/content.ts` is built and it stays that way.

**Use the form a biochemist writes.**

    Always the abbreviation      ATP, ADP, NAD+, NADH, Pi in a formula
    Always the full name         glucose, pyruvate, lactate, phosphate

ATP is never expanded to adenosine triphosphate. The expansion teaches nothing a reader can use: what teaches is the third phosphate dot leaving the blob when it is spent, which the illustration already does. NAD+ is never expanded either, for the same reason, and because the plus sign is the part that carries meaning.

**Glyceraldehyde 3-phosphate is the hard case and here is the ruling.**

A pool card is a definition site, so the card carries the full name. The "3-phosphate" in it is what explains the phosphate dot on the blob, and a card that says "G3P" throws that away.

Prose uses the full name on first appearance within a single coach mark or panel and may use "G3P" for the rest of that same piece of text. It never opens with "G3P".

Lowercase `g3p` is the pool id. It is code. It never reaches a player, in any string, in any casing other than the one above.

**"The carrier" means the NAD+ and NADH pair, and only the pair.** It is the right word when the sentence is about the conserved total, which is the thing act 1 exists to teach. It is never used for one member alone, so "the carrier runs out" is wrong: NAD+ runs out and the carrier is all still there, as NADH, which is the whole point.

## Enzymes and phases

**An enzyme is always called by its real name.** "Lactate dehydrogenase", never "the fermentation enzyme". A role description may follow the name and may not replace it. Enzyme names are in docs/SCIENCE.md's accurate column and giving one up is giving up something the project claims.

**The two halves of glycolysis are the preparatory phase and the payoff phase.** Those are docs/SCIENCE.md Part 2's names and they are the labels on the pathway. **"Investment phase" is not a third name for the preparatory phase** and does not appear in player-facing text, even though docs/PROGRESSION.md uses it in prose about the design. A player who reads "investment phase" on a card next to an arrow labelled "Preparatory phase" has been handed a puzzle for nothing.

## The game itself

The game refers to itself as "the game" and to a playthrough as "the run". It has no title yet, so nothing in the text may act as though it does. When one is chosen, this rule gets one line and every string that would have used it is still correct.

---

# Part 4: Numbers in prose

Hard rule 1: every number in player-facing text traces to docs/SCIENCE.md. docs/PILLARS.md rule 4 says the same thing from the other side. Neither has ever been under real load, because the game currently has no number inside a sentence at all. That changes as text grows and this section is what it changes against.

**First rule: prefer a Figure to a sentence.** A number in a sentence cannot be column aligned, gets no tabular figures worth having and has no badge slot of its own. If the number is a quantity the player is meant to compare, it belongs in a `Figure` and the sentence points at it.

**Second rule: one Entry, one provenance claim.** An `Entry` pairs one string with one badge. If a paragraph contains two numbers whose provenance differs, it is two entries with two badges, not one entry with the weaker of the two. Splitting a paragraph is cheap. A Sourced badge sitting over a tuned number is the exact failure the contract exists to prevent.

**Third rule: know which kind of number you are writing.**

    Stoichiometric count      Sourced. 2 ATP net per glucose, 4 gross, 6 carbons
                              in, 2 trioses out. These are the numbers act 1
                              exists to teach and they are all sourced.

    Rate, pool size, duration Tuned, and the reason names the docs/ECONOMY.md
    threshold or cost         row. Prefer not to write one into a sentence at
                              all: it is a number a balance pass can move, and a
                              sentence is the worst place to have to find it.

    Real elapsed time,        Neither. Exempt from the badge contract and
    save timestamps           declared exempt at the call site through Figure's
                              `measured` prop. DESIGN.md, 2026-07-31.

**Fourth rule: digits for quantities of matter, words otherwise.** "2 ATP", "6 carbons", "two ways out of pyruvate". The digits are reserved for the things being counted so that a count reads as a count.

**Never write a tuned rate into a sentence.** Not "glucose arrives at 8 units per second". The top bar already shows the rate, with a badge, and it updates. A sentence cannot.

---

# Part 5: Length ceilings

DESIGN.md gives coach marks two paragraphs and says it means it. Everything else on this list is set here, because a ceiling that exists only for the one surface that already had one is not a system.

    Surface              Ceiling
    ------------------------------------------------------------------------
    Micro label          3 words, 18 characters. No full stop.
    (uppercase, 11px)

    Card title           4 words. No full stop. Not a sentence.

    Button               4 words. Imperative or the player's own voice. No
                         full stop.

    Slot detail          2 sentences, 160 characters.
    (unlock shelf)

    Tooltip and          1 sentence, 200 characters. This is the badge trace,
    badge reason         so it is written as text and read on hover.

    Coach mark heading   6 words. It is a statement, not a question.

    Coach mark body      2 paragraphs, hard. 3 sentences per paragraph.
                         400 characters total.

    Teaching panel       6 paragraphs, 1400 characters total. Mandatory
                         heading with badge, and a mandatory source row, to
                         the same contract a coach mark has.

    First run            1 screen. 3 paragraphs, 300 characters of prose,
                         and dismissible from that screen. A first run that
                         needs a second screen is a tutorial, and
                         docs/PILLARS.md rule 2 rules a tutorial out.
                         The required disclosure sits inside it and does not
                         count against the 300, because it is exempt below.

**The disclosure text is exempt from all of it.** docs/SCIENCE.md Part 1 requires it in-game, word for word, and it is quoted verbatim in `src/ui/content.ts` with a comment saying that a paraphrase of a required disclosure is not the required disclosure. If it reads badly, the fix is where and how it is presented and never what it says.

**A concept that will not fit its ceiling has not been cut down enough, and if it genuinely will not fit, it moves up one surface rather than overflowing.** Coach mark to teaching panel is the escalation the ceiling exists to force. Teaching panel to a second teaching panel is not an escalation, it is a sign the concept is two concepts.

---

# Part 6: Teach through the interface first

This is the rule the other documents do not have and it outranks everything in Part 2, because a style guide that only governs sentences will produce a game made of sentences.

**If a concept can be carried by shape, colour, position or motion, it must be, and prose is the fallback.**

DESIGN.md already argues this and is the reason it works. Sides equal carbons, so when one six-sided blob becomes two three-sided ones the arithmetic is visible rather than stated. Phosphate dots are countable, so spending ATP removes a dot. Redox is saturation on the same silhouette, so the NAD+ wall is legible as colour before a number is read. None of that geometry is drawn: it is derived from the conserved-weight table in `src/content/act1/pools.ts`, so a stoichiometry change moves the picture in the same commit.

The test to apply before writing any explanatory string:

    1. Is this fact already on the screen in shape, colour, position or motion?
       If yes, the string is at most a one-time pointer at it, not a
       description of it. Say where to look, not what it says.

    2. Could it be, cheaply? If yes, that is the change to make, and the
       paragraph is a bug report against the illustration.

    3. Only if neither: write the sentence.

**A pointer is short and a description is long, which is the tell.** "Six sides, six carbons" points. "The glucose blob has six sides because glucose contains six carbon atoms, and when it is split by the preparatory phase you will see two three-sided blobs" describes something the player is looking at, and it is longer than the thing it describes.

**A game that has to be read is a game that will not be.** The primary audience per DESIGN.md is high school and undergraduate students, and the sentence a reader skips teaches nothing at all.

---

# Part 7: What the game never says

docs/PILLARS.md rules 4, 5 and 6 restated as writing rules, which is what makes them usable while writing rather than while reviewing.

**It never implies a tuned rate is measured.** Rule 4 and the disclosure. Any sentence that gives a rate a unit and no badge is claiming a measurement the project does not have. There is no version of this that is a small liberty: the entire premise is that the economy is not invented, and a fabricated rate presented as real would falsify that claim in the one place a player can see it.

**It never asserts a contested claim as settled.** Rule 6. Where the science is genuinely unsettled the game says so, with a Contested badge and a sentence that names the dispute rather than gesturing at it. "Contested" in a badge with settled prose beside it is worse than no badge, because it looks like disclosure.

**It never puts a number on the screen that nobody can defend.** Rule 4 again, and the `Needs source` release gate is the mechanism: a production build fails if one survives into the bundle. That gate has never had a real load on it and it is about to.

**It never invents an objective the game does not have.** Act 1's real goal is to keep the pathway running and to learn why it stops. The game ends after four acts, per docs/PILLARS.md rule 1. Writing a goal the simulation does not implement is the worst available failure here, worse than saying nothing, because the player will play towards it.

**It never calls a throughput purchase a yield upgrade.** 2 ATP net per glucose is a hard ceiling in act 1 and no purchase moves it. This is success condition 2 in miniature and the sentence that gets it wrong is the sentence that loses the whole act.

**It never congratulates.** No praise, no streaks, no "well done", no exclamation marks. docs/PILLARS.md rule 2 forbids anything that exists to extend session length, and praise for clicking the only affordable button carries no information and exists for exactly that.

**It never says ATP "is energy".** ATP is the currency the cell spends. Energy has no count and a currency does, and the thing act 3 is going to teach is that the count per glucose differs by a factor of roughly fifteen between pathways. A player who has been told ATP is energy has been given the wrong noun for the number they are about to compare.

---

# Part 8: How much of this is mechanism

DESIGN.md's colour section is enforced by a test. The badge contract is enforced by the type system and a release gate. The divergence table is enforced by a parser. The pattern of this project is that a rule with no mechanism decays, so it is worth saying plainly which half of this document can have one.

**Testable, and should be:**

- No player-facing string literal outside `src/ui/content.ts`.
- Every exported `Entry` carries a badge. Already the type.
- No em dash, no en dash and no exclamation mark in any string in `src/ui/content.ts`.
- Character and sentence ceilings from Part 5, per surface, for the surfaces whose entries are structurally identifiable.
- The word "investment phase" does not appear in a player-facing string.

**Not testable, and should not be faked:**

- Voice. There is no regular expression for whether a sentence sounds like a person who knows what they are talking about.
- Whether a paragraph should have been a shape. Part 6 is the most important rule here and it is a judgement every time.
- Whether a number's badge is the right one. The type forces a badge, not a correct one.

UPDATELOGV6.md stage 6 decides which of the testable half to build and proves it fires with a probe. Nothing above is a promise that it all lands.

---

# Decisions log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-08-03 | Teach through the interface first, prose is the fallback | A style guide that governs only sentences produces a game made of sentences. DESIGN.md's illustration rules already carry real information and nothing tells the player they do. |
| 2026-08-03 | Third person for biology, no "your cell" | The possessive turns a system being modeled into a pet being kept, and the game is not about a pet. |
| 2026-08-03 | Second person allowed only in text about the build | The first run, the disclosure and the save panel have no cell in them to describe, so the reader is the only available subject. |
| 2026-08-03 | The coach mark action row speaks in the player's voice | "Show me what recycles it" reads as the player pulling the next thing towards them rather than the game pushing it. Shipped in V3 and kept deliberately rather than by inertia. |
| 2026-08-03 | No teleology. A cell does not want, try or need | The mechanism is the thing being taught and intent language replaces it with a story. A reaction may have a function, because that is what it does rather than what it intends. |
| 2026-08-03 | ATP and NAD+ are never expanded | The expansion teaches nothing a reader can use. The third phosphate dot leaving the blob teaches the same fact better, and the illustration already draws it. |
| 2026-08-03 | The full name of glyceraldehyde 3-phosphate stays on the card, G3P is allowed in prose after first use | A card is a definition site, and the "3-phosphate" is what explains the phosphate dot on the blob. |
| 2026-08-03 | "The carrier" means the pair, never one member | "The carrier runs out" is false in the exact way act 1 exists to correct: NAD+ runs out and the carrier is all still there as NADH. |
| 2026-08-03 | "Investment phase" is banned from player-facing text | docs/PROGRESSION.md uses it in design prose and the pathway is labelled "Preparatory phase". Two names for one arrow is a puzzle handed to the player for nothing. |
| 2026-08-03 | The game spells -ise and -yse | It was inconsistent across two files rendering four inches apart. The science documents already spell -ise, so one convention covers both halves. |
| 2026-08-03 | Ceilings for every surface, not just the coach mark | DESIGN.md set two paragraphs for a bubble and nothing for anything else. A ceiling on one surface is not a system, and the moment there is more than one thing to explain the others start binding too. |
| 2026-08-03 | The first run is one screen, not three | Written here as three screens of one paragraph and corrected by UPDATELOGV6.md stage 3, which was the first thing built against it. Three screens of one line is a sequence a player has to get through, which is a tutorial in shape if not in length, and docs/PILLARS.md rule 2 rules a tutorial out. One card with three lines is smaller than three cards with one. |
| 2026-08-03 | Badge reasons are written as player-facing text | `badgeTrace` renders into a `title` attribute, so every `tuned()` reason is already on screen to anyone who hovers. They were being written as notes to the next developer. |
| 2026-08-03 | No congratulation, anywhere | docs/PILLARS.md rule 2. Praise for clicking the only affordable button carries no information and exists to extend session length, which is the one thing the rule names. |
