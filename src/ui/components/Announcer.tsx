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
import { ANNOUNCEMENTS, LANDMARKS, UNLOCKS, unlockAffordable, unlockBought } from '../content';
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
 * Keys rather than sentences, because the announcement is a function of the key
 * and comparing keys is what makes "has this already been said" cheap. The
 * purchase keys carry their step, so buying the second rung is a different event
 * from buying the first.
 */
function events(snapshot: ActSnapshot, canBuyGlycolysis: boolean): string[] {
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

  return keys;
}

function sentence(key: string): string {
  if (key === 'walled') return ANNOUNCEMENTS.walled.text;
  if (key === 'recovered') return ANNOUNCEMENTS.recovered.text;
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

    const keys = events(snapshot, runtime.canBuyGlycolysisStep());
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
 * One stall, one recovery, and one affordable plus one bought for each of the
 * seven purchases in act 1: the fermentation unlock, two uptake rungs and four
 * glycolytic rungs. Sixteen. If a later log adds a rung this moves with it,
 * because it counts the ladders rather than restating their lengths.
 */
export const ACT1_ANNOUNCEMENT_COUNT =
  2 + 2 * (1 + (UPTAKE_VMAX_STEPS.length - 1) + (GLYCOLYSIS_STEPS.length - 1));

/** Used by the test that pins the count, so the ladders cannot drift apart. */
export const ACT1_PURCHASE_COUNT =
  1 + UPTAKE_ATP_THRESHOLDS.length + GLYCOLYSIS_ATP_THRESHOLDS.length;
