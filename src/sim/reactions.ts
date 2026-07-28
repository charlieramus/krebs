/**
 * Reactions and flux.
 *
 * A reaction knows which pool indices it consumes, which it produces, and how
 * fast it runs as a function of its substrates. It does not know what any of
 * those pools are.
 *
 * docs/SIMULATION.md Part 2 fixes the functional forms. Part 5 fixes the
 * arithmetic: no Math.pow anywhere, integer exponents by repeated
 * multiplication, and no iteration over object keys in flux computation.
 * Substrates and products are ordered arrays for exactly that reason.
 */

/** One side of a reaction: which pool, and how many units per unit of flux. */
export interface StoichiometryTerm {
  readonly poolIndex: number;
  readonly coefficient: number;
}

/** v = Vmax * S / (Km + S). docs/SIMULATION.md Part 2. */
export interface MichaelisMentenKinetics {
  readonly kind: 'michaelis-menten';
  readonly vmax: number;
  readonly km: number;
}

/**
 * v = Vmax * S^n / (K^n + S^n). docs/SIMULATION.md Part 2.
 *
 * PFK-1 is the only enzyme in the whole game where cooperativity is modeled
 * explicitly, and it does not unlock until V2. The descriptor is built now
 * because it costs nothing and V2 needs it.
 */
export interface HillKinetics {
  readonly kind: 'hill';
  readonly vmax: number;
  readonly k: number;
  /** Hill coefficient. Integer, enforced at construction. */
  readonly n: number;
}

export type Kinetics = MichaelisMentenKinetics | HillKinetics;

export interface Reaction {
  readonly id: string;
  /** Ordered. Consumed at `coefficient` units per unit of flux. */
  readonly substrates: readonly StoichiometryTerm[];
  /** Ordered. Produced at `coefficient` units per unit of flux. */
  readonly products: readonly StoichiometryTerm[];
  readonly kinetics: Kinetics;
  /** A disabled reaction contributes zero flux. Unlocks and damage flip this. */
  enabled: boolean;
}

export function michaelisMenten(vmax: number, km: number): MichaelisMentenKinetics {
  if (!Number.isFinite(vmax) || vmax < 0) {
    throw new Error(`michaelisMenten: Vmax must be finite and non-negative, got ${vmax}`);
  }
  if (!Number.isFinite(km) || km <= 0) {
    throw new Error(`michaelisMenten: Km must be finite and positive, got ${km}`);
  }
  return { kind: 'michaelis-menten', vmax, km };
}

export function hill(vmax: number, k: number, n: number): HillKinetics {
  if (!Number.isFinite(vmax) || vmax < 0) {
    throw new Error(`hill: Vmax must be finite and non-negative, got ${vmax}`);
  }
  if (!Number.isFinite(k) || k <= 0) {
    throw new Error(`hill: K must be finite and positive, got ${k}`);
  }
  // Thrown, not floored. A silently floored 2.7 is a balance value that does
  // not match the doc it came from, which is worse than a crash at startup.
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`hill: n must be an integer >= 1, got ${n}. Non-integer exponents are not supported, see docs/SIMULATION.md Part 5.`);
  }
  return { kind: 'hill', vmax, k, n };
}

/**
 * Integer exponentiation by repeated multiplication.
 *
 * CLAUDE.md hard rule 5 and docs/SIMULATION.md Part 5 ban Math.pow, because the
 * ECMAScript specification permits implementation-approximated results for it
 * and the game has to produce bit-identical state across browsers.
 *
 * A plain loop rather than exponentiation by squaring. n is 1 to 4 in practice
 * and the loop's operation order is trivially predictable, which matters more
 * than the multiply count. `intPow(x, 1)` returns exactly x, which is what
 * makes the Hill form collapse onto Michaelis-Menten to the bit at n = 1.
 */
export function intPow(base: number, exponent: number): number {
  let result = 1;
  for (let i = 0; i < exponent; i += 1) result *= base;
  return result;
}

/**
 * The saturation term for one substrate, in [0, 1).
 *
 * Vmax is applied by the caller, so this is the shape of the curve without its
 * scale. Zero at zero substrate, exactly 0.5 at S = Km, asymptotic to 1.
 */
export function saturation(kinetics: Kinetics, s: number): number {
  if (s <= 0) return 0;
  if (kinetics.kind === 'michaelis-menten') {
    return s / (kinetics.km + s);
  }
  const sn = intPow(s, kinetics.n);
  const kn = intPow(kinetics.k, kinetics.n);
  return sn / (kn + sn);
}

/**
 * Flux for one reaction against a snapshot of pool amounts, in units per
 * game-second. Zero if disabled or if any substrate is empty.
 *
 * MODELING CHOICE, not biology: a multi-substrate reaction takes the MINIMUM of
 * its per-substrate saturation terms rather than their product.
 *
 * Real multi-substrate enzymes follow ordered or random bi-bi mechanisms whose
 * rate laws are neither the min nor the product of single-substrate terms. The
 * min is chosen because it makes the limiting substrate legible: the player can
 * point at one pool and say that is the bottleneck, which is the entire lesson
 * act 1 is built to teach. The product would smear the constraint across every
 * substrate at once and make the NAD+ wall unreadable.
 *
 * docs/SCIENCE.md Part 1 sets the disclosed-simplification posture and requires
 * the methodology to appear in-game. This specific choice is not yet written
 * down there. It needs an entry in docs/SCIENCE.md, or a row in the
 * docs/ECONOMY.md divergence table once that document exists. Until then it is
 * an undisclosed simplification, which is the thing that posture exists to
 * prevent.
 *
 * A second simplification rides along with the first: one kinetics descriptor
 * per reaction means one Km shared across every substrate, where a real enzyme
 * has a separate Km per substrate. Same disclosure obligation, same entry.
 *
 * Stoichiometric coefficients scale consumption and production, not the kinetic
 * term. The saturation curve is a function of substrate level.
 *
 * A reaction with no substrates runs at Vmax. That is the shape an
 * environmental influx takes, a supply the cell does not have to make.
 */
export function computeFlux(reaction: Reaction, amounts: Float64Array): number {
  if (!reaction.enabled) return 0;

  const substrates = reaction.substrates;
  if (substrates.length === 0) return reaction.kinetics.vmax;

  let limiting = Infinity;
  for (let i = 0; i < substrates.length; i += 1) {
    const term = substrates[i] as StoichiometryTerm;
    // The cast is safe by construction: pool indices are resolved from the
    // registry at setup time, so every index here is in range.
    const s = amounts[term.poolIndex] as number;
    const termSaturation = saturation(reaction.kinetics, s);
    if (termSaturation < limiting) limiting = termSaturation;
    if (limiting === 0) return 0;
  }

  return reaction.kinetics.vmax * limiting;
}
