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

## Decisions

- **CI runs everything, on every push, and the six guards are the point.** A guard that fires only when someone remembers to invoke it is documentation with a failure mode. Six of them accumulated over five logs, each carefully built and each currently optional. This log is what converts them.
- **Cross-engine determinism gets measured rather than argued.** Chromium, Firefox and WebKit, the same fixed seed and input script, `hashState` compared as an exact string. If all three agree with node, hard rule 5 is vindicated by measurement and the project can say so. If any disagrees, that is the most important finding this log could produce and it outranks everything else in it.
- **A divergence is reported, not fixed.** Finding one would mean something in the kernel produces engine-dependent floats, and locating and repairing that is a kernel change with its own conservation and determinism implications. This log's job is to find out. Fixing belongs to a log that can give it a whole stage list.
- **Deployment makes several "permanent once shipped" statements binding for the first time, and stage 4 says so out loud before pressing the button.** Hard rule 6 says never change `TICK_RATE_HZ` after launch, and until now there has been no launch, so the constant has been movable and the rule has been hypothetical. V4 declared the storage keys permanent. `SCHEMA_VERSION` 1 becomes a released version that every future version must migrate from, which is what makes the committed v1 fixture load-bearing rather than tidy. **Deploying is the act that converts all of those from statements into obligations.**
- **The origin is the other half of the save's identity and nobody has claimed one.** V4 fixed the storage keys as `krebs.save.active`, `krebs.save.backup` and `krebs.save.temp`, and recorded that renaming one orphans every save in existence with no error and no way back. `localStorage` is scoped to an origin, so the domain does exactly the same thing. Changing it later orphans every save just as completely and just as silently. The domain is therefore a permanent decision of the same kind and it gets made deliberately in stage 3, with the working title still being TBD as an input to it rather than a reason to defer.
- **A maximally strict CSP is achievable and is worth having as a statement.** `docs/PILLARS.md` rule 7 is offline-first, no account, no backend, no network dependency for core play, and V3 self-hosted the fonts specifically so first paint has no network dependency. The game makes zero network requests. A content security policy that permits none is therefore not a compromise, it is rule 7 written where a browser can enforce it, and any future change that adds a request will fail against it rather than sliding in.
- **The build artifact gets a size budget, checked in CI.** The bundle has gone from 193.37 kB at V2 to 251.29 kB at V4 and has grown in every log since. Nothing tracks it and nothing would notice a dependency that doubled it. A budget makes growth a decision.
- **`CLAUDE.md` gets corrected in the final stage.** It states the project is deployed to Cloudflare Pages as though it were a fact. Until stage 3 it is not one. Correcting a root instruction file is a deliberate act and it happens once, at the end, when it has become true.
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

_Pending._

---

# Stage 2 — Cross-engine determinism

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

_Pending._

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
   - "Next, in order": this is the last planned log. Say what act 2 would need
     before a V10 row could be written without being fiction, using NOW.md's
     own standard from line 30 rather than a new one. docs/PROGRESSION.md lists
     act 2's shape as an open question for the prototype and the prototype now
     exists, is balanced, is comprehensible, is accessible, persists, credits
     offline time and is deployed. State whether that is enough.

5. Do not change the simulation, the economy, the content or the interface.
   This log is infrastructure and a diff touching src/sim/, src/content/ or the
   three tuning files is out of scope. Report the diff scope as evidence.

Verify: everything above clean, locally and in CI. Report the CLAUDE.md diff
with its new line count, the eight-guard table, the test count, the bundle
size, unchanged canonical hashes, the diff scope from step 5 and the NOW.md
diff summary.
```

## Stage 5 Report

_Pending._

---

# After These Stages

- Six guards built across five logs, each proved to fire and each optional until now, run on every push. Two more join them. `docs/SIMULATION.md` Part 5 says "Run it in CI" and there is finally a CI to run it in.
- The cross-engine determinism claim is measured. Hard rule 5 has been the most confidently asserted and least tested thing in the project since V1, because the reason for it is a fact about the ECMAScript specification and nobody had checked what the engines actually do. Now somebody has.
- The game is deployed, it makes no network request at all, and a content security policy enforces that rather than a document asserting it. `docs/PILLARS.md` rule 7 is mechanism.
- Deploying converted several statements into obligations. `TICK_RATE_HZ` is frozen, the origin is permanent for the same reason the storage keys are, and schema version 1 is a released version whose fixture V4 committed specifically for this moment.
- This is the last planned log. Act 2 is the highest-risk beat in the game, `docs/PROGRESSION.md` lists its shape as an open question for the prototype, and the prototype now exists in full. Whether that licenses a V10 row is a decision `NOW.md` should make on its own terms, with the standard it has applied since V3: anything written before the answers are in is fiction.
