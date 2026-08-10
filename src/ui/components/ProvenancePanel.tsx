/**
 * The panel that says where a number came from. UPDATELOGV12.md stage 4.
 *
 * ---------------------------------------------------------------------------
 * FOUR DESTINATIONS, NOT THREE
 * ---------------------------------------------------------------------------
 *
 *     Sourced     opens its docs/SCIENCE.md Part
 *     Tuned       opens its docs/ECONOMY.md row, which says DEPARTURE or
 *                 UNSOURCED. Only the row knows which, so this branch cannot be
 *                 taken from the badge alone
 *     Contested   what is argued about, and who argues which side
 *     measured    this came from your own session, not from anywhere
 *
 * Contested is the one the first version of the design doc left out, and it is
 * the one that matters most later, because the act 3 log makes a
 * contested-science beat a headline feature. The badge carrying the game's most
 * interesting claim had nowhere to go.
 *
 * ---------------------------------------------------------------------------
 * THE INTERACTION IS Overlay's, NOT A SECOND COPY OF IT
 * ---------------------------------------------------------------------------
 *
 * Opens from the affordance, dismissible, Escape closes it, focus moves in on
 * open and returns to whatever opened it on close, and it does not take focus
 * unless the player asked for it, because it does not exist until they do.
 * `Overlay.tsx` has held all of that since V7 stage 3 and every part of it was
 * repairing something measured on the real page. Reimplementing it here would be
 * a second definition of the same behaviour and the two would drift.
 */

import { Button } from './Button';
import { Card } from './Card';
import { Overlay } from './Overlay';
import { PROVENANCE, type Provenance } from '../content';

export function ProvenancePanel({
  content,
  onDismiss,
}: {
  content: Provenance;
  onDismiss: () => void;
}) {
  return (
    <Overlay onDismiss={onDismiss} label={content.heading} dim>
      <Card surface={content.kind === 'contested' ? 'lilac' : 'white'} className="flex max-w-[54ch] flex-col gap-3 p-4">
        <span className="font-display font-semibold text-h2 leading-tight">{content.heading}</span>

        {/*
          THE DESTINATION ROW, AND IT IS THE FEATURE. A Sourced figure names its
          Part. A Tuned figure names its row, or says it has none and why.
          A measured value names nowhere, because there is nowhere.
        */}
        {content.destination.length === 0 ? null : (
          <span className="font-body text-body font-black text-ink">{content.destination}</span>
        )}

        {content.body.map((paragraph) => (
          <p
            key={paragraph.slice(0, 24)}
            className="font-body text-body font-bold leading-snug text-ink"
          >
            {paragraph}
          </p>
        ))}

        <Button surface="white" className="self-start" onClick={onDismiss}>
          {PROVENANCE.close.text}
        </Button>
      </Card>
    </Overlay>
  );
}
