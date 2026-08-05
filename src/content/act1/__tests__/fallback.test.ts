import { describe, expect, it } from 'vitest';
import { COARSE_STEP_SECONDS, TICK_RATE_HZ } from '../../../sim/constants';
import { coarseReplay } from '../../../sim/jump';
import { setShortfallLogging, tick } from '../../../sim/tick';
import {
  createAct1Meter,
  createAct1MeterProbes,
  recordAct1Tick,
  type Act1Meter,
} from '../meter';
import { createAct1OfflineObserver } from '../offline';
import { buildConfiguration } from '../offlineValidation';

/**
 * THE FALLBACK, RUN DELIBERATELY.
 *
 * docs/SIMULATION.md Part 3 specifies coarse replay at 1Hz when a configuration
 * will not settle, and calls the flag it raises a bug signal rather than a
 * normal condition. Act 1 as V5 balanced it always settles, which stage 4
 * asserts over 200 randomized cases, so nothing in normal play reaches this
 * code.
 *
 * A FALLBACK NOBODY HAS EVER EXECUTED IS NOT A FALLBACK. These tests run it on
 * purpose and report what it does to act 1, which is the only way to know
 * whether the thing standing behind the offline path would hold anything up.
 *
 * Part 3's own rejection of coarse replay as a method says explicit Euler with a
 * large step is unstable in precisely this nonlinear system and produces wrong
 * answers rather than approximate ones. So the expectation going in is that it
 * is bad, and the question is how bad and in which direction.
 */

setShortfallLogging(false);

function replay(configuration: string, ticks: number): { meter: Act1Meter; state: ReturnType<typeof buildConfiguration> } {
  const state = buildConfiguration(configuration);
  const probes = createAct1MeterProbes(state);
  const meter = createAct1Meter();
  for (let i = 0; i < ticks; i += 1) {
    tick(state);
    recordAct1Tick(state, probes, meter);
  }
  return { state, meter };
}

function coarse(configuration: string, ticks: number): { meter: Act1Meter; state: ReturnType<typeof buildConfiguration> } {
  const state = buildConfiguration(configuration);
  const probes = createAct1MeterProbes(state);
  const meter = createAct1Meter();
  coarseReplay(state, ticks, createAct1OfflineObserver(probes, meter));
  return { state, meter };
}

describe('the coarse-replay fallback', () => {
  it('takes 1Hz steps and lands on the tick count it was asked for', () => {
    expect(COARSE_STEP_SECONDS * TICK_RATE_HZ).toBe(20);
    const state = buildConfiguration('fermenting');
    expect(coarseReplay(state, 12000)).toBe(12000);
    expect(state.tickCount).toBe(12000);
  });

  it('covers a window that is not a whole number of coarse steps', () => {
    const state = buildConfiguration('fermenting');
    // 12007 ticks is 600 whole seconds plus 7 ticks. The remainder is taken as a
    // shorter step rather than dropped or overrun, because losing seven ticks
    // per absence is exactly the silent loss Part 3 rejects.
    expect(coarseReplay(state, 12007)).toBe(12007);
    expect(state.tickCount).toBe(12007);
  });

  it('meters a coarse step at its own length, not at the tick length', () => {
    // A meter that assumed TICK_SECONDS would undercount twentyfold, and the
    // symptom would look like the fallback losing the player's progress rather
    // than like a bookkeeping bug.
    const short = coarse('fermenting', 12000);
    const truth = replay('fermenting', 12000);
    const ratio = short.meter.glucoseTakenUp / truth.meter.glucoseTakenUp;
    expect(ratio).toBeGreaterThan(0.5);
    expect(ratio).toBeLessThan(2);
  });

  it('conserves, because a coarse step is still the two-phase update', () => {
    const start = buildConfiguration('fermenting');
    const got = coarse('fermenting', 72000);
    for (const quantity of start.pools.conservedIds) {
      const before = start.pools.totalConserved(quantity);
      if (before === 0) continue;
      const after = got.state.pools.totalConserved(quantity);
      expect(Math.abs(after - before) / before, quantity).toBeLessThan(1e-9);
    }
  });

  it('never drives a pool negative, which is the failure that would matter', () => {
    for (const configuration of ['fermenting', 'walled', 'glycolytic-4']) {
      const got = coarse(configuration, 288000);
      for (let i = 0; i < got.state.pools.count; i += 1) {
        expect(
          got.state.pools.amounts[i] as number,
          `${configuration}, ${got.state.pools.ids[i] as string}`,
        ).toBeGreaterThanOrEqual(0);
      }
    }
  });

  /**
   * THE FINDING, AND IT IS WORSE THAN "KNOWINGLY WORSE".
   *
   * A 1Hz step drives act 1's cell into the unrecoverable ATP state NOW.md
   * blocking item 1 describes, on the first step, from every configuration.
   * `prep` costs 2 ATP per unit of flux and a one-second step asks for twenty
   * times what a tick asks for, against an adenylate pool of 40, so the
   * proportional scaling saves conservation and nothing else: ATP goes to the
   * floor, the preparatory phase can no longer pay its entry cost, and the
   * payoff phase never runs again. Cumulative ATP is exactly zero after an hour.
   *
   * Part 3 predicted the shape of this and understated it. Its own rejection of
   * coarse replay says explicit Euler with a large step "produces wrong answers
   * rather than approximate ones". The wrong answer is total.
   *
   * ASSERTED AS ZERO RATHER THAN BOUNDED LOOSELY, on purpose. If a later change
   * makes the fallback survivable, this test fails and whoever made it can
   * delete the blocking item this finding opened rather than leaving a stale
   * warning on the page.
   */
  it('drives act 1 into the unrecoverable ATP state, from every configuration', () => {
    for (const configuration of ['fermenting', 'walled', 'glycolytic-4']) {
      const got = coarse(configuration, 72000);
      expect(got.meter.atpProduced, configuration).toBe(0);
      // Not starvation. The food is still there and the cell cannot use it.
      expect(got.state.pools.get('glucose_env'), configuration).toBeGreaterThan(1000);
    }
  });

  it('is knowingly worse than the path it backs up, and reports how much', () => {
    const lines: string[] = [];
    let worst = 0;
    for (const configuration of ['fermenting', 'walled', 'glycolytic-4']) {
      for (const ticks of [12000, 72000]) {
        const truth = replay(configuration, ticks);
        const got = coarse(configuration, ticks);
        const scale = Math.max(truth.meter.atpProduced, 1e-9);
        const atpRelative = Math.abs(truth.meter.atpProduced - got.meter.atpProduced) / scale;
        if (atpRelative > worst) worst = atpRelative;
        lines.push(
          `    ${configuration.padEnd(14)}${String(ticks / 1200).padStart(4)} min` +
            `   ATP ${truth.meter.atpProduced.toFixed(0).padStart(9)} replay` +
            `${got.meter.atpProduced.toFixed(0).padStart(10)} coarse` +
            `   relative ${atpRelative.toExponential(2)}`,
        );
      }
    }
    console.log('  the coarse-replay fallback against full replay:');
    for (const line of lines) console.log(line);
    console.log(`  worst relative disagreement on cumulative ATP: ${worst.toExponential(3)}`);

    // NOT AN ACCURACY ASSERTION. The fallback is allowed to be wrong and Part 3
    // says so. What is asserted is the measurement itself: the disagreement is
    // total, at exactly 1, because the coarse path credits no ATP at all. The
    // figures above are the report and the test above is the finding.
    expect(Number.isFinite(worst)).toBe(true);
    expect(worst).toBe(1);
  });
});
