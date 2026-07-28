# Progression

Last updated: 2026-07-27

The content spine. Defines acts, unlock order, gating and the single major transition. This doc determines the shape of the data model, so it is settled before engine code gets written.

This doc contains no tuned numbers. Real biological values live in docs/SCIENCE.md. Game-balanced values live in docs/ECONOMY.md once a prototype exists.

## Structural decision: one hard transition, not a prestige loop

Repeatable prestige resets are rejected. See docs/PILLARS.md rule 1.

The replacement is the major evolutionary transition: a one-way structural change to the cell that is never undone. Some capabilities are lost, a fundamentally different architecture is gained and the economy rescales because the biology rescaled.

Multicellularity was cut from scope on 2026-07-27. That was the second candidate transition, so the game now has exactly one hard transition: endosymbiosis, at the act 2 to act 3 boundary. No filler transition has been invented to replace it.

This leaves three distinct beat types:

- Crisis, at the start of act 2. The environment turns hostile. Nothing resets. The player must spend on defense before they can spend on growth.
- Transition, at the act 2 to act 3 boundary. One-way. Architecture changes.
- Refinement, throughout act 4. No structural change, increasing regulatory sophistication.

Risk to watch in playtesting: with a single reset, act 4 has to carry its own pacing without a transition beat to lean on. If act 4 drags, the fix is cutting act 4 content, not adding a second reset.

## Act 1: Substrate-level phosphorylation

Setting: anaerobic prokaryote, roughly 3.5 billion years ago. No oxygen. No organelles.

Core loop: glucose in, glycolysis, 2 ATP net out.

Unlock order:
1. Glucose uptake
2. Glycolysis, unlocked as a single pathway initially, then decomposed into the preparatory and payoff phases
3. Individual glycolytic enzymes as efficiency upgrades
4. NAD+ pool visibility
5. Lactate fermentation
6. Ethanol fermentation as an alternate branch
7. Glycogen storage, a buffer against substrate scarcity

The teaching beat: NAD+ is the wall. Glycolysis consumes NAD+ and the cell has a finite pool, so without a way to regenerate it the whole pathway stalls regardless of how much glucose is available. Fermentation produces no additional ATP. Its entire function is recycling NAD+ so glycolysis can keep running. Most players arrive expecting fermentation to be an energy upgrade and it is not.

The wall: 2 ATP per glucose is a hard ceiling in this act. It cannot be upgraded past. Enzyme upgrades increase throughput, never yield. The player should feel the ceiling clearly before act 2 opens.

Target duration: 45 to 90 minutes.

## Act 2: The oxygen crisis

Trigger: oxygen begins accumulating in the environment. Player does not cause this and cannot stop it.

Setting: the Great Oxidation Event, roughly 2.4 billion years ago.

This act inverts the normal idle-game expectation. A new resource appears and it damages you. Oxygen concentration rises on a fixed schedule independent of player action, reactive oxygen species scale with it and ROS degrade enzymes the player has already bought. Production falls. The player watches numbers go down for the first time.

Unlock order:
1. ROS damage becomes visible, initially as unexplained enzyme degradation
2. Superoxide dismutase
3. Catalase
4. Iron sequestration, which reduces Fenton chemistry
5. Glutathione and peroxiredoxin systems
6. Oxygen tolerance thresholds
7. Aerotolerance, which converts oxygen from pure hazard to neutral

Damage should target iron-sulfur cluster enzymes preferentially, which is both mechanistically correct and produces a legible failure pattern the player can reason about.

Superseded 2026-07-28. The act 2 player has no TCA cycle and therefore no aconitase, and glycolysis contains no iron-sulfur enzymes, so as written this specifies damage to enzymes the player does not own. See SCIENCE.md Part 3, "Damage targets the act 2 player actually has", for the targets that do apply, for the distinction between ROS-mediated and direct oxygen damage which the unlock list above does not currently model, and for four additional defenses that belong in this list.

The teaching beat: oxygen was a mass extinction before it was fuel. Aerobic respiration is not the obvious next step up a ladder, it is an opportunistic exploitation of a poison that life spent hundreds of millions of years learning to survive.

Ends when the player is fully aerotolerant. They can now survive oxygen and still cannot use it.

Target duration: 90 to 150 minutes.

## Act 3: Endosymbiosis

The single hard transition.

Trigger: an alphaproteobacterium enters the cell. Player choice to keep or digest it, with keeping as the only path forward. Digesting gives a large one-off ATP payout and a soft lock, which is a deliberate teaching moment about short-term versus structural gains. Provide an undo on this one decision.

What is lost at the transition: some direct-control upgrades. The endosymbiont is a separate entity with its own genome and the player does not have full authority over it initially.

What is gained: a compartment with a membrane potential across it, which is the prerequisite for everything in the rest of the game.

Unlock order:
1. Pyruvate transport into the new compartment
2. Pyruvate dehydrogenase complex
3. TCA cycle, initially as one unit, then decomposed
4. Electron transport chain, complexes acquired in sequence
5. ATP synthase
6. NADH shuttle systems, presented as a real choice between the malate-aspartate and glycerol phosphate shuttles with different yields
7. Endosymbiotic gene transfer, moving genes to the host genome to regain control
8. Mitochondrial replication, scaling the number of mitochondria

The teaching beat: chemiosmosis. Electron transport does not make ATP. It pumps protons. The gradient makes ATP. This is the single least intuitive idea in the whole game and the mechanics should force the player to build the gradient before they can spend it, so the two-step structure is felt rather than read.

The payoff: yield per glucose goes from 2 to roughly 30. That multiplier is real and it is the emotional peak of the game.

Target duration: 120 to 180 minutes.

## Act 4: Regulation and substrate breadth

No structural transition. Increasing sophistication.

Two threads run in parallel.

Substrate breadth:
1. Beta oxidation, fatty acids as a high-yield slow-burn substrate
2. Amino acid catabolism, which introduces nitrogen as a waste product requiring disposal
3. Gluconeogenesis, running the pathway backwards at a cost
4. Substrate switching under varying supply

Regulation:
1. Allosteric control of PFK-1
2. Feedback inhibition across pathways
3. Compartment-specific conditions
4. Metabolic flexibility, automatic switching based on availability

The teaching beat: efficiency stops being the goal and control becomes the goal. Fat yields far more ATP per gram than glucose but mobilizes slowly, so the correct strategy depends on demand profile rather than raw yield. This act should feel like managing a portfolio rather than climbing a ladder.

Win condition: the player runs a cell that maintains stable ATP output across a randomized substrate availability sequence without manual intervention. Metabolic homeostasis, not a number threshold.

Target duration: 150 to 240 minutes.

## Endgame

On completion: a summary of what was built, the real timeline it maps to, the full source list and an explicit statement of what the model simplified. Then a sandbox mode with all unlocks available and adjustable environmental parameters. No score chase, no ascension layer.

## Gating rules

- Acts are strictly sequential.
- Within an act, unlocks may open in parallel branches but every branch must complete before the act boundary.
- Nothing is gated behind real-world elapsed time. Offline accumulation is a convenience, never a requirement.
- No unlock is gated behind a random drop.

## Open questions for prototype

- Does act 2 feel like a compelling crisis or like an unfair difficulty spike? Highest-risk beat in the game.
- Is act 4 self-sustaining without a transition beat, or does it need cutting?
- Should the shuttle choice in act 3 be permanent or switchable?
- Where does the tutorial end and the game begin?
