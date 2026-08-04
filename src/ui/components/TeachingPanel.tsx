/**
 * The teaching panel. DESIGN.md's screen inventory has had it since 2026-07-28
 * as "overlay for concepts too long for a bubble", and UPDATELOGV6.md stage 4 is
 * the first log to build it.
 *
 * ---------------------------------------------------------------------------
 * IT EXISTS BECAUSE THE COACH MARK CEILING IS REAL
 * ---------------------------------------------------------------------------
 *
 * DESIGN.md: "Two paragraphs is a hard ceiling. If a concept needs more, it
 * needs a teaching panel, not a bubble." That ceiling has never bound, because
 * V3 shipped one coach mark and the NAD+ constraint is genuinely one idea. V3
 * also recorded, in CoachMark.tsx, exactly what did not fit: that fermentation
 * buys throughput and buys exactly zero yield. That is what this panel says.
 *
 * ---------------------------------------------------------------------------
 * SAME CONTRACT, LOOSER CEILING, NOT NO CEILING
 * ---------------------------------------------------------------------------
 *
 * Heading with its badge, body, mandatory source row. docs/CONTENT_STYLE.md
 * Part 5 caps it at 6 paragraphs and 1400 characters, and a test asserts it.
 * "Longer than a bubble" is not "unbounded": a concept that will not fit here is
 * two concepts and should be two panels.
 *
 * Dimmed, unlike the first run. A panel is opened deliberately and read, and
 * what is behind it is not what the player is looking at.
 */

import { createContext, useContext, type ReactNode } from 'react';
import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';
import { Overlay } from './Overlay';
import type { TeachingPanel as TeachingPanelContent } from '../content';

/**
 * How anything on the screen asks for the panel.
 *
 * A context rather than prop drilling, because the two things that open it, a
 * coach mark buried inside a pool card and an affordance on the unlock shelf,
 * sit in different columns four components deep, and threading a callback
 * through PoolRail and PoolCard to reach CoachMark would put an argument about
 * the teaching layer into two components that have nothing to do with it.
 *
 * Defaults to a no-op, so a component rendered without a provider behaves as it
 * did before this existed. Every existing test relies on that.
 */
const OpenPanelContext = createContext<() => void>(() => {});

export function TeachingPanelProvider({
  onOpen,
  children,
}: {
  onOpen: () => void;
  children: ReactNode;
}) {
  return <OpenPanelContext.Provider value={onOpen}>{children}</OpenPanelContext.Provider>;
}

export function useOpenTeachingPanel(): () => void {
  return useContext(OpenPanelContext);
}

export function TeachingPanel({
  content,
  onDismiss,
}: {
  content: TeachingPanelContent;
  onDismiss: () => void;
}) {
  return (
    <Overlay onDismiss={onDismiss} label={content.heading.text} dim>
      <Card surface="white" className="flex max-w-[54ch] flex-col gap-3 p-4">
        <span className="flex items-center justify-between gap-2">
          <span className="font-display font-semibold text-h2 leading-tight">
            {content.heading.text}
          </span>
          <Badge badge={content.heading.badge} />
        </span>

        {content.body.map((paragraph) => (
          <p
            key={paragraph.text.slice(0, 24)}
            className="flex flex-wrap items-start gap-1 font-body text-body font-bold leading-snug"
          >
            <span>{paragraph.text}</span>
            <Badge badge={paragraph.badge} />
          </p>
        ))}

        {/* The mandatory source row. A panel without one does not ship, for the
            same reason a coach mark without one does not. */}
        <span className="flex items-center gap-1">
          <Badge badge={content.heading.badge} />
          <span className="text-micro font-body font-bold text-ink2">{content.source}</span>
        </span>

        <Button surface="white" className="self-start" onClick={onDismiss}>
          {content.close.text}
        </Button>
      </Card>
    </Overlay>
  );
}
