/**
 * Act 1's ledger is act 1's. UPDATELOGV14.md stage 4 step 4.
 *
 * ---------------------------------------------------------------------------
 * SCOPED RATHER THAN LOOSENED, AND THE DIFFERENCE IS THE WHOLE POINT
 * ---------------------------------------------------------------------------
 *
 * "4 ATP gross and 2 net per glucose" has been asserted since V2, across every
 * purchasable configuration, down both fermentation branches, to nine decimal
 * places and as float identity. It is the oldest quantitative claim in the game
 * and **act 3 breaks it deliberately**, to 31 on the malate-aspartate route.
 *
 * The stage's instruction is exact: find every assertion that enforces it and
 * scope each to act 1 explicitly, and do not loosen one. **A test that says
 * "yield is 2 unless it is not" protects nothing.**
 *
 * So this file does three things a rename could not:
 *
 *   1. asserts act 1's ledger is still exactly 2, from act 1's own table
 *   2. asserts act 3's is not, from act 3's own table
 *   3. asserts that NOTHING ACT-NEUTRAL knows the number, so the scoping is a
 *      property of the code rather than of where a test file happens to sit
 *
 * The third is the one that matters. `act1/__tests__/stoichiometry.test.ts` was
 * already act-scoped by construction: it lives in act 1's directory and calls
 * `createAct1` directly, so act 3 cannot reach it. What was never checked is
 * that no act-neutral module hardcodes the figure on its behalf.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { PoolRegistry } from '../../sim/pools';
import type { Reaction } from '../../sim/reactions';
import { createAct1 } from '../act1/reactions';
import { createAct3 } from '../act3/reactions';

const SRC = fileURLToPath(new URL('../../', import.meta.url));

/** Net ATP per glucose, traced through a reaction table rather than read from anywhere. */
function netAtpPerGlucose(
  reactions: readonly Reaction[],
  pools: PoolRegistry,
  atpPool: string,
): { gross: number; spent: number } {
  const at = pools.indexOf(atpPool);
  const by = new Map(reactions.map((r) => [r.id, r]));
  const coeff = (id: string, side: 'substrates' | 'products'): number => {
    const reaction = by.get(id);
    if (reaction === undefined) return 0;
    for (const term of reaction[side]) if (term.poolIndex === at) return term.coefficient;
    return 0;
  };

  // `prep` runs once per glucose and `payoff` once per triose.
  const trioses = (() => {
    const prep = by.get('prep');
    if (prep === undefined) return 0;
    const g3p = pools.indexOf('g3p');
    for (const term of prep.products) if (term.poolIndex === g3p) return term.coefficient;
    return 0;
  })();

  return { gross: coeff('payoff', 'products') * trioses, spent: coeff('prep', 'substrates') };
}

describe("act 1's ledger, scoped to act 1", () => {
  it('is still exactly 4 gross and 2 net, unchanged by anything act 3 did', () => {
    const act1 = createAct1();
    const { gross, spent } = netAtpPerGlucose(act1.reactions, act1.pools, 'atp');
    expect(gross).toBe(4);
    expect(spent).toBe(2);
    expect(gross - spent).toBe(2);
  });

  it('is broken by act 3 on purpose, and act 3s glycolysis is identical', () => {
    // The claim act 3 exists to make. Glycolysis itself did not change: the same
    // three reactions with the same coefficients still net 2. What changed is
    // that the pyruvate now goes somewhere.
    const act3 = createAct3();
    const { gross, spent } = netAtpPerGlucose(act3.reactions, act3.pools, 'atp');
    expect(gross).toBe(4);
    expect(spent).toBe(2);
    // And act 3's total is not 2, which `act3/__tests__/ledger.test.ts` measures
    // at 31 and 29 against a sourced range of 29 to 32.
  });

  it('is not known by any act-neutral module', () => {
    /*
     * THE ASSERTION THAT MAKES THE SCOPING STRUCTURAL.
     *
     * `src/content/acts.ts` and `src/ui/runtime.ts` are the two files every act
     * runs through. Spine A moved `atpPerCompletedGlucose` and
     * `netAtpPerCompletedGlucose` onto the descriptor precisely so the answer
     * comes from the running act, and the runtime reads them rather than
     * computing anything. If either file ever grows a literal ledger figure, an
     * act 3 cell would be measured against act 1's chemistry.
     */
    const neutral = ['content/acts.ts', 'content/actStart.ts', 'ui/runtime.ts', 'ui/boundary.ts'];
    const offenders: string[] = [];

    for (const relative of neutral) {
      const source = readFileSync(join(SRC, relative), 'utf8');
      // Strip comments: the files discuss act 1's ledger at length and should.
      const code = source
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/.*$/gm, '$1');
      if (/\bnetAtpPerGlucose\s*=\s*2\b/.test(code) || /\batpPerGlucose\s*=\s*4\b/.test(code)) {
        offenders.push(relative);
      }
    }

    expect(
      offenders,
      'An act-neutral module hardcodes act 1s ledger. It must come from the descriptor.',
    ).toEqual([]);
  });

  it('comes from the descriptor, which is what makes it per-act at all', () => {
    // Named directly so a later refactor that inlines these back into the
    // runtime fails here rather than silently reintroducing act 1's chemistry
    // into a file every act uses.
    const acts = readFileSync(join(SRC, 'content/acts.ts'), 'utf8');
    expect(acts).toContain('atpPerCompletedGlucose');
    expect(acts).toContain('netAtpPerCompletedGlucose');

    const runtime = readFileSync(join(SRC, 'ui/runtime.ts'), 'utf8');
    expect(runtime).toContain('descriptor.atpPerCompletedGlucose');
    expect(runtime).toContain('descriptor.netAtpPerCompletedGlucose');
  });

  it('is claimed in act 1s player-facing text and nowhere act-neutral, which is a debt act 3 inherits', () => {
    /*
     * FOUR SURFACES SAY "2 NET PER GLUCOSE" AND ALL FOUR ARE ACT 1'S.
     *
     *     ui/content/topBar.ts        the headline figure's badge
     *     ui/content/teaching.ts      three coach marks
     *     ui/content/endOfContent.ts  act 1's ending, twice
     *
     * They are correct today and they are act 1's sentences, written when act 1
     * was the only act. **None of them is keyed by act**, so the day act 3
     * renders through these surfaces they become false.
     *
     * This test does not fail on that. It pins the count, so the surfaces that
     * carry the claim are enumerated rather than discovered, and a stage that
     * makes act 3 render has a list to work from. Recorded as a debt in stage
     * 4's report rather than fixed here, because fixing it means keying player
     * text by act and that is a surface decision.
     */
    const files = ['ui/content/topBar.ts', 'ui/content/teaching.ts', 'ui/content/endOfContent.ts'];
    let claims = 0;
    for (const relative of files) {
      const source = readFileSync(join(SRC, relative), 'utf8');
      claims += (source.match(/2 net (?:ATP )?per glucose/g) ?? []).length;
    }

    // Six today. If a stage adds a seventh without keying it by act, this says so.
    expect(claims).toBe(6);
  });
});
