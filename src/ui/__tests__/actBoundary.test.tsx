/**
 * The act boundary. UPDATELOGV11.md stage 4, the one stage in that log that adds
 * behaviour, and this is the file that fences it.
 *
 * Three groups, matching the three places the boundary has to be right:
 * the condition itself, the offline path, and the interface. Plus one test whose
 * whole job is to fail when act 2 lands, so the placeholder is removed by a
 * build failure rather than by somebody remembering.
 */

import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it } from 'vitest';

import { ACT1, ACTS } from '../../content/acts';
import { setShortfallLogging } from '../../sim/tick';
import { createSteadyDetector } from '../../sim/steady';
import { resolveOffline, type OfflineStop } from '../../sim/jump';
import type { SimulationState } from '../../sim/state';
import { TICK_MS } from '../../sim/constants';
import { createMemoryStore, createSaveStore } from '../../save/storage';
import { createActRuntime, type ActRuntime, type ActSnapshot } from '../runtime';
import { RuntimeProvider } from '../RuntimeContext';
import { ACT1_BOUNDARY, ACT1_CONTENT_PURCHASES, boundaryFor } from '../boundary';
import { EndOfContent } from '../components/EndOfContent';
import { END_OF_CONTENT } from '../content';
import {
  GLYCOLYSIS_ATP_THRESHOLDS,
  GLYCOLYSIS_STEPS,
  UPTAKE_ATP_THRESHOLDS,
  UPTAKE_VMAX_STEPS,
} from '../tuning';

beforeAll(() => {
  setShortfallLogging(false);
});

/** A snapshot-shaped stub. Only the fields the boundary reads are meaningful. */
function progress(overrides: Partial<ActSnapshot> = {}): ActSnapshot {
  return {
    fermentUnlocked: false,
    ethanolUnlocked: false,
    glycogenUnlocked: false,
    pfk1PkBought: false,
    uptakeStep: 0,
    glycolysisStep: 0,
    ...overrides,
  } as ActSnapshot;
}

const COMPLETE = progress({
  fermentUnlocked: true,
  ethanolUnlocked: true,
  glycogenUnlocked: true,
  pfk1PkBought: true,
  uptakeStep: UPTAKE_VMAX_STEPS.length - 1,
  glycolysisStep: GLYCOLYSIS_STEPS.length - 1,
});

const ONE_LEFT = progress({
  fermentUnlocked: true,
  ethanolUnlocked: true,
  glycogenUnlocked: true,
  pfk1PkBought: true,
  uptakeStep: UPTAKE_VMAX_STEPS.length - 1,
  glycolysisStep: GLYCOLYSIS_STEPS.length - 2,
});

/* ===========================================================================
   THE CONDITION
   =========================================================================== */

describe('the boundary is a content condition', () => {
  it('is every purchase made, and there are ten of them', () => {
    expect(ACT1_CONTENT_PURCHASES).toBe(10);
    // Counted from the ladders rather than restated, so adding a rung moves it.
    expect(ACT1_CONTENT_PURCHASES).toBe(
      4 + UPTAKE_ATP_THRESHOLDS.length + GLYCOLYSIS_ATP_THRESHOLDS.length,
    );
  });

  it('is false with nine of the ten bought', () => {
    expect(ACT1_BOUNDARY.isComplete(ONE_LEFT)).toBe(false);
  });

  it('is true with all ten', () => {
    expect(ACT1_BOUNDARY.isComplete(COMPLETE)).toBe(true);
  });

  it('is not satisfied by any single purchase being missing', () => {
    // Every one of the six flags is load-bearing, asserted one at a time rather
    // than by inspection. A condition that ignored the ethanol branch would pass
    // the test above and end the act with content on the shelf.
    const missing: Partial<ActSnapshot>[] = [
      { fermentUnlocked: false },
      { ethanolUnlocked: false },
      { glycogenUnlocked: false },
      { pfk1PkBought: false },
      { uptakeStep: UPTAKE_VMAX_STEPS.length - 2 },
      { glycolysisStep: GLYCOLYSIS_STEPS.length - 2 },
    ];
    for (const hole of missing) {
      expect(ACT1_BOUNDARY.isComplete({ ...COMPLETE, ...hole } as ActSnapshot)).toBe(false);
    }
  });

  it('is not a time and not an ATP total', () => {
    // The two things docs/PROGRESSION.md's "every branch completes" rules out. A
    // cell that has produced more ATP than the act's last threshold and bought
    // nothing has not finished the act.
    const rich = progress();
    expect(ACT1_BOUNDARY.isComplete(rich)).toBe(false);
    expect(ACT1_BOUNDARY.nextContentAtp(rich, { atpProduced: 1e9 } as never)).toBe(
      Number.POSITIVE_INFINITY,
    );
  });

  it('offers an offline stop only when one purchase is left', () => {
    // The correction the first version of this needed. An ordinary unlock
    // crossing is not an event and must not interrupt anything, so the stop only
    // exists when the LAST purchase is what is being waited for.
    const meter = { atpProduced: 0 } as never;
    expect(ACT1_BOUNDARY.nextContentAtp(progress(), meter)).toBe(Number.POSITIVE_INFINITY);
    expect(ACT1_BOUNDARY.nextContentAtp(COMPLETE, meter)).toBe(Number.POSITIVE_INFINITY);
    expect(ACT1_BOUNDARY.nextContentAtp(ONE_LEFT, meter)).toBe(
      GLYCOLYSIS_ATP_THRESHOLDS[GLYCOLYSIS_ATP_THRESHOLDS.length - 1],
    );
  });

  it('is reached through the running act rather than imported', () => {
    expect(boundaryFor(ACT1)).toBe(ACT1_BOUNDARY);
  });
});

/* ===========================================================================
   THE OFFLINE PATH

   The boundary STOPS the jump rather than becoming an event kind. Driven
   against `resolveOffline` directly with a synthetic stop, because these five
   cases are about the machinery and a synthetic stop can put the boundary on an
   exact tick. The runtime's own stop is exercised end to end below.
   =========================================================================== */

/** A stop that fires `after` ticks from wherever the resolution starts. */
function stopAfter(after: number): OfflineStop {
  let start = -1;
  return {
    ticksUntil(state: SimulationState): number {
      if (start < 0) start = state.tickCount;
      return after - (state.tickCount - start);
    },
  };
}

const NEVER: OfflineStop = { ticksUntil: () => Number.POSITIVE_INFINITY };

function fermentingCell(): SimulationState {
  return ACT1.create({ enabled: { ferment: true } });
}

function resolve(windowTicks: number, stop: OfflineStop | undefined) {
  const state = fermentingCell();
  const outcome = resolveOffline(
    state,
    createSteadyDetector(state.pools.count),
    windowTicks,
    undefined,
    stop,
  );
  return { state, outcome };
}

describe('an act boundary stops the offline jump', () => {
  const WINDOW = 8 * 60 * 60 * 20; // eight game-hours in ticks

  it('crosses before the next pool event, and the credit stops there', () => {
    const { outcome } = resolve(WINDOW, stopAfter(5000));
    expect(outcome.stoppedEarly).toBe(true);
    expect(outcome.ticksResolved).toBe(5000);
    expect(outcome.ticksRemaining).toBe(WINDOW - 5000);
    // The environment does not empty in 5000 ticks, so the stop beat the only
    // pool event act 1 has. This is the case the whole mechanism exists for.
    expect(outcome.resolved).toBe(true);
  });

  it('does not cross, and the whole window is credited', () => {
    const withStop = resolve(WINDOW, NEVER);
    const without = resolve(WINDOW, undefined);
    expect(withStop.outcome.stoppedEarly).toBe(false);
    expect(withStop.outcome.ticksResolved).toBe(WINDOW);
    // And a stop that never fires changes nothing at all, which is the property
    // that keeps the 40-case offline sweep meaningful.
    expect(withStop.outcome.ticksResolved).toBe(without.outcome.ticksResolved);
    expect(withStop.outcome.events.length).toBe(without.outcome.events.length);
  });

  it('crosses exactly at the end of the credit window, and the window wins', () => {
    const { outcome } = resolve(WINDOW, stopAfter(WINDOW));
    // Reached and finished on the same tick. Nothing is owed, so this is not a
    // stop: the resolution completed. Reporting it as stopped would put a
    // boundary notice on a return screen that has nothing to notice.
    expect(outcome.ticksResolved).toBe(WINDOW);
    expect(outcome.stoppedEarly).toBe(false);
  });

  it('crosses at tick zero of the absence, and credits nothing', () => {
    const { outcome } = resolve(WINDOW, stopAfter(0));
    expect(outcome.stoppedEarly).toBe(true);
    expect(outcome.ticksResolved).toBe(0);
    expect(outcome.ticksRemaining).toBe(WINDOW);
  });

  it('has the boundary already behind it, and resolves normally', () => {
    // What act 1's own stop returns once the act is complete: Infinity, forever.
    // A player who finished the act and then left is the ordinary case after the
    // boundary and must not be stopped again.
    const { outcome } = resolve(WINDOW, {
      ticksUntil: () => Number.POSITIVE_INFINITY,
    });
    expect(outcome.stoppedEarly).toBe(false);
    expect(outcome.ticksResolved).toBe(WINDOW);
  });

  it('conserves across a stopped resolution exactly as across a whole one', () => {
    // The stop truncates the window and touches nothing else, so the invariant
    // the offline path rests on cannot be weakened by it.
    const { state } = resolve(WINDOW, stopAfter(5000));
    const fresh = fermentingCell();
    for (const quantity of state.pools.conservedIds) {
      expect(state.pools.totalConserved(quantity)).toBeCloseTo(
        fresh.pools.totalConserved(quantity),
        6,
      );
    }
  });
});

/* ===========================================================================
   THE RUNTIME'S OWN STOP, END TO END
   =========================================================================== */

function harness() {
  const backing = createMemoryStore();
  let epoch = 1785000000000;
  return {
    persistence: () => ({
      store: createSaveStore({ store: backing }),
      epochClock: () => epoch,
      startTimer: () => 1,
      stopTimer: () => {},
      listen: () => () => {},
    }),
    away: (ms: number) => {
      epoch += ms;
    },
  };
}

function build(h: ReturnType<typeof harness>): ActRuntime {
  return createActRuntime(ACT1, {
    schedule: () => 0,
    cancel: () => {},
    persistence: h.persistence(),
  });
}

/** Drive whole ticks, one per frame, the way rAF would at 20Hz. */
function play(runtime: ActRuntime, ticks: number): void {
  let nowMs = 0;
  runtime.frame(nowMs);
  for (let i = 0; i < ticks; i += 1) {
    nowMs += TICK_MS;
    runtime.frame(nowMs);
  }
}

/**
 * Buy everything except the top glycolytic rung.
 *
 * THE METER IS WRITTEN TO DIRECTLY AND THAT IS THE DOOR RATHER THAN A CHEAT.
 * `meter.atpProduced` is a plain mutable counter that lives outside the
 * simulation, so setting it puts the runtime in exactly the state a 54-minute
 * playthrough would, without spending 54 minutes of game time per assertion. No
 * pool is touched, so nothing about the simulation is faked.
 */
function buyAllButLast(runtime: ActRuntime): void {
  const meter = runtime.snapshot.meter;
  meter.atpProduced = 1e6;
  expect(runtime.buyFerment()).toBe(true);
  while (runtime.buyUptakeStep()) {
    /* to the top */
  }
  expect(runtime.buyGlycogen()).toBe(true);
  expect(runtime.buyEthanol()).toBe(true);
  expect(runtime.buyPfk1Pk()).toBe(true);
  for (let i = 0; i < GLYCOLYSIS_STEPS.length - 2; i += 1) {
    expect(runtime.buyGlycolysisStep()).toBe(true);
  }
  runtime.frame(1);
  expect(runtime.snapshot.glycolysisStep).toBe(GLYCOLYSIS_STEPS.length - 2);
  expect(runtime.snapshot.actComplete).toBe(false);
}

describe('the runtime stops its own credit at the boundary', () => {
  it('credits a whole absence while the act has content left', () => {
    const h = harness();
    const first = build(h);
    play(first, 100);
    expect(first.buyFerment()).toBe(true);
    play(first, 100);
    first.save();

    const awayMs = 60 * 60 * 1000;
    h.away(awayMs);
    const second = build(h);
    expect(second.session.offline.stoppedAtBoundary).toBe(false);
    expect(second.session.offline.creditedMs).toBe(awayMs);
  });

  it('stops when only the last purchase is left, and drops the remainder', () => {
    const h = harness();
    const first = build(h);
    play(first, 100);
    buyAllButLast(first);
    /*
     * BACK UNDER THE LAST THRESHOLD BEFORE LEAVING, WHICH IS THE ONLY STATE THIS
     * CASE CAN BE IN. `buyAllButLast` writes the meter high enough to afford
     * nine purchases; a save written at that value is already past the act's
     * last threshold and the stop fires at tick zero, which is a different case
     * and is covered above against the machinery directly. A player who is one
     * purchase from the end and cannot yet afford it is what this test is about.
     */
    first.snapshot.meter.atpProduced = 150000;
    first.save();

    const awayMs = 8 * 60 * 60 * 1000;
    h.away(awayMs);
    const second = build(h);
    const report = second.session.offline;

    expect(second.snapshot.glycolysisStep).toBe(GLYCOLYSIS_STEPS.length - 2);
    expect(report.stoppedAtBoundary).toBe(true);
    expect(report.creditedMs).toBeGreaterThan(0);
    expect(report.creditedMs).toBeLessThan(awayMs);
    // Not carried forward. See creditPendingOffline for why deferring it is a
    // trap: the same stop would fire at zero ticks on every later load.
    expect(second.state.diagnostics.pendingOfflineMs).toBe(0);
    expect(report.uncreditedMs).toBeGreaterThan(0);
  });

  it('credits a whole absence again once the act is complete', () => {
    const h = harness();
    const first = build(h);
    play(first, 100);
    buyAllButLast(first);
    first.snapshot.meter.atpProduced = 1e6;
    expect(first.buyGlycolysisStep()).toBe(true);
    play(first, 1);
    expect(first.snapshot.actComplete).toBe(true);
    first.save();

    const awayMs = 60 * 60 * 1000;
    h.away(awayMs);
    const second = build(h);
    expect(second.session.offline.stoppedAtBoundary).toBe(false);
    expect(second.session.offline.creditedMs).toBe(awayMs);
  });

  it('restores complete, so a finished save arrives finished', () => {
    const h = harness();
    const first = build(h);
    play(first, 100);
    buyAllButLast(first);
    first.snapshot.meter.atpProduced = 1e6;
    expect(first.buyGlycolysisStep()).toBe(true);
    play(first, 1);
    first.save();

    const second = build(h);
    second.frame(0);
    expect(second.snapshot.actComplete).toBe(true);
  });
});

/* ===========================================================================
   THE INTERFACE
   =========================================================================== */

describe('the ending, as a screen', () => {
  it('says where the game ends and does not promise a date', () => {
    const markup = renderToStaticMarkup(
      <RuntimeProvider options={{ persistence: { enabled: false } }}>
        <EndOfContent onDismiss={() => {}} />
      </RuntimeProvider>,
    );
    expect(markup).toContain(END_OF_CONTENT.heading.text);
    for (const paragraph of END_OF_CONTENT.body) {
      expect(markup).toContain(paragraph.text.slice(0, 40));
    }
    expect(markup).toContain(END_OF_CONTENT.action.text);
  });

  it('keeps the ceiling docs/CONTENT_STYLE.md Part 5 sets for a one screen surface', () => {
    expect(END_OF_CONTENT.body.length).toBeLessThanOrEqual(3);
  });

  it('says the cell keeps running, which is the claim the overlay has to honour', () => {
    const said = END_OF_CONTENT.body.map((entry) => entry.text).join(' ');
    expect(said).toContain('keeps running');
  });

  it('does not congratulate', () => {
    // docs/CONTENT_STYLE.md Part 2. contentStyle.test.ts asserts this across the
    // whole directory; it is repeated here because this is the one surface in
    // the game where the temptation exists.
    const said = END_OF_CONTENT.body.map((entry) => entry.text).join(' ');
    expect(said).not.toContain('!');
    expect(said.toLowerCase()).not.toContain('congratulations');
    expect(said.toLowerCase()).not.toContain('well done');
  });

  it('is marked seen, so it does not reopen on every launch', () => {
    const h = harness();
    const runtime = build(h);
    expect(runtime.boundarySeen()).toBe(false);
    runtime.markBoundarySeen();
    expect(runtime.boundarySeen()).toBe(true);
    // Persisted, so a reload does not show it again.
    runtime.save();
    const next = build(h);
    expect(next.boundarySeen()).toBe(true);
  });

  /**
   * THE TWO CASES A STRING CANNOT RENDER, ASSERTED STRUCTURALLY.
   *
   * The test environment is `node` and there is no DOM in it, so a mounted tree
   * cannot be re-rendered here and an overlay cannot be opened and closed. Same
   * limit `keyboard.test.tsx` states about focus, and the same response: assert
   * the structure that makes the behaviour true rather than fake the behaviour.
   */
  it('never renders underneath another overlay, and fires once rather than per frame', () => {
    const app = readFileSync(new URL('../../App.tsx', import.meta.url), 'utf8');
    // Reached with an overlay already open: the render is gated on all four of
    // the others being closed, and `actComplete` stays true, so it opens the
    // moment the other one closes rather than stacking or being lost.
    expect(app).toContain('boundary && !offlineReturn && !firstRun && !about && !panel');
    // Reached in the foreground and reached on the same tick as a purchase are
    // the same case, and the ref is what makes it one event: the subscription
    // runs at frame rate and an unguarded setState would re-render the tree
    // sixty times a second.
    expect(app).toContain('boundaryFired');
    expect(app).toContain('if (boundaryFired.current) return;');
  });

  it('defaults to unseen for a save written before this build', () => {
    // docs/SAVE_SCHEMA.md Part 1: a missing field new code can default is
    // additive. A V10 save has no `boundarySeen` and gets false, which is right
    // rather than tolerated: that player has not seen it either.
    const h = harness();
    const runtime = build(h);
    expect(runtime.capture().settings.boundarySeen).toBeUndefined();
    expect(runtime.boundarySeen()).toBe(false);
  });
});

/* ===========================================================================
   THE PLACEHOLDER REMOVES ITSELF
   =========================================================================== */

describe('the end-of-content state is a placeholder and says so', () => {
  /**
   * FAILS THE BUILD WHEN ACT 2 LANDS. UPDATELOGV11.md stage 4 step 2.
   *
   * The screen exists because act 2 is four logs away and a player who finishes
   * act 1 has nowhere to go. The moment a second act is in the registry that
   * sentence is false, and a false sentence on the last screen of the game is
   * worse than no screen at all.
   *
   * Removed by a build failure rather than by memory, which is the same
   * mechanism `schemaVersionGate.test.ts` uses for hard rule 7.
   */
  it('is only reachable while this build knows exactly one act', () => {
    expect(ACTS.length).toBe(1);
    expect(END_OF_CONTENT.body.some((entry) => entry.text.includes('Act 2'))).toBe(true);
  });
});
