charlie

# krebs, V3: The First Interface
# Work on one stage at a time. Do NOT combine stages.

---

## Context

Read `NOW.md` first, then `DESIGN.md` in full and `docs/BRIEF.md` line 110. The kernel and act 1 content both run and are guarded: 95 tests, conservation drift 2.351e-13 against a 1e-9 tolerance, two frozen canonical hashes at `172f83fb` for the toy pathway and `e9b720a8` for act 1. The pathway is real biology with sourced stoichiometry. **Nobody has ever seen it.** `src/ui/` contains a README saying it is deliberately empty, `src/App.tsx` renders one line of monospace text saying there is no interface, and `npm run sim:act1` prints numbers to a console.

**The slice exists to answer two questions and this is the log that can answer them.** Whether saturating kinetics feel like a game, and whether the NAD+ wall reads as interesting rather than annoying. A console cannot answer either, which V2 stage 6 said plainly rather than pretending otherwise. Both questions are about a number moving on a screen.

This is log 3 of the vertical slice set, V1 kernel then V2 act 1 content then V3 the first interface. V3 builds one act 1 screen and the runtime that drives it. It does **not** build the timeline, the beast, saves, offline progress, the ethanol branch, glycogen storage, the ten-enzyme decomposition, act 2 or anything belonging to it. Saves are V4 and offline progress is V5. `NOW.md` holds the fence and V3 does not move it.

`DESIGN.md` is a large specification that has never been tested against a running simulation. `NOW.md` line 134 is explicit that V3 should apply only the part of it the slice needs. That instruction is load-bearing rather than polite: if the NAD+ wall reads as annoying, some of those decisions change, and a fully dressed interface built before the answer is a fully dressed interface that has to be undressed.

## Decisions

- **The `DESIGN.md` subset, named here so no stage has to guess.** In scope: the colour tokens, the type scale, tabular figures, the spacing and shadow and radius rules, illustration rules 1 to 3, the badge contract, the coach mark anatomy, the flux-is-the-headline inversion, the top bar plus left rail plus main plus unlock shelf layout and flux as motion with its reduced-motion obligation. Out of scope and deliberately so: illustration rules 4 to 6, because there are no enzyme objects, no damage and no ROS until act 2; the beast; the timeline view; the teaching panel; every screen in the inventory other than the act screen.
- **Fonts are self-hosted, not linked.** `CLAUDE.md` says no network dependency for core play, and a Google Fonts link is a network dependency at first paint. Fredoka and Nunito ship as woff2 in the repository under their OFL licence, with a system rounded fallback stack behind them. This is the first binary asset the project carries and it should be a deliberate act rather than a side effect.
- **React never re-renders at tick rate.** The simulation is a mutable `Float64Array` behind a fixed 20Hz tick and the flux animation runs at frame rate. Those are two different clocks and neither is React's. The loop lives in a module outside React, `requestAnimationFrame` drives it, the UI samples a preallocated snapshot per frame, figures that move every tick are written through refs, and React state changes only on discrete events: an unlock bought, a stall beginning, a coach mark opening.
- **ATP cannot be spent, and this falls out of V2 rather than being invented for V3.** The adenylate pool is fixed, closed and conserved, so subtracting ATP from it to pay for an upgrade breaks the conservation test on the tick it happens. Unlock costs are therefore thresholds against the cumulative meter in `src/content/act1/meter.ts`, which already lives outside the simulation for exactly this reason. It is also the more honest statement about a cell: it does not save up ATP, it produces it at a rate.
- **Two purchasable things, both finite.** `ferment`, once, which is the teaching beat. And uptake capacity, in a fixed enumerated number of steps rather than a multiplier, because hard rule 3 forbids infinite scaling and an upgrade with no last step is infinite scaling wearing a small number. Uptake is the rate-limiting step by construction per V2 stage 3, so raising it is the one lever that makes saturation downstream visible, which is what question 1 needs.
- **Every cost and threshold is provisional and lives in one file.** `src/ui/tuning.ts`, same header treatment as `src/content/act1/tuning.ts`, naming this log as what introduced them and recording the `docs/ECONOMY.md` divergence row each one owes. `docs/ECONOMY.md` is still not created by this log. It is created after the slice has been played, which is stage 7's recommendation to make rather than this log's action.
- **Hard rule 1 goes live in this log.** V3 writes the first player-facing text the project has ever had, so the badge contract stops being documentation and becomes a component contract. The `Needs source` release gate gets built here too, because `DESIGN.md` open question 6 says it should exist before content authoring starts and stages 4 to 6 are content authoring.
- **`docs/CONTENT_STYLE.md` still does not exist and V3 does not write it.** Player-facing text stays at molecule names, reaction names and the one coach mark the wall needs. Inventing a voice before the document lands means rewriting everything twice.
- **No saves.** A refresh loses the run. That is correct for V3 and it is V4's whole job. Say it on screen rather than letting a player discover it.
- **`DESIGN.md` open question 3 is stale.** It claims the docs sit at the repository root while every reference points at `docs/`. They are in `docs/`. Stage 7 corrects the entry rather than any stage acting on it.
- Large system: seven stages.

## The environment runs dry inside act 1, and that is V3's problem now

`NOW.md` blocking item 1 says act 1 has an unrecoverable state below roughly 400 environmental glucose, and hands the fix to `docs/ECONOMY.md` "or to V3 if the interface makes a player meet it first". The interface makes a player meet it first.

V2 stage 5 reports 456.63 glucose taken up in 1200 ticks, which is 60 game-seconds, so the fermenting pathway drains its environment at roughly 457 units per minute. Starting at 10000 it crosses the 400 threshold at roughly 21 minutes. `docs/PROGRESSION.md` gives act 1 a target duration of 45 to 90 minutes. **A player who plays act 1 for as long as act 1 is supposed to last will run the environment dry, hit the ATP bootstrap trap, and be unable to act their way out of it.**

Stage 1 measures the real figure rather than trusting this arithmetic. Stage 6 decides what to do about it and says why. It is named here so no stage discovers it late and patches it quietly.

## The screen, settled here

Settled so the stages implement it rather than reinvent it. `DESIGN.md` layout section, reduced to the slice.

```
  top bar     wordmark    ATP x.xx /s    GLUCOSE x.xx /s    elapsed
  ---------------------------------------------------------------
  left rail   pool cards, one per card, flux headline and stock subscript

                glucose_env    6 sides
                glucose        6 sides
                g3p            3 sides, 1 phosphate dot
                pyruvate       3 sides
                lactate        3 sides
                nad + nadh     one card, same silhouette, saturation differs
                atp + adp      one card, 3 dots and 2 dots
                pi             1 dot
  ---------------------------------------------------------------
  main        pathway card, five arrows, dashes flowing at a speed set by v

                glucose_env -> uptake -> glucose -> prep -> g3p
                g3p -> payoff -> pyruvate -> ferment -> lactate
                atp -> maintain -> adp + pi
  ---------------------------------------------------------------
  unlock      dashed slots, two of them, both gated on cumulative ATP
```

Ten pools become eight cards. The two carrier pairs share a card each because their sum is what is conserved and the sum is what teaches. Watching NAD+ drain while NADH fills on one card is the wall arriving. Watching them on two cards is two unrelated numbers.

---

# Stage 1 — The render bridge and the runtime loop

```
The riskiest engineering in this log, done first and deliberately ugly. No
design, no tokens, no illustration. Raw numbers on a white page. If this stage
looks good it has done too much.

1. src/ui/runtime.ts. Everything that drives the simulation, outside React.
   It owns createAct1, createLoop, createAct1Meter and createAct1MeterProbes,
   and it reads the clock. performance.now, not Date.now, and note in a comment
   that UI is exempt from the determinism guard by the explicit carve-out in
   eslint.config.js rather than by oversight.

   requestAnimationFrame drives it. Each frame: read the clock, compute the
   real elapsed delta, hand it to loop.advance, call recordAct1Tick once per
   tick that actually ran, fill a snapshot, notify subscribers.

   recordAct1Tick must be called once per tick and not once per frame. The
   meter reads state.fluxes and state.scales for the tick that just ran, so a
   frame that ran three ticks and records once undercounts by two thirds, and a
   frame that ran zero ticks and records once counts the previous tick twice.
   loop.lastTickCount is not enough on its own to fix this. Say how you solved
   it, because it is the single easiest thing in this stage to get quietly
   wrong and no existing test would catch it.

2. The snapshot. A preallocated mutable object filled in place every frame,
   never reallocated. Pool amounts, per-reaction flux, per-reaction applied
   flux, the meter figures, tickCount, elapsed game milliseconds via
   elapsedMs(state) and the interpolation fraction loop.advance returns.

   subscribe(cb) returns an unsubscribe. A React hook reads the snapshot
   through a ref rather than through state, so a subscriber that only writes to
   DOM nodes causes no reconciliation at all.

3. A backgrounded tab is a known hole and it stays open. Elapsed time above
   MAX_CATCHUP_TICKS routes to diagnostics.pendingOfflineMs, which nothing in
   V3 consumes, so a tab left in the background silently loses game time into a
   field waiting for V5. Do not fix it. Surface it: put pendingOfflineMs on the
   snapshot and print it in the dev readout, so the hole is visible during
   stage 7's play session rather than mistaken for a bug in the simulation.

4. Replace src/App.tsx. A plain unstyled table of every snapshot field,
   updating live. Delete the V1 placeholder text. Update src/ui/README.md so it
   stops saying the directory is deliberately empty.

5. src/ui/__tests__/runtime.test.ts. Two properties, and the second is the one
   that matters:

   a. Driving the runtime with a scripted elapsedMs sequence produces the same
      pool amounts as calling tick directly the same number of times. The
      bridge introduces no drift.
   b. Frame timing does not reach the simulation. Feed one regular sequence and
      one wildly irregular sequence summing to the same total, assert identical
      tickCount, identical pool amounts and identical hash. A real
      requestAnimationFrame delivers irregular deltas and the fixed timestep
      exists precisely so that does not matter. Assert it rather than assume it.

   Inject the clock rather than reading it, so the test drives real time
   without waiting for it.

6. Measure the environment drain, headless, through the runtime. Report the
   game-time at which glucose_env crosses 400 with ferment enabled and uptake
   at its default Vmax, and again at the highest uptake Vmax stage 6 is likely
   to sell. Do not fix anything. This is the measurement stage 6 decides on.

Verify: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` and
`npm run dev` opened in a browser with the numbers actually moving. Report the
test count against V2's 95, the recordAct1Tick solution from step 1, the two
drain figures from step 6 and confirm the act 1 canonical hash is still
e9b720a8.
```

## Stage 1 Report

The bridge exists and the numbers move. `npm run dev` renders act 1 in a browser for the first time in the project's history, and what it renders is the walled state, because `ACT1_ENABLED.ferment` is false and stage 6 has not built the unlock yet. Watching NAD+ go from 30 to 0 in a browser window is the first thing this repository has ever done that a console could not.

**Files.** `src/ui/runtime.ts` is the bridge, `src/ui/RuntimeContext.tsx` is the React side of it, `src/ui/drain.ts` is the step 6 measurement behind `npm run sim:drain`, `src/ui/__tests__/runtime.test.ts` is the guard, `src/App.tsx` is the deliberately ugly readout and `src/ui/README.md` no longer says the directory is empty. One kernel file changed, `src/sim/loop.ts`, and that is step 1's problem below.

**The `recordAct1Tick` problem, and how it was solved.** `createLoop` now takes an optional read-only `TickObserver` and calls it immediately after each `tick`, inside the while loop. The runtime passes `recordAct1Tick` as that observer, so metering is exactly as frequent as ticking by construction rather than by the driver remembering to match it.

Everything else considered lost on the same point. The meter reads `state.fluxes` and `state.scales`, which are scratch arrays the next tick overwrites, so by the time `advance` returns the only surviving snapshot is the last tick's. `lastTickCount` reports how many ticks ran but cannot recover the ones already overwritten, which is what the stage spec meant by it not being enough. Chunking the frame delta into tick-sized pieces so each `advance` runs at most one tick was rejected for a concrete reason rather than an aesthetic one: it changes the order the accumulator adds floats in, so a frame delivered as one 150ms delta and the same frame delivered as three 50ms deltas would no longer be bit-identical, which is exactly the property the second half of the test file exists to assert. Metering from pool deltas instead of fluxes was rejected because a pool touched by two reactions cannot attribute its change to either.

The kernel change is small, optional, and additive, so every existing call site is untouched. The observer's contract is written into `loop.ts` in as many words: it may not write to simulation state, because a write there would make game state a function of how often the driver calls `advance`, which is the exact dependency the fixed timestep exists to remove. Flagging it here rather than burying it: this is a V1 file and V3 edited it.

**Test count: 105, against V2's 95.** Ten new, all in `src/ui/__tests__/runtime.test.ts`, none of the existing 95 modified.

The two properties the spec named both hold. Driving the runtime with 400 frames of 50ms produces pool amounts, a tick count and a state hash identical to calling `tick` 400 times directly. And 400 regular 50ms frames against an irregular scripted sequence of 16 different deltas summing to exactly the same 20000ms produce identical tick counts, identical pool amounts and an identical hash, while differing in frame count, which is the point: the display saw two different worlds and the simulation saw one. The irregular deltas are a fixed pattern rather than PRNG output, because a test that depends on a random sequence cannot be re-run against its own failure.

Three tests beyond the spec, each for a failure that would otherwise be silent. Metering is asserted across three framings of the same 200 ticks, one tick per frame, ten ticks per frame and all 200 in a single frame, and all three agree to twelve decimal places on ATP produced, glucose taken up and lactate produced, with the ledger still reading exactly 4 gross per glucose. That is the test that would have caught the step 1 bug had it been written wrong. The backgrounded-tab hole is asserted rather than merely described: five minutes arriving in one frame runs exactly `MAX_CATCHUP_TICKS` ticks and routes the remaining 290000ms to `pendingOfflineMs`. And the first frame of a run credits zero elapsed time however late it arrives, which is what makes `stop` then `start` resume instead of dumping the paused interval into the accumulator.

**The backgrounded tab, surfaced and not fixed.** `pendingOfflineMs` is on the snapshot, printed in the readout, and captioned on the page as game time lost to a backgrounded tab that V5 will own. It reads zero for every normal frame size.

**Environment drain, measured through the runtime.** `npm run sim:drain`, ferment enabled, `glucose_env` starting at 10000, 120 game-minutes per row.

    uptake Vmax    crosses 400    env at end    atp at crossing    atp at end
    8 (default)      23m 21.2s          0.00           3.341e+0    4.941e-323
    12               15m 34.1s          0.00           5.509e+0    4.941e-323
    18               10m 22.8s          0.00           1.661e+1    3.953e-323
    26                7m 11.1s          0.00           1.661e+1    4.941e-323

This log's arithmetic guessed roughly 21 minutes at the default Vmax. The measured figure is 23m 21.2s, so the estimate was close and slightly optimistic. The 26 row is a placeholder for the top of the capacity ladder stage 6 has not designed yet, and it is where the other downstream Vmax values already sit, since selling uptake past the point where it stops being rate-limiting sells nothing. Stage 6 owns the real number.

The trap is confirmed rather than inferred. Every row ends with `glucose_env` at exactly 0.00 and ATP at 4.9e-323, which is denormal, one or two ulps above zero. The cell does not recover in the remaining 90-plus minutes of any row. Against docs/PROGRESSION.md's 45 to 90 minute target for act 1, a player who buys the capacity upgrades at all reaches an unrecoverable state between 7 and 23 minutes in. Measured, not fixed, per the stage spec. Stage 6 decides.

**A finding for stage 6, from the browser rather than the harness.** Under the walled state ATP also decays to exactly 0.000000 while `maintain` keeps hydrolysing, so by roughly 15 game-seconds the screen shows every flux at zero except `uptake`, glucose piling up inside the cell, NAD+ at zero and NADH at 30. V2 stage 4 only ever tested recovery from a 600-tick stall. Stage 6 step 6 asks for a 20000-tick stall, and this is the reason it matters: recovery has to come back through `payoff`, which needs g3p, which needs `prep`, which needs the ATP that is no longer there. Not investigated here, because stage 1 measures.

**Verify.** `npm test` 105 passed across 12 files. `npm run typecheck` clean. `npm run lint` clean. `npm run build` clean, 207.25 kB JS and 9.77 kB CSS. `npm run dev` opened in a real browser: tick count read 43 then 308 then 547 across three reads, frames read 130 then 928 then 1644, so the display ran at roughly three frames per tick as expected at 60Hz over 20Hz, and the console carried no errors. ATP per glucose held at 4.000000000 gross and 2.000000000 net on screen throughout, including deep into the stall.

**The act 1 canonical hash is still `e9b720a8`**, asserted in `src/content/act1/__tests__/determinism.test.ts` line 118 and passing. `172f83fb` is untouched and also passing. Nothing in the interface wrote to simulation state.

---

# Stage 2 — The visual system, and only the part the slice needs

```
Tokens and primitives. Still no simulation on screen beyond what stage 1 left.

1. Fonts, self-hosted. Fredoka 600 and Nunito 400 to 900 as woff2 under
   src/ui/fonts/, @font-face in src/index.css with font-display: swap and a
   system rounded fallback stack behind each. Record the licence and the source
   in a README beside them. No link to fonts.googleapis.com anywhere, and no
   @import of a remote stylesheet: CLAUDE.md says no network dependency for
   core play and first paint is core play.

2. Tailwind v4 @theme block in src/index.css. Every colour token from
   DESIGN.md's Colour section, verbatim, under the names DESIGN.md gives them.
   The spacing scale, the two outline widths, radius card 16 button 12 pill
   999 and the shadow as 4px 4px 0 ink with no blur.

   Do not add tokens DESIGN.md does not define. A token that exists because a
   component wanted it is how a design system becomes a suggestion.

3. src/ui/components/. The primitives the slice needs and no more:

   Card       2.5px ink outline, hard offset shadow, radius 16, surface prop
              restricted to the DESIGN.md surface names
   Pill       2px outline, radius 999
   Button     radius 12, translate 3px into its own shadow on :active with the
              shadow dropping to zero, 80ms
   Figure     every number in the game goes through this

   Figure is the important one. It applies tabular figures itself, always, so
   the rule cannot be forgotten at a call site. DESIGN.md says column alignment
   is the credibility mechanism and calls it not optional, which means it
   should be structurally impossible to omit rather than reliably remembered.
   Nothing else in src/ui/ may render a raw number into JSX.

4. Two mechanisms rather than two conventions, both as tests:

   a. No blurred shadow and no gradient anywhere in src/ui/**. Grep for
      `blur(`, `linear-gradient`, `radial-gradient` and a box-shadow with a
      third non-zero length. DESIGN.md says the hard offset shadow is
      load-bearing and that a blurred one collapses the system into generic
      soft UI. Make that a failing test rather than a paragraph.
   b. No raw numeric interpolation in JSX outside Figure. A lint rule if you
      can express it, a test that scans for `{...toFixed(` and similar if you
      cannot. Say which you did and why.

5. Apply the top bar to App.tsx as the first real surface: wordmark in Fredoka
   600, ATP per second and glucose per second as headline figures in Nunito
   900, elapsed game time. Flux in the large type, stock nowhere yet. The rest
   of the page stays the ugly stage 1 table underneath it.

Verify: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`,
`npm run dev`. Report the bundle size against V2's 193.37 kB and break out how
much of the growth is fonts. Report the token table you emitted and confirm
every name matches DESIGN.md. Report the output of both step 4 mechanisms
firing against a deliberate violation, then remove the violation.
```

## Stage 2 Report

**Fonts, self-hosted, and no request leaves the origin.** `src/ui/fonts/` carries `fredoka-latin-var.woff2` at 29.73 kB and `nunito-latin-var.woff2` at 39.13 kB, with `OFL-Fredoka.txt` and `OFL-Nunito.txt` beside them and a README recording the exact CDN URLs and versions they were retrieved from on 2026-07-29. `@font-face` in `src/index.css` points at them by relative path with `font-display: swap`, and behind each sits a rounded system fallback, `ui-rounded` then `Segoe UI Variable` then `Trebuchet MS`, rather than a drop to Arial. There is no `fonts.googleapis.com` link and no remote `@import` anywhere.

Two decisions worth stating rather than burying. Both files are the **variable** builds, so one file covers Fredoka 300 to 700 and Nunito 200 to 1000, against six static files for the Nunito range DESIGN.md asks for. And both are the **latin subset only**, because nothing in the game is written in another script and shipping cyrillic, greek, hebrew and vietnamese coverage nobody reads would roughly triple the bytes. Confirmed live in the browser: `document.fonts` reports `Fredoka@300 700` and `Nunito@200 1000`, and the wordmark computes to Fredoka at 91px.

**The token table.** Every name below is DESIGN.md's, verbatim, and every colour value is asserted against DESIGN.md by a test rather than by my eye. Nothing was added that DESIGN.md does not define.

    surfaces     page cream pink mint sky lilac white
    ink          ink ink2 ink3
    semantic     atp reduced oxidized substrate loss gain gradient nitrogen
    type         --font-display --font-body
                 --text-wordmark h2 card-title headline-num body label micro
                 --tracking-wordmark h2 headline-num label
    spacing      --spacing: 4px
    borders      --outline-card 2.5px, --outline-pill 2px
    radius       --radius-card 16, --radius-button 12, --radius-pill 999
    shadow       --shadow-hard 4px 4px 0 ink, --shadow-hard-pressed 0 0 0 ink
    motion       --duration-micro short medium long, --ease-enter exit move

Three of those need a note. The **ranged type sizes are `clamp()`** rather than breakpoints, because DESIGN.md writes them as ranges (60 to 104px, 26 to 38px) and a range is what `clamp` means; the one fixed size, body at 15.5px, is not clamped. The **spacing scale is expressed as a base unit rather than nine named steps.** DESIGN.md gives base unit 4px and the scale 2, 4, 8, 12, 16, 24, 32, 48, 64, and Tailwind v4 multiplies `--spacing` by the utility number, so that scale is exactly `p-0.5 p-1 p-2 p-3 p-4 p-6 p-8 p-12 p-16` and every step lands on the grid by construction. Emitting `--spacing-2: 2px` would make `p-2` mean 2px where every Tailwind user alive reads it as 8px, and a scale that is a trap is a scale people work around. And `--color-gradient` **keeps DESIGN.md's name** despite the obvious collision worry: Tailwind v4 spells gradients `bg-linear-*`, `bg-radial-*` and `bg-conic-*`, so `bg-gradient` is free and means only the act 3 proton motive force colour.

**Primitives**, in `src/ui/components/`. `Card` with a 2.5px ink outline, the hard offset shadow and radius 16, its `surface` prop restricted to the seven DESIGN.md surface names. `Pill` with a 2px outline and radius 999, deliberately carrying no shadow, because giving every small element the offset shadow makes a page read as a pile of stickers rather than a page with stickers on it. `Button` at radius 12, translating 3px into its own shadow on `:active` while the shadow drops to zero over `--duration-micro`. And `Figure`.

**Figure is the one that matters and it took a shape the stage did not specify.** It applies `tabular-nums` itself and there is no way to render through it without that. But most figures on this screen change twenty times a second, and routing them through React state would re-render the tree at tick rate, which is exactly what stage 1 built the runtime to avoid. So Figure takes either a static `value` or a `read` function sampled from the snapshot every frame, and the live path writes text into its own node through `useLive` with no render at all. Both paths format through one `formatFigure`, so a live figure and a static one cannot disagree about how a number looks. It also normalises a denormal to zero and refuses to print `-0.00`, because a pool that has decayed to 4.9e-323 is zero as far as a reader is concerned and a minus sign in front of it is a distracting lie.

**Mechanism (a): a test, `src/ui/__tests__/designSystem.test.ts`.** Three checks for shadows and two for gradients, over every `.ts`, `.tsx` and `.css` file in `src/ui/` plus `src/index.css` and `src/App.tsx`. Comments are stripped before scanning, because DESIGN.md's prose and this repository's comments both discuss blurred shadows and gradients by name precisely in order to forbid them, and a guard that makes documenting the rule a violation of it does not survive. The file also excludes itself, for the same reason and after the same failure: on first run it reported five gradient violations, all of them its own pattern literals.

A fourth check went in beyond the stage's ask, and it is the strictest thing here. The test **parses DESIGN.md's Colour section** and asserts that `src/index.css` defines every colour it names, at exactly the value it gives, and defines no `--color-*` that DESIGN.md does not name. "Do not add tokens DESIGN.md does not define" is now a failing test rather than an instruction, and the dependency runs the right way: change DESIGN.md and the code fails until it catches up.

**Mechanism (b): a lint rule, not a scanning test.** `no-restricted-syntax` in `eslint.config.js`, scoped to `src/**/*.tsx` with `Figure.tsx` the only exemption, banning `toFixed`, `toPrecision`, `toExponential`, `toLocaleString` and `String()` inside a JSX expression. A lint rule because the AST knows what a call is and a grep does not: `toFixed` in a comment, in a string, or in a template that never renders would all trip a scan, and a guard with false positives gets disabled. Scoped to `.tsx` so the harnesses and `drain.ts`, which print to a terminal rather than a page, are untouched.

What it cannot see, stated rather than glossed: `{someNumber}` in JSX is indistinguishable from `{someString}` without type information, and typed linting across a React tree costs more than it buys. The rule catches *formatting*, which is where alignment is actually lost, and an unformatted float interpolated raw would produce ragged decimals that are obvious on sight. There is no carve-out for the leftover stage 1 table: its numbers were rerouted through Figure rather than exempted, because scaffolding is exactly where a formatting call survives long enough to be copied.

**Both mechanisms fired against deliberate violations.** A blurred shadow, a Tailwind `shadow-lg`, a `bg-linear-to-br` and a `toFixed` in the wordmark were planted, then removed.

    ×  no blurred shadows > declares no box-shadow or shadow token with a non-zero third length
       + "src/ui/components/Card.tsx: dashed ? none : 4px 4px 12px"
    ×  no blurred shadows > uses no Tailwind shadow utility that carries a blur
       + "src/ui/components/Card.tsx: shadow-lg"
    ×  no gradients > uses no Tailwind gradient utility
       + "src/ui/components/Card.tsx: bg-linear-"
       Tests  3 failed | 5 passed (8)

    D:\Portfolio work\Development\krebs\src\ui\components\TopBar.tsx
      60:16  error  DESIGN.md: every number goes through Figure, which applies
                    tabular figures. Pass `value` or `read` to Figure instead of
                    formatting here  no-restricted-syntax
    ✖ 1 problem (1 error, 0 warnings)

**Planting the violation caught a real hole in the scanner, which is the argument for planting it.** On the first attempt the blur-radius check did not fire. Its regex stopped the shadow value at the first quote, so against `boxShadow: dashed ? 'none' : '4px 4px 12px ...'` it read the condition and missed both branches. A CSS-in-JS shadow is a conditional expression more often than a bare string, so the check would have passed a blurred shadow in production while reporting a clean repository. Fixed to read to end of line and to strip function calls before splitting layers, so the commas inside `rgba()` no longer split one layer into three. Both violations then reported and both were removed; the suite is clean.

**The top bar** is the first real surface. Wordmark in Fredoka 600 with `tracking-wordmark`, ATP per second and glucose per second as headline figures in Nunito 900, elapsed game time. Flux in the large type and **stock nowhere at all**, which is DESIGN.md's inversion taken literally: how much ATP is in the pool is a fact about the adenylate ceiling, not about how the cell is doing.

Both headline rates are **derived from the reaction table**, not written down. Stage 2 added `production` and `netRate` to the snapshot, filled from flat stoichiometry matrices built once at construction, so "ATP per second" is the payoff phase's coefficient of 2 read out of `src/content/act1/reactions.ts` rather than typed into the display, and it falls to zero when the NAD+ wall arrives without the top bar knowing what NAD+ is. `netRate` is signed and is what stage 4's flux-headline pool cards will read.

Two small findings. Elapsed time renders as **minutes with one decimal** rather than a clock face, because a clock face needs a zero-padded seconds field and a padded field is a second numeric format living outside Figure; minutes is also the unit docs/PROGRESSION.md specifies act 1's duration in. And the wordmark needed an **explicit `font-semibold`**: Tailwind's preflight resets `h1` to inherit its weight, which on a variable face renders 400 silently, and the first screenshot showed a Fredoka wordmark at the wrong weight with nothing obviously broken about it.

**Bundle, against V2's 193.37 kB.** V2's figure was JS alone, since nothing imported the content layer and there was no interface at all.

    JS      209.91 kB   +16.54 kB   React is now actually used, plus runtime,
                                    components and the whole act 1 content layer
    CSS      15.69 kB   +15.69 kB   the token block and the utilities it generates
    fonts    68.86 kB   +68.86 kB   Fredoka 29.73 + Nunito 39.13, both woff2
    ------------------------------
    total   294.46 kB  +101.09 kB

**Fonts are 68 percent of the growth** and 23 percent of the total payload. That is the price of self-hosting and it is the right price: a `<link>` to Google Fonts would show 0 kB in this table and a network dependency at first paint, which `CLAUDE.md` forbids. The fonts also load in parallel with the JS rather than blocking it, and `font-display: swap` means neither blocks paint.

**Verify.** `npm test` 113 passed across 13 files, up from stage 1's 105, 8 new. `npm run typecheck` clean. `npm run lint` clean. `npm run build` clean. `npm run dev` opened in a browser at 1400x900: mint page ground, Fredoka 600 wordmark, ATP in `atp` orange and glucose in `substrate` blue as headline figures with tabular columns holding alignment as the digits change, and no console errors. The stage 1 table still sits underneath, still ugly, now formatted through Figure.

---

# Stage 3 — The badge contract and the Needs source release gate

```
V3 is the first player-facing text the project has ever had, so this is the
stage where CLAUDE.md hard rule 1 stops being discipline and becomes
mechanism. DESIGN.md open question 6 and the matching NOW.md open item both
say this should exist before content authoring starts. Stages 4 to 6 are
content authoring.

1. src/ui/components/Badge.tsx. Four states from DESIGN.md: Sourced in gain
   green, Tuned in atp orange, Contested in lilac and Needs source in yellow
   with a dashed border.

   Type it as a discriminated union so the source row cannot be omitted.
   Sourced and Contested require a document reference. Tuned requires a reason
   string and, once docs/ECONOMY.md exists, will require a divergence row id,
   so leave the field shaped for it and comment why it is optional today.
   Needs source requires nothing, which is the point of it.

2. Wire it into Figure from stage 2. A badge is a required prop, not an
   optional one. DESIGN.md says an unsourced number should look visibly broken
   because the badge slot is empty; a required prop is stronger, because it
   does not compile.

3. The release gate. It must fail a production build if any Needs source badge
   survives into it. Pick one of:
     - a Vite plugin that fails the PROD build on the literal in the bundle
     - a test that scans src/ui/** and fails when NODE_ENV is production
     - a render-time throw guarded by import.meta.env.PROD
   Say which you chose and why the others lose. A dev build must still render
   the badge loudly, because its whole purpose is being visible during
   development.

4. Prove it fires, the way V1 stage 1 and V2 stage 6 proved their guards. Write
   a probe component carrying a Needs source badge, run the gate, quote the
   failure verbatim, delete the probe, confirm the build is clean afterwards.

5. src/ui/content.ts. Every player-facing string in the slice, in one file,
   each paired with its badge. Molecule names, reaction names, the two unlock
   labels, the coach mark body. Nothing invents a voice: docs/CONTENT_STYLE.md
   does not exist and this log does not write it.

   Any number in any of those strings needs a badge that resolves to a
   docs/SCIENCE.md reference or to Tuned. There should be very few. If a string
   needs a number that is neither, that is a finding worth reporting rather
   than a string worth writing.

Verify: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
Report the gate output from step 4 verbatim. Report every string in content.ts
with its badge, as a table, and state plainly whether any of them carries a
number that could not be traced. Confirm DESIGN.md open question 6 is now
closed by mechanism rather than by intention.
```

## Stage 3 Report

**DESIGN.md open question 6 is closed by mechanism.** The gate exists, it fires, it fails the build with exit code 1, and it names the file that caused it. Stages 4 to 6 are the content authoring it was supposed to precede, and it now precedes them.

**The union.** `src/ui/components/Badge.tsx`. `Sourced` and `Contested` do not typecheck without a document reference, `Tuned` does not typecheck without a reason, and `Needs source` requires nothing, which is exactly the point of it. `Tuned` carries an optional `divergenceRow` shaped for the docs/ECONOMY.md row it will owe, with a comment saying it is optional only because that document does not exist yet and can be made required in one line once every value has a row.

**The gate: a Vite plugin over the emitted bundle. `vite/needsSourceGate.ts`.**

The other two options lose for concrete reasons. A **render-time throw** guarded by `import.meta.env.PROD` only fires if the offending component actually renders, so a badge on a panel that opens once in twenty minutes ships happily and detonates in front of a player rather than in front of the person who wrote it; a gate that depends on coverage is not a gate. A **test scanning `src/ui/**`** checks the source rather than the artifact, misses anything the globs do not reach, and only runs when somebody runs tests, so `npm run build` would still produce a shippable bundle. Scanning the emitted bundle checks the thing that actually ships, cannot be skipped because it is part of the build, and is stricter in the one direction that matters: a badge unreachable from the entry point is tree-shaken and correctly does not fail, while a badge that survives into a chunk fails whatever route it took.

**Making the sentinel honest was the real work.** Scanning the bundle for `needs-source` only works if that literal can reach the bundle from a call site and never from `Badge.tsx` itself, otherwise the gate fails on a clean repository and gets deleted within a week. So `Badge.tsx` writes that string in exactly one place, the type union, which is erased at compile time. There is no lookup table keyed by badge kind, because object keys are strings and survive minification, so the component is an if-chain instead. And the branch that renders the badge sits behind `import.meta.env.DEV`, which Vite replaces with `false` in a production build, so the branch and its label are dead code and get dropped. There is also deliberately **no `needsSource()` factory** beside `sourced()`, `contested()` and `tuned()`: an author has to write `{ kind: 'needs-source' }` by hand, and that friction is the feature.

The reasoning was verified rather than asserted. A clean production build passes with the badge component fully present in the source, which is only possible if the dev branch really was eliminated.

**Step 4, the gate firing, verbatim.** A probe component carrying `badge={{ kind: 'needs-source' }}` was added and rendered from `App.tsx`:

    ✓ 49 modules transformed.
    rendering chunks...
    ✗ Build failed in 1.27s
    error during build:
    [krebs-needs-source-gate] [plugin krebs-needs-source-gate]

      RELEASE GATE FAILED: a "needs-source" badge survived into the production bundle.

        assets/index-BeQdHLLD.js  <-  D:/Portfolio work/Development/krebs/src/ui/components/NeedsSourceProbe.tsx

      CLAUDE.md hard rule 1: never put a number in player-facing text that is not
      traceable to docs/SCIENCE.md. DESIGN.md makes that a badge contract, and this
      badge is the development-only state that says a claim has no source yet.

      Fix it by sourcing the claim and using sourced(...) or contested(...), or by
      admitting the number is a game decision and using tuned(...) with a reason.
      Do not delete this gate.

`npm run build` exits **1**, checked separately, because a gate that prints an error and exits 0 is decoration in CI. The failure names the offending module rather than only the chunk, so it is actionable instead of merely true. The probe was deleted, the import removed, and the build is clean again at 214.50 kB JS.

**The dev build still renders it loudly.** Confirmed in the browser with the probe in place: a dashed yellow `NEEDS SOURCE` pill sitting next to `42`, against `SOURCED` in green and `TUNED` in orange elsewhere on the same screen. Being visible during development is the badge's entire purpose.

**A finding: `Needs source` yellow is not in the palette, and it should not be.** DESIGN.md's badge contract asks for yellow and DESIGN.md's colour section contains no yellow. That is not an oversight in either direction, so it is hardcoded in `Badge.tsx` as `#F5DE3C` with a comment. Adding it to the token block would make it look like a system colour, and it would fail the stage 2 test asserting `index.css` defines exactly the colours DESIGN.md names. A development-only state has no business in a shipping palette, it should look alien, and it is dead code in production anyway. Recorded here so stage 7 can decide whether DESIGN.md wants a line saying so.

**Figure now requires a badge, plus one deviation.** `badge` is a required prop with no default, and there must never be a default, because a default is a decision about provenance made by whoever wrote the component rather than by whoever wrote the number. DESIGN.md says an unsourced number should look visibly broken; a required prop is stronger because it does not compile.

The deviation is `badgeDisplay?: 'inline' | 'attached'`. Drawing a pill beside every one of the thirty-odd figures in the dev table, or beside both figures on all eight pool cards in stage 4, produces a screen that is more badge than number. `attached` means an ancestor already displays this exact badge, so a column header or a card header carries it once. The badge is still required, still typed, and still reaches the release gate, so this changes what is drawn and never whether provenance was declared. The one hole is that a component passing `attached` and then not displaying the badge anywhere is a bug a type cannot catch; it is documented at the prop and is the only gap in this contract.

**`src/ui/content.ts`, every player-facing string with its badge.**

| String | Badge | Trace |
| --- | --- | --- |
| Glucose (environment) | Tuned | The environment is modeled as a finite pool so uptake has something to deplete |
| Glucose | Sourced | docs/SCIENCE.md Part 2 |
| Glyceraldehyde 3-phosphate | Sourced | docs/SCIENCE.md Part 2 |
| Pyruvate | Sourced | docs/SCIENCE.md Part 2 |
| Lactate | Sourced | docs/SCIENCE.md Part 2 |
| NAD+ | Sourced | docs/SCIENCE.md Part 2 |
| NADH | Sourced | docs/SCIENCE.md Part 2 |
| ATP | Sourced | docs/SCIENCE.md Part 2 |
| ADP | Sourced | docs/SCIENCE.md Part 2 |
| Phosphate | Sourced | docs/SCIENCE.md Part 2 |
| NAD+ / NADH | Sourced | docs/SCIENCE.md Part 2 |
| ATP / ADP | Sourced | docs/SCIENCE.md Part 2 |
| Uptake | Sourced | docs/SCIENCE.md Part 1, glucose uptake is modeled as untyped transport |
| Preparatory phase | Sourced | docs/SCIENCE.md Part 2, steps 1 to 5 |
| Payoff phase | Sourced | docs/SCIENCE.md Part 2, steps 6 to 10 |
| Lactate fermentation | Sourced | docs/SCIENCE.md Part 2, fermentation |
| Maintenance | Tuned | ATP hydrolysis to ADP and phosphate is real. Standing in for the entire rest of cellular metabolism with one reaction is not |
| ATP *(top bar)* | Sourced | docs/SCIENCE.md Part 2, **4 ATP gross and 2 net per glucose** |
| Glucose *(top bar)* | Tuned | Uptake rate is a tuned Vmax. The pathway it feeds is sourced |
| Elapsed | Tuned | Game time is arbitrary and maps to no real timescale, per docs/SCIENCE.md Part 1 |
| net rate | Tuned | Rates are tuned for pacing and are not measured values |
| in the cell | Tuned | Pool sizes are tuned. Only the ratios the stoichiometry fixes are sourced |
| Lactate dehydrogenase | Sourced | docs/SCIENCE.md Part 2, lactate dehydrogenase reduces pyruvate to lactate, oxidizing NADH |
| Uptake capacity | Tuned | A finite ladder of transport steps. Neither the steps nor their number is sourced |
| NAD+ has run out | Sourced | docs/SCIENCE.md Part 2, the NAD+ constraint |
| *coach mark, paragraph 1* | Sourced | docs/SCIENCE.md Part 2, the NAD+ constraint |
| *coach mark, paragraph 2* | Sourced | docs/SCIENCE.md Part 2, glycolysis halts within seconds regardless of glucose availability |
| Show me what recycles it | Sourced | docs/SCIENCE.md Part 2, fermentation exists to regenerate NAD+ |
| *required disclosure* | Sourced | docs/SCIENCE.md Part 1, required disclosure text |
| No saves yet. A refresh loses the run. | Tuned | A statement about this build, not about biology. Saves land in V4 |

**Stated plainly: no string carries a number that could not be traced.** Exactly one string contains a number at all, the top bar's ATP trace, and it is `4 ATP gross and 2 net per glucose`, which is docs/SCIENCE.md Part 2 lines 131 to 138 verbatim. Every other entry is a name, a label or a sentence with no figure in it. Nothing needed a `Needs source` badge, and nothing needed inventing.

Two decisions inside that table worth defending. Badges were applied to **every** string, not only the quantitative ones, because a molecule name is a checkable claim too and the badge is where a reader finds out whether anyone checked it; where a name is really a modeling decision the badge says Tuned and says why, which is the case that would otherwise pass silently. And `Elapsed` is **Tuned rather than Sourced** because docs/SCIENCE.md Part 1 says game time is arbitrary and maps to no real timescale, so badging the clock Sourced would imply a game-second means something.

**Two findings for later stages.**

The **coach mark fits in two paragraphs**, which the stage said to report if it did not. It does, and that is a result rather than luck: the constraint is genuinely one idea, that the pool is small and fixed and the payoff phase is the only thing that spends it. What did **not** fit is the part players find most surprising, that fermentation buys throughput and buys exactly zero yield. That is a second idea, DESIGN.md's two-paragraph ceiling is hard, and cramming it in would break the ceiling to make a point about honesty. It belongs on the unlock itself in stage 6, or in a teaching panel, which is out of scope. Flagged rather than smuggled in.

The **required disclosure from docs/SCIENCE.md Part 1 now renders on screen**, quoted verbatim. That document says it must appear in-game "in the about screen and on first launch, not buried in a repo file", and the slice has no about screen and no first-launch flow, so it sits in the act screen footer. This was not in the stage spec. It went in because stage 3 is the stage that made player-facing text a real thing, and shipping the first player-facing text while the one piece of text docs/SCIENCE.md actually mandates stayed in a repo file would be the exact failure the badge contract exists to prevent. `No saves yet. A refresh loses the run.` sits beside it, per the log's Decisions section.

**Verify.** `npm test` 113 passed, unchanged from stage 2, since this stage added mechanism rather than new simulation behaviour and its own guard is the build. `npm run typecheck` clean. `npm run lint` clean. `npm run build` clean and exit 0 with the probe removed, 214.50 kB JS and 17.23 kB CSS.

---

# Stage 4 — The pool rail, where illustration carries state

```
DESIGN.md's central claim is that every visual property carries simulation
state and that nothing in the illustration set is decorative. This is the stage
that either makes that true or reveals it as a slogan.

1. src/ui/components/PoolCard.tsx and the blob illustration set. Eight cards
   from ten pools, per this log's screen sketch. The two carrier pairs share a
   card each, because their sum is the conserved quantity and the sum is what
   teaches: NAD+ draining while NADH fills, on one card, is the wall arriving.

2. Illustration rules 1 to 3 from DESIGN.md, and rules 4 to 6 are out of scope
   because there are no enzyme objects, no damage and no ROS in act 1.

   Sides equal carbons. Phosphate dots are countable. Redox is saturation, not
   hue: NAD+ and NADH are the same silhouette in oxidized and reduced.

   Thick black stroke at 3 to 3.5, round linejoin, flat pastel fill, irregular
   hand-drawn polygons. Nothing geometrically perfect. A regular hexagon reads
   as a diagram and the whole direction is that it should not.

3. This is the part that matters: the side count and the dot count are DERIVED
   from the conserved weights in src/content/act1/pools.ts, not written into
   the SVG. A blob takes a carbon weight and a phosphate weight and draws
   itself. "Every visual property carries simulation state" is then a
   dependency in the code rather than a claim in a document, and a stoichiometry
   change moves the picture.

4. Flux headline, stock subscript, on every card. DESIGN.md calls this the
   system's biggest deliberate departure. Per-pool net rate in the large type,
   current amount small underneath. Net rate needs a sign and needs to read as
   a sign: a falling pool and a rising one must be distinguishable without
   reading the minus.

5. src/ui/__tests__/illustration.test.ts. A property over the pool table rather
   than eight hand-written cases, in the same posture as V2 stage 3's
   stoichiometry test: for every act 1 pool, the rendered polygon side count
   equals its carbon weight and the rendered phosphate dot count equals its
   phosphate weight. Pools with a carbon weight of zero get a non-polygon
   treatment and the test should assert they are not drawn as zero-sided
   nonsense.

6. Left rail into App.tsx, under the stage 2 top bar. The ugly table can go.

Verify: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`,
`npm run dev`. Report the derived side and dot count for all ten pools as a
table. Say plainly whether rule 3 works in practice: watch NAD+ drain in the
browser and report whether the colour leaving is legible before the number is
read, which is the specific claim DESIGN.md makes and calls its single most
important colour decision.
```

## Stage 4 Report

**There is no path data anywhere in `src/ui/components/Blob.tsx`.** No hand-authored shapes at all. A blob is handed a carbon weight and a phosphate weight and draws itself, and those weights are read out of `act1PoolDefinitions()`, which is the same conserved-quantity table the conservation test asserts against. Change glucose from six carbons to five and the picture changes in the same commit. That is what makes DESIGN.md's central claim a dependency in the code rather than a sentence in a document, and it is the thing this stage was for.

**The derived geometry, printed by the code rather than transcribed beside it.** `src/ui/__tests__/blobTable.report.test.ts`, same posture as the conservation test's worst-drift readout.

    pool            carbon   sides    phosphate    dots   shape
    ------------------------------------------------------------
    glucose_env         6         6           0       0   silhouette
    glucose             6         6           0       0   silhouette
    g3p                 3         3           1       1   silhouette
    pyruvate            3         3           0       0   silhouette
    lactate             3         3           0       0   silhouette
    nad                 0         0           0       0   carrier
    nadh                0         0           0       0   carrier
    atp                 0         0           3       3   carrier
    adp                 0         0           2       2   carrier
    pi                  0         0           1       1   carrier

Ten pools, eight cards. Sides equal carbons on all five carbon pools. Dots equal phosphate on all ten. The five zero-carbon pools get the carrier silhouette rather than a zero-sided polygon.

`ATP = ADP + Pi` fell out of that table without being designed: three dots, two dots, one dot, and the arithmetic is visible on the rail. It is asserted in `illustration.test.ts` as a consequence of rule 2 holding over the real weights rather than as a separate claim, so if the phosphate column ever drifts, that is where it surfaces.

**The test reads geometry, never claims.** It counts `L` commands in the rendered path and `data-role` circles in the rendered markup. It does not read a side-count attribute, because a component that reports its own side count can be wrong about it in exactly the way this test exists to catch. `data-role` says only which kind of shape was drawn. Rendered through `renderToStaticMarkup`, which required `Blob` to be a pure function of its props, and that turned out to be a load-bearing constraint rather than a convenience: the moment the illustration needed the runtime to draw itself, it would stop being testable as a property of the pool table.

Twenty-four assertions across five groups. Rule 1 as a property over every carbon-bearing pool, plus the zero-carbon branch asserting no silhouette is emitted and a real carrier path is, plus a guard that both branches are non-empty so neither passes vacuously. Rule 2 over all ten pools. Rule 3 asserting NAD+ and NADH render byte-identical geometry and differ only in fill once the fill and the accessible label are normalised away. And two on irregularity: glucose's six vertices do not sit at a constant radius, and the same blob renders identically twice.

**Rule 3 works, and the answer to the stage's question is yes.** The colour leaving is legible before the number is read, comfortably. Measured in the browser by sampling the fill attribute frame by frame:

    t=0s   fill rgb(169 191 184)   electrons 0.00   NAD+ 29.99  NADH  0.01
    t=1s   fill rgb(134 191 178)   electrons 0.26
    t=2s   fill rgb( 35 191 160)   electrons 1.00   NAD+  0.00  NADH 30.00

`oxidized` is a dull grey-green and `reduced` is a vivid teal, and they are far enough apart that peripheral vision catches the change on a card you are not looking at. Two screenshots of the same card three seconds apart are unmistakably different before you read either number. One silhouette, one fill, moving along the axis, exactly as DESIGN.md describes it.

Two honest qualifications. First, **DESIGN.md's sentence is ambiguous and I had to pick a reading.** It says "when the redox pool drains, the player watches the NAD+ wall arrive as colour leaving", but NAD+ is the *desaturated* end of the axis, so as NAD+ drains, colour arrives rather than leaves. The implementation encodes the reduced fraction, so saturation rises into the wall and falls when fermentation runs. That is the reading that makes the encoding monotonic in one quantity, and the other reading would need the axis inverted against DESIGN.md's own token descriptions. Flagged for stage 7 rather than resolved here.

Second, **the whole transition takes about three seconds and it happens at t=0.** With `ferment` disabled the pathway walls at roughly 3.05 game-seconds, so the entire redox story plays out before a player has finished looking at the screen and then never moves again. The encoding is correct and the pacing is not. That is not stage 4's to fix, it is a tuning consequence, and it is the strongest argument yet that `ACT1_NICOTINAMIDE_TOTAL` needs a docs/ECONOMY.md row.

**Two illustration findings, both found by looking rather than by reasoning, both fixed.**

**Blobs kept turning into faces.** The first version put NADH's two electron dots side by side in the upper half of the carrier, and the reduced carrier immediately read as a small character with two eyes. Then ATP's three phosphate dots in a horizontal row across the lower half read as eyes and a nose. DESIGN.md reserves faces for things that *are* characters: rule 6 gives ROS X eyes so hazards read as characters, and the beast has a face for the same reason. A carrier is not a character and a nucleotide is not a character. Electrons moved to a stacked pair on the upper-right edge, where they read as two particles being carried, which is what they are.

The phosphate fix is the better of the two because the visual reason and the biological reason agreed. **Phosphates are now a diagonal chain rather than a row**, because ATP's three phosphates really are a chain, alpha to beta to gamma, and hydrolysis really does take the terminal one off the end. A row of three says they are interchangeable, which is what makes "spending energy removes a dot" read as arbitrary instead of as the end of a chain coming off. Spacing and radius were then tuned so consecutive links do not touch, because the first chain overlapped itself and three versus two stopped being readable, which is the only thing rule 2 actually asks for.

**A regular hexagon reads as a diagram, and at first it was one.** Vertex wobble was raised from 0.13 radius and 0.11 angle to 0.19 and 0.16 after looking at the rail: at the original values glucose still read as a neat hexagon, which is the one thing DESIGN.md says it must not do. The wobble is a deterministic integer hash of seed and vertex index rather than a random number, so each molecule has its own permanent shape and nothing reshuffles between renders. `src/ui/` is exempt from the determinism guard by the carve-out in `eslint.config.js`, but the reasoning behind that guard still applies to anything a player looks at twice.

**Flux headline, stock subscript, and a sign that reads as a sign.** Net rate in `headline` type, stock in `micro` underneath, on every card. The rate is coloured live: `gain` green rising, `loss` red falling, `ink2` flat below 1e-6. That is not a decoration chosen for this card, it is DESIGN.md's own definition of those two tokens, which name "rising, healthy" and "falling numbers" explicitly. A falling pool and a rising one are distinguishable across the room without reading the minus. The colour is written straight to the node from the snapshot through a new `useLiveNode` hook, so nothing on the rail re-renders at tick rate.

**The two pair cards follow different rules, deliberately.** The nicotinamide card draws **one** blob, because rule 3 says NAD+ and NADH are the same silhouette and drawing two would be drawing the same shape twice and throwing the encoding away. The adenylate card draws **two**, because rule 2 governs that pair instead, and putting ATP and ADP side by side is the only thing that makes a countable dot difference visible at all. Both show two stocks under one headline.

**A note on my own lint rule.** It caught `fraction.toFixed(3)` in `PoolCard.tsx`, where the number was an SVG opacity rather than anything a player reads. Rather than adding a disable comment, the code was changed to quantise the fraction to a hundred integer steps and compare those, which sidesteps the rule and is better code anyway: the attribute is now written only when it visibly changed, rather than sixty times a second with a float differing in its twelfth decimal place. The rule was right to fire and the right answer was not an exception.

**The ugly table is gone.** The rail says everything it said and says it with shape and colour instead of six decimal places. `App.tsx` is now the DESIGN.md layout with placeholders for stage 5's pathway card and stage 6's shelf, and `min-width: 0` is already set on the main grid column per DESIGN.md line 150, applied now rather than in stage 5 where it would be a bug fix.

**Two layout findings for stage 7.** The **wordmark at up to 104px is very large for a persistent top bar**; it is DESIGN.md's own scale and it is followed here, but on a screen that has to carry eight pool cards, a pathway and a shelf it takes a permanent 100px band for a word that never changes. And the **rail is 1400px tall at eight cards**, so the bottom three are below the fold on a laptop, which matters because the carrier card is the one the whole act turns on and it is card six. Both recorded rather than acted on, since stage 4's job is the rail and stage 7's is what did not survive contact.

**Verify.** `npm test` 138 passed across 15 files, up from stage 3's 113, 25 new. `npm run typecheck` clean. `npm run lint` clean. `npm run build` clean, 217.19 kB JS and 17.33 kB CSS. `npm run dev` in a browser at 1500x1100 with no console errors, showing the walled state unmistakably: uptake at +7.62/s in green, environment at -7.62/s in red, everything downstream at 0.00 in grey, glucose piled at 21.01 inside the cell, NAD+ at 0.00 against NADH at 30.00 on a fully saturated teal carrier, and ATP at 0.00 against ADP at 40.00.

---

# Stage 5 — The pathway card and flux as motion

```
The thing a console cannot do. DESIGN.md says motion is load-bearing rather
than decorative and that the player reads rate by watching.

1. src/ui/components/PathwayCard.tsx. The five act 1 reactions as arrows
   between the pool blobs, on the cream surface. Set min-width: 0 on the grid
   column, per DESIGN.md line 150, or the SVG forces the track wider than its
   container.

2. Dashes flow along each arrow at a speed proportional to the applied flux,
   which is state.fluxes[r] * state.scales[r] and not the intended flux. Drive
   stroke-dashoffset from the snapshot at frame rate rather than restarting a
   CSS animation when the rate changes, because a restarted animation reads as
   a stutter and the stutter would carry no information.

3. Zero flux must look stopped, not slow. This is the whole stage.

   A dash animation that asymptotically slows reads as "working, but slowly"
   when the truth is "stopped", and stopped is exactly the walled state.
   Misreading it breaks question 2 before the player ever gets to answer it.
   Below a threshold the arrow goes static and drops to a visibly inert
   treatment. Pick the threshold, say what it is, and put it in
   src/ui/tuning.ts with the rest of the provisional numbers.

4. prefers-reduced-motion. DESIGN.md is explicit that reduced motion must not
   simply disable this, because nothing in the game may be encoded in movement
   alone. Reduced motion swaps flowing dashes for a static arrow plus an
   explicit numeric rate. Test that the numeric rate renders in the reduced
   path, and that it renders through Figure with a badge like every other
   number.

5. Interpolation. loop.advance returns the sub-tick remainder and
   docs/SIMULATION.md Part 1 passes it to the renderer for exactly this. Use it
   for the dash phase so motion is smooth at 60fps over a 20Hz simulation. It
   must not touch simulation state, and the stage 1 test that frame timing does
   not reach the simulation must still pass unchanged.

Verify: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`,
`npm run dev`. Report the zero-flux threshold and why you chose it. Watch the
walled state in the browser with ferment disabled and report whether a stopped
arrow reads as stopped. Confirm the reduced-motion path shows a rate for every
arrow. Confirm the act 1 canonical hash is still e9b720a8, because a renderer
that changed it has written to simulation state.
```

## Stage 5 Report

_Pending._

---

# Stage 6 — Unlocks, the wall and the two failure states

```
Where the act happens. Everything before this stage was apparatus.

1. The unlock shelf. Dashed slots per DESIGN.md, locked content visible and
   dimmed rather than hidden, because seeing what is coming is the genre's
   engine. Two slots.

     ferment          once, sets the enabled flag createAct1 already takes
     uptake capacity  a fixed enumerated number of steps, raising uptake Vmax

   Both gated on a cumulative-ATP threshold read from the meter. Neither
   subtracts from the atp pool. The adenylate pool is fixed, closed and
   conserved, and subtracting from it breaks the conservation test on the tick
   it happens, which is a good reason and also the true one. Put it in a
   comment so the next person does not helpfully "fix" it.

   The uptake steps are enumerated, not a multiplier. Hard rule 3 forbids
   infinite scaling and an upgrade with no last step is infinite scaling with a
   small number in front of it.

2. src/ui/tuning.ts. Every threshold, every Vmax step, the stage 5 zero-flux
   threshold, in one file, nowhere else. Header block in the same style as
   src/content/act1/tuning.ts: provisional, tuned for nothing, not measurements,
   each owing a row in the docs/ECONOMY.md divergence table once that document
   exists, introduced by UPDATELOGV3.md stage 6. Every one of them renders with
   a Tuned badge.

3. The two failure states must be distinguishable at a glance, with no text
   label saying which. NOW.md names this as something V3 has to measure.

     walled    uptake at full rate, glucose piling up inside, NAD+ empty
     starved   every flux low in proportion, nothing accumulating anywhere

   V2 stage 5 showed the flux column alone separates them. The screen should
   too. Design it, then in stage 7 find out whether it worked.

4. The NAD+ coach mark. One, on the carrier card, per DESIGN.md's anatomy:
   heading with badge, at most two paragraphs, an action and a mandatory
   source row pointing at docs/SCIENCE.md Part 2. Two paragraphs is a hard
   ceiling and a concept that needs more needs a teaching panel, which is out
   of scope, so if it does not fit in two paragraphs report that as a finding.

   Build two trigger behaviours behind a flag: opens only when the player taps
   the info affordance, and auto-opens once when the stall is first detected.
   Do not pick between them here. Question 2 is precisely about whether this
   beat is interesting or annoying and stage 7 is where it gets played.

5. Resolve the environment drain, using stage 1's measured figures rather than
   this log's arithmetic. The options are a larger starting environment, a
   replenishment boundary flux or fixing the bootstrap trap itself. State
   which, state why the others lose, and state plainly whether the result is a
   fix or a deferral. If the pathway can still reach an unrecoverable state,
   say so and leave the NOW.md blocking item open.

   Any boundary flux must not break conservation. If you add one, the
   conservation test has to be told the environment is a boundary rather than
   quietly loosened, and that is a change to a V1 guard, so flag it loudly
   rather than editing it in passing.

6. Test that fermentation still recovers a very long stall. V2 stage 4 only
   tested a 600-tick stall and found recovery in one tick. A player can leave
   the wall unbought for twenty minutes. Run a 20000-tick stall, enable
   ferment, and report whether it recovers and how. If ATP has decayed to
   denormal by then, the payoff phase is the only way back in, and whether that
   is enough is a measurement rather than an argument.

Verify: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`,
`npm run dev`. Report the tuning table with every provisional number and its
Tuned badge reason. Report the step 5 decision in full. Report the 20000-tick
stall recovery result. Confirm the act 1 canonical hash is still e9b720a8
unless step 5 changed the pathway, in which case report the new hash, say
exactly what changed it, and freeze it.
```

## Stage 6 Report

_Pending._

---

# Stage 7 — Play it, then coherence, verify and NOW.md

```
The deliverable of this whole log is an answer to two questions, and the only
way to get one is to play the thing. Do that before the tidying, not after.

1. Play it. `npm run dev`, at least twenty minutes of real time, both coach
   mark trigger behaviours, both reduced-motion settings and the walled state
   met properly rather than skipped past. Take notes while playing rather than
   reconstructing afterwards.

2. Answer the two docs/BRIEF.md line 110 questions, in prose, in the report.

     Do saturating kinetics feel like a game?
     Does the NAD+ wall read as interesting rather than annoying?

   "I cannot tell from twenty minutes" is a permitted answer and is a better
   one than a confident answer that is invented. V2 stage 6 refused to claim
   more than a console could show and that refusal is the standard here.

3. Answer the four things NOW.md says V3 has to measure, each separately:
   whether the stall reads as an interesting constraint or as the game
   breaking; whether the instantaneous recovery on unlocking fermentation is
   satisfying or anticlimactic; whether a player watching ATP per second jump
   while ATP per glucose does not move draws the intended conclusion; and
   whether walled and starved are distinguishable at a glance now that they are
   rendered rather than printed.

   Then pick a coach mark trigger behaviour and say why.

4. Coherence sweep over src/ui/. No gradients, no blurred shadows, every number
   through Figure, every figure badged, prefers-reduced-motion honoured
   everywhere motion carries information, no Math.random or Date.now in
   anything that reaches simulation state. Fix what you find rather than
   reporting it.

5. Full verify: `npm run typecheck`, `npm run lint`, `npm run build`,
   `npm test`. Report the test count against V2's 95 and the bundle size
   against V2's 193.37 kB. The bundle will grow substantially and that is
   expected, since React is now actually used and the fonts ship with it.
   Break the growth down rather than reporting one number.

   Confirm both canonical hashes: 172f83fb for the toy pathway and e9b720a8 for
   act 1, unless stage 6 changed the pathway. An interface that moved a hash
   wrote to simulation state and that is a defect, not a version bump.

6. Update DESIGN.md. Its status line still reads "proposed, no code exists
   yet", which is now false. Beyond that, record what survived contact: which
   parts of the specification the slice implemented, which it deferred and
   which turned out to be wrong when a real simulation ran behind them. That
   last list is the most valuable thing this log produces and it should not be
   left implicit. Add rows to the decisions log for anything V3 decided.

   Also correct open question 3. It claims the docs sit at the repository root
   while every reference points at docs/. They are in docs/. The entry is
   stale.

7. Update NOW.md:
   - Status: there is an interface and the slice is playable.
   - Build state table: V3 done, with the date. Line 30 says do not extend the
     table past V5 until V3 has answered the two questions. V3 has now
     attempted them. Decide whether the answers license an extension, and if
     they do not, say so and leave the table alone. Either is a legitimate
     outcome and an unjustified extension is not.
   - A "What the interface does" section, sibling to the kernel and content
     sections, same shape.
   - Blocking: resolve or restate the environment and bootstrap-trap item with
     stage 6's decision. Add anything the play session found.
   - "Open, not blocking": the coach mark trigger, the unlock thresholds and
     their ECONOMY.md debt, the backgrounded-tab hole from stage 1 and
     anything in DESIGN.md that did not survive contact.
   - "The vertical slice": V3's line moves to done and the slice is complete.
   - "Why the UI waits" is now a section about a thing that has stopped
     waiting. Replace it with what the UI answered, and be as honest about what
     it did not answer as V2 stage 6 was.

8. State whether it is time to write docs/ECONOMY.md. NOW.md says it needs a
   playable prototype first and there is now a playable prototype. Do not write
   it in this log. Make the recommendation, and list the numbers it would owe
   rows to across src/content/act1/tuning.ts and src/ui/tuning.ts.

Verify: everything above clean. Report the play session in full, the two
answers, the four measurements, the test count, the bundle breakdown, both
hashes, the NOW.md and DESIGN.md diff summaries and the docs/ECONOMY.md
recommendation.
```

## Stage 7 Report

_Pending._

---

# After These Stages

- The vertical slice is complete and playable, and the two questions in `docs/BRIEF.md` line 110 have real answers rather than deferrals. Every claim about how act 1 feels now comes from having played it, which is a thing no previous log could say.
- `DESIGN.md` has met a running simulation for the first time. The record of which parts survived contact is what makes the next interface log cheap, and it is the reason `NOW.md` said to apply only the part the slice needs.
- `docs/ECONOMY.md` is now unblocked. `src/content/act1/tuning.ts` and `src/ui/tuning.ts` both exist as single files full of provisional numbers waiting for divergence rows, which is exactly the shape they were given for this moment.
- Still deferred on purpose, see `NOW.md`: saves and migrations in V4, offline progress and the `STEADY_EPSILON` and `STEADY_WINDOW` validation in V5, then the timeline, the beast, the ethanol branch, glycogen storage, the ten-enzyme decomposition and all of act 2.
