# Science

Last updated: 2026-07-27

Biological ground truth for the project. Every quantitative claim in player-facing text traces back to this document.

This doc contains no game numbers. It describes reality. Tuned values live in docs/ECONOMY.md, and every place the game departs from what is written here gets recorded in the divergence table in that file.

Stability note: this document changes only when the underlying science changes or an error is found. It does not get edited during balance passes. If a balance pass wants a different number, that number goes in ECONOMY.md with a divergence entry.

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

To be filled in as balance decisions are made. Each entry needs the real value, the game value and the pacing reason. Cross-referenced with the divergence table in docs/ECONOMY.md.

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

## The NAD+ constraint

Glycolysis reduces NAD+ to NADH at step 6. The cellular NAD+ pool is small and fixed. If NADH is not reoxidized back to NAD+, glycolysis halts within seconds regardless of glucose availability.

This is the single most important mechanic in act 1 and it is a genuine cellular constraint rather than a game invention.

## Fermentation

Fermentation exists to regenerate NAD+. It produces zero additional ATP. Framing it as an energy pathway is a common misconception and the game should correct it directly.

Lactate fermentation, one step. Lactate dehydrogenase reduces pyruvate to lactate, oxidizing NADH back to NAD+.

Ethanol fermentation, two steps. Pyruvate decarboxylase removes CO2 to give acetaldehyde, then alcohol dehydrogenase reduces acetaldehyde to ethanol, oxidizing NADH.

Both give a net of 2 ATP per glucose overall, which is the act 1 ceiling.

---

# Part 3: Act 2 science, the oxygen crisis

## The Great Oxidation Event

Oxygenic photosynthesis in cyanobacteria began producing free oxygen well before it accumulated in the atmosphere. Early oxygen was absorbed by chemical sinks, most significantly dissolved ferrous iron in the oceans, which precipitated as iron oxides and produced the banded iron formations found throughout Archean rock.

Atmospheric oxygen rose substantially around 2.4 to 2.45 billion years ago. Sources vary on whether to treat this as a relatively rapid event or a protracted transition spanning 2.4 to 2.0 billion years ago, and the game should give the range rather than a single date. Banded iron formations largely disappear from the record after roughly 2.4 billion years ago, which is the key line of evidence.

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

Superoxide preferentially attacks solvent-exposed iron-sulfur clusters in enzymes. Aconitase, a TCA cycle enzyme, is a classic target. Modeling ROS damage as preferentially hitting iron-sulfur enzymes is mechanistically correct and gives players a legible pattern to reason about.

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

## Pyruvate oxidation

The link reaction, in the mitochondrial matrix. The pyruvate dehydrogenase complex converts pyruvate to acetyl-CoA.

Per pyruvate: 1 NADH, 1 CO2, 1 acetyl-CoA. Two pyruvate per glucose, so 2 NADH.

Irreversible in animals. This is the commitment point past which carbon cannot return to glucose, which matters for gluconeogenesis in act 4.

## TCA cycle

Mitochondrial matrix. Eight steps.

Per turn:
- 3 NADH
- 1 FADH2
- 1 GTP, energetically equivalent to ATP
- 2 CO2

Two turns per glucose, so 6 NADH, 2 FADH2, 2 ATP equivalents.

Regulated at citrate synthase, isocitrate dehydrogenase and alpha-ketoglutarate dehydrogenase, all responsive to the cell's energy state.

The cycle is amphibolic. Intermediates feed biosynthesis as well as energy production, which is the hook for amino acid catabolism in act 4.

## Oxidative phosphorylation and chemiosmosis

The conceptual center of the game.

Electron transport does not produce ATP. Complexes I, III and IV pass electrons from NADH and FADH2 down an energetic gradient to oxygen, and use the released energy to pump protons across the inner mitochondrial membrane. Complex II accepts electrons from FADH2 and does not pump.

The result is an electrochemical proton gradient. ATP synthase, complex V, allows protons back across and uses that flow to phosphorylate ADP.

Peter Mitchell proposed the chemiosmotic mechanism in 1961 and received the Nobel Prize in 1978. It was considered implausible for years, which is worth mentioning.

Oxygen is the terminal electron acceptor. Its only role is accepting spent electrons at the end of the chain. Without it the chain backs up, NADH cannot be reoxidized and the entire system stops. Every one of those roughly 30 ATP depends on that final step.

## ATP yield: state the range

Older textbooks give 36 to 38 ATP per glucose using integer P/O ratios of 3 for NADH and 2 for FADH2. Those integer values were revised on experimental grounds. Current values are approximately 2.5 ATP per NADH and 1.5 per FADH2, giving roughly 30 to 32 ATP per glucose. Published estimates range from about 29 to 32 depending on assumptions, including the number of c subunits in the ATP synthase rotor.

The remaining 2 ATP of spread comes from shuttle choice. Cytosolic NADH from glycolysis cannot cross the inner mitochondrial membrane directly.

The malate-aspartate shuttle regenerates NADH inside the matrix, which enters at complex I, yielding about 2.5 ATP per cytosolic NADH. Total roughly 32.

The glycerol phosphate shuttle transfers electrons to FAD, producing FADH2, which enters at complex II and bypasses one pumping site, yielding about 1.5 ATP. Total roughly 30.

This is why act 3 offers the shuttle as a real choice with a real tradeoff. Speed against yield.

Accounting per glucose, using modern ratios and the malate-aspartate shuttle:
- Glycolysis: 2 ATP direct, 2 NADH
- Pyruvate oxidation: 2 NADH
- TCA: 2 ATP equivalents, 6 NADH, 2 FADH2
- Totals: 4 ATP direct, 10 NADH, 2 FADH2
- 10 NADH at 2.5 = 25
- 2 FADH2 at 1.5 = 3
- Sum: 32

The game should show both totals and explain the discrepancy rather than picking one silently. Note also that these are theoretical maxima. Real cells lose output to proton leak and transport costs, so actual yield is lower still.

## The multiplier

Fermentation gives 2 ATP per glucose. Aerobic respiration gives roughly 30. That is about fifteen times, and it is the emotional payoff of act 3.

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

Costs more ATP than glycolysis yields. Running both simultaneously produces a futile cycle that burns ATP for nothing, which is why reciprocal regulation exists and is a real regulatory failure mode worth modeling.

## Regulation as the act 4 theme

Allosteric control, where the product of a pathway inhibits an upstream enzyme.

Reciprocal regulation, where opposing pathways are controlled by the same signals in opposite directions.

Compartmentalization, where separating pathways into different organelles allows incompatible conditions to coexist and prevents futile cycling.

Energy charge, where the ratio of ATP to ADP and AMP acts as a master regulatory signal across the whole network.

---

# Part 6: Known unknowns

Surface these in-game. They demonstrate that the science is live rather than finished.

1. Whether mitochondria came early and drove eukaryotic complexity or arrived after a host that was already complex. Actively disputed, with recent papers on both sides.
2. The exact ATP yield per glucose. Depends on assumptions that are not fully settled, including ATP synthase rotor stoichiometry.
3. The precise duration and pace of the Great Oxidation Event.
4. Why oxygenic photosynthesis evolved several hundred million years before atmospheric oxygen accumulated, and whether the delay is fully explained by chemical sinks.
5. The origin of glycolysis itself, which predates the last universal common ancestor and has no accessible fossil record.

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

Citation discipline: every player-facing numeric claim needs a pointer into this section. If a number cannot be sourced, it does not ship.
