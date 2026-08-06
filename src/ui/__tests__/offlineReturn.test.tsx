import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { TICK_MS } from '../../sim/constants';
import type { OfflineEventRecord } from '../../sim/jump';
import { ACT1_POOL_IDS } from '../../content/act1/pools';
import { collapseEvents, OfflineReturn } from '../components/OfflineReturn';
import { OFFLINE_RETURN, SAVE } from '../content';
import type { ActOfflineReport } from '../runtime';

/**
 * The offline return screen. DESIGN.md's screen inventory, open since
 * 2026-07-28 and built by UPDATELOGV8.md stage 6.
 *
 * Rendered through `renderToStaticMarkup`, the same way `disclosure.test.tsx`
 * and `teaching.test.tsx` render theirs. Effects never run and no live
 * subscription fires, which is fine: what is asserted here is what is in the
 * markup, which is a structural claim.
 */

function event(
  kind: OfflineEventRecord['kind'],
  poolId: string,
  settleTicks: number,
  jumpTicks: number,
): OfflineEventRecord {
  return {
    kind,
    poolIndex: ACT1_POOL_IDS.indexOf(poolId as never),
    settleTicks,
    jumpTicks,
    atTick: 0,
  };
}

function report(overrides: Partial<ActOfflineReport> = {}): ActOfflineReport {
  return {
    creditedMs: 8 * 3600000,
    uncreditedMs: 0,
    atpProduced: 319234,
    events: [],
    poolIds: ACT1_POOL_IDS,
    fellBack: false,
    budgetExhausted: false,
    stoppedAtBoundary: false,
    elapsedRealMs: 24.6,
    ...overrides,
  };
}

describe('collapsing the event sequence', () => {
  /**
   * THE REASON THIS FUNCTION EXISTS. A day away produces up to 51 events and
   * most of them are `glucose_env` draining a little further. Forty-nine
   * identical lines is the algorithm's step count made visible rather than the
   * event sequence, and DESIGN.md asks for the sequence because it teaches that
   * metabolism is homeostatic between shocks.
   */
  it('collapses a run of events on one pool into a single row', () => {
    const runs = collapseEvents(
      [
        event('depletion', 'glucose_env', 1200, 50014),
        event('depletion', 'glucose_env', 1200, 37291),
        event('depletion', 'glucose_env', 1200, 27750),
      ],
      ACT1_POOL_IDS,
    );
    expect(runs.length).toBe(1);
    expect(runs[0]?.poolId).toBe('glucose_env');
    expect(runs[0]?.ticks).toBe(1200 + 50014 + 1200 + 37291 + 1200 + 27750);
  });

  it('starts a new row when a different pool runs low', () => {
    const runs = collapseEvents(
      [
        event('depletion', 'glucose_env', 1200, 5000),
        event('depletion', 'glucose_env', 1200, 4000),
        event('depletion', 'pyruvate', 1200, 3000),
      ],
      ACT1_POOL_IDS,
    );
    expect(runs.map((run) => run.poolId)).toEqual(['glucose_env', 'pyruvate']);
  });

  it('folds a window ending and a no-jump into the run rather than making them events', () => {
    // Neither is something that happened to the cell. The window ending is the
    // player coming back, and a no-jump is the algorithm deciding a jump was
    // not worth making.
    const runs = collapseEvents(
      [
        event('no-jump', 'glucose', 1200, 0),
        event('window-end', 'glucose_env', 1200, 9000),
      ],
      ACT1_POOL_IDS,
    );
    expect(runs.length).toBe(1);
    expect(runs[0]?.poolId).toBe(null);
    expect(runs[0]?.ticks).toBe(1200 + 1200 + 9000);
  });

  it('is empty for an empty window, so the quiet case has nothing to render', () => {
    expect(collapseEvents([], ACT1_POOL_IDS)).toEqual([]);
  });
});

describe('the return screen', () => {
  /**
   * THE BORING CASE IS THE COMMON CASE and it has to read as a statement about
   * cells rather than as an apology for an empty screen. Act 1 mostly produces
   * one event or none.
   */
  it('says the cell held steady when nothing ran low', () => {
    const markup = renderToStaticMarkup(
      <OfflineReturn report={report({ events: [event('window-end', 'glucose_env', 1200, 500000)] })} onDismiss={() => {}} />,
    );
    expect(markup).toContain(OFFLINE_RETURN.steady.text);
    expect(markup).not.toContain(OFFLINE_RETURN.sequenceHeading.text);
    expect(markup).not.toContain(OFFLINE_RETURN.larderEmpty.text);
  });

  it('shows the sequence when something ran low', () => {
    const markup = renderToStaticMarkup(
      <OfflineReturn
        report={report({
          events: [
            event('depletion', 'glucose_env', 1200, 200000),
            event('window-end', 'glucose_env', 1200, 100000),
          ],
        })}
        onDismiss={() => {}}
      />,
    );
    expect(markup).toContain(OFFLINE_RETURN.sequenceHeading.text);
    expect(markup).toContain(OFFLINE_RETURN.steadyFor.text);
    expect(markup).toContain(OFFLINE_RETURN.thenRanLow.text);
    expect(markup).not.toContain(OFFLINE_RETURN.steady.text);
  });

  it('says the larder is empty only when the environment is what ran low', () => {
    const environment = renderToStaticMarkup(
      <OfflineReturn
        report={report({ events: [event('depletion', 'glucose_env', 1200, 200000)] })}
        onDismiss={() => {}}
      />,
    );
    expect(environment).toContain(OFFLINE_RETURN.larderEmpty.text);

    const internal = renderToStaticMarkup(
      <OfflineReturn
        report={report({ events: [event('depletion', 'pyruvate', 1200, 200000)] })}
        onDismiss={() => {}}
      />,
    );
    expect(internal).not.toContain(OFFLINE_RETURN.larderEmpty.text);
  });

  it('carries the mandatory source row and a way out', () => {
    const markup = renderToStaticMarkup(<OfflineReturn report={report()} onDismiss={() => {}} />);
    // The apostrophe in the source string renders as an entity, so the match is
    // on the part of it that survives escaping.
    expect(markup).toContain('docs/SCIENCE.md Part 2, glycolysis and fermentation');
    expect(markup).toContain(OFFLINE_RETURN.close.text);
    expect(markup).toContain(OFFLINE_RETURN.heading.text);
  });

  it('puts every number through Figure, so every one of them is tabular', () => {
    const markup = renderToStaticMarkup(
      <OfflineReturn
        report={report({ events: [event('depletion', 'glucose_env', 1200, 200000)] })}
        onDismiss={() => {}}
      />,
    );
    // `tabular-nums` is applied by Figure. Three figures are rendered here, the
    // time away, the ATP made and the one run in the sequence, and Figure emits
    // the class more than once per figure, so the assertion is a floor rather
    // than an equality. What it catches is a number rendered as bare text,
    // which would drop the count below three.
    expect(markup.split('tabular-nums').length - 1).toBeGreaterThanOrEqual(3);
    // And the ATP figure carries its own trace, which is what a badge on a
    // number buys and what a bare interpolated number would not have.
    expect(markup).toContain('Sourced');
  });

  it('reads a duration in the unit that does not read as noise', () => {
    const short = renderToStaticMarkup(
      <OfflineReturn report={report({ creditedMs: 10 * 60000 })} onDismiss={() => {}} />,
    );
    expect(short).toContain('min');

    const long = renderToStaticMarkup(<OfflineReturn report={report()} onDismiss={() => {}} />);
    expect(long).toContain('8.0');
  });

  it('agrees with the tick length rather than assuming one', () => {
    const ticks = 12000;
    const markup = renderToStaticMarkup(
      <OfflineReturn
        report={report({ events: [event('depletion', 'glucose_env', 0, ticks)] })}
        onDismiss={() => {}}
      />,
    );
    // 12000 ticks at TICK_MS of 50 is ten game-minutes.
    expect(markup).toContain(String((ticks * TICK_MS) / 60000));
  });
});

describe('the save panel sentence', () => {
  /**
   * NOW.md carried this from V4 to V7 as "the honest sentence that will stay
   * wrong-sounding until this log makes it true". It is not true any more, so
   * the sentence is gone rather than softened, and this test is what stops it
   * coming back.
   */
  it('no longer says the time away is kept and not spent', () => {
    const strings = Object.values(SAVE).map((entry) => entry.text);
    expect(strings).not.toContain('None of it has been simulated. It is being kept, not spent.');
    for (const text of strings) {
      expect(text).not.toContain('not spent');
      expect(text).not.toContain('has not been simulated');
    }
    expect(SAVE.awaySimulated.text).toContain('has been simulated');
  });

  /**
   * FOUND IN A BROWSER, NOT IN A TEST. Game time is a whole number of ticks and
   * wall-clock time is not, so `uncreditedMs` is non-zero on almost every load
   * and holds anything under one tick. Branching the panel on it put "some of
   * it could not be simulated" on a screen where an eight-hour absence had been
   * credited in full.
   */
  it('warns about uncredited time on the budget rather than on the remainder', () => {
    const source = readFileSync(
      fileURLToPath(new URL('../components/SavePanel.tsx', import.meta.url)),
      'utf8',
    );
    expect(source).toContain('session.offline.budgetExhausted ? SAVE.awayPartlySimulated');
    expect(source).not.toContain('session.offline.uncreditedMs > 0 ? SAVE.awayPartlySimulated');
  });
});
