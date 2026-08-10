/**
 * How often the beast changes across a whole act, measured rather than assumed.
 *
 * A REPORT TEST, in the same family as `unlockPacing.report.test.ts`: it prints
 * what happened and asserts only the properties a tuning change must not move.
 * The transition count itself is printed rather than pinned, because a balance
 * pass is allowed to move it and a suite that fails on an intended change
 * teaches people to edit the expectation.
 *
 * ---------------------------------------------------------------------------
 * THE QUESTION THIS FILE EXISTS TO ANSWER IS WHETHER THE DEAD BAND IS NEEDED
 * ---------------------------------------------------------------------------
 *
 * A discrete state driven by a continuous quantity normally needs hysteresis. A
 * bare threshold on a quantity that wanders across it sets React state at
 * whatever rate it wanders, which is exactly the defect the discrete-state rule
 * exists to prevent, and DESIGN.md wrote the dead band into the beast's design
 * on 2026-08-09 on that reasoning.
 *
 * So it is measured against the alternative rather than argued about. Both
 * counts are printed: a bare threshold, and a band with the off level at half
 * the on level. If they agree, act 1 does not wander across this line and the
 * band is complexity with nothing behind it.
 */

import { describe, expect, it } from 'vitest';

import { ACT1 } from '../../content/acts';
import { setShortfallLogging } from '../../sim/tick';
import { createActRuntime, type ActRuntime } from '../runtime';
import { ZERO_FLUX_THRESHOLD } from '../tuning';

setShortfallLogging(false);

/** 70 game-minutes at 20Hz. Act 1's last purchase lands at about 54. */
const RUN_TICKS = 70 * 60 * 20;
/** One game-second, the cadence `playthrough.test.ts` argues for. */
const POLL_TICKS = 20;

function buyOne(runtime: ActRuntime): boolean {
  return (
    runtime.buyFerment() ||
    runtime.buyUptakeStep() ||
    runtime.buyGlycogen() ||
    runtime.buyEthanol() ||
    runtime.buyPfk1Pk() ||
    runtime.buyGlycolysisStep()
  );
}

interface Counts {
  /** Transitions of the reading the game actually ships. */
  readonly bare: number;
  /** Transitions the same run would have produced with a dead band. */
  readonly banded: number;
  readonly frames: number;
  readonly purchases: number;
  readonly sawSluggish: boolean;
  readonly sawLively: boolean;
}

function measure(): Counts {
  const runtime = createActRuntime(ACT1, {
    schedule: () => 0,
    cancel: () => {},
    persistence: { enabled: false },
  });

  const payoff = ACT1.reactionIndex('payoff');
  const on = ZERO_FLUX_THRESHOLD;
  const off = ZERO_FLUX_THRESHOLD / 2;

  let bare = 0;
  let banded = 0;
  let purchases = 0;
  let sawSluggish = false;
  let sawLively = false;

  let lastBare = runtime.snapshot.vitality;
  let bandedLively = false;

  for (let tick = 0; tick < RUN_TICKS; tick += 1) {
    runtime.frame(tick * 50);

    const shipped = runtime.snapshot.vitality;
    if (shipped !== lastBare) {
      bare += 1;
      lastBare = shipped;
    }
    if (shipped === 'lively') sawLively = true;
    if (shipped === 'sluggish') sawSluggish = true;

    // The counterfactual, computed from the same frame's applied flux.
    const flux = runtime.snapshot.appliedFlux[payoff] as number;
    const next: boolean = bandedLively ? flux >= off : flux >= on;
    if (next !== bandedLively) {
      banded += 1;
      bandedLively = next;
    }

    if (tick % POLL_TICKS === 0 && buyOne(runtime)) purchases += 1;
  }

  return { bare, banded, frames: RUN_TICKS, purchases, sawSluggish, sawLively };
}

describe('how often the beast changes across act 1', () => {
  const counts = measure();

  it('reports the counts, which is what this file is for', () => {
    console.log(`
  the beast across 70 game-minutes of act 1

    frames driven          ${counts.frames}
    purchases made         ${counts.purchases}
    state changes, bare    ${counts.bare}
    state changes, banded  ${counts.banded}   off level at half the on level
    reached lively         ${counts.sawLively}
    reached sluggish       ${counts.sawSluggish}
`);
    expect(counts.frames).toBe(RUN_TICKS);
  });

  it('changes a handful of times, not once per frame', () => {
    /**
     * THE PROPERTY, RATHER THAN THE NUMBER. React must not re-render at tick
     * rate. Twenty is three orders of magnitude below the frame count and far
     * above anything act 1 has been measured to produce, so a tuning change can
     * move the count without touching this and a regression cannot hide under
     * it.
     */
    expect(counts.bare).toBeLessThan(20);
    expect(counts.bare).toBeGreaterThan(0);
  });

  it('shows the dead band buys nothing here, which is why act 1 does not have one', () => {
    // If these ever disagree, act 1 has started wandering across the threshold
    // and `ACT1.vitality` should start reading its `previous` argument.
    expect(counts.banded).toBe(counts.bare);
  });

  it('reaches both readings, so the counts are not a flat line', () => {
    expect(counts.sawLively).toBe(true);
    expect(counts.sawSluggish).toBe(true);
  });
});
