/**
 * THIS IS NOT BIOLOGY. NOTHING HERE MAY BE CITED.
 *
 * A synthetic two-compartment pathway for the transport conservation tests.
 * The pools are called S, H and W and every number in this file is invented, in
 * exactly the spirit of `toyPathway.ts` beside it: it is deliberately not the
 * mitochondrion and it carries no laboratory values, so no figure in it can
 * reach player-facing text and CLAUDE.md hard rule 1 is not in play.
 *
 * IT EXISTS BECAUSE OF UPDATELOGV14.md STAGE 2, which settles that a compartment
 * is nothing at all to the kernel: `pools.ts` stays a flat Float64Array, `tick.ts`
 * keeps iterating by index, and a compartment is a convention in pool ids plus
 * transport reactions that move matter across a boundary. That decision is only
 * worth taking if conservation survives it, so this fixture is the thing the
 * property test needs and act 3 is four stages away.
 *
 * The shape, which is act 3's shape with the chemistry removed:
 *
 *   t_import:  S_out + H_out  ->  S_in + H_in    symport. Substrate crosses
 *                                                WITH a carrier, the way the
 *                                                real pyruvate carrier does
 *   t_pump:    H_in           ->  H_out          a pump. A carrier crossing a
 *                                                membrane is a reaction and
 *                                                not a special case
 *   r_use:     S_in           ->  W_in           work done inside, so that
 *                                                transport keeps having a
 *                                                reason to run
 *
 * TWO CONSERVED QUANTITIES AND EACH ONE CATCHES A DIFFERENT MISTAKE.
 *
 *   carbon  S_out 3, S_in 3, W_in 3, H both 0
 *   proton  H_out 1, H_in 1, everything else 0
 *
 * `carbon` is carried at the same weight on both sides of the boundary, which is
 * the whole claim a compartment makes: **the same molecule in a different place
 * is the same molecule.** `proton` exists only on the two carrier pools, so the
 * gradient this fixture builds, H_in against H_out, is a difference across a
 * fixed total rather than an amount that appears from anywhere.
 *
 * The two planted violations below are not decoration. A conservation test that
 * has never seen the violation it exists to catch has not been checked, and both
 * of these are mistakes the flat model actively invites, because two pools that
 * are the same substance in two places look like two unrelated array slots.
 */

import { PoolRegistry, type PoolDefinition } from '../../pools';
import { createPrng } from '../../prng';
import { michaelisMenten, type Reaction } from '../../reactions';
import { createSimulation, type SimulationState } from '../../state';

export type ToyCompartmentPoolId = 'S_out' | 'S_in' | 'H_out' | 'H_in' | 'W_in';
export type ToyCompartmentReactionId = 't_import' | 't_pump' | 'r_use';

export const TOY_COMPARTMENT_POOL_IDS: readonly ToyCompartmentPoolId[] = [
  'S_out',
  'S_in',
  'H_out',
  'H_in',
  'W_in',
];

export const TOY_COMPARTMENT_REACTION_IDS: readonly ToyCompartmentReactionId[] = [
  't_import',
  't_pump',
  'r_use',
];

/** Invented. Not measurements. */
export const TOY_COMPARTMENT_INITIAL: Readonly<Record<ToyCompartmentPoolId, number>> = {
  S_out: 3000,
  S_in: 0,
  H_out: 0,
  H_in: 60,
  W_in: 0,
};

/** Invented. Not measurements. */
export const TOY_COMPARTMENT_VMAX: Readonly<Record<ToyCompartmentReactionId, number>> = {
  t_import: 14,
  t_pump: 30,
  r_use: 22,
};

export const TOY_COMPARTMENT_KM: Readonly<Record<ToyCompartmentReactionId, number>> = {
  t_import: 6,
  t_pump: 3,
  r_use: 4,
};

/**
 * The two sides of the boundary carry identical weights, and that identity is
 * the point rather than a convenience. docs/SAVE_SCHEMA.md Part 3's location
 * convention says a suffix names where a pool is and nothing else, so two ids
 * differing only by suffix are one substance and must agree here.
 */
const CONSERVED: Readonly<Record<ToyCompartmentPoolId, Readonly<Record<string, number>>>> = {
  S_out: { carbon: 3 },
  S_in: { carbon: 3 },
  H_out: { proton: 1 },
  H_in: { proton: 1 },
  W_in: { carbon: 3 },
};

const LABELS: Readonly<Record<ToyCompartmentPoolId, string>> = {
  S_out: 'three carbon substrate, outside',
  S_in: 'three carbon substrate, inside',
  H_out: 'carrier, outside',
  H_in: 'carrier, inside',
  W_in: 'three carbon product, inside',
};

/**
 * The deliberate mistakes, each named for what it actually is rather than for
 * which pool it touches.
 *
 * `pump-forgets-the-far-side` is the mistake the flat array invites most
 * directly: the reaction decrements the near pool and never increments the far
 * one, because in a Float64Array those are two unrelated indices and nothing
 * about the shape of the data says they are two ends of one crossing.
 *
 * `twin-weights-disagree` is the mistake the LOCATION CONVENTION invites, which
 * is a cost of the convention and is recorded as one. Two ids for one substance
 * can drift apart in their conserved weights, and if they do then every crossing
 * silently manufactures or destroys matter while every reaction still looks
 * balanced when read on its own.
 */
export type ToyCompartmentLeak = 'pump-forgets-the-far-side' | 'twin-weights-disagree';

export interface ToyCompartmentOptions {
  initial: Readonly<Partial<Record<ToyCompartmentPoolId, number>>>;
  vmax: Readonly<Partial<Record<ToyCompartmentReactionId, number>>>;
  km: Readonly<Partial<Record<ToyCompartmentReactionId, number>>>;
  seed: number;
  /** Omitted for the honest pathway. Named to plant one specific violation. */
  leak: ToyCompartmentLeak;
}

export function createToyCompartment(
  options: Partial<ToyCompartmentOptions> = {},
): SimulationState {
  const initial = options.initial ?? {};
  const vmax = options.vmax ?? {};
  const km = options.km ?? {};
  const leak = options.leak;

  const definitions: readonly PoolDefinition[] = TOY_COMPARTMENT_POOL_IDS.map((id) => ({
    id,
    label: LABELS[id],
    initial: initial[id] ?? TOY_COMPARTMENT_INITIAL[id],
    conserved:
      leak === 'twin-weights-disagree' && id === 'S_in'
        ? // One carbon lost on every crossing, and NOT because any reaction is
          // unbalanced. Every reaction below still reads 1 in and 1 out.
          { carbon: 2 }
        : CONSERVED[id],
  }));

  const pools = new PoolRegistry(definitions);
  const at = (id: ToyCompartmentPoolId): number => pools.indexOf(id);
  const kinetics = (id: ToyCompartmentReactionId) =>
    michaelisMenten(
      vmax[id] ?? TOY_COMPARTMENT_VMAX[id],
      km[id] ?? TOY_COMPARTMENT_KM[id],
    );

  const reactions: readonly Reaction[] = [
    {
      id: 't_import',
      substrates: [
        { poolIndex: at('S_out'), coefficient: 1 },
        { poolIndex: at('H_out'), coefficient: 1 },
      ],
      products: [
        { poolIndex: at('S_in'), coefficient: 1 },
        { poolIndex: at('H_in'), coefficient: 1 },
      ],
      kinetics: kinetics('t_import'),
      enabled: true,
    },
    {
      id: 't_pump',
      substrates: [{ poolIndex: at('H_in'), coefficient: 1 }],
      products:
        leak === 'pump-forgets-the-far-side'
          ? // The far side of the crossing, simply not written.
            []
          : [{ poolIndex: at('H_out'), coefficient: 1 }],
      kinetics: kinetics('t_pump'),
      enabled: true,
    },
    {
      id: 'r_use',
      substrates: [{ poolIndex: at('S_in'), coefficient: 1 }],
      products: [{ poolIndex: at('W_in'), coefficient: 1 }],
      kinetics: kinetics('r_use'),
      enabled: true,
    },
  ];

  return createSimulation(pools, reactions, createPrng(options.seed ?? 20260820));
}
