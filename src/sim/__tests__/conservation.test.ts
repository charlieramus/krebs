import { beforeAll, describe, expect, it } from 'vitest';
import { createPrng } from '../prng';
import { setShortfallLogging, tick } from '../tick';
import {
  createToyPathway,
  TOY_KM,
  TOY_POOL_IDS,
  TOY_REACTION_IDS,
  TOY_VMAX,
  type ToyPoolId,
  type ToyReactionId,
} from './fixtures/toyPathway';
import {
  COMPARTMENT_KM,
  COMPARTMENT_POOL_IDS,
  COMPARTMENT_REACTION_IDS,
  COMPARTMENT_VMAX,
  createCompartmentPathway,
  type CompartmentLeak,
  type CompartmentPoolId,
  type CompartmentReactionId,
} from './fixtures/compartmentPathway';

/**
 * docs/SIMULATION.md line 90: carbon, phosphate and redox equivalents are
 * conserved quantities, and property tests should assert that totals are
 * preserved across long randomized runs within a float tolerance. That doc says
 * this is the cheapest possible check against an entire class of economy bugs
 * and that it should exist before act 1 content does. This is that test.
 *
 * TOLERANCE: 1e-9, relative, on each quantity independently.
 *
 * A tolerance loose enough to pass a real leak is worse than no test, so here
 * is the reasoning for that number rather than just the number.
 *
 * The floor is float noise. Explicit Euler over N ticks performs O(N) rounded
 * additions per pool, and the error accumulates. Measured across the runs in
 * this file, the worst relative drift observed is 1.964e-13, reported by the
 * last test in the file. 1e-9 is between three and four orders of magnitude
 * above that, which is headroom for longer runs and for randomized
 * configurations harsher than the ones sampled here.
 *
 * The ceiling is what a real leak looks like. Conservation bugs are not subtle
 * in magnitude. Clamping a pool at zero, dropping a stoichiometric coefficient,
 * writing a product to the wrong pool index, or scaling a reaction's substrates
 * without scaling its products all destroy or manufacture an O(1) share of one
 * reaction's throughput. Across a run of hundreds of ticks, throughput is
 * comparable to the totals themselves, so any of those shows up as relative
 * drift of 1e-3 or larger. There is no mechanism in this kernel that leaks at
 * 1e-8. The gap between 1e-13 noise and 1e-3 leaks is six orders wide, and 1e-9
 * sits in the middle of it with room on both sides.
 */
const RELATIVE_TOLERANCE = 1e-9;

beforeAll(() => {
  // The shortfall configurations below are deliberately savage and would emit
  // thousands of log lines. The counters are still kept and asserted on.
  setShortfallLogging(false);
});

interface RunResult {
  readonly maxRelativeDrift: number;
  readonly shortfallTicks: number;
}

/** Run a configuration and return its worst relative drift across all conserved quantities. */
function runAndMeasure(state: ReturnType<typeof createToyPathway>, ticks: number): RunResult {
  const { pools } = state;
  const starts = pools.conservedIds.map((q) => pools.totalConserved(q));

  for (let t = 0; t < ticks; t += 1) tick(state);

  let maxRelativeDrift = 0;
  for (let q = 0; q < pools.conservedIds.length; q += 1) {
    const quantity = pools.conservedIds[q] as string;
    const start = starts[q] as number;
    const end = pools.totalConserved(quantity);
    // Relative, not absolute. Carbon totals in the tens of thousands and redox
    // in the thousands would otherwise be held to wildly different standards.
    const drift = start === 0 ? Math.abs(end) : Math.abs(end - start) / Math.abs(start);
    if (drift > maxRelativeDrift) maxRelativeDrift = drift;
  }

  let shortfallTicks = 0;
  for (let i = 0; i < pools.count; i += 1) {
    shortfallTicks += state.diagnostics.shortfallTicks[i] as number;
  }

  return { maxRelativeDrift, shortfallTicks };
}

describe('conservation of mass', () => {
  it('holds for the default configuration over 5000 ticks', () => {
    const { maxRelativeDrift } = runAndMeasure(createToyPathway(), 5000);
    expect(maxRelativeDrift).toBeLessThan(RELATIVE_TOLERANCE);
  });

  it('holds across 200 randomized configurations', () => {
    // Seeded. A failure here has to be reproducible or it is not actionable.
    const rng = createPrng(20260728);
    let worst = 0;
    let worstCase = '';

    for (let run = 0; run < 200; run += 1) {
      const initial: Partial<Record<ToyPoolId, number>> = {};
      for (const id of TOY_POOL_IDS) {
        // Zero is a legitimate starting level and is included on purpose.
        initial[id] = rng.next() < 0.15 ? 0 : rng.next() * 2000;
      }
      // The carrier has to start with something in it or nothing ever runs.
      if ((initial.X ?? 0) + (initial.Y ?? 0) === 0) initial.X = 1 + rng.next() * 20;

      const vmax: Partial<Record<ToyReactionId, number>> = {};
      const km: Partial<Record<ToyReactionId, number>> = {};
      for (const id of TOY_REACTION_IDS) {
        // Two orders of magnitude either side of the fixture defaults.
        vmax[id] = TOY_VMAX[id] * (0.01 + rng.next() * 100);
        km[id] = TOY_KM[id] * (0.01 + rng.next() * 10);
      }

      const state = createToyPathway({ initial, vmax, km, seed: 1 + run });
      const { maxRelativeDrift } = runAndMeasure(state, 500);

      if (maxRelativeDrift > worst) {
        worst = maxRelativeDrift;
        worstCase = JSON.stringify({ run, initial, vmax, km });
      }
      expect(maxRelativeDrift, `run ${run}: ${JSON.stringify({ initial, vmax, km })}`).toBeLessThan(
        RELATIVE_TOLERANCE,
      );
    }

    expect(worst).toBeLessThan(RELATIVE_TOLERANCE);
    expect(worstCase.length).toBeGreaterThan(0);
  });

  it('holds through shortfall scaling, which is the path most likely to leak', () => {
    // Proportional scaling is where mass would go missing, because it is the
    // one place a reaction's flux is altered after it was computed. If the
    // substrates were scaled and the products were not, or if a pool were
    // clamped instead of its consumers scaled, this is where it shows.
    const rng = createPrng(99);
    let sawShortfall = false;

    for (let run = 0; run < 100; run += 1) {
      const state = createToyPathway({
        // A tiny carrier pool against a very fast forward reaction. r1 demands
        // more X in one tick than exists, every tick.
        initial: { A: 5000, P: 5000, X: 0.5 + rng.next() * 3, Y: 0 },
        vmax: { r1: 400 + rng.next() * 4000, r2: 60, r3: 0.1 + rng.next() * 2 },
        km: { r1: 0.001 + rng.next() * 0.1, r2: 4, r3: 2 },
        seed: 500 + run,
      });

      const { maxRelativeDrift, shortfallTicks } = runAndMeasure(state, 800);
      if (shortfallTicks > 0) sawShortfall = true;
      expect(maxRelativeDrift).toBeLessThan(RELATIVE_TOLERANCE);
    }

    // If none of those configurations actually triggered the guard, this test
    // is asserting nothing and needs retuning.
    expect(sawShortfall).toBe(true);
  });

  it('holds when several pools run short at once', () => {
    // Everything scarce simultaneously, so reactions are scaled by factors from
    // more than one pool and the multi-pass loop is exercised.
    const state = createToyPathway({
      initial: { A: 2, B: 0.5, C: 0.5, D: 0, G: 0, P: 1, X: 0.5, Y: 0.5 },
      vmax: { r1: 2000, r2: 3000, r3: 2500 },
      km: { r1: 0.001, r2: 0.001, r3: 0.001 },
    });

    const { maxRelativeDrift, shortfallTicks } = runAndMeasure(state, 2000);
    expect(shortfallTicks).toBeGreaterThan(0);
    expect(maxRelativeDrift).toBeLessThan(RELATIVE_TOLERANCE);
  });

  it('never lets a pool go negative in any of the above', () => {
    const rng = createPrng(4242);
    for (let run = 0; run < 50; run += 1) {
      const state = createToyPathway({
        initial: { A: rng.next() * 100, P: rng.next() * 100, X: rng.next() * 5, Y: rng.next() * 5 },
        vmax: { r1: rng.next() * 3000, r2: rng.next() * 3000, r3: rng.next() * 3000 },
        km: { r1: 0.01, r2: 0.01, r3: 0.01 },
        seed: run,
      });
      for (let t = 0; t < 400; t += 1) {
        tick(state);
        for (let i = 0; i < state.pools.count; i += 1) {
          expect(state.pools.amounts[i]).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it('reports the worst drift actually observed, which is what justifies the tolerance', () => {
    // Not a pass/fail so much as the measurement the tolerance rests on. If
    // this number ever climbs toward 1e-9 the tolerance argument above has
    // stopped being true and needs redoing rather than loosening.
    const rng = createPrng(7);
    let worst = 0;

    for (let run = 0; run < 60; run += 1) {
      const state = createToyPathway({
        initial: { A: 100 + rng.next() * 5000, P: 100 + rng.next() * 5000, X: 1 + rng.next() * 30 },
        vmax: { r1: 1 + rng.next() * 500, r2: 1 + rng.next() * 500, r3: 1 + rng.next() * 500 },
        seed: run,
      });
      const { maxRelativeDrift } = runAndMeasure(state, 4000);
      if (maxRelativeDrift > worst) worst = maxRelativeDrift;
    }

    console.log(`  worst relative conservation drift observed: ${worst.toExponential(3)}`);
    // Three orders below the tolerance. This is the headroom claim, asserted.
    expect(worst).toBeLessThan(RELATIVE_TOLERANCE / 1000);
  });
});

/**
 * CONSERVATION ACROSS A COMPARTMENT BOUNDARY. UPDATELOGV14.md stage 2 step 2.
 *
 * The claim act 3 rests on is that a proton in the intermembrane space and a
 * proton in the matrix are the same proton in a different place, so moving one
 * changes no total. That is what makes the gradient a real quantity rather than
 * a number the designer maintains by hand, and it is the property that decides
 * whether the flat kernel can carry a compartment at all.
 *
 * The kernel needs nothing new for it. `PoolRegistry` totals a quantity by
 * weight over every pool with no notion of where a pool is, so two pools of the
 * same species in two compartments carrying the same weight already conserve
 * across a reaction that moves between them. **A transport reaction is a
 * reaction.** These tests are the proof of that rather than an extension to it.
 *
 * Same tolerance as everything above. No exemption, because a transport
 * reaction that needed a looser tolerance would be a transport reaction that
 * leaks.
 */
describe('conservation across a compartment boundary', () => {
  it('holds through a pump, a symport and a sink over 5000 ticks', () => {
    const { maxRelativeDrift } = runAndMeasure(createCompartmentPathway(), 5000);
    expect(maxRelativeDrift).toBeLessThan(RELATIVE_TOLERANCE);
  });

  it('actually builds a gradient, so the test above is asserting something', () => {
    // GUARD THE GUARD. If the pump never outruns the symport, H_out stays at
    // zero, nothing is ever transported against a gradient, and the test above
    // passes while covering none of what it claims to cover.
    const state = createCompartmentPathway();
    const { pools } = state;
    for (let t = 0; t < 5000; t += 1) tick(state);

    expect(pools.get('H_out')).toBeGreaterThan(0);
    // Matter crossed inward, and it was locked away at the sink.
    expect(pools.get('S_in') + pools.get('M_in')).toBeGreaterThan(0);
    expect(pools.get('W_in')).toBeGreaterThan(0);
    // And the outside pool went down by what came in, which is the transport
    // stated as a fact about two pools rather than about one.
    expect(pools.get('S_out')).toBeLessThan(3000);
  });

  it('holds across 200 randomized configurations', () => {
    const rng = createPrng(20260824);
    let worst = 0;

    for (let run = 0; run < 200; run += 1) {
      const initial: Partial<Record<CompartmentPoolId, number>> = {};
      for (const id of COMPARTMENT_POOL_IDS) {
        initial[id] = rng.next() < 0.15 ? 0 : rng.next() * 2000;
      }
      // Something has to be on one side of the boundary or nothing ever moves.
      if ((initial.H_in ?? 0) + (initial.H_out ?? 0) === 0) initial.H_in = 1 + rng.next() * 20;

      const vmax: Partial<Record<CompartmentReactionId, number>> = {};
      const km: Partial<Record<CompartmentReactionId, number>> = {};
      for (const id of COMPARTMENT_REACTION_IDS) {
        vmax[id] = COMPARTMENT_VMAX[id] * (0.01 + rng.next() * 100);
        km[id] = COMPARTMENT_KM[id] * (0.01 + rng.next() * 10);
      }

      const state = createCompartmentPathway({ initial, vmax, km, seed: 1 + run });
      const { maxRelativeDrift } = runAndMeasure(state, 500);

      if (maxRelativeDrift > worst) worst = maxRelativeDrift;
      expect(
        maxRelativeDrift,
        `run ${run}: ${JSON.stringify({ initial, vmax, km })}`,
      ).toBeLessThan(RELATIVE_TOLERANCE);
    }

    console.log(`  worst drift across a compartment boundary: ${worst.toExponential(3)}`);
  });

  /**
   * THE VIOLATION THE TEST EXISTS TO CATCH, SEEN.
   *
   * Three leak shapes, three different mistakes. Each is asserted to fail by a
   * wide margin rather than merely to fail, because the value of the number is
   * that it sits in the six-order gap the tolerance argument at the top of this
   * file describes: float noise is at 1e-13 and a real leak is at 1e-3 or worse.
   * A leak that landed near the tolerance would mean the tolerance is wrong.
   */
  const LEAKS: readonly (readonly [Exclude<CompartmentLeak, 'none'>, string])[] = [
    ['pump', 'transport that destroys on crossing, 1 in and 0.9 out'],
    ['symport', 'transport that consumes the carried unit and never puts it down'],
    ['sink', 'a product weight that does not match what went into it'],
  ];

  it.each(LEAKS)('catches %s: %s', (leak) => {
    const { maxRelativeDrift } = runAndMeasure(createCompartmentPathway({ leak }), 500);
    console.log(`  leak '${leak}' drifts ${maxRelativeDrift.toExponential(3)} relative`);
    expect(maxRelativeDrift).toBeGreaterThan(RELATIVE_TOLERANCE);
    // Six orders above the tolerance rather than a hair over it.
    expect(maxRelativeDrift).toBeGreaterThan(1e-3);
  });

  it('is clean on the same run with the leak switched off, so the leak is the cause', () => {
    // The three cases above would also fail if the fixture were broken in some
    // other way. Same seed, same tick count, leak 'none': clean. So the only
    // difference between passing and failing is the one coefficient.
    const { maxRelativeDrift } = runAndMeasure(createCompartmentPathway({ leak: 'none' }), 500);
    expect(maxRelativeDrift).toBeLessThan(RELATIVE_TOLERANCE);
  });
});
