import { beforeAll, describe, expect, it } from 'vitest';
import { createPrng } from '../../../sim/prng';
import type { SimulationState } from '../../../sim/state';
import { setShortfallLogging, tick } from '../../../sim/tick';
import { ACT1_POOL_IDS, type Act1PoolId } from '../pools';
import { ACT1_REACTION_IDS, createAct1, type Act1ReactionId } from '../reactions';
import { ACT1_KM, ACT1_VMAX } from '../tuning';

/**
 * The V1 conservation guard, pointed at real biology.
 *
 * docs/SIMULATION.md line 90 asked for this test to exist before act 1 content
 * did. It did, and this is the moment it stops guarding invented letters and
 * starts guarding stoichiometry that traces to docs/SCIENCE.md. That ordering
 * was the whole reason the kernel and the content were split across two logs.
 *
 * TOLERANCE: 1e-9 relative, per quantity, unchanged from V1.
 *
 * V1 stage 5 argued that number and the argument still holds, so it is not
 * restated here beyond its shape: the floor is float noise around 1e-13, the
 * ceiling is that real conservation bugs are not subtle and show up at 1e-3 or
 * worse, and 1e-9 sits in the middle of a six-order gap. See
 * src/sim/__tests__/conservation.test.ts for the full reasoning.
 *
 * Act 1 does add something V1 could not test: five quantities rather than
 * three, and two of them are carrier-count invariants whose totals are small
 * integers, 30 and 40, against carbon totals in the tens of thousands. A
 * relative tolerance is doing real work here rather than being a formality.
 */
const RELATIVE_TOLERANCE = 1e-9;

beforeAll(() => {
  setShortfallLogging(false);
});

interface RunResult {
  readonly worstByQuantity: Readonly<Record<string, number>>;
  readonly maxRelativeDrift: number;
  readonly shortfallTicks: number;
}

function runAndMeasure(state: SimulationState, ticks: number): RunResult {
  const { pools } = state;
  const starts = pools.conservedIds.map((q) => pools.totalConserved(q));

  for (let t = 0; t < ticks; t += 1) tick(state);

  const worstByQuantity: Record<string, number> = {};
  let maxRelativeDrift = 0;
  for (let q = 0; q < pools.conservedIds.length; q += 1) {
    const quantity = pools.conservedIds[q] as string;
    const start = starts[q] as number;
    const end = pools.totalConserved(quantity);
    const drift = start === 0 ? Math.abs(end) : Math.abs(end - start) / Math.abs(start);
    worstByQuantity[quantity] = drift;
    if (drift > maxRelativeDrift) maxRelativeDrift = drift;
  }

  let shortfallTicks = 0;
  for (let i = 0; i < pools.count; i += 1) {
    shortfallTicks += state.diagnostics.shortfallTicks[i] as number;
  }

  return { worstByQuantity, maxRelativeDrift, shortfallTicks };
}

/** Track the worst drift seen per quantity across many runs. */
function accumulate(into: Record<string, number>, result: RunResult): void {
  for (const quantity of Object.keys(result.worstByQuantity)) {
    const drift = result.worstByQuantity[quantity] as number;
    if (drift > (into[quantity] ?? 0)) into[quantity] = drift;
  }
}

describe('act 1 conservation of mass', () => {
  it('holds for the shipped configuration over 5000 ticks, fermenting and walled', () => {
    for (const ferment of [true, false]) {
      const { maxRelativeDrift } = runAndMeasure(createAct1({ enabled: { ferment } }), 5000);
      expect(maxRelativeDrift, `ferment ${ferment}`).toBeLessThan(RELATIVE_TOLERANCE);
    }
  });

  it('holds across 200 randomized configurations', () => {
    // Seeded, and the same shape as the toy pathway's randomization, because
    // createAct1 was built to accept it. A failure here has to be reproducible.
    const rng = createPrng(20260729);
    const worst: Record<string, number> = {};
    let worstOverall = 0;

    for (let run = 0; run < 200; run += 1) {
      const initial: Partial<Record<Act1PoolId, number>> = {};
      for (const id of ACT1_POOL_IDS) {
        initial[id] = rng.next() < 0.15 ? 0 : rng.next() * 2000;
      }
      // Both carrier pairs have to start with something in them or nothing
      // runs at all, and a run that does nothing conserves everything for the
      // wrong reason.
      if ((initial.nad ?? 0) + (initial.nadh ?? 0) === 0) initial.nad = 1 + rng.next() * 50;
      if ((initial.atp ?? 0) + (initial.adp ?? 0) === 0) initial.atp = 1 + rng.next() * 50;

      const vmax: Partial<Record<Act1ReactionId, number>> = {};
      const km: Partial<Record<Act1ReactionId, number>> = {};
      for (const id of ACT1_REACTION_IDS) {
        vmax[id] = ACT1_VMAX[id] * (0.01 + rng.next() * 100);
        km[id] = ACT1_KM[id] * (0.01 + rng.next() * 10);
      }

      // Fermentation on for most runs and off for some, so both topologies are
      // covered: a closed carrier loop and a one-way carrier.
      const state = createAct1({
        initial,
        vmax,
        km,
        enabled: { ferment: rng.next() > 0.3 },
        seed: 1 + run,
      });
      const result = runAndMeasure(state, 500);
      accumulate(worst, result);
      if (result.maxRelativeDrift > worstOverall) worstOverall = result.maxRelativeDrift;

      expect(
        result.maxRelativeDrift,
        `run ${run}: ${JSON.stringify({ initial, vmax, km })}`,
      ).toBeLessThan(RELATIVE_TOLERANCE);
    }

    console.log(
      `\n  act 1 worst drift per quantity over 200 randomized runs:\n` +
        Object.keys(worst)
          .sort()
          .map((q) => `    ${q.padEnd(13)}${(worst[q] as number).toExponential(3)}`)
          .join('\n') +
        '\n',
    );
    expect(worstOverall).toBeLessThan(RELATIVE_TOLERANCE);
  });

  it('holds through shortfall scaling, which is the path most likely to leak', () => {
    // A tiny nicotinamide pool against a very fast payoff phase. The payoff
    // phase demands more NAD+ in one tick than exists, repeatedly, which is
    // exactly the situation proportional scaling exists for and the one place
    // a reaction's flux is altered after it was computed.
    const rng = createPrng(4141);
    let sawShortfall = false;

    for (let run = 0; run < 100; run += 1) {
      const state = createAct1({
        initial: {
          glucose_env: 5000,
          glucose: 500,
          g3p: 200,
          nad: 0.5 + rng.next() * 3,
          nadh: 0,
          atp: 200,
          adp: 200,
          pi: 500,
        },
        vmax: { payoff: 400 + rng.next() * 4000, ferment: 0.1 + rng.next() * 2 },
        km: { payoff: 0.001 + rng.next() * 0.1 },
        enabled: { ferment: true },
        seed: 700 + run,
      });

      const result = runAndMeasure(state, 800);
      if (result.shortfallTicks > 0) sawShortfall = true;
      expect(result.maxRelativeDrift).toBeLessThan(RELATIVE_TOLERANCE);
    }

    // If none of those triggered the guard, this test asserts nothing.
    expect(sawShortfall).toBe(true);
  });

  it('holds when several pools run short at once', () => {
    // Both carrier pairs scarce alongside phosphate, so reactions get scaled by
    // factors from more than one pool and the multi-pass loop is exercised.
    const state = createAct1({
      initial: {
        glucose_env: 20,
        glucose: 2,
        g3p: 0.5,
        pyruvate: 0.5,
        lactate: 0,
        nad: 0.5,
        nadh: 0.5,
        atp: 1,
        adp: 1,
        pi: 1,
      },
      vmax: { uptake: 2000, prep: 3000, payoff: 2500, ferment: 2500, maintain: 2000 },
      km: { uptake: 0.001, prep: 0.001, payoff: 0.001, ferment: 0.001, maintain: 0.001 },
      enabled: { ferment: true },
    });

    const result = runAndMeasure(state, 2000);
    expect(result.shortfallTicks).toBeGreaterThan(0);
    expect(result.maxRelativeDrift).toBeLessThan(RELATIVE_TOLERANCE);
  });

  it('never lets a pool go negative', () => {
    const rng = createPrng(31337);
    for (let run = 0; run < 50; run += 1) {
      const state = createAct1({
        initial: {
          glucose_env: rng.next() * 200,
          glucose: rng.next() * 50,
          nad: rng.next() * 5,
          nadh: rng.next() * 5,
          atp: rng.next() * 20,
          adp: rng.next() * 20,
          pi: rng.next() * 50,
        },
        vmax: {
          uptake: rng.next() * 3000,
          prep: rng.next() * 3000,
          payoff: rng.next() * 3000,
          ferment: rng.next() * 3000,
          maintain: rng.next() * 3000,
        },
        km: { uptake: 0.01, prep: 0.01, payoff: 0.01, ferment: 0.01, maintain: 0.01 },
        enabled: { ferment: true },
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
    // The measurement the tolerance rests on, for act 1 specifically. If this
    // climbs toward 1e-9 the argument has stopped being true and needs redoing
    // rather than loosening.
    const rng = createPrng(17);
    const worst: Record<string, number> = {};
    let worstOverall = 0;

    for (let run = 0; run < 60; run += 1) {
      const state = createAct1({
        initial: {
          glucose_env: 1000 + rng.next() * 20000,
          nad: 5 + rng.next() * 100,
          atp: 10 + rng.next() * 200,
          adp: 10 + rng.next() * 200,
          pi: 20 + rng.next() * 400,
        },
        vmax: {
          uptake: 1 + rng.next() * 500,
          prep: 1 + rng.next() * 500,
          payoff: 1 + rng.next() * 500,
          ferment: 1 + rng.next() * 500,
          maintain: 1 + rng.next() * 500,
        },
        enabled: { ferment: true },
        seed: run,
      });
      const result = runAndMeasure(state, 4000);
      accumulate(worst, result);
      if (result.maxRelativeDrift > worstOverall) worstOverall = result.maxRelativeDrift;
    }

    console.log(
      `\n  act 1 worst drift per quantity over 60 long runs:\n` +
        Object.keys(worst)
          .sort()
          .map((q) => `    ${q.padEnd(13)}${(worst[q] as number).toExponential(3)}`)
          .join('\n') +
        `\n  worst overall: ${worstOverall.toExponential(3)}\n`,
    );

    // Three orders below the tolerance, the same headroom claim V1 made.
    expect(worstOverall).toBeLessThan(RELATIVE_TOLERANCE / 1000);
  });
});
