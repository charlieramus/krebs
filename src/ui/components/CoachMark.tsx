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

import { useEffect, useRef, useState } from 'react';
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
      // 16px has no room for the inner focus rule index.css gives everything
      // else, and a pill carries no shadow for an outer one to collide with.
      // See the focus section of index.css.
      data-focus-ring="outer"
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
  autoFocus = false,
}: {
  content: CoachMarkContent;
  onDismiss: () => void;
  onAction: () => void;
  actionEnabled: boolean;
  /**
   * Whether to take focus on open. TRUE ONLY WHEN THE PLAYER ASKED FOR IT.
   *
   * A mark opened from the info affordance is a thing the player just did, and
   * focus should follow it. The NAD+ mark fires by itself on the wall, and
   * moving focus without the player having done anything takes the keyboard out
   * of their hands mid-sentence. It is also the one thing a screen reader user
   * would experience as the page grabbing them. So the automatic firing draws
   * the mark and leaves focus alone, and stage 4 owns announcing it instead.
   */
  autoFocus?: boolean;
}) {
  const card = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!autoFocus) return;
    card.current?.querySelector('button')?.focus();
  }, [autoFocus]);

  /**
   * Escape closes it, to the same contract Overlay gives the panels. A coach
   * mark is not an overlay, it is drawn inline in the pool rail, but a player
   * who has learned that Escape dismisses the thing on top of the screen should
   * not have to learn that this one is different.
   */
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDismiss]);

  return (
    <Card surface="white" className="flex max-w-[42ch] flex-col gap-2 p-3" containerRef={card}>
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
  /**
   * Whether this opening was the player's doing. Drives whether the mark takes
   * focus, and it is a separate fact from `open` because the same mark can
   * arrive either way. See CoachMark's `autoFocus`.
   */
  requested: boolean;
} {
  const [open, setOpen] = useState(false);
  const [requested, setRequested] = useState(false);
  /**
   * What had focus when the player asked for the mark, so dismissing can give
   * it back. Stage 1 measured the cost of not doing this on the About panel:
   * close it and focus is on `document.body`, so the next Tab restarts from the
   * top of the document rather than from the control the player was on.
   *
   * Null when the mark fired by itself, which is what makes dismissing an
   * unrequested mark leave focus exactly where the player left it.
   */
  const opener = useRef<HTMLElement | null>(null);
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
    // Deliberately does not set `requested`. Nothing the player did opened it,
    // so nothing should move under their hands.
  });

  return {
    open,
    requested,
    show: () => {
      opener.current = document.activeElement as HTMLElement | null;
      setRequested(true);
      setOpen(true);
    },
    dismiss: () => {
      setOpen(false);
      setRequested(false);
      const back = opener.current;
      opener.current = null;
      // `isConnected` because the thing that opened the mark can be gone by the
      // time it closes. The clearest case is the ferment slot: the mark's own
      // action buys the unlock and the affordance survives, but a later mark on
      // a card that has changed would not.
      if (back?.isConnected === true) back.focus();
    },
  };
}
