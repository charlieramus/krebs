/**
 * Stage 2: the top bar is the first real surface. Everything under it is still
 * the deliberately ugly stage 1 table, and stays that way until stage 4 replaces
 * it with the pool rail.
 *
 * The table's numbers now go through Figure like everything else, which is not a
 * softening of "deliberately ugly". It is the point of the lint rule added in
 * stage 2: there is no carve-out for scaffolding, because scaffolding is exactly
 * where a formatting call would survive long enough to be copied.
 */

import { RuntimeProvider } from './ui/RuntimeContext';
import { Figure } from './ui/components/Figure';
import { TopBar } from './ui/components/TopBar';
import { ACT1_POOL_IDS } from './content/act1/pools';
import { ACT1_REACTION_IDS } from './content/act1/reactions';
import type { Act1Snapshot } from './ui/runtime';

function Row({
  label,
  read,
  decimals = 6,
}: {
  label: string;
  read: (snapshot: Act1Snapshot) => number;
  decimals?: number;
}) {
  return (
    <tr>
      <td className="pr-6">{label}</td>
      <td className="text-right">
        <Figure read={read} decimals={decimals} size="micro" />
      </td>
    </tr>
  );
}

function DevTable() {
  return (
    <section className="px-8 pb-8 font-body text-micro leading-6">
      <p className="mb-4 text-ink2">
        Stage 2. Tokens, primitives and the top bar. Everything below is still the stage 1
        readout.
      </p>

      <table className="mb-6">
        <tbody>
          <tr className="font-extrabold">
            <td className="pr-6">pool</td>
            <td className="pr-6 text-right">amount</td>
            <td className="text-right">short ticks</td>
          </tr>
          {ACT1_POOL_IDS.map((id, i) => (
            <tr key={id}>
              <td className="pr-6">{id}</td>
              <td className="pr-6 text-right">
                <Figure read={(s) => s.amounts[i] as number} decimals={6} size="micro" />
              </td>
              <td className="text-right">
                <Figure read={(s) => s.shortfallTicks[i] as number} decimals={0} size="micro" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className="mb-6">
        <tbody>
          <tr className="font-extrabold">
            <td className="pr-6">reaction</td>
            <td className="pr-6 text-right">flux /s</td>
            <td className="text-right">applied /s</td>
          </tr>
          {ACT1_REACTION_IDS.map((id, r) => (
            <tr key={id}>
              <td className="pr-6">{id}</td>
              <td className="pr-6 text-right">
                <Figure read={(s) => s.flux[r] as number} decimals={6} size="micro" />
              </td>
              <td className="text-right">
                <Figure read={(s) => s.appliedFlux[r] as number} decimals={6} size="micro" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <table>
        <tbody>
          <Row label="atp produced (gross)" read={(s) => s.meter.atpProduced} />
          <Row label="atp spent (prep)" read={(s) => s.meter.atpSpent} />
          <Row label="atp hydrolysed" read={(s) => s.meter.atpMaintained} />
          <Row label="glucose taken up" read={(s) => s.meter.glucoseTakenUp} />
          <Row label="glucose committed" read={(s) => s.meter.glucoseConsumed} />
          <Row label="lactate produced" read={(s) => s.meter.lactateProduced} />
          <Row label="nadh produced" read={(s) => s.meter.nadhProduced} />
          <Row label="atp per glucose (gross)" read={(s) => s.atpPerGlucose} decimals={9} />
          <Row label="atp per glucose (net)" read={(s) => s.netAtpPerGlucose} decimals={9} />
          <Row label="tick count" read={(s) => s.tickCount} decimals={0} />
          <Row label="game ms" read={(s) => s.elapsedMs} decimals={0} />
          <Row label="interpolation" read={(s) => s.interpolation} decimals={4} />
          <Row label="ticks last frame" read={(s) => s.lastTickCount} decimals={0} />
          <Row label="frames" read={(s) => s.frameCount} decimals={0} />
          {/* The backgrounded-tab hole, surfaced rather than fixed. Stage 1 step 3. */}
          <Row label="pending offline ms" read={(s) => s.pendingOfflineMs} decimals={0} />
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

export function App() {
  return (
    <RuntimeProvider>
      <main className="min-h-screen bg-page text-ink">
        <TopBar />
        <DevTable />
      </main>
    </RuntimeProvider>
  );
}
