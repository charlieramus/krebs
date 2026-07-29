charlie

# krebs, V2: Act 1 Content, Glycolysis and the NAD+ Wall
# Work on one stage at a time. Do NOT combine stages.

---

## Context

Read `NOW.md` first, then `docs/SCIENCE.md` Part 2 and `docs/PROGRESSION.md` act 1. The kernel from V1 runs and is guarded: `src/sim/` has pools, reactions, a two-phase tick, a seeded PRNG, a conservation property test and a determinism test, 65 tests passing, canonical hash `172f83fb`. It has no idea that glucose exists. The only pathway in the repository is `src/sim/__tests__/fixtures/toyPathway.ts`, whose own header says `THIS IS NOT BIOLOGY`.

**Act 1 content is the first real biology the engine has ever been asked to run.** Glucose uptake, the two phases of glycolysis, the NAD+ pool and lactate fermentation, all traceable to `docs/SCIENCE.md` Part 2.

This is log 2 of the vertical slice set, V1 kernel then V2 act 1 content then V3 the first interface. V2 builds the content layer and the act 1 pathway. It does **not** build any interface, the ethanol branch, glycogen storage, the ten-enzyme decomposition, or an unlock system with costs and thresholds. The interface is V3. The rest is later and `NOW.md` holds the fence.

The point of the split is `docs/SIMULATION.md` line 90: the conservation test should exist before act 1 content does. It does. The moment this log lands, that test is guarding real stoichiometry instead of invented letters, which is the whole reason it was written first.

## Decisions

- **Stage 1 is the gating docs pass, and this is a deliberate departure from `NOW.md`.** `NOW.md` line 30 says the `docs/SCIENCE.md` reconciliation "is not a log. It is a docs-only pass and it gates V2." It has been outstanding since 2026-07-28 and nothing has picked it up, so a gate that lives nowhere is not a gate. It is stage 1 here, docs only, no code. If it has already landed by the time this log runs, stage 1 verifies and reports that rather than redoing it.
- **New directory, `src/content/`.** The kernel stays content-blind. `src/sim/pools.ts` says so in its own header and `ConservedId` is a bare `string` for exactly this reason. Content defines pools and reactions in terms of kernel primitives and never the other way round. Nothing in `src/sim/` gains a single import from `src/content/`.
- **Five conserved quantities, not three.** `carbon`, `phosphate`, `redox`, plus two carrier-count invariants the act 1 pathway makes available for free: `nicotinamide`, which is NAD+ plus NADH, and `adenylate`, which is ATP plus ADP. The carrier totals are what make the NAD+ wall a testable property rather than a felt one.
- **ATP is not a score.** The adenylate pool is fixed and closed. A `maintenance` reaction hydrolyses ATP back to ADP and Pi, which is what a cell actually does with it, and which is what keeps phosphate conserved and makes ATP a flux rather than a stock. That matches `NOW.md`, "flux is the headline number and stock is the subscript". Cumulative ATP produced is a counter, not a pool, so it cannot leak into conservation.
- **Environment is a pool, not a source.** Glucose enters from a large `glucose_env` pool rather than from a substrate-free influx reaction. A substrate-free reaction runs at Vmax and manufactures carbon from nothing, which would break the conservation test on the first tick. Lactate is likewise a real end pool rather than a hole.
- **Stoichiometry is sourced, rates are not.** Every coefficient below traces to `docs/SCIENCE.md` Part 2. Every Vmax, Km and Hill n is provisional, tuned for nothing yet, and marked as such in the one file it lives in. Hard rule 1 binds player-facing text and V2 has no player-facing text, but the marking has to be in place before V3 does.
- **`docs/ECONOMY.md` is not created by this log.** `NOW.md` is explicit that it needs a playable prototype first. The tension with hard rule 2 is real and is recorded rather than resolved: provisional values live in `src/content/act1/tuning.ts` under a header saying they are unbalanced and owe an ECONOMY.md row. V3 or the first balance pass creates the document.
- **PFK-1 cooperativity attaches to the preparatory phase.** The phase is not decomposed into ten enzymes in this log, so its committed step's sigmoidal response is carried by the phase reaction. That is an attribution, not a measurement, and it gets flagged in the file rather than assumed.
- **`DESIGN.md` is untouched by stages 2 to 6.** Stage 1 edits its timeline stop list because that is the blocking item. No visual work otherwise. V2 has no UI at all and `npm run sim` remains the only way to look at anything.
- Medium feature: six stages.

## The act 1 balance sheet

Settled here so the stages implement it rather than reinvent it. Pool ids on the left, conserved weights on the right.

```
  glucose_env   carbon 6            redox 2      environmental glucose
  glucose       carbon 6            redox 2      intracellular glucose
  g3p           carbon 3  phos 1    redox 1      triose phosphate
  pyruvate      carbon 3                         pyruvate
  lactate       carbon 3            redox 1      lactate
  nad           nicotinamide 1                   NAD+
  nadh          nicotinamide 1      redox 1      NADH
  atp           phosphate 3   adenylate 1        ATP
  adp           phosphate 2   adenylate 1        ADP
  pi            phosphate 1                      free phosphate
```

```
  uptake      glucose_env                   ->  glucose
  prep        glucose + 2 atp               ->  2 g3p + 2 adp
  payoff      g3p + nad + 2 adp + pi        ->  pyruvate + nadh + 2 atp
  ferment     pyruvate + nadh               ->  lactate + nad
  maintain    atp                           ->  adp + pi
```

Every reaction balances all five quantities independently. Net per glucose across uptake, prep and two turns of payoff: **2 ATP net, 4 gross, 2 NADH, 2 pyruvate.** That is `docs/SCIENCE.md` Part 2 exactly, including the point it makes about 4 gross being the common confusion.

Two things in that table are modeling conventions rather than chemistry and both need disclosure, not burial. `redox` counts electron pairs relative to the fully fermented state, which is why glucose carries 2 and lactate carries 1, so glucose to 2 lactate is redox neutral and glucose to 2 pyruvate plus 2 NADH balances. And glucose uptake is modeled as plain transport with no transporter named, because `docs/SCIENCE.md` does not cover the mechanism and a prokaryote of this period may well have used a phosphotransferase system that costs PEP.

---

# Stage 1 — The gating docs pass

```
Docs only. No code, no tests, no package.json changes. This is the reconciliation
NOW.md line 30 says gates V2, and it has been outstanding since 2026-07-28.

First: check whether it has already been done. If DESIGN.md's stop list and
PROGRESSION.md's act 2 section already reflect the docs/SCIENCE.md findings, stop,
report that, and do not rewrite them. Only proceed if they do not.

1. docs/PROGRESSION.md, the act 2 unlock list at lines 54 to 62 and the superseded
   note at line 65. docs/SCIENCE.md Part 3 has the findings. Apply them:
   - Two damage mechanisms, not one. ROS damage and direct molecular oxygen damage
     have different targets and antioxidant enzymes only address the first. The
     current list models only the ROS half.
   - The act 2 target inside act 1's own loop is GAPDH, by thiol oxidation rather
     than cluster destruction, and it is the NADH-producing step. That is a better
     spine than the iron-sulfur framing and it lands the crisis on the NAD+ wall
     the player spent act 1 learning.
   - The four additional defenses from Part 3: manganese substitution, cluster
     repair with the Suf backup system, isozyme replacement and Dps as the
     mechanistically correct version of the existing iron sequestration entry.
   Rewrite the unlock list so it is correct rather than appending a second note
   under the first. Then delete the superseded note, because a corrected list does
   not need a marker saying it used to be wrong. Keep the teaching beat and the
   target duration as they are.

2. DESIGN.md, the stop list at lines 225 to 239 and open item 5 at line 247.
   docs/SCIENCE.md Part 6 sources all five stops. Apply:
   - Stop at ~3.5 Ga: relabel from oxygen production to microbial mats and
     anoxygenic phototrophy. Date confirmed, roughly 3.48 to 3.43 Ga. Sourced.
   - Stop at ~2.7 Ga: the date is dead, the biomarkers failed on contamination.
     Remove the date entirely, keep the stop, place it before the GOE and label it
     as unresolved timing. Part 6 calls this the timeline's best chance to show a
     live dispute rather than assert a number, so treat that as the design intent.
   - The GOE stop: banded iron does not cleanly mark it. Either use the ~2.5 Ga
     peak and label it explicitly as the pre-GOE maximum, or pick a different
     visual. Choose one and say why in the decisions table.
   - The remaining stops, ~4.0 Ga vents and the endosymbiosis window: apply Part
     6's caveats and its ranges. The vent stop is a hypothesis about the origin of
     chemiosmosis, not a dated event.
   Update every badge to what the sourcing now supports, and cut or rewrite open
   item 5 so it reflects what is left rather than what was true before.

3. docs/SCIENCE.md Part 1, the "What is deliberately wrong and why" section, which
   currently says "To be filled in as balance decisions are made". Add the two
   simplifications V1 stage 3 shipped and flagged: multi-substrate reactions take
   the minimum of per-substrate saturation terms rather than a real bi-bi rate law,
   and one kinetics descriptor per reaction means one Km shared across all of a
   reaction's substrates. Each entry needs the real behaviour, the game behaviour
   and the reason, per the section's own format. This is a disclosure pass, not a
   balance pass, so hard rule 2 is not in play. Say so in the entry.

4. Add the two conventions from this log's balance sheet to the same section,
   because stage 2 is about to make them load-bearing: the redox counting
   convention, and glucose uptake modeled as untyped transport.

Verify: no code changed, `git diff --stat` shows only docs/PROGRESSION.md,
DESIGN.md and docs/SCIENCE.md. Report which of the two NOW.md blocking items are
now closed and quote the sentence in each doc that closes it. If either is only
partly closed, say which part and why.
```

## Stage 1 Report

Checked first, as instructed. Neither had landed. `docs/PROGRESSION.md` line 65 still carried the superseded note with the original unlock list untouched above it, and `DESIGN.md` still listed `~2.7 Ga oxygenic photosynthesis Needs source` with four other unsourced dates. Both blocking items were exactly where `NOW.md` left them on 2026-07-28. Proceeded.

**`docs/PROGRESSION.md`, act 2.** Rewrote the unlock list rather than appending, and deleted the superseded note. The list is now ten entries. `Dps` replaces the vague "iron sequestration" as the mechanistically correct version of the same idea, and three genuinely new defenses join it: iron-sulfur cluster repair with the Suf backup system, manganese substitution, and isozyme replacement. Three paragraphs above the list carry the findings the list itself cannot: the two-mechanism split, the design consequence that SOD and catalase are useless against the second mechanism, and GAPDH as the in-loop target. Added the pentose phosphate reroute as a fourth paragraph, because Part 3 presents it as a mechanic rather than as background and the act 2 spine is incomplete without it. Kept the teaching beat and the 90 to 150 minute target duration verbatim, as instructed.

**`DESIGN.md`, the timeline.** All seven stops rewritten. Five paragraphs now sit under the table explaining the four stops that changed, because the changes are findings rather than corrections and the table alone would bury them. The GOE visual decision, which stage 1 left to me: **keep banded iron, move the number onto the card.** Part 6 stop 4 offers the ~2.5 Ga peak labelled as pre-GOE maximum or a different visual entirely, and the only cleaner marker it names, the redox-sensitive detrital mineral record, has no legible cartoon silhouette. Banded iron has an unmistakable striped one. So the figure stays, the date column carries the GOE's own range at ~2.4 to 2.0 Ga, and the card states the ~2.5 Ga peak explicitly as the immediate pre-GOE maximum. Recorded in the decisions table with that reasoning, alongside two more rows for the undated stops and the eukaryote reframing.

Badges: every `Needs source` is gone. Four stops are `Sourced`, three are `Sourced, Contested`. The GOE is `Sourced` alone. Its pace is a live question in Part 7 item 3, but the event is not contested and spending the badge on it would devalue the badge where it does real work, at the vent and endosymbiosis stops.

**`docs/SCIENCE.md` Part 1.** Four entries added under "What is deliberately wrong and why", replacing the placeholder. Two disclose V1 stage 3's simplifications, and I read the code before writing them rather than trusting `NOW.md`'s summary: `src/sim/reactions.ts:145` takes the minimum of per-substrate saturation terms, and `src/sim/reactions.ts:50` holds one `Kinetics` per `Reaction`, so one Km reaches every substrate. Both were flagged in a comment at `src/sim/reactions.ts:118-137` asking for exactly this entry. Two more entries cover the balance sheet conventions stage 2 is about to make load-bearing: redox as electron pairs against the fully fermented state, and glucose uptake as untyped transport with the PEP cost set to zero and disclosed. A preamble states that this is a disclosure pass and not a balance pass, that no tuned number appears, and that hard rule 2 is therefore not in play.

**Both `NOW.md` blocking items close.**

Item 1, the five timeline dates: closed. `DESIGN.md` now reads "Every stop on this view now traces to docs/SCIENCE.md Part 6. No `Needs source` badge survives here."

Item 2, the act 2 iron-sulfur target: closed. `docs/PROGRESSION.md` now reads "The target inside act 1's own loop is glyceraldehyde-3-phosphate dehydrogenase, damaged by thiol oxidation rather than by cluster destruction."

**Two deviations, both flagged rather than silent.**

I also rewrote `DESIGN.md` open item 2, which stage 1 did not ask for. It asserted the act 2 target was an iron-sulfur enzyme and ended "Needs a docs/SCIENCE.md entry before it is built". Leaving it would have left `DESIGN.md` contradicting the `docs/PROGRESSION.md` I had just corrected, which is the same blocking item wearing a different hat. Rewritten as closed, noting that the mockups' PFOR and ferredoxin damage still holds for the pyruvate disposal chain, and that the real new interface problem is distinguishing two damage mechanisms visually.

Open item 5 is **not fully closed and I did not claim it was**. Its sourcing half is done. But sourcing killed two dates rather than supplying them, and the date column is specified as a date. Rewritten to state the smaller design question that remains: `unresolved` and `hypothesis` need a treatment at the same visual weight as a real date, and the non-linear axis has to place an undated stop by ordering constraint alone. Not designed, and not V2's job.

Verify: `git diff --stat` shows `DESIGN.md`, `docs/PROGRESSION.md` and `docs/SCIENCE.md` only. No code, no tests, no `package.json`.

---

# Stage 2 — The content layer and the act 1 pools

```
The first content that is not synthetic. Structure first, no reactions yet.

1. Create src/content/ with a README stating the one rule that governs it: content
   depends on src/sim/, and src/sim/ never depends on content. Note that the ESLint
   determinism guard is scoped to src/sim/** and ask stage 6 to decide whether it
   should extend here.

2. src/content/act1/pools.ts. The ten pool definitions from this log's balance
   sheet, as an ordered readonly array of PoolDefinition. Ids are permanent per
   docs/SAVE_SCHEMA.md, so choose them once and choose them plainly.

   Labels are the display names. They are not player-facing prose yet and
   docs/CONTENT_STYLE.md does not exist, so keep them to the molecule name.

3. The five conserved quantities: carbon, phosphate, redox, nicotinamide,
   adenylate. Weights exactly as the balance sheet gives them.

   Put the redox counting convention in a comment at the top of the file, in full:
   redox counts electron pairs relative to the fully fermented state, glucose
   carries 2 and lactate carries 1, so glucose to 2 lactate is redox neutral. It is
   a convention rather than a chemical property and stage 1 wrote it into
   docs/SCIENCE.md Part 1. Point at that entry.

4. Flag the naming problem rather than papering over it. docs/SIMULATION.md line 90
   names "carbon, phosphate and redox equivalents" as the conserved quantities.
   Under the decomposition above, nicotinamide and adenylate are conserved too and
   are the more useful invariants. Do not edit docs/SIMULATION.md in this stage.
   Record it and let stage 6 decide whether Part 2's wording needs updating.

5. src/content/act1/__tests__/pools.test.ts. Assert: the registry constructs; every
   id is unique; conservedIds comes out in the sorted fixed order the kernel
   promises; totalConserved returns the hand-computed total for each of the five
   quantities against a known set of amounts. Hand-compute those five totals in the
   test rather than deriving them from the same table the code reads, otherwise the
   test asserts that the table equals itself.

Verify: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`. Report
the five conserved totals at initial amounts and confirm no file in src/sim/
imports anything from src/content/.
```

## Stage 2 Report

Three new files. No existing file touched.

    src/content/README.md                        the one rule
    src/content/act1/pools.ts                    ten pools, five quantities
    src/content/act1/__tests__/pools.test.ts     7 tests

**`src/content/README.md`.** States the rule as content depends on `src/sim/`, `src/sim/` never depends on content, and gives the reason rather than just the rule: a single import the other way turns the kernel into act 1's kernel, and every later act becomes a special case of act 1. Records that the ESLint determinism guard is scoped to `src/sim/**` and does not reach here, that content builds the descriptors the kernel runs so a `Math.pow` in a tuning file breaks determinism through a different door, and that stage 6 owns the call. Until then the rule applies here by discipline, which the README says in those words.

**`src/content/act1/pools.ts`.** The ten pools from the balance sheet, in pathway order: environment, uptake, glycolysis, end product, then the two carrier pairs and free phosphate. That order is readability only; the kernel sorts conserved quantity names independently, and the test asserts a reversed definition list produces the same `conservedIds`, which is what stage 5's hash depends on.

The redox convention is in the file header in full, at the top, with a pointer to the docs/SCIENCE.md Part 1 entry stage 1 wrote. It says plainly that it is a convention rather than a chemical property, that the zero point is chosen because it makes act 1's weights small integers, and warns that a weight guessed rather than derived will not fail loudly, it will fail as a conservation test that passes while the economy is wrong.

Labels are molecule names only. `docs/CONTENT_STYLE.md` does not exist and inventing a voice before it lands would mean rewriting all ten.

One weight needed a comment and got one. `g3p` carries phosphate 1, not 2. It is the triose the preparatory phase hands over, and the second phosphate the payoff phase needs comes from the `pi` pool at the GAPDH step, not from the carbon skeleton. Getting that wrong is the single easiest way to break the phosphate balance in stage 3 while everything still looks plausible.

**The naming problem, recorded not acted on.** `docs/SIMULATION.md` line 90 reads "Carbon, phosphate and redox equivalents are conserved quantities." Under this decomposition `nicotinamide` and `adenylate` are conserved too, and they are the more useful pair, because they are what make the NAD+ wall a testable property rather than a felt one. `docs/SIMULATION.md` is not edited. The header of `pools.ts` records it and hands it to stage 6.

**Five conserved totals at the initial amounts:**

| Quantity | Total | Where it is |
| --- | --- | --- |
| carbon | 60000 | all of it in `glucose_env`, 10000 units at 6 each |
| redox | 20000 | same place, 2 per environmental glucose |
| phosphate | 140 | atp 3x20, adp 2x20, pi 1x40 |
| nicotinamide | 10 | all as NAD+, none as NADH |
| adenylate | 40 | atp 20, adp 20 |

The cell starts empty. Every carbon and every electron pair is outside it, the nicotinamide pool is fully oxidised, and there is no lactate. Stage 4's wall is approached rather than started at, and there is a test asserting that.

The test hand-computes all five against a probe set that is deliberately unlike the initial amounts, every pool non-zero, so a weight of zero cannot hide. All five are exact integers and the assertions use `toBe` rather than `toBeCloseTo`. The arithmetic is written out in comments beside each figure so a disagreement shows up as a disagreement, not as a matching bug on both sides.

**Two things I decided rather than guessed, both flagged.**

`ACT1_INITIAL` lives in `pools.ts`, not `tuning.ts`, because `tuning.ts` does not exist until stage 3 and stage 3 scopes it to "every Vmax, Km and the Hill n". Initial amounts are not in that list. They carry the same PROVISIONAL header treatment and the same docs/ECONOMY.md obligation. Stage 4 explicitly says the nicotinamide pool size belongs in `tuning.ts`, so that one number moves there when stage 4 sizes it, and `pools.ts` will import it.

I did not write a test asserting no `src/sim/` file imports `src/content/`. Vitest runs in the node environment so it would work, but `tsconfig.json` sets `"types": ["vite/client"]`, which means `node:fs` does not resolve for `tsc` and the test would need a tsconfig change to typecheck. That is more than stage 2 should be moving. Verified by hand instead, and stage 6's coherence sweep is the right place to mechanize it.

Verify. `npm test` 72 passed, up from V1's 65, 7 new. `npm run typecheck` clean. `npm run lint` clean. `npm run build` clean, bundle unchanged at 193.37 kB, which is expected since nothing imports the content layer yet.

Import direction confirmed. Every import inside `src/sim/` is either relative within `src/sim/` or `vitest` or `node:process`. No file in `src/sim/` references `src/content/` in code or in prose.

---

# Stage 3 — The act 1 reactions and the stoichiometry ledger

```
The pathway itself, minus fermentation. Fermentation is stage 4 because the wall
has to be visible before the way around it is.

1. src/content/act1/reactions.ts. Four reactions from the balance sheet: uptake,
   prep, payoff, maintain. Ferment is stage 4 and is deliberately absent here.

   Resolve pool indices through PoolRegistry.indexOf at construction, never by
   hardcoded number. indexOf throws on a typo, which is the point of it.

2. Kinetics. prep uses the Hill form, everything else uses Michaelis-Menten.
   PFK-1 is the committed step of the preparatory phase per docs/SCIENCE.md Part 2,
   and this log attributes its cooperativity to the phase because the phase is not
   decomposed into individual enzymes yet. Write that attribution in a comment. It
   is a modeling choice and someone will otherwise read it as sourced.

3. src/content/act1/tuning.ts. Every Vmax, Km and the Hill n, in one file, nowhere
   else. Header block, unmissable: these values are provisional, they are tuned for
   nothing, they are not laboratory measurements, docs/SCIENCE.md Part 1 forbids
   implying otherwise, and they owe a row in the docs/ECONOMY.md divergence table
   once that document exists. Name this log as the thing that introduced them.

   Pick first-fit values that let the pathway run. Do not balance them here. Stage
   5 measures what they actually do.

4. src/content/act1/__tests__/stoichiometry.test.ts. This is the test that makes
   the whole log trustworthy, so write it as a property over the reaction list
   rather than as four hand-written cases:

   For every reaction, for every one of the five conserved quantities, the weighted
   sum over substrates equals the weighted sum over products, exactly. Not
   toBeCloseTo. These are small integers and they should be equal to the bit.

   Then the ledger, computed from the reaction table rather than asserted from
   memory: one glucose through uptake, prep and two turns of payoff yields 4 ATP
   gross, 2 ATP net of the 2 spent in prep, 2 NADH and 2 pyruvate. Those four
   numbers trace to docs/SCIENCE.md Part 2 lines 89 to 96 and the test should cite
   the line in a comment.

5. Wire it up: a createAct1 factory returning a SimulationState, mirroring the
   shape of createToyPathway including its overrides for initial amounts, Vmax, Km
   and seed. Same shape on purpose. The conservation test in stage 5 wants to
   randomize this pathway the same way it randomizes the toy one.

Verify: `npm test`, `npm run typecheck`, `npm run lint`. Report the per-reaction
balance table the test computes, all five quantities across all four reactions, as
a grid. Report the ledger numbers. If any of them disagrees with docs/SCIENCE.md
Part 2, stop and say so rather than adjusting the test.
```

## Stage 3 Report

Three new files, no existing file touched.

    src/content/act1/reactions.ts                        four reactions, createAct1
    src/content/act1/tuning.ts                           every rate in act 1
    src/content/act1/__tests__/stoichiometry.test.ts     6 tests

**The balance grid the test computes.** All five quantities across all four reactions, substrates on the left of the arrow and products on the right:

    reaction       adenylate        carbon  nicotinamide     phosphate         redox
    uptake            0 -> 0        6 -> 6        0 -> 0        0 -> 0        2 -> 2
    prep              2 -> 2        6 -> 6        0 -> 0        6 -> 6        2 -> 2
    payoff            2 -> 2        3 -> 3        1 -> 1        6 -> 6        1 -> 1
    maintain          1 -> 1        0 -> 0        0 -> 0        3 -> 3        0 -> 0

Twenty cells, twenty exact equalities, asserted with `toBe` rather than `toBeCloseTo`. The two that would be easiest to get wrong and hardest to notice are `prep` phosphate, where 2 ATP at weight 3 becomes 2 g3p at weight 1 plus 2 ADP at weight 2, and `payoff` phosphate, where g3p's single phosphate plus 2 ADP plus one free Pi becomes 2 ATP. Both close only because g3p carries phosphate 1 and the payoff phase draws the second phosphate from the `pi` pool at the GAPDH step, which is where it comes from in the sourced pathway.

**The ledger, computed from the reaction table rather than asserted from memory: 4 ATP gross, 2 spent, 2 net, 2 NADH, 2 pyruvate.** That is `docs/SCIENCE.md` Part 2 lines 89 to 96 exactly, including the point it makes about the gross figure of 4 being the common confusion. Nothing in the test writes those numbers down twice: the payoff turn count is derived by dividing the g3p `prep` produces by the g3p one `payoff` turn consumes, which comes out at 2, and every ATP, NADH and pyruvate figure is that count times a coefficient read out of the table. **No disagreement with `docs/SCIENCE.md`, so there was nothing to stop for.**

**Kinetics.** `prep` uses the Hill form, the other three use Michaelis-Menten. The attribution is written into a comment block on the reaction rather than left implicit, because `hill(...)` sitting in a file whose other coefficients are all sourced will otherwise read as sourced itself. What it says: the cooperativity belongs to PFK-1, which `docs/SCIENCE.md` Part 2 names as the committed step and the one enzyme where cooperativity matters enough to model; PFK-1 is step 3 of the five in the phase; this log does not decompose the phase, so the phase reaction carries the committed step's kinetics on its behalf. That makes the whole preparatory phase respond sigmoidally where in reality one step inside it does. Correct about which enzyme, wrong about what it is attached to, and it moves onto PFK-1 alone when the phase is decomposed.

**`tuning.ts`.** Every Vmax, every Km and the one Hill n, in that file and nowhere else. The header states in four separate paragraphs that these are first-fit and unbalanced, that they are not laboratory measurements and are not derived from any, that `docs/SCIENCE.md` Part 1 forbids implying otherwise and says why literature values were rejected in the first place, and that each owes a row in the `docs/ECONOMY.md` divergence table once that document exists. It names `UPDATELOGV2.md` stage 3 as what introduced them.

    uptake     Vmax  8   Km  500
    prep       Vmax 12   K     4   n 2
    payoff     Vmax 26   Km    2
    maintain   Vmax 50   Km   20

The ordering is the design and the magnitudes are not. `uptake` is deliberately the slowest step so the pathway is substrate-limited from the top and every downstream step has headroom, which is what lets a real constraint show up instead of being masked by an arbitrary ceiling elsewhere. `payoff` is above twice `prep` because two trioses arrive per glucose. `payoff`'s Km of 2 has to sit well below the nicotinamide total of 10, because NAD+ is one of its four substrates and they share one Km, so a Km near that pool's whole size would mean the payoff phase never approaches Vmax even with the carrier fully oxidised. `maintain`'s Vmax is sized so it can consume the pathway's entire net ATP output; if it could not, ATP would pile up against the fixed adenylate total, ADP would run out, and glycolysis would stall on the adenylate ceiling instead of on NAD+, putting the wrong wall in front of the player.

**Wiring.** `createAct1(options)` mirrors `createToyPathway` down to the partial records: `initial`, `vmax`, `km`, `seed`, all optional, defaults from the content tables. Stage 5's conservation test can randomize this pathway through the same door it randomizes the toy one, without a second code path for real biology. Every pool index resolves through `PoolRegistry.indexOf`, never a literal, and there is a test asserting every index is an integer in range with a positive coefficient.

**Two tests beyond the four the stage asked for.** One asserts NAD+ is consumed by exactly one reaction and produced by none, which is the shape of the whole act and the precondition stage 4 removes. One asserts the override shape matches `createToyPathway`'s, since stage 5 depends on it.

**Checked that the pathway actually runs, since "first-fit values that let the pathway run" is only a claim if you look.** It runs and then it stalls, which is correct for a log with no fermentation in it. From a standing start the pathway lights up over the first game-second, `payoff` peaking around 11 flux at t=1.0s, and by t=2.0s NAD+ is at 0.00, NADH holds the entire nicotinamide total of 10, and `payoff` flux is 0.00. `glucose_env` is still at 9984 of 10000 and intracellular glucose is climbing, so the stall is not substrate starvation. ATP drains to 0 behind it, because `maintain` keeps hydrolysing after production stops, which is what a stalled cell does. All five conserved totals were exact at 1200 ticks: adenylate 40, carbon 60000, nicotinamide 10, phosphate 140, redox 20000.

That is stage 4's wall arriving on its own at roughly 1.5 to 2 game-seconds without anything having been tuned for it. Whether that is fast enough to be legible or too fast to read is stage 4's call, and stage 4 owns the nicotinamide pool size.

Verify. `npm test` 78 passed, up from 72, 6 new. `npm run typecheck` clean. `npm run lint` clean.

---

# Stage 4 — The NAD+ wall and lactate fermentation

```
The teaching beat of act 1, and the thing docs/BRIEF.md line 110 wants the slice to
answer. docs/PROGRESSION.md line 40 states it plainly: fermentation produces no
additional ATP, its entire function is recycling NAD+ and most players arrive
expecting an energy upgrade.

1. Add the ferment reaction: pyruvate + nadh -> lactate + nad. Lactate
   dehydrogenase, one step, per docs/SCIENCE.md Part 2 line 116. It ships disabled,
   because the wall has to be reachable.

2. The nicotinamide pool is small and fixed. That is sourced, docs/SCIENCE.md Part
   2 line 108. Its size is not sourced and belongs in tuning.ts with everything
   else. Size it so that the stall arrives in seconds of game time rather than
   minutes, which is also what the real constraint does.

3. src/content/act1/__tests__/nadWall.test.ts. Four assertions, in this order,
   because together they are the mechanic:

   a. With ferment disabled and glucose abundant, run until steady. nad falls to
      near zero, nadh holds nearly the whole nicotinamide total, and payoff flux
      falls to near zero. Assert on flux, not just on pool levels. A stalled
      pathway with a full glucose pool is the claim.
   b. glucose_env is still abundant at that point. The wall is not substrate
      starvation and the test should prove it is not.
   c. Enable ferment from that stalled state and continue. nad recovers, payoff
      flux recovers, and lactate accumulates.
   d. Cumulative ATP produced per glucose consumed is unchanged between the stalled
      run and the fermenting run, to within float tolerance. This is the
      misconception, stated as an assertion: fermentation buys throughput and buys
      exactly zero yield.

4. Nicotinamide conservation holds across all of it. nad + nadh is constant to
   float tolerance through the stall and through the recovery. If it is not, the
   fermentation stoichiometry is wrong and stage 3's property test missed it.

5. Do not build an unlock system. No costs, no thresholds, no purchase. The
   reaction has an `enabled` flag and that is the whole mechanism in this log.
   Unlock gating needs an interface to be gated from and that is V3.

Verify: `npm test`, `npm run typecheck`, `npm run lint`. Report the game-seconds to
stall, the nad level at stall, the game-seconds to recover, and the ATP-per-glucose
figure from assertion (d) for both runs. Say plainly whether the wall arrives fast
enough to be legible or whether the pool size needs changing, and if you change it,
say what it was and what it became.
```

## Stage 4 Report

    src/content/act1/reactions.ts                    + ferment, + enabled overrides
    src/content/act1/tuning.ts                       + ferment rates, + nicotinamide total
    src/content/act1/pools.ts                        nad initial now reads from tuning
    src/content/act1/meter.ts                        new, the ATP counter
    src/content/act1/__tests__/nadWall.test.ts       new, 4 tests
    src/content/act1/__tests__/{pools,stoichiometry}.test.ts   updated for the fifth reaction

**The numbers.**

    nicotinamide total       30
    peak payoff flux         14.577 /s
    stall at                 3.05 game-seconds
    nad at stall             4.941e-324 of 30
    glucose at stall         438.41 intracellular, 9543 of 10000 environmental
    recovery at              0.05 game-seconds after enabling ferment
    ATP per completed glucose, stalled     4.000000000 gross, 2.000000000 net
    ATP per completed glucose, fermenting  4.000000000 gross, 2.000000000 net
    glucose consumed         18.22 stalled, 670.68 fermenting

**The pool size changed, from 10 to 30, and here is what it was and what it became.** At 10 the pathway stalled at roughly 1.7 game-seconds. That is inside the sourced "within seconds", but it arrives before the pathway has visibly finished starting up: the payoff phase peaks and dies in the same breath, so there is no interval during which a player can watch a working cell to then lose it. At 30 the pathway reaches full flux, holds it, and then decays over about a second. That is a stall rather than a failure to launch. **Yes, the wall arrives fast enough to be legible at 30, and it did not at 10.** Both numbers are in `tuning.ts`, and the header records the change and the reason.

**The wall is not substrate starvation and the test proves it.** At stall, 9543 of 10000 environmental glucose remains and intracellular glucose has piled up to 438, because uptake keeps running while the pathway that consumes it does not. That growing glucose pool is the legible signal, and the test asserts intracellular glucose exceeds NADH rather than merely being non-zero.

**Recovery is one tick, and that is a real finding rather than a measurement artifact.** During the stall the cell stockpiles everything except NAD+: g3p sits at 6.4, ADP is nearly the whole adenylate pool, phosphate is abundant. The instant fermentation runs it converts NADH back at ~24 flux, and one tick of that is enough NAD+ for the payoff phase to clear half its pre-stall peak. Nothing else was ever missing. Whether an instantaneous recovery reads as satisfying or as anticlimactic is a V3 question, and it is worth flagging now because the answer might be that the unlock wants a ramp the simulation does not currently give it.

**Assertion (d) needed a correction to be true, and the correction is the interesting part.** Taken literally, cumulative ATP produced divided by glucose consumed is **not** equal between the two runs: 3.292230 stalled against 3.978440 fermenting. Neither is 4. The reason is carbon in flight. Every glucose the preparatory phase commits becomes two trioses, and trioses sitting in the g3p pool at the end of a run were paid for and have not paid out. A stalled pathway strands them permanently, so its raw figure reads low forever.

Comparing the raw figures would have shown fermentation apparently improving yield, which is precisely the misconception this test exists to refute. So the denominator is glucose that finished the pathway: `glucoseConsumed - g3pDelta / 2`, with the preparatory spend prorated to the same set. Corrected, both runs give **4.000000000 gross and 2.000000000 net, agreeing to 9 decimal places**. The two inputs are independent measurements, glucose consumed from the applied `prep` flux and g3p from the pool itself, so they only reconcile to exactly 4 if the stoichiometry is right. The raw figures are still asserted and still printed, so the gap stays visible rather than being absorbed by the correction.

Throughput, meanwhile, moved by a factor of 37: 18.22 glucose consumed stalled against 670.68 fermenting over the same 1200 ticks. **Fermentation buys throughput and buys exactly zero yield**, which is `docs/PROGRESSION.md` line 40 written as an assertion.

**Nicotinamide conservation.** Worst relative drift across the whole sequence, 600 ticks of stall then 600 of recovery, checked every tick: **1.421e-15**, against a 1e-9 bound. NAD+ plus NADH equals the total to 9 decimal places at the end. The fermentation stoichiometry is right and stage 3's property test did not miss anything.

**A fourth test the stage did not ask for, as a control.** Fermentation enabled from the start never stalls at all. Without it, a stall caused by something other than NAD+, ADP exhaustion or a phosphate shortfall, would satisfy every assertion in the main test.

**`meter.ts` is new and slightly beyond the letter of stage 4.** Cumulative ATP is a counter and not a pool, per this log's own decisions, so it has to live somewhere outside the simulation state. Stage 5's harness needs the same counters, so writing them into the test would have meant writing them twice. Everything it reads comes from `state.fluxes[r] * state.scales[r]`, which is the flux the tick actually applied rather than the flux it intended, so shortfall-scaled ticks are counted correctly. Every coefficient is read out of the reaction table at construction rather than written down again.

**No unlock system.** `ferment` has an `enabled` flag and `createAct1` takes an `enabled` override so tests and harness scenarios can flip it. No cost, no threshold, no purchase, no gating. Unlock gating needs an interface to be gated from and that is V3.

Verify. `npm test` 83 passed, up from 78. `npm run typecheck` clean. `npm run lint` clean.

---

# Stage 5 — The act 1 harness, conservation and determinism over real biology

```
Point the V1 guards at the V2 content and see what they say. This is the first
stage that can report anything about how act 1 behaves.

1. Extend src/sim/harness.ts, or add src/content/act1/harness.ts if the scenario
   sets have diverged enough that one file would be confusing. Say which you chose
   and why. Keep `npm run sim` working exactly as it does now for the toy pathway,
   because V1's reported output is a reference someone may still check against.

   Three act 1 scenarios:
     fermenting   the full pathway running, everything enabled
     walled       ferment disabled, the stall from stage 4
     starved      glucose_env low, so the limit is substrate rather than NAD+

   The two failure modes are different and the harness should make them look
   different. That distinction is the thing V3 has to render.

   Print, per scenario: pool levels, shortfall ticks, all five conservation totals
   with relative drift, cumulative ATP produced, ATP per glucose consumed, and the
   flux through each of the five reactions. Flux is the headline per NOW.md, so put
   it where a headline goes rather than at the bottom.

2. Extend the conservation property test to run the act 1 pathway alongside the toy
   one. Same randomization approach: seeded, randomized initial levels, Vmax and
   Km, including configurations that force shortfall scaling. All five quantities.
   Keep the 1e-9 relative tolerance and keep the measurement test that asserts
   observed drift stays below tolerance / 1000.

   If act 1 drifts worse than the toy pathway does, that is a finding, not a
   nuisance. Report the worst observed drift per quantity and do not loosen the
   tolerance to accommodate it. V1's stage 5 report gives the reasoning that fixed
   1e-9 and that reasoning is still the argument.

3. Extend the determinism test to the act 1 pathway. Fixed seed, a fixed input
   script that toggles ferment on and off on a PRNG-chosen schedule so the seed
   reaches the hash through the simulation and not only through the RNG state
   field, which is the hole V1 stage 5 identified. Report the new canonical hash and
   freeze it as an assertion.

   Do not touch the toy pathway's `172f83fb`. Two canonical hashes now, one per
   fixture, and both frozen.

Verify: `npm test`, `npm run typecheck`, `npm run lint`, `npm run sim` for all
three act 1 scenarios at 1200 ticks. Report the full harness output for each, the
worst conservation drift per quantity, and the act 1 canonical hash. Confirm the
toy pathway hash is still 172f83fb.
```

## Stage 5 Report

    src/content/act1/harness.ts                          new, npm run sim:act1
    src/content/act1/__tests__/conservation.test.ts      new, 6 tests
    src/content/act1/__tests__/determinism.test.ts       new, 6 tests
    package.json                                         + sim:act1 script

**A separate harness file, and the reason is stronger than "the scenario sets diverged".** `src/content/README.md` states that `src/sim/` never depends on content. A kernel harness importing `createAct1` would be exactly that dependency, in the one file most likely to be read later as a licence to add more. So `npm run sim` is untouched and still runs the toy pathway, and act 1 gets `npm run sim:act1` with the same argument shape. V1's reported output remains a reference someone can check against, and I confirmed the toy pathway's conservation output is byte-identical to what V1 reported.

**Flux is printed first, above pools, per NOW.md.** It carries both the mean over the run and the instantaneous value at the end, because for act 1 those two numbers disagreeing *is* the reading. Look at what that buys across the three scenarios:

    scenario     uptake mean/end    payoff mean/end    what it says
    fermenting   7.611 / 7.602      14.999 / 15.204    steady, running
    walled       7.611 / 7.602      0.500 / 0.000      importing at full rate, processing nothing
    starved      3.486 / 2.942      6.886 / 5.908      everything low together, declining

The two failure modes do not look alike, which was the requirement. **Walled** has uptake at full rate and payoff at exactly zero, with 438 glucose piled up inside the cell and 9543 still outside. **Starved** has every flux low in proportion and no pool accumulating anywhere. A player could tell those apart from the flux column alone, which is the thing V3 has to render.

**Full harness output, 1200 ticks each.**

*fermenting.* Pools: glucose_env 9543.37, glucose 5.26, g3p 2.82, pyruvate 2.82, lactate 897.11, nad 27.18, nadh 2.82, atp 8.74, adp 31.26, pi 48.44. Zero shortfall ticks on every pool, zero scaling cap hits. Cumulative 1799.86 ATP gross, 902.74 spent in prep, 908.37 hydrolysed by maintenance, 456.63 glucose taken up, 451.37 committed, 897.11 lactate. **4.000000000 ATP per glucose gross, 2.000000000 net.** Conservation drift: adenylate -3.553e-16, carbon 8.489e-16, nicotinamide -4.737e-16, phosphate -1.218e-15, redox 9.095e-16.

*walled.* Pools: glucose_env 9543.37, glucose 438.41, g3p 6.45, pyruvate 30.00, lactate 0, nad 0, nadh 30.00, atp 0, adp 40.00, pi 53.55. Zero shortfall ticks. Cumulative 60.00 ATP gross against 1799.86 fermenting, from 18.22 glucose committed against 451.37, on identical uptake. **Still 4.000000000 per glucose gross and 2.000000000 net.** Drift: adenylate 7.105e-16, carbon 8.489e-16, nicotinamide 1.184e-16, phosphate 2.030e-16, redox 9.095e-16.

*starved.* Pools: glucose_env 290.85, glucose 2.28, g3p 0.59, pyruvate 0.59, lactate 412.56, nad 29.41, nadh 0.59, atp 2.69, adp 37.31, pi 56.72. Zero shortfall ticks. Cumulative 826.30 ATP gross from 206.87 glucose committed. **4.000000000 gross, 2.000000000 net.** Drift: adenylate 3.553e-15, carbon exactly 0, nicotinamide 2.132e-15, phosphate 4.060e-16, redox exactly 0.

The yield figure being 4.000000000 in all three, including the one that spent most of its run dead, is the stage 4 result holding under three completely different flux regimes.

**A defect the harness found, and I am flagging it rather than tuning it away.**

The first draft of `starved` used `glucose_env: 20`, and it did not show substrate limitation. It showed **the pathway dying of ATP exhaustion and never recovering.** I probed the threshold: below roughly 400 environmental glucose, uptake is slow enough that baseline maintenance drains ATP faster than the pathway can bootstrap. ATP decays geometrically to denormal, and the preparatory phase can then no longer pay its 2 ATP entry cost. Nothing can restart it, because prep needs ATP and payoff needs the g3p that only prep makes. Glucose keeps arriving and the cell stays dead forever.

    glucose_env    atp at 1200 ticks    prep flux    verdict
    20             3.80e-68             0.000        dead
    100            7.55e-67             0.000        dead
    200            1.88e-51             0.000        dead
    300            1.43e-07             0.000        dead
    500            2.69e+00             2.952        alive, substrate-limited
    1000           4.61e+00             4.671        alive, substrate-limited

**Act 1 as tuned has an unrecoverable state.** Biologically it is not nonsense, the investment phase of glycolysis really does mean a cell too poor in ATP cannot start the pathway, but an idle game that can enter a state the player cannot act their way out of is broken. This is a balance problem, stage 5 measures rather than balances, and `docs/ECONOMY.md` does not exist yet, so it is written into `harness.ts` beside the scenario and into NOW.md by stage 6. `starved` now uses 500, the lowest round number clear of the trap, so it demonstrates the failure mode it is named for.

**Conservation, extended to act 1.** Same randomization approach as the toy pathway, through the same option shape, which is what stage 3 built `createAct1` for. Seeded, randomized initial levels, Vmax and Km across two orders of magnitude, plus configurations forcing shortfall scaling and configurations with several pools short at once. Fermentation randomized on and off so both topologies are covered, the closed carrier loop and the one-way carrier. Tolerance unchanged at 1e-9 relative, and the measurement test asserting observed drift stays below tolerance/1000 is kept.

Worst drift per quantity over 60 long runs of 4000 ticks:

    adenylate      1.653e-13
    carbon         2.351e-13
    nicotinamide   1.920e-13
    phosphate      8.865e-14
    redox          2.351e-13
    worst overall  2.351e-13

**Act 1 does drift slightly worse than the toy pathway, 2.351e-13 against V1's 1.964e-13, and the tolerance was not loosened.** It is a 20 percent increase within the same order of magnitude, and it is what you would expect from a pathway with five reactions rather than three and five quantities rather than three: more rounded additions per pool per tick. It is still more than three orders below the 1e-9 tolerance and V1 stage 5's argument for that number is untouched. Worth recording as the new baseline, not worth acting on.

**Determinism, extended to act 1. New canonical hash: `e9b720a8`.** Fixture: `createAct1({ seed: 20260729 })`, 1200 ticks, setting `ferment` from a PRNG roll every 50 ticks. Frozen as an assertion.

The script **sets** ferment from the roll rather than toggling it, and that difference is the whole point. A toggle depends only on how many rolls have happened, so the roll value would never reach the pools and the seed would once again only be visiting the RNG state field, which is the hole V1 stage 5 named. Setting from the value means two seeds produce different enable histories, different NAD+ trajectories and different pool amounts. There is a test asserting exactly that, comparing pool amounts between two seeds before any hashing happens, so the hole is closed by measurement rather than by argument.

**Two canonical hashes now, both frozen. The toy pathway's `172f83fb` is untouched** and still asserted in `src/sim/__tests__/determinism.test.ts`, which passes.

Verify. `npm test` 95 passed, up from 83, 12 new. `npm run typecheck` clean. `npm run lint` clean. `npm run sim:act1 -- 1200 <scenario>` run for all three, output above. `npm run sim` unchanged.

---

# Stage 6 — Coherence, verify and NOW.md

```
Close the log out.

1. Coherence pass over src/content/ with the same sweep V1 stage 5 ran over
   src/sim/: no Math.random, no Math.pow, Math.exp or Math.log, no Date.now, no
   object-key iteration in anything on the flux path, no allocation inside tick.
   Fix what you find rather than reporting it.

   Then decide the question stage 2 raised: should the ESLint determinism guard
   extend from src/sim/** to src/content/**? Content builds reaction descriptors
   that the kernel then runs, so a Math.pow in a tuning file reaches the same
   arithmetic by a different door. Make the call, apply it, and prove it fires the
   way V1 stage 1 proved it: write a probe file, run lint, quote the error, delete
   the probe.

2. Full verify: `npm run typecheck`, `npm run lint`, `npm run build`, `npm test`.
   Report the test count and the bundle size against V1's 65 tests and 193.37 kB.

3. Walk the pathway by hand, in the report, in prose. One glucose from glucose_env
   to 2 lactate. Name each reaction, what it consumes, what it produces and what
   the five conserved totals do. If the walkthrough and the code disagree, the code
   is what shipped and the walkthrough is the bug report.

4. Update NOW.md:
   - Status: act 1 content exists and runs. Still no interface, so still nothing a
     player can touch.
   - Build state table: V2 done, with the date. Do not extend the table past V5.
     Line 28 says not to and V3 has not answered the two questions yet.
   - "What the kernel does" gains a sibling section for src/content/, same shape.
   - Blocking: remove whichever items stage 1 closed. Do not remove anything stage
     1 left open, and do not remove the ECONOMY.md obligation.
   - "Open, not blocking": the provisional tuning values and their ECONOMY.md debt,
     and the docs/SIMULATION.md line 90 wording question from stage 2, resolved or
     recorded.
   - "The vertical slice": V2's line moves from left to done. What is left for V3
     is the interface and nothing else.
   - "Why the UI waits": V2 can now say something about the two docs/BRIEF.md
     questions. Say what it actually shows, from stage 4's and stage 5's numbers,
     and be honest that a console cannot answer a question about feel. State what
     V3 has to measure.

5. Do not update docs/ECONOMY.md or docs/CONTENT_STYLE.md. Neither exists and
   neither should yet.

Verify: everything above clean. Report the NOW.md diff summary, the test count, the
bundle size, and the lint probe output from step 1.
```

## Stage 6 Report

**Coherence sweep over `src/content/`.** Swept for `Math.random`, `Math.pow`, `Math.exp`, `Math.log`, `Date.now`, object-key iteration on the flux path and allocation inside the tick. **Nothing to fix.** The only matches for the banned identifiers are in prose: `tuning.ts` explaining why the Hill n is an integer, and the `README.md` paragraph about the guard's scope. No `Object.keys`, `Object.values`, `Object.entries` or `for...in` anywhere outside test files. `recordAct1Tick` and its `moved` helper allocate nothing and do no lookups by id; every `.find` and `.map` in the content layer runs at construction, in `probe`, `createAct1MeterProbes` and `act1PoolDefinitions`.

**The ESLint question stage 2 raised: the guard extends to `src/content/**`.**

The original scope was too narrow. Content does not merely sit next to the simulation, it builds the pool definitions and reaction descriptors the kernel runs, so a `Math.pow` in a tuning file reaches the same arithmetic through a different door and breaks cross-browser determinism just as thoroughly as one in `tick.ts`. The hashed state is a function of content, so content is simulation code whatever directory it lives in. UI code stays exempt, because it is not part of the tested state.

Proved it fires, the way V1 stage 1 proved it. Wrote `src/content/act1/__probe.ts` with all five banned calls, ran `npx eslint` on it:

    src/content/act1/__probe.ts
      1:18  error  'Math.random' is restricted from being used. CLAUDE.md hard rule 4: use the seeded PRNG in src/sim/prng.ts. Determinism is a tested property  no-restricted-properties
      2:18  error  'Math.pow' is restricted from being used. CLAUDE.md hard rule 5: Math.pow is implementation-approximated. Use repeated multiplication        no-restricted-properties
      3:18  error  'Math.exp' is restricted from being used. CLAUDE.md hard rule 5: Math.exp is implementation-approximated and breaks cross-browser determinism  no-restricted-properties
      4:18  error  'Math.log' is restricted from being used. CLAUDE.md hard rule 5: Math.log is implementation-approximated and breaks cross-browser determinism  no-restricted-properties
      5:18  error  Unexpected use of 'Date'. docs/SIMULATION.md Part 5: wall-clock time enters only at the loop boundary, never inside sim code                  no-restricted-globals
      5:18  error  'Date.now' is restricted from being used. docs/SIMULATION.md Part 5: wall-clock time enters only at the loop boundary, never inside sim code   no-restricted-properties

    6 problems (6 errors, 0 warnings)

Probe deleted, `npm run lint` clean afterwards. `src/content/README.md` updated so it states the decision rather than the open question.

**Full verify.** `npm run typecheck` clean. `npm run lint` clean. `npm run build` clean. `npm test` **95 passed against V1's 65**, 30 new across five files. Bundle **193.37 kB, unchanged from V1's 193.37 kB**, which is correct and worth stating plainly: nothing in the app imports the content layer yet, because there is no app. The whole of act 1 currently reaches the world through `npm run sim:act1` and a test suite.

**One glucose, by hand, from `glucose_env` to 2 lactate.**

A single glucose sits outside the cell as one unit of `glucose_env`, carrying carbon 6 and redox 2. **uptake** moves it across the membrane to `glucose`, unchanged in every respect. No transporter is named and no cost is charged, which is disclosed in docs/SCIENCE.md Part 1 rather than buried.

**prep** consumes that glucose and 2 ATP, producing 2 g3p and 2 ADP. The six-carbon skeleton becomes two three-carbon fragments, so carbon goes 6 to 6. Phosphate is the one that looks wrong and is not: 2 ATP at weight 3 is 6 going in, and 2 g3p at weight 1 plus 2 ADP at weight 2 is 6 coming out. The cell has spent its investment and the phosphates are still all present, just distributed differently. Redox 2 rides onto the two trioses at 1 each. Adenylate is untouched at 2, because ATP became ADP rather than disappearing.

**payoff** runs twice, once per triose. Each turn takes one g3p, one NAD+, 2 ADP and one free phosphate, and returns one pyruvate, one NADH and 2 ATP. Across both turns: carbon 6 to 6; phosphate 2 from the trioses plus 8 from four ADP plus 2 free equals 12, out as four ATP at weight 3, also 12; redox 2 leaves the trioses and lands on 2 NADH, because pyruvate carries none; nicotinamide 2 to 2, NAD+ becoming NADH; adenylate 4 to 4. The cell now holds 4 ATP where it spent 2, and its entire nicotinamide pool is 2 units further toward reduced. **This is the step that has a ceiling on it**, and everything about act 1 follows from that.

**ferment** runs twice, if the player has it. Two pyruvate and 2 NADH become 2 lactate and 2 NAD+. Carbon 6 to 6. Redox 2 comes off the carriers and goes onto the lactate at 1 each, which is why lactate carries a redox weight at all and why the glucose-to-2-lactate conversion is **redox neutral end to end**, exactly as the counting convention promises. Nicotinamide 2 to 2, and the carrier is back where it started, ready for another triose. No ATP appears anywhere in these two lines, which is the misconception, refuted by the absence of a term rather than by an argument.

Net across all five steps: one environmental glucose has become 2 lactate, carbon 6 to 6 and redox 2 to 2. The cell is 2 ATP richer and 2 free phosphates poorer, adenylate unchanged. **maintain** then hydrolyses those 2 ATP back to 2 ADP and 2 free phosphate, returning phosphate and adenylate to exactly where they started, and the cell has done work rather than accumulated a score.

All five totals across the whole sequence: unchanged. **The walkthrough and the code agree**, which I checked against the harness rather than asserting: `npm run sim:act1 -- 1200 fermenting` reports 451.37 glucose committed, 897.11 lactate produced, and 4.000000000 ATP per glucose gross with 2.000000000 net.

**NOW.md updated**, 65 insertions and 17 deletions. Status rewritten to act 1 exists and runs with still nothing a player can touch. V2 marked done 2026-07-29 and the table not extended past V5. A new "What the content layer does" section added as a sibling to the kernel's, same shape, carrying the file list, the full pathway, the five conserved quantities, the 95 tests, the 2.351e-13 drift and the `e9b720a8` hash. A "Settled 2026-07-29" block records the six decisions this log made.

Blocking is emptied of both items stage 1 closed and carries **one new item: act 1 has an unrecoverable state**, the ATP bootstrap trap stage 5 found. It is a real defect in shipped content and Blocking is where the things that are actually wrong belong, as against the things that are merely unfinished.

"Open, not blocking" gains four entries. The tuning values and their docs/ECONOMY.md debt, called out as the largest single debt V2 created. The docs/SIMULATION.md line 90 wording question, **recorded rather than resolved**, with a recommendation that Part 2 be widened to say the conserved set is content's to declare, since act 3 will add more, but noting that a spec edit should be deliberate rather than incidental. The timeline date column having no treatment for an undated stop, which is what stage 1 left open. And the instantaneous NAD+ recovery, which is correct simulation and possibly anticlimactic gameplay.

"Why the UI waits" now says what V2 actually shows about the two docs/BRIEF.md questions, and is honest that a console cannot answer a question about feel. On the NAD+ wall it can say a lot: the stall is legible as an event at 3.05 game-seconds with glucose visibly piling up, and the zero-yield result is an assertion rather than an intention. On saturating kinetics it can say very little, and says so. Four things V3 has to measure are named.

docs/ECONOMY.md and docs/CONTENT_STYLE.md were not created. Neither exists and neither should yet.

---

# After These Stages

- Act 1 exists as a running pathway with sourced stoichiometry, and the conservation test that `docs/SIMULATION.md` line 90 asked for before content is now guarding real biology instead of invented letters. The NAD+ wall is a tested property: the stall, the recovery and the zero yield gain are assertions rather than intentions.
- V3 is next and it is the interface, scoped to nothing more than what is needed to play the slice and answer the two questions in `docs/BRIEF.md` line 110. `DESIGN.md` is a large specification that has never been tested against a running simulation and V3 should apply only the part of it the slice needs.
- Still deferred on purpose, see `NOW.md`: the ethanol branch, glycogen storage, the ten-enzyme decomposition, unlock costs and thresholds, saves and migrations, offline progress, the timeline and the beast.
- `docs/ECONOMY.md` gains its first real obligation in this log and still should not be written until V3 has been played. Every provisional value sits in one file for exactly that reason.
- `STEADY_EPSILON` and `STEADY_WINDOW` are still unvalidated placeholders. Act 1 is now the first real configuration they could be measured against, which is the offline-progress log's first task rather than this one's.
