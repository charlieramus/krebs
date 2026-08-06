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

    const header = ['reaction'.padEnd(16), ...ACT1_CONSERVED_IDS.map((q) => q.padStart(14))];
    const lines = [header.join('')];
    for (const reaction of state.reactions) {
      const cells = ACT1_CONSERVED_IDS.map((quantity) => {
        const inn = sideTotal(pools, reaction.substrates, quantity);
        const out = sideTotal(pools, reaction.products, quantity);
        return `${inn} -> ${out}`.padStart(14);
      });
      lines.push([reaction.id.padEnd(16), ...cells].join(''));
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

    // TWO REGENERATORS SINCE UPDATELOGV10.md STAGE 2, AND STILL ONE CONSUMER.
    // That asymmetry is the act: NAD+ is spent in exactly one place and the
    // player is offered two different ways to get it back, neither of which
    // yields anything.
    const nadProducers = state.reactions.filter(
      (r) => coefficientOf(pools, r, 'products', 'nad') > 0,
    );
    expect(nadProducers.map((r) => r.id)).toEqual(['ferment', 'ferment_ethanol']);

    // And EVERY regenerator ships off, so the carrier is one-way by default and
    // the pathway has a hard ceiling until something turns one of them on. A
    // second branch that shipped enabled would remove the wall entirely.
    for (const producer of nadProducers) {
      expect(producer.enabled).toBe(false);
    }
  });

  it('produces no ATP in either fermentation branch, which is the act 1 misconception', () => {
    const pools = new PoolRegistry(act1PoolDefinitions());
    const state = createAct1();

    // docs/SCIENCE.md Part 2, "Fermentation". Asserted on the table rather than
    // on a simulation run, so no tuning value can change the answer.
    //
    // BOTH BRANCHES, and the ethanol one is asserted on its own rather than by
    // family resemblance. docs/SCIENCE.md states the zero yield under that
    // branch's own heading for the same reason: a decarboxylation looks like it
    // ought to cost or release something, and it does neither.
    for (const id of ['ferment', 'ferment_ethanol'] as const) {
      const branch = byId(state.reactions, id);
      expect(coefficientOf(pools, branch, 'products', 'atp')).toBe(0);
      expect(coefficientOf(pools, branch, 'substrates', 'atp')).toBe(0);
      expect(coefficientOf(pools, branch, 'products', 'nad')).toBe(1);
      expect(coefficientOf(pools, branch, 'substrates', 'nadh')).toBe(1);
      expect(coefficientOf(pools, branch, 'substrates', 'pyruvate')).toBe(1);
    }
  });

  it('splits pyruvate two ways, and one carbon leaves without leaving the model', () => {
    // UPDATELOGV10.md stage 2. The claim the ethanol branch exists to make,
    // read off the reaction table rather than off a run.
    const pools = new PoolRegistry(act1PoolDefinitions());
    const state = createAct1();
    const lactate = byId(state.reactions, 'ferment');
    const ethanol = byId(state.reactions, 'ferment_ethanol');

    // The lactate branch keeps all three carbons in one molecule and releases
    // nothing at all.
    expect(coefficientOf(pools, lactate, 'products', 'lactate')).toBe(1);
    expect(coefficientOf(pools, lactate, 'products', 'co2')).toBe(0);

    // The ethanol branch keeps two and lets one go, which is the only thing
    // that distinguishes the two branches.
    expect(coefficientOf(pools, ethanol, 'products', 'ethanol')).toBe(1);
    expect(coefficientOf(pools, ethanol, 'products', 'co2')).toBe(1);

    // Read off the weight table rather than written down: 3 = 2 + 1.
    expect(sideTotal(pools, ethanol.substrates, 'carbon')).toBe(3);
    expect(sideTotal(pools, ethanol.products, 'carbon')).toBe(3);
  });

  it('fails on carbon, and only on carbon, if the CO2 is dropped', () => {
    /**
     * THE VIOLATION WRITTEN DELIBERATELY. UPDATELOGV10.md stage 2 step 2.
     *
     * A conservation test that has never seen the thing it exists to catch is a
     * test nobody has checked. V7 found two guards that agreed with themselves
     * and wrote the rule down: probe every guard by breaking the thing it
     * guards, not by reading it.
     *
     * The mutilation is the one a modeller would actually make. Carbon dioxide
     * is a gas, it leaves the cell, and the tempting shortcut is to let it leave
     * the model with it. That shortcut deletes matter, and this is the assertion
     * that says so out loud instead of a comment saying it would.
     */
    const pools = new PoolRegistry(act1PoolDefinitions());
    const state = createAct1();
    const ethanol = byId(state.reactions, 'ferment_ethanol');

    const co2Index = pools.indexOf('co2');
    const mutilated = ethanol.products.filter((term) => term.poolIndex !== co2Index);
    expect(mutilated.length).toBe(ethanol.products.length - 1);

    const broken: string[] = [];
    for (const quantity of ACT1_CONSERVED_IDS) {
      const substrates = sideTotal(pools, ethanol.substrates, quantity);
      const products = sideTotal(pools, mutilated, quantity);
      if (products !== substrates) broken.push(`${quantity}: ${substrates} in, ${products} out`);
    }

    // Exactly one quantity, and it is carbon. Redox, nicotinamide, phosphate
    // and adenylate all still close, which is what makes this a clean probe:
    // the failure is attributable rather than general.
    expect(broken).toEqual(['carbon: 3 in, 2 out']);

    // And the whole reaction balances the moment the term is put back, so the
    // probe measured the CO2 and not some other difference.
    const restored: string[] = [];
    for (const quantity of ACT1_CONSERVED_IDS) {
      const substrates = sideTotal(pools, ethanol.substrates, quantity);
      const products = sideTotal(pools, ethanol.products, quantity);
      if (products !== substrates) restored.push(quantity);
    }
    expect(restored).toEqual([]);
  });

  it('gives the same ledger down either branch, to nine decimal places', () => {
    /**
     * UPDATELOGV10.md stage 2 step 3. The claim act 1 exists to make, asserted
     * across the branch choice.
     *
     * Computed from the reaction table on both sides rather than compared to a
     * constant, so a coefficient change in one branch and not the other shows up
     * as two derivations disagreeing rather than as a number nobody updated.
     */
    const pools = new PoolRegistry(act1PoolDefinitions());
    const state = createAct1();
    const prep = byId(state.reactions, 'prep');
    const payoff = byId(state.reactions, 'payoff');

    const payoffTurns =
      coefficientOf(pools, prep, 'products', 'g3p') /
      coefficientOf(pools, payoff, 'substrates', 'g3p');

    const ledgerWith = (branchId: 'ferment' | 'ferment_ethanol') => {
      const branch = byId(state.reactions, branchId);
      // One branch turn per pyruvate, two per glucose, and neither turn touches
      // ATP on either side.
      const turns =
        (coefficientOf(pools, payoff, 'products', 'pyruvate') * payoffTurns) /
        coefficientOf(pools, branch, 'substrates', 'pyruvate');
      const gross =
        coefficientOf(pools, payoff, 'products', 'atp') * payoffTurns +
        coefficientOf(pools, branch, 'products', 'atp') * turns;
      const spent =
        coefficientOf(pools, prep, 'substrates', 'atp') +
        coefficientOf(pools, branch, 'substrates', 'atp') * turns;
      return { gross, net: gross - spent, turns };
    };

    const lactate = ledgerWith('ferment');
    const ethanol = ledgerWith('ferment_ethanol');

    expect(lactate.turns).toBe(2);
    expect(ethanol.turns).toBe(2);
    expect(lactate.gross.toFixed(9)).toBe('4.000000000');
    expect(lactate.net.toFixed(9)).toBe('2.000000000');
    expect(ethanol.gross.toFixed(9)).toBe('4.000000000');
    expect(ethanol.net.toFixed(9)).toBe('2.000000000');

    // Not merely both right to nine places. Identical as floats, which is the
    // stronger statement and the one that catches a branch yielding a millionth
    // of an ATP.
    expect(ethanol.gross).toBe(lactate.gross);
    expect(ethanol.net).toBe(lactate.net);
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
