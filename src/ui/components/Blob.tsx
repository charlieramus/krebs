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

import type { Ref } from 'react';

/** DESIGN.md: stroke-width 3 to 3.5, stroke-linejoin round. */
const STROKE_WIDTH = 3.25;

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
  className?: string;
  /**
   * Handle on the silhouette, so a caller can drive its fill from the snapshot
   * at frame rate. Rule 3 needs this: the carrier's saturation is simulation
   * state and simulation state does not go through React.
   */
  pathRef?: Ref<SVGPathElement>;
  /** Handle on the electron dots, for the same reason. */
  electronsRef?: Ref<SVGGElement>;
}

export function Blob({
  carbon,
  phosphate,
  fill,
  size = 46,
  seed = 1,
  electrons = 0,
  label,
  className = '',
  pathRef,
  electronsRef,
}: BlobProps) {
  const centre = size / 2;
  const radius = size * 0.36;
  const isCarrier = carbon === 0;

  const silhouette = isCarrier
    ? carrierPath(radius, centre, seed)
    : polygonPath(carbon, radius, centre, seed);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role="img"
      aria-label={label}
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
