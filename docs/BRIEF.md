# Brief

Last updated: 2026-07-27
Working title: TBD, see naming shortlist
Status: pre-code, tier 1 documentation complete

The short orientation doc. Read this first. It gives the idea and the reasoning behind it. Everything operational lives in the other docs.

---

## The idea

An idle simulation of cellular energy metabolism. You run a single cell. It starts as an anaerobic prokaryote roughly three and a half billion years ago and ends as a eukaryote with mitochondria and full aerobic respiration.

ATP is the currency. Enzymes are the upgrades. Metabolic pathways are the production chains. Glucose comes in, gets broken down and energy comes out.

The game is finite. Six to ten hours to completion, then it ends.

## Why this works

Idle games run on resources, production chains and multipliers. Metabolism already is exactly that, with real numbers.

Glycolysis nets two ATP per glucose. Unlock the mitochondrion and full aerobic respiration and you get roughly thirty. That is a fifteen times multiplier and nobody invented it for balance reasons. It is just true.

The same holds throughout. Enzymes saturate, so doubling substrate stops doubling output past a certain point, which is a real diminishing-returns curve rather than a designer's throttle. NAD+ is a small fixed pool that glycolysis consumes, so without a recycling mechanism the whole pathway stalls no matter how much glucose is available, which is a real bottleneck rather than an artificial gate.

The central claim of the project is that the economy is not invented. It is surfaced.

## The four acts

**Act 1, substrate-level phosphorylation.** Anaerobic. Glycolysis and fermentation. Hard ceiling at two ATP per glucose that cannot be upgraded past. You are supposed to feel the ceiling.

The teaching beat: fermentation produces no additional energy. Its entire job is recycling NAD+ so glycolysis can keep running. Most people expect it to be an energy upgrade and it is not.

**Act 2, the oxygen crisis.** Oxygen begins accumulating and it damages you. This is the Great Oxidation Event, roughly 2.4 billion years ago, and for most life at the time it was a mass extinction. Production falls. You spend on antioxidant defenses before you get any benefit from oxygen at all.

The teaching beat: oxygen was a poison before it was fuel. Aerobic respiration is not the obvious next rung on a ladder, it is opportunistic exploitation of something life spent hundreds of millions of years learning to survive.

**Act 3, endosymbiosis.** An alphaproteobacterium enters the cell and stays. This is the one irreversible transition in the game. You gain a compartment with a membrane potential across it, unlock the TCA cycle and the electron transport chain, and yield per glucose jumps from two to roughly thirty.

The teaching beat: chemiosmosis. Electron transport does not make ATP, it pumps protons. The gradient makes ATP. It is the least intuitive idea in the whole game, so the mechanics force you to build the gradient before you can spend it.

**Act 4, regulation and substrate breadth.** No structural change. Fats via beta oxidation, amino acids with nitrogen disposal as a real cost, allosteric control, metabolic flexibility. You win by maintaining stable output across a randomized substrate supply without intervening.

The teaching beat: efficiency stops being the goal and control becomes the goal.

## What makes it different from other science games

Every quantitative claim in player-facing text traces to a cited source. Where the science is contested the game says so rather than picking a side. Whether mitochondria arrived early and drove eukaryotic complexity or arrived after an already-complex host is genuinely unsettled as of 2026, with recent papers pointing both directions, and the game states that openly.

The ATP-per-glucose number is a good example of the approach. Older textbooks say thirty-six to thirty-eight. Current values give roughly thirty to thirty-two, and published estimates range from about twenty-nine to thirty-two depending on assumptions. The game shows both figures and explains the discrepancy rather than quietly picking one.

Reaction rates use the Michaelis-Menten saturation curve, which is real. The specific speed values are tuned for playability and are not laboratory measurements, and the game says that on first launch rather than burying it. Every place the game departs from reality for pacing gets recorded in a divergence table in the repo.

That is the whole posture. Accurate where it can be, explicit about where it is not.

## What it refuses to be

No ads, no monetization, no engagement mechanics. Nothing exists to extend session length.

No prestige treadmill and no infinite scaling. The reference point for this genre scores well on teaching and poorly on grind, and the grind exists because ads pay for playtime. That constraint does not apply here so the grind does not get inherited.

Not an evolution game. Scope is metabolism inside one cell. Multicellularity, ecology and the tree of life are out.

Not a research tool. Nobody should make a lab decision based on it and it says so.

## Who it is for

Primary: high school and undergraduate biology students who have been told to memorize that glycolysis yields two ATP and have no intuition for why that matters.

Secondary: biology teachers looking for a unit supplement.

Tertiary: people who like idle games and will absorb real biochemistry as a side effect.

## Success conditions

In priority order:

1. A biology teacher uses it with a class.
2. A player finishes and can correctly explain why aerobic respiration yields roughly fifteen times more ATP than fermentation.
3. Someone with a biochemistry background reviews it and does not find an error.
4. Play counts.

Condition 3 outranks condition 4 deliberately. A popular game teaching something wrong is a worse outcome than an accurate game nobody plays.

## Technical shape

TypeScript, React, Vite, Tailwind. Vitest. Deployed to Cloudflare Pages. Offline-first with no backend, no accounts and no network dependency for core play.

Fixed twenty hertz simulation timestep decoupled from render. Determinism is a tested property, with a seeded PRNG and a state hash comparison in CI.

Offline progress is the interesting engineering problem. Replaying eight hours of absence tick by tick is too slow, and the coupled nonlinear kinetics have no closed-form solution to integrate. The approach exploits the fact that metabolism is homeostatic: replay at full fidelity until the system reaches steady state, which is bounded and cheap, then jump forward analytically to the next discrete event that invalidates it, recompute and repeat. Cost scales with the number of events rather than the length of the window. The subject matter justifies the algorithm.

## Visual direction

Undecided as of this writing. Current instinct is cartoony and warm rather than clinical, on the reasoning that a sterile interface undersells it for the primary audience.

The constraint to hold: illustration can be warm, numbers cannot. Anything quantitative stays typographically precise, tabular figures and all, because the project's credibility rests on being read as rigorous. Warm frame, exact numbers.

To be worked out in mockups.

## Where to go next

- docs/PILLARS.md for the scope contract
- docs/SCIENCE.md for biology ground truth, citations and modeling methodology
- docs/PROGRESSION.md for act structure and unlock order
- docs/SIMULATION.md for engine math
- docs/SAVE_SCHEMA.md for the data contract

Immediate next step is a vertical slice, not more documentation. Tick loop, one pool, glycolysis, the NAD+ constraint and fermentation, with no UI polish. That tests the two assumptions the project rests on: whether saturating kinetics feel like a game, and whether the NAD+ wall reads as interesting rather than annoying.
