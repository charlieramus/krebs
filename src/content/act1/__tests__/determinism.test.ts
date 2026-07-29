import { beforeAll, describe, expect, it } from 'vitest';
import { hashState } from '../../../sim/hash';
import type { Reaction } from '../../../sim/reactions';
import type { SimulationState } from '../../../sim/state';
import { setShortfallLogging, tick } from '../../../sim/tick';
import { createAct1 } from '../reactions';

/**
 * The V1 determinism guard, pointed at act 1.
 *
 * docs/SIMULATION.md Part 5: same seed plus same input sequence must produce a
 * bit-identical state hash across runs, machines and browsers.
 *
 * V1 stage 5 identified the hole this file has to avoid. If the seed only
 * reaches the hash through the PRNG state field, then "different seeds produce
 * different hashes" is satisfied by the hash reading the seed and nothing else,
 * which proves nothing whatsoever about the simulation. So the script below
 * spends the PRNG on a decision that changes what the pathway does, and the
 * decision it makes is the one act 1 actually has: whether fermentation is
 * running.
 *
 * TWO CANONICAL HASHES NOW, ONE PER FIXTURE, BOTH FROZEN. The toy pathway's
 * 172f83fb is not touched by anything here and lives where it always did, in
 * src/sim/__tests__/determinism.test.ts.
 */

beforeAll(() => {
  setShortfallLogging(false);
});

/**
 * A fixed input script: every 50 ticks, roll the PRNG and set `ferment` on or
 * off from the result.
 *
 * Set rather than toggled, deliberately. A toggle depends only on how many
 * rolls have happened, so the roll VALUE would never reach the pools and the
 * seed would once again only be visiting the RNG state. Setting from the roll
 * means two seeds produce genuinely different enable histories, different NAD+
 * trajectories and different pool amounts, so the hash is sensitive to the
 * simulation and not just to its bookkeeping.
 *
 * This is also the shape unlocks take in the real game, and the shape act 2
 * enzyme damage will take.
 */
function runScript(seed: number, ticks: number): SimulationState {
  const state = createAct1({ seed });
  const ferment = state.reactions.find((r) => r.id === 'ferment') as Reaction;

  for (let t = 0; t < ticks; t += 1) {
    if (t > 0 && t % 50 === 0) {
      ferment.enabled = state.prng.next() < 0.5;
    }
    tick(state);
  }

  return state;
}

/** Any change to these three numbers changes the hash below. */
const CANONICAL_SEED = 20260729;
const CANONICAL_TICKS = 1200;

describe('act 1 determinism', () => {
  it('produces the same hash for the same seed and script, run twice', () => {
    const first = hashState(runScript(CANONICAL_SEED, CANONICAL_TICKS));
    const second = hashState(runScript(CANONICAL_SEED, CANONICAL_TICKS));
    expect(second).toBe(first);
  });

  it('produces a different hash for a different seed', () => {
    const a = hashState(runScript(CANONICAL_SEED, CANONICAL_TICKS));
    const b = hashState(runScript(CANONICAL_SEED + 1, CANONICAL_TICKS));
    const c = hashState(runScript(1, CANONICAL_TICKS));
    expect(b).not.toBe(a);
    expect(c).not.toBe(a);
    expect(c).not.toBe(b);
  });

  it('reaches the pools with the seed, not only the PRNG state field', () => {
    // The hole V1 stage 5 named, closed explicitly rather than by assumption.
    // Two seeds, and the pool amounts themselves differ before any hashing
    // happens. If this fails, every other test in this file is theatre.
    const a = runScript(CANONICAL_SEED, CANONICAL_TICKS);
    const b = runScript(CANONICAL_SEED + 1, CANONICAL_TICKS);

    let differing = 0;
    for (let i = 0; i < a.pools.count; i += 1) {
      if (a.pools.amounts[i] !== b.pools.amounts[i]) differing += 1;
    }
    // Lactate at minimum, and in practice most of the pathway.
    expect(differing).toBeGreaterThan(2);
    expect(a.pools.get('lactate')).not.toBe(b.pools.get('lactate'));
  });

  it('produces a different hash after one more tick', () => {
    const shorter = hashState(runScript(CANONICAL_SEED, CANONICAL_TICKS));
    const longer = hashState(runScript(CANONICAL_SEED, CANONICAL_TICKS + 1));
    expect(longer).not.toBe(shorter);
  });

  it('is sensitive to a single pool changing by one ulp', () => {
    const state = runScript(CANONICAL_SEED, 100);
    const before = hashState(state);
    const index = state.pools.indexOf('lactate');
    const amount = state.pools.amounts[index] as number;
    state.pools.amounts[index] = amount + Number.EPSILON * amount;
    expect(hashState(state)).not.toBe(before);
  });

  it('holds the act 1 canonical hash', () => {
    // Frozen so later logs have a known-good value to compare against. A change
    // here means act 1's arithmetic changed: a coefficient, a tuning value, the
    // pool set or the pool ordering. That may be correct, but it is never
    // incidental, and this is the line that makes it visible.
    //
    // Fixture: createAct1({ seed: 20260729 }), 1200 ticks, setting ferment from
    // a PRNG roll every 50 ticks.
    //
    // CHANGED ONCE, DELIBERATELY, AND HERE IS THE ENTRY THIS LINE EXISTS FOR.
    // Was e9b720a8 from V1 through V3 stage 5. UPDATELOGV3.md stage 6 raised
    // ACT1_GLUCOSE_ENV_INITIAL from 10000 to 80000 to move the ATP bootstrap
    // trap in NOW.md blocking item 1 beyond the horizon of act 1, and starting
    // amounts are hashed state, so the hash moved with it. Nothing else changed:
    // no coefficient, no pool, no ordering, no rate. Re-frozen at 657594cb.
    expect(hashState(runScript(CANONICAL_SEED, CANONICAL_TICKS))).toBe('657594cb');
  });
});
