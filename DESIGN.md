# Design System

Last updated: 2026-07-28
Direction: Honest Cartoon
Status: proposed, no code exists yet

The visual contract. Read this before making any UI decision. If a visual choice conflicts with anything here, the choice loses.

Reference mockups live at `~/.gstack/projects/krebs/designs/design-system-20260728/preview-cartoon.html`. An earlier rejected direction is preserved alongside it as `preview.html`.

---

## Direction

Cartoon that teaches, not cartoon that decorates.

docs/BRIEF.md said the instinct was cartoony and warm rather than clinical, on the reasoning that a sterile interface undersells the primary audience. That instinct is now the decision. The visual reference is the thick-outline sticker style used by browser games like Slice of the Market: heavy black strokes, pastel surfaces, hard offset shadows, chunky rounded type, hand-drawn blob illustration.

The constraint from docs/BRIEF.md holds unchanged: **illustration can be warm, numbers cannot.** Anything quantitative stays typographically precise with tabular figures. The reference style already solves this, because its illustrations are loose while its numbers are bold, tight and column-aligned.

One rule generates the rest: **every visual property carries simulation state.** Shape carries carbon count. Colour carries chemical state. Saturation carries redox state. Cracks carry damage. Nothing in the illustration set is decorative, which is what separates this from a science game with a cute skin.

## Typography

Two families. Both free, both on Google Fonts.

- **Display: Fredoka, weight 600.** Wordmark, act titles, card titles, coach-mark headings. Rounded and friendly without tipping into a children's book.
- **Everything else: Nunito, weights 400 to 900.** Body prose, labels, and every figure in the game.

All numeric display sets `font-variant-numeric: tabular-nums` and `font-feature-settings: 'tnum' 1`. This is not optional. Column alignment is the credibility mechanism.

Scale:

    wordmark      60 to 104px   Fredoka 600, tracking -0.03em
    h2            26 to 38px    Fredoka 600, tracking -0.01em
    card title    15 to 17px    Fredoka 600
    headline num  26 to 40px    Nunito 900, tracking -0.02em
    body          15.5px        Nunito 600, line-height 1.6
    label         11 to 12px    Nunito 800, uppercase, tracking 0.10em
    micro         9.5 to 10.5px Nunito 700 to 800

## Colour

Surfaces are pastel. Meaning is saturated. Ink is a single near-black used for every outline and all text.

### Surfaces

    page      #CFEDE9   soft mint field, the page background
    cream     #FDFBE4   working area, pathway card
    pink      #FBDFEC   pools and stores
    mint      #DEF3E5   unlock shelf
    sky       #DDEEFB   substrate cards
    lilac     #E9E4F9   enzymes, contested science
    white     #FFFFFF   default card

### Ink

    ink       #16162E   every outline, all primary text
    ink2      #5A5A78   secondary text
    ink3      #9494AC   disabled, locked

### Semantic, carries simulation state

    atp         #F5883C   energy, the currency
    reduced     #23BFA0   NADH and FADH2, carrying electrons
    oxidized    #A9BFB8   NAD+, same shape, drained
    substrate   #5AA9E6   carbon skeletons
    loss        #E8503C   oxygen, ROS, damage, falling numbers
    gain        #34B276   rising, healthy, sourced
    gradient    #3FC9E0   act 3 proton motive force
    nitrogen    #C3CE3C   act 4 waste and disposal cost

`reduced` and `oxidized` are deliberately the same shape at different saturation. When the redox pool drains, the player watches the NAD+ wall arrive as colour leaving before any number is read. This is the single most important colour decision in the system.

No gradients anywhere. No purple as a decorative accent. Lilac means contested, and only that.

### Act distribution

The palette does not change between acts. Its distribution does.

    Act 1   substrate blue dominant, atp rare, redox draining to oxidized
    Act 2   loss red spreads across surfaces and enzyme blobs, page tints warm
    Act 3   gradient cyan enters for the first time, atp floods
    Act 4   full palette in balance, nitrogen joins as a cost

## Illustration language

Thick black stroke, `stroke-width` 3 to 3.5, `stroke-linejoin: round`, flat pastel fill, irregular hand-drawn polygons. Nothing is geometrically perfect.

Rules, in priority order:

1. **Sides equal carbons.** Glucose is a six-sided blob. Pyruvate is three-sided. When one six splits into two threes, the arithmetic is visible rather than stated.
2. **Phosphate dots are countable.** ATP carries three, ADP carries two. Spending energy visibly removes a dot.
3. **Redox is saturation, not hue.** NADH and NAD+ are the same silhouette. NADH is `reduced` with two electron dots. NAD+ is `oxidized` and empty.
4. **Enzymes are machines with a notch.** The notch is shaped like the enzyme's substrate. This is induced fit drawn as a cartoon, and it teaches specificity for free.
5. **Damage is cracks.** Act 2 degradation draws as `loss` coloured cracks across the enzyme blob, not as a percentage buried in a table.
6. **ROS have X eyes.** Hazards read as characters, not as icons.

## The badge contract

Three shipping states, applied to every quantitative claim in player-facing text, plus one development-only state.

    Sourced       gain green      a biochemist can check it against docs/SCIENCE.md
    Tuned         atp orange      the game chose it for pacing and says so
    Contested     lilac           the science is genuinely unsettled

    Needs source  yellow, dashed  DEVELOPMENT ONLY, must never reach a release build

This makes docs/PILLARS.md rule 4 a component problem rather than a discipline problem. Any figure rendered without a badge looks visibly broken, because the badge slot is empty.

`Needs source` exists so that unsourced content is loud during development rather than invisible. It is a dashed yellow badge because dashed borders read as unfinished everywhere else in this system. **The release build must fail if any `Needs source` badge survives into it.** That check is the mechanical enforcement of hard rule 1 and it should be written before any content is.

## Coach marks

The primary teaching delivery mechanism. Every unfamiliar term gets a 16px circular info affordance. Activating it opens a bubble.

Anatomy, top to bottom:

    heading         Fredoka 600, 16px, with its badge inline
    body            Nunito 700, 14.5px, two short paragraphs maximum
    action          full-width button
    source          badge plus a doc reference, e.g. docs/SCIENCE.md section 2

The source row is mandatory. A coach mark without one does not ship.

Two paragraphs is a hard ceiling. If a concept needs more, it needs a teaching panel, not a bubble.

## Spacing, borders, shape

    base unit       4px
    scale           2, 4, 8, 12, 16, 24, 32, 48, 64
    outline         2.5px solid ink on cards, 2px on pills and small elements
    shadow          4px 4px 0 ink, no blur, ever
    radius card     16px
    radius button   12px
    radius pill     999px
    density         compact in rails and pools, comfortable in prose at 64ch

The hard offset shadow is load-bearing. It produces the paper cutout read. A blurred shadow turns this system into generic soft UI immediately.

## Layout

Information architecture follows the reference, because it is well solved.

    top bar     persistent headline readout, always visible, always ticking
    left col    resource pools, one card each, illustration plus bar plus rate
    main        pathway card, then a grid of enzyme cards with sparklines
    bottom      unlock shelf, dashed slots for what is not bought yet

Grid columns that contain a wide pathway SVG must set `min-width: 0` or the SVG forces the track wider than its container.

**Flux is the headline, stock is the subscript.** This inverts the genre convention, where stock is large and rate is a small subscript. That convention is inherited from games where the stock is the score. krebs teaches flux, so the rate gets the large type. This is the system's biggest deliberate departure and it should not be reversed without a reason.

Locked content stays visible and dimmed rather than hidden. Seeing what is coming is the genre's engine.

## Motion

Load-bearing, not decorative.

Flux animates along pathway arrows as flowing dashes at a speed proportional to actual `v`. The player reads rate by watching. docs/SIMULATION.md Part 1 already passes the accumulator remainder to the renderer for interpolation, so this is supported by the engine spec as written.

    micro     80ms      button press, dot removal
    short     180ms     card state change
    medium    320ms     panel entry, coach mark open
    long      600ms     act transition tint
    set piece ~4s       endosymbiosis, once per playthrough

    easing    enter ease-out, exit ease-in, move ease-in-out

Buttons translate 3px into their own shadow on `:active` and drop the shadow to zero.

**Accessibility obligation.** Because motion carries information, `prefers-reduced-motion` must not simply disable it. Reduced motion swaps flowing dashes for a static arrow plus an explicit numeric rate. Nothing in the game may be encoded in movement alone.

## Screen inventory

No authentication. No accounts. No backend. docs/PILLARS.md rule 7 holds.

    Act screen          per act, the primary surface
    Timeline view       vertical scroll through deep time, second view
    Coach mark          overlay, the teaching unit
    Teaching panel      overlay for concepts too long for a bubble
    Unlock shelf        dashed slots, part of the act screen
    Offline return      what happened while away, with the event sequence
    Save management     export to file, import, backup recovery on failed parse
    About               required disclosure text from docs/SCIENCE.md Part 1
    Endgame summary     what was built, the real timeline, sources, simplifications
    Sandbox             all unlocks, adjustable environment

The timeline is a second view, not the main screen. It answers "where am I and how much is left", which the act screens cannot, and it gives ATP a visible destination.

The offline return screen shows the event sequence, not just a total. docs/SIMULATION.md left this open. The piecewise steady state algorithm produces a genuine bounded event list, so showing it is both honest and instructive: it teaches that metabolism is homeostatic between shocks rather than smoothly accumulating.

## The cell as beast

Decided 2026-07-28, from docs/IDEAS.md.

The problem it solves is real. Nothing else in the design consumes ATP, so the game produces a currency with no visible sink, which is what makes idle numbers feel weightless.

The beast is the cell itself, personified with a face and two stubby legs. This is biologically what ATP actually powers, so it is correct rather than a mascot bolted on. The literal version from docs/IDEAS.md, a whale or elephant creature on an obstacle course, is rejected because an organism moving through an environment is an organism in an ecology, and docs/PILLARS.md rules that out explicitly.

The beast is a direct readout of simulation state. It is never decorative and it never animates on a timer.

    Lively      mint fill, open eyes, smile, mid-stride, motion ticks
                high flux, act 1 solved

    Sluggish    desaturated fill, closed eyes, flat mouth, slumped
                NAD+ pool exhausted, flux near zero

    Sick        pink fill, X eyes, frown, red cracks on the body
                act 2, ROS damage active

    Powered     mint fill, mitochondrion visible inside, cyan motion ticks
                act 3 onward

The Powered state matters most. **The act 3 transition is drawn on the beast's body**, because that is the moment it gains a mitochondrion and the player watches the organelle appear inside the thing they have been running. The single irreversible step in the game gets a single irreversible visual change.

## The timeline view

The map is the real geological timeline, rendered as a vertical scroll.

**Down is older, up is newer.** This is stratigraphic, matching how rock is actually read: deeper means deposited earlier. It also turns progress into climbing out of deep time rather than sliding along a bar. The beast trudges upward as acts complete.

Structure per stop, left to right: the date, the spine with a node, then a card carrying a cartoon figure, a one-line description and its badges. Act stops get a coloured node and a tinted card. The current position is marked with the beast in its current state and a `You are here` label.

Stops as drafted:

    Now              modern eukaryotic cell           locked until completion
    ~1.6 Ga          first accepted eukaryote fossils Needs source
    ~2.0 to 1.5 Ga   endosymbiosis, act 3             Contested
    ~2.4 Ga          Great Oxidation Event, act 2     Sourced
    ~2.7 Ga          oxygenic photosynthesis          Needs source
    ~3.5 Ga          stromatolites, act 1 start       Sourced
    ~4.0 Ga          hydrothermal vents               Needs source, Contested

**The rule that keeps this from becoming an evolution game: a figure earns its place by its metabolism, not its morphology.** Stromatolites qualify because they are microbial mats doing photosynthesis. Banded iron formations qualify because they are the physical fossil of the oxygen event. Cyanobacteria qualify because they made the oxygen that nearly kills the player in act 2. Nothing goes on the timeline for being an interesting looking animal. Applying this rule keeps docs/PILLARS.md intact as the feature grows.

**The axis is non-linear and must say so.** All four acts sit between roughly 4.0 and 1.5 Ga, so a linear axis would spend most of its length on eras containing no gameplay. The axis is therefore weighted to the Precambrian. That misrepresents deep time, so the compression is disclosed on the view itself, in the same way and for the same reason that tuned reaction rates are disclosed. Silent compression of a real timescale is exactly the failure mode this project exists to avoid.

Only ~3.5 Ga and ~2.4 Ga currently trace to docs/SCIENCE.md. Every other date on this view carries `Needs source` until an entry exists.

## Open questions

1. **Working title.** docs/BRIEF.md still says TBD and no naming shortlist file exists. "krebs" names an Act 3 mechanic that unlocks roughly four hours in, and the first 45 to 90 minutes are anaerobic glycolysis where the Krebs cycle does not exist. The wordmark is drawn as `krebs` on that assumption.
2. **Act 2 has no Fe-S target in the core pathway.** docs/PROGRESSION.md says ROS damage should preferentially target iron-sulfur cluster enzymes. Correct, but none of the ten glycolytic enzymes contain an Fe-S cluster, so as specified the crisis cannot touch the player's main pathway. The mockups instead land damage on pyruvate:ferredoxin oxidoreductase and ferredoxin, which are genuinely among the most oxygen-labile proteins in biology. That routes the crisis back into NAD+ recycling and makes the Act 1 wall return, which reads as a callback rather than an arbitrary spike. **Needs a docs/SCIENCE.md entry before it is built.**
3. **Cross-document paths are broken.** Every doc references `docs/SCIENCE.md` and similar, but the files sit at the repository root. Roughly 25 dead references, including CLAUDE.md's own index. Either move the files into `docs/` or rewrite the references. Not yet done.
4. **Berkeley Mono is not used.** An earlier direction proposed it. The cartoon direction has no monospace role, since Nunito with tabular figures covers numeric display. Revisit only if a code or terminal surface appears.
5. **Five timeline dates are unsourced.** ~4.0 Ga, ~2.7 Ga, ~2.0 to 1.5 Ga and ~1.6 Ga all carry `Needs source`. They are drafted from general knowledge and are not yet traceable to docs/SCIENCE.md, which means they currently violate hard rule 1. Either add docs/SCIENCE.md entries with citations or cut the stops. The endosymbiosis window in particular is contested in the literature and docs/SCIENCE.md already says so, so its range needs care rather than a single figure.
6. **The release gate for `Needs source` does not exist.** The badge is specified but nothing enforces it. A build check that fails on any surviving `Needs source` should be written before content authoring starts, otherwise the badge is documentation rather than a gate.

## Decisions log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-07-28 | Honest Cartoon over Warm Instrumentation | docs/BRIEF.md already recorded the cartoony instinct. A sterile interface undersells high school and undergraduate students, who are the primary audience. |
| 2026-07-28 | Two families, Fredoka and Nunito | Friendly display voice plus a body face with real tabular figures. Free, and neither is an overused default. |
| 2026-07-28 | Shape encodes carbon count | Makes the illustration teach at no extra cost. Separates this from a science game with a cute skin. |
| 2026-07-28 | Flux is the headline, stock is the subscript | The genre inherits stock-first display from games where stock is the score. krebs teaches flux, so rate gets the large type. |
| 2026-07-28 | Three-state badge on every figure | Turns docs/PILLARS.md rule 4 into a component contract. An unsourced number looks broken. |
| 2026-07-28 | Hard offset shadow, no blur | Produces the paper cutout read. A blurred shadow collapses the system into generic soft UI. |
| 2026-07-28 | No authentication, no accounts | docs/PILLARS.md rule 7. Considered and dropped. |
| 2026-07-28 | Cell as beast, timeline as map | Gives ATP a visible sink without breaking the single-cell scope contract. |
| 2026-07-28 | Timeline runs down into the past | Stratigraphic. Deeper is older, which is how rock reads, and it makes progress feel like climbing rather than sliding. |
| 2026-07-28 | Metabolism not morphology, for timeline figures | The guardrail that stops the timeline drifting into the tree of life over time. |
| 2026-07-28 | Non-linear axis, disclosed on the view | All gameplay sits between 4.0 and 1.5 Ga. Compression is necessary but silent compression of a real timescale is the failure mode this project exists to avoid. |
| 2026-07-28 | Added Needs source badge, development only | Makes unsourced content loud during development and gives hard rule 1 a mechanical release gate. |
| 2026-07-28 | Act 3 transition drawn on the beast | The one irreversible step in the game gets one irreversible visual change, on the thing the player has been running all along. |
