/**
 * The single irreversible decision in the game cannot be taken while the player
 * is away. UPDATELOGV14.md stage 3 step 6.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS IS A SOURCE-LEVEL GUARD AND NOT A BEHAVIOURAL TEST
 * ---------------------------------------------------------------------------
 *
 * Spine A settled the behaviour and `boundary.test.ts` and `persistence.test.ts`
 * already assert it: an act boundary stops the offline jump, time past that
 * point is dropped rather than deferred, and the authored moment plays live on
 * return. That machinery is act-keyed and gets act 3's boundary for free.
 *
 * What those tests cannot say is that nothing ELSE reaches the transition. A
 * behavioural test proves the paths it drives; it cannot prove the absence of a
 * caller. And the failure here is not a wrong number, it is a player returning
 * from eight hours to find the one decision they could not take back was taken
 * by a background loop. **That is the class of failure worth checking
 * structurally rather than by sampling.**
 *
 * So this file asserts the thing that actually has to be true: the offline path
 * does not import the transition, and neither does the kernel. `takeTransition`
 * is reachable from a player action and from nowhere else.
 *
 * Same posture as V13's unbranched-mark guard and V12's marker source scan,
 * both of which caught things review did not.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ACTS } from '../acts';
import { boundaryFor } from '../../ui/boundary';

const SRC = fileURLToPath(new URL('../../', import.meta.url));

/**
 * Every file the offline path runs through, plus the kernel.
 *
 * Written out rather than globbed. A glob would silently stop covering a file
 * that moved, and the point of the list is that adding a file to the offline
 * path is a deliberate act that has to pass through here.
 */
const MUST_NOT_REACH_THE_TRANSITION: readonly string[] = [
  'sim/jump.ts',
  'sim/tick.ts',
  'sim/loop.ts',
  'sim/steady.ts',
  'save/offline.ts',
  'save/autosave.ts',
  'save/migrations.ts',
];

function read(relative: string): string {
  return readFileSync(join(SRC, relative), 'utf8');
}

/** Every .ts and .tsx file under src/, excluding tests. */
function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === '__tests__') continue;
      sourceFiles(full, out);
    } else if (/\.tsx?$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe('the transition is unreachable from an absence', () => {
  it('is not imported by the offline path or the kernel', () => {
    const offenders: string[] = [];
    for (const relative of MUST_NOT_REACH_THE_TRANSITION) {
      const source = read(relative);
      if (/from\s+'[^']*transition'/.test(source) || /takeTransition|undoTransition/.test(source)) {
        offenders.push(relative);
      }
    }
    expect(
      offenders,
      'A file on the offline path reaches the transition. A player must never return\n' +
        'from an absence to find the one irreversible decision in the game was made for them.',
    ).toEqual([]);
  });

  it('names files that all exist, so the list cannot rot into a list of nothing', () => {
    // A guard whose targets have been renamed away passes by reaching nothing,
    // which is the failure mode `accessibility.test.ts` shipped with for nine
    // logs before Spine A made it walk.
    for (const relative of MUST_NOT_REACH_THE_TRANSITION) {
      expect(() => read(relative), `${relative} is named by this guard and does not exist`).not.toThrow();
    }
  });

  it('has exactly one caller family in the whole tree, and it is not a loop', () => {
    // The other direction. Rather than trusting the list above to be complete,
    // find every file that mentions the transition at all and check the set.
    const mentions: string[] = [];
    for (const file of sourceFiles(SRC)) {
      const source = readFileSync(file, 'utf8');
      if (/takeTransition|undoTransition/.test(source)) {
        mentions.push(file.slice(SRC.length).replace(/\\/g, '/'));
      }
    }

    // Today: the module itself and the content module that authors its text.
    // A stage that wires it into the interface adds a component here, which is
    // a deliberate edit rather than a silent one.
    expect(mentions.sort()).toEqual(['content/transition.ts']);
  });

  it('leaves the act boundary as the thing that stops the credit, unchanged', () => {
    // Spine A's machinery, confirmed against the boundary rather than assumed.
    // `nextContentAtp` is Infinity for a completed act, which is what makes the
    // offline path stop rather than run past an act's content.
    const boundary = boundaryFor(ACTS[0]!);
    const complete = {
      fermentUnlocked: true,
      ethanolUnlocked: true,
      glycogenUnlocked: true,
      pfk1PkBought: true,
      uptakeStep: 99,
      glycolysisStep: 99,
    } as never;

    expect(boundary.isComplete(complete)).toBe(true);
    expect(boundary.nextContentAtp(complete, { atpProduced: 0 } as never)).toBe(
      Number.POSITIVE_INFINITY,
    );
  });
});
