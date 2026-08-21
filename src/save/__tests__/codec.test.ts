/**
 * The codec and the act 1 mapping. docs/SAVE_SCHEMA.md Part 5, first item.
 *
 * Round trip first, because it is the test every other save test assumes. Then
 * BYTE STABILITY, which is the one that is easy to leave out: deep equality can
 * pass while a float has been reformatted or a key has moved, and a save that is
 * not byte-stable is a save whose fixture comparisons drift in stage 3 and look
 * like schema changes when they are not.
 *
 * Then the structural corruption cases on `deserialize` alone. The realistic
 * corruption is not a truncated file, it is a blob with the right shape and a
 * string where a number belongs, which parses cleanly and then produces NaN pool
 * amounts forever.
 */

import { describe, expect, it } from 'vitest';

import { TICK_MS } from '../../sim/constants';
import { createLoop } from '../../sim/loop';
import type { SimulationState } from '../../sim/state';
import {
  createAct1Meter,
  createAct1MeterProbes,
  recordAct1Tick,
  type Act1Meter,
} from '../../content/act1/meter';
import { ACT1_INITIAL, ACT1_POOL_IDS } from '../../content/act1/pools';
import { createAct1 } from '../../content/act1/reactions';
import {
  ACT1_NO_CARRIED_COUNTERS,
  ACT1_UNLOCK_FERMENT,
  act1UptakeUnlockId,
  captureAct1,
  deriveAct1Unlocks,
  parseAct1UptakeUnlockId,
  restoreAct1,
  restoreAct1OrThrow,
  type Act1CaptureContext,
} from '../../content/act1/save';
import { deserialize, serialize, serializeReadable } from '../codec';
import { SCHEMA_VERSION, type SaveV2 } from '../schema';

/** A fixed meta, so nothing in this file reads a clock and nothing is flaky. */
const META: Act1CaptureContext['meta'] = {
  createdAt: 1785000000000,
  lastSavedAt: 1785000600000,
  buildId: 'test',
};

const CONTEXT: Act1CaptureContext = { meta: META, carried: ACT1_NO_CARRIED_COUNTERS };

/**
 * Run n whole ticks with the meter riding the loop's tick observer, as the
 * runtime does. One tick per `advance`, because MAX_CATCHUP_TICKS caps a single
 * call at 200 and routes the rest to the offline path.
 */
function run(state: SimulationState, meter: Act1Meter, ticks: number): void {
  const probes = createAct1MeterProbes(state);
  const loop = createLoop(state, (ticked) => {
    recordAct1Tick(ticked, probes, meter);
  });
  for (let i = 0; i < ticks; i += 1) loop.advance(TICK_MS);
}

/** A state that has been somewhere: past the NAD+ wall, fermenting, one rung up the ladder. */
function playedSave(): SaveV2 {
  const state = createAct1({ enabled: { ferment: true }, vmax: { uptake: 10 } });
  const meter = createAct1Meter();
  run(state, meter, 600);
  return captureAct1(
    state,
    meter,
    [ACT1_UNLOCK_FERMENT, act1UptakeUnlockId(1)],
    {},
    CONTEXT,
  );
}

describe('save codec, round trip', () => {
  it('restores every field of a played save and re-captures it identically', () => {
    const save = playedSave();

    const text = serialize(save);
    const parsed = deserialize(text);
    expect(parsed.kind).toBe('ok');
    if (parsed.kind !== 'ok') return;

    // Deep equality across the parse. This is what proves meta, settings and the
    // fields nothing derives from the simulation survive the string.
    expect(parsed.save).toEqual(save);

    const restored = restoreAct1OrThrow(parsed.save);
    const again = captureAct1(
      restored.state,
      restored.meter,
      restored.unlocked,
      restored.settings,
      { meta: parsed.save.meta, carried: restored.carried },
    );

    expect(again).toEqual(save);
    // Byte identity, not deep equality. Deep equality passes while a float has
    // been reformatted.
    expect(serialize(again)).toBe(text);
  });

  it('carries pool amounts by id rather than by index', () => {
    const save = playedSave();
    for (const id of ACT1_POOL_IDS) {
      expect(typeof save.pools[id]).toBe('number');
    }
    expect(Object.keys(save.pools)).toEqual([...ACT1_POOL_IDS]);
  });

  it('maps the meter onto the schema names, mismatch and all', () => {
    const state = createAct1({ enabled: { ferment: true } });
    const meter = createAct1Meter();
    run(state, meter, 400);
    const save = captureAct1(state, meter, [], {}, CONTEXT);

    expect(save.stats.totalAtpProduced).toBe(meter.atpProduced);
    expect(save.stats.glucoseConsumed).toBe(meter.glucoseConsumed);
    expect(save.stats.atpSpent).toBe(meter.atpSpent);
    expect(save.stats.atpMaintained).toBe(meter.atpMaintained);
    expect(save.stats.glucoseTakenUp).toBe(meter.glucoseTakenUp);
    expect(save.stats.lactateProduced).toBe(meter.lactateProduced);
    expect(save.stats.nadhProduced).toBe(meter.nadhProduced);

    // The mismatch is the point of the assertion. There is no `atpProduced` in
    // the schema and there never will be.
    expect('atpProduced' in save.stats).toBe(false);
  });

  it('never writes a tickCount', () => {
    const save = playedSave();
    expect('tickCount' in save).toBe(false);
    expect('tickCount' in save.time).toBe(false);
    expect(JSON.parse(serialize(save))).not.toHaveProperty('tickCount');
  });

  it('writes nothing under enzymes and nothing act 1 does not honestly have', () => {
    const save = playedSave();
    expect(save.enzymes).toEqual({});
    expect(save.environment.oxygenLevel).toBe(0);
    expect(save.progression.endosymbiont).toBeNull();
    expect(save.progression.shuttleChoice).toBeNull();
    expect(save.progression.act).toBe(1);
  });
});

describe('save codec, the unlock list is the source of truth', () => {
  it('derives the ferment flag from the unlock list and never persists it', () => {
    const state = createAct1({ enabled: { ferment: true } });
    const meter = createAct1Meter();
    run(state, meter, 100);

    // Captured with an EMPTY unlock list even though the reaction is running.
    // Nothing in the save records the flag, so the restore must turn it off.
    const withoutUnlock = captureAct1(state, meter, [], {}, CONTEXT);
    expect(JSON.stringify(withoutUnlock)).not.toContain('enabled');

    const off = restoreAct1OrThrow(withoutUnlock);
    expect(off.unlocks.fermentEnabled).toBe(false);
    expect(reaction(off.state, 'ferment').enabled).toBe(false);

    const withUnlock = captureAct1(state, meter, [ACT1_UNLOCK_FERMENT], {}, CONTEXT);
    const on = restoreAct1OrThrow(withUnlock);
    expect(on.unlocks.fermentEnabled).toBe(true);
    expect(reaction(on.state, 'ferment').enabled).toBe(true);
  });

  it('reads the capacity step off the highest uptake id present', () => {
    expect(deriveAct1Unlocks([]).uptakeStep).toBe(0);
    expect(deriveAct1Unlocks([act1UptakeUnlockId(1)]).uptakeStep).toBe(1);
    expect(
      deriveAct1Unlocks([act1UptakeUnlockId(1), act1UptakeUnlockId(2)]).uptakeStep,
    ).toBe(2);
    // A gap lands on the rung reached, not one below it.
    expect(deriveAct1Unlocks([act1UptakeUnlockId(2)]).uptakeStep).toBe(2);
  });

  it('preserves unlock ids it does not recognise rather than dropping them', () => {
    const save = playedSave();
    const withStranger: SaveV2 = {
      ...save,
      progression: { ...save.progression, unlocked: [...save.progression.unlocked, 'hexokinase'] },
    };

    const restored = restoreAct1OrThrow(withStranger);
    expect(restored.unlocks.unknown).toEqual(['hexokinase']);
    expect(restored.unlocked).toEqual([ACT1_UNLOCK_FERMENT, act1UptakeUnlockId(1), 'hexokinase']);

    const again = captureAct1(restored.state, restored.meter, restored.unlocked, restored.settings, {
      meta: withStranger.meta,
      carried: restored.carried,
    });
    expect(again.progression.unlocked).toEqual(withStranger.progression.unlocked);
  });

  it('parses uptake ids and refuses things that only look like them', () => {
    expect(parseAct1UptakeUnlockId(act1UptakeUnlockId(3))).toBe(3);
    expect(parseAct1UptakeUnlockId('uptake-capacity-')).toBeNull();
    expect(parseAct1UptakeUnlockId('uptake-capacity-0')).toBeNull();
    expect(parseAct1UptakeUnlockId('uptake-capacity-1.5')).toBeNull();
    expect(parseAct1UptakeUnlockId('ferment')).toBeNull();
  });
});

describe('save codec, pools', () => {
  it('treats an unknown pool id as corruption rather than shrugging', () => {
    const save = playedSave();
    const stranger: SaveV2 = { ...save, pools: { ...save.pools, citrate: 4 } };

    const result = restoreAct1(stranger);
    expect(result.kind).toBe('corrupt');
    if (result.kind !== 'corrupt') return;
    expect(result.reason).toContain('citrate');
  });

  it('defaults a missing pool id to ACT1_INITIAL and reports it', () => {
    const save = playedSave();
    const pools = { ...save.pools };
    delete (pools as Record<string, number>)['lactate'];
    const thin: SaveV2 = { ...save, pools };

    const restored = restoreAct1OrThrow(thin);
    expect(restored.missingPools).toEqual(['lactate']);
    expect(restored.state.pools.get('lactate')).toBe(ACT1_INITIAL.lactate);
  });
});

describe('save codec, tick reconstruction', () => {
  it('reconstructs the tick count exactly while the rate is unchanged', () => {
    const save = playedSave();
    expect(save.time.elapsedGameMs).toBe(600 * TICK_MS);

    const restored = restoreAct1OrThrow(save);
    expect(restored.state.tickCount).toBe(600);
    expect(restored.discardedMs).toBe(0);
  });

  it('floors a remainder and reports it, and does NOT call it corruption', () => {
    // What a save written at TICK_MS 50 looks like to a build running at 40:
    // an elapsed time that is not a whole multiple of the current tick.
    const save = playedSave();
    const skewed: SaveV2 = {
      ...save,
      time: { ...save.time, elapsedGameMs: save.time.elapsedGameMs + TICK_MS / 2 },
    };

    expect(deserialize(serialize(skewed)).kind).toBe('ok');

    const restored = restoreAct1OrThrow(skewed);
    expect(restored.state.tickCount).toBe(600);
    expect(restored.discardedMs).toBe(TICK_MS / 2);
    // At most one tick of game time, which is the whole cost of the rule.
    expect(restored.discardedMs).toBeLessThan(TICK_MS);
  });
});

describe('save codec, diagnostics counters', () => {
  it('carries the shortfall projection forward rather than resetting it', () => {
    const save = playedSave();
    const seeded: SaveV2 = {
      ...save,
      diagnostics: { ...save.diagnostics, negativePoolScalingEvents: 17, scalingCapHits: 3 },
    };

    const restored = restoreAct1OrThrow(seeded);
    // scalingCapHits is a scalar in both places and restores onto the state.
    expect(restored.state.diagnostics.scalingCapHits).toBe(3);
    // The per-pool projection cannot be inverted, so it rides on `carried`.
    expect(restored.carried.negativePoolScalingEvents).toBe(17);

    const again = captureAct1(restored.state, restored.meter, restored.unlocked, restored.settings, {
      meta: seeded.meta,
      carried: restored.carried,
    });
    expect(again.diagnostics.negativePoolScalingEvents).toBe(17);
    expect(again.diagnostics.scalingCapHits).toBe(3);

    // And a restored session adds its own work to the carried total.
    run(restored.state, restored.meter, 50);
    let live = 0;
    for (const count of restored.state.diagnostics.shortfallTicks) live += count;
    const later = captureAct1(restored.state, restored.meter, restored.unlocked, restored.settings, {
      meta: seeded.meta,
      carried: restored.carried,
    });
    expect(later.diagnostics.negativePoolScalingEvents).toBe(17 + live);
  });

  it('persists pendingOfflineMs, which V3 surfaced and nothing consumed', () => {
    const state = createAct1();
    const meter = createAct1Meter();
    // Far past MAX_CATCHUP_TICKS. The excess routes to the offline path.
    createLoop(state).advance(300000);
    expect(state.diagnostics.pendingOfflineMs).toBeGreaterThan(0);

    const save = captureAct1(state, meter, [], {}, CONTEXT);
    expect(save.time.pendingOfflineMs).toBe(state.diagnostics.pendingOfflineMs);

    const restored = restoreAct1OrThrow(save);
    expect(restored.state.diagnostics.pendingOfflineMs).toBe(save.time.pendingOfflineMs);
    // V4 stores it and credits nothing. V5 owns spending it.
    expect(save.time.offlineCreditedMs).toBe(0);
  });
});

describe('save codec, structural corruption', () => {
  const save = playedSave();
  const text = serialize(save);

  function reasonFor(mutate: (root: Record<string, unknown>) => void): string {
    const root = JSON.parse(text) as Record<string, unknown>;
    mutate(root);
    const result = deserialize(JSON.stringify(root));
    expect(result.kind).toBe('corrupt');
    return result.kind === 'corrupt' ? result.reason : '';
  }

  it('rejects a truncated file', () => {
    const result = deserialize(text.slice(0, text.length - 20));
    expect(result.kind).toBe('corrupt');
  });

  it('rejects something that is not JSON at all', () => {
    expect(deserialize('this is not a save').kind).toBe('corrupt');
    expect(deserialize('').kind).toBe('corrupt');
  });

  it('rejects a value that parses but is not an object', () => {
    expect(deserialize('4').kind).toBe('corrupt');
    expect(deserialize('null').kind).toBe('corrupt');
    expect(deserialize('[]').kind).toBe('corrupt');
  });

  it('rejects a string where a number belongs, which is the realistic corruption', () => {
    expect(
      reasonFor((root) => {
        (root['pools'] as Record<string, unknown>)['nad'] = '12.5';
      }),
    ).toContain('pools.nad');

    expect(
      reasonFor((root) => {
        (root['rng'] as Record<string, unknown>)['state'] = '1234';
      }),
    ).toContain('rng.state');
  });

  it('rejects a missing required field', () => {
    expect(
      reasonFor((root) => {
        delete (root['time'] as Record<string, unknown>)['elapsedGameMs'];
      }),
    ).toContain('time.elapsedGameMs is missing');

    expect(
      reasonFor((root) => {
        delete root['rng'];
      }),
    ).toContain('rng is missing');
  });

  it('rejects a null where an object belongs', () => {
    expect(
      reasonFor((root) => {
        root['progression'] = null;
      }),
    ).toContain('progression must be an object');
  });

  it('rejects NaN and Infinity, which JSON writes as null', () => {
    expect(
      reasonFor((root) => {
        (root['stats'] as Record<string, unknown>)['totalAtpProduced'] = null;
      }),
    ).toContain('stats.totalAtpProduced');
  });

  it('rejects a wrong type in the unlock list', () => {
    expect(
      reasonFor((root) => {
        (root['progression'] as Record<string, unknown>)['unlocked'] = ['ferment', 7];
      }),
    ).toContain('progression.unlocked[1]');
  });

  it('rejects negative elapsed time', () => {
    expect(
      reasonFor((root) => {
        (root['time'] as Record<string, unknown>)['elapsedGameMs'] = -1;
      }),
    ).toContain('must not be negative');
  });

  it('reports a newer schemaVersion as future rather than as corruption', () => {
    const root = JSON.parse(text) as Record<string, unknown>;
    root['schemaVersion'] = SCHEMA_VERSION + 1;
    const result = deserialize(JSON.stringify(root));
    expect(result.kind).toBe('future');
    if (result.kind !== 'future') return;
    expect(result.version).toBe(SCHEMA_VERSION + 1);
  });

  it('reads the version before anything else, so a future save is refused unparsed', () => {
    // Version 2 shaped nothing like version 1. It must still come back `future`,
    // because Part 1 says the version is read first and nothing is guessed.
    const result = deserialize(JSON.stringify({ schemaVersion: 99, whatever: true }));
    expect(result.kind).toBe('future');
  });

  it('rejects a schemaVersion that is not a positive integer', () => {
    expect(deserialize(JSON.stringify({ schemaVersion: '1' })).kind).toBe('corrupt');
    expect(deserialize(JSON.stringify({ schemaVersion: 1.5 })).kind).toBe('corrupt');
    expect(deserialize(JSON.stringify({ schemaVersion: 0 })).kind).toBe('corrupt');
  });

  it('drops keys a file added that the schema does not have', () => {
    const root = JSON.parse(text) as Record<string, unknown>;
    root['somethingElse'] = { nested: true };
    const result = deserialize(JSON.stringify(root));
    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    expect('somethingElse' in result.save).toBe(false);
    expect(serialize(result.save)).toBe(text);
  });
});

describe('save codec, the version 1 save of a fresh act 1 state', () => {
  it('reports it in full', () => {
    const state = createAct1();
    const meter = createAct1Meter();
    const save = captureAct1(state, meter, [], {}, CONTEXT);

    expect(deserialize(serialize(save)).kind).toBe('ok');

    console.log(`\nfresh act 1, version ${SCHEMA_VERSION} save:\n${serializeReadable(save)}\n`);
    console.log(`serialized length: ${serialize(save).length} bytes\n`);
  });
});

/** Reaction lookup by id, for assertions about derived flags. */
function reaction(state: SimulationState, id: string) {
  const found = state.reactions.find((r) => r.id === id);
  if (found === undefined) throw new Error(`no reaction "${id}"`);
  return found;
}
