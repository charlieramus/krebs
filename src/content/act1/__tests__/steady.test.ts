import { describe, expect, it } from 'vitest';
import { SETTLE_MAX_TICKS, STEADY_WINDOW } from '../../../sim/constants';
import { computeFlux, hill, michaelisMenten, type Kinetics, type Reaction } from '../../../sim/reactions';
import type { SimulationState } from '../../../sim/state';
import {
  createSteadyDetector,
  observeSteady,
  replayUntilSteady,
  resetSteadyDetector,
} from '../../../sim/steady';
import { setShortfallLogging, tick } from '../../../sim/tick';
import { createAct1, type Act1ReactionId } from '../reactions';

/**
 * Act 1 against the steady-state detector, over every configuration
 * UPDATELOGV8.md stage 1 measured.
 *
 * The kernel properties of the detector live in src/sim/__tests__/steady.test.ts
 * and run against the synthetic pathway. This file is the other half: whether
 * the constants stage 1 derived actually hold against the content, which is the
 * only place they were ever derived from.
 *
 * THE CAPACITY LADDERS ARE REBUILT HERE RATHER THAN IMPORTED. src/ui/tuning.ts
 * owns the rungs and src/content/ may not depend on src/ui/, so the Vmax values
 * below are transcribed. They are asserted against nothing, because a test that
 * imported them would be reaching across the dependency arrow that
 * src/content/README.md draws one way. If the ladder moves, these are
 * configurations that used to be reachable rather than configurations that are
 * wrong, and stage 1's measurement has to be re-run either way.
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

/** src/ui/tuning.ts GLYCOLYSIS_STEPS, transcribed. See the header. */
const GLYCOLYTIC_RUNGS: readonly { uptake: number; prep: number; payoff: number }[] = [
  { uptake: 12, prep: 12, payoff: 26 },
  { uptake: 13, prep: 14, payoff: 30 },
  { uptake: 15, prep: 16, payoff: 36 },
  { uptake: 17, prep: 18, payoff: 40 },
  { uptake: 19, prep: 20, payoff: 44 },
];

/** src/ui/tuning.ts UPTAKE_VMAX_STEPS, transcribed. */
const UPTAKE_RUNGS: readonly number[] = [8, 10, 12];

function applyGlycolyticRung(state: SimulationState, rung: number): void {
  const step = GLYCOLYTIC_RUNGS[rung] as { uptake: number; prep: number; payoff: number };
  setVmax(state, 'uptake', step.uptake);
  setVmax(state, 'prep', step.prep);
  setVmax(state, 'payoff', step.payoff);
  setVmax(state, 'ferment', step.payoff);
}

interface Configuration {
  readonly name: string;
  readonly build: () => SimulationState;
}

const CONFIGURATIONS: readonly Configuration[] = [
  { name: 'walled, fresh', build: () => createAct1({ enabled: { ferment: false } }) },
  { name: 'fermenting, fresh', build: () => createAct1({ enabled: { ferment: true } }) },
  ...[1, 2].map((rung) => ({
    name: `uptake rung ${rung}`,
    build: (): SimulationState => {
      const state = createAct1({ enabled: { ferment: true } });
      setVmax(state, 'uptake', UPTAKE_RUNGS[rung] as number);
      return state;
    },
  })),
  ...[1, 2, 3, 4].map((rung) => ({
    name: `glycolytic rung ${rung}`,
    build: (): SimulationState => {
      const state = createAct1({ enabled: { ferment: true } });
      applyGlycolyticRung(state, rung);
      return state;
    },
  })),
  {
    name: 'fermentation bought after 200 walled ticks',
    build: () => {
      const state = createAct1({ enabled: { ferment: false } });
      for (let i = 0; i < 200; i += 1) tick(state);
      (state.reactions.find((r) => r.id === 'ferment') as Reaction).enabled = true;
      return state;
    },
  },
  ...[20000, 5000, 1000].map((glucose_env) => ({
    name: `environment at ${glucose_env}, top rung`,
    build: (): SimulationState => {
      const state = createAct1({ enabled: { ferment: true }, initial: { glucose_env } });
      applyGlycolyticRung(state, 4);
      for (let i = 0; i < 600; i += 1) tick(state);
      return state;
    },
  })),
  /**
   * THE THREE GLYCOGEN CASES. UPDATELOGV10.md stage 3 step 4.
   *
   * A pool that fills and drains is a pool the detector has an opinion about,
   * and the reserve has two distinct dynamics rather than one. Charging is a
   * pool climbing toward an equilibrium it has not reached. Discharging is a
   * pool draining while the reaction that fills it has stopped. Settled is
   * neither.
   *
   * The detector tests the SECOND difference, so a pool changing at a constant
   * rate is fine and only a pool whose rate is still changing is not. What was
   * worth measuring rather than assuming is whether the reserve's approach to
   * equilibrium is slow enough to look linear inside the window, and it is: see
   * the printed settle ticks.
   */
  {
    name: 'glycogen, charging from empty',
    build: (): SimulationState => {
      const state = createAct1({ enabled: { ferment: true, store: true, mobilise: true } });
      applyGlycolyticRung(state, 4);
      return state;
    },
  },
  {
    name: 'glycogen, deep reserve, food running out',
    build: (): SimulationState => {
      const state = createAct1({
        enabled: { ferment: true, store: true, mobilise: true },
        initial: { glycogen: 2800, glucose_env: 3000 },
      });
      applyGlycolyticRung(state, 4);
      return state;
    },
  },
  {
    name: 'glycogen, discharging with no food left',
    build: (): SimulationState => {
      const state = createAct1({
        enabled: { ferment: true, store: true, mobilise: true },
        initial: { glycogen: 2800, glucose_env: 0 },
      });
      applyGlycolyticRung(state, 4);
      for (let i = 0; i < 600; i += 1) tick(state);
      return state;
    },
  },
];

describe('act 1 settles, from every configuration it reaches', () => {
  for (const configuration of CONFIGURATIONS) {
    it(`settles inside SETTLE_MAX_TICKS: ${configuration.name}`, () => {
      const state = configuration.build();
      const result = replayUntilSteady(
        state,
        createSteadyDetector(state.pools.count),
        SETTLE_MAX_TICKS,
      );
      expect(result.settled, `${configuration.name} did not settle`).toBe(true);
      expect(result.ticksRun).toBeLessThanOrEqual(SETTLE_MAX_TICKS);
    });
  }

  it('reports the settle tick and the budget used, which is what stage 1 measured', () => {
    const lines: string[] = [];
    let worstTicks = 0;
    let worstName = '';
    for (const configuration of CONFIGURATIONS) {
      const state = configuration.build();
      const result = replayUntilSteady(
        state,
        createSteadyDetector(state.pools.count),
        SETTLE_MAX_TICKS,
      );
      const share = (100 * result.ticksRun) / SETTLE_MAX_TICKS;
      lines.push(
        `    ${configuration.name.padEnd(42)}${String(result.ticksRun).padStart(6)}` +
          `${share.toFixed(1).padStart(9)}%`,
      );
      if (result.ticksRun > worstTicks) {
        worstTicks = result.ticksRun;
        worstName = configuration.name;
      }
    }
    console.log('  act 1 settle tick, against a SETTLE_MAX_TICKS of 1200:');
    for (const line of lines) console.log(line);
    console.log(`  worst: ${worstName} at ${worstTicks} ticks`);

    // THE BINDING CASE IS THE STALL, NOT ANY HEALTHY CONFIGURATION. Worth
    // asserting rather than only printing: a later balance change that makes a
    // running cell the slowest to settle has changed something about act 1 that
    // nobody intended, and stage 1's whole epsilon derivation rests on the
    // walled cell being the one against the budget.
    expect(worstName).toBe('walled, fresh');
    expect(worstTicks).toBeLessThan(SETTLE_MAX_TICKS);
  });
});

describe('the cases most likely to be got wrong', () => {
  /**
   * A STALLED PATHWAY IS STEADY, AND "STEADY" DOES NOT MEAN "STOPPED".
   *
   * The NAD+ wall produces a cell in which the payoff phase has stopped and
   * ATP production is exactly zero, and it is a real steady state rather than a
   * failure to reach one. It is not a frozen state: uptake keeps running and
   * intracellular glucose keeps piling up, which is the whole visual of the
   * beat. What has settled is the rates, which is what the jump needs.
   */
  it('detects the NAD+ stall as steady, with zero ATP being produced through it', () => {
    const state = createAct1({ enabled: { ferment: false } });
    const result = replayUntilSteady(
      state,
      createSteadyDetector(state.pools.count),
      SETTLE_MAX_TICKS,
    );
    expect(result.settled).toBe(true);

    const payoff = state.reactions.find((r) => r.id === 'payoff') as Reaction;
    const uptake = state.reactions.find((r) => r.id === 'uptake') as Reaction;
    expect(computeFlux(payoff, state.pools.amounts)).toBeLessThan(1e-6);
    // Not frozen. The environment is still being eaten and the glucose has
    // nowhere to go, which is what a player sees at the wall.
    expect(computeFlux(uptake, state.pools.amounts)).toBeGreaterThan(1);
    expect(state.pools.get('glucose')).toBeGreaterThan(100);
  });

  /**
   * THE TWO TICKS AFTER FERMENTATION IS BOUGHT ARE NOT STEADY, and neither are
   * the next few hundred. V3 measured the visible recovery at 2 ticks and it is
   * right about what a player sees. Stage 1 measured what is underneath: a
   * second, slower timescale in which the glucose that piled up during the
   * stall drains away, and a 141-tick quiet gap between the two that a window
   * of 20 mistakes for a steady state.
   */
  it('does not mistake the fermentation recovery for a steady state', () => {
    const state = createAct1({ enabled: { ferment: false } });
    for (let i = 0; i < 200; i += 1) tick(state);
    (state.reactions.find((r) => r.id === 'ferment') as Reaction).enabled = true;

    const detector = createSteadyDetector(state.pools.count);
    resetSteadyDetector(detector, state);

    // The two ticks V3 measured the recovery in.
    tick(state);
    expect(observeSteady(detector, state)).toBe(false);
    tick(state);
    expect(observeSteady(detector, state)).toBe(false);

    // And the quiet gap in the middle of the recovery, which is the case the
    // window exists for. Under STEADY_WINDOW of 20 this configuration declares
    // steady at about tick 278. It must not.
    let settledAt = -1;
    for (let i = 2; i < SETTLE_MAX_TICKS; i += 1) {
      tick(state);
      if (observeSteady(detector, state)) {
        settledAt = i + 1;
        break;
      }
    }
    expect(settledAt).toBeGreaterThan(400);
    expect(settledAt).toBeLessThan(SETTLE_MAX_TICKS);

    // Guard the guard. The gap is real, so a window of 20 really would have
    // fired inside it, and this assertion is what makes the one above mean
    // something rather than merely pass.
    expect(settledAt).toBeGreaterThan(278 + STEADY_WINDOW - 20);
  });

  it('is deterministic across act 1: same seed, same detection tick', () => {
    for (const configuration of CONFIGURATIONS) {
      const first = configuration.build();
      const second = configuration.build();
      const a = replayUntilSteady(first, createSteadyDetector(first.pools.count), SETTLE_MAX_TICKS);
      const b = replayUntilSteady(second, createSteadyDetector(second.pools.count), SETTLE_MAX_TICKS);
      expect(b.ticksRun, configuration.name).toBe(a.ticksRun);
      expect(b.worstPool, configuration.name).toBe(a.worstPool);
      expect(b.worst, configuration.name).toBe(a.worst);
    }
  });
});
