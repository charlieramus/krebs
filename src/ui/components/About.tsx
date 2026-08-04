/**
 * The about surface. DESIGN.md's screen inventory: "About, required disclosure
 * text from docs/SCIENCE.md Part 1". Built by UPDATELOGV6.md stage 3.
 *
 * ---------------------------------------------------------------------------
 * A PANEL, NOT A SCREEN, AND THE PRECEDENT IS V4's
 * ---------------------------------------------------------------------------
 *
 * V4 decided save management is a panel rather than a screen, on the grounds
 * that everything it has to say is a handful of lines and two buttons. The same
 * argument applies here with more force: there is no router in this project, an
 * about route would be navigation the player has to find, and everything this
 * surface says fits on one card.
 *
 * ---------------------------------------------------------------------------
 * IT IS ALSO WHERE THE FIRST RUN LIVES PERMANENTLY
 * ---------------------------------------------------------------------------
 *
 * The first run is shown once and must be reachable again afterwards, so it
 * needs somewhere permanent to live. It lives here, and the strings are the same
 * FIRST_RUN entries the opening card renders rather than a second copy of them.
 * A player who dismissed the card without reading it loses nothing.
 *
 * The disclosure is quoted verbatim, which is the "about screen" half of what
 * docs/SCIENCE.md Part 1 requires. The other half is the first run.
 */

import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';
import { Overlay } from './Overlay';
import { ABOUT, DISCLOSURE, FIRST_RUN } from '../content';

export function About({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Overlay onDismiss={onDismiss} label={ABOUT.heading.text} dim>
      <Card surface="white" className="flex max-w-[52ch] flex-col gap-3 p-4">
        <span className="flex items-center justify-between gap-2">
          <span className="font-display font-semibold text-h2 leading-tight">
            {ABOUT.heading.text}
          </span>
          <Badge badge={ABOUT.heading.badge} />
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

        {/* What a badge means. Item 12 of UPDATELOGV6.md's thirteen-item table,
            which was answered nowhere at all, and it is a statement about the
            build so it belongs on the one permanent surface that is about the
            build. */}
        <p className="flex flex-wrap items-start gap-1 font-body text-body font-bold leading-snug">
          <span>{ABOUT.badges.text}</span>
          <Badge badge={ABOUT.badges.badge} />
        </p>

        <p className="flex flex-wrap items-start gap-1 font-body text-micro font-bold leading-6 text-ink2">
          <span>{DISCLOSURE.text}</span>
          <Badge badge={DISCLOSURE.badge} />
        </p>

        <Button surface="white" className="self-start" onClick={onDismiss}>
          {ABOUT.close.text}
        </Button>
      </Card>
    </Overlay>
  );
}
