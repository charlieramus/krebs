/**
 * Can a cell that has been walled for twenty minutes come back?
 *
 * V2 stage 4 tested a 600-tick stall and found recovery in one tick. That is not
 * the question a player asks. A player can meet the wall, not understand it, and
 * leave the tab open for twenty minutes before buying lactate dehydrogenase, and
 * by then the cell has been sitting with NAD+ at zero and ATP effectively gone
 * the whole time. Whether the pathway can restart from there is a measurement
 * rather than an argument, and this is the measurement.
 *
 * IT IS NOT OBVIOUS THAT IT CAN. Once ATP reaches zero the preparatory phase
 * cannot pay its 2 ATP entry cost, and the only reaction that makes ATP is the
 * payoff phase, which needs g3p, which only the preparatory phase makes. That is
 * the bootstrap trap from NOW.md blocking item 1. The way out, if there is one,
 * is that the stall strands g3p in the pool rather than consuming it, so the
 * payoff phase has substrate waiting the moment NAD+ returns.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { TICK_MS, TICK_SECONDS } from '../../sim/constants';
import { setShortfallLogging } from '../../sim/tick';
import { createActRuntime, poolIndex, reactionIndex, type ActRuntime } from '../runtime';
import { FERMENT_ATP_THRESHOLD } from '../tuning';

beforeAll(() => {
  setShortfallLogging(false);
});

const NAD = poolIndex('nad');
const NADH = poolIndex('nadh');
const ATP = poolIndex('atp');
const G3P = poolIndex('g3p');
const GLUCOSE = poolIndex('glucose');
const PAYOFF = reactionIndex('payoff');
const PREP = reactionIndex('prep');

function advance(runtime: ActRuntime, ticks: number, fromMs: number): number {
  let nowMs = fromMs;
  for (let t = 0; t < ticks; t += 1) {
    nowMs += TICK_MS;
    runtime.frame(nowMs);
  }
  return nowMs;
}

describe('recovery from a very long stall', () => {
  it('recovers after 20000 ticks walled, and reports how', () => {
    const STALL_TICKS = 20000; // 1000 game-seconds, about 16.7 minutes.
    const runtime = createActRuntime();
    let nowMs = 0;
    runtime.frame(nowMs);
    nowMs = advance(runtime, STALL_TICKS, nowMs);

    const before = {
      nad: runtime.snapshot.amounts[NAD] as number,
      nadh: runtime.snapshot.amounts[NADH] as number,
      atp: runtime.snapshot.amounts[ATP] as number,
      g3p: runtime.snapshot.amounts[G3P] as number,
      glucose: runtime.snapshot.amounts[GLUCOSE] as number,
      atpProduced: runtime.snapshot.meter.atpProduced,
    };

    // The stall is real and total before the unlock.
    expect(runtime.snapshot.walled).toBe(true);
    expect(before.nad).toBeLessThan(0.05);
    expect(runtime.snapshot.appliedFlux[PAYOFF] as number).toBeLessThan(1e-6);

    // The player can afford the unlock, which is the constraint the ferment
    // threshold is bounded by. If this fails the wall is unsolvable.
    expect(before.atpProduced).toBeGreaterThanOrEqual(FERMENT_ATP_THRESHOLD);
    expect(runtime.buyFerment()).toBe(true);

    // How long until the payoff phase is running again.
    let ticksToRestart = -1;
    for (let t = 0; t < 2000; t += 1) {
      nowMs += TICK_MS;
      runtime.frame(nowMs);
      if (ticksToRestart === -1 && (runtime.snapshot.appliedFlux[PAYOFF] as number) > 1e-6) {
        ticksToRestart = t + 1;
      }
    }

    const after = {
      nad: runtime.snapshot.amounts[NAD] as number,
      atp: runtime.snapshot.amounts[ATP] as number,
      atpProduced: runtime.snapshot.meter.atpProduced,
      payoff: runtime.snapshot.appliedFlux[PAYOFF] as number,
    };

    console.log('');
    console.log(`  20000-tick stall recovery (${(STALL_TICKS * TICK_SECONDS).toFixed(0)} game-seconds walled)`);
    console.log('    at the moment ferment is bought:');
    console.log(`      nad            ${before.nad.toExponential(3)}`);
    console.log(`      nadh           ${before.nadh.toFixed(6)}`);
    console.log(`      atp            ${before.atp.toExponential(3)}`);
    console.log(`      g3p            ${before.g3p.toFixed(6)}   the way back in`);
    console.log(`      glucose        ${before.glucose.toFixed(2)}   piled up inside the cell`);
    console.log(`      atp produced   ${before.atpProduced.toFixed(6)}   frozen at the ceiling`);
    console.log(`    payoff phase restarts after ${ticksToRestart} tick(s)`);
    console.log('    100 game-seconds later:');
    console.log(`      nad            ${after.nad.toFixed(6)}`);
    console.log(`      atp            ${after.atp.toFixed(6)}`);
    console.log(`      atp produced   ${after.atpProduced.toFixed(6)}`);
    console.log(`      payoff flux    ${after.payoff.toFixed(6)} /s`);
    console.log('');

    // It recovers, and it recovers immediately.
    expect(ticksToRestart).toBeGreaterThan(0);
    expect(ticksToRestart).toBeLessThanOrEqual(2);
    expect(after.atpProduced).toBeGreaterThan(before.atpProduced);
    expect(after.payoff).toBeGreaterThan(1);
    expect(runtime.snapshot.walled).toBe(false);
  });

  it('recovers through the payoff phase rather than through the preparatory one', () => {
    // The mechanism matters, not just the outcome. The preparatory phase cannot
    // pay its 2 ATP entry cost when the unlock lands, so it cannot be what
    // restarts the pathway. The stranded g3p is what lets the payoff phase run
    // first and make the ATP the preparatory phase then needs. If a future
    // balance change consumes g3p during the stall, recovery stops being
    // possible and this is the test that says so.
    //
    // THIS ASSERTION CHANGED IN UPDATELOGV5.md STAGE 2 AND THE CLAIM DID NOT.
    // It used to read `atp < 1e-9`, because a walled cell decayed ATP all the
    // way to denormal. The bootstrap repair stops that decay, so ATP now settles
    // at roughly 7e-4 instead. That was a proxy for the real claim and the real
    // claim is asserted directly now: the preparatory phase is contributing
    // nothing. It is second order in ATP, so an ATP four orders below its K of 4
    // puts its flux far below anything that could restart a pathway. Asserting
    // the flux rather than the ATP level also survives the next change to how
    // much ATP a walled cell holds.
    const runtime = createActRuntime();
    let nowMs = 0;
    runtime.frame(nowMs);
    nowMs = advance(runtime, 20000, nowMs);

    expect(runtime.snapshot.amounts[G3P] as number).toBeGreaterThan(0.1);
    expect(runtime.snapshot.amounts[ATP] as number).toBeLessThan(0.01);
    expect(runtime.snapshot.appliedFlux[PREP] as number).toBeLessThan(1e-6);
  });
});
