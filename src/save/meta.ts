/**
 * The wall clock and the build id. The two things a save carries that the
 * simulation cannot know.
 *
 * WHY THIS FILE EXISTS AT ALL. `Date` and `Date.now` are banned by the ESLint
 * determinism guard in `src/sim/**` and `src/content/**`, because
 * docs/SIMULATION.md Part 5 puts wall-clock time at the loop boundary and
 * nowhere else. `src/save/` is outside that guard, and that carve-out is correct
 * rather than inconvenient: docs/SAVE_SCHEMA.md Part 3 says `lastSavedAt` is the
 * only wall-clock input in the whole system, and something has to read it.
 *
 * Keeping it in one small file means the number of places that read a clock is
 * countable, which is the property the guard is really protecting.
 */

/**
 * Epoch milliseconds. `Date.now`, not `performance.now`.
 *
 * The two clocks are for different jobs and mixing them is the bug this comment
 * exists to prevent. `performance.now` is monotonic and is what src/ui/runtime.ts
 * drives the simulation with, precisely because the system clock can be adjusted
 * underneath a running game. But it is measured from an arbitrary origin that
 * resets when the tab does, so it cannot say how long a player was away. Offline
 * duration needs an absolute reading, which means the system clock, which means
 * accepting that it can move backwards. docs/SAVE_SCHEMA.md Part 3 says what to
 * do when it does: credit zero, do not error.
 */
export function epochNow(): number {
  return Date.now();
}

/**
 * A diagnostic string identifying the build that wrote a save.
 *
 * docs/SAVE_SCHEMA.md Part 2: "never branched on". It exists so a
 * player-submitted save file says which build produced it, and for nothing else.
 * Branching on it would make it a version field, and there already is one.
 */
export function currentBuildId(): string {
  const env = import.meta.env as Record<string, unknown> | undefined;
  const explicit = env?.['VITE_BUILD_ID'];
  if (typeof explicit === 'string' && explicit.length > 0) return explicit;
  const mode = env?.['MODE'];
  return typeof mode === 'string' ? mode : 'unknown';
}
