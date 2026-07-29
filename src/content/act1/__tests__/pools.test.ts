import { describe, expect, it } from 'vitest';
import { PoolRegistry } from '../../../sim/pools';
import {
  ACT1_CONSERVED_IDS,
  ACT1_INITIAL,
  ACT1_POOL_IDS,
  act1PoolDefinitions,
  type Act1PoolId,
} from '../pools';

/**
 * The totals below are hand-computed, deliberately.
 *
 * Deriving them from the same weight table the code reads would assert that
 * the table equals itself, which is worth nothing. Every figure here was
 * worked out from docs/SCIENCE.md Part 2 and the balance sheet in
 * UPDATELOGV2.md, and the arithmetic is written out so a wrong weight shows up
 * as a disagreement rather than as a matching bug on both sides.
 *
 * If one of these fails, check the weight in src/content/act1/pools.ts against
 * docs/SCIENCE.md before changing the number here. The test is the thing
 * holding the convention in place.
 */

/** Deliberately unlike ACT1_INITIAL: every pool non-zero, all small primes-ish. */
const PROBE: Readonly<Record<Act1PoolId, number>> = {
  glucose_env: 100,
  glucose: 7,
  g3p: 4,
  pyruvate: 3,
  lactate: 5,
  nad: 6,
  nadh: 2,
  atp: 9,
  adp: 8,
  pi: 11,
};

describe('act 1 pools', () => {
  it('constructs a registry over the ten act 1 pools', () => {
    const pools = new PoolRegistry(act1PoolDefinitions());
    expect(pools.count).toBe(10);
    expect(pools.ids).toEqual([...ACT1_POOL_IDS]);
    expect(pools.labels[pools.indexOf('nad')]).toBe('NAD+');
  });

  it('has no duplicate ids', () => {
    expect(new Set(ACT1_POOL_IDS).size).toBe(ACT1_POOL_IDS.length);

    // And the registry enforces it rather than trusting the array above.
    const definitions = act1PoolDefinitions();
    expect(() => new PoolRegistry([...definitions, definitions[0]!])).toThrow(/duplicate/);
  });

  it('exposes the five conserved quantities in the sorted fixed order', () => {
    const pools = new PoolRegistry(act1PoolDefinitions());
    expect(pools.conservedIds).toEqual(['adenylate', 'carbon', 'nicotinamide', 'phosphate', 'redox']);
    expect(pools.conservedIds).toEqual([...ACT1_CONSERVED_IDS]);
  });

  it('orders conserved quantities independently of pool definition order', () => {
    // Reversed definitions. The kernel sorts, so the order must not move, and
    // stage 5's determinism hash depends on that holding.
    const reversed = [...act1PoolDefinitions()].reverse();
    expect(new PoolRegistry(reversed).conservedIds).toEqual([...ACT1_CONSERVED_IDS]);
  });

  it('totals each conserved quantity against a known set of amounts', () => {
    const pools = new PoolRegistry(act1PoolDefinitions(PROBE));

    // carbon: glucose_env 6*100=600, glucose 6*7=42, g3p 3*4=12,
    //         pyruvate 3*3=9, lactate 3*5=15. Carriers carry no carbon.
    expect(pools.totalConserved('carbon')).toBe(678);

    // phosphate: g3p 1*4=4, atp 3*9=27, adp 2*8=16, pi 1*11=11.
    //            Glucose is unphosphorylated, pyruvate and lactate are not.
    expect(pools.totalConserved('phosphate')).toBe(58);

    // redox: glucose_env 2*100=200, glucose 2*7=14, g3p 1*4=4,
    //        lactate 1*5=5, nadh 1*2=2. NAD+ and pyruvate carry zero, which is
    //        the whole point of the convention.
    expect(pools.totalConserved('redox')).toBe(225);

    // nicotinamide: nad 6 + nadh 2. Nothing else touches it.
    expect(pools.totalConserved('nicotinamide')).toBe(8);

    // adenylate: atp 9 + adp 8. Free phosphate is not an adenylate.
    expect(pools.totalConserved('adenylate')).toBe(17);
  });

  it('totals each conserved quantity at the initial amounts', () => {
    const pools = new PoolRegistry(act1PoolDefinitions());

    // All carbon and all redox start in the environment: 10000 glucose at 6
    // carbon and 2 redox each, nothing yet inside the cell.
    expect(pools.totalConserved('carbon')).toBe(60000);
    expect(pools.totalConserved('redox')).toBe(20000);

    // phosphate: atp 3*20=60, adp 2*20=40, pi 1*40=40.
    expect(pools.totalConserved('phosphate')).toBe(140);

    // The two carrier totals, which are the fixed ceilings act 1 runs against.
    expect(pools.totalConserved('nicotinamide')).toBe(10);
    expect(pools.totalConserved('adenylate')).toBe(40);
  });

  it('starts fully oxidised and fully environmental', () => {
    const pools = new PoolRegistry(act1PoolDefinitions());

    // The nicotinamide pool starts entirely as NAD+, so the wall in stage 4 is
    // approached rather than started at.
    expect(pools.get('nad')).toBe(ACT1_INITIAL.nad);
    expect(pools.get('nadh')).toBe(0);

    // Nothing has entered the cell and nothing has been fermented.
    expect(pools.get('glucose')).toBe(0);
    expect(pools.get('lactate')).toBe(0);
  });
});
