/**
 * The act registry's own shape, and the import direction that makes it safe.
 *
 * Nothing consumes the registry yet. UPDATELOGV11.md stage 1 builds it and
 * stage 2 wires it up, kept apart on purpose: a structural change and a
 * behaviour change in one diff is the one thing this log is not allowed to do.
 * So this file tests the descriptor against act 1's own modules rather than
 * against the runtime, and the runtime is untouched.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { ACT1, ACTS, findAct, knowsAct, KNOWN_ACT_NUMBERS } from '../acts';
import { ACT1_POOL_IDS } from '../act1/pools';
import { ACT1_REACTION_IDS, createAct1 } from '../act1/reactions';
import { hashState } from '../../sim/hash';
import { tick } from '../../sim/tick';

const ROOT = join(import.meta.dirname, '..', '..');

describe('the act registry', () => {
  it('holds exactly one act and says which', () => {
    expect(ACTS).toHaveLength(1);
    expect(KNOWN_ACT_NUMBERS).toEqual([1]);
    expect(ACT1.act).toBe(1);
  });

  it('looks an act up by number', () => {
    expect(findAct(1)).toBe(ACT1);
    expect(knowsAct(1)).toBe(true);
  });

  it('makes the unknown act a real case rather than an undefined', () => {
    // `progression.act` is documented as 1 to 4 and this build knows one of
    // them. Stage 5 turns this null into a refusal; here it only has to be
    // something a caller cannot ignore.
    expect(findAct(2)).toBeNull();
    expect(findAct(0)).toBeNull();
    expect(findAct(4)).toBeNull();
    expect(knowsAct(2)).toBe(false);
  });
});

describe('the act 1 descriptor', () => {
  it('carries act 1 ids in act 1 order', () => {
    expect(ACT1.poolIds).toEqual(ACT1_POOL_IDS);
    expect(ACT1.reactionIds).toEqual(ACT1_REACTION_IDS);
  });

  it('resolves every id to the index the kernel resolves it to', () => {
    const state = ACT1.create();
    for (const id of ACT1.poolIds) {
      expect(ACT1.poolIndex(id)).toBe(state.pools.indexOf(id));
    }
    for (let r = 0; r < ACT1.reactionIds.length; r += 1) {
      expect(ACT1.reactionIndex(ACT1.reactionIds[r] as string)).toBe(r);
    }
  });

  it('returns -1 for an id no act 1 pool or reaction has, matching indexOf', () => {
    expect(ACT1.poolIndex('oxygen')).toBe(-1);
    expect(ACT1.reactionIndex('krebs')).toBe(-1);
  });

  it('constructs the same simulation the act 1 constructor does', () => {
    // Behaviour-preserving is the whole bar for this log, so the descriptor's
    // constructor is asserted against the one it wraps rather than described.
    const viaDescriptor = ACT1.create();
    const direct = createAct1();
    expect(hashState(viaDescriptor)).toBe(hashState(direct));

    for (let t = 0; t < 200; t += 1) {
      tick(viaDescriptor);
      tick(direct);
    }
    expect(hashState(viaDescriptor)).toBe(hashState(direct));
  });

  it('passes construction overrides through by id', () => {
    const state = ACT1.create({ initial: { glucose: 12.5 }, seed: 7 });
    expect(state.pools.get('glucose')).toBe(12.5);
    expect(state.prng.seed).toBe(7);
  });

  it('names the pool its yield correction is measured against', () => {
    expect(ACT1.yieldBaselinePoolId).toBe('g3p');
    expect(ACT1.poolIndex(ACT1.yieldBaselinePoolId)).toBeGreaterThanOrEqual(0);
  });
});

describe('the walled predicate', () => {
  const POOLS = ACT1_POOL_IDS.length;
  const REACTIONS = ACT1_REACTION_IDS.length;
  const STOPPED = 1e-6;

  function reading(nad: number, payoff: number, uptake: number) {
    const amounts = new Float64Array(POOLS);
    const flux = new Float64Array(REACTIONS);
    amounts[ACT1.poolIndex('nad')] = nad;
    flux[ACT1.reactionIndex('payoff')] = payoff;
    flux[ACT1.reactionIndex('uptake')] = uptake;
    return { amounts, flux };
  }

  it('is walled when the payoff phase has stopped, uptake has not, and the carrier is spent', () => {
    const { amounts, flux } = reading(0.01, 0, 1);
    expect(ACT1.isWalled(amounts, flux, STOPPED)).toBe(true);
  });

  it('is not walled when the payoff phase is running', () => {
    const { amounts, flux } = reading(0.01, 1, 1);
    expect(ACT1.isWalled(amounts, flux, STOPPED)).toBe(false);
  });

  it('is not walled when the cell is starved, which is the case the third condition separates', () => {
    // Everything stopped together, including uptake. A starved cell is not a
    // walled one and the whole reason the predicate reads three things is to
    // tell them apart.
    const { amounts, flux } = reading(0.01, 0, 0);
    expect(ACT1.isWalled(amounts, flux, STOPPED)).toBe(false);
  });

  it('is not walled while NAD+ remains, whatever the fluxes are doing', () => {
    const { amounts, flux } = reading(5, 0, 1);
    expect(ACT1.isWalled(amounts, flux, STOPPED)).toBe(false);
  });

  it('holds the threshold the runtime held, to the value it held', () => {
    // WALLED_NAD was 0.05 in src/ui/runtime.ts and moving it must not move it.
    // Asserted as the boundary rather than as a number, because the number is
    // act 1's business and this file is the last place it is quoted.
    expect(ACT1.isWalled(reading(0.049, 0, 1).amounts, reading(0.049, 0, 1).flux, STOPPED)).toBe(
      true,
    );
    expect(ACT1.isWalled(reading(0.05, 0, 1).amounts, reading(0.05, 0, 1).flux, STOPPED)).toBe(
      false,
    );
  });

  it('allocates nothing and reads no key, so the per-frame path can call it', () => {
    // The three indices are resolved at module load. Calling the predicate a
    // hundred thousand times must not build a map, a string or an object, which
    // is asserted here by the shape of the call rather than by a heap reading:
    // the arrays handed in are the same two arrays every time, exactly as the
    // runtime's snapshot arrays are.
    const { amounts, flux } = reading(0.01, 0, 1);
    for (let i = 0; i < 100_000; i += 1) ACT1.isWalled(amounts, flux, STOPPED);
    expect(ACT1.isWalled(amounts, flux, STOPPED)).toBe(true);
  });
});

/**
 * THE ONE RULE, CHECKED RATHER THAN STATED.
 *
 * `src/content/README.md` has said since V2 that content depends on `src/sim/`
 * and never the reverse. Adding a registry is exactly the change that would
 * break it, because a kernel that could look up an act would become act 1's
 * kernel and every later act a special case of act 1.
 */
describe('the import direction', () => {
  function sourcesUnder(dir: string): string[] {
    const out: string[] = [];
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) {
        if (entry === '__tests__') continue;
        out.push(...sourcesUnder(path));
      } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
        out.push(path);
      }
    }
    return out;
  }

  const IMPORT = /from\s+['"]([^'"]+)['"]/g;

  function importsOf(file: string): string[] {
    const source = readFileSync(file, 'utf8');
    const found: string[] = [];
    for (const match of source.matchAll(IMPORT)) found.push(match[1] as string);
    return found;
  }

  it('finds files to check, so a silent zero cannot pass', () => {
    expect(sourcesUnder(join(ROOT, 'sim')).length).toBeGreaterThan(10);
    expect(sourcesUnder(join(ROOT, 'content')).length).toBeGreaterThan(5);
  });

  it('never lets src/sim import content', () => {
    for (const file of sourcesUnder(join(ROOT, 'sim'))) {
      for (const specifier of importsOf(file)) {
        expect(specifier, `${file} imports ${specifier}`).not.toMatch(/content/);
      }
    }
  });

  it('never lets src/sim or src/content import the interface', () => {
    for (const dir of ['sim', 'content']) {
      for (const file of sourcesUnder(join(ROOT, dir))) {
        for (const specifier of importsOf(file)) {
          expect(specifier, `${file} imports ${specifier}`).not.toMatch(/(^|\/)ui(\/|$)/);
        }
      }
    }
  });

  it('lets the registry import the act it registers, which is the direction that is allowed', () => {
    const source = readFileSync(join(ROOT, 'content', 'acts.ts'), 'utf8');
    expect(source).toMatch(/from '\.\/act1\//);
  });
});
