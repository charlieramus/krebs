/**
 * The chemiosmosis beat, measured. UPDATELOGV14.md stage 4 step 2.
 *
 * ---------------------------------------------------------------------------
 * THE LEAST INTUITIVE IDEA IN THE GAME, AS A SEQUENCE OF TWO PURCHASES
 * ---------------------------------------------------------------------------
 *
 * docs/PROGRESSION.md act 3: "Electron transport does not make ATP. It pumps
 * protons. The gradient makes ATP. This is the single least intuitive idea in
 * the whole game and the mechanics should force the player to build the gradient
 * before they can spend it, so the two-step structure is felt rather than read."
 *
 * So the assertion is a sequence rather than a state:
 *
 *     buy the chain      protons climb and cytosolic ATP does not move
 *     buy the synthase   the pile converts
 *
 * **A player who owns complexes I to IV and not ATP synthase is the point rather
 * than an unbalanced configuration to be avoided.** This file measures that it
 * actually happens, because "the mechanics force it" is a claim about numbers.
 *
 * IF THE PILE-UP IS NOT VISIBLE THE BEAT DOES NOT EXIST. The stage says so
 * directly: a player who cannot see protons accumulating has watched a number
 * change later rather than watched a thing build. So the size of the rise is
 * asserted and not only its sign.
 */

import { describe, expect, it } from 'vitest';
import { setShortfallLogging, tick } from '../../../sim/tick';
import { createAct3, type Act3ReactionId } from '../reactions';
import { ACT3_PROTON_IMS_INITIAL, ACT3_PROTON_TOTAL } from '../tuning';

setShortfallLogging(false);

/** Everything the player owns at a given point in the act 3 sequence. */
function owning(...bought: Act3ReactionId[]): Readonly<Record<string, boolean>> {
  const on: Record<string, boolean> = {};
  for (const id of bought) on[id] = true;
  return on;
}

/** The pathway up to and including the cycle. Nothing in the chain yet. */
const UP_TO_THE_CYCLE: Act3ReactionId[] = [
  'pyruvate_transport',
  'pdh',
  'tca',
  'pi_transport',
  'shuttle_malate_aspartate',
];

/** The four complexes. Still no synthase and no translocase. */
const THE_CHAIN: Act3ReactionId[] = ['complex_1', 'complex_2', 'complex_3', 'complex_4'];

interface Reading {
  readonly protonsOutside: number;
  readonly cytosolicAtp: number;
  readonly matrixAtp: number;
}

function run(bought: Act3ReactionId[], ticks: number): Reading {
  const state = createAct3({ enabled: owning(...bought) });
  for (let t = 0; t < ticks; t += 1) tick(state);
  return {
    protonsOutside: state.pools.get('proton_ims'),
    cytosolicAtp: state.pools.get('atp'),
    matrixAtp: state.pools.get('atp_matrix'),
  };
}

describe('the chemiosmosis beat', () => {
  const TICKS = 4000;

  it('buys the chain and the protons pile up while no ATP comes out', () => {
    const before = run(UP_TO_THE_CYCLE, TICKS);
    const after = run([...UP_TO_THE_CYCLE, ...THE_CHAIN], TICKS);

    console.log(
      `  after ${TICKS} ticks:\n` +
        `    cycle only        protons outside ${before.protonsOutside.toFixed(2)}, ` +
        `matrix ATP ${before.matrixAtp.toFixed(2)}\n` +
        `    cycle plus chain  protons outside ${after.protonsOutside.toFixed(2)}, ` +
        `matrix ATP ${after.matrixAtp.toFixed(2)}`,
    );

    // THE PILE. Buying the chain moves the gradient and nothing else.
    expect(after.protonsOutside).toBeGreaterThan(before.protonsOutside);

    // AND IT IS VISIBLE RATHER THAN TECHNICAL. A rise of a few percent is a
    // number changing; this has to be a thing the player watches build. The
    // gradient ends up holding a large fraction of every proton in the cell.
    expect(after.protonsOutside).toBeGreaterThan(ACT3_PROTON_TOTAL * 0.5);
    expect(after.protonsOutside / ACT3_PROTON_IMS_INITIAL).toBeGreaterThan(5);

    /*
     * AND NO ATP CAME OUT OF IT, measured where the player looks.
     *
     * Cytosolic ATP is what the top bar shows and what everything is bought
     * with, and nothing in the table moves matrix ATP into the cytosol except
     * the translocase, which is not owned. So the cell sees the gradient climb
     * and gets nothing.
     */
    expect(after.cytosolicAtp).toBeCloseTo(before.cytosolicAtp, 6);

    /*
     * MATRIX ATP DOES RISE, AND THE ASSERTION THAT IT WOULD NOT WAS WRONG.
     *
     * Measured at 27.11 without the chain and 34.96 with it. That is not the
     * chain making ATP, which it cannot: no reaction in the chain has ATP on
     * either side. **It is the chain regenerating NAD+ so the cycle can keep
     * turning**, and the extra ATP is the cycle's own substrate-level
     * phosphorylation at succinyl-CoA synthetase, running more often.
     *
     * Worth asserting rather than tidying away, because it is the misconception
     * the beat exists to correct, seen from the other side: buying electron
     * transport really does make more ATP appear, and not by making any.
     */
    expect(after.matrixAtp).toBeGreaterThan(before.matrixAtp);
  });

  it('buys the synthase and the pile converts', () => {
    const chainOnly = run([...UP_TO_THE_CYCLE, ...THE_CHAIN], TICKS);
    const withSynthase = run(
      [...UP_TO_THE_CYCLE, ...THE_CHAIN, 'atp_synthase', 'ant'],
      TICKS,
    );

    console.log(
      `    plus the synthase protons outside ${withSynthase.protonsOutside.toFixed(2)}, ` +
        `cytosolic ATP ${withSynthase.cytosolicAtp.toFixed(2)} ` +
        `against ${chainOnly.cytosolicAtp.toFixed(2)}`,
    );

    // The gradient is being spent, so it stands lower than when nothing spent it.
    expect(withSynthase.protonsOutside).toBeLessThan(chainOnly.protonsOutside);
    // And the cell is getting ATP it could not get before.
    expect(withSynthase.cytosolicAtp).toBeGreaterThan(chainOnly.cytosolicAtp);
  });

  it('makes the order matter, which is the whole teaching claim', () => {
    // The synthase without the chain is the other half of the sequence and it
    // has to be the weaker configuration, or the beat is decorative: a player
    // who bought them in either order would get the same thing.
    const synthaseFirst = run([...UP_TO_THE_CYCLE, 'atp_synthase', 'ant'], TICKS);
    const both = run([...UP_TO_THE_CYCLE, ...THE_CHAIN, 'atp_synthase', 'ant'], TICKS);

    console.log(
      `    synthase without the chain: cytosolic ATP ${synthaseFirst.cytosolicAtp.toFixed(2)}, ` +
        `against ${both.cytosolicAtp.toFixed(2)} with both`,
    );

    expect(both.cytosolicAtp).toBeGreaterThan(synthaseFirst.cytosolicAtp);
  });

  it('never makes a proton, which is what stops the gradient being magic', () => {
    // The gradient is a difference across a fixed total rather than a resource
    // that appears. Asserted here as well as in conservation.test.ts because
    // this is the file about the gradient and the claim belongs where it is
    // read.
    const state = createAct3({ enabled: owning(...UP_TO_THE_CYCLE, ...THE_CHAIN) });
    const total = state.pools.totalConserved('proton');
    for (let t = 0; t < TICKS; t += 1) tick(state);

    expect(state.pools.totalConserved('proton')).toBeCloseTo(total, 6);
    expect(
      state.pools.get('proton_ims') + state.pools.get('proton_matrix'),
    ).toBeLessThanOrEqual(ACT3_PROTON_TOTAL + 1e-6);
  });
});
