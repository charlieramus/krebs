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

**No source changed. `git status` is clean across the whole stage.** Everything below was measured against the running build at `npm run dev`, in a real Chrome 150 on Windows 11, with the numbers computed from the shipped tokens rather than read off a swatch. The scripts live in the session scratchpad and are deliberately not committed: they are measurement, not code the game needs.

**The headline, and it is not the one this log's Context predicted.** The colour-alone problem is real and it is worse than the Context said, because the axis does not merely become hard under deuteranopia, **it collapses under protanopia to a 7.6 dE lightness ramp with the two states a mid-game player has to tell apart sitting 3.2 apart.** But the keyboard finding goes the other way: this log's Decisions section says "the game cannot be played at all without a pointer" and **that is wrong.** Every control is a real `<button>`, every one is reachable, and act 1 is completable from the keyboard today. What is broken is narrower, sharper and still disqualifying. See step 3.

---

### 1. Contrast

61 rendered pairs, WCAG 2.2 AA. 4.5:1 for body and micro text, 3:1 for text at 24px or above and for non-text that carries meaning. Pairs were enumerated from the components rather than from DESIGN.md's cross product, so a colour that exists in the palette but never lands on a given surface has no row.

**Everything ink and ink2 passes, everywhere, with room.**

      ratio  need  pass  pair
      -----  ----  ----  ----
      14.26   4.5  PASS  ink on page
      16.91   4.5  PASS  ink on cream
      14.19   4.5  PASS  ink on pink
      15.20   4.5  PASS  ink on mint
      14.89   4.5  PASS  ink on sky
      14.25   4.5  PASS  ink on lilac
      17.67   4.5  PASS  ink on white
       5.35   4.5  PASS  ink2 on page
       6.34   4.5  PASS  ink2 on cream
       5.32   4.5  PASS  ink2 on pink
       5.70   4.5  PASS  ink2 on mint
       5.59   4.5  PASS  ink2 on sky
       6.63   4.5  PASS  ink2 on white

The single near-black ink is doing real work here. A design that had reached for a lighter body colour would have failed the most common pair on the screen, and this one does not fail it anywhere.

**ink3 fails everywhere it is rendered, and the dimming compounds it.**

      ratio  need  pass  pair
      -----  ----  ----  ----
       2.96   4.5  FAIL  ink3 on white          disabled button label
       2.55   4.5  FAIL  ink3 on mint           disabled button on a bought slot
       1.65   4.5  FAIL  ink3, card at opacity 0.55 over page   LOCKED SLOT
       3.86   4.5  FAIL  ink on white, card at opacity 0.55      locked slot title
       2.36   4.5  FAIL  ink2 on white, card at opacity 0.55     locked slot detail

This is the failure this log's step 1 predicted by name and it is the one that is hardest to fix, because DESIGN.md's "locked content stays visible and dimmed rather than hidden" is a genre decision and a good one. The compounding is the part worth stating: a locked slot is `opacity-55` on the whole `Card`, and the disabled `Button` inside it is already `ink3`, so the two multiply and the label lands at **1.65:1**, which is under the 3:1 floor that applies to a decorative border, let alone to text. Two of the three unlock slots are in that state for most of act 1.

**The semantic colours as text. Six of eight fail.**

      ratio  need  pass  pair
      -----  ----  ----  ----
       2.00   3.0  FAIL  atp on page          ATP/s headline
       2.05   3.0  FAIL  substrate on page    glucose/s headline
       2.28   3.0  FAIL  gain on sky          net rate rising
       2.17   3.0  FAIL  gain on pink         net rate rising
       3.14   3.0  PASS  loss on sky          net rate falling
       2.99   3.0  FAIL  loss on pink         net rate falling
       5.59   3.0  PASS  ink2 on sky          net rate flat
       5.32   3.0  PASS  ink2 on pink         net rate flat
       2.70   4.5  FAIL  gain on white        threshold reached, micro
       2.32   4.5  FAIL  gain on mint         threshold reached, micro

`loss on pink` at 2.99 against a 3.0 threshold is a fail by four thousandths and is reported as a fail rather than rounded, because rounding a compliance number in the direction you want is the failure mode this project exists to avoid. The two top bar headlines are the biggest type on the screen and they are the worst two ratios in the set.

**The badge pills all pass**, because the badge word is ink on a saturated fill rather than saturated text on a pale one: 6.54 on gain, 7.13 on atp, 14.25 on lilac, 12.96 on the development yellow. The badge contract was designed around a word and it is the part of the semantic palette that survives.

**Non-text. The distinction that matters is between a shape's boundary and a shape's state, and only one of them is in trouble.**

Every blob is enclosed in a 2.5px ink outline, so "is there a shape here" is carried at 14:1 or better on every surface and no blob is at risk of disappearing. Reporting fill-against-surface as a WCAG 1.4.11 failure would be wrong: the outline is the identifying boundary. What 1.4.11 actually governs here is **state**, and state is fill against fill:

      ratio  need  pass  pair
      -----  ----  ----  ----
      14.26   3.0  PASS  ink outline against page          the card edge
      16.91   3.0  PASS  ink track on cream                a running arrow's track
       5.97   3.0  PASS  ink vs ink3                       running vs stopped track
       2.83   3.0  FAIL  ink3 arrow on cream               the STOPPED reaction
       1.20   3.0  FAIL  oxidized vs reduced               THE REDOX AXIS, END TO END

**1.20:1 is the number this log exists for.** The two ends of the axis DESIGN.md calls the single most important colour decision in the system are `#A9BFB8` and `#23BFA0`, whose relative luminances differ by less than a fifth. They are the same lightness by construction, which is what makes the transition read as saturation rather than as fading, and it is also what leaves nothing behind when the hue goes.

The stopped arrow at 2.83 is a near miss and it is mitigated in a way the number does not see: a stopped arrow is 2px where a running one is 6px, solid where the other is dashed, and hollow-headed where the other is filled. Four channels, one of which is colour. **That row is a warning, not a defect**, and it is recorded so stage 2 step 4 does not spend effort on a state that is already redundantly encoded.

---

### 2. Colour vision deficiency

Three moments, captured from the running game, with the carrier's reduced fraction read off the card at the instant of capture rather than assumed:

    moment                         NAD+    NADH   reduced fraction
    pathway running                26.85    3.15  0.105
    just after fermentation        13.24   16.76  0.559
    the NAD+ stall                  0.00   30.00  1.000

Simulated with the Machado, Oliveira and Fernandes 2009 matrices at severity 1.0, which are the matrices Chromium's own vision deficiency emulation uses, applied to the captured pixels through an `feColorMatrix` in sRGB. `Emulation.setEmulatedVisionDeficiency` is not on the browse tool's CDP allowlist, which is the same reason NOW.md records for `setEmulatedMedia`, so the transform was applied to the real screenshots instead of to the live page. That is the more reproducible of the two and the images are the record.

**The answer to the one question per image, plainly.**

    deficiency      running   just after ferment   the stall     can the state be read
    normal          pale      mid teal             vivid teal    YES
    deuteranopia    grey      grey blue            slate blue    NO
    protanopia      grey      warm grey            khaki grey    NO
    tritanopia      pale teal teal                 vivid cyan    YES

**Tritanopia is fine and should be said first.** The axis is a red channel difference with green and blue held nearly constant, so a blue to yellow deficiency leaves it almost untouched: 35.47 dE end to end against 37.50 for normal vision. The design got that for free and it did not know it.

**Deuteranopia and protanopia are where it fails, and the two fail differently.**

    deficiency      full axis dE   0.105 vs 0.559   0.559 vs 1.000
    normal                 37.50            19.67            12.78
    deuteranopia           17.35             8.09             7.63
    protanopia              7.64             3.21             3.52
    tritanopia             35.47            20.91             8.79

Protanopia is the severe one and its number is unambiguous: **7.64 dE across the entire axis**, and 3.21 between the two states a player actually moves between during play, against a just-noticeable difference of 2.3. That is not a degraded signal, it is a signal indistinguishable from noise.

**Deuteranopia's 17.35 needs a caveat that makes it worse than it sounds, not better.** That number is a CIE76 distance and it is almost entirely lightness: the three states go `#b4b4b6`, `#a0a3ad`, `#8d92a3`, three greys getting darker. Side by side, as they are on the comparison sheet, a difference of 17 is visible. **The player never sees them side by side.** They see one card, and they are being asked to notice that a grey has got slightly darker than the grey it was three seconds ago, on a pink card, from across a classroom. The dE overstates what is available, because it measures a spatial comparison and the game is asking for a temporal one.

**One finding that belongs to stage 2 rather than to this stage, and it should be read before stage 2 picks a channel.** The electron dots already exist and they are already the wrong shape for the job. `Blob.tsx` draws two of them at `data-role="electron"` and `PoolCard.tsx` drives the group's `opacity` from the reduced fraction. So at 1.000 both dots are at full opacity, at 0.105 both are at ten percent, and **the count never changes, only the fade.** Photographed at 3x in the stalled state, the two dots are `--color-ink` sitting directly on a 3.25px `--color-ink` outline at the upper right, where they read as a lump in the outline rather than as two countable particles. DESIGN.md rule 3 says NADH carries two and NAD+ is empty. What ships is one silhouette whose dots dissolve. **The channel candidate stage 2 calls strongest is half built and the half that is built is the half that does not work.**

**Two other colour-carried distinctions were checked the same way and both survive**, so stage 2 does not need to widen its scope. Net rate rising versus falling drops from 108.6 dE to 26.8 under deuteranopia and 24.4 under protanopia, and it carries a `+` or `-` character anyway. A substrate blob against an ATP blob stays above 85 dE under every deficiency.

---

### 3. Keyboard

**This log's Decisions section is refuted on its central claim and the refutation is worth more than the confirmation would have been.** The claim is that "buying an unlock and opening a coach mark are currently mouse-only, which means the game cannot be played at all without a pointer". The grep that produced it looked for `tabIndex` and keyboard handlers and found none, and concluded there was no keyboard path. There is one, and the reason the grep missed it is the reason it works: **every control is a native `<button>`, so it needs no `tabIndex` and no handler to be operable.** `Button.tsx` renders a real button with `type="button"`, and so does `InfoAffordance`. V3 got this right without writing it down.

**The full tab order on a fresh act 1, measured by dispatching real Tab keys and reading `document.activeElement`.** Seven stops:

    1  button  "About"                        top bar
    2  button  "6 carbons, split in two"      pool rail, g3p card
    3  button  "NAD+ has run out"             pool rail, carrier card
    4  button  "ATP does not pile up"         pool rail, adenylate card
    5  button  "About the yield"              unlock shelf, ferment slot
    6  button  "Express it"                   unlock shelf, buy
    7  button  "Export to file"               save panel

**It follows the reading order of the layout and it needed no fixing.** Top bar, then rail, then shelf, then save panel, in DOM order, which here is also visual order. The two disabled shelf buttons are correctly skipped.

**The skip link this stage's step 5 asks for is not needed and should not be built.** The expectation was that a keyboard user would have to traverse eight pool cards. They traverse **three**, because a pool card is not focusable and only three of the eight carry an info affordance. A skip link over three stops is more furniture than it saves. Recorded so stage 3 does not build it out of obedience.

**Four real defects, in descending order of severity.**

**(a) Buying an unlock drops focus to the document body.** Measured, reproducibly. Focus "Express it", press Space, and the button becomes `disabled` with its label changed to "Running", which makes it no longer focusable, and the browser has nowhere to put focus so it goes to `body`. The next Tab does not resume where the player was. It resumes at "Export to file", **past the entire unlock shelf**, because tabbing from `body` restarts from the top of the document and the first six stops are behind the current scroll position in DOM order. A player who buys act 1's central unlock by keyboard is silently thrown to the end of the page and has to work out where they went. This is the exact failure step 3 of stage 3 calls out by name and it is confirmed rather than predicted.

**(b) Import from file is not reachable by keyboard at all.** `SavePanel.tsx` wraps `<input type="file">` in a styled `<label>` and gives the input `className="hidden"`, which is `display: none`, which makes it unfocusable. The label is not focusable either. It appears in the accessibility tree as `[LabelText]` with no role and no focusable property, and it is absent from the tab order between stop 7 and the wrap. The comment above it says "the native control is the accessible one", and the native control has been display-none since V4. **Export works, import does not, and the asymmetry is invisible from the code.**

**(c) The first run card is the last thing in the tab order.** `aria-modal` is correctly `false`, because the card is undimmed and deliberately non-blocking, and that decision holds. But nothing moves focus into it and it sits after all seven act screen stops in DOM order, so a keyboard player's first launch is: seven controls they have no context for, then the card explaining what the game is, then the wrap. It is reachable and it is in the wrong place.

**(d) There is a focus indicator and it is the browser default, which this design erases.** Every focused control reports `outline-style: auto`, `outline-width: 1px`, `outline-color: rgb(16, 16, 16)`. Chrome draws that ring immediately outside the element's own border, and every element's own border here is 2.5px of `#16162E`. Photographed at 2x with "Express it" focused, the ring is a hairline of near black against 2.5px of near black. It is present and it is not perceivable. Measured against the surfaces it appears on it is nominally above 3:1 in every case, which is exactly why a ratio alone is not the test: **it fails against the adjacent colour that matters, which is the border it is drawn on top of, at 1.02:1.**

**Act 1 is completable by keyboard today.** Dismiss the first run, tab to "Express it", press Space, and ATP per second went 0.00 to 42.22. It is completable and it is not usable, which is a different sentence and a smaller repair than stage 3 was scoped for.

---

### 4. Screen reader

**No screen reader was run and this is reported as unrun rather than substituted for.** NVDA is not installed on this machine and neither is JAWS. Narrator is present, as it is on every Windows install, and it exposes no interface for capturing what it said, so an agent driving it would be reporting its own reading of the page and calling it a reading of the page. That is the same substitution UPDATELOGV6.md stages 2 and 5 refused to make and it is refused here for the same reason.

**What was done instead, and what it is worth.** Chrome's own computed accessibility tree was dumped over CDP with `Accessibility.getFullAXTree`, on the real page, at three states. That tree is the thing a screen reader consumes: it is what Chrome hands to the platform accessibility API, so a defect visible in it is a defect a screen reader will have. What it cannot tell you is how the result sounds, how long it takes, or whether it is bearable. Every finding below is of the first kind. **Step 6 of stage 4 asks for a before and after comparison of what a full act 1 sounds like, and on this machine that stage will have to report the same limitation or the reader will have to be installed.**

**Landmarks. Three, and the middle of the screen is not one of them.**

    [main]
      [sectionheader]                 the top bar. NOT a banner landmark
      [navigation]  "Pools"           the left rail
      ...the pathway card, bare, no landmark and no heading...
      [region]      "Unlocks"         the shelf
      ...the save panel, an h2 but no landmark...

The top bar is a `<header>` inside `<main>`, and a `<header>` that descends from `<main>` does not get the `banner` role. It comes out as `sectionheader`, which is not a landmark, so the three headline figures cannot be reached by landmark navigation. **The pathway card is the centre of the screen, it is the thing the game is about, and it has neither a landmark nor a heading**, so a user navigating by structure goes from "Pools" straight to "Unlocks" and the pathway is only reachable by reading linearly through it.

**Headings. Three, well formed, and one is missing.** `h1 "krebs"`, `h2 "UNLOCKS"`, `h2 "SAVE"`. No skipped levels. The pathway has no heading, consistent with having no landmark.

**Live regions. Zero.** `grep` for `live=` over the whole tree returns nothing. **The answer to "what does a user hear when a rate changes" is nothing, as expected.** More usefully, the answer to "what does a user hear when the NAD+ wall arrives" is also nothing, and the wall is an event rather than a rate. So is a coach mark opening, and so is an unlock becoming affordable. Stage 4's rule of announcing events and never narrating the tick has three real events waiting for it in act 1 and currently announces none of them.

**The blob labels, which stage 4 step 4 asks about specifically.** There are 18 labelled images and every one has a name, so nothing is unlabelled. What they say is the problem, and they say three different kinds of thing:

    pool rail, carbon pools    "Glucose (environment). 6 sides, 6 carbons"
    pool rail, the carrier     "NAD+ and NADH. One shape, and the colour is
                                which one it is. Full colour means NADH,
                                carrying electrons."
    pathway card, every node   "Glucose (environment)"

The rail labels describe **geometry**, which is honest and useful, and they are V6's contribution. The carrier label describes **the encoding** and never the state: it tells a screen reader user that the colour means something and does not tell them what the colour currently is. **On the one card in the game where colour is the whole signal, the accessible name explains the legend and withholds the reading.** And the pathway blobs describe **identity** only, so the same molecule announces two different ways depending on which half of the screen it is on.

**Every figure on the screen is an unlabelled StaticText.** A pool card reads out as: `"Glucose"`, `"SOURCED"`, image, `"+7.95"`, `"/s"`, `"GLUCOSE"`, `"944.72"`. Two numbers, no statement of which is a rate and which is a stock, and the flux-is-the-headline decision that carries that distinction in type size carries nothing at all here. The badge word is read as a bare `"SOURCED"` floating between them.

**The coach mark is not a dialog.** When it fires on the wall it renders inline inside the pool rail as ordinary content: static text, two paragraphs, two buttons. Nothing announces it, nothing moves focus to it, and its own heading is not a heading. A screen reader user gets no signal that the most important teaching beat in act 1 just happened. The About and teaching panels do carry `role="dialog"` and `aria-modal="true"`, so those two are correctly typed.

**And `aria-modal="true"` on those two is currently a lie, which is worse than omitting it.** Measured with the About panel open: focus is still on `body`, it was never moved in, and all nine buttons behind the panel are still focusable. So assistive technology is told the background is inert and hides it, while the keyboard walks straight into it and lands on controls the screen reader is no longer reading. Escape does close the panel, which `Overlay.tsx` wires and which works, and focus is not returned anywhere because it was never taken.

---

### 5. prefers-reduced-motion

**Split result. The app's half passes outright. The OS half is established one way and could not be established the other, and the reason is Windows rather than the code.**

**What was established.** A headed Chrome 150 was launched against the real machine, with no forced flags, and asked what it thought. It reported `prefers-reduced-motion: reduce` as **false**. Independently, `SystemParametersInfo(SPI_GETCLIENTAREAANIMATION)` reports animations **on**. The two agree, and the browser was verified to be genuinely headed rather than headless from its user agent. So the OS to browser link is live and the query is being evaluated against the real setting rather than stubbed. That is more than NOW.md has today, and it is only half of what the entry asks.

**What could not be established, and what was tried.** The other half needs the setting flipped. `SPI_SETCLIENTAREAANIMATION` returns success on this Windows 11 build and changes nothing, which is a known no-op. The setting's real home is bit `0x02` of byte 2 of `HKCU\Control Panel\Desktop\UserPreferencesMask`. That byte was read as `0x07`, cleared to `0x05`, and `WM_SETTINGCHANGE` was broadcast the way the Settings app does it. The registry took the write and **the running session kept reporting animations on**, because `SPI_GETCLIENTAREAANIMATION` is cached per session and Chrome reads the cache. Confirming it would need a sign out, which is not something to do to somebody's machine to close an audit item. **The original mask was restored byte for byte and verified as `9E 1E 07 80 12 00 00 00`, identical to what was read.** Nothing was left changed.

**The app's half was then closed properly and it passes.** Chrome was relaunched with `--force-prefers-reduced-motion`, which sets the media feature at the platform layer rather than faking `matchMedia`, so the CSS `@media` block and `usePrefersReducedMotion` both see the genuine article. Measured on the running act screen:

    matchMedia('(prefers-reduced-motion: reduce)')    true
    animated dash lines rendered                      0
    reactions showing an explicit numeric rate        5 of 5

Photographed at 2x, and it is the best thing in this audit. A running reaction is a solid dark track with a filled arrowhead reading `7.95 /s`. A stopped one is a thin grey hairline with a hollow arrowhead reading `0.00 /s`. Both the state and the rate arrive, through two channels, with no motion at all. **DESIGN.md's accessibility obligation is discharged in full and it is the only part of this audit that needs nothing.**

**What NOW.md's open item can honestly be changed to.** Not "closed". The entry says the media query has never run in a browser, and it has now: in a real headed Chrome reading a real OS setting, and separately with the feature genuinely true at the platform layer. What has not been observed is the transition, on this machine, driven by a user flipping the toggle. Stage 5 should rewrite the entry to that, rather than close it or leave it as it stands.

---

### 6. prefers-contrast and forced-colors

Both emulated through CDP `Emulation.setEmulatedMedia`, which switches Chrome's real forced-colors pipeline rather than toggling a class. Real Windows high contrast was not enabled, because it repaints the user's entire desktop and the emulated pipeline is the same code path.

**`prefers-contrast: more` does nothing, and "nothing" is exact.** The query matches, and the rendered page is indistinguishable from the default. There is no `prefers-contrast` block anywhere in `src/index.css` and no component reads it. A user who has asked their operating system for more contrast gets `ink3` at 2.96:1 and a redox axis at 1.20:1, the same as everyone else. This is not a regression, it is an absence, and it is the cheapest of the findings to act on because the failing pairs are already enumerated above.

**`forced-colors: active` is more interesting than expected and the log's prediction is half right.** The page goes black ground, white text, white outlines. What happens to each thing:

- **Text and outlines are fine.** White on black everywhere, well above any threshold, and every card still reads as a card because the 2.5px border is forced to `CanvasText`.
- **The hard offset shadow is gone in effect if not in fact.** `box-shadow` is not forced, so a `#16162E` shadow is still being painted, onto a black ground, where it is invisible. **The paper cutout read collapses entirely.** DESIGN.md calls the shadow load-bearing, and forced-colors mode removes it without removing it, which is the worst version: the layout still reserves the offset and nothing occupies it.
- **The badge fills are gone and the badge words survive.** Every pill goes to black with a white outline, so Sourced, Tuned and Contested become typographically identical and are told apart only by the word. This log's channel table predicted exactly that and the prediction holds.
- **The blob fills survive.** SVG `fill` set as a presentation attribute is not forced, so glucose is still `substrate` blue and the carrier is still on its redox axis against a black card. **The one thing that most needed to survive did**, which means forced-colors is not an additional route to the colour-alone problem, only the existing one on a different ground.

**Stage 5 should record the shadow as a conflict rather than as a bug**, exactly as this log's stage 5 step 5 anticipates. A user setting says "remove your colours, use mine" and a design decision says "this shadow is what makes the system legible". Both are right. Naming it a defect implies somebody was careless and nobody was.

---

### What stages 2 to 4 inherit, and one thing they do not

**Stage 2 inherits a sharper problem than it was written for.** Protanopia at 3.21 dE between adjacent play states, not merely "deuteranopia is the common one". And it inherits the finding that its own preferred candidate, the electron dots, is half implemented in the wrong direction: opacity rather than count, ink on ink, on the outline.

**Stage 3 inherits a much smaller job than it was written for and should say so rather than pad it.** No focus indicator that survives the design, focus dropped on purchase, import unreachable, first run last in order, and no focus trap on two panels that claim `aria-modal`. Not "make the game playable without a pointer", which it already is. **The skip link should not be built.**

**Stage 4 inherits the full list of what the tree says and a limitation it cannot design around.** No live regions, no landmark or heading on the pathway, unlabelled figures, a coach mark that is not announced, and blob labels that describe the encoding instead of the state. It also inherits the fact that no screen reader is installed on this machine, so its step 6 comparison will be a comparison of accessibility trees unless one is installed first.

**And one thing found in passing that is not this log's to fix.** The pathway card renders five figures with `badgeDisplay="attached"` and displays no badge anywhere on the card. `Figure.tsx`'s own comment names that as "a bug, and the only kind of bug in this contract that a type cannot catch". Under reduced motion those five figures are the only numbers on the card, so five unsourced-looking numbers are the whole readout. It is a badge contract problem rather than an accessibility one, it does not belong to any stage of this log, and it is recorded here so it is not lost.

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
