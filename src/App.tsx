/**
 * The act 1 screen. DESIGN.md, Layout: top bar, left rail, main, unlock shelf.
 *
 * The stage 1 dev table is gone. The rail says everything it said, and says it
 * with shape and colour rather than with six decimal places.
 *
 * ---------------------------------------------------------------------------
 * THE DISCLOSURE IS NO LONGER A FOOTER AND THAT IS A CORRECTION, NOT A REMOVAL
 * ---------------------------------------------------------------------------
 *
 * docs/SCIENCE.md Part 1 requires the text "in the about screen and on first
 * launch, not buried in a repo file". V3 had neither surface, so it put the
 * paragraph in a permanent footer as a substitute and said so in a comment.
 * UPDATELOGV6.md stage 3 builds both surfaces, so the copy moves rather than
 * duplicates: the first run carries it verbatim on first launch and the about
 * panel carries it verbatim and permanently, one click from the top bar. Both
 * halves of the requirement are now met literally instead of approximately.
 *
 * ---------------------------------------------------------------------------
 * THREE PIECES OF UI STATE LIVE HERE AND NONE OF THEM TOUCHES THE SIMULATION
 * ---------------------------------------------------------------------------
 *
 * Whether the first run is showing, whether the about panel is open and whether
 * the teaching panel is open. The first is seeded from the save, under
 * `settings`, which docs/SAVE_SCHEMA.md Part 3 defines as presentation that
 * never affects simulation. Reading it once into state rather than on every
 * render is deliberate: the runtime's copy changes the moment the card is
 * dismissed and the card must not vanish before its own click handler has run.
 *
 * The teaching panel is owned here rather than by either of the two things that
 * open it, a coach mark inside a pool card and an affordance on the unlock
 * shelf, because they sit in different columns and there is one panel.
 */

import { useRef, useState } from 'react';
import { RuntimeProvider, useRuntime, useSnapshotEffect } from './ui/RuntimeContext';
import { About } from './ui/components/About';
import { Announcer } from './ui/components/Announcer';
import { FirstRunCard } from './ui/components/FirstRunCard';
import { EndOfContent } from './ui/components/EndOfContent';
import { OfflineReturn } from './ui/components/OfflineReturn';
import { OverlayOpenProvider } from './ui/components/Overlay';
import { PathwayCard } from './ui/components/PathwayCard';
import { PoolRail } from './ui/components/PoolRail';
import { SavePanel } from './ui/components/SavePanel';
import { TeachingPanel, TeachingPanelProvider } from './ui/components/TeachingPanel';
import { Timeline } from './ui/components/Timeline';
import { ProvenanceProvider } from './ui/components/ProvenanceContext';
import { ProvenancePanel } from './ui/components/ProvenancePanel';
import { UnlockShelf } from './ui/components/UnlockShelf';
import { TopBar } from './ui/components/TopBar';
import { LANDMARKS, provenanceFor, YIELD_PANEL, type Provenance } from './ui/content';
import { OFFLINE_REPORT_THRESHOLD_MS } from './ui/tuning';
import { jumpFromLocation, scenarioFromLocation } from './ui/scenario';
import type { ActRuntimeOptions } from './ui/runtime';
import type { ActDescriptor } from './content/acts';

function ActScreen() {
  const runtime = useRuntime();
  const [firstRun, setFirstRun] = useState(() => !runtime.firstRunSeen());
  const [about, setAbout] = useState(false);
  const [panel, setPanel] = useState(false);
  /**
   * The offline return, opened once at mount and never again.
   *
   * SAME THRESHOLD THE SAVE PANEL USES, and for the reason DESIGN.md gives for
   * that one: a refresh is a positive offline delta of a second or two, and a
   * panel that announces a non-event on every reload teaches the player to stop
   * reading it. A returning player gets one overlay or none.
   *
   * Seeded from state rather than read every render, the same way the first run
   * is, because the report describes the load and the load happens once.
   */
  const [offlineReturn, setOfflineReturn] = useState(
    () => runtime.session.offline.creditedMs >= OFFLINE_REPORT_THRESHOLD_MS,
  );

  /**
   * THE ACT BOUNDARY, AND ALL FOUR OF THE CASES IT HAS TO SURVIVE.
   * UPDATELOGV11.md stage 4.
   *
   * REACHED IN THE FOREGROUND is the ordinary one: the purchase that completes
   * the act flips `snapshot.actComplete` on the next frame and this opens.
   *
   * REACHED ON THE SAME TICK AS A PURCHASE is the same case and needs nothing,
   * because completing the act IS a purchase. The ref below is what makes it one
   * event rather than one per frame: the subscription runs at frame rate and
   * `setState` on every frame would re-render the tree sixty times a second,
   * which is the one thing the whole runtime exists to prevent.
   *
   * REACHED DURING AN ABSENCE cannot happen, because a purchase is a player
   * action. What the offline path does instead is stop crediting at the point
   * where the last purchase became available, so the player comes back, buys it
   * and sees this live. Watching it beats reading a summary row of it.
   *
   * REACHED WITH AN OVERLAY ALREADY OPEN is handled by not rendering underneath
   * one. `actComplete` stays true, so this opens the moment the other overlay
   * closes rather than stacking on it or being lost.
   */
  const [boundary, setBoundary] = useState(false);
  const boundaryFired = useRef(false);

  /**
   * PROVENANCE ON CLICK. UPDATELOGV12.md stage 4.
   *
   * One panel, owned here for the reason the teaching panel is: the affordance
   * is on every badge in the tree and there is one surface for all of them. It
   * does not exist until the player asks, which is what makes "it does not take
   * focus unless the player asked for it" true by construction rather than by a
   * rule somebody has to remember.
   */
  const [provenance, setProvenance] = useState<Provenance | null>(null);

  useSnapshotEffect((snapshot) => {
    if (boundaryFired.current) return;
    if (!snapshot.actComplete) return;
    boundaryFired.current = true;
    // Seen on a previous session. The flag is persisted for exactly this: the
    // act stays complete forever, so without it this would open on every launch.
    if (runtime.boundarySeen()) return;
    setBoundary(true);
  });

  function dismissBoundary() {
    runtime.markBoundarySeen();
    setBoundary(false);
  }

  function dismissFirstRun() {
    runtime.markFirstRunSeen();
    setFirstRun(false);
  }

  return (
    // The NAD+ coach mark fires automatically on the wall, which arrives about
    // three seconds in, so on a fresh run it would open underneath the first run
    // card and spend its one firing unseen. See Overlay.tsx.
    <OverlayOpenProvider
      open={firstRun || about || panel || offlineReturn || boundary || provenance !== null}
    >
      <ProvenanceProvider onOpen={(badge, measured) => setProvenance(provenanceFor(badge, measured))}>
      <TeachingPanelProvider onOpen={() => setPanel(true)}>
        {/*
          THE TOP BAR IS A SIBLING OF main, NOT A CHILD OF IT. UPDATELOGV7.md
          stage 4. A `<header>` that descends from `<main>` does not get the
          `banner` role, and stage 1 read the tree and found it coming out as a
          plain `sectionheader`, so the three headline readouts could not be
          reached by landmark navigation at all. The page background moved to
          this wrapper, which is the only thing `<main>` was carrying it for.
        */}
        <div className="min-h-screen bg-page text-ink">
          <TopBar onOpenAbout={() => setAbout(true)} />

          <main>
            {/*
              THE SKIP LINK. UPDATELOGV12.md stage 4, and UPDATELOGV7.md stage 3
              step 5 asked for it first.

              V7 declined and was right to: it measured three tab stops in the
              pool rail and called a skip link over three stops more furniture
              than it saves. Provenance-on-click inverts that argument, because
              every badge becomes an affordance and the timeline plus the rail
              are 21 stops before the shelf.

              Hidden until focused, so it costs a sighted pointer user nothing
              and is the first thing a keyboard user meets.
            */}
            <a
              href="#pathway-column"
              className="sr-only focus:not-sr-only focus:mx-8 focus:mb-2 focus:inline-block focus:rounded-button focus:border-ink focus:bg-white focus:px-3 focus:py-1 focus:text-label focus:font-body focus:font-extrabold focus:uppercase focus:tracking-label"
              style={{ borderWidth: 'var(--outline-pill)' }}
            >
              {LANDMARKS.skip.text}
            </a>

            {/*
              THREE COLUMNS, AND THE TIMELINE IS THE FIRST OF THEM.
              UPDATELOGV12.md stage 2 step 4.

              Left to right is where am I, what is happening, why: deep time, the
              pools, the pathway. The timeline is the spine rather than a second
              view, so it is on screen with the act always and it needs a real
              column rather than a strip.

              WHAT GAVE. The wordmark band, decided in stage 1, which was a
              permanent 100px of the largest type in the game spent on a word
              that never changes. Plus one rem off the pool rail, 17 to 16, which
              is the only other thing on this screen that is a fixed width. The
              pathway and the shelf keep every pixel they had, because they are
              the two surfaces that answer what is happening and why.

              Below `lg` everything stacks in one column, as it already did. The
              timeline stays vertical there, because down is older is the whole
              of its reading and a horizontal timeline is a different component.
              Stage 5 owns the narrow end.

              DESIGN.md, Layout: a grid column holding a wide pathway SVG must
              set min-width: 0, or the SVG forces the track wider than its
              container.
            */}
            <div className="grid grid-cols-1 gap-4 px-8 pb-8 lg:grid-cols-[minmax(0,14rem)_minmax(0,16rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,16rem)_minmax(0,17rem)_minmax(0,1fr)]">
              {/* Sticky and height-bounded, so the column scrolls inside itself
                  rather than making the page taller than the act. */}
              {/*
                THE NARROW END, AND IT IS DECIDED BY WHAT THE PLAYER LOSES.
                UPDATELOGV12.md stage 5 step 3.

                The timeline answers where am I. The pool cards answer what is
                happening. The pathway answers why. Below `lg` there is one
                column and only one of the three can be first, so the question is
                which question is asked least often while playing. It is the
                first one: you ask where am I on arrival and occasionally after,
                and you watch the other two.

                So the timeline keeps its place and its form and is capped at
                20rem of its own scroll, which bounds the cost at less than one
                screenful instead of seven card heights. Every stop stays
                reachable, "down is older" survives, and the skip link stage 4
                built jumps straight past it.

                Nothing collapses and nothing is hidden. The pathway, the shelf
                and the save panel keep every pixel they had at every width.
              */}
              <div className="max-h-[20rem] lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)]">
                <Timeline />
              </div>

              <PoolRail />

              <div id="pathway-column" tabIndex={-1} className="flex min-w-0 flex-col gap-4">
                <PathwayCard />
                <UnlockShelf />
                <SavePanel />
              </div>
            </div>
          </main>

          {/* The one live region. Announces events and never the tick. */}
          <Announcer />
        </div>

        {/* The return screen comes first when both could show. A player who has
            been away eight hours has seen the first run already, because the
            first run only shows when there is no save to be away from. */}
        {offlineReturn ? (
          <OfflineReturn
            report={runtime.session.offline}
            onDismiss={() => setOfflineReturn(false)}
          />
        ) : null}
        {firstRun ? <FirstRunCard onDismiss={dismissFirstRun} /> : null}
        {/* Never underneath another overlay. See the four cases above. */}
        {boundary && !offlineReturn && !firstRun && !about && !panel ? (
          <EndOfContent onDismiss={dismissBoundary} />
        ) : null}
        {about ? <About onDismiss={() => setAbout(false)} /> : null}
        {panel ? <TeachingPanel content={YIELD_PANEL} onDismiss={() => setPanel(false)} /> : null}
        {/* Last, so it opens over whatever the player was reading when they
            asked, and Overlay returns focus to the affordance on close. */}
        {provenance === null ? null : (
          <ProvenancePanel content={provenance} onDismiss={() => setProvenance(null)} />
        )}
      </TeachingPanelProvider>
      </ProvenanceProvider>
    </OverlayOpenProvider>
  );
}

export function App() {
  /*
   * Development affordances, see src/ui/scenario.ts. With no query string
   * `create` is an empty object, `jump` is null, and the player gets the real
   * act off their save.
   *
   * RESOLVED ONCE, LAZILY, RATHER THAN PER RENDER. `scenarioFromLocation` parses
   * a query string and is free; `jumpFromLocation` CONSTRUCTS A SIMULATION, so
   * calling it on every render would build and discard an act's worth of pools
   * each time. Same lazy initialiser and the same reason as `RuntimeProvider`'s
   * own: StrictMode renders twice and only one of them may build anything.
   */
  const [provider] = useState((): {
    act?: ActDescriptor;
    options: ActRuntimeOptions;
  } => {
    const search = typeof window === 'undefined' ? '' : window.location.search;
    const create = scenarioFromLocation(search);
    const jump = jumpFromLocation(search, create);

    /*
     * BOTH KEYS OR NEITHER, WHICH IS THE INVARIANT RATHER THAN A TYPE
     * WORKAROUND. `createActRuntime` throws when the jump's act and the
     * descriptor disagree, and building the two props in one branch is what
     * makes that unreachable from here instead of merely unlikely.
     *
     * Omitted rather than set to undefined when there is no jump.
     * `exactOptionalPropertyTypes` is on, so an optional field explicitly set to
     * undefined is a caller saying something about it, and here the caller has
     * nothing to say. With `act` absent, `RuntimeProvider` supplies act 1, which
     * is where that default lives so nothing below it reaches act 1 by accident.
     */
    return jump === null
      ? { options: { create } }
      : { act: jump.act, options: { create, jump } };
  });

  return (
    <RuntimeProvider {...provider}>
      <ActScreen />
    </RuntimeProvider>
  );
}
