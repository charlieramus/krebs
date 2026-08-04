/**
 * The first run. UPDATELOGV6.md stage 3.
 *
 * ---------------------------------------------------------------------------
 * THIS IS NOT A TUTORIAL AND IT IS ONE SCREEN
 * ---------------------------------------------------------------------------
 *
 * docs/PILLARS.md rule 2 forbids anything that exists to extend session length,
 * and a gated multi-step tutorial in an idle game is usually that. What is
 * needed is smaller and docs/CONTENT_STYLE.md Part 5 sets the ceiling: one
 * screen, three paragraphs, 300 characters of prose, dismissible from that
 * screen. Everything the card says is in src/ui/content.ts as FIRST_RUN.
 *
 * ---------------------------------------------------------------------------
 * THE SIMULATION IS RUNNING WHILE THIS IS ON SCREEN AND YOU CAN WATCH IT
 * ---------------------------------------------------------------------------
 *
 * `Overlay` is undimmed here, so the act screen behind stays lit and stays
 * clickable and the top bar keeps ticking under the card. That is not a
 * cosmetic choice. The first thing this game says about itself should not be a
 * lie about what kind of game it is, and an idle game that pauses for its own
 * introduction has told the player it pauses.
 *
 * ---------------------------------------------------------------------------
 * THE DISCLOSURE IS IN HERE, VERBATIM
 * ---------------------------------------------------------------------------
 *
 * docs/SCIENCE.md Part 1 requires the text "in the about screen and on first
 * launch, not buried in a repo file". This is the on-first-launch half and the
 * about panel is the other. It renders at micro weight below the action because
 * it is a required notice rather than a fourth teaching paragraph, and its words
 * are untouched, because a paraphrase of a required disclosure is not the
 * required disclosure.
 */

import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';
import { Overlay } from './Overlay';
import { DISCLOSURE, FIRST_RUN } from '../content';

export function FirstRunCard({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Overlay onDismiss={onDismiss} label={FIRST_RUN.heading.text}>
      <Card surface="white" className="flex max-w-[46ch] flex-col gap-3 p-4">
        <span className="flex items-center justify-between gap-2">
          <span className="font-display font-semibold text-h2 leading-tight">
            {FIRST_RUN.heading.text}
          </span>
          <Badge badge={FIRST_RUN.heading.badge} />
        </span>

        {FIRST_RUN.body.map((paragraph) => (
          <p
            key={paragraph.text.slice(0, 24)}
            className="flex flex-wrap items-start gap-1 font-body text-body font-bold leading-snug"
          >
            <span>{paragraph.text}</span>
            <Badge badge={paragraph.badge} />
          </p>
        ))}

        <Button surface="mint" className="w-full" onClick={onDismiss}>
          {FIRST_RUN.action.text}
        </Button>

        <p className="flex flex-wrap items-start gap-1 font-body text-micro font-bold leading-6 text-ink2">
          <span>{DISCLOSURE.text}</span>
          <Badge badge={DISCLOSURE.badge} />
        </p>

        {/* The mandatory source row, to the same contract a coach mark has. */}
        <span className="flex items-center gap-1">
          <Badge badge={DISCLOSURE.badge} />
          <span className="text-micro font-body font-bold text-ink2">{FIRST_RUN.source}</span>
        </span>
      </Card>
    </Overlay>
  );
}
