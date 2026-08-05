/**
 * Act 1 on the offline path. UPDATELOGV8.md stage 3.
 *
 * `src/sim/jump.ts` resolves a window against pool amounts and the tick count.
 * Everything else act 1 keeps is a counter beside the simulation rather than
 * inside it, because ATP is a flux and not a score, and this is the file that
 * carries those counters across a jump.
 *
 * It is eleven lines of wiring and it exists as its own file rather than as a
 * function call at the caller because it is the seam most likely to be got
 * wrong. A jump that advances the pools and not the meter loses every unlock
 * threshold the player crossed while away, and nothing about the pools would
 * look wrong afterwards.
 */

import type { OfflineObserver } from '../../sim/jump';
import type { SimulationState } from '../../sim/state';
import {
  advanceAct1Meter,
  captureAct1MeterRates,
  createAct1MeterRates,
  recordAct1Tick,
  type Act1Meter,
  type Act1MeterProbes,
} from './meter';

/**
 * Wire act 1's meter into an offline resolution.
 *
 * `onTick` meters real ticks exactly as the live loop does, so a bounded replay
 * and a live session count identically. `capture` reads the per-tick rate off
 * the last real tick, and `advance` multiplies it by the jump length.
 *
 * Allocates one rates object per resolution rather than one per jump. The
 * closures below write into it and nothing here allocates per tick.
 */
export function createAct1OfflineObserver(
  probes: Act1MeterProbes,
  meter: Act1Meter,
): OfflineObserver {
  const rates = createAct1MeterRates();
  return {
    onTick(state: SimulationState, seconds: number): void {
      recordAct1Tick(state, probes, meter, seconds);
    },
    capture(state: SimulationState): void {
      captureAct1MeterRates(state, probes, rates);
    },
    advance(ticks: number): void {
      advanceAct1Meter(meter, rates, ticks);
    },
  };
}
