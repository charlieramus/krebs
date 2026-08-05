# Design System

Last updated: 2026-08-04
Direction: Honest Cartoon
Status: partly implemented. V3 built the act 1 screen against a running simulation and V7 made it perceivable. See "What survived contact" below for what shipped, what was deferred and what turned out to be wrong, and Accessibility for the rule this document should have had from the start.

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

`reduced` and `oxidized` are deliberately the same shape at different saturation. This is the single most important colour decision in the system, and since 2026-08-04 it is carried on a second channel as well, because a decision this important must not depend on one. See Accessibility.

**The sentence that used to be here was backwards and it is corrected rather than deleted.** It said the player watches the NAD+ wall arrive as colour *leaving*. `oxidized` is the desaturated end of the axis, so as NAD+ drains, **colour arrives**: saturation rises into the wall and falls again when fermentation runs. V3 encoded the reduced fraction, which is monotonic in one quantity and legible from across a room, and it is the opposite of what this document described. Recorded as wrong on 2026-07-29 and left wrong for two logs because nothing depended on it. V7 built a channel for the axis and had to describe the axis to do it, which is what finally forced the correction.

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
3. **Redox is saturation and a level.** NADH and NAD+ are the same silhouette. NADH is `reduced` with two electron dots. NAD+ is `oxidized` and empty. The reduced fraction of the pool is drawn as a level, with a hard ink rule at the boundary, because saturation alone does not survive a colour vision deficiency. See Accessibility. Amended 2026-08-04 by V7; the original rule read "saturation, not hue" and was right about hue and incomplete about everything else.
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

**Measured session values are exempt, and this is a rule rather than a note.** Added 2026-07-31 by V4, the first log to render a number the contract was not designed for.

A value measured from the player's own session and the wall clock carries no badge. It is declared exempt explicitly, at the call site, through `Figure`'s `measured` prop, which takes a sentence saying what is being measured. Exactly one of `badge` or `measured` is required, so provenance is still a decision that does not compile if it is skipped. It now has two possible answers instead of one.

The contract governs claims about biology and claims about the game's own tuning. "You were away for 5 hours" is neither. There is no document it could cite and no docs/ECONOMY.md divergence row it could owe, because it is not a game-authored number at all, and badging it would imply provenance is an open question about it.

**The exemption is narrow and this is the line.** It covers real elapsed time away, save timestamps and storage sizes. It does not cover anything the simulation produced. Pool amounts stay badged, because they are the output of a model whose rates are tuned. Elapsed *game* time stays badged, because its badge is a claim about the mapping to real time, which docs/SCIENCE.md Part 1 says does not exist, and that claim is still worth making.

No fourth pill was added. The vocabulary above is unchanged and the release gate is untouched.

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

**Both sentences above are mechanism as of 2026-08-04, and neither had ever been checked.** `src/ui/__tests__/teaching.test.tsx` asserts that every mark carries a source row, that the row names a `Part` docs/SCIENCE.md actually has, parsed out of the document rather than listed in the test, and that the body is at most two paragraphs. The ceiling had never bound because V3 shipped one mark and the NAD+ constraint is genuinely one idea. Three marks and a panel later, it binds.

**The teaching panel exists and takes the same contract at a looser ceiling.** Heading with its badge, body, mandatory source row, and at most 6 paragraphs and 1400 characters per docs/CONTENT_STYLE.md Part 5. "Longer than a bubble" is not "unbounded", and a concept that will not fit a panel is two concepts.

**Only a mark with a simulation event behind it should ever be automatic.** Two of the three are manual by construction rather than by the trigger setting. A card that opens an unrequested bubble whenever some condition happens to be true is what turns teaching into nagging.

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

Because motion carries information, `prefers-reduced-motion` must not simply disable it. Reduced motion swaps flowing dashes for a static arrow plus an explicit numeric rate. The rule this is an instance of has its own section below.

## Accessibility

Added 2026-08-04 by V7. This section is a promotion rather than an addition: the rule below was already here, under Motion, applying to one of the two properties it should always have applied to.

**Nothing in the game may be encoded in movement or colour alone.**

The reasoning is the direction's own. Every visual property carries simulation state, so a player who cannot perceive a property cannot read the state. That was accepted for motion on 2026-07-28 and the only reason it was not written for colour is that colour was decided first and never revisited.

**It is not an argument, it is a measurement.** V7 stage 1 simulated the three common colour vision deficiencies against real screenshots of the act screen. `reduced` and `oxidized`, which this document calls the single most important colour decision in the system, are 37.50 dE apart in normal vision, 17.35 under deuteranopia and **7.64 under protanopia, end to end**. The two states a player actually moves between during act 1 sit 3.21 apart, against a just-noticeable difference of 2.3. Around one in twelve boys in the classroom `docs/PILLARS.md` success condition 1 describes could not read the game's central teaching beat.

**The fix is redundant encoding, never replacement.** Colour stays and keeps being the fast channel. A second channel is added alongside so the information survives the loss of the first. Replacing colour with a pattern for everyone would make the game worse for the majority to serve a minority, which is the wrong trade and an avoidable one.

### The second channel for redox is a level

Illustration rule 3 gains a clause. The carrier's silhouette is filled `oxidized`, the reduced fraction of it is overlaid in `reduced`, and **the boundary between them is a hard ink rule whose height is the reading.** Position is the channel and ink is the contrast, and neither depends on hue.

The silhouette does not change. Both ends of the axis render exactly as they did before the channel existed, so a fully oxidized carrier is the flat `oxidized` blob and a fully reduced one is the flat `reduced` blob. What went is the interpolated mix in between, and **the level is the truer statement**: the pool holds real NAD+ and real NADH in a proportion, not one substance of intermediate colour.

A level gauge carries no signal at its own ends, so at exactly 0 and exactly 1 the rule sits on the outline and is invisible. Those two are told apart by the electron dots, which rule 3 already gives to NADH and denies to NAD+. **The level is load-bearing across the range and the dot count is load-bearing at the ends.**

### A semantic colour fills, ink writes

The palette is built so that ink reads on every semantic colour. That is what makes the badge contract work, and it is also why **a semantic colour cannot be the colour of text.**

Measured, and it is not a preference. Darkening `gain` far enough to read as micro text on white takes the ink word on the Sourced badge from 6.54:1 to 3.30:1. The same token cannot serve both jobs, so it does the one the palette was designed for.

    the top bar figures      were atp and substrate on the page ground,
                             2.00:1 and 2.05:1, the two worst ratios on the
                             screen and on the largest type in the game
    a pool card net rate     was gain or loss, 2.17:1 on the pink carrier card
    the unlock progress      was gain, 2.70:1 as micro text on white

All three are ink now, and none of them lost a channel: direction is carried by the sign character, and a threshold being reached is carried by the button below it becoming operable. This also settles a tension that had been in this document since the start. **Direction has said "illustration can be warm, numbers cannot" since 2026-07-28, and a coloured headline figure was warming a number.**

**`ink3` may not carry meaning at all.** It is 2.96:1 on white at full opacity, which is under the text floor on every surface in this palette, and 2.83:1 as a mark on cream, which is under the non-text floor too. It remains in the token block and nothing uses it. Its description above says "disabled, locked", and that is what it can no longer be trusted to say.

**Dimming compounds and has to be counted that way.** Locked content stays visible and dimmed, and at `opacity-55` that dim was destroying the three other channels carrying lockedness: a locked slot's title measured 3.85:1, its detail line 2.36:1 and its button label 1.65:1, which is under the floor for a decorative border. The dim is **0.85**, where the same three are 11.00, 4.51 and 4.51. The dashed border with no shadow still says locked at a glance, which is the point: lockedness never depended on the dim.

### The focus indicator is drawn inside

Added by V7 stage 3, and the shadow is the reason it is not outside. `4px 4px 0` is a solid ink copy of the shape down and to the right, so an outer ring is clean along the top and left edges and merges into the shadow along the other two, and an indicator visible on two sides of an element is not an indicator.

    3px solid ink, outline-offset -6px, on :focus-visible

Drawn inside, it sits on the element's own surface, is identical on all four sides, and never touches the shadow. It reads as deliberate because a second hard stroke inside the first is this system's own language, and nothing else draws an inner rule, so it cannot be confused with a state. Ink against the surfaces a focused control can sit on is 14.19:1 or better against a 3:1 requirement, and the negative offset is what makes those the adjacent colours rather than the element's own ink border, which is the mistake the browser default makes at 1.02:1.

Small controls take the ring outside instead, because 16px has no room for an inner rule and a pill carries no shadow for an outer one to collide with.

### What speech is told

Announce events, expose rates on demand, never narrate the tick.

This is a simulation whose numbers change twenty times a second, and a live region pointed at any of them produces continuous speech, which is worse than silence. The line to draw is the one the architecture already draws: React re-renders only on discrete events while the display samples per frame, and that third clock is the set of things worth saying out loud. **Act 1 contains sixteen of them end to end.**

One `aria-live="polite"` region, atomic, and nothing else on the screen carries `aria-live` at all. Rates are exposed as text and read on demand rather than announced, and the text is the same figure the reduced-motion path already renders rather than a second one, because a parallel readout drifts.

**An accessible name states the reading, not the legend.** The carrier's name was "One shape, and the colour is which one it is", which told a screen reader user that the colour means something and never what the colour currently was. It says the state. In bands rather than as a figure, because the picture carries a level and a level is read as roughly how full, and because **a number in an `aria-label` has nowhere to put a badge**, which would make it a quantitative claim with no provenance. Every number stays where a badge can reach it.

### How much of this is mechanism

`src/ui/__tests__/accessibility.test.ts`, the fifth guard in the project after the determinism lint, the `Needs source` release gate, the colour test and the divergence-row test.

Tested, because it is arithmetic: every rendered pair clears its WCAG 2.2 AA threshold, computed from the tokens in `index.css` and from the dim read out of `Card.tsx`, so a palette change fails the build rather than failing a user. No semantic colour is used as a text colour by either route, class or live style write. Every meaning in the channel table names a second channel and that channel is present in the build.

**Not tested, and deliberately not faked: whether a channel READS.** Whether an ink rule across a blob says "half the carrier is reduced" to somebody who has never seen the game is the same kind of question as whether the voice in `docs/CONTENT_STYLE.md` is right, and `contentStyle.test.ts` refuses to fake that one for the same reason. It needs a reader.

### What is in scope and what is not

`prefers-contrast` and `forced-colors` are in scope. `prefers-reduced-transparency` is not, because the design has no transparency to reduce.

## Screen inventory

No authentication. No accounts. No backend. docs/PILLARS.md rule 7 holds.

    Act screen          per act, the primary surface
    Timeline view       vertical scroll through deep time, second view
    Coach mark          overlay, the teaching unit
                        Three of them since V6. One automatic, two manual
    Teaching panel      overlay for concepts too long for a bubble
                        Built by V6. One panel, on the act 1 yield ceiling
    Unlock shelf        dashed slots, part of the act screen
    Offline return      what happened while away, with the event sequence
    Save management     export to file, import, backup recovery on failed parse
                        Built by V4 as a panel on the act screen, not a screen
    About               required disclosure text from docs/SCIENCE.md Part 1
                        Built by V6 as a panel, on the V4 precedent. Also the
                        permanent home of the first run
    First run           one card, three lines, over a running simulation
                        Added by V6. Not in the original inventory
    Endgame summary     what was built, the real timeline, sources, simplifications
    Sandbox             all unlocks, adjustable environment

The timeline is a second view, not the main screen. It answers "where am I and how much is left", which the act screens cannot, and it gives ATP a visible destination.

The offline return screen shows the event sequence, not just a total. docs/SIMULATION.md left this open. The piecewise steady state algorithm produces a genuine bounded event list, so showing it is both honest and instructive: it teaches that metabolism is homeostatic between shocks rather than smoothly accumulating.

**Save management is a panel, not a screen.** Decided 2026-07-31 by V4, which built it. Everything it has to say is a handful of lines and two buttons: whether storage is durable, how long the player was away, a recovery offer when the primary save failed to parse, export, and import. A dedicated screen for that is navigation the player has to find in order to be told something they mostly do not need to know, and the one time it matters, a corrupt save, is the one time it must not be behind a click. It uses Card, Button, Figure and Badge and introduces no new visual vocabulary.

Two things about it that are content rules rather than layout ones. The return line says the time away has been kept and not spent, and implies neither a reward nor a loss, because until offline progress exists neither is true. And it does not announce an absence shorter than a minute: a refresh is a positive delta of a second or two, and a panel that announces a non-event on every reload teaches the player to stop reading the one panel that has to be believed when something has actually gone wrong.

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

Stops, sourced against docs/SCIENCE.md Part 6 on 2026-07-29:

    Now                modern eukaryotic cell                     locked until completion
    ~1.7 to 1.5 Ga     early aerobic eukaryotes                   Sourced
    ~2.2 to 1.5 Ga     endosymbiosis, act 3                       Sourced, Contested
    ~2.4 to 2.0 Ga     Great Oxidation Event, act 2               Sourced
    no date            oxygenic photosynthesis                    Sourced, Contested
    ~3.48 to 3.43 Ga   microbial mats, act 1 start                Sourced
    no date            alkaline hydrothermal vents                Sourced, Contested

Four of those changed on sourcing and the changes are the point rather than housekeeping.

**The oxygenic photosynthesis stop loses its date and keeps its place.** The ~2.7 Ga figure came from biomarkers shown in 2015 to be younger contamination, and the precursor lipids were never diagnostic for cyanobacteria anyway. docs/SCIENCE.md Part 6 stop 3 recommends putting no number on it: place it below the GOE, state that oxygen production must predate atmospheric accumulation, and say plainly that when it started is unresolved. This is the one stop on the view that shows a live dispute instead of asserting a figure, so the card is designed around the absence. The date column reads `unresolved` in the same weight as a real date rather than being left blank, because a blank reads as missing data and this is a finding.

**The act 1 stop is relabeled.** Stromatolite morphology shows microbial mat construction and supports no physiological inference on its own, and any photosynthesis at 3.48 to 3.43 Ga was more plausibly anoxygenic. The stop is microbial mats and anoxygenic phototrophy, not oxygen production. Date confirmed against the Dresser and Strelley Pool formations.

**The vent stop is a hypothesis, not an event.** It is on the timeline because it is a proposal about where chemiosmosis came from, which is the act 3 teaching beat. Its date column reads `hypothesis`. Two separate uncertainties, the timing of the origin of life and the mechanism itself, were being compressed into one number, and the view should not compress them.

**The GOE stop keeps banded iron as its figure and moves the number onto the card.** Banded iron does not cleanly mark the GOE: peak deposition is roughly 2.5 Ga, just before atmospheric oxygenation, and deposition runs on to roughly 1.85 Ga. The alternative visual, the redox-sensitive detrital mineral record, is the cleaner marker and is close to undrawable as a cartoon figure. So the figure is the banded iron formation, whose striped silhouette reads at card size, and the card states the peak explicitly as the immediate pre-GOE maximum while the date column carries the GOE range itself. Figure and label carry different facts and the label is where the honesty lives.

**The eukaryote stop is reframed from morphology to metabolism.** "First accepted eukaryote fossils" got on the timeline for cells looking a certain way, which the admission rule below rules out. The same fossils, roughly 1.75 to 1.4 Ga, are almost entirely restricted to oxygenated bottom waters. Early eukaryotes were benthic aerobes. Lead with the oxygen dependency and the stop passes on its own terms, and closes a game about acquiring aerobic respiration on a metabolic note.

**The rule that keeps this from becoming an evolution game: a figure earns its place by its metabolism, not its morphology.** Microbial mats qualify because mat construction is metabolic behaviour, though note that the mats themselves are morphology and it is the anoxygenic phototrophy on the card that earns the place. Banded iron formations qualify because they are the physical record of biologically produced oxygen meeting dissolved iron. Cyanobacteria qualify because they made the oxygen that nearly kills the player in act 2. Nothing goes on the timeline for being an interesting looking animal. Applying this rule keeps docs/PILLARS.md intact as the feature grows, and applying it in 2026-07-29's sourcing pass is what moved the eukaryote stop off morphology.

**The axis is non-linear and must say so.** All four acts sit between roughly 4.0 and 1.5 Ga, so a linear axis would spend most of its length on eras containing no gameplay. The axis is therefore weighted to the Precambrian. That misrepresents deep time, so the compression is disclosed on the view itself, in the same way and for the same reason that tuned reaction rates are disclosed. Silent compression of a real timescale is exactly the failure mode this project exists to avoid.

Every stop on this view now traces to docs/SCIENCE.md Part 6. No `Needs source` badge survives here. Two of the seven carry no date at all, which is a sourcing result rather than a gap, and the view has to render an absent date as deliberately as it renders a present one.

## What survived contact

Added 2026-07-29, after V3 built the act 1 screen. This document had never met a running simulation before. Most of it held. The parts that did not are the valuable half of this section and they are listed last rather than softened.

### Implemented, and it works

- **The colour tokens, the type scale and the spacing, border, radius and shadow rules.** All emitted verbatim into `src/index.css`. A test parses the Colour section of this document and fails the build if `index.css` defines a colour this file does not name, or names one at a different value. This document is now the source of record by mechanism.
- **Tabular figures.** Every number goes through one `Figure` component that applies the declaration itself, and a lint rule bans number formatting everywhere else. Not optional is now not possible.
- **The badge contract, and the `Needs source` release gate.** Open question 6 is closed. See below.
- **Illustration rules 1 to 3.** Sides equal carbons, phosphate dots are countable, redox is saturation. All three are derived from the conserved-weight table in the content layer rather than drawn, so a stoichiometry change moves the picture. Asserted as a property over the pool table.
- **Flux is the headline, stock is the subscript.** Applied to the top bar and every pool card. It reads well and it should not be reversed.
- **Motion as rate.** Dashes flow at a speed proportional to applied flux, and below a threshold the arrow changes treatment outright rather than slowing asymptotically. A stopped reaction looks stopped.
- **The reduced-motion obligation.** Reduced motion swaps flowing dashes for a static arrow plus an explicit numeric rate, and the walled state remains fully readable with all animation off.
- **The hard offset shadow and the no-gradient rule.** Both are tests now, not paragraphs.

### Deferred, deliberately

Illustration rules 4 to 6, because act 1 has no enzyme objects, no damage and no ROS. The beast. The timeline view. The teaching panel. Every screen in the inventory other than the act screen. All of these are out of V3's scope by its own Decisions section.

**Two of those came back in V6.** The teaching panel is built and the about screen is built, as a panel on the V4 precedent. The beast, the timeline, the endgame summary, the offline return and the sandbox are still deferred.

### What V6 found, 2026-08-04

- **This document specified a teaching panel for six days short of a year of build logs and nothing had ever built one, because the ceiling that forces it had never bound.** One coach mark cannot exceed a two-paragraph limit. The limit was real and untested at the same time, which is the condition every rule in this file is in until something loads it.
- **"A coach mark without a source row does not ship" was discipline, not mechanism, and had never been checked.** It is a test now, and the test resolves the row against docs/SCIENCE.md's actual headings rather than against a list, so a source row naming a Part that does not exist fails the build.
- **The illustration rules were teaching nobody.** Rules 1 to 3 have been implemented and derived from the conserved-weight table since V3, and this document's own argument for rule 1 turns on the player being told once what a side means. Nothing had told them. Building the picture correctly and never mentioning it is a failure mode this section should name: **an encoding nobody is told about is a decoration.**
- **The wordmark was hardcoded in `TopBar.tsx` and the guard found it, not the audit that went looking for hardcoded strings.** It is the string in this game most likely to change, since open question 1 is still open, and it now lives with every other player-facing string.

### What turned out to be wrong

- **Two dots on a blob read as a face.** Rules 2 and 3 give NADH two electron dots and ATP three phosphate dots, and the obvious layouts of both, a pair in the upper half and a row across the middle, produced little characters with eyes. That collides directly with rule 6, which reserves faces for ROS, and with the beast. Fixed by moving electrons to the upper-right edge and laying phosphates out as a diagonal chain. **The chain is better than the row on biological grounds too**, since ATP's phosphates are a chain and hydrolysis removes the terminal one, so a row was quietly saying they are interchangeable. This document should say where dots go, not just how many.
- ~~**"Colour leaving" is ambiguous, and as written it is backwards.**~~ **Corrected 2026-08-04 by V7**, in the Colour section, where the sentence now says colour arrives and says why the old one was kept on the page rather than quietly deleted. It stood wrong for two logs because nothing depended on it. What forced the fix is that V7 had to describe the axis correctly in order to build a second channel for it, which is worth noting as a pattern: **a wrong sentence in a specification survives until something is built on top of it.**
- **The wordmark scale does not fit a persistent top bar.** 60 to 104px is a hero scale. On an act screen carrying eight pool cards, a pathway and an unlock shelf it takes a permanent 100px band for a word that never changes, and it was the largest thing on screen at all times. Implemented as specified and recorded as wrong.
- **A coach mark cannot live inside the left rail.** The rail is 17rem. Rendered inline the mark came out at about twenty characters a line, against this document's own "comfortable in prose at 64ch". It is an overlay in the screen inventory and it has to actually be one, positioned out of its column.
- **`Needs source` yellow is not in the palette, and should not be.** The badge contract asks for yellow and the Colour section has none. That is correct rather than an omission: the state is development-only, it must never reach a release build, and a colour that is deliberately outside the token set is the right way to make it look alien. It is hardcoded in the component. This document should say so.
- **Nothing here covers the empty screen.** The biggest finding from playing it is not a visual rule at all. Once act 1 is solved, every net rate on the screen sits at exactly 0.00 and stays there, because a metabolic steady state is genuinely steady. This document specifies how to render change and says nothing about how to render a system at equilibrium, which is the state the player spends most of their time in. See NOW.md.

## Open questions

1. **Working title.** docs/BRIEF.md still says TBD and no naming shortlist file exists. "krebs" names an Act 3 mechanic that unlocks roughly four hours in, and the first 45 to 90 minutes are anaerobic glycolysis where the Krebs cycle does not exist. The wordmark is drawn as `krebs` on that assumption.
2. ~~**Act 2 has no Fe-S target in the core pathway.**~~ Closed 2026-07-29. docs/SCIENCE.md Part 3 sourced it and docs/PROGRESSION.md act 2 now carries the result. The answer is not the one the mockups assumed: the target inside the player's own pathway is GAPDH by thiol oxidation, not an iron-sulfur enzyme, because glycolysis has none. The mockups' PFOR and ferredoxin damage is still correct for the pyruvate disposal chain and still routes the crisis back into NAD+ recycling, so the visual holds. What changes is that damage now has two mechanisms with different defenses, and the damage state on the beast and on the enzyme cards has to distinguish them. That is a V-something interface problem, not an open question.
3. ~~**Cross-document paths are broken.**~~ Closed 2026-07-29, as stale rather than as fixed. The entry claimed the documents sit at the repository root while every reference points at `docs/`. They are in `docs/`, and were for the whole time this entry claimed otherwise. `docs/SCIENCE.md`, `docs/SIMULATION.md`, `docs/PROGRESSION.md`, `docs/PILLARS.md`, `docs/BRIEF.md`, `docs/SAVE_SCHEMA.md` and `docs/IDEAS.md` all resolve. `DESIGN.md` and `NOW.md` are at the root deliberately and every reference to them says so. There were no dead references to fix.
4. **Berkeley Mono is not used.** An earlier direction proposed it. The cartoon direction has no monospace role, since Nunito with tabular figures covers numeric display. Revisit only if a code or terminal surface appears.
5. **Two timeline stops have no date and the view has no component for that.** Closed as a sourcing question on 2026-07-29, reopened as a smaller design one. All five previously unsourced dates now trace to docs/SCIENCE.md Part 6, and no stop carries `Needs source`. But sourcing killed two dates rather than supplying them: oxygenic photosynthesis is unresolved and the vent stop is a hypothesis rather than a dated event. The date column is currently specified as a date. It needs a second treatment for `unresolved` and `hypothesis` that reads as a deliberate statement at the same visual weight, not as a missing value, and the non-linear axis has to place an undated stop by ordering constraint alone. Not yet designed.
6. ~~**The release gate for `Needs source` does not exist.**~~ Closed 2026-07-29 by mechanism, in V3 stage 3, before any content was authored as this entry asked. `vite/needsSourceGate.ts` is a Vite plugin that scans the emitted production bundle for the discriminant literal and fails the build with a non-zero exit code. It scans the artifact rather than the source, so it sees every route into the badge regardless of which file it came from, and it cannot be skipped because it is part of the build. `Badge.tsx` never writes that literal outside a type, and the branch that renders the badge sits behind `import.meta.env.DEV` so production drops it as dead code, which is what makes a clean repository pass. Proved by planting a probe, quoting the failure and removing it.

7. **The screen has no treatment for a system at steady state.** Opened 2026-07-29 by V3's play session, and it is now the largest open visual question. Once act 1 is solved, every pool sits at its equilibrium and every net rate on the screen reads exactly 0.00 for minutes at a time. That is correct simulation and correct display, and it is also a screen with nothing happening on it. Flux-is-the-headline was designed for a system that is changing. A steady state needs its own reading, something that distinguishes "holding at a high rate" from "stopped", because right now the pool cards show the same 0.00 for both and only the pathway arrows tell them apart.

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
| 2026-07-29 | GOE stop keeps banded iron, with the peak labelled as pre-GOE maximum | docs/SCIENCE.md Part 6 stop 4 offers two options. Banded iron peaks at roughly 2.5 Ga, just before oxygenation, and runs on to roughly 1.85 Ga, so it does not mark the event. The cleaner marker, the redox-sensitive detrital mineral record, has no legible cartoon silhouette. Banded iron has an unmistakable striped one. Keep the figure, put the correction on the card. |
| 2026-07-29 | Two timeline stops ship with no date | The 2.7 Ga oxygenic photosynthesis figure failed on contamination and the vent stop is a hypothesis about mechanism, not a dated event. Asserting a number to fill the column is the exact failure mode this project exists to avoid. An absent date is a finding and gets rendered as one. |
| 2026-07-29 | Eukaryote stop reframed to early aerobic eukaryotes | It was on the timeline for cell morphology, which the metabolism-not-morphology rule forbids. The same fossils are restricted to oxygenated bottom waters, so the metabolic framing was available and is a better closing beat. |
| 2026-07-29 | Fonts are self-hosted woff2, not linked | CLAUDE.md forbids a network dependency for core play and first paint is core play. A Google Fonts link is a dependency on DNS, a CDN and a third party staying free. Costs 68.86 kB. |
| 2026-07-29 | The colour tokens are asserted against this document by a test | A token that exists because a component wanted it is how a design system becomes a suggestion. The test parses the Colour section and fails on any colour index.css adds, omits or changes. |
| 2026-07-29 | Every figure carries a badge as a required prop | This document said an unsourced number should look visibly broken. A required prop is stronger: it does not compile. `badgeDisplay: 'attached'` lets a card or column header show one badge for several figures without weakening the type. |
| 2026-07-29 | The release gate scans the emitted bundle, not the source | A render-time throw only fires if the component renders, so a badge on a rarely-opened panel ships. A source scan misses whatever the globs miss and only runs when someone runs tests. The bundle is what actually ships. |
| 2026-07-29 | `Needs source` yellow is deliberately not a design token | It is development-only and must never reach a release build, so it has no business in the shipping palette. Hardcoded in the component, and it should look alien. |
| 2026-07-29 | Illustration geometry is derived from conserved weights, never drawn | "Every visual property carries simulation state" becomes a dependency in the code rather than a claim in a document. A stoichiometry change moves the picture in the same commit. |
| 2026-07-29 | Phosphate dots are a diagonal chain, electron dots sit on the edge | Both obvious layouts produced blobs with faces, which collides with rule 6 reserving faces for ROS. The chain is also biologically right: ATP's phosphates are a chain and hydrolysis takes the terminal one. |
| 2026-07-29 | Zero flux changes the arrow's treatment rather than its speed | A dash animation that asymptotically slows reads as "working slowly" when the truth is "stopped", and stopped is the walled state. Misreading it breaks act 1's teaching beat before the player reaches it. |
| 2026-07-29 | Reduced motion dims a stopped arrow as well as stating its rate | Colour is not motion, so it costs a reduced-motion player nothing. Without it the reduced path carried the same reading minus the obvious part. |
| 2026-07-29 | The coach mark is an overlay, positioned out of its column | The left rail is 17rem and the mark rendered inline at about twenty characters a line, against this document's own 64ch prose rule. The screen inventory already called it an overlay. |
| 2026-07-31 | Measured session values are exempt from the badge contract | The contract governs claims about biology and about the game's own tuning. Time away traces to the system clock, has no document to cite and owes no divergence row, so a badge on it would imply provenance is an open question about it. Declared at the call site through `Figure`'s `measured` prop, so exactly one of `badge` or `measured` is still required. No fourth pill was added. |
| 2026-07-31 | The exemption stops at the simulation | Pool amounts and elapsed game time stay badged. A pool amount is the output of a model whose rates are tuned, and game time's badge is a claim about its mapping to real time, which docs/SCIENCE.md Part 1 says does not exist. Only the player's own session is exempt. |
| 2026-07-31 | Save management is a panel on the act screen, not its own screen | Everything it says is a few lines and two buttons, and the one case that matters, a corrupt save, must not be behind a click. |
| 2026-08-04 | The teaching panel is built, and its subject was read out of docs/SCIENCE.md rather than chosen | Part 2 contains two direct orders to the interface: that the net figure "is worth surfacing in-game because the gross figure of 4 is a common point of confusion", and that framing fermentation as an energy pathway "is a common misconception and the game should correct it directly". Three logs shipped interface without discharging either. That turned "which concept goes in the panel" from a judgement into a reading. |
| 2026-08-04 | COACH_MARK_TRIGGER stays `'auto'`, and the entry stays open | **Not a reader decision, because V6 found no readers.** V6 stage 5 was built to take this choice away from the person who built it and could not run. Re-deciding it would hand the choice back to the least reliable possible reader and then close the entry as settled, which is worse than leaving it. The argument did move slightly: the teaching panel now explains the stall too, so under `'manual'` there are two routes rather than one, but both are 16px info affordances and NOW.md's objection was about the affordance rather than the count. |
| 2026-08-04 | Only a mark with a simulation event behind it may be automatic | The NAD+ mark fires on the wall. The other two have no moment worth interrupting, and a bubble that opens whenever a condition happens to be true is nagging rather than teaching. Manual by construction rather than by the trigger constant, so V6's undecided trigger question keeps the scope it always had. |
| 2026-08-04 | An overlay does not dim unless what is behind it is not what the player is looking at | The first run floats over a lit, clickable, still-ticking act screen, because an idle game that pauses for its own introduction has told the player it pauses. The about panel and the teaching panel dim, because they are opened deliberately and read. |
| 2026-08-04 | The disclosure moved off the act screen into the two surfaces docs/SCIENCE.md actually asks for | Part 1 requires it "in the about screen and on first launch". V3 had neither surface and used a permanent footer as a substitute, which meets "on first launch" only in the sense that it also meets every other launch. Both halves are now met literally, and the copy moved rather than duplicating: the same 350 characters in three places is three places to drift. A test parses the blockquote out of docs/SCIENCE.md and fails if the game disagrees with it. |
| 2026-08-04 | Illustration rules 1 to 3 say what they encode, on the shape itself | DESIGN.md's argument for rule 1 is that a player told ONCE that a six-sided blob has six carbons can read the whole pathway afterwards. Nothing had ever told them, so the design's central claim was being made to nobody. Every blob now carries a readout composed from the same conserved-weight table the geometry is drawn from, as an `aria-label` and a `<title>`. It is a hover affordance, so it is unreachable by touch and by keyboard, which is the next log's problem. |
| 2026-07-31 | The return line never announces an absence shorter than a minute | A refresh is a positive offline delta, so the panel announced "Away for 0 min" on every reload. True, and noise. A panel that cries wolf on every reload will not be believed on the day it says something went wrong. |
| 2026-08-04 | Nothing may be encoded in movement **or colour** alone, and it is its own section rather than a clause under Motion | Not an argument, a measurement. V7 stage 1 simulated the three common colour vision deficiencies on real screenshots: the `reduced` to `oxidized` axis is 37.50 dE end to end in normal vision and **7.64 under protanopia**, with the two states act 1 moves between 3.21 apart against a just-noticeable difference of 2.3. The rule was already accepted for motion in 2026-07-28 and the only reason it was not written for colour is that colour was decided first and never revisited. |
| 2026-08-04 | The second channel for redox is a level with a hard ink rule, not a texture and not the electron dots | The dots were the strongest candidate and lost on chemistry: NADH carries two electrons as a hydride and there is no carrier holding one, so quantising a continuous fraction to zero, one and two would draw a species that does not exist. A level is continuous, derived, and **truer than the mix it replaces**, because the pool holds real NAD+ and real NADH in a proportion rather than one substance of intermediate colour. Texture lost on legibility at 54px and on introducing vocabulary this system does not have. |
| 2026-08-04 | A semantic colour fills, and ink writes | The palette is built so ink reads on every semantic colour, which is what makes the badge contract work, and a colour with that property cannot also read as text on a pale surface. Measured: darkening `gain` far enough to read as micro text takes the ink word on the Sourced badge from 6.54:1 to 3.30:1. One token cannot do both jobs, so it does the one it was designed for. This also settles Direction's own "illustration can be warm, numbers cannot", which a coloured headline figure had been contradicting since V3. |
| 2026-08-04 | The locked-slot dim is 0.85, not 0.55 | Dimming compounds with whatever it dims. At 0.55 a locked slot's title was 3.85:1, its detail 2.36:1 and its button label 1.65:1, which is under the floor for a decorative border let alone for text, so the dim was destroying the three other channels carrying lockedness. The dashed border with no shadow still says locked at a glance, which is the point: lockedness never depended on the dim. |
| 2026-08-04 | The focus indicator is drawn INSIDE the element | The hard offset shadow is a solid ink copy of the shape down and to the right, so an outer ring is clean on two edges and merges into the shadow on the other two. An indicator visible on two sides is not an indicator. Drawn inside it is identical on all four sides, never touches the shadow, and reads as this system's own language rather than as a browser default. The browser default measured 1.02:1 against the ink border it was drawn on. |
| 2026-08-04 | Speech announces events, exposes rates on demand, and never narrates the tick | The line is the one the architecture already draws between the three clocks. Act 1 contains sixteen events end to end, against roughly 74000 ticks, and a live region pointed at a rate would make the game unusable rather than accessible. The rates a screen reader reads are the same figures the reduced-motion path renders, not a parallel set, because a parallel set drifts. |
