/**
 * The named glycolytic enzymes, and the claim act 1 exists to make.
 *
 * UPDATELOGV10.md stage 4. docs/PROGRESSION.md act 1 item 5 asks for the
 * regulated steps of glycolysis sold by name, and docs/PROGRESSION.md's wall
 * paragraph says enzyme upgrades increase throughput and never yield. This file
 * is where that second sentence stops being a promise.
 *
 * WHY THE YIELD TEST IS WRITTEN OVER CONFIGURATIONS RATHER THAN OVER RUNS. Gross
 * 4 ATP and net 2 per glucose is a property of the reaction table, so it cannot
 * be moved by a Vmax and a test that ran a simulation to check it would be
 * measuring the tuning rather than the claim. What the number of purchasable
 * configurations changes is how many ways there are to be wrong about it, so the
 * assertion is over every one of them.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { TICK_MS } from '../../sim/constants';
import { setShortfallLogging } from '../../sim/tick';
import { createAct1Runtime, poolIndex, type Act1Runtime } from '../runtime';
import {
  GLYCOLYSIS_STEPS,
  PFK1_PK_ATP_THRESHOLD,
  PFK1_PK_VMAX_FACTOR,
  UPTAKE_VMAX_STEPS,
} from '../tuning';

beforeAll(() => {
  setShortfallLogging(false);
});

const ATP = poolIndex('atp');

/**
 * Every configuration of the two capacity ladders and the enzyme purchase that
 * a player can actually be in.
 *
 * The enzyme purchase is gated to the top of the uptake ladder and the
 * glycolytic ladder is gated behind the enzyme purchase, so the reachable set is
 * not the full cross product and this enumerates the reachable set rather than
 * the arithmetic one. A test that asserted over unreachable configurations would
 * be asserting about a game nobody can play.
 */
interface Configuration {
  readonly name: string;
  readonly uptakeStep: number;
  readonly enzymes: boolean;
  readonly glycolysisStep: number | null;
}

const CONFIGURATIONS: readonly Configuration[] = [
  ...UPTAKE_VMAX_STEPS.map((_, step) => ({
    name: `uptake rung ${step}`,
    uptakeStep: step,
    enzymes: false,
    glycolysisStep: null,
  })),
  {
    name: 'enzymes, no glycolytic rung',
    uptakeStep: UPTAKE_VMAX_STEPS.length - 1,
    enzymes: true,
    glycolysisStep: null,
  },
  ...GLYCOLYSIS_STEPS.map((_, step) => ({
    name: `glycolytic rung ${step}, enzymes`,
    uptakeStep: UPTAKE_VMAX_STEPS.length - 1,
    enzymes: true,
    glycolysisStep: step,
  })),
];

/** A runtime built directly into a configuration, run to steady state. */
function at(configuration: Configuration, seconds: number): Act1Runtime {
  const rung =
    configuration.glycolysisStep === null
      ? null
      : (GLYCOLYSIS_STEPS[configuration.glycolysisStep] as {
          uptake: number;
          prep: number;
          payoff: number;
        });
  const factor = configuration.enzymes ? PFK1_PK_VMAX_FACTOR : 1;
  const uptake =
    rung === null ? (UPTAKE_VMAX_STEPS[configuration.uptakeStep] as number) : rung.uptake;
  // Rung 0 is the configuration at the top of the uptake ladder, so a run with
  // the enzymes and no rung bought is rung 0 scaled, which is what the runtime
  // does when the purchase is made.
  const base = rung ?? (GLYCOLYSIS_STEPS[0] as { prep: number; payoff: number });
  const payoff = base.payoff * factor;

  const runtime = createAct1Runtime({
    act1: {
      enabled: { ferment: true },
      vmax: {
        uptake,
        prep: base.prep * factor,
        payoff,
        ferment: payoff,
      },
      // A drain-free larder. This is a test about capacity, and mixing the food
      // supply into it would make a slow configuration and a small larder look
      // the same.
      initial: { glucose_env: 10_000_000 },
    },
    persistence: { enabled: false },
  });
  runtime.frame(0);
  const ticks = Math.round((seconds * 1000) / TICK_MS);
  for (let t = 0; t < ticks; t += 1) runtime.frame(runtime.snapshot.elapsedMs + TICK_MS);
  return runtime;
}

describe('the named glycolytic enzymes', () => {
  it('leaves the yield exactly where it was, in every purchasable configuration', () => {
    // THE CLAIM ACT 1 EXISTS TO MAKE. Read off the reaction table, which is what
    // makes it immune to every number this stage moved: not one of them is a
    // coefficient.
    for (const configuration of CONFIGURATIONS) {
      const runtime = at(configuration, 60);
      expect(
        runtime.snapshot.atpPerGlucose.toFixed(9),
        `gross yield moved in: ${configuration.name}`,
      ).toBe('4.000000000');
      expect(
        runtime.snapshot.netAtpPerGlucose.toFixed(9),
        `net yield moved in: ${configuration.name}`,
      ).toBe('2.000000000');
    }

    // NOT A CONSTANT BEING COMPARED TO ITSELF. Both figures are MEASURED off the
    // run by `atpPerCompletedGlucose` and `netAtpPerCompletedGlucose` in
    // src/content/act1/meter.ts, which divide the cumulative counters by the
    // glucose that actually finished the pathway. A tuning change that moved the
    // yield would move these, which is the whole point of asserting them here
    // rather than asserting the reaction table again.
  });

  it('counts nine purchasable configurations, and says why that is not more', () => {
    // UPDATELOGV5.md asserted the yield across nine: three uptake rungs plus
    // five glycolytic rungs, with rung 0 shared. This log adds the enzyme
    // purchase, which is one more configuration and not five, **because the
    // glycolytic ladder is gated behind it**. A player is never on a glycolytic
    // rung without the enzymes, so the enzyme-free rungs 1 to 4 that the
    // arithmetic would allow are configurations nobody can reach, and asserting
    // over them would be asserting about a game nobody can play.
    expect(CONFIGURATIONS).toHaveLength(9);
    expect(CONFIGURATIONS.filter((c) => c.enzymes)).toHaveLength(6);
  });

  it('is alive in every configuration, and never worse than the one below it', () => {
    // V5's rule: a purchase that makes the cell worse does not ship. Checked
    // across the whole sequence rather than at the ends, because the failure
    // this catches is a middle configuration that dips.
    const rates = CONFIGURATIONS.map((configuration) => {
      const runtime = at(configuration, 8 * 60);
      return { name: configuration.name, rate: runtime.snapshot.production[ATP] as number };
    });
    for (const { name, rate } of rates) {
      expect(rate, `dead in: ${name}`).toBeGreaterThan(30);
    }
    console.log(
      `\n  ATP per second by configuration:\n${rates
        .map(({ name, rate }) => `    ${name.padEnd(30)} ${rate.toFixed(3).padStart(8)}`)
        .join('\n')}\n`,
    );
  });

  it('sells nothing until the uptake ladder is finished', () => {
    const runtime = createAct1Runtime({ persistence: { enabled: false } });
    runtime.frame(0);
    for (let t = 0; t < 200; t += 1) runtime.frame(runtime.snapshot.elapsedMs + TICK_MS);
    expect(runtime.buyFerment()).toBe(true);
    for (let t = 0; t < 60000; t += 1) runtime.frame(runtime.snapshot.elapsedMs + TICK_MS);

    // Far past the threshold, and the uptake ladder deliberately not climbed.
    expect(runtime.snapshot.meter.atpProduced).toBeGreaterThan(PFK1_PK_ATP_THRESHOLD);
    expect(runtime.snapshot.uptakeStep).toBeLessThan(UPTAKE_VMAX_STEPS.length - 1);
    expect(runtime.canBuyPfk1Pk()).toBe(false);
    expect(runtime.buyPfk1Pk()).toBe(false);
    expect(runtime.snapshot.pfk1PkBought).toBe(false);
  });

  it('raises both phases by the same factor, which is what keeps the cell alive', () => {
    /**
     * THE MECHANISM, AND IT IS THE ASSERTION THAT MATTERS MOST HERE.
     *
     * UPDATELOGV5.md measured that `payoff` Vmax must strictly exceed twice
     * `prep` Vmax and that every configuration at exactly twice died. PFK-1
     * raises the first and pyruvate kinase raises the second. Sold separately,
     * PFK-1 spends that margin: measured at rung 0, ATP per second went from
     * 42.2175 to 0.0000 with 3838 glucose piled up inside a corpse.
     *
     * One factor on both sides of a ratio cannot change the ratio, which is why
     * they are one purchase. If a later log gives the two enzymes different
     * factors, this fails rather than shipping a purchase that kills a cell.
     */
    const runtime = at(
      {
        name: 'probe',
        uptakeStep: UPTAKE_VMAX_STEPS.length - 1,
        enzymes: true,
        glycolysisStep: 0,
      },
      10,
    );
    const kinetics = (id: string): number => {
      const reaction = runtime.state.reactions.find((r) => r.id === id);
      if (reaction === undefined) throw new Error(`no reaction ${id}`);
      return reaction.kinetics.vmax;
    };
    const rung0 = GLYCOLYSIS_STEPS[0] as { prep: number; payoff: number };
    expect(kinetics('prep')).toBeCloseTo(rung0.prep * PFK1_PK_VMAX_FACTOR, 10);
    expect(kinetics('payoff')).toBeCloseTo(rung0.payoff * PFK1_PK_VMAX_FACTOR, 10);
    expect(kinetics('payoff')).toBeGreaterThan(2 * kinetics('prep'));
  });

  it('comes back from the worst state a run can reach, in every configuration', () => {
    /**
     * THE TRAP, RUN AGAINST EVERY CONFIGURATION. UPDATELOGV10.md stage 4 step 4.
     *
     * WHY THE PROBE IS A STARVED CELL RATHER THAN A HAND-SET ATP, and this is the
     * finding stage 4 said would be more important than the enzymes if it turned
     * up. `bootstrap.test.ts` starts a cell at an ATP of 0.05 and asserts it
     * climbs out, on the argument that 0.05 is below anything a run can reach.
     * That argument is measured at the SHIPPED DEFAULT Vmax and it does not
     * survive the capacity ladder:
     *
     *     rung   ATP floor when the food runs dry   climbs out from 0.20
     *        0                            0.6292    yes
     *        1                            0.5131    yes
     *        2                            0.3863    yes
     *        3                            0.3244    yes
     *        4                            0.2895    NO
     *
     * **The top of the glycolytic ladder already sat just above its own recovery
     * boundary before this log existed**, at a factor of 1 and with no enzyme in
     * the game. The enzyme purchase moves that boundary up by one rung and does
     * not create it. So the honest property is not "recovers from 0.05", it is
     * "recovers from the state starvation actually produces", and that is what
     * this asserts. Every configuration passes it, including the two that fail
     * the artificial probe.
     */
    for (const configuration of CONFIGURATIONS) {
      const runtime = at(configuration, 0);
      const state = runtime.state;
      const env = poolIndex('glucose_env');
      // Run the larder dry and keep going, which is the worst state act 1 can
      // put a cell in.
      state.pools.amounts[env] = 2000;
      for (let t = 0; t < 12000; t += 1) runtime.frame(runtime.snapshot.elapsedMs + TICK_MS);
      const floor = runtime.snapshot.amounts[poolIndex('atp')] as number;
      expect(floor, `fell past a recoverable ATP in: ${configuration.name}`).toBeGreaterThan(0.2);

      // Then feed it again. A cell that cannot restart is the trap.
      const before = runtime.snapshot.meter.atpProduced;
      state.pools.amounts[env] = 20000;
      for (let t = 0; t < 12000; t += 1) runtime.frame(runtime.snapshot.elapsedMs + TICK_MS);
      expect(
        runtime.snapshot.meter.atpProduced - before,
        `did not restart after refeeding in: ${configuration.name}`,
        // 10000 rather than a tight figure, because the slowest configuration
        // makes 18642 in ten game-minutes and the fastest makes far more. What
        // separates alive from dead here is three orders of magnitude: a cell in
        // the trap makes about 900 and then stops.
      ).toBeGreaterThan(10000);
    }
  });
});
