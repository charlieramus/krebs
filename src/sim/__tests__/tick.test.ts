import { beforeAll, describe, expect, it } from 'vitest';
import { MAX_CATCHUP_TICKS, SAFE_VALUE_CEILING, TICK_MS, TICK_SECONDS } from '../constants';
import { createLoop, elapsedMs } from '../loop';
import { PoolRegistry, type PoolDefinition } from '../pools';
import { createPrng } from '../prng';
import { michaelisMenten, type Reaction } from '../reactions';
import { createSimulation, type SimulationState } from '../state';
import { setShortfallLogging, tick } from '../tick';

beforeAll(() => {
  // The counters are still kept. This only silences the text, which would
  // otherwise be thousands of lines across the shortfall cases below.
  setShortfallLogging(false);
});

/** Synthetic. Invented ids, invented numbers, not biology. */
function build(
  definitions: readonly PoolDefinition[],
  make: (at: (id: string) => number) => readonly Reaction[],
): SimulationState {
  const pools = new PoolRegistry(definitions);
  return createSimulation(pools, make((id) => pools.indexOf(id)), createPrng(1));
}

describe('tick, two-phase update', () => {
  it('computes every flux against the tick-start snapshot, not the running state', () => {
    // S -> M -> E. If the second reaction were computed after the first had
    // already been applied, it would see M above zero on the very first tick.
    // Two-phase means it must see M at exactly zero and produce nothing.
    const state = build(
      [
        { id: 'S', label: 'S', initial: 100, conserved: { c: 1 } },
        { id: 'M', label: 'M', initial: 0, conserved: { c: 1 } },
        { id: 'E', label: 'E', initial: 0, conserved: { c: 1 } },
      ],
      (at) => [
        {
          id: 'first',
          substrates: [{ poolIndex: at('S'), coefficient: 1 }],
          products: [{ poolIndex: at('M'), coefficient: 1 }],
          kinetics: michaelisMenten(10, 1),
          enabled: true,
        },
        {
          id: 'second',
          substrates: [{ poolIndex: at('M'), coefficient: 1 }],
          products: [{ poolIndex: at('E'), coefficient: 1 }],
          kinetics: michaelisMenten(10, 1),
          enabled: true,
        },
      ],
    );

    tick(state);
    expect(state.pools.get('E')).toBe(0);
    expect(state.pools.get('M')).toBeGreaterThan(0);
  });

  it('does not depend on the order reactions sit in the array', () => {
    const definitions: readonly PoolDefinition[] = [
      { id: 'S', label: 'S', initial: 100, conserved: { c: 1 } },
      { id: 'M', label: 'M', initial: 30, conserved: { c: 1 } },
      { id: 'E', label: 'E', initial: 5, conserved: { c: 1 } },
    ];
    const makeReactions = (at: (id: string) => number): Reaction[] => [
      {
        id: 'first',
        substrates: [{ poolIndex: at('S'), coefficient: 1 }],
        products: [{ poolIndex: at('M'), coefficient: 1 }],
        kinetics: michaelisMenten(10, 1),
        enabled: true,
      },
      {
        id: 'second',
        substrates: [{ poolIndex: at('M'), coefficient: 1 }],
        products: [{ poolIndex: at('E'), coefficient: 1 }],
        kinetics: michaelisMenten(7, 3),
        enabled: true,
      },
    ];

    const forward = build(definitions, makeReactions);
    const reversed = build(definitions, (at) => makeReactions(at).reverse());
    for (let t = 0; t < 200; t += 1) {
      tick(forward);
      tick(reversed);
    }
    expect(Array.from(reversed.pools.amounts)).toEqual(Array.from(forward.pools.amounts));
  });
});

describe('tick, shortfall scaling', () => {
  /**
   * One pool, one consumer with a Vmax large enough to demand far more than the
   * pool holds in a single tick, and nothing producing it. The pool must land
   * on exactly zero.
   */
  function starvedSingleConsumer(): SimulationState {
    return build(
      [
        { id: 'L', label: 'limiting', initial: 3, conserved: { c: 1 } },
        { id: 'W', label: 'waste', initial: 0, conserved: { c: 1 } },
      ],
      (at) => [
        {
          id: 'drain',
          substrates: [{ poolIndex: at('L'), coefficient: 2 }],
          products: [{ poolIndex: at('W'), coefficient: 2 }],
          kinetics: michaelisMenten(5000, 0.5),
          enabled: true,
        },
      ],
    );
  }

  it('lands a starved pool on exactly zero, not below it', () => {
    const state = starvedSingleConsumer();
    tick(state);
    expect(state.pools.get('L')).toBe(0);
    expect(Object.is(state.pools.get('L'), -0)).toBe(false);
  });

  it('records the shortfall once per pool per tick', () => {
    const state = starvedSingleConsumer();
    tick(state);
    expect(state.diagnostics.shortfallTicks[state.pools.indexOf('L')]).toBe(1);
    // Second tick, pool already empty, so flux is zero and there is no demand
    // to fall short of.
    tick(state);
    expect(state.diagnostics.shortfallTicks[state.pools.indexOf('L')]).toBe(1);
  });

  it('conserves mass through the shortfall, which is what clamping would break', () => {
    const state = starvedSingleConsumer();
    const before = state.pools.totalConserved('c');
    tick(state);
    expect(state.pools.totalConserved('c')).toBe(before);
    // The waste pool holds exactly what the limiting pool lost. Clamping the
    // pool at zero without scaling its consumer would have produced more waste
    // than there was substrate.
    expect(state.pools.get('W')).toBe(3);
  });

  it('shares the shortfall between consumers in proportion to demand', () => {
    const state = build(
      [
        { id: 'L', label: 'limiting', initial: 3, conserved: { c: 1 } },
        { id: 'U', label: 'greedy product', initial: 0, conserved: { c: 1 } },
        { id: 'V', label: 'modest product', initial: 0, conserved: { c: 1 } },
      ],
      (at) => [
        {
          id: 'greedy',
          substrates: [{ poolIndex: at('L'), coefficient: 1 }],
          products: [{ poolIndex: at('U'), coefficient: 1 }],
          kinetics: michaelisMenten(300, 0.001),
          enabled: true,
        },
        {
          id: 'modest',
          substrates: [{ poolIndex: at('L'), coefficient: 1 }],
          products: [{ poolIndex: at('V'), coefficient: 1 }],
          kinetics: michaelisMenten(100, 0.001),
          enabled: true,
        },
      ],
    );

    tick(state);
    // Splitting the residual between two consumers costs the last bit of
    // precision that the single-consumer case gets for free. The pool lands
    // within one ulp of zero and, critically, on the non-negative side of it.
    // See the note on float exactness in tick.ts.
    expect(state.pools.get('L')).toBeGreaterThanOrEqual(0);
    expect(state.pools.get('L')).toBeLessThan(Number.EPSILON * 3);

    // 3:1 demand ratio, so 3:1 of the three available units.
    expect(state.pools.get('U')).toBeCloseTo(2.25, 12);
    expect(state.pools.get('V')).toBeCloseTo(0.75, 12);
    expect(state.pools.get('U') + state.pools.get('V')).toBeCloseTo(3, 12);
  });

  it('takes the smaller factor when a reaction touches two short pools', () => {
    const state = build(
      [
        { id: 'L1', label: 'short', initial: 2, conserved: { c: 1 } },
        { id: 'L2', label: 'shorter', initial: 0.5, conserved: { c: 1 } },
        { id: 'W', label: 'waste', initial: 0, conserved: { c: 2 } },
      ],
      (at) => [
        {
          id: 'both',
          substrates: [
            { poolIndex: at('L1'), coefficient: 1 },
            { poolIndex: at('L2'), coefficient: 1 },
          ],
          products: [{ poolIndex: at('W'), coefficient: 1 }],
          kinetics: michaelisMenten(500, 0.001),
          enabled: true,
        },
      ],
    );

    tick(state);
    // L2 is the binding constraint, so it hits zero and L1 keeps the rest.
    expect(state.pools.get('L2')).toBe(0);
    expect(state.pools.get('L1')).toBeCloseTo(1.5, 12);
    expect(state.pools.get('W')).toBeCloseTo(0.5, 12);
  });

  it('never drives any pool negative over a long chaotic run', () => {
    const state = build(
      [
        { id: 'A', label: 'A', initial: 50, conserved: { c: 1 } },
        { id: 'B', label: 'B', initial: 1, conserved: { c: 1 } },
        { id: 'C', label: 'C', initial: 0.25, conserved: { c: 1 } },
      ],
      (at) => [
        {
          id: 'ab',
          substrates: [{ poolIndex: at('A'), coefficient: 1 }],
          products: [{ poolIndex: at('B'), coefficient: 1 }],
          kinetics: michaelisMenten(900, 0.01),
          enabled: true,
        },
        {
          id: 'bc',
          substrates: [{ poolIndex: at('B'), coefficient: 2 }],
          products: [{ poolIndex: at('C'), coefficient: 2 }],
          kinetics: michaelisMenten(1200, 0.01),
          enabled: true,
        },
        {
          id: 'ca',
          substrates: [{ poolIndex: at('C'), coefficient: 1 }],
          products: [{ poolIndex: at('A'), coefficient: 1 }],
          kinetics: michaelisMenten(700, 0.01),
          enabled: true,
        },
      ],
    );

    for (let t = 0; t < 5000; t += 1) {
      tick(state);
      for (let i = 0; i < state.pools.count; i += 1) {
        expect(state.pools.amounts[i]).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('tick, guards and counters', () => {
  it('increments an integer tick counter, and game time derives from it', () => {
    const state = build([{ id: 'A', label: 'A', initial: 1, conserved: {} }], () => []);
    expect(state.tickCount).toBe(0);
    for (let t = 0; t < 137; t += 1) tick(state);
    expect(state.tickCount).toBe(137);
    expect(Number.isInteger(state.tickCount)).toBe(true);
    expect(elapsedMs(state)).toBe(137 * TICK_MS);
  });

  it('throws when a pool passes SAFE_VALUE_CEILING', () => {
    const state = build(
      [{ id: 'A', label: 'A', initial: SAFE_VALUE_CEILING, conserved: {} }],
      (at) => [
        {
          id: 'influx',
          substrates: [],
          products: [{ poolIndex: at('A'), coefficient: 1 }],
          kinetics: michaelisMenten(1e9, 1),
          enabled: true,
        },
      ],
    );
    expect(() => tick(state)).toThrow(/SAFE_VALUE_CEILING/);
  });

  it('ignores disabled reactions entirely', () => {
    const state = build(
      [
        { id: 'A', label: 'A', initial: 10, conserved: { c: 1 } },
        { id: 'B', label: 'B', initial: 0, conserved: { c: 1 } },
      ],
      (at) => [
        {
          id: 'off',
          substrates: [{ poolIndex: at('A'), coefficient: 1 }],
          products: [{ poolIndex: at('B'), coefficient: 1 }],
          kinetics: michaelisMenten(10, 1),
          enabled: false,
        },
      ],
    );
    for (let t = 0; t < 100; t += 1) tick(state);
    expect(state.pools.get('A')).toBe(10);
    expect(state.pools.get('B')).toBe(0);
  });
});

describe('loop', () => {
  function idleState(): SimulationState {
    return build([{ id: 'A', label: 'A', initial: 1, conserved: {} }], () => []);
  }

  it('drains the accumulator in whole ticks and keeps the remainder', () => {
    const state = idleState();
    const loop = createLoop(state);

    const alpha = loop.advance(TICK_MS * 3 + 20);
    expect(state.tickCount).toBe(3);
    expect(loop.accumulatorMs).toBe(20);
    expect(alpha).toBe(20 / TICK_MS);
    expect(alpha).toBeGreaterThanOrEqual(0);
    expect(alpha).toBeLessThan(1);
  });

  it('carries the remainder across calls rather than losing it', () => {
    const state = idleState();
    const loop = createLoop(state);
    // 30ms twice is 60ms, which is one tick and 10ms left over.
    loop.advance(30);
    expect(state.tickCount).toBe(0);
    loop.advance(30);
    expect(state.tickCount).toBe(1);
    expect(loop.accumulatorMs).toBe(10);
  });

  it('credits zero for a negative delta, which is the clock moving backwards', () => {
    const state = idleState();
    const loop = createLoop(state);
    loop.advance(-100000);
    expect(state.tickCount).toBe(0);
    expect(loop.accumulatorMs).toBe(0);
    expect(state.diagnostics.pendingOfflineMs).toBe(0);
  });

  it('caps catch-up and routes the excess to the offline path rather than dropping it', () => {
    const state = idleState();
    const loop = createLoop(state);

    // An hour of elapsed time in one call.
    const oneHourMs = 60 * 60 * 1000;
    loop.advance(oneHourMs);

    expect(state.tickCount).toBe(MAX_CATCHUP_TICKS);
    const simulatedMs = MAX_CATCHUP_TICKS * TICK_MS;
    // Nothing is lost: what was simulated plus what is pending plus what is
    // still in the accumulator equals what went in.
    expect(simulatedMs + state.diagnostics.pendingOfflineMs + loop.accumulatorMs).toBe(oneHourMs);
    expect(state.diagnostics.pendingOfflineMs).toBeGreaterThan(0);
  });

  it('reports ticks run for the last advance', () => {
    const state = idleState();
    const loop = createLoop(state);
    loop.advance(TICK_MS * 7);
    expect(loop.lastTickCount).toBe(7);
    loop.advance(1);
    expect(loop.lastTickCount).toBe(0);
  });

  it('advances the same state as calling tick directly', () => {
    const definitions: readonly PoolDefinition[] = [
      { id: 'A', label: 'A', initial: 100, conserved: { c: 1 } },
      { id: 'B', label: 'B', initial: 0, conserved: { c: 1 } },
    ];
    const make = (at: (id: string) => number): Reaction[] => [
      {
        id: 'ab',
        substrates: [{ poolIndex: at('A'), coefficient: 1 }],
        products: [{ poolIndex: at('B'), coefficient: 1 }],
        kinetics: michaelisMenten(12, 3),
        enabled: true,
      },
    ];

    const direct = build(definitions, make);
    for (let t = 0; t < 40; t += 1) tick(direct);

    const looped = build(definitions, make);
    const loop = createLoop(looped);
    loop.advance(40 * TICK_MS);

    expect(Array.from(looped.pools.amounts)).toEqual(Array.from(direct.pools.amounts));
    expect(TICK_SECONDS).toBe(TICK_MS / 1000);
  });
});
