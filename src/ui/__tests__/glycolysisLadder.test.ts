/**
 * The glycolytic capacity ladder, and the invariant that makes it safe to sell.
 *
 * UPDATELOGV5.md stage 3. NOW.md blocking item 2 said act 1 stops changing once
 * it is solved, and the measurement put a number on it: six discrete events, all
 * inside the first 5m13s, then 84m47s of nothing.
 *
 * WHY THE INVARIANT TEST IS THE IMPORTANT ONE. The preparatory phase spends 2
 * ATP per glucose and the payoff phase makes 4, two trioses at a time. Raise the
 * spender without the earner and the cell collapses into exactly the state
 * stage 2 was spent repairing. The boundary is the stoichiometric ratio and it
 * is sharp: at payoff Vmax of exactly twice prep Vmax every configuration
 * measured died, and just above it every one lived. A rung that breaks that
 * ratio is a purchase that kills the player's cell, so it fails here.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { TICK_MS } from '../../sim/constants';
import { setShortfallLogging } from '../../sim/tick';
import { createAct1Runtime, poolIndex, type Act1Runtime } from '../runtime';
import {
  GLYCOLYSIS_ATP_THRESHOLDS,
  GLYCOLYSIS_STEPS,
  PFK1_PK_VMAX_FACTOR,
  UPTAKE_VMAX_STEPS,
} from '../tuning';

beforeAll(() => {
  setShortfallLogging(false);
});

const ATP = poolIndex('atp');

/** A runtime pinned to one rung, run to steady state. */
function atRung(step: number, seconds: number): Act1Runtime {
  const rung = GLYCOLYSIS_STEPS[step];
  if (rung === undefined) throw new Error(`no rung ${step}`);
  const runtime = createAct1Runtime({
    act1: {
      enabled: { ferment: true },
      vmax: {
        uptake: rung.uptake,
        prep: rung.prep,
        payoff: rung.payoff,
        ferment: rung.payoff,
      },
      // A drain-free environment. This is a test about capacity and mixing the
      // food supply into it would make a slow rung and a small larder look the
      // same. How long the food lasts is measured in `npm run sim:drain`.
      initial: { glucose_env: 10_000_000 },
    },
    persistence: { enabled: false },
  });
  runtime.frame(0);
  const ticks = Math.round((seconds * 1000) / TICK_MS);
  for (let t = 0; t < ticks; t += 1) runtime.frame(runtime.snapshot.elapsedMs + TICK_MS);
  return runtime;
}

describe('the glycolytic capacity ladder', () => {
  it('keeps the payoff phase strictly faster than twice the preparatory phase', () => {
    // THE INVARIANT. Two trioses per glucose, so the payoff phase has to run
    // twice per preparatory turn just to keep up, and it has to have headroom
    // over that or the preparatory phase spends ATP the payoff phase has not
    // made back yet. Measured boundary, at ferment enabled and settled:
    //
    //   prep 12 dies at payoff 22, lives at 26      prep 16 dies at 32, lives at 36
    //   prep 13 dies at payoff 26, lives at 28      prep 18 dies at 36, lives at 40
    //   prep 14 dies at payoff 28, lives at 30      prep 20 dies at 40, lives at 44
    //
    // Every death is at exactly twice. If this fails, a rung has been added or
    // edited that will kill a player's cell when they buy it.
    for (const rung of GLYCOLYSIS_STEPS) {
      expect(rung.payoff).toBeGreaterThan(2 * rung.prep);
    }
  });

  it('never lets uptake outrun the preparatory phase by more than it can absorb', () => {
    // `prep` is second order in ATP and settles near 88 percent of its Vmax, so
    // a rung whose uptake matches its prep NAMEPLATE delivers glucose that piles
    // up unusably forever. That is what the uptake ladder's top rung does today,
    // at about 87 units a minute, and the ladder below closes it rather than
    // widening it. A rung with uptake at or above prep is that mistake repeated.
    //
    // RUNG 0 IS EXEMPT AND IS THE MISTAKE ITSELF. It is not a rung this ladder
    // chose. It is the configuration inherited from the top of the uptake
    // ladder, where V3 set uptake against prep's nameplate Vmax of 12 rather
    // than the 10.554 it actually reaches. Every purchasable rung narrows that
    // gap: the pile grows by 23.0 a minute at rung 1, 17.2 at rung 2, 9.2 at
    // rung 3 and shrinks by 1.5 at rung 4.
    for (const rung of GLYCOLYSIS_STEPS.slice(1)) {
      expect(rung.uptake).toBeLessThan(rung.prep);
    }
    expect((GLYCOLYSIS_STEPS[0] as { uptake: number }).uptake).toBe(
      UPTAKE_VMAX_STEPS[UPTAKE_VMAX_STEPS.length - 1] as number,
    );
  });

  it('is finite, ordered and has a last rung', () => {
    // CLAUDE.md hard rule 3. An upgrade with no last step is infinite scaling
    // wearing a small number, and the last step here is measured: a fifth rung
    // at uptake 21, prep 22 and payoff 48 collapses the cell, from a cold start
    // and by climbing to it.
    expect(GLYCOLYSIS_STEPS.length).toBe(5);
    expect(GLYCOLYSIS_ATP_THRESHOLDS.length).toBe(GLYCOLYSIS_STEPS.length - 1);
    for (let i = 1; i < GLYCOLYSIS_STEPS.length; i += 1) {
      const previous = GLYCOLYSIS_STEPS[i - 1];
      const rung = GLYCOLYSIS_STEPS[i];
      if (previous === undefined || rung === undefined) throw new Error('gap in the ladder');
      expect(rung.uptake).toBeGreaterThan(previous.uptake);
      expect(rung.prep).toBeGreaterThan(previous.prep);
      expect(rung.payoff).toBeGreaterThan(previous.payoff);
    }
    for (let i = 1; i < GLYCOLYSIS_ATP_THRESHOLDS.length; i += 1) {
      expect(GLYCOLYSIS_ATP_THRESHOLDS[i] as number).toBeGreaterThan(
        GLYCOLYSIS_ATP_THRESHOLDS[i - 1] as number,
      );
    }
  });

  it('is alive at every rung and every rung sells something', () => {
    // The invariant above is the reason to believe this; this is the measurement
    // that checks it. A rung that reads 0.00 ATP per second is a dead cell, and
    // a rung that reads the same as the one below it is V3 stage 6's mistake.
    let previous = 0;
    for (let step = 0; step < GLYCOLYSIS_STEPS.length; step += 1) {
      const runtime = atRung(step, 8 * 60);
      const rate = runtime.snapshot.production[ATP] as number;
      expect(rate).toBeGreaterThan(30);
      if (step > 0) expect(rate).toBeGreaterThan(previous * 1.1);
      previous = rate;
    }
  });

  it('keeps the invariant when the two named enzymes are bought', () => {
    // UPDATELOGV10.md stage 4. PFK-1 raises `prep` and pyruvate kinase raises
    // `payoff`, by the SAME factor, which is the whole reason they are one
    // purchase: the condition above is about the ratio, and one factor on both
    // sides of a ratio cannot change it. Asserted at every rung rather than
    // argued, because "cannot change it" is exactly the kind of sentence that is
    // true until somebody gives the two enzymes different factors.
    for (const rung of GLYCOLYSIS_STEPS) {
      expect(rung.payoff * PFK1_PK_VMAX_FACTOR).toBeGreaterThan(
        2 * rung.prep * PFK1_PK_VMAX_FACTOR,
      );
    }
  });

  it('does not open until the uptake ladder is finished', () => {
    // Both ladders raise uptake and this one always raises it further, so
    // offering them at once would let a player buy a rung that immediately
    // undoes a purchase still showing as bought on the shelf.
    const runtime = createAct1Runtime({ persistence: { enabled: false } });
    runtime.frame(0);
    for (let t = 0; t < 200; t += 1) runtime.frame(runtime.snapshot.elapsedMs + TICK_MS);
    // The wall has to be solved or the meter stops at 60 and the run measures
    // nothing. The uptake ladder is deliberately left unclimbed.
    expect(runtime.buyFerment()).toBe(true);
    for (let t = 0; t < 60000; t += 1) runtime.frame(runtime.snapshot.elapsedMs + TICK_MS);

    // Enough cumulative ATP for the first glycolytic rung many times over, and
    // the uptake ladder deliberately not climbed.
    expect(runtime.snapshot.meter.atpProduced).toBeGreaterThan(
      GLYCOLYSIS_ATP_THRESHOLDS[0] as number,
    );
    expect(runtime.snapshot.uptakeStep).toBeLessThan(UPTAKE_VMAX_STEPS.length - 1);
    expect(runtime.canBuyPfk1Pk()).toBe(false);
    expect(runtime.canBuyGlycolysisStep()).toBe(false);
    expect(runtime.buyGlycolysisStep()).toBe(false);
    expect(runtime.snapshot.glycolysisStep).toBe(0);
  });

  it('refuses to sell a rung past the last one', () => {
    const runtime = createAct1Runtime({ persistence: { enabled: false } });
    runtime.frame(0);
    for (let t = 0; t < 2000; t += 1) runtime.frame(runtime.snapshot.elapsedMs + TICK_MS);
    runtime.buyFerment();

    // Climb the whole act as fast as the thresholds allow, then keep asking.
    // The enzyme purchase sits between the ladders since UPDATELOGV10.md stage
    // 4 and this ladder is gated behind it, so a loop that skipped it would
    // never reach the top.
    for (let t = 0; t < 300000; t += 1) {
      runtime.frame(runtime.snapshot.elapsedMs + TICK_MS);
      runtime.buyUptakeStep();
      runtime.buyPfk1Pk();
      runtime.buyGlycolysisStep();
      if (runtime.snapshot.glycolysisStep === GLYCOLYSIS_STEPS.length - 1) break;
    }

    expect(runtime.snapshot.glycolysisStep).toBe(GLYCOLYSIS_STEPS.length - 1);
    expect(runtime.canBuyGlycolysisStep()).toBe(false);
    expect(runtime.buyGlycolysisStep()).toBe(false);
    expect(runtime.snapshot.production[ATP] as number).toBeGreaterThan(30);
  });
});
