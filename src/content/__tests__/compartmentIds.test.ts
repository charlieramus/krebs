/**
 * The location convention, as a mechanism rather than a paragraph.
 *
 * docs/SAVE_SCHEMA.md Part 3, "The location convention for pool ids", settled by
 * UPDATELOGV14.md stage 1: a pool id ends in a suffix naming where the pool is,
 * and no suffix means the cytosol.
 *
 *     (none)     the cytosol. Every act 1 pool id, unchanged
 *     _env       the environment, outside the cell
 *     _matrix    the mitochondrial matrix
 *     _ims       the intermembrane space
 *     _membrane  in the inner membrane itself
 *
 * WHY THIS FILE EXISTS RATHER THAN A COMMENT. Stage 2 planted a twin-weight
 * disagreement in `src/sim/__tests__/compartment.test.ts` and measured that the
 * conservation property test **cannot be relied on to catch it**. The crossing
 * destroys matter and the downstream reaction creates it back, so the two errors
 * cancel through the pathway and the standing drift is the amount held in the
 * mismatched pool rather than a share of throughput. Run to substrate
 * exhaustion, that pool empties and the books balance exactly with the
 * corruption still in the table. Measured, quoted in that file.
 *
 * So the most valuable invariant in the project has a blind spot exactly where
 * the new naming convention creates a hazard, and the answer is a structural
 * check on the weights rather than a behavioural one on the totals.
 *
 * THE RULE. Two pool ids that differ only by their location suffix are the same
 * substance in two places, and the same substance has the same conserved
 * weights everywhere. `glucose` and `glucose_env` are the pair that exists
 * today, so this guard has real coverage on the day it lands rather than waiting
 * for act 3 to give it something to do.
 *
 * The sibling of this is V12's cross-act check, which asserts that two acts
 * never disagree about a shared pool id. That one holds a pool id to one meaning
 * across acts. This one holds a substance to one meaning across places.
 */

import { describe, expect, it } from 'vitest';
import { ACTS } from '../acts';

/**
 * Every suffix that names a place. Written out rather than pattern matched, for
 * the reason `divergenceTable.test.ts` gives about allowlists: a list a regular
 * expression fills in is a list that grows silently, so a new compartment has to
 * be a deliberate edit here.
 */
const LOCATION_SUFFIXES: readonly string[] = ['_env', '_matrix', '_ims', '_membrane'];

/** The substance half of an id, with any location suffix removed. */
function substanceOf(id: string): string {
  for (const suffix of LOCATION_SUFFIXES) {
    if (id.endsWith(suffix)) return id.slice(0, -suffix.length);
  }
  return id;
}

/** The place half of an id. The empty string is the cytosol and is a real answer. */
function placeOf(id: string): string {
  for (const suffix of LOCATION_SUFFIXES) {
    if (id.endsWith(suffix)) return suffix.slice(1);
  }
  return 'cytosol';
}

interface Twin {
  readonly substance: string;
  readonly ids: readonly string[];
  readonly weights: readonly Readonly<Record<string, number>>[];
}

/** Every substance that exists in more than one place, across every registered act. */
function twins(): readonly Twin[] {
  const bySubstance = new Map<string, { ids: string[]; weights: Record<string, number>[] }>();

  for (const act of ACTS) {
    for (const def of act.poolDefinitions()) {
      const substance = substanceOf(def.id);
      const entry = bySubstance.get(substance) ?? { ids: [], weights: [] };
      // An id shared across two acts is V12's check, not this one.
      if (!entry.ids.includes(def.id)) {
        entry.ids.push(def.id);
        entry.weights.push({ ...def.conserved });
      }
      bySubstance.set(substance, entry);
    }
  }

  const result: Twin[] = [];
  for (const [substance, entry] of bySubstance) {
    if (entry.ids.length > 1) {
      result.push({ substance, ids: entry.ids, weights: entry.weights });
    }
  }
  return result;
}

/** Stable, comparable form of a weight record. Key order must not matter. */
function canonical(weights: Readonly<Record<string, number>>): string {
  return Object.keys(weights)
    .filter((k) => weights[k] !== 0)
    .sort()
    .map((k) => `${k}=${weights[k] as number}`)
    .join(' ');
}

describe('the pool id location convention', () => {
  it('gives every pool id a place, and the place is one of the named ones', () => {
    const named = new Set(['cytosol', ...LOCATION_SUFFIXES.map((s) => s.slice(1))]);
    for (const act of ACTS) {
      for (const def of act.poolDefinitions()) {
        expect(named.has(placeOf(def.id)), `pool "${def.id}" resolves to a named place`).toBe(true);
      }
    }
  });

  it('has real coverage today, and the pair is glucose against glucose_env', () => {
    // A guard that reaches nothing is a guard that passes for the wrong reason.
    // This asserts the guard has work to do before asserting it is satisfied.
    const found = twins();
    expect(found.length).toBeGreaterThan(0);
    expect(found.map((t) => t.substance)).toContain('glucose');
  });

  it('never lets two places disagree about what one substance is', () => {
    const disagreements: string[] = [];

    for (const twin of twins()) {
      const forms = twin.weights.map(canonical);
      const first = forms[0] as string;
      for (let i = 1; i < forms.length; i += 1) {
        if (forms[i] !== first) {
          disagreements.push(
            `"${twin.substance}": ${twin.ids[0] as string} is { ${first} } but ` +
              `${twin.ids[i] as string} is { ${forms[i] as string} }`,
          );
        }
      }
    }

    // The failure this exists to catch is invisible to the conservation test at
    // both ends of a complete run. See the file header.
    expect(disagreements).toEqual([]);
  });

  it('catches a disagreement when one is planted, which is the only proof that counts', () => {
    // The guard reads act descriptors, so the planted case is built here from
    // the same shape rather than by mutating a registered act. What is being
    // proved is the comparison, not the traversal, and the comparison is the
    // part that would silently stop working.
    const corrupted = [
      { id: 'pyruvate', conserved: { carbon: 3 } },
      { id: 'pyruvate_matrix', conserved: { carbon: 2 } },
    ];

    const forms = corrupted.map((d) => canonical(d.conserved));
    expect(substanceOf('pyruvate_matrix')).toBe('pyruvate');
    expect(placeOf('pyruvate_matrix')).toBe('matrix');
    expect(forms[0]).not.toBe(forms[1]);
  });

  it('does not mistake a substance whose name happens to end in a suffix word', () => {
    // `substanceOf` strips on an underscore-prefixed suffix, so a pool called
    // something like "menv" or "membrane_potential" is not accidentally read as
    // a twin of something else. Asserted because a later log adding a pool with
    // an awkward name should fail here rather than silently pair it up.
    expect(substanceOf('nadh')).toBe('nadh');
    expect(substanceOf('glucose_env')).toBe('glucose');
    expect(substanceOf('menv')).toBe('menv');
    expect(placeOf('menv')).toBe('cytosol');
  });
});
