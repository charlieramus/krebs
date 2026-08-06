# Progression

Last updated: 2026-08-06

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
3. Uptake capacity, a finite ladder of transport steps
4. Glycolytic capacity, a finite ladder raising both phases of glycolysis together
5. The three regulated glycolytic enzymes, sold by name, each raising the throughput of the phase it belongs to
6. NAD+ pool visibility
7. Lactate fermentation
8. Ethanol fermentation as an alternate branch, which releases carbon dioxide
9. Glycogen storage, a buffer against substrate scarcity, which costs ATP and produces none

**This list is ordered by dependency and not by the clock.** Items 6 and 7 are the NAD+ wall and its answer, and the wall arrives in the first seconds of the act, so they are reached long before items 3 to 5 are affordable. Nothing about the numbering says otherwise and the list has never claimed to.

Items 3 and 4 are the two capacity ladders. They are sequential rather than side by side, because both raise uptake and the second always raises it further.

**Item 5 is three enzymes and not ten, and it is throughput and not efficiency.** The wording was corrected on 2026-08-06 by UPDATELOGV10.md stage 1, having drifted in two ways. "Individual glycolytic enzymes" implied the pathway's ten steps, where the three worth selling are hexokinase, phosphofructokinase-1 and pyruvate kinase, which are the three regulated steps and the only three where flux control concentrates. See docs/SCIENCE.md Part 2, Regulation. And "efficiency upgrades" reads as yield, which contradicts the wall paragraph three lines below saying enzyme upgrades increase throughput and never yield. The rest of the pathway runs near equilibrium and follows its substrates, so an upgrade there would move nothing.

**Item 8 is a choice and not an upgrade, and it is the first one in the game.** Lactate and ethanol both regenerate NAD+ and neither yields any ATP, so neither branch is the right answer. What differs is what the cell is left holding: three carbons of lactate kept, or two carbons of ethanol and one carbon released as gas. Ethanol fermentation is therefore the first reaction in the game to release carbon from the cell, and the carbon it releases is a real product rather than a deletion. See docs/SCIENCE.md Part 2, "Carbon dioxide, and whether anything in this game consumes it".

**Item 9 is a buffer and a buffer is not a yield.** Storing glucose costs ATP, retrieving it produces none, and the round trip returns less than it took. It exists because act 1's environment is a finite pool that is never replenished, so a player who keeps going watches the food run out. It is the first unlock that rewards looking ahead rather than one more that makes a number larger.

**Item 4 raises both phases in one purchase and that is not a simplification, it is a constraint.** The preparatory phase spends ATP and the payoff phase makes it back, two trioses at a time, so a cell whose investment phase is raised without the phase that pays it back spends itself into a state it cannot restart from. Selling them separately would mean shipping a purchasable configuration that kills the player's cell. The ratio at which that happens was measured by UPDATELOGV5.md stage 3 and the numbers are in docs/ECONOMY.md, not here.

The teaching beat: NAD+ is the wall. Glycolysis consumes NAD+ and the cell has a finite pool, so without a way to regenerate it the whole pathway stalls regardless of how much glucose is available. Fermentation produces no additional ATP. Its entire function is recycling NAD+ so glycolysis can keep running. Most players arrive expecting fermentation to be an energy upgrade and it is not.

The wall: 2 ATP per glucose is a hard ceiling in this act. It cannot be upgraded past. Enzyme upgrades increase throughput, never yield. The player should feel the ceiling clearly before act 2 opens.

Target duration: 45 to 90 minutes.

## Act 2: The oxygen crisis

Trigger: oxygen begins accumulating in the environment. Player does not cause this and cannot stop it.

Setting: the Great Oxidation Event, roughly 2.4 billion years ago.

This act inverts the normal idle-game expectation. A new resource appears and it damages you. Oxygen concentration rises on a fixed schedule independent of player action, reactive oxygen species scale with it and ROS degrade enzymes the player has already bought. Production falls. The player watches numbers go down for the first time.

Two damage mechanisms, not one. Reactive oxygen species and molecular oxygen itself are separate threats with separate targets, and the antioxidant enzymes only address the first. Superoxide and hydrogen peroxide inactivate cluster-dependent dehydratases and poison mononuclear iron enzymes by mismetallation. Molecular oxygen inactivates a different set, including pyruvate:ferredoxin oxidoreductase and pyruvate:formate lyase, at a rate that does not depend on superoxide or peroxide levels at all. See docs/SCIENCE.md Part 3.

That split is the act's structure. Superoxide dismutase and catalase buy the player a visible win against the first mechanism and do nothing whatsoever against the second, so the player discovers that some damage cannot be defended against, only routed around by replacing the vulnerable enzyme with different chemistry. That is the actual reason obligate anaerobes are obligate: the anaerobic competence and the oxygen sensitivity are the same property.

The target inside act 1's own loop is glyceraldehyde-3-phosphate dehydrogenase, damaged by thiol oxidation rather than by cluster destruction. Glycolysis contains no iron-sulfur enzymes, which is true and misleading: GAPDH is among the most oxidant-sensitive enzymes in the cell, and it is the step that produces NADH. The crisis therefore lands on the NAD+ wall the player spent act 1 learning to work around, rather than beside it.

Unlock order:
1. ROS damage becomes visible, initially as unexplained enzyme degradation
2. Superoxide dismutase
3. Catalase
4. Dps, an iron-sequestering mini-ferritin induced under oxidative stress, which lowers free iron and therefore suppresses Fenton chemistry
5. Glutathione and peroxiredoxin systems
6. Iron-sulfur cluster repair, with the Suf backup assembly system for when the primary Isc system is itself peroxide-inactivated
7. Manganese substitution in mononuclear iron enzymes, defense by substitution rather than by scavenging
8. Isozyme replacement, swapping a vulnerable iron-dependent enzyme for one that does not use iron
9. Oxygen tolerance thresholds
10. Aerotolerance, which converts oxygen from pure hazard to neutral

Unlocks 2 to 5 address ROS. Unlocks 6 to 8 are the answer to the second mechanism and to damage that outruns repair, and 6 is a repair mechanic with its own failure mode rather than a flat damage reduction.

The GAPDH damage is not purely destructive and the payoff is worth building. Inactivation acts as a redox switch: shutting down glycolytic flux reroutes carbon into the oxidative pentose phosphate pathway, which makes the NADPH that the glutathione and thioredoxin systems run on. The pathway does not just break under stress, it reroutes, and the player trades ATP yield for antioxidant capacity through a mechanism the cell actually uses.

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
