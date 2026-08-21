/**
 * Act 3's yield per glucose. UPDATELOGV14.md stage 4 step 4.
 *
 * ---------------------------------------------------------------------------
 * THE CLAIM THE WHOLE GAME IS BUILT TOWARD, AND IT IS COMPUTED RATHER THAN
 * WRITTEN DOWN
 * ---------------------------------------------------------------------------
 *
 * Act 1's ledger of 4 gross and 2 net has been asserted since V2 from the
 * reaction table rather than from a constant, and this does the same thing for
 * act 3. **Nothing below reads a number out of a file. Every figure is traced
 * through the stoichiometry in `reactions.ts`**, which is what makes the
 * headline claim checkable instead of asserted.
 *
 * ---------------------------------------------------------------------------
 * WHY A RANGE AND NOT A NUMBER
 * ---------------------------------------------------------------------------
 *
 * docs/SCIENCE.md Part 4 gives about 30 to 32 by modern accounting and about 29
 * to 32 across published estimates, and stage 1 decomposed that spread into five
 * independent causes. Two of them are in this model on purpose: the protons per
 * ATP are rounded to an integer because the kernel takes integer coefficients,
 * and the shuttle choice moves the total by two.
 *
 * **So the assertion is that act 3's yield lands inside the sourced range and
 * that the shuttle spread reproduces the sourced difference**, not that it
 * equals any single published figure. A test asserting 32 exactly would be
 * asserting one set of assumptions as fact, which is the thing the contested
 * beat in stage 6 exists to argue against.
 */

import { describe, expect, it } from 'vitest';
import { createAct3, type Act3ReactionId } from '../reactions';

/** docs/SCIENCE.md Part 4, "ATP yield: state the range". */
const SOURCED_MIN = 29;
const SOURCED_MAX = 32;
/** The spread the document attributes to shuttle choice alone. */
const SOURCED_SHUTTLE_SPREAD = 2;

/**
 * Trace one glucose through the table and return the ATP the cytosol ends up
 * with, plus the working.
 *
 * Read off `reactions.ts` at run time rather than restated here, so a change to
 * any coefficient moves this number and the test says so.
 */
function ledger(shuttle: 'malate-aspartate' | 'glycerol-phosphate') {
  const state = createAct3();
  const by = new Map(state.reactions.map((r) => [r.id as Act3ReactionId, r]));
  const idOf = (index: number): string => state.pools.ids[index] as string;

  /** Coefficient of a pool on one side of a reaction, or zero. */
  const coeff = (id: Act3ReactionId, side: 'substrates' | 'products', pool: string): number => {
    const reaction = by.get(id);
    if (reaction === undefined) throw new Error(`no reaction ${id}`);
    for (const term of reaction[side]) {
      if (idOf(term.poolIndex) === pool) return term.coefficient;
    }
    return 0;
  };

  // Glycolysis, per glucose. `prep` runs once and `payoff` runs once per g3p.
  const g3pPerGlucose = coeff('prep', 'products', 'g3p');
  const atpSpentInPrep = coeff('prep', 'substrates', 'atp');
  const atpMadeInPayoff = coeff('payoff', 'products', 'atp') * g3pPerGlucose;
  const cytosolicNadh = coeff('payoff', 'products', 'nadh') * g3pPerGlucose;
  const pyruvate = coeff('payoff', 'products', 'pyruvate') * g3pPerGlucose;

  // Into the matrix. One proton comes back in with each pyruvate.
  const transportProtons = coeff('pyruvate_transport', 'substrates', 'proton_ims') * pyruvate;

  // The link reaction and the cycle, per pyruvate and per acetyl-CoA.
  const acetylCoa = coeff('pdh', 'products', 'acetyl_coa_matrix') * pyruvate;
  const nadhFromPdh = coeff('pdh', 'products', 'nadh_matrix') * pyruvate;
  const nadhFromTca = coeff('tca', 'products', 'nadh_matrix') * acetylCoa;
  const fadh2FromTca = coeff('tca', 'products', 'fadh2_matrix') * acetylCoa;
  const atpFromTca = coeff('tca', 'products', 'atp_matrix') * acetylCoa;

  // What the chain moves per carrier, summed across the complexes each one
  // passes through. Complex I then III then IV for matrix NADH; III then IV for
  // anything entering at the quinone pool.
  const perComplex1 = coeff('complex_1', 'products', 'proton_ims');
  const perComplex3 = coeff('complex_3', 'products', 'proton_ims');
  const perComplex4 = coeff('complex_4', 'products', 'proton_ims');
  const protonsPerMatrixNadh = perComplex1 + perComplex3 + perComplex4;
  const protonsPerQuinonePair = perComplex3 + perComplex4;

  // The shuttle decides where the two cytosolic pairs enter.
  const matrixNadh =
    nadhFromPdh + nadhFromTca + (shuttle === 'malate-aspartate' ? cytosolicNadh : 0);
  const quinonePairs = fadh2FromTca + (shuttle === 'malate-aspartate' ? 0 : cytosolicNadh);

  const protonsPumped =
    matrixNadh * protonsPerMatrixNadh + quinonePairs * protonsPerQuinonePair;

  // Spending them. The synthase costs its own protons and every matrix ATP
  // costs one more to get out through the translocase.
  const protonsPerSynthaseTurn = coeff('atp_synthase', 'substrates', 'proton_ims');
  const protonsPerExport = coeff('ant', 'substrates', 'proton_ims');

  const budget = protonsPumped - transportProtons - atpFromTca * protonsPerExport;
  const synthaseAtp = budget / (protonsPerSynthaseTurn + protonsPerExport);

  const netGlycolysis = atpMadeInPayoff - atpSpentInPrep;
  const total = netGlycolysis + atpFromTca + synthaseAtp;

  return {
    total,
    netGlycolysis,
    atpFromTca,
    synthaseAtp,
    protonsPumped,
    matrixNadh,
    quinonePairs,
    protonsPerMatrixNadh,
    protonsPerQuinonePair,
    cytosolicNadh,
  };
}

describe("act 3's yield per glucose", () => {
  it('moves ten protons per matrix NADH and six per quinone pair, which is Part 4 exactly', () => {
    // The two figures every other number here rests on, read off the complexes
    // rather than restated. docs/SCIENCE.md Part 4, "The chain complex by
    // complex, and what each one pumps".
    const l = ledger('malate-aspartate');
    expect(l.protonsPerMatrixNadh).toBe(10);
    expect(l.protonsPerQuinonePair).toBe(6);
    // And the difference of exactly four is complex I's pump, which is the whole
    // reason the shuttle choice is a choice.
    expect(l.protonsPerMatrixNadh - l.protonsPerQuinonePair).toBe(4);
  });

  it('delivers ten matrix NADH and two FADH2 per glucose on the malate-aspartate route', () => {
    // The carrier counts are the part of the accounting nothing disputes.
    // docs/SCIENCE.md Part 4: 4 ATP direct, 10 NADH and 2 FADH2 per glucose.
    const l = ledger('malate-aspartate');
    expect(l.matrixNadh).toBe(10);
    expect(l.quinonePairs).toBe(2);
    expect(l.cytosolicNadh).toBe(2);
  });

  it('lands inside the sourced range on both shuttles', () => {
    const malate = ledger('malate-aspartate');
    const glycerol = ledger('glycerol-phosphate');

    console.log(
      `  act 3 yield per glucose:\n` +
        `    malate-aspartate    ${malate.total.toFixed(2)}  ` +
        `(glycolysis ${malate.netGlycolysis}, cycle ${malate.atpFromTca}, ` +
        `synthase ${malate.synthaseAtp.toFixed(2)}, ${malate.protonsPumped} protons)\n` +
        `    glycerol-phosphate  ${glycerol.total.toFixed(2)}  ` +
        `(glycolysis ${glycerol.netGlycolysis}, cycle ${glycerol.atpFromTca}, ` +
        `synthase ${glycerol.synthaseAtp.toFixed(2)}, ${glycerol.protonsPumped} protons)\n` +
        `    sourced range       ${SOURCED_MIN} to ${SOURCED_MAX}`,
    );

    expect(malate.total).toBeGreaterThanOrEqual(SOURCED_MIN);
    expect(malate.total).toBeLessThanOrEqual(SOURCED_MAX);
    expect(glycerol.total).toBeGreaterThanOrEqual(SOURCED_MIN);
    expect(glycerol.total).toBeLessThanOrEqual(SOURCED_MAX);
  });

  it('reproduces the sourced two-ATP shuttle spread, and the better route is the slower one', () => {
    // docs/SCIENCE.md Part 4: "The remaining 2 ATP of spread comes from shuttle
    // choice." That figure is not put into the model anywhere. It falls out of
    // two cytosolic pairs missing complex I's four protons each, divided by the
    // four protons an exported ATP costs.
    const malate = ledger('malate-aspartate');
    const glycerol = ledger('glycerol-phosphate');
    expect(malate.total - glycerol.total).toBeCloseTo(SOURCED_SHUTTLE_SPREAD, 9);
  });

  it('is roughly fifteen times act 1, which is the claim the act exists to make', () => {
    // Act 1's net is 2 per glucose and has been asserted since V2. docs/SCIENCE.md
    // Part 4, "The multiplier": fermentation gives 2 and aerobic respiration
    // gives roughly 30, which is about fifteen times.
    const malate = ledger('malate-aspartate');
    const multiplier = malate.total / 2;
    console.log(`  multiplier against act 1's net of 2: ${multiplier.toFixed(2)}x`);
    expect(multiplier).toBeGreaterThan(14);
    expect(multiplier).toBeLessThan(16.5);
  });

  it('breaks act 1s ledger deliberately rather than by accident', () => {
    // The one assertion that says out loud what this act does to the game's
    // oldest claim. Act 1's net of 2 has held across every configuration since
    // V2. Act 3 is not act 1 and must not be measured against it.
    const malate = ledger('malate-aspartate');
    expect(malate.netGlycolysis).toBe(2);
    expect(malate.total).not.toBe(2);
    // Glycolysis itself did not change. What changed is what happens after it.
    expect(malate.total - malate.netGlycolysis).toBeGreaterThan(25);
  });
});
