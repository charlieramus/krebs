/**
 * The stage 1 readout. Deliberately ugly.
 *
 * UPDATELOGV3.md stage 1: raw numbers on a white page, no design, no tokens, no
 * illustration. If this file looks good it has done too much. Its only job is to
 * prove the bridge in src/ui/runtime.ts drives the simulation and that the
 * numbers move, so that stage 2 onward is dressing something known to work
 * rather than debugging two things at once.
 *
 * Every cell below is a live subscription writing text into a DOM node. Nothing
 * on this page causes a React render after mount.
 */

import { RuntimeProvider, useLive } from './ui/RuntimeContext';
import { ACT1_POOL_IDS } from './content/act1/pools';
import { ACT1_REACTION_IDS } from './content/act1/reactions';
import type { Act1Snapshot } from './ui/runtime';

function Live({ read }: { read: (snapshot: Act1Snapshot) => string }) {
  const ref = useLive<HTMLSpanElement>(read);
  return <span ref={ref}>-</span>;
}

function Row({ label, read }: { label: string; read: (snapshot: Act1Snapshot) => string }) {
  return (
    <tr>
      <td className="pr-6">{label}</td>
      <td className="text-right tabular-nums">
        <Live read={read} />
      </td>
    </tr>
  );
}

function Readout() {
  return (
    <main className="p-8 font-mono text-xs leading-6">
      <p className="mb-4">krebs, V3 stage 1. Render bridge only. No design yet.</p>

      <table className="mb-6">
        <tbody>
          <tr>
            <td className="pr-6 font-bold">pool</td>
            <td className="pr-6 text-right font-bold">amount</td>
            <td className="text-right font-bold">short ticks</td>
          </tr>
          {ACT1_POOL_IDS.map((id, i) => (
            <tr key={id}>
              <td className="pr-6">{id}</td>
              <td className="pr-6 text-right tabular-nums">
                <Live read={(s) => (s.amounts[i] as number).toFixed(6)} />
              </td>
              <td className="text-right tabular-nums">
                <Live read={(s) => String(s.shortfallTicks[i] as number)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className="mb-6">
        <tbody>
          <tr>
            <td className="pr-6 font-bold">reaction</td>
            <td className="pr-6 text-right font-bold">flux /s</td>
            <td className="text-right font-bold">applied /s</td>
          </tr>
          {ACT1_REACTION_IDS.map((id, r) => (
            <tr key={id}>
              <td className="pr-6">{id}</td>
              <td className="pr-6 text-right tabular-nums">
                <Live read={(s) => (s.flux[r] as number).toFixed(6)} />
              </td>
              <td className="text-right tabular-nums">
                <Live read={(s) => (s.appliedFlux[r] as number).toFixed(6)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <table>
        <tbody>
          <Row label="atp produced (gross)" read={(s) => s.meter.atpProduced.toFixed(6)} />
          <Row label="atp spent (prep)" read={(s) => s.meter.atpSpent.toFixed(6)} />
          <Row label="atp hydrolysed" read={(s) => s.meter.atpMaintained.toFixed(6)} />
          <Row label="glucose taken up" read={(s) => s.meter.glucoseTakenUp.toFixed(6)} />
          <Row label="glucose committed" read={(s) => s.meter.glucoseConsumed.toFixed(6)} />
          <Row label="lactate produced" read={(s) => s.meter.lactateProduced.toFixed(6)} />
          <Row label="nadh produced" read={(s) => s.meter.nadhProduced.toFixed(6)} />
          <Row label="atp per glucose (gross)" read={(s) => s.atpPerGlucose.toFixed(9)} />
          <Row label="atp per glucose (net)" read={(s) => s.netAtpPerGlucose.toFixed(9)} />
          <Row label="tick count" read={(s) => String(s.tickCount)} />
          <Row label="game ms" read={(s) => String(s.elapsedMs)} />
          <Row label="game seconds" read={(s) => (s.elapsedMs / 1000).toFixed(2)} />
          <Row label="interpolation" read={(s) => s.interpolation.toFixed(4)} />
          <Row label="ticks last frame" read={(s) => String(s.lastTickCount)} />
          <Row label="frames" read={(s) => String(s.frameCount)} />
          {/* The backgrounded-tab hole, surfaced rather than fixed. Stage 1 step 3. */}
          <Row label="pending offline ms" read={(s) => String(s.pendingOfflineMs)} />
        </tbody>
      </table>

      <p className="mt-6 max-w-prose">
        pending offline ms is game time lost to a backgrounded tab. Nothing in V3 consumes it. V5
        owns the offline path. It is printed here so the hole is visible rather than mistaken for a
        bug in the simulation.
      </p>
    </main>
  );
}

export function App() {
  return (
    <RuntimeProvider>
      <Readout />
    </RuntimeProvider>
  );
}
