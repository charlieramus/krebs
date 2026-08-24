/**
 * The one live region. UPDATELOGV7.md stage 4.
 *
 * ---------------------------------------------------------------------------
 * ANNOUNCE EVENTS, EXPOSE RATES ON DEMAND, NEVER NARRATE THE TICK
 * ---------------------------------------------------------------------------
 *
 * This is a simulation whose numbers change twenty times a second, and a naive
 * live region pointed at any of them produces continuous speech, which is worse
 * than silence: a screen reader user cannot navigate a page that is talking, so
 * the accessible version of this game would be one you have to turn off to use.
 *
 * The line to draw is the one the architecture already draws. NOW.md calls it
 * three clocks: the simulation runs at 20Hz over a Float64Array, the display
 * samples one snapshot per frame, and React re-renders only on discrete events.
 * That third clock is exactly the set of things worth saying out loud, and it is
 * already computed. An unlock becoming affordable, the pathway stalling,
 * fermentation recovering it, an unlock being bought. Four kinds of event, and
 * act 1 contains sixteen of them end to end.
 *
 * ---------------------------------------------------------------------------
 * WHY THE SUBSCRIPTION IS ALLOWED TO RUN AT FRAME RATE
 * ---------------------------------------------------------------------------
 *
 * It samples per frame and compares before it sets, exactly like the unlock
 * shelf and the save panel. What reaches React state is one string per event,
 * so the tree re-renders sixteen times over an hour rather than sixty times a
 * second. The comparison is what keeps that true and it is the only thing that
 * does.
 *
 * ---------------------------------------------------------------------------
 * POLITE, AND ATOMIC
 * ---------------------------------------------------------------------------
 *
 * `aria-live="polite"` waits for a pause rather than cutting across whatever the
 * user is reading. `assertive` is for something going wrong, and nothing in act
 * 1 is: the NAD+ wall is the game working. `aria-atomic` so the region is read
 * as one sentence rather than as a diff.
 */

import { useRef, useState } from 'react';
import { useRuntime, useSnapshotEffect } from '../RuntimeContext';
import type { ActSnapshot } from '../runtime';
import type { TransitionDecision } from '../../content/transition';
import {
  ACT_COMPLETE_ANNOUNCEMENT,
  TRANSITION_ANNOUNCEMENTS,
  ANNOUNCEMENTS,
  LANDMARKS,
  UNLOCKS,
  unlockAffordable,
  unlockBought,
} from '../content';
import {
  FERMENT_ATP_THRESHOLD,
  GLYCOLYSIS_ATP_THRESHOLDS,
  GLYCOLYSIS_STEPS,
  UPTAKE_ATP_THRESHOLDS,
  UPTAKE_VMAX_STEPS,
} from '../tuning';

/**
 * Everything currently true that is worth saying, as a set of stable keys.
 *
 * EXPORTED SINCE UPDATELOGV14.md STAGE 3, AND THE REASON IS A DEFECT THAT WAS
 * ALREADY THERE. `surfaces.test.ts` counts the announcements a full act produces
 * and its own comment says it replays "the Announcer's own event derivation".
 * It did not: it reimplemented the fourteen lines below, so the count it
 * reported was a count of a copy. Stage 3 added two keys here and the copy could
 * not see either of them, which is the drift that makes two copies of one fact
 * the defect this project keeps writing down. There is one derivation now and
 * the test calls it.
 *
 * Keys rather than sentences, because the announcement is a function of the key
 * and comparing keys is what makes "has this already been said" cheap. The
 * purchase keys carry their step, so buying the second rung is a different event
 * from buying the first.
 */
export function announcementKeys(
  snapshot: ActSnapshot,
  canBuyGlycolysis: boolean,
  transition: { readonly available: boolean; readonly decision: TransitionDecision },
): string[] {
  const keys: string[] = [];

  if (snapshot.walled) keys.push('walled');

  if (snapshot.fermentUnlocked) keys.push('bought:ferment');
  else if (snapshot.meter.atpProduced >= FERMENT_ATP_THRESHOLD) keys.push('afford:ferment');

  if (snapshot.uptakeStep > 0) keys.push(`bought:uptake:${snapshot.uptakeStep}`);
  const uptakeNext = UPTAKE_ATP_THRESHOLDS[snapshot.uptakeStep];
  if (uptakeNext !== undefined && snapshot.meter.atpProduced >= uptakeNext) {
    keys.push(`afford:uptake:${snapshot.uptakeStep}`);
  }

  if (snapshot.glycolysisStep > 0) keys.push(`bought:glycolysis:${snapshot.glycolysisStep}`);
  if (canBuyGlycolysis) keys.push(`afford:glycolysis:${snapshot.glycolysisStep}`);

  /*
   * LAST, AND ONCE. UPDATELOGV11.md stage 4.
   *
   * The act ending is the single most significant event in the game so far and
   * it is still one sentence, because the rule has not changed: announce events,
   * expose rates on demand, never narrate the tick. It is pushed last so the
   * purchase that completed the act is spoken first, which is the order the two
   * happened in and the order a player would expect.
   *
   * It does not narrate the set piece. What is on screen is a card the player
   * can read; a live region describing it would be the same words twice.
   */
  if (snapshot.actComplete) keys.push('act-complete');

  /*
   * THE TRANSITION, AFTER THE ENDING AND IN THE ORDER IT HAPPENS.
   * UPDATELOGV14.md stage 3.
   *
   * THREE KEYS AND AT MOST TWO EVER FIRE, because the arrival and a decision
   * are the two states a session can pass through and the two outcomes are
   * mutually exclusive. That is the count the accessibility rule cares about:
   * DESIGN.md's second-channel table gives the gradient two announcements on
   * the same argument, and V12 added zero to an act that had seventeen because
   * two announcements about one fact is the same defect as two copies of one
   * fact in a save.
   *
   * IT DOES NOT NARRATE THE CARD. What is on screen is text the player can
   * read. What these say is the thing a screen reader user would otherwise only
   * learn by discovering that an upgrade stopped working, which is exactly the
   * silent loss docs/PROGRESSION.md says must not happen: "Losing control
   * silently reads as a bug; losing it with a stated reason reads as biology."
   */
  if (transition.available) keys.push('transition:arrived');
  if (transition.decision === 'kept') keys.push('transition:kept');
  if (transition.decision === 'digested') keys.push('transition:digested');

  return keys;
}

function sentence(key: string): string {
  if (key === 'walled') return ANNOUNCEMENTS.walled.text;
  if (key === 'recovered') return ANNOUNCEMENTS.recovered.text;
  if (key === 'act-complete') return ACT_COMPLETE_ANNOUNCEMENT.text;
  if (key === 'transition:arrived') return TRANSITION_ANNOUNCEMENTS.arrived.text;
  if (key === 'transition:kept') return TRANSITION_ANNOUNCEMENTS.kept.text;
  if (key === 'transition:digested') return TRANSITION_ANNOUNCEMENTS.digested.text;
  const [kind, which] = key.split(':') as [string, string];
  const name =
    which === 'ferment'
      ? UNLOCKS.ferment.text
      : which === 'uptake'
        ? UNLOCKS.uptakeCapacity.text
        : UNLOCKS.glycolyticCapacity.text;
  return kind === 'bought' ? unlockBought(name).text : unlockAffordable(name).text;
}

export function Announcer() {
  const runtime = useRuntime();
  const [message, setMessage] = useState('');
  /** Every key already said. A ref, because saying a thing twice is bookkeeping. */
  const said = useRef(new Set<string>());
  const wasWalled = useRef(false);

  useSnapshotEffect((snapshot) => {
    /**
     * Recovery is the one event that is the ABSENCE of a condition, so it is
     * derived from the edge rather than read off the snapshot. Fermentation
     * arriving is what a player needs to hear, and `walled` simply going false
     * is the only place that is visible.
     */
    const recovered = wasWalled.current && !snapshot.walled;
    wasWalled.current = snapshot.walled;

    const keys = announcementKeys(snapshot, runtime.canBuyGlycolysisStep(), {
      available: runtime.transitionAvailable(),
      decision: runtime.transitionDecision(),
    });
    if (recovered) keys.push('recovered');

    const fresh = keys.find((key) => !said.current.has(key));
    if (fresh === undefined) return;
    said.current.add(fresh);
    // One at a time. Two events can land on the same frame, the clearest case
    // being a purchase that immediately makes the next rung affordable, and a
    // region that swaps its whole contents twice in one frame gets read once.
    // The other key stays unsaid and is picked up on the next frame.
    setMessage(sentence(fresh));
  });

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={LANDMARKS.events.text}
      className="sr-only"
    >
      {message}
    </div>
  );
}

/**
 * How many announcements a full act 1 produces, as an upper bound the code can
 * be checked against rather than a number in a comment.
 *
 * One stall, one recovery, one act boundary, and one affordable plus one bought
 * for each of the purchases this component speaks for: the fermentation unlock,
 * the uptake rungs and the glycolytic rungs. If a later log adds a rung this
 * moves with it, because it counts the ladders rather than restating their
 * lengths.
 *
 * THE BOUNDARY ADDS EXACTLY ONE, WHICH IS THE CLAIM WORTH CHECKING. V8 measured
 * sixteen announcements against roughly 74000 ticks and stage 4's whole risk was
 * turning the most significant event in the game into a per-tick one.
 */
export const ACT1_ANNOUNCEMENT_COUNT =
  3 + 2 * (1 + (UPTAKE_VMAX_STEPS.length - 1) + (GLYCOLYSIS_STEPS.length - 1));

/**
 * What the transition adds, on top of the act. UPDATELOGV14.md stage 3.
 *
 * TWO, NOT THREE. The arrival is one, and then exactly one of the two outcomes.
 * A session cannot hear both `kept` and `digested`, because
 * `transitionDecisionFrom` throws on a state that claims both, so the third key
 * exists and is unreachable in the same session as the second.
 *
 * Kept separate from the act's own count rather than folded into it, because it
 * is not part of act 1: a player who never finishes the act never hears either,
 * and the seventeen V11 measured is still the number for a full act 1.
 */
export const TRANSITION_ANNOUNCEMENT_COUNT = 2;

/** Used by the test that pins the count, so the ladders cannot drift apart. */
export const ACT1_PURCHASE_COUNT =
  1 + UPTAKE_ATP_THRESHOLDS.length + GLYCOLYSIS_ATP_THRESHOLDS.length;
