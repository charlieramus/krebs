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
 */

import { Figure } from './Figure';
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
  read,
  colour,
}: {
  label: string;
  read: (snapshot: Act1Snapshot) => number;
  colour: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-label font-body font-extrabold uppercase tracking-label text-ink2">
        {label}
      </span>
      <Figure read={read} decimals={2} unit="/s" size="headline" className={colour} />
    </div>
  );
}

export function TopBar() {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6 px-8 py-4">
      {/* DESIGN.md: wordmark, Fredoka 600, tracking -0.03em. The weight is
          explicit because Tailwind's preflight resets h1 to inherit, which on
          a variable face silently renders 400. */}
      <h1 className="font-display font-semibold text-wordmark tracking-wordmark leading-none text-ink">
        krebs
      </h1>

      <div className="flex flex-wrap items-end gap-8">
        <Headline label="ATP" read={readAtpPerSecond} colour="text-atp" />
        <Headline label="Glucose" read={readGlucosePerSecond} colour="text-substrate" />

        <div className="flex flex-col gap-0.5">
          <span className="text-label font-body font-extrabold uppercase tracking-label text-ink2">
            Elapsed
          </span>
          <Figure read={readElapsedMinutes} decimals={1} unit="min" size="headline" />
        </div>
      </div>
    </header>
  );
}
