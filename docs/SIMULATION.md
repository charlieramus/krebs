# Simulation

Last updated: 2026-07-27

Engine specification. This is the document that separates the project from a numbers-go-up toy, so it is specified tightly enough that a naive implementation cannot pass review.

Biological values live in docs/SCIENCE.md. Tuned game values live in docs/ECONOMY.md. This doc covers only how the machine advances state.

---

# Part 1: The tick loop

## Decision

    TICK_RATE_HZ = 20
    TICK_MS = 50

Fixed timestep. Simulation rate is decoupled from render rate.

## Rationale

Simulation and rendering are separate concerns. Rendering runs on requestAnimationFrame at whatever the display provides. Simulation runs on a fixed step driven by an accumulator.

Variable timestep is rejected for four reasons. It makes runs non-reproducible, since floating point accumulation differs with frame timing. It breaks in background tabs, where browsers throttle requestAnimationFrame to roughly 1Hz or suspend it. It makes the simulation untestable, because a test cannot assert on output that depends on wall-clock jitter. And it makes bug reports unactionable, because a save file plus an input sequence no longer reproduces a failure.

50ms specifically:

- Below the roughly 100ms threshold at which interaction stops feeling immediate. Player actions register within one tick.
- Divides evenly into 1000ms, so the accumulator does not accumulate float error against second boundaries.
- Provides 20 integration steps per game-second. This matters because the pool system is a set of coupled rate equations integrated by explicit Euler, which goes unstable when a pool can drain in less than a step. NAD+ in act 1 is the fastest-turning pool in the game and needs the headroom.
- Cheap. Even a few hundred operations per tick is negligible at 20Hz.

10Hz would also work and costs less. It was not chosen because 100ms sits at the edge of perceptible lag and halves the integration headroom. 60Hz was rejected as waste that also invites the sim-render coupling bug.

## Loop structure

    accumulator += realElapsedMs
    while (accumulator >= TICK_MS) {
      tick(state)
      accumulator -= TICK_MS
    }
    render(state, accumulator / TICK_MS)

The fractional remainder is passed to the renderer for interpolation only. It never touches simulation state.

## Spiral of death guard

If the tab was backgrounded briefly or the machine stalled, realElapsedMs can be large enough that the catch-up loop takes longer than the time it is catching up on, and the accumulator grows without bound.

Cap catch-up at MAX_CATCHUP_TICKS, set to 200, which is 10 seconds of game time. Anything beyond that threshold is not caught up in the loop. It is routed to the offline progress path in Part 3 instead.

## Constraint on changing the rate

TICK_RATE_HZ may be tuned freely during development. It is frozen at launch.

The reason it can be frozen safely is that saves store elapsed milliseconds rather than tick counts. See docs/SAVE_SCHEMA.md. Storing tick counts would make the constant load-bearing for save compatibility, which is a trap.

---

# Part 2: Reaction kinetics

## Form

Enzyme flux uses the Michaelis-Menten saturation curve:

    v = Vmax * S / (Km + S)

Cooperative enzymes use the Hill form. PFK-1 is the only enzyme in scope where this is modeled explicitly.

    v = Vmax * S^n / (K^n + S^n)

The functional shape is real biology. The specific Vmax and Km values are tuned for pacing and are not laboratory measurements. See docs/SCIENCE.md Part 1 for the full methodology disclosure, which is also required to appear in-game.

## Integration

Explicit Euler. Per tick, each reaction computes its flux, then pools are updated by flux multiplied by the tick duration in game-seconds.

Two-phase update is mandatory. Compute all fluxes against the state at the start of the tick, then apply all deltas. Computing and applying reaction by reaction makes the result depend on reaction ordering, which is both wrong and a determinism hazard.

## Negative pool guard

Explicit Euler can drive a pool below zero when demand exceeds supply within a single step.

Do not clamp silently. Clamping hides a stability problem and quietly breaks conservation of mass, which will produce ATP from nowhere.

The correct handling is proportional scaling. When total demand on a pool within a tick exceeds its contents, scale every consuming reaction's flux by the ratio of available to demanded, so the pool lands exactly at zero and consumers share the shortfall proportionally. Log the event in development builds. Frequent scaling on a given pool means either the pool is too small or the tick is too coarse, and both are balance bugs worth surfacing.

## Conservation testing

Carbon, phosphate and redox equivalents are conserved quantities. Write property tests asserting that totals are preserved across long randomized runs, within a float tolerance. This is the cheapest possible check against an entire class of economy bugs and it should exist before act 1 content does.

---

# Part 3: Offline progress

The hard problem, and the one most idle games get wrong.

## Why the obvious approaches fail

Full replay. Eight hours away is 576,000 ticks. Replaying blocks the main thread for a visible stall and the cost is unbounded in elapsed time.

Capped replay. Simulate a fixed maximum then stop. This is the common shortcut and it silently loses player progress. The reference game shipped a bug in exactly this area.

Coarse replay. Replay with a much larger timestep. Fast, but explicit Euler with a large step is unstable in precisely the nonlinear system being integrated, so it produces wrong answers rather than approximate ones.

Closed-form integration. Not available. Michaelis-Menten integrated over time yields the Lambert W function even in the trivial single-substrate case, and the real system is coupled and nonlinear. An earlier version of the project plan assumed this was achievable. It is not.

## The approach: piecewise steady state

Metabolism is homeostatic. After a transient, the system settles into a steady state where production balances consumption and pool levels stop changing. At steady state, cumulative output is linear in time, which integrates trivially.

The algorithm exploits that.

1. Replay at full fidelity for up to SETTLE_MAX_TICKS, set to 1200, which is 60 game-seconds. Bounded cost regardless of how long the player was away.

2. Test for steady state. Every pool's rate of change must have stopped changing: the second difference of each pool amount, over the pool's own size, below STEADY_EPSILON, sustained for STEADY_WINDOW consecutive ticks. If not reached, see the fallback below.

   This step used to read "all pool derivatives below STEADY_EPSILON as a fraction of pool size", and that is wrong rather than imprecise. Corrected 2026-08-05 by UPDATELOGV8.md stage 1, which measured it. Two things are wrong with it. It is unsatisfiable in act 1 at any epsilon below 1e-3, because a finite substrate pool draining and a terminal product pool accumulating both change linearly forever and their fractional derivative decays only as one over elapsed time. And it contradicts step 4 below, which applies accumulated output as rate multiplied by duration, and therefore assumes pools that are still changing at a constant rate. What has to be constant for the jump to be valid is the rate, not the amount. The old wording is kept here because a specification that quietly rewrites itself teaches nobody why the first version failed.

3. Identify the next event. An event is any discrete change that invalidates the current steady state. Candidates are a finite substrate pool depleting, a storage pool filling to capacity, an environmental schedule boundary such as an oxygen concentration step in act 2, and an unlock threshold crossing. For each, compute time-to-event in closed form from the steady-state rates, which are constant, so this is division.

   Two corrections from measurement, both added 2026-08-05 by UPDATELOGV8.md stage 3.

   A substrate pool consumed by a saturating reaction does not deplete. Below the Km, Michaelis-Menten is first order, so the pool decays exponentially with a fixed time constant of Km over Vmax and is always the same distance from empty. There is no time-to-event and division does not produce one. A pool holding less than OFFLINE_DEPLETED_FRACTION of the most it has held during the resolution is therefore treated as empty and retired. That is the only place in the project where matter is discarded and the bound is four orders below the conservation tolerance.

   And the event that actually invalidates a steady state is a substrate changing enough to move the rate it drives, in either direction, rather than only one reaching zero. A jump covers MAX_JUMP_DEPLETION_FRACTION of the distance to that horizon and then re-settles. Without it a starved cell's jump was measured 998 percent out on cumulative ATP.

4. Jump forward to the earliest event, or to the end of the offline window if that comes first. Apply accumulated output as rate multiplied by duration. No pool may cross zero: a negative amount makes Michaelis-Menten return a negative flux, which runs a reaction backwards and manufactures matter.

5. If an event was reached, apply it and return to step 1.

6. Repeat until the offline window is consumed or EVENT_BUDGET is exhausted, set to 64.

Cost scales with the number of events in the window, not with its length. A realistic eight-hour absence contains a handful of events.

## Fallback

If steady state is not reached within the settle window, the configuration is oscillating or chaotic. Fall back to coarse replay at 1Hz, cap total simulated time at MAX_OFFLINE_HOURS, and record a flag in the save.

That flag is a bug signal, not a normal condition. A well-tuned configuration should always settle. Surface the count in a development overlay.

## Validation requirement

Write a test that runs the same scenario two ways, once by full tick-by-tick replay and once through the offline path, and asserts the results agree within tolerance. Run it across randomized durations from one minute to twenty-four hours.

This test is the justification for the entire approach. Without it the offline path is an unverified shortcut.

## Clock tampering

Offline duration derives from wall-clock difference, which the player can manipulate by changing the system clock.

Cap offline credit at MAX_OFFLINE_HOURS, set to 24. Reject negative deltas, which indicate the clock moved backwards, and credit zero. Do not build further anti-cheat. This is a single-player educational game with nothing to protect.

---

# Part 4: Number representation

## Decision

Plain JavaScript numbers, float64. No big-number library.

## Rationale

float64 represents integers exactly up to 2^53, approximately 9.0e15.

Bounding the worst case: the game is finite by design, per docs/PILLARS.md rule 1, with a 6 to 10 hour completion target. Even a generous endgame production rate accumulated across the full run plus maximum offline credit stays many orders of magnitude below the exact-integer limit.

Pulling in break_infinity.js or decimal.js is reflexive in this genre and would cost bundle size, arithmetic performance and code clarity for a range the game will never enter.

## Required guard

Add a development-mode assertion that fails loudly if any tracked value exceeds SAFE_VALUE_CEILING, set to 1e15.

This is not a defensive nicety. It is the tripwire that catches a balance change accidentally reintroducing unbounded growth, which is the specific failure this decision depends on not happening.

---

# Part 5: Determinism

Determinism is a tested property of this codebase, not an aspiration. Same seed plus same input sequence must produce a bit-identical state hash across runs, machines and browsers.

## Rules

No Math.random in simulation code. Use a seeded PRNG with its state stored in the save. Mulberry32 or PCG32 are both fine and both small.

No Math.pow, Math.exp or Math.log in simulation code. The ECMAScript specification permits implementation-approximated results for these, so they can differ between engines. Michaelis-Menten needs only multiply, divide and add, which are exactly specified under IEEE754. The Hill equation uses integer exponents and must use repeated multiplication rather than pow.

No iteration over object keys in flux computation. Key order is specified for most cases but is easy to get subtly wrong. Use arrays with fixed ordering.

No Date.now inside tick. Wall-clock time enters the system only at the loop boundary and only via the offline path.

No floating point accumulation of game time. Store elapsed time as an integer tick count internally and convert at the boundary. The save persists milliseconds, which is exact for integers in this range.

## Test

A determinism test that runs a fixed seed and input script twice and compares a hash of the full state tree. Run it in CI. Run it after any change to kinetics code.

---

# Part 6: Constants summary

    TICK_RATE_HZ          20
    TICK_MS               50
    MAX_CATCHUP_TICKS     200
    SETTLE_MAX_TICKS      1200
    STEADY_EPSILON        1e-5
    STEADY_WINDOW         250
    EVENT_BUDGET          64
    MAX_OFFLINE_HOURS     24
    SAFE_VALUE_CEILING    1e15

    MAX_JUMP_DEPLETION_FRACTION   0.25
    OFFLINE_DEPLETED_FRACTION     1e-12

Every value here is a decision, not a default. Changing one requires updating this doc with the reason.

The last two were added on 2026-08-05 by UPDATELOGV8.md stage 3, which measured both. Neither existed when Part 3 was written because neither is needed by the algorithm as specified; both are needed by the algorithm as it behaves against a finite substrate pool consumed by a saturating reaction, which is what act 1 is and what every later act will be. See the two corrections under Part 3 step 3. 0.25 is the smallest jump fraction that still resolves a 24-hour window inside EVENT_BUDGET, using 49 of 64 events, and error falls monotonically as the fraction falls, so it is the most accurate value the budget allows.

STEADY_EPSILON and STEADY_WINDOW were marked "tune during prototype" from 2026-07-28 to 2026-08-05 and shipped as placeholders of 1e-6 and 20. Both were measured against act 1 by UPDATELOGV8.md stage 1 and both moved. The placeholder epsilon was outside the usable band, which is 3e-6 to 1e-4, and the placeholder window was an order of magnitude below its measured floor of 142. The full derivation, both failure modes and the margin between them are in src/sim/constants.ts and in that stage's report. The band is narrow enough that a balance pass touching maintenance kinetics or the environment size has to re-run the measurement.

---

# Open questions for prototype

- What is the real settling time of an act 4 configuration? If it exceeds 60 game-seconds, SETTLE_MAX_TICKS needs raising and the offline path gets more expensive.
- Does the event enumeration in Part 3 step 3 stay tractable once act 4 substrate switching exists, or does the event count per window grow past the budget?
- Should the offline summary show the player the event sequence that occurred while they were away? It would be honest, it would teach, and it might be noise.
