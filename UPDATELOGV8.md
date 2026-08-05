charlie

# krebs, V8: Offline Progress
# Work on one stage at a time. Do NOT combine stages.

---

## Context

Read `NOW.md` first, then `docs/SIMULATION.md` Part 3 in full, twice. It is the longest and most carefully argued part of that document and it calls itself "the hard problem, and the one most idle games get wrong". Then read `src/sim/constants.ts`, `src/save/offline.ts` and `src/save/__tests__/reloadDeterminism.test.ts`.

Part 3 rejects four obvious approaches with reasons and specifies a fifth in six numbered steps. Nothing about the algorithm is open. What is open is every number it depends on: **`STEADY_EPSILON` and `STEADY_WINDOW` have been unvalidated placeholders since V1**, at 1e-6 and 20, and `src/sim/constants.ts` says so at length in a comment that begins "UNVALIDATED PLACEHOLDER" and ends by saying the offline log's first task is measuring real settling behaviour and replacing them.

Every earlier log has been leaving this one its inputs. V1 wrote the constants and the accumulator that routes excess time to `pendingOfflineMs`. V2 built the first real configuration to settle. V4 made `pendingOfflineMs` survive a reload, measured real time away at load, capped it and credited it to nothing, and built a hash-equality harness for comparing two ways of reaching the same state. `NOW.md` records the seam in its own words: **nothing spends it, the field just grows, and the save panel says the time away is being kept and not spent, which is the honest sentence and will stay wrong-sounding until this log makes it true.**

This log builds offline progress. It does **not** add content, change the economy, change any tuned number, touch act 2 or build any interface beyond the return summary `DESIGN.md` already specifies. It is the last of `docs/SIMULATION.md`'s parts to be implemented.

## Decisions

- **Measurement first, and the two placeholders are stage 1's entire job.** `docs/SIMULATION.md` Part 6 marks both "tune during prototype", offers no value and no justification, and Part 3 makes a validation requirement out of it. There is now a real act 1 configuration, a real economy settled by V5 and a save that can restore mid-run. Nothing about them was measurable before and everything about them is measurable now.
- **The Part 3 validation test is the deliverable and the algorithm is the means.** Part 3 says in its own words that the test "is the justification for the entire approach" and that "without it the offline path is an unverified shortcut". A log that shipped a working offline path and a thin test would have shipped an unverified shortcut with a working demo attached.
- **Offline progress is the first thing in this project that is deliberately approximate, and the determinism guarantee has to be scoped rather than quietly bent.** Every hash assertion in the codebase is exact string equality. The analytic jump is correct within a tolerance and cannot be bit-identical to full replay, so `hashState` equality across an offline jump is not achievable and must not be asserted. Stage 4 states the scope precisely and writes it into `docs/SIMULATION.md` Part 5, which is a spec edit and therefore deliberate rather than incidental. The property that survives is that the offline path agrees with full replay within tolerance, and the property that does not is bit-identity.
- **The fallback is a bug signal and gets treated as one.** Part 3 says a well-tuned configuration should always settle, that failing to settle means the configuration is oscillating or chaotic, and that the flag is not a normal condition. `diagnostics.offlineFallbackCount` already exists in the save schema for exactly this. If act 1 as V5 balanced it trips the fallback in normal play, that is a finding about the economy and it goes back to `docs/ECONOMY.md` rather than being absorbed by making the fallback comfortable.
- **This log inherits whatever V5 chose about the static mid-game and the cost may be real.** V5 stage 3 was told to choose between more unlocks and a varying environment, and told explicitly that a varying environment means the offline path falls back to coarse replay every time, and told to say so in its report. Stage 1 reads that report before measuring anything. If the environment varies, the settling measurement is the thing that finds out how badly.
- **Act 1's event set is nearly trivial and stage 3 should say so rather than building for a complexity that does not exist yet.** Part 3 step 3 lists four event kinds. Act 1 has a finite substrate pool that depletes, no storage pool with a capacity, no environmental schedule until act 2 and unlock thresholds that a player is not present to act on. Building a general enumerator against one real event is speculative generality, and Part 3's own open question about whether the enumeration stays tractable in act 4 is not answerable from act 1.
- **An unlock threshold crossed while away is not a simulation event.** The player is not there to buy anything, and V3 established that unlocks are thresholds against a counter rather than purchases against a pool, so a crossing changes nothing about the trajectory. It is worth reporting to the player on return and it does not interrupt the jump. Stage 3 keeps those two things apart.
- **The return screen shows the event sequence, because `DESIGN.md` already decided that.** `docs/SIMULATION.md`'s open question asks whether it would be noise; `DESIGN.md`'s screen inventory answers it and gives the reason: the algorithm produces a genuine bounded event list, so showing it is both honest and instructive, and it teaches that metabolism is homeostatic between shocks rather than smoothly accumulating. Where two documents disagree the more recent decision wins and it is `DESIGN.md`'s.
- **Clock tampering is handled exactly as specified and no further.** Cap at `MAX_OFFLINE_HOURS`, reject negative deltas and credit zero. Part 3: "Do not build further anti-cheat. This is a single-player educational game with nothing to protect." V4 already implemented the cap and the rejection at load, so stage 5 wires them rather than reinventing them.
- Large system, and Part 3 specifies it in six steps: six stages.

## The algorithm, transcribed so no stage paraphrases it

`docs/SIMULATION.md` Part 3, steps 1 to 6, with the constant each step uses.

```
  1  replay at full fidelity, bounded          SETTLE_MAX_TICKS      1200
  2  test for steady state                     STEADY_EPSILON        1e-6
     all derivatives below epsilon, sustained  STEADY_WINDOW         20
  3  identify the next event, closed form
  4  jump to the earliest event or the end of the window
  5  apply the event, return to 1
  6  repeat until the window is consumed       EVENT_BUDGET          64

  fallback   coarse replay at 1Hz              MAX_OFFLINE_HOURS     24
             record diagnostics.offlineFallbackCount
```

Cost scales with the number of events in the window, not with its length. Two of these six constants have never been validated and they are the two the whole thing turns on.

---

# Stage 1 — Validate STEADY_EPSILON and STEADY_WINDOW

```
Measurement only. No offline code in this stage. src/sim/constants.ts has been
asking for this since V1 and it names this log as the one that does it.

1. Read V5's stage 3 report first, specifically which candidate it chose for the
   static mid-game. If it chose a varying environment, this stage is measuring a
   system that may not settle at all and that is the finding rather than an
   obstacle. Say which it chose before reporting any number.

2. Instrument settling. For a run of act 1, per tick, compute each pool's
   derivative as a fraction of its own size, which is what Part 3 step 2
   specifies. Report the trajectory: how those derivatives fall over time, which
   pool is last to settle, and at what tick every one of them is below a given
   epsilon.

   Do this across the configurations act 1 actually reaches, not one:
     - fresh start, ferment disabled, which stalls
     - fresh start, ferment enabled
     - after each unlock in V5's ladder
     - the environment near depletion, where uptake is falling
     - immediately after fermentation is bought, which is the fastest transient
       in the game and V3 measured recovery at two ticks

3. Derive both constants from that data rather than confirming the placeholders.
   Report what each should be and why:
     - STEADY_EPSILON. Too large declares a moving system steady and the jump
       then extrapolates a rate that was still changing. Too small never
       settles and every absence falls back to coarse replay. Report the
       measured margin between the two failure modes, because a constant with
       no margin is a constant that will need retuning every balance pass.
     - STEADY_WINDOW. How many consecutive ticks are needed to distinguish
       genuinely settled from momentarily flat. Report whether act 1 has any
       moment that is flat without being settled, because if it does not then
       20 is unjustifiable in either direction and the honest report says the
       configuration is too simple to constrain it.

4. Report against SETTLE_MAX_TICKS, which is 1200 ticks or 60 game-seconds.
   Does act 1 settle inside the budget from every configuration in step 2. Part
   3's first open question for the prototype asks exactly this about act 4 and
   act 1 is the first configuration that can answer it for anything.

5. Update src/sim/constants.ts with the measured values, replacing the
   UNVALIDATED PLACEHOLDER blocks with the measurement, the method and this
   log's stage as the source. If a measured value equals the placeholder, say
   so and keep it, because a validated 20 and an unvalidated 20 are different
   numbers even though they read the same.

   docs/SIMULATION.md Part 6 says all values other than the two marked for
   tuning are decisions and that changing one requires updating the doc with
   the reason. These are the two marked for tuning, so this is the change Part
   6 was written to expect. Update Part 6 to carry the measured values and drop
   the "tune during prototype" marker.

Verify: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`,
`npm run sim:act1`. Report V5's mid-game choice, the settling trajectories for
every configuration in step 2, the derived values for both constants with the
margin between failure modes, whether act 1 settles inside SETTLE_MAX_TICKS,
and the docs/SIMULATION.md Part 6 diff.
```

## Stage 1 Report

**Both placeholders were wrong and the criterion they attach to was wrong too.** `STEADY_EPSILON` moves from 1e-6 to **1e-5**, because 1e-6 sits outside the usable band. `STEADY_WINDOW` moves from 20 to **250**, because 20 is an order of magnitude below its measured floor. And `docs/SIMULATION.md` Part 3 step 2's criterion, which this stage was told to measure against, **is unsatisfiable in act 1 at any epsilon below 1e-3**, so it was corrected in the same stage. That last finding is the one everything else depends on and it is reported first.

### Step 1. V5 chose more unlocks. The environment does not vary

`UPDATELOGV5.md` stage 3 rejected candidate (b), a varying environment, and it rejected it **on exactly the cost this log was going to pay**: its own report says an environment that never settles makes the offline path fall back to coarse replay every time, which Part 3 describes as a bug signal rather than a normal condition. What shipped instead was the glycolytic capacity ladder, four purchases moving four rates each.

So this stage is measuring a system that should settle, and it does. The inheritance was real rather than rhetorical: had V5 taken (b), everything below would have been a report about how badly a permanently unsettled configuration degrades.

### Step 2. The criterion in Part 3 step 2 cannot be met, and it contradicts step 4

Instrumented per tick over 2400 ticks against three candidate criteria, on twelve configurations.

    A   Part 3 as written   max over pools of |da| / a per tick
    B   rate constancy      max over reactions of |dv| / v per tick, applied flux
    C   pool curvature      max over pools of |d2a| / a per tick

**Criterion A never settles.** Sustained for 20 ticks, on the fresh fermenting configuration, it reaches 1e-3 at tick 1041 and never reaches 1e-4 inside 2400. Every other configuration is the same. The pool carrying it is `lactate` in every fermenting case and `atp` in the walled one.

**The reason is structural rather than a matter of epsilon.** `lactate` is a terminal product accumulating from zero at a constant rate and `glucose_env` is a finite substrate draining at a constant rate. For a pool changing linearly, `|da| / a` is the rate over the amount, which decays as one over elapsed time and reaches no floor. Lactate would need to reach 397500 units for its fractional derivative to fall below 1e-6 at act 1's shipped rate, which is 13.9 game-hours of fermentation.

**And the criterion contradicts the algorithm it belongs to.** Part 3 step 4 applies accumulated output as rate multiplied by duration. A pool whose amount has stopped changing has no output to accumulate. The pools the jump exists to advance are precisely the pools criterion A forbids from ever being steady.

**Criterion B works for a running cell and fails for a stalled one.** It settles the fresh fermenting configuration at 246 ticks at 1e-6, and it never reaches 1e-3 in the walled configuration inside 2400 ticks. The pool is `maintain`, whose flux is decaying toward zero: a purely relative measure on a vanishing rate never converges, however small the absolute quantity gets.

**Criterion C works everywhere, and it is closer to Part 3's own wording than B is.** It is still per pool and still normalised by pool size. What it measures is the second difference rather than the first, which is the thing that has to be small for a linear extrapolation to be right.

    at tick 2400, fresh fermenting configuration
      A   4.203e-4  on lactate
      B   3.161e-8  on uptake
      C   1.328e-11 on lactate

    at tick 2400, walled configuration
      A   4.258e-4  on atp
      B   1.277e-3  on maintain
      C   3.630e-7  on atp

`docs/SIMULATION.md` Part 3 step 2 is corrected to state criterion C, keeping the old sentence on the page with the correction rather than deleting it, in the same spirit as V7 stage 5's handling of the colour-leaving sentence. **A specification that quietly rewrites itself teaches nobody why the first version failed.**

**The residual floor of a settled act 1 cell is the environment, and it is arithmetic.** Criterion B's 3.161e-8 on `uptake` is not noise. For Michaelis-Menten uptake, the fractional rate of change of the flux is `Km / (Km + S)` times the fractional drain rate of `S`, which at Km 500, S 80000 and 0.3975 glucose per tick is 0.00621 times 4.97e-6, which is 3.09e-8. Measured 3.161e-8. **Act 1 is never exactly steady and never can be**, because the food is finite. What the constants have to decide is how much of that residual counts as steady enough.

### Step 3a. STEADY_EPSILON. The band is 3e-6 to 1e-4 and 1e-6 is outside it

**Too small, measured.** The binding configuration is the walled cell, whose ATP decays as a power law after the NAD+ wall and whose curvature therefore falls slowly. Settle tick under criterion C at a window of 20:

    eps      walled   fermenting   uptake r2   glyc r4   ferment bought
    3e-4        784           72         73        59               51
    1e-4        784          101        101        87               56
    1e-5        784          155        235       229              278
    5e-6        784          169        283       299              308
    3e-6        890          180        317       359              330
    2e-6       1073          189        345       409              346
    1e-6       1487          203        390       502              375
    1e-7      never          250        535       841              680

At the chosen window of 250 every figure above gains 230 ticks, so the walled cell settles at 1120 for 3e-6 and 1303 for 2e-6 against a `SETTLE_MAX_TICKS` of 1200. **The lower failure boundary is 3e-6 and the shipped placeholder of 1e-6 is a factor of three below it.** At 1e-6 a walled cell does not settle inside the budget, so every absence spent at the NAD+ wall would have fallen back to coarse replay, which Part 3 calls a bug signal.

**Too large, measured.** Extrapolate the per-tick rates from the tick each epsilon declares and compare cumulative gross ATP against full replay, fresh fermenting configuration:

    eps    settledAt    1 min      10 min     60 min
    1e-2          34    1.15e-1    1.18e-1    1.18e-1
    1e-3          48    5.60e-2    5.80e-2    5.70e-2
    3e-4          72    1.71e-2    1.80e-2    1.68e-2
    1e-4         101    4.12e-3    4.28e-3    3.03e-3
    3e-5         130    9.70e-4    8.96e-4    3.74e-4
    1e-5         155    2.69e-4    1.29e-4    1.15e-3
    3e-6         180    6.59e-5    9.69e-5    1.38e-3
    1e-6         203    1.01e-5    1.60e-4    1.44e-3
    1e-7         250    1.31e-5    1.87e-4    1.47e-3

**The sixty-minute column converges on 1.47e-3 and stops improving**, because below about 3e-5 the residual is the environment draining rather than the transient, and no epsilon can fix a genuine change by declaring it small. That convergence is what sets the upper boundary: at 1e-4 the error is 3.03e-3, twice the floor, and at 3e-4 it is 1.68e-2, eleven times it.

**So the band is 3e-6 to 1e-4, a factor of 33, and 1e-5 is the round value nearest its geometric centre**: 3.3x above the fallback boundary and 10x below the accuracy boundary. **The margin the stage asked for is a factor of 33 and that is thin.** Its lower half is set by how fast a walled cell's ATP decays, which is `ACT1_MAINTAIN_HILL_N`, and its upper half by the environment size. Any balance pass touching either has to re-run this measurement rather than assume the constant survived, and `src/sim/constants.ts` says so.

### Step 3b. STEADY_WINDOW. Act 1 has a flat moment that is not settled, and it is 141 ticks long

**This stage expected to report that act 1 is too simple to constrain the window, and that is not what the data says.** The prompt anticipated it, and the honest answer is the other one.

Buying fermentation produces a two-timescale recovery. The pathway restarts in 2 ticks, which is what V3 measured and what a player sees. What V3 could not see is the second timescale: the intracellular glucose that piled up during the stall drains over several hundred more ticks. **Between the two the system goes quiet, and at 1e-5 it sits below threshold for 141 consecutive ticks before moving again.**

Longest below-epsilon run that is not the terminal one, ferment-bought configuration:

    eps      1e-4   5e-5   3e-5   1e-5   5e-6   1e-6   5e-7   1e-7
    ticks     363    227    195    141    111     44     16      0

**What a window of 20 costs, measured.** Declare steady at the tick each window picks, extrapolate, compare against full replay:

    declaredAt   window   ATP error over 1 min   10 min    60 min
           278       20                2.05e-1  3.12e-1   3.27e-1
           500        -                1.47e-2  2.19e-2   2.42e-2
           600        -                1.02e-4  3.24e-4   1.62e-3
           712      142                1.13e-5  1.82e-4   1.47e-3
           900        -                1.00e-5  1.79e-4   1.47e-3
          1100        -                9.23e-6  1.77e-4   1.47e-3

**The smallest window that clears the gap is also the window that lands the declaration where the extrapolation is right.** 142 gives 1.47e-3 over an hour, which is the same answer 900 and 1100 give, which is the environmental floor. 20 gives 32.7 percent. That coincidence was not designed and it is the reason to trust the number.

**The band is 142 to 436.** The floor is measured above. The ceiling is arithmetic: the window adds to every settle tick one for one, the walled cell settles at 784 plus the window, and the budget is 1200. **250 is the geometric centre of 142 and 436**, so both failure modes sit 1.76x away, which is the only choice that does not prefer one failure to the other without a reason to.

**One case in the sweep looks like a false flat and is not, and it matters that they are told apart.** At an environment of 1000 the cell sits below epsilon for 1889 ticks and then rises above it. That is not a transient mistaken for steady. It is a genuine steady state that stops being steady because the environment ran down, which is precisely the event step 3 of the algorithm exists to find. It does not size the window and it was excluded from the floor above.

### Step 4. Every act 1 configuration settles inside SETTLE_MAX_TICKS, and the worst is 85 percent of it

At the shipped constants, 1e-5 and 250, against a budget of 1200:

    walled, fresh                             1014
    ferment bought after 200 walled ticks       820
    glycolysis rung 1                           491
    glycolysis rung 2                           494
    uptake rung 2 (Vmax 12)                     465
    glycolysis rung 4                           459
    glycolysis rung 3                           458
    uptake rung 1 (Vmax 10)                     461
    fermenting, fresh, uptake 8                 385

    environment sweep, settled cell, both rungs
      80000  40000  30000  20000  10000  5000  2000  1000  600  400
        250    250    250    250    250   250   250   250  250  250

**Nothing falls back.** The environment sweep settles at exactly the window in every case, meaning a cell already settled stays settled all the way down to an environment of 400, which is well past anything act 1 reaches. The stage's own worry about the near-depletion configuration does not materialise under criterion C, and it does under criteria A and B, which is a fourth argument for C.

**The answer to Part 3's first open question, for act 1 only.** The binding case uses 85 percent of the budget and it is the walled cell, not any healthy one. Every configuration a solved act 1 reaches uses between 32 and 41 percent. **That is a comfortable margin for act 1 and it says nothing about act 4**, which will have more pools, more coupling and at least one more timescale. What it does say is that the number that will eat the budget first is a stalled configuration rather than a busy one, because a stall is a slow decay rather than a fast equilibrium, and that is worth knowing before act 4 is designed. Left in the open questions for stage 6 to record.

### The diff

`src/sim/constants.ts`. Both `UNVALIDATED PLACEHOLDER` blocks are gone. `STEADY_EPSILON` is 1e-5 and `STEADY_WINDOW` is 250, each carrying the measurement, both failure boundaries, the margin between them and the stage that produced it. Neither is a placeholder and neither is a round number chosen for looking round.

`docs/SIMULATION.md` Part 3 step 2. The criterion is corrected from the first difference to the second, with the old sentence kept and the reason it failed stated. Two reasons: unsatisfiable in act 1 at any usable epsilon, and contradicted by step 4 of the same algorithm.

`docs/SIMULATION.md` Part 6. `STEADY_EPSILON 1e-5` and `STEADY_WINDOW 250` replace `tune during prototype`. The paragraph below the table said "all values other than the two marked for tuning are decisions"; there are no longer two marked for tuning, so it now says every value is a decision, followed by a note recording what the placeholders were, that both moved, and that the band is narrow enough to need re-measuring after a balance pass.

**No simulation code changed and no tuned number moved.** The two constants are engine tolerances that nothing reads yet, which is why the act 1 canonical hash is untouched and the bundle is byte-identical to V7's at 268.94 kB.

### Verify

`npm test` 415 passed across 34 files, unchanged from V7 because nothing consumes these constants yet. `npm run typecheck` clean. `npm run lint` clean. `npm run build` clean, 268.94 kB and 83.73 kB gzipped, identical to V7. `npm run sim:act1` runs and reports 4.000000000 gross and 2.000000000 net ATP per completed glucose with worst conservation drift 2.001e-15 over the harness run.

**The measurement scripts were temporary and are not committed.** Four probes were written and deleted: the three-criterion trace, the boundary sweep, the window sweep and the confirmation run. They are measurement rather than product, stage 2 builds the real detector in `src/sim/steady.ts`, and a permanent second implementation of the criterion is exactly the two-copies-of-one-fact problem V4 settled against. Every number in this report is reproducible from the criterion definitions above and the shipped constants.

---

# Stage 2 — Steady-state detection

```
Part 3 steps 1 and 2, using stage 1's measured constants. Still no jumping.

1. src/sim/steady.ts, in the kernel rather than in save or content, because it
   is a property of the simulation rather than of act 1 and act 2 will need it
   unchanged. It obeys every rule that directory obeys: no Math.pow, no
   Math.random, no Date, no object-key iteration on the hot path, no allocation
   per tick. The ESLint guard already covers it.

2. A detector that runs alongside the tick and answers one question: is this
   system settled. It needs per-pool derivative tracking with a rolling window
   of STEADY_WINDOW, and it must allocate its buffers once at construction the
   way src/sim/state.ts does for the tick scratch arrays.

   It must not perturb the simulation. Nothing it computes goes back into a
   pool, the PRNG or the tick count. Assert that: run act 1 with the detector
   attached and without it and confirm hashState is identical. That is the
   cheapest possible guard against the whole category of mistake this stage
   could make.

3. Bounded replay. Part 3 step 1: run at full fidelity for up to
   SETTLE_MAX_TICKS and stop, whether or not it settled. The cost is bounded
   regardless of how long the player was away, which is the property that makes
   the whole approach affordable, so the bound is not a safety valve and must
   not be raised to make something pass.

4. Tests, as properties rather than cases:
     - a system at a genuine steady state is detected, from every configuration
       stage 1 measured
     - a system in transient is not detected, and specifically the two ticks
       after fermentation is bought are not mistaken for steady
     - a stalled pathway IS steady, which is the case most likely to be got
       wrong. The NAD+ wall produces a system where nothing is changing at all,
       and that is a real steady state rather than a failure. An offline
       absence spent stalled should jump correctly through it and produce
       nothing, which is the true answer.
     - the detector is deterministic: same seed, same detection tick

5. Report the settle tick for each configuration and how much of
   SETTLE_MAX_TICKS was actually used. If act 1 settles in a tenth of the
   budget from every state, that is worth knowing before act 4 is designed and
   it is the first data point on Part 3's open question.

Verify: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
Report the settle tick per configuration, the hash-identity proof from step 2,
and confirm the detector allocates nothing per tick.
```

## Stage 2 Report

**`src/sim/steady.ts` exists, act 1 settles from every configuration it reaches, and the worst case is the stall rather than any healthy cell.** The walled cell settles at 1015 ticks against a budget of 1200, which is 84.6 percent of it. Everything a solved act 1 reaches settles between 386 and 495, which is 32 to 41 percent. **Nothing falls back.**

### Step 1 and 2. The detector, and what it is allowed to be

`src/sim/steady.ts`, in the kernel. Four exports and one interface:

    createSteadyDetector(poolCount)          sizes both buffers, once
    resetSteadyDetector(detector, state)     re-arm, for Part 3 step 5
    observeSteady(detector, state)            call after each tick, returns settled
    replayUntilSteady(state, d, max, onTick)  Part 3 step 1, bounded

**It knows nothing about act 1.** It reads a `Float64Array` of amounts and reports a number. The act 1 configurations are exercised in `src/content/act1/__tests__/steady.test.ts`, where the content lives, and the kernel properties are in `src/sim/__tests__/steady.test.ts` against the synthetic pathway. That split is the same one `src/content/README.md` draws.

**A run counter rather than a ring buffer, and it is the same window.** The spec asks for STEADY_WINDOW consecutive ticks. A counter holds exactly that fact in one number; a ring buffer would store 250 readings nothing asks for and would have to be sized against a constant that just moved from 20 to 250. Same semantics, one word of state, no buffer to size wrong.

**The no-perturbation guard, and it was probed rather than read.** `hashState` is asserted identical across 2000 ticks with a detector attached and without one, alongside tick count and PRNG state. Probed twice. A `+= 0` write changes nothing and the test correctly stays green, which is worth knowing because it means the guard is testing state rather than syntax. **A write of `1e-12` to one pool takes the hash from `b90f9b25` to `03e9c406` and the test fails.** V7's settled rule was to probe every guard by breaking the thing it guards, and this one breaks.

**The allocation rule is a guard rather than a comment.** `steady.test.ts` reads its own source, extracts each hot-path function body by brace matching, and fails on `new `, an array literal, `.push(`, `.map(`, `.filter(`, `.slice(`, `Array.from` or a spread. `replayUntilSteady` is allowed exactly one object literal, for the result it returns once per settle rather than once per tick, and the file is asserted to contain exactly two `new Float64Array`, both inside the constructor.

**Source inspection rather than heap measurement, disclosed rather than glossed.** A heap measurement inside a test runner is a flake waiting to happen and it would not say which line allocated. What this catches is somebody writing `const readings = []` inside the loop, which is the thing that actually goes wrong. **Probed**: adding exactly that to `observeSteady` fails with `observeSteady contains "[]": an array literal is an allocation`.

### Step 3. Bounded replay, and the bound is not a safety valve

`replayUntilSteady` runs real ticks until the detector says settled or the budget is spent. Asserted at 40 ticks against a configuration that needs several hundred: it stops at 40, reports `settled: false`, and `state.tickCount` is 40, so it stopped rather than overran.

The comment in the file says the bound is the property that makes the approach affordable rather than a safety valve, and says raising it to make something pass trades the one guarantee the algorithm offers. That is the stage's own wording and it is written where somebody about to raise it will read it.

`onTick` mirrors `TickObserver` in `loop.ts` and exists for the same reason V3 stage 1 added that one: per-tick scratch arrays are readable only per tick, so a caller that needs the meter advanced during replay has to be handed each tick as it happens. Stage 3 is that caller.

### Step 4. The tests, as properties

**A genuine steady state is detected, from every configuration stage 1 measured.** Twelve configurations, each its own test: walled, fresh fermenting, both uptake rungs, all four glycolytic rungs, the fermentation purchase, and the environment at 20000, 5000 and 1000 on the top rung. All twelve settle inside the budget.

**A system in transient is not detected.** The two ticks after fermentation is bought are asserted false individually, which is the visible recovery V3 measured. The real content of the test is the assertion after them: settling must not happen before tick 400. **Probed by putting `STEADY_WINDOW` back to the placeholder 20, which fires at tick 279 and fails**, which is stage 1's measured 278 reproduced through the shipped detector rather than through a probe script. That is the strongest single result in this stage: the constant is load-bearing and there is now a test that says so.

**A stalled pathway IS steady, and the test says what "steady" does not mean.** The walled configuration settles. At the settle point the payoff flux is below 1e-6, so no ATP is being produced, which is the true answer an offline absence spent at the wall should produce. **And the same test asserts uptake is still above 1 and intracellular glucose is above 100**, because the stall is not a frozen state: the cell is still eating and the food is still piling up unusable, which is the entire visual of the beat. A detector that only fired on frozen systems would have passed a weaker version of this test and been wrong about act 1's most important state.

**A frozen system is steady, separately.** Every reaction disabled, every curvature exactly zero, settles at `STEADY_WINDOW + 1` observations, which is the floor. That is the case that exercises the zero-over-zero branch: a pool of zero that is not moving reads zero rather than dividing.

**Consecutive rather than cumulative.** Settle, then write directly to a pool, then assert the run counter is knocked to zero and a full window has to be rebuilt. A cumulative count would have ignored the shove and stayed settled.

**Deterministic.** Same seed, same detection tick, same worst pool and the same worst reading to the bit, asserted across all twelve act 1 configurations and separately on the synthetic pathway.

### Step 5. The settle tick per configuration, and how much of the budget it uses

Printed by the test itself rather than transcribed, so it cannot drift from what the code does:

    walled, fresh                               1015     84.6%
    fermentation bought after 200 walled ticks    821     68.4%
    glycolytic rung 2                             495     41.3%
    glycolytic rung 1                             492     41.0%
    uptake rung 2                                 466     38.8%
    uptake rung 1                                 462     38.5%
    glycolytic rung 4                             460     38.3%
    glycolytic rung 3                             459     38.3%
    fermenting, fresh                             386     32.2%
    environment at 20000, top rung                251     20.9%
    environment at 5000, top rung                 251     20.9%
    environment at 1000, top rung                 251     20.9%

These reproduce stage 1's confirmation run to within one tick, and the offset is an indexing convention rather than a discrepancy: the probe counted from after its priming tick and the detector counts from the reset.

**The three environment rows are all exactly 251, which is `STEADY_WINDOW + 1`.** A cell that was already settled when replay began settles again as fast as the window allows, and it does so at an environment of 1000 as readily as at 20000. Stage 1 found that criteria A and B both stop settling as the environment drains and criterion C does not, and this is that result seen from inside the shipped code.

**The first data point on Part 3's first open question, and it points somewhere unexpected.** Act 1 uses at most 85 percent of the budget, which is comfortable, and **the case that eats it is a stall rather than a busy configuration**. A stall is a slow decay toward zero rather than a fast approach to equilibrium, so it settles slowly for the same reason it looks like nothing is happening. That is asserted rather than only printed: the test fails if the worst configuration stops being the walled one, because stage 1's entire epsilon derivation rests on which configuration sits against the budget. **Act 4 will have more pools and at least one more timescale and this says nothing about it**, except that the thing to measure first is act 4's worst stall rather than its busiest state. Recorded for stage 6 to put in the open questions.

### Verify

`npm test` **443 passed across 36 files**, up from 415 across 34. 28 added: 12 kernel, 16 act 1. `npm run typecheck` clean. `npm run lint` clean, and the determinism guard already covered `src/sim/**` so `steady.ts` needed no scope change. `npm run build` clean at **268.94 kB, 83.73 kB gzipped**, byte-identical to V7 because nothing in the interface imports the detector yet.

**The act 1 canonical hash is untouched and no tuned number moved.** The detector writes to nothing.

---

# Stage 3 — Event enumeration and the analytic jump

```
Part 3 steps 3, 4 and 5. The part that makes it fast.

1. Enumerate act 1's real events, and expect the list to be short. Part 3 step 3
   names four kinds: a finite substrate pool depleting, a storage pool filling
   to capacity, an environmental schedule boundary, and an unlock threshold
   crossing.

   Against act 1: glucose_env depletes and that is real. There is no storage
   pool with a capacity, glycogen being deferred. There is no environmental
   schedule until act 2. An unlock threshold crossing does not change the
   trajectory, because the player is not there to buy anything and V3 made
   unlocks thresholds against a counter rather than purchases against a pool.

   So report the honest count. If act 1 has exactly one trajectory-changing
   event, say so and build for one rather than building a general enumerator
   against a hypothetical. Part 3's second open question asks whether the
   enumeration stays tractable once act 4 substrate switching exists, and that
   question is not answerable from here. Leave the seam obvious and do not
   pre-solve it.

2. Time to event, in closed form. Part 3 step 3: at steady state the rates are
   constant, so this is division. It must be division and nothing else. No
   iteration, no search, no Math.pow, no Math.log. If a candidate event needs
   anything more than arithmetic to locate, that is a signal it is not really
   an event at a steady state and the report should say so.

3. The jump. Part 3 step 4: advance to the earliest event or to the end of the
   offline window, whichever comes first, and apply accumulated output as rate
   multiplied by duration.

   Everything the jump touches has to move together and this is where the bug
   will be if there is one. Pool amounts, tick count, the meter counters and
   anything derived from cumulative flux all advance by the same duration at
   the same rates. The meter is the easy one to forget because it lives outside
   the simulation, and a jump that advances the pools and not the meter would
   silently refund the player's progress toward every unlock.

   The PRNG is the other one. Act 1 consumes no random numbers, which V4's
   fixture had to work around and which reloadDeterminism.test.ts asserts
   directly, so nothing in act 1 advances the PRNG during a jump. Say that
   explicitly rather than leaving it implicit, because it is true today and
   will not be true in act 2.

4. Apply the event and return to step 1, per Part 3 step 5. Then repeat until
   the window is consumed or EVENT_BUDGET is exhausted at 64.

5. Tests:
     - a jump over a window with no events produces the same pools and meter as
       full replay, within tolerance
     - a jump that crosses glucose_env depletion stops at the depletion rather
       than through it
     - the meter advances with the pools, asserted separately, because this is
       the failure that would not show up in a pool comparison
     - the event budget is respected and exhausting it is reported rather than
       silently truncating the window

Verify: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
Report act 1's real event count with the reasoning for every kind you excluded,
the closed-form time-to-event derivation, and confirm the jump advances the
meter and the pools together.
```

## Stage 3 Report

**Act 1 has exactly one trajectory-changing event and it turned out not to need a content-specific enumerator at all.** A twenty-four hour absence now resolves in 49 events and 58800 real ticks from a fresh cell, 45 and 54000 at the top rung, and 7 and 8400 from the wall, all inside an `EVENT_BUDGET` of 64.

**And Part 3 step 3 is wrong about act 1 in two ways, both found by measurement rather than by reading.** A substrate consumed by a saturating reaction does not deplete, so there is no time-to-event to divide for. And the thing that invalidates a steady state is a substrate moving, in either direction, rather than one reaching zero. Both cost a specification edit and one of them cost a shipped bug this stage found in its own work.

### Step 1. The honest count is one, and the enumerator is structural

    substrate depleting    REAL. glucose_env is finite and unreplenished.
    storage at capacity    Does not exist. Glycogen is deferred.
    schedule boundary      Does not exist. Nothing is scheduled until act 2.
    unlock crossing        Not a simulation event.

**An unlock threshold crossed while away changes no rate.** V3 made unlocks thresholds against a cumulative counter rather than purchases against a pool, and the player is not there to buy anything, so a crossing does not interrupt a jump. Worth reporting on return and that is a different job, done above `src/sim/jump.ts`.

**What was not expected is that one event needed no act 1 knowledge.** A pool can only change a rate if some enabled reaction consumes it, and that is readable from the reaction table. `substrateMask` computes it once per resolution. So there is no `src/content/act1/events.ts` and there should not be: the generic rule and act 1's only event are the same rule. **The seam is left obvious rather than pre-solved**: act 2's oxygen schedule is a boundary in wall-clock rather than in a pool level and act 4's substrate switching may make the count grow with the window, and `jump.ts` says both in a paragraph rather than growing a plugin point for them now.

**The one pool that constrains nothing is `lactate`**, because no reaction consumes it. A terminal product accumulating for eight hours is extrapolated exactly rather than merely tolerably, and it needs no special case.

### Step 2. It is a division, and for one pool the division has no answer

`nextHorizon` is `amount / |rate|` and `nextZeroCrossing` is `amount / -rate`. No iteration, no search, no banned Math call.

**`glucose_env` never depletes, and this is the finding the stage prompt asked for.** `uptake` is Michaelis-Menten, so below its Km of 500 the flux is first order and the pool decays exponentially with a time constant of Km over Vmax: 1250 ticks at the shipped default, 526 at the top rung. **A fixed time constant means the pool is always the same distance from empty**, so time-to-event stops being a division and starts being an asymptote.

Measured, before the repair: the fractional rule chased the environment down in 312-tick steps, spent 64 events and 76800 real ticks, and resolved **3.9 game-hours of a 24-hour window**. That is precisely the capped-replay failure Part 3 rejects by name and says the reference game shipped.

**The repair is `OFFLINE_DEPLETED_FRACTION` and it is the only place in this project where matter is discarded.** A pool holding less than 1e-12 of the most it has held during the resolution is retired to zero and its rate with it. Stated plainly rather than buried: that is not conservation. It is bounded at 1.7e-13 relative against act 1's conserved carbon, which is below the tick's own observed drift of 1.113e-13 and four orders below the 1e-9 the conservation test asserts, and `OfflineOutcome.discarded` reports the total so nobody has to take the bound on trust. Measured across a 24-hour resolution: **7.47e-17 fresh, 2.94e-16 walled, 4.35e-10 at the top rung.**

**Why 1e-12 rather than the conservation tolerance of 1e-9, and why per pool.** Both were wrong first and both were caught by the conservation assertion. At 1e-9 the discard reaches the tolerance itself once several pools retire. And with one floor for the whole system, sized against an 80000-unit environment, retiring `atp` costs 2e-9 of a 40-unit adenylate total, which the test caught at 2.19e-9. The floor is per pool and relative to that pool's own peak during the resolution. **Not its starting amount**, because `pyruvate` starts a resolution at zero, would get a floor of zero and could never be retired, which is the second version of this bug.

### Step 3. The jump, and the one it got wrong

`applyJump` advances pool amounts and the tick count by the same duration at the same rates.

**The meter moves through `OfflineObserver`, and `src/content/act1/offline.ts` exists as its own file for one reason.** A jump that advanced the pools and forgot the meter leaves every pool correct and silently refunds the player's progress toward every unlock. `captureAct1MeterRates` and `advanceAct1Meter` in `meter.ts` read the same private `moved` the per-tick path reads, so the two cannot measure different pathways, and `offline.test.ts` asserts all seven counters against replay separately from the pools.

**The PRNG is not touched, and it is said out loud.** Act 1 consumes no random numbers, which V4's fixture had to work around, so there is nothing to advance. `jump.test.ts` asserts `prng.state` unchanged across a jump. **It stops being true in act 2**, and the first stochastic reaction makes "how far does the PRNG advance across a jump" a real question with no arithmetic answer. That paragraph is in `jump.ts` where whoever writes it will find it rather than find an absence.

**A jump covers a quarter of the distance and then re-settles, and the reason is that Part 3's central assumption does not hold here.** Part 3 assumes rates are piecewise constant between discrete events. `uptake` drifts downward continuously as the environment drains, so jumping the whole way to the linear depletion time is out by 7.5 percent on cumulative ATP, measured. `MAX_JUMP_DEPLETION_FRACTION` bounds the drift and the re-settle re-derives every rate from real ticks. The environment is chased down geometrically and the event count stays bounded, which is the property Part 3 exists to protect.

**The value is 0.25 and it was swept.** One-hour cumulative ATP error against full replay, fresh cell and top rung, with the 24-hour event count:

    fraction   1h error, fresh   1h error, rung 4   24h events   fits budget
      0.5              1.44e-3            3.21e-3        29 / 27   yes
      0.25             8.17e-4            1.49e-3        49 / 45   yes
      0.125            4.45e-4            6.62e-4        64 / 64   NO
      0.0625           2.12e-4            4.85e-4        64 / 64   NO

Error falls monotonically as the fraction falls and the event count rises to meet the budget, so **0.25 is the most accurate value that still resolves a full twenty-four hours**, at 49 of 64 events. The margin is 23 percent of the budget and it is reported rather than assumed comfortable.

### The bug this stage shipped and then found, because it is the most useful thing in the report

**A four-hour absence ended with `glucose_env` at NaN and 236953 lactate against a carbon ceiling of 160000.**

The horizon deliberately skips pools already retired, because a spent pool cannot move a rate. That is right for accuracy and catastrophic on its own: a spent pool is still draining, so a jump long enough to be worth making takes it negative, and **a negative pool makes Michaelis-Menten return a negative flux, which runs a reaction backwards and manufactures matter.**

Two things fell out of it. The non-negativity bound is now separate from the accuracy bound, covers every pool rather than only the ones that can influence a rate, and ignores the retired floor entirely. And retiring a pool zeroes its rate as well as its amount, because a retired pool holding a negative rate puts the next zero crossing at zero ticks and stalls the whole resolution on a pool that is already empty. **Both are tested and both assertions name what they are for**, because neither is obvious from reading the code that has them.

### Step 4 and 5. Steps 5 and 6, and what the tests assert

Step 5 is the loop returning to step 1 after each jump, which is also what keeps intermediate-pool error from accumulating: every settle re-derives the intermediates from real ticks, so an error one jump introduces is corrected by the next rather than carried. Only the cumulative quantities carry error across steps and those are the ones that extrapolate accurately.

Step 6 is `EVENT_BUDGET` at 64. **Exhausting it is not the same as failing to settle and the two are separate fields**, `budgetExhausted` and `resolved`. `ticksResolved + ticksRemaining` is asserted to equal the window, so time left over is never silent.

**A second thing this stage did not expect: the settle has to spend its whole budget rather than stopping when it settles.** The steady test is on curvature, so a pool relaxing with a long time constant passes it while its rate is still meaningfully non-zero. At the top rung, stopping at first detection leaves `nad` with a residual of -2.028e-3 per tick, which extrapolates to an empty NAD+ pool in 8971 ticks. NAD+ is not draining, it is filling, and the residual is a transient. Spending the remaining 740 ticks takes that residual to **-9.701e-6**, two orders better, and the binding event stops being a numerical artifact and becomes `glucose_env` at 83544 ticks. **The cost was already promised**: Part 3 step 1 budgets `SETTLE_MAX_TICKS` of full-fidelity replay per event and this spends exactly that.

Tests, 17 in `src/sim/__tests__/jump.test.ts` and 9 in `src/content/act1/__tests__/offline.test.ts`:

- a jump over a window with no events agrees with full replay to better than 5e-3, pool by pool
- the meter agrees with replay on all seven counters, asserted separately from the pools, and gross ATP per glucose comes back as 3.998679 rather than the replay path's exact 4
- no pool is ever negative, across three configurations and three window lengths up to twenty-four hours
- conservation of all five quantities across the offline path, better than 1e-9, on every one of those nine cases
- the budget is respected, exhausting it is reported, and failing to settle is reported separately
- the whole thing is deterministic: same state in, same event sequence, same pools to the bit

**One test exists because act 1 refuses to produce the case.** Part 3 says a well-tuned configuration should always settle, and act 1 always does, so the fallback signal had to be exercised against the synthetic pathway, whose `A` pool drains until the system stops being steady. `resolveOffline` reports `resolved: false` with `budgetExhausted: false`, which is the distinction stage 5's fallback turns on.

### The diff

    src/sim/jump.ts                          new, the whole algorithm
    src/sim/constants.ts                     two constants added, with derivations
    src/content/act1/meter.ts                capture and advance, using the same `moved`
    src/content/act1/offline.ts              new, eleven lines of wiring
    src/sim/__tests__/jump.test.ts           new, 17
    src/content/act1/__tests__/offline.test.ts  new, 9
    docs/SIMULATION.md Part 3 step 3 and 4   the two corrections
    docs/SIMULATION.md Part 6                the two new constants and why

**No tuned number moved and the act 1 canonical hash is untouched.** The offline path is additive and nothing on the live tick path changed.

### Verify

`npm test` **469 passed across 38 files**, up from 443 across 36. `npm run typecheck` clean. `npm run lint` clean. `npm run build` clean at **268.94 kB, 83.73 kB gzipped**, still byte-identical to V7 because nothing in the interface imports any of this yet. `npm run sim:act1` unchanged, 4.000000000 gross and 2.000000000 net, worst conservation drift 2.001e-15.

**Four measurement probes were written and deleted**, as in stage 1. Every number above is reproducible from the shipped constants and the tests.

---

# Stage 4 — The Part 3 validation test, and scoping determinism

```
docs/SIMULATION.md Part 3, "Validation requirement". This stage is the
justification for the entire approach and Part 3 says so in those words.

1. The test it asks for: run the same scenario two ways, once by full
   tick-by-tick replay and once through the offline path, and assert the
   results agree within tolerance. Randomized durations from one minute to
   twenty-four hours.

   Seeded randomization, using the same approach the conservation property test
   has used since V1, so a failure is reproducible from a seed. Report the
   sweep size and the seed.

   Twenty-four hours is 1.728 million ticks of full replay. Report how long the
   reference side takes to run and whether the test is affordable in the suite
   or has to be split into a fast band and a slow one. If it has to be split,
   the slow band still runs somewhere and the report says where, because a
   validation test that is too slow to run is the unverified shortcut Part 3
   warns about wearing a test's clothes.

2. Choose the tolerance and justify it the way V1 stage 5 justified 1e-9 for
   conservation. It cannot be the conservation tolerance, because this is
   comparing an approximation against an exact computation rather than checking
   an invariant, so the magnitudes are different in kind. Report the observed
   agreement across the sweep and set the tolerance with margin above it.

   Report the worst disagreement and where it occurred. If the worst case is at
   twenty-four hours, that is expected. If it is at one minute, something is
   wrong with the bounded replay rather than with the jump.

3. Assert conservation across the offline path. All five quantities, before and
   after, on every case in the sweep. The jump multiplies rates by durations
   and writes the results into pools without going through the tick, which is
   the one place in the entire project where a pool changes without the
   two-phase update, so it is the one place conservation could break in a way
   nothing existing would catch.

4. Scope the determinism guarantee, in code and in the specification.

   Every hash assertion in this project is exact string equality and the offline
   path cannot satisfy that, because it is correct within a tolerance by
   construction. This is the first deliberately approximate thing in the
   codebase and the guarantee has to be narrowed honestly rather than left to
   be discovered by whoever writes the first failing test.

   State the two properties separately and assert both:
     - full replay of any length is bit-identical, seed for seed. Unchanged and
       still asserted at 172f83fb and act 1's current hash.
     - an offline jump agrees with full replay within tolerance and is NOT
       bit-identical, and the test asserts the agreement rather than identity.

   Then write it into docs/SIMULATION.md Part 5, which currently says
   determinism is a tested property and same seed plus same input sequence must
   produce a bit-identical state hash. That sentence is now true only of the
   full-fidelity path. This is a spec edit to a settled document, so make it
   deliberately, state that it narrows a claim rather than weakening a
   guarantee, and say that the narrowing was always implied by Part 3 living in
   the same document.

5. Report whether act 1 ever trips the fallback across the whole sweep. Part 3
   says a well-tuned configuration should always settle and that the flag is a
   bug signal. If it trips, name the configuration and hand it to
   docs/ECONOMY.md rather than adjusting anything here.

Verify: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
Report the sweep size and seed, the reference-side runtime and any split, the
chosen tolerance with its justification and the worst observed disagreement,
conservation across the offline path on all five quantities, the fallback count
across the sweep, and the docs/SIMULATION.md Part 5 diff.
```

## Stage 4 Report

**The test Part 3 calls the justification for the entire approach exists, it runs on every `npm test`, and 200 randomized cases from one minute to twenty-four hours produce zero fallbacks and zero budget exhaustions.** Worst disagreement on cumulative gross ATP is **7.038e-3** and the tolerance is 2e-2. Worst conservation drift across the offline path is **1.417e-10** against the same 1e-9 the tick has been held to since V1.

**And the stage's own diagnostic caught a real defect in stage 3's work.** The prompt says that if the worst case is at one minute rather than at twenty-four hours, something is wrong with the bounded replay rather than with the jump. It was, twice over, and the second half is not fully cured.

### Step 1. The sweep, the seed, and the split

`src/content/act1/offlineValidation.ts` builds and runs the sweep. `src/content/act1/__tests__/offlineValidation.test.ts` runs the fast band on every `npm test`. `npm run offline:validate` runs the whole range.

**Seeded with the same PRNG the simulation uses**, for the reason V1 stage 5 gave for the conservation property test: a randomized failure nobody can replay from a seed is a failure nobody can fix. Default seed **20260805**, and `buildSweep` is asserted reproducible and asserted to differ at a different seed, so the seed is doing work rather than decorating the signature.

**Ten configurations and eleven duration bands.** Walled, fresh fermenting, both uptake rungs, all four glycolytic rungs, the fermentation purchase, and a deliberately adversarial one: a fresh cell in a 4000-unit environment at the top rung, which drains fast enough that the rates move visibly inside a single window. Bands run one minute, two, five, ten, twenty, forty, ninety, three hours, six, twelve and twenty-four, each jittered by up to its own width. **Log-uniform in spirit and multiplication in fact**, because `Math.log` is banned in this directory and a band index picked uniformly does the same job.

**The reference side is expensive and the split is disclosed rather than glossed.** Twenty-four game-hours is 1,728,000 ticks and takes **1459 ms** of full replay against **45.2 ms** for the offline path, a factor of 32. Across the 200-case sweep it is **59.6 s of reference replay against 2.72 s offline**, a factor of 22.

    fast band   40 cases, six bands, one to eighty minutes    1.41 s replay, in npm test
    slow band  200 cases, eleven bands, one min to 24 hours   59.6 s replay, npm run offline:validate

**The slow band runs somewhere and the somewhere is named.** `npm run offline:validate` exits non-zero on any case outside tolerance, so it is a command a machine can run rather than a report a person reads. UPDATELOGV9.md owns CI and this is the command it should wire. Until then it is a person remembering, which is the sixth entry on the list of build-failing guards nothing automated runs, and the argument for pulling CI forward is now one item stronger than it was.

**Both bands call the same `runSweep` and the same tolerance.** A fast approximation of a slow truth would be two tests that can disagree.

### Step 2. The tolerance, and why it cannot be the conservation tolerance

V1 stage 5 set 1e-9 for conservation against a worst observed 1.964e-13, a margin of five thousand. That is the right shape for an invariant whose true answer is zero and whose error is float64 arithmetic.

**This is a different kind of number.** The offline path is approximate by construction and its error is designed rather than accidental: roughly `MAX_JUMP_DEPLETION_FRACTION` multiplied by how far the rates drift across one jump. Stage 3 measured that halving the jump fraction halves the error. A tolerance five thousand times the observation would stop being a test.

Measured over 200 cases:

    worst relative disagreement, cumulative gross ATP    7.038e-3
    worst absolute disagreement                          617.8 ATP of 306482
    worst misplaced fraction                             2.509e-2
    worst conservation drift                             1.417e-10

**`OFFLINE_ATP_TOLERANCE` is 2e-2**, 2.8x above the worst observed, and the margin is chosen so that doubling `MAX_JUMP_DEPLETION_FRACTION` would not pass silently. That is the change most likely to be made by somebody trying to make the offline path cheaper and it is exactly what this test exists to catch.

**`OFFLINE_MISPLACED_TOLERANCE` is 1e-1, and the metric it applies to is not a pool-by-pool comparison.** A relative comparison per pool is a worse test rather than a stricter one: at the end of a long absence a starved cell's intermediates hold 1e-4 units and disagree by 15 percent of that, which says nothing about whether the path works. What is measured instead is how much of each conserved quantity sits in a different pool than replay put it in, weighted by what each pool carries and divided by the quantity's total. **The question that matters is how much of the carbon is in the wrong place, not how wrong a pool holding nothing is.**

**Where the worst case is, and it is not where the prompt expected.** Both worst relative cases are at the short end. The prompt names that as the signature of a bounded-replay problem, and it was right.

### The defect the diagnostic found, which is the most useful thing in this stage

**Stage 3 triggered its finish-the-pool-off branch on jump length**: a jump buying less time than the replay that set it up is losing to plain replay, so go the whole way to the crossing instead of a quarter of it. That terminates the geometric chase, which is what it was for, and **it fires in exactly the wrong place**. A short jump also means a fast-moving system, and going the whole way there is the worst available choice.

The sweep found it: `environment-low` over a 2.2 minute window came out **1.842e-2** out on cumulative ATP, and the worst misplaced fraction was **5.680e-2**. Both at the short end, both on the configuration whose environment moves fastest.

**The trigger is now how much the pool still holds rather than how long the jump would be.** `OFFLINE_TAIL_FRACTION` at 1e-4: a pool below a ten-thousandth of its own peak is in its exponential tail, where finishing it costs at most that fraction of that pool and saves roughly fourteen events. Worst ATP relative fell from 1.842e-2 to **7.038e-3** and worst misplaced from 5.680e-2 to **2.509e-2**.

**What remains at the short end is arithmetic rather than a defect, and it is reported rather than argued away.** A short window is one bounded replay plus one jump, so a single jump's drift is the whole of the error and the denominator is small. The worst absolute disagreement is at 130 minutes and is **617.8 ATP out of 306482**, which is 2.0e-3 and is where a real error would show. **A residual 0.7 percent on a 2.2 minute window is 0.7 percent of about 10000 ATP against a lifetime counter in the hundreds of thousands.** It is inside tolerance, it is the design's accuracy at a jump fraction of 0.25, and halving that fraction halves it at a cost stage 3 measured as not fitting the event budget.

### Step 3. Conservation across the offline path

All five quantities, before and after, on every case in the sweep, asserted at **1e-9**, the same figure the tick is held to.

**Held to the same number rather than to something looser, and the margin is stated because it is thin.** Worst observed 1.417e-10 is a margin of 7x, against the tick's own five thousand. That difference is the whole point of reporting it: the offline path has a second source of loss the tick does not have, which is retiring a spent pool, and this is the number that would move if that bound were wrong. The discard itself is reported per resolution in `OfflineOutcome.discarded` and measured at 7.47e-17 to 4.35e-10 across a full day.

### Step 4. Scoping determinism, in code and in the specification

**Two properties, asserted separately so neither can stand in for the other.**

Full replay is bit-identical seed for seed. Unchanged, still asserted at `172f83fb` and `49ea08d3` in the two determinism test files that have held them since V1 and V5, neither duplicated here.

An offline jump agrees within tolerance and **is not bit-identical, and that is asserted rather than merely not asserted**. `hashState` of the offline result is required to differ from `hashState` of full replay over the same window. Asserting the difference is what makes this a scoped guarantee instead of an untested assumption: **if a future change made the two identical, the jump would have stopped jumping, and this test notices.**

And a third, weaker and necessary: the offline path reproduces itself exactly. Same state, same window, same hash and same meter to the bit.

**docs/SIMULATION.md Part 5 has a Scope section now.** It states all three, says explicitly that this narrows a claim rather than weakening a guarantee, and says the narrowing was always implied by Part 3 living in the same document: Part 3 has said since it was written that closed-form integration is unavailable and the approach is piecewise, and a piecewise approximation cannot be bit-identical to what it approximates. **What did not exist until now was the code, so nothing forced the sentence to be written.** That is the same pattern V7 stage 5 recorded about DESIGN.md's colour sentence: a wrong or missing statement in a specification survives until something is built on top of it.

### Step 5. The fallback, across the whole sweep

**Zero, across 200 randomized cases and all ten configurations.** Zero budget exhaustions too, and the two are separate fields rather than one. Part 3 says a well-tuned configuration should always settle and that the flag is a bug signal; act 1 as V5 balanced it always settles, and the test asserts that rather than reporting it. **Nothing goes back to docs/ECONOMY.md from this stage.**

The event counts that produce it: a twenty-four hour window resolves in 27 to 51 events out of 64, and the highest observed across 200 cases is 51. The margin is 20 percent of the budget and it is reported rather than assumed comfortable.

### The diff

    src/content/act1/offlineValidation.ts        new, the sweep and the three tolerances
    src/content/act1/validate.ts                 new, npm run offline:validate
    src/content/act1/__tests__/offlineValidation.test.ts  new, 10
    src/sim/constants.ts                         OFFLINE_TAIL_FRACTION added
    src/sim/jump.ts                              the tail trigger replaced
    package.json                                 one script
    docs/SIMULATION.md Part 5                    the Scope section
    docs/SIMULATION.md Part 6                    OFFLINE_TAIL_FRACTION

**No tuned number moved and both canonical hashes are unchanged.**

### Verify

`npm test` **479 passed across 39 files**, up from 469 across 38, in 4.22 s. `npm run typecheck` clean. `npm run lint` clean. `npm run build` clean at **268.94 kB, 83.73 kB gzipped**. `npm run offline:validate -- 200` exits 0 with every case inside tolerance.

---

# Stage 5 — Crediting, the fallback and the budget

```
Wire it to the save. Everything here is specified by docs/SAVE_SCHEMA.md Part 3
and docs/SIMULATION.md Part 3, and V4 built half of it already.

1. Spend pendingOfflineMs. V4 accumulates it, caps it and credits nothing, and
   NOW.md records that the field just grows. This is where it gets spent.

   The order matters and V4 already established it: the delta is computed once
   at load, at the boundary, from now minus meta.lastSavedAt. Negative credits
   zero. Positive caps at MAX_OFFLINE_HOURS. Those three are done and stage 5
   wires the result into the offline path rather than reimplementing them.

   pendingOfflineMs has two sources and both are real: time the loop routed
   there when a catch-up exceeded MAX_CATCHUP_TICKS, which is the backgrounded
   tab, and time measured at load from a genuine absence. Both are elapsed game
   time that was never simulated and both are spent the same way.

2. time.offlineCreditedMs stops being zero. docs/SAVE_SCHEMA.md has it as
   cumulative, for stats and audit, so it accumulates across sessions and is
   never reset. stats.eventsProcessed likewise, and it stops being zero for the
   first time.

3. The fallback, per Part 3. If steady state is not reached within
   SETTLE_MAX_TICKS, coarse replay at 1Hz, total simulated time capped at
   MAX_OFFLINE_HOURS, and increment diagnostics.offlineFallbackCount.

   Note that 1Hz is a twenty-fold larger timestep than the simulation's own,
   and Part 3's own rejection of coarse replay says explicit Euler with a large
   step is unstable in precisely this system and produces wrong answers rather
   than approximate ones. So the fallback is knowingly worse than the path it
   backs up. Report what it actually does to act 1 by running it deliberately,
   because a fallback nobody has ever executed is not a fallback.

4. The budget. EVENT_BUDGET is 64 and Part 3 says to repeat until the window is
   consumed or the budget is exhausted. Exhausting it is not the same as
   falling back and the two must not be conflated. Report what happens to the
   remaining window when the budget runs out, and make the choice visible in
   the return summary rather than silent.

5. Determinism across the credit. A save loaded twice with the same elapsed
   delta must credit identically. The wall clock is an input rather than a
   source of variation, so the same input must produce the same output, and a
   test should assert it by loading the same fixture twice with the same
   injected clock.

6. Do not let it block the first frame. Twenty-four hours of absence is at most
   SETTLE_MAX_TICKS of real replay per event plus arithmetic, which is the
   whole point of the algorithm, so this should be fast. Measure it and report
   the worst case in milliseconds. If it is slow enough to be seen, say so
   rather than hiding it behind a spinner.

Verify: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, and
`npm run dev` with a genuine multi-hour gap produced by editing lastSavedAt in
an exported save. Report what a real eight-hour absence produces in pools,
meter and events, the deliberate fallback run from step 3, the worst-case
credit time in milliseconds, and confirm offlineCreditedMs and eventsProcessed
are now non-zero in a written save.
```

## Stage 5 Report

**`pendingOfflineMs` is spent.** A real eight-hour absence, driven in a real browser against a real save with `lastSavedAt` edited backwards, returns a cell at **482.5 elapsed game-minutes with 160000 lactate, an empty environment and 320000 cumulative ATP**, from a save that left off at 110 game-seconds. `time.offlineCreditedMs` and `stats.eventsProcessed` are non-zero for the first time in the project's history.

**And the fallback was run deliberately, which the stage asked for, and it is much worse than Part 3 predicted.** Coarse replay at 1Hz credits **exactly zero ATP** from every act 1 configuration. It does not approximate act 1, it kills it. That is a finding and it goes to Blocking.

### Step 1. Spending it, and the three rules that were not reimplemented

`creditPendingOffline` in `src/ui/runtime.ts`, called once at construction, before the first frame. It floors `pendingOfflineMs` to whole ticks, resolves the window through `resolveOffline`, and writes the leftover back.

**V4's three clock rules are wired rather than rewritten.** The delta is computed once at the boundary from now minus `meta.lastSavedAt`, negative credits zero, positive caps at `MAX_OFFLINE_HOURS`. All three live in `computeOfflineDelta` and this stage spends what they produce. Reimplementing them here would have been two copies of one rule, which is the specific way V4 said save formats rot.

**Both sources of `pendingOfflineMs` are spent the same way and that is why they share a field.** Time the loop routed there when a catch-up exceeded `MAX_CATCHUP_TICKS`, which is a backgrounded tab, and time measured at load from a genuine absence. Both are elapsed game time that was never simulated.

**The sub-tick remainder stays pending rather than being rounded into existence**, which is the same rule docs/SAVE_SCHEMA.md Part 3 applies to reconstruction. Asserted: 60037 ms away credits 60000 and leaves 37 pending.

### Step 2. The fields that stop being zero

`time.offlineCreditedMs` accumulates across sessions and is never reset, per docs/SAVE_SCHEMA.md. Asserted: two one-minute absences leave it at 120000. `stats.eventsProcessed` likewise. `diagnostics.offlineFallbackCount` stays at zero, which is the point of it.

**Two V4 tests were rewritten rather than deleted, and the old text is worth quoting.** `persistence.test.ts` asserted "NOT ONE TICK OF IT IS SIMULATED. That is V5's, and this is the seam", with the whole three hours sitting in `pendingOfflineMs` and `offlineCreditedMs` at zero. That was the correct assertion for V4 to make and it is the exact behaviour this log exists to replace, so the test moved with the behaviour.

### Step 3. The fallback, and what it actually does to act 1

Implemented exactly as Part 3 specifies: coarse replay at 1Hz, bounded by the same window, `offlineFallbackCount` incremented, and **kept separate from budget exhaustion**, which is a different field for a different condition.

It needed one kernel change. `tick` hardcoded `TICK_SECONDS`, so a 1Hz step was not expressible. `src/sim/tick.ts` now has `step(state, seconds, tickAdvance)` and `tick` is that at `TICK_SECONDS`, with every existing call site unchanged. **The alternative was simulating one tick in twenty, which is not coarse replay, it is dropping time.** The meter took the same treatment: `recordAct1Tick` accepts the step length, defaulting to `TICK_SECONDS`, because a meter that assumed the tick length would undercount a coarse step twentyfold and the symptom would look like the fallback losing progress rather than like a bookkeeping bug.

**Run deliberately, against full replay:**

    configuration    window     replay ATP    coarse ATP    relative
    fermenting       10 min          19048             0    1.00e+0
    fermenting       60 min         114287             0    1.00e+0
    walled           10 min             60             0    1.00e+0
    walled           60 min             60             0    1.00e+0
    glycolytic-4     10 min          45206             0    1.00e+0
    glycolytic-4     60 min         269820             0    1.00e+0

**Zero, from every configuration, at every length.** `prep` costs 2 ATP per unit of flux and a one-second step asks for twenty times what a tick asks for, against an adenylate pool of 40. The proportional scaling saves conservation and nothing else: ATP goes to the floor on the first step, the preparatory phase can no longer pay its entry cost, and the payoff phase never runs again. **The fallback drives act 1 straight into the unrecoverable ATP state NOW.md blocking item 1 describes**, and it does it from a healthy cell.

Part 3's own rejection of coarse replay says explicit Euler with a large step "produces wrong answers rather than approximate ones". **It understated it. The wrong answer is total.**

**What is not wrong with it, measured, because the distinction matters.** It conserves all five quantities to better than 1e-9, because a coarse step is still the two-phase update. It never drives a pool negative. It covers a window that is not a whole number of coarse steps rather than dropping the remainder. So the implementation is correct and the specification is not.

**Asserted as exactly zero rather than bounded loosely, on purpose.** If a later change makes the fallback survivable, `fallback.test.ts` fails and whoever made it can delete the blocking item this opened rather than leaving a stale warning on the page.

**It was not repaired here and the reason is scope.** Changing Part 3's fallback is a spec decision, this is a wiring stage, and the log's own Decisions section says the fallback is a bug signal and must not be absorbed by being made comfortable. **The measured alternative is in the report for stage 6 to carry to Blocking**: Part 3 rejected full replay because "the cost is unbounded in elapsed time", and `MAX_OFFLINE_HOURS` bounds it. A full-fidelity replay of the maximum credit is 1459 ms, measured in stage 4. That is a visible stall and it is correct, against 22 ms that is not.

**Nothing reaches it in normal play.** Act 1 always settles, asserted over 200 randomized cases in stage 4 and over every configuration here.

### Step 4. The budget, and making it visible

`EVENT_BUDGET` exhaustion and falling back are separate fields on `Act1OfflineReport`, which is on every session rather than only when something went wrong, so the return screen never has to guess which shape it was handed:

    creditedMs        game time actually simulated
    uncreditedMs      time owed and not simulated. Non-zero only on exhaustion
    atpProduced       cumulative gross ATP made while away
    events            the sequence, which DESIGN.md says to show
    fellBack          the bug signal
    budgetExhausted   not the same thing
    elapsedRealMs     what it cost, measured rather than estimated

**The remaining window on exhaustion is left uncredited and reported rather than silently dropped**, which is the distinction Part 3 draws when it rejects capped replay for losing player progress silently. Act 1 never reaches it.

### Step 5. Determinism across the credit

A save loaded twice with the same injected clock credits identically: same tick count, same event count, same pool amounts to the bit, same meter, same progression. **The wall clock is an input rather than a source of variation**, and that is now a test rather than an argument.

### Step 6. What it costs, measured

**Twenty-four hours of absence: 22.0 ms, 38 events.** Eight hours from a fermenting cell: **24.6 ms, 27 events**. A frame is 16.7 ms, so the worst case is under two frames and it happens once, before the first frame is drawn.

The test asserts under 1000 ms rather than under 25, and says why in its own comment: it is a tripwire rather than a performance budget. If crediting a day ever takes a second, the algorithm has stopped scaling with events and started scaling with time, which is the property the whole approach exists for.

### What a real eight-hour absence produces

Measured twice. Headless, from a save with fermentation bought at 500 ticks:

    credited      8.00 hours, 27 events, 24.6 ms real
    ATP produced  319234 while away, against 766 before
    lactate       380 to 160000
    glucose_env   0 left
    fell back     false      budget exhausted false

**160000 lactate is the carbon ceiling**, which is the whole environment converted, and `glucose_env` at zero is the honest consequence: eight hours is longer than act 1's food lasts. **That is a property of the economy rather than a defect in the credit** and it belongs to docs/ECONOMY.md if anybody wants it different.

### The browser check, which was run rather than reported unrun

`npm run dev`, a real Chromium, a real save. Played to the NAD+ wall, bought lactate dehydrogenase, let it run to 110 game-seconds, then edited `meta.lastSavedAt` eight hours backwards and loaded the act screen.

**Elapsed reads 482.5 min. Lactate reads 160000.00. Glucose (environment) reads 0.00. ATP reads 0.02 against ADP 39.98. The uptake capacity slot reads 320000 of 4000 ATP made and its button is live.** Every net rate is 0.00, which is correct: the cell has eaten everything there was.

**Two things the browser found that headless did not.**

**The save panel is now wrong, and it is wrong in the exact words stage 6 is told to replace.** It reads "Away for 8.0 h. None of it has been simulated. It is being kept, not spent." NOW.md called that "the honest sentence that will stay wrong-sounding until this log makes it true". It is true no longer.

**`beforeunload` overwrites `lastSavedAt` on reload, and it took two failed attempts to see it.** Editing the save and calling `location.reload()` fires the unload autosave, which rewrites `lastSavedAt` to now, so the gap the test was constructing was destroyed before the page could read it. The working method is a second page on the same origin that patches the save while the app is not loaded. **This is the same `beforeunload` NOW.md records as wired, not load-bearing, and destructive the one time it demonstrably fired.** It fired again. Recorded here rather than acted on, because the fix is V4's sealed-session pattern and this stage has no business widening it.

### The diff

    src/sim/tick.ts                   `step` extracted, `tick` is it at TICK_SECONDS
    src/sim/constants.ts              COARSE_STEP_SECONDS
    src/sim/jump.ts                   coarseReplay, and onTick carries the step length
    src/sim/steady.ts                 the same signature widening
    src/content/act1/meter.ts         recordAct1Tick takes a step length
    src/content/act1/offline.ts       passes it through
    src/ui/runtime.ts                 creditPendingOffline, Act1OfflineReport, carried counters
    src/save/__tests__/persistence.test.ts   two V4 tests rewritten, five added
    src/content/act1/__tests__/fallback.test.ts  new, 7

**No tuned number moved and both canonical hashes are unchanged.** `tick` is byte-equivalent to what it was: the extraction changes no arithmetic.

### Verify

`npm test` **491 passed across 40 files**, up from 479 across 39. `npm run typecheck` clean. `npm run lint` clean. `npm run build` clean at **273.99 kB, 85.66 kB gzipped**, up from 268.94 and 83.73, which is the first bundle movement in this log and is the offline path reaching the interface for the first time. `npm run dev` checked in a real browser as above.

---

# Stage 6 — The return screen, coherence, verify and NOW.md

```
Close the log out.

1. The offline return screen, per DESIGN.md's screen inventory. It shows the
   event sequence and not just a total, and DESIGN.md gives the reason: the
   algorithm produces a genuine bounded event list, so showing it is honest and
   instructive, and it teaches that metabolism is homeostatic between shocks
   rather than smoothly accumulating.

   That is the strongest thing this log can put on a screen and it is worth
   building carefully. A player who was away eight hours and sees "steady for
   six hours, glucose ran low, steady again" has learned something true about
   metabolism that no other screen in the game teaches.

   It obeys everything V6 and V7 established: strings in src/ui/content.ts,
   docs/CONTENT_STYLE.md voice, badges on every number, keyboard reachable,
   focus managed, nothing encoded in colour or motion alone.

   If act 1's event list is as short as stage 3 expects, most absences will
   produce one event or none, and the screen has to read well in the boring
   case rather than only in the interesting one. Design for "nothing happened,
   here is how much of it happened", because that is what act 1 will mostly
   produce and it is still true and still worth saying.

2. Update the save panel sentence. NOW.md records that it currently says the
   time away is being kept and not spent, and calls that the honest sentence
   that will stay wrong-sounding until this log makes it true. It is now
   wrong. Replace it.

3. Coherence pass over src/sim/steady.ts and the offline path. No allocation on
   the hot path, no object-key iteration, no banned Math calls, no Date outside
   src/save/meta.ts. Confirm the ESLint guard covers every new file and extend
   its scope if a new directory appeared.

4. Full verify: `npm run typecheck`, `npm run lint`, `npm run build`,
   `npm test`. Report the test count and bundle size against V7's figures.
   Confirm both full-replay canonical hashes are unchanged, because the offline
   path is additive and must not have touched the tick.

5. Update NOW.md:
   - Status: offline progress works and what a real absence produces.
   - Build state table: V8 done, with the date. docs/SIMULATION.md is now fully
     implemented, every part of it, which is worth saying because it has been
     the spec everything was measured against since V1.
   - A "What the offline path does" section, sibling to the others. It should
     carry the two validated constants with their measured values, the
     tolerance and its justification, and the determinism scoping from stage 4,
     because that last one is the part a future maintainer is most likely to
     trip over.
   - Close the open item recording that STEADY_EPSILON and STEADY_WINDOW are
     unvalidated placeholders. It has been open since V1 and it is the oldest
     entry on the list.
   - Close the backgrounded-tab item. V4 narrowed it and said narrower is not
     closed. It is now closed and the entry should say what closed it.
   - Close the item about offlineCreditedMs being zero in every save.
   - Blocking: anything stages 1 to 5 found. A fallback that trips in normal
     play belongs here and belongs to docs/ECONOMY.md.
   - "Next, in order": CI is the last planned log and the only one with no
     dependencies. Beyond it, act 2 becomes decidable for the first time, and
     say what would have to be true before a V10 row could be written without
     it being fiction.

6. Update docs/SIMULATION.md's "Open questions for prototype". Three questions
   sit there and this log can answer one and a half. The act 4 settling time
   question is not answerable from act 1 but the act 1 figure is the first data
   point on it. The event tractability question is not answerable and stage 3
   should have said why. The third, whether the offline summary should show the
   event sequence, was answered by DESIGN.md and is now answered by a built
   screen, so close it.

Verify: everything above clean. Report the return screen, both canonical hashes
unchanged, the test count, the bundle size, the docs/SIMULATION.md open
questions diff and the NOW.md diff summary.
```

## Stage 6 Report

_Pending._

---

# After These Stages

- `docs/SIMULATION.md` is fully implemented. Part 3 was written before any code existed, it called itself the hard problem, and it is the last part to land. The two constants it left for the prototype have measured values and the sentence in `src/sim/constants.ts` that begins "UNVALIDATED PLACEHOLDER" is gone from both.
- The Part 3 validation test exists, which is the thing that document says the entire approach depends on. Without it the offline path would be an unverified shortcut, and Part 3 says so in those words.
- The determinism guarantee is narrower and honest. Full replay is still bit-identical seed for seed, the offline jump agrees within a stated tolerance, and the two claims are separate in the specification rather than one claim quietly covering a case it never covered.
- A player who leaves and comes back is told what happened rather than handed a total, which `DESIGN.md` argued for on the grounds that it teaches metabolism is homeostatic between shocks. It is the only screen in the game that teaches that.
- One planned log remains: CI, cross-engine determinism and deploy. It has no dependencies and it is the only thing standing between a growing set of build-failing guards and nobody running them.
