/**
 * Act 1, played end to end, headless. UPDATELOGV11.md stage 6.
 *
 * THE FIRST END-TO-END ASSERTION THIS PROJECT HAS EVER HAD. Everything before
 * it tests a layer: the kernel conserves, the codec round-trips, the guard
 * walks, the boundary fires. Nothing has ever started a fresh cell and played
 * the whole act to its end.
 *
 * ---------------------------------------------------------------------------
 * NO NEW TOOLCHAIN, AND THAT IS A DECISION RATHER THAN AN OMISSION
 * ---------------------------------------------------------------------------
 *
 * `src/content/act1/harness.ts` runs scenarios, `src/ui/drain.ts` measures how
 * long the environment lasts, `unlockPacing.report.test.ts` instruments
 * purchases and `src/content/act1/validate.ts` runs a 200-case sweep, all of
 * them through vite-node. This is the same shape. Act 1's playthrough is not the
 * job a browser runner exists for: there is no layout to measure, no font to
 * load and no click to dispatch, and the runtime's frame driver is injectable
 * precisely so time can be spent without waiting for it.
 *
 * ---------------------------------------------------------------------------
 * SHAPE, NOT TIMINGS
 * ---------------------------------------------------------------------------
 *
 * Every assertion below is about what happened and in what order. Not one is
 * about when. `unlockPacing.report.test.ts` is where timings belong, because a
 * tuning change is EXPECTED to move them and a suite that fails on an intended
 * balance change teaches people to edit the expectation. Correctness belongs
 * here, where a tuning change must not move it at all.
 */

import { describe, expect, it } from 'vitest';

import { ACT1 } from '../../content/acts';
import { TICK_MS } from '../../sim/constants';
import { setShortfallLogging } from '../../sim/tick';
import { createMemoryStore, createSaveStore } from '../../save/storage';
import { createActRuntime, type ActRuntime } from '../runtime';
import { ACT1_CONTENT_PURCHASES } from '../boundary';
import { GLYCOLYSIS_STEPS, UPTAKE_VMAX_STEPS } from '../tuning';

/*
 * AT MODULE SCOPE RATHER THAN IN `beforeAll`, AND THE DIFFERENCE IS VISIBLE.
 * Both runs happen while this file is being evaluated, so a `beforeAll` would
 * fire after them and the whole act would be played with shortfall logging on:
 * measured at several thousand lines of stderr from a starved cell in the tail.
 * Everything else in this suite can use the hook because everything else drives
 * its simulation inside a test.
 */
setShortfallLogging(false);

/** 70 game-minutes. Act 1's last purchase lands at about 54. */
const RUN_TICKS = 70 * 60 * 20;
/** The absence, 25 to 35 game-minutes in. Ten game-minutes of nobody watching. */
const AWAY_FROM = 25 * 60 * 20;
const AWAY_TO = 35 * 60 * 20;

/**
 * How often the player looks. One game-second.
 *
 * NOT ZERO, AND THE FIRST VERSION OF THIS TEST FOUND OUT WHY. A player who buys
 * on the exact frame a threshold is crossed buys lactate dehydrogenase at 55
 * cumulative ATP, which lands at about 3.0 game-seconds, and the NAD+ wall forms
 * at about 3.05. Polling every frame therefore bought the answer before the
 * problem existed and `walled` was never true in a whole 70-minute run: the act
 * was completed without its own teaching beat ever happening.
 *
 * That is a fact about the measurement rather than about the game. No human
 * clicks inside 50 milliseconds of a counter crossing, and the coach mark that
 * explains the wall fires on the wall. One game-second is the coarsest cadence
 * that still makes every purchase in order, and it is the honest one.
 */
const POLL_TICKS = 20;

/**
 * Try every purchase once, in the order the shelf offers them.
 *
 * The runtime owns every gate, so this asks rather than deciding. A second copy
 * of the unlock rules here would let the playthrough pass while the game was
 * wrong, which is the failure mode an end-to-end test exists to avoid.
 */
function buyOne(runtime: ActRuntime): string | null {
  if (runtime.buyFerment()) return 'ferment';
  if (runtime.buyUptakeStep()) return `uptake-${runtime.snapshot.uptakeStep}`;
  if (runtime.buyGlycogen()) return 'glycogen';
  if (runtime.buyEthanol()) return 'ethanol';
  if (runtime.buyPfk1Pk()) return 'pfk1-pk';
  if (runtime.buyGlycolysisStep()) return `glycolysis-${runtime.snapshot.glycolysisStep}`;
  return null;
}

interface Run {
  readonly purchases: readonly string[];
  readonly walled: boolean;
  readonly recovered: boolean;
  /** How many times `actComplete` went from false to true. Must be exactly one. */
  readonly boundaries: number;
  /** Worst absolute deviation of gross ATP per glucose from 4, once running. */
  readonly grossError: number;
  readonly netError: number;
  readonly atpProduced: number;
  readonly tickCount: number;
  readonly pools: Readonly<Record<string, number>>;
  readonly realMs: number;
}

function harness(seed: Readonly<Record<string, string>> = {}) {
  const backing = createMemoryStore(seed);
  let epoch = 1785000000000;
  return {
    backing,
    away: (ms: number) => {
      epoch += ms;
    },
    build: (): ActRuntime =>
      createActRuntime(ACT1, {
        schedule: () => 0,
        cancel: () => {},
        persistence: {
          store: createSaveStore({ store: backing }),
          epochClock: () => epoch,
          startTimer: () => 1,
          stopTimer: () => {},
          listen: () => () => {},
        },
      }),
  };
}

/**
 * Play the act, one tick per frame, buying whatever is affordable.
 *
 * `absent` is the tick window in which the player is not there. In the
 * continuous run it is empty; in the offline run it is the window the jump
 * covers. THE CONTINUOUS RUN SKIPS BUYING INSIDE THE SAME WINDOW, so the two
 * runs make identical decisions and the only difference between them is live
 * ticks against a credited jump. Without that, the offline run would miss
 * purchases the continuous run made and the two end states would diverge for a
 * reason that has nothing to do with the offline path.
 */
function drive(
  runtime: ActRuntime,
  fromTick: number,
  toTick: number,
  absent: readonly [number, number] | null,
  into: {
    purchases: string[];
    walled: boolean;
    recovered: boolean;
    boundaries: number;
    grossError: number;
    netError: number;
    wasWalled: boolean;
    wasComplete: boolean;
  },
): void {
  let nowMs = fromTick * TICK_MS;
  runtime.frame(nowMs);
  for (let t = fromTick; t < toTick; t += 1) {
    nowMs += TICK_MS;
    runtime.frame(nowMs);
    const snapshot = runtime.snapshot;

    if (snapshot.walled) into.walled = true;
    if (into.wasWalled && !snapshot.walled) into.recovered = true;
    into.wasWalled = snapshot.walled;

    if (snapshot.actComplete && !into.wasComplete) into.boundaries += 1;
    into.wasComplete = snapshot.actComplete;

    /*
     * THE LEDGER, SAMPLED THROUGHOUT RATHER THAN AT THE END. It is the claim
     * act 1 exists to make, and an assertion only at the finish would pass on a
     * run that broke it in the middle and recovered. Sampled once the pathway
     * has actually completed a glucose, because the ratio is undefined before
     * that and reads as zero.
     */
    if (snapshot.meter.glucoseConsumed > 1) {
      into.grossError = Math.max(into.grossError, Math.abs(snapshot.atpPerGlucose - 4));
      into.netError = Math.max(into.netError, Math.abs(snapshot.netAtpPerGlucose - 2));
    }

    const away = absent !== null && t >= absent[0] && t < absent[1];
    if (!away && t % POLL_TICKS === 0) {
      const bought = buyOne(runtime);
      if (bought !== null) into.purchases.push(bought);
    }
  }
}

function readPools(runtime: ActRuntime): Record<string, number> {
  const out: Record<string, number> = {};
  for (const id of ACT1.poolIds) out[id] = runtime.state.pools.get(id);
  return out;
}

/** The whole act, live, from a fresh cell. */
function continuous(): Run {
  const started = performance.now();
  const h = harness();
  const runtime = h.build();
  const into = {
    purchases: [] as string[],
    walled: false,
    recovered: false,
    boundaries: 0,
    grossError: 0,
    netError: 0,
    wasWalled: false,
    wasComplete: false,
  };
  drive(runtime, 0, RUN_TICKS, [AWAY_FROM, AWAY_TO], into);
  return {
    ...into,
    atpProduced: runtime.snapshot.meter.atpProduced,
    tickCount: runtime.state.tickCount,
    pools: readPools(runtime),
    realMs: performance.now() - started,
  };
}

/** The same act, with the same window spent away and resolved offline. */
function acrossAnAbsence(): Run & { creditedTicks: number; fellBack: boolean } {
  const started = performance.now();
  const h = harness();
  const first = h.build();
  const into = {
    purchases: [] as string[],
    walled: false,
    recovered: false,
    boundaries: 0,
    grossError: 0,
    netError: 0,
    wasWalled: false,
    wasComplete: false,
  };

  drive(first, 0, AWAY_FROM, null, into);
  first.save();

  const awayMs = (AWAY_TO - AWAY_FROM) * TICK_MS;
  h.away(awayMs);
  const second = h.build();
  const report = second.session.offline;
  const creditedTicks = Math.round(report.creditedMs / TICK_MS);

  drive(second, second.state.tickCount, RUN_TICKS, null, into);

  return {
    ...into,
    atpProduced: second.snapshot.meter.atpProduced,
    tickCount: second.state.tickCount,
    pools: readPools(second),
    realMs: performance.now() - started,
    creditedTicks,
    fellBack: report.fellBack,
  };
}

/** docs/SIMULATION.md Part 5, Scope: within tolerance, not bit-identical. */
const ATP_TOLERANCE = 2e-2;

const live = continuous();
const offline = acrossAnAbsence();

describe('act 1 is completable, played end to end', () => {
  it('makes every purchase, once each, in the order the shelf offers them', () => {
    expect(live.purchases).toEqual([
      'ferment',
      'uptake-1',
      'uptake-2',
      'glycogen',
      'ethanol',
      'pfk1-pk',
      'glycolysis-1',
      'glycolysis-2',
      'glycolysis-3',
      'glycolysis-4',
    ]);
    expect(live.purchases.length).toBe(ACT1_CONTENT_PURCHASES);
    expect(new Set(live.purchases).size).toBe(live.purchases.length);
  });

  it('reaches the top of both ladders and buys all three of V10s unlocks', () => {
    expect(live.purchases.filter((p) => p.startsWith('uptake')).length).toBe(
      UPTAKE_VMAX_STEPS.length - 1,
    );
    expect(live.purchases.filter((p) => p.startsWith('glycolysis')).length).toBe(
      GLYCOLYSIS_STEPS.length - 1,
    );
    for (const id of ['glycogen', 'ethanol', 'pfk1-pk']) {
      expect(live.purchases).toContain(id);
    }
  });

  it('hits the NAD+ wall and comes back from it', () => {
    // The act's teaching beat, and the one thing a playthrough can prove that a
    // unit test cannot: it happened in a real run, unprompted, from a fresh cell.
    expect(live.walled).toBe(true);
    expect(live.recovered).toBe(true);
  });

  it('fires the act boundary exactly once', () => {
    expect(live.boundaries).toBe(1);
  });

  it('holds the ledger at 4 gross and 2 net for the whole run', () => {
    // Not at the end. Throughout. The claim act 1 exists to make is that nothing
    // on the shelf moves this number, and ten purchases went past while it was
    // being watched.
    expect(live.grossError).toBeLessThan(1e-6);
    expect(live.netError).toBeLessThan(1e-6);
  });
});

describe('the same act, across an absence resolved offline', () => {
  it('credits the whole window through the jump rather than replaying it', () => {
    expect(offline.creditedTicks).toBe(AWAY_TO - AWAY_FROM);
    // A fallback here would mean the configuration did not settle, which
    // docs/SIMULATION.md Part 3 calls a bug signal.
    expect(offline.fellBack).toBe(false);
  });

  it('reaches the same purchases, the same wall and the same one boundary', () => {
    expect(offline.purchases).toEqual(live.purchases);
    expect(offline.walled).toBe(true);
    expect(offline.recovered).toBe(true);
    expect(offline.boundaries).toBe(1);
    expect(offline.grossError).toBeLessThan(1e-6);
    expect(offline.netError).toBeLessThan(1e-6);
  });

  it('lands on the same tick, exactly', () => {
    // The jump moves the tick count by whole ticks, so this half IS exact and
    // asserting it loosely would hide a real defect.
    expect(offline.tickCount).toBe(live.tickCount);
    expect(offline.tickCount).toBe(RUN_TICKS);
  });

  it('agrees on cumulative ATP within the offline tolerance, and is not identical', () => {
    /**
     * ASSERTED IN BOTH DIRECTIONS, WHICH IS THE POINT OF THIS TEST.
     * docs/SIMULATION.md Part 5's Scope says an offline jump agrees within
     * tolerance and is not bit-identical. The second half is usually left as a
     * permission; here it is a claim, because a jump that came out bit-identical
     * would mean it had quietly replayed rather than jumped, and the whole
     * argument for the offline path is that it does not.
     */
    const relative = Math.abs(offline.atpProduced - live.atpProduced) / live.atpProduced;
    expect(relative).toBeLessThan(ATP_TOLERANCE);
    expect(offline.atpProduced).not.toBe(live.atpProduced);
  });

  it('agrees on every pool within the same tolerance, against the largest pool', () => {
    // Relative to the largest quantity in the system rather than to each pool's
    // own amount, for the reason src/sim/jump.ts gives about spent pools: a pool
    // holding a billionth of a unit has a meaningless relative error.
    const scale = Math.max(...Object.values(live.pools).map((v) => Math.abs(v)));
    for (const id of ACT1.poolIds) {
      const delta = Math.abs((offline.pools[id] as number) - (live.pools[id] as number));
      expect(delta / scale, id).toBeLessThan(ATP_TOLERANCE);
    }
  });
});

describe('what the playthrough costs and what it covers', () => {
  it('reports its own runtime, which is what decided where it lives', () => {
    console.log('');
    console.log('  act 1 playthrough, 70 game-minutes each way');
    console.log(`    continuous          ${live.realMs.toFixed(0)} ms real`);
    console.log(`    across an absence   ${offline.realMs.toFixed(0)} ms real`);
    console.log(`    purchases           ${live.purchases.length}`);
    console.log(`    cumulative ATP      ${live.atpProduced.toFixed(3)} live`);
    console.log(`                        ${offline.atpProduced.toFixed(3)} across the absence`);
    console.log(
      `    disagreement        ${(
        (Math.abs(offline.atpProduced - live.atpProduced) / live.atpProduced) *
        100
      ).toFixed(4)} percent, tolerance ${(ATP_TOLERANCE * 100).toFixed(0)}`,
    );
    console.log('');
    // Both runs together stay well inside the second that keeps this in the
    // fast band. A suite that takes a minute is a suite people stop running.
    expect(live.realMs + offline.realMs).toBeLessThan(30000);
  });

  /**
   * WHAT THIS PROVES AND WHAT IT DOES NOT, kept as an assertion so it is read.
   *
   * It proves act 1 is completable from a fresh cell without intervention, that
   * every gate opens in order, that the wall arrives and is recovered from, that
   * the boundary fires once, that the ledger holds throughout, and that the
   * offline path reaches the same end state as living through the time.
   *
   * It proves nothing whatsoever about whether any of it READS. NOW.md's
   * standing caveat applies to this log exactly as to every other one: there are
   * still 0 cold readers out of 0 asked, and a green playthrough is not a
   * comprehension result and must never be reported as one.
   */
  it('says out loud that it is not a comprehension result', () => {
    expect(live.boundaries).toBe(1);
    expect(live.purchases.length).toBe(ACT1_CONTENT_PURCHASES);
  });
});
