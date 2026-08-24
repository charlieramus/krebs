/**
 * The one irreversible decision in the game.
 *
 * UPDATELOGV14.md stage 3.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS FILE IS AND IS NOT
 * ---------------------------------------------------------------------------
 *
 * It is the model: what states the decision can be in, how those states are
 * read off a save, and what keeping the endosymbiont takes away. It is not the
 * screen, which is `src/ui/components/Transition.tsx`, and it is not the
 * snapshot, which is `src/save/storage.ts`.
 *
 * It lives in `src/content/` because the decision is content. `src/content/`
 * may import `src/sim/` and `src/save/` types and may never import `src/ui/`,
 * and this file imports no interface.
 *
 * ---------------------------------------------------------------------------
 * THREE STATES, TWO FIELDS, AND NO THIRD COPY OF EITHER FACT
 * ---------------------------------------------------------------------------
 *
 * The decision is undecided, kept or digested. The save already carries enough
 * to say which, and deliberately gains nothing new:
 *
 *   kept        progression.transitionTaken === true
 *   digested    ACT3_UNLOCK_DIGESTED is in progression.unlocked
 *   undecided   neither
 *
 * `transitionTaken` has been in `SaveV1` since V4, labelled act 3, written as
 * false and read by nothing. This is where it becomes real, and it means
 * exactly what its name says: the transition was taken. Digesting is the
 * refusal of the transition rather than a variety of it, so it is not that
 * field being true with a qualifier, it is a different fact.
 *
 * UPDATELOGV14.md STAGE 1 RESERVED AN ID THAT IS NOT MINTED. It named
 * `endosymbiont-kept` alongside `endosymbiont-digested` and said stage 3 might
 * find that `transitionTaken` carries the whole fact. It does. Minting both
 * would put "the player kept it" in two places, which is the defect
 * docs/SAVE_SCHEMA.md Part 3 and `actStart.ts` both exist to refuse. So
 * `endosymbiont-kept` is dropped, at no cost, because no build ever wrote it.
 * Same outcome as the three enzyme ids V10 stage 1 named and V10 stage 4 did
 * not ship.
 *
 * The two cannot both be true and `transition.test.ts` asserts it, because a
 * save that claims both is a save whose decision cannot be read.
 */

import type { SaveV1 } from '../save/schema';

/**
 * Permanent, docs/SAVE_SCHEMA.md Part 3. Minted by UPDATELOGV14.md stage 3.
 *
 * The digest path's whole record. It is an unlock id rather than a settings key
 * because `settings` is presentation and may never affect simulation, and this
 * decides which reactions the cell will ever be able to run.
 */
export const ACT3_UNLOCK_DIGESTED = 'endosymbiont-digested';

export type TransitionDecision = 'undecided' | 'kept' | 'digested';

/** Read the decision off a save. The only place the two fields are combined. */
export function transitionDecisionOf(save: SaveV1): TransitionDecision {
  const digested = save.progression.unlocked.includes(ACT3_UNLOCK_DIGESTED);
  if (save.progression.transitionTaken && digested) {
    throw new Error(
      'transition: a save cannot have both kept and digested the endosymbiont',
    );
  }
  if (save.progression.transitionTaken) return 'kept';
  if (digested) return 'digested';
  return 'undecided';
}

/** The same reading from the two values, for a live session that has no save yet. */
export function transitionDecisionFrom(
  transitionTaken: boolean,
  unlocked: readonly string[],
): TransitionDecision {
  const digested = unlocked.includes(ACT3_UNLOCK_DIGESTED);
  if (transitionTaken && digested) {
    throw new Error(
      'transition: a session cannot have both kept and digested the endosymbiont',
    );
  }
  if (transitionTaken) return 'kept';
  if (digested) return 'digested';
  return 'undecided';
}

/* ===========================================================================
   WHAT IS LOST
   =========================================================================== */

/**
 * THE CAPABILITY KEEPING THE ENDOSYMBIONT TAKES AWAY, AND WHY IT IS THIS ONE.
 *
 * docs/PROGRESSION.md act 3: "What is lost at the transition: some
 * direct-control upgrades. The endosymbiont is a separate entity with its own
 * genome and the player does not have full authority over it initially."
 *
 * The obvious readings are all wrong. Glycolysis does not move: it stays in the
 * cytosol and stays the host's, so taking the capacity ladders away would be a
 * punishment dressed as biology. Taking a pool away would break conservation.
 * Taking the fermentation branches away would remove the act 1 teaching beat
 * from a player who is still standing on it.
 *
 * WHAT IS ACTUALLY LOST IS REGULATORY AUTHORITY, AND docs/SCIENCE.md ALREADY
 * SAYS SO. Part 2, Regulation: phosphofructokinase-1 "is allosterically
 * inhibited by ATP and citrate ... citrate signals that downstream capacity is
 * already saturated." Citrate is the first intermediate of the TCA cycle. The
 * moment there is a mitochondrion, the host's own committed step of glycolysis
 * is being throttled by a molecule made inside a compartment the host does not
 * yet control, and that is the definition of not having full authority.
 *
 * So the loss is `enzyme-pfk1-pk`, the one purchase in act 1 the player made by
 * NAME. Its 1.15 factor on both glycolytic phases is suspended. The unlock id
 * stays in `progression.unlocked`, because the player did buy it and a save
 * that forgot would refund it on the next load; what changes is whether the
 * factor is applied.
 *
 * FOUR REASONS IT IS THE RIGHT ONE.
 *
 * It is sourced, and it was sourced before this log existed rather than found
 * to justify a mechanic.
 *
 * It is legible. The player bought two enzymes by name and the game can say
 * which two stopped paying and what is now inhibiting them. docs/PROGRESSION.md
 * asks for the loss to read as biology rather than as a bug, and losing an
 * upgrade whose real enzyme is genuinely inhibited by the real product of the
 * thing you just acquired is as close as this model gets.
 *
 * It is exactly what stage 5 gives back. docs/PROGRESSION.md act 3 item 7 is
 * endosymbiotic gene transfer, "moving genes to the host genome to regain
 * control", and the control being regained is this one. The loss and its repair
 * are the same fact from two sides, which is what makes the repair a payoff
 * rather than a second upgrade.
 *
 * And it is bounded. One factor, on two Vmax values, restored by one unlock
 * ladder. The cell is slower and it is not broken, it cannot reach a state it
 * cannot come back from, and the ATP bootstrap repair C14 depends on is
 * untouched because lowering `prep` never triggers it. Nothing here can produce
 * the collapse V10 stage 4 measured when PFK-1 was RAISED alone.
 */
export type LostCapability = 'enzyme-pfk1-pk';

/** Every capability the transition suspends. One, and the type says so. */
export const TRANSITION_SUSPENDS: readonly LostCapability[] = ['enzyme-pfk1-pk'];

/**
 * Whether the named enzyme purchase is currently paying out.
 *
 * Bought and not suspended. A player who has kept the endosymbiont and has not
 * yet transferred any genes owns the purchase and does not get the factor.
 *
 * `genesTransferred` is stage 5's ladder and is zero for the whole of stage 3.
 * It is a parameter rather than an assumption so that the restoration is a
 * reading of state rather than a second boolean somewhere else, which is the
 * same argument `actStart.ts` makes about derived flags.
 */
export function pfk1PkActive(options: {
  readonly bought: boolean;
  readonly decision: TransitionDecision;
  readonly genesTransferred: number;
}): boolean {
  if (!options.bought) return false;
  if (options.decision !== 'kept') return true;
  return options.genesTransferred > 0;
}
