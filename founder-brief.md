# Founder Brief: krebs (working title)

_Generated 2026-07-31 · 8c7d1c3 · Stage: PROTOTYPE_

**Prototype** · Builds ✅ · Tests 160/160 ✅ · Lint clean ✅ · Last activity 2 days ago (2026-07-29)

Working title only. No name has been chosen and no shortlist exists.

## Elevator

An idle game where the economy is real biochemistry rather than invented numbers.

You run a single cell. It starts as an anaerobic prokaryote around 3.5 billion years ago and ends as a eukaryote with mitochondria and full aerobic respiration. ATP is the currency, enzymes are the upgrades and metabolic pathways are the production chains. The pitch is that idle games already run on resources, production chains and multipliers, and cellular metabolism already is exactly that with real numbers attached. Glycolysis nets 2 ATP per glucose. Full aerobic respiration yields roughly 30. That fifteen times multiplier was not invented for balance reasons, it is just true.

Finite by design, 6 to 10 hours to completion, then it ends. No ads, no prestige treadmill, no engagement mechanics. Primary audience is high school and undergraduate biology students who were told to memorise that glycolysis yields 2 ATP and have no intuition for why that matters. Secondary audience is teachers looking for a unit supplement.

The stated success conditions are, in order: a biology teacher uses it with a class, a player finishes and can explain why aerobic respiration beats fermentation fifteen to one, a biochemist reviews it and finds no error, then play counts. Accuracy deliberately outranks reach.

## Status at a glance

**Prototype.** There is a playable vertical slice of act 1 and nothing beyond it. The reasoning: the engine, the act 1 content layer and the first interface are all built, tested and merged, but there is no persistence, no deployment, no offline progress and three of the four acts do not exist. Refreshing the browser loses everything.

Verified this session, on this machine:

| Signal | Result |
| --- | --- |
| `npm run build` (tsc --noEmit + vite build) | ✅ green, 229 kB JS, 72 kB gzipped |
| `npm test` (vitest) | ✅ 160/160 passing across 18 files, 5.2s |
| `npm run lint` (eslint) | ✅ clean |
| TODO / FIXME / HACK markers in `src/` | 0 |
| Source size | ~8,800 lines TypeScript and TSX |
| Deployment | ❌ none configured |
| CI | ❌ none configured |

Three build logs are complete: V1 the engine kernel (2026-07-28), V2 the act 1 content (2026-07-29), V3 the first interface (2026-07-29). All merged to `main`. V4 persistence and V5 offline progress are specced but not started, and the roadmap is deliberately not written past V5.

Honest summary of how far along it is: the hardest technical claim, that a deterministic conserved-mass metabolic simulation can drive a game interface at 20Hz without lying about the numbers, is proven and under test. The hardest *product* claim, that this is fun for more than ten minutes, is not proven and the prototype produced evidence against it. See risks.

## How it works

TypeScript, React 19, Vite, Tailwind 4, Vitest. No backend, no accounts, no network dependency for core play. Two runtime dependencies total (react, react-dom).

The codebase is three layers with a strict one-way dependency arrow, enforced by convention and by lint rules:

- **`src/sim/`** the kernel. Headless, knows nothing about biology or UI. Fixed 20Hz timestep accumulator, pools as a `Float64Array`, Michaelis-Menten and Hill kinetics, two-phase tick update with proportional shortfall scaling, seeded PRNG (mulberry32), FNV-1a state hash. Determinism is a tested property, not an aspiration: `Math.random`, `Math.pow`, `Math.exp` and `Math.log` are banned in simulation code by lint rule, because the last three are implementation-approximated in the ECMAScript spec and break cross-browser reproducibility.
- **`src/content/act1/`** the biology. Ten pools, five reactions, five conserved quantities. Every stoichiometric coefficient traces to a citation in `docs/SCIENCE.md`. The whole act 1 pathway is five reactions: uptake, preparatory phase, payoff phase, fermentation, maintenance.
- **`src/ui/`** the interface. Twelve components. Three independent clocks and none of them is React's: the simulation runs at fixed 20Hz over mutable memory, the display samples one preallocated snapshot per `requestAnimationFrame`, and React re-renders only on discrete events such as an unlock being bought or a stall being detected.

Four project rules are mechanism rather than discipline, which is the part most worth knowing:

1. Every player-facing number renders through a `Figure` component that requires a source badge as a prop, so an unsourced number does not compile. A production build fails if a development-only `Needs source` badge survives into the emitted bundle.
2. A test parses the colour section of `DESIGN.md` and fails the build if the stylesheet adds, omits or changes a colour.
3. Illustration geometry is derived, not drawn. There is no path data in the blob component. A molecule's shape is computed from its carbon count and its phosphate dots from the conserved-weight table, so glucose has six sides because glucose carries six carbons.
4. Conservation of mass is a property test over randomised runs, not a hand-written case. Worst observed drift is 2.4e-13 relative against a 1e-9 tolerance.

## What's built

| Area | Status |
| --- | --- |
| Simulation kernel: tick loop, pools, kinetics, PRNG, state hash | ✅ verified, canonical determinism hash frozen in a test |
| Conservation of mass across five quantities | ✅ verified by property test, drift 2.4e-13 |
| Act 1 biology: glycolysis, NAD+ pool, lactate fermentation, maintenance | ✅ verified, ledger of 4 ATP gross / 2 net / 2 NADH per glucose computed from the reaction table and matched to source |
| Act 1 interface: pool cards, pathway view, unlock shelf, coach mark, top bar | ✅ verified, 65 UI tests including a stall-recovery mechanism test |
| Derived illustration geometry | ✅ verified as a property over the pool table |
| Design system conformance (colour, tabular figures, badges) | ✅ verified by build-failing tests and lint rules |
| Reduced-motion path | ⚠️ logic verified by forcing the flag; the media query itself has never run in a real browser |
| Save and load | ○ not started. Schema is frozen at version 1, no implementation |
| Offline progress | ○ not started. Backgrounded time is currently routed to a field nothing reads |
| Acts 2, 3 and 4 | ○ not started. Specced in `docs/PROGRESSION.md`, act 2's shape is an open question |
| Tuned economy | ○ `docs/ECONOMY.md` does not exist. Twenty numbers across two files are provisional |
| Deployment | ○ Cloudflare Pages is named in the docs but no config, CI or pipeline exists |

Documentation is unusually complete for this stage: a science doc with citations, a progression spec, a simulation spec, a frozen save schema, a scope contract and a 32 kB visual contract. `NOW.md` is a genuinely candid state-of-project file and is the best single thing to read after this one.

## Known issues and risks

Ranked by how much they should worry a diligent reader.

1. **The prototype's central product question came back negative.** The slice existed to answer two questions. The NAD+ wall reads as interesting, confirmed and it is the strongest thing in the build. But saturating kinetics do not yet feel like a game, because once act 1 is solved the screen stops changing. Every net rate reads exactly 0.00 except lactate, ATP per second sits pinned to twelve decimal places, and it was observed doing that for eight consecutive minutes with an affordable upgrade unbought. This is correct simulation. A metabolic steady state genuinely is steady. It is also a game with two events in it and roughly ten minutes of nothing in between. Unresolved, and owned by the unwritten economy doc.

2. **Act 1 as tuned has an unrecoverable failure state, deferred rather than fixed.** Below roughly 400 environmental glucose, maintenance drains ATP faster than the pathway can bootstrap. The preparatory phase can no longer pay its 2 ATP entry cost, the payoff phase has no substrate, and nothing restarts it. The cell stays dead while food keeps arriving. V3 measured when a player would actually reach this and moved it out of reach by raising the starting environment eightfold, rather than repairing it. The trap still exists and any change that raises uptake capacity, lengthens the act or shrinks the environment brings it straight back.

3. **All playtest findings come from the person who built it.** The project documents this itself and is right to. Every "does this teach" reading in the file is from the least reliable possible reader. Nobody outside has played it.

4. **No persistence, so a reload refunds every purchase.** Worse, unlock state is deliberately outside the hashed simulation state, so V4 has to persist it separately or saves will silently lose purchases while still passing the determinism test.

5. **No deployment and no CI.** The brief doc claims "determinism is a tested property, with a state hash comparison in CI". The test exists and passes locally, but there is no `.github/workflows`, no `wrangler.toml` and no pipeline. That claim is currently aspirational.

6. **Three quarters of the content does not exist,** and act 2 is called out in the specs as the highest-risk beat in the game with its shape still an open question. It inverts the genre by making a new resource damage you.

7. **Minor and tracked:** a backgrounded tab silently drops game time into an unread field; `docs/SIMULATION.md` names three conserved quantities where act 1 actually has five; one line of the design doc describes a colour behaviour backwards; the wordmark is specced at a scale that does not fit the persistent top bar. All recorded in `NOW.md` rather than hidden.

8. **The repository presents as unfinished to an outsider.** The README is a single word, version is `0.0.0` and the project has no name.

## What's next

In the order the project itself sets, which is defensible:

1. **Write `docs/ECONOMY.md`.** It was deliberately blocked on having a playable prototype and now there is one. It owns both blocking items above: the bootstrap trap is a balance decision, and the static mid-game is the reason the kinetics question failed. Twenty provisional numbers across `src/content/act1/tuning.ts` and `src/ui/tuning.ts` need divergence rows. Those two files exist as single files of provisional constants specifically so this table has two places to point at rather than twenty.
2. **V4, persistence.** Save and load against the frozen schema version 1, plus a migration harness and a fixture test, with unlock state persisted separately.
3. **V5, offline progress.** The genuinely interesting engineering problem: replaying eight hours tick by tick is too slow and the coupled nonlinear kinetics have no closed form, so the approach replays at full fidelity until steady state, then jumps analytically to the next discrete event. Cost scales with event count rather than window length. Two placeholder constants shipped unvalidated in V1 and measuring them is the first task.

Deliberately unplanned past V5. Act 2 is not decidable until act 1 has been played by someone other than the author, and the project refuses to write roadmap it cannot ground. Reasonable, and worth respecting rather than pushing on.

## Decisions needed

Four open forks that need a human, roughly in order of cost of getting them wrong:

1. **How to fix the static mid-game.** Three candidates are on the table, none chosen: more unlocks so something is always approaching, a varying environment that disturbs the steady state, or accepting that an idle game's mid-game is meant to be quiet and making the quiet legible rather than empty. This is the single decision most likely to determine whether the product works.
2. **An outside playtester.** Cheapest high-value action available. The specific thing to test is whether a player who sees ATP per second jump while ATP per glucose does not move draws the intended conclusion, that fermentation bought throughput and zero yield, or the exact opposite one. That is the game's central teaching beat and it currently rests on one person's self-report.
3. **A name.** The wordmark reads `krebs`, but the Krebs cycle unlocks around four hours in and does not exist during act 1. The working title is a placeholder that is quietly becoming permanent.
4. **Whether to fix the bootstrap trap or design around it.** Fixing it needs either a maintenance rate that backs off as ATP falls or a floor under the preparatory phase. Both are economy decisions and both change the shape of act 1.

One smaller call: the coach mark that explains the stall currently triggers automatically, chosen because with manual triggering nothing on screen explains the stall at all. Both behaviours are built and switching is a one-word edit. It needs a reader who is not the author.

### The ask

For an investor conversation, what would move this fastest is not engineering capacity. The engine is ahead of the design. What is needed is a small number of real players, ideally one biology teacher and a handful of students, and one biochemist willing to review the science layer. Success condition 3 outranks success condition 4 in this project's own charter, and neither has been tested by anyone outside the room.
