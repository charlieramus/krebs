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
});
