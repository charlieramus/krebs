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

import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';

/**
 * Everything inside `root` that a keyboard can reach, in document order.
 *
 * A query rather than a registry, because the overlays' contents are ordinary
 * components that should not have to know they are inside one. `disabled` is
 * excluded by the selector, and the scrim button excludes itself with
 * `tabindex="-1"` for the same reason it is `aria-hidden`: it is a click target
 * for a pointer and it is not a control.
 */
const FOCUSABLE = ['button', '[href]', 'input', 'select', 'textarea', '[tabindex]']
  // The exclusions have to apply to EVERY term, not to a trailing one. The
  // first version put `:not([tabindex="-1"])` only on the generic `[tabindex]`
  // term, so the scrim, which is a button carrying `tabindex="-1"` precisely so
  // it stays out of the tab order, still matched `button` and became the first
  // thing focused when a panel opened. Caught by opening the About panel in a
  // browser and reading what had focus.
  .map((term) => `${term}:not([disabled]):not([tabindex="-1"]):not([aria-hidden="true"])`)
  .join(', ');

function focusable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
}

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
  const frame = useRef<HTMLDivElement>(null);

  /**
   * FOCUS MANAGEMENT. UPDATELOGV7.md stage 3, and every part of it is repairing
   * something stage 1 measured on the real page rather than anticipating a
   * problem.
   *
   * Move focus in. Stage 1 found the About panel open with `document.body`
   * still focused, so a keyboard player opened a panel and stayed outside it,
   * and on a fresh launch the first run card was the EIGHTH tab stop, after
   * every control on the act screen. Focus goes to the first control inside, or
   * to the frame itself if there is none.
   *
   * Trap, but only when this is really modal. `dim` is already what drives
   * `aria-modal`, so the two cannot disagree: a dimmed overlay says the
   * background is inert and now keeps focus out of it, and an undimmed one says
   * the background is live and lets focus leave. Stage 1 found the dimmed
   * panels claiming `aria-modal="true"` while all nine controls behind them
   * were still tabbable, which is worse than no dialog role at all, because
   * assistive technology hides a background the keyboard walks straight into.
   *
   * Return focus on close, to whatever opened it. Without this, dismissing a
   * panel drops the player back to the top of the document.
   *
   * The undimmed first run keeps its promise. It is not trapped, so a player
   * can tab straight past it into the running act screen, which is the whole
   * argument for it not dimming in the first place.
   */
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const root = frame.current;
    if (root !== null) {
      const first = focusable(root)[0];
      if (first !== undefined) first.focus();
      else root.focus();
    }
    return () => {
      // Only if focus is still somewhere in here or nowhere. A player who
      // clicked something on the act screen has already chosen where to be.
      const active = document.activeElement;
      const inside = root !== null && active !== null && root.contains(active);
      if ((inside || active === document.body) && opener?.isConnected === true) opener.focus();
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      // Escape closes it. Cheap, expected, and it is the only way out that does
      // not require finding a control.
      if (event.key === 'Escape') {
        onDismiss();
        return;
      }
      if (event.key !== 'Tab' || !dim) return;

      const root = frame.current;
      if (root === null) return;
      const stops = focusable(root);
      if (stops.length === 0) {
        event.preventDefault();
        root.focus();
        return;
      }
      const first = stops[0] as HTMLElement;
      const last = stops[stops.length - 1] as HTMLElement;
      const active = document.activeElement;
      // Wrap at both ends, and also catch focus that is already outside, which
      // is what happens when the player tabs in from the act screen behind.
      if (event.shiftKey && (active === first || !root.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !root.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDismiss, dim]);

  return (
    <div
      ref={frame}
      // Focusable as a target but never a tab stop, so an overlay with no
      // controls in it still has somewhere to put focus.
      tabIndex={-1}
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
