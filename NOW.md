# Now

Last updated: 2026-07-29

Where the project actually is. Read this before the spec docs.

This file holds state. CLAUDE.md holds instruction and changes rarely. This changes most sessions. Durable decisions belong in the decisions log of the relevant spec doc, not here, so this file stays short enough to be read rather than skimmed.

If this file disagrees with a spec doc, the spec doc wins and this file is stale. Fix it.

## Status

Act 1 content exists and runs. V2 landed glucose uptake, both phases of glycolysis, the nicotinamide pool and lactate fermentation on top of V1's kernel, and the conservation test that docs/SIMULATION.md line 90 asked for before content is now guarding real stoichiometry instead of invented letters.

There is still no interface, so there is still nothing a player can touch. `npm run sim:act1` prints numbers to a console and that is the only way to look at any of it.

## Build state

One sentence per log. The "does not" column is the fence each stage doc inherits, so a log claims its own row and defers everything held by the rows below it.

| Log | Builds | Does not | Status |
| --- | --- | --- | --- |
| V1 | The engine kernel: constants, seeded PRNG, pools, reactions, tick, loop, conservation and determinism tests | Any content, any interface, saves | Done 2026-07-28 |
| V2 | Act 1 content: glucose uptake, glycolysis, the NAD+ pool, lactate fermentation | Any interface, the ethanol branch, glycogen storage | Done 2026-07-29 |
| V3 | The first interface, only what is needed to play the slice and answer the two questions in docs/BRIEF.md line 110 | The timeline, the beast, the rest of DESIGN.md, saves | Not started |
| V4 | Persistence: save and load against docs/SAVE_SCHEMA.md version 1, plus the migration harness and its fixture test | Offline progress, any network or account | Not started |
| V5 | Offline progress: steady-state detection, the analytic jump to the next event, and validation of STEADY_EPSILON and STEADY_WINDOW | New content, any interface beyond a return summary | Not started |
| V6+ | Unplanned, deliberately | Anything written here now would be fiction | Held |

The horizon is V5 and it is a real horizon rather than laziness. Act 2 is the highest-risk beat in the game and docs/PROGRESSION.md lists its shape as an open question for the prototype, so it is not decidable until the slice has been played. docs/ECONOMY.md gets written in the same window for the same reason. Do not extend this table until V3 has answered the two questions.

The docs/SCIENCE.md reconciliation that used to gate V2 landed as V2 stage 1. It was a docs-only pass and it is done.

## What the kernel does

`src/sim/`, headless, no UI, no content.

    constants.ts    docs/SIMULATION.md Part 6, literal types, each pointing at the part that decided it
    prng.ts         mulberry32, state exposed for the save, seed 1 reference sequence frozen in a test
    pools.ts        Float64Array amounts, frozen id-to-index map, flat conserved weight matrix
    reactions.ts    Michaelis-Menten and Hill, integer exponents by repeated multiplication
    tick.ts         two-phase update, proportional shortfall scaling, SAFE_VALUE_CEILING tripwire
    loop.ts         fixed timestep accumulator, catch-up cap, excess routed to pendingOfflineMs
    hash.ts         FNV-1a over the canonical state form
    harness.ts      `npm run sim`, three scenarios over the synthetic fixture

Conservation holds to 1.964e-13 relative across randomized runs, against a 1e-9 tolerance. The canonical determinism hash is `172f83fb` and V2 did not touch it.

Not built, deliberately: offline progress, saves and migrations, any interface.

## What the content layer does

`src/content/`, added by V2. The part of the simulation that knows what a pool means.

    README.md         the one rule: content depends on src/sim/, never the reverse
    act1/pools.ts     ten pools, five conserved quantities, the redox convention
    act1/reactions.ts five reactions, every coefficient traced to docs/SCIENCE.md
    act1/tuning.ts    every Vmax, Km, the Hill n and the nicotinamide size
    act1/meter.ts     cumulative ATP, kept beside the simulation and never in it
    act1/harness.ts   `npm run sim:act1`, three scenarios

The pathway, all of it:

    uptake     glucose_env               ->  glucose
    prep       glucose + 2 atp           ->  2 g3p + 2 adp
    payoff     g3p + nad + 2 adp + pi    ->  pyruvate + nadh + 2 atp
    ferment    pyruvate + nadh           ->  lactate + nad          ships disabled
    maintain   atp                       ->  adp + pi

Five conserved quantities rather than three. `carbon`, `phosphate` and `redox` as docs/SIMULATION.md names them, plus `nicotinamide` (NAD+ plus NADH) and `adenylate` (ATP plus ADP). The carrier totals are what make the NAD+ wall a testable property rather than a felt one.

95 tests across the whole suite, up from V1's 65. Every reaction balances all five quantities exactly, asserted as a property over the reaction list rather than as hand-written cases. The ledger is 4 ATP gross, 2 net, 2 NADH and 2 pyruvate per glucose, computed from the reaction table and matching docs/SCIENCE.md Part 2. Act 1 conservation drift is 2.351e-13 worst observed, slightly above the toy pathway's 1.964e-13 and still three orders below tolerance. The act 1 canonical hash is `e9b720a8`.

The determinism lint guard was extended from `src/sim/**` to `src/content/**` in V2 stage 6, because content builds the descriptors the kernel runs and the hashed state is a function of content. Hard rules 4 and 5 are mechanism in both directories now.

Not built, deliberately: the ethanol branch, glycogen storage, the ten-enzyme decomposition, unlock costs and thresholds.

## What exists

    docs/BRIEF.md          orientation, the idea and the reasoning
    docs/PILLARS.md        scope contract
    docs/PROGRESSION.md    four acts, unlock order, gating
    docs/SIMULATION.md     engine spec, settled, awaiting implementation
    docs/SAVE_SCHEMA.md    data contract, version 1, frozen
    docs/SCIENCE.md        biological ground truth and citations
    docs/IDEAS.md          loose ideas, not a spec
    docs/MOCKUP.md         mockup pointer
    DESIGN.md              visual contract, direction Honest Cartoon
    NOW.md                 this file

    docs/ECONOMY.md        not written, deliberate, needs a prototype first
    docs/CONTENT_STYLE.md  not written, deliberate, written last

    UPDATELOGV1.md         the kernel build log, five stages, all reported
    UPDATELOGV2.md         the act 1 content log, six stages, all reported

Mockups live outside the repo at `~/.gstack/projects/krebs/designs/design-system-20260728/`. `preview-cartoon.html` is the current direction. `preview.html` is a rejected earlier direction kept for comparison.

## Settled 2026-07-28

- Visual direction is Honest Cartoon. Thick black outlines, pastel surfaces, hard offset shadows, chunky rounded type. Fredoka and Nunito. See DESIGN.md.
- Every visual property carries simulation state. Shape encodes carbon count, saturation encodes redox state, cracks encode damage.
- Flux is the headline number and stock is the subscript, inverting the genre convention.
- No authentication and no accounts. PILLARS rule 7 considered and upheld.
- The beast is the cell itself, personified. The map is the real geological timeline, scrolling down into the past.
- Timeline figures earn their place by metabolism, not morphology. This is the guardrail that keeps the timeline from drifting into the tree of life.
- Badge contract is Sourced, Tuned, Contested, plus a development-only Needs source.

## Settled 2026-07-29

- The timeline stop list is sourced. Every stop traces to docs/SCIENCE.md Part 6 and no `Needs source` badge survives on the view. Two stops ship with no date: oxygenic photosynthesis is unresolved and the vent stop is a hypothesis about mechanism rather than a dated event.
- The GOE stop keeps banded iron as its figure, with the ~2.5 Ga peak labelled on the card as the immediate pre-GOE maximum. The cleaner marker, the redox-sensitive detrital mineral record, has no legible cartoon silhouette.
- The eukaryote stop is reframed from morphology to metabolism, as early aerobic eukaryotes.
- Act 2 models two damage mechanisms, not one. ROS and molecular oxygen have different targets and the antioxidant enzymes only address the first. The target inside act 1's own loop is GAPDH by thiol oxidation.
- Content lives in `src/content/` and the kernel never imports it. The arrow points one way, permanently.
- ATP is a flux, not a score. The adenylate pool is fixed and closed and `maintain` hydrolyses ATP back to ADP and phosphate. Cumulative production is a counter beside the simulation, never a pool inside it.

## Blocking

1. **Act 1 as tuned has an unrecoverable state.** Found by V2 stage 5's harness, not tuned away, because stage 5 measures and does not balance. Below roughly 400 environmental glucose, baseline maintenance drains ATP faster than the pathway can bootstrap. ATP decays to denormal and the preparatory phase can no longer pay its 2 ATP entry cost, and nothing can restart it: `prep` needs ATP and `payoff` needs the g3p that only `prep` makes. Glucose keeps arriving and the cell stays dead. Biologically it is not nonsense, the investment phase really does mean a cell too poor in ATP cannot start glycolysis, but a game the player cannot act their way out of is broken. The fix is a balance decision and belongs to whoever writes docs/ECONOMY.md, or to V3 if the interface makes a player meet it first. Reproduce with `npm run sim:act1 -- 1200 starved` after lowering `glucose_env` below 400 in `buildAct1Scenario`.

## Open, not blocking

- **Working title is still TBD.** docs/BRIEF.md line 4 says so and no naming shortlist exists. The wordmark is drawn as `krebs`, but the Krebs cycle unlocks roughly four hours in and does not exist during act 1.
- **No release gate for the Needs source badge.** The badge is specified in DESIGN.md but nothing enforces it. A build check that fails on any surviving Needs source turns hard rule 1 from discipline into mechanism. The ESLint determinism rule from V1 is the model: the same trick works here.
- **Every number in `src/content/act1/tuning.ts` is provisional and owes a docs/ECONOMY.md row.** Five Vmax values, five Km values, the Hill n and the nicotinamide pool size. They are first-fit, chosen so the pathway runs, never played and never balanced. They all sit in one file specifically so the divergence table has one place to point. docs/ECONOMY.md still should not be written until V3 has been played, so the tension with hard rule 2 is recorded rather than resolved. This is the largest single debt V2 created.
- **docs/SIMULATION.md line 90 names three conserved quantities and act 1 has five.** It says "carbon, phosphate and redox equivalents". `nicotinamide` and `adenylate` are conserved too under the act 1 decomposition and are the more useful invariants, because they are what turn the NAD+ wall into a testable property. V2 deliberately did not edit docs/SIMULATION.md. Recommendation is that Part 2's wording be widened to say the conserved set is content's to declare, since act 3 will add more, but that is a spec edit and should be deliberate rather than incidental.
- **The timeline date column has no treatment for a stop with no date.** Two stops now carry `unresolved` and `hypothesis` instead of a figure. They need to read as deliberate statements at the same visual weight as a real date, and the non-linear axis has to place an undated stop by ordering constraint alone. See DESIGN.md open question 5.
- **Recovery from the NAD+ wall is instantaneous, one tick.** During the stall the cell stockpiles everything except NAD+, so the moment fermentation runs the payoff phase clears half its pre-stall peak immediately. Correct simulation, possibly anticlimactic gameplay. V3 finds out.
- `STEADY_EPSILON` and `STEADY_WINDOW` shipped in V1 as unvalidated placeholders, 1e-6 and 20. docs/SIMULATION.md Part 6 marks them tune during prototype and no measurement exists yet. V5 validates them, and that measurement is the first thing it has to do.

## Next, in order

1. V3. The first interface, scoped to nothing more than what is needed to play the slice and answer the two questions in docs/BRIEF.md line 110. DESIGN.md is a large specification that has never been tested against a running simulation, so V3 should apply only the part of it the slice needs.

That is the whole list. The ordering that mattered has already happened: docs/SIMULATION.md line 90 asked for the conservation test before act 1 content, V1 delivered it, and V2 landed real stoichiometry into a guard that was already waiting.

## The vertical slice

Scope is fixed by docs/BRIEF.md line 110 and should not grow: tick loop, one pool, glycolysis, the NAD+ constraint, fermentation, no UI polish.

Done in V1: fixed timestep accumulator, pools, Michaelis-Menten flux, two-phase update, negative pool proportional scaling, seeded PRNG, the conservation property test and the determinism test.

Done in V2: one pool, glycolysis, the NAD+ constraint, fermentation.

Left for V3: the interface, and nothing else.

Out of scope for the slice: saves, offline progress, the design system, the timeline, the beast.

## Why the UI waits

The slice exists to answer two questions from docs/BRIEF.md. Whether saturating kinetics feel like a game, and whether the NAD+ wall reads as interesting rather than annoying.

DESIGN.md specifies a lot of interface that has never been tested against a running simulation. If the NAD+ wall reads as annoying, some of those decisions change. Build the thing that answers the question, then dress it.

V2 is the first log that can say anything, and here is what it can honestly say. A console cannot answer a question about feel, so everything below is the shape of the thing rather than the experience of it.

**On the NAD+ wall.** It is legible as an event. The pathway starts, reaches full flux, holds it, then decays to zero over about a second, stalling at 3.05 game-seconds. At the stall, 9543 of 10000 environmental glucose remains and 438 units have piled up inside the cell, so the cause is visibly not starvation. That pile is the signal a player would read. It arrives fast enough to be met rather than waited for, and it took a tuning change to get there: at a nicotinamide pool of 10 the payoff phase peaked and died in the same breath, with no interval in which a working cell existed to lose. It is 30 now.

The number that makes the beat work is the yield. Stalled and fermenting runs both give 4.000000000 ATP per glucose gross and 2.000000000 net, agreeing to nine decimal places, while throughput between them differs by a factor of 37. Fermentation buys throughput and buys exactly zero yield, and that is an assertion in the test suite rather than an intention in a doc.

**On saturating kinetics.** Less can be said, and pretending otherwise would be the failure mode this project exists to avoid. The curves behave, `uptake` is rate-limiting by construction and everything downstream sits at whatever saturation matches its supply, but nothing here tests whether diminishing returns feel like a physical property of enzymes or like a designer's throttle. That question needs a number moving on a screen.

**What V3 has to measure.** Whether the stall reads as an interesting constraint or as the game breaking. Whether an instantaneous recovery on unlocking fermentation is satisfying or anticlimactic, because the simulation gives no ramp at all. Whether a player who sees ATP per second jump while ATP per glucose does not move draws the intended conclusion or the opposite one. And whether the two failure modes, stalled and starved, are distinguishable at a glance when they are rendered rather than printed.
