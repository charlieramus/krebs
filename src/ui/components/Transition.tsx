/**
 * The transition, as a screen. UPDATELOGV14.md stage 3.
 *
 * ---------------------------------------------------------------------------
 * IT IS THE ONE PLACE IN THE GAME THAT DIMS AND DOES NOT DISMISS
 * ---------------------------------------------------------------------------
 *
 * Every other overlay in this project follows one of two rules DESIGN.md
 * settled on 2026-08-04: the first run and the act boundary float over a lit,
 * clickable, still-ticking act screen because an idle game that pauses for its
 * own furniture has said something false about what it is, and the about and
 * teaching panels dim because they are opened deliberately and read.
 *
 * The arrival is neither. It dims, and it cannot be dismissed by clicking away
 * or by pressing escape, because **there is no state in which the choice has not
 * been made.** An overlay the player can dismiss is an overlay that leaves the
 * game in a fourth state nobody designed, with the act complete, the stranger
 * inside the cell and no decision recorded. That is not a modal for its own
 * sake; it is the one moment where dismissing is not a thing that can happen.
 *
 * The cell keeps ticking underneath regardless. The simulation is never paused
 * by anything in this file, which is the half of the rule that still applies.
 *
 * ---------------------------------------------------------------------------
 * THE OUTCOME SCREENS DISMISS NORMALLY
 * ---------------------------------------------------------------------------
 *
 * Once the decision is made there is a state to be in, so both outcomes behave
 * like the act boundary: undimmed, dismissible, and the game carries on. The
 * undo sits on them as a secondary action rather than as a second modal,
 * because a confirmation dialogue in front of an undo would be asking the
 * player to be sure about being unsure.
 */

import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';
import { Figure } from './Figure';
import { Overlay } from './Overlay';
import { TRANSITION_ARRIVAL, TRANSITION_DIGESTED, TRANSITION_KEPT } from '../content';
import type { Entry } from '../content';
import { DIGEST_GLUCOSE_YIELD, TUNING_BADGES } from '../tuning';

function Paragraph({ entry }: { entry: Entry }) {
  return (
    <p className="flex flex-wrap items-start gap-1 font-body text-body font-bold leading-snug">
      <span>{entry.text}</span>
      <Badge badge={entry.badge} />
    </p>
  );
}

/**
 * The arrival, and the choice.
 *
 * `onDismiss` is deliberately a no-op rather than absent: `Overlay` requires
 * one, and passing a function that does nothing is the honest expression of
 * "this cannot be dismissed" at the one call site where that is true. A missing
 * prop would read as an oversight.
 */
export function TransitionArrivalCard({
  onKeep,
  onDigest,
}: {
  onKeep: () => void;
  onDigest: () => void;
}) {
  return (
    <Overlay onDismiss={() => {}} dim label={TRANSITION_ARRIVAL.heading.text}>
      <Card surface="white" className="flex max-w-[46ch] flex-col gap-3 p-4">
        <span className="flex items-center justify-between gap-2">
          <span className="font-display font-semibold text-h2 leading-tight">
            {TRANSITION_ARRIVAL.heading.text}
          </span>
          <Badge badge={TRANSITION_ARRIVAL.heading.badge} />
        </span>

        {TRANSITION_ARRIVAL.body.map((entry) => (
          <Paragraph key={entry.text.slice(0, 24)} entry={entry} />
        ))}

        {/*
          KEEP IS FIRST IN THE DOM AND IN THE TAB ORDER, and it is not styled as
          the recommended one. docs/PROGRESSION.md makes keeping the only path
          forward and makes digesting a real choice rather than a mistake the
          interface should steer away from, so both are ordinary buttons on
          different surfaces. Order is reading order, which is the rule the
          layout already holds at every breakpoint.
        */}
        <span className="flex flex-col gap-2 sm:flex-row">
          <Button surface="mint" className="w-full" onClick={onKeep}>
            {TRANSITION_ARRIVAL.keep.text}
          </Button>
          <Button surface="white" className="w-full" onClick={onDigest}>
            {TRANSITION_ARRIVAL.digest.text}
          </Button>
        </span>

        <span className="flex items-center gap-1">
          <Badge badge={TRANSITION_ARRIVAL.heading.badge} />
          <span className="text-micro font-body font-bold text-ink2">
            {TRANSITION_ARRIVAL.source}
          </span>
        </span>
      </Card>
    </Overlay>
  );
}

/** What happened, on either branch, with the undo. */
export function TransitionOutcomeCard({
  decision,
  canUndo,
  onUndo,
  onDismiss,
}: {
  decision: 'kept' | 'digested';
  canUndo: boolean;
  onUndo: () => void;
  onDismiss: () => void;
}) {
  const content = decision === 'kept' ? TRANSITION_KEPT : TRANSITION_DIGESTED;

  return (
    <Overlay onDismiss={onDismiss} label={content.heading.text}>
      <Card surface="white" className="flex max-w-[46ch] flex-col gap-3 p-4">
        <span className="flex items-center justify-between gap-2">
          <span className="font-display font-semibold text-h2 leading-tight">
            {content.heading.text}
          </span>
          <Badge badge={content.heading.badge} />
        </span>

        {content.body.map((entry, index) => (
          <span key={entry.text.slice(0, 24)} className="flex flex-col gap-1">
            <Paragraph entry={entry} />
            {/*
              THE MEAL IS A FIGURE AND NOT A WORD IN THE SENTENCE. It is a tuned
              number, docs/ECONOMY.md row U24, and a tuned number written into
              prose is a quantitative claim with its provenance stripped off.
              Through `Figure` it carries its badge and opens its own provenance
              panel like every other number in the game.
            */}
            {decision === 'digested' && index === 0 ? (
              <Figure
                value={DIGEST_GLUCOSE_YIELD}
                decimals={0}
                unit="glucose"
                size="headline"
                badge={TUNING_BADGES.digestYield}
              />
            ) : null}
          </span>
        ))}

        <Button surface="mint" className="w-full" onClick={onDismiss}>
          {content.dismiss.text}
        </Button>

        {/*
          THE UNDO IS OFFERED IDENTICALLY ON BOTH BRANCHES. Showing it only after
          digesting would be the game telling the player they got it wrong, which
          is exactly what docs/PROGRESSION.md says the soft lock must not do.
        */}
        {canUndo ? (
          <span className="flex flex-col gap-1">
            <Button surface="white" className="w-full" onClick={onUndo}>
              {content.undo.text}
            </Button>
            <span className="flex flex-wrap items-center gap-1">
              <span className="text-micro font-body font-bold text-ink2">
                {content.undoNote.text}
              </span>
              <Badge badge={content.undoNote.badge} />
            </span>
          </span>
        ) : null}

        <span className="flex items-center gap-1">
          <Badge badge={content.body[1]?.badge ?? content.heading.badge} />
          <span className="text-micro font-body font-bold text-ink2">{content.source}</span>
        </span>
      </Card>
    </Overlay>
  );
}
