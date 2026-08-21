/**
 * Conservation across a compartment boundary.
 *
 * UPDATELOGV14.md stage 2 settles that a compartment is nothing to the kernel.
 * `pools.ts` stays a flat Float64Array with a frozen id-to-index map, `tick.ts`
 * keeps iterating by index, and the conservation property stays a linear pass
 * over a weight matrix. What a compartment gets instead is a convention in pool
 * ids, a grouping the act descriptor knows about, and transport reactions that
 * move matter across a boundary. **A proton crossing a membrane is a reaction.**
 *
 * That decision is only defensible if the invariant survives it, and the
 * invariant is the most valuable thing in `src/sim/`. So this file does for
 * transport what `conservation.test.ts` does for the toy pathway, and then does
 * the part that matters more: it plants the two violations transport actually
 * invites and reads the failures.
 *
 * A CONSERVATION TEST THAT HAS NOT SEEN THE VIOLATION IT EXISTS TO CATCH HAS NOT
 * BEEN CHECKED. Both planted cases below are asserted to fail, so a later log
 * that quietly stops totalling one of these quantities makes this file red
 * rather than making it silent.
 *
 * TOLERANCE is the same 1e-9 relative figure `conservation.test.ts` argues for
 * at length, and the argument is not repeated here. What is worth adding is that
 * the argument transfers exactly: a transport reaction that leaks destroys an
 * O(1) share of its own throughput per tick, which over hundreds of ticks is
 * comparable to the totals themselves. There is no mechanism here that leaks at
 * 1e-8 either.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { createPrng } from '../prng';
import { setShortfallLogging, tick } from '../tick';
import {
  createToyCompartment,
  TOY_COMPARTMENT_KM,
  TOY_COMPARTMENT_POOL_IDS,
  TOY_COMPARTMENT_REACTION_IDS,
  TOY_COMPARTMENT_VMAX,
  type ToyCompartmentPoolId,
  type ToyCompartmentReactionId,
} from './fixtures/toyCompartment';

const RELATIVE_TOLERANCE = 1e-9;

beforeAll(() => {
  setShortfallLogging(false);
});

/** Worst relative drift across every conserved quantity, over `ticks` ticks. */
function worstDrift(state: ReturnType<typeof createToyCompartment>, ticks: number): number {
  const { pools } = state;
  const starts = pools.conservedIds.map((q) => pools.totalConserved(q));

  for (let t = 0; t < ticks; t += 1) tick(state);

  let worst = 0;
  for (let q = 0; q < pools.conservedIds.length; q += 1) {
    const quantity = pools.conservedIds[q] as string;
    const start = starts[q] as number;
    const end = pools.totalConserved(quantity);
    const drift = start === 0 ? Math.abs(end) : Math.abs(end - start) / Math.abs(start);
    if (drift > worst) worst = drift;
  }
  return worst;
}

/** Drift of one named quantity, signed, so a report can say which way it went. */
function signedDrift(
  state: ReturnType<typeof createToyCompartment>,
  quantity: string,
  ticks: number,
): { start: number; end: number; relative: number } {
  const start = state.pools.totalConserved(quantity);
  for (let t = 0; t < ticks; t += 1) tick(state);
  const end = state.pools.totalConserved(quantity);
  return { start, end, relative: start === 0 ? end : (end - start) / start };
}

describe('conservation across a compartment boundary', () => {
  it('holds for the default two-compartment configuration over 5000 ticks', () => {
    expect(worstDrift(createToyCompartment(), 5000)).toBeLessThan(RELATIVE_TOLERANCE);
  });

  it('holds across 200 randomized configurations', () => {
    // Seeded, for the reason the sibling file gives: a failure that cannot be
    // reproduced is not actionable.
    const rng = createPrng(20260820);
    let worst = 0;

    for (let run = 0; run < 200; run += 1) {
      const initial: Partial<Record<ToyCompartmentPoolId, number>> = {};
      for (const id of TOY_COMPARTMENT_POOL_IDS) {
        initial[id] = rng.next() < 0.15 ? 0 : rng.next() * 2000;
      }
      // The carrier has to exist on one side or nothing crosses at all.
      if ((initial.H_in ?? 0) + (initial.H_out ?? 0) === 0) initial.H_in = 1 + rng.next() * 40;

      const vmax: Partial<Record<ToyCompartmentReactionId, number>> = {};
      const km: Partial<Record<ToyCompartmentReactionId, number>> = {};
      for (const id of TOY_COMPARTMENT_REACTION_IDS) {
        vmax[id] = TOY_COMPARTMENT_VMAX[id] * (0.01 + rng.next() * 100);
        km[id] = TOY_COMPARTMENT_KM[id] * (0.01 + rng.next() * 10);
      }

      const drift = worstDrift(createToyCompartment({ initial, vmax, km, seed: 1 + run }), 500);
      if (drift > worst) worst = drift;
      expect(drift, `run ${run}: ${JSON.stringify({ initial, vmax, km })}`).toBeLessThan(
        RELATIVE_TOLERANCE,
      );
    }

    expect(worst).toBeLessThan(RELATIVE_TOLERANCE);
  });

  it('holds when the carrier is scarce on the side that is being pumped from', () => {
    // Transport under shortfall scaling, which is the path most likely to leak
    // for exactly the reason the sibling file gives: it is the one place a
    // reaction's flux is altered after it was computed. A crossing scaled on its
    // substrate side and not on its product side would show here.
    const state = createToyCompartment({
      initial: { S_out: 4000, S_in: 0, H_out: 0, H_in: 0.5, W_in: 0 },
      vmax: { t_import: 900, t_pump: 1200, r_use: 40 },
      km: { t_import: 0.001, t_pump: 0.001, r_use: 2 },
    });

    let shortfall = 0;
    const drift = worstDrift(state, 1500);
    for (let i = 0; i < state.pools.count; i += 1) {
      shortfall += state.diagnostics.shortfallTicks[i] as number;
    }

    // If nothing ran short this test is asserting nothing and needs retuning.
    expect(shortfall).toBeGreaterThan(0);
    expect(drift).toBeLessThan(RELATIVE_TOLERANCE);
  });

  it('builds a real gradient, so the honest case is not passing by doing nothing', () => {
    // The whole fixture is pointless if the pump never moves anything: a
    // simulation in which no transport happens conserves everything trivially.
    const state = createToyCompartment();
    const before = state.pools.get('H_out');
    for (let t = 0; t < 400; t += 1) tick(state);

    expect(state.pools.get('H_out')).toBeGreaterThan(before);
    expect(state.pools.get('S_in')).toBeGreaterThan(0);
    expect(state.pools.get('W_in')).toBeGreaterThan(0);
    // And the two sides differ, which is what a gradient is.
    expect(Math.abs(state.pools.get('H_out') - state.pools.get('H_in'))).toBeGreaterThan(1);
  });

  it('FAILS when a pump forgets the far side of the crossing', () => {
    // The mistake the flat array invites most directly. In a Float64Array the
    // two ends of a crossing are two unrelated indices, and nothing about the
    // shape of the data says one is the far side of the other.
    const state = createToyCompartment({ leak: 'pump-forgets-the-far-side' });
    const { start, end, relative } = signedDrift(state, 'proton', 2000);

    console.log(
      `  planted leak "pump-forgets-the-far-side": proton ${start.toFixed(6)} -> ${end.toFixed(6)}, ` +
        `relative drift ${Math.abs(relative).toExponential(3)}`,
    );

    // Destroyed, not created, and by an enormous margin rather than subtly.
    expect(end).toBeLessThan(start);
    expect(Math.abs(relative)).toBeGreaterThan(RELATIVE_TOLERANCE);
    expect(Math.abs(relative)).toBeGreaterThan(1e-3);
  });

  it('catches a twin-weight disagreement only while the mismatched pool holds something', () => {
    /**
     * The mistake the LOCATION CONVENTION invites, and it does NOT behave like
     * the one above. This test asserted a magnitude first and the measurement
     * refused it, which turned out to be the useful part of the stage.
     *
     * Every reaction still reads one in and one out. Nothing is unbalanced when
     * read reaction by reaction. The crossing destroys one carbon per unit
     * because the two ends disagree about how much matter a unit is, and then
     * `r_use` CREATES one carbon per unit for the same reason, because W_in
     * carries the true weight and S_in carries the corrupted one.
     *
     * **The two errors cancel through the pathway.** So the standing error is
     * not a share of throughput at all. It is exactly the amount currently held
     * in the mismatched pool, measured here to every digit printed:
     *
     *     t=100    lost 5.341016   S_in 5.341016
     *     t=400    lost 5.445547   S_in 5.445547
     *     t=2000   lost 5.445547   S_in 5.445547
     *     t=6000   lost 0.000000   S_in 0.000000    substrate exhausted
     *
     * THE CONSEQUENCE IS THE FINDING AND IT IS UNCOMFORTABLE. A conservation
     * test that compares a start total against an end total can miss this
     * entirely, because at t=0 and at t=6000 the mismatched pool is empty and
     * the books balance exactly. The drift is real, bounded by a pool level
     * rather than by flux, and invisible at both ends of a complete run.
     *
     * So conservation catches this one opportunistically and cannot be relied on
     * for it. That is why `src/content/__tests__/compartmentIds.test.ts` exists
     * as a structural guard over the weights themselves, and why this test
     * asserts the mechanism rather than a magnitude it does not have.
     */
    const state = createToyCompartment({ leak: 'twin-weights-disagree' });
    const { start, end, relative } = signedDrift(state, 'carbon', 400);
    const held = state.pools.get('S_in');

    console.log(
      `  planted leak "twin-weights-disagree": carbon ${start.toFixed(6)} -> ${end.toFixed(6)}, ` +
        `relative drift ${Math.abs(relative).toExponential(3)}, S_in ${held.toFixed(6)}`,
    );

    // Detected at all: six orders above the tolerance, so it is not float noise.
    expect(Math.abs(relative)).toBeGreaterThan(RELATIVE_TOLERANCE);

    // And detected for the reason claimed. The loss IS the standing amount in
    // the mismatched pool, times the one unit of weight it disagrees by.
    expect(held).toBeGreaterThan(1);
    expect(start - end).toBeCloseTo(held, 9);
  });

  it('and that twin-weight drift returns to zero once the mismatched pool drains', () => {
    // The half of the finding that makes the structural guard necessary rather
    // than merely tidy. Run the same corrupted pathway to substrate exhaustion
    // and the conservation books balance exactly, with the corruption still in
    // the pool table.
    const state = createToyCompartment({ leak: 'twin-weights-disagree' });
    const { start, end } = signedDrift(state, 'carbon', 6000);

    expect(state.pools.get('S_in')).toBeLessThan(1e-6);
    expect(Math.abs(end - start)).toBeLessThan(1e-6);
    console.log(
      `  the same corrupted table, run to exhaustion: carbon ${start.toFixed(6)} -> ${end.toFixed(6)}, ` +
        'undetectable',
    );
  });

  it('reports the worst honest drift observed, which is what the tolerance rests on', () => {
    const rng = createPrng(11);
    let worst = 0;

    for (let run = 0; run < 60; run += 1) {
      const state = createToyCompartment({
        initial: {
          S_out: 100 + rng.next() * 5000,
          H_in: 1 + rng.next() * 80,
          H_out: rng.next() * 40,
        },
        vmax: {
          t_import: 1 + rng.next() * 400,
          t_pump: 1 + rng.next() * 400,
          r_use: 1 + rng.next() * 400,
        },
        seed: run,
      });
      const drift = worstDrift(state, 4000);
      if (drift > worst) worst = drift;
    }

    console.log(`  worst transport conservation drift observed: ${worst.toExponential(3)}`);
    expect(worst).toBeLessThan(RELATIVE_TOLERANCE / 1000);
  });
});
