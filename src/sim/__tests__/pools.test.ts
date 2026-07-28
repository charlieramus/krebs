import { describe, expect, it } from 'vitest';
import { PoolRegistry, type PoolDefinition } from '../pools';

/**
 * Synthetic. Invented ids and invented weights, not biology. The conservation
 * test in stage 5 asserts against `totalConserved`, so a bug in the weight
 * matrix would make that test pass while mass leaked. These guard it directly.
 */
const definitions: readonly PoolDefinition[] = [
  { id: 'A', label: 'A', initial: 10, conserved: { carbon: 6 } },
  { id: 'B', label: 'B', initial: 4, conserved: { carbon: 3, phosphate: 1 } },
  { id: 'P', label: 'P', initial: 20, conserved: { phosphate: 1 } },
  { id: 'X', label: 'X', initial: 2, conserved: { redox: 1 } },
];

describe('PoolRegistry', () => {
  it('indexes pools in definition order and freezes the map', () => {
    const pools = new PoolRegistry(definitions);
    expect(pools.count).toBe(4);
    expect(pools.ids).toEqual(['A', 'B', 'P', 'X']);
    expect(pools.indexOf('P')).toBe(2);
    expect(Object.isFrozen(pools.index)).toBe(true);
  });

  it('seeds amounts from the definitions and restores them on reset', () => {
    const pools = new PoolRegistry(definitions);
    expect(Array.from(pools.amounts)).toEqual([10, 4, 20, 2]);
    pools.amounts[0] = 0;
    pools.set('B', 99);
    pools.reset();
    expect(Array.from(pools.amounts)).toEqual([10, 4, 20, 2]);
  });

  it('orders conserved quantities deterministically, not by definition order', () => {
    const pools = new PoolRegistry(definitions);
    expect(pools.conservedIds).toEqual(['carbon', 'phosphate', 'redox']);

    // Same pools, definitions reordered. The quantity ordering must not move.
    const shuffled = [definitions[3], definitions[0], definitions[2], definitions[1]] as PoolDefinition[];
    expect(new PoolRegistry(shuffled).conservedIds).toEqual(['carbon', 'phosphate', 'redox']);
  });

  it('totals a conserved quantity with the right weights', () => {
    const pools = new PoolRegistry(definitions);
    expect(pools.totalConserved('carbon')).toBe(10 * 6 + 4 * 3);
    expect(pools.totalConserved('phosphate')).toBe(4 * 1 + 20 * 1);
    expect(pools.totalConserved('redox')).toBe(2);
  });

  it('tracks totals as amounts change', () => {
    const pools = new PoolRegistry(definitions);
    pools.set('A', 0);
    pools.set('B', 24); // 10 units of A converted to B at 1:2, carbon 6 -> 3
    expect(pools.totalConserved('carbon')).toBe(72);
  });

  it('rejects duplicate ids, bad initial amounts and unknown lookups', () => {
    expect(
      () =>
        new PoolRegistry([
          { id: 'A', label: 'A', initial: 1, conserved: {} },
          { id: 'A', label: 'again', initial: 1, conserved: {} },
        ]),
    ).toThrow(/duplicate/);

    expect(
      () => new PoolRegistry([{ id: 'A', label: 'A', initial: -1, conserved: {} }]),
    ).toThrow(/negative/);

    const pools = new PoolRegistry(definitions);
    expect(() => pools.indexOf('nope')).toThrow(/unknown pool id/);
    expect(() => pools.totalConserved('nope')).toThrow(/unknown conserved quantity/);
  });
});
