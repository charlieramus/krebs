/**
 * The ATP bootstrap trap, and the assertion that it stays repaired.
 *
 * NOW.md blocking item 1, open from V2 stage 5 to V5 stage 2. Act 1 had a state
 * it could not come back from: baseline maintenance drained ATP faster than the
 * pathway could bootstrap, the preparatory phase could no longer pay its 2 ATP
 * entry cost, and nothing restarted it, because `prep` needs ATP and `payoff`
 * needs the g3p that only `prep` makes. The cell then sat there with food in
 * front of it, forever.
 *
 * WHY THIS FILE IS WORTH MORE THAN THE FIX. The repair is four characters of
 * kinetic form and one derived constant. What is expensive is knowing that it is
 * needed at all, and that knowledge is the thing a later balance pass will lose.
 * Every assertion below is written so that reintroducing the trap fails here,
 * with a message that says what was reintroduced.
 *
 * The mechanism test is the important one. Outcome tests would still pass under
 * a tuning that happened to avoid the trap by accident at today's numbers.
 */

import { describe, expect, it } from 'vitest';
import { TICK_RATE_HZ } from '../../../sim/constants';
import type { SimulationState } from '../../../sim/state';
import { setShortfallLogging, tick } from '../../../sim/tick';
import type { Reaction } from '../../../sim/reactions';
import {
  createAct1Meter,
  createAct1MeterProbes,
  recordAct1Tick,
  type Act1Meter,
} from '../meter';
import { createAct1, type Act1ReactionId } from '../reactions';
import { ACT1_HILL_N, ACT1_MAINTAIN_HILL_N } from '../tuning';
import { ACT1_INITIAL } from '../pools';

setShortfallLogging(false);

const ADENYLATE_TOTAL = ACT1_INITIAL.atp + ACT1_INITIAL.adp;

interface Run {
  readonly state: SimulationState;
  readonly meter: Act1Meter;
  advance(seconds: number): void;
}

/** A running act 1 with the cumulative meter attached, ferment on unless said otherwise. */
function start(options: {
  env?: number;
  atp?: number;
  ferment?: boolean;
}): Run {
  const atp = options.atp;
  const state = createAct1({
    enabled: { ferment: options.ferment ?? true },
    initial: {
      ...(options.env === undefined ? {} : { glucose_env: options.env }),
      ...(atp === undefined ? {} : { atp, adp: ADENYLATE_TOTAL - atp }),
    },
  });
  const meter = createAct1Meter();
  const probes = createAct1MeterProbes(state);
  return {
    state,
    meter,
    advance(seconds: number): void {
      const ticks = Math.round(seconds * TICK_RATE_HZ);
      for (let i = 0; i < ticks; i += 1) {
        tick(state);
        recordAct1Tick(state, probes, meter);
      }
    },
  };
}

/** Carbon the cell can no longer reach: everything still outside plus everything stuck inside. */
function strandedGlucose(state: SimulationState): number {
  return state.pools.get('glucose_env') + state.pools.get('glucose');
}

function kineticsOf(state: SimulationState, id: Act1ReactionId) {
  return (state.reactions.find((r) => r.id === id) as Reaction).kinetics;
}

describe('the ATP bootstrap trap', () => {
  /* ===================================================================== */

  it('keeps consumption falling off faster in ATP than production does', () => {
    /** Built for its reaction table. Nothing is run on it. */
    const fresh = start({});
    // THE MECHANISM, AND THE ONE ASSERTION THAT MATTERS MOST.
    //
    // At low ATP a Hill term of order n behaves as (Vmax / K^n) * atp^n. `prep`
    // is the pathway's only entry point and it is order ACT1_HILL_N in ATP.
    // `maintain` is the only thing spending ATP that produces none. If
    // maintenance is a lower order than the preparatory phase, then below some
    // ATP level consumption beats production for every choice of constants, the
    // cell spirals to zero and it never comes back. That is not a tuning
    // accident, it is an ordering fact, and it was act 1's blocking item 1.
    //
    // If this fails, the trap is back. Do not retune around it: raise the order.
    const maintain = kineticsOf(fresh.state, 'maintain');
    const prep = kineticsOf(fresh.state, 'prep');

    expect(prep.kind).toBe('hill');
    expect(maintain.kind).toBe('hill');
    if (prep.kind !== 'hill' || maintain.kind !== 'hill') return;

    expect(prep.n).toBe(ACT1_HILL_N);
    expect(maintain.n).toBe(ACT1_MAINTAIN_HILL_N);
    expect(maintain.n).toBeGreaterThan(prep.n);
  });

  /* ===================================================================== */

  it('extracts every glucose in the environment rather than stranding some', () => {
    // Before the repair this stranded exactly 169.57 glucose at every
    // environment size from 200 upward: the cell died, uptake kept running, and
    // the imported glucose sat inside a pathway that could not use it. The
    // signature was a constant. 4 ATP gross per glucose is the sourced ledger,
    // so extracting all of a finite environment means producing exactly 4x it.
    for (const env of [2000, 1000, 500, 200, 100]) {
      const run = start({ env });
      run.advance(40 * 60);

      expect(strandedGlucose(run.state)).toBeLessThan(0.01);
      expect(run.meter.atpProduced).toBeCloseTo(4 * env, 2);
    }
  });

  /* ===================================================================== */

  it('comes back when food returns after the environment has been emptied', () => {
    // NOW.md blocking item 1, as one assertion. The old failure was not that
    // the cell died of starvation, which is fine, but that it stayed dead with
    // a full environment in front of it. Measured before the repair: ATP at
    // refeed 3.95e-323 and 0.00 ATP produced in the following ten game-minutes.
    const run = start({ env: 500 });
    run.advance(20 * 60);

    expect(run.state.pools.get('glucose_env')).toBeLessThan(0.01);
    const beforeRefeed = run.meter.atpProduced;

    run.state.pools.set('glucose_env', 80000);
    run.advance(10 * 60);

    expect(run.meter.atpProduced - beforeRefeed).toBeGreaterThan(1000);
  });

  /* ===================================================================== */

  it('restarts from an ATP level below anything a run can reach, at any food level', () => {
    // "At or near zero" has to mean something measurable. A repaired cell with
    // no food at all bottoms out at an ATP of roughly 0.13 to 0.18 out of an
    // adenylate total of 40, so 0.05 is below every state a run can actually
    // arrive at, and 0 is the boundary case the pathway is allowed to refuse.
    //
    // The bar scales with the food, because it has to. At an environment of 1
    // glucose the entire theoretical yield is 4 ATP, so a fixed threshold would
    // be asserting that the cell recovered AND that the environment was large,
    // which is two claims wearing one number. Five game-minutes is long enough
    // to clear 100 glucose from a standing start, so that is where the bar caps.
    for (const env of [80000, 10000, 1000, 100, 10, 1]) {
      const run = start({ env, atp: 0.05 });
      run.advance(5 * 60);
      const reachable = 4 * Math.min(env, 100);
      expect(run.meter.atpProduced).toBeGreaterThan(0.9 * reachable);
    }
  });

  /* ===================================================================== */

  it('still lets a cell with no food do nothing at all', () => {
    // The repair must not have bought immortality. A cell with no glucose
    // produces no ATP, holds a small residual charge and waits. That residual
    // is what makes the refeed test above pass, so the two assertions are the
    // same property read from both ends.
    const run = start({ env: 0 });
    run.advance(10 * 60);

    expect(run.meter.atpProduced).toBe(0);
    expect(run.state.pools.get('atp')).toBeGreaterThan(0.01);
    expect(run.state.pools.get('atp')).toBeLessThan(1);
  });

  /* ===================================================================== */

  it('cannot climb out of exactly zero ATP, and that is stoichiometry', () => {
    // DELIBERATE, AND NOT A GAP IN THE REPAIR. `prep` is the only route to g3p
    // and it cannot run without ATP, so producing ATP from an ATP of exactly
    // zero would mean producing it from nothing, which the conservation test
    // exists to forbid. Recovery time from a near-zero ATP scales as 1 / atp:
    // 4.2s from 1, 10.8s from 0.1, 11m13s from 0.001, over four game-hours from
    // 1e-6, all measured in UPDATELOGV5.md stage 2.
    //
    // The repair works by making the collapse not happen, so these levels are
    // never reached. It does not work by making them survivable, and a future
    // log that tries to make this test pass is solving the wrong problem.
    const run = start({ env: 80000, atp: 0 });
    run.advance(10 * 60);
    expect(run.meter.atpProduced).toBe(0);
  });
});
