/**
 * Seeded PRNG. Mulberry32, per docs/SIMULATION.md Part 5.
 *
 * CLAUDE.md hard rule 4 bans Math.random in simulation code. This is what
 * replaces it. Determinism is a tested property of this codebase, so the
 * sequence must be reproducible across runs, machines and browsers.
 *
 * The state is exposed as a plain readable and writable field rather than
 * hidden in a closure, because docs/SAVE_SCHEMA.md Part 3 requires the internal
 * state to be part of the save. Persisting the seed alone is insufficient: a
 * reloaded save has to continue the same sequence, not restart it. Saves are
 * not in this log, but the shape of this object is what the save serialises, so
 * it matches the schema field for field.
 *
 * Arithmetic is restricted to >>>, <<, ^, |, +, * and Math.imul. All of these
 * are exactly specified under IEEE754 and uint32 semantics. No Math.pow, which
 * is banned by CLAUDE.md hard rule 5 and enforced by ESLint in this directory.
 */

/** 2^32. The divisor that maps a uint32 onto [0, 1). Written as a literal because Math.pow is banned. */
const UINT32_RANGE = 4294967296;

/** Mulberry32's odd 32-bit increment. */
const MULBERRY32_INCREMENT = 0x6d2b79f5;

export interface Prng {
  /** Matches docs/SAVE_SCHEMA.md rng.algorithm. */
  readonly algorithm: 'mulberry32';
  /** The seed this generator started from. Matches docs/SAVE_SCHEMA.md rng.seed. Never mutated. */
  readonly seed: number;
  /**
   * Current internal state, a uint32. Matches docs/SAVE_SCHEMA.md rng.state.
   * Read it to save. Assign it to restore. Assigning it mid-sequence relocates
   * the generator to exactly that point in the stream.
   */
  state: number;
  /** Next value in [0, 1). Advances the state. */
  next(): number;
}

/**
 * Construct a generator. The seed is coerced to uint32, so any integer works
 * and negatives wrap rather than producing NaN.
 */
export function createPrng(seed: number): Prng {
  const seedU32 = seed >>> 0;

  const prng: Prng = {
    algorithm: 'mulberry32',
    seed: seedU32,
    state: seedU32,
    next(): number {
      // Reference `prng` rather than `this` so a destructured `next` still
      // advances the right generator.
      const a = (prng.state + MULBERRY32_INCREMENT) | 0;
      prng.state = a >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / UINT32_RANGE;
    },
  };

  return prng;
}

/**
 * Restore a generator from saved fields. Equivalent to constructing from the
 * seed and then assigning the state, and it exists so the save loader has one
 * obvious call rather than a two-step it can get half right.
 */
export function restorePrng(seed: number, state: number): Prng {
  const prng = createPrng(seed);
  prng.state = state >>> 0;
  return prng;
}
