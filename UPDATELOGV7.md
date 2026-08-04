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

**The channel is a LEVEL.** The carrier's silhouette is filled `oxidized`, the reduced fraction of it is overlaid in `reduced`, and the boundary between them is a hard ink rule whose height is the reading. Position is the channel and ink is the contrast, and neither depends on hue.

    channel                       normal   deut   prot   trit   greyscale
    the ink level rule, against
    the oxidized side of it         9.11   8.98   9.20   9.13        9.15
    the ink level rule, against
    the reduced side of it          7.60   5.70   7.54   8.26        6.47
    the colour it backs up          1.20   1.58   1.22   1.11        1.41

The worst case for the new channel is 5.70:1 against a 3:1 floor. The best case for the old one is 1.58:1. That is the whole argument.

### Why a level, and why the other two lost

**(b) the electron dots lost on chemistry, which was not the reason expected.** The stage calls it the strongest starting point and the reasoning is good: a countable dot is the device that already works for phosphate, and DESIGN.md rule 3 already assigns two dots to NADH and none to NAD+. It loses because **the quantity is continuous and a count of two gives three values, and the middle one does not exist.** NADH carries its two electrons as a hydride. There is no carrier holding one. Quantising a 56 percent reduced pool to a single dot would put a species on the screen that is not a species, on the one card whose entire job is to teach what the carrier is. This project does not do that.

**Stage 1 also found the dots are already the wrong shape for the job**, which is corroboration rather than the reason. They fade by `opacity` rather than changing count, and they are `--color-ink` sitting on a 3.25px `--color-ink` outline, so at the rendered size of 54px they read as a notch in the edge rather than as two particles.

**(a) texture lost on legibility and on vocabulary.** Hatching or stipple inside a 54px blob already carrying a 3.25px outline, two electron dots and, on other blobs, a chain of phosphate dots, is noise. It is also a device this system does not have anywhere else, and DESIGN.md's illustration language is short on purpose.

**(c) won, and it turned out to have an argument nobody made for it in the candidate list.** The level is not merely a second channel, it is a **truer** encoding than the one it replaces. A pool at 56 percent reduced does not contain a substance of intermediate colour. It contains real NAD+ and real NADH in that proportion, held in two separate pool amounts in the simulation. The mix said the carrier is somewhat reduced. The level says 56 percent of the carriers are reduced, which is what the model holds. **The accessibility fix and the correctness fix are the same edit.**

### What was kept exactly as it was

**The silhouette is byte-identical.** `illustration.test.ts` asserts it: the carrier path rendered with the level and without it is the same string. This log's Decisions section makes that the constraint and it is a test rather than a claim.

**Both ends of the axis are pixel-identical to what V3 shipped.** At a reduced fraction of 0 the blob is flat `oxidized` and at 1 it is flat `reduced`, because the level travels between the exact `top` and `bottom` that `carrierPath` draws rather than between a bounding-box guess. That needed one non-obvious thing: `redoxLevelY` is written as `top * f + bottom * (1 - f)` rather than as `bottom - (bottom - top) * f`. The two are the same line and the second lands three ulps short of `top` at f = 1. The rounding would have hidden it and the claim would have been "nearly identical", so the form changed instead of the test.

**Colour still does everything it did.** Nothing was removed. What went is the interpolated mix in the middle, and `mixRedox` went with it, which also removed the one place in the interface that reached past `var()` into hardcoded channel values. `index.css` is now the definition of record for both ends of the axis rather than for the endpoints of a function that duplicated them.

### The level is derived, not authored

Same rule as the geometry and the same shape of test. `redoxExtent(size, seed)` computes the extent from the same wobble `carrierPath` draws from, `redoxLevelY(extent, fraction)` is the only mapping and both the render and the per-frame update go through it, and `PoolCard` passes a fraction and nothing else. Which y a fraction lands on is a fact about how `Blob.tsx` draws a carrier and it never leaves that file.

**Four assertions, over the range rather than at two points**, which is what the stage asks for and what separates a channel that carries a quantity from one that carries two states:

- strictly monotonic across 21 fractions from 0 to 1, and in the right direction
- exact at both ends, `redoxLevelY(extent, 0) === extent.bottom` and `(extent, 1) === extent.top`
- linear, so half reduced is half way up rather than somewhere on a curve somebody chose
- clamped, so a pool amount that has drifted a denormal past its total cannot put the level outside the shape

Plus one that reads the geometry rather than the claim, in the file's existing idiom: every y in the rendered carrier path lies inside the published extent, and the extent is tight rather than generous, so a level at 1 really is at the crown.

**Measured in the browser, the level sweeps rather than snapping.** Sampled every 120ms through the NAD+ wall on a fresh run: reduced fraction 0, 13, 62, 138, 231, 334, 445, 537, 656, 778, 878, 983, 1000 thousandths, with the rule travelling y 48.55 to 5.17. The wall arrives as a rising level, over about three seconds, on the same clock as the colour.

### Step 5, the re-run, and the honest answer per image

Recaptured at the same three moments, with the fractions read off the card at capture: running at 0.103, the stall at 1.000, just after fermentation at 0.565. Same Machado matrices, plus a greyscale pass because this log's Context names a projector and a classroom.

    deficiency      running 0.103   the stall 1.000   after ferment 0.565
    normal              YES               YES                 YES
    deuteranopia        YES               YES                 YES
    protanopia          YES               YES                 YES
    tritanopia          YES               YES                 YES
    greyscale           YES               YES                 YES

At 0.103 the rule sits low in the blob with a small `reduced` region under it and is legible at true rendering size, which was checked at 1:1 rather than only at magnification. At 0.565 it is a clear chord across the middle in every row. At 1.000 the blob is full and the rule has reached the crown.

**And the channel has a blind spot, which is stated here rather than left to be discovered.** A level gauge carries no signal at its own ends: at a reduced fraction of exactly 0 and exactly 1 the rule coincides with the outline and is invisible in both cases, so those two states are not told apart by the level. They are told apart by **the electron dots**, and this was checked directly rather than assumed. A starved cell holds the carrier at exactly 0 forever, which gives a stable state to photograph against the walled 1, and under deuteranopia, protanopia and greyscale the two ink dots are present at 1 and absent at 0. Two countable marks against none, in the colour with the highest contrast in the system.

So the two channels are complementary rather than redundant: **the level is load-bearing everywhere except the ends, and the dot count is load-bearing at the ends.** That is a better outcome than the level alone and it was not designed, the dots were already there doing DESIGN.md rule 3's job. The caveat stage 1 raised still stands and is not withdrawn: at 54px those dots are about 5px across and sit on the outline, so they are corroboration rather than a channel anybody should rely on alone. The state a player has to read, the wall, is the one the level marks most clearly.

### Step 4, the rest of the table

**A stopped reaction needed a fix and it was not the fix the stage anticipated.** The stage suggests making the reduced-motion numeric rate permanent. That is the wrong repair here. A stopped arrow already carries four channels, stroke width 2 against 6, no dash against dashed, a hollow arrowhead against a filled one, and colour. The defect stage 1 measured is that **all four were being drawn in `ink3`, which is 2.83:1 on the cream pathway card**, so counting channels does not help when the ink they share is too faint to see. The stopped treatment moved to `ink2`, 6.34:1 on cream, which clears the floor and is still an obvious step down from `ink`. This file's own note that the track is "always present, so a stopped arrow is still an arrow rather than a gap" was not true on a low-contrast display until this change.

The numeric rate stays motion-conditional. Making it permanent would put five numbers on the one surface DESIGN.md keeps illustrative, to say a thing the arrow already says on three non-colour channels, and docs/CONTENT_STYLE.md Part 6 rules that out directly.

**The net rate sign is real and now it is tested.** `formatFigure` renders `+7.95`, `-7.95` and a space-padded ` 0.00`, so direction is a character rather than a colour. It was exported and had never been tested by anything. Four assertions now hold it, including that a denormal never prints `-0.00` and that all three forms are the same width so a rate crossing zero does not jog sideways.

### The guard that could not fail, caught by its own probe

**The first version of the stopped-arrow assertion passed with the wrong colour in place.** It rendered `PathwayArrow` and searched the markup for `--color-ink3`, and `ink3` restored to the component did not fail it, because **every colour an arrow uses is written from a per-frame callback and none of it is in the static markup a `renderToStaticMarkup` test can see.** The probe is the only reason that was found.

The fix was to change the component rather than to weaken the assertion. The two treatments are now one exported `ARROW_TREATMENT` constant, declared in full rather than as a base plus overrides, and the six ternaries that used to spell them out inline read from it. Re-probed: `ink3` restored fails with `expected 'var(--color-ink3)' not to contain '--color-ink3'`, and the probe was removed. A third assertion guards the guard, checking the constant actually reaches the DOM, because a named treatment nothing renders from would pass every other assertion in the block.

### Verify

    npm test        338 passed across 31 files, up from V6's 329
    npm run typecheck   clean
    npm run lint        clean
    npm run build       clean, 264.86 kB, 82.50 kB gzipped
    npm run dev         played, and photographed at all three moments

Bundle up 1.42 kB raw and 0.60 kB gzipped against V6's 263.44 and 81.90, which is two clip paths, a rule and a mapping function. Six tests added: four on the level, two on the arrow treatments, three on the sign, less one that was replaced.

**No tuned number moved and no simulation code was touched.** The three tuning files are untouched, `docs/SCIENCE.md` is untouched, and `src/sim/` and `src/content/` have no changes in this stage. Stage 5 confirms the canonical hash formally.

### Two things deferred by design

**`DESIGN.md` does not yet describe any of this.** The level, the ink rule and the `ink2` stopped arrow are all visual decisions and this log puts every DESIGN.md edit in stage 5, on the same pattern stage 3 uses for the focus indicator. Until then DESIGN.md's illustration rule 3 says the carrier is saturation alone, and the build no longer agrees with it. **That is a known disagreement with a stage attached, not a drift.**

**`CARRIER_READOUT` was rewritten and it fixed a second thing on the way.** It said "One shape, and the colour is which one it is. Full colour means NADH, carrying electrons", which now describes one of two channels. It reads "NAD+ and NADH. One shape, and the filled part is NADH. The level rises and the colour arrives as NAD+ is spent." **The direction is the fix that matters.** NOW.md and DESIGN.md have both carried an open item since V3 saying DESIGN.md's "colour leaving" sentence is backwards, because `oxidized` is the desaturated end so colour arrives as NAD+ drains. The old readout said "full colour means NADH", which is true and says nothing about which way the beat runs. This says which way, and it is the first player-facing text in the game to. Stage 4 owns making these labels state the current reading rather than the encoding, and stage 5 owns the DESIGN.md sentence.

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

**This stage was scoped to make the game playable without a pointer and it was already playable without a pointer.** Stage 1 refuted that premise by tabbing the real page, and the reason V3 got it right without meaning to is worth keeping: **every control is a native `<button>`, and a native button needs no `tabIndex` and no key handler to be operable.** The grep in this log's Decisions section looked for `tabIndex` and keyboard handlers, found neither, and concluded there was no keyboard path. It was reading the absence of the wrong thing.

So this stage did the narrower and sharper job that was actually there: one unreachable control, an invisible focus indicator, and four pieces of focus management, two of which were actively misleading.

### 1. Reachability, and the one control that was not

**Import from file was unreachable by keyboard, by anyone, since V4.** `SavePanel` wraps `<input type="file">` in a styled `<label>`, and the input carried Tailwind's `hidden`, which is `display: none`, which removes an element from the tab order entirely. It appeared in Chrome's accessibility tree as a bare `LabelText` with no role. Export worked and import did not, and the comment directly above it read "the native control is the accessible one" while the native control was display-none.

`sr-only` instead: clipped to one pixel, still in the layout, still focusable, still operable, because a focused file input opens the picker on Enter or Space with no handler of ours involved. The picker itself was deliberately not triggered in the headless browser, since a native modal blocks the session; the behaviour is the browser's and is not something this change alters. Confirmed in the tab order after the change: `Export to file`, then `INPUT`.

Everything else was already reachable. `Button.tsx` and `InfoAffordance` were both real buttons and neither needed fixing, which was checked rather than assumed.

### 2. The focus indicator

**An inner ink rule, 3px, offset -6px, on `:focus-visible`.**

The default was `outline: auto` at 1px in Chrome's near-black, drawn immediately outside a 2.5px `#16162E` border. Stage 1 measured it against the colour it is actually adjacent to, which is that border rather than the page, at **1.02:1**. It was rendered and it was not perceivable.

**Inside rather than outside, and the shadow is the reason.** DESIGN.md's `4px 4px 0` is a solid ink copy of the shape down and to the right, so an outer ring is clean along the top and left edges and merges into the shadow along the other two. An indicator visible on two sides of an element is not an indicator. Drawn inside, it sits on the element's own surface, is identical on all four sides, and never interacts with the shadow.

It also reads as deliberate, which is the other half of what this stage asks. A second hard stroke inside the first is the paper cutout language the direction is built from, and nothing else in the system draws an inner rule, so it cannot be confused with a state.

**Measured contrast, against every surface a focused control can sit on**, all against a 3:1 requirement:

    white 17.67    cream 16.91    mint 15.20    sky 14.89
    page  14.26    lilac 14.25    pink 14.19

The -6px inset is what makes those the adjacent colours rather than the ink border, which is precisely the mistake the browser default makes.

**Small controls take the ring outside, via `data-focus-ring="outer"`.** The 16px info affordance has no room for an inner rule, and DESIGN.md gives pills no shadow, so there is nothing outside for a ring to collide with. One rule, one opt-in, and the only element using it today is `InfoAffordance`.

**No new colour and no `box-shadow`.** The indicator is `outline`, which keeps it clear of `designSystem.test.ts`'s rule banning a non-zero third length in any shadow, and it is `var(--color-ink)`, so nothing was added to the palette. A semantic colour was considered and rejected: DESIGN.md says every visual property carries simulation state, and a focus ring is not simulation state, so orange would have started meaning two things.

### 3. Focus management, all four behaviours, each verified in a browser

**Opening an overlay moves focus into it.** Measured before: the About panel open with `document.body` still focused. After: focus lands on `Close`, the first control inside.

**The trap holds, and only where the overlay claims to be modal.** Five consecutive Tabs inside the About panel, all reported `INSIDE`. `dim` drives both `aria-modal` and the trap, so the two cannot drift apart. Stage 1 found the dimmed panels claiming `aria-modal="true"` while all nine controls behind them were still tabbable, which is worse than having no dialog role: assistive technology hides a background the keyboard walks straight into.

**Escape closes and focus returns to the opener.** Measured: dialog gone, focus back on the `About` button in the top bar. The return is conditional on focus still being inside the overlay or nowhere, so a player who clicked something on the act screen keeps the place they chose.

**Buying an unlock no longer drops focus into the void, and this was the worst of the four.** Measured before: focus to `document.body`, and the next Tab restarting from the top of the document and landing on `Export to file`, past the entire unlock shelf. After, buying "Express it" with Space:

    focus after buying   DIV[tabindex=-1] "Lactate dehydrogenase..."
    next Tab             BUTTON "About the yield"
    then                 BUTTON "Export to file"
    then                 INPUT (import)

Focus moves to the slot's own card, which is a focus target and never a tab stop, so the tab order is unchanged and tabbing on continues in document order. It is conditioned on focus having actually been inside that slot, so a purchase made with the pointer, or from the coach mark's action button, does not yank focus across the screen.

**Confirmed on a second, different purchase.** Uptake capacity bought by keyboard after tabbing to it: ATP per second 31.80 to 36.70 and glucose per second 7.95 to 9.94 in the top bar, focus on the slot card, next Tab forward.

### 4. The coach mark, and the one decision this stage made rather than inherited

**A coach mark takes focus when the player asked for it and never when it fires by itself.**

The stage says "opening a coach mark or the teaching panel moves focus into it". Applied literally that would move focus on the automatic NAD+ mark, which fires on the wall about three seconds in, with nobody having touched anything. Moving focus without a user action takes the keyboard out of somebody's hands mid-sentence, and it is the single thing a screen reader user experiences as the page grabbing them. So `useCoachMark` tracks whether the opening was `show()` or the snapshot subscription, and only the first takes focus.

Verified both ways in a browser:

    manual    focus parked on the g3p affordance, Enter, focus lands on the
              mark's action button. Escape, focus back on the affordance.
    auto      focus parked on the top bar About button, the wall arrives, the
              mark opens, focus is still on the About button.

Escape closes a coach mark too, to the same contract the panels have. A mark is drawn inline in the pool rail rather than as an overlay, and a player who has learned Escape dismisses the thing on top should not have to learn that this one is different. **Announcing the automatic mark instead of focusing it is stage 4's job**, and this stage deliberately left that hole open rather than filling it with a focus move.

### 5. Tab order, and the skip link that should not be built

**Seven stops, in reading order, and it needed no fixing.**

    1  About                        top bar
    2  6 carbons, split in two      pool rail, g3p
    3  NAD+ has run out             pool rail, carrier
    4  ATP does not pile up         pool rail, adenylate
    5  About the yield              unlock shelf
    6  Express it                   unlock shelf
    7  Export to file               save panel
    8  the file input               save panel, new

Top bar, rail, shelf, save panel. The pathway card contributes nothing, because a reaction arrow is not a control. Nothing sets a positive `tabindex`, so DOM order is tab order, and that is now asserted rather than observed.

**The skip link in step 5 was not built and the reason is a measurement.** The step assumes a keyboard user traverses eight pool cards. They traverse **three stops**, because a pool card is not focusable and only three of the eight carry an info affordance. A skip link over three stops is more furniture than it saves. A test pins the rail at four stops or fewer, so if a later log makes pool cards interactive it fails there, which is the right moment to revisit it.

**One thing left as it is, deliberately.** The first run card is still last in DOM order, because it is a sibling of `<main>` in `App.tsx`. Focus moving into it on open fixes the thing that mattered, which is that a keyboard player used to meet seven unexplained controls before the card explaining the game. Moving it in the DOM would restructure the act screen to fix a problem focus management already solves.

### 6. What is tested, what is browser-verified, and why the line falls there

`src/ui/__tests__/keyboard.test.tsx`, 14 assertions. The suite's environment is `node` and there is no DOM in it, which is deliberate everywhere else: the illustration and the pathway are pure functions of their tables and are asserted by rendering to a string. Focus is not like that. A string has no active element.

**Tested:** every control is a native button or input; no positive `tabindex` anywhere; the tab order is the reading order, asserted as a sequence of markup offsets; the rail is at most four stops; the file input is `sr-only` and not `hidden` and is a tab stop; the focus rule exists, uses `:focus-visible` rather than `:focus`, has a negative offset and is drawn in `var(--color-ink)`; the outer variant exists and something asks for it; an overlay is a dialog with `tabindex="-1"`, its `aria-modal` tracks `dim`, and the scrim stays out of the tab order; a focusable card is a target and never a stop.

**Probed, both ways.** Restoring `hidden` on the file input fails the reachability assertion. Flipping the focus offset positive fails the inside-the-element assertion. Both probes removed.

**Browser-verified rather than suite-tested:** focus moving into an overlay, the trap holding, focus returning to the opener, focus surviving a purchase, and the manual-versus-automatic coach mark distinction. All five are reported above with what was measured. **Making them suite-testable needs a DOM implementation this project does not depend on**, and adding `jsdom` to close an assertion is a dependency decision worth taking deliberately rather than inside an accessibility stage. It is named here so the choice is visible rather than silently deferred.

### One bug this stage introduced and caught in the browser

The first version of `FOCUSABLE` put its exclusions on only the trailing term, so `button:not([disabled])` matched the scrim, which is a button carrying `tabindex="-1"` precisely so it stays out of the tab order. Opening the About panel focused the scrim instead of `Close`. Found by opening the panel and reading what had focus, not by a test, and the selector now applies `:not([disabled]):not([tabindex="-1"]):not([aria-hidden="true"])` to every term.

### Verify

    npm test        352 passed across 32 files, up from stage 2's 338
    npm run typecheck   clean
    npm run lint        clean
    npm run build       clean, 266.63 kB, 83.11 kB gzipped
    npm run dev         played by keyboard end to end, pointer unused

Bundle up 1.77 kB raw and 0.61 kB gzipped against stage 2, plus 0.67 kB of CSS for the focus rules.

**Act 1 is completable by keyboard.** Stated plainly, as the stage asks: the first run is dismissed, all three coach marks and the teaching panel and the about panel open and close, both kinds of unlock are bought, export is reachable and import is now reachable, and the pointer was not used for any of it. What has changed is not that it became possible. It is that a player can now see where they are, is not thrown to the end of the page for buying something, and is not walked into a background their screen reader has been told is inert.

**No tuned number moved.** No file under `src/sim/`, `src/content/` or any of the three tuning files was touched.

**DESIGN.md still does not describe the focus indicator**, on the same footing as the redox level from stage 2: this log puts every DESIGN.md edit in stage 5, and the document is a stage behind the build until then.

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

**The rule held and the number is five.** Two minutes of real play, from a cold start through the NAD+ wall and out the other side, produced five announcements and nothing else. Between them the region was silent for a hundred consecutive seconds while the cell ran at steady state, which is the whole test: a simulation writing forty numbers to the DOM sixty times a second said nothing at all.

    "Lactate dehydrogenase can now be expressed."
    "The pathway has stopped. NAD+ has run out."
    "Lactate dehydrogenase is running."
    "The pathway is running again."
    "Uptake capacity can now be expressed."

Recorded with a `MutationObserver` on the live region on the real page, not inferred. The affordability landing before the wall rather than after it is not a bug and is not luck: `src/ui/tuning.ts` records the measurement that 55 cumulative ATP is reached 0.35s before the pathway dies, so **the answer arrives just before the problem, and act 1's opening beat now reads correctly in speech.**

### 1. The rule, and where the line actually is

Announce events, expose rates on demand, never narrate the tick. The line is the one the architecture already draws: NOW.md calls it three clocks, and the third of them, the discrete events React re-renders on, is exactly the set of things worth saying out loud. It was already computed and nothing was listening to it.

**Sixteen announcements in a full act 1**, derived rather than counted: one stall, one recovery, and an affordable plus a bought for each of the seven purchases. `ACT1_ANNOUNCEMENT_COUNT` computes it from the two ladder arrays, so adding a rung in a later log moves it without anybody remembering to. For scale, act 1 runs 62 game-minutes to its last purchase at 20Hz, so **narrating the tick would be roughly 74000 utterances against 16**, and a test pins the ratio at two orders of magnitude or better rather than leaving it as an argument in a comment.

### 2. One region, polite, and empty until something happens

`role="status"`, `aria-live="polite"`, `aria-atomic="true"`, `sr-only`, one on the page.

**Polite rather than assertive, deliberately.** Assertive cuts across whatever the user is reading and is for something going wrong. Nothing in act 1 is going wrong: the NAD+ wall is the game working, and it is the teaching beat.

**Atomic**, so an event is read as a sentence rather than as a diff against the previous one.

**One event per frame, even when two land together.** A purchase can make the next rung affordable on the same tick, and a region that swaps its whole contents twice before the reader gets to it is read once and the first event is lost. The second key stays unsaid and is picked up on the next frame.

**The subscription runs at frame rate and that is fine.** It samples per frame and compares a set of stable keys before it sets, so what reaches React state is one string per event: the tree re-renders sixteen times over an hour rather than sixty times a second. Same shape as the unlock shelf and the save panel, and the comparison is the only thing keeping it true.

**Nothing in this file contains a number**, and that is a constraint rather than a style. An `aria-label` cannot carry a badge, so a figure in one would be a quantitative claim in player-facing text with no provenance attached anywhere, which is what CLAUDE.md hard rule 1 and the badge contract exist to prevent. Every number stays where a badge can reach it and speech gets the event. A test asserts it.

### 3. Rates on demand, and there is only one of them

The stage warns that a parallel textual readout will drift from the visible one. **So there is no parallel readout.**

DESIGN.md already requires a static arrow plus an explicit numeric rate when motion is off, and that figure already goes through `Figure` with the reaction's own badge. It is now rendered in **both** motion modes and is merely `sr-only` when the dashes are carrying the same fact. One component, one number, one badge, visible or not.

That keeps V3's argument intact rather than overturning it. The old assertion was that the number is absent when motion is on, so the animation is a real channel rather than redundant decoration. That argument is about what a sighted player sees and it still holds: the number is not visible. What changed is that the same fact is now in the accessibility tree in both modes. The test moved with the claim, deliberately and in the open, and a second assertion now pins the reduced path as visible so the first cannot be satisfied by hiding the number in both.

**It is in no live region and nothing announces it.** It is read when the user navigates to it, which is the whole of "on demand", and it is why a number changing twenty times a second can sit in the tree without the page ever talking. Both SVGs on an arrow are `aria-hidden`, so this is the only thing on an arrow speech can see. Confirmed in the tree: `"UPTAKE"`, `"7.95"`, `"/s"`.

### 4. The illustration says what state it is in

**Before, on the one card in the game where the picture is the entire signal:**

    [image] "NAD+ and NADH. One shape, and the colour is which one it is."

A screen reader user was told the colour means something and never told what the colour currently was. That is the legend, not the reading.

**After:**

    [image] "NAD+ and NADH. Mostly NAD+."

**The hover readout and the accessible name now differ, and only here.** `<title>` keeps the encoding, because a sighted pointer user asking a shape what it means needs the encoding. `aria-label` becomes the reading. For every other blob those are the same sentence, because the encoding is geometry and the geometry is the state, so "Glucose. 6 sides, 6 carbons" is left exactly as V6 wrote it.

**Bands rather than a percentage, for two reasons that agree.** The picture carries a level and a level is read at a glance as roughly how full, not as a figure, so a number would describe something the shape does not say. And a number in an `aria-label` has nowhere to put a badge. The exact amounts are already two badged figures on the same card, so a user who wants them has them.

**The bands were wrong once and reading the tree on a running cell is what caught it.** The first thresholds, 0.25 and 0.6, described a carrier at 21.37 NAD+ to 8.63 NADH as "About half NADH". That is 28.8 percent reduced, it is not what the level looks like, and it contradicted the two stock figures sitting underneath it. Symmetric thresholds at 0.35 and 0.65 now, and the same state reads "Mostly NAD+".

**Quantised to the band, not to the fraction**, so the attribute is written when the reading changes, four or five times across a whole act, rather than whenever the twelfth decimal place moves.

**The net rate was the other unnamed thing.** DESIGN.md decides which of two numbers on a pool card is the rate by making it large, and type size is not a channel speech has. Stage 1 found a card announcing as `"Glucose", "SOURCED", "+7.95", "/s", "GLUCOSE", "944.72"`: two figures with nothing distinguishing them. An `sr-only` label from `content.ts` now precedes it, so it reads `"net rate", "-7.95", "/s"`. The stock already carried a visible label and needed nothing.

### 5. Landmarks and headings

**Before, three landmarks and three headings, with the middle of the screen in neither:**

    [main]
      [sectionheader]              the top bar, NOT a banner
      [navigation] "Pools"
      ...the pathway, bare...
      [region] "Unlocks"           h2
      ...the save panel, an h2 and no region...

**After:**

    [banner]
      [heading] "krebs" level=1
      [group] "Rates"
    [main]
      [navigation] "Pools"
      [region] "Pathway"           h2
      [region] "Unlocks"           h2
      [region] "Save"              h2
    [status] "Events" live=polite atomic=true

**The top bar had to move in the DOM to become a banner.** A `<header>` that descends from `<main>` does not get the `banner` role, which is why stage 1 found it as a plain `sectionheader` and the three headline readouts unreachable by landmark navigation. `<header>` is now a sibling of `<main>` and the page background moved to the wrapper, which is the only thing `<main>` was carrying it for.

**The pathway got a landmark and a heading and had neither.** It is the centre of the screen and the thing the game is about, and navigating by structure went from the pools rail straight to the unlock shelf. The heading is `sr-only` rather than drawn: the card already says what it is by being the pathway, and docs/CONTENT_STYLE.md Part 6 is explicit that a concept carried by the picture must not also be carried by a line of prose.

Heading structure is h1 then three h2s, no skipped levels, asserted. Eighteen images, all named, asserted.

### 6. The comparison this stage was supposed to deliver, and the honest version of it

**Step 6 asks for a real screen reader run end to end, compared against stage 1's. It was not done, and the reason is the same one stage 1 gave.** NVDA is not installed on this machine and neither is JAWS. Narrator is present, as on every Windows install, and exposes no interface for capturing what it said, so an agent driving it would be reporting its own reading of the page and calling it a reading of the page.

**What was compared instead is Chrome's computed accessibility tree, before and after, on the real page.** That tree is what Chrome hands to the platform accessibility API, so it is what a screen reader consumes, and every defect stage 1 named is visible in it as fixed:

    landmarks               3   ->  8, including a banner and a status region
    headings                3   ->  4, no skipped levels
    live regions            0   ->  1, polite and atomic
    figures named           0   ->  the net rate on all eight pool cards
    the carrier's name      the encoding  ->  the reading
    pathway navigable       no  ->  region plus heading
    rate readable by AT     only under reduced motion  ->  both modes

**What that cannot tell you is how it sounds, how long it takes, or whether it is bearable**, and none of the claims above are of that kind. **The deliverable of this stage, as written, is a before and after of what a full act 1 sounds like, and this log cannot produce it.** It is the second thing in this project blocked on a person rather than a feature, and it should be recorded next to the first. Stage 5 puts it in NOW.md.

### 7. Verify

    npm test        372 passed across 33 files, up from stage 3's 352
    npm run typecheck   clean
    npm run lint        clean
    npm run build       clean, 269.01 kB, 83.74 kB gzipped
    npm run dev         played, with the live region watched and recorded

Twenty tests added, fifteen of them new in `screenReader.test.tsx` and the rest moved or split in `pathway.test.tsx`. Probed both ways: putting `aria-live` on a per-frame pool card node fails the one-region assertion, and making the region assertive fails two. Both probes removed.

Bundle up 2.38 kB raw and 0.63 kB gzipped against stage 3.

**No tuned number moved and the simulation was not touched.** Nothing under `src/sim/`, `src/content/` or any of the three tuning files changed.

### One thing that went wrong and is worth recording

**`npx prettier --write` was run on `SavePanel.tsx` and rewrote every string in the file to double quotes.** The project has no prettier config, so the defaults fought the codebase's single quotes and would have landed a 60-line reformat inside an accessibility stage. Reverted with `git checkout` and the change reapplied by hand. **This project formats by hand and by ESLint and does not have a formatter**, which is a fact worth knowing before reaching for one again.

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

### 1. The rule, as DESIGN.md now writes it

Promoted out of Motion into its own **Accessibility** section, and widened by one word:

> **Nothing in the game may be encoded in movement or colour alone.**
>
> The reasoning is the direction's own. Every visual property carries simulation state, so a player who cannot perceive a property cannot read the state. That was accepted for motion on 2026-07-28 and the only reason it was not written for colour is that colour was decided first and never revisited.
>
> **It is not an argument, it is a measurement.** V7 stage 1 simulated the three common colour vision deficiencies against real screenshots of the act screen. `reduced` and `oxidized`, which this document calls the single most important colour decision in the system, are 37.50 dE apart in normal vision, 17.35 under deuteranopia and **7.64 under protanopia, end to end**. The two states a player actually moves between during act 1 sit 3.21 apart, against a just-noticeable difference of 2.3.
>
> **The fix is redundant encoding, never replacement.** Colour stays and keeps being the fast channel. A second channel is added alongside so the information survives the loss of the first.

The section then carries five subsections: the redox level, `a semantic colour fills and ink writes`, the focus indicator, what speech is told, and how much of it is mechanism. Motion keeps its own rule and now points at the section rather than owning it.

**Six decisions-log rows, all dated 2026-08-04**, and every one of them leads with the measurement rather than the argument: the widened rule and its dE figures; the level winning over the electron dots and over texture; `a semantic colour fills, ink writes` with the 6.54 to 3.30 badge arithmetic; the locked-slot dim at 0.85 with the three ratios it repairs; the focus indicator drawn inside with the shadow as the reason; and the speech rule with sixteen events against roughly 74000 ticks.

**Illustration rule 3 was amended rather than replaced.** It read "Redox is saturation, not hue" and now reads "Redox is saturation and a level", with a note saying the original was right about hue and incomplete about everything else.

### 2. The palette did not change, and that is the finding

**`src/index.css` has no colour edit in this whole log.** That was not the expected outcome and it is the more useful one.

Stage 1 found eight contrast failures that were a semantic colour used as text. The obvious fix is to darken the tokens, so it was costed rather than assumed:

    token       darkened until its worst TEXT use passes    what it costs
    gain        #34B276 -> #237950                          the Sourced badge
                                                            word drops 6.54 -> 3.30  BREAKS
    atp         #F5883C -> #C46D30                          badge 4.69, fill 3.02  ok
    substrate   #5AA9E6 -> #4989BA                          fill on sky 3.18  ok

**`gain` cannot move, and that settles it for all of them.** The palette is built so that ink reads on every semantic colour, which is exactly what makes the badge contract work, and a colour with that property cannot also read as text on a pale surface. Moving two tokens and not the third would be a palette with a rule that holds for some of its colours, which is not a rule.

**So the fix is a usage rule and the call sites moved instead.** `a semantic colour fills, ink writes`.

    the top bar figures    text-atp and text-substrate, 2.00:1 and 2.05:1 on
                           the page ground, the two worst ratios anywhere and
                           on the largest type in the game            -> ink
    a pool card net rate   gain or loss, 2.17:1 on the pink carrier card  -> ink,
                           and ink2 when the pool is flat
    the unlock progress    gain, 2.70:1 as micro text on white           -> ink

**Nothing lost a channel.** Direction is the sign character, which `Figure` renders and which `pathway.test.tsx` has asserted since stage 2. A threshold being reached is the button below it becoming operable, which is a stronger signal than a green number. And the change settles a tension that had been in DESIGN.md since 2026-07-28: **Direction has said "illustration can be warm, numbers cannot" from the start, and a coloured headline figure was warming a number.**

**Two things the measurement found that were not on stage 1's list as such.**

**`ink3` cannot carry meaning at all.** 2.96:1 on white at full opacity, so it is under the text floor on every surface in the palette, and 2.83:1 as a mark on cream, so it is under the non-text floor too. Darkening it does not help while an ancestor opacity is applied on top: even at `#6A6A84` a dimmed locked slot only reaches 2.14:1. It was the disabled button label and the stopped arrow. Both are `ink2` now. **The token stays defined, DESIGN.md keeps naming it, and nothing uses it**, which is honest: the description said "disabled, locked" and that is what it can no longer be trusted to say.

**Dimming compounds and a flat pair table misses it.** At `opacity-55` a locked slot's title measured 3.85:1, its detail line 2.36:1 and its button label **1.65:1**, under the floor for a decorative border let alone for text. At 0.85 they are 11.00, 4.51 and 4.51. The dim did not need to be that heavy, because lockedness was already on four channels and the dim was destroying the other three: the dashed border with no shadow still says locked at a glance.

### 3. The fifth guard

`src/ui/__tests__/accessibility.test.ts`, 43 assertions, after the determinism lint, the `Needs source` release gate, the DESIGN.md colour test and the divergence-row test, and built to look like them.

**Tested, because it is arithmetic:**
- every pair the act screen renders clears its WCAG 2.2 AA threshold, **computed from the tokens parsed out of `index.css` and from the dim read out of `Card.tsx`**, so a palette change or a dim change fails the build rather than failing a user
- no semantic colour is used as a text colour by either route, the Tailwind class or the live `style.color` write, the second of which no class scan would ever see
- every meaning in this log's channel table names a second channel and that channel is present in the build
- the arithmetic that forced the usage rule is kept as an assertion, so a later log that finds a way to make `gain` readable revisits the rule rather than quietly relaxing it

**Not tested, and deliberately not faked: whether a channel READS.** Whether an ink rule across a blob says "half the carrier is reduced" to somebody who has never seen the game is the same kind of question as whether the voice in docs/CONTENT_STYLE.md is right, and `contentStyle.test.ts` refuses to fake that one for the same reason. The test file says so in its header.

**The pair table is chosen by a reading rather than by listing everything.** WCAG 1.4.11 governs what is required to understand the content against its adjacent colours. For an ink-outlined shape the identifying boundary is the ink outline at 14:1 or better, so a blob fill against the card behind it is not the governing pair; what the fill has to do is distinguish that shape from another, and those are all above 85 dE under every deficiency. The same reading applies to a pathway arrow: `substrate` against cream measures 2.44 and is not asserted, because an arrow whose colour vanished would still be six pixels of dashes with a solid head against two of solid line with a hollow one. **The test says all of that in place of asserting it, so the next person can disagree with the reading rather than with a missing row.**

**Probed three ways, and the probe found a hole in the guard itself.**

    gain restored to the net rate      FAILS: "expected 'const colour = moving ?
                                       'var(--color-gain)'...' not to contain
                                       '--color-gain'"
    a palette token changed in
    index.css                          FAILS, 8 assertions at once
    the dim dropped back to 55         PASSED. THE GUARD WAS WRONG.

**The dim had been written into the test as a literal `0.85`**, so restoring `opacity-55` in `Card.tsx` left the whole locked-slot block passing against a number nobody had to honour. The test now parses it out of the component, plus a vacuity assertion so a regex that stops matching fails loudly instead of making `DIM` NaN. Re-probed: three assertions fail with 3.86, 2.36 and 2.36. **A guard that agrees with itself is not a guard**, and this is the second time in this log that a probe caught an assertion rather than the code. The other was stage 2's arrow-colour test, which searched markup that no per-frame callback ever writes to.

### 4. Coherence pass

Swept `src/ui/` for the four things the stage names.

**Every interactive element has an accessible name**, checked on the running page rather than in the source. Ten focusable elements, ten names, including the file input, which takes its name from the label wrapping it: `"Import from file"`.

**Every image has a label describing state.** Eighteen images, eighteen names, asserted. The carrier's is the reading and every other one is the geometry, which for those blobs is the state.

**Every focus target has a visible indicator.** One global `:focus-visible` rule with one documented opt-out for controls too small for it, and a test asserting the offset is negative and the colour is ink.

**Nothing announces per tick.** One live region, asserted as exactly one, with a separate assertion that nothing carrying `data-reaction` or `tabular-nums` is anywhere near an `aria-live`.

**One thing found and fixed in the sweep rather than planned:** `grep` for semantic colours used as text now returns only the comment in `TopBar.tsx` explaining why they are not used, which is the state a coherence pass is supposed to leave behind.

### 5. Verify

    npm run typecheck   clean
    npm run lint        clean
    npm test            415 passed across 34 files
    npm run build       clean, 268.94 kB, 83.73 kB gzipped

    against V6          329 tests across 31 files, 263.44 kB, 81.90 kB gzipped
    V7 added            86 tests, 3 files, 5.50 kB raw, 1.83 kB gzipped

**The act 1 canonical hash is `49ea08d3`, unchanged**, and asserted by `src/content/act1/__tests__/determinism.test.ts` as it has been since V5.

**No tuned number moved, and this is checked over the whole log rather than over this stage.** `git diff main` across `src/content/act1/tuning.ts`, `src/ui/tuning.ts`, `src/save/tuning.ts`, `docs/SCIENCE.md`, `docs/ECONOMY.md`, `src/sim/` and `src/content/` is **empty**. An accessibility log that moved the simulation hash would have changed the simulation, and this one did not touch the simulation at all: every change is in `src/ui/`, `src/App.tsx`, `src/index.css`, `DESIGN.md` and `NOW.md`.

**No divergence row was owed**, because no accessibility fix needed a tuned number. The one candidate, the locked-slot dim, is a design token decision recorded in DESIGN.md rather than a balance decision, on the same footing as the outline widths and the shadow offset that have always lived there.

### 6. The diffs

**DESIGN.md.** New `Accessibility` section, roughly 60 lines, with five subsections. Motion's obligation reduced to a pointer at it. Illustration rule 3 amended. The Colour section's "colour leaving" sentence corrected, with the wrong version kept on the page and the reason it stood for two logs written next to it. The matching entry under "What turned out to be wrong" struck through and closed. Six decisions-log rows. Header updated to 2026-08-04.

**NOW.md.** Status rewritten. Build state table: V7 done. A new "What the accessibility layer does" section, sibling to the others. A "Settled 2026-08-04, by V7" section with ten entries. The reduced-motion open item narrowed rather than closed, with both halves stated. The "colour leaving" item closed. The hover-tooltip item rewritten, because the level removed the part of it that mattered. Blocking gains item 0b, no screen reader has been run, and items 4 and 5, forced-colors as a conflict and `prefers-contrast` as an absence. "Next, in order" is now offline progress then CI, with both noted as independent and CI noted as pullable forward.

### One claim this log deliberately does not make

**Every claim V7 makes is arithmetic and none of it is comprehension.** Contrast is computable, a tab order is a fact about the DOM, an accessibility tree is what Chrome hands the platform, and a level rule is either drawn or it is not. **What none of it establishes is whether any of it reads.** Whether a rising ink line says "the carrier is filling up" to a fourteen year old, or whether sixteen announcements in an hour is the right number to hear, are questions of the same kind as every comprehension question this project has been unable to answer since V3.

V7 does not claim to have answered them and adds a second person to the list of people it needs: NOW.md Blocking item 0 wants one cold reader, and item 0b now wants one screen reader user. **The second is cheaper, because half of it can be bought by installing NVDA**, which turns "unrun" into a builder's reading. That is worth less than a real one and considerably more than nothing.

---

# After These Stages

- `DESIGN.md` has an accessibility rule that covers colour as well as motion, which is the rule it should have had when it decided that redox would be carried by saturation. The decision was right and it was incomplete, and the incompleteness was invisible until somebody simulated it.
- The NAD+ wall, which is act 1's whole teaching beat and the strongest thing in the build, is now readable without colour. `docs/PILLARS.md` success condition 1 involves a classroom, and a classroom contains readers this game could not previously reach.
- Act 1 is completable without a pointer and audible through a screen reader without narrating the tick, which is a real engineering result rather than a checklist item and it fell out of the three-clocks architecture the interface already had.
- Deliberately not done: the economy, the content, the simulation, the timeline, the beast and act 2. Nothing in this log moved the canonical hash.
- Two logs remain and neither depends on the other: offline progress, which `docs/SIMULATION.md` Part 3 has specified since before any code existed, and CI, which is the only thing standing between five build-failing guards and nobody running them.
