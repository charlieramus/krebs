/**
 * Act 3's unlocks. UPDATELOGV14.md stage 5.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS IS IN src/content/ WHERE ACT 1'S LADDERS ARE IN src/ui/
 * ---------------------------------------------------------------------------
 *
 * Act 1's ladders and thresholds are in `src/ui/tuning.ts` because V3 put them
 * there, and `src/ui/boundary.ts` records why that has never been worth undoing
 * on its own: content may not import the interface, so a boundary that counts
 * rungs cannot live in content until the rungs do. It also says what happens
 * when they move: "When the ladders move into content, this moves with them."
 *
 * **Act 3's start in content rather than moving there later.** Nothing about an
 * unlock is a presentation decision: which reaction it enables, what it costs
 * and what it does to a rate are all facts about the act. Act 1's placement is
 * a historical accident this act does not have to inherit, and putting act 3's
 * in `src/ui/` would mean the interface holding chemistry for the second time
 * rather than the first.
 *
 * ---------------------------------------------------------------------------
 * THREE KINDS OF UNLOCK AND EACH ONE IS A DIFFERENT SHAPE
 * ---------------------------------------------------------------------------
 *
 *     enables     turns a reaction on. Twelve of them, in the order
 *                 docs/PROGRESSION.md lists. The chain-then-synthase sequence
 *                 is the act's teaching beat and its order is load-bearing
 *     genome      endosymbiotic gene transfer. Raises the rates the player did
 *                 not control at the transition. A finite ladder
 *     replication scaling the number of mitochondria. Raises chain capacity
 *                 AND maintenance together, which is what stops it being an
 *                 infinite multiplier
 *
 * docs/PILLARS.md rule 3 bans infinite scaling, so both ladders are finite and
 * both end. Adding a rung means editing an array here, exactly as act 1's do.
 */

import { hill, michaelisMenten, type Kinetics } from '../../sim/reactions';
import type { SimulationState } from '../../sim/state';
import type { Act3ReactionId } from './reactions';
import {
  ACT3_GENOME_ATP_THRESHOLDS,
  ACT3_GENOME_FACTORS,
  ACT3_MITOCHONDRIA_ATP_THRESHOLDS,
  ACT3_MITOCHONDRIA_FACTORS,
  ACT3_MITOCHONDRIA_MAINTENANCE,
  ACT3_CRISTAE_FACTORS,
  ACT3_CRISTAE_ATP_THRESHOLDS,
  ACT3_UNLOCK_ATP_THRESHOLDS,
} from './tuning';

/**
 * Permanent. docs/SAVE_SCHEMA.md Part 3, and the ids stage 1 reserved.
 *
 * `complex-1` to `complex-4` are Arabic where the biology is Roman, because
 * `complex-i` and `complex-ii` differ by one character in a string a reader
 * skims and a migration matches exactly.
 */
export type Act3UnlockId =
  | 'mitochondrial-import'
  | 'atp-synthase'
  | 'shuttle-malate-aspartate'
  | 'shuttle-glycerol-phosphate'
  | `cristae-${number}`
  | `gene-transfer-${number}`
  | `mitochondria-count-${number}`;

export interface Act3Enable {
  readonly id: Act3UnlockId;
  /** Every reaction this turns on. More than one where the parts are lethal apart. */
  readonly reactions: readonly Act3ReactionId[];
  /** Cumulative gross ATP at which it becomes buyable. */
  readonly threshold: number;
}

/**
 * The four enabling purchases.
 *
 * ---------------------------------------------------------------------------
 * TWO OF THEM SELL SEVERAL REACTIONS AT ONCE, AND MEASUREMENT IS WHY
 * ---------------------------------------------------------------------------
 *
 * The first version of this file sold the twelve reactions separately, in the
 * order docs/PROGRESSION.md lists them. **Every intermediate configuration made
 * the cell worse and the harness measured it: five purchases of nineteen and
 * then a stall.**
 *
 * The reason is one-directional transport. Buying the pyruvate carrier alone
 * sends pyruvate into a matrix that cannot process it, so it piles up there
 * while the cytosol loses the substrate fermentation was using to regenerate
 * NAD+. The cell walls. Buying the dehydrogenase complex next moves the pile one
 * step along to acetyl-CoA. Buying the cycle moves it to matrix NADH. **Nothing
 * between an act 1 cell and a working chain is better than an act 1 cell**,
 * because until electrons can reach oxygen every step is a longer dead end.
 *
 * V5 SETTLED THIS SHAPE ALREADY. Act 1's glycolytic ladder sells three Vmax
 * values as one purchase, because the intermediate configurations are lethal and
 * "selling them separately would mean shipping a purchasable configuration that
 * kills the player's cell". Act 1's `enzyme-pfk1-pk` is two enzymes and one
 * purchase for the same reason. This is that rule applied to a whole subsystem.
 *
 * **THE CHEMIOSMOSIS BEAT SURVIVES INTACT AND IS THE REASON FOR THE SPLIT.** The
 * import and the chain are one purchase; the synthase is the next one. A player
 * who has bought the first and not the second has a working respiratory chain,
 * a gradient climbing toward every proton in the cell, and no more ATP than they
 * started with. That is the act's teaching beat and it is now the ONLY thing the
 * first two purchases are about.
 *
 * THE MALATE-ASPARTATE SHUTTLE RIDES WITH THE IMPORT, and measurement moved it
 * there too. Transport takes pyruvate away from fermentation, which is the only
 * thing regenerating cytosolic NAD+ before a shuttle exists, so an import
 * purchase without a shuttle walls the cytosol: measured with `nad` at 0.00 and
 * the cell stopped. **The compartment cannot be switched on without giving the
 * cytosol its carrier back**, and the shuttle is what does that. The second
 * shuttle is a real separate choice and is sold separately.
 *
 * THE TRANSLOCASE AND THE PHOSPHATE CARRIER RIDE WITH THE IMPORT, AND THEY ARE
 * WHAT MAKE IT A PURCHASE RATHER THAN A SACRIFICE.
 *
 * They have to travel together, which stage 5 measured twice. The carrier alone
 * is fatal: it is one-directional, so it pumps the whole cytosolic phosphate
 * pool into a matrix with nothing to send back, `payoff` loses the phosphate it
 * needs and glycolysis stops, at 0.05 gross ATP per game-second against a
 * baseline of 25.38. **The return path is the translocase**, which sends ATP out
 * carrying three phosphates and brings ADP back carrying two, returning exactly
 * the one the carrier imported.
 *
 * With both, the cycle's own substrate-level ATP reaches the cytosol, so
 * respiration is worth something the moment it is switched on: **two ATP per
 * glucose becomes four**. Without them the import purchase leaves the cell
 * strictly worse than an act 1 cell, which V5's rule forbids and which the
 * harness measured at 78 percent of baseline.
 *
 * **AND THE BEAT IS BETTER FOR IT, NOT WEAKER.** The player buys respiration,
 * watches the yield double, and watches a gradient climb to almost every proton
 * in the cell with nothing spending it. Then they buy one thing and four becomes
 * thirty-one. The gap between what the gradient obviously represents and what it
 * is currently worth is the whole lesson, and it is larger this way than it was
 * when the first purchase paid nothing at all.
 */
export const ACT3_ENABLES: readonly Act3Enable[] = [
  {
    id: 'mitochondrial-import',
    reactions: [
      'pyruvate_transport',
      'pdh',
      'tca',
      'complex_1',
      'complex_2',
      'complex_3',
      'complex_4',
      'shuttle_malate_aspartate',
      'ant',
    ],
    threshold: ACT3_UNLOCK_ATP_THRESHOLDS[0] as number,
  },
  {
    id: 'atp-synthase',
    reactions: ['atp_synthase'],
    threshold: ACT3_UNLOCK_ATP_THRESHOLDS[1] as number,
  },
  {
    id: 'shuttle-glycerol-phosphate',
    reactions: ['shuttle_glycerol_phosphate'],
    threshold: ACT3_UNLOCK_ATP_THRESHOLDS[2] as number,
  },
];

/**
 * Endosymbiotic gene transfer, as a finite ladder.
 *
 * ---------------------------------------------------------------------------
 * THE PAYOFF FOR WHAT THE TRANSITION TOOK, AND IT IS THE MECHANISM BY WHICH TWO
 * ORGANISMS BECAME ONE
 * ---------------------------------------------------------------------------
 *
 * docs/SCIENCE.md Part 4: endosymbiotic gene transfer moved the large majority
 * of the endosymbiont's genome to the host nucleus over time, and the human
 * mitochondrial genome retains only thirteen protein-coding genes. **That is not
 * a metaphor for an upgrade. It is what happened**, and it is the reason a
 * mitochondrion is an organelle rather than a lodger.
 *
 * WHAT IT DOES MECHANICALLY. `src/content/transition.ts` records that keeping
 * the endosymbiont costs direct control, because the genes for what happens
 * inside are in its genome and not the host's. The reactions in the matrix
 * therefore run at a fraction of their rate until the genes move. Each rung
 * raises `pdh` and `tca` together, and the last rung restores them fully.
 *
 * **THE LAST RUNG IS 1.0 AND THAT IS THE DESIGN.** A ladder that ended above the
 * unmodified rate would be an upgrade wearing a loss as a costume. The player is
 * getting back what the transition took and no more, which is what makes the
 * loss a real loss and the recovery a real recovery.
 *
 * FINITE, per docs/PILLARS.md rule 3. Three rungs and it ends.
 */
export interface Act3Ladder {
  readonly idPrefix: string;
  /** Factor applied at each rung, index 0 being the state the act starts in. */
  readonly factors: readonly number[];
  /** Cumulative gross ATP for each purchasable rung. One shorter than `factors`. */
  readonly thresholds: readonly number[];
}

export const ACT3_GENOME: Act3Ladder = {
  idPrefix: 'gene-transfer',
  factors: ACT3_GENOME_FACTORS,
  thresholds: ACT3_GENOME_ATP_THRESHOLDS,
};

/**
 * Mitochondrial replication.
 *
 * ---------------------------------------------------------------------------
 * MORE MITOCHONDRIA COST MAINTENANCE, AND THAT IS WHAT STOPS IT BEING A
 * MULTIPLIER WITH NO CEILING
 * ---------------------------------------------------------------------------
 *
 * docs/PILLARS.md rule 3 bans infinite scaling. A rung raises the capacity of
 * everything inside the compartment, which is the four complexes, the synthase
 * and the two carriers, and it raises `maintain` alongside. **A mitochondrion is
 * a structure a cell has to keep**, and a game in which building more of them is
 * free is a game about a number rather than about a cell.
 *
 * V5'S RULE APPLIES TO EVERY RUNG: a purchasable configuration that makes the
 * cell worse must not ship. So the capacity factor must outrun the maintenance
 * factor at every step, and `pacing.test.ts` measures it at every rung rather
 * than asserting it.
 *
 * FINITE. Four rungs and it ends, exactly as act 1's two ladders do.
 */
export const ACT3_MITOCHONDRIA: Act3Ladder = {
  idPrefix: 'mitochondria-count',
  factors: ACT3_MITOCHONDRIA_FACTORS,
  thresholds: ACT3_MITOCHONDRIA_ATP_THRESHOLDS,
};

/** Maintenance factor per mitochondrial rung. Paired with `ACT3_MITOCHONDRIA.factors`. */
export const ACT3_MITOCHONDRIA_UPKEEP: readonly number[] = ACT3_MITOCHONDRIA_MAINTENANCE;

/**
 * Cristae, as a finite capacity ladder on the chain.
 *
 * docs/SCIENCE.md Part 4: the inner membrane is "folded into cristae to increase
 * its area, and it is unusually protein dense". **More area is more chain**, and
 * it is the one act 3 upgrade that is purely capacity: it adds no reaction, it
 * changes no yield, and no configuration of it can be worse than the one below.
 *
 * IT EXISTS FOR PACING AND THAT IS SAID RATHER THAN HIDDEN. Binding the lethal
 * intermediates took act 3 from twelve enabling purchases to four, and an act
 * with four events in a hundred and fifty minutes is NOW.md blocking item 2 made
 * worse rather than better. A ladder is the safe way to add events, because
 * every rung is strictly an improvement, which is exactly why act 1 has two.
 */
export const ACT3_CRISTAE: Act3Ladder = {
  idPrefix: 'cristae',
  factors: ACT3_CRISTAE_FACTORS,
  thresholds: ACT3_CRISTAE_ATP_THRESHOLDS,
};

/** Which reactions a cristae rung scales. The chain and the synthase. */
export const ACT3_CRISTAE_REACTIONS: readonly Act3ReactionId[] = [
  'complex_1',
  'complex_2',
  'complex_3',
  'complex_4',
  'atp_synthase',
];

/** Which reactions a mitochondrial rung scales. Everything inside the compartment. */
export const ACT3_REPLICATED_REACTIONS: readonly Act3ReactionId[] = [
  'pyruvate_transport',
  'pdh',
  'tca',
  'complex_1',
  'complex_2',
  'complex_3',
  'complex_4',
  'atp_synthase',
  'ant',
];

/** Which reactions gene transfer restores. The endosymbiont's own chemistry. */
export const ACT3_GENOME_REACTIONS: readonly Act3ReactionId[] = ['pdh', 'tca'];

/** Every unlock id act 3 can mint, for the tests that check the registry against the ladders. */
export function act3UnlockIds(): readonly string[] {
  const ids: string[] = ACT3_ENABLES.map((e) => e.id);
  for (const ladder of [ACT3_CRISTAE, ACT3_GENOME, ACT3_MITOCHONDRIA]) {
    for (let rung = 1; rung < ladder.factors.length; rung += 1) {
      ids.push(`${ladder.idPrefix}-${rung}`);
    }
  }
  return ids;
}

/**
 * How many purchases act 3 contains, counted from the tables rather than
 * written down.
 *
 * Same posture as `ACT1_CONTENT_PURCHASES`: a hardcoded number is the defect
 * `Announcer.tsx` already refuses, and adding a rung has to move the act
 * boundary with it.
 */
export const ACT3_CONTENT_PURCHASES =
  ACT3_ENABLES.length +
  (ACT3_CRISTAE.factors.length - 1) +
  (ACT3_GENOME.factors.length - 1) +
  (ACT3_MITOCHONDRIA.factors.length - 1);

/**
 * Set a reaction's Vmax, carrying its curve across.
 *
 * THE SAME NARROW CAST `src/ui/runtime.ts` USES, and for the same reason. A
 * `Reaction`'s `kinetics` is readonly because a reaction's shape is not
 * something the hot path may edit, and a ladder rung is not the hot path: it
 * happens once, on a purchase, at a moment the player caused.
 *
 * PRESERVES THE SHAPE RATHER THAN RE-GUESSING IT. Act 3's ladders point at
 * `atp_synthase`, which is Hill, and at `pdh`, which is Michaelis-Menten, so a
 * version that assumed either would be wrong half the time. Every field of the
 * old descriptor except Vmax is carried over, through the validating
 * constructors, so an invalid value throws here rather than producing a
 * reaction that quietly computes nothing.
 */
export function setAct3Vmax(state: SimulationState, id: Act3ReactionId, vmax: number): void {
  const reaction = state.reactions.find((r) => r.id === id);
  if (reaction === undefined) throw new Error(`act 3: no reaction "${id}"`);
  const kinetics = reaction.kinetics;
  const next: Kinetics =
    kinetics.kind === 'hill'
      ? hill(vmax, kinetics.k, kinetics.n)
      : michaelisMenten(vmax, kinetics.km);
  (reaction as { kinetics: Kinetics }).kinetics = next;
}
