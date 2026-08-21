/**
 * DETERMINISM ACROSS RELOAD.
 *
 * docs/SAVE_SCHEMA.md Part 5 lists five required tests and closes by saying this
 * one "is the one that catches missing RNG state, and it is the one most likely
 * to be skipped".
 *
 * The strong version is available here because src/sim/hash.ts already exists.
 * The claim is not that pool amounts come back close, it is that the CANONICAL
 * STATE HASH of a run that was saved and reloaded halfway is the identical
 * string to the hash of a run that was never interrupted. `hashState` covers
 * pool amounts in registry order, the tick count and the PRNG algorithm, seed
 * and state, which is exactly the surface a save has to carry. A comparison on
 * pool amounts alone would pass with the RNG state dropped, which is the
 * specific failure Part 5 warns about.
 *
 * ---------------------------------------------------------------------------
 * THE THING THAT WOULD HAVE MADE THIS FILE THEATRE
 * ---------------------------------------------------------------------------
 *
 * ACT 1 CONSUMES NO RANDOM NUMBERS. `src/sim/tick.ts` never touches the PRNG, so
 * a real act 1 run of any length finishes with `prng.state` exactly equal to
 * `prng.seed`. Every test below would pass with `rng.state` deleted from the
 * save, not because the save is correct but because the field never moves.
 *
 * V1 stage 5 named the same hole from the other side and
 * `src/content/act1/__tests__/determinism.test.ts` closed it with a fixed input
 * script: every 50 ticks, roll the PRNG and SET `ferment` from the result. That
 * makes the roll VALUE reach the pools, so two seeds produce different enable
 * histories, different NAD+ trajectories and different pool amounts. This file
 * reuses that shape for the same reason, and where a scenario needs `ferment`
 * held still it draws from the stream anyway.
 *
 * That the script is what makes the RNG matter is disclosed rather than assumed:
 * `the guard exists because act 1 does not use the PRNG at all` asserts the bare
 * fact directly.
 */

import { beforeAll, describe, expect, it } from 'vitest';

import { TICK_MS } from '../../sim/constants';
import { hashState } from '../../sim/hash';
import { createLoop } from '../../sim/loop';
import type { Reaction } from '../../sim/reactions';
import type { SimulationState } from '../../sim/state';
import { setShortfallLogging, tick } from '../../sim/tick';
import { createAct1Meter } from '../../content/act1/meter';
import { createAct1 } from '../../content/act1/reactions';
import {
  ACT1_NO_CARRIED_COUNTERS,
  ACT1_UNLOCK_FERMENT,
  captureAct1,
  restoreAct1OrThrow,
  type Act1CaptureContext,
} from '../../content/act1/save';
import { deserialize, serialize } from '../codec';
import type { SaveV2 } from '../schema';

beforeAll(() => {
  setShortfallLogging(false);
});

const CONTEXT: Act1CaptureContext = {
  meta: { createdAt: 1785000000000, lastSavedAt: 1785000600000, buildId: 'test' },
  carried: ACT1_NO_CARRIED_COUNTERS,
};

/** Ticks between PRNG rolls. Matches the act 1 determinism script. */
const ROLL_INTERVAL = 50;

function ferment(state: SimulationState): Reaction {
  return state.reactions.find((r) => r.id === 'ferment') as Reaction;
}

/**
 * Drive the simulation to an absolute tick count under the scripted input.
 *
 * The script is a function of `state.tickCount` rather than of a loop counter,
 * deliberately. A restore that reconstructed the tick count wrongly would then
 * roll on the wrong ticks as well as hashing wrongly, which is the behaviour a
 * real game would show and is what makes the tickCount mutilation below fail for
 * the right reason.
 */
function runTo(state: SimulationState, target: number, script: 'ferment' | 'draw' | 'none'): void {
  while (state.tickCount < target) {
    const t = state.tickCount;
    if (t > 0 && t % ROLL_INTERVAL === 0) {
      if (script === 'ferment') ferment(state).enabled = state.prng.next() < 0.5;
      // A draw whose value is discarded. The stall scenario needs the RNG moving
      // while the pathway is held still, which is the split most likely to hide
      // a dropped field.
      else if (script === 'draw') state.prng.next();
    }
    tick(state);
  }
}

/** Capture, serialize, deserialize, restore. The whole reload, through the real codec. */
function reload(state: SimulationState): SimulationState {
  const save = captureAct1(
    state,
    createAct1Meter(),
    // The unlock list IS the source of truth, so the live flag is persisted
    // through it rather than beside it, and the restore derives the flag back.
    ferment(state).enabled ? [ACT1_UNLOCK_FERMENT] : [],
    {},
    CONTEXT,
  );

  const parsed = deserialize(serialize(save));
  if (parsed.kind !== 'ok') throw new Error(`reload: save did not deserialize, ${parsed.kind}`);
  return restoreAct1OrThrow(parsed.save).state;
}

/* ===========================================================================
   THE GUARD THIS FILE DEPENDS ON
   =========================================================================== */

describe('reload determinism, the premise', () => {
  it('the guard exists because act 1 does not use the PRNG at all', () => {
    const state = createAct1({ seed: 12345 });
    runTo(state, 2000, 'none');

    // Not a defect. Act 1's pathway is fully deterministic without randomness.
    // It does mean an unscripted run cannot test whether rng.state survives a
    // save, because the field never leaves the seed.
    expect(state.prng.state).toBe(state.prng.seed);

    const scripted = createAct1({ seed: 12345 });
    runTo(scripted, 2000, 'ferment');
    expect(scripted.prng.state).not.toBe(scripted.prng.seed);
  });
});

/* ===========================================================================
   THE SWEEP
   =========================================================================== */

const SEEDS = [1, 7, 20260729, 4294967295];
const LENGTHS = [400, 1200, 4000];
const SPLIT_FRACTIONS = [0.1, 0.5, 0.9];

describe('reload determinism, the sweep', () => {
  it('matches an uninterrupted run at every seed, length and split point', () => {
    let cases = 0;

    for (const seed of SEEDS) {
      for (const ticks of LENGTHS) {
        const straight = createAct1({ seed });
        runTo(straight, ticks, 'ferment');
        const expected = hashState(straight);

        for (const fraction of SPLIT_FRACTIONS) {
          const split = Math.round(ticks * fraction);

          const first = createAct1({ seed });
          runTo(first, split, 'ferment');
          const second = reload(first);
          runTo(second, ticks, 'ferment');

          expect(
            hashState(second),
            `seed ${seed}, ${ticks} ticks, split at ${split}`,
          ).toBe(expected);
          cases += 1;
        }
      }
    }

    console.log(
      `\nreload determinism sweep: ${cases} cases, ` +
        `${SEEDS.length} seeds x ${LENGTHS.length} lengths x ${SPLIT_FRACTIONS.length} split points\n` +
        `  seeds   ${SEEDS.join(', ')}\n` +
        `  lengths ${LENGTHS.join(', ')} ticks\n` +
        `  splits  ${SPLIT_FRACTIONS.map((f) => `${f * 100}%`).join(', ')}\n`,
    );
    expect(cases).toBe(SEEDS.length * LENGTHS.length * SPLIT_FRACTIONS.length);
  });

  it('survives a split during the NAD+ stall, where the RNG is the only thing moving', () => {
    // Ferment never runs, so the pathway walls and the pools go static. Anything
    // that still differs after a reload has to have come from the save.
    const straight = createAct1({ seed: 99 });
    runTo(straight, 3000, 'draw');
    const expected = hashState(straight);

    const first = createAct1({ seed: 99 });
    runTo(first, 1500, 'draw');

    // The stall is real: the payoff phase has stopped and NAD+ is spent.
    expect(first.pools.get('nad')).toBeLessThan(0.05);
    const nadhBefore = first.pools.get('nadh');
    const stateBefore = first.prng.state;
    runTo(first, 1600, 'draw');
    expect(first.pools.get('nadh')).toBeCloseTo(nadhBefore, 6);
    expect(first.prng.state).not.toBe(stateBefore);

    const second = reload(first);
    runTo(second, 3000, 'draw');
    expect(hashState(second)).toBe(expected);
  });

  it('survives a split during fermentation recovery', () => {
    // The frame after the wall comes down. V3 measured the payoff phase
    // restarting 2 ticks after the unlock, so a split at 1010 lands inside the
    // recovery rather than after it.
    function run(splitAt: number | null): string {
      const state = createAct1({ seed: 4242 });
      runTo(state, 1500, 'draw');
      ferment(state).enabled = true;

      if (splitAt === null) {
        runTo(state, 2500, 'draw');
        return hashState(state);
      }

      runTo(state, splitAt, 'draw');
      const restored = reload(state);
      runTo(restored, 2500, 'draw');
      return hashState(restored);
    }

    const expected = run(null);
    expect(run(1502)).toBe(expected);
    expect(run(1510)).toBe(expected);
    expect(run(1600)).toBe(expected);
  });
});

/* ===========================================================================
   SAVING BETWEEN FRAMES
   =========================================================================== */

describe('reload determinism, saving mid-tick', () => {
  it('is unchanged by a sub-tick accumulator remainder', () => {
    // The runtime V3 built advances whole ticks and holds a sub-tick remainder.
    // That remainder is render state and is deliberately not saved, which is
    // what makes stage 5's autosave timer safe to fire whenever it likes rather
    // than only on tick boundaries.
    const straight = createAct1({ seed: 777 });
    runTo(straight, 1000, 'ferment');
    const expected = hashState(straight);

    const first = createAct1({ seed: 777 });
    const loop = createLoop(first);
    // 500 whole ticks, then 30 ms of a 50 ms tick: the accumulator is loaded and
    // no tick has run on it.
    for (let i = 0; i < 500; i += 1) {
      const t = first.tickCount;
      if (t > 0 && t % ROLL_INTERVAL === 0) ferment(first).enabled = first.prng.next() < 0.5;
      loop.advance(TICK_MS);
    }
    loop.advance(30);
    expect(loop.accumulatorMs).toBe(30);
    expect(first.tickCount).toBe(500);

    const second = reload(first);
    runTo(second, 1000, 'ferment');
    expect(hashState(second)).toBe(expected);
  });

  it('discards at most one tick of game time and never gains one', () => {
    const state = createAct1({ seed: 5 });
    const loop = createLoop(state);
    for (let i = 0; i < 100; i += 1) loop.advance(TICK_MS);
    loop.advance(49);

    const save = captureAct1(state, createAct1Meter(), [], {}, CONTEXT);
    // The remainder never reaches the save, because elapsedGameMs is derived
    // from the tick count rather than accumulated.
    expect(save.time.elapsedGameMs).toBe(100 * TICK_MS);
    expect(restoreAct1OrThrow(save).discardedMs).toBe(0);
  });
});

/* ===========================================================================
   THE MUTILATIONS

   A determinism test that has never failed is a determinism test nobody has
   checked. Both mutilations below are asserted to DIVERGE, so the test file
   would notice if the hash ever stopped covering one of these fields.
   =========================================================================== */

describe('reload determinism, proving the test can fail', () => {
  function referenceAndSplit(mutilate: (save: SaveV2) => SaveV2): {
    expected: string;
    actual: string;
  } {
    const straight = createAct1({ seed: 31337 });
    runTo(straight, 1200, 'ferment');
    const expected = hashState(straight);

    const first = createAct1({ seed: 31337 });
    runTo(first, 600, 'ferment');

    const save = captureAct1(
      first,
      createAct1Meter(),
      ferment(first).enabled ? [ACT1_UNLOCK_FERMENT] : [],
      {},
      CONTEXT,
    );
    const restored = restoreAct1OrThrow(mutilate(save)).state;
    runTo(restored, 1200, 'ferment');

    return { expected, actual: hashState(restored) };
  }

  it('diverges when rng.state is dropped and the seed alone is used', () => {
    const { expected, actual } = referenceAndSplit((save) => ({
      ...save,
      rng: { ...save.rng, state: save.rng.seed },
    }));
    expect(actual).not.toBe(expected);
  });

  it('diverges when tickCount is dropped', () => {
    const { expected, actual } = referenceAndSplit((save) => ({
      ...save,
      time: { ...save.time, elapsedGameMs: 0 },
    }));
    expect(actual).not.toBe(expected);
  });

  it('diverges when a single pool amount is dropped to its initial value', () => {
    // The third field the hash covers, checked for completeness. Pool amounts
    // are the part nobody forgets, which is exactly why the other two are the
    // ones Part 5 warns about.
    const { expected, actual } = referenceAndSplit((save) => ({
      ...save,
      pools: { ...save.pools, lactate: 0 },
    }));
    expect(actual).not.toBe(expected);
  });

  it('does NOT diverge when the sub-tick remainder is absent, which is correct', () => {
    // The control. Not every omission is a defect, and the remainder is the one
    // field that is deliberately not carried.
    const { expected, actual } = referenceAndSplit((save) => save);
    expect(actual).toBe(expected);
  });
});

/* ===========================================================================
   THE UNLOCK STATE, WHICH IS NOT HASHED AND STILL HAS TO SURVIVE
   =========================================================================== */

describe('reload determinism, unlocks are not hashed state', () => {
  it('diverges if the capacity step is not re-applied at restore', () => {
    // V3's src/ui/runtime.ts flagged this: setReactionVmax replaces a kinetics
    // descriptor and touches no pool, no tick count and no PRNG, so buying an
    // upgrade does not move the canonical hash. A reload that did not restore it
    // would therefore pass every determinism test in the project while silently
    // refunding the purchase. Here it is, failing on purpose.
    const straight = createAct1({ seed: 606, vmax: { uptake: 10 } });
    runTo(straight, 1200, 'ferment');
    const expected = hashState(straight);

    const first = createAct1({ seed: 606, vmax: { uptake: 10 } });
    runTo(first, 600, 'ferment');
    const save = captureAct1(
      first,
      createAct1Meter(),
      ferment(first).enabled ? [ACT1_UNLOCK_FERMENT] : [],
      {},
      CONTEXT,
    );

    // Restored without the capacity step. The uptake ladder lives in the
    // interface's tuning and the runtime re-applies it; content only reports the
    // step, which stage 5 wires up.
    const naive = restoreAct1OrThrow(save).state;
    runTo(naive, 1200, 'ferment');
    expect(hashState(naive)).not.toBe(expected);

    // Restored with it, the way the runtime does.
    const restored = restoreAct1OrThrow(save).state;
    const uptake = restored.reactions.find((r) => r.id === 'uptake') as Reaction;
    const kinetics = uptake.kinetics;
    if (kinetics.kind !== 'michaelis-menten') throw new Error('uptake is not Michaelis-Menten');
    (uptake as { kinetics: typeof kinetics }).kinetics = {
      kind: 'michaelis-menten',
      vmax: 10,
      km: kinetics.km,
    };
    runTo(restored, 1200, 'ferment');
    expect(hashState(restored)).toBe(expected);
  });

  it('diverges if the ferment unlock is not persisted', () => {
    const straight = createAct1({ seed: 808 });
    runTo(straight, 1500, 'draw');
    ferment(straight).enabled = true;
    runTo(straight, 2500, 'draw');
    const expected = hashState(straight);

    const first = createAct1({ seed: 808 });
    runTo(first, 1500, 'draw');
    ferment(first).enabled = true;
    runTo(first, 2000, 'draw');

    // Captured with an empty unlock list, which is what a save that did not
    // record purchases would carry.
    const forgotten = restoreAct1OrThrow(
      captureAct1(first, createAct1Meter(), [], {}, CONTEXT),
    ).state;
    runTo(forgotten, 2500, 'draw');
    expect(hashState(forgotten)).not.toBe(expected);

    const remembered = restoreAct1OrThrow(
      captureAct1(first, createAct1Meter(), [ACT1_UNLOCK_FERMENT], {}, CONTEXT),
    ).state;
    runTo(remembered, 2500, 'draw');
    expect(hashState(remembered)).toBe(expected);
  });
});
