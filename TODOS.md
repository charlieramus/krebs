# TODOS

Deferred work with enough context to be picked up cold. Opened 2026-08-05 by the CEO review that produced docs/designs/game-spine-and-four-acts.md.

Items here are deliberately deferred rather than forgotten. Everything scheduled into a log lives in that design doc and in NOW.md, not here.

## Interface

### Export the session event list alongside the save

**What:** Make the session's discrete-event list exportable next to the save file, so a cold read produces a comparable artefact rather than a memory.

**Why:** The reader gate puts a stranger in front of the game and the only thing currently taken away from that session is what the observer remembers. `src/ui/components/Announcer.tsx` already builds the complete event list, sixteen events across act 1, because the accessibility layer needed it. Exporting it is close to free and it is what turns one anecdote into a baseline the next reader can be measured against.

**Context:** NOW.md has carried "readers found: 0, readers asked: 0" for three logs. UPDATELOGV6.md stages 2 and 5 were designed as a cold-read baseline and a cold-read re-test and both went unrun, and NOW.md records that the comparison V6 was built around is permanently lost. A second cold read with nothing to compare it against repeats that loss. The event list plus the save also reconstructs a session for any bug report, which is the whole of this project's debugging channel given there is no backend. Start in `Announcer.tsx`, where the event set is already assembled, and in `src/save/` where export already exists.

**Effort:** S
**Priority:** P3
**Depends on:** Spine A. **The dependency and the schedule contradict each other and the contradiction is resolved in favour of the schedule.** This item wants to exist before the reader gate opens, and the reader gate is the first thing in the roadmap while Spine A is third. Both cannot be true. The gate is not moving, because it is the only unverifiable work on the critical path and delaying it for tooling is how it stops happening. **So the first cold read runs without the artefact and produces an observer's notes, exactly as V6's would have.** This item is wanted before the second read, which is the first one that has something to be compared against. Recorded rather than resolved silently, because the loss is real and it is the same loss NOW.md records as permanent.

## Infrastructure

### Post-deploy smoke check

**What:** An automated check that runs against the deployed artefact: the app loads, the simulation ticks, a save round-trips, no console errors.

**Why:** ~~UPDATELOGV9.md's stage list covers CI, cross-engine determinism, deployment and a CLAUDE.md correction, and has no stage that verifies the deployed thing.~~ **That sentence is wrong and the correction is worth more than the item.** UPDATELOGV9.md stage 4 step 5 is a smoke test against the deployed URL, and stage 3 step 5 verifies the live deployment across six checks including a network-panel confirmation that no request leaves the origin. This item was opened by a review that read the stage list rather than the stages. **Kept, downgraded, and reframed:** what V9 covers is one smoke test written as part of the deploy stage. What is still missing is that it runs once, after a deploy, rather than on a schedule, so a live regression from a cache expiry or a hosting change is invisible until somebody looks. All six build-failing guards still run before the bundle exists and none of them looks at the page on the domain between deploys.

**Context:** The first deploy is the highest-stakes single action in the project's history, because it makes several permanent statements binding at once: the origin (and therefore every save's identity), TICK_RATE_HZ under hard rule 6, and schema version 1 as a released version that every future version must migrate from. The specific failure class this catches is the one that passes every local check and breaks live: a bad base path, a self-hosted font that 404s, or a Content Security Policy blocking something the build did not know about. That last one is a real risk rather than a hypothetical, because V9 plans a maximally strict policy permitting zero network requests.

**Effort:** S
**Priority:** P2
**Depends on:** UPDATELOGV9.md stage 3.

## Accessibility

### The two unscheduled accessibility items

**What:** A `forced-colors` block that swaps the hard offset shadow for a second outline, and a `prefers-contrast: more` block that buys AAA for a user who asked for it.

**Why:** These are NOW.md blocking items 4 and 5 and they are the only two items on that page with no home in any log. The roadmap that produced this file schedules four acts, a timeline, a mascot and an endgame, and repairs nothing. Naming them here is what stops "not in scope for the spine work" from quietly becoming "never".

**Context:** Item 4 is a conflict rather than a defect and both sides are right. In `forced-colors: active` the page goes black ground with white outlines, and `box-shadow` is not forced, so DESIGN.md's `4px 4px 0` ink shadow is still painted onto black where it is invisible while the layout still reserves its offset. The paper cutout read collapses entirely and DESIGN.md calls that shadow load-bearing. The fix is a design decision rather than a repair, which is why V7 declined to take it inside an audit stage. Item 5 is an absence and it is the cheapest thing on that page: the query matches, the rendered page is identical, there is no `prefers-contrast` block anywhere in `src/index.css` and no component reads it. Every failing pair is already enumerated and the guard already computes them, and after V7 all of them clear AA anyway, so the only open question is whether AAA is worth a second palette. Two things worth keeping from V7's measurement: badge fills flatten to black on white so Sourced, Tuned and Contested become typographically identical and are told apart only by the word, and SVG `fill` set as a presentation attribute is not forced, so the blobs keep their colours and the redox axis keeps working. Start in `src/index.css` and in `src/ui/__tests__/accessibility.test.ts`, which already holds every pair either block would need to satisfy.

**Effort:** S for item 5, M for item 4 because it needs a design decision first.
**Priority:** P3. Neither blocks anything. Item 4 gets more expensive with every new surface, because the timeline and the beast both inherit the shadow.
**Depends on:** nothing. Item 4 wants a DESIGN.md decision, and Spine B already opens with a DESIGN.md stage, so it is cheapest to take there.

## Completed

_Nothing yet._
