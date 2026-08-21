/**
 * Act 3 conservation, including protons. UPDATELOGV14.md stage 4 step 3.
 *
 * SAME TOLERANCE AS ACT 1 AND NO EXEMPTIONS. 1e-9 relative, per quantity, and
 * the argument for it is in `src/sim/__tests__/conservation.test.ts` and is not
 * repeated. Act 3 has ten conserved quantities against act 1's five and every
 * one of them is held to the same standard.
 *
 * THE FIRST TEST IS THE ONE THAT MATTERS MOST and it is a property over the
 * reaction table rather than a run: every reaction balances every quantity
 * exactly, in integers, computed from the pool weights. A run can hide an
 * imbalance behind a reaction that never fires. This cannot.
 */

import { describe, expect, it } from 'vitest';
import { PoolRegistry } from '../../../sim/pools';
import { createPrng } from '../../../sim/prng';
import { setShortfallLogging, tick } from '../../../sim/tick';
import { act1PoolDefinitions } from '../../act1/pools';
import { act3PoolDefinitions, ACT3_CONSERVED_IDS, ACT3_POOL_IDS } from '../pools';
import { createAct3, ACT3_REACTION_IDS, type Act3ReactionId } from '../reactions';

const TOLERANCE = 1e-9;

setShortfallLogging(false);

/** Weight of one unit of a pool in a named conserved quantity. */
function weights(): Readonly<Record<string, Readonly<Record<string, number>>>> {
  const out: Record<string, Record<string, number>> = {};
  for (const def of act3PoolDefinitions()) {
    out[def.id] = { ...def.conserved };
  }
  return out;
}

describe('act 3 reaction stoichiometry', () => {
  const table = weights();
  const state = createAct3({ enabled: allOn() });

  it('balances every conserved quantity exactly, in every reaction', () => {
    const failures: string[] = [];

    for (const reaction of state.reactions) {
      for (const quantity of ACT3_CONSERVED_IDS) {
        let left = 0;
        let right = 0;
        for (const term of reaction.substrates) {
          const id = state.pools.ids[term.poolIndex] as string;
          left += term.coefficient * ((table[id]?.[quantity] as number | undefined) ?? 0);
        }
        for (const term of reaction.products) {
          const id = state.pools.ids[term.poolIndex] as string;
          right += term.coefficient * ((table[id]?.[quantity] as number | undefined) ?? 0);
        }
        if (left !== right) {
          failures.push(`${reaction.id}: ${quantity} ${left} in, ${right} out`);
        }
      }
    }

    expect(failures).toEqual([]);
  });

  it('checks every reaction and every quantity, so the assertion is not vacuous', () => {
    expect(state.reactions.length).toBe(ACT3_REACTION_IDS.length);
    expect(state.pools.conservedIds).toEqual([...ACT3_CONSERVED_IDS]);
    expect(state.pools.count).toBe(ACT3_POOL_IDS.length);
  });

  it('carries protons through the chain and back, which is what makes the gradient real', () => {
    // The four reactions that move a proton across the membrane, checked as a
    // group. If any one of them leaked, the gradient would be a number that
    // grows rather than a difference across a fixed total.
    const crossings: Act3ReactionId[] = [
      'pyruvate_transport',
      'complex_1',
      'complex_3',
      'complex_4',
      'atp_synthase',
      'ant',
    ];
    for (const id of crossings) {
      const reaction = state.reactions.find((r) => r.id === id);
      expect(reaction, `${id} exists`).toBeDefined();
      if (reaction === undefined) continue;

      let inward = 0;
      for (const term of reaction.substrates) {
        const pool = state.pools.ids[term.poolIndex] as string;
        inward += term.coefficient * ((table[pool]?.['proton'] as number | undefined) ?? 0);
      }
      let outward = 0;
      for (const term of reaction.products) {
        const pool = state.pools.ids[term.poolIndex] as string;
        outward += term.coefficient * ((table[pool]?.['proton'] as number | undefined) ?? 0);
      }
      expect(inward, `${id} moves protons rather than making them`).toBe(outward);
      expect(inward, `${id} actually touches a proton`).toBeGreaterThan(0);
    }
  });

  it('agrees with act 1 on every pool id the two acts share', () => {
    /*
     * A pool id is permanent contract surface and its conserved weights are a
     * property of the pool rather than of the act reading it. `poolCards.ts`
     * says so in bold and claims a test enforces it. **It did not.** Stage 4
     * found the claim and this is the assertion it named.
     */
    const act1 = new Map(act1PoolDefinitions().map((d) => [d.id, d.conserved]));
    const disagreements: string[] = [];

    for (const def of act3PoolDefinitions()) {
      const other = act1.get(def.id);
      if (other === undefined) continue;
      const keys = new Set([...Object.keys(def.conserved), ...Object.keys(other)]);
      for (const key of keys) {
        const mine = def.conserved[key] ?? 0;
        const theirs = (other as Record<string, number>)[key] ?? 0;
        if (mine !== theirs) {
          disagreements.push(`${def.id}.${key}: act 1 says ${theirs}, act 3 says ${mine}`);
        }
      }
    }

    expect(disagreements).toEqual([]);
    // And it reached something: eleven ids are shared.
    const shared = act3PoolDefinitions().filter((d) => act1.has(d.id));
    expect(shared.length).toBeGreaterThanOrEqual(10);
  });
});

describe('act 3 conservation over long runs', () => {
  it('holds across 60 randomized configurations with everything enabled', () => {
    const rng = createPrng(20260820);
    let worst = 0;
    const byQuantity: Record<string, number> = {};

    for (let run = 0; run < 60; run += 1) {
      const initial: Record<string, number> = {};
      for (const id of ACT3_POOL_IDS) {
        initial[id] = rng.next() < 0.2 ? 0 : rng.next() * 400;
      }
      // Every carrier needs something on one side or nothing turns over.
      initial['proton_matrix'] = 50 + rng.next() * 400;
      initial['nad_matrix'] = 5 + rng.next() * 60;
      initial['coa_matrix'] = 5 + rng.next() * 40;
      initial['q_membrane'] = 5 + rng.next() * 40;
      initial['cytc_ox_ims'] = 5 + rng.next() * 40;
      initial['fad_matrix'] = 5 + rng.next() * 40;

      const state = createAct3({ initial, enabled: allOn(), seed: run });
      const starts = state.pools.conservedIds.map((q) => state.pools.totalConserved(q));

      for (let t = 0; t < 600; t += 1) tick(state);

      for (let q = 0; q < state.pools.conservedIds.length; q += 1) {
        const quantity = state.pools.conservedIds[q] as string;
        const start = starts[q] as number;
        const end = state.pools.totalConserved(quantity);
        const drift = start === 0 ? Math.abs(end) : Math.abs(end - start) / Math.abs(start);
        byQuantity[quantity] = Math.max(byQuantity[quantity] ?? 0, drift);
        if (drift > worst) worst = drift;
        expect(drift, `run ${run}, ${quantity}`).toBeLessThan(TOLERANCE);
      }
    }

    const lines = Object.keys(byQuantity)
      .sort()
      .map((q) => `    ${q.padEnd(13)}${(byQuantity[q] as number).toExponential(3)}`);
    console.log(`  act 3 worst drift per quantity over 60 runs:\n${lines.join('\n')}`);
    console.log(`  worst overall: ${worst.toExponential(3)}`);
    expect(worst).toBeLessThan(TOLERANCE);
  });

  it('never lets a pool go negative, including the two proton pools', () => {
    const rng = createPrng(77);
    for (let run = 0; run < 20; run += 1) {
      const state = createAct3({
        initial: { proton_matrix: 1 + rng.next() * 20, proton_ims: rng.next() * 20 },
        enabled: allOn(),
        seed: run,
      });
      for (let t = 0; t < 400; t += 1) {
        tick(state);
        for (let i = 0; i < state.pools.count; i += 1) {
          expect(state.pools.amounts[i]).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it('keeps the proton total fixed, which is what a gradient is', () => {
    const state = createAct3({ enabled: allOn() });
    const total = state.pools.totalConserved('proton');
    for (let t = 0; t < 2000; t += 1) tick(state);

    expect(state.pools.totalConserved('proton')).toBeCloseTo(total, 6);
    // And it genuinely moved, so this is not passing by standing still.
    expect(state.pools.get('proton_ims')).toBeGreaterThan(0);
  });
});

function allOn(): Readonly<Record<Act3ReactionId, boolean>> {
  const out: Record<string, boolean> = {};
  for (const id of ACT3_REACTION_IDS) out[id] = true;
  return out as Record<Act3ReactionId, boolean>;
}

/** The registry builds without throwing, which a negative weight would prevent. */
describe('act 3 pool registry', () => {
  it('constructs, which is the check that no weight is negative', () => {
    expect(() => new PoolRegistry(act3PoolDefinitions())).not.toThrow();
  });
});
