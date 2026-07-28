# Now

Last updated: 2026-07-28

Where the project actually is. Read this before the spec docs.

This file holds state. CLAUDE.md holds instruction and changes rarely. This changes most sessions. Durable decisions belong in the decisions log of the relevant spec doc, not here, so this file stays short enough to be read rather than skimmed.

If this file disagrees with a spec doc, the spec doc wins and this file is stale. Fix it.

## Status

The kernel runs. V1 landed the engine and the two property tests that guard it. There is no act 1 content and no interface yet, so there is nothing a player could touch, but the machine that would run them exists and is tested.

## Build state

One sentence per log. The "does not" column is the fence each stage doc inherits, so a log claims its own row and defers everything held by the rows below it.

| Log | Builds | Does not | Status |
| --- | --- | --- | --- |
| V1 | The engine kernel: constants, seeded PRNG, pools, reactions, tick, loop, conservation and determinism tests | Any content, any interface, saves | Done 2026-07-28 |
| V2 | Act 1 content: glucose uptake, glycolysis, the NAD+ pool, lactate fermentation | Any interface, the ethanol branch, glycogen storage | Not started |
| V3 | The first interface, only what is needed to play the slice and answer the two questions in docs/BRIEF.md line 110 | The timeline, the beast, the rest of DESIGN.md, saves | Not started |
| V4 | Persistence: save and load against docs/SAVE_SCHEMA.md version 1, plus the migration harness and its fixture test | Offline progress, any network or account | Not started |
| V5 | Offline progress: steady-state detection, the analytic jump to the next event, and validation of STEADY_EPSILON and STEADY_WINDOW | New content, any interface beyond a return summary | Not started |
| V6+ | Unplanned, deliberately | Anything written here now would be fiction | Held |

The horizon is V5 and it is a real horizon rather than laziness. Act 2 is the highest-risk beat in the game and docs/PROGRESSION.md line 136 lists its shape as an open question for the prototype, so it is not decidable until the slice has been played. docs/ECONOMY.md gets written in the same window for the same reason. Do not extend this table until V3 has answered the two questions.

The docs/SCIENCE.md reconciliation in Blocking is not a log. It is a docs-only pass and it gates V2.

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

65 tests. Conservation holds to 1.964e-13 relative across randomized runs, against a 1e-9 tolerance. The canonical determinism hash is `172f83fb`. `Math.random`, `Math.pow`, `Math.exp`, `Math.log` and `Date.now` fail lint inside `src/sim/`, so hard rules 4 and 5 are mechanism rather than discipline.

Not built, deliberately: offline progress, saves and migrations, any content, any interface.

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

Mockups live outside the repo at `~/.gstack/projects/krebs/designs/design-system-20260728/`. `preview-cartoon.html` is the current direction. `preview.html` is a rejected earlier direction kept for comparison.

## Settled 2026-07-28

- Visual direction is Honest Cartoon. Thick black outlines, pastel surfaces, hard offset shadows, chunky rounded type. Fredoka and Nunito. See DESIGN.md.
- Every visual property carries simulation state. Shape encodes carbon count, saturation encodes redox state, cracks encode damage.
- Flux is the headline number and stock is the subscript, inverting the genre convention.
- No authentication and no accounts. PILLARS rule 7 considered and upheld.
- The beast is the cell itself, personified. The map is the real geological timeline, scrolling down into the past.
- Timeline figures earn their place by metabolism, not morphology. This is the guardrail that keeps the timeline from drifting into the tree of life.
- Badge contract is Sourced, Tuned, Contested, plus a development-only Needs source.

## Blocking

Both items below are half done. The research landed in docs/SCIENCE.md. Neither result has been applied anywhere else, so both still violate hard rule 1 in practice.

1. **Five timeline dates are researched but not applied.** docs/SCIENCE.md Part 6 now sources all five stops and its recommendations change the view: stop 3 loses its 2.7 Ga date entirely because the biomarkers failed on contamination, stop 2 is relabeled from oxygen production to anoxygenic phototrophy, and banded iron does not cleanly mark the GOE so the stop needs a different visual or an explicit pre-GOE label. Nothing downstream reflects any of that yet.
2. **Act 2 has no iron-sulfur target in the player's pathway.** docs/SCIENCE.md Part 3 has the correct targets under "Damage targets the act 2 player actually has". docs/PROGRESSION.md carries only a superseded note at line 65 and its unlock list at lines 54 to 62 is unchanged, so the act 2 spine is still wrong where it counts.

## Open, not blocking

- **Working title is still TBD.** docs/BRIEF.md line 4 says so and no naming shortlist exists. The wordmark is drawn as `krebs`, but the Krebs cycle unlocks roughly four hours in and does not exist during act 1.
- **No release gate for the Needs source badge.** The badge is specified in DESIGN.md but nothing enforces it. A build check that fails on any surviving Needs source turns hard rule 1 from discipline into mechanism. The ESLint determinism rule from V1 is the model: the same trick works here.
- **Two undisclosed simplifications in the kinetics.** A multi-substrate reaction takes the minimum of its per-substrate saturation terms rather than a real bi-bi rate law, and one kinetics descriptor per reaction means one Km shared across all of its substrates. Both are game decisions, both are defensible, neither is written down. They need a docs/SCIENCE.md entry or a docs/ECONOMY.md divergence row. docs/SCIENCE.md Part 1 requires the methodology to be disclosed in-game, so this is a real obligation rather than tidiness.
- `STEADY_EPSILON` and `STEADY_WINDOW` shipped in V1 as unvalidated placeholders, 1e-6 and 20. docs/SIMULATION.md Part 6 marks them tune during prototype and no measurement exists yet. V5 validates them, and that measurement is the first thing it has to do.

## Next, in order

1. Apply the docs/SCIENCE.md findings to docs/PROGRESSION.md and the timeline stop list. Both blocking items resolve here, and V2 cannot put an act 1 number on screen until they do.
2. V2. See the build state table.

The ordering matters. docs/SIMULATION.md line 90 asked for the conservation test before act 1 content, and V1 delivered it, so the moment real biology lands it is guarded.

## The vertical slice

Scope is fixed by docs/BRIEF.md line 110 and should not grow: tick loop, one pool, glycolysis, the NAD+ constraint, fermentation, no UI polish.

Done in V1: fixed timestep accumulator, pools, Michaelis-Menten flux, two-phase update, negative pool proportional scaling, seeded PRNG, the conservation property test and the determinism test.

Left for V2: glycolysis, the NAD+ constraint, fermentation.

Out of scope for the slice: saves, offline progress, the design system, the timeline, the beast.

## Why the UI waits

The slice exists to answer two questions from docs/BRIEF.md. Whether saturating kinetics feel like a game, and whether the NAD+ wall reads as interesting rather than annoying.

DESIGN.md specifies a lot of interface that has never been tested against a running simulation. If the NAD+ wall reads as annoying, some of those decisions change. Build the thing that answers the question, then dress it.

V1 does not answer either question, and was not meant to. The kernel has no NAD+ and no glucose in it. `npm run sim` is the only way to look at it and it prints numbers to a console. V2 is the first log that can say anything about how any of this feels.
