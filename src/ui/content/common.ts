/**
 * What every content file shares. The `Entry` shape, the document references and
 * the one reusable Tuned reason.
 *
 * ---------------------------------------------------------------------------
 * docs/CONTENT_STYLE.md GOVERNS EVERY STRING IN THIS DIRECTORY
 * ---------------------------------------------------------------------------
 *
 * V3 wrote the original file with no voice on purpose, because the document that
 * decides the voice did not exist and inventing a tone before it landed meant
 * rewriting all of it twice. That document exists as of UPDATELOGV6.md stage 1.
 * Voice, person, naming, numbers in prose and a length ceiling per surface are
 * all settled there, and a string that disagrees with it is wrong rather than
 * stylish. The restraint V3 recorded still holds where it applies: molecule
 * names come from src/content/act1/pools.ts and are reused rather than restated,
 * so the interface and the simulation cannot drift into calling the same pool
 * two different things.
 *
 * ---------------------------------------------------------------------------
 * EVERY STRING CARRIES A BADGE, INCLUDING THE ONES WITHOUT NUMBERS
 * ---------------------------------------------------------------------------
 *
 * DESIGN.md applies the badge to every quantitative claim. This directory goes
 * wider and badges every string, because a molecule name and a reaction name are
 * claims too: "Glyceraldehyde 3-phosphate is what the preparatory phase hands to
 * the payoff phase" is checkable, and the badge is where a reader finds out
 * whether anyone checked it. Where a name is really a modeling decision rather
 * than biology, the badge says Tuned and says why, which is the case that would
 * otherwise pass silently.
 *
 * Numbers in strings are rare on purpose. Where one appears it traces to a NAMED
 * SECTION of docs/SCIENCE.md rather than to a line number, because V5 found five
 * line citations that had drifted 42 lines and all five had landed in the wrong
 * Part. docs/CONTENT_STYLE.md Part 1 makes that a rule.
 */

import type { BadgeSpec } from '../components/Badge';

export interface Entry {
  readonly text: string;
  readonly badge: BadgeSpec;
}

/** docs/SCIENCE.md Part 2, glycolysis and the NAD+ constraint. */
export const PART2 = 'docs/SCIENCE.md Part 2';
/** docs/SCIENCE.md Part 1, the disclosed simplifications. */
export const PART1 = 'docs/SCIENCE.md Part 1';

/**
 * The Tuned reason for a string that is a statement about the BUILD rather than
 * about a cell.
 *
 * It was declared once, near the top of the single file, with a comment saying
 * so because a module constant used above its declaration is a temporal dead
 * zone error at import. Eight of the ten surface files use it, which is what
 * makes this file exist at all.
 */
export const ABOUT_THE_BUILD = 'A statement about this build, not about biology';
