import { describe, expect, it } from 'vitest';
import { PoolRegistry } from '../../../sim/pools';
import type { Reaction, StoichiometryTerm } from '../../../sim/reactions';
import { ACT1_CONSERVED_IDS, act1PoolDefinitions, type Act1PoolId } from '../pools';
import { ACT1_REACTION_IDS, createAct1 } from '../reactions';

/**
 * The test that makes this log trustworthy.
 *
 * Written as a property over the reaction list rather than as four hand-written
 * cases, because a hand-written case tests the reaction someone remembered to
 * write it for. A fifth reaction added in V2 stage 4, or a twelfth in some
 * later act, is covered by this the moment it exists.
 */

/**
 * The conserved weight of one pool, read back through the registry's own
 * public surface rather than through a second copy of the weight table.
 *
 * Zero every amount, put one unit in the pool of interest, and the total for a
 * quantity IS that pool's weight for it. This deliberately routes through
 * `totalConserved`, which is what the conservation property test asserts on, so
 * the two tests agree about what a weight means by construction.
 */
function weightOf(pools: PoolRegistry, poolIndex: number, quantity: string): number {
  pools.amounts.fill(0);
  pools.amounts[poolIndex] = 1;
  return pools.totalConserved(quantity);
}

/** Weighted sum of one side of a reaction, for one conserved quantity. */
function sideTotal(
  pools: PoolRegistry,
  side: readonly StoichiometryTerm[],
  quantity: string,
): number {
  let total = 0;
  for (const term of side) {
    total += term.coefficient * weightOf(pools, term.poolIndex, quantity);
  }
  return total;
}

/** Coefficient of a pool on one side of a reaction. Zero if it does not appear. */
function coefficientOf(
  pools: PoolRegistry,
  reaction: Reaction,
  side: 'substrates' | 'products',
  id: Act1PoolId,
): number {
  const poolIndex = pools.indexOf(id);
  let total = 0;
  for (const term of reaction[side]) {
    if (term.poolIndex === poolIndex) total += term.coefficient;
  }
  return total;
}

function byId(reactions: readonly Reaction[], id: string): Reaction {
  const found = reactions.find((r) => r.id === id);
  if (!found) throw new Error(`no reaction "${id}"`);
  return found;
}

describe('act 1 stoichiometry', () => {
  it('balances every conserved quantity across every reaction, exactly', () => {
    const state = createAct1();
    const pools = new PoolRegistry(act1PoolDefinitions());

    expect(state.reactions.map((r) => r.id)).toEqual([...ACT1_REACTION_IDS]);

    for (const reaction of state.reactions) {
      for (const quantity of ACT1_CONSERVED_IDS) {
        const substrates = sideTotal(pools, reaction.substrates, quantity);
        const products = sideTotal(pools, reaction.products, quantity);

        // toBe, not toBeCloseTo. These are small integers and a stoichiometric
        // coefficient is either right or it is a bug. A tolerance here would
        // let a genuinely unbalanced reaction through and leave the
        // conservation test in stage 5 to fail confusingly much later.
        expect(
          products,
          `${reaction.id} does not balance ${quantity}: ${substrates} in, ${products} out`,
        ).toBe(substrates);
      }
    }
  });

  it('prints the balance grid', () => {
    const pools = new PoolRegistry(act1PoolDefinitions());
    const state = createAct1();

    const header = ['reaction'.padEnd(10), ...ACT1_CONSERVED_IDS.map((q) => q.padStart(14))];
    const lines = [header.join('')];
    for (const reaction of state.reactions) {
      const cells = ACT1_CONSERVED_IDS.map((quantity) => {
        const inn = sideTotal(pools, reaction.substrates, quantity);
        const out = sideTotal(pools, reaction.products, quantity);
        return `${inn} -> ${out}`.padStart(14);
      });
      lines.push([reaction.id.padEnd(10), ...cells].join(''));
    }
    console.log(`\n${lines.join('\n')}\n`);

    expect(lines).toHaveLength(state.reactions.length + 1);
  });

  it('yields the sourced ledger for one glucose, computed from the reaction table', () => {
    /**
     * docs/SCIENCE.md Part 2, "Glycolysis":
     *
     *   "Payoff phase, steps 6 to 10. Each three-carbon fragment yields 2 ATP
     *    and 1 NADH. Two fragments per glucose, so 4 ATP and 2 NADH gross."
     *
     *   "Net per glucose: 2 ATP, 2 NADH, 2 pyruvate. The 2 ATP figure is net of
     *    the 2 ATP investment. This is worth surfacing in-game because the
     *    gross figure of 4 is a common point of confusion."
     *
     * Every number below is read out of the reaction table. None is written
     * down twice, so this asserts that the pathway as built produces the
     * sourced ledger rather than that the ledger equals itself.
     */
    const pools = new PoolRegistry(act1PoolDefinitions());
    const state = createAct1();
    const prep = byId(state.reactions, 'prep');
    const payoff = byId(state.reactions, 'payoff');

    // One glucose enters the preparatory phase.
    expect(coefficientOf(pools, prep, 'substrates', 'glucose')).toBe(1);

    // It leaves as trioses, and each triose is one turn of the payoff phase.
    const triosesPerGlucose = coefficientOf(pools, prep, 'products', 'g3p');
    const triosesPerPayoffTurn = coefficientOf(pools, payoff, 'substrates', 'g3p');
    const payoffTurns = triosesPerGlucose / triosesPerPayoffTurn;
    expect(payoffTurns).toBe(2);

    const atpSpent = coefficientOf(pools, prep, 'substrates', 'atp');
    const atpGross = coefficientOf(pools, payoff, 'products', 'atp') * payoffTurns;
    const atpNet = atpGross - atpSpent;
    const nadh = coefficientOf(pools, payoff, 'products', 'nadh') * payoffTurns;
    const pyruvate = coefficientOf(pools, payoff, 'products', 'pyruvate') * payoffTurns;

    expect(atpGross).toBe(4);
    expect(atpSpent).toBe(2);
    expect(atpNet).toBe(2);
    expect(nadh).toBe(2);
    expect(pyruvate).toBe(2);

    console.log(
      `\n  act 1 ledger per glucose: ${atpGross} ATP gross, ${atpSpent} spent, ` +
        `${atpNet} net, ${nadh} NADH, ${pyruvate} pyruvate\n`,
    );
  });

  it('consumes NAD+ in exactly one reaction and regenerates it in exactly one', () => {
    const pools = new PoolRegistry(act1PoolDefinitions());
    const state = createAct1();

    const nadConsumers = state.reactions.filter(
      (r) => coefficientOf(pools, r, 'substrates', 'nad') > 0,
    );
    expect(nadConsumers.map((r) => r.id)).toEqual(['payoff']);

    const nadProducers = state.reactions.filter(
      (r) => coefficientOf(pools, r, 'products', 'nad') > 0,
    );
    expect(nadProducers.map((r) => r.id)).toEqual(['ferment']);

    // And the only regenerator ships off, so the carrier is one-way by default
    // and the pathway has a hard ceiling until something turns it on.
    expect((nadProducers[0] as Reaction).enabled).toBe(false);
  });

  it('produces no ATP in the fermentation step, which is the act 1 misconception', () => {
    const pools = new PoolRegistry(act1PoolDefinitions());
    const state = createAct1();
    const ferment = byId(state.reactions, 'ferment');

    // docs/SCIENCE.md Part 2, "Fermentation". Asserted on the table rather than on a
    // simulation run, so no tuning value can change the answer.
    expect(coefficientOf(pools, ferment, 'products', 'atp')).toBe(0);
    expect(coefficientOf(pools, ferment, 'substrates', 'atp')).toBe(0);
    expect(coefficientOf(pools, ferment, 'products', 'nad')).toBe(1);
    expect(coefficientOf(pools, ferment, 'substrates', 'nadh')).toBe(1);
  });

  it('resolves every pool index through the registry, so no index is out of range', () => {
    const state = createAct1();
    const poolCount = state.pools.count;

    for (const reaction of state.reactions) {
      for (const term of [...reaction.substrates, ...reaction.products]) {
        expect(Number.isInteger(term.poolIndex)).toBe(true);
        expect(term.poolIndex).toBeGreaterThanOrEqual(0);
        expect(term.poolIndex).toBeLessThan(poolCount);
        expect(term.coefficient).toBeGreaterThan(0);
      }
    }
  });

  it('accepts overrides in the same shape createToyPathway does', () => {
    const state = createAct1({
      initial: { glucose_env: 1, nad: 3 },
      vmax: { uptake: 1 },
      km: { uptake: 7 },
      seed: 99,
    });

    expect(state.pools.get('glucose_env')).toBe(1);
    expect(state.pools.get('nad')).toBe(3);
    // Untouched pools keep their definition defaults.
    expect(state.pools.get('atp')).toBe(20);

    const uptake = state.reactions.find((r) => r.id === 'uptake') as Reaction;
    expect(uptake.kinetics).toEqual({ kind: 'michaelis-menten', vmax: 1, km: 7 });
  });
});
