/**
 * The cell as a character, and the answer to DESIGN.md open question 7.
 *
 * ---------------------------------------------------------------------------
 * WHAT IT READS, AND WHY NOTHING ELSE ON THE SCREEN CAN
 * ---------------------------------------------------------------------------
 *
 * Open question 7 asks what distinguishes holding at a high rate from stopped.
 * Every pool card shows a NET rate by construction, and a net rate is genuinely
 * the same 0.00 in both situations, so no card can tell them apart. The beast
 * reads GROSS throughput, which is the quantity that differs, and that reading
 * exists nowhere else.
 *
 * The claim stops there. **It makes the quiet legible. It does not make the
 * quiet shorter.** NOW.md blocking item 2 is about a gap with nothing to do in
 * it, and a picture of a cell holding steady is not a thing to do.
 *
 * ---------------------------------------------------------------------------
 * TWO RULES, AND THEY INTERACT
 * ---------------------------------------------------------------------------
 *
 * FOUR DISCRETE STATES, AS REACT STATE, CHANGED ONLY ON A TRANSITION. The
 * subscription runs at frame rate and compares before it sets, exactly like
 * `Announcer` and the unlock shelf. What reaches React is one reading per
 * transition, and act 1 contains **three of them across 84000 frames**: the
 * pathway starting, the NAD+ wall, and fermentation recovering it. See
 * `beastPacing.report.test.ts`.
 *
 * AND IT NEVER ANIMATES ON A TIMER. DESIGN.md already says this. A character
 * that moves because time passed rather than because the cell changed is a pet
 * with an engagement hook attached, which is docs/PILLARS.md rule 2 arriving
 * through the door marked charm. There is no `setInterval`, no `setTimeout`, no
 * `requestAnimationFrame`, no CSS animation and no transition in this component
 * or in any of its four drawings, and `beast.test.tsx` asserts it against a
 * guard-the-guard on `PathwayArrow.tsx`, which does animate and legitimately.
 *
 * NOTHING CONTINUOUS, WHICH MAKES THE PER-FRAME WRITE PATH UNNECESSARY RATHER
 * THAN UNUSED. The log's constraint is that anything continuous goes on the
 * DOM-write path `PoolCard` uses. There is nothing continuous: the beast is four
 * pictures and a name. That is the strongest form of both rules rather than a
 * shortcut, and it is why this component writes to no DOM node at all.
 *
 * ---------------------------------------------------------------------------
 * THE SECOND CHANNEL IS THE SILHOUETTE
 * ---------------------------------------------------------------------------
 *
 * DESIGN.md proposes motion for three of the four states and V7's rule bans
 * movement or colour alone. Every state is distinguishable from the other three
 * by its stroked outline with all fills removed: posture, eye form, mouth form,
 * and for Powered a closed sub-outline inside the body. `beast.test.tsx`
 * measures the ink against greyscale and against the three Machado matrices and
 * asserts the four are pairwise distinct with fills stripped.
 */

import { useState } from 'react';
import type { ActVitality } from '../../content/acts';
import { BEAST_FIGURES } from '../art';
import { BEAST } from '../content';
import { useRuntime, useSnapshotEffect } from '../RuntimeContext';

/**
 * The reading, as React state, updated only when it actually changes.
 *
 * Seeded from the runtime rather than from a literal, so a restored save shows
 * the cell it restored rather than a fresh one for one frame.
 */
export function useVitality(): ActVitality {
  const runtime = useRuntime();
  const [vitality, setVitality] = useState<ActVitality>(() => runtime.snapshot.vitality);

  useSnapshotEffect((snapshot) => {
    // THE COMPARISON IS THE WHOLE ARCHITECTURE. This callback runs every frame.
    // Setting state unconditionally would re-render the tree sixty times a
    // second and undo the entire point of the runtime.
    if (snapshot.vitality === vitality) return;
    setVitality(snapshot.vitality);
  });

  return vitality;
}

export function Beast({ size = 44 }: { size?: number }) {
  const vitality = useVitality();
  const Figure = BEAST_FIGURES[vitality];

  return (
    /*
      `role="img"` with a name, rather than a decorative drawing beside a caption.
      The name states the reading and carries no figure, for the rule V7 settled
      on the carrier blob: an aria-label has nowhere to put a badge, so a number
      in one would be a quantitative claim with no provenance.
    */
    <span role="img" aria-label={BEAST[vitality].text} data-vitality={vitality}>
      <Figure size={size} />
    </span>
  );
}
