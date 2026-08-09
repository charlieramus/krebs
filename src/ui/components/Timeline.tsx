/**
 * The spine. DESIGN.md, The timeline view.
 *
 * ---------------------------------------------------------------------------
 * IT ANSWERS WHERE AM I AND HOW MUCH IS LEFT, WHICH THE ACT SCREEN CANNOT
 * ---------------------------------------------------------------------------
 *
 * Specified on 2026-07-28, deferred in V3's Decisions section and never
 * rescheduled, which is nine logs of the design working exactly as written with
 * one of its two connective elements removed.
 *
 * Down is older and up is newer, which is stratigraphic: deeper means deposited
 * earlier, and it turns progress into climbing out of deep time rather than
 * sliding along a bar.
 *
 * ---------------------------------------------------------------------------
 * THIS COMPONENT NEVER SEES THE SIMULATION
 * ---------------------------------------------------------------------------
 *
 * No `useLive`, no `useLiveNode`, no `useSnapshotEffect`, no `subscribe`. The
 * only runtime value it reads is `useAct()`, which changes when the act changes
 * and at no other time, so the marker is discrete by construction rather than by
 * discipline.
 *
 * Two reasons and both are load-bearing. A marker that slides with cumulative
 * ATP or elapsed time is a progress bar whatever the art looks like, and
 * `docs/designs/game-spine-and-four-acts.md` is explicit that the timeline is
 * not one. And React never re-renders at tick rate, which is this project's
 * central architectural claim, and this is the largest always-on surface in the
 * game. `timeline.test.tsx` asserts both: the rendered markup is byte-identical
 * across 200000 ticks, and the module names none of the four subscription
 * routes.
 *
 * ---------------------------------------------------------------------------
 * THE UNDATED STOP, WHICH IS THE PART WORTH READING THE CODE FOR
 * ---------------------------------------------------------------------------
 *
 * DESIGN.md, The undated stop, closing open question 5. Two of the seven carry
 * no date, and that is a sourcing result rather than a gap: the ~2.7 Ga
 * photosynthesis figure was removed by a 2015 contamination result and the vent
 * stop is a proposal about a mechanism rather than a dated event.
 *
 * So the treatment substitutes rather than weakens. A word where a figure would
 * be, at the figure's own size. A bracket where a node would be, capped at the
 * bounded end and running off the open end without a cap. And nothing dashed,
 * dimmed or grey anywhere in it, because this system uses those to mean
 * unfinished and these are the two stops where the sourcing was done hardest.
 * The one dashed card on this view is the locked one, which is the contrast the
 * design turns on.
 *
 * THE BRACKET'S LENGTH CARRIES NOTHING, DELIBERATELY. It cannot be drawn to
 * scale, because the thing at its far end is exactly what is not known. It is
 * drawn as a fixed overhang past the next stop and the reading is the missing
 * cap rather than the distance.
 */

import { useId } from 'react';
import { Badge } from './Badge';
import { Card } from './Card';
import { Pill } from './Pill';
import { STOP_FIGURES } from '../art';
import { TIMELINE, TIMELINE_CONTENT, UNDATED_READING, markerReading } from '../content';
import { useAct } from '../RuntimeContext';
import { TIMELINE_STOPS, markerStopId, stopSurface, type TimelineStop } from '../timeline';

/** Where a node, a cap or a marker sits, measured from the top of its row. */
const NODE_TOP = '0.6rem';

function Spine({ stop, here }: { stop: TimelineStop; here: boolean }) {
  const undated = stop.date !== 'dated';

  return (
    <div className="relative w-5 shrink-0" aria-hidden="true">
      {/* The column itself, drawn full height in every row so consecutive rows
          form one continuous rule. */}
      <div
        className="absolute inset-y-0 left-1/2 -translate-x-1/2 bg-ink"
        style={{ width: 'var(--outline-card)' }}
      />

      {undated ? (
        <>
          {/* The cap, at the bounded end. This is the whole of what is known. */}
          <div
            className="absolute left-1/2 h-[3px] w-4 -translate-x-1/2 bg-ink"
            style={{ top: NODE_TOP }}
          />
          {/* The bracket, running off the open end without a cap. Clipped by the
              list's own overflow, which is what draws the running-off. */}
          <div
            className="absolute left-1/2 w-[6px] -translate-x-1/2 bg-ink"
            style={{ top: NODE_TOP, height: '150%' }}
          />
        </>
      ) : here ? (
        /* The marker. A ring rather than a bigger dot, so it reads as a position
           on the column rather than as a heavier stop. The beast goes here in
           stage 3; DESIGN.md gives the marker the beast in its current state. */
        <div
          className="absolute left-1/2 h-[18px] w-[18px] -translate-x-1/2 rounded-pill border-ink bg-white"
          style={{ top: NODE_TOP, borderWidth: 'var(--outline-card)', marginTop: '-4px' }}
        />
      ) : (
        <div
          className="absolute left-1/2 h-3 w-3 -translate-x-1/2 rounded-pill bg-ink"
          style={{ top: NODE_TOP, marginTop: '-1px' }}
        />
      )}
    </div>
  );
}

function Stop({ stop, here }: { stop: TimelineStop; here: boolean }) {
  const content = TIMELINE_CONTENT[stop.id];
  const Figure = STOP_FIGURES[stop.id];
  const locked = stop.locked === true;

  return (
    <li className="relative flex gap-2">
      <div className="w-[4.75rem] shrink-0 pt-1 text-right">
        {/*
          THE DATE COLUMN, AND THE TWO KINDS READ AT THE SAME WEIGHT.
          `unresolved` and `hypothesis` are set in the same face, size and colour
          a real range is set in. No italic, no grey, no brackets. The only
          difference is that one is a number and one is a word, which is the only
          difference there actually is.
        */}
        <span className="block text-micro font-body font-extrabold uppercase tracking-label tabular-nums text-ink">
          {content.date}
        </span>
        {stop.date === 'dated' ? null : (
          <span className="sr-only">{UNDATED_READING[stop.date].text}</span>
        )}
      </div>

      <Spine stop={stop} here={here} />

      <Card
        surface={stopSurface(stop)}
        dashed={locked}
        dimmed={locked}
        className="min-w-0 flex-1 p-2"
      >
        <div className="flex items-start gap-2">
          <span className="shrink-0">
            <Figure size={36} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-card-title font-semibold leading-tight text-ink">
              {content.title}
            </span>
            <span className="mt-0.5 block text-micro font-body font-semibold leading-snug text-ink2">
              {content.note}
            </span>
          </span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <Badge badge={content.badge} />
          {locked ? <Pill className="text-micro">{TIMELINE.locked.text}</Pill> : null}
          {here ? (
            /*
              The accessible name states the reading rather than the legend, which
              is the rule V7 settled. The visible words are inside it, so the
              label is still contained in the name.
            */
            <Pill
              surface="mint"
              className="text-micro"
              aria-label={markerReading(content.title).text}
            >
              {TIMELINE.marker.text}
            </Pill>
          ) : null}
        </div>
      </Card>
    </li>
  );
}

export function Timeline() {
  const act = useAct();
  const here = markerStopId(act.act);
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="flex min-h-0 flex-col gap-2">
      <h2
        id={headingId}
        className="font-display text-card-title font-semibold tracking-h2 text-ink"
      >
        {TIMELINE.heading.text}
      </h2>

      {/*
        Focusable, because it scrolls. A scroll container that is not a tab stop
        is content a keyboard user cannot reach the bottom of, and Firefox does
        not add the tab stop for us. It is labelled by the heading rather than by
        a second string, because two names for one region is two things to drift.
      */}
      <ol
        tabIndex={0}
        aria-labelledby={headingId}
        className="flex min-h-0 flex-col gap-3 overflow-y-auto overflow-x-hidden pr-1"
      >
        {TIMELINE_STOPS.map((stop) => (
          <Stop key={stop.id} stop={stop} here={stop.id === here} />
        ))}
      </ol>

      {/*
        THE AXIS DISCLOSURE, ON THE VIEW. DESIGN.md: all four acts sit between
        roughly 4.0 and 1.5 Ga, so the axis is weighted to the Precambrian, and
        silent compression of a real timescale is the failure mode this project
        exists to avoid.
      */}
      <p className="flex flex-wrap items-center gap-1 text-micro font-body font-semibold leading-snug text-ink2">
        <span>{TIMELINE.axis.text}</span>
        <Badge badge={TIMELINE.axis.badge} />
      </p>
    </section>
  );
}
