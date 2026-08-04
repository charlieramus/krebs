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
 * TWO PIECES OF UI STATE LIVE HERE AND NEITHER TOUCHES THE SIMULATION
 * ---------------------------------------------------------------------------
 *
 * Whether the first run is showing and whether the about panel is open. The
 * first is seeded from the save, under `settings`, which docs/SAVE_SCHEMA.md
 * Part 3 defines as presentation that never affects simulation. Reading it once
 * into state rather than on every render is deliberate: the runtime's copy
 * changes the moment the card is dismissed and the card must not vanish before
 * its own click handler has finished.
 */

import { useState } from 'react';
import { RuntimeProvider, useRuntime } from './ui/RuntimeContext';
import { About } from './ui/components/About';
import { FirstRunCard } from './ui/components/FirstRunCard';
import { OverlayOpenProvider } from './ui/components/Overlay';
import { PathwayCard } from './ui/components/PathwayCard';
import { PoolRail } from './ui/components/PoolRail';
import { SavePanel } from './ui/components/SavePanel';
import { UnlockShelf } from './ui/components/UnlockShelf';
import { TopBar } from './ui/components/TopBar';
import { scenarioFromLocation } from './ui/scenario';

function ActScreen() {
  const runtime = useRuntime();
  const [firstRun, setFirstRun] = useState(() => !runtime.firstRunSeen());
  const [about, setAbout] = useState(false);

  function dismissFirstRun() {
    runtime.markFirstRunSeen();
    setFirstRun(false);
  }

  return (
    // The coach mark fires automatically on the NAD+ wall, which arrives about
    // three seconds in, so on a fresh run it would open underneath the first run
    // card and spend its one firing unseen. See Overlay.tsx.
    <OverlayOpenProvider open={firstRun || about}>
      <main className="min-h-screen bg-page text-ink">
        <TopBar onOpenAbout={() => setAbout(true)} />

        {/* DESIGN.md, Layout: a grid column holding a wide pathway SVG must set
            min-width: 0, or the SVG forces the track wider than its container. */}
        <div className="grid grid-cols-1 gap-4 px-8 pb-8 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
          <PoolRail />

          <div className="flex min-w-0 flex-col gap-4">
            <PathwayCard />
            <UnlockShelf />
            <SavePanel />
          </div>
        </div>
      </main>

      {firstRun ? <FirstRunCard onDismiss={dismissFirstRun} /> : null}
      {about ? <About onDismiss={() => setAbout(false)} /> : null}
    </OverlayOpenProvider>
  );
}

export function App() {
  // Development affordance, see src/ui/scenario.ts. With no query string this is
  // an empty object and the player gets the real act.
  const act1 = scenarioFromLocation(typeof window === 'undefined' ? '' : window.location.search);

  return (
    <RuntimeProvider options={{ act1 }}>
      <ActScreen />
    </RuntimeProvider>
  );
}
