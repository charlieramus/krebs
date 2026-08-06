/**
 * The act boundary. UPDATELOGV11.md stage 4, and the one stage in that log that
 * adds behaviour.
 *
 * ---------------------------------------------------------------------------
 * IT IS A CONTENT CONDITION AND NOT A TIME OR A TOTAL
 * ---------------------------------------------------------------------------
 *
 * An act ends when its content is exhausted, which for act 1 means every
 * purchase has been made: both fermentation branches, glycogen storage, the two
 * enzymes, and both capacity ladders to the top. Ten of ten.
 *
 * Not elapsed time, and not a cumulative ATP figure. docs/PROGRESSION.md says
 * every branch must complete before the act boundary, and a clock would end the
 * act with content still on the shelf while an ATP total would end it for a
 * player who never bought anything. Both would also be the kind of number this
 * project puts in docs/ECONOMY.md, and an act boundary is not a balance
 * decision.
 *
 * ---------------------------------------------------------------------------
 * WHY IT LIVES IN src/ui/ AND NOT IN THE DESCRIPTOR
 * ---------------------------------------------------------------------------
 *
 * Same reason the card layout does, and it is the import rule rather than a
 * preference. Act 1's unlock ladders, their thresholds and their lengths are all
 * in `src/ui/tuning.ts`, because V3 put them there and `src/ui/runtime.ts` says
 * why moving them into content is a relocation no log has yet had business
 * making. Content may not import the interface, so a boundary that counts rungs
 * cannot live in `src/content/acts.ts` until the rungs do.
 *
 * So the descriptor answers what the act IS and this table answers when it is
 * FINISHED, keyed by the same act number. When the ladders move into content,
 * this moves with them.
 */

import type { ActDescriptor } from '../content/acts';
import type { ActMeter } from '../content/acts';
import type { ActSnapshot } from './runtime';
import { GLYCOLYSIS_ATP_THRESHOLDS, GLYCOLYSIS_STEPS, UPTAKE_VMAX_STEPS } from './tuning';

export interface ActBoundary {
  /**
   * Whether this act's content is exhausted. The boundary fires on the edge of
   * this going true.
   */
  isComplete(snapshot: ActSnapshot): boolean;
  /**
   * Cumulative ATP at which the act's LAST remaining purchase becomes
   * available, or Infinity once the act is complete.
   *
   * WHAT THIS IS FOR, AND THE GAP IN IT, STATED RATHER THAN HIDDEN. The offline
   * path uses it to decide how much of an absence to credit. The boundary
   * itself is the last purchase being MADE, and a purchase is a player action,
   * so it can never happen while the player is away. What the offline path can
   * see is the moment the last purchase becomes POSSIBLE, and crediting hours
   * past that point runs the cell in a configuration the player would have
   * upgraded out of before the act ended.
   *
   * So the two are deliberately different quantities and the offline stop uses
   * this one. See `creditPendingOffline` in src/ui/runtime.ts.
   */
  nextContentAtp(snapshot: ActSnapshot, meter: ActMeter): number;
}

/**
 * Act 1's boundary. Ten purchases, and the last of them is the top glycolytic
 * rung, because the two ladders are sequential and the glycolytic one opens
 * last.
 *
 * Every count below is read from the ladders rather than written down, so adding
 * a rung moves the boundary with it. A hardcoded ten would be the same defect as
 * a hardcoded announcement count, which `Announcer.tsx` already refuses.
 */
const ACT1_BOUNDARY: ActBoundary = {
  isComplete(snapshot: ActSnapshot): boolean {
    return (
      snapshot.fermentUnlocked &&
      snapshot.ethanolUnlocked &&
      snapshot.glycogenUnlocked &&
      snapshot.pfk1PkBought &&
      snapshot.uptakeStep >= UPTAKE_VMAX_STEPS.length - 1 &&
      snapshot.glycolysisStep >= GLYCOLYSIS_STEPS.length - 1
    );
  },

  nextContentAtp(snapshot: ActSnapshot): number {
    if (ACT1_BOUNDARY.isComplete(snapshot)) return Number.POSITIVE_INFINITY;

    /*
     * ONLY WHEN ONE PURCHASE IS LEFT, AND THIS WAS WRONG FIRST.
     *
     * The first version returned the act's last threshold whenever the act was
     * incomplete, which stopped the credit for any cell that made 158000 ATP
     * while away regardless of what it had bought. `persistence.test.ts` caught
     * it immediately: an eight-hour absence on a cell holding one purchase out
     * of ten credited 4951000 ms of 28800000.
     *
     * That was the wrong reading of the boundary. An act ending is not an unlock
     * threshold being crossed, and jump.ts is explicit that an ordinary crossing
     * is not an event and must not interrupt anything. What interrupts is the
     * act running out of content, so the stop only exists when the LAST purchase
     * is the one being waited for.
     */
    const oneLeft =
      snapshot.fermentUnlocked &&
      snapshot.ethanolUnlocked &&
      snapshot.glycogenUnlocked &&
      snapshot.pfk1PkBought &&
      snapshot.uptakeStep >= UPTAKE_VMAX_STEPS.length - 1 &&
      snapshot.glycolysisStep === GLYCOLYSIS_STEPS.length - 2;
    if (!oneLeft) return Number.POSITIVE_INFINITY;

    const last = GLYCOLYSIS_ATP_THRESHOLDS[GLYCOLYSIS_ATP_THRESHOLDS.length - 1];
    return last ?? Number.POSITIVE_INFINITY;
  },
};

const BY_ACT: ReadonlyMap<number, ActBoundary> = new Map([[1, ACT1_BOUNDARY]]);

/**
 * The running act's boundary.
 *
 * Throws rather than returning a boundary that never fires, because an act with
 * no end condition is a build mistake and a game that silently never ends is the
 * most confusing possible way to report one.
 */
export function boundaryFor(act: ActDescriptor): ActBoundary {
  const boundary = BY_ACT.get(act.act);
  if (boundary === undefined) throw new Error(`boundary: act ${act.act} has no end condition`);
  return boundary;
}

/** Act 1's, for the tests that are about act 1 specifically. */
export { ACT1_BOUNDARY };

/**
 * How many purchases act 1 contains, counted from the ladders.
 *
 * Ten: lactate fermentation, two uptake rungs, glycogen storage, the ethanol
 * branch, the two enzymes as one purchase, and four glycolytic rungs.
 */
export const ACT1_CONTENT_PURCHASES =
  4 + (UPTAKE_VMAX_STEPS.length - 1) + (GLYCOLYSIS_STEPS.length - 1);
