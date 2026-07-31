/**
 * The act 1 screen. DESIGN.md, Layout: top bar, left rail, main, unlock shelf.
 *
 * Stage 4 builds the top bar and the left rail. The main column is stage 5's
 * pathway card and the shelf is stage 6's, so both are placeholders here rather
 * than absent, because a two-column grid that only ever had one column in it
 * would get built as a single column and then have to be rebuilt.
 *
 * The stage 1 dev table is gone. The rail says everything it said, and says it
 * with shape and colour rather than with six decimal places.
 */

import { RuntimeProvider } from './ui/RuntimeContext';
import { Badge } from './ui/components/Badge';
import { PathwayCard } from './ui/components/PathwayCard';
import { PoolRail } from './ui/components/PoolRail';
import { SavePanel } from './ui/components/SavePanel';
import { UnlockShelf } from './ui/components/UnlockShelf';
import { TopBar } from './ui/components/TopBar';
import { DISCLOSURE } from './ui/content';
import { scenarioFromLocation } from './ui/scenario';

/**
 * docs/SCIENCE.md Part 1 requires the disclosure in-game and says explicitly it
 * must not be buried in a repo file. There is no about screen in the slice, so
 * it goes on the act screen, quoted verbatim.
 */
function Disclosure() {
  return (
    <footer className="max-w-prose px-8 pb-8 font-body text-micro leading-6 text-ink2">
      <p className="flex flex-wrap items-start gap-1">
        <span>{DISCLOSURE.text}</span>
        <Badge badge={DISCLOSURE.badge} />
      </p>
    </footer>
  );
}

export function App() {
  // Development affordance, see src/ui/scenario.ts. With no query string this is
  // an empty object and the player gets the real act.
  const act1 = scenarioFromLocation(typeof window === 'undefined' ? '' : window.location.search);

  return (
    <RuntimeProvider options={{ act1 }}>
      <main className="min-h-screen bg-page text-ink">
        <TopBar />

        {/* DESIGN.md line 150: a grid column holding a wide pathway SVG must set
            min-width: 0, or the SVG forces the track wider than its container.
            Applied now rather than in stage 5, when it would be a bug fix. */}
        <div className="grid grid-cols-1 gap-4 px-8 pb-8 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
          <PoolRail />

          <div className="flex min-w-0 flex-col gap-4">
            <PathwayCard />
            <UnlockShelf />
            <SavePanel />
          </div>
        </div>

        <Disclosure />
      </main>
    </RuntimeProvider>
  );
}
