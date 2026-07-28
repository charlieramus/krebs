# Now

Last updated: 2026-07-28

Where the project actually is. Read this before the spec docs.

This file holds state. CLAUDE.md holds instruction and changes rarely. This changes most sessions. Durable decisions belong in the decisions log of the relevant spec doc, not here, so this file stays short enough to be read rather than skimmed.

If this file disagrees with a spec doc, the spec doc wins and this file is stale. Fix it.

## Status

Pre-code. No source files, no package.json, no build, no git repository. Tier 1 documentation plus DESIGN.md.

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

1. **No git repository.** Roughly 110KB of specification with no history. The `/complete-updatelog` workflow commits and pushes per stage, so it cannot run until this exists.
2. **Five timeline dates are unsourced.** ~4.0 Ga, ~2.7 Ga, ~2.0 to 1.5 Ga and ~1.6 Ga currently violate hard rule 1. A sourcing pass on docs/SCIENCE.md is drafted and pending.
3. **Act 2 has no iron-sulfur target in the player's pathway.** docs/PROGRESSION.md line 63 targets ROS damage at Fe-S enzymes, but no glycolytic enzyme has an Fe-S cluster and the TCA cycle does not unlock until act 3. Likely correct targets are pyruvate:ferredoxin oxidoreductase and ferredoxin. Needs a docs/SCIENCE.md entry and a docs/PROGRESSION.md correction. Part of the same pending sourcing pass.

## Open, not blocking

- **Working title is still TBD.** docs/BRIEF.md line 4 says so and no naming shortlist exists. The wordmark is drawn as `krebs`, but the Krebs cycle unlocks roughly four hours in and does not exist during act 1.
- **Cross-document paths are broken.** Every doc references `docs/SCIENCE.md` and similar, but the files sit at the repository root. Roughly 25 dead references including CLAUDE.md's own index. Either move the files into `docs/` or rewrite the references.
- **No release gate for the Needs source badge.** The badge is specified in DESIGN.md but nothing enforces it. A build check that fails on any surviving Needs source turns hard rule 1 from discipline into mechanism.
- `STEADY_EPSILON` and `STEADY_WINDOW` are marked tune during prototype in docs/SIMULATION.md Part 6.

## Next, in order

1. `git init` and commit everything as it stands.
2. Land the docs/SCIENCE.md sourcing pass. Blocking items 2 and 3 both resolve here.
3. `/updatelog` for the vertical slice, in a fresh session.

## The vertical slice

Scope is fixed by docs/BRIEF.md line 110 and should not grow: tick loop, one pool, glycolysis, the NAD+ constraint, fermentation, no UI polish.

docs/SIMULATION.md already decides everything this needs, so the stages are implementation rather than design. In scope: fixed timestep accumulator, pools, Michaelis-Menten flux, two-phase update, negative pool proportional scaling, seeded PRNG, the conservation property test and the determinism test.

Out of scope for the slice: saves, offline progress, the design system, the timeline, the beast.

Order note: docs/SIMULATION.md line 90 says the conservation test should exist before act 1 content does.

## Why the UI waits

The slice exists to answer two questions from docs/BRIEF.md. Whether saturating kinetics feel like a game, and whether the NAD+ wall reads as interesting rather than annoying.

DESIGN.md specifies a lot of interface that has never been tested against a running simulation. If the NAD+ wall reads as annoying, some of those decisions change. Build the thing that answers the question, then dress it.
