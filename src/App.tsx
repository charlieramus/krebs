/**
 * Stage 3: the top bar and the leftover stage 1 table, now under the badge
 * contract. The rail replaces the table in stage 4.
 *
 * Every Figure below carries a badge because Figure will not compile without
 * one. The dev table uses `badgeDisplay="attached"` with the badge shown once
 * per column header rather than once per cell, which is the same contract with
 * less noise, and the release gate is unaffected either way.
 */

import { RuntimeProvider } from './ui/RuntimeContext';
import { Badge, sourced, tuned, type BadgeSpec } from './ui/components/Badge';
import { Figure } from './ui/components/Figure';
import { TopBar } from './ui/components/TopBar';
import { DISCLOSURE, MOLECULES, NO_SAVES, REACTIONS } from './ui/content';
import { ACT1_POOL_IDS } from './content/act1/pools';
import { ACT1_REACTION_IDS } from './content/act1/reactions';
import type { Act1Snapshot } from './ui/runtime';

/** Live simulation output. The stoichiometry is sourced, the rates are not. */
const SIMULATION_OUTPUT: BadgeSpec = tuned(
  'Simulation output. Stoichiometry is sourced, every rate and pool size behind it is tuned',
);
/** Diagnostics. A count of ticks is a fact about the engine, not about a cell. */
const ENGINE_DIAGNOSTIC: BadgeSpec = tuned(
  'Engine diagnostic, not a claim about biology. docs/SIMULATION.md Part 6',
);
/** The ledger. This one really is sourced, and it is the point of the table. */
const LEDGER: BadgeSpec = sourced('docs/SCIENCE.md Part 2, 4 ATP gross and 2 net per glucose');

function Row({
  label,
  read,
  badge,
  decimals = 6,
}: {
  label: string;
  read: (snapshot: Act1Snapshot) => number;
  badge: BadgeSpec;
  decimals?: number;
}) {
  return (
    <tr>
      <td className="pr-6">{label}</td>
      <td className="text-right">
        <Figure read={read} decimals={decimals} size="micro" badge={badge} badgeDisplay="attached" />
      </td>
    </tr>
  );
}

function ColumnBadge({ label, badge }: { label: string; badge: BadgeSpec }) {
  return (
    <span className="inline-flex items-center gap-1">
      {label}
      <Badge badge={badge} />
    </span>
  );
}

function DevTable() {
  return (
    <section className="px-8 pb-8 font-body text-micro leading-6">
      <p className="mb-4 text-ink2">
        Stage 3. The badge contract and the release gate. Everything below is still the stage 1
        readout.
      </p>

      <table className="mb-6">
        <tbody>
          <tr className="font-extrabold">
            <td className="pr-6">pool</td>
            <td className="pr-6 text-right">
              <ColumnBadge label="amount" badge={SIMULATION_OUTPUT} />
            </td>
            <td className="text-right">
              <ColumnBadge label="short ticks" badge={ENGINE_DIAGNOSTIC} />
            </td>
          </tr>
          {ACT1_POOL_IDS.map((id, i) => (
            <tr key={id}>
              <td className="pr-6" title={MOLECULES[id].text}>
                {id}
              </td>
              <td className="pr-6 text-right">
                <Figure
                  read={(s) => s.amounts[i] as number}
                  decimals={6}
                  size="micro"
                  badge={SIMULATION_OUTPUT}
                  badgeDisplay="attached"
                />
              </td>
              <td className="text-right">
                <Figure
                  read={(s) => s.shortfallTicks[i] as number}
                  decimals={0}
                  size="micro"
                  badge={ENGINE_DIAGNOSTIC}
                  badgeDisplay="attached"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className="mb-6">
        <tbody>
          <tr className="font-extrabold">
            <td className="pr-6">reaction</td>
            <td className="pr-6 text-right">
              <ColumnBadge label="flux /s" badge={SIMULATION_OUTPUT} />
            </td>
            <td className="text-right">
              <ColumnBadge label="applied /s" badge={SIMULATION_OUTPUT} />
            </td>
          </tr>
          {ACT1_REACTION_IDS.map((id, r) => (
            <tr key={id}>
              <td className="pr-6" title={REACTIONS[id].text}>
                {id}
              </td>
              <td className="pr-6 text-right">
                <Figure
                  read={(s) => s.flux[r] as number}
                  decimals={6}
                  size="micro"
                  badge={SIMULATION_OUTPUT}
                  badgeDisplay="attached"
                />
              </td>
              <td className="text-right">
                <Figure
                  read={(s) => s.appliedFlux[r] as number}
                  decimals={6}
                  size="micro"
                  badge={SIMULATION_OUTPUT}
                  badgeDisplay="attached"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <table>
        <tbody>
          <Row label="atp produced (gross)" read={(s) => s.meter.atpProduced} badge={LEDGER} />
          <Row label="atp spent (prep)" read={(s) => s.meter.atpSpent} badge={LEDGER} />
          <Row
            label="atp hydrolysed"
            read={(s) => s.meter.atpMaintained}
            badge={REACTIONS.maintain.badge}
          />
          <Row
            label="glucose taken up"
            read={(s) => s.meter.glucoseTakenUp}
            badge={REACTIONS.uptake.badge}
          />
          <Row label="glucose committed" read={(s) => s.meter.glucoseConsumed} badge={LEDGER} />
          <Row
            label="lactate produced"
            read={(s) => s.meter.lactateProduced}
            badge={REACTIONS.ferment.badge}
          />
          <Row label="nadh produced" read={(s) => s.meter.nadhProduced} badge={LEDGER} />
          <Row
            label="atp per glucose (gross)"
            read={(s) => s.atpPerGlucose}
            badge={LEDGER}
            decimals={9}
          />
          <Row
            label="atp per glucose (net)"
            read={(s) => s.netAtpPerGlucose}
            badge={LEDGER}
            decimals={9}
          />
          <Row
            label="tick count"
            read={(s) => s.tickCount}
            badge={ENGINE_DIAGNOSTIC}
            decimals={0}
          />
          <Row label="game ms" read={(s) => s.elapsedMs} badge={ENGINE_DIAGNOSTIC} decimals={0} />
          <Row
            label="interpolation"
            read={(s) => s.interpolation}
            badge={ENGINE_DIAGNOSTIC}
            decimals={4}
          />
          <Row
            label="ticks last frame"
            read={(s) => s.lastTickCount}
            badge={ENGINE_DIAGNOSTIC}
            decimals={0}
          />
          <Row label="frames" read={(s) => s.frameCount} badge={ENGINE_DIAGNOSTIC} decimals={0} />
          {/* The backgrounded-tab hole, surfaced rather than fixed. Stage 1 step 3. */}
          <Row
            label="pending offline ms"
            read={(s) => s.pendingOfflineMs}
            badge={ENGINE_DIAGNOSTIC}
            decimals={0}
          />
        </tbody>
      </table>

      <p className="mt-6 max-w-prose text-ink2">
        pending offline ms is game time lost to a backgrounded tab. Nothing in V3 consumes it. V5
        owns the offline path. It is printed here so the hole is visible rather than mistaken for a
        bug in the simulation.
      </p>
    </section>
  );
}

/**
 * docs/SCIENCE.md Part 1 requires the disclosure in-game and says explicitly it
 * must not be buried in a repo file. There is no about screen in the slice, so
 * it goes on the act screen, quoted verbatim.
 */
function Disclosure() {
  return (
    <footer className="max-w-prose px-8 pb-8 font-body text-micro leading-6 text-ink2">
      <p className="mb-2 flex items-center gap-1">
        {NO_SAVES.text}
        <Badge badge={NO_SAVES.badge} />
      </p>
      <p className="flex flex-wrap items-start gap-1">
        <span>{DISCLOSURE.text}</span>
        <Badge badge={DISCLOSURE.badge} />
      </p>
    </footer>
  );
}

export function App() {
  return (
    <RuntimeProvider>
      <main className="min-h-screen bg-page text-ink">
        <TopBar />
        <DevTable />
        <Disclosure />
      </main>
    </RuntimeProvider>
  );
}
