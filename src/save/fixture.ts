/**
 * The fixture generator. `npm run save:fixture`.
 *
 * An entry point rather than a library: importing it runs it. It writes
 * `src/save/__tests__/fixtures/v<SCHEMA_VERSION>.json`, and it refuses to
 * overwrite one that already exists.
 *
 * ---------------------------------------------------------------------------
 * READ THIS BEFORE RUNNING IT AGAIN
 * ---------------------------------------------------------------------------
 *
 * `src/save/__tests__/fixtures/v1.json` is COMMITTED and is never regenerated.
 * docs/SAVE_SCHEMA.md Part 1: "Fixtures are never deleted. The fixture set is
 * the regression suite for the entire save history." Regenerating one silently
 * rewrites the thing a future migration is tested against, which turns a
 * regression suite into a mirror.
 *
 * This file exists so that the PROCEDURE is recorded rather than the artifact
 * being unreproducible. When version 2 ships, its fixture is generated the same
 * way from a version 2 build, committed alongside the version 1 one, and both
 * stay forever.
 *
 * ---------------------------------------------------------------------------
 * THE ONE THING IN HERE THAT ACT 1 DOES NOT DO BY ITSELF
 * ---------------------------------------------------------------------------
 *
 * Act 1 consumes no random numbers. `src/sim/tick.ts` never touches the PRNG,
 * so a real act 1 run of any length finishes with `prng.state` exactly equal to
 * `prng.seed`, and a fixture like that cannot exercise the field
 * docs/SAVE_SCHEMA.md Part 5 says is the one most likely to be dropped: a save
 * that reconstructed the generator from the seed alone would be indistinguishable
 * from a correct one.
 *
 * The generator therefore draws a fixed number of values from the stream after
 * the run, standing in for a later act that does use it. That is disclosed here,
 * in the fixture README and in the stage 3 report. Nothing else about the fixture
 * is synthetic: every pool amount, every meter figure and the elapsed time come
 * out of a real act 1 simulation.
 */

import process from 'node:process';
import { existsSync, writeFileSync } from 'node:fs';
import { TICK_MS } from '../sim/constants';
import { createLoop } from '../sim/loop';
import { michaelisMenten } from '../sim/reactions';
import type { SimulationState } from '../sim/state';
import {
  createAct1Meter,
  createAct1MeterProbes,
  recordAct1Tick,
  type Act1Meter,
} from '../content/act1/meter';
import { createAct1 } from '../content/act1/reactions';
import {
  ACT1_NO_CARRIED_COUNTERS,
  ACT1_UNLOCK_FERMENT,
  act1UptakeUnlockId,
  captureAct1,
} from '../content/act1/save';
import { serializeReadable } from './codec';
import { SCHEMA_VERSION, type SaveV2 } from './schema';

/**
 * Fixed timestamps, so the artifact is a function of the procedure alone.
 *
 * A fixture stamped with the clock of whoever ran the generator would differ on
 * every machine, and the byte-stability property stage 1 built would be
 * unobservable in the one file where it matters most. 2026-07-30T12:00:00Z and
 * ten minutes later.
 */
const FIXTURE_CREATED_AT = 1785585600000;
const FIXTURE_SAVED_AT = 1785586200000;

/** Values drawn from the stream after the run. See the header. */
const FIXTURE_PRNG_DRAWS = 7;

/** The run, in game-seconds: 60 walled, 60 fermenting, 120 fermenting at higher capacity. */
const TICKS_TO_WALL = 1200;
const TICKS_AFTER_FERMENT = 1200;
const TICKS_AFTER_CAPACITY = 2400;

function advance(state: SimulationState, meter: Act1Meter, ticks: number): void {
  const probes = createAct1MeterProbes(state);
  const loop = createLoop(state, (ticked) => {
    recordAct1Tick(ticked, probes, meter);
  });
  // One tick per call. MAX_CATCHUP_TICKS caps a single advance at 200 and routes
  // the rest to the offline path, which is not what a played run looks like.
  for (let i = 0; i < ticks; i += 1) loop.advance(TICK_MS);
}

function reaction(state: SimulationState, id: string) {
  const found = state.reactions.find((r) => r.id === id);
  if (found === undefined) throw new Error(`fixture: no reaction "${id}"`);
  return found;
}

/**
 * A played act 1 run with something in it: past the NAD+ wall, fermenting, one
 * rung up the capacity ladder, four game-minutes deep.
 *
 * The purchases happen in the order a player makes them. Lactate dehydrogenase
 * costs 55 cumulative ATP and the first capacity step costs 1500, so ferment
 * comes first, and `progression.unlocked` is insertion ordered.
 */
export function buildV1Fixture(): SaveV2 {
  const state = createAct1();
  const meter = createAct1Meter();

  // 1. Run into the wall. Ferment ships disabled, so the payoff phase stops.
  advance(state, meter, TICKS_TO_WALL);

  // 2. Buy lactate dehydrogenase. What the runtime's buyFerment does.
  reaction(state, 'ferment').enabled = true;
  advance(state, meter, TICKS_AFTER_FERMENT);

  // 3. Buy the first uptake capacity step, 8 to 10. What buyUptakeStep does.
  const uptake = reaction(state, 'uptake');
  const kinetics = uptake.kinetics;
  if (kinetics.kind !== 'michaelis-menten') throw new Error('fixture: uptake is not Michaelis-Menten');
  (uptake as { kinetics: typeof kinetics }).kinetics = michaelisMenten(10, kinetics.km);
  advance(state, meter, TICKS_AFTER_CAPACITY);

  // 4. Move the generator off its seed. The one synthetic step. See the header.
  for (let i = 0; i < FIXTURE_PRNG_DRAWS; i += 1) state.prng.next();

  return captureAct1(
    state,
    meter,
    [ACT1_UNLOCK_FERMENT, act1UptakeUnlockId(1)],
    {},
    {
      meta: {
        createdAt: FIXTURE_CREATED_AT,
        lastSavedAt: FIXTURE_SAVED_AT,
        buildId: 'v4-fixture',
      },
      carried: ACT1_NO_CARRIED_COUNTERS,
    },
  );
}

/**
 * Named from SCHEMA_VERSION rather than written down, so that the generator
 * cannot write a version 2 save into the version 1 fixture.
 *
 * That is not a hypothetical. This file wrote `v1.json` as a literal from V4 to
 * V14, and the first bump would otherwise have overwritten the one artifact the
 * header spends twenty lines saying is never regenerated. It refuses to write
 * over an existing file now for the same reason.
 */
const OUTPUT = `src/save/__tests__/fixtures/v${SCHEMA_VERSION}.json`;

const save = buildV1Fixture();
const text = `${serializeReadable(save)}\n`;

if (process.argv.includes('--write')) {
  if (existsSync(OUTPUT) && !process.argv.includes('--force')) {
    console.error(`${OUTPUT} already exists and fixtures are never regenerated.`);
    console.error('Read the header of this file. If you are certain, pass --force.');
    process.exit(1);
  }
  writeFileSync(OUTPUT, text, 'utf8');
  console.log(`wrote ${OUTPUT}, ${text.length} bytes`);
} else {
  console.log(text);
  console.log(`Not written. Pass --write to overwrite ${OUTPUT}.`);
  console.log('Fixtures are never regenerated once committed. Read the header before you do.');
}
