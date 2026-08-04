/**
 * The overlay shell. DESIGN.md's screen inventory calls the coach mark, the
 * teaching panel and the about surface overlays, and until UPDATELOGV6.md there
 * was exactly one of them and it positioned itself out of its own column.
 *
 * ---------------------------------------------------------------------------
 * AN OVERLAY DOES NOT STOP THE SIMULATION AND THIS ONE MUST NOT LOOK LIKE IT DOES
 * ---------------------------------------------------------------------------
 *
 * The tick loop runs outside React and nothing here touches it, so the cell is
 * alive behind whatever is on top of it. That is a fact about the engine, and
 * `dim` is whether the interface tells the truth about it.
 *
 *     dim = false   no scrim. The screen behind stays lit and stays clickable,
 *                   and the numbers in the top bar keep moving while the card
 *                   is being read. This is the first run: the whole point is
 *                   that the game did not wait.
 *
 *     dim = true    a flat ink scrim at 35 percent. For a surface the player
 *                   opened on purpose and will close again, where the thing
 *                   behind it is not what they are looking at.
 *
 * The scrim is `--color-ink` under an opacity rather than a new colour, because
 * designSystem.test.ts asserts src/index.css defines exactly the colours
 * DESIGN.md names and a scrim is not one of them. No blur, per the same test and
 * the same rule.
 */

import { createContext, useContext, useEffect, type ReactNode } from 'react';

/**
 * Whether some overlay is currently on top of the act screen.
 *
 * WHY THIS EXISTS. The NAD+ wall arrives about three seconds in and the coach
 * mark fires on it automatically, so on a fresh run the mark opens underneath
 * the first run card and spends its one automatic firing on a moment nobody can
 * see it. The mark fires once by design, so a missed firing is a lost firing.
 *
 * Suppressing rather than queueing is what makes it correct without a queue:
 * `walled` stays true until fermentation is bought, so the first snapshot after
 * the card closes still reports it and the mark opens then. If the player buys
 * their way out while the card is open, the mark does not fire, which is right,
 * because there is no longer a wall to explain.
 *
 * Defaults to false, so a component mounted without a provider behaves exactly
 * as it did before this existed. Every existing test relies on that.
 */
const OverlayOpenContext = createContext(false);

export function OverlayOpenProvider({ open, children }: { open: boolean; children: ReactNode }) {
  return <OverlayOpenContext.Provider value={open}>{children}</OverlayOpenContext.Provider>;
}

export function useOverlayOpen(): boolean {
  return useContext(OverlayOpenContext);
}

export function Overlay({
  children,
  onDismiss,
  label,
  dim = false,
}: {
  children: ReactNode;
  onDismiss: () => void;
  /** Names the surface for a screen reader. Comes from src/ui/content.ts. */
  label: string;
  dim?: boolean;
}) {
  // Escape closes it. Cheap, expected, and it is the only way out that does not
  // require finding a control.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDismiss]);

  return (
    <div
      role="dialog"
      aria-modal={dim}
      aria-label={label}
      // `pointer-events-none` on the frame with `pointer-events-auto` on the
      // card is what keeps an undimmed overlay from swallowing clicks meant for
      // the screen behind it. Without it the first run would block the unlock
      // shelf it is sitting over, which is the blocking this stage forbids.
      className={[
        'fixed inset-0 z-30 flex items-center justify-center p-4',
        dim ? '' : 'pointer-events-none',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {dim ? (
        <button
          type="button"
          aria-hidden
          tabIndex={-1}
          onClick={onDismiss}
          className="absolute inset-0 cursor-default bg-ink opacity-35"
        />
      ) : null}

      <div className="pointer-events-auto relative max-h-full overflow-y-auto">{children}</div>
    </div>
  );
}
