/**
 * Save management. DESIGN.md screen inventory: "export to file, import, backup
 * recovery on failed parse".
 *
 * NO NEW VISUAL VOCABULARY. Card, Button, Figure and Badge, all of them V3's,
 * and nothing here introduces a colour, a radius or a motion value that
 * DESIGN.md does not already name. A save panel that invented its own look would
 * be the first place this system started to fragment, and it is the least
 * interesting screen in the game to spend that on.
 *
 * REACT STATE IS FINE HERE. Everything on this panel changes a handful of times
 * in a session: a save happens, an import fails, a recovery is accepted. That is
 * exactly what React is for, unlike the forty numbers on the rest of the screen
 * that change twenty times a second. The one thing sampled per frame is the last
 * save timestamp, and it compares before it sets.
 *
 * THE PAGE RELOAD after an import or a recovery is deliberate and is not
 * laziness. Both replace the save the running simulation was built from, and
 * rebuilding a live simulation, its meter, its probes and its subscribers
 * underneath the tree is a whole mechanism whose only user would be this button.
 * Writing the file and reloading gets the same result through the load path that
 * is already tested.
 */

import { useState } from 'react';
import { useRuntime, useSnapshotEffect } from '../RuntimeContext';
import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';
import { Figure } from './Figure';
import { SAVE } from '../content';
import { OFFLINE_REPORT_THRESHOLD_MS } from '../tuning';

/** One line of prose with its badge. Every string on this panel is one of these. */
function Line({ entry, className = '' }: { entry: (typeof SAVE)[keyof typeof SAVE]; className?: string }) {
  return (
    <p className={`flex flex-wrap items-center gap-1 text-micro font-body font-semibold ${className}`}>
      <span>{entry.text}</span>
      <Badge badge={entry.badge} />
    </p>
  );
}

/**
 * How long the player was away, in whatever unit does not read as noise.
 *
 * THE BADGE EXEMPTION IN PRACTICE. This is a measured value, from the system
 * clock, about the player's own session. It makes no claim about biology and no
 * claim about the game's tuning, so it carries `measured` rather than a badge.
 * The decision and its boundary are in src/ui/components/Figure.tsx and in
 * DESIGN.md's badge contract.
 */
function AwayFor({ awayMs }: { awayMs: number }) {
  const MINUTE = 60000;
  const HOUR = 3600000;

  if (awayMs < 90 * MINUTE) {
    return (
      <Figure
        value={awayMs / MINUTE}
        decimals={0}
        unit="min"
        size="label"
        measured="real time between the last save and this load, from the system clock"
      />
    );
  }

  return (
    <Figure
      value={awayMs / HOUR}
      decimals={1}
      unit="h"
      size="label"
      measured="real time between the last save and this load, from the system clock"
    />
  );
}

export function SavePanel() {
  const runtime = useRuntime();
  const session = runtime.session;

  /**
   * "There is a save" rather than "this session has written one".
   *
   * A session restored from disk has a save, and reporting "Not saved yet" on
   * the screen a reload just restored is technically true and reads as a
   * failure. Found by reloading the real page.
   */
  const [saved, setSaved] = useState(session.kind === 'loaded' || runtime.lastSave !== null);
  const [importProblem, setImportProblem] = useState<'none' | 'failed' | 'future'>('none');
  const [recoveryOffered, setRecoveryOffered] = useState(session.kind === 'recoverable');

  /**
   * Sampled every frame and set at most once, when the first autosave lands.
   * The comparison is what keeps a per-frame subscription from re-rendering the
   * tree sixty times a second, which is the rule the whole runtime exists to
   * enforce.
   */
  useSnapshotEffect(() => {
    const has = session.kind === 'loaded' || runtime.lastSave !== null;
    setSaved((current) => (current === has ? current : has));
  });

  function exportToFile(): void {
    const text = runtime.exportSave();
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'krebs-save.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importFromFile(file: File): Promise<void> {
    const outcome = runtime.importSave(await file.text());
    if (outcome.kind === 'ok') {
      window.location.reload();
      return;
    }
    setImportProblem(outcome.kind === 'future' ? 'future' : 'failed');
  }

  function acceptRecovery(): void {
    if (runtime.acceptRecovery().kind === 'written') {
      window.location.reload();
      return;
    }
    setRecoveryOffered(false);
  }

  return (
    <Card surface="cream" className="flex min-w-0 flex-col gap-2 p-4">
      <span className="flex items-center gap-2">
        <h2 className="font-display font-semibold text-card-title uppercase tracking-label text-ink2">
          {SAVE.heading.text}
        </h2>
        <Badge badge={SAVE.heading.badge} />
      </span>

      {/* Storage that cannot promise anything. The whole mitigation is saying so. */}
      {session.durable ? null : (
        <Line
          entry={session.nonDurableReason === 'quota' ? SAVE.storageFull : SAVE.storageUnavailable}
        />
      )}

      {/* The offline delta. Kept, not spent, and the wording says both. A
          refresh is a positive delta of a second or two, and announcing it
          every time is noise on the one panel that has to be believed. */}
      {session.awayMs >= OFFLINE_REPORT_THRESHOLD_MS ? (
        <div className="flex flex-col gap-1">
          <span className="flex flex-wrap items-center gap-1">
            <span className="text-micro font-body font-semibold">{SAVE.away.text}</span>
            <AwayFor awayMs={session.awayMs} />
          </span>
          <Line entry={SAVE.awayNotSimulated} className="text-ink2" />
          {session.offlineCapped ? <Line entry={SAVE.awayCapped} className="text-ink2" /> : null}
        </div>
      ) : null}

      {session.clockWentBackwards ? <Line entry={SAVE.clockBackwards} className="text-ink2" /> : null}

      {session.kind === 'future' ? <Line entry={SAVE.future} /> : null}
      {session.kind === 'unreadable' ? <Line entry={SAVE.unreadable} /> : null}

      {recoveryOffered ? (
        <div className="flex flex-col gap-2">
          <Line entry={SAVE.recoveryOffer} />
          <Button surface="pink" onClick={acceptRecovery}>
            {SAVE.recoveryAction.text}
          </Button>
        </div>
      ) : null}

      <Line entry={saved ? SAVE.autosaved : SAVE.neverSaved} className="text-ink2" />

      <div className="flex flex-wrap gap-2">
        <Button surface="white" onClick={exportToFile}>
          {SAVE.exportAction.text}
        </Button>

        {/* A label wrapping a hidden input, rather than a Button that clicks one
            through a ref. The native control is the accessible one and the
            styling is the same class list Button applies. */}
        <label
          className={[
            'bg-white rounded-button border-ink border-solid text-ink',
            'px-4 py-2 font-display font-semibold text-card-title',
            'shadow-hard active:translate-x-[3px] active:translate-y-[3px] active:shadow-none',
            'transition-[transform,box-shadow] cursor-pointer',
          ].join(' ')}
          style={{
            borderWidth: 'var(--outline-card)',
            transitionDuration: 'var(--duration-micro)',
            transitionTimingFunction: 'var(--ease-move)',
          }}
        >
          {SAVE.importAction.text}
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setImportProblem('none');
              if (file !== undefined) void importFromFile(file);
              // Clear it, so importing the same file twice fires twice.
              event.target.value = '';
            }}
          />
        </label>
      </div>

      {importProblem === 'failed' ? <Line entry={SAVE.importFailed} /> : null}
      {importProblem === 'future' ? <Line entry={SAVE.importFuture} /> : null}
    </Card>
  );
}
