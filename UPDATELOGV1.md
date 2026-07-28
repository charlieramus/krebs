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

**Docs moved.** All eight moved with `git mv` so history follows: `docs/BRIEF.md`,
`docs/PILLARS.md`, `docs/PROGRESSION.md`, `docs/SIMULATION.md`,
`docs/SAVE_SCHEMA.md`, `docs/SCIENCE.md`, `docs/IDEAS.md`, `docs/MOCKUP.md`.
`CLAUDE.md`, `DESIGN.md`, `NOW.md`, `README.md` and this file stayed at the root.

**References rewritten: 50.** DESIGN.md 23, docs/SCIENCE.md 5, docs/SAVE_SCHEMA.md
1, docs/PROGRESSION.md 1, NOW.md 20. One reference was added rather than rewritten,
`docs/MOCKUP.md`, which the NOW.md file listing had never mentioned.

CLAUDE.md needed zero changes. Its "Where things live" index and all 14 of its
references already said `docs/`, which is the point NOW.md was making: every doc
assumed a layout that did not exist. The move is the fix, not the rewrite.
Same for docs/BRIEF.md, docs/PILLARS.md and docs/SIMULATION.md, whose
cross-references were already `docs/`-prefixed and became correct on the move.

The convention chosen and now applied uniformly is repository-root-relative, so a
reference inside `docs/` still reads `docs/SCIENCE.md` rather than `SCIENCE.md`.
That matches what the majority of the corpus already did and what CLAUDE.md's index
uses. Verified afterwards that no bare reference to a moved doc survives anywhere in
CLAUDE.md, DESIGN.md, NOW.md or docs/, and that nothing got double-prefixed to
`docs/docs/`.

UPDATELOGV1.md itself was deliberately left alone. CLAUDE.md says stage prompts are
ephemeral build instructions rather than reference material, and stage 1 step 1
names the pre-move paths as its own input. Rewriting the instructions mid-execution
would make the log disagree with what it asked for.

**Stack.** Vite 7, React 19, TypeScript 5.9, Tailwind 4 via `@tailwindcss/vite`,
Vitest 3. Exactly the stack CLAUDE.md names, nothing else. No state library, no
animation library, no big-number library, no router. 217 packages, production bundle
193.37 kB raw and 60.74 kB gzipped, which is React and nothing much else.

**tsconfig.** `strict`, `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`
all on as specified, plus `noUnusedLocals`, `noUnusedParameters`,
`noFallthroughCasesInSwitch` and `noImplicitOverride`. A comment on the strictness
block records why `noUncheckedIndexedAccess` is worth its cost here, which is the
`Float64Array`-indexed-by-computed-index pattern the pool registry is about to use.

**Layout.** `src/sim/` with a README stating the hard rules that bind it,
`src/sim/__tests__/`, `src/ui/` with a README explaining that UI lands in V3 and why.
`src/App.tsx` is a placeholder that says so and renders one line of text.

**The determinism guard.** `eslint.config.js`, `no-restricted-properties` plus
`no-restricted-globals`, scoped to `src/sim/**` only, so UI code is unaffected. Each
message names the rule it enforces. A comment block above the rules explains that
these are load-bearing rather than stylistic, citing CLAUDE.md hard rules 4 and 5 and
docs/SIMULATION.md Part 5, so the next person reads it as mechanism rather than noise.

`no-restricted-globals` bans the whole `Date` global inside `src/sim/`, not just
`Date.now`, so `new Date().getTime()` cannot route around it. The cost is that a
`Date.now` call reports twice. That is acceptable.

**Step 6, proof the rule fires.** Wrote `src/sim/__lintprobe.ts` calling all five
banned things, ran `npm run lint`:

```
D:\Portfolio work\Development\krebs\src\sim\__lintprobe.ts
  3:13  error  'Math.random' is restricted from being used. CLAUDE.md hard rule 4: use the seeded PRNG in src/sim/prng.ts. Determinism is a tested property   no-restricted-properties
  4:13  error  'Math.pow' is restricted from being used. CLAUDE.md hard rule 5: Math.pow is implementation-approximated. Use repeated multiplication          no-restricted-properties
  5:13  error  'Math.exp' is restricted from being used. CLAUDE.md hard rule 5: Math.exp is implementation-approximated and breaks cross-browser determinism  no-restricted-properties
  6:13  error  'Math.log' is restricted from being used. CLAUDE.md hard rule 5: Math.log is implementation-approximated and breaks cross-browser determinism  no-restricted-properties
  7:13  error  Unexpected use of 'Date'. docs/SIMULATION.md Part 5: wall-clock time enters only at the loop boundary, never inside sim code                   no-restricted-globals
  7:13  error  'Date.now' is restricted from being used. docs/SIMULATION.md Part 5: wall-clock time enters only at the loop boundary, never inside sim code   no-restricted-properties

✖ 6 problems (6 errors, 0 warnings)
```

Errors, not warnings, exit code 1. Probe file deleted.

**Scripts.** `dev`, `build`, `test`, `lint`, `typecheck`. `build` runs `tsc --noEmit`
before `vite build` so a type error fails the build rather than shipping.

**Verify.** `npm run typecheck` clean. `npm run lint` clean. `npm run build` clean,
29 modules. `npm test` reports "No test files found" and exits 1, which is the
expected zero-test state this stage anticipated. `--passWithNoTests` was deliberately
not added: failing on an empty suite is the behaviour worth keeping once stage 2
lands real tests, and stage 2 resolves it in the next commit.

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

**src/sim/constants.ts.** All nine Part 6 values transcribed as named `const`
exports with literal types intact, so `TICK_MS` is the type `50` rather than
`number` and a later widening shows up at every call site. Each one carries a
one-line comment naming the part of docs/SIMULATION.md that decided it, because
Part 6 line 204 says changing a value requires updating the doc with a reason and
that only works if the code says which doc.

One addition beyond Part 6, flagged rather than buried: `TICK_SECONDS`. It is
written as `TICK_MS / 1000` rather than as the literal `0.05`, so it is derived
rather than transcribed and cannot drift out of step with `TICK_MS`. It exists so
that stage 4's integration does not divide by 1000 inline. The cost is that its
type is `number` rather than a literal, which is the correct trade for a value that
must follow another.

**The two placeholders.** `STEADY_EPSILON = 1e-6` and `STEADY_WINDOW = 20`. Both
comment blocks open with "UNVALIDATED PLACEHOLDER" and say explicitly that the
number is not a decision and carries no justification, because Part 6 gives none
and inventing one would be worse than the gap. They name the offline progress log,
which is neither V1 nor V2, as the thing that validates them, and note that its
first task is measuring settling against a real act 1 configuration. Also noted:
do not cite either value anywhere player-facing.

**src/sim/prng.ts.** Mulberry32. State is a single uint32 on a plain readable and
writable field, no closure. The object matches docs/SAVE_SCHEMA.md `rng` field for
field, `algorithm`, `seed` and `state`, so the save serialises it directly rather
than through a translation layer that can lose the state. `algorithm` is the
literal type `'mulberry32'` and `seed` is readonly. Saves are not in this log, but
the shape is.

Arithmetic is `>>>`, `<<`, `^`, `|`, `+`, `*` and `Math.imul` only. 2^32 is the
literal `4294967296` in a named constant, not a `Math.pow` call.

`next()` closes over the local `prng` binding rather than using `this`, so a
destructured `next` still advances the generator it came from instead of throwing
on an undefined receiver. There is a test for exactly that, because it is the kind
of thing that works until someone writes `const { next } = rng`.

Added `restorePrng(seed, state)` beyond the spec. Plain field assignment still
works and is tested separately, but the save loader should have one obvious call
rather than a two-step it can do half of. Restoring the seed and forgetting the
state is precisely the bug docs/SAVE_SCHEMA.md line 164 says is most likely to be
skipped.

**src/sim/__tests__/prng.test.ts.** Seven tests, all four required properties plus
three more. Same seed reproduces 1000 values. Different seeds diverge, and the
assertion is that fewer than 5 of 1000 values collide rather than merely that the
arrays differ, since a generator agreeing on 999 of 1000 would pass the weaker
form. Range holds over 100,000 draws across five seeds including 0 and 0xffffffff.
Save mid-sequence at draw 137, restore into a fresh instance, and the next 500
values match exactly.

The range test asserts on aggregated min, max and non-finite count rather than
three `expect` calls per draw. Per-value assertions cost 2.06s of a 3.21s suite,
which is a tax on every future change for no extra coverage. Now 10ms.

**Reference sequence, seed 1, first five outputs:**

```
0.6270739405881613
0.002735721180215478
0.5274470399599522
0.9810509674716741
0.9683778982143849
```

Frozen as a test assertion, not just reported here, so a later log or a port of the
generator has a known-good sequence to check against. If those five values ever
change, the save format changed with them.

**Verify.** `npm test` 7 passed in 10ms, `npm run lint` clean, `npm run typecheck`
clean. The determinism guard is live over both new files and had nothing to say
about them.

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

**src/sim/pools.ts.** `PoolRegistry`, built from an ordered array of
`PoolDefinition`. Each definition has an id, a label, an initial amount and a
`conserved` map of quantity name to stoichiometric weight, so a three-carbon
phosphorylated molecule is `{ carbon: 3, phosphate: 1 }`.

Internals as specified: one `Float64Array` of amounts, a frozen
`Record<string, number>` id-to-index map built at construction, `indexOf` for
setup-time lookup. `indexOf` throws on an unknown id rather than returning -1,
because a typo there is a wiring bug and -1 would quietly index nothing.

The conserved weights are stored as a flat `Float64Array`, `quantities x pools`,
indexed `q * count + i`, rather than as nested arrays or a map. Totalling a
quantity is then one linear pass over contiguous memory with no object access at
all. Object keys are iterated in exactly one place, the constructor, and never
again.

Quantity ordering is sorted rather than discovery-ordered, so two registries built
from the same pools in different definition orders produce the same
`conservedIds` and therefore the same flat layout. There is a test for it. This is
a determinism concern, not a tidiness one.

`ConservedId` is a plain `string` alias on purpose. A union of `'carbon' |
'phosphate' | 'redox'` would push content knowledge into the kernel, and the
kernel's whole premise is that it does not know what the state means.

**src/sim/reactions.ts.** `Reaction` with an id, ordered `substrates` and
`products` arrays of `{ poolIndex, coefficient }`, a kinetics descriptor and a
mutable `enabled` flag. Both kinetics kinds built: `michaelisMenten(vmax, km)` and
`hill(vmax, k, n)`, each a validating constructor rather than a bare object
literal, so a bad Km or Vmax fails at startup instead of producing NaN flux 40
minutes into a run.

`hill` throws on a non-integer or sub-one n. Not floored. A silently floored 2.7
is a balance value that no longer matches the doc it came from, which is worse
than a crash at construction.

`intPow` is a plain repeated-multiplication loop, not exponentiation by squaring.
n is 1 to 4 in practice, so the multiply count does not matter, and the loop's
operation order is trivially predictable, which does. `intPow(x, 1)` returns
exactly x, which is what makes the n = 1 bit-equality hold.

PFK-1 is the only Hill enzyme in the game and does not unlock until V2. The
descriptor is built now as instructed.

**Step 3, the modeling choice, flagged.** A multi-substrate reaction takes the
**minimum** of its per-substrate saturation terms, not their product. This is a
game decision, not biology. Real multi-substrate enzymes follow ordered or random
bi-bi mechanisms whose rate laws are neither. The min was chosen because it keeps
the limiting substrate legible: the player can point at one pool and say that is
the bottleneck, which is the entire lesson act 1 exists to teach. The product
would smear the constraint across every substrate and make the NAD+ wall
unreadable.

A second simplification rides along with it. One kinetics descriptor per reaction
means one Km shared across every substrate, where a real enzyme has a separate Km
per substrate.

**Both of these need an entry in docs/SCIENCE.md, or a row in the
docs/ECONOMY.md divergence table once that document exists.** docs/SCIENCE.md
Part 1 sets the disclosed-simplification posture and requires the methodology to
appear in-game. Neither choice is written down there yet, so as of this commit
they are undisclosed simplifications, which is the specific thing that posture
exists to prevent. Recorded in the file comment and asserted in a test so a
change to the rule is a visible failure rather than a silent balance shift, but
neither of those is the disclosure. The doc entry is still owed.

**src/sim/__tests__/kinetics.test.ts.** 19 tests. All five required properties:
zero flux at zero substrate, exactly `Vmax/2` at `S = Km` (`toBe`, not
`toBeCloseTo`), asymptotic to Vmax without reaching it out to `Km * 1e12`,
monotonic increasing across 400 sample points, and Hill at n = 1 equal to
Michaelis-Menten to the bit across 1600 points plus a handful of awkward
magnitudes including `Number.MIN_VALUE`. That last one is the off-by-one catch:
an `intPow` running one iteration too many or too few still produces a plausible
saturation curve, so an approximate comparison would pass it.

Beyond the required set: Hill is steeper than Michaelis-Menten below K and
flatter above it, which fails if n is silently doing nothing; the constructors
reject bad n, Km, K and Vmax; a disabled reaction produces zero flux at any
substrate level; the two-substrate minimum rule holds and is demonstrably not the
product; and a reaction with no substrates runs at Vmax, which is the shape an
environmental influx takes.

**One addition beyond the stage spec: src/sim/__tests__/pools.test.ts,** 6 tests.
Stage 5's conservation test asserts against `totalConserved`, so a bug in the
weight matrix would let that test pass while mass leaked out of the simulation.
Guarding the accounting directly rather than only through the thing it is meant to
audit seemed worth 60 lines.

**Verify.** `npm test` 32 passed across 3 files in 63ms, `npm run typecheck`
clean, `npm run lint` clean.

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

**src/sim/state.ts, an addition the spec implies.** The spec requires the flux
scratch array to be "allocated once at construction, not per tick", and
construction needed somewhere to live. `SimulationState` holds the pools, the
fixed-order reaction array, the PRNG, the integer `tickCount`, the diagnostics
object and six scratch typed arrays: `fluxes`, `scales`, `demand`, `poolFactors`,
`consumed`, `produced`, plus a `shortfallSeen` byte flag per pool. `tick`
allocates nothing at all.

**src/sim/dev.ts, also an addition.** Both dev-only guards in this stage need a
flag that is a compile-time constant under Vite so the production bundle drops the
branches, and that still resolves under Vitest and under a bare node run of the
harness. `import.meta.env?.DEV ?? true`. Absent means unbundled means development,
which is the safe default direction.

**src/sim/tick.ts.** In the order the spec sets:

(a) Every flux computed against the tick-start amounts into the pre-allocated
`fluxes` array. (b) Demand accumulated per pool. (c) Proportional scaling, capped
at four passes. Each pass recomputes demand from the current scale factors, takes
`available / demanded` for every over-drawn pool, and folds the minimum applicable
factor into each consuming reaction's scale. (d) All deltas applied. (e) Integer
tick counter incremented.

Deltas accumulate into separate `consumed` and `produced` arrays and land in one
write per pool, rather than being subtracted reaction by reaction. Otherwise a
pool's final value would depend on the order its consumers happen to sit in the
reaction array, since `a - (d1 + d2)` and `(a - d1) - d2` are not the same in
floating point. There is a test that runs the same pathway with the reaction array
reversed and asserts the pool amounts are bit-identical after 200 ticks.

Nothing is clamped anywhere. There is a test that a starved pool's consumer
produces exactly the mass the pool lost, which is the assertion clamping fails:
clamping the pool at zero without scaling its consumer manufactures product from
nothing.

**On the four-pass cap.** Hitting it is safe, not merely tolerable, and the reason
is worth writing down. The factors from the final pass are still applied, every
factor is at most 1, and applying them can only reduce demand, so stopping early
cannot drive a pool negative. What is lost by stopping early is exactness, not
safety: a pool may land slightly above zero rather than on it. In all three
harness scenarios the cap was hit on 0 ticks.

**On exactness, reported honestly rather than engineered around.** With a single
consumer a starved pool lands on **exactly** zero, `toBe(0)`, because the factor
is `available / demanded` and multiplying it back through the same expression
round-trips. With two or more consumers the residual has to be split, and the sum
of the split parts is within one ulp of the whole rather than equal to it, so the
pool lands a fraction **above** zero. Measured: 4.44e-16 out of 3 units, which is
one ulp, and on the non-negative side.

The last ulp could be bought by handing the residual to whichever consumer sits
last in the reaction array. Deliberately not done. It would privilege one reaction
for no reason beyond array position, and one ulp of a pool is orders of magnitude
below any tolerance the conservation test will use and far below anything the
player can see. The test asserts the property that matters, non-negative and
within one ulp, and the reasoning is in a comment in tick.ts rather than only
here.

**Shortfall diagnostics.** `shortfallTicks` counts per pool, once per pool per
tick rather than once per scaling pass. The development log is throttled to once
per pool per `TICK_RATE_HZ` ticks, so once per game-second, since per-tick logging
at 20Hz makes the console useless and a useless console gets ignored, which
defeats the point of surfacing a balance bug. Added `setShortfallLogging(enabled)`
beyond the spec: the starved harness run emitted 60 warning lines that buried the
report it was printing, and the test suite emitted thousands. The counters are
always kept, only the text is silenced. `npm run sim -- 1200 starved --verbose`
shows it.

**SAFE_VALUE_CEILING.** Checked after deltas are applied, in development builds,
throwing with the pool id and the tick number. It throws. Not softened to a
warning. Tested.

**src/sim/loop.ts.** The accumulator from Part 1. Elapsed milliseconds are an
argument rather than something read here, because Part 5 puts `Date.now` outside
simulation code and the ESLint rule from stage 1 enforces it in this directory.
Whatever drives the loop reads the clock and passes the delta in. The fractional
remainder is returned for interpolation and never reaches simulation state.

Catch-up caps at `MAX_CATCHUP_TICKS`. The excess is not dropped: whole ticks'
worth of it is added to `diagnostics.pendingOfflineMs` for the offline path to
consume, with a comment naming docs/SIMULATION.md Part 3 as its owner. There is a
test that feeds in one hour in a single call and asserts that simulated time plus
pending offline time plus the leftover accumulator equals exactly what went in,
so the "nothing is lost" claim is checked rather than asserted. Negative deltas
credit zero, per Part 3 on clock tampering.

Also exported `elapsedMs(state)`, the tick-count-to-milliseconds conversion, which
is the boundary docs/SAVE_SCHEMA.md persists.

**src/sim/harness.ts, `npm run sim`.** Run with `vite-node`, which ships with
Vitest, so the harness and the app resolve modules identically. Three scenarios
over one synthetic pathway, differing only in two Vmax values:

```
  r1:  A + 2 X + 2 P  ->  2 B + 2 Y      forward, reduces the carrier
  r2:  B              ->  C + P          forward, releases phosphate
  r3:  Y + C          ->  X + D          recycling, reoxidises the carrier
```

Every reaction balances carbon, phosphate and redox independently, which is what
makes the printed conservation check mean anything. X and Y are two states of one
small fixed carrier pool, so r3 is the ceiling on everything upstream. That is
structurally act 1's shape without being act 1. Pools are A, B, C, D, P, X, Y and
every number is invented. There is a comment at the top saying so.

**Verify, `npm run sim` for 1200 ticks, balanced:**

```
  1200 ticks, 60.0 game-seconds, 60000 ms

  pool           amount   short ticks   label
  A         3366.072264             0   six carbon, carries two redox
  B            2.172277             0   three carbon, phosphorylated
  C            2.236492             0   three carbon
  D         1263.446703             0   three carbon, reduced end product
  P          397.827723             0   free phosphate
  X            5.591231             0   carrier, oxidised
  Y            4.408769             0   carrier, reduced

  conservation
    carbon     start 24000.0000   end 24000.0000   relative drift  3.259e-14
    phosphate  start   400.0000   end   400.0000   relative drift -8.527e-16
    redox      start  8000.0000   end  8000.0000   relative drift  3.251e-14

  scaling pass cap hit on   0 ticks
  pending offline ms        0
```

The carrier splits about 5.59 oxidised to 4.41 reduced and holds there, which is
the system sitting in steady state. Nothing runs short.

**Starved, 1200 ticks.** X short on **1198 of 1200 ticks**, everything else zero,
scaling cap hit on 0 ticks, conservation drift 4.169e-14 relative on carbon and
-1.421e-16 on phosphate. X ends at 0.016656 rather than 0 because r3 refills it
within the same tick after r1 has drained it, which is correct: consumption takes
the pool to zero and production then adds to it.

**On confirming the exact-zero landing.** The first starved configuration I built
never triggered the guard at all. Saturating kinetics throttle a reaction smoothly
as its substrate approaches zero, so a slow recycling step starves the pathway
without ever over-drawing it in a single tick. That case is genuinely worth
seeing, so it is kept as a third scenario, `throttled`: X falls to 0.041971 and
gates throughput with 0 shortfall ticks anywhere.

Forcing the guard needs a consumer whose Vmax demands more in one tick than the
pool holds, which is what the `starved` scenario now does. The exact-zero claim is
confirmed in `src/sim/__tests__/tick.test.ts` rather than by eye, because the
harness pool refills in-tick: one consumer, one pool, nothing producing it, and
the pool is `toBe(0)` afterwards. Also asserted: not negative zero, and no pool
goes negative across 5000 ticks of a deliberately unstable three-reaction cycle
with Vmax values two to three orders of magnitude above the pool sizes.

**src/sim/__tests__/tick.test.ts, an addition.** 17 tests. Two-phase update,
reaction-order independence, exact-zero landing, proportional sharing between two
consumers at a 3:1 demand ratio, the smaller-of-two-factors rule, non-negativity
under stress, the integer tick counter, the ceiling assertion, disabled reactions,
and six loop tests including the catch-up cap accounting.

**Verify.** `npm test` 49 passed across 4 files. `npm run typecheck` clean.
`npm run lint` clean. `npm run sim` output above.

One thing to note for stage 5: the harness owns its synthetic pathway inline right
now. Stage 5 creates the canonical fixture at
`src/sim/__tests__/fixtures/toyPathway.ts`, and the harness should import that
instead of keeping a second copy.

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

**src/sim/__tests__/fixtures/toyPathway.ts.** Three reactions, eight pools:

```
  r1:  A + 2 X + 2 P  ->  2 B + 2 Y     forward, reduces the carrier
  r2:  B              ->  C + G + P     forward, splits the carbon
  r3:  Y + C          ->  X + D         recycling, reoxidises the carrier
```

X and Y are the two states of one small fixed carrier pool, and r3 is the ceiling
on everything upstream of it. That is the structural requirement: a small fixed
recycling pool gating throughput, which is the shape the offline steady-state work
in a later log has to settle against.

Carbon is carried at four different counts, 6, 3, 2 and 1, rather than at one
count throughout. That was deliberate and it earns its keep: with a single carbon
count a dropped stoichiometric coefficient can cancel out and leave the total
unchanged, so the conservation test would pass a bug it was built to catch. Every
reaction balances carbon, phosphate and redox independently, and the arithmetic
for all three is written out in the file header.

The file opens with `THIS IS NOT BIOLOGY. NOTHING HERE MAY BE CITED.` It is not
glycolysis, every number in it is invented, and it lives in `__tests__/` so it
cannot ship. Hard rule 1 is not in play, and the comment is there so nobody later
concludes otherwise.

`createToyPathway(options)` takes initial-level, Vmax, Km and seed overrides, which
is what lets the conservation test randomize configurations without a second copy
of the pathway.

**The harness now imports the fixture** rather than keeping its own copy, which
is the item stage 4's report flagged. Three scenarios are now three sets of Vmax
overrides on one pathway, so the thing being looked at and the thing being
guarded cannot drift apart.

**src/sim/__tests__/conservation.test.ts.** Six tests. The default configuration
over 5000 ticks; 200 randomized configurations at 500 ticks each with initial
levels from 0 to 2000, Vmax spanning two orders either side of the fixture
defaults, and Km an order either side; 100 shortfall-forcing configurations; a
case with every pool scarce at once so reactions are scaled by factors from more
than one pool; 50 runs asserting non-negativity every tick; and a measurement run.

Zero is included as a legitimate starting level on purpose, at 15% probability.
Randomization is seeded, because a failure that cannot be reproduced is not
actionable.

The shortfall test asserts `sawShortfall` at the end. If none of its
configurations actually tripped the guard, the test would be asserting nothing
about the code path it exists to cover, and it would fail rather than pass
quietly.

**Tolerance: 1e-9, relative, per quantity.** The reasoning, which is in the file
as well as here:

The floor is float noise. Explicit Euler over N ticks does O(N) rounded additions
per pool and the error accumulates. The worst relative drift measured anywhere in
this suite is **1.964e-13**, produced by the last test in the file, which runs 60
configurations for 4000 ticks each and prints the worst it saw. 1e-9 is between
three and four orders of magnitude above that.

The ceiling is what a real leak looks like. Conservation bugs are not subtle in
magnitude. Clamping a pool at zero, dropping a coefficient, writing a product to
the wrong index, or scaling a reaction's substrates without its products each
destroy or manufacture an O(1) share of one reaction's throughput. Over hundreds
of ticks throughput is comparable to the totals themselves, so any of them shows
as relative drift of 1e-3 or worse. There is no mechanism in this kernel that
leaks at 1e-8. The gap between 1e-13 noise and 1e-3 leaks is six orders wide and
1e-9 sits in the middle of it.

Relative rather than absolute, because carbon totals in the tens of thousands and
redox in the thousands would otherwise be held to wildly different standards.

The measurement test asserts the observed worst stays below `tolerance / 1000`.
That is the headroom claim made into an assertion: if drift ever climbs toward the
tolerance, the argument above has stopped being true and needs redoing rather than
the tolerance being loosened.

**src/sim/hash.ts, an addition.** The state hash is simulation code, not test
code. It has to obey the same determinism rules as everything else in `src/sim/`
and it is what CI will compare, so it lives with the kernel and the ESLint rule
covers it.

FNV-1a, 32 bit, over the canonical string form: pool amounts in registry order
tagged with their ids, then the tick count, then the PRNG algorithm, seed and
state. Fixed order, arrays only, no object-key iteration. Ids are included so a
state with a pool removed cannot collide with one that has a different value in
the same position.

Floats serialise via `String(value)`, which produces the shortest decimal that
parses back to the same float64, so the round-trip is exact. Negative zero is
spelled out as `-0` rather than stringifying to `0`, because a pool at -0 is a
real difference in state and the hash should see it. Both properties are tested:
one test parses every pool back out of the encoded form and asserts bit equality,
another asserts 0 and -0 hash differently.

**src/sim/__tests__/determinism.test.ts.** Ten tests. Same seed and script run
twice produce the same hash. Three different seeds produce three different hashes.

The input script consumes the PRNG, toggling one PRNG-selected reaction every 50
ticks, which is the shape unlocks and enzyme damage take in the real game. That
matters: without it, the seed would reach the hash only through the RNG state
field, so "different seeds produce different hashes" would be satisfied by the
hash reading the seed and ignoring the simulation entirely. Two further tests
close the same hole from the other side, asserting the hash changes after one
extra tick and after a single pool moves by one ulp.

FNV-1a is checked against the published 32-bit reference vectors for `""`, `"a"`
and `"foobar"`, so a drift in the hash implementation is caught without needing a
simulation at all.

**Canonical determinism hash: `172f83fb`.**

Fixture: `createToyPathway({ seed: 20260728 })`, 1200 ticks, toggling one
PRNG-selected reaction every 50 ticks. Frozen as an assertion, not just reported,
so CI and later logs have a known-good value. A change to it means the kernel's
arithmetic changed, which may well be correct but is never incidental.

**Coherence pass.** typecheck, lint, build and the full suite all clean. Read
through `src/sim/` as a whole and swept it for the specific hazards:

- No `Math.random`, `Math.pow`, `Math.exp` or `Math.log` anywhere. Every textual
  hit is a comment explaining why they are banned.
- No `Date.now`, no `new Date`, no `performance.now`. Wall-clock time enters only
  as an argument to `loop.advance`.
- No object-key iteration in flux computation. One `Object.keys` exists in the
  whole kernel, in the `PoolRegistry` constructor where the conserved-weight
  matrix is built, which is construction and not the hot path. It is commented as
  such.
- No float accumulation of game time. `tickCount` is `+= 1` and the only
  conversion to milliseconds is `elapsedMs` at the boundary.
- No allocation inside `tick`. All working arrays are on the state object.

Nothing needed fixing.

**NOW.md.** All six required edits plus the build state table:

- Line 13's "Pre-code. No source files, no package.json, no build, no git
  repository." replaced with a status that says the kernel runs, and says plainly
  that there is no content and no interface so there is nothing a player could
  touch yet.
- Blocking item 1, the missing git repository, removed. The remaining two
  renumbered to 1 and 2. Neither was touched otherwise: the five unsourced
  timeline dates and the act 2 Fe-S target are still open and still violate hard
  rule 1.
- "Cross-document paths are broken" removed from "Open, not blocking", resolved by
  stage 1.
- New "What the kernel does" section listing the eight files in `src/sim/` with
  one line each, the test count, the conservation figure, the determinism hash and
  the lint guard. Plus what is deliberately not built.
- "Next, in order" is now the docs/SCIENCE.md sourcing pass then V2, with a note
  on why that order. "The vertical slice" splits into what V1 did and what V2 has
  left.
- New `## Build state` table with a row per log: V1 done, V2 and V3 not started.
  Later logs append.

Two things added to "Open, not blocking" that were not in the stage list, because
this log created them and leaving them only in a report would lose them: the
`STEADY_EPSILON` and `STEADY_WINDOW` placeholders now say what they shipped as and
what validates them, and the two undisclosed kinetics simplifications from stage 3
are recorded as owing a docs/SCIENCE.md entry.

**Verify.** `npm run typecheck` clean. `npm run lint` clean. `npm run build`
clean, 29 modules, 193.37 kB raw and 60.74 kB gzipped. `npm test` **65 passed
across 6 files** in 1.53s. Conservation tolerance 1e-9 relative against 1.964e-13
observed. Canonical determinism hash `172f83fb`.

---

# After These Stages

- The kernel exists and is guarded. Conservation and determinism are tested properties rather than intentions, and the ESLint rule means hard rules 4 and 5 fail the build instead of failing review.
- V2 adds act 1 content on top: glucose uptake, glycolysis, the NAD+ pool and lactate fermentation, all from `docs/SCIENCE.md` Part 2 and `docs/PROGRESSION.md` act 1. The conservation test starts guarding real biology the moment that content lands, which is the ordering `SIMULATION.md` line 90 asks for.
- Still deferred on purpose, see `NOW.md`: offline progress (`SIMULATION.md` Part 3, needs settled content to settle against), saves and migrations (`docs/SAVE_SCHEMA.md`), the design system (`DESIGN.md`), the timeline and the beast.
- `STEADY_EPSILON` and `STEADY_WINDOW` ship as unvalidated placeholders in stage 2 and stay that way until there is a real act 1 configuration to measure settling time against. That measurement is the first thing the offline-progress log has to do.
- Two open items this log does not touch: the five unsourced timeline dates and the missing act 2 Fe-S target. Both are `docs/SCIENCE.md` work and both still violate hard rule 1 until the sourcing pass lands.
