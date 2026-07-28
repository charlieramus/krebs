import { describe, expect, it } from 'vitest';
import { createPrng, restorePrng } from '../prng';

/** Drain n values off a generator. */
function take(prng: { next(): number }, n: number): number[] {
  const out: number[] = new Array<number>(n);
  for (let i = 0; i < n; i += 1) out[i] = prng.next();
  return out;
}

describe('mulberry32', () => {
  it('produces the same first 1000 values for the same seed', () => {
    const a = take(createPrng(1), 1000);
    const b = take(createPrng(1), 1000);
    expect(a).toEqual(b);
  });

  it('diverges for different seeds', () => {
    const a = take(createPrng(1), 1000);
    const b = take(createPrng(2), 1000);
    expect(a).not.toEqual(b);

    // Not just "not identical as a whole". A generator that agreed on 999 of
    // 1000 values would still be broken, so require broad disagreement.
    let same = 0;
    for (let i = 0; i < a.length; i += 1) if (a[i] === b[i]) same += 1;
    expect(same).toBeLessThan(5);
  });

  it('emits only values in [0, 1)', () => {
    // Several seeds, including 0 and a large one, since the failure modes here
    // are seed-dependent.
    // Assert on aggregates rather than per value. 100k expect() calls cost
    // seconds and this suite runs on every change.
    for (const seed of [0, 1, 42, 0xffffffff, 123456789]) {
      const prng = createPrng(seed);
      let min = Infinity;
      let max = -Infinity;
      let nonFinite = 0;
      for (let i = 0; i < 20000; i += 1) {
        const v = prng.next();
        if (!Number.isFinite(v)) nonFinite += 1;
        if (v < min) min = v;
        if (v > max) max = v;
      }
      expect(nonFinite).toBe(0);
      expect(min).toBeGreaterThanOrEqual(0);
      expect(max).toBeLessThan(1);
    }
  });

  it('resumes the exact remainder of the sequence from a saved state', () => {
    // docs/SAVE_SCHEMA.md Part 3. This is the property that catches a save
    // persisting the seed but not the state.
    const original = createPrng(20260728);
    take(original, 137);

    const savedSeed = original.seed;
    const savedState = original.state;

    const remainderFromOriginal = take(original, 500);

    const restored = restorePrng(savedSeed, savedState);
    const remainderFromRestored = take(restored, 500);

    expect(remainderFromRestored).toEqual(remainderFromOriginal);
  });

  it('restores by plain field assignment too, not only via restorePrng', () => {
    const original = createPrng(7);
    take(original, 64);
    const savedState = original.state;
    const expected = take(original, 100);

    const fresh = createPrng(999999); // deliberately a different seed
    fresh.state = savedState;
    expect(take(fresh, 100)).toEqual(expected);
  });

  it('advances correctly when next is destructured off the object', () => {
    const prng = createPrng(5);
    const expected = take(createPrng(5), 10);
    const { next } = prng;
    const actual: number[] = [];
    for (let i = 0; i < 10; i += 1) actual.push(next());
    expect(actual).toEqual(expected);
  });

  it('holds the reference sequence for seed 1', () => {
    // Frozen so later logs, and any port of this generator, have a known-good
    // sequence to check against. If this changes, the save format changed.
    expect(take(createPrng(1), 5)).toEqual([
      0.6270739405881613, 0.002735721180215478, 0.5274470399599522, 0.9810509674716741,
      0.9683778982143849,
    ]);
  });
});
