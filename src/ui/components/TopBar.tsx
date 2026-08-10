/**
 * The persistent headline readout. DESIGN.md, Layout: always visible, always
 * ticking.
 *
 * FLUX IS THE HEADLINE AND STOCK IS NOWHERE. DESIGN.md calls this the system's
 * biggest deliberate departure from the genre, which puts stock in the large
 * type because stock is the score. krebs teaches flux, so the rate gets the
 * large type, and this bar carries no stock at all: how much ATP is in the pool
 * is a fact about the adenylate ceiling rather than about how the cell is doing.
 *
 * Both figures are derived from the reaction table through the snapshot rather
 * than written down. ATP per second is the payoff phase's stoichiometric
 * coefficient applied to the flux the tick actually ran, so it goes to zero the
 * moment the NAD+ wall arrives, without anything here knowing what NAD+ is.
 *
 * Every string comes from src/ui/content.ts with its badge. Nothing on this
 * screen is written at the call site.
 */

import { useCallback } from 'react';
import { Figure } from './Figure';
import { Badge, type BadgeSpec } from './Badge';
import { Button } from './Button';
import { ABOUT, LANDMARKS, READOUTS, WORDMARK } from '../content';
import { usePoolIndex } from '../RuntimeContext';
import { type ActSnapshot } from '../runtime';

/**
 * Elapsed game time in minutes, one decimal.
 *
 * Minutes rather than a clock face, because a clock face needs a zero-padded
 * seconds field and a padded field is a second numeric format living outside
 * Figure. docs/PROGRESSION.md gives act 1 a duration of 45 to 90 minutes, so
 * minutes is also the unit the pacing is actually specified in.
 */
const readElapsedMinutes = (snapshot: ActSnapshot): number => snapshot.elapsedMs / 60000;

function Headline({
  label,
  badge,
  read,
  unit,
  decimals = 2,
  colour = '',
}: {
  label: string;
  badge: BadgeSpec;
  read: (snapshot: ActSnapshot) => number;
  unit: string;
  decimals?: number;
  colour?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="flex items-center gap-1">
        <span className="text-label font-body font-extrabold uppercase tracking-label text-ink2">
          {label}
        </span>
        {/* One badge per readout, carried by the label. The figure below passes
            the same badge with badgeDisplay="attached" so the contract holds
            without drawing the pill twice. */}
        <Badge badge={badge} />
      </span>
      <Figure
        badge={badge}
        badgeDisplay="attached"
        read={read}
        decimals={decimals}
        unit={unit}
        size="headline"
        className={colour}
      />
    </div>
  );
}

export function TopBar({ onOpenAbout }: { onOpenAbout: () => void }) {
  /*
   * THE TWO INDICES ARE RESOLVED ONCE, NOT PER RENDER. They were module-level
   * constants calling a linear scan over act 1's pool ids at import time, which
   * was fast and also the reason this file could only ever show act 1. They come
   * from the running act now, through a memo keyed on the act.
   */
  const atp = usePoolIndex('atp');
  const glucose = usePoolIndex('glucose');
  const readAtpPerSecond = useCallback(
    (snapshot: ActSnapshot): number => snapshot.production[atp] as number,
    [atp],
  );
  const readGlucosePerSecond = useCallback(
    (snapshot: ActSnapshot): number => snapshot.production[glucose] as number,
    [glucose],
  );

  return (
    <header className="flex flex-wrap items-end justify-between gap-6 px-8 py-4">
      {/* A div rather than a span, because an h1 inside a span is invalid
          nesting and the browser will happily render it while a validator will
          not. */}
      <div className="flex items-baseline gap-3">
        {/*
          THE COMPACT SCALE, NOT THE HERO ONE. UPDATELOGV12.md stage 1.

          DESIGN.md, Typography: the hero scale is 60 to 104px and it is a title
          scale. On this bar the wordmark is chrome, a word that never changes,
          and at the hero scale it took a permanent 100px band and was the
          largest thing on screen at all times, next to a number that moves
          twenty times a second. Recorded as wrong on 2026-07-29 and unfixable by
          four logs because it is a design decision rather than a repair.

          The band it gives back is what pays for the timeline. The weight is
          explicit because Tailwind's preflight resets h1 to inherit, which on a
          variable face silently renders 400.
        */}
        <h1 className="font-display font-semibold text-wordmark-compact tracking-wordmark-compact leading-none text-ink">
          {WORDMARK.text}
        </h1>

        {/* The permanent way back to the first run and the disclosure. It is in
            the top bar rather than the footer because DESIGN.md's layout gives
            the top bar the things that are always visible, and a footer under
            eight pool cards and a pathway is not. UPDATELOGV6.md stage 3. */}
        <Button surface="white" className="px-3 py-1 text-label" onClick={onOpenAbout}>
          {ABOUT.open.text}
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-8" role="group" aria-label={LANDMARKS.readouts.text}>
        {/*
          NO COLOUR ON THE FIGURES. UPDATELOGV7.md stage 5.

          These were `text-atp` and `text-substrate` and they are the two worst
          contrast ratios stage 1 found anywhere on the screen: 2.00:1 and
          2.05:1 on the page ground, against a 3:1 floor, on the largest type in
          the game. Neither colour was carrying anything the label beside it was
          not already saying in words.

          It is also what DESIGN.md's own direction asks for. "Illustration can
          be warm, numbers cannot" has been in the Direction section since
          2026-07-28, and a coloured headline figure was warming a number.
        */}
        <Headline
          label={READOUTS.atpRate.text}
          badge={READOUTS.atpRate.badge}
          read={readAtpPerSecond}
          unit="/s"
        />
        <Headline
          label={READOUTS.glucoseRate.text}
          badge={READOUTS.glucoseRate.badge}
          read={readGlucosePerSecond}
          unit="/s"
        />
        <Headline
          label={READOUTS.elapsed.text}
          badge={READOUTS.elapsed.badge}
          read={readElapsedMinutes}
          unit="min"
          decimals={1}
        />
      </div>
    </header>
  );
}
