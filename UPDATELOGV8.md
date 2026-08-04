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

_Pending._

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

_Pending._

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

_Pending._

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

_Pending._

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

_Pending._

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
