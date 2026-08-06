/**
 * How fast cumulative ATP accumulates, so the unlock thresholds in
 * src/ui/tuning.ts are picked from a measurement rather than from a feeling.
 *
 * Not an assertion, except for the one thing that IS a hard constraint and is
 * asserted below. This is a readout, in the same posture as the conservation
 * test's worst-drift table and stage 4's blob geometry table: the numbers in the
 * stage 6 report should be produced by the code rather than typed beside it.
 *
 * WHY CUMULATIVE ATP AND NOT THE ATP POOL. The adenylate pool is fixed, closed
 * and conserved, so there is no stock to save up and an unlock cannot subtract
 * from it. Thresholds run against the counter in src/content/act1/meter.ts,
 * which lives outside the simulation for exactly this reason.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { TICK_SECONDS } from '../../sim/constants';
import { setShortfallLogging } from '../../sim/tick';
import { createAct1Runtime } from '../runtime';
import { TICK_MS } from '../../sim/constants';
import { UPTAKE_VMAX_STEPS } from '../tuning';
import { poolIndex, type Act1Runtime } from '../runtime';

const ATP_INDEX = poolIndex('atp');
const ENV = poolIndex('glucose_env');

/**
 * Try every purchase once, in the order the shelf offers them, and name the one
 * that went through. The runtime owns every gate, so this asks rather than
 * deciding, which is what keeps the report measuring the game rather than a
 * second copy of its rules.
 */
function buyOne(runtime: Act1Runtime): string | null {
  if (runtime.buyFerment()) return 'lactate fermentation';
  if (runtime.buyUptakeStep()) return `uptake capacity ${runtime.snapshot.uptakeStep}`;
  if (runtime.buyGlycogen()) return 'glycogen storage';
  if (runtime.buyEthanol()) return 'ethanol fermentation';
  if (runtime.buyPfk1Pk()) return 'PFK-1 and pyruvate kinase';
  if (runtime.buyGlycolysisStep()) return `glycolytic capacity ${runtime.snapshot.glycolysisStep}`;
  return null;
}

beforeAll(() => {
  setShortfallLogging(false);
});

/** Game-seconds to reach each cumulative-ATP milestone, or null inside the window. */
function timeToReach(
  milestones: readonly number[],
  options: { ferment: boolean; uptakeVmax: number; minutes: number },
): (number | null)[] {
  const runtime = createAct1Runtime({
    act1: { enabled: { ferment: options.ferment }, vmax: { uptake: options.uptakeVmax } },
  });
  const found: (number | null)[] = milestones.map(() => null);
  const ticks = Math.round((options.minutes * 60) / TICK_SECONDS);

  let nowMs = 0;
  runtime.frame(nowMs);
  for (let t = 0; t < ticks; t += 1) {
    nowMs += TICK_MS;
    runtime.frame(nowMs);
    const produced = runtime.snapshot.meter.atpProduced;
    for (let m = 0; m < milestones.length; m += 1) {
      if (found[m] === null && produced >= (milestones[m] as number)) {
        found[m] = runtime.snapshot.elapsedMs / 1000;
      }
    }
  }
  return found;
}

const pad = (value: string, width: number): string =>
  value.length >= width ? value : ' '.repeat(width - value.length) + value;
const padRight = (value: string, width: number): string =>
  value.length >= width ? value : value + ' '.repeat(width - value.length);

const clock = (seconds: number | null): string =>
  seconds === null ? 'never' : `${Math.floor(seconds / 60)}m${Math.round(seconds % 60)}s`;

describe('unlock pacing', () => {
  it('reports the cumulative ATP ceiling of a walled cell', () => {
    // THE HARD CONSTRAINT. With ferment disabled the nicotinamide pool is the
    // ceiling on everything: every NAD+ that becomes NADH yields its 2 ATP once
    // and never again, so cumulative ATP converges and stops. Any ferment
    // threshold at or above that ceiling is unbuyable, and the player is stuck
    // at a wall whose solution they can never afford. This is the single number
    // that constrains the whole unlock table.
    const runtime = createAct1Runtime({ act1: { enabled: { ferment: false } } });
    let nowMs = 0;
    runtime.frame(nowMs);
    for (let t = 0; t < 4000; t += 1) {
      nowMs += TICK_MS;
      runtime.frame(nowMs);
    }
    const ceiling = runtime.snapshot.meter.atpProduced;

    console.log('');
    console.log(`  walled cumulative ATP ceiling, 200 game-seconds: ${ceiling.toFixed(6)}`);
    console.log('  a ferment threshold at or above this is unbuyable.');
    console.log('');

    expect(ceiling).toBeGreaterThan(0);
    expect(ceiling).toBeLessThan(1000);
  });

  it('reports time to each cumulative ATP milestone at every uptake step', () => {
    const milestones = [50, 200, 1000, 4000, 12000, 30000];

    console.log('');
    console.log('  game-time to reach cumulative ATP, ferment enabled, 100 game-minutes');
    console.log(
      `  ${padRight('uptake Vmax', 13)}${milestones.map((m) => pad(String(m), 10)).join('')}`,
    );
    console.log(`  ${'-'.repeat(13 + milestones.length * 10)}`);

    for (const vmax of UPTAKE_VMAX_STEPS) {
      const times = timeToReach(milestones, { ferment: true, uptakeVmax: vmax, minutes: 100 });
      console.log(
        `  ${padRight(String(vmax), 13)}${times.map((t) => pad(clock(t), 10)).join('')}`,
      );
    }
    console.log('');
  });

  it('plays the whole act and reports every purchase, for two players', () => {
    /**
     * UPDATELOGV10.md stage 5. NOW.md blocking item 2 is about the longest wait
     * between two events, so the act has to be played end to end to say anything
     * about it, and the figures have to be reproducible rather than quoted from
     * a log nobody can re-run.
     *
     * Two players, both of them from the stage prompt: one who buys the instant a
     * purchase is affordable, and one who looks every five game-minutes. The
     * second is the one the worst gap is really about, because a player who is
     * not watching cannot buy the moment the meter crosses.
     */
    const players: readonly (readonly [string, number])[] = [
      ['buys the instant it is affordable', 0],
      ['checks every five game-minutes', 5],
    ];

    for (const [label, checkEvery] of players) {
      const runtime = createAct1Runtime({ persistence: { enabled: false } });
      runtime.frame(0);
      const checkTicks = Math.round(checkEvery * 60 * 20);
      const rows: string[] = [];
      let previous = 0;
      let worstGap = 0;
      let last = 0;
      let count = 0;
      let envEmpty = Number.NaN;
      let stops = Number.NaN;

      for (let t = 0; t < 200 * 60 * 20; t += 1) {
        runtime.frame(runtime.snapshot.elapsedMs + TICK_MS);
        const minutes = runtime.snapshot.elapsedMs / 60000;
        if (checkTicks === 0 || t % checkTicks === 0) {
          for (;;) {
            const name = buyOne(runtime);
            if (name === null) break;
            const gap = minutes - previous;
            if (gap > worstGap) worstGap = gap;
            previous = minutes;
            last = minutes;
            count += 1;
            rows.push(
              `    ${padRight(clock(minutes * 60), 9)}${padRight(clock(gap * 60), 9)}` +
                `${pad(runtime.snapshot.meter.atpProduced.toFixed(0), 9)}   ${name}`,
            );
          }
        }
        if (Number.isNaN(envEmpty) && (runtime.snapshot.amounts[ENV] as number) < 1) {
          envEmpty = minutes;
        }
        if (
          Number.isNaN(stops) &&
          !Number.isNaN(envEmpty) &&
          (runtime.snapshot.production[ATP_INDEX] as number) < 0.5
        ) {
          stops = minutes;
        }
      }

      console.log('');
      console.log(`  ${label}`);
      console.log('    time     gap      cumulative   purchase');
      console.log(rows.join(String.fromCharCode(10)));
      console.log(`    purchases           ${count}`);
      console.log(`    last purchase       ${clock(last * 60)}`);
      console.log(`    worst gap           ${clock(worstGap * 60)}`);
      console.log(`    environment empty   ${clock(envEmpty * 60)}`);
      console.log(`    cell stops          ${clock(stops * 60)}`);
      console.log('');

      // ACT 1 HAS TEN PURCHASES AND ITS LAST ONE IS INSIDE THE TARGET.
      // docs/PROGRESSION.md gives act 1 45 to 90 minutes. The floor is not
      // asserted, because a player who checks every five minutes can finish
      // early and that is their choice rather than a defect.
      expect(count, `${label}: purchase count`).toBe(10);
      expect(last, `${label}: last purchase past the target`).toBeLessThan(90);
      // And the worst gap. 6m43s for the greedy player and 10m for the checker,
      // measured 2026-08-06. The bar is loose enough not to fail on a tuning
      // change that keeps the shape and tight enough to fail on one that does
      // not: V5 shipped 13m51s and this is what replaced it.
      expect(worstGap, `${label}: worst gap`).toBeLessThan(11);
    }
  });
});
