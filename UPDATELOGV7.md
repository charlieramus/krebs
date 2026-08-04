charlie

# krebs, V7: Accessibility, and the Colour-Alone Problem
# Work on one stage at a time. Do NOT combine stages.

---

## Context

Read `NOW.md` first, then `DESIGN.md`'s Colour, Illustration language and Motion sections. Then read `src/ui/components/Blob.tsx` and `src/ui/usePrefersReducedMotion.ts`.

`DESIGN.md` already contains one accessibility rule and it is a good one: because motion carries information, `prefers-reduced-motion` must not simply disable it, and **nothing in the game may be encoded in movement alone.** V3 honoured it. Reduced motion swaps flowing dashes for a static arrow plus an explicit numeric rate, and a stopped arrow dims in both modes because colour is not motion.

**The same rule was never written for colour, and colour is carrying more information than motion ever did.**

`DESIGN.md` says of the redox pair: "`reduced` and `oxidized` are deliberately the same shape at different saturation. When the redox pool drains, the player watches the NAD+ wall arrive as colour leaving before any number is read. **This is the single most important colour decision in the system.**" The two values are `#23BFA0` and `#A9BFB8`. Same silhouette by design, distinguished by saturation alone.

For a player with a colour vision deficiency, or a low-contrast display, or a projector at the back of a classroom, **the single most important colour decision in the system is invisible.** The NAD+ wall is act 1's entire teaching beat and V3's play session found that the carrier card announces it in colour three seconds before any number does.

This is not abstract compliance. `docs/PILLARS.md` success condition 1 is that a biology teacher uses it with a class. Around one in twelve boys in that class has a colour vision deficiency.

This log covers colour, contrast, keyboard, focus and screen readers. It does **not** change the economy, add content, change any tuned number or touch act 2. It inherits V6's text and its job is making that text and the illustration perceivable, which is why it follows V6 rather than preceding it.

## Decisions

- **The rule `DESIGN.md` already has gets extended rather than a new one invented.** "Nothing in the game may be encoded in movement alone" becomes "nothing in the game may be encoded in movement or colour alone". It is the same argument, it was already accepted for motion, and the reason it was not written for colour is that colour was decided first and never revisited. Stage 5 writes it into `DESIGN.md` as a rule with a decisions-log row.
- **The redox pair keeps its silhouette.** `DESIGN.md` is emphatic that NAD+ and NADH being the same shape is the point, because it is what makes the carrier read as one thing in two states rather than as two molecules. The fix adds a second channel, it does not split the shape. Whatever stage 2 chooses has to survive that constraint or it is not a fix, it is a redesign, and a redesign of the system's most important colour decision is not this log's to make.
- **Redundant encoding, not replacement.** Colour stays. Every player who can read it keeps reading it, and it keeps being the fast channel V3 measured at three seconds ahead of the numbers. The second channel is added alongside so that the information survives the loss of the first. Replacing colour with a pattern for everyone would make the game worse for the majority to serve a minority, which is the wrong trade and an avoidable one.
- **Measure with a tool, on the real screen, not by reasoning about hex values.** Contrast ratios get computed against the actual rendered pairs, and colour vision deficiency gets simulated against real screenshots at the three common types. `DESIGN.md`'s palette was chosen for a look and has never been checked for anything else.
- **The keyboard path has to exist before it can be good.** The grep across `src/ui/` finds `role`, `aria-label` and one `nav`, and finds no `tabIndex`, no `:focus`, no `focus-visible` and no keyboard handler. Buying an unlock and opening a coach mark are currently mouse-only, which means the game cannot be played at all without a pointer.
- **The screen reader problem is a real engineering problem and not a checklist item.** This is a simulation whose numbers change twenty times a second. A naive live region would produce continuous speech and be worse than silence. The architecture already solves the analogous problem for React, which re-renders only on discrete events while the display samples per frame, and the same distinction is the right one here: **announce events, expose rates on demand, never narrate the tick.**
- **`prefers-contrast` and forced-colors are in scope, `prefers-reduced-transparency` is not.** The design has no transparency to reduce. It does have a hard offset shadow and a 2.5px ink outline, which are the two things forced-colors mode will interact with, and the paper-cutout read depends on both.
- **The reduced-motion media query gets verified in a real browser.** `NOW.md` records that it never has been: the reduced path was verified by forcing the flag, `usePrefersReducedMotion` itself has never run against a real OS setting, and `Emulation.setEmulatedMedia` was not on the browse tool's allowlist. Small and ordinary is not the same as tested.
- **No tuned numbers if it can be helped.** V5's guard fails the build on a tuning constant with no divergence row. If a contrast threshold or an announcement interval turns out to be tuning, it goes in `src/ui/tuning.ts` with a row.
- Medium feature, front-loaded on measurement: five stages.

## What carries meaning, and on how many channels

Settled here so stage 1 audits against a list rather than a feeling. This is `DESIGN.md`'s own claim that every visual property carries simulation state, turned into a table and counted.

```
  Meaning                    Channels today              Survives colour loss

  redox state                colour saturation only      NO
  carbon count               polygon side count          yes, shape
  phosphate count            countable dots              yes, count
  ATP vs ADP vs Pi           dot count plus colour       yes, dots
  reaction running           dash motion plus colour     yes, motion, and
                                                           reduced motion adds
                                                           an explicit rate
  reaction stopped           static plus dimmed          partly. dimming is a
                                                           lightness change
  net rate sign              colour plus the sign        yes, the sign
  locked vs unlocked         dashed border plus dim      yes, the border
  badge kind                 colour plus the word        yes, the word
  substrate vs product       position                    yes
```

Ten meanings. Nine survive. **The one that does not is the one `DESIGN.md` calls the most important colour decision in the system, and it is the one act 1's teaching beat runs on.**

That is a better outcome than it sounds. The design's core discipline, that shape carries carbon and dots carry phosphate, did most of this work already and did it for free. There is one hole and it is a deep one.

---

# Stage 1 — Audit and measure

```
No fixes. Measure what is actually there, on a real screen, with real tools.

1. Contrast. Compute the ratio for every text-on-surface and outline-on-surface
   pair the game actually renders, not every theoretical pair in DESIGN.md.
   Report against WCAG 2.2 AA: 4.5:1 for body text, 3:1 for large text and for
   non-text elements that carry meaning.

   The pairs most likely to fail, and check these explicitly:
     - ink3 #9494AC, the disabled and locked colour, on white and on the pastel
       surfaces. DESIGN.md says locked content stays visible and dimmed rather
       than hidden, which is the right call for the genre and is also the
       specific pattern that fails contrast.
     - oxidized #A9BFB8 as a fill, and as an outline against page and cream.
     - the semantic colours as small text: atp, loss, gain on cream and pink.
     - micro type at 9.5 to 10.5px in any non-ink colour.

   Report a table. Do not fix anything yet and do not adjust a colour to pass,
   because DESIGN.md owns the palette and stage 5 is where it gets edited.

2. Colour vision deficiency. Take real screenshots of the act screen at three
   moments that matter: the pathway running, the moment of the NAD+ stall, and
   immediately after fermentation is bought. Simulate deuteranopia, protanopia
   and tritanopia on each.

   Then answer one question per image, plainly: can you tell what state the
   carrier is in. Report the images described and the answer. Deuteranopia is
   the common one and it is the one the reduced-to-oxidized axis is most likely
   to collapse under, because both values sit in the same green-to-teal region.

3. Keyboard. Try to play the game with the pointer unplugged. Report exactly
   where it becomes impossible. Expected findings, and confirm or refute each:
   no focus indicator anywhere, unlock buttons unreachable, the coach mark
   info affordance unreachable, the save panel unreachable, and no skip link
   past the pool rail into the pathway.

4. Screen reader. Run one, on the real page, and report what it actually says.
   Note what the Blob role="img" and aria-label produce, whether the PoolRail
   nav and UnlockShelf section landmarks help, and what a user hears when a
   rate changes. Expect the answer to the last one to be "nothing", because
   nothing is wired to announce.

5. prefers-reduced-motion, in a real browser, through a real OS setting rather
   than a forced flag. NOW.md records this has never been done and names the
   reason. Report what happened. This closes an open item either way: it works
   and the entry closes, or it does not and it becomes a defect with a known
   cause.

6. prefers-contrast and forced-colors. Report what the page does in each. The
   hard offset shadow and the 2.5px ink outline are the two things most likely
   to be affected, and DESIGN.md says the shadow is load-bearing and that a
   blurred one collapses the system into generic soft UI. Forced-colors will
   flatten it entirely. Report what it looks like, do not fix it yet.

Verify: no source changed. Report the contrast table, the three CVD
simulations with a plain yes or no per image on the carrier state, the exact
point keyboard play becomes impossible, what the screen reader said, the
reduced-motion result, and the forced-colors result.
```

## Stage 1 Report

_Pending._

---

# Stage 2 — Redox on a second channel

```
The hole from the table. Read the constraint in this log's Decisions before
starting: the silhouette does not change and colour does not go away.

1. The information to carry is one continuous quantity, the reduced fraction of
   the nicotinamide pool, from fully oxidised to fully reduced. V3 already
   encodes exactly that and NOW.md records why: it is monotonic and it reads
   well. So this is not a new signal, it is a second channel for a signal that
   already exists and is already correct.

   Note the related finding NOW.md records, because it matters here: DESIGN.md's
   sentence about the wall arriving as "colour leaving" is backwards as written,
   since oxidized is the desaturated end, so as NAD+ drains colour actually
   arrives. Whatever channel you add, describe it correctly rather than
   inheriting the wrong sentence.

2. Candidates. Pick from evidence, not from this list, and stage 1's CVD
   simulations are the evidence.

   a. Texture or fill pattern varying with the reduced fraction. Hatching,
      stipple density, a fill level. It reads without colour and it survives
      greyscale printing, which matters for the classroom case.
   b. The electron dots. Blob.tsx already draws electron dots at data-role
      "electron" and DESIGN.md's illustration rule 3 says NADH carries two and
      NAD+ is empty. A countable dot is exactly the channel that already works
      for phosphate, which is the one meaning in the table that survives most
      cleanly. Making the electron dots do for redox what the phosphate dots
      already do for phosphate is the answer most consistent with the design.
   c. Fill level as a literal proportion of the blob, so the carrier card reads
      as a gauge.

   (b) is the strongest starting point because it reuses a device already
   proven in the same component and needs no new visual vocabulary. Say why you
   chose what you chose.

3. Whatever it is, it is derived from state, not authored. Blob.tsx has no path
   data in it and takes carbon and phosphate weights out of
   src/content/act1/pools.ts, which is why V3's illustration test can assert
   geometry as a property over the pool table. The redox channel obeys the same
   rule: it reads the reduced fraction and draws itself, and the test asserts
   it over the range rather than at two hand-picked points.

4. Then check the rest of the table. Two entries were marked "partly" or
   depend on a lightness change rather than a hue change:
     - a stopped reaction dims. Dimming is a lightness difference, which mostly
       survives CVD but does not survive a low-contrast display. Stage 1
       measured it. If it failed, the stopped state needs a second channel too,
       and the reduced-motion path already has one in the explicit numeric
       rate, so consider making that permanent rather than motion-conditional.
     - net rate sign carries colour plus a sign character. Confirm the sign is
       actually rendered and not implied by colour on a number whose minus is
       suppressed.

5. Re-run stage 1's CVD simulations on the same three moments and answer the
   same question. Can you tell what state the carrier is in. If the answer is
   still no, the channel does not work and reporting that is the correct
   outcome.

Verify: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`,
`npm run dev`. Report the channel you chose and why the others lost, the
property test that asserts it across the range, the re-run CVD simulations with
a plain yes or no per image, and confirm the silhouette is unchanged and colour
still does what it did.
```

## Stage 2 Report

_Pending._

---

# Stage 3 — Keyboard and focus

```
Currently the game cannot be played without a pointer. This stage makes it
playable and then makes it good.

1. Every interactive thing is reachable and operable by keyboard. The list is
   short because the game is small: the unlock buttons, the coach mark info
   affordance, the coach mark itself and its action, the teaching panel V6
   built, the save panel and its export and import, and whatever V6's first run
   added.

   Use real semantics rather than handlers on a div. Button.tsx exists and
   should already be a real button; check rather than assume, and if it is not,
   that is the first fix.

2. A visible focus indicator that survives this design. The system is 2.5px ink
   outlines and a 4px hard offset shadow with no blur, so a default browser
   focus ring will either disappear against the outline or look like a mistake.

   Design one that reads as deliberate in the Honest Cartoon vocabulary and
   meets the 3:1 non-text contrast requirement against every surface it can
   appear on. Use :focus-visible so a pointer user never sees it. This is a
   visual decision, so it gets a DESIGN.md entry in stage 5.

3. Focus management, which is where keyboard support usually fails:
     - opening a coach mark or the teaching panel moves focus into it
     - Escape closes it and returns focus to the thing that opened it
     - focus is trapped inside a modal overlay while it is open
     - buying an unlock does not lose focus into the void when the button it
       was on disappears or changes state

   That last one is specific and worth calling out. UnlockShelf slots change
   when bought, and DESIGN.md says locked content stays visible and dimmed
   rather than hidden, which helps, but a slot that becomes non-interactive
   still drops focus.

4. Tab order follows the reading order of the layout: top bar, pool rail,
   pathway, unlock shelf. It should not follow DOM accident. Report the order
   you get and whether it needed fixing.

5. A skip link past the pool rail. There are eight pool cards and a keyboard
   user should not have to traverse all of them to reach the unlock shelf,
   which is the only place anything can be done.

6. Test what you can. Focus management and tab order are testable in the
   suite. A real keyboard run is not, so do one by hand and report it, the same
   way stage 1 did.

Verify: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`,
`npm run dev` played end to end with the pointer unplugged. Report the tab
order, the focus indicator with its measured contrast on every surface, the
four focus-management behaviours each confirmed, and a plain statement that the
whole of act 1 is completable by keyboard.
```

## Stage 3 Report

_Pending._

---

# Stage 4 — The screen reader problem

```
The interesting one. This is a simulation whose numbers change twenty times a
second and a naive live region would produce continuous speech.

1. The rule, and it comes straight from the architecture NOW.md already
   describes as three clocks: announce events, expose rates on demand, never
   narrate the tick.

   React already re-renders only on discrete events while the display samples
   per frame. That distinction is exactly the right one for announcements and
   it is already computed. An unlock becoming affordable, the pathway stalling,
   fermentation recovering, an unlock being bought: those are events, they are
   already detected, and they are what a screen reader user needs to hear. The
   flux going from 7.601 to 7.602 is not.

2. Live regions, used sparingly and politely. aria-live="polite" on one region
   that announces events. Not on anything that updates per frame. Report how
   many announcements a full act 1 run produces, because that number is the
   test of whether the rule was followed, and if it is in the hundreds then it
   was not.

3. Rates on demand. A screen reader user needs to be able to ask "what is
   happening right now" and get the same reading a sighted player gets from
   watching the arrows. Every rate already exists on the snapshot. Expose it as
   readable text, reachable by keyboard, updating only when read rather than
   continuously.

   The reduced-motion path is a useful precedent here and possibly the same
   solution: DESIGN.md already requires a static arrow plus an explicit numeric
   rate when motion is off, which is a textual statement of every flux in the
   game and it already exists. Consider whether the accessible reading is that
   same content rather than a parallel one, because a parallel one will drift.

4. Meaningful labels on the illustration. Blob.tsx already sets role="img" and
   an aria-label. Stage 1 reported what those labels currently say. They should
   describe state rather than identity: not "NAD+" but what fraction of the
   carrier is reduced, since that is the information the picture is carrying
   and a label naming the molecule tells a screen reader user nothing they
   could not get from the text label beside it.

5. Landmarks and headings. PoolRail has a nav and UnlockShelf has a section,
   both labelled. Check the page has a coherent heading structure and that a
   user can navigate by landmark to the four regions of the layout.

6. Run a real screen reader again, end to end, and report what a full act 1
   sounds like. Compare against stage 1's recording of what it sounded like
   before. The deliverable of this stage is that comparison.

Verify: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`,
`npm run dev` with a real screen reader. Report the announcement count for a
full act 1 run, the before and after of what the reader says, the label
decision from step 4, and confirm nothing announces per tick.
```

## Stage 4 Report

_Pending._

---

# Stage 5 — Coherence, DESIGN.md and NOW.md

```
Close the log out, and write the rule that should have existed from the start.

1. Extend DESIGN.md's accessibility obligation. It currently reads, under
   Motion: "Because motion carries information, prefers-reduced-motion must not
   simply disable it... Nothing in the game may be encoded in movement alone."

   Promote it out of Motion into its own section and widen it: nothing in the
   game may be encoded in movement or colour alone. Give it the same reasoning
   the motion rule has, which is that the property carries simulation state and
   a player who cannot perceive the property cannot read the state. Add a
   decisions-log row dated today, with the stage 1 CVD result as the rationale
   rather than an argument.

   Then apply it as a check on the existing palette. This is the stage where
   DESIGN.md's colour section may need to change, and it is the only stage
   allowed to change it. If stage 1's contrast table found failures, fix them
   here, in DESIGN.md first and then in src/index.css, and note that V3's
   colour test parses DESIGN.md and fails the build if the two disagree, so the
   document is genuinely the source and this is not a formality.

2. Make the new rule mechanism where it can be. Some of it is testable: that
   every meaning in this log's channel table has a second channel, asserted
   over the same pool table the illustration test already walks. Contrast is
   computable from the tokens and a test can assert every rendered pair clears
   its threshold, which would make a future palette change fail the build
   rather than fail a user. Voice, taste and "does it read" are not testable
   and should not be faked.

   Make the call, apply the half that is real, prove it fires with a probe,
   quote the failure, remove the probe. This is the fifth guard in the project
   after the determinism lint, the Needs source gate, the colour test and the
   divergence-row test, and it should look like them.

3. Coherence pass over src/ui/. Every interactive element has an accessible
   name, every image has a label describing state, every focus target has a
   visible indicator, and nothing announces per tick. Fix what you find.

4. Full verify: `npm run typecheck`, `npm run lint`, `npm run build`,
   `npm test`. Report the test count and bundle size against V6's figures.
   Confirm no tuned number moved and the act 1 canonical hash is unchanged,
   because an accessibility log that moved the simulation hash has changed the
   simulation.

5. Update NOW.md:
   - Status: what the game is now perceivable as, and by whom.
   - Build state table: V7 done, with the date.
   - A "What the accessibility layer does" section, sibling to the others.
   - Close the open item recording that the reduced-motion media query has
     never run in a browser, with the stage 1 result.
   - Close or rewrite the open item about DESIGN.md's "colour leaving" sentence
     being backwards, since stage 2 had to describe the axis correctly to build
     a channel for it.
   - Blocking: anything stage 1 found that stages 2 to 4 did not fix. Forced
     colors flattening the paper-cutout read is a plausible one and it is a
     real conflict between a design decision and a user setting, so record it
     as a conflict rather than as a bug.
   - "Next, in order": offline progress, then CI. Say that both are independent
     of this log and that CI could be pulled forward at any point, because it
     is the one remaining log with no dependencies.

6. Do not change the economy, the content or the simulation. If an
   accessibility fix needs a tuned number, it goes in src/ui/tuning.ts with a
   docs/ECONOMY.md row and V5's guard will enforce that before review does.

Verify: everything above clean. Report the DESIGN.md rule as written, the
decisions-log row, the step 2 guard with its probe output, the test count, the
bundle size, the unchanged canonical hash and the NOW.md and DESIGN.md diff
summaries.
```

## Stage 5 Report

_Pending._

---

# After These Stages

- `DESIGN.md` has an accessibility rule that covers colour as well as motion, which is the rule it should have had when it decided that redox would be carried by saturation. The decision was right and it was incomplete, and the incompleteness was invisible until somebody simulated it.
- The NAD+ wall, which is act 1's whole teaching beat and the strongest thing in the build, is now readable without colour. `docs/PILLARS.md` success condition 1 involves a classroom, and a classroom contains readers this game could not previously reach.
- Act 1 is completable without a pointer and audible through a screen reader without narrating the tick, which is a real engineering result rather than a checklist item and it fell out of the three-clocks architecture the interface already had.
- Deliberately not done: the economy, the content, the simulation, the timeline, the beast and act 2. Nothing in this log moved the canonical hash.
- Two logs remain and neither depends on the other: offline progress, which `docs/SIMULATION.md` Part 3 has specified since before any code existed, and CI, which is the only thing standing between five build-failing guards and nobody running them.
