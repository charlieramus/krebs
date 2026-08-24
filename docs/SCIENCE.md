# Science

Last updated: 2026-08-24

Biological ground truth for the project. Every quantitative claim in player-facing text traces back to this document.

This doc contains no game numbers. It describes reality. Tuned values live in docs/ECONOMY.md, and every place the game departs from what is written here gets recorded in the divergence table in that file.

Stability note: this document changes only when the underlying science changes or an error is found. It does not get edited during balance passes. If a balance pass wants a different number, that number goes in docs/ECONOMY.md with a divergence entry.

---

# Part 1: Modeling methodology and disclosed simplifications

Read this before using any number below. It is the honesty layer of the project and it belongs in player-facing text too, not just in the repo.

## Kinetics: the chosen middle path

Three options were considered.

Full mechanistic modeling would use literature Km and Vmax values from BRENDA for every enzyme, with correct cooperativity, competitive and allosteric terms. This is rejected. Real kinetic parameters vary by organism, tissue, pH, temperature and assay method, often by an order of magnitude across sources for the same enzyme. Presenting one value as authoritative would be less honest than not using literature values at all.

Arbitrary exponential curves are also rejected. That is standard idle-game practice and it teaches nothing.

The chosen approach is saturating kinetics in the Michaelis-Menten functional form with tuned parameters. Flux follows:

    v = Vmax * [S] / (Km + [S])

The shape of this curve is real and is the single most important quantitative intuition in enzymology: enzyme output saturates, so doubling substrate does not double product once you are past Km. Players will feel diminishing returns as a physical property of enzymes rather than as a game designer's throttle, which is the correct lesson.

The specific Km and Vmax values are chosen for pacing. They are not literature values and the game must never imply they are.

Cooperative enzymes use the Hill form with n greater than 1 to produce the sigmoidal response:

    v = Vmax * [S]^n / (K^n + [S]^n)

PFK-1 is the one enzyme where this matters enough to model explicitly, because its sigmoidal response is the basis of glycolytic regulation.

## Required disclosure text

The following must appear in-game, in the about screen and on first launch, not buried in a repo file:

> Reaction rates in this game use the Michaelis-Menten saturation curve, which is real. The specific speed and saturation values are tuned for playability and are not measured laboratory values. Stoichiometry, ATP yields, pathway order and enzyme names are accurate and sourced. Rates are not. Do not use this game as a reference for experimental work.

## What is accurate

Stoichiometry. Molecule counts in and out of every reaction are correct.

ATP yields per pathway, within the ranges given below and with the uncertainty stated.

Pathway topology. Reaction order, branch points and which compartment each step occurs in.

Enzyme names and their actual catalytic function.

Regulatory relationships. What inhibits what, and what activates what.

Historical sequence. The order of evolutionary events, with dates given as ranges.

## What is simplified

Time compression. Real cells complete glycolysis in milliseconds. Game time is arbitrary and does not map to any real timescale.

Concentrations are abstracted to pools rather than modeled as molar concentrations in a defined volume.

Spatial structure is ignored. No diffusion, no metabolic channeling, no substrate tunneling between enzyme active sites.

Water, protons and phosphate are mostly implicit rather than tracked as resources.

Steady-state assumption. The simulation does not model transient dynamics on reaction timescales.

Single-substrate framing. Most reactions modeled below actually involve multiple substrates and cofactors.

## What is deliberately wrong and why

Each entry needs the real value, the game value and the reason. Cross-referenced with the divergence table in docs/ECONOMY.md once that document exists.

Note on what this section is. CLAUDE.md hard rule 2 forbids editing this document during a balance pass, because a balance pass that rewrites its own ground truth is not a balance pass. The four entries below are not balance decisions. They are structural modeling choices that were already made in code and were sitting undisclosed, and disclosing them is what Part 1 exists for. No tuned number appears below. When tuned numbers arrive they go in docs/ECONOMY.md with a divergence row and this section gains a pointer, not a value.

### Multi-substrate reactions take the minimum of their saturation terms

Added 2026-07-29, disclosing a choice made in V1.

Real: multi-substrate enzymes follow ordered or random bi-bi mechanisms. Their rate laws are derived from the mechanism and are neither the minimum nor the product of single-substrate Michaelis-Menten terms.

Game: flux is Vmax times the smallest of the reaction's per-substrate saturation terms. Every other substrate is ignored once the limiting one is identified.

Reason: it makes the bottleneck a single nameable pool. The player points at NAD+ and says that is what is stopping it, which is the whole lesson of act 1. Taking the product instead would spread the constraint across every substrate simultaneously and the NAD+ wall would read as a general slowdown rather than as one specific empty pool. The simplification is visible to the player as a sharper corner in the response curve than a real enzyme would have.

### One Km per reaction, shared across all of its substrates

Added 2026-07-29, disclosing a choice made in V1. It rides along with the entry above.

Real: an enzyme has a separate Km for each substrate, and they commonly differ by orders of magnitude. A reaction saturating in one substrate at micromolar levels may still be far from saturated in another at millimolar levels.

Game: one kinetics descriptor per reaction, holding one Km, applied to whichever substrate turns out to be limiting.

Reason: the honest alternative is a per-substrate parameter set, which multiplies the number of tuned values by the substrate count and makes the divergence table unreadable, for a distinction the player cannot see. It is an economy of description rather than a pacing choice. Combined with the entry above, this means a reaction's response curve is a single shape evaluated against whichever pool is scarcest.

### Redox is counted as electron pairs relative to the fully fermented state

Added 2026-07-29 for the act 1 content layer.

Real: oxidation state is a property of individual atoms and there is no single scalar "redox content" of a molecule. Electron bookkeeping in metabolism is done per reaction, in specified carriers, not as a conserved quantity of the whole system.

Game: `redox` is a conserved quantity with an integer weight per pool, counting electron pairs against a zero point set at the fully fermented state. Glucose carries 2, lactate carries 1, NADH carries 1 and NAD+ carries 0. Glucose to 2 lactate is therefore redox neutral, and glucose to 2 pyruvate plus 2 NADH balances.

Reason: it turns the NAD+ constraint into a conservation law the engine can test rather than a behaviour the designer has to remember to preserve. If a future reaction manufactures or destroys reducing power by accident, the conservation test fails on the first tick instead of the imbalance showing up hours later as a broken economy. The zero point is a convention chosen because it makes the act 1 numbers small integers, not because the fully fermented state is physically privileged.

### Glucose uptake is modeled as untyped transport

Added 2026-07-29 for the act 1 content layer.

Real: bacteria import glucose by specific mechanisms with specific costs. The phosphotransferase system, which is the common route in many bacteria and plausible for an organism of this period, phosphorylates glucose during transport at the cost of one phosphoenolpyruvate, which is itself a glycolytic intermediate. Other organisms use ATP-driven or gradient-driven transporters with different costs.

Game: glucose moves from an environmental pool to an intracellular pool with no transporter named and no energetic cost charged.

Reason: this document does not cover the mechanism, so naming a transporter would be asserting something unsourced, and charging a PEP cost would change the act 1 ATP ledger away from the sourced net of 2 per glucose. The cost is set to zero and disclosed rather than guessed. If a transporter is sourced later, this entry becomes a real divergence row with a real number.

---

# Part 2: Act 1 science, substrate-level phosphorylation

## Glycolysis

Location: cytosol. No oxygen required. Present in nearly all known organisms, which is the main evidence for its very early origin.

Ten enzymatic steps, conventionally split into two phases.

Preparatory phase, steps 1 to 5. The cell spends 2 ATP to phosphorylate glucose and destabilize it. Glucose becomes glucose-6-phosphate via hexokinase, isomerizes to fructose-6-phosphate, then is phosphorylated again by phosphofructokinase-1 to fructose-1,6-bisphosphate, which is cleaved into two three-carbon molecules.

Payoff phase, steps 6 to 10. Each three-carbon fragment yields 2 ATP and 1 NADH. Two fragments per glucose, so 4 ATP and 2 NADH gross.

Net per glucose:
- 2 ATP
- 2 NADH
- 2 pyruvate

The 2 ATP figure is net of the 2 ATP investment. This is worth surfacing in-game because the gross figure of 4 is a common point of confusion.

## Regulation

Phosphofructokinase-1 is the primary control point and the committed step of the pathway. It is allosterically inhibited by ATP and citrate and activated by AMP and fructose-2,6-bisphosphate. The logic is direct: high ATP means the cell does not need more, and citrate signals that downstream capacity is already saturated.

PFK-1 shows cooperative sigmoidal kinetics, not hyperbolic. This is why the Hill form is used for this one enzyme.

Hexokinase is inhibited by its own product, glucose-6-phosphate. Pyruvate kinase is the third regulated step.

Hexokinase is also the enzyme whose defining property is affinity rather than speed. It has a low Km for glucose and works at close to saturation at ordinary intracellular concentrations, which is what lets a cell commit glucose to glycolysis as soon as it arrives. The liver isozyme glucokinase does the same chemistry with a Km roughly two orders of magnitude higher and therefore responds to glucose level rather than ignoring it, which is the textbook demonstration that the same reaction with a different Km is a different regulatory device.

### Flux control is distributed, and the three regulated steps are where it concentrates

Added 2026-08-06, for act 1's fifth unlock.

Hexokinase, phosphofructokinase-1 and pyruvate kinase are the three regulated steps of glycolysis and they are the three named above. Each catalyses a reaction held far from equilibrium in the cell, which is what makes a step controllable at all. The other seven run near equilibrium and follow their substrates, so raising one of those raises nothing.

The honest qualification is that control is shared rather than owned. Metabolic control analysis measures how much a pathway's flux responds to a change in one enzyme's activity and expresses it as a control coefficient, and the coefficients over a pathway sum to one. For glycolysis the result is that no single enzyme holds all of it and the distribution shifts with conditions and with organism. "PFK-1 is the rate-limiting step" is a useful shorthand for where control concentrates. It is not a statement that raising PFK-1 alone raises flux by the same factor.

What this licenses and what it does not. It licenses a model that sells these three steps and not the other seven, because these are where control sits. It does not license a claim that any one of them is the whole bottleneck, so a model that raises a phase's capacity when a named enzyme is improved is attributing the phase's response to one of its steps and should say so. It says nothing at all about yield: no change to any rate anywhere in the ten steps produces more than 4 ATP gross per glucose, because the yield is fixed by the stoichiometry.

## The NAD+ constraint

Glycolysis reduces NAD+ to NADH at step 6. The cellular NAD+ pool is small and fixed. If NADH is not reoxidized back to NAD+, glycolysis halts within seconds regardless of glucose availability.

This is the single most important mechanic in act 1 and it is a genuine cellular constraint rather than a game invention.

## Fermentation

Fermentation exists to regenerate NAD+. It produces zero additional ATP. Framing it as an energy pathway is a common misconception and the game should correct it directly.

Both branches below give a net of 2 ATP per glucose overall, which is the act 1 ceiling. Neither branch contributes any of it. The 2 ATP come from the payoff phase and would be there without any fermentation at all, for exactly as long as the NAD+ pool lasted.

### Lactate fermentation

One step. Lactate dehydrogenase reduces pyruvate to lactate, oxidizing NADH back to NAD+.

    pyruvate + NADH + H+  ->  lactate + NAD+

Three carbons in, three carbons out. Nothing leaves the cell as a gas. The reducing power taken off NADH stays in the lactate, which is why lactate is a dead end the cell excretes rather than a product it has finished with.

### Ethanol fermentation

Expanded 2026-08-06. This section was one sentence. It named the two enzymes and the carbon dioxide correctly and said nothing about stoichiometry, yield, redox or which organisms do it, which is not enough to build a pathway from. Everything the old sentence carried is retained below.

Two steps.

    pyruvate  ->  acetaldehyde + CO2                  pyruvate decarboxylase
    acetaldehyde + NADH + H+  ->  ethanol + NAD+      alcohol dehydrogenase

Pyruvate decarboxylase is thiamine pyrophosphate dependent and it is the step that releases carbon dioxide. Alcohol dehydrogenase is the step that reoxidizes NADH, and it is the only one of the two that touches the carrier at all. The branch runs once per pyruvate and twice per glucose, giving 2 ethanol and 2 CO2.

Yield. Zero ATP, exactly as for lactate. That claim has to be made for this branch on its own rather than inherited from the section heading, because a decarboxylation looks like it ought to cost or release something and it does neither.

Redox. One NADH consumed per pyruvate, which is the same as the lactate branch, so a cell running either branch at the rate its payoff phase makes NADH holds its carrier pool steady. **The two branches are interchangeable as NAD+ regenerators and interchangeable in nothing else.** What differs is what the cell is left holding: three carbons of lactate, or two carbons of ethanol and one carbon released as gas.

Which organisms. The textbook example is Saccharomyces cerevisiae, which is a eukaryote and therefore the wrong organism for act 1. The route is genuinely present in bacteria and it is uncommon there. Zymomonas mobilis is the best characterized bacterial case and this document already cites it in Part 3 for its two alcohol dehydrogenases; it does ferment to ethanol through pyruvate decarboxylase and alcohol dehydrogenase, but it runs the Entner-Doudoroff pathway rather than glycolysis and so nets 1 ATP per glucose rather than 2. Sarcina ventriculi is the closer precedent for act 1, being a Gram-positive anaerobe that runs glycolysis and carries a pyruvate decarboxylase.

Escherichia coli is the counterexample worth knowing, because it makes ethanol and does not make it this way. It has no pyruvate decarboxylase. Its fermentative route runs pyruvate through pyruvate formate-lyase to acetyl-CoA and formate, then through the bifunctional AdhE to ethanol, consuming two NADH per ethanol rather than one. Part 3 of this document already describes AdhE, for the unrelated reason that it is an oxidative-damage target. So the decarboxylase route is one of at least two ways a prokaryote reaches ethanol, and it is the one the two named enzymes belong to.

What a game claims by shipping this branch in an anaerobic prokaryote. That a prokaryote running glycolysis can ferment to ethanol by decarboxylation and reduction. That is true of the class and uncommon within it, in the same way that Part 3's oxygen-stable PFOR is a real exception to a real rule. It is not a claim that the organism is any named species, and the game names none.

## Carbon dioxide, and whether anything in this game consumes it

Added 2026-08-06, for the act 1 ethanol branch. This section exists because the ethanol branch is the first reaction in the game that takes a carbon off a molecule, and the model treats carbon as a conserved quantity.

The carbon does not go anywhere. Decarboxylation converts one carbon of pyruvate into carbon dioxide, which is a real molecule with that carbon still in it, and a cell that releases it has moved the carbon rather than destroyed it. A model in which it vanished would be wrong about chemistry rather than simplified about it.

Carbon dioxide is produced in three places across the four acts and consumed in one.

Produced. Ethanol fermentation, one per pyruvate, act 1. Pyruvate oxidation by the pyruvate dehydrogenase complex, one per pyruvate, act 3, Part 4 below. The TCA cycle, two per turn, act 3, Part 4 below.

Consumed. Pyruvate carboxylase, act 4. See Part 5, "Gluconeogenesis". It carboxylates pyruvate to oxaloacetate, spending 1 ATP and taking its carbon from bicarbonate rather than from dissolved CO2 directly, the two being interconvertible in water. Gluconeogenesis then releases that same carbon one step later at phosphoenolpyruvate carboxykinase, so the pathway as a whole is carbon dioxide neutral while one of its reactions is a consumer.

The same enzyme has a second use which is not neutral. Pyruvate carboxylase is the main anaplerotic reaction, topping the TCA cycle back up with oxaloacetate when intermediates are drawn off for biosynthesis, and used that way it is a net fixer of carbon dioxide. Part 4 already records that the cycle is amphibolic, and this is what that costs.

The consequence for the model is small and it has to be decided once rather than discovered later. **Carbon dioxide is a reservoir, not a sink.** Nothing in act 1 or act 2 draws it down and act 4 does, so a pool that a later act reads from cannot be treated as write-only accounting now, cannot be capped, and cannot be discarded to keep a number small.

## Glycogen, and what storage costs

Added 2026-08-06, for act 1's ninth unlock. Glycogen appeared nowhere in this document before this date.

Glycogen is a branched polymer of glucose, alpha-1,4 linked along the chain with alpha-1,6 branch points. It is the storage carbohydrate of animals and fungi and it is also widespread in bacteria and archaea, so it is available to an anaerobic prokaryote without special pleading.

**The route in and the route out are different pathways with different enzymes, and that asymmetry is the whole content of the entry.**

In, by the bacterial route. Glucose is phosphorylated to glucose-6-phosphate at a cost of 1 ATP, isomerized to glucose-1-phosphate by phosphoglucomutase at no cost, then activated by ADP-glucose pyrophosphorylase at a cost of 1 ATP, giving ADP-glucose and pyrophosphate. Glycogen synthase transfers the glucosyl unit onto a growing chain and a branching enzyme installs the alpha-1,6 branches. The pyrophosphate is hydrolysed, which is what makes the activation step effectively irreversible and is why it counts as a whole ATP equivalent rather than a fraction of one. **Two ATP equivalents per glucose unit stored.**

Out. Glycogen phosphorylase cleaves a terminal glucosyl unit using inorganic phosphate rather than water, releasing glucose-1-phosphate directly and spending no ATP at all. Phosphoglucomutase converts that to glucose-6-phosphate, which is glycolysis's own second intermediate, so the unit re-enters the pathway past the hexokinase step and never pays the phosphorylation cost a second time. A debranching enzyme releases a minority of units as free glucose, and those do pay it.

**Net cost of a full store and retrieve cycle is 1 ATP equivalent per glucose unit.** Two spent going in, one saved coming out. A glucose that went through storage therefore returns 1 net ATP through glycolysis where a glucose that did not returns 2. Storage is not free, it is not a yield, and it halves the return on every unit it handles. What it buys is the ability to keep running when there is nothing left to take up.

Eukaryotes use UDP-glucose in place of ADP-glucose. The activated donor differs and the accounting does not.

Regulation, and the futile cycle underneath it. Synthesis and degradation are reciprocally regulated so that they do not run hard at the same time, because a cell doing both stores and retrieves the same carbon and burns ATP for nothing. In bacteria the control point is ADP-glucose pyrophosphorylase, which is allosterically activated by glycolytic intermediates and inhibited by AMP, so storage switches on under the signal that glycolysis is well supplied. This is the same principle Part 5 records for glycolysis against gluconeogenesis. **The futile cycle is a real failure mode of a real cell rather than a modeling artifact, and the thing that suppresses it is allosteric regulation**, which is act 4's theme and not act 1's.

---

# Part 3: Act 2 science, the oxygen crisis

## The Great Oxidation Event

Oxygenic photosynthesis in cyanobacteria began producing free oxygen well before it accumulated in the atmosphere. Early oxygen was absorbed by chemical sinks, most significantly dissolved ferrous iron in the oceans, which precipitated as iron oxides and produced the banded iron formations found throughout Archean rock.

Atmospheric oxygen rose substantially around 2.4 to 2.45 billion years ago. Sources vary on whether to treat this as a relatively rapid event or a protracted transition spanning 2.4 to 2.0 billion years ago, and the game should give the range rather than a single date.

Correction, 2026-07-28. An earlier version of this document stated that banded iron formations largely disappear from the record after roughly 2.4 billion years ago. That is wrong. Deposition continues well past the GOE and iron formations do not largely disappear until roughly 1.85 to 1.8 billion years ago. See Part 6 for the corrected depositional window. The line of evidence that does mark the GOE is the disappearance of detrital uraninite and other redox-sensitive detrital minerals, together with the loss of mass-independent sulfur isotope fractionation, not the end of iron formation deposition.

A downstream consequence worth including as flavor: oxygen displaced atmospheric methane, a strong greenhouse gas, and the resulting cooling is associated with the Huronian glaciation. The oxygen catastrophe also triggered an ice age.

For most existing anaerobic life this was a mass extinction. The framing of oxygen as an obvious upgrade is backwards, and correcting that is the whole point of act 2.

## Reactive oxygen species

Molecular oxygen is not itself the primary danger. Partial reduction products are.

Superoxide, O2 with an extra electron, is produced when oxygen intercepts electrons from cellular reductants.

Hydrogen peroxide, H2O2, forms from superoxide.

Hydroxyl radical, the most destructive of the three, forms from hydrogen peroxide in the presence of ferrous iron through Fenton chemistry:

    Fe(II) + H2O2 -> Fe(III) + OH- + hydroxyl radical

There is no enzyme that detoxifies hydroxyl radical. It is too reactive. The only defense is preventing its formation, which is why iron sequestration is a real and necessary adaptation and why it belongs in the act 2 unlock list.

## Damage targets

Superoxide preferentially attacks solvent-exposed iron-sulfur clusters in enzymes. Aconitase, a TCA cycle enzyme, is the classic textbook target.

Aconitase is the wrong example for this game. It is a TCA enzyme and the player does not unlock the TCA cycle until act 3. The subsection below replaces it with targets the act 2 player actually owns.

## Damage targets the act 2 player actually has

This subsection exists because the general claim above, while correct, does not apply to an anaerobic fermenter running glycolysis. It was written after the act 2 unlock list was found to reference enzymes the player does not possess.

### Two damage mechanisms, not one

The single most important finding here, and the one that changes the act 2 design: reactive oxygen species and molecular oxygen are separate threats with separate targets, and antioxidant enzymes only address the first.

Superoxide and hydrogen peroxide disrupt growth primarily by inactivating two enzyme classes. The first is cluster-dependent dehydratases carrying solvent-exposed [4Fe-4S] centres. The second is non-redox mononuclear iron enzymes, which are poisoned by mismetallation rather than cluster destruction. A third class, radical SAM enzymes with over-oxidizable peripheral clusters, is an active hypothesis rather than settled.

Molecular oxygen itself inactivates a different set. In the model obligate anaerobe Bacteroides thetaiotaomicron, pyruvate:ferredoxin oxidoreductase and pyruvate:formate lyase both lose activity on aeration, and the rate of PFOR damage is unaffected by the level of superoxide or peroxide, establishing that oxygen itself is the agent. The cell cannot repair PFOR.

The design consequence is direct and it is better than what the current unlock list implies. Superoxide dismutase and catalase are useless against the second mechanism. An act 2 that models only ROS damage lets the player buy two enzymes and declare victory. An act 2 that models both makes the player discover that some damage cannot be defended against at all, only routed around by replacing the vulnerable enzyme with a different chemistry. That is the actual reason obligate anaerobes are obligate, and it is stated in the literature as such: the physiological role of PFOR and PFL is to dispose of pyruvate without disturbing redox balance, and they do it with catalytic mechanisms that are intrinsically vulnerable to oxygen. The anaerobic competence and the oxygen sensitivity are the same property.

### Iron-sulfur proteins an anaerobe of this period would have

Verified as present and oxygen-labile:

Pyruvate:ferredoxin oxidoreductase. Contains two [4Fe-4S] centres. Anaerobes rely on it for pyruvate decarboxylation where aerobes use the oxygen-stable pyruvate dehydrogenase complex. Irreversibly inactivated by molecular oxygen. Oxygen-stable variants exist and are uncommon, the Desulfovibrio africanus enzyme being the known exception, which is a good detail for the player-facing text because it shows the constraint is a tendency rather than a law.

Ferredoxin. Small [4Fe-4S] electron carrier, among the oldest protein folds known and present across all three domains. Relevant nuance for act 3 foreshadowing: the transition from anoxygenic to oxygenic photosynthesis involved replacing the [4Fe-4S] ferredoxin with an oxygen-tolerant [2Fe-2S] form, and aerobes generally shifted from ferredoxin-dependent to NAD(P)H-dependent chemistry because the latter is oxygen-insensitive.

[FeFe]-hydrogenases. The H-cluster is irreversibly inactivated on contact with dioxygen in most characterized enzymes. Partial reduction of bound oxygen generates ROS that destroy the cluster from the inside. Some enzymes have protective mechanisms, notably a cysteine safety cap in the Clostridium beijerinckii enzyme that reversibly switches the cluster to an inactive but oxygen-resistant state, so this is again a tendency with exceptions.

Iron-sulfur dehydratases. Fumarase A, aconitase A and B, dihydroxy-acid dehydratase and 6-phosphogluconate dehydratase all carry [4Fe-4S] clusters and all are superoxide-labile. Superoxide oxidizes the exposed cluster, which releases ferrous iron and eliminates activity. The resulting [3Fe-4S] cluster can be reactivated by reduction and remetallation, so this damage is repairable, unlike the oxygen attack on PFOR.

6-phosphogluconate dehydratase deserves specific attention. It is the committed enzyme of the Entner-Doudoroff pathway, which is an alternative sugar catabolism route widespread in bacteria, and it is one of the best characterized superoxide targets in the literature. It is markedly more sensitive to superoxide than to oxygen or peroxide. If the game gives the player an Entner-Doudoroff branch alongside glycolysis, this is a genuine iron-sulfur target sitting inside sugar catabolism rather than off in a pathway the player has not unlocked.

Not verified for this period and left out: specific serine dehydratases were listed as a candidate in the task brief. Some serine dehydratases are [4Fe-4S] enzymes and the class is real, but a citation establishing their oxygen lability at the level of detail used above was not found. Excluded rather than asserted.

### Glycolysis contains no iron-sulfur enzymes, and is not therefore safe

The claim is correct. None of the ten enzymes of the Embden-Meyerhof-Parnas pathway carries an iron-sulfur cluster. No source was found asserting otherwise.

The claim is also misleading, and this is the more useful finding.

Glyceraldehyde-3-phosphate dehydrogenase is among the most oxidant-sensitive enzymes in the cell. It carries a strictly conserved catalytic cysteine whose thiol reactivity toward hydrogen peroxide is higher than protein thiols generally, and oxidation of that residue inactivates the enzyme. The literature is direct about its standing: no other enzyme is as conspicuously oxidized by hydrogen peroxide as GAPDH. Pyruvate kinase is also oxidation-sensitive, by a less well characterized mechanism.

So the damage mechanism in glycolysis is thiol oxidation, not cluster destruction. Different chemistry, different defense, same outcome for the player.

The consequence is that the act 2 crisis has a target inside act 1's core loop after all, and it is precisely the step that produces NADH. That is a better outcome than the iron-sulfur framing the design started from.

There is a further payoff. GAPDH inactivation is not purely destructive. It functions as a redox switch: shutting down glycolytic flux reroutes carbon into the oxidative pentose phosphate pathway, which produces NADPH, which is the reducing power that the glutathione, glutaredoxin and thioredoxin systems run on. Cells expressing a redox-insensitive GAPDH retain catalytic activity but cannot mount that response.

This gives act 2 a mechanic that is real, non-obvious and pedagogically excellent. The pathway does not just break under stress. It reroutes, at the cost of ATP yield, to produce the reducing power that powers the defenses. The player trades energy for antioxidant capacity through a mechanism the cell actually uses.

### The pyruvate disposal chain is mechanistically sound

The task brief asked whether damaging pyruvate disposal blocks NAD+ regeneration and therefore stalls glycolysis upstream. It does, and the chain is documented at every link.

Glycolysis consumes NAD+ at the GAPDH step. The cellular pool is small and fixed, so flux stops unless NADH is reoxidized. In a fermenter, reoxidation happens at the terminal step of a fermentation branch, and every plausible terminal step in an anaerobe of this period is oxygen-vulnerable by one mechanism or another.

Ethanol fermentation. In E. coli the fermentative route runs through AdhE, a bifunctional iron-dependent enzyme that reduces acetyl-CoA to acetaldehyde and then to ethanol, consuming NADH at both steps. AdhE is inactivated by metal-catalyzed oxidation and is highly reactive with hydrogen peroxide, and it is one of the major targets identified when E. coli is subjected to peroxide stress. Replacing the catalytic iron with zinc prevents the reaction. The same pattern appears cleanly in Zymomonas mobilis, where shifting a culture from anaerobic to aerobic conditions inactivated the iron-containing ADH II by about eighty percent within four hours while the zinc-containing ADH I remained fully active.

That contrast is a gift for the game. Two enzymes doing the same chemistry, one with iron and one with zinc, and only one of them dies. Metal substitution as a defense is a real strategy, not an invented upgrade.

Pyruvate decarboxylation to acetyl-CoA. PFOR and PFL, both oxygen-inactivated as described above, both irreparable in the PFOR case.

Hydrogen disposal. [FeFe]-hydrogenases dissipate excess reducing equivalents by reducing protons to H2, coupled to reoxidation of ferredoxin or NAD(P)H. Irreversibly oxygen-inactivated in most characterized cases. Losing this route removes an electron sink and backs redox pressure up into the pathway.

So the chain holds in three independent forms, and the act 2 crisis lands back on the act 1 NAD+ constraint rather than sitting beside it. The player learns that the wall they spent act 1 working around is the same wall that oxygen attacks.

### Damage and repair timescales

Real numbers, useful for balance and for the divergence table when docs/ECONOMY.md is written.

In fully aerated E. coli the steady-state hydrogen peroxide level is estimated at 20 to 50 nM and superoxide at roughly 0.2 nM. Given reaction rates with dehydratase and mononuclear metal centres on the order of 10^4 and 10^6 per molar per second respectively, vulnerable enzymes are predicted to be damaged roughly every thirty minutes. Cluster reassembly proceeds with a half-time of about five minutes, and remetallation of mononuclear enzymes may be faster.

The ratio matters more than the absolute values. Repair is roughly six times faster than damage under normal aerobic conditions, which is why aerobes function at all. Act 2 should be tuned so that rising oxygen inverts that ratio, and the defensive unlocks restore it.

Note that these are E. coli numbers, a facultative aerobe with a full defensive toolkit. An anaerobe has worse ratios. Do not present these figures as applying to the act 2 organism.

### Additional defenses worth adding to the act 2 unlock list

The current list in docs/PROGRESSION.md is not wrong but it is incomplete, and the omissions are the mechanically interesting ones.

Manganese substitution. Replacing iron with manganese in mononuclear enzymes gives nearly the same activity without the tendency toward peroxide oxidation. E. coli activates manganese import under peroxide stress and lactic acid bacteria do it constitutively, accumulating millimolar intracellular manganese, which is a large part of why they tolerate the peroxide they themselves generate. This is a defense by substitution rather than by scavenging and it is a genuinely different mechanic.

Iron-sulfur cluster repair and the backup assembly system. Damaged clusters are repaired by reduction and iron redelivery. E. coli carries a secondary assembly system, Suf, induced under oxidative stress when the primary Isc system is itself peroxide-inactivated. A repair mechanic with its own failure mode is more interesting than a flat damage reduction.

Isozyme replacement. Where repair capacity is exceeded, the cell swaps the vulnerable enzyme for a version that does not use iron. Fumarase is the documented case. This maps onto the AdhE and ADH I contrast above and generalizes into a real strategic choice.

Dps. An iron-sequestering mini-ferritin induced under oxidative stress, which lowers free iron and therefore suppresses Fenton chemistry and DNA damage. This is the mechanistically correct version of the iron sequestration entry already in the unlock list.

## Defenses

Superoxide dismutase converts superoxide to hydrogen peroxide and oxygen. Note that its product is itself harmful, which is why it is useless without the next enzyme. This dependency is a good gating structure.

    2 superoxide + 2 H+ -> H2O2 + O2

Catalase converts hydrogen peroxide to water and oxygen.

    2 H2O2 -> 2 H2O + O2

Peroxiredoxins and the glutathione system provide additional peroxide handling at lower throughput and finer control.

Iron sequestration in storage proteins reduces the free iron available for Fenton chemistry.

Adaptation to oxidative stress was broad and not limited to these enzymes. Detoxification systems for redox-sensitive metalloids such as arsenic also expanded around the GOE, which is good optional content.

---

# Part 4: Act 3 science, endosymbiosis and aerobic respiration

## Origin of mitochondria

Mitochondria derive from an alphaproteobacterial endosymbiont. This is not seriously contested. The idea traces to Mereschkowsky and others in the early twentieth century, was revived and argued into the mainstream by Lynn Margulis in 1967 under her then-name Lynn Sagan, and was confirmed by ribosomal RNA phylogeny in the late 1970s.

Physical evidence: double membrane, own circular genome, bacterial-type 70S ribosomes, division by binary fission, cardiolipin in the inner membrane.

Endosymbiotic gene transfer moved the large majority of the endosymbiont genome to the host nucleus over time. The human mitochondrial genome retains only thirteen protein-coding genes. This is a strong mechanic for act 3 and it is real.

The host lineage is currently thought to be within or closely related to Asgard archaea, with Heimdallarchaeota most frequently recovered as the closest known relatives of eukaryotes.

## Contested: early or late mitochondria

Flag this in-game. It is a live disagreement as of 2026 and a good demonstration of how science actually works.

One position holds that mitochondrial endosymbiosis triggered eukaryotic cellular reorganization, so the mitochondrion came early and drove the rest. Recent phylogenomic work reconstructing the gene set of the last eukaryotic common ancestor supports Asgard archaea contributing the majority of core eukaryotic systems with alphaproteobacterial contribution concentrated in energy transformation and iron-sulfur cluster biogenesis, and reads this as consistent with mitochondria triggering the reorganization.

The competing position holds that the host was already structurally complex before endosymbiosis. Dated gene duplication analysis places an elaborated cytoskeleton, endomembrane system, phagocytotic machinery and nucleus at roughly 3.0 to 2.25 billion years ago with mitochondrial acquisition after that, explicitly rejecting mitochondrion-early scenarios.

The game presents the transition without committing to which came first, and says why.

Timing generally: the endosymbiosis is usually placed around two billion years ago, with wide error bars.

## Oxygen is the terminal electron acceptor, and every number in this part sits downstream of it

Added 2026-08-24, promoted rather than discovered. The claim was already in this document, four paragraphs into "Oxidative phosphorylation and chemiosmosis" below, and it is given its own section because it is the single fact the whole of act 3 rests on and a reader should not have to reach the middle of another section to find it.

Oxygen accepts the spent electrons at the end of the chain and is reduced to water at complex IV. That is its only role. It is not a substrate of the TCA cycle, it is not consumed by ATP synthase, and it contributes no atom to ATP.

What follows from that is a dependency rather than a detail. Without a terminal acceptor the chain backs up, the quinone pool stays reduced, no complex pumps, the matrix NADH pool cannot be reoxidised, and pyruvate oxidation and the TCA cycle stop behind it for the same reason glycolysis stops behind an unreoxidised cytosolic NADH pool in act 1. **It is the NAD+ wall again, one compartment inward.** That symmetry is real and it is the best thing this act inherits from the first one.

The consequence for the project is stated here because it is a fact about biology rather than a fact about a build. **Aerobic respiration cannot be modelled at all at an environmental oxygen level of zero, and the process that raises that level is act 2's.** See Part 3, "The Great Oxidation Event".

## Pyruvate transport into the matrix

Added 2026-08-24. Absent from this document before that date, which was a gap rather than a disclosed simplification: it is the first step of act 3 and the first thing the new compartment does.

Two membranes, two mechanisms, and only the second one is a barrier.

The outer mitochondrial membrane carries porins, non-selective channels that pass metabolites up to roughly 5 kDa. Pyruvate crosses it with no dedicated carrier and no cost, which is why the intermembrane space is often described as continuous with the cytosol for small molecules.

The inner membrane is the real boundary. It is impermeable to ions and to nearly every metabolite, and that impermeability is the property the whole of chemiosmosis rests on: a gradient can only exist across a membrane that leaks slowly. Pyruvate crosses it on the mitochondrial pyruvate carrier, whose molecular identity was open for roughly forty years after the transport activity was characterised and was settled in 2012 by two groups independently, as a heterocomplex of the proteins MPC1 and MPC2.

**The carrier is a proton symport.** One pyruvate enters with one proton, moving down the gradient the electron transport chain is building.

That fact is worth more to this game than its share of the biochemistry, and it is the reason this section exists rather than being folded into the one below. The first unlock of act 3 spends the proton gradient at a point in the act where the player has no way to make one. The cost is not an invention and it is not a balance decision: it falls out of the stoichiometry of a real carrier.

## Pyruvate oxidation

Expanded 2026-08-24. This section was four lines. The stoichiometry it gave was correct and is retained unchanged below.

The link reaction, in the mitochondrial matrix. The pyruvate dehydrogenase complex converts pyruvate to acetyl-CoA.

Per pyruvate: 1 NADH, 1 CO2, 1 acetyl-CoA. Two pyruvate per glucose, so 2 NADH.

    pyruvate + CoA + NAD+  ->  acetyl-CoA + CO2 + NADH + H+

Irreversible in animals. This is the commitment point past which carbon cannot return to glucose, which matters for gluconeogenesis in act 4.

Three enzymes, not one. The complex is a physical assembly of pyruvate dehydrogenase itself, dihydrolipoyl transacetylase and dihydrolipoyl dehydrogenase, present in dozens of copies each, and it uses five cofactors: thiamine pyrophosphate, lipoamide, coenzyme A, FAD and NAD+. The FAD and the lipoamide are prosthetic and stay bound, and the substrate is passed between active sites on a swinging lipoyl arm rather than released into solution. It is the textbook case of substrate channelling, and it is exactly the spatial structure Part 1 says this model ignores.

Regulated by phosphorylation, which is a different mechanism from the allosteric control that governs glycolysis. A dedicated kinase switches the complex off and a phosphatase switches it back on, and the kinase is stimulated by the products, acetyl-CoA and NADH. High acetyl-CoA and high NADH mean the matrix is already supplied, so the cell stops committing pyruvate.

### The link back to act 1, which is worth making in-game

Act 1 already decarboxylates pyruvate. Pyruvate decarboxylase, added to this document on 2026-08-06 for the ethanol branch, takes the same carbon off the same molecule and is thiamine pyrophosphate dependent in the same way, and the two enzymes are genuinely related in mechanism.

**What differs is what happens to the two carbons that are left.** Pyruvate decarboxylase releases them as acetaldehyde, an ordinary aldehyde the cell then reduces to ethanol purely to get its NAD+ back, and the bond energy is thrown away. The pyruvate dehydrogenase complex oxidises them onto coenzyme A as a thioester, which is a high-energy bond, and captures the electrons as NADH at the same time. Same decarboxylation, same cofactor family, one of them discards what the other banks.

That is the cleanest available statement of what act 3 changes, and it is a comparison between two things the player has personally bought rather than an assertion about biochemistry in general.

## TCA cycle

Expanded 2026-08-24 with the eight steps named. The per-turn totals given before that date were correct and are unchanged.

Mitochondrial matrix. Eight steps, and it is a cycle rather than a path: the acceptor molecule at the start is regenerated at the end, so it is catalytic and is not consumed.

Per turn:
- 3 NADH
- 1 FADH2
- 1 GTP, energetically equivalent to ATP
- 2 CO2

Two turns per glucose, so 6 NADH, 2 FADH2, 2 ATP equivalents.

### The eight steps

Named because act 3 unlocks the cycle as one unit and then decomposes it, so the decomposition has to be sourced before it is built.

    1  citrate synthase                 acetyl-CoA + oxaloacetate + H2O -> citrate + CoA
    2  aconitase                        citrate -> isocitrate
    3  isocitrate dehydrogenase         isocitrate + NAD+ -> alpha-ketoglutarate + CO2 + NADH
    4  alpha-ketoglutarate dehydrogenase
                                        alpha-ketoglutarate + CoA + NAD+
                                          -> succinyl-CoA + CO2 + NADH
    5  succinyl-CoA synthetase          succinyl-CoA + GDP + Pi -> succinate + CoA + GTP
    6  succinate dehydrogenase          succinate + FAD -> fumarate + FADH2
    7  fumarase                         fumarate + H2O -> malate
    8  malate dehydrogenase             malate + NAD+ -> oxaloacetate + NADH

Four facts in that table are load-bearing for the act and none of them is obvious from the totals.

**The two carbons that leave are not the two that arrived.** Decarboxylation happens at steps 3 and 4, and isotope labelling shows the carbons released on a given turn come from the oxaloacetate rather than from the acetyl group just delivered. The cycle is carbon-conserving over a turn either way, which is what the model needs, but a claim that the acetyl carbons are the ones exhaled is wrong and is a common one.

**Step 6 is a respiratory complex.** Succinate dehydrogenase is complex II of the electron transport chain, and it is the only membrane-bound enzyme of the cycle and the only point where the two systems are the same protein. Its FAD is covalently bound rather than free in solution, and its electrons go into the quinone pool directly. This is why FADH2 never appears as a diffusible pool in a careful account.

**Step 5 is the cycle's only substrate-level phosphorylation**, which makes it the one step that is chemically the same kind of event as the ATP-making steps of glycolysis. Everything else the cycle produces is reducing power, and the roughly 30 figure is almost entirely earned later.

**Step 4 is an assembly of the same design as the pyruvate dehydrogenase complex**, with the same five cofactors and the same swinging arm, and the two share a subunit. A game that sells them as unrelated upgrades is missing a real relationship.

Regulated at citrate synthase, isocitrate dehydrogenase and alpha-ketoglutarate dehydrogenase, all responsive to the cell's energy state.

The cycle is amphibolic. Intermediates feed biosynthesis as well as energy production, which is the hook for amino acid catabolism in act 4. Drawing intermediates off is only possible because they can be topped back up, and the reaction that does the topping up is pyruvate carboxylase. See Part 2, "Carbon dioxide, and whether anything in this game consumes it".

## Oxidative phosphorylation and chemiosmosis

The conceptual center of the game.

Electron transport does not produce ATP. Complexes I, III and IV pass electrons from NADH and FADH2 down an energetic gradient to oxygen, and use the released energy to pump protons across the inner mitochondrial membrane. Complex II accepts electrons from FADH2 and does not pump.

The result is an electrochemical proton gradient. ATP synthase, complex V, allows protons back across and uses that flow to phosphorylate ADP.

Peter Mitchell proposed the chemiosmotic mechanism in 1961 and received the Nobel Prize in 1978. It was considered implausible for years, which is worth mentioning.

The gradient has two components and the distinction matters for anything that tries to draw it. Protons carry both charge and concentration, so the stored energy is a membrane potential plus a pH difference. In mitochondria the potential is the larger share, at roughly 150 to 180 mV, and the pH difference across the inner membrane is smaller, at roughly 0.5 to 1 unit. **A picture that shows only a difference in how many protons are on each side is showing the smaller half of the quantity.**

### Complex by complex, and what each one pumps

Added 2026-08-24. The document said which complexes pump and did not say how much, and the how much is what the act's economy is made of.

    complex I     NADH dehydrogenase
                  NADH + H+ + Q  ->  NAD+ + QH2
                  4 H+ pumped per 2 electrons

    complex II    succinate dehydrogenase, and TCA step 6
                  succinate + Q  ->  fumarate + QH2
                  0 H+ pumped. This is the entire reason FADH2 is worth less

    complex III   cytochrome bc1
                  QH2 + 2 cytochrome c oxidised  ->  Q + 2 cytochrome c reduced
                  4 H+ appear in the intermembrane space per 2 electrons,
                  through the Q cycle. Two are pumped and two are released
                  from QH2 on the intermembrane side

    complex IV    cytochrome c oxidase
                  4 cytochrome c reduced + O2 + 8 H+ (matrix)
                    ->  4 cytochrome c oxidised + 2 H2O + 4 H+ (intermembrane)
                  2 H+ pumped per 2 electrons, and 2 more consumed from the
                  matrix in making water

Totals per carrier, which is the number the yield is computed from: **10 protons to the intermembrane space per NADH** oxidised at complex I, and **6 per FADH2** entering at complex II. The difference of 4 is complex I, and it is the whole of the difference between the two shuttles below.

Complex IV is worth one extra sentence because it is where the protons stop being conserved as free protons. Four of them are consumed per O2 in making two water molecules, so they leave the matrix pool into a product rather than crossing back. A model that tracks protons as a conserved quantity has to give water somewhere to be, in exactly the way act 1's ethanol branch had to give carbon dioxide a pool for carbon to balance. See Part 2, "Carbon dioxide, and whether anything in this game consumes it".

## ATP synthase, and how many protons an ATP costs

Added 2026-08-24. This is the least settled stoichiometry in the whole of aerobic respiration and it is the main reason the yield below is a range rather than a number.

The enzyme is a rotary motor in two parts. F0 sits in the membrane and turns as protons pass through it. F1 projects into the matrix and holds three catalytic sites, which change conformation as the central stalk rotates past them, releasing one ATP each per full turn. Mitchell proposed the coupling and Boyer proposed the rotation, and Walker's crystal structure confirmed it; Boyer and Walker shared the 1997 Nobel Prize with Skou.

**Three ATP per revolution, and the protons per revolution are set by the number of c subunits in the rotor ring.** So the protons per ATP is the c number divided by 3, and the c number is not universal. Bovine mitochondria have 8, giving 2.7 protons per ATP. Yeast mitochondria have 10, giving 3.3. Chloroplast and bacterial rings run from 10 to 15. **There is no reason for this to be an integer and it is not one.**

There is a second cost on top of it. ATP made in the matrix has to reach the cytosol, and the adenine nucleotide translocase exchanges matrix ATP for cytosolic ADP while the phosphate carrier brings in phosphate with a proton. Together those cost roughly one further proton per ATP exported. The figure usually quoted for a complete cycle, synthesis plus export, is about 4 protons per cytosolic ATP.

That is where 2.5 comes from: 10 protons per NADH divided by 4 protons per exported ATP. It is a rounded consequence of two quantities that are themselves uncertain, and not a measured constant.

## The two NADH shuttles, and why their yields differ

Expanded 2026-08-24. The yields given before that date were correct and are unchanged. What is added is the mechanism, the reason the difference exists, and the fact that a real cell does not choose one.

The inner membrane has no NADH carrier. Cytosolic NADH, which is the 2 per glucose that glycolysis makes at the GAPDH step, cannot cross it. Only the electrons cross, and there are two routes.

**The malate-aspartate shuttle.** Cytosolic malate dehydrogenase reduces oxaloacetate to malate using the cytosolic NADH. Malate crosses on the malate to alpha-ketoglutarate carrier, and matrix malate dehydrogenase runs the same reaction backwards, regenerating NADH inside the matrix. The oxaloacetate cannot cross back, so it is transaminated to aspartate, returned on the glutamate to aspartate carrier, and transaminated back. Four transport events and two transaminations, and the net effect is that one cytosolic NADH becomes one matrix NADH.

Matrix NADH enters at complex I, so it is worth 10 protons and about 2.5 ATP. Total per glucose roughly 32.

**The glycerol phosphate shuttle.** Cytosolic glycerol-3-phosphate dehydrogenase reduces dihydroxyacetone phosphate to glycerol-3-phosphate using the cytosolic NADH. A second glycerol-3-phosphate dehydrogenase sits on the outer face of the inner membrane with an FAD prosthetic group, oxidises it back to dihydroxyacetone phosphate, and passes the electrons straight into the quinone pool.

The quinone pool is downstream of complex I, so those electrons never pass through it and 4 protons are never pumped. 6 protons, about 1.5 ATP. Total per glucose roughly 30.

### Why this is a real tradeoff and not a strictly worse option

The two are not ranked, and this is the part that licenses offering them as a choice.

The malate-aspartate shuttle is fully reversible. Every step is an equilibrium and the direction it runs is set by the ratio of NADH to NAD+ on each side, so it moves electrons inward only while the cytosol is more reduced than the matrix. Under high respiratory load the matrix pool is already reduced and the shuttle slows or reverses. **It is the higher-yielding route and it is the one that fails under pressure.**

The glycerol phosphate shuttle is effectively irreversible, because the second step drops the electrons onto an FAD at a potential they cannot climb back from. It runs at the same rate regardless of the matrix redox state. **It is the lower-yielding route and it is the one that keeps working when glycolytic flux is high.**

That is what the older shorthand of "speed against yield" was pointing at, and it is more precisely stated as insensitivity to redox back-pressure against yield.

### A real cell does not pick one

Both shuttles are present in most tissues and the balance between them shifts rather than being set. The malate-aspartate shuttle predominates in liver, heart and kidney. The glycerol phosphate shuttle is prominent in skeletal muscle and brown adipose tissue, and it is the dominant route in insect flight muscle, which is the classic case precisely because that tissue sustains the highest glycolytic flux in the animal kingdom.

**So a permanent, exclusive commitment to one shuttle is not a thing biology does**, and any game that makes the choice irreversible is departing from the science rather than modelling it. That departure may still be worth making for design reasons; it is recorded here that it would be one. docs/PROGRESSION.md holds the open question and the answer belongs there rather than in this document.

## ATP yield: state the range

Older textbooks give 36 to 38 ATP per glucose using integer P/O ratios of 3 for NADH and 2 for FADH2. Those integer values were revised on experimental grounds. Current values are approximately 2.5 ATP per NADH and 1.5 per FADH2, giving roughly 30 to 32 ATP per glucose. Published estimates range from about 29 to 32 depending on assumptions, including the number of c subunits in the ATP synthase rotor.

Accounting per glucose, using modern ratios and the malate-aspartate shuttle:
- Glycolysis: 2 ATP direct, 2 NADH
- Pyruvate oxidation: 2 NADH
- TCA: 2 ATP equivalents, 6 NADH, 2 FADH2
- Totals: 4 ATP direct, 10 NADH, 2 FADH2
- 10 NADH at 2.5 = 25
- 2 FADH2 at 1.5 = 3
- Sum: 32

Substituting the glycerol phosphate shuttle moves the 2 glycolytic NADH from 2.5 to 1.5 each, so the sum is 30.

The game should show both totals and explain the discrepancy rather than picking one silently. Note also that these are theoretical maxima. Real cells lose output to proton leak and transport costs, so actual yield is lower still.

### The range, and the five reasons for it

Consolidated 2026-08-24. This subsection exists because act 3 makes the game's largest quantitative claim and the honest form of that claim is a range with reasons rather than a number with a caveat. Nothing here is new science; it is the same facts gathered into one place so that a player-facing surface can render them.

**The band this document supports is 29 to 32 ATP per glucose**, with 30 and 32 as the two figures the shuttle choice picks between, and with everything below pushing the realised value toward and past the bottom of it. The obsolete figure is 36 to 38 and it is still in circulation.

The five reasons the number is not a number:

1. **Shuttle choice, worth exactly 2.** Malate-aspartate gives 32 and glycerol phosphate gives 30, by the mechanism in the section above. This is the only one of the five the player controls, and it is the reason a game can make the uncertainty interactive rather than only stating it.

2. **The c-ring stoichiometry of ATP synthase, which is not an integer and is not universal.** Protons per ATP is the c number over 3, the c number is 8 in bovine mitochondria and 10 in yeast, and the commonly used figure of 4 protons per exported ATP is a rounding of that plus the transport cost. This is the assumption Part 7 item 2 names and it is the largest single source of spread.

3. **The P/O ratios of 2.5 and 1.5 are themselves rounded consensus values**, not measurements with tight error bars. They replaced the integers 3 and 2 on experimental grounds, and the replacement was a correction of a false precision rather than the establishment of a new one.

4. **Transport costs are real and are frequently left out.** The adenine nucleotide translocase, the phosphate carrier and the mitochondrial pyruvate carrier all consume the gradient. Pyruvate import in particular is one proton per pyruvate and therefore 2 per glucose, and an accounting that omits it is overstating the yield.

5. **Proton leak.** The inner membrane is not perfectly impermeable and some protons return without passing through ATP synthase. In resting tissue this is a substantial fraction of respiration rather than a rounding error, and in brown adipose tissue it is deliberately maximised by uncoupling protein 1, which is the case that proves the gradient and the ATP are separable quantities.

Reasons 2 and 3 are disagreements about what the maximum is. Reasons 4 and 5 are the gap between the maximum and what a cell actually gets. **Both belong in the honest statement and they are different kinds of uncertainty**, which is the distinction a contested-science surface has to preserve to be worth building.

## The multiplier

Fermentation gives 2 ATP per glucose. Aerobic respiration gives roughly 30. That is about fifteen times, and it is the emotional payoff of act 3.

The figure is a ratio of two numbers with different confidences, and that is worth keeping straight. **The 2 is exact**, fixed by the stoichiometry of glycolysis and asserted in act 1 to nine decimal places. The roughly 30 is the range above. So the multiplier is roughly 15 to 16 against the theoretical maximum and lower in a real cell, and the honest short form is "about fifteen times" rather than any figure with a decimal point in it.

The corollary is worth stating in-game: tissues that depend heavily on oxygen retain only a small fraction of their normal ATP production when deprived of it. This is why oxygen deprivation kills quickly.

---

# Part 5: Act 4 science, substrate breadth and regulation

## Beta oxidation

Fatty acids are activated to fatty acyl-CoA at a cost of 2 ATP equivalents, then transported into the matrix via the carnitine shuttle.

Each beta oxidation cycle removes two carbons and produces:
- 1 acetyl-CoA, which enters the TCA cycle
- 1 NADH
- 1 FADH2

Palmitate, a sixteen-carbon saturated fatty acid, runs seven cycles to produce eight acetyl-CoA, seven NADH and seven FADH2.

Total yield from palmitate is approximately 104 to 106 ATP depending on how activation and transport costs are counted. Older sources using integer P/O ratios give around 129. Give the range.

Per gram, fat yields roughly twice the energy of carbohydrate, which is why it is the storage molecule of choice.

The game tradeoff: high yield, slow mobilization, higher oxygen cost per unit substrate.

## Amino acid catabolism

Amino acids feed the TCA cycle at multiple entry points after their nitrogen is removed.

Glucogenic amino acids yield intermediates that can be converted back to glucose. Ketogenic amino acids yield acetyl-CoA or ketone bodies and cannot. Some are both.

Nitrogen disposal is the constraint. Free ammonia is toxic and must be converted to urea, which costs ATP. This introduces the first pathway in the game that spends energy to avoid harm rather than to produce anything, which is a good late-game complication.

## Gluconeogenesis

Glucose synthesis from non-carbohydrate precursors. Not simply glycolysis reversed. Three glycolytic steps are thermodynamically irreversible and require different enzymes to bypass.

The three bypasses, named 2026-08-06 because act 1's carbon dioxide question turns on one of them. Pyruvate to phosphoenolpyruvate takes two steps rather than one: pyruvate carboxylase carboxylates pyruvate to oxaloacetate, spending 1 ATP and taking the carbon from bicarbonate, then phosphoenolpyruvate carboxykinase decarboxylates oxaloacetate to phosphoenolpyruvate, spending 1 GTP and releasing that same carbon again. Fructose-1,6-bisphosphatase bypasses the phosphofructokinase-1 step. Glucose-6-phosphatase bypasses the hexokinase step. **Pyruvate carboxylase is the only carbon dioxide consuming reaction in any pathway this game plans to model**, and its other and larger role is anaplerotic rather than gluconeogenic. See Part 2, "Carbon dioxide, and whether anything in this game consumes it".

Costs more ATP than glycolysis yields. Running both simultaneously produces a futile cycle that burns ATP for nothing, which is why reciprocal regulation exists and is a real regulatory failure mode worth modeling.

## Regulation as the act 4 theme

Allosteric control, where the product of a pathway inhibits an upstream enzyme.

Reciprocal regulation, where opposing pathways are controlled by the same signals in opposite directions.

Compartmentalization, where separating pathways into different organelles allows incompatible conditions to coexist and prevents futile cycling.

Energy charge, where the ratio of ATP to ADP and AMP acts as a master regulatory signal across the whole network.

---

# Part 6: The geological timeline

Ground truth for the vertical timeline view. Spans all four acts, so it lives here rather than inside any one act's section.

Every date below is player-facing text and falls under CLAUDE.md hard rule 1. Ranges are given rather than point values because the point values are false precision. Where a drafted figure was wrong it is marked as corrected, with the reason.

The admission rule for this view is that a stop earns its place by its metabolism rather than its morphology. Nothing appears because it is an interesting organism.

## Stop 1: Alkaline hydrothermal vents, Hadean

Drafted as roughly 4.0 Ga. Retained with a heavy caveat.

The hypothesis is that alkaline hydrothermal systems sustain natural proton gradients across thin inorganic barriers, that those barriers contained catalytic iron and nickel sulfide minerals structurally similar to cofactors in modern metabolic enzymes, and that this constitutes a possible abiotic origin of chemiosmotic coupling. The alkaline vent fluid is roughly pH 9 to 11 from serpentinization, and the Hadean ocean is thought to have been mildly acidic near pH 6 from high dissolved carbon dioxide, which produces a gradient of similar polarity and magnitude to the one modern cells maintain. The supporting argument is that ATP synthase is universal while no proton pumping machinery is, which suggests the ability to use a gradient is older than the ability to make one.

The contest is real and it is not a minor quibble. Jackson argued in 2016 that natural pH gradients were unlikely to have played any role, on the grounds that the inorganic barrier arrangement produces no electrical potential difference and that a protocell so dependent on the vent could never have left it. Lane published a direct rebuttal in 2017. A heterotrophic origin in freshwater hydrothermal fields is the main competing proposal. Experimental yields from origin-of-life reactors simulating these conditions remain very low.

Two separate uncertainties are being compressed into one date and the game should not compress them. The timing of the origin of life is uncertain. The vent hypothesis specifically is disputed on mechanism regardless of timing. Present this stop as a hypothesis about where chemiosmosis came from rather than as an event that happened at 4.0 Ga.

Metabolism test: passes clearly. The entire reason to include it is chemiosmosis, which is the act 3 teaching beat.

## Stop 2: Stromatolites, roughly 3.48 to 3.43 Ga

Drafted as roughly 3.5 Ga. Confirmed as approximately correct, with a correction to what they demonstrate.

The oldest widely accepted stromatolites come from the Pilbara Craton of Western Australia. Strelley Pool Formation examples are dated at about 3.43 to 3.45 Ga and Dresser Formation examples at about 3.48 Ga. Djokic and colleagues reported well-preserved Dresser Formation stromatolites in hot spring deposits, which additionally represent the earliest evidence of life on land rather than in the sea.

The dispute over older claims is genuine and worth showing. Nutman and colleagues reported 3.7 Ga stromatolite-like structures from the Isua supracrustal belt in Greenland in 2016. Allwood and colleagues argued in 2018 that the structures are not biogenic, based on relationships in a more deformed part of the same outcrop. Nutman and colleagues responded in 2019 that the problematic features are post-depositional carbonate veining and that the structures sit within a mappable stratigraphic succession. The dispute is unresolved. This is a good illustration of the general problem that older rocks make biological signals harder to separate from geological overprinting.

Correction to what this stop teaches. The design brief said stromatolites qualify because they are microbial mats doing photosynthesis. At 3.43 Ga this overstates the evidence. Stromatolite morphology indicates microbial mat construction, but no definite physiological inference can be drawn from the structures themselves, and any photosynthesis at this date was more plausibly anoxygenic. Label this stop as microbial mats and anoxygenic phototrophy, not as oxygen production.

Metabolism test: passes, once relabeled.

## Stop 3: Oxygenic photosynthesis, contested, do not use 2.7 Ga

Drafted as roughly 2.7 Ga. This figure is stale and should be cut.

The 2.7 Ga date came from 2-methylhopane biomarkers reported in Late Archean sediments in 1999, which were read as evidence that cyanobacteria were widespread long before atmospheric oxygen rose. Two independent problems dismantled it. The syngeneity of the hydrocarbons was questioned by Rasmussen and colleagues in 2008 and French and colleagues demonstrated in 2015 that the molecules came from younger contamination. Separately, the precursor lipids turned out not to be specific to cyanobacteria, being produced by several other bacterial groups including Alphaproteobacteria and Acidobacteria, so they are not diagnostic for oxygenic phototrophs even where they are genuinely ancient.

Partial rehabilitation is worth noting for accuracy. A 2023 analysis re-examined the distribution of the responsible methyltransferase gene and concluded that it was probably present in the last common ancestor of cyanobacteria while appearing in Alphaproteobacteria only around 750 Ma, which re-establishes the biomarkers as cyanobacterial indicators for samples older than that, given contamination-free material. This does not restore the 2.7 Ga date, which failed on contamination grounds independently.

What can be said. The timing of the origin of oxygenic photosynthesis remains debated. Molecular clock and phylogenetic approaches place the divergence of thylakoid-bearing cyanobacteria somewhere between 2.7 and 2.0 Ga. The earliest undisputed cyanobacterial fossil, Eoentophysalis belcherensis, dates to 2.018 to 1.854 Ga. The oldest direct physical evidence of thylakoid membranes was reported in 2024 from microfossils dated 1.78 to 1.73 Ga, giving a minimum age for thylakoid-bearing cyanobacteria of roughly 1.75 Ga.

Recommended treatment. Do not put a date on this stop. Place it before the GOE, state that oxygen production must predate atmospheric accumulation, and say plainly that when it started is unresolved. This is the timeline's strongest opportunity to show a live scientific dispute rather than assert a number.

Metabolism test: passes, and it is arguably the single most metabolically important stop on the timeline.

## Stop 4: Banded iron formations, roughly 3.8 to 1.8 Ga with peaks

Drafted as a depositional window to be established. Established below, and it corrects an error in Part 3 of this document.

Iron formations occur in minor amounts in the early Archean, then in large volume in the Late Archean at roughly 2.8 to 2.5 Ga, with total volume reaching a maximum around 2.5 Ga in the Hamersley Basin of Western Australia. A second Paleoproterozoic episode runs to roughly 1.85 Ga and includes the Superior-type formations of North America at about 1.88 Ga. Deposition then largely ends around 1.85 to 1.8 Ga. There is a gap of roughly a billion years, then a smaller Neoproterozoic reappearance between about 0.8 and 0.6 Ga, associated with intense magmatic activity and with the global glaciations of that interval.

The 1.85 Ga termination is itself an open question. One proposal ties it to the Sudbury impact producing global mixing of shallow oxic and deep anoxic waters, which would have prevented transport of hydrothermally derived ferrous iron to continental margins. Others attribute it to ocean chemistry changes without an impact trigger.

Design consequence for the timeline view. Banded iron is the intended visual for the GOE stop, and it does not cleanly mark the GOE. Peak deposition sits just before atmospheric oxygenation and the end of deposition sits half a billion years after it. Either use the peak at roughly 2.5 Ga and label it as the immediate pre-GOE maximum, or use a different visual. The redox-sensitive detrital mineral record is the cleaner GOE marker but it is far harder to draw.

Metabolism test: passes. It is the physical record of biologically produced oxygen meeting dissolved iron.

## Stop 5: Mitochondrial endosymbiosis, contested window

Drafted as roughly 2.0 to 1.5 Ga. Approximately right as a central estimate, but the honest range is wider and the disagreement is structural rather than statistical.

Estimates for the age of the last eukaryotic common ancestor vary by roughly twofold across methods, from about 1.0 to 2.3 Ga, driven by violations of the molecular clock at these distances and by a shortage of calibration points near the date of interest.

Recent specific results, which illustrate the spread rather than resolving it:

A 2025 dated gene duplication analysis placed the divergence of the eukaryotic host lineage from sampled archaea at 3.05 to 2.79 Ga, the divergence of the mitochondrial ancestor from other Alphaproteobacteria at 2.37 to 2.13 Ga, and the radiation of LECA at 1.80 to 1.67 Ga, aligning mitochondrial endosymbiosis to roughly 2.2 Ga. That study concludes the host already had an elaborated cytoskeleton, endomembrane system, phagocytotic machinery and a nucleus before acquiring the mitochondrion.

A separate analysis using both archaeal and bacterial gene sets obtained a conservative interval of 2.2 to 1.5 Ga for the origin of eukaryotes with a core interval of 2.0 to 1.8 Ga, and argued this aligns eukaryogenesis with the rise of oxygen, against the view that the two are decoupled.

Another approach yields a conservative eukaryogenesis interval of 2.19 to 1.45 Ga, explicitly framed as avoiding false precision.

A 2025 study of a Paleoproterozoic microbial ecosystem argues for early eukaryogenesis with mitochondrial endosymbiosis in micro-oxic and nano-oxic niches and a minimum LECA age above 1.75 Ga.

Recommended treatment. Show the window as roughly 2.2 to 1.5 Ga and state that both the date and the ordering are disputed. Part 7 of this document already records the mitochondria-early versus mitochondria-late disagreement and this stop is where the player meets it.

Metabolism test: passes. It is the act 3 transition.

## Stop 6: First eukaryote fossils, roughly 1.7 to 1.5 Ga

Drafted as roughly 1.6 Ga. Approximately correct, and the qualifier in the task brief is doing real work.

The first fossils unequivocally identified as total-group eukaryotes are acritarchs from about 1.7 to 1.5 Ga. The recurrent assemblage typified by Tappania, Dictyosphaera or Shuiyousphaeridium and Valeria extends from roughly 1650 to 1400 Ma and is found in China, Australia, India, Siberia and North America.

What "widely accepted" is doing. Eukaryotic identity in the Proterozoic fossil record is inferred from a combination of features rather than from any single one. Large cell size, a resistant preservable wall and complex ornamentation such as spines, processes or plates. Individually each occurs in some prokaryotes. In combination they do not. Acritarchs are a polyphyletic form group of uncertain affinity, so the assignment is to eukaryotes broadly rather than to any known clade. The first fossil confidently placed within a named crown-group clade is Bangiomorpha pubescens at roughly 1.0 Ga.

Older claims exist and are contested. Grypania from the Negaunee Formation was originally dated near 2.1 Ga and later redated to 1874 plus or minus 9 Ma, and its biological nature has been questioned. Fibro-radial bodies from the roughly 2.1 Ga Francevillian Group in Gabon are also disputed. Putative eukaryotic biomarkers reported from 2.7 Ga rocks were shown to be drilling contamination, the same contamination episode that dismantled the 2.7 Ga oxygenic photosynthesis date at stop 3.

Metabolism test: fails as drafted, passes if reframed. "First eukaryote fossils" is a morphology stop. It gets on the timeline for cells looking a certain way, which is exactly what docs/PILLARS.md rules out. Two available reframings both make it metabolic:

Sterol biosynthesis. Brocks and colleagues reported in Nature in 2023 a class of steroid biomarkers, the protosterol biota, in the Barney Creek Formation dating to about 1.64 Ga, interpreted as the remains of stem-group eukaryotes. Sterol synthesis requires molecular oxygen, so this is a metabolic marker rather than a morphological one, and it ties the stop directly to the oxygen theme running through the whole game.

Aerobic habitat restriction. A 2026 Nature study reconstructing the habitats of the oldest known fossil eukaryotes, roughly 1.75 to 1.4 Ga, found them almost entirely restricted to settings with oxygenated bottom waters. Early eukaryotes were benthic aerobes. That is a metabolic statement about the same fossils and it is the cleanest possible closing beat for a game about the acquisition of aerobic respiration.

Recommendation: relabel this stop as early aerobic eukaryotes and lead with the oxygen dependency rather than the fossil morphology.

## Proposed additional stop: anoxygenic photosynthesis

Missing from the drafted table and it should probably be there.

Anoxygenic photosynthesis precedes oxygenic photosynthesis and uses electron donors other than water, such as hydrogen sulfide, hydrogen or ferrous iron. It matters for this game because it establishes that photosynthesis and oxygen production are separable, which is the setup that makes the water-splitting innovation legible as an innovation rather than as the definition of photosynthesis.

Placement is a problem. Its timing is at least as poorly constrained as oxygenic photosynthesis and possibly worse, so it would be a second undated stop adjacent to the first. Offered as a proposal rather than a recommendation. If the timeline can only carry one photosynthesis stop, keep the oxygenic one and handle anoxygenic photosynthesis in the stop text.

## Stops considered and rejected

Nitrogen fixation and methanogenesis are both metabolically important and both ancient, and both were considered. Neither connects to any pathway the player unlocks, so including them would mean adding content the game never uses. Left out under docs/PILLARS.md scope discipline rather than for lack of significance.

---

# Part 7: Known unknowns

Surface these in-game. They demonstrate that the science is live rather than finished.

1. Whether mitochondria came early and drove eukaryotic complexity or arrived after a host that was already complex. Actively disputed, with recent papers on both sides.
2. The exact ATP yield per glucose. Depends on assumptions that are not fully settled, including ATP synthase rotor stoichiometry. Expanded 2026-08-24: the band is 29 to 32 and there are five separate reasons for the spread, two of which are disagreements about the theoretical maximum and two of which are the gap between that maximum and what a cell realises. See Part 4, "The range, and the five reasons for it". **This is the one entry on this list that the game states at the moment it makes its largest quantitative claim**, rather than filing away in an about screen.
3. The precise duration and pace of the Great Oxidation Event.
4. When oxygenic photosynthesis originated. Revised 2026-07-28. The earlier wording here assumed the gap between its origin and atmospheric accumulation was itself established and that only the explanation was open. That was too confident. The 2.7 Ga figure that supported it rests on biomarkers since shown to be younger contamination, and the origin date is unresolved across a range of several hundred million years. See Part 6 stop 3.
5. The origin of glycolysis itself, which predates the last universal common ancestor and has no accessible fossil record.
6. Whether natural proton gradients in alkaline hydrothermal vents played any role in the origin of chemiosmosis. Actively disputed on mechanism, not merely on timing. See Part 6 stop 1.
7. Whether the oldest claimed stromatolites, the 3.7 Ga Isua structures, are biogenic. Unresolved across a 2016 claim, a 2018 rebuttal and a 2019 counter-rebuttal.
8. Why banded iron formation deposition ended around 1.85 Ga. Impact-triggered ocean mixing and gradual ocean chemistry change are both proposed.
9. Whether the origin of eukaryotes is temporally coupled to the rise of oxygen. Depends on which molecular clock estimate is preferred, and the estimates span roughly a billion years.
10. Whether radical SAM enzymes constitute a third class of ROS-sensitive enzyme alongside cluster dehydratases and mononuclear iron enzymes. An active hypothesis with circumstantial support.

---

# Sources

Primary references for pathway topology, stoichiometry and regulation:
- Lehninger Principles of Biochemistry, 8th edition
- Berg, Tymoczko and Stryer, Biochemistry, 9th edition
- KEGG Pathway Database. Glycolysis map00010, TCA cycle map00020, oxidative phosphorylation map00190

ATP yield revision:
- Rich, P. The molecular machinery of Keilin's respiratory chain. Biochem Soc Trans, 2003
- Journal of Chemical Education correspondence on ATP yield per glucose, which documents the 29 to 32 consensus range and the persistence of the outdated 38 figure. https://pubs.acs.org/doi/10.1021/ed800102g
- Oxford Reference entry on P:O ratio, for the shuttle-dependent spread

Great Oxidation Event:
- Sessions et al. The Continuing Puzzle of the Great Oxidation Event. Current Biology, 2009
- PNAS 2020 on expansion of arsenic detoxification genetics around the GOE. https://www.pnas.org/doi/10.1073/pnas.2001063117

Endosymbiosis:
- Sagan, L. On the origin of mitosing cells. Journal of Theoretical Biology, 1967
- Woese and Fox, 1977, for the rRNA confirmation
- Tobiasson, Luo, Wolf and Koonin. Dominant contribution of Asgard archaea to eukaryogenesis. Nature, 2026. https://www.nature.com/articles/s41586-025-09960-6
- Dated gene duplication analysis supporting late mitochondria. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12872463/
- EMBO Journal review on Asgard archaea and eukaryotic origins, 2026

Chemiosmosis:
- Mitchell, P. Coupling of phosphorylation to electron and hydrogen transfer by a chemi-osmotic type of mechanism. Nature, 1961

Act 3 pathway detail, Part 4, added 2026-08-24:
- Lehninger Principles of Biochemistry, 8th edition, and Berg, Tymoczko and Stryer, Biochemistry, 9th edition. Both are already at the head of this list and both are the load-bearing sources for the eight TCA steps and their enzymes, the pyruvate dehydrogenase complex's three enzymes and five cofactors, the per-complex proton counts of 4, 0, 4 and 2, the totals of 10 per NADH and 6 per FADH2, and the mechanism of both shuttles. Repeated here because a reader chasing act 3 should not have to infer which general reference carries it
- Bricker, D. K. et al. A mitochondrial pyruvate carrier required for pyruvate uptake in yeast, Drosophila, and humans. Science, 337(6090), 96 to 100, 2012. https://doi.org/10.1126/science.1218099
- Herzig, S. et al. Identification and functional expression of the mitochondrial pyruvate carrier. Science, 337(6090), 93 to 96, 2012. The second of the two independent 2012 identifications. https://doi.org/10.1126/science.1218530. Together these two are the source for MPC1 and MPC2 and for the carrier being a proton symport
- Watt, I. N., Montgomery, M. G., Runswick, M. J., Leslie, A. G. W. and Walker, J. E. Bioenergetic cost of making adenosine triphosphate in animal mitochondria. PNAS, 107(39), 16823 to 16827, 2010. Source for the bovine c8 ring and therefore for 2.7 protons per ATP synthesised. https://doi.org/10.1073/pnas.1011099107
- Boyer, P. D. The ATP synthase, a splendid molecular machine. Annual Review of Biochemistry, 66, 717 to 749, 1997. Source for the binding change mechanism and three ATP per revolution
- Abrahams, J. P., Leslie, A. G. W., Lutter, R. and Walker, J. E. Structure at 2.8 Å resolution of F1-ATPase from bovine heart mitochondria. Nature, 370, 621 to 628, 1994. The structure that confirmed the rotation
- Nicholls, D. G. and Ferguson, S. J. Bioenergetics, 4th edition, 2013. Source for the membrane potential of roughly 150 to 180 mV being the larger component of the protonmotive force, for the pH difference of roughly 0.5 to 1 unit, and for proton leak being a substantial fraction of resting respiration
- Brand, M. D. and Nicholls, D. G. Assessing mitochondrial dysfunction in cells. Biochemical Journal, 435(2), 297 to 312, 2011. Source for proton leak as a quantified component of respiration rather than an aside. https://doi.org/10.1042/BJ20110162
- Klingenberg, M. The ADP and ATP transport in mitochondria and its carrier. Biochimica et Biophysica Acta, 1778(10), 1978 to 2021, 2008. Source for the adenine nucleotide translocase exchange and its contribution to the cost of an exported ATP
- Sazanov, L. A. A giant molecular proton pump: structure and mechanism of respiratory complex I. Nature Reviews Molecular Cell Biology, 16, 375 to 388, 2015. Source for the 4 protons per 2 electrons at complex I. https://doi.org/10.1038/nrm3997
- Crofts, A. R. The cytochrome bc1 complex: function in the context of structure. Annual Review of Physiology, 66, 689 to 733, 2004. Source for the Q cycle and for the 4 protons appearing on the intermembrane side per QH2
- Wikström, M. and Hummer, G. Stoichiometry of proton translocation by respiratory complex I and its mechanism. PNAS, 109(12), 4431 to 4436, 2012. Cited for the proton stoichiometries being an active measurement question rather than settled constants, which is reason 2 in the yield range
- Cederbaum, A. I., Lieber, C. S., Beattie, D. S. and Rubin, E. Characterization of shuttle mechanisms for the transport of reducing equivalents into mitochondria. Archives of Biochemistry and Biophysics, 158(2), 763 to 781, 1973. Source for the two shuttles operating together rather than exclusively
- Sacktor, B. Biochemistry of insect flight, in Insect Biochemistry and Function, 1975. Source for the glycerol phosphate shuttle dominating in insect flight muscle. Editor and exact pagination not verified
- Cannon, B. and Nedergaard, J. Brown adipose tissue: function and physiological significance. Physiological Reviews, 84(1), 277 to 359, 2004. Source for uncoupling protein 1 deliberately dissipating the gradient, which is the case that separates gradient from ATP

Oxidative damage mechanisms and enzyme targets, Part 3:
- Imlay, J. A. The molecular mechanisms and physiological consequences of oxidative stress: lessons from a model bacterium. Nature Reviews Microbiology, 11(7), 443 to 454, 2013. The canonical review. Establishes [4Fe-4S] dehydratases and mononuclear iron enzymes as the two primary target classes. https://doi.org/10.1038/nrmicro3032
- Imlay, J. A. Where in the world do bacteria experience oxidative stress? Environmental Microbiology, 21(2), 521 to 530, 2019. Source for the steady-state oxidant concentrations, the roughly thirty minute damage interval, the roughly five minute cluster repair half-time and the lactic acid bacteria manganese strategy. https://doi.org/10.1111/1462-2920.14445
- Lu, Z., Sethu, R. and Imlay, J. A. Endogenous superoxide is a key effector of the oxygen sensitivity of a model obligate anaerobe. PNAS, 2018. https://www.pnas.org/doi/10.1073/pnas.1800120115
- Do reactive oxygen species or does oxygen itself confer obligate anaerobiosis? The case of Bacteroides thetaiotaomicron. Molecular Microbiology, 2020. Imlay lab; individual authors not verified. Source for PFOR and PFL being inactivated by molecular oxygen itself rather than by ROS, and for the irreparability of PFOR. https://onlinelibrary.wiley.com/doi/full/10.1111/mmi.14516
- Gardner, P. R. and Fridovich, I. Superoxide sensitivity of the Escherichia coli 6-phosphogluconate dehydratase. J Biol Chem, 266, 1478 to 1483, 1991. https://pubmed.ncbi.nlm.nih.gov/1846355/
- Djaman, O., Outten, F. W. and Imlay, J. A. Repair of oxidized iron-sulfur clusters in Escherichia coli. J Biol Chem, 279, 44590 to 44599, 2004
- Anjem, A. and Imlay, J. A. Mononuclear iron enzymes are primary targets of hydrogen peroxide stress. J Biol Chem, 287(19), 15544 to 15556, 2012. https://doi.org/10.1074/jbc.M111.330365
- Jang, S. and Imlay, J. A. Hydrogen peroxide inactivates the Escherichia coli Isc iron-sulphur assembly system, and OxyR induces the Suf system to compensate. Mol Microbiol, 78, 1448 to 1467, 2010

Fermentative enzymes and NAD+ regeneration under oxidative stress, Part 3:
- Novel antioxidant role of alcohol dehydrogenase E from Escherichia coli. J Biol Chem, 2003. Authors not verified. Source for AdhE inactivation by metal-catalyzed oxidation and the zinc substitution result. https://pubmed.ncbi.nlm.nih.gov/12783863/
- Differential inactivation of alcohol dehydrogenase isoenzymes in Zymomonas mobilis. J Bacteriol, 179(4), 1102 to 1104, 1997. Source for the roughly eighty percent inactivation of iron-containing ADH II after four hours of aeration while zinc-containing ADH I remained active. https://journals.asm.org/doi/pdf/10.1128/jb.179.4.1102-1104.1997
- A safety cap protects hydrogenase from oxygen attack. Nature Communications, 2021. Authors not verified. https://www.nature.com/articles/s41467-020-20861-2
- Fantastic [FeFe]-Hydrogenases and Where to Find Them. Frontiers in Microbiology, 2022. Source for the redox-balance role of hydrogenases and for the variation in oxygen tolerance. https://www.frontiersin.org/journals/microbiology/articles/10.3389/fmicb.2022.853626/full

GAPDH as an oxidative target and redox switch, Part 3:
- The GAPDH redox switch safeguards reductive capacity and enables survival of stressed tumour cells. Nature Metabolism, 2023. Authors not verified. Source for the claim that no other enzyme is as conspicuously oxidized by hydrogen peroxide as GAPDH, and for the redox-insensitive mutant losing the pentose phosphate response. https://www.nature.com/articles/s42255-023-00781-3
- Cytosolic thiol switches regulating basic cellular functions: GAPDH as an information hub? Biological Chemistry, 2015. Authors not verified.

Alkaline hydrothermal vents and the origin of chemiosmosis, Part 6 stop 1:
- Lane, N., Allen, J. F. and Martin, W. How did LUCA make a living? Chemiosmosis in the origin of life. BioEssays, 32(4), 271 to 280, 2010
- Martin, W. and Russell, M. J. On the origin of biochemistry at an alkaline hydrothermal vent. Phil Trans R Soc B, 362, 1887 to 1925, 2007
- An origin-of-life reactor to simulate alkaline hydrothermal vents. J Mol Evol, 2014. Authors not verified. https://pmc.ncbi.nlm.nih.gov/articles/PMC4247476/
- Jackson, J. B. (cited in the literature as J. Baz Jackson; initial order not verified). Natural pH gradients in hydrothermal alkali vents were unlikely to have played a role in the origin of life. J Mol Evol, 2016. The primary critique. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4999464/
- Jackson, J. B. (see note above). Ancient living organisms escaping from, or imprisoned in, the vents? Life, 7(3), 36, 2017. https://doi.org/10.3390/life7030036
- Lane, N. Proton gradients at the origin of life. BioEssays, 2017. The rebuttal. https://onlinelibrary.wiley.com/doi/abs/10.1002/bies.201600217

Stromatolites, Part 6 stop 2:
- Allwood, A. C. et al. Strelley Pool stromatolite work, Nature 2006 and subsequent 2009 and 2010 papers. Exact titles not verified.
- Djokic, T. et al. Earliest signs of life on land preserved in ca. 3.5 Ga hot spring deposits. Nature Communications, 2017. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5436104/
- Nutman, A. P. et al. Rapid emergence of life shown by discovery of 3,700-million-year-old microbial structures. Nature, 2016. https://www.nature.com/articles/nature19355
- Allwood, A. C. et al. Reassessing evidence of life in 3,700-million-year-old rocks of Greenland. Nature, 2018. The rebuttal
- A review of 3.7 Ga stromatolites from the Isua Supracrustal Belt, West Greenland. Earth-Science Reviews, 2025. Summarizes the full exchange including the 2019 counter-rebuttals. https://www.sciencedirect.com/science/article/abs/pii/S0012825224003623

Oxygenic photosynthesis timing, Part 6 stop 3:
- Summons, R. E., Jahnke, L. L. and Hope, J. M. 2-Methylhopanoids as biomarkers for cyanobacterial oxygenic photosynthesis. Nature, 400, 554 to 557, 1999. The original claim, included because the timeline text explains why it was withdrawn. https://www.nature.com/articles/23005
- Rasmussen et al. Nature, 2008. First challenge to biomarker syngeneity. Full title and author list not verified.
- French et al. PNAS, 2015. Demonstrates the Archean hydrocarbon biomarkers are younger contamination. Full title and author list not verified.
- Fischer, W. W., Hemp, J. and Johnson, J. E. Evolution of oxygenic photosynthesis. Annual Review of Earth and Planetary Sciences, 2016. https://web.gps.caltech.edu/~wfischer/pubs/Fischeretal2016a.pdf
- Sánchez-Baracaldo, P. On the origin of oxygenic photosynthesis and Cyanobacteria. New Phytologist, 2020. https://doi.org/10.1111/nph.16249
- Oldest thylakoids in fossil cells directly evidence oxygenic photosynthesis. Nature, 2024. Source for the roughly 1.75 Ga minimum and the 2.018 to 1.854 Ga Eoentophysalis date. https://pubmed.ncbi.nlm.nih.gov/38172638/
- Genetics re-establish the utility of 2-methylhopanes as cyanobacterial biomarkers before 750 million years ago. Nature Ecology and Evolution, 2023. The partial rehabilitation. https://www.nature.com/articles/s41559-023-02223-5

Banded iron formations, Part 6 stop 4:
- Some Precambrian banded iron-formations from around the world. American Mineralogist, 90(10), 1473, 2005. Source for the maximum at about 2.5 Ga, disappearance at about 1.8 Ga and Neoproterozoic reappearance between 0.8 and 0.6 Ga. https://pubs.geoscienceworld.org/msa/ammin/article-abstract/90/10/1473/44295/
- Slack, J. F. and Cannon, W. F. Extraterrestrial demise of banded iron formations 1.85 billion years ago. Geology, 2009. The Sudbury impact hypothesis for the termination

Eukaryogenesis timing, Part 6 stop 5:
- Dated gene duplications elucidate the evolutionary assembly of eukaryotes. Nature, 2025. Source for nFECA at 3.05 to 2.79 Ga, mFECA divergence at 2.37 to 2.13 Ga, LECA at 1.80 to 1.67 Ga and endosymbiosis aligned to roughly 2.2 Ga. https://www.nature.com/articles/s41586-025-09808-z
- The origin of eukaryotes and rise in complexity were synchronous with the rise in oxygen. 2023. Source for the 2.2 to 1.5 Ga conservative interval and the 2.0 to 1.8 Ga core interval. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10505794/
- Frontiers in Bioinformatics, 2023, for the 2.19 to 1.45 Ga conservative eukaryogenesis interval. https://www.frontiersin.org/journals/bioinformatics/articles/10.3389/fbinf.2023.1233281/
- A late origin of the extant eukaryotic diversity: divergence time estimates using rare genomic changes. Biology Direct, 6, 26, 2011. Authors not verified. Source for the roughly twofold spread, about 1,100 to 2,300 Ma. https://doi.org/10.1186/1745-6150-6-26
- A diverse Palaeoproterozoic microbial ecosystem implies early eukaryogenesis. Phil Trans R Soc B, 2025. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12329461/

Early eukaryote fossils, Part 6 stop 6:
- A Laurentian record of the earliest fossil eukaryotes. Geology, 45(5), 387, 2017. Authors not verified. Source for the Tappania, Dictyosphaera and Valeria assemblage spanning about 1650 to 1400 Ma. https://pubs.geoscienceworld.org/gsa/geology/article/45/5/387/207896/
- The earliest history of eukaryotic life. Trends in Ecology and Evolution, 2021. Source for the first unequivocal total-group eukaryote acritarchs at about 1.7 to 1.5 Ga and for Bangiomorpha at about 1.0 Ga. https://www.sciencedirect.com/science/article/abs/pii/S0169534721003086
- Brocks, J. J. et al. Lost world of complex life and the late rise of the eukaryotic crown. Nature, 2023. The protosterol biota at about 1.64 Ga
- Early fossil eukaryotes were benthic aerobes. Nature, 2026. Source for the roughly 1.75 to 1.4 Ga fossil eukaryotes being almost entirely restricted to oxygenated bottom water settings. https://www.nature.com/articles/s41586-026-10533-4
- Schneider et al. 2002, for the redating of Grypania to 1874 plus or minus 9 Ma. Full citation not verified.

Ethanol fermentation and its distribution among prokaryotes, Part 2, added 2026-08-06:
- Lehninger Principles of Biochemistry, 8th edition, for the two-step pyruvate decarboxylase and alcohol dehydrogenase route, its stoichiometry and its zero ATP yield. Already listed above as a primary reference and repeated here because this is the load-bearing source for the branch
- Lowe, S. E. and Zeikus, J. G. Purification and characterization of pyruvate decarboxylase from Sarcina ventriculi. Journal of General Microbiology, 1992. Source for a glycolytic Gram-positive anaerobe carrying pyruvate decarboxylase, which is the precedent act 1's organism rests on. Author list not independently verified
- Zymomonas mobilis fermenting to ethanol through the Entner-Doudoroff pathway at a net of 1 ATP per glucose. Covered by the Lehninger and Berg references above. The Zymomonas alcohol dehydrogenase paper already cited under Part 3 is a separate claim and is not the source for this one
- Escherichia coli reaching ethanol through pyruvate formate-lyase and AdhE rather than through a decarboxylase. Covered by the AdhE reference already cited under Part 3, which describes AdhE as bifunctional and acetyl-CoA dependent

Glycogen, Part 2, added 2026-08-06:
- Lehninger Principles of Biochemistry, 8th edition, for glycogen structure, glycogen phosphorylase using inorganic phosphate, the phosphoglucomutase step and the re-entry of glucose-1-phosphate past hexokinase
- Ballicora, M. A., Iglesias, A. A. and Preiss, J. ADP-glucose pyrophosphorylase, a regulatory enzyme for bacterial glycogen synthesis. Microbiology and Molecular Biology Reviews, 67(2), 2003. Source for the bacterial ADP-glucose route and for allosteric activation of the committed step by glycolytic intermediates
- Wilson, W. A. et al. Regulation of glycogen metabolism in yeast and bacteria. FEMS Microbiology Reviews, 34(6), 2010. Source for the reciprocal regulation of synthesis against degradation and for the breadth of glycogen across bacteria. Author list not independently verified

Flux control and the three regulated steps, Part 2, added 2026-08-06:
- Kacser, H. and Burns, J. A. The control of flux. Symposia of the Society for Experimental Biology, 27, 1973. The origin of control coefficients and of the summation theorem
- Fell, D. A. Metabolic control analysis: a survey of its theoretical and experimental development. Biochemical Journal, 286, 1992. Source for control being distributed across a pathway rather than held by one enzyme

Pyruvate carboxylase and anaplerosis, Part 5, added 2026-08-06:
- Jitrapakdee, S. et al. Structure, mechanism and regulation of pyruvate carboxylase. Biochemical Journal, 413(3), 2008. Source for the carboxylation using bicarbonate and 1 ATP and for the enzyme's anaplerotic role. Author list not independently verified
- Lehninger Principles of Biochemistry, 8th edition, for the three gluconeogenic bypasses and for phosphoenolpyruvate carboxykinase releasing the carbon that pyruvate carboxylase fixed

Verification status. Entries marked "not verified" have a confirmed title, journal, year and where given a URL, but the author list was not independently checked during the 2026-07-28 sourcing pass. Do not cite those author names in player-facing text without checking them. Nothing in this section was invented; unverified fields were stripped rather than guessed.

Verification status of the 2026-08-06 additions, stated separately because the pass was a different kind. The claims added on that date are textbook and review-level biochemistry rather than contested primary results, and every one of them is carried by the Lehninger and Berg references already at the head of this list. The named journal articles are given because a reader chasing the bacterial and control-analysis specifics should be sent somewhere better than a textbook, and where an author list was not independently checked the entry says so. **No URL was added in this pass**, because a guessed URL is worse than an absent one and none was confirmed. Nothing was invented.

Verification status of the 2026-08-24 additions, stated separately again because the pass had a different shape from both earlier ones. Part 4 gained the act 3 pathway detail: pyruvate transport, the pyruvate dehydrogenase complex in full, the eight TCA steps, the electron transport chain complex by complex with its proton counts, ATP synthase and its c-ring, both shuttles and their mechanisms, and the yield range with its five reasons. **Almost all of it is textbook stoichiometry and topology**, carried by the Lehninger and Berg references at the head of this list, and the named journal articles are given where a reader should be sent somewhere better than a textbook or where the claim is a specific measurement rather than general knowledge. Two entries have unverified fields and say so. **No number in this pass came from a game requirement.** The proton counts, the c-ring values and the yield band were written before any act 3 constant existed, which is the ordering CLAUDE.md hard rule 1 depends on and the reason this stage came first.

Citation discipline: every player-facing numeric claim needs a pointer into this section. If a number cannot be sourced, it does not ship.