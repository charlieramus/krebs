/**
 * The badge contract. DESIGN.md, The badge contract.
 *
 * V3 is the first player-facing text this project has ever had, so this is where
 * CLAUDE.md hard rule 1 stops being discipline and becomes mechanism. Three
 * shipping states and one development-only state, applied to every quantitative
 * claim.
 *
 *     Sourced       gain green      a biochemist can check it against docs/SCIENCE.md
 *     Tuned         atp orange      the game chose it for pacing and says so
 *     Contested     lilac           the science is genuinely unsettled
 *     Needs source  yellow, dashed  DEVELOPMENT ONLY, must never reach a release
 *
 * ---------------------------------------------------------------------------
 * THE UNION IS THE CONTRACT
 * ---------------------------------------------------------------------------
 *
 * A discriminated union rather than a string, so the source row cannot be
 * omitted. `Sourced` and `Contested` do not typecheck without a document
 * reference. `Tuned` does not typecheck without a reason. `Needs source`
 * requires nothing, which is exactly the point of it: it is what an author
 * reaches for when they have nothing, and it is loud.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS FILE NEVER WRITES THE STRING "needs-source"
 * ---------------------------------------------------------------------------
 *
 * The release gate in vite/needsSourceGate.ts fails a production build if that
 * literal survives into an emitted chunk. That only works if the literal reaches
 * the bundle from a CALL SITE and never from here. So:
 *
 *   - the union member is a type, and types are erased at compile time
 *   - there is no lookup table keyed by badge kind, because object keys are
 *     strings and survive minification
 *   - the branch that renders it is guarded by import.meta.env.DEV, which Vite
 *     replaces with `false` in production, so the branch and everything in it
 *     is dead code and gets dropped
 *   - there is deliberately NO `needsSource()` factory. An author has to write
 *     `{ kind: 'needs-source' }` by hand. The friction is the feature: it is
 *     the one badge you should have to type out.
 */

import { Pill } from './Pill';

export type BadgeSpec =
  /** Traceable to a document. A biochemist can check it. */
  | { readonly kind: 'sourced'; readonly source: string }
  /** The science is genuinely unsettled, and the game says so rather than picking. */
  | { readonly kind: 'contested'; readonly source: string }
  | {
      /** The game chose it for pacing. */
      readonly kind: 'tuned';
      readonly reason: string;
      /**
       * The docs/ECONOMY.md divergence row this value owes.
       *
       * Optional today because docs/ECONOMY.md does not exist: NOW.md is
       * explicit that it needs a playable prototype first and V3 is the log
       * that produces one. The field is shaped now so that filling it in later
       * is an edit rather than a migration, and so that it can be made required
       * in one line once every value has a row.
       */
      readonly divergenceRow?: string;
    }
  /** DEVELOPMENT ONLY. The release gate fails the build if one survives. */
  | { readonly kind: 'needs-source' };

/** Traceable. Pass the document and section, e.g. 'docs/SCIENCE.md Part 2'. */
export function sourced(source: string): BadgeSpec {
  return { kind: 'sourced', source };
}

/** Genuinely unsettled science. Still needs the document that says so. */
export function contested(source: string): BadgeSpec {
  return { kind: 'contested', source };
}

/** Chosen for pacing. The reason is not optional and should say what it bought. */
export function tuned(reason: string): BadgeSpec {
  return { kind: 'tuned', reason };
}

/**
 * The development-only yellow, and the one colour in the interface that is
 * deliberately NOT a design token.
 *
 * DESIGN.md's badge contract calls for yellow and DESIGN.md's palette contains
 * no yellow, which is not an oversight in either direction. `Needs source` must
 * never reach a release build, so it is not part of the shipping palette, and
 * adding it to the token block would both make it look like a system colour and
 * fail the test in designSystem.test.ts that asserts index.css defines exactly
 * the colours DESIGN.md names. It is hardcoded here, it looks alien on purpose,
 * and it is dead code in production.
 */
const DEV_ONLY_YELLOW = '#F5DE3C';

/** The human-readable trace, for the title attribute and the coach mark source row. */
export function badgeTrace(badge: BadgeSpec): string {
  if (badge.kind === 'sourced') return `Sourced: ${badge.source}`;
  if (badge.kind === 'contested') return `Contested: ${badge.source}`;
  if (badge.kind === 'tuned') {
    const row = badge.divergenceRow === undefined ? '' : ` (docs/ECONOMY.md ${badge.divergenceRow})`;
    return `Tuned: ${badge.reason}${row}`;
  }
  return 'UNSOURCED. This must not reach a release build.';
}

export function Badge({ badge, className = '' }: { badge: BadgeSpec; className?: string }) {
  const trace = badgeTrace(badge);

  if (badge.kind === 'sourced') {
    return (
      <Pill background="var(--color-gain)" className={className} title={trace}>
        Sourced
      </Pill>
    );
  }

  if (badge.kind === 'tuned') {
    return (
      <Pill background="var(--color-atp)" className={className} title={trace}>
        Tuned
      </Pill>
    );
  }

  if (badge.kind === 'contested') {
    return (
      <Pill background="var(--color-lilac)" className={className} title={trace}>
        Contested
      </Pill>
    );
  }

  // Reached only by the remaining union member. `badge` is narrowed to it here
  // and is deliberately not read, so the discriminant literal never appears in
  // this file. See the header note.
  if (import.meta.env.DEV) {
    return (
      <Pill background={DEV_ONLY_YELLOW} dashed className={className} title={trace}>
        Needs source
      </Pill>
    );
  }

  // Unreachable in a release build, because the gate fails the build first.
  // Rendering nothing rather than throwing, so that a gate someone has disabled
  // produces a missing badge rather than a white screen.
  return null;
}
