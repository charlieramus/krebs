import { describe, expect, it } from 'vitest';
import { EVENT_BUDGET } from '../../../sim/constants';
import { resolveOffline, type OfflineOutcome } from '../../../sim/jump';
import { hill, michaelisMenten, type Kinetics, type Reaction } from '../../../sim/reactions';
import type { SimulationState } from '../../../sim/state';
import { createSteadyDetector } from '../../../sim/steady';
import { setShortfallLogging, tick } from '../../../sim/tick';
import {
  createAct1Meter,
  createAct1MeterProbes,
  recordAct1Tick,
  type Act1Meter,
} from '../meter';
import { createAct1OfflineObserver } from '../offline';
import { createAct1, type Act1ReactionId } from '../reactions';

/**
 * Act 1 through the offline path, against full tick-by-tick replay.
 *
 * This is not the Part 3 validation test. That is stage 4's, it is randomized
 * over durations from one minute to twenty-four hours, and it is where the
 * tolerance gets chosen and justified. These are the properties stage 3 owes:
 * that a jump agrees with replay over a quiet window, that it stops at a
 * depletion rather than through it, that the meter moves with the pools, and
 * that the budget is respected.
 */

setShortfallLogging(false);

function setVmax(state: SimulationState, id: Act1ReactionId, vmax: number): void {
  const reaction = state.reactions.find((r) => r.id === id) as Reaction;
  const kinetics = reaction.kinetics;
  const next: Kinetics =
    kinetics.kind === 'hill'
      ? hill(vmax, kinetics.k, kinetics.n)
      : michaelisMenten(vmax, kinetics.km);
  (reaction as { kinetics: Kinetics }).kinetics = next;
}

/** The top glycolytic rung, transcribed from src/ui/tuning.ts. See steady.test.ts. */
function topRung(state: SimulationState): void {
  setVmax(state, 'uptake', 19);
  setVmax(state, 'prep', 20);
  setVmax(state, 'payoff', 44);
  setVmax(state, 'ferment', 44);
}

type Build = () => SimulationState;

const FRESH: Build = () => createAct1({ enabled: { ferment: true } });
const WALLED: Build = () => createAct1({ enabled: { ferment: false } });
const RUNG_4: Build = () => {
  const state = createAct1({ enabled: { ferment: true } });
  topRung(state);
  return state;
};

interface Run {
  readonly state: SimulationState;
  readonly meter: Act1Meter;
}

function replay(build: Build, ticks: number): Run {
  const state = build();
  const probes = createAct1MeterProbes(state);
  const meter = createAct1Meter();
  for (let i = 0; i < ticks; i += 1) {
    tick(state);
    recordAct1Tick(state, probes, meter);
  }
  return { state, meter };
}

function offline(build: Build, ticks: number): Run & { outcome: OfflineOutcome } {
  const state = build();
  const probes = createAct1MeterProbes(state);
  const meter = createAct1Meter();
  const outcome = resolveOffline(
    state,
    createSteadyDetector(state.pools.count),
    ticks,
    createAct1OfflineObserver(probes, meter),
  );
  return { state, meter, outcome };
}

describe('act 1 has one event kind, and it is a substrate depleting', () => {
  it('finds only glucose_env while the pathway is running', () => {
    const { outcome, state } = offline(FRESH, 20 * 3600); // one game-hour
    expect(outcome.events.length).toBeGreaterThan(0);
    for (const event of outcome.events) {
      if (event.kind !== 'depletion') continue;
      expect(state.pools.ids[event.poolIndex]).toBe('glucose_env');
    }
  });

  it('never treats an unlock threshold as an event, because there is nothing to buy', () => {
    // Not a mechanism test: there is no unlock code on this path at all, which
    // is the point. V3 made unlocks thresholds against a cumulative counter, so
    // a crossing changes no rate and cannot invalidate a steady state. Asserted
    // by the shape of the event record: every event names a pool or names
    // nothing, and there is no kind that could carry an unlock.
    const { outcome } = offline(FRESH, 20 * 3600);
    for (const event of outcome.events) {
      expect(['depletion', 'window-end', 'no-jump']).toContain(event.kind);
    }
  });
});

describe('the jump against full replay', () => {
  /**
   * A quiet window. Ten game-minutes from a fresh fermenting cell contains one
   * event and the pathway holds a steady state throughout, which is the case
   * the whole approach is built for.
   */
  it('agrees with replay over a window with no depletion in it', () => {
    const ticks = 12000;
    const truth = replay(FRESH, ticks);
    const got = offline(FRESH, ticks);

    expect(got.outcome.resolved).toBe(true);
    expect(got.state.tickCount).toBe(ticks);
    for (let i = 0; i < truth.state.pools.count; i += 1) {
      const a = truth.state.pools.amounts[i] as number;
      const b = got.state.pools.amounts[i] as number;
      const scale = Math.max(Math.abs(a), Math.abs(b), 1e-6);
      expect(
        Math.abs(a - b) / scale,
        truth.state.pools.ids[i] as string,
      ).toBeLessThan(5e-3);
    }
  });

  /**
   * THE ONE THAT WOULD NOT SHOW UP IN A POOL COMPARISON. The meter lives
   * outside the simulation, so a jump that advanced the pools and forgot it
   * would leave every pool correct and silently refund the player's progress
   * toward every unlock.
   */
  it('advances the meter with the pools, asserted separately', () => {
    const ticks = 12000;
    const truth = replay(FRESH, ticks);
    const got = offline(FRESH, ticks);

    expect(got.meter.atpProduced).toBeGreaterThan(0);
    const counters: readonly (keyof Act1Meter)[] = [
      'atpProduced',
      'atpSpent',
      'atpMaintained',
      'glucoseConsumed',
      'glucoseTakenUp',
      'lactateProduced',
      'nadhProduced',
    ];
    for (const key of counters) {
      const a = truth.meter[key];
      const b = got.meter[key];
      expect(Math.abs(a - b) / Math.max(Math.abs(a), 1e-9), key).toBeLessThan(5e-3);
    }

    // And it is not merely proportional to the pools by luck: the yield the
    // whole act is about survives the jump. NOT to nine decimal places, which
    // is what the replay path asserts. The offline path is approximate by
    // construction and 4 gross per glucose comes back as 3.998679, which is
    // 3.3e-4 out. That is the honest number and stage 4 is where the tolerance
    // gets chosen rather than noticed.
    const yieldError = Math.abs(got.meter.atpProduced / got.meter.glucoseConsumed - 4) / 4;
    expect(yieldError).toBeLessThan(5e-3);
  });

  it('stops at the depletion rather than through it, from every configuration', () => {
    for (const [name, build] of [
      ['fresh', FRESH],
      ['walled', WALLED],
      ['rung 4', RUNG_4],
    ] as const) {
      for (const ticks of [12000, 288000, 1_728_000]) {
        const { state } = offline(build, ticks);
        for (let i = 0; i < state.pools.count; i += 1) {
          expect(
            state.pools.amounts[i] as number,
            `${name}, ${state.pools.ids[i] as string} at ${ticks} ticks`,
          ).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  /**
   * Conservation across the offline path. The jump writes pool amounts without
   * going through the two-phase update, which is the one place in the project
   * where a pool changes outside the tick, so this is the one place
   * conservation could break without anything existing catching it.
   *
   * The tolerance is looser than the tick's own 1e-9 in exactly one respect and
   * it is disclosed rather than absorbed: retiring a spent pool discards what
   * it held, bounded by OFFLINE_DEPLETED_FRACTION of that pool's peak.
   */
  it('conserves all five quantities across the offline path', () => {
    for (const [name, build] of [
      ['fresh', FRESH],
      ['walled', WALLED],
      ['rung 4', RUNG_4],
    ] as const) {
      for (const ticks of [12000, 288000, 1_728_000]) {
        const start = build();
        const got = offline(build, ticks);
        for (const quantity of start.pools.conservedIds) {
          const before = start.pools.totalConserved(quantity);
          if (before === 0) continue;
          const after = got.state.pools.totalConserved(quantity);
          expect(
            Math.abs(after - before) / before,
            `${name}, ${quantity} at ${ticks} ticks`,
          ).toBeLessThan(1e-9);
        }
      }
    }
  });
});

describe('the budget', () => {
  it('resolves a full twenty-four hours inside EVENT_BUDGET, from every configuration', () => {
    const lines: string[] = [];
    for (const [name, build] of [
      ['fresh', FRESH],
      ['walled', WALLED],
      ['rung 4', RUNG_4],
    ] as const) {
      const { outcome } = offline(build, 24 * 3600 * 20);
      const real = outcome.events.reduce((sum, event) => sum + event.settleTicks, 0);
      lines.push(
        `    ${name.padEnd(10)}${String(outcome.events.length).padStart(4)} events` +
          `${String(real).padStart(8)} real ticks   discarded ${outcome.discarded.toExponential(2)}`,
      );
      expect(outcome.resolved, name).toBe(true);
      expect(outcome.budgetExhausted, name).toBe(false);
      expect(outcome.events.length, name).toBeLessThanOrEqual(EVENT_BUDGET);
      expect(outcome.ticksRemaining, name).toBe(0);
    }
    console.log('  act 1, twenty-four hours resolved offline:');
    for (const line of lines) console.log(line);
  });

  it('never falls back, because act 1 always settles', () => {
    // Part 3 calls the fallback a bug signal rather than a normal condition and
    // says a well-tuned configuration should always settle. This is that claim
    // as an assertion.
    for (const build of [FRESH, WALLED, RUNG_4]) {
      for (const ticks of [1200, 12000, 288000, 1_728_000]) {
        expect(offline(build, ticks).outcome.resolved).toBe(true);
      }
    }
  });

  it('is deterministic: same state, same event sequence', () => {
    const a = offline(RUNG_4, 288000);
    const b = offline(RUNG_4, 288000);
    expect(b.outcome.events).toEqual(a.outcome.events);
    expect(b.meter.atpProduced).toBe(a.meter.atpProduced);
    for (let i = 0; i < a.state.pools.count; i += 1) {
      expect(b.state.pools.amounts[i]).toBe(a.state.pools.amounts[i]);
    }
  });
});
