import { beforeAll, describe, expect, it } from 'vitest';
import { canonicalState, fnv1a, hashState } from '../hash';
import { setShortfallLogging, tick } from '../tick';
import { createToyPathway } from './fixtures/toyPathway';

/**
 * docs/SIMULATION.md Part 5. Same seed plus same input sequence must produce a
 * bit-identical state hash across runs, machines and browsers.
 *
 * The input script below consumes the PRNG, so the seed genuinely reaches pool
 * amounts rather than only sitting in the RNG state field. Without that, "two
 * different seeds produce different hashes" would be satisfied by the seed
 * being in the hash and nothing else, which proves nothing about the
 * simulation.
 */

beforeAll(() => {
  setShortfallLogging(false);
});

/**
 * A fixed input script. Every 50 ticks it uses the PRNG to toggle one reaction,
 * which is the shape unlocks and enzyme damage take in the real game.
 */
function runScript(seed: number, ticks: number): ReturnType<typeof createToyPathway> {
  const state = createToyPathway({ seed });

  for (let t = 0; t < ticks; t += 1) {
    if (t > 0 && t % 50 === 0) {
      const roll = state.prng.next();
      const index = Math.floor(roll * state.reactions.length);
      const reaction = state.reactions[index];
      if (reaction !== undefined) reaction.enabled = !reaction.enabled;
    }
    tick(state);
  }

  return state;
}

/** The canonical fixture run. Any change to these three numbers changes the hash below. */
const CANONICAL_SEED = 20260728;
const CANONICAL_TICKS = 1200;

describe('determinism', () => {
  it('produces the same hash for the same seed and script, run twice', () => {
    const first = hashState(runScript(CANONICAL_SEED, CANONICAL_TICKS));
    const second = hashState(runScript(CANONICAL_SEED, CANONICAL_TICKS));
    expect(second).toBe(first);
  });

  it('produces a different hash for a different seed', () => {
    // Otherwise a hash that ignores its input passes the test above trivially.
    const a = hashState(runScript(CANONICAL_SEED, CANONICAL_TICKS));
    const b = hashState(runScript(CANONICAL_SEED + 1, CANONICAL_TICKS));
    const c = hashState(runScript(1, CANONICAL_TICKS));
    expect(b).not.toBe(a);
    expect(c).not.toBe(a);
    expect(c).not.toBe(b);
  });

  it('produces a different hash after one more tick', () => {
    // The hash has to be sensitive to the thing it is guarding, not just to
    // the seed. This fails if the hash reads the seed and ignores the pools.
    const shorter = hashState(runScript(CANONICAL_SEED, CANONICAL_TICKS));
    const longer = hashState(runScript(CANONICAL_SEED, CANONICAL_TICKS + 1));
    expect(longer).not.toBe(shorter);
  });

  it('is sensitive to a single pool changing by one ulp', () => {
    const state = runScript(CANONICAL_SEED, 100);
    const before = hashState(state);
    const amount = state.pools.amounts[0] as number;
    state.pools.amounts[0] = amount + Number.EPSILON * amount;
    expect(hashState(state)).not.toBe(before);
  });

  it('is sensitive to the PRNG state alone', () => {
    const state = runScript(CANONICAL_SEED, 100);
    const before = hashState(state);
    state.prng.next();
    expect(hashState(state)).not.toBe(before);
  });

  it('serialises floats so they round-trip exactly', () => {
    // If the canonical form lost precision, two genuinely different states
    // could hash the same and the whole test would be theatre.
    const state = runScript(CANONICAL_SEED, 300);
    const encoded = canonicalState(state);
    for (let i = 0; i < state.pools.count; i += 1) {
      const id = state.pools.ids[i] as string;
      const match = new RegExp(`(?:^|\\|)${id}=([^|]*)`).exec(encoded);
      expect(match).not.toBeNull();
      expect(Number((match as RegExpExecArray)[1])).toBe(state.pools.amounts[i]);
    }
  });

  it('distinguishes negative zero from zero', () => {
    const state = runScript(CANONICAL_SEED, 10);
    state.pools.amounts[1] = 0;
    const positive = hashState(state);
    state.pools.amounts[1] = -0;
    expect(hashState(state)).not.toBe(positive);
  });

  it('holds the canonical fixture hash', () => {
    // Frozen so CI and later logs have a known-good value to compare against.
    // A change here means the kernel's arithmetic changed. That may be correct,
    // but it is never incidental, and this is the line that makes it visible.
    //
    // Fixture: createToyPathway({ seed: 20260728 }), 1200 ticks, toggling one
    // PRNG-selected reaction every 50 ticks.
    expect(hashState(runScript(CANONICAL_SEED, CANONICAL_TICKS))).toBe('172f83fb');
  });
});

describe('fnv1a', () => {
  it('matches the published test vectors', () => {
    // The 32-bit FNV-1a reference values. If the implementation drifts, these
    // catch it without needing a simulation at all.
    expect(fnv1a('')).toBe(0x811c9dc5);
    expect(fnv1a('a')).toBe(0xe40c292c);
    expect(fnv1a('foobar')).toBe(0xbf9cf968);
  });

  it('is order sensitive', () => {
    expect(fnv1a('ab')).not.toBe(fnv1a('ba'));
  });
});
