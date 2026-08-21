/**
 * Act 3 played end to end, and measured. UPDATELOGV14.md stage 5 steps 4 and 5.
 *
 * ---------------------------------------------------------------------------
 * THE INSTRUMENT V5 STAGE 5 AND V10 STAGE 5 ESTABLISHED
 * ---------------------------------------------------------------------------
 *
 * Drive the act with a player model, record cumulative gross ATP at every
 * purchase, report the purchase times and the gaps between them, and compare
 * against docs/PROGRESSION.md's target. Act 3's is 120 to 180 minutes.
 *
 * TWO PLAYER MODELS, as act 1 has:
 *
 *     eager    buys the instant a purchase is affordable
 *     checker  looks every five game-minutes and buys what is available
 *
 * The second is the honest one for an idle game and it is the slower of the two,
 * so an act that fits at both ends fits.
 *
 * ---------------------------------------------------------------------------
 * AND THE GAPS, BECAUSE A LONGER ACT WITH A BIGGER SILENCE IN IT HAS MOVED THE
 * PROBLEM RATHER THAN SOLVED IT
 * ---------------------------------------------------------------------------
 *
 * NOW.md blocking item 2 is act 1's dead gap. V10 took act 1's worst gap from
 * 13m51s to 6m43s across ten purchases. Act 3 is a longer act with nineteen
 * purchases, and the stage says directly that its worst gap has to be reported
 * against act 1's rather than left as a total duration.
 */

import { describe, expect, it } from 'vitest';
import { TICK_SECONDS } from '../../../sim/constants';
import { setShortfallLogging, tick } from '../../../sim/tick';
import { createAct3Meter, createAct3MeterProbes, recordAct3Tick } from '../meter';
import { createAct3, type Act3ReactionId } from '../reactions';
import {
  ACT3_CONTENT_PURCHASES,
  ACT3_CRISTAE,
  ACT3_CRISTAE_REACTIONS,
  ACT3_ENABLES,
  ACT3_GENOME,
  ACT3_GENOME_REACTIONS,
  ACT3_MITOCHONDRIA,
  ACT3_MITOCHONDRIA_UPKEEP,
  ACT3_REPLICATED_REACTIONS,
  act3UnlockIds,
  setAct3Vmax,
} from '../unlocks';
import { ACT3_VMAX } from '../tuning';

setShortfallLogging(false);

/** Act 3's target, from docs/PROGRESSION.md. */
const TARGET_MIN_MINUTES = 120;
const TARGET_MAX_MINUTES = 180;

interface Purchase {
  readonly id: string;
  readonly seconds: number;
  readonly atp: number;
}

interface Run {
  readonly purchases: readonly Purchase[];
  readonly lastSeconds: number;
  readonly worstGapSeconds: number;
  readonly grossAtp: number;
  readonly environmentEmptiedAt: number | null;
}

/**
 * Play act 3.
 *
 * METERED THROUGH `act3/meter.ts`, which reads applied flux. The first version
 * of this harness summed increases in the `atp` pool, and at steady state
 * production equals consumption so the pool does not move: a cell producing
 * roughly 25 ATP per game-second metered 0.00 and act 3 appeared unable to reach
 * its second purchase. **The model was fine and the instrument was broken**,
 * which is worth remembering the next time an act looks dead.
 */
function play(checkIntervalSeconds: number, ticksMax = 20 * 60 * 240): Run {
  const state = createAct3();
  const by = new Map(state.reactions.map((r) => [r.id as Act3ReactionId, r]));
  const probes = createAct3MeterProbes(state);
  const meter = createAct3Meter();
  const envIndex = state.pools.indexOf('glucose_env');

  const genomeBase = new Map(ACT3_GENOME_REACTIONS.map((id) => [id, ACT3_VMAX[id]]));
  const replicatedBase = new Map(ACT3_REPLICATED_REACTIONS.map((id) => [id, ACT3_VMAX[id]]));
  const maintainBase = ACT3_VMAX.maintain;

  let genomeRung = 0;
  let mitoRung = 0;
  let cristaeRung = 0;
  let nextEnable = 0;
  let gross = 0;
  const purchases: Purchase[] = [];
  let environmentEmptiedAt: number | null = null;

  /** Apply the two ladders to the reaction table. Idempotent. */
  const applyLadders = (): void => {
    const genome = ACT3_GENOME.factors[genomeRung] as number;
    const mito = ACT3_MITOCHONDRIA.factors[mitoRung] as number;
    const cristae = ACT3_CRISTAE.factors[cristaeRung] as number;
    for (const id of ACT3_REPLICATED_REACTIONS) {
      const reaction = by.get(id);
      if (reaction === undefined) continue;
      const base = replicatedBase.get(id) as number;
      const withGenome = genomeBase.has(id) ? (genomeBase.get(id) as number) * genome : base;
      const withCristae = ACT3_CRISTAE_REACTIONS.includes(id) ? withGenome * cristae : withGenome;
      setAct3Vmax(state, id, withCristae * mito);
    }
    setAct3Vmax(state, 'maintain', maintainBase * (ACT3_MITOCHONDRIA_UPKEEP[mitoRung] as number));
  };
  applyLadders();

  const buyIfAffordable = (seconds: number): void => {
    let bought = true;
    while (bought) {
      bought = false;
      const next = ACT3_ENABLES[nextEnable];
      if (next !== undefined && gross >= next.threshold) {
        for (const id of next.reactions) {
          const reaction = by.get(id);
          if (reaction !== undefined) reaction.enabled = true;
        }
        purchases.push({ id: next.id, seconds, atp: gross });
        nextEnable += 1;
        bought = true;
        continue;
      }
      const genomeNext = ACT3_GENOME.thresholds[genomeRung];
      if (genomeNext !== undefined && gross >= genomeNext) {
        genomeRung += 1;
        applyLadders();
        purchases.push({ id: `${ACT3_GENOME.idPrefix}-${genomeRung}`, seconds, atp: gross });
        bought = true;
        continue;
      }
      const cristaeNext = ACT3_CRISTAE.thresholds[cristaeRung];
      if (cristaeNext !== undefined && gross >= cristaeNext) {
        cristaeRung += 1;
        applyLadders();
        purchases.push({ id: `${ACT3_CRISTAE.idPrefix}-${cristaeRung}`, seconds, atp: gross });
        bought = true;
        continue;
      }
      const mitoNext = ACT3_MITOCHONDRIA.thresholds[mitoRung];
      if (mitoNext !== undefined && gross >= mitoNext) {
        mitoRung += 1;
        applyLadders();
        purchases.push({ id: `${ACT3_MITOCHONDRIA.idPrefix}-${mitoRung}`, seconds, atp: gross });
        bought = true;
      }
    }
  };

  const checkEvery = Math.max(1, Math.round(checkIntervalSeconds / TICK_SECONDS));

  for (let t = 0; t < ticksMax; t += 1) {
    tick(state);
    recordAct3Tick(state, probes, meter);
    gross = meter.atpProduced;

    if (environmentEmptiedAt === null && (state.pools.amounts[envIndex] as number) < 1) {
      environmentEmptiedAt = (t + 1) * TICK_SECONDS;
    }

    if ((t + 1) % checkEvery === 0) buyIfAffordable((t + 1) * TICK_SECONDS);
    if (purchases.length === ACT3_CONTENT_PURCHASES) break;
  }

  let worstGap = 0;
  for (let i = 1; i < purchases.length; i += 1) {
    const gap = (purchases[i] as Purchase).seconds - (purchases[i - 1] as Purchase).seconds;
    if (gap > worstGap) worstGap = gap;
  }

  return {
    purchases,
    lastSeconds: purchases.length > 0 ? (purchases[purchases.length - 1] as Purchase).seconds : 0,
    worstGapSeconds: worstGap,
    grossAtp: gross,
    environmentEmptiedAt,
  };
}

function clock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m${String(s).padStart(2, '0')}s`;
}

describe('act 3 pacing', () => {
  it('reaches its last purchase inside the 120 to 180 minute target on both player models', () => {
    const eager = play(TICK_SECONDS);
    const checker = play(300);

    for (const [name, run] of [
      ['eager', eager],
      ['checker', checker],
    ] as const) {
      const lines = run.purchases.map(
        (p) => `      ${p.id.padEnd(32)}${clock(p.seconds).padStart(8)}   ${Math.round(p.atp)}`,
      );
      console.log(
        `  ${name}: ${run.purchases.length} of ${ACT3_CONTENT_PURCHASES} purchases, ` +
          `last at ${clock(run.lastSeconds)}, worst gap ${clock(run.worstGapSeconds)}\n` +
          lines.join('\n') +
          (run.environmentEmptiedAt === null
            ? '\n      environment still has food'
            : `\n      environment empties at ${clock(run.environmentEmptiedAt)}`),
      );
    }

    for (const [name, run] of [
      ['eager', eager],
      ['checker', checker],
    ] as const) {
      expect(run.purchases.length, `${name} reaches every purchase`).toBe(ACT3_CONTENT_PURCHASES);
      const minutes = run.lastSeconds / 60;
      expect(minutes, `${name} is not shorter than the target`).toBeGreaterThanOrEqual(
        TARGET_MIN_MINUTES,
      );
      expect(minutes, `${name} is not longer than the target`).toBeLessThanOrEqual(
        TARGET_MAX_MINUTES,
      );
    }
  });

  it('reports the worst gap against act 1s, which is what blocking item 2 is about', () => {
    const checker = play(300);
    console.log(
      `  act 3 worst gap ${clock(checker.worstGapSeconds)} across ` +
        `${ACT3_CONTENT_PURCHASES} purchases, against act 1's 6m43s across 10`,
    );
    // Act 1's worst gap after V10 is 6m43s. A longer act with a bigger silence
    // in it has moved the problem rather than solved it.
    expect(checker.worstGapSeconds).toBeLessThanOrEqual(15 * 60);
  });

  it('mints exactly the unlock ids the ladders describe, and every one is reached', () => {
    const checker = play(300);
    expect(checker.purchases.map((p) => p.id).sort()).toEqual([...act3UnlockIds()].sort());
  });

  it('never ships a rung that makes the cell worse, which is V5s rule', () => {
    /*
     * Measured at every mitochondrial rung rather than argued from the two
     * arrays. The capacity factor has to outrun the maintenance factor, and a
     * rung that did not would be a purchase the player regrets, which V5
     * established must not ship.
     */
    const readings: string[] = [];
    let previous = -Infinity;

    for (let rung = 0; rung < ACT3_MITOCHONDRIA.factors.length; rung += 1) {
      const state = createAct3({
        enabled: Object.fromEntries(
          state0Reactions().map((id) => [id, true]),
        ) as Record<string, boolean>,
      });
      const capacity = ACT3_MITOCHONDRIA.factors[rung] as number;
      const upkeep = ACT3_MITOCHONDRIA_UPKEEP[rung] as number;
      for (const id of ACT3_REPLICATED_REACTIONS) {
        setAct3Vmax(state, id, ACT3_VMAX[id] * capacity);
      }
      setAct3Vmax(state, 'maintain', ACT3_VMAX.maintain * upkeep);

      const probes = createAct3MeterProbes(state);
      const meter = createAct3Meter();
      for (let t = 0; t < 6000; t += 1) {
        tick(state);
        recordAct3Tick(state, probes, meter);
      }
      const perSecond = meter.atpProduced / (6000 * TICK_SECONDS);
      readings.push(
        `    rung ${rung}: capacity ${capacity.toFixed(2)}, upkeep ${upkeep.toFixed(2)}, ` +
          `${perSecond.toFixed(2)} gross ATP per game-second`,
      );
      expect(perSecond, `rung ${rung} is not worse than rung ${rung - 1}`).toBeGreaterThan(previous);
      previous = perSecond;
    }

    console.log(`  mitochondrial ladder:\n${readings.join('\n')}`);
  });

  it('is a finite ladder at both ends, per docs/PILLARS.md rule 3', () => {
    // Adding a rung means editing an array. There is no formula and no
    // exponent, which is what "no infinite scaling" means mechanically.
    expect(ACT3_GENOME.factors.length).toBeGreaterThan(1);
    expect(ACT3_MITOCHONDRIA.factors.length).toBeGreaterThan(1);
    expect(ACT3_GENOME.thresholds.length).toBe(ACT3_GENOME.factors.length - 1);
    expect(ACT3_MITOCHONDRIA.thresholds.length).toBe(ACT3_MITOCHONDRIA.factors.length - 1);
    expect(ACT3_MITOCHONDRIA_UPKEEP.length).toBe(ACT3_MITOCHONDRIA.factors.length);

    // And gene transfer ends at exactly 1.0: the player gets back what the
    // transition took and no more.
    expect(ACT3_GENOME.factors[ACT3_GENOME.factors.length - 1]).toBe(1);
    expect(ACT3_GENOME.factors[0]).toBeLessThan(1);
  });
});

/** Everything except the two ladders, for the rung comparison. */
function state0Reactions(): readonly Act3ReactionId[] {
  return [
    ...ACT3_ENABLES.flatMap((e) => e.reactions),
    'uptake',
    'prep',
    'payoff',
    'maintain',
  ] as Act3ReactionId[];
}
