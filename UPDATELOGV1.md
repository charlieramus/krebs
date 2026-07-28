charlie

# krebs, V1: The Engine Kernel
# Work on one stage at a time. Do NOT combine stages.

---

## Context

Read `NOW.md` first, then `SIMULATION.md`. The repository is documentation only. There is no `package.json`, no `src/`, no build and no test runner. Roughly 110KB of settled specification sits at the repository root with nothing executing any of it.

**The kernel is the part of the simulation that knows how to advance state without knowing what the state means.** Pools, reactions, flux, integration, the tick loop and the seeded PRNG. It has no idea that glucose or NAD+ exist.

This is log 1 of the vertical slice set (V1 kernel, then V2 act 1 content, then V3 the first interface). V1 builds only the kernel and the two property tests that guard it. It does **not** build glycolysis, fermentation, the NAD+ constraint, saves, offline progress or any UI. Glycolysis and the NAD+ wall are V2. Offline progress is `SIMULATION.md` Part 3 and lands after the content it has to settle.

The reason for the split is that `SIMULATION.md` line 90 says the conservation test should exist before act 1 content does. Build the machine and the guards, then feed it real biology.

## Decisions

- **Engine shape:** pools are a flat `Float64Array` indexed by a frozen id-to-index map, built once at construction. Reactions are a fixed-order array. No object-key iteration anywhere in flux computation, per `SIMULATION.md` Part 5.
- **Integration:** explicit Euler, two-phase. Compute every flux against the tick-start snapshot, then apply every delta. Never compute-and-apply per reaction.
- **Shortfall handling:** proportional scaling, never silent clamping. When demand on a pool exceeds its contents in a tick, every consumer of that pool is scaled by `available / demanded` so the pool lands exactly at zero. Development builds log the event.
- **Determinism enforcement:** not a convention, a build check. An ESLint rule bans `Math.random`, `Math.pow`, `Math.exp`, `Math.log` and `Date.now` inside `src/sim/`. Hard rules 4 and 5 become mechanism rather than discipline.
- **Test fixtures are not content:** the property tests run against a synthetic two-reaction pathway with invented names like `A`, `B`, `C`. It is deliberately not glycolysis. It lives in test files only, never ships, and therefore puts no untraceable number in player-facing text. Hard rule 1 is not in play here.
- **Numbers:** plain float64. No big-number library. `SAFE_VALUE_CEILING` assertion is in scope, per `SIMULATION.md` Part 4.
- **Design is out of scope.** `DESIGN.md` is untouched by this log. There is no UI in V1 beyond a headless dev harness that prints numbers to the console. The visual contract gets applied in V3, after the kernel has answered whether the kinetics feel like anything.
- **Docs move to `docs/`.** Every cross-document reference and CLAUDE.md's own index already assume `docs/`. Roughly 25 references are currently dead. Fixed in stage 1 while the repository is still small enough that the rename is trivial.
- Medium feature: five stages.

---

# Stage 1 — Scaffold and the determinism guard

```
Set up the project skeleton and make the determinism rules enforceable.

1. Move the specification docs into docs/. BRIEF.md, PILLARS.md, PROGRESSION.md,
   SIMULATION.md, SAVE_SCHEMA.md, SCIENCE.md, IDEAS.md and MOCKUP.md all move.
   Use `git mv` so history follows. CLAUDE.md, DESIGN.md, NOW.md, README.md and
   this file stay at the root. Then fix every cross-document reference across all
   files, including CLAUDE.md's "Where things live" index. Report the count of
   references you rewrote.

2. Initialise the project: Vite, React, TypeScript, Tailwind, Vitest. Match the
   stack named in CLAUDE.md exactly. Do not add state libraries, animation
   libraries, big-number libraries or a router. None of them are needed yet and
   the bundle is a constraint.

3. tsconfig with `strict: true`, `noUncheckedIndexedAccess: true` and
   `exactOptionalPropertyTypes: true`. The pool registry indexes arrays by
   computed index, so unchecked index access is exactly the class of bug worth
   paying for here.

4. Create the directory layout: src/sim/ for simulation code, src/sim/__tests__/
   for its tests, src/ui/ empty with a placeholder README explaining that UI
   lands in V3.

5. Add ESLint with a `no-restricted-globals` / `no-restricted-properties` rule
   set scoped to src/sim/** that errors on Math.random, Math.pow, Math.exp,
   Math.log and Date.now. Include a short comment in the config pointing at
   CLAUDE.md hard rules 4 and 5 so the next person understands why it exists
   rather than deleting it as noise.

6. Prove the rule works. Write a file that calls Math.random inside src/sim/,
   run lint, confirm it errors, then delete the file. Report the error output.

7. package.json scripts: dev, build, test, lint, typecheck.

Verify: `npm run typecheck`, `npm run lint`, `npm run build` and `npm test` all
run clean (`npm test` may report zero tests, that is expected at this stage).
Report the reference-rewrite count from step 1 and the lint error output from
step 6.
```

## Stage 1 Report

_Pending._

---

# Stage 2 — Constants and the seeded PRNG

```
The two pieces with no dependencies. Build them first so everything after can
assume them.

1. src/sim/constants.ts. Every value from SIMULATION.md Part 6, as named
   `const` exports with the literal types preserved. TICK_RATE_HZ 20, TICK_MS
   50, MAX_CATCHUP_TICKS 200, SETTLE_MAX_TICKS 1200, EVENT_BUDGET 64,
   MAX_OFFLINE_HOURS 24, SAFE_VALUE_CEILING 1e15. STEADY_EPSILON and
   STEADY_WINDOW are marked "tune during prototype" in the spec, so export them
   with placeholder values and a comment saying they are unvalidated and which
   log will validate them. Do not invent a justification for the placeholders.

   Each constant gets a one-line comment pointing at the part of SIMULATION.md
   that decided it. SIMULATION.md line 204 says changing one requires updating
   the doc with a reason, and that only works if the code says where the doc is.

2. src/sim/prng.ts. Mulberry32, per SIMULATION.md Part 5. The state is a single
   uint32. Expose it as an object with an explicit `state` field that can be
   read and restored, because SAVE_SCHEMA.md Part 3 requires RNG state to be
   part of the save even though saves are not in this log. Do not use a closure
   that hides the state.

   Use only >>>, <<, ^, +, * and Math.imul. No Math.pow anywhere.

3. src/sim/__tests__/prng.test.ts. Assert: same seed produces the same first
   1000 values; different seeds diverge; every output is in [0, 1); saving the
   state mid-sequence and restoring it into a fresh instance reproduces the
   remainder of the sequence exactly.

Verify: `npm test`, `npm run lint`, `npm run typecheck`. Report the first five
outputs for seed 1 so later logs have a reference sequence to check against.
```

## Stage 2 Report

_Pending._

---

# Stage 3 — Pools and reactions

```
The data model. No integration yet, no time, just the structures and flux.

1. src/sim/pools.ts. A PoolRegistry built from an ordered array of pool
   definitions, each with a string id, a display label, an initial amount and a
   `conserved` tag naming which conserved quantity it contributes to and at what
   stoichiometric weight. A pool may contribute to more than one, for example a
   three-carbon phosphorylated molecule carries both carbon and phosphate.

   Internally: a Float64Array of amounts plus a frozen Record<string, number>
   id-to-index map built at construction. Lookups by id happen at setup time.
   The hot path uses indices only.

2. src/sim/reactions.ts. A Reaction is a plain object with an id, an ordered
   array of substrate indices with stoichiometric coefficients, an ordered array
   of product indices with coefficients, a kinetics descriptor and an `enabled`
   flag.

   Kinetics descriptors, two kinds:
   - MichaelisMenten: Vmax and Km, computing v = Vmax * S / (Km + S).
   - Hill: Vmax, K and an integer n, computing v = Vmax * S^n / (K^n + S^n)
     where the exponent is repeated multiplication in a loop. SIMULATION.md
     Part 5 is explicit that Math.pow is banned here. Reject non-integer n at
     construction time with a thrown error rather than silently flooring it.

   PFK-1 is the only Hill enzyme in scope for the whole game per SIMULATION.md
   Part 2, but build the descriptor now since it costs nothing and V2 needs it.

3. Multi-substrate reactions take the minimum of the per-substrate saturation
   terms. Document this as the modeling choice it is, in a comment, with a note
   that SCIENCE.md Part 1 covers the disclosed-simplification posture and that
   this specific choice should get an entry there or in the eventual ECONOMY.md
   divergence table. Flag it in your report so it is not lost.

4. src/sim/__tests__/kinetics.test.ts. Assert: flux is zero at zero substrate;
   flux is exactly Vmax/2 at S = Km; flux approaches but never reaches Vmax;
   the curve is monotonic increasing; the Hill form with n = 1 produces exactly
   the same values as the Michaelis-Menten form with the same Vmax and K, to
   the bit. That last one catches an off-by-one in the exponent loop.

Verify: `npm test`, `npm run typecheck`, `npm run lint`. Report the
multi-substrate modeling choice from step 3 explicitly as something needing a
SCIENCE.md or ECONOMY.md entry later.
```

## Stage 3 Report

_Pending._

---

# Stage 4 — The tick and the loop

```
Time enters the system. This stage is where the two-phase update and the
shortfall guard live, so it is the one most worth getting exactly right.

1. src/sim/tick.ts, exporting `tick(state)`. In order:

   a. Compute every reaction's flux against the pool amounts as they are at the
      start of the tick. Write them into a scratch Float64Array sized to the
      reaction count and allocated once at construction, not per tick.

   b. Accumulate demand per pool across all reactions.

   c. For any pool where demand exceeds its current amount, compute the scale
      factor `available / demanded` and apply it to every reaction that consumes
      that pool. A reaction touching two shortfall pools takes the smaller of
      the two factors. Do a second pass after scaling, because scaling one
      reaction reduces demand on its other substrates and can resolve a
      shortfall elsewhere. Cap the passes at a small fixed number and, if the
      cap is hit, take the conservative factors from the final pass.

      Do not clamp. SIMULATION.md line 84 is explicit that clamping breaks
      conservation of mass and manufactures ATP from nowhere. The conservation
      test in stage 5 is what proves this code correct, so write it to be
      provable.

   d. Apply all deltas.

   e. Increment an integer tick counter. Game time is that counter, never a
      float accumulation. Conversion to milliseconds happens at the boundary
      only.

2. Shortfall events increment a per-pool counter on a diagnostics object and,
   in development builds only, log once per pool per second rather than per
   tick. Per-tick logging at 20Hz makes the console useless.

3. SAFE_VALUE_CEILING assertion in development builds: after applying deltas,
   any pool above 1e15 throws with the pool id and the tick number. Per
   SIMULATION.md Part 4 this is a tripwire for a balance change reintroducing
   unbounded growth, not a nicety. Do not soften it to a warning.

4. src/sim/loop.ts. The accumulator from SIMULATION.md Part 1: add real elapsed
   ms, drain in TICK_MS steps, pass the fractional remainder to the render
   callback for interpolation only. The remainder must never reach simulation
   state.

   Cap catch-up at MAX_CATCHUP_TICKS. Beyond that, do not silently drop the
   time. Surface it on the diagnostics object as pending offline milliseconds
   so the offline path in a later log has something to consume, and note in a
   comment that SIMULATION.md Part 3 owns it.

5. A headless dev harness, `npm run sim`, that constructs the synthetic test
   pathway, runs N ticks and prints pool levels plus shortfall counts. This is
   the only way to look at the kernel until V3 exists, so make its output
   readable.

Verify: `npm test`, `npm run typecheck`, `npm run lint`, and run `npm run sim`
for 1200 ticks. Report the final pool state and the shortfall counts.
Specifically confirm that a deliberately starved configuration lands a pool at
exactly 0 rather than below it.
```

## Stage 4 Report

_Pending._

---

# Stage 5 — The two property tests, coherence and NOW.md

```
The guards that make everything above trustworthy, then close the log out.

1. src/sim/__tests__/fixtures/toyPathway.ts. A synthetic pathway: three pools
   carrying carbon at different counts, one carrying phosphate, one redox
   carrier that a forward reaction reduces and a recycling reaction reoxidises.
   Two to three reactions. Name the pools A, B, C and so on.

   It must be structurally analogous to act 1, meaning it has a small fixed
   recycling pool that gates throughput, because that is the shape the offline
   steady-state work in a later log has to settle. It must not be glycolysis
   and must carry no real biological numbers. Put a comment at the top saying
   so, so nobody later mistakes it for content or cites its numbers.

2. src/sim/__tests__/conservation.test.ts. Per SIMULATION.md line 90. Over long
   randomized runs, seeded, assert that total carbon, total phosphate and total
   redox equivalents are preserved within a float tolerance. Randomize initial
   pool levels and Vmax values across runs. Include configurations that
   deliberately trigger shortfall scaling, since that is the code path most
   likely to leak mass.

   State the tolerance you chose and the reasoning. A tolerance loose enough to
   pass a real leak is worse than no test.

3. src/sim/__tests__/determinism.test.ts. Per SIMULATION.md Part 5. A state
   hash over the full state tree: pool amounts, tick count and PRNG state, in
   fixed order, hashed with FNV-1a over the canonical string form. Run a fixed
   seed and input script twice, assert the hashes match exactly. Assert two
   different seeds produce different hashes, otherwise a hash that ignores its
   input passes trivially.

   Serialise floats in a form that round-trips exactly. Report the hash for the
   canonical fixture run so CI and later logs have a known-good value to
   compare against.

4. Coherence pass. Run typecheck, lint, build and the full test suite. Read
   through src/sim/ as a whole and confirm: no object-key iteration in flux
   computation, no banned Math calls, no Date.now inside tick, no float
   accumulation of game time. Fix what you find rather than reporting it.

5. Update NOW.md. It is currently wrong in two places and stale in a third:
   - Line 13 says "Pre-code. No source files, no package.json, no build, no git
     repository." A repository exists with commits, and after this log so does
     the code.
   - Blocking item 1 says there is no git repository. Remove it.
   - The "Cross-document paths are broken" item under "Open, not blocking" is
     resolved by stage 1. Remove it.
   Then record what the kernel now does, and set "Next, in order" to the
   SCIENCE.md sourcing pass and V2. Do not delete the two genuinely open
   blocking items, the unsourced timeline dates and the act 2 Fe-S target. They
   are untouched by this log.

6. Add a `## Build state` table to NOW.md with a row per updatelog: V1, the
   kernel, and its status. Later logs append to it.

Verify: `npm run typecheck`, `npm run lint`, `npm run build`, `npm test` all
clean. Report the conservation tolerance and its reasoning, the canonical
determinism hash, and the NOW.md diff summary.
```

## Stage 5 Report

_Pending._

---

# After These Stages

- The kernel exists and is guarded. Conservation and determinism are tested properties rather than intentions, and the ESLint rule means hard rules 4 and 5 fail the build instead of failing review.
- V2 adds act 1 content on top: glucose uptake, glycolysis, the NAD+ pool and lactate fermentation, all from `docs/SCIENCE.md` Part 2 and `docs/PROGRESSION.md` act 1. The conservation test starts guarding real biology the moment that content lands, which is the ordering `SIMULATION.md` line 90 asks for.
- Still deferred on purpose, see `NOW.md`: offline progress (`SIMULATION.md` Part 3, needs settled content to settle against), saves and migrations (`docs/SAVE_SCHEMA.md`), the design system (`DESIGN.md`), the timeline and the beast.
- `STEADY_EPSILON` and `STEADY_WINDOW` ship as unvalidated placeholders in stage 2 and stay that way until there is a real act 1 configuration to measure settling time against. That measurement is the first thing the offline-progress log has to do.
- Two open items this log does not touch: the five unsourced timeline dates and the missing act 2 Fe-S target. Both are `docs/SCIENCE.md` work and both still violate hard rule 1 until the sourcing pass lands.
