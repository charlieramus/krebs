/**
 * The act boundary, as a screen. UPDATELOGV11.md stage 4.
 *
 * ---------------------------------------------------------------------------
 * MACHINERY NOW, SET PIECE LATER
 * ---------------------------------------------------------------------------
 *
 * `docs/designs/game-spine-and-four-acts.md` E9 makes act boundaries authored
 * set pieces. This is not one yet and does not pretend to be: it is the thing
 * that fires, so V12 can make it look like anything without also having to
 * invent when it happens, what stops the offline credit, and what the state on
 * the other side of it is. Those are the parts that are hard to change later.
 *
 * ---------------------------------------------------------------------------
 * UNDIMMED, AND THE SIMULATION KEEPS TICKING UNDER IT
 * ---------------------------------------------------------------------------
 *
 * Exactly the rule `FirstRunCard` holds, for the same reason and at the other
 * end of the act. An idle game that stops when its content stops has told the
 * player something false about what it is. The act screen stays lit, stays
 * clickable, and the top bar keeps counting behind this card, which is also
 * what makes the third paragraph checkable rather than merely reassuring.
 */

import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';
import { Overlay } from './Overlay';
import { END_OF_CONTENT } from '../content';

export function EndOfContent({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Overlay onDismiss={onDismiss} label={END_OF_CONTENT.heading.text}>
      <Card surface="white" className="flex max-w-[46ch] flex-col gap-3 p-4">
        <span className="flex items-center justify-between gap-2">
          <span className="font-display font-semibold text-h2 leading-tight">
            {END_OF_CONTENT.heading.text}
          </span>
          <Badge badge={END_OF_CONTENT.heading.badge} />
        </span>

        {END_OF_CONTENT.body.map((paragraph) => (
          <p
            key={paragraph.text.slice(0, 24)}
            className="flex flex-wrap items-start gap-1 font-body text-body font-bold leading-snug"
          >
            <span>{paragraph.text}</span>
            <Badge badge={paragraph.badge} />
          </p>
        ))}

        <Button surface="mint" className="w-full" onClick={onDismiss}>
          {END_OF_CONTENT.action.text}
        </Button>

        {/* The mandatory source row, to the same contract a coach mark has. */}
        <span className="flex items-center gap-1">
          <Badge badge={END_OF_CONTENT.body[1]?.badge ?? END_OF_CONTENT.heading.badge} />
          <span className="text-micro font-body font-bold text-ink2">{END_OF_CONTENT.source}</span>
        </span>
      </Card>
    </Overlay>
  );
}
