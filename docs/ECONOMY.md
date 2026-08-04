# Economy

Last updated: 2026-08-03

Tuned game numbers and the divergence table.

## What this document is

This is the record required by docs/PILLARS.md rule 5: where the game departs from reality for playability, the departure gets recorded here. It is also the place CLAUDE.md hard rule 2 sends balance numbers, so that docs/SCIENCE.md never has to carry one.

Every tuned number in the project has a row below. A tuned number is a number nobody sourced, that the game needs anyway, and that a balance pass may move. They live in exactly three files and nowhere else:

    src/content/act1/tuning.ts    14
    src/ui/tuning.ts              19
    src/save/tuning.ts             1
                                  --
                                  34

## What this document is not

It is not a design document. It says what the numbers are and why they are what they are, and it does not argue for the act they sit in. docs/PROGRESSION.md owns the content spine and this document does not restate it.

**No number in this document may be cited as biology.** That is the entire reason it is a separate file from docs/SCIENCE.md. A number here has one of two statuses and neither of them is sourced:

    DEPARTURE   a number standing where a real quantity could have stood, that
                does not match it. ACT1_NICOTINAMIDE_TOTAL is one. That the
                nicotinamide pool is small and fixed is sourced. How small is
                ours.

    UNSOURCED   a number with no real counterpart at all. DASH_LENGTH is one. A
                dash and gap length in pixels is not a departure from anything,
                because nothing was ever claimed.

The distinction matters and it is the reason the table has a column that is sometimes empty. Rule 5 says departures get recorded. It does not say invent a departure for a number that never departed from anything, and a plausible sentence in the real behaviour column of an UNSOURCED row would be the exact failure this table exists to prevent.

Of the 34 rows, **22 are DEPARTURE and 12 are UNSOURCED**.

## How to read a row

    | Id | Value | Where | The real behaviour | What the game does instead | Why | Introduced |

`Id` is stable and permanent. Later logs cite rows by id. A row that is removed retires its id rather than freeing it for reuse.

`Where` names the exported constant, which is the machine-readable half of the row. `The real behaviour` is cited to docs/SCIENCE.md where the science says anything at all and is left empty where it says nothing.

The table is split by file. The file is the unit the debt was tracked in, and repeating a path down a column thirteen times is noise rather than information.

---

# The divergence table

## src/content/act1/tuning.ts

Fourteen numbers, all DEPARTURE. Every one of them is a rate, a pool size or a kinetic exponent, which is to say every one of them stands where a real quantity could have stood.

Two facts from docs/SCIENCE.md Part 1 apply to all thirteen and are not repeated in every row. First, literature Km and Vmax values are deliberately not used, because they vary by an order of magnitude across organism, tissue, pH, temperature and assay method, and presenting one as authoritative would be less honest than using none. Second, game time does not map to any real timescale, so no absolute rate below has a real counterpart to be compared against. **What is being claimed by these numbers is their ordering, not their magnitude.**

| Id | Value | Where | The real behaviour | What the game does instead | Why | Introduced |
| --- | --- | --- | --- | --- | --- | --- |
| C1 | 8 | `ACT1_VMAX.uptake` | Bacterial glucose import runs through specific transporters at specific costs. docs/SCIENCE.md Part 1, "Glucose uptake is modeled as untyped transport" | 8 pool units per game-second, no transporter named, no energetic cost charged | Deliberately the slowest step, so the pathway is substrate-limited from the top and every downstream step sits at whatever saturation matches its supply. This is what lets a real constraint show up as a constraint rather than be masked by an arbitrary ceiling elsewhere | V2 stage 3 |
| C2 | 12 | `ACT1_VMAX.prep` | Preparatory phase steps 1 to 5, five enzymes with five rates. docs/SCIENCE.md Part 2, Glycolysis | One rate for the whole phase | Sets the knee of the uptake capacity ladder. Uptake above 12 delivers glucose the preparatory phase cannot consume, which is why U7 is the last rung | V2 stage 3 |
| C3 | 26 | `ACT1_VMAX.payoff` | Payoff phase steps 6 to 10. docs/SCIENCE.md Part 2, Glycolysis | One rate for the whole phase | Above twice `prep` because the preparatory phase hands it two trioses per glucose, so two payoff turns run per prep turn. Realized payoff flux never exceeds 21.109 at the top of the ladder, measured 2026-08-03, so the headroom is real rather than nominal | V2 stage 3 |
| C4 | 26 | `ACT1_VMAX.ferment` | Lactate dehydrogenase, one step. docs/SCIENCE.md Part 2, Fermentation | Matches `payoff` | Fermentation must never be the bottleneck itself, or the act teaches that lactate dehydrogenase is slow instead of that it buys throughput and no yield | V2 stage 3 |
| C5 | 50 | `ACT1_VMAX.maintain` | ATP hydrolysis to ADP and phosphate is real stoichiometry. That a cell does it at one saturating rate in ATP is not: this one reaction stands in for the entire rest of cellular metabolism | 50, running at 32 to 45 percent of Vmax at steady state, measured 2026-08-03 | Sized so it can consume the whole net ATP production of the pathway. If it could not, ATP piles up against the fixed adenylate total, ADP runs out, and glycolysis stalls on the adenylate ceiling instead of on NAD+, which puts the wrong wall in front of the player. **Measured 2026-08-03 rather than left as an argument**: at a maintain half-saturation of 100 the cell reaches an ATP per second of 0.333 instead of 31.795 and 2617 glucose piles up unusable, which is that failure exactly | V2 stage 3 |
| C6 | 500 | `ACT1_KM.uptake` | An enzyme has a separate Km per substrate, commonly differing by orders of magnitude. docs/SCIENCE.md Part 1, "One Km per reaction, shared across all of its substrates" | One Km per reaction, applied to whichever substrate is limiting | Large only because the pool it draws on is large. It keeps uptake near saturation while the environment is far above 500, which is what makes drain roughly linear at Vmax and makes C13 a calculable number rather than a guess | V2 stage 3 |
| C7 | 4 | `ACT1_KM.prep` | As C6. This one is the Hill K rather than a Michaelis-Menten Km, which is the same quantity playing the same role | 4 | Low against the intracellular glucose the uptake step delivers, so the preparatory phase is not itself the first thing a player meets | V2 stage 3 |
| C8 | 2 | `ACT1_KM.payoff` | As C6 | 2 | Has to sit well below `ACT1_NICOTINAMIDE_TOTAL`, because NAD+ is one of the four substrates of this reaction and a Km near the whole pool size would mean the payoff phase never approaches Vmax even with the carrier fully oxidised. C12 and this number cannot be read in isolation from each other | V2 stage 3 |
| C9 | 2 | `ACT1_KM.ferment` | As C6 | 2 | Mirrors C8, for the same reason and against the same pool | V2 stage 3 |
| C10 | 12, was 20 | `ACT1_KM.maintain` | As C6, over a reaction that is a modeling convenience to begin with. See C5. It is a Hill K rather than a Michaelis-Menten Km since 2026-08-03 | 12 | **Derived, not picked, and it moved as one edit with C14.** K is chosen so the new Hill curve passes through the same point as the old Michaelis-Menten one at act 1's measured steady-state ATP of 9.323: K³ = a³(Km/a) = 1738.5, K = 12.02. At 12 the steady-state ATP moves from 9.323 to 9.304, a fifth of a percent, and nothing else in the healthy economy moves at all. The old value of 20 was swept from 5 to 500 first and no value of it repairs the trap, which is the measurement that ruled out the one-number answer | V2 stage 3 at 20, derived to 12 in V5 stage 2 |
| C11 | 2 | `ACT1_HILL_N` | PFK-1 shows cooperative sigmoidal kinetics and is the committed step of the pathway. docs/SCIENCE.md Part 2, Regulation. **No Hill coefficient is stated anywhere in docs/SCIENCE.md** | n = 2, carried by the whole preparatory phase rather than by PFK-1 alone | 2 is the smallest value that produces a sigmoid at all and nothing has measured what act 1 wants. Integer because docs/SIMULATION.md Part 5 bans Math.pow. The attachment is a second departure, disclosed in `reactions.ts`: correct about which enzyme is cooperative, wrong about what the cooperativity is attached to, and it moves onto PFK-1 alone when the phase is decomposed into ten enzymes | V2 stage 3 |
| C12 | 30, was 10 | `ACT1_NICOTINAMIDE_TOTAL` | **Sourced: the pool is small and fixed, and glycolysis halts within seconds if NADH is not reoxidised regardless of glucose availability.** docs/SCIENCE.md Part 2, The NAD+ constraint. Not sourced: how small | 30 units, all NAD+ at t=0, so the wall is approached rather than started at | At 10 the pathway stalled at roughly 1.7 game-seconds: the payoff phase peaked and died in the same breath, so there was no interval in which a player could see a working cell to lose. At 30 it reaches full flux, holds, then decays, which is a stall rather than a failure to launch. **It also fixes the walled cumulative ATP ceiling at exactly 60**, since each NAD+ yields its 2 ATP once and never again, and that ceiling is the hard upper bound on U4 | V2 stage 3 at 10, raised to 30 in V2 stage 4 |
| C13 | 80000, was 10000 | `ACT1_GLUCOSE_ENV_INITIAL` | Not covered by docs/SCIENCE.md. A prokaryote of this period sits in a resupplied medium rather than a finite jar, so a closed unreplenished pool is a departure from the informal picture rather than from a sourced number. Replenishment was rejected on mechanism: a reaction with no substrates manufactures carbon from nothing and breaks conservation on its first tick | 80000, finite, never replenished | **It was raised to hide a defect, the defect is repaired, and it is kept for a different reason that was measured rather than assumed.** The environment should outlast the act rather than define it, and docs/PROGRESSION.md gives act 1 45 to 90 minutes. Measured 2026-08-03 after the repair, the food lasts 126.7 minutes for a player who buys everything and 179.0 minutes for one who buys nothing, so 80000 clears the 90 minute end at every playstyle. The old 10000 runs dry at 21.0 and 31.0 minutes, inside the act at both, so it is wrong on pacing and not only on safety | V2 stage 3 at 10000, raised to 80000 in V3 stage 6, kept on pacing grounds in V5 stage 2 |
| C14 | 3 | `ACT1_MAINTAIN_HILL_N` | Nothing. docs/SCIENCE.md says nothing about a maintenance reaction, because `maintain` is not a glycolytic step. **A real cell can be too ATP-poor to start glycolysis and really does die that way** | Maintenance is Hill of order 3 in ATP rather than Michaelis-Menten, so consumption falls off faster at low ATP than the preparatory phase's production does | **The game refuses to let the player reach a state a real cell can reach, and this row is that refusal.** `prep` is order 2 in ATP and Michaelis-Menten consumption is order 1, so below some ATP consumption beat production for every choice of constants and act 1 had a state it could not come back from. 3 is the smallest integer that strictly dominates 2. It does not make an ATP of exactly zero recoverable and nothing can, because `prep` is the only route to g3p and making ATP from no ATP would break conservation. It works by making the collapse not happen | V5 stage 2 |

C13 moved the act 1 canonical hash from `e9b720a8` to `657594cb`. Starting amounts are hashed state, so a change to that row is always a hash move and always needs its assertion updated in the same stage. C10 and C14 moved it again, from `657594cb` to `49ea08d3`, as one change: kinetic form and the K derived from it, which cannot be made separately.

## src/ui/tuning.ts

Nineteen numbers. Eight are DEPARTURE and eleven are UNSOURCED, and the split falls exactly where you would expect: the two capacity ladders hold Vmax values, which are the same kind of number as C1 to C5, and everything else in the file is a perception threshold or a purchase gate.

| Id | Value | Where | The real behaviour | What the game does instead | Why | Introduced |
| --- | --- | --- | --- | --- | --- | --- |
| U1 | 0.25 | `ZERO_FLUX_THRESHOLD` | | Below 0.25 applied flux an arrow drops to the inert treatment outright rather than slowing further | At U2's 6 pixels per flux unit, 0.25 moves a dash at 1.5 pixels per second, under the rate at which movement is perceptible against a static background. An arrow that asymptotically slows reads as "working, but slowly" when the truth is "stopped", and stopped is exactly the walled state, so act 1's whole teaching beat depends on it. Measured 2026-08-03, realized act 1 flux runs 7.949 to 21.109 across the ladder, so this fires only at 1 to 3 percent of working rate | V3 stage 5 |
| U2 | 6 | `DASH_PIXELS_PER_FLUX_UNIT` | | Pixels of dash travel per unit of applied flux per game-second | Sets how fast the pathway looks. At uptake's steady-state flux of 7.949, measured 2026-08-03, a dash moves 47.7 pixels per second and clears one 16 pixel period every third of a second: brisk enough to read as flowing, slow enough to track with the eye. Chosen by watching it, which is the only way to choose it | V3 stage 5 |
| U3 | 8 | `DASH_LENGTH` | | Dash and gap length in pixels. One period is twice this | Nothing chose it beyond it looking right against U2. The honest row is a short one | V3 stage 5 |
| U4 | 55 | `FERMENT_ATP_THRESHOLD` | | Lactate dehydrogenase becomes buyable at 55 cumulative gross ATP | **Bounded above by a hard measurement rather than chosen freely.** With ferment disabled, cumulative gross ATP converges to exactly 60.000000 and stops there forever, re-confirmed 2026-08-03, because each of C12's 30 NAD+ yields its 2 ATP once. Any threshold at or above 60 is unbuyable and leaves the player at a wall whose solution they can never afford. 55 puts the unlock in reach just as the pathway dies | V3 stage 6 |
| U5 | 8 | `UPTAKE_VMAX_STEPS[0]` | As C1 | The shipped default rung. Not purchasable, and never applied as a Vmax by the game | It exists so rung indices line up with `UPTAKE_ATP_THRESHOLDS`, where index 0 buys step 1. It mirrors C1 and must keep equalling it, and nothing enforces that today. See "Known hazards" below | V3 stage 6 |
| U6 | 10 | `UPTAKE_VMAX_STEPS[1]` | As C1 | First purchasable rung | The only freely chosen rung in the ladder. It sits between a default fixed by C1 and a ceiling fixed by measurement, so it is the one number here that is spacing rather than a constraint | V3 stage 6 |
| U7 | 12 | `UPTAKE_VMAX_STEPS[2]` | As C1 | Last rung. There is no fourth and adding one means editing this array | **The ladder stops at 12 because measurement says it must**, and this replaced a planned 8, 12, 18, 26. Re-measured 2026-08-03 at the current environment size and after the C14 repair, time to 30000 cumulative ATP is 15m44.6s at Vmax 8, 12m36.1s at 10, 11m51.7s at 12, 11m51.6s at 14, 11m51.5s at 18 and 11m51.4s at 26. Everything above 12 sells the player three tenths of a second, because C2 runs at 12 and uptake above that delivers glucose the preparatory phase cannot consume. **The gap at this rung is wide and growing**: uptake delivers 11.922 while the preparatory phase runs at 10.554, so intracellular glucose climbs by about 82 a minute and stood at 417.89 at five game-minutes. Selling preparatory-phase capacity is what closes it | V3 stage 6 |
| U8 | 1500 | `UPTAKE_ATP_THRESHOLDS[0]` | | Cumulative gross ATP before the first capacity step is buyable | Measured 2026-08-03 at the shipped default Vmax, 1500 arrives at 0m48.1s | V3 stage 6 |
| U9 | 12000 | `UPTAKE_ATP_THRESHOLDS[1]` | | Cumulative gross ATP before the second capacity step is buyable | Measured 2026-08-03 at the shipped default Vmax, 12000 arrives at 6m18.3s. Both thresholds were spaced against V3's play session rather than against docs/PROGRESSION.md's 45 to 90 minutes, on the argument that V3 shipped two unlocks and pacing a two-unlock slice to a full act would put both purchases in the first two minutes and leave eighty-eight with nothing in them. **Stage 4 of UPDATELOGV5.md re-derives both against a measured act length**, which is the first time that argument can be checked | V3 stage 6 |
| U10 | 60000 | `OFFLINE_REPORT_THRESHOLD_MS` | | Real milliseconds away below which the return line is not shown at all | Found by reloading the real page. A refresh takes a second or two, which is a positive offline delta, so the panel rendered "Away for 0 min" every single time. The number was true and the sentence was noise, and a save panel that announces a nothing-event on every reload teaches the player to stop reading the one panel that has to be believed when it says something went wrong. One minute because the readout's own resolution is minutes | V4 stage 5 |
| U11 | 12, 12, 26 | `GLYCOLYSIS_STEPS[0]` | As C1 | Rung 0, the state at the top of the uptake ladder. Not purchasable | Inherited rather than chosen, and it is the configuration the ladder exists to grow out of. Uptake equals prep's nameplate Vmax while prep only ever reaches 10.554, so intracellular glucose grows by about 87 a minute forever at this rung | V5 stage 3 |
| U12 | 13, 14, 30 | `GLYCOLYSIS_STEPS[1]` | As C1 | First purchasable rung. 42.217 to 50.462 ATP per second, plus 19.5 percent | Glucose accumulation falls from 87 a minute to 23.0 | V5 stage 3 |
| U13 | 15, 16, 36 | `GLYCOLYSIS_STEPS[2]` | As C1 | 58.849 ATP per second, plus 16.6 percent | Accumulation 17.2 a minute | V5 stage 3 |
| U14 | 17, 18, 40 | `GLYCOLYSIS_STEPS[3]` | As C1 | 67.384 ATP per second, plus 14.5 percent | Accumulation 9.2 a minute | V5 stage 3 |
| U15 | 19, 20, 44 | `GLYCOLYSIS_STEPS[4]` | As C1 | Last rung. 76.093 ATP per second, plus 12.9 percent | **The ladder stops here because the next rung is dead.** Uptake 21, prep 22 and payoff 48 collapses the cell, measured from a cold start and by climbing to it from this rung. Glucose accumulation is minus 1.5 a minute here, so the pile the uptake ladder's top rung created has been fully drained by the time the ladder is finished | V5 stage 3 |
| U16 | 40000 | `GLYCOLYSIS_ATP_THRESHOLDS[0]` | | Cumulative gross ATP before the first glycolytic rung is buyable | First fit, landing the purchase at 16m16s. Stage 4 of UPDATELOGV5.md re-derives all four against a measured act length | V5 stage 3 |
| U17 | 90000 | `GLYCOLYSIS_ATP_THRESHOLDS[1]` | | Second rung | Lands at 32m47s | V5 stage 3 |
| U18 | 160000 | `GLYCOLYSIS_ATP_THRESHOLDS[2]` | | Third rung | Lands at 52m37s | V5 stage 3 |
| U19 | 250000 | `GLYCOLYSIS_ATP_THRESHOLDS[3]` | | Fourth and last rung | Lands at 74m52s, near the end of the act's 90 minute target | V5 stage 3 |

## src/save/tuning.ts

| Id | Value | Where | The real behaviour | What the game does instead | Why | Introduced |
| --- | --- | --- | --- | --- | --- | --- |
| S1 | 30000 | `AUTOSAVE_INTERVAL_MS` | | Milliseconds between autosaves | A judgement about tolerable loss reasoned from the pacing measurement rather than a measurement in itself. The worst case for a write interrupted at any step is the work since the last successful one, so the interval is the unit of loss. Purchases save immediately and independently of this timer, because losing a purchase is the loss a player notices, which makes 30 seconds really the granularity of losing progress **toward** the next purchase | V4 stage 5 |

---

# Structural departures

Some departures are not attached to any number, so they cannot have a row. They are recorded once here rather than smeared across rows that would then have to invent a comparison.

**Unlocks are thresholds against a lifetime counter.** U4, U8 and U9 gate on cumulative gross ATP produced since the run began. Real cells express enzymes in response to regulatory signals, not in response to lifetime output, and no cell has a lifetime ATP counter. The numbers themselves depart from nothing, which is why they are UNSOURCED, but **the mechanism they belong to is a departure** and this is where it is written down. The reason it is not a purchase is separate and is not a departure at all: the adenylate pool is fixed, closed and conserved, so subtracting ATP from it breaks conservation on the tick it happens, and a cell genuinely does not save up ATP but produces it at a rate.

**The game refuses a death a real cell can die.** A cell that cannot pay glycolysis's 2 ATP entry cost does not restart, and that is real: the preparatory phase needs ATP, the payoff phase needs the g3p only the preparatory phase makes, and a cell that falls out of that loop stays out of it. Act 1 could reach that state and NOW.md carried it as blocking item 1 for three logs. C14 removes it, by making maintenance fall off faster in ATP than production does, so the collapse never starts. **The departure is not the number 3, it is the refusal**, and it is written here because no single row can carry it. What the game keeps is the honest half: a cell with no food still does nothing at all, and running the environment dry is still the end of the run.

**The environment is a finite unreplenished pool.** See C13. It is called out here as well because it shapes every rate in the content file: uptake stays near saturation only while the environment is far above C6, and every measurement in this document assumes that.

**Game time does not map to any real timescale.** docs/SCIENCE.md Part 1 says so directly. It means the absolute value of every rate in this document is uninterpretable in real terms and only the ratios carry a claim.

Three further simplifications are already disclosed in docs/SCIENCE.md Part 1 and are not repeated here: multi-substrate reactions take the minimum of their saturation terms, one Km per reaction is shared across all of its substrates, and glucose uptake is untyped transport with no cost charged. They belong there because they are modeling methodology rather than balance.

---

# Known hazards

Found by cross-checking this table against the code on 2026-08-03. Neither is fixed by the stage that found them, because the stage that found them changed no code.

**U5 must equal C1 and nothing enforces it.** `UPTAKE_VMAX_STEPS[0]` is 8 and `ACT1_VMAX.uptake` is 8. The game never applies the first rung as a Vmax: a fresh run takes C1, and `src/ui/runtime.ts` only calls `setReactionVmax` on restore when the saved step is above 0. So a divergence between them would not change play at all. It would change measurement, which is worse in a quiet way: `npm run sim:drain` and `unlockPacing.report.test.ts` both iterate the ladder and would report the default rung under a Vmax the game never runs at, and every number in this document that says "at the shipped default Vmax" comes from one of those two harnesses. A one line assertion closes it.

**Five docs/SCIENCE.md line citations in source comments are stale by 42 lines.** `src/content/act1/tuning.ts`, `src/content/act1/pools.ts` and `src/content/act1/reactions.ts` cite "Part 2 line 108" for the NAD+ constraint, which is now line 150, "Part 2 lines 89 to 96" for the glycolysis ledger, which is now lines 133 to 138, and "Part 2 line 114" and "line 116" for fermentation, which are now 156 and 158. All of them land inside Part 1 as the document stands. docs/SCIENCE.md Part 1 gained three "deliberately wrong and why" entries on 2026-07-29 after those comments were written, and every citation still names the correct Part and the correct claim, so nothing is unsourced. The pointers are simply wrong, which matters because CLAUDE.md hard rule 1's traceability is what they exist to serve. Citing a section heading rather than a line number is the durable fix.

---

# Decisions

**2026-08-03. The count is 24 and not 22.** UPDATELOGV5.md's Context section says twenty-two and enumerates the ladder as one number while enumerating the two uptake thresholds as two. Counted from the files with one rule applied consistently, the unit being the scalar value a balance pass can move on its own, `ACT1_VMAX` is 5 and `ACT1_KM` is 5 and therefore `UPTAKE_VMAX_STEPS` is 3 and `UPTAKE_ATP_THRESHOLDS` is 2. That gives 13, 10 and 1. NOW.md and `src/save/tuning.ts` were corrected to 24 in the same stage.

**2026-08-03. A ladder gets one row per rung.** Three reasons and the third is the one that decides it. The counting unit is the scalar, set by `ACT1_VMAX` being 5 rows rather than 1. A rung is moved independently by a balance pass, and V3 stage 6 replacing 8, 12, 18, 26 with 8, 10, 12 is not one edit. And the three rungs do not share a justification: U5 is a mirror of a content constant and is not purchasable, U7 is fixed by a measurement, and U6 is the only freely chosen one. A single row could not carry three different reasons honestly.

**2026-08-03. The real behaviour column is left empty rather than filled.** Eight rows have nothing in it. docs/PILLARS.md rule 5 requires departures to be recorded and does not require a departure to be invented for a number that never departed from anything. An empty cell in an UNSOURCED row is the content of that row, not a gap in it.

**2026-08-03. Vmax and Km rows are DEPARTURE and not UNSOURCED.** Both readings were available. Real enzymes have Vmax and Km values, so a real counterpart exists even though docs/SCIENCE.md Part 1 deliberately refuses to name one, and classifying these as UNSOURCED would tell a reader there is nothing there to depart from, which is false. DEPARTURE with a real behaviour cell that says "real values exist, vary by an order of magnitude across sources, and are deliberately not used" is the reading that leaves the reader better informed.

**2026-08-03. The bootstrap trap is an ordering problem and not a tuning one, so it was repaired by changing an order.** Both candidates named in `src/content/act1/tuning.ts` were implemented and measured before either was picked. Sweeping `ACT1_KM.maintain` from 5 to 500 repairs it at no value, and the reason is provable rather than empirical: Michaelis-Menten consumption is first order in ATP at low ATP and the Hill n = 2 preparatory phase is second order, so consumption wins below some level for every choice of constants. A floor under the preparatory phase, implemented as a lower `ACT1_KM.prep`, does repair it, at 0.1 leaving only 0.08 glucose stranded. It lost on cost: it pulls the intracellular glucose pool from 5.60 to 0.40 and moves the NAD+ wall from 3.00s to 2.40s, and glucose visibly piling up inside a cell that has stopped is the signal that sells the wall as something other than starvation.

**2026-08-03. C13 is kept at 80000 and the reason is replaced rather than reaffirmed.** It was raised as a shield. With the trap repaired the shield is not load-bearing, so it was re-measured on pacing alone: 126.7 minutes of food for a player who buys everything, 179.0 for one who buys nothing, against an act target of 45 to 90 minutes. The environment should outlast the act rather than define it, and 80000 does at every playstyle while 10000 runs dry inside the act at both. Stage 4 of UPDATELOGV5.md may narrow it once the act's own length is measured end to end.

**2026-08-03. A glycolytic rung is one row, not three, and this does not contradict the ladder decision above.** The unit is a number a balance pass can move on its own, and a rung's three Vmax values cannot be. Two measured constraints bind them: payoff must strictly exceed twice prep or the cell collapses, and uptake must sit below prep's realized flux or glucose piles up unusably. Moving one of the three on its own produces a configuration that either kills the cell or wastes food, so they are one tuned decision with three components rather than three tuned numbers. `UPTAKE_VMAX_STEPS` is the opposite case and gets a row per rung: its entries constrain nothing but each other's ordering.

**2026-08-03. The table is split by file rather than presented as one block.** The file is the unit the debt was tracked in across V2, V3 and V4, and a `Where` column repeating the same path thirteen times carries no information.
