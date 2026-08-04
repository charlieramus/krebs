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

import { Figure } from './Figure';
import { Badge, type BadgeSpec } from './Badge';
import { Button } from './Button';
import { ABOUT, READOUTS } from '../content';
import { poolIndex, type Act1Snapshot } from '../runtime';

const ATP = poolIndex('atp');
const GLUCOSE = poolIndex('glucose');

const readAtpPerSecond = (snapshot: Act1Snapshot): number => snapshot.production[ATP] as number;
const readGlucosePerSecond = (snapshot: Act1Snapshot): number =>
  snapshot.production[GLUCOSE] as number;

/**
 * Elapsed game time in minutes, one decimal.
 *
 * Minutes rather than a clock face, because a clock face needs a zero-padded
 * seconds field and a padded field is a second numeric format living outside
 * Figure. docs/PROGRESSION.md gives act 1 a duration of 45 to 90 minutes, so
 * minutes is also the unit the pacing is actually specified in.
 */
const readElapsedMinutes = (snapshot: Act1Snapshot): number => snapshot.elapsedMs / 60000;

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
  read: (snapshot: Act1Snapshot) => number;
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
  return (
    <header className="flex flex-wrap items-end justify-between gap-6 px-8 py-4">
      {/* A div rather than a span, because an h1 inside a span is invalid
          nesting and the browser will happily render it while a validator will
          not. */}
      <div className="flex items-baseline gap-3">
        {/* DESIGN.md: wordmark, Fredoka 600, tracking -0.03em. The weight is
            explicit because Tailwind's preflight resets h1 to inherit, which on
            a variable face silently renders 400. */}
        <h1 className="font-display font-semibold text-wordmark tracking-wordmark leading-none text-ink">
          krebs
        </h1>

        {/* The permanent way back to the first run and the disclosure. It is in
            the top bar rather than the footer because DESIGN.md's layout gives
            the top bar the things that are always visible, and a footer under
            eight pool cards and a pathway is not. UPDATELOGV6.md stage 3. */}
        <Button surface="white" className="px-3 py-1 text-label" onClick={onOpenAbout}>
          {ABOUT.open.text}
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-8">
        <Headline
          label={READOUTS.atpRate.text}
          badge={READOUTS.atpRate.badge}
          read={readAtpPerSecond}
          unit="/s"
          colour="text-atp"
        />
        <Headline
          label={READOUTS.glucoseRate.text}
          badge={READOUTS.glucoseRate.badge}
          read={readGlucosePerSecond}
          unit="/s"
          colour="text-substrate"
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
