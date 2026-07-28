import { describe, expect, it } from 'vitest';
import { computeFlux, hill, intPow, michaelisMenten, saturation, type Reaction } from '../reactions';

/** A one-substrate reaction over a two-pool amount array, for exercising the curve. */
function singleSubstrate(kinetics: Reaction['kinetics']): Reaction {
  return {
    id: 'test',
    substrates: [{ poolIndex: 0, coefficient: 1 }],
    products: [{ poolIndex: 1, coefficient: 1 }],
    kinetics,
    enabled: true,
  };
}

function fluxAt(reaction: Reaction, s: number): number {
  const amounts = new Float64Array([s, 0]);
  return computeFlux(reaction, amounts);
}

describe('michaelis-menten', () => {
  const VMAX = 12.5;
  const KM = 3;
  const reaction = singleSubstrate(michaelisMenten(VMAX, KM));

  it('is zero at zero substrate', () => {
    expect(fluxAt(reaction, 0)).toBe(0);
  });

  it('is exactly Vmax/2 at S = Km', () => {
    expect(fluxAt(reaction, KM)).toBe(VMAX / 2);
  });

  it('approaches Vmax without reaching it', () => {
    // Even absurdly far out on the curve it must stay strictly below Vmax.
    for (const s of [KM * 10, KM * 1e3, KM * 1e6, KM * 1e12]) {
      expect(fluxAt(reaction, s)).toBeLessThan(VMAX);
    }
    expect(fluxAt(reaction, KM * 1e6)).toBeGreaterThan(VMAX * 0.999);
  });

  it('is monotonic increasing', () => {
    let previous = -1;
    for (let s = 0; s <= 100; s += 0.25) {
      const v = fluxAt(reaction, s);
      expect(v).toBeGreaterThan(previous);
      previous = v;
    }
  });
});

describe('hill', () => {
  const VMAX = 12.5;
  const K = 3;

  it('is zero at zero substrate', () => {
    expect(fluxAt(singleSubstrate(hill(VMAX, K, 4)), 0)).toBe(0);
  });

  it('is exactly Vmax/2 at S = K for every n', () => {
    for (const n of [1, 2, 3, 4, 8]) {
      expect(fluxAt(singleSubstrate(hill(VMAX, K, n)), K)).toBe(VMAX / 2);
    }
  });

  it('approaches Vmax without reaching it', () => {
    const reaction = singleSubstrate(hill(VMAX, K, 4));
    for (const s of [K * 10, K * 100, K * 1e3]) {
      expect(fluxAt(reaction, s)).toBeLessThan(VMAX);
    }
    expect(fluxAt(reaction, K * 100)).toBeGreaterThan(VMAX * 0.999);
  });

  it('is monotonic increasing', () => {
    const reaction = singleSubstrate(hill(VMAX, K, 4));
    let previous = -1;
    for (let s = 0; s <= 100; s += 0.25) {
      const v = fluxAt(reaction, s);
      expect(v).toBeGreaterThan(previous);
      previous = v;
    }
  });

  it('with n = 1 equals michaelis-menten to the bit', () => {
    // This is the assertion that catches an off-by-one in the exponent loop.
    // An intPow that ran one iteration too many or too few would still produce
    // a plausible saturation curve, so an approximate comparison would pass.
    const mm = michaelisMenten(VMAX, K);
    const h1 = hill(VMAX, K, 1);
    for (let s = 0; s <= 200; s += 0.125) {
      expect(saturation(h1, s)).toBe(saturation(mm, s));
      expect(fluxAt(singleSubstrate(h1), s)).toBe(fluxAt(singleSubstrate(mm), s));
    }
    // And a handful of awkward magnitudes.
    for (const s of [1e-9, 0.3333333333333333, 7 / 3, 1e9, Number.MIN_VALUE]) {
      expect(saturation(h1, s)).toBe(saturation(mm, s));
    }
  });

  it('is steeper than michaelis-menten below K and flatter above it', () => {
    // The point of cooperativity. If this fails, n is not doing anything.
    const mm = michaelisMenten(VMAX, K);
    const h4 = hill(VMAX, K, 4);
    expect(saturation(h4, K / 2)).toBeLessThan(saturation(mm, K / 2));
    expect(saturation(h4, K * 2)).toBeGreaterThan(saturation(mm, K * 2));
  });

  it('rejects a non-integer or sub-one n at construction', () => {
    expect(() => hill(VMAX, K, 2.7)).toThrow(/integer/);
    expect(() => hill(VMAX, K, 0)).toThrow(/integer/);
    expect(() => hill(VMAX, K, -1)).toThrow(/integer/);
    expect(() => hill(VMAX, K, Number.NaN)).toThrow(/integer/);
  });
});

describe('intPow', () => {
  it('returns exactly the base at exponent 1', () => {
    for (const x of [3, 0.1, 7 / 3, 1e12]) expect(intPow(x, 1)).toBe(x);
  });

  it('matches repeated multiplication for small integer exponents', () => {
    expect(intPow(3, 0)).toBe(1);
    expect(intPow(3, 2)).toBe(9);
    expect(intPow(3, 3)).toBe(27);
    expect(intPow(2, 10)).toBe(1024);
  });
});

describe('constructor validation', () => {
  it('rejects a non-positive Km or K', () => {
    expect(() => michaelisMenten(1, 0)).toThrow(/Km/);
    expect(() => michaelisMenten(1, -1)).toThrow(/Km/);
    expect(() => hill(1, 0, 2)).toThrow(/K/);
  });

  it('rejects a negative Vmax', () => {
    expect(() => michaelisMenten(-1, 1)).toThrow(/Vmax/);
    expect(() => hill(-1, 1, 2)).toThrow(/Vmax/);
  });
});

describe('computeFlux', () => {
  it('is zero for a disabled reaction regardless of substrate', () => {
    const reaction = singleSubstrate(michaelisMenten(10, 1));
    reaction.enabled = false;
    expect(fluxAt(reaction, 1e6)).toBe(0);
  });

  it('takes the minimum of the per-substrate saturation terms', () => {
    // The modeling choice documented in reactions.ts. Asserted so that a
    // change to it is a visible test failure rather than a silent balance
    // shift, since it still owes an entry in docs/SCIENCE.md.
    const kinetics = michaelisMenten(10, 2);
    const reaction: Reaction = {
      id: 'two-substrate',
      substrates: [
        { poolIndex: 0, coefficient: 1 },
        { poolIndex: 1, coefficient: 1 },
      ],
      products: [{ poolIndex: 2, coefficient: 1 }],
      kinetics,
      enabled: true,
    };

    const amounts = new Float64Array([100, 0.5, 0]);
    const expected = 10 * saturation(kinetics, 0.5); // the scarcer substrate wins
    expect(computeFlux(reaction, amounts)).toBe(expected);

    // Not the product, which would be materially smaller here.
    const product = 10 * saturation(kinetics, 100) * saturation(kinetics, 0.5);
    expect(computeFlux(reaction, amounts)).toBeGreaterThan(product);
  });

  it('is zero when any one substrate is empty', () => {
    const reaction: Reaction = {
      id: 'two-substrate',
      substrates: [
        { poolIndex: 0, coefficient: 1 },
        { poolIndex: 1, coefficient: 1 },
      ],
      products: [{ poolIndex: 2, coefficient: 1 }],
      kinetics: michaelisMenten(10, 2),
      enabled: true,
    };
    expect(computeFlux(reaction, new Float64Array([1e6, 0, 0]))).toBe(0);
  });

  it('runs at Vmax with no substrates', () => {
    const influx: Reaction = {
      id: 'influx',
      substrates: [],
      products: [{ poolIndex: 0, coefficient: 1 }],
      kinetics: michaelisMenten(4, 1),
      enabled: true,
    };
    expect(computeFlux(influx, new Float64Array([0]))).toBe(4);
  });
});
