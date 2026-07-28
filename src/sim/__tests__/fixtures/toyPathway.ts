/**
 * THIS IS NOT BIOLOGY. NOTHING HERE MAY BE CITED.
 *
 * A synthetic pathway for the property tests and the dev harness. The pools are
 * called A, B, C and so on and every number in this file is invented. It is
 * deliberately not glycolysis and it deliberately carries no laboratory values,
 * so no figure in it can reach player-facing text and CLAUDE.md hard rule 1 is
 * not in play. Act 1 content lands in V2 and comes from docs/SCIENCE.md.
 *
 * It IS structurally analogous to act 1, on purpose. There is a small fixed
 * carrier pool, X plus Y, that a forward reaction reduces and a recycling
 * reaction reoxidises, and that carrier is the ceiling on everything upstream.
 * That is the shape the offline steady-state work in a later log has to settle
 * against, so the fixture that guards the kernel should have it too.
 *
 *   r1:  A + 2 X + 2 P  ->  2 B + 2 Y     forward, reduces the carrier
 *   r2:  B              ->  C + G + P     forward, splits the carbon
 *   r3:  Y + C          ->  X + D         recycling, reoxidises the carrier
 *
 * Every reaction balances all three conserved quantities independently, which
 * is the property the conservation test exists to check:
 *
 *   r1   carbon  6 -> 6      phosphate  2 -> 2     redox  2 -> 2
 *   r2   carbon  3 -> 2 + 1  phosphate  1 -> 1     redox  0 -> 0
 *   r3   carbon  2 -> 2      phosphate  0 -> 0     redox  1 -> 1
 *
 * Carbon is carried at four different counts, 6, 3, 2 and 1, so a stoichiometric
 * coefficient dropped anywhere shows up as a carbon imbalance rather than
 * cancelling out.
 */

import { PoolRegistry, type PoolDefinition } from '../../pools';
import { createPrng } from '../../prng';
import { michaelisMenten, type Reaction } from '../../reactions';
import { createSimulation, type SimulationState } from '../../state';

export type ToyPoolId = 'A' | 'B' | 'C' | 'D' | 'G' | 'P' | 'X' | 'Y';
export type ToyReactionId = 'r1' | 'r2' | 'r3';

export const TOY_POOL_IDS: readonly ToyPoolId[] = ['A', 'B', 'C', 'D', 'G', 'P', 'X', 'Y'];
export const TOY_REACTION_IDS: readonly ToyReactionId[] = ['r1', 'r2', 'r3'];

/** Invented. Not measurements. */
export const TOY_INITIAL: Readonly<Record<ToyPoolId, number>> = {
  A: 4000,
  B: 0,
  C: 0,
  D: 0,
  G: 0,
  P: 400,
  X: 10,
  Y: 0,
};

/** Invented. Not measurements. */
export const TOY_VMAX: Readonly<Record<ToyReactionId, number>> = { r1: 20, r2: 60, r3: 40 };
export const TOY_KM: Readonly<Record<ToyReactionId, number>> = { r1: 5, r2: 4, r3: 2 };

const CONSERVED: Readonly<Record<ToyPoolId, Readonly<Record<string, number>>>> = {
  A: { carbon: 6, redox: 2 },
  B: { carbon: 3, phosphate: 1 },
  C: { carbon: 2 },
  D: { carbon: 2, redox: 1 },
  G: { carbon: 1 },
  P: { phosphate: 1 },
  X: {},
  Y: { redox: 1 },
};

const LABELS: Readonly<Record<ToyPoolId, string>> = {
  A: 'six carbon, carries two redox',
  B: 'three carbon, phosphorylated',
  C: 'two carbon',
  D: 'two carbon, reduced end product',
  G: 'one carbon',
  P: 'free phosphate',
  X: 'carrier, oxidised',
  Y: 'carrier, reduced',
};

export interface ToyPathwayOptions {
  initial: Readonly<Partial<Record<ToyPoolId, number>>>;
  vmax: Readonly<Partial<Record<ToyReactionId, number>>>;
  km: Readonly<Partial<Record<ToyReactionId, number>>>;
  seed: number;
}

export function createToyPathway(options: Partial<ToyPathwayOptions> = {}): SimulationState {
  const initial = options.initial ?? {};
  const vmax = options.vmax ?? {};
  const km = options.km ?? {};

  const definitions: readonly PoolDefinition[] = TOY_POOL_IDS.map((id) => ({
    id,
    label: LABELS[id],
    initial: initial[id] ?? TOY_INITIAL[id],
    conserved: CONSERVED[id],
  }));

  const pools = new PoolRegistry(definitions);
  const at = (id: ToyPoolId): number => pools.indexOf(id);
  const kinetics = (id: ToyReactionId) =>
    michaelisMenten(vmax[id] ?? TOY_VMAX[id], km[id] ?? TOY_KM[id]);

  const reactions: readonly Reaction[] = [
    {
      id: 'r1',
      substrates: [
        { poolIndex: at('A'), coefficient: 1 },
        { poolIndex: at('X'), coefficient: 2 },
        { poolIndex: at('P'), coefficient: 2 },
      ],
      products: [
        { poolIndex: at('B'), coefficient: 2 },
        { poolIndex: at('Y'), coefficient: 2 },
      ],
      kinetics: kinetics('r1'),
      enabled: true,
    },
    {
      id: 'r2',
      substrates: [{ poolIndex: at('B'), coefficient: 1 }],
      products: [
        { poolIndex: at('C'), coefficient: 1 },
        { poolIndex: at('G'), coefficient: 1 },
        { poolIndex: at('P'), coefficient: 1 },
      ],
      kinetics: kinetics('r2'),
      enabled: true,
    },
    {
      id: 'r3',
      substrates: [
        { poolIndex: at('Y'), coefficient: 1 },
        { poolIndex: at('C'), coefficient: 1 },
      ],
      products: [
        { poolIndex: at('X'), coefficient: 1 },
        { poolIndex: at('D'), coefficient: 1 },
      ],
      kinetics: kinetics('r3'),
      enabled: true,
    },
  ];

  return createSimulation(pools, reactions, createPrng(options.seed ?? 20260728));
}
