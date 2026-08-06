/**
 * The Part 3 validation requirement, as a runnable sweep.
 *
 * docs/SIMULATION.md Part 3: "Write a test that runs the same scenario two
 * ways, once by full tick-by-tick replay and once through the offline path, and
 * asserts the results agree within tolerance. Run it across randomized
 * durations from one minute to twenty-four hours. This test is the
 * justification for the entire approach. Without it the offline path is an
 * unverified shortcut."
 *
 * This file is the sweep. Two callers use it and they differ only in the band
 * of durations they ask for:
 *
 *   __tests__/offlineValidation.test.ts   the fast band, in `npm test`
 *   validate.ts                            the full band, `npm run offline:validate`
 *
 * SEEDED, using the same PRNG the simulation uses, for the reason V1 stage 5
 * gave for the conservation property test: a randomized test that cannot be
 * replayed from a seed reports a failure nobody can reproduce.
 *
 * NO CLOCK EXCEPT `performance.now`. docs/SIMULATION.md Part 5 and the ESLint
 * guard put `Date.now` outside simulation code, and this directory is inside
 * it. `performance.now` is a monotonic duration reading rather than a wall
 * clock, it never enters simulation state, and the only thing it is used for is
 * reporting how long the reference side took.
 */

import { createPrng, type Prng } from '../../sim/prng';
import { resolveOffline } from '../../sim/jump';
import type { PoolRegistry } from '../../sim/pools';
import { hill, michaelisMenten, type Kinetics, type Reaction } from '../../sim/reactions';
import type { SimulationState } from '../../sim/state';
import { createSteadyDetector } from '../../sim/steady';
import { setShortfallLogging, tick } from '../../sim/tick';
import {
  createAct1Meter,
  createAct1MeterProbes,
  recordAct1Tick,
  type Act1Meter,
} from './meter';
import { createAct1OfflineObserver } from './offline';
import { createAct1, type Act1ReactionId } from './reactions';

setShortfallLogging(false);

/* ---------------------------------------------------------------------------
   The configurations act 1 actually reaches.

   The capacity ladders are transcribed from src/ui/tuning.ts rather than
   imported, because src/content/ may not depend on src/ui/. See the same note
   in __tests__/steady.test.ts.
   --------------------------------------------------------------------------- */

interface Rung {
  readonly uptake: number;
  readonly prep: number;
  readonly payoff: number;
}

const GLYCOLYTIC_RUNGS: readonly Rung[] = [
  { uptake: 12, prep: 12, payoff: 26 },
  { uptake: 13, prep: 14, payoff: 30 },
  { uptake: 15, prep: 16, payoff: 36 },
  { uptake: 17, prep: 18, payoff: 40 },
  { uptake: 19, prep: 20, payoff: 44 },
];

const UPTAKE_RUNGS: readonly number[] = [8, 10, 12];

function setVmax(state: SimulationState, id: Act1ReactionId, vmax: number): void {
  const reaction = state.reactions.find((r) => r.id === id) as Reaction;
  const kinetics = reaction.kinetics;
  const next: Kinetics =
    kinetics.kind === 'hill'
      ? hill(vmax, kinetics.k, kinetics.n)
      : michaelisMenten(vmax, kinetics.km);
  (reaction as { kinetics: Kinetics }).kinetics = next;
}

export const CONFIGURATIONS: readonly string[] = [
  'walled',
  'fermenting',
  'uptake-1',
  'uptake-2',
  'glycolytic-1',
  'glycolytic-2',
  'glycolytic-3',
  'glycolytic-4',
  'walled-then-bought',
  'environment-low',
];

export function buildConfiguration(name: string): SimulationState {
  if (name === 'walled') return createAct1({ enabled: { ferment: false } });
  if (name === 'walled-then-bought') {
    const state = createAct1({ enabled: { ferment: false } });
    for (let i = 0; i < 200; i += 1) tick(state);
    (state.reactions.find((r) => r.id === 'ferment') as Reaction).enabled = true;
    return state;
  }
  if (name === 'environment-low') {
    const state = createAct1({ enabled: { ferment: true }, initial: { glucose_env: 4000 } });
    const rung = GLYCOLYTIC_RUNGS[4] as Rung;
    setVmax(state, 'uptake', rung.uptake);
    setVmax(state, 'prep', rung.prep);
    setVmax(state, 'payoff', rung.payoff);
    setVmax(state, 'ferment', rung.payoff);
    return state;
  }

  const state = createAct1({ enabled: { ferment: true } });
  if (name.startsWith('uptake-')) {
    setVmax(state, 'uptake', UPTAKE_RUNGS[Number(name.slice(7)) as number] as number);
    return state;
  }
  if (name.startsWith('glycolytic-')) {
    const rung = GLYCOLYTIC_RUNGS[Number(name.slice(11)) as number] as Rung;
    setVmax(state, 'uptake', rung.uptake);
    setVmax(state, 'prep', rung.prep);
    setVmax(state, 'payoff', rung.payoff);
    setVmax(state, 'ferment', rung.payoff);
    return state;
  }
  return state;
}

/* ---------------------------------------------------------------------------
   Durations.

   Log-uniform in spirit and multiplication in fact, because docs/SIMULATION.md
   Part 5 bans Math.log and Math.exp in this directory. A band is picked
   uniformly and then jittered by up to its own width, which puts roughly equal
   numbers of cases in each decade without ever taking a logarithm.
   --------------------------------------------------------------------------- */

const MINUTE_TICKS = 1200;

/** One minute to twenty-four hours, as Part 3 asks for. */
export const DURATION_BANDS: readonly number[] = [
  MINUTE_TICKS,
  MINUTE_TICKS * 2,
  MINUTE_TICKS * 5,
  MINUTE_TICKS * 10,
  MINUTE_TICKS * 20,
  MINUTE_TICKS * 40,
  MINUTE_TICKS * 90,
  MINUTE_TICKS * 180,
  MINUTE_TICKS * 360,
  MINUTE_TICKS * 720,
  MINUTE_TICKS * 1440,
];

const MAX_TICKS = MINUTE_TICKS * 1440;

/**
 * The tolerance, and it is not the conservation tolerance.
 *
 * V1 stage 5 set 1e-9 for conservation and justified it against a worst
 * observed drift of 1.964e-13, a margin of five thousand. That number is what
 * float64 arithmetic does to an invariant that should hold exactly, and the
 * margin can be enormous because the true answer is zero.
 *
 * This is a different kind of number. The offline path is an approximation by
 * construction and its error is a designed quantity rather than an accident: it
 * is roughly MAX_JUMP_DEPLETION_FRACTION multiplied by how much the rates drift
 * across one jump. Halving the jump fraction halves it, which stage 3 measured.
 * So the tolerance cannot be set at five thousand times the observation without
 * ceasing to be a test.
 *
 * MEASURED, over 200 randomized cases at seed 20260805, one minute to
 * twenty-four hours, across all ten configurations act 1 reaches:
 *
 *   worst relative disagreement on cumulative gross ATP   7.038e-3
 *   worst absolute disagreement                           617.8 ATP of 306482
 *   worst misplaced fraction                              2.509e-2
 *   worst conservation drift                              1.417e-10
 *
 * 2e-2 is 2.8x above the worst observed. Chosen so that doubling
 * MAX_JUMP_DEPLETION_FRACTION would not pass silently, because that is the
 * change most likely to be made by somebody trying to make the offline path
 * cheaper, and it is exactly the change this test exists to catch.
 *
 * WHERE THE WORST CASE IS, AND IT IS NOT WHERE THE STAGE PROMPT EXPECTED. Both
 * worst relative cases are at the short end rather than at twenty-four hours,
 * which the prompt names as the signature of a bounded-replay problem. There
 * was one and it was fixed: see OFFLINE_TAIL_FRACTION. What remains is
 * arithmetic rather than a defect. A short window is one bounded replay plus
 * one jump, so a single jump's drift is the whole of the error and the
 * denominator is small. The worst ABSOLUTE disagreement is at 130 minutes and
 * is 617.8 ATP out of 306482, which is where a real error would show.
 */
export const OFFLINE_ATP_TOLERANCE = 2e-2;

/**
 * How much of any conserved quantity may sit in a different pool than full
 * replay put it in, as a fraction of that quantity's total.
 *
 * A pool-by-pool relative comparison is meaningless here and would be a worse
 * test rather than a stricter one: at the end of a long absence the intermediate
 * pools of a starved cell hold 1e-4 units and disagree by 15 percent of that,
 * which says nothing about whether the offline path works. Weighting each
 * difference by what the pool carries and dividing by the conserved total asks
 * the question that matters, which is how much of the carbon is in the wrong
 * place.
 *
 * Worst observed 2.509e-2 over the same 200 cases. 1e-1 is 4x above it.
 */
export const OFFLINE_MISPLACED_TOLERANCE = 1e-1;

/**
 * Conservation across the offline path, held to the same 1e-9 the tick is held
 * to since V1 stage 5 rather than to something looser.
 *
 * The margin is 7x against a worst observed 1.417e-10, which is far thinner
 * than the tick's own five thousand, and that is the point of stating it: the
 * offline path has a second source of loss the tick does not have, which is
 * retiring a spent pool, and the number to watch is this one.
 */
export const OFFLINE_CONSERVATION_TOLERANCE = 1e-9;

export interface SweepCase {
  readonly index: number;
  readonly configuration: string;
  readonly ticks: number;
}

export interface CaseResult {
  readonly sweepCase: SweepCase;
  /** Relative disagreement on cumulative gross ATP. The headline number. */
  readonly atpRelative: number;
  /** The same disagreement in ATP units, which is what the player would be short. */
  readonly atpAbsolute: number;
  /** Cumulative gross ATP full replay produced over this window. */
  readonly atpTotal: number;
  /** Worst disagreement on any of the seven meter counters. */
  readonly meterRelative: number;
  /**
   * Worst over the five conserved quantities of how much of that quantity sits
   * in a different pool than replay put it in, as a fraction of its total. A
   * pool-by-pool relative error is meaningless for a pool holding 3e-4 units in
   * a dying cell; this is not, because the denominator is the whole conserved
   * quantity rather than the pool.
   */
  readonly misplacedFraction: number;
  /** Worst conservation drift across the offline path, over all five quantities. */
  readonly conservationRelative: number;
  readonly events: number;
  readonly resolved: boolean;
  readonly budgetExhausted: boolean;
  readonly discarded: number;
  readonly replayMs: number;
  readonly offlineMs: number;
}

function pickBand(prng: Prng, count: number): number {
  return Math.floor(prng.next() * count);
}

export function buildSweep(seed: number, count: number, maxBand: number): SweepCase[] {
  const prng = createPrng(seed);
  const cases: SweepCase[] = [];
  const bands = Math.min(maxBand, DURATION_BANDS.length);
  for (let i = 0; i < count; i += 1) {
    const configuration = CONFIGURATIONS[pickBand(prng, CONFIGURATIONS.length)] as string;
    const base = DURATION_BANDS[pickBand(prng, bands)] as number;
    const jitter = 1 + prng.next();
    const ticks = Math.min(MAX_TICKS, Math.max(MINUTE_TICKS, Math.round(base * jitter)));
    cases.push({ index: i, configuration, ticks });
  }
  return cases;
}

interface Run {
  readonly state: SimulationState;
  readonly meter: Act1Meter;
  readonly ms: number;
}

function replay(configuration: string, ticks: number): Run {
  const state = buildConfiguration(configuration);
  const probes = createAct1MeterProbes(state);
  const meter = createAct1Meter();
  const started = performance.now();
  for (let i = 0; i < ticks; i += 1) {
    tick(state);
    recordAct1Tick(state, probes, meter);
  }
  return { state, meter, ms: performance.now() - started };
}

const METER_COUNTERS: readonly (keyof Act1Meter)[] = [
  'atpProduced',
  'atpSpent',
  'atpMaintained',
  'glucoseConsumed',
  'glucoseTakenUp',
  'lactateProduced',
  'nadhProduced',
];

function relative(expected: number, actual: number): number {
  const scale = Math.max(Math.abs(expected), Math.abs(actual));
  if (scale === 0) return 0;
  return Math.abs(expected - actual) / scale;
}

export function runCase(sweepCase: SweepCase): CaseResult {
  const truth = replay(sweepCase.configuration, sweepCase.ticks);

  const state = buildConfiguration(sweepCase.configuration);
  const probes = createAct1MeterProbes(state);
  const meter = createAct1Meter();
  const startTotals = state.pools.conservedIds.map((q) => state.pools.totalConserved(q));
  const started = performance.now();
  const outcome = resolveOffline(
    state,
    createSteadyDetector(state.pools.count),
    sweepCase.ticks,
    createAct1OfflineObserver(probes, meter),
  );
  const offlineMs = performance.now() - started;

  let meterRelative = 0;
  for (const key of METER_COUNTERS) {
    const worst = relative(truth.meter[key], meter[key]);
    if (worst > meterRelative) meterRelative = worst;
  }

  let misplacedFraction = 0;
  let conservationRelative = 0;
  for (let q = 0; q < state.pools.conservedIds.length; q += 1) {
    const quantity = state.pools.conservedIds[q] as string;
    const total = startTotals[q] as number;
    if (total === 0) continue;
    conservationRelative = Math.max(
      conservationRelative,
      Math.abs(state.pools.totalConserved(quantity) - total) / total,
    );
    misplacedFraction = Math.max(
      misplacedFraction,
      weightedDifference(state.pools, truth.state, quantity) / total,
    );
  }
  return {
    sweepCase,
    atpRelative: relative(truth.meter.atpProduced, meter.atpProduced),
    atpAbsolute: Math.abs(truth.meter.atpProduced - meter.atpProduced),
    atpTotal: truth.meter.atpProduced,
    meterRelative,
    misplacedFraction,
    conservationRelative,
    events: outcome.events.length,
    resolved: outcome.resolved,
    budgetExhausted: outcome.budgetExhausted,
    discarded: outcome.discarded,
    replayMs: truth.ms,
    offlineMs,
  };
}

/**
 * How much of one conserved quantity sits in a different pool than full replay
 * put it in.
 *
 * Computed by temporarily writing the absolute differences into the offline
 * registry, reading its conserved total, and putting the amounts back. Ugly and
 * local, and the alternative is making the weight matrix public so a validation
 * test can read it, which is a worse trade.
 */
function weightedDifference(
  pools: PoolRegistry,
  truth: SimulationState,
  quantity: string,
): number {
  const saved = Float64Array.from(pools.amounts);
  for (let i = 0; i < pools.count; i += 1) {
    pools.amounts[i] = Math.abs((saved[i] as number) - (truth.pools.amounts[i] as number));
  }
  const misplaced = pools.totalConserved(quantity);
  pools.amounts.set(saved);
  return misplaced;
}

export interface SweepSummary {
  readonly seed: number;
  readonly results: readonly CaseResult[];
  readonly worstAtp: CaseResult;
  readonly worstAtpAbsolute: CaseResult;
  readonly worstMisplaced: CaseResult;
  readonly worstConservation: CaseResult;
  readonly replayMs: number;
  readonly offlineMs: number;
  readonly fallbacks: number;
  readonly budgetExhaustions: number;
}

export function runSweep(seed: number, count: number, maxBand: number): SweepSummary {
  const results = buildSweep(seed, count, maxBand).map(runCase);
  let worstAtp = results[0] as CaseResult;
  let worstAtpAbsolute = results[0] as CaseResult;
  let worstMisplaced = results[0] as CaseResult;
  let worstConservation = results[0] as CaseResult;
  let replayMs = 0;
  let offlineMs = 0;
  let fallbacks = 0;
  let budgetExhaustions = 0;
  for (const result of results) {
    if (result.atpRelative > worstAtp.atpRelative) worstAtp = result;
    if (result.atpAbsolute > worstAtpAbsolute.atpAbsolute) worstAtpAbsolute = result;
    if (result.misplacedFraction > worstMisplaced.misplacedFraction) worstMisplaced = result;
    if (result.conservationRelative > worstConservation.conservationRelative) {
      worstConservation = result;
    }
    replayMs += result.replayMs;
    offlineMs += result.offlineMs;
    if (!result.resolved) fallbacks += 1;
    if (result.budgetExhausted) budgetExhaustions += 1;
  }
  return {
    seed,
    results,
    worstAtp,
    worstAtpAbsolute,
    worstMisplaced,
    worstConservation,
    replayMs,
    offlineMs,
    fallbacks,
    budgetExhaustions,
  };
}
