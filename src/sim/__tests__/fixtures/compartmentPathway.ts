/**
 * THIS IS NOT BIOLOGY. NOTHING HERE MAY BE CITED.
 *
 * A synthetic two-compartment pathway for the transport conservation tests. The
 * pools are called S, H, M and W, every number is invented, and no figure in it
 * can reach player-facing text. Act 3 content lands in V14 stages 4 and 5 and
 * comes from docs/SCIENCE.md.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS IS A SECOND FIXTURE AND NOT AN EDIT TO toyPathway.ts
 * ---------------------------------------------------------------------------
 *
 * `createToyPathway` produces the canonical determinism hash `172f83fb`, frozen
 * since V1, asserted in `determinism.test.ts`, measured across four engines by
 * V9 and re-measured at 200000 ticks. Adding a pool to it changes the canonical
 * state form and moves that hash, which is a change to the thing the whole suite
 * is calibrated against in order to test something the toy pathway does not have.
 * A second fixture costs one file and moves nothing.
 *
 * ---------------------------------------------------------------------------
 * THE SHAPE, WHICH IS ACT 3'S AND NOT ACT 1'S
 * ---------------------------------------------------------------------------
 *
 * Two compartments, `out` and `in`, and a carrier-like quantity that is pumped
 * across, spent to bring something else across, and finally locked away in a
 * product. That is the structure of the electron transport chain against ATP
 * synthase against the mitochondrial pyruvate carrier, with the biology removed.
 *
 *   pump      H_in            ->  H_out            builds the gradient
 *   symport   S_out + H_out   ->  S_in + H_in      spends it to import S
 *   convert   S_in            ->  M_in             does something with S
 *   sink      2 H_in          ->  W_in             locks two H away in a product
 *
 * Two conserved quantities:
 *
 *   stuff    S_out 1   S_in 1   M_in 1
 *   charge   H_out 1   H_in 1   W_in 2
 *
 * `charge` is the one that matters and it is the whole point of the fixture.
 * **A unit of charge in `out` and a unit in `in` are the same unit in a
 * different place**, so `pump` and `symport` move it and neither creates nor
 * destroys it. `sink` is the analogue of complex IV making water: two free units
 * leave the two compartment pools and reappear inside a product that carries
 * them at a weight of 2. Without `W_in` the total would fall on the first tick,
 * which is exactly the reason V10 gave carbon dioxide a pool.
 *
 * `stuff` is along for the ride and exists so that a leak in the charge
 * accounting cannot be masked by a second quantity that happens to balance.
 *
 * ---------------------------------------------------------------------------
 * THE LEAKS
 * ---------------------------------------------------------------------------
 *
 * A conservation test that has never seen the violation it exists to catch has
 * not been checked, so this fixture can be built broken on purpose. Three shapes,
 * because they are three different mistakes a person actually makes:
 *
 *   'pump'      transport that destroys on crossing. 1 in, 0.9 out
 *   'symport'   transport that forgets to put the carried unit down. The H
 *               enters the reaction and is simply not among the products
 *   'sink'      a product weight that does not match what went in. 1 H into a
 *               W_in that carries 2, so charge is manufactured
 *
 * None of them is exotic. The first is a dropped coefficient, the second is a
 * missing product term, and the third is a conserved weight guessed rather than
 * derived, which is the failure `src/content/act1/pools.ts` warns about by name.
 */

import { PoolRegistry, type PoolDefinition } from '../../pools';
import { createPrng } from '../../prng';
import { michaelisMenten, type Reaction } from '../../reactions';
import { createSimulation, type SimulationState } from '../../state';

export type CompartmentPoolId = 'S_out' | 'S_in' | 'H_out' | 'H_in' | 'M_in' | 'W_in';
export type CompartmentReactionId = 'pump' | 'symport' | 'convert' | 'sink';

/** Which reaction is built wrong, or 'none' for the correct pathway. */
export type CompartmentLeak = 'none' | 'pump' | 'symport' | 'sink';

export const COMPARTMENT_POOL_IDS: readonly CompartmentPoolId[] = [
  'S_out',
  'S_in',
  'H_out',
  'H_in',
  'M_in',
  'W_in',
];

export const COMPARTMENT_REACTION_IDS: readonly CompartmentReactionId[] = [
  'pump',
  'symport',
  'convert',
  'sink',
];

/** Invented. Not measurements. */
export const COMPARTMENT_INITIAL: Readonly<Record<CompartmentPoolId, number>> = {
  S_out: 3000,
  S_in: 0,
  H_out: 0,
  H_in: 200,
  M_in: 0,
  W_in: 0,
};

/** Invented. Not measurements. */
export const COMPARTMENT_VMAX: Readonly<Record<CompartmentReactionId, number>> = {
  pump: 30,
  symport: 20,
  convert: 12,
  sink: 4,
};

export const COMPARTMENT_KM: Readonly<Record<CompartmentReactionId, number>> = {
  pump: 8,
  symport: 6,
  convert: 5,
  sink: 10,
};

/**
 * The weight table. `charge` is carried by both compartment pools at the same
 * weight, which is the modeling claim: location is not a property the conserved
 * quantity can see.
 */
const CONSERVED: Readonly<Record<CompartmentPoolId, Readonly<Record<string, number>>>> = {
  S_out: { stuff: 1 },
  S_in: { stuff: 1 },
  H_out: { charge: 1 },
  H_in: { charge: 1 },
  M_in: { stuff: 1 },
  W_in: { charge: 2 },
};

const LABELS: Readonly<Record<CompartmentPoolId, string>> = {
  S_out: 'substrate, outside',
  S_in: 'substrate, inside',
  H_out: 'carrier, outside. The high side of the gradient',
  H_in: 'carrier, inside. The low side of the gradient',
  M_in: 'product, inside',
  W_in: 'sink product, inside. Holds two carrier units',
};

export interface CompartmentPathwayOptions {
  initial: Readonly<Partial<Record<CompartmentPoolId, number>>>;
  vmax: Readonly<Partial<Record<CompartmentReactionId, number>>>;
  km: Readonly<Partial<Record<CompartmentReactionId, number>>>;
  seed: number;
  /** Build one reaction wrong on purpose. See the header. */
  leak: CompartmentLeak;
}

export function createCompartmentPathway(
  options: Partial<CompartmentPathwayOptions> = {},
): SimulationState {
  const initial = options.initial ?? {};
  const vmax = options.vmax ?? {};
  const km = options.km ?? {};
  const leak = options.leak ?? 'none';

  const definitions: readonly PoolDefinition[] = COMPARTMENT_POOL_IDS.map((id) => ({
    id,
    label: LABELS[id],
    initial: initial[id] ?? COMPARTMENT_INITIAL[id],
    conserved: CONSERVED[id],
  }));

  const pools = new PoolRegistry(definitions);
  const at = (id: CompartmentPoolId): number => pools.indexOf(id);
  const kinetics = (id: CompartmentReactionId) =>
    michaelisMenten(vmax[id] ?? COMPARTMENT_VMAX[id], km[id] ?? COMPARTMENT_KM[id]);

  const reactions: readonly Reaction[] = [
    {
      id: 'pump',
      substrates: [{ poolIndex: at('H_in'), coefficient: 1 }],
      // A dropped coefficient. The unit leaves one compartment and less than a
      // unit arrives in the other, which is matter destroyed by moving.
      products: [{ poolIndex: at('H_out'), coefficient: leak === 'pump' ? 0.9 : 1 }],
      kinetics: kinetics('pump'),
      enabled: true,
    },
    {
      id: 'symport',
      substrates: [
        { poolIndex: at('S_out'), coefficient: 1 },
        { poolIndex: at('H_out'), coefficient: 1 },
      ],
      // A missing product term. The carried unit is consumed on the high side
      // and never put down on the low side.
      products:
        leak === 'symport'
          ? [{ poolIndex: at('S_in'), coefficient: 1 }]
          : [
              { poolIndex: at('S_in'), coefficient: 1 },
              { poolIndex: at('H_in'), coefficient: 1 },
            ],
      kinetics: kinetics('symport'),
      enabled: true,
    },
    {
      id: 'convert',
      substrates: [{ poolIndex: at('S_in'), coefficient: 1 }],
      products: [{ poolIndex: at('M_in'), coefficient: 1 }],
      kinetics: kinetics('convert'),
      enabled: true,
    },
    {
      id: 'sink',
      // W_in carries charge at a weight of 2, so it takes two units to make one.
      // Taking one manufactures a unit out of nothing.
      substrates: [{ poolIndex: at('H_in'), coefficient: leak === 'sink' ? 1 : 2 }],
      products: [{ poolIndex: at('W_in'), coefficient: 1 }],
      kinetics: kinetics('sink'),
      enabled: true,
    },
  ];

  return createSimulation(pools, reactions, createPrng(options.seed ?? 20260824));
}
