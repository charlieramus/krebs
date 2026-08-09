charlie

# krebs, V9: CI, Cross-Engine Determinism and Deployment
# Work on one stage at a time. Do NOT combine stages.

---

## Context

Read `NOW.md` first, then `docs/SIMULATION.md` Part 5 and `docs/PILLARS.md` rule 7. Then look at the repository root and note what is not there.

**There is no CI.** No `.github/`, no workflow, nothing that runs on a push. By the time this log starts the project has six mechanisms that fail a build on purpose:

```
  eslint.config.js            hard rules 4 and 5, across sim, content and save
  vite/needsSourceGate.ts     hard rule 1, scans the emitted production bundle
  designSystem.test.ts        DESIGN.md's palette against src/index.css
  schemaVersionGate.test.ts   hard rule 7, fixtures and migrations
  V5's divergence-row test    docs/PILLARS.md rule 5
  V7's channel and contrast test
```

Every one of them was built deliberately, each with a probe that proved it fires, and **not one of them runs unless a person types `npm test` or `npm run build`.** `docs/SIMULATION.md` Part 5 says of the determinism test, in as many words, "Run it in CI. Run it after any change to kinetics code." There is no CI to run it in.

There is a sharper gap behind that one. Hard rule 5 bans `Math.pow`, `Math.exp` and `Math.log` in simulation code, and the reason `eslint.config.js` gives is that "the ECMAScript specification permits implementation-approximated results for them, so they differ between engines and break cross-browser determinism". The whole rule exists because engines disagree. **The canonical hashes have only ever been computed in one engine.** `vite.config.ts` sets `environment: 'node'`, so every determinism assertion in the project has been checked in node and nowhere else. The cross-browser claim is currently an argument from the specification rather than a measurement, and it is the one claim in this project that is asserted most confidently and tested least.

And `CLAUDE.md` says the project is "Deployed to Cloudflare Pages". There is no `wrangler.toml`, no `_headers`, no `_redirects` and no deployment configuration of any kind. Nothing has ever been deployed.

This log builds CI, measures determinism across real engines, and deploys. It does **not** change the simulation, the economy, the content or the interface. If a cross-engine measurement finds a real divergence, that is a finding and it is reported rather than repaired here, because repairing it is a kernel change and a kernel change deserves its own log.

**One thing was added to this log after it was written, and it is a debt inherited from V8.** `docs/designs/game-spine-and-four-acts.md` scheduled a constraint on act 2's oxygen schedule to be written into `docs/SIMULATION.md` "while V8 is live", so that the steady-state engine survives a varying environment. V8 closed without it. The window has passed and the constraint still needs writing, so it lands here, in stage 5, as documentation rather than as code. It is the cheapest thing in the log and it is the only thing in the log that act 2 depends on.

**This is no longer the last planned log.** It was written when it was. `docs/designs/game-spine-and-four-acts.md` now carries a roadmap through V18, and an engineering review moved this log ahead of the two largest content logs in the project's history specifically so that the guards below are running before those diffs land. That reordering is the reason this log matters more than it did when it was written, and stage 5's closing instructions are amended to match.

## Decisions

- **CI runs everything, on every push, and the six guards are the point.** A guard that fires only when someone remembers to invoke it is documentation with a failure mode. Six of them accumulated over five logs, each carefully built and each currently optional. This log is what converts them.
- **Cross-engine determinism gets measured rather than argued.** Chromium, Firefox and WebKit, the same fixed seed and input script, `hashState` compared as an exact string. If all three agree with node, hard rule 5 is vindicated by measurement and the project can say so. If any disagrees, that is the most important finding this log could produce and it outranks everything else in it.
- **A divergence is reported, not fixed.** Finding one would mean something in the kernel produces engine-dependent floats, and locating and repairing that is a kernel change with its own conservation and determinism implications. This log's job is to find out. Fixing belongs to a log that can give it a whole stage list.
- **Deployment makes several "permanent once shipped" statements binding for the first time, and stage 4 says so out loud before pressing the button.** Hard rule 6 says never change `TICK_RATE_HZ` after launch, and until now there has been no launch, so the constant has been movable and the rule has been hypothetical. V4 declared the storage keys permanent. `SCHEMA_VERSION` 1 becomes a released version that every future version must migrate from, which is what makes the committed v1 fixture load-bearing rather than tidy. **Deploying is the act that converts all of those from statements into obligations.**
- **The origin is the other half of the save's identity and nobody has claimed one.** V4 fixed the storage keys as `krebs.save.active`, `krebs.save.backup` and `krebs.save.temp`, and recorded that renaming one orphans every save in existence with no error and no way back. `localStorage` is scoped to an origin, so the domain does exactly the same thing. Changing it later orphans every save just as completely and just as silently. The domain is therefore a permanent decision of the same kind and it gets made deliberately in stage 3, with the working title still being TBD as an input to it rather than a reason to defer.
- **A maximally strict CSP is achievable and is worth having as a statement.** `docs/PILLARS.md` rule 7 is offline-first, no account, no backend, no network dependency for core play, and V3 self-hosted the fonts specifically so first paint has no network dependency. The game makes zero network requests. A content security policy that permits none is therefore not a compromise, it is rule 7 written where a browser can enforce it, and any future change that adds a request will fail against it rather than sliding in.
- **The build artifact gets a size budget, checked in CI.** The bundle has gone from 193.37 kB at V2 to 251.29 kB at V4 and has grown in every log since. Nothing tracks it and nothing would notice a dependency that doubled it. A budget makes growth a decision.
- **`CLAUDE.md` gets corrected in the final stage.** It states the project is deployed to Cloudflare Pages as though it were a fact. Until stage 3 it is not one. Correcting a root instruction file is a deliberate act and it happens once, at the end, when it has become true.
- **The act 2 oxygen constraint is written here because its intended window closed.** It is a `docs/SIMULATION.md` edit and nothing else. It belongs in this log rather than in act 2's own log for the reason every ordering note in `NOW.md` has given and been right about: a foundation gets laid before something is built on it, and a constraint written by the log that has to satisfy it is not a constraint.
- **This log now runs before the spine work rather than after it, and that is the whole reason it is worth doing well.** Six guards and a 200-case offline sweep currently run when somebody types a command. The next two logs are the largest diffs the project has ever taken. A guard that exists but does not run is worth nothing on the day it is needed most.
- Medium feature, and the cross-engine measurement is the risk: five stages.

## What CI has to run, and why each one

Settled here so stage 1 wires a list rather than inventing one.

```
  npm run typecheck    tsc, the type contract
  npm run lint         hard rules 4 and 5 as mechanism, three directories
  npm test             269-plus tests including four of the six guards
  npm run build        the ONLY thing that runs needsSourceGate, because the
                         plugin fires on production builds and nowhere else
  npm run sim          the toy pathway harness, output stable since V1
  npm run sim:act1     the act 1 harness
```

`npm run build` earns its place twice. It runs `tsc --noEmit` and then Vite, and the `needsSourceGate` plugin scans the emitted bundle for a surviving `Needs source` badge. That guard is the mechanical enforcement of hard rule 1 and **it is the one guard that `npm test` does not reach.** A CI that ran only the test suite would leave the project's most-cited enforcement mechanism unexecuted.

---

# Stage 1 — CI

```
Wire the guards to a trigger. No source changes beyond configuration.

1. A GitHub Actions workflow at .github/workflows/ci.yml, running on push and
   on pull request. Node pinned to a specific version rather than latest,
   because an engine change is exactly the kind of thing this project needs to
   notice deliberately rather than absorb silently. Dependencies installed from
   package-lock.json with a clean install.

2. Every command in this log's list, each as its own step so a failure names
   itself. Do not collapse them into one script. "CI failed" is a worse signal
   than "lint failed", and the six guards were built to say specific things.

3. Prove each guard actually fails CI, one at a time, the way every guard in
   this project was proved when it was built. Six probes, six quoted failures,
   six reverts:
     - a Math.pow in src/sim/
     - a Needs source badge that survives into a production build
     - a colour in src/index.css that DESIGN.md does not define
     - SCHEMA_VERSION bumped to 2 with no fixture and no migration
     - a tuning constant with no docs/ECONOMY.md row
     - whatever V7's channel test asserts, violated

   This is the deliverable of the stage. A CI that runs green has proved
   nothing. A CI that has been shown to go red for each of six specific
   reasons has proved it is wired to the things it claims to protect.

4. Caching, so the workflow is fast enough that nobody is tempted to skip it.
   Report the wall-clock time for a full run. If it is slow enough to be
   annoying, that is a real problem rather than a cosmetic one, because a CI
   people route around is a CI that does not exist.

5. Do not add a coverage gate. Nothing in this project has asked for one, the
   suite is property-heavy rather than line-heavy by design, and a coverage
   number would be the first metric here that nobody chose. If coverage is
   wanted, it is somebody's decision to make explicitly rather than this log's
   to smuggle in.

Verify: the workflow runs green on a real push, and each of the six probes runs
red. Report the workflow file, all six quoted failures with the probe that
caused each, the full-run wall-clock time and confirm the tree is clean of
probes afterwards.
```

## Stage 1 Report

**The suite was already failing before this log added anything, and nothing had ever run it end to end to notice.** That is the finding of this stage and it arrived before the workflow file existed.

`npm test` on a clean checkout of `main` failed. Not an assertion: three property tests exceed vitest's default 5000ms per-test timeout, and which subset times out varies with machine load. Two consecutive baseline runs gave `1 failed | 623 passed` and then `3 failed | 621 passed`. Measured alone, one file at a time, on an idle machine:

```
  src/content/act1/__tests__/conservation.test.ts   never lets a pool go negative       12763 ms
  src/sim/__tests__/conservation.test.ts            never lets a pool go negative ...    7961 ms
  src/ui/__tests__/unlockPacing.report.test.ts      plays the whole act ...              5151 ms
```

All three are over the default even with nothing competing for the CPU. **They are also three of the most valuable tests in the project**: two run 50 randomized configurations to completion asserting no pool goes negative, the third plays act 1 end to end twice. They are long because of what they check.

So `npm test` has been intermittently red for some time, and the reason nobody saw it is precisely the reason this log exists. **A guard nobody runs does not report its own failure.** The premise of the log was that the guards were optional; the sharper version is that one of them had already broken and the silence was total.

Fixed in `vite.config.ts` with `testTimeout: 60000`, which is configuration and inside this stage's fence. The comment records the three measurements and the reasoning: a timeout separates a hung test from a slow one, a hang is unbounded, so the only property that matters is clearing the slowest real test by enough that a loaded runner cannot close the gap. 60000 is 4.7x the worst observed. It is deliberately **not** a performance budget, because nothing in this project has asked for one and a timeout is a poor place to smuggle one in. After the fix: **624 passed across 47 files**, run repeatedly.

### The workflow

`.github/workflows/ci.yml`, on `push` and `pull_request`, `ubuntu-latest`, one job. Concurrency group per ref with `cancel-in-progress`, because the guards are deterministic and a superseded run tells nobody anything.

Node is pinned to an exact patch, `24.11.1`, in a new `.nvmrc` rather than inline. Two reasons. Hard rule 5 exists because engines disagree about floating point, so the engine the hashes are computed in is load-bearing and an engine change has to be something somebody decided rather than something that happened. And Cloudflare Pages reads `.nvmrc` too, so stage 3's deploy build cannot drift from CI without the drift being visible in one file. `npm ci` rather than `npm install`, so the lockfile is authoritative. Dependency cache via `actions/setup-node`.

Every command is its own step, not collapsed:

```
  typecheck  lint  test  build  sim  sim:act1  offline:validate
```

**One step is not in the list this log settled and it is flagged rather than slipped in.** `npm run offline:validate` did not exist when V9 was written; V8 shipped it afterwards and deliberately kept it out of `npm test` on the grounds that a suite taking a minute is a suite people stop running. NOW.md then names it directly as the argument for this file: "the test docs/SIMULATION.md calls the justification for the entire approach runs when somebody types a command". CI is exactly where a slow and important check belongs, so it is a step. It exits non-zero on failure.

### The six probes

Each applied alone, run, quoted, reverted. Exit codes checked directly rather than inferred from output.

**1. `Math.pow` in `src/sim/`** — appended to `src/sim/reactions.ts`. `npm run lint`, exit 1:

```
  src/sim/reactions.ts
    166:22  error  'Math.pow' is restricted from being used. CLAUDE.md hard rule 5:
                   Math.pow is implementation-approximated. Use repeated multiplication
                   no-restricted-properties
  ✖ 1 problem (1 error, 0 warnings)
```

**2. A `Needs source` badge surviving into a production build.** This one took two attempts and the first attempt is the more useful result. See below. Placed on `ABOUT.heading`, `npm run build`, exit 1:

```
  RELEASE GATE FAILED: a "needs-source" badge survived into the production bundle.

    assets/index-BrG6iXsD.js  <-  .../src/ui/content/about.ts
```

**3. A colour `index.css` defines and DESIGN.md does not** — `--color-probe: #ff00ff`. `designSystem.test.ts`:

```
  × the colour tokens are exactly the ones DESIGN.md defines
      > emits no colour DESIGN.md does not name
    → expected [ 'probe' ] to deeply equal []
```

**4. `SCHEMA_VERSION` bumped to 2 with no fixture and no migration** — `schemaVersionGate.test.ts`, seven failures, the first two naming the rule:

```
  → CLAUDE.md hard rule 7: no committed fixture for schema version 2.
  → CLAUDE.md hard rule 7: no migration from schema version 1 to 2.
  → The version 1 fixture does not load through the migration chain.
  → expected 'corrupt' to be 'ok'
```

**5. A tuning constant with no docs/ECONOMY.md row** — `PROBE_V9_STAGE1 = 42` in `src/ui/tuning.ts`. `divergenceTable.test.ts` fails on **both** halves, which is the half worth noting:

```
  × has a row for every tuned scalar in the three tuning files
    → expected [ Array(1) ] to deeply equal []
  × agrees with the count the document states about itself
    → stated count for src/ui/tuning.ts: expected '23' to be '24'
```

**6. V7's channel guard violated** — `text-ink2` to `text-gain` in `TopBar.tsx`. `accessibility.test.ts`:

```
  × a semantic colour fills, and ink writes > uses no semantic colour as a Tailwind text utility
    → expected 'text-label font-body font-extrabold u…' not to match /\btext-gain\b/
```

All six reverted. `git status` clean apart from this stage's own additions, and a search for probe residue across `src/` and `vite/` finds nothing.

### What probe 2 found on its first attempt, which is a real limit on the gate

The first attempt put `{ kind: 'needs-source' }` on `WORDMARK` in `src/ui/content/topBar.ts`. **The build passed**, and emitted a byte-identical bundle: same content hash, same 290.65 kB.

The bundle explains it. `WORDMARK` appears as:

```
  _0={text:"krebs"}
```

The `badge` property is gone. The minifier dropped it, correctly, because **nothing reads it**: `TopBar.tsx` imports `WORDMARK` and renders `WORDMARK.text` and never `WORDMARK.badge`. Confirmed the same way for the badge it replaced, whose `tuned(...)` prose is also absent from the bundle, so this is not specific to `needs-source`.

**So the gate is narrower than its own header claims.** That header argues property values survive minification "written anywhere". They survive being *minified*; they do not survive being *unreachable*. The gate fires on a badge that is rendered and cannot fire on a badge that is dead data.

**Two things follow and they point in opposite directions, so both are recorded rather than resolved here.** The limit is arguably the correct behaviour: hard rule 1 is about numbers in player-facing text, and a badge nothing renders is not player-facing, so there is no unsourced claim in front of anybody. Against that, the gate's stated contract is stronger than what it delivers, and a maintainer reading `needsSourceGate.ts` would believe a badge anywhere is caught.

**And it surfaced a real if minor content defect.** `WORDMARK` carries a `tuned` badge saying the working title is provisional, and no surface renders it. NOW.md's "Open, not blocking" records that badge as the thing making the title's provisionality visible. It is not visible. Not fixed here, because this stage's fence is configuration and probes, and because the fix is a UI decision about whether the wordmark should show a badge at all.

### Wall-clock

Run sequentially on this machine, cold:

```
  typecheck          13s
  lint               15s
  test               47s
  build              21s
  sim                 4s
  sim:act1            4s
  offline:validate   79s
  -----------------------
  total             185s     3m05s, excluding npm ci
```

**The real run is three times faster than that and the local figure is the misleading one.** Commit `2a14616` on `updatelogv9`, run 31331888720, green, every step:

```
  Set up job                          1s
  Checkout                            2s
  Set up Node                         6s
  Install                             3s
  Typecheck                           3s
  Lint                                4s
  Test                               13s
  Build                               5s
  Simulation harness, toy pathway    <1s
  Simulation harness, act 1           1s
  Offline progress validation sweep  16s
  Post steps                          2s
  ---------------------------------------
  job total                          59s
```

**59 seconds, on a cold cache, with nothing warmed.** The gap against 185s locally is the machine rather than the work: this is a Windows filesystem with a virus scanner in front of it against a Linux runner, and every step shrank by roughly the same factor, so nothing about the workload changed shape.

That settles step 4's question with room to spare. A minute is short enough that nobody has a reason to route around it, and there is no step worth cutting: the two harnesses cost about a second between them and the two most expensive, `test` at 13s and `offline:validate` at 16s, are the two doing the most.

`offline:validate` locally varies from 24s to 79s depending on `vite-node` transform caching. In CI it is a stable 16s.

No coverage gate, per step 5.

### The two risks that only a real run could settle, both settled

`setup-node` resolved the exact patch `24.11.1` from `.nvmrc` without complaint, so the pin is real rather than aspirational. And nothing in the suite carried a Windows assumption: all 624 tests pass on `ubuntu-latest` exactly as they do here. Neither needed a fix.

One thing was checked rather than assumed: `.nvmrc` is committed with a bare LF, verified against the blob rather than the working copy, so Git's CRLF conversion on this Windows checkout cannot reach the runner and hand `setup-node` a version string with a stray carriage return.

```
The measurement hard rule 5 has always assumed and nobody has taken. Read the
comment block at the top of eslint.config.js before starting: it is the
argument this stage is testing.

1. Build a determinism probe that runs in a browser. Same fixture the existing
   determinism tests use, same fixed seed, same input script, and it reports
   hashState as a string. It must exercise the real kernel rather than a copy,
   and it must include act 1 rather than only the toy pathway, because act 1 is
   where the Hill equation and the repeated multiplication live.

   Run enough ticks to accumulate any divergence rather than the minimum that
   produces a hash. A float difference in the last bit compounds through a
   nonlinear integrator, so a long run is a more sensitive instrument than a
   short one. Report the tick count you chose and why.

2. Run it in Chromium, Firefox and WebKit, and in node for the reference.
   Report four hashes.

   Add a step to CI that does this on every push. Playwright is the ordinary
   way and it gives all three engines from one dependency. Note the cost
   honestly: this is the first substantial devDependency the project has added
   since V1 and it exists only to test a claim, which is a reasonable trade and
   should be stated as one rather than slipped in.

3. Report the result plainly, in one of two shapes.

   IF ALL FOUR AGREE: hard rule 5 is vindicated by measurement rather than by
   citation, and the project can say the determinism claim is tested across
   engines instead of argued from the specification. Freeze the hashes as
   cross-engine assertions so a future kernel change that breaks one engine
   fails CI on that engine.

   IF ANY DISAGREES: this is the most important finding in the log and
   everything else in it is secondary. Report which engine, which hash, and
   then narrow it. Bisect toward the operation responsible: the toy pathway
   first because it is simpler, then which reaction, then which arithmetic.
   Michaelis-Menten needs only multiply, divide and add, all exactly specified
   under IEEE754, so a divergence there would mean something else is going on
   and the report should say what.

   Do NOT fix it. Record it as blocking, name the suspected operation, and
   hand it to a log that can give it a stage list. A kernel arithmetic change
   needs its own conservation and determinism work and this log cannot give it
   that.

4. Two smaller checks while the harness exists, both cheap and both currently
   unmeasured:
     - the save round trip in a real browser. Every storage test to date has
       used an injected fake, which was the right call for testability and
       means real localStorage has been exercised only by hand.
     - the reduced-motion and forced-colors media queries, if V7 left either
       unverified.

5. Report what this does and does not establish. Three engines agreeing on one
   machine is not three engines agreeing on every machine, and float behaviour
   can vary with CPU architecture as well as with engine. Say what would be
   needed to claim more, and do not claim more than was measured.

Verify: the cross-engine step runs in CI on every push. Report all four hashes,
the tick count and why, the plain result in one of the two shapes above, the
two step 4 checks, and an honest statement of what the measurement does not
cover.
```

## Stage 2 Report

**ALL FOUR AGREE, on all four hashes, to the character.** Hard rule 5 is vindicated by measurement rather than by citation, and the project can now say the determinism claim is tested across engines instead of argued from the specification.

```
                  toy canonical   act1 canonical   toy 200000    act1 200000
  node            172f83fb        65b43d27         f9292a7e      35d7c4b8
  chromium        172f83fb        65b43d27         f9292a7e      35d7c4b8
  firefox         172f83fb        65b43d27         f9292a7e      35d7c4b8
  webkit          172f83fb        65b43d27         f9292a7e      35d7c4b8
```

**Two of those four columns are not new numbers, and that is the design of the measurement.** `172f83fb` has been frozen in `src/sim/__tests__/determinism.test.ts` since V1 and `65b43d27` in `src/content/act1/__tests__/determinism.test.ts` since V10 stage 3. Three browser engines reproducing them means the browsers reproduce **the values the entire test suite is built on**, not merely a value that agrees with a browser-side reference computed the same afternoon. A probe that had invented its own reference could have been self-consistently wrong in all four engines and told nobody anything.

### The probe

`src/probe/determinismProbe.ts`, plain TypeScript importing the real kernel and the real act 1 content. Nothing is reimplemented: the two run scripts are transcribed from the two existing determinism tests, and the file says in its header that if it ever disagrees with them, they are right and it is wrong. `src/probe/node.ts` is the node reference behind `npm run probe:determinism`; `src/probe/browser.ts` and `probe/index.html` are the browser side, served by the dev server.

A vitest file cannot run in WebKit, which is the whole reason this is a module and a page rather than a test.

### The tick count, and why it is 200000

The canonical runs are 1200 ticks, 60 seconds of game time. That is the minimum that produces a meaningful hash and it is a **weak instrument for this particular question**, because a last-bit float difference is invisible until something compounds it. What compounds it here is the nonlinear integrator: Hill kinetics with integer exponents by repeated multiplication, proportional shortfall scaling, and division by a saturation term that a divergent input moves.

200000 ticks is 10000 seconds, 2h46m. Act 1's environment empties at 93m07s and the cell stops at 104m05s, so the long run carries the pathway **through saturation, through the drawdown, through starvation and out the far side into the denormal-ATP regime** that NOW.md blocking item 1 is about. Those are the arithmetic conditions most likely to expose an engine difference and a 1200-tick run reaches none of them.

Both were run, rather than the long one replacing the short one, so the frozen values stay directly comparable.

### Cost, stated as a trade rather than slipped in

`@playwright/test` is the first substantial devDependency since V1. Three engines from one dependency is the cheapest honest way to get Chromium, Firefox and WebKit, and the alternative is asserting cross-browser determinism forever without ever having run the simulation in a browser. The browser binaries are about 350 MB, are not vendored, and are installed by their own CI step with a cache keyed on the lockfile, so a Playwright version bump deliberately misses the cache and redownloads. New engines are exactly what this measurement is for.

Three CI steps were added: the node reference, the engine install, and the run. Separate, so a failed download does not read as a failed simulation.

### The two step 4 checks, both of which needed a browser and neither of which had ever had one

**The save round trip against real `localStorage`.** Every storage test in the project injects a fake `Storage`, which was right for testability and means the real thing had only ever been exercised by hand. The spec loads the game, lets the cell run, forces an autosave through `visibilitychange` (a real autosave trigger, rather than reaching into the runtime), reads the save, then genuinely reloads the page and checks that elapsed game time **continues from where it was rather than restarting**. Passes in all three engines. `schemaVersion` 1, `progression.act` 1, no page errors across the teardown.

**The reduced-motion transition, which is the half V7 could not observe.** NOW.md records the app's half as passing and the OS-to-browser link as verified, and then names what was left: "a player flipping the toggle mid-session, which `usePrefersReducedMotion` listens for and which nothing has watched happen." Windows made it unobservable, because `SPI_SETCLIENTAREAANIMATION` is a no-op on this build and the value is cached per session.

`emulateMedia` on a live page **is** that event: no reload, no navigation, the query changes underneath a running page. Measured in all three engines: with `no-preference` the flowing dash lines are present and the rate figures carry `sr-only`; the instant the query flips to `reduce` the dash lines go to zero and the figures lose `sr-only`, so the channel is **replaced rather than removed**; and flipping back restores the dashes, which a one-way listener would have failed. **That entry in NOW.md can be closed.**

`forced-colors` and `prefers-contrast` were not touched. Blocking item 4 is a recorded design conflict rather than a defect and item 5 is an undecided question about a second palette, and neither is this stage's to settle.

### The probe is not shipped, and it is asserted rather than assumed

`src/probe/__tests__/probeIsNotShipped.test.ts`, four assertions: the source tree was found so nothing is vacuous, nothing outside `src/probe/` imports the probe, `index.html` does not reference it, and `vite.config.ts` declares no `rollupOptions.input`. That last one is the one that matters over time: Vite's build input is `index.html` alone by default, so the day a later log adds a multi-entry build it has to decide deliberately whether the probe page is in it.

Verified empirically once as well, by building and grepping: `dist/` holds `index.html` and four assets, and contains no match for `determinismProbe`, `runDeterminismProbe` or `PROBE_RESULT`.

### What this establishes, and what it does not

**Establishes.** Three browser engines and node, on this machine, produce byte-identical simulation state after 1200 ticks and after 200000 ticks, on two different pathways, with the PRNG driving reaction enablement in both. The arithmetic hard rule 5 protects is behaving as the specification says it should, and the frozen hashes are now cross-engine assertions, so a kernel change that is deterministic in node and not in WebKit fails CI on WebKit.

**Does not establish, stated plainly.**

*Three engines agreeing on one machine is not three engines agreeing on every machine.* Every measurement here is x86-64 Windows for the local run and x86-64 Linux for CI. Float behaviour can vary with CPU architecture as well as with engine, and the case this project has not touched is **ARM**: Apple Silicon and ARM Android are a large fraction of any real audience. Claiming more would need the same probe on an ARM runner, which is a CI matrix entry rather than new code.

*It is three engines, not three browsers.* Playwright's WebKit is not Safari and its Firefox is a Playwright build. Engine-level float arithmetic is where hard rule 5 lives so this is the right target, but a browser is more than its engine.

*It is one build of each.* Engines change. This is the argument for the step running on every push rather than once.

*And it does not prove the rule is necessary.* It proves the codebase currently obeying it is portable. Whether removing the rule would break anything was not tested and is not worth testing: the ECMAScript specification permits the divergence whether or not today's engines exhibit it, and a measurement that happened to agree would be the worst possible reason to relax it.

### Verify

`typecheck` 8s, `lint` 8s, `test` 43s, `build` 20s, all exit 0. **628 tests across 48 files**, up from 624 across 47. `tsconfig.json` now includes `e2e` and `playwright.config.ts`, so the spec holding the canonical hashes is typechecked like the code it measures.

Nine e2e tests pass, three per engine, 1.1 minutes locally. Probe runtime per engine: chromium 294 ms, firefox 647 ms, webkit 253 ms, against node's 1248 ms.

No simulation, content, economy or interface file was touched. Both canonical hashes are unmoved, which for this stage is the result rather than the absence of one.

---

# Stage 3 — Deployment

```
CLAUDE.md says the project is deployed to Cloudflare Pages. This is the stage
that makes that sentence true.

1. Before anything is configured, read this log's Decisions on what deploying
   makes binding, and state it back in the report as a list of what is being
   frozen. Hard rule 6's "after launch" begins here. TICK_RATE_HZ stops being
   movable. SCHEMA_VERSION 1 becomes a released version that every future
   version migrates from, which is what the committed v1 fixture has been
   waiting to be load-bearing for.

   If anything on that list should be changed before it freezes, this is the
   last moment. Say whether anything should be, and if the answer is no then
   say that the list was reviewed rather than skipped.

2. The origin, and treat it as permanently as V4 treated the storage keys.
   localStorage is origin-scoped, so the domain is the other half of the save's
   identity. Moving it later orphans every save with no error and no way back,
   which is exactly what V4 said about renaming a key.

   The working title is still TBD, which is an input rather than a reason to
   defer. V4 faced the same problem and solved it well: it used the repository
   name as the storage prefix precisely because a prefix that was never
   claiming to be the title cannot go stale. The same reasoning is available
   here. Decide, and record the decision with its reasoning where a future
   maintainer will find it before they try to move it.

3. Cloudflare Pages configuration. Static output from `npm run build`, no
   backend, no functions, no environment variables that affect the build. Node
   version pinned to match CI.

   A _headers file with a content security policy that permits nothing the game
   does not do. The game makes zero network requests: fonts are self-hosted
   woff2 since V3, there is no analytics, no CDN, no API. So default-src 'self'
   with no connect-src is achievable rather than aspirational, and it turns
   docs/PILLARS.md rule 7 into something a browser enforces.

   Report the policy and confirm the deployed game runs clean under it with no
   console violations. A CSP that has to be loosened to make the game work is a
   CSP that has found something worth knowing about, so report that too if it
   happens.

4. Caching headers. The build is hashed static assets plus one index.html, so
   the assets can be immutable and long-lived while index.html must not be
   cached, or players get a stale shell against new assets. Get this right the
   first time, because a wrongly cached index.html is the failure that persists
   after it is fixed.

5. Deploy, then verify on the real deployed URL rather than locally:
     - the game loads and the pathway runs
     - a save is written, survives a reload and survives a browser restart
     - the offline return works after a genuine gap
     - no console errors, no CSP violations, no failed requests
     - no request leaves the origin at all, checked in the network panel. That
       is rule 7 verified rather than asserted, and it is the first time it
       could be.

6. Wire deployment to CI. Deploy on merge to main, only after every guard has
   passed. A deployment path that can ship a build the guards rejected makes
   five logs of guard-building pointless.

Verify: the deployed URL works and the checks in step 5 pass. Report the
freeze list from step 1, the origin decision with its reasoning, the CSP and
caching headers, the step 5 results including the network panel check, and
confirm deployment is gated on the guards.
```

## Stage 3 Report

_Pending._

---

# Stage 4 — The artifact and the release gate

```
What ships, how big it is, and what stops a bad one shipping.

1. A bundle size budget in CI, failing the build when exceeded. Set it from the
   current size with headroom that is deliberate rather than generous, and
   report both numbers with the reasoning for the gap.

   Break the budget down rather than making it one figure: the fonts are 68.86
   kB of it and were a recorded decision in V3, so a budget that hides them
   inside a total makes the next such decision invisible. Report application
   code, fonts and dependencies separately.

2. Confirm needsSourceGate fires in the deployed path specifically, not only in
   a local production build. It is the mechanical enforcement of hard rule 1
   and V3 proved it fires locally. Prove it fires in CI against the artifact CI
   actually deploys, because that is the only place it matters.

3. A source map decision. The game has nothing to protect, exported saves are
   plain readable JSON per docs/SAVE_SCHEMA.md Part 4 on the grounds that there
   is nothing to protect, and docs/PILLARS.md success condition 3 is that
   someone with a biochemistry background reviews it and finds no error. That
   is an argument for shipping source maps rather than against. Decide, and if
   you ship them say that the reasoning is the same reasoning that made saves
   readable.

4. Version the build. meta.buildId is already in every save and
   docs/SAVE_SCHEMA.md Part 3 says it is diagnostic only and never branched on.
   Make it a real identifier rather than a placeholder, tied to the commit, so
   a player-submitted save says which build produced it. That is the entire
   purpose of the field and it is currently unfulfilled.

   Then check nothing branches on it. The schema says never, and a field that
   becomes meaningful is a field somebody will be tempted to branch on. A test
   asserting no read of buildId outside serialization is cheap and permanent.

5. A smoke test against the deployed URL after each deploy, not against a local
   build. Load the page, run for a few seconds of game time, assert the
   pathway produced ATP, assert a save was written. Small, and it catches the
   class of failure that only appears once real hosting is involved: a broken
   asset path, a CSP violation, a caching mistake.

Verify: CI fails on an oversized bundle, needsSourceGate fires against the
deployed artifact, and the smoke test runs after deploy. Report the budget with
its three-way breakdown, the source map decision, a real buildId from a written
save, and the smoke test result against the live URL.
```

## Stage 4 Report

_Pending._

---

# Stage 5 — Coherence, CLAUDE.md and NOW.md

```
Close the log out, and correct the root instruction file.

1. CLAUDE.md. It says "Deployed to Cloudflare Pages" under Stack, as a
   statement of fact, and it has not been true at any point in the project's
   history. It is true now. Update it to say where, and add whatever a future
   agent needs to know before touching deployment: that the origin is
   permanent because localStorage is origin-scoped, and that hard rule 6's
   "after launch" now refers to a real event with a date.

   Keep it short. CLAUDE.md's own first line says to keep it short and that
   past roughly 100 lines it stops being read carefully. Check the line count
   after editing and if it is close, something else in the file has grown and
   should be moved rather than this addition trimmed to fit.

2. Confirm every guard runs in CI and every one has been proved to fail there.
   List them, with the stage of this log that proved each. Six were inherited
   and this log added the bundle budget and the cross-engine hash, so the count
   should be eight. If it is not eight, say which are missing and why.

3. Full verify, locally and in CI: `npm run typecheck`, `npm run lint`,
   `npm run build`, `npm test`, `npm run sim`, `npm run sim:act1`. Report the
   test count and bundle size against V8's figures. Confirm no canonical hash
   moved, because this log changed no simulation code and a moved hash would
   mean it did.

4. Update NOW.md:
   - Status: it is deployed, and where.
   - Build state table: V9 done, with the date.
   - A "What CI enforces" section, sibling to the others, listing all eight
     guards with what each protects and which hard rule or document it comes
     from. This is the most useful single table in the file for anyone joining,
     because it is the map of what the project refuses to let happen.
   - The cross-engine result, prominently, whichever way it went. If all four
     engines agreed, the determinism claim moves from argued to measured and
     that should be stated where the canonical hashes are stated. If one
     disagreed, it is Blocking and it is the most important entry on the list.
   - Blocking: the cross-engine finding if there was one, and anything stage 3
     or 4 surfaced.
   - "Open, not blocking": what the cross-engine measurement does not cover,
     per stage 2 step 5.
   - The freeze list from stage 3, as its own short section. What deploying
     made binding, with the date. This is the entry a future maintainer will
     need most and will look for least.
   - "Next, in order": this is no longer the last planned log and the entry
     that says so has to go. docs/designs/game-spine-and-four-acts.md carries a
     roadmap through V18 and V10 is act 1 completion, which is the log that
     closes blocking item 2. Point at the design doc rather than restating it,
     because a roadmap in two places drifts in one of them.

     One thing does still belong here rather than there, and it is the same
     standard NOW.md has applied since V3. The design doc schedules act 3 ahead
     of act 2 and the engineering review found a reason that may not survive:
     act 3's payoff needs oxygen as the terminal electron acceptor and act 2 is
     what supplies it. That decision is open, it does not block anything before
     V14, and NOW.md should carry it as open rather than let a roadmap entry
     imply it is settled.

5. The act 2 oxygen constraint, written into docs/SIMULATION.md. This is a
   documentation edit and it is the only thing in this log that a later log
   depends on.

   The problem it exists to prevent: Part 3 builds offline progress on the
   system reaching steady state, and act 2 raises oxygen on a schedule
   independent of the player. An environment that changes continuously never
   settles, so the detector never declares, so every absence in act 2 falls
   back to coarse replay. Blocking item 6 says what coarse replay does to a
   cell, which is destroy it. V5 already chose more unlocks over a varying
   environment for exactly this reason and said so at the time.

   Write the constraint rather than the solution: act 2's oxygen level moves in
   discrete steps with a settling interval between them long enough for the
   detector to declare, and the schedule is state rather than a function of
   wall-clock time. Give it the numbers it needs from the constants that exist:
   STEADY_WINDOW is 250 and a walled act 1 cell settles at 1120 against a
   SETTLE_MAX_TICKS of 1200, so the interval has a floor and the floor is
   measurable rather than guessed.

   Say plainly what is NOT decided here. The step size, the number of steps and
   the total duration are act 2's balance decisions and belong in
   docs/ECONOMY.md when act 2 has one. Hard rule 2 applies: this stage does not
   put a number in docs/SCIENCE.md.

   Also record what this constraint does not solve. Act 2's second damage
   mechanism degrades enzyme Vmax continuously, which is a separate reason the
   steady test may never pass, and quantising the environment does not touch
   it. Name it so act 2's log inherits it rather than discovers it.

6. Do not change the simulation, the economy, the content or the interface.
   This log is infrastructure and a diff touching src/sim/, src/content/ or the
   three tuning files is out of scope. docs/SIMULATION.md is a document rather
   than code and step 5 is the one exception, so report it separately.

Verify: everything above clean, locally and in CI. Report the CLAUDE.md diff
with its new line count, the eight-guard table, the test count, the bundle
size, unchanged canonical hashes, the docs/SIMULATION.md constraint as written,
the diff scope from step 6 and the NOW.md diff summary.
```

## Stage 5 Report

_Pending._

---

# After These Stages

- Six guards built across five logs, each proved to fire and each optional until now, run on every push. Two more join them. `docs/SIMULATION.md` Part 5 says "Run it in CI" and there is finally a CI to run it in.
- The cross-engine determinism claim is measured. Hard rule 5 has been the most confidently asserted and least tested thing in the project since V1, because the reason for it is a fact about the ECMAScript specification and nobody had checked what the engines actually do. Now somebody has.
- The game is deployed, it makes no network request at all, and a content security policy enforces that rather than a document asserting it. `docs/PILLARS.md` rule 7 is mechanism.
- Deploying converted several statements into obligations. `TICK_RATE_HZ` is frozen, the origin is permanent for the same reason the storage keys are, and schema version 1 is a released version whose fixture V4 committed specifically for this moment.
- Act 2's oxygen constraint is written down before act 2 exists, which is the only way a constraint constrains anything. It was supposed to land in V8 and did not, and the pattern this project keeps re-proving is that a foundation laid after the thing built on it is not a foundation.
- **This is no longer the last planned log and that is the largest change to the project's shape since V1.** `docs/designs/game-spine-and-four-acts.md` runs to V18: act 1 completion, two spine logs, an act jump, three more acts, teacher mode and an endgame. What this log does for that roadmap is make the guards run before the two biggest diffs in it, which is why it moved from last to fourth.
