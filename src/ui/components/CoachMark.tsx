/**
 * The teaching unit. DESIGN.md, Coach marks.
 *
 * Anatomy, top to bottom, and all four parts are required:
 *
 *     heading    Fredoka 600, 16px, with its badge inline
 *     body       Nunito 700, 14.5px, two short paragraphs MAXIMUM
 *     action     full-width button
 *     source     badge plus a doc reference
 *
 * The source row is mandatory. DESIGN.md: a coach mark without one does not
 * ship, so `CoachMark` in src/ui/content.ts types `source` as a required string
 * and this component renders it unconditionally.
 *
 * TWO PARAGRAPHS IS A HARD CEILING and the NAD+ mark fits inside it. That is
 * reported in stage 3 as a result rather than luck: the constraint is genuinely
 * one idea. What did not fit is that fermentation buys throughput and zero
 * yield, which is a second idea and belongs on the unlock or in a teaching
 * panel, and a teaching panel is out of scope for V3.
 *
 * ---------------------------------------------------------------------------
 * TWO TRIGGER BEHAVIOURS, BOTH BUILT, NEITHER CHOSEN
 * ---------------------------------------------------------------------------
 *
 * Stage 6 builds both and deliberately does not pick. Question 2 is precisely
 * about whether this beat is interesting or annoying, and that is not decidable
 * by argument. Stage 7 plays both and chooses.
 *
 *     'manual'  opens only when the player taps the info affordance
 *     'auto'    opens once, by itself, the first time the stall is detected
 *
 * `auto` opens ONCE. A coach mark that reopens every time the condition recurs
 * is the thing that turns teaching into nagging, and the wall recurs every time
 * the player is between upgrades.
 */

import { useRef, useState } from 'react';
import { useSnapshotEffect } from '../RuntimeContext';
import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';
import { useOverlayOpen } from './Overlay';
import { COACH, type CoachMark as CoachMarkContent } from '../content';

export type CoachMarkTrigger = 'manual' | 'auto';

/**
 * WHICH BEHAVIOUR IS LIVE. Flipping this constant is the whole switch, so stage
 * 7 can play one, change one word, and play the other. Stage 7 picks and says
 * why; until then this is a coin toss with a comment on it.
 */
export const COACH_MARK_TRIGGER: CoachMarkTrigger = 'auto';

/** The 16px circular info affordance DESIGN.md gives every unfamiliar term. */
export function InfoAffordance({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-4 shrink-0 items-center justify-center rounded-pill border-solid border-ink bg-white text-micro font-body font-extrabold leading-none text-ink"
      style={{ borderWidth: 'var(--outline-pill)' }}
    >
      {COACH.affordance.text}
    </button>
  );
}

export function CoachMark({
  content,
  onDismiss,
  onAction,
  actionEnabled,
}: {
  content: CoachMarkContent;
  onDismiss: () => void;
  onAction: () => void;
  actionEnabled: boolean;
}) {
  return (
    <Card surface="white" className="flex max-w-[42ch] flex-col gap-2 p-3">
      <span className="flex items-center justify-between gap-2">
        <span className="font-display font-semibold text-card-title leading-tight">
          {content.heading.text}
        </span>
        <Badge badge={content.heading.badge} />
      </span>

      {content.body.map((paragraph) => (
        <p key={paragraph.text.slice(0, 24)} className="font-body text-body font-bold leading-snug">
          {paragraph.text}
        </p>
      ))}

      <Button
        surface="mint"
        className="w-full"
        disabled={!actionEnabled}
        onClick={() => {
          onAction();
          onDismiss();
        }}
      >
        {content.action.text}
      </Button>

      {/* The mandatory source row. */}
      <span className="flex items-center gap-1">
        <Badge badge={content.heading.badge} />
        <span className="text-micro font-body font-bold text-ink2">{content.source}</span>
      </span>

      <button
        type="button"
        onClick={onDismiss}
        className="self-start text-micro font-body font-bold text-ink2 underline"
      >
        {COACH.dismiss.text}
      </button>
    </Card>
  );
}

/**
 * Owns whether the mark is open, under whichever trigger is live.
 *
 * `openedOnce` is separate from `open` on purpose: dismissing closes the mark,
 * and under `auto` it must not reopen on the next frame that the cell is still
 * walled, which is every frame until the player does something about it.
 */
export function useCoachMark(trigger: CoachMarkTrigger): {
  open: boolean;
  show: () => void;
  dismiss: () => void;
} {
  const [open, setOpen] = useState(false);
  // A ref rather than state: firing once is bookkeeping, not something the tree
  // needs to re-render over, and reading it inside the subscription avoids the
  // setState-inside-setState shape that a state flag would need.
  const autoFired = useRef(false);
  // Held in a ref for the same reason the callback is: the subscription is
  // registered once and must read the current value rather than the one that was
  // true when it was registered.
  const overlayOpen = useOverlayOpen();
  const overlayOpenRef = useRef(overlayOpen);
  overlayOpenRef.current = overlayOpen;

  useSnapshotEffect((snapshot) => {
    if (trigger !== 'auto') return;
    // An overlay is on top, so an automatic firing would land under it and be
    // spent. `walled` persists until fermentation is bought, so returning here
    // defers the firing rather than losing it. See Overlay.tsx.
    if (overlayOpenRef.current) return;
    if (!snapshot.walled) return;
    if (autoFired.current) return;
    autoFired.current = true;
    setOpen(true);
  });

  return {
    open,
    show: () => setOpen(true),
    dismiss: () => setOpen(false),
  };
}
