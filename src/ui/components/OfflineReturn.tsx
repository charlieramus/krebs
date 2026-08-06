/**
 * The offline return screen. DESIGN.md's screen inventory, "what happened while
 * away, with the event sequence", open since 2026-07-28 and built by
 * UPDATELOGV8.md stage 6.
 *
 * ---------------------------------------------------------------------------
 * THE SEQUENCE, NOT A TOTAL, AND DESIGN.md ANSWERS WHY
 * ---------------------------------------------------------------------------
 *
 * docs/SIMULATION.md left it open as an open question for the prototype, asking
 * whether an event list would be noise. DESIGN.md's screen inventory answers it:
 * the piecewise steady state algorithm produces a genuine bounded event list, so
 * showing it is both honest and instructive, and it teaches that metabolism is
 * homeostatic between shocks rather than smoothly accumulating. Where two
 * documents disagree the more recent decision wins and it is DESIGN.md's.
 *
 * ---------------------------------------------------------------------------
 * THE SEQUENCE IS COLLAPSED, AND THAT IS THE DESIGN RATHER THAN A SHORTCUT
 * ---------------------------------------------------------------------------
 *
 * A day away produces up to 51 events and most of them are the same pool
 * draining a little further. Forty-nine lines that all say "the environment ran
 * low" is not the event sequence made visible, it is the algorithm's step count
 * made visible, and a player learns nothing about metabolism from it.
 *
 * So consecutive events on the same pool collapse into one row and their
 * durations sum. What is left is the sentence DESIGN.md itself writes as the
 * target: "steady for six hours, glucose ran low, steady again". That is a
 * lossless summary of what CHANGED, which is what an event is, and it is three
 * lines rather than fifty.
 *
 * ---------------------------------------------------------------------------
 * IT HAS TO READ WELL WHEN NOTHING HAPPENED, BECAUSE THAT IS THE COMMON CASE
 * ---------------------------------------------------------------------------
 *
 * Act 1 mostly produces one event or none. The quiet case gets its own line and
 * that line is a claim about cells rather than an apology for a boring screen:
 * a cell that held steady for eight hours did the thing cells do. Designing for
 * the interesting case and letting the boring one fall out as an empty list
 * would make the screen worst exactly where it is seen most.
 *
 * ---------------------------------------------------------------------------
 * WHAT IT INHERITS
 * ---------------------------------------------------------------------------
 *
 * Strings in src/ui/content.ts, V6's rule. Every figure through `Figure` with a
 * badge or a `measured` declaration, V3's rule and the lint that enforces it.
 * Keyboard reachable and focus managed, which `Overlay` does, V7's rule.
 * Nothing carried by colour or motion alone: this is text and numbers.
 *
 * IT IS NOT ALSO ANNOUNCED THROUGH THE LIVE REGION, and that is deliberate.
 * `Announcer.tsx` speaks events because nothing else on the act screen does.
 * This panel takes focus when it opens, so a screen reader reads it where focus
 * lands. Routing it through the live region as well would say the whole thing
 * twice, and V7's rule was that speech announces what is not otherwise
 * reachable rather than everything.
 */

import { TICK_MS } from '../../sim/constants';
import type { OfflineEventRecord } from '../../sim/jump';
import type { ActOfflineReport } from '../runtime';
import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';
import { Figure } from './Figure';
import { Overlay } from './Overlay';
import { MOLECULES, OFFLINE_RETURN } from '../content';
import type { Act1PoolId } from '../../content/act1/pools';

/** A run of steady state, and what ended it. */
interface Run {
  readonly ticks: number;
  /** The pool that ran low, or null when the window simply ended. */
  readonly poolId: Act1PoolId | null;
}

/**
 * Collapse the event list into runs.
 *
 * Consecutive events ending on the same pool are one run. An event that ends
 * because the window ended, or because there was nothing worth jumping to, adds
 * its time to the current run rather than starting a new one, because neither
 * is something that happened to the cell.
 */
export function collapseEvents(
  events: readonly OfflineEventRecord[],
  poolIds: readonly string[],
): Run[] {
  const runs: Run[] = [];
  let ticks = 0;

  for (const event of events) {
    ticks += event.settleTicks + event.jumpTicks;
    if (event.kind !== 'depletion') continue;

    const poolId = (poolIds[event.poolIndex] ?? null) as Act1PoolId | null;
    const previous = runs[runs.length - 1];
    if (previous !== undefined && previous.poolId === poolId) {
      runs[runs.length - 1] = { ticks: previous.ticks + ticks, poolId };
    } else {
      runs.push({ ticks, poolId });
    }
    ticks = 0;
  }

  if (ticks > 0) runs.push({ ticks, poolId: null });
  return runs;
}

/**
 * A duration, in whatever unit does not read as noise.
 *
 * The same shape `SavePanel`'s `AwayFor` uses and for the same reason. Measured
 * rather than badged: it is a fact about this player's own session, it makes no
 * claim about biology and none about the game's tuning. See the badge exemption
 * in Figure.tsx.
 */
function Duration({ ms, measured }: { ms: number; measured: string }) {
  const MINUTE = 60000;
  const HOUR = 3600000;
  if (ms < 90 * MINUTE) {
    return <Figure value={ms / MINUTE} decimals={0} unit="min" measured={measured} />;
  }
  return <Figure value={ms / HOUR} decimals={1} unit="h" measured={measured} />;
}

function Prose({ entry }: { entry: { text: string; badge: Parameters<typeof Badge>[0]['badge'] } }) {
  return (
    <p className="flex flex-wrap items-center gap-1 font-body text-body font-bold leading-snug">
      <span>{entry.text}</span>
      <Badge badge={entry.badge} />
    </p>
  );
}

export function OfflineReturn({
  report,
  onDismiss,
}: {
  report: ActOfflineReport;
  onDismiss: () => void;
}) {
  const runs = collapseEvents(report.events, report.poolIds);
  /** Runs that ended because something ran low. The quiet case has none. */
  const changes = runs.filter((run) => run.poolId !== null);
  const environmentEmptied = changes.some((run) => run.poolId === 'glucose_env');

  return (
    <Overlay onDismiss={onDismiss} label={OFFLINE_RETURN.heading.text} dim>
      <Card surface="white" className="flex max-w-[54ch] flex-col gap-3 p-4">
        <span className="flex items-center justify-between gap-2">
          <span className="font-display font-semibold text-h2 leading-tight">
            {OFFLINE_RETURN.heading.text}
          </span>
          <Badge badge={OFFLINE_RETURN.heading.badge} />
        </span>

        <span className="flex flex-wrap items-center gap-1 font-body text-body font-bold">
          <span>{OFFLINE_RETURN.away.text}</span>
          <Duration ms={report.creditedMs} measured="Game time simulated at load" />
        </span>

        <span className="flex flex-wrap items-center gap-1 font-body text-body font-bold">
          <Figure
            value={report.atpProduced}
            decimals={0}
            badge={OFFLINE_RETURN.made.badge}
            badgeDisplay="attached"
          />
          <span>{OFFLINE_RETURN.made.text}</span>
          <Badge badge={OFFLINE_RETURN.made.badge} />
        </span>

        {changes.length === 0 ? (
          <Prose entry={OFFLINE_RETURN.steady} />
        ) : (
          <div className="flex flex-col gap-2">
            <span className="flex items-center gap-1">
              <span className="font-display font-semibold text-body">
                {OFFLINE_RETURN.sequenceHeading.text}
              </span>
              <Badge badge={OFFLINE_RETURN.sequenceHeading.badge} />
            </span>
            <ul className="flex flex-col gap-1">
              {runs.map((run, index) => (
                <li
                  key={`${String(index)}-${run.poolId ?? 'end'}`}
                  className="flex flex-wrap items-center gap-1 font-body text-body font-bold leading-snug"
                >
                  <span>{OFFLINE_RETURN.steadyFor.text}</span>
                  <Duration ms={run.ticks * TICK_MS} measured="Game time at unchanging rates" />
                  {run.poolId === null ? (
                    <span>{OFFLINE_RETURN.toTheEnd.text}</span>
                  ) : (
                    <>
                      <span>{MOLECULES[run.poolId].text}</span>
                      <span>{OFFLINE_RETURN.thenRanLow.text}</span>
                      <Badge badge={OFFLINE_RETURN.thenRanLow.badge} />
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {environmentEmptied ? <Prose entry={OFFLINE_RETURN.larderEmpty} /> : null}

        {/* The mandatory source row, the same one a coach mark and the teaching
            panel carry. A surface without one does not ship. */}
        <span className="flex items-center gap-1">
          <Badge badge={OFFLINE_RETURN.heading.badge} />
          <span className="text-micro font-body font-bold text-ink2">
            {OFFLINE_RETURN.source}
          </span>
        </span>

        <Button surface="white" className="self-start" onClick={onDismiss}>
          {OFFLINE_RETURN.close.text}
        </Button>
      </Card>
    </Overlay>
  );
}
