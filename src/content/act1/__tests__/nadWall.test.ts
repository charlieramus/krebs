import { describe, expect, it } from "vitest";
import { TICK_SECONDS } from "../../../sim/constants";
import { computeFlux, type Reaction } from "../../../sim/reactions";
import type { SimulationState } from "../../../sim/state";
import { setShortfallLogging, tick } from "../../../sim/tick";
import {
  atpPerCompletedGlucose,
  atpPerGlucose,
  createAct1Meter,
  createAct1MeterProbes,
  netAtpPerCompletedGlucose,
  recordAct1Tick,
  type Act1Meter,
} from "../meter";
import { createAct1, type Act1ReactionId } from "../reactions";
import {
  ACT1_GLUCOSE_ENV_INITIAL,
  ACT1_NICOTINAMIDE_TOTAL,
  ACT1_VMAX,
} from "../tuning";

/**
 * The teaching beat of act 1, as four assertions.
 *
 * docs/PROGRESSION.md act 1, "The teaching beat" states it plainly: fermentation produces no
 * additional ATP, its entire function is recycling NAD+, and most players
 * arrive expecting an energy upgrade. Assertion (d) is that sentence written as
 * a test, and it is the reason this file exists rather than a comment saying
 * the same thing.
 */

setShortfallLogging(false);

function fluxOf(state: SimulationState, id: Act1ReactionId): number {
  return computeFlux(
    state.reactions.find((r) => r.id === id) as Reaction,
    state.pools.amounts,
  );
}

function setEnabled(
  state: SimulationState,
  id: Act1ReactionId,
  value: boolean,
): void {
  (state.reactions.find((r) => r.id === id) as Reaction).enabled = value;
}

interface RunResult {
  readonly ticks: number;
  readonly peakPayoffFlux: number;
  /** First tick at which payoff flux fell below 1% of Vmax after having risen above 25% of it. */
  readonly stallTick: number;
  /** First tick at which payoff flux rose above half of the peak seen before this run. */
  readonly recoveryTick: number;
}

/**
 * Advance the simulation, metering as it goes.
 *
 * `priorPeak` is the payoff flux the pathway reached before this run started,
 * which is what "recovered" is measured against. Recovering to half of what the
 * cell could do before it stalled is a claim about the same cell; recovering to
 * half of Vmax would be a claim about the enzyme.
 */
function run(
  state: SimulationState,
  meter: Act1Meter,
  ticks: number,
  priorPeak = 0,
): RunResult {
  const probes = createAct1MeterProbes(state);
  const vmax = ACT1_VMAX.payoff;
  let peak = 0;
  let started = false;
  let stallTick = -1;
  let recoveryTick = -1;

  for (let i = 1; i <= ticks; i += 1) {
    tick(state);
    recordAct1Tick(state, probes, meter);

    const payoff = fluxOf(state, "payoff");
    if (payoff > peak) peak = payoff;

    // The pathway starts at zero flux because g3p starts at zero, so a naive
    // "flux is low" test fires on tick 1. It has to have run first.
    if (payoff > 0.25 * vmax) started = true;
    if (started && stallTick === -1 && payoff < 0.01 * vmax) stallTick = i;
    if (priorPeak > 0 && recoveryTick === -1 && payoff > 0.5 * priorPeak)
      recoveryTick = i;
  }

  return { ticks, peakPayoffFlux: peak, stallTick, recoveryTick };
}

const seconds = (ticks: number): number => ticks * TICK_SECONDS;

describe("the NAD+ wall", () => {
  it("stalls with glucose abundant, then recovers on fermentation, at no gain in yield", () => {
    // ---------------------------------------------------------------------
    // (a) Ferment disabled, glucose abundant. Run until steady.
    // ---------------------------------------------------------------------
    const state = createAct1();
    expect(
      (state.reactions.find((r) => r.id === "ferment") as Reaction).enabled,
    ).toBe(false);

    const stalledMeter = createAct1Meter();
    const g3pBeforeStall = state.pools.get("g3p");
    const stalled = run(state, stalledMeter, 1200);
    const stalledG3pDelta = state.pools.get("g3p") - g3pBeforeStall;

    const total = state.pools.totalConserved("nicotinamide");
    expect(total).toBeCloseTo(ACT1_NICOTINAMIDE_TOTAL, 10);

    // NAD+ is gone.
    expect(state.pools.get("nad")).toBeLessThan(1e-6 * total);
    // NADH holds essentially the whole carrier pool.
    expect(state.pools.get("nadh")).toBeGreaterThan(0.999 * total);

    // The claim is about flux, not about pool levels. A pathway can have an
    // empty pool and still be running; this one is not running.
    expect(fluxOf(state, "payoff")).toBeLessThan(0.001 * ACT1_VMAX.payoff);
    expect(stalled.stallTick).toBeGreaterThan(0);

    // It got going first. Otherwise the assertion above would be satisfied by a
    // pathway that never started, which is a different bug entirely.
    expect(stalled.peakPayoffFlux).toBeGreaterThan(0.25 * ACT1_VMAX.payoff);

    // ---------------------------------------------------------------------
    // (b) This is not substrate starvation, and the test proves it is not.
    // ---------------------------------------------------------------------
    // Read from the constant, not from a literal. This said 10000 from V2 until
    // V5 stage 5, which was the environment size at the time and has been 80000
    // since V3 stage 6, so the assertion had been passing with eight times the
    // margin it was written to check.
    expect(state.pools.get("glucose_env")).toBeGreaterThan(
      0.9 * ACT1_GLUCOSE_ENV_INITIAL,
    );
    // Intracellular glucose is not merely present, it is piling up: uptake
    // keeps running while the pathway that consumes it does not.
    expect(state.pools.get("glucose")).toBeGreaterThan(state.pools.get("nadh"));

    const nadAtStall = state.pools.get("nad");
    const glucoseAtStall = state.pools.get("glucose");
    const glucoseEnvAtStall = state.pools.get("glucose_env");
    const stalledAtpPerGlucose = atpPerCompletedGlucose(
      stalledMeter,
      stalledG3pDelta,
    );
    const stalledNetPerGlucose = netAtpPerCompletedGlucose(
      stalledMeter,
      stalledG3pDelta,
    );
    const stalledRaw = atpPerGlucose(stalledMeter);

    // ---------------------------------------------------------------------
    // (c) Enable ferment from the stalled state and continue.
    // ---------------------------------------------------------------------
    setEnabled(state, "ferment", true);
    const fermentMeter = createAct1Meter();
    const g3pBeforeFerment = state.pools.get("g3p");
    const recovered = run(state, fermentMeter, 1200, stalled.peakPayoffFlux);
    const fermentG3pDelta = state.pools.get("g3p") - g3pBeforeFerment;

    expect(state.pools.get("nad")).toBeGreaterThan(0.25 * total);
    expect(fluxOf(state, "payoff")).toBeGreaterThan(
      0.5 * stalled.peakPayoffFlux,
    );
    expect(recovered.recoveryTick).toBeGreaterThan(0);
    expect(state.pools.get("lactate")).toBeGreaterThan(0);
    expect(fluxOf(state, "ferment")).toBeGreaterThan(0);

    // ---------------------------------------------------------------------
    // (d) The misconception, stated as an assertion.
    // ---------------------------------------------------------------------
    const fermentingAtpPerGlucose = atpPerCompletedGlucose(
      fermentMeter,
      fermentG3pDelta,
    );
    const fermentingNetPerGlucose = netAtpPerCompletedGlucose(
      fermentMeter,
      fermentG3pDelta,
    );
    const fermentingRaw = atpPerGlucose(fermentMeter);

    // Fermentation buys throughput and buys exactly zero yield. Both runs
    // produce the sourced 4 ATP gross and 2 net per glucose that finished the
    // pathway. docs/SCIENCE.md Part 2, "Glycolysis".
    expect(stalledAtpPerGlucose).toBeCloseTo(4, 9);
    expect(fermentingAtpPerGlucose).toBeCloseTo(4, 9);
    expect(fermentingAtpPerGlucose).toBeCloseTo(stalledAtpPerGlucose, 9);

    expect(stalledNetPerGlucose).toBeCloseTo(2, 9);
    expect(fermentingNetPerGlucose).toBeCloseTo(2, 9);

    // The uncorrected figures, which differ, and the reason they differ is
    // stranded g3p rather than any change in yield. Asserted so the gap stays
    // visible instead of being quietly absorbed by the correction above.
    //
    // THE CLAIM IS THE g3p DELTA, NOT THE DIRECTION OF THE ERROR, and
    // UPDATELOGV5.md stage 2 is what taught that distinction. This used to
    // assert both raw figures came out below 4. The stalling window builds g3p
    // it never cashes in, so it reads low; the fermenting window starts with
    // g3p already stranded and cashes it in, so whether it reads low or high
    // depends only on how much the stall stranded. The bootstrap repair changed
    // that quantity and flipped the sign, without moving either corrected figure
    // by a single digit. Asserting the sign of each delta says what is actually
    // being claimed and does not have to be revisited every time a stall
    // strands a different amount.
    expect(stalledG3pDelta).toBeGreaterThan(0);
    expect(stalledRaw).toBeLessThan(4);
    expect(fermentG3pDelta).toBeLessThan(0);
    expect(fermentingRaw).toBeGreaterThan(4);
    expect(fermentingRaw).toBeGreaterThan(stalledRaw);

    // Throughput, on the other hand, moved by a lot. This is the half of the
    // story the player does get.
    expect(fermentMeter.glucoseConsumed).toBeGreaterThan(
      5 * stalledMeter.glucoseConsumed,
    );

    console.log(
      [
        "",
        `  nicotinamide total       ${total}`,
        `  peak payoff flux         ${stalled.peakPayoffFlux.toFixed(3)} /s`,
        `  stall at                 ${seconds(stalled.stallTick).toFixed(2)} game-seconds`,
        `  nad at stall             ${nadAtStall.toExponential(3)} of ${total.toFixed(0)}`,
        `  glucose at stall         ${glucoseAtStall.toFixed(2)} intracellular, ${glucoseEnvAtStall.toFixed(0)} environmental`,
        `  recovery at              ${seconds(recovered.recoveryTick).toFixed(2)} game-seconds after enabling ferment`,
        `  ATP per completed glucose, stalled     ${stalledAtpPerGlucose.toFixed(9)} gross, ${stalledNetPerGlucose.toFixed(9)} net`,
        `  ATP per completed glucose, fermenting  ${fermentingAtpPerGlucose.toFixed(9)} gross, ${fermentingNetPerGlucose.toFixed(9)} net`,
        `  uncorrected, per glucose consumed      ${stalledRaw.toFixed(6)} stalled, ${fermentingRaw.toFixed(6)} fermenting`,
        `  g3p stranded                           ${stalledG3pDelta.toFixed(4)} stalled, ${fermentG3pDelta.toFixed(4)} fermenting`,
        `  glucose consumed         ${stalledMeter.glucoseConsumed.toFixed(2)} stalled, ${fermentMeter.glucoseConsumed.toFixed(2)} fermenting`,
        "",
      ].join("\n"),
    );
  });

  it("conserves nicotinamide through the stall and through the recovery", () => {
    const state = createAct1();
    const total = state.pools.totalConserved("nicotinamide");
    let worst = 0;

    const check = (): void => {
      const drift =
        Math.abs(state.pools.totalConserved("nicotinamide") - total) / total;
      if (drift > worst) worst = drift;
      // If this fails the fermentation stoichiometry is wrong and the
      // stage 3 property test missed it.
      expect(drift).toBeLessThan(1e-9);
    };

    for (let i = 0; i < 600; i += 1) {
      tick(state);
      check();
    }
    setEnabled(state, "ferment", true);
    for (let i = 0; i < 600; i += 1) {
      tick(state);
      check();
    }

    // And the sum of the two halves is the whole, not merely close to it.
    expect(state.pools.get("nad") + state.pools.get("nadh")).toBeCloseTo(
      total,
      9,
    );
    console.log(
      `\n  worst nicotinamide drift across stall and recovery: ${worst.toExponential(3)}\n`,
    );
  });

  it("regenerates NAD+ without producing any ATP, by stoichiometry alone", () => {
    // The claim does not depend on the rates or on the run above. There is no
    // ATP term anywhere in the fermentation reaction, so no tuning value could
    // make fermentation yield energy.
    const state = createAct1();
    const ferment = state.reactions.find((r) => r.id === "ferment") as Reaction;
    const atp = state.pools.indexOf("atp");
    const adp = state.pools.indexOf("adp");
    const nad = state.pools.indexOf("nad");

    for (const term of [...ferment.substrates, ...ferment.products]) {
      expect(term.poolIndex).not.toBe(atp);
      expect(term.poolIndex).not.toBe(adp);
    }
    expect(ferment.products.some((t) => t.poolIndex === nad)).toBe(true);
  });

  it("does not stall when fermentation is enabled from the start", () => {
    // The control. Without this, a stall caused by something other than NAD+
    // would still satisfy every assertion above.
    const state = createAct1({ enabled: { ferment: true } });
    const meter = createAct1Meter();
    const g3pBefore = state.pools.get("g3p");
    const result = run(state, meter, 1200);
    const g3pDelta = state.pools.get("g3p") - g3pBefore;

    expect(result.stallTick).toBe(-1);
    expect(fluxOf(state, "payoff")).toBeGreaterThan(0.25 * ACT1_VMAX.payoff);
    expect(state.pools.get("nad")).toBeGreaterThan(
      0.1 * ACT1_NICOTINAMIDE_TOTAL,
    );
    expect(state.pools.get("nadh")).toBeGreaterThan(0);
    expect(atpPerCompletedGlucose(meter, g3pDelta)).toBeCloseTo(4, 9);
  });
});
