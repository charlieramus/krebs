/**
 * The offline delta. docs/SAVE_SCHEMA.md Part 3, and THE SEAM V5 STARTS FROM.
 *
 * V4 computes how long the player was away, caps it, stores it and credits
 * nothing. Not a single tick of it is simulated. That is deliberate and it is the
 * whole point of the file: offline progress is a genuinely hard algorithm with
 * its own validation requirement in docs/SIMULATION.md Part 3, it is V5's, and
 * V5 should inherit a real accumulated number rather than a zero.
 *
 * The alternative was to compute nothing until V5 exists, which quietly throws
 * away the time every player spends away during the V4 release. A number nobody
 * has spent yet is recoverable. A number nobody recorded is not.
 */

import { MAX_OFFLINE_HOURS } from '../sim/constants';

/** The cap, in milliseconds. Written as a product rather than a literal so it tracks the constant. */
export const MAX_OFFLINE_MS = MAX_OFFLINE_HOURS * 60 * 60 * 1000;

export interface OfflineDelta {
  /** What will be credited, after the cap. Never negative. */
  readonly awayMs: number;
  /** The raw reading, before the cap. Zero when the clock moved backwards. */
  readonly rawMs: number;
  /** Whether the cap bit. Worth telling the player, since it is time they will not get. */
  readonly capped: boolean;
  /** Whether the system clock moved backwards between the save and the load. */
  readonly clockWentBackwards: boolean;
}

/**
 * Now minus `lastSavedAt`, once, at the boundary.
 *
 * docs/SAVE_SCHEMA.md Part 3: "Offline duration is computed as now minus
 * lastSavedAt at load, once, at the boundary. Wall-clock time never enters the
 * tick loop." A negative delta means the system clock moved backwards, and the
 * rule is to credit zero and NOT to error, because a player whose machine
 * changed time zone has done nothing wrong and a game that refuses to load is a
 * worse answer than one that credits nothing.
 *
 * The positive side is capped at MAX_OFFLINE_HOURS, which already exists in
 * src/sim/constants.ts as the clock-tampering bound.
 */
export function computeOfflineDelta(lastSavedAt: number, now: number): OfflineDelta {
  const rawMs = now - lastSavedAt;

  if (!(rawMs > 0)) {
    return { awayMs: 0, rawMs: 0, capped: false, clockWentBackwards: rawMs < 0 };
  }

  if (rawMs > MAX_OFFLINE_MS) {
    return { awayMs: MAX_OFFLINE_MS, rawMs, capped: true, clockWentBackwards: false };
  }

  return { awayMs: rawMs, rawMs, capped: false, clockWentBackwards: false };
}
