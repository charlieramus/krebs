/**
 * The molecule illustration set. DESIGN.md, Illustration language.
 *
 * ---------------------------------------------------------------------------
 * THE GEOMETRY IS DERIVED, NOT DRAWN
 * ---------------------------------------------------------------------------
 *
 * A blob is handed a carbon weight and a phosphate weight and draws itself.
 * Those weights come from the conserved-quantity table in
 * src/content/act1/pools.ts, which is the same table the conservation test
 * asserts against, so "every visual property carries simulation state" is a
 * dependency in the code rather than a claim in a document. Change glucose from
 * six carbons to five and the picture changes with it, in the same commit,
 * without anyone remembering to edit an SVG.
 *
 * There is no path data anywhere in this file. There are no hand-authored
 * shapes at all.
 *
 * DESIGN.md's rules, in its priority order:
 *
 *   1. Sides equal carbons. Glucose is six-sided, pyruvate is three-sided, and
 *      when one six splits into two threes the arithmetic is visible.
 *   2. Phosphate dots are countable. ATP carries three, ADP two, free phosphate
 *      one, so ATP = ADP + Pi is a thing you can see rather than read.
 *   3. Redox is saturation, not hue. NAD+ and NADH are the same silhouette; only
 *      the fill moves, between `oxidized` and `reduced`.
 *
 * Rules 4 to 6 are out of scope for V3. There are no enzyme objects, no damage
 * and no ROS until act 2.
 *
 * ---------------------------------------------------------------------------
 * RULE 3 HAS A SECOND CHANNEL AND IT IS A LEVEL. UPDATELOGV7.md stage 2.
 * ---------------------------------------------------------------------------
 *
 * Saturation alone does not survive a colour vision deficiency. Stage 1
 * measured it against the shipped tokens: `oxidized` and `reduced` are 37.50 dE
 * apart in normal vision and 7.64 apart under protanopia, and the two states a
 * player actually moves between during act 1 sit 3.21 apart, against a
 * just-noticeable difference of 2.3. The single most important colour decision
 * in the system is, for one reader in twelve, not a decision at all.
 *
 * So the carrier is drawn as a LEVEL. The silhouette is filled with `oxidized`,
 * the reduced fraction of it is overlaid in `reduced`, and the boundary between
 * them is a hard ink rule whose HEIGHT is the reading. Position is the channel,
 * ink is the contrast, and neither depends on hue.
 *
 * Three things this does not do, all of them deliberate:
 *
 *   - It does not touch the silhouette. DESIGN.md is emphatic that NAD+ and
 *     NADH being the same shape is the whole point, so the outline, the wobble
 *     and the path data are byte-identical to what they were.
 *   - It does not replace colour. At a reduced fraction of 0 the blob is
 *     entirely `oxidized` and at 1 it is entirely `reduced`, which is pixel for
 *     pixel what shipped before, so a player who reads colour keeps the fast
 *     channel V3 measured at three seconds ahead of the numbers.
 *   - It does not draw a gradient. DESIGN.md forbids one and this is two flat
 *     fills with a line between them. What it replaces, an interpolated mix
 *     between the two tokens, was the thing closer to a gradient.
 *
 * AND IT IS A MORE HONEST ENCODING THAN THE ONE IT REPLACES, which is the part
 * worth arguing rather than asserting. A pool that is 56 percent reduced does
 * not contain a substance of intermediate colour. It contains real NAD+ and
 * real NADH, in that proportion, which is exactly what the simulation holds in
 * two separate pool amounts. A mix says the carrier is somewhat reduced. A
 * level says 56 percent of the carriers are reduced. The second is the model.
 *
 * ---------------------------------------------------------------------------
 * NOTHING GEOMETRICALLY PERFECT
 * ---------------------------------------------------------------------------
 *
 * A regular hexagon reads as a diagram and the whole direction is that it should
 * not. Every vertex is displaced in both angle and radius by a deterministic
 * hash of the shape's seed, so each molecule has its own permanent wobble and
 * no molecule is a textbook figure. Deterministic rather than random because a
 * blob that reshuffles on every render is a distraction, and because this is
 * the interface: it is exempt from the determinism guard by the carve-out in
 * eslint.config.js, but the reasoning behind that guard still applies to
 * anything a player looks at twice.
 */

import { useId, type Ref } from 'react';

/** DESIGN.md: stroke-width 3 to 3.5, stroke-linejoin round. */
const STROKE_WIDTH = 3.25;

/**
 * The redox level rule. Thinner than the silhouette's 3.25 on purpose: it has
 * to read as a mark ON the shape rather than as part of its edge. DESIGN.md's
 * pill weight, which is the system's existing value for a lighter stroke.
 */
const LEVEL_STROKE_WIDTH = 2;

/**
 * How far a vertex may wander, as a fraction of the radius and of the arc.
 *
 * Raised from 0.13 and 0.11 after looking at the rail in a browser: at those
 * values a six-sided glucose still read as a neat hexagon, which is the one
 * thing DESIGN.md says it must not do. At these values it reads as drawn.
 */
const RADIUS_WOBBLE = 0.19;
const ANGLE_WOBBLE = 0.16;

/**
 * Deterministic signed noise in [-1, 1). An integer hash, not a PRNG, so the
 * same vertex of the same shape is displaced the same way forever.
 */
function wobble(seed: number, index: number, salt: number): number {
  let h = (Math.imul(seed + 1, 374761393) + Math.imul(index + 1, 668265263) + salt) | 0;
  h = (h ^ (h >>> 13)) | 0;
  h = Math.imul(h, 1274126177);
  h = (h ^ (h >>> 16)) >>> 0;
  return (h / 0x100000000) * 2 - 1;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * An irregular n-sided polygon, as a closed path with exactly n straight edges.
 *
 * Straight edges rather than curves, deliberately. The thick round-joined stroke
 * already gives the chunky sticker read, and a countable number of edges is what
 * lets illustration.test.ts assert side count against carbon weight by reading
 * the geometry rather than by trusting an attribute the component wrote about
 * itself.
 */
function polygonPath(sides: number, radius: number, centre: number, seed: number): string {
  const points: string[] = [];
  for (let i = 0; i < sides; i += 1) {
    const step = (Math.PI * 2) / sides;
    // Start at the top so a hexagon sits on a flat-ish base rather than a point.
    const angle = -Math.PI / 2 + step * i + wobble(seed, i, 17) * ANGLE_WOBBLE * step;
    const r = radius * (1 + wobble(seed, i, 91) * RADIUS_WOBBLE);
    points.push(`${round(centre + Math.cos(angle) * r)} ${round(centre + Math.sin(angle) * r)}`);
  }
  return `M ${points.join(' L ')} Z`;
}

/**
 * The carrier silhouette, for pools with no carbon skeleton.
 *
 * NAD+, NADH, ATP, ADP and free phosphate all carry a carbon weight of zero in
 * act 1's table, because act 1 never cleaves below a triose and the carriers are
 * modeled as carriers rather than as molecules with skeletons. Drawing them as
 * zero-sided polygons would be nonsense, so they get a shape of their own: a
 * closed blob of four cubic curves, wobbled the same way.
 *
 * This is also what makes rule 3 work. NAD+ and NADH are the same call to this
 * function with the same seed, so they are the same silhouette to the pixel, and
 * only the fill distinguishes them.
 */
function carrierPath(radius: number, centre: number, seed: number): string {
  const r = (i: number): number => radius * (1 + wobble(seed, i, 53) * RADIUS_WOBBLE);
  const top = centre - r(0);
  const right = centre + r(1) * 1.05;
  const bottom = centre + r(2);
  const left = centre - r(3) * 1.05;
  const k = radius * 0.62;
  return (
    `M ${round(centre)} ${round(top)} ` +
    `C ${round(centre + k)} ${round(top)} ${round(right)} ${round(centre - k)} ${round(right)} ${round(centre)} ` +
    `C ${round(right)} ${round(centre + k)} ${round(centre + k)} ${round(bottom)} ${round(centre)} ${round(bottom)} ` +
    `C ${round(centre - k)} ${round(bottom)} ${round(left)} ${round(centre + k)} ${round(left)} ${round(centre)} ` +
    `C ${round(left)} ${round(centre - k)} ${round(centre - k)} ${round(top)} ${round(centre)} ${round(top)} Z`
  );
}

export interface RedoxExtent {
  /** The y of the crown of the shape. A reduced fraction of 1 lands here. */
  readonly top: number;
  /** The y of the underside. A reduced fraction of 0 lands here. */
  readonly bottom: number;
}

/**
 * The vertical extent of a carrier silhouette, as `carrierPath` actually draws
 * it rather than as a bounding box guess.
 *
 * The two numbers are the same `top` and `bottom` that function computes, from
 * the same wobble, so a level at `bottom` sits exactly on the underside of the
 * shape and a level at `top` sits exactly on its crown. That is what makes a
 * reduced fraction of 0 and of 1 render identically to the flat fills that
 * shipped before this channel existed, rather than nearly so.
 */
export function redoxExtent(size: number, seed: number): RedoxExtent {
  const centre = size / 2;
  const radius = size * 0.36;
  const r = (i: number): number => radius * (1 + wobble(seed, i, 53) * RADIUS_WOBBLE);
  return { top: centre - r(0), bottom: centre + r(2) };
}

/**
 * Where the level sits for a given reduced fraction. THE MAPPING, and the only
 * one: both the render and the per-frame update go through here, so there is no
 * second copy of it to drift.
 *
 * Linear in the fraction, and monotonic by construction. Exported because
 * illustration.test.ts asserts it across the range rather than at two
 * hand-picked points, which is what stage 2 of UPDATELOGV7.md asks for and what
 * separates a channel that carries a quantity from one that carries two states.
 */
export function redoxLevelY(extent: RedoxExtent, fraction: number): number {
  const f = Math.min(1, Math.max(0, Number.isFinite(fraction) ? fraction : 0));
  // Written as a weighted sum rather than as `bottom - (bottom - top) * f`,
  // which is the same line and lands three ulps short of `top` at f = 1. The
  // rounding to hundredths below would hide that, and the claim being made is
  // that a fully reduced carrier is IDENTICAL to the flat blob that shipped
  // before this channel existed, not nearly identical. This form makes both
  // ends exact.
  return extent.top * f + extent.bottom * (1 - f);
}

/**
 * Move a blob's redox level to a reduced fraction, writing straight to the DOM.
 *
 * WHY THE COMPONENT DOES NOT DO THIS ITSELF. The reduced fraction changes twenty
 * times a second and React never re-renders at tick rate, so the caller holds a
 * ref and drives the level from the snapshot, exactly as it already drives the
 * arrow phase and every figure on the screen. What the caller must NOT have is
 * the geometry: which y a fraction maps to is a fact about how this file draws a
 * carrier, and it stays in this file. The caller passes a fraction and nothing
 * else.
 *
 * The extent is read back off the group rather than recomputed, so the numbers
 * used here are the numbers the markup was drawn from and cannot disagree with
 * them.
 */
export function setRedoxLevel(group: SVGGElement, fraction: number): void {
  const top = Number(group.dataset.top);
  const bottom = Number(group.dataset.bottom);
  if (!Number.isFinite(top) || !Number.isFinite(bottom)) return;

  // Quantised to a thousandth and compared as an integer before anything is
  // written, so a settled pool costs nothing per frame. Same reason and same
  // shape as the electron opacity below. Also keeps this off toFixed, which the
  // tabular-figures lint rule bans outside Figure and is right to: a clip
  // boundary is not a number anybody reads.
  const step = Math.round(Math.min(1, Math.max(0, Number.isFinite(fraction) ? fraction : 0)) * 1000);
  if (group.dataset.reduced === `${step}`) return;
  group.dataset.reduced = `${step}`;

  const y = round(redoxLevelY({ top, bottom }, step / 1000));
  group.querySelector('[data-role="redox-clip"]')?.setAttribute('y', `${y}`);
  const rule = group.querySelector('[data-role="redox-level"]');
  rule?.setAttribute('y1', `${y}`);
  rule?.setAttribute('y2', `${y}`);
}

export interface BlobProps {
  /** Conserved carbon weight. Becomes the side count. Zero means a carrier. */
  carbon: number;
  /** Conserved phosphate weight. Becomes the dot count. */
  phosphate: number;
  /** Flat fill. A semantic colour, never a surface, because fill carries state. */
  fill: string;
  /** Pixel size of the square viewport. */
  size?: number;
  /** Fixes the wobble. Same seed means the same silhouette, forever. */
  seed?: number;
  /**
   * Electron dots, DESIGN.md rule 3: "NADH is `reduced` with two electron dots.
   * NAD+ is `oxidized` and empty." Distinct from phosphate dots and drawn
   * differently, because they count a different thing.
   */
  electrons?: number;
  /**
   * What this blob says about itself. A blob carrying state is content, not
   * decoration, so it is the accessible name AND a `<title>`, which is what
   * makes it a native tooltip on hover.
   *
   * DESIGN.md's illustration rules put real information in the geometry and
   * until UPDATELOGV6.md stage 4 nothing told the player it was there. Composed
   * in src/ui/content.ts from the conserved-weight table, never here: this file
   * draws the shape and does not get to decide what the shape means.
   */
  label: string;
  /**
   * The accessible name, when it differs from the hover readout.
   * UPDATELOGV7.md stage 4.
   *
   * WHY THE TWO CAN DIFFER, AND WHY ONLY HERE. `label` explains the ENCODING,
   * which is what a sighted pointer user needs when they ask a shape what it
   * means. A screen reader user needs the READING: not that colour and level
   * say which carrier this is, but which carrier it currently is. For every
   * other blob those are the same sentence, because the encoding is geometry
   * and the geometry is the state, so only the carrier passes this.
   *
   * `aria-label` wins over `<title>` for assistive technology, so passing this
   * replaces the name and leaves the tooltip alone.
   */
  stateLabel?: string;
  /** Handle on the SVG, so a caller can drive `stateLabel` from the snapshot. */
  rootRef?: Ref<SVGSVGElement>;
  className?: string;
  /**
   * Handle on the silhouette, so a caller can drive its fill from the snapshot
   * at frame rate. Rule 3 needs this: the carrier's saturation is simulation
   * state and simulation state does not go through React.
   */
  pathRef?: Ref<SVGPathElement>;
  /** Handle on the electron dots, for the same reason. */
  electronsRef?: Ref<SVGGElement>;
  /**
   * Rule 3's second channel. See the header note.
   *
   * The fill for the reduced end of the axis. `fill` is the oxidized end and
   * stays the base of the shape, so passing this adds a level over the existing
   * blob rather than changing what the existing blob is. Only the carrier card
   * passes it: no other pool in act 1 has a redox state to carry.
   */
  reducedFill?: string;
  /**
   * Handle on the level, so the caller can drive it from the snapshot at frame
   * rate through `setRedoxLevel`. Without it the level renders at fully
   * oxidized and never moves, which is the correct static state rather than a
   * broken one.
   */
  levelRef?: Ref<SVGGElement>;
}

export function Blob({
  carbon,
  phosphate,
  fill,
  size = 46,
  seed = 1,
  electrons = 0,
  label,
  stateLabel,
  rootRef,
  className = '',
  pathRef,
  electronsRef,
  reducedFill,
  levelRef,
}: BlobProps) {
  const centre = size / 2;
  const radius = size * 0.36;
  const isCarrier = carbon === 0;

  const silhouette = isCarrier
    ? carrierPath(radius, centre, seed)
    : polygonPath(carbon, radius, centre, seed);

  // Unique per instance, because two carrier blobs on one page must not share a
  // clip. Stripped of the colons React puts in its ids, which are legal in an
  // id and a nuisance in every tool that reads one.
  const clipId = `redox-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const extent = redoxExtent(size, seed);

  return (
    <svg
      ref={rootRef}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role="img"
      aria-label={stateLabel ?? label}
    >
      {/* The hover readout. `aria-label` already names it for assistive
          technology and wins over `<title>` there, so this is purely the
          pointer affordance: the one way a sighted player can ask a shape what
          it encodes without a legend panel nobody opens. */}
      <title>{label}</title>
      <path
        ref={pathRef}
        // The role attribute is what illustration.test.ts keys off. The test
        // counts the geometry in `d` rather than trusting a side-count
        // attribute, so this only says which kind of shape it is.
        data-role={isCarrier ? 'carrier' : 'silhouette'}
        d={silhouette}
        fill={fill}
        stroke="var(--color-ink)"
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Rule 3's second channel, drawn between the base fill and the dots so
          it sits inside the shape rather than over its outline. The extent
          travels on the group because setRedoxLevel needs it and must not
          recompute it. Rendered at fully oxidized, which is a level flush with
          the underside of the blob and therefore invisible: a carrier nobody is
          driving looks exactly like one with no NADH in it, which is what it
          is. */}
      {reducedFill === undefined ? null : (
        <g
          ref={levelRef}
          data-role="redox"
          data-top={round(extent.top)}
          data-bottom={round(extent.bottom)}
        >
          <defs>
            <clipPath id={`${clipId}-below`}>
              {/* Everything below the level. Full width, and a height of one
                  whole viewport so the rect always reaches past the underside
                  of the shape however far the level rises. Only its `y` moves. */}
              <rect data-role="redox-clip" x="0" y={round(extent.bottom)} width={size} height={size} />
            </clipPath>
            <clipPath id={`${clipId}-shape`}>
              <path d={silhouette} />
            </clipPath>
          </defs>

          <g clipPath={`url(#${clipId}-below)`}>
            <path d={silhouette} fill={reducedFill} />
          </g>

          {/* THE CHANNEL. A hard ink rule at the boundary, clipped to the
              silhouette so it spans exactly the width of the shape at that
              height and needs no chord arithmetic. At either end of the axis
              the chord is nothing and the rule vanishes into the outline by
              itself, which is why neither extreme needs a special case. */}
          <line
            data-role="redox-level"
            clipPath={`url(#${clipId}-shape)`}
            x1="0"
            x2={size}
            y1={round(extent.bottom)}
            y2={round(extent.bottom)}
            stroke="var(--color-ink)"
            strokeWidth={LEVEL_STROKE_WIDTH}
          />
        </g>
      )}

      {phosphateDots(phosphate, radius, centre, seed)}
      <g ref={electronsRef}>{electronDots(electrons, radius, centre)}</g>
    </svg>
  );
}

/**
 * DESIGN.md rule 2. One circle per unit of conserved phosphate.
 *
 * LAID OUT AS A CHAIN, NOT A ROW, and for two reasons that happen to agree.
 *
 * The visual one: the first version put them in a horizontal row across the
 * lower half of the body, and ATP immediately read as a face with two eyes and
 * a nose. DESIGN.md reserves faces for things that are characters, the beast
 * and rule 6's ROS, and a nucleotide is not one.
 *
 * The biological one: ATP's three phosphates really are a chain, alpha to beta
 * to gamma, and hydrolysis really does take the terminal one off the end. A
 * diagonal chain running out from the body says that. A row of three says they
 * are interchangeable, which is the thing that makes "spending energy removes a
 * dot" read as arbitrary rather than as the end of a chain coming off.
 *
 * Ink-outlined and unfilled everywhere, so a phosphate looks like a phosphate
 * whether it is on ATP, on a triose or on its own.
 */
function phosphateDots(count: number, radius: number, centre: number, seed: number) {
  if (count <= 0) return null;
  // Sized and spaced so consecutive dots do not touch. Countable is the whole
  // requirement: a chain whose links overlap is a blob with a smear on it, and
  // three versus two stops being readable at a glance, which is the only thing
  // rule 2 asks for.
  const dotRadius = radius * 0.155;
  const step = radius * 0.37;
  // 45 degrees down and to the right, so the chain never lands where the
  // electron dots sit and never reads as a mouth.
  const axis = Math.SQRT1_2;
  const dots = [];
  for (let i = 0; i < count; i += 1) {
    const distance = radius * 0.22 + step * i;
    dots.push(
      <circle
        key={i}
        data-role="phosphate"
        cx={round(centre + distance * axis + wobble(seed, i, 211) * dotRadius * 0.22)}
        cy={round(centre + distance * axis + wobble(seed, i, 307) * dotRadius * 0.22)}
        r={round(dotRadius)}
        fill="var(--color-white)"
        stroke="var(--color-ink)"
        strokeWidth={2}
      />,
    );
  }
  return <>{dots}</>;
}

/**
 * DESIGN.md rule 3. The two electrons NADH is carrying and NAD+ is not.
 *
 * POSITIONED OFF THE FACE, DELIBERATELY. The first version put them side by side
 * in the upper half of the blob, and a reduced carrier immediately read as a
 * small character with two eyes. DESIGN.md reserves eyes for things that are
 * characters: rule 6 gives ROS X eyes so hazards read as characters rather than
 * icons, and the beast has a face for the same reason. A carrier is not a
 * character, so the dots sit stacked on the upper-right edge where they read as
 * two particles the molecule is carrying, which is what they are.
 */
function electronDots(count: number, radius: number, centre: number) {
  if (count <= 0) return null;
  const dotRadius = radius * 0.14;
  const dots = [];
  for (let i = 0; i < count; i += 1) {
    const spread = (i - (count - 1) / 2) * dotRadius * 2.4;
    dots.push(
      <circle
        key={i}
        data-role="electron"
        cx={round(centre + radius * 0.62 + spread * 0.55)}
        cy={round(centre - radius * 0.58 + spread)}
        r={round(dotRadius)}
        fill="var(--color-ink)"
      />,
    );
  }
  return <>{dots}</>;
}
