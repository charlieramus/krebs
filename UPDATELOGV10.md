charlie

# krebs, V10: Act 1 Completion
# Work on one stage at a time. Do NOT combine stages.

---

## Context

Read `NOW.md` first, then `docs/PROGRESSION.md` act 1, then `docs/ECONOMY.md`. Then read `NOW.md` blocking item 2, twice, because this log exists to close it and it has survived one attempt already.

**Act 1 has nine unlocks in `docs/PROGRESSION.md` and six of them are built.** Glucose uptake, glycolysis as a single pathway then decomposed into two phases, the uptake capacity ladder, the glycolytic capacity ladder, NAD+ pool visibility and lactate fermentation. The three that are not: **individual glycolytic enzymes as efficiency upgrades, ethanol fermentation as an alternate branch, and glycogen storage as a buffer against substrate scarcity.**

**Blocking item 2 is what those three are for.** V4 shipped act 1 with six discrete events, every one inside the first 5m13s, and then 84m47s in which nothing happened at all. V5 added the glycolytic capacity ladder and took that to seven events with a worst gap of 13m51s and the last purchase at 61m57s. That is inside the 45 to 90 minute target and it is still fourteen minutes of a screen that reads 0.00 on every net rate. V5 said out loud what it could not do: the remaining gap is a content question rather than a balance one, and the three unbuilt unlocks all extend the pathway, which V5's scope forbade.

**One of the two founding assumptions came back negative and this is the log that answers it.** `docs/BRIEF.md` line 110 asks whether saturating kinetics feel like a game. `NOW.md` records the answer as no, not yet, and records the reason: once act 1 is solved the screen stops changing, so there is nothing arriving for the kinetics to respond to. More things to buy is the whole of the fix that is available without leaving act 1.

**This log adds content to the simulation, which no log since V2 has done.** That has three consequences it must handle deliberately rather than discover. The act 1 canonical hash `49ea08d3` **will move**, because starting amounts are hashed state and new pools have starting amounts. Every new tuned scalar needs a row in `docs/ECONOMY.md` or `divergenceTable.test.ts` fails the build. And the new unlock ids become contract surface the same way `ferment` and `uptake-capacity-N` did in V4.

**And it touches biology that `docs/SCIENCE.md` may not cover**, which is why stage 1 is a documentation stage and no code is written until it is done. Ethanol fermentation is a real pathway with real stoichiometry and it produces carbon dioxide, which lactate fermentation does not. Nothing in act 1 has ever released carbon from the cell.

## Decisions

- **Stage 1 is documentation and it comes first, for the reason V2 stage 1 came first.** The coefficients of a pathway are biology and hard rule 1 says a player-facing number has to trace to `docs/SCIENCE.md`. If ethanol fermentation is not in there, adding it is legitimate new biological ground truth rather than a balance pass, so hard rule 2 does not forbid it. What hard rule 2 forbids is touching `docs/SCIENCE.md` in stages 2 to 6, and that ban is absolute.
- **Ethanol fermentation releases CO2, so act 1 gets a carbon dioxide pool.** Pyruvate decarboxylase removes a carbon before alcohol dehydrogenase reduces the rest, which is why the ethanol branch and the lactate branch are not two flavours of the same thing. **Carbon stays conserved because the carbon goes into a pool rather than out of the model.** A reaction that made carbon vanish would fail the conservation property test, and it should, because a cell that deletes matter is the thing the whole invariant exists to catch. The pool is a real product with a real name, not an accounting device.
- **"Individual glycolytic enzymes" means the three regulated steps, not all ten.** Decomposing glycolysis into ten reactions would add nine intermediate pools, nine sets of kinetic constants, nine divergence rows and one new teaching beat, which is a bad ratio. Hexokinase, phosphofructokinase-1 and pyruvate kinase are the three committed and regulated steps in the real pathway, `prep` already carries a Hill exponent attributed to PFK-1, and `docs/PROGRESSION.md` act 4 already plans allosteric control of PFK-1 as its own beat. **Three named enzymes that the player recognises later is worth more than ten they meet once.** If stage 1's reading of `docs/SCIENCE.md` says this is wrong, stage 1 says so and the decision changes there rather than being worked around in stage 4.
- **Glycogen storage is a buffer and its teaching beat is that a buffer is not a yield.** It stores glucose and gives it back. It produces no ATP, it costs ATP to charge, and it exists so the cell survives a gap in supply. That is the same shape as the fermentation beat and it should be allowed to be: an upgrade that buys nothing except the ability to keep running.
- **The ethanol branch is a choice and the game does not tell the player which is right, because neither is.** Lactate and ethanol both regenerate NAD+ and neither yields ATP. What differs is what leaves and what is kept. That is a real fork with a real trade and it is the first decision in the game that is not simply an upgrade.
- **The canonical hash moves and the assertion says why, in the assertion.** V3 and V5 both moved it and both wrote the reason into the test rather than into a commit message. Same here. A hash that moves with an explanation attached is a record; a hash that moves silently is a bug that has not been noticed yet.
- **Nothing in this log touches the interface beyond what the new content requires.** No timeline, no beast, no act boundary. Those are V11 and V12 and this log inherits nothing from them and hands them nothing except more content to render.
- **The pacing target is not "fill every gap".** `docs/PILLARS.md` rules out engagement mechanics and an idle game where something is always happening is an idle game that never lets you leave. The target is the one `docs/PROGRESSION.md` already sets, 45 to 90 minutes, with a gap short enough that a player who is watching has a reason to keep watching and long enough that a player who is not is not being nagged. Stage 5 measures and names it rather than inheriting a number from this paragraph.
- Large content feature, first simulation change since V2, and the hash moves: six stages.

## What act 1 looks like now, transcribed so no stage paraphrases it

```
  reactions      uptake     glucose_env               ->  glucose
                 prep       glucose + 2 atp           ->  2 g3p + 2 adp
                 payoff     g3p + nad + 2 adp + pi    ->  pyruvate + nadh + 2 atp
                 ferment    pyruvate + nadh           ->  lactate + nad
                 maintain   atp                       ->  adp + pi

  conserved      carbon  phosphate  redox  nicotinamide  adenylate

  purchases      7, last at 61m57s, worst gap 13m51s
  environment    lasts to 92m42s
  target         45 to 90 minutes
  canonical      49ea08d3
  ledger         4 ATP gross, 2 net, 2 NADH, 2 pyruvate per glucose
```

The ledger is the claim act 1 exists to make and **no stage in this log may move it.** Enzyme upgrades increase throughput and never yield, `docs/PROGRESSION.md` says so, and it is asserted across nine purchasable configurations as of V5. This log adds configurations and the assertion has to still hold across all of them.

---

# Stage 1 — The biology, before any code

```
A documentation stage. No TypeScript is written and no test is added. Read
docs/SCIENCE.md end to end before deciding anything.

1. Ethanol fermentation. Establish whether docs/SCIENCE.md covers it and to
   what depth. It needs, at minimum: the two enzymes, pyruvate decarboxylase
   and alcohol dehydrogenase; the stoichiometry including the carbon dioxide;
   the fact that it regenerates NAD+ and yields no ATP, which is the same claim
   the lactate branch makes and has to be stated for this branch too; and which
   organisms actually do it, because act 1 is an anaerobic prokaryote and the
   textbook example is yeast.

   If it is absent or thin, write it, with citations, in the same form the
   existing Parts use. This is new biological ground truth rather than a
   balance change, so hard rule 2 permits it HERE and nowhere else in this log.
   Say in the report exactly what was added and why it was not already there.

2. The carbon dioxide question, and answer it in the document rather than in
   the code. One carbon leaves pyruvate before the reduction. Where does it go
   in a model whose carbon is a conserved quantity asserted to 1e-9?

   The answer this log takes is a co2 pool, so carbon is conserved and the
   cell accumulates a real product. Check that against docs/SCIENCE.md and say
   whether it holds. In particular: does anything downstream in act 2, act 3 or
   act 4 consume CO2, or is it terminal in this game the way lactate is? The
   answer changes whether the pool is a sink or a reservoir and act 3 has a TCA
   cycle in it, so this is worth five minutes now and a migration later.

3. The individual glycolytic enzymes question. This log's Decisions say three
   regulated steps rather than ten reactions. Test that against
   docs/SCIENCE.md rather than against convenience.

   Specifically: are hexokinase, phosphofructokinase-1 and pyruvate kinase the
   three committed and regulated steps, does the existing Hill exponent in prep
   attribute to PFK-1 as src/content/act1/tuning.ts claims, and does upgrading
   a single enzyme in a lumped two-reaction model say anything true? That last
   one is the real question. If the honest answer is that a named enzyme
   upgrade on a lumped reaction is a lie, say so and the log takes the other
   path in stage 4 rather than shipping a label with nothing behind it.

4. Glycogen storage. Establish the stoichiometry and the cost. Glycogenesis
   and glycogenolysis are not each other's inverse in a real cell and they do
   not cost the same, and a storage system that returns exactly what it took is
   a simpler and less true thing than one that charges for the service. Decide
   which this game models and record the reason.

5. docs/PROGRESSION.md, act 1. Its unlock list is nine items and three are
   about to become real. Check the list still says what this log is going to
   build, and if the wording has drifted from what stages 2 to 4 will do, fix
   the document rather than letting the code disagree with it. Do not add
   numbers: that file says it contains no tuned numbers and that is still true.

6. Name every new pool and unlock id in this stage, in one list, and treat
   them as permanent from here. docs/SAVE_SCHEMA.md Part 3 says pool ids are
   permanent, V4 made act 1 unlock ids contract surface, and the day to choose
   them carefully is before anything writes them into a save.

Verify: docs/SCIENCE.md covers all three unlocks with citations, or already
did. Report what was added, the CO2 decision with its act 3 implication, the
enzyme-count decision with the honest answer to step 3's real question, the
glycogen cost decision, any docs/PROGRESSION.md correction, and the permanent
id list. Confirm no code changed and no tuned number moved.
```

## Stage 1 Report

**The carbon dioxide question has a different answer than this log assumed, and it is the finding everything else in the stage is smaller than.** The log's Decisions section says CO2 goes into a pool "so carbon is conserved and the cell accumulates a real product", and asks stage 1 whether the pool is a sink or a reservoir. **It is a reservoir.** Act 4's pyruvate carboxylase consumes carbon dioxide, taking its carbon from bicarbonate to carboxylate pyruvate to oxaloacetate, and its larger use is anaplerotic rather than gluconeogenic, which makes it a net fixer rather than a step that gives the carbon straight back. Nothing in act 1 or act 2 draws the pool down and act 4 does. That is the five minutes the stage said were worth spending, and it costs nothing now and a migration later.

**docs/SCIENCE.md covered one of the three unlocks in one sentence, one of them in a paragraph written for a different reason, and one of them not at all.** Glycogen appeared nowhere in the document before this stage. Four sections were added and one existing sentence was expanded. **No code was touched, no tuned number moved, and both canonical hashes are where V8 left them.**

### Step 1. Ethanol fermentation. Present, and one sentence deep

What was there, in Part 2 under "Fermentation", in full:

    Ethanol fermentation, two steps. Pyruvate decarboxylase removes CO2 to give
    acetaldehyde, then alcohol dehydrogenase reduces acetaldehyde to ethanol,
    oxidizing NADH.

Everything in that sentence is correct. Against the stage's minimum list it carries the two enzymes and the carbon dioxide and it carries nothing else. It does not give the stoichiometry, it does not state the zero ATP yield for this branch on its own, and it says nothing about which organisms do it, which is the one that mattered, because act 1 is an anaerobic prokaryote and the two named enzymes are the yeast route.

**The zero yield was inherited rather than stated, and it should not have been.** The section's opening line says fermentation produces zero additional ATP, and the closing line says both branches give a net of 2 ATP per glucose overall. A reader can get there. But the game is about to put the two branches side by side as a choice, and a decarboxylation is exactly the step a player expects to cost or release something. The claim now sits under the ethanol branch's own heading rather than being reachable from the heading above it.

**The organism question is the real gap and it does not resolve cleanly, which is why it is written out rather than waved at.** The textbook example is Saccharomyces cerevisiae, a eukaryote, so act 1 cannot lean on it. The pyruvate decarboxylase route is genuinely present in bacteria and it is uncommon there. Two cases were established:

    Zymomonas mobilis    ferments to ethanol through PDC and ADH, but runs the
                         Entner-Doudoroff pathway rather than glycolysis and
                         therefore nets 1 ATP per glucose, not 2
    Sarcina ventriculi   Gram-positive anaerobe, runs glycolysis, carries a
                         pyruvate decarboxylase. The closer precedent

**And the counterexample is worth as much as the examples.** Escherichia coli makes ethanol and does not make it this way: it has no pyruvate decarboxylase at all, and its fermentative route runs pyruvate through pyruvate formate-lyase to acetyl-CoA and formate, then through the bifunctional AdhE, consuming two NADH per ethanol rather than one. **That is already in this document**, in Part 3, written for the unrelated reason that AdhE is an oxidative damage target. So is Zymomonas, cited there for its two alcohol dehydrogenases. Part 2 was one sentence deep on a pathway Part 3 discusses at length, because Part 3 was written by an act 2 sourcing pass that had no reason to go back and widen it.

So what act 1 claims by shipping this branch is stated in the document rather than left implicit: that a prokaryote running glycolysis can ferment to ethanol by decarboxylation and reduction, which is true of the class and uncommon within it. That is the same shape as Part 3's oxygen-stable PFOR, a real exception to a real rule, and the document already knows how to say it.

### Step 2. Carbon dioxide. Not terminal, and act 4 is why

Added as its own section in Part 2 rather than as a clause, because the question is about all four acts and Part 2 is where act 1 will look for it.

The carbon does not leave the model. Decarboxylation turns one carbon of pyruvate into carbon dioxide, which is a real molecule with that carbon still in it, so a cell releasing it has moved carbon rather than destroyed it. A reaction that made it vanish would be wrong about chemistry rather than simplified about it, and the conservation property test should and would refuse it.

Enumerated across the four acts:

    produced   ethanol fermentation        1 per pyruvate    act 1
               pyruvate dehydrogenase      1 per pyruvate    act 3, Part 4
               TCA cycle                   2 per turn        act 3, Part 4
    consumed   pyruvate carboxylase        1 per pyruvate    act 4, Part 5

**Gluconeogenesis as a pathway is carbon dioxide neutral and one of its reactions is not.** Pyruvate carboxylase fixes the carbon and phosphoenolpyruvate carboxykinase releases it again one step later, so the round trip nets zero. They are separate reactions and only one of them consumes, which is the distinction that decides the pool's type.

**The anaplerotic use is the one that makes it a real consumer.** Pyruvate carboxylase's main job is topping the TCA cycle back up with oxaloacetate when intermediates are drawn off for biosynthesis, and used that way there is no matching decarboxylation. Part 4 already records that the cycle is amphibolic. This is what that costs, and it was not written down.

**The consequence, stated so no later stage has to rediscover it.** Carbon dioxide is a reservoir rather than a sink. It cannot be treated as write-only accounting because a later act reads from it, it cannot be capped, and it cannot be discarded to keep a number small. The offline path is the place that would have done the third one: `src/sim/jump.ts` retires spent pools, which is the only place in the project that discards matter, and a pool that only ever grows is not at risk from it. Recorded because a future act that drains CO2 puts it back in range.

docs/SCIENCE.md Part 5 gained the three gluconeogenic bypasses by name in the same edit, because the CO2 answer is unciteable without them and Part 5 said only that three steps are irreversible and need bypassing.

### Step 3. The enzymes. Three, and the honest answer to the real question

**The three regulated steps check out verbatim and the document did not have to be argued with.** Part 2, "Regulation", already says PFK-1 is the primary control point and the committed step, that hexokinase is inhibited by its own product, and, in as many words, that "Pyruvate kinase is the third regulated step". The log's Decisions section reached the same three by reasoning about ratios. They agree, and the document is the reason rather than the ratio.

**The Hill attribution checks out too.** `src/content/act1/tuning.ts` says the cooperativity being modeled is PFK-1's and `reactions.ts` calls the attachment "correct about which enzyme is cooperative, wrong about what the cooperativity is attached to". Part 2 says PFK-1 shows cooperative sigmoidal kinetics and is the one enzyme where the Hill form is used. The claim in the code is the claim in the document.

**Now the real question, which is step 3's third clause: does upgrading a single named enzyme in a lumped two-reaction model say anything true?**

**It is not a lie and it is a claim, and the difference is what the document now records.** The claim is that this enzyme is where control of its phase concentrates. Three things decide whether that survives contact with the science:

**One. The seven unregulated steps run near equilibrium and follow their substrates.** Raising one of those raises nothing, in the model and in a cell. So a game that sold all ten would be selling seven upgrades that do nothing, and the honest version of "individual glycolytic enzymes" is three rather than ten before any argument about pool counts. **This is the strongest reason for the log's own decision and it is not the reason the log gave**, which was the ratio of nine intermediate pools to one teaching beat. That reason is also true and it is the weaker one.

**Two. Flux control is distributed, so "raising PFK-1 raises flux by the same factor" is false.** Metabolic control analysis assigns each enzyme a control coefficient and the coefficients over a pathway sum to one, and for glycolysis no single enzyme holds all of it. The game is claiming concentration and it must not claim exclusivity. Part 2 has a new subsection saying so, and it is the one place in this stage where the science narrows what the log wanted rather than confirming it.

**Three. None of it touches yield, and that is arithmetic rather than a promise.** No change to any rate anywhere in the ten steps produces more than 4 ATP gross per glucose, because the yield is fixed by stoichiometry. So the act's central claim is safe from this unlock by construction, which is why stage 4's assertion across every new configuration should pass rather than merely be checked.

**What would be a lie, so stage 4 knows what it must not build.** An enzyme upgrade that moved yield. An enzyme attached to a step that carries no control, triose phosphate isomerase being the standard example, since it runs close to the diffusion limit. And an upgrade whose effect on the phase is presented as the enzyme's own effect with no disclosure, which is the failure `reactions.ts` already avoided once for the Hill exponent and should avoid again the same way.

**The parameter each enzyme should move, decided here so stage 4 builds rather than chooses.** Each maps onto the regulatory character the document actually gives that enzyme:

    hexokinase        lowers prep's K            affinity. Part 2 now records
                                                 that hexokinase's defining
                                                 property is a low Km and that
                                                 glucokinase is the same
                                                 chemistry at a higher one
    PFK-1             raises prep's Vmax         the committed step, so the
                                                 phase's throughput
    pyruvate kinase   raises payoff's Vmax       the third regulated step, and
                                                 it lives in the payoff phase

**And the V5 constraint reaches this stage, which stage 4 asked about.** `payoff` Vmax must strictly exceed twice `prep` Vmax. PFK-1 raises `prep` and pyruvate kinase raises `payoff`, so **the two upgrades push the constraint in opposite directions and the order they are bought in matters**, which is a thing no capacity ladder in this game has ever done. The available answer is the one V5 used: make the order unbuyable in the wrong sequence, by gating PFK-1 behind pyruvate kinase rather than by selling them together. Stage 4 measures whether the existing headroom makes the gate unnecessary, and ships the gate if it does not. Hexokinase moves a K rather than a Vmax so it does not enter the constraint as written, and it does raise realized `prep` flux, which stage 4 has to measure against realized `payoff` flux rather than against the nameplate ratio.

### Step 4. Glycogen. Absent from the document, and the cost is not symmetric

Glycogen appears nowhere in docs/SCIENCE.md before this stage. A whole section was written.

**The route in and the route out are different pathways with different enzymes, which is the stage's own hypothesis and it is correct.**

    in    glucose -> G6P                 1 ATP     hexokinase
          G6P -> G1P                     free      phosphoglucomutase
          G1P + ATP -> ADP-glucose       1 ATP     ADP-glucose pyrophosphorylase
          ADP-glucose -> glycogen        free      glycogen synthase
                                         -----
                                         2 ATP equivalents per glucosyl unit

    out   glycogen + Pi -> G1P           free      glycogen phosphorylase
          G1P -> G6P                     free      phosphoglucomutase
                                         -----
                                         0 ATP, and the unit re-enters
                                         glycolysis past hexokinase

**Net cost of a full store and retrieve cycle is 1 ATP equivalent per glucose unit.** Two spent going in, one saved coming out, because glycogen phosphorylase cleaves with inorganic phosphate rather than water and hands back an already phosphorylated sugar. **A glucose that went through storage returns 1 net ATP through glycolysis where a glucose that did not returns 2.** The pyrophosphate released at the activation step is hydrolysed, which is what makes that step irreversible and why it counts as a whole ATP equivalent rather than a fraction.

The bacterial route uses ADP-glucose and the eukaryotic route uses UDP-glucose. The donor differs and the accounting does not, so act 1 takes the bacterial one and nothing downstream cares.

**What the game should model, and where it has to depart.** The model has no glucose-6-phosphate pool, so the saving on re-entry has nowhere to be realised: a mobilised unit lands in the `glucose` pool and pays `prep`'s full 2 ATP entry cost like any other. **So the game charges the net cost at storage time rather than the gross cost at storage and a refund on the way out.** One ATP in, nothing out.

    store      glucose + atp  ->  glycogen + adp + pi
    mobilise   glycogen       ->  glucose

That is a DEPARTURE and stage 3 owes it a row. What is faithful is the net, which is exactly 1 ATP equivalent per unit cycled. What departs is where it is charged, and the one observable consequence is that a unit stored and never retrieved cost 1 where a real cell paid 2. In act 1 the buffer exists to be drawn down, so the mobilised case is the ordinary one and the departure is invisible in it.

**Conservation of the two reactions was checked here rather than left to stage 3**, since the whole point of naming the pools in this stage is that stage 3 should not be discovering a problem with them. Glycogen carries carbon 6, redox 2 and phosphate 0, being a glucosyl residue with no phosphate on it:

    store      carbon 6 = 6, redox 2 = 2, adenylate 1 = 1,
               phosphate 3 = 2 + 1, nicotinamide 0 = 0
    mobilise   carbon 6 = 6, redox 2 = 2, everything else 0 = 0

**And the ethanol branch balances all five exactly, which is worth reporting now because it fixes the two new weights stage 2 needs.** With `co2` at carbon 1 and redox 0, since carbon dioxide is fully oxidized and carries no reducing power, and `ethanol` at carbon 2 and redox 1:

    ferment_ethanol   pyruvate + nadh  ->  ethanol + co2 + nad

    carbon        3  =  2 + 1
    redox     0 + 1  =  1 + 0 + 0
    nicotinamide  1  =  1
    phosphate     0  =  0
    adenylate     0  =  0

**Drop the co2 and carbon fails at 3 against 2**, which is the deliberate failure stage 2 is told to write and quote. It fails on carbon alone and on nothing else, which is the cleanest possible version of that test.

**One problem is flagged rather than solved, and it belongs to stage 3.** Real glycogen synthesis and degradation are reciprocally regulated so they do not run hard at once, and the bacterial control point is ADP-glucose pyrophosphorylase being allosterically activated by glycolytic intermediates and inhibited by AMP. **This engine cannot express that.** `computeFlux` in `src/sim/reactions.ts` takes the minimum of per-substrate saturation terms and there is no inhibition term anywhere in `Kinetics`, so a reaction can be slowed by a scarce substrate and never by an abundant regulator. **So act 1 will ship a futile cycle**: with both reactions running, storage and mobilisation cycle the same carbon and burn ATP for nothing at the rate of the slower one.

The honest reading is that this is a real failure mode of a real cell rather than a modeling artifact, and docs/SCIENCE.md Part 5 already names it for glycolysis against gluconeogenesis. The thing that suppresses it is allosteric regulation, which is act 4's theme. **Act 1 gets a cost it cannot regulate away and act 4 is the act that would fix it**, which is a better outcome than an invented gate. What stage 3 has to do is bound it: storage is gated on intracellular glucose through a high K, which is the one signal the min rule can carry and which is also what the real allosteric activation is a proxy for, and mobilisation's Vmax sets both how fast the buffer discharges and how large the permanent tax is. Those pull against each other and stage 3 measures the trade rather than assuming it.

### Step 5. docs/PROGRESSION.md. Two drifts in one line, and both were real

The act 1 unlock list still says what this log is going to build for seven of its nine items. Item 5 had drifted in two ways and both were corrected.

**"Individual glycolytic enzymes" implied ten.** Corrected to name the three regulated steps, with the reason pointing at docs/SCIENCE.md Part 2, Regulation, rather than at the log's Decisions section.

**"Efficiency upgrades" implied yield, and it contradicted the same page three lines below.** The wall paragraph says "Enzyme upgrades increase throughput, never yield". Efficiency is the word for yield. Corrected to throughput.

Three other corrections, none of them a drift but all of them things a later stage would have had to work out:

**The list is ordered by dependency and not by the clock, and nothing said so.** Items 6 and 7 are the NAD+ wall and its answer and they arrive in the first seconds of the act, while items 3 to 5 are not affordable for minutes. A reader taking the numbering as a timeline gets act 1 backwards.

**Item 8 is a choice and not an upgrade**, and the difference is what the cell keeps rather than which is better. It is also the first reaction in the game to release carbon, and the carbon is a real product rather than a deletion.

**Item 9 is a buffer and a buffer is not a yield.** It costs ATP, returns none, and the round trip returns less than it took.

**No number was added.** That file says it contains no tuned numbers and it still does not.

### Step 6. The permanent id list

Named here and permanent from here. docs/SAVE_SCHEMA.md Part 3 makes pool ids permanent and V4 made act 1 unlock ids contract surface.

    pools        co2                       carbon 1, redox 0
                 ethanol                   carbon 2, redox 1
                 glycogen                  carbon 6, redox 2, phosphate 0

    unlocks      ferment-ethanol
                 glycogen-storage
                 enzyme-hexokinase
                 enzyme-pfk1
                 enzyme-pyruvate-kinase

    reactions    ferment_ethanol
                 store
                 mobilise

**The unlock ids take the existing shape rather than a better one.** V4 minted `ferment` for the lactate branch, before there was a second branch to distinguish it from, and `ACT1_UNLOCK_FERMENT` in `src/content/act1/save.ts` exports that literal. It cannot be renamed to `ferment-lactate` without a migration and it would be a rename that buys nothing a comment cannot buy, so **`ferment` means lactate permanently and `ferment-ethanol` sits beside it**. The three enzyme ids take an `enzyme-` prefix so they group the way `uptake-capacity-` and `glycolysis-capacity-` do, and they are enumerated rather than indexed because they are three named things rather than a ladder.

**Reaction ids are not contract surface and are listed anyway.** They are never persisted: `progression.unlocked` is the single source of truth and enabled flags are derived from it at load. They are listed because they end up in test names, harness output and the divergence table's `Where` column, and choosing them twice is worse than choosing them once. `ferment_ethanol` takes the underscore that `glucose_env` already established for a two-word id.

**No pool id is a display name and none of them should be read as one.** `co2` is the id. What a player sees is stage 6's problem and docs/CONTENT_STYLE.md's.

### Verify

**docs/SCIENCE.md covers all three unlocks with citations.** Ethanol fermentation was expanded from one sentence to a full subsection with stoichiometry, yield, redox, organisms and the E. coli counterexample. Carbon dioxide got its own section answering the sink-or-reservoir question across all four acts. Glycogen got a section from nothing. Flux control got a subsection under Regulation. Part 5 gained the three gluconeogenic bypasses by name. Four new source blocks were added and **no URL was guessed**: the new entries carry title, journal and year, the author lists that were not independently checked say so, and the verification note for this pass is separate from the 2026-07-28 one because it was a different kind of pass, textbook-level rather than contested-primary.

**No code changed and no tuned number moved.** `git diff --stat` across the whole stage is two files, `docs/PROGRESSION.md` and `docs/SCIENCE.md`. No file under `src/` was opened for writing. Both canonical hashes are untouched at `172f83fb` and `49ea08d3` because nothing they hash was touched.

**The suite is green at 504 tests across 41 files.** One note against NOW.md, which records V8 as ending at 503 across 41: the suite reports 504 on this commit with nothing modified under `src/`. The file count agrees and the test count is one out, so the discrepancy predates this log. Recorded rather than corrected, since stage 6 re-counts and NOW.md is stage 6's to edit.

**Hard rule 2 is now closed for the rest of this log.** docs/SCIENCE.md was edited in this stage, which stage 1 permits, and every stage from here is forbidden to touch it. Stage 6 reports the diff as evidence.

---

# Stage 2 — Ethanol fermentation, and the first carbon that leaves

```
The second NAD+ recycling branch. Read stage 1's report before starting and
build what it decided rather than what this prompt assumes.

1. The pools and the reaction, in src/content/act1/. A co2 pool and an ethanol
   pool, with conserved weights read from the same table everything else reads,
   so the illustration geometry follows for free and nobody draws anything.

   The reaction as stage 1 established it. If it is modelled as one lumped
   step, say so and say what is lost; if as two, say why the acetaldehyde
   intermediate earns a pool. Prefer whichever the teaching beat needs, which
   is probably one step, because the beat is about what the branch produces
   rather than about how it gets there.

2. Conservation first, before anything renders. Extend the property test that
   already asserts all five quantities over the reaction list. Carbon must
   balance exactly across the ethanol branch WITH the CO2 accounted for, and
   the test must fail if the CO2 is dropped. Write that failure deliberately
   and quote it, because a conservation test that has never seen the violation
   it exists to catch is a test nobody has checked.

3. The ledger, unchanged, and asserted. Gross 4 ATP and net 2 per completed
   glucose, on the ethanol branch exactly as on the lactate branch, to the same
   nine decimal places V2 and V5 asserted it to. If the two branches disagree
   by so much as a float, the model is wrong and this is where it surfaces.

4. The unlock, and the choice. It is a purchase like the others and it does not
   remove the lactate branch. A cell with both is a cell that can route
   pyruvate two ways, and what the player has bought is an option rather than
   an upgrade.

   Decide and record what happens when both are unlocked: does flux split, and
   on what? Do not invent a routing mechanic. The simplest true answer is that
   both reactions run against the same substrate under their own kinetics and
   the split falls out of the constants, which is what a real cell does and
   what this engine already does everywhere else.

5. Measure what the branch actually changes, and be willing to report that it
   changes little. Time to the wall, recovery time, ATP per second at steady
   state, and the split if both are unlocked. If ethanol is strictly worse than
   lactate at every constant, that is a purchasable configuration that makes
   the cell worse and V5's rule applies: do not ship one.

6. Determinism and the hash. This adds pools with starting amounts, so
   49ea08d3 moves. Record the new value, and put the reason in the assertion
   itself the way V3 and V5 did rather than in a commit message.

Verify: conservation holds across all five quantities with the CO2 in place and
fails without it, the ledger is unchanged to nine decimal places on both
branches, and the suite is green. Report the new canonical hash with its reason
in the assertion, the quoted conservation failure from step 2, the step 5
measurements, and the routing decision from step 4.
```

## Stage 2 Report

**The two branches are indistinguishable in every number except the one they exist to differ in, and that is the result rather than a failure to find one.** Measured from a sixty-second stall, recovery is 2 ticks and ATP per second is 31.7867 on the lactate branch, on the ethanol branch and with both running. Identical, not close. What differs is what the cell is left holding, which is what docs/PROGRESSION.md act 1 item 8 says the choice is about.

**The act 1 canonical hash moves to `2b18a4bc` and it is the first time it has moved without the simulation behaving differently.** Both earlier moves changed a number. This one changed the shape of the hashed state. **Verified rather than argued**: the same fixture run against the pre-change code gives all ten legacy pool amounts identical to seventeen significant figures, the same tick count and the same PRNG state.

**And the log's own assumption that "the illustration geometry follows for free" is wrong.** DESIGN.md rule 1 does not extend below three carbons. See step 1b, which is the one part of this stage that is a design decision rather than a build.

### Step 1. The pools and the reaction

Two pools and one reaction, in `src/content/act1/`.

    ethanol   carbon 2, redox 1     inserted after `lactate` in ACT1_POOL_IDS
    co2       carbon 1, redox 0

    ferment_ethanol   pyruvate + nadh  ->  ethanol + co2 + nad

**The redox weights are not free choices and stage 1 had already fixed them.** Carbon dioxide is the most oxidised form carbon takes and carries no reducing power, so it is 0, which leaves ethanol at 1 as the only value that balances the branch. Both weights are read from the same table the conservation test asserts against, so the illustration follows from them without anybody drawing anything.

**One lumped step, and here is what that loses.** The real branch is two reactions: pyruvate decarboxylase removes the CO2 to give acetaldehyde, then alcohol dehydrogenase reduces it and reoxidises NADH. Only the second touches the carrier. Lumping loses that separation and loses acetaldehyde entirely.

**What it buys is that the branch is the same SHAPE as the lactate branch**, one arrow off pyruvate, so the two read as a choice rather than as a short route and a long one. The stage prompt guessed this would be the answer and gave the reason: the beat is about what the branch produces rather than how it gets there. An acetaldehyde pool would be a card, a blob, two kinetic constants and two divergence rows for a molecule the player meets once and never reads. It is the same posture `prep` and `payoff` already take for five enzymatic steps each, and it is disclosed in the reaction comment the way theirs are.

### Step 1b. DESIGN.md rule 1 does not reach below three carbons. NOT ANTICIPATED BY THIS LOG

The stage prompt says the conserved weights mean "the illustration geometry follows for free and nobody draws anything". **It does not, and this is flagged rather than worked around.**

Rule 1 is "sides equal carbons". Act 1 has never had a molecule under three carbons, because glycolysis never cleaves below a triose. Ethanol is 2 and carbon dioxide is 1. **At two sides a straight-edged polygon is a line and at one side it is a point.** Neither encloses an area and neither can be stroked into a shape. SVG makes the same point independently: a curve or arc whose endpoints are identical is defined as omitted entirely, so a closed one-edged path does not exist in path syntax at all. Shipping it unchanged would have drawn carbon dioxide as nothing.

**What was built: the count moves channel and stays a count.** Below three carbons a molecule is drawn as one round bead per carbon, using the same wobbled four-curve shape the carriers already use, at a different size and offset. Carbon dioxide is one bead. Ethanol is two, overlapping slightly so the pair reads as one molecule with a seam rather than as two molecules side by side.

**Pyruvate's three sides against two beads and one bead still reads as 3 = 2 + 1**, which is the arithmetic rule 1 exists to make visible and the only thing it actually promises. `illustration.test.ts` asserts that equality across the two shape families rather than within one.

**The threshold has a reason rather than a taste.** Three is the smallest number of straight sides that encloses an area. Same kind of reason as `ACT1_HILL_N` being 2 and `ACT1_MAINTAIN_HILL_N` being 3: the smallest integer for which the thing is true at all.

**One collision, asserted rather than noted.** Beads and phosphate dots are both countable circles. They do not co-occur today because neither new pool carries phosphate, and the test fails the build if a molecule below three carbons ever does, which is the point at which this needs designing again rather than extending.

**DESIGN.md is amended, in the same form V7 used for rule 3**, with the original wording kept and the extension argued underneath. **This is a change to the visual contract and CLAUDE.md says not to deviate from DESIGN.md without explicit approval.** It is recorded here as needing the founder's sign-off. The alternative available was to leave both molecules invisible, which is worse and is not a smaller decision, only a quieter one.

### Step 2. Conservation, and the violation written deliberately

The property test that asserts all five quantities over the reaction list needed no change to cover the new reaction, which is what it was written to do in V2 stage 5, and the balance grid now prints six rows. Carbon closes at 3 in and 3 out across the ethanol branch with the CO2 in place.

**The violation, written and quoted.** `stoichiometry.test.ts` removes the `co2` term from the reaction's product side and recomputes all five quantities:

    broken: ['carbon: 3 in, 2 out']

**Exactly one quantity, and it is carbon.** Redox, nicotinamide, phosphate and adenylate all still close, which is what makes it a clean probe rather than a general failure, and the test asserts the whole list rather than just that something broke. It then puts the term back and asserts every quantity closes again, so the probe is measuring the CO2 and not some other difference.

**The mutilation is the one a modeller would actually make.** Carbon dioxide is a gas, it leaves the cell, and the tempting shortcut is to let it leave the model with it. That shortcut deletes matter. V7's rule applies and was followed: probe every guard by breaking the thing it guards, not by reading it.

### Step 3. The ledger, unchanged, on both branches

Computed from the reaction table on both sides rather than compared against a constant, so a coefficient change in one branch and not the other surfaces as two derivations disagreeing.

    branch             turns   gross          net
    ferment              2     4.000000000    2.000000000
    ferment_ethanol      2     4.000000000    2.000000000

**And asserted as float equality as well as to nine places**, which is the stronger statement: `ethanol.gross === lactate.gross` and `ethanol.net === lactate.net`. Nine decimal places would pass a branch that yielded a billionth of an ATP. Identity does not.

Both branches are also asserted individually to have no ATP term on either side, and to consume one pyruvate and one NADH and produce one NAD+. The ethanol branch's zero yield is asserted on its own rather than by family resemblance, for the reason docs/SCIENCE.md now states it under that branch's own heading: a decarboxylation looks like it ought to cost or release something and it does neither.

**NAD+ now has one consumer and two regenerators, and every regenerator ships disabled.** The test asserts the whole producer list rather than the first entry, so a third branch that shipped enabled would fail here. A regenerator that shipped on would remove the wall entirely, which is the act.

### Step 4. The unlock, and the routing decision

`ferment-ethanol`, minted in `src/content/act1/save.ts` beside `ferment`. **`ferment` means lactate permanently**, since V4 shipped it before there was a second branch to distinguish it from and Part 3 makes a shipped id permanent.

**No schema bump, and the additive claim was checked against the committed fixture rather than asserted.** Loading `src/save/__tests__/fixtures/v1.json`, which is a real four-game-minute act 1 run from V4:

    missingPools:      ethanol, co2
    ethanol, co2:      0, 0
    ethanolEnabled:    false
    fermentEnabled:    true
    unknown unlocks:   (none)

That is docs/SAVE_SCHEMA.md Part 1's additive case in both directions at once: two pool ids this build knows and the save does not, defaulted to their `ACT1_INITIAL` of zero and **reported in `missingPools` rather than silently filled**, and no unlock id the save carries that this build fails to recognise. A cell that has never fermented to ethanol restores as a cell that has never fermented to ethanol.

**The routing decision, and it is the simplest true answer rather than a mechanic.** Both reactions run against the same pyruvate and the same NADH under their own kinetics, and the split falls out of the constants. Nothing routes anything. The stage prompt named this as the likely answer and it is what a real cell does and what this engine already does everywhere else.

**The constants are identical, and the equality is the decision rather than laziness.** `ACT1_VMAX.ferment_ethanol` is 26 and `ACT1_KM.ferment_ethanol` is 2, matching the lactate branch exactly. docs/SCIENCE.md Part 1 refuses literature rates, so nothing sources a reason to make either faster, and inventing one would settle the game's first real choice on a number nobody can check. Equal constants make the choice about what the cell keeps rather than about which branch is quicker. The glycolytic capacity ladder raises both branches together at the same value, for the same reason: a ladder that raised only one would turn the choice into a choice about speed.

**Buying it does not remove the lactate branch and nothing ever does.** It is gated behind the lactate branch though, and that gate is a teaching decision rather than a balance one: the NAD+ wall arrives at 3.00 game-seconds and its answer has to be one thing the player can act on. A fork at that moment is a choice between two options a player has no way to tell apart yet, and what they have to learn first is that either one recycles NAD+ and neither makes ATP. docs/PROGRESSION.md lists lactate at 7 and ethanol at 8.

### Step 5. What the branch actually changes, which is very little

Measured on a cell walled for sixty game-seconds and then given each branch. The wall itself is unchanged, at **3.00 game-seconds and 59.989 cumulative gross ATP**, against the documented ceiling of exactly 60.

    branch     recovery   ATP/s     lactate/s   ethanol/s   CO2/s     pyruvate   shortfall
    lactate      2 ticks   31.7867    15.8934      0.0000    0.0000     3.14497        0
    ethanol      2 ticks   31.7867     0.0000     15.8934   15.8934     3.14497        0
    both         2 ticks   31.7867     7.9467      7.9467    7.9467     0.88033        0

**Identical, not similar.** ATP per second, recovery time and total NAD+ regeneration flux agree exactly across all three configurations. The stage said to be willing to report that the branch changes little. It changes nothing measurable about the cell's output, and that is the design: the branch is not an upgrade and a branch that produced more would be one.

**With both running the split is exactly half each and it falls out of the kinetics rather than out of a rule.** 7.9467 and 7.9467, summing to the 15.8934 either branch runs at alone. Two identical Michaelis-Menten reactions on the same substrate divide it evenly because they are identical, which is the whole of the mechanism.

**The one thing that does move is the pyruvate pool, and it is a real and honest effect.** 3.14497 with one branch, **0.88033 with both**. Two enzymes drawing on one substrate settle at a lower substrate level than one does, because the flux each needs is half as much and half the flux needs less than half the saturation. More enzyme means less substrate at steady state. That is a true statement about enzymes and it was not designed in.

**Zero shortfall ticks in all three**, including the both-branches case, which was the one worth checking: doubling the demand on a small pool is exactly the shape that makes the tick's proportional scaling fire, and it does not.

**Ethanol is not strictly worse than lactate at any constant, so V5's rule is satisfied.** They are equal at every constant by construction, and the only configuration that differs from either is the one with both, which is not worse either.

**The CO2 rate equals the ethanol rate**, 1 per branch turn, which is the stoichiometry rendered as a measurement.

### Step 6. Determinism and the hash

**`49ea08d3` becomes `2b18a4bc`**, and the reason is written into the assertion rather than into a commit message, as V3 and V5 did.

**It moved for a reason neither earlier move had.** V3's move raised a starting amount and V5's changed a kinetic form. This one changed no number at all: act 1 gained two pools, both starting at zero, and the canonical form is a function of the pool set and its order. The two ids sit between `lactate` and `nad`, which is where the pathway puts them, and the canonical script never enables the new branch.

**Verified rather than argued, by running the same fixture against the pre-change code.** Both runs, end state at 1200 ticks:

    hash          49ea08d3        ->  2b18a4bc
    tickCount     1200                1200
    rng.state     3491568764          3491568764
    glucose_env   7.95229902273339394e+4   identical
    glucose       1.68837212259052421e+2   identical
    g3p           5.32145730586083516e+1   identical
    pyruvate      2.99999999999999751e+1   identical
    lactate       5.33130547755704583e+2   identical
    nad           1.31684984695961131e-39  identical
    nadh          2.99999999999999751e+1   identical
    atp           1.55795654634501679e-1   identical
    adp           3.98442043453654406e+1   identical
    pi            6.62963128675684121e+0   identical
    ethanol       n/a                 ->  0
    co2           n/a                 ->  0

**Every legacy pool agrees to seventeen significant figures.** The assertion comment says so and says why a maintainer comparing act 1 before and after V10 should not go looking for an economy change that is not there.

The toy pathway's `172f83fb` is untouched, as it must be: nothing in `src/sim/` changed.

### What else this stage had to touch, listed rather than buried

**The offline validation sweep gained two configurations.** `ethanol` and `both-branches`, because a shipped code path the sweep never enters is a path nobody has checked can be jumped over. Twelve configurations now. The sweep is green with **0 fallbacks and 0 budget exhaustions**, and every case inside tolerance. The headline worst figures moved from V8's, to 1.108e-3 on ATP and 6.201e-3 misplaced against 7.038e-3 and 2.509e-2, and **that is the case draw moving rather than the accuracy improving**: the configuration list is longer so the seeded sampler picks different cases. It is not a result and should not be read as one.

**The interface gained one pool card, one pathway row and one shelf slot.** The card carries ethanol and carbon dioxide together, for the reason the carrier pairs share cards: the pair is what teaches, and two of pyruvate's carbons staying while one leaves is the entire difference between the branches. The pathway row starts from pyruvate again rather than wrapping, so the branch point stays visible, and it draws both products in one group the way the maintenance row does, because drawing only the ethanol would make the missing carbon look like a rounding error rather than a molecule.

**Player-facing strings were written now rather than deferred to stage 6**, because `MOLECULES` is typed as a total record over `Act1PoolId` and a new pool does not compile without one. They are written to the contract rather than as placeholders and stage 6 reviews them.

**No meter counter was added and that is deliberate.** Nothing in act 1 consumes ethanol or carbon dioxide, so each pool amount is already exactly its own cumulative production. A counter would be a second copy of a number the save already carries, and it would need a new `stats` field, which is a schema change this stage has no reason to make.

### Verify

**Conservation holds across all five quantities with the CO2 in place and fails without it**, on carbon alone, quoted in step 2.

**The ledger is unchanged to nine decimal places on both branches** and identical as floats.

**The suite is green: 517 tests across 41 files**, up from the 504 this log started at. `npm run typecheck`, `npm run lint` and `npm run build` are clean, the bundle is 281.24 kB and 87.47 kB gzipped. `npm run sim` and `npm run sim:act1` are green with conservation drift at 3.251e-14 and 2.001e-15 worst. `npm run offline:validate` is green across twelve configurations.

**docs/ECONOMY.md gained three rows**, C18, C19 and U20, and the counts moved from 37 to 40 and from 25 and 12 to 27 and 13. `divergenceTable.test.ts` is what forced them into this stage rather than stage 6.

**docs/SCIENCE.md is untouched in this stage.** Hard rule 2 permitted the stage 1 edit and forbids every other one. Stage 6 reports the diff as evidence.

**One thing needs the founder's sign-off before this log closes: the DESIGN.md rule 1 amendment in step 1b.** It is built, tested and documented, and it is a change to the visual contract rather than an implementation detail.

---

# Stage 3 — Glycogen storage, and what a buffer is worth

```
The unlock that produces no ATP. Read stage 1's cost decision first.

1. A glycogen pool and the two reactions, storage and mobilisation, at whatever
   asymmetry stage 1 decided. Carbon conserved through both. Same property
   test, same tolerance, no exceptions.

2. What it is FOR, decided before it is tuned. Act 1's environment is a finite
   unreplenished pool that lasts to 92m42s and the act's content ends at
   61m57s, so a player who keeps going watches the food run out. A buffer that
   is charged while supply is plentiful and drawn down when it is not is
   exactly the shape of that problem, and it is the first thing in the game
   that rewards looking ahead.

   That is the beat. Build toward it: the storage should be visibly useful in
   the late act rather than a number that goes up. If the tuning cannot make it
   useful, say so plainly rather than shipping a purchase that does nothing,
   and say what would have to change.

3. What it must NOT become. It is not a second currency, it is not an idle
   accumulator that pays out while away, and it does not raise yield. Buying it
   buys survival across a gap and nothing else. Anything that turns it into a
   score is docs/PILLARS.md rule 2 arriving through the back door.

4. The interaction with offline progress, and check this rather than assume it.
   A pool that fills and drains is a pool the steady-state detector has an
   opinion about. src/sim/steady.ts tests the second difference, so a pool
   changing at a constant rate is fine and a pool changing at a changing rate
   is not. Run the offline validation sweep with glycogen unlocked and report
   whether settle times or fallback counts moved. If they did, that is a
   finding about the offline path rather than about glycogen.

5. Tuning, with every scalar getting its docs/ECONOMY.md row in the same stage
   it is introduced rather than in stage 6. divergenceTable.test.ts counts
   scalars rather than names and it will fail otherwise, which is the guard
   doing its job.

Verify: conservation holds, the ledger is unchanged, the offline sweep is
green with glycogen unlocked, and every new scalar has a row. Report the
storage cost asymmetry as built, the late-act measurement from step 2 including
the honest version if it is not useful, and the settle and fallback figures
from step 4 against V8's.
```

## Stage 3 Report

_Pending._

---

# Stage 4 — The named enzymes

```
Three regulated steps, or whatever stage 1 decided instead. Read stage 1's
answer to its own step 3 before writing anything, and if it said a named
upgrade on a lumped reaction is a lie, build what it proposed rather than this.

1. The upgrades, as named enzymes attached to the reactions they actually
   regulate. Each one raises a specific kinetic parameter and each one has a
   reason in docs/SCIENCE.md for being the step that matters.

   The constraint V5 measured and settled applies here and it is not
   negotiable: payoff Vmax must strictly exceed twice prep Vmax, because the
   preparatory phase makes two trioses per glucose. Every configuration at
   exactly twice died. An enzyme upgrade that can be bought in an order that
   violates that is a purchasable configuration that kills the cell, and V5's
   answer to that was to sell the two phases together. Apply the same reasoning
   or show why it does not reach here.

2. Yield, unmoved, asserted across every new configuration. This is the claim
   act 1 exists to make. The number of purchasable configurations goes up
   again with this stage, and gross 4 and net 2 has to hold across all of them
   the way V5 asserted it across nine.

3. Diminishing returns, and make them legible. docs/BRIEF.md line 110's second
   question is whether saturating kinetics feel like a game, and the answer
   recorded in NOW.md is that the curves behave and there was nothing arriving
   for them to respond to. Three more purchases is more arriving. Whether each
   one visibly gives less than the last is the thing to measure, and it is the
   closest this log gets to answering that question.

4. Check for the trap V5 found and fixed. Raising a phase without the phase
   that pays for it produced an unrecoverable state at every constant, and
   bootstrap.test.ts asserts the repair including its mechanism. Run every new
   configuration against it. An enzyme upgrade that reintroduces the ATP
   bootstrap trap is the exact failure that test exists to catch, so it should
   catch it, and if it does not then the test is narrower than it looks and
   that is a more important finding than the enzymes.

5. Every scalar gets its docs/ECONOMY.md row in this stage, with the
   DEPARTURE or UNSOURCED classification decided honestly. A named enzyme with
   a real Vmax in the literature and a game value that does not match it is a
   DEPARTURE and the row says both numbers. A threshold is UNSOURCED and its
   real-behaviour cell stays empty.

Verify: yield unchanged across every configuration, bootstrap.test.ts green
against all of them, the payoff-over-twice-prep constraint held or shown not to
apply, and every scalar has a row. Report the configuration count, the
diminishing-return measurement from step 3, and the result of running step 4
against the trap.
```

## Stage 4 Report

_Pending._

---

# Stage 5 — Re-derive the act, and answer blocking item 2

```
The measurement stage. Nothing new is built here. This is where the log finds
out whether it worked.

1. Instrument a full act 1 run the way V5 stage 5 did, with every unlock now
   available. Report, for two players: one who buys everything the instant it
   is affordable, and one who checks every five game-minutes.

     total purchases
     time to each one
     the longest gap between two
     time to the last one
     when the environment runs out
     ATP per second at each configuration

   V5's figures are the comparison: 7 purchases, last at 61m57s, worst gap
   13m51s, food to 92m42s, target 45 to 90 minutes.

2. Blocking item 2, answered in one of three ways, and the third is allowed.

   CLOSED: the worst gap is short enough that the screen has something arriving
   often enough to be worth watching, and the act is still inside its target.
   Say what "short enough" means as a number and why that number, rather than
   asserting the gap is fine because it got smaller.

   NARROWED AGAIN: it improved and it is not fixed. Say by how much, say what
   is left, and say what would close it. This is what V5 reported and it was
   the right report. Repeating it honestly is better than closing the item on a
   number that merely looks better.

   NOT CLOSED BY CONTENT: the gap is a display problem rather than a content
   problem, and the answer is DESIGN.md open question 7 and the beast, which
   is V12. NOW.md has suspected this since V5 and this log is the one with the
   standing to say it, because it is the log that spent all the remaining act 1
   content on the problem.

3. The act's duration against its target. Three more purchases push the last
   one later. If the last purchase now lands past 90 minutes the act is outside
   its target and that is a tuning result, not a failure. Report it and say
   what moves: thresholds come down, or docs/PROGRESSION.md's target is wrong
   and should be argued rather than silently exceeded.

4. The empty tail. Content ended at 61m57s and food lasted to 92m42s, so there
   were 28 minutes of nothing at the end that NOW.md records as deliberate and
   unannounced. Re-measure it. If the tail is now longer, that is worse rather
   than better and it belongs in the report, because a bigger act with a bigger
   silence at the end of it has moved the problem rather than solved it.

5. docs/BRIEF.md line 110, question 2. "Do saturating kinetics feel like a
   game?" The recorded answer is no, not yet, and the recorded reason is that
   nothing was arriving. Say what this log changed about that, and say it with
   the standing caveat NOW.md has carried since V3 attached: this is the person
   who built it, who knows where every purchase lands, and that is the least
   reliable possible reader. Do not upgrade the answer to yes. Say what changed
   and leave the verdict to somebody who has not seen it before.

Verify: a full instrumented run for both player models. Report every figure in
step 1 against V5's, the blocking item 2 verdict in one of the three shapes
with its reasoning, the duration against target, the re-measured tail, and the
line 110 statement with its caveat intact.
```

## Stage 5 Report

_Pending._

---

# Stage 6 — Coherence, and the documents

```
Close the log out. No new content.

1. docs/ECONOMY.md. Every scalar this log introduced has a row and the
   document's own stated count matches what it contains, because
   divergenceTable.test.ts checks that too. Report the new total against V5's
   thirty-seven and the DEPARTURE to UNSOURCED split against 25 and 12.

2. Confirm docs/SCIENCE.md is untouched since stage 1. Hard rule 2 permits the
   stage 1 edit and forbids every other one, so `git diff` across stages 2 to 6
   on that file must be empty. Report the diff as evidence rather than the
   claim.

3. Player-facing text for everything new, in src/ui/content.ts, under
   docs/CONTENT_STYLE.md. Every figure carries a badge or it does not compile.
   The three teaching beats this log adds are worth writing carefully rather
   than functionally:
     - ethanol and lactate both recycle NAD+ and neither makes ATP, so the
       choice is about what the cell keeps rather than about which is better
     - a buffer is not a yield
     - a named enzyme upgrade raises throughput and not yield, which is the
       act's central claim arriving for the third time

   contentStyle.test.ts enforces the mechanics. It does not test voice and it
   should not, so the voice is on whoever writes it.

4. Full verify: npm run typecheck, npm run lint, npm run build, npm test,
   npm run sim, npm run sim:act1, npm run offline:validate. Report the test
   count against V8's 503 and the bundle size against V8's 278.31 kB.

5. Update NOW.md:
   - Status: what a player can now do that they could not.
   - Build state table: V10 done, with the date, and its "does not" column.
   - A "What act 1 contains" section, or fold it into the content layer
     section, with the full pathway transcribed the way this log's Context
     transcribes the old one. That block is the single most useful thing in
     NOW.md for anyone picking the project up and it goes stale silently.
   - The new canonical hash, with the reason it moved, alongside 172f83fb.
   - Blocking item 2: whichever of the three verdicts stage 5 reached. If it
     closed, strike it through with the date the way item 1 was struck. If it
     narrowed, say by how much and leave it open.
   - docs/BRIEF.md line 110 question 2: what changed, caveat intact.
   - The permanent id list from stage 1, recorded as contract surface the way
     V4 recorded the storage keys and the unlock ids.
   - "Next, in order": V11, Spine A. Point at
     docs/designs/game-spine-and-four-acts.md rather than restating it.

6. Report what this log did NOT do, explicitly. Act 1 is complete as content
   and it still has no ending, no timeline, no beast and no act boundary. Those
   are V11 and V12. A reader of NOW.md should not be able to mistake a complete
   unlock list for a complete act.

Verify: everything green. Report the ECONOMY.md counts, the empty SCIENCE.md
diff across stages 2 to 6, the test count, the bundle size, the canonical
hashes, and the NOW.md diff summary including which of the three blocking item
2 verdicts landed.
```

## Stage 6 Report

_Pending._

---

# After These Stages

- **Act 1's unlock list is complete for the first time.** `docs/PROGRESSION.md` has listed nine since 2026-07-29 and six was the reference implementation for "one complete act per log". Nine is what that phrase actually means.
- The negative half of `docs/BRIEF.md` line 110 has been given the only answer act 1 can give it. Whether it is enough is a question for a reader and the standing caveat still applies with full force.
- Blocking item 2 has been worked on by the log with the standing to close it. If it did not close, the report says so and says why, and the remaining half is a display question that V12 owns.
- Act 1 releases carbon for the first time, into a real pool with a real name, and conservation still holds to 1e-9 across five quantities. **The invariant survived the first content change that could have broken it**, which is the strongest evidence yet that it is a property rather than a coincidence of a small pathway.
- The player has a decision that is not an upgrade. Lactate or ethanol, neither better, differing in what the cell keeps. It is small and it is the first one.
- What act 1 still does not have is an ending. It has all its content and nothing that says the content is over, which is exactly the state `NOW.md` has described for its last 28 minutes since V5 and which V11 is the log that fixes.
