# Pillars

Last updated: 2026-07-27

The scope contract for this project. If a proposed feature conflicts with anything here, the feature loses. Read this before proposing new systems.

## What this is

An idle simulation of cellular energy metabolism. The player runs a single cell, starting as an anaerobic prokaryote and ending as a eukaryote with mitochondria and full aerobic respiration. ATP is the currency. Enzymes are the upgrades. Metabolic pathways are the production chains.

The central claim of the project is that the game economy is not invented. Cellular metabolism already is a resource economy with real yields, real bottlenecks and real diminishing returns, and the game surfaces that structure rather than decorating it.

## Non-negotiable rules

1. Finite. The game ends. Target 6 to 10 hours to completion. There is no infinite scaling layer past the ending.

2. No ads, no monetization, no engagement mechanics. Nothing in the design may exist to extend session length.

3. Education is the reward, not the wrapper. Unlocks deliver real biology. If a mechanic teaches nothing, it needs a separate justification to exist.

4. Every quantitative claim in player-facing text traces to a source in docs/SCIENCE.md. No number appears in the UI that nobody can defend.

5. Where the game departs from reality for playability, the departure gets recorded in the divergence table in docs/ECONOMY.md. Silent fudging is the failure mode this project is built to avoid.

6. Where the underlying science is genuinely contested, the game says so rather than picking a side and presenting it as settled.

7. Offline-first. No account, no backend, no network dependency for core play.

## What this refuses to be

Not an infinite incremental. No prestige treadmill. The reference game for this project scores well on its teaching and poorly on its grind, and the grind exists because ads pay for playtime. That constraint does not apply here, so the grind does not get inherited.

Not an evolution game. The scope is metabolism inside one cell. Multicellularity, ecology, organisms and the tree of life are all out. Cell to Singularity already owns evolution-idle and has an art budget this project does not.

Not a tardigrade game. Extremophile survival is a different project.

Not a research tool. Nobody should make a lab decision based on output from this. It is a teaching model and it says so.

Not a clicker. Clicking may exist as a small early-game affordance. It is never the optimal strategy at any point.

## Success conditions

In priority order:

1. A biology teacher uses it with a class.
2. A player finishes the game and can correctly explain why aerobic respiration yields roughly fifteen times more ATP than fermentation.
3. Someone with a biochemistry background reviews it and does not find an error.
4. Play counts.

Note that 3 outranks 4. A popular game teaching something wrong is a worse outcome for this project than an accurate game nobody plays.

## Related docs

- docs/SCIENCE.md for biological ground truth and modeling methodology
- docs/PROGRESSION.md for the content spine and act structure
- docs/SIMULATION.md for engine math and determinism requirements
- docs/SAVE_SCHEMA.md for the frozen data contract
- docs/ECONOMY.md for tuned game numbers and the divergence table
