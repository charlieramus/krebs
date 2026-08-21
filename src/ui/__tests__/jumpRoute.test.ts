/**
 * Who can reach the jump. UPDATELOGV13.md stage 3.
 *
 * Two properties, and the second is the one docs/PROGRESSION.md cares about.
 *
 *   1. `?jump=N` reaches it, and a jumped state survives a reload including the
 *      unlock ids, which is the bug `?ferment=on` has and this must not
 *   2. NO PLAYER PATH reaches it. Acts are strictly sequential. A skip in the
 *      interface is a product decision nobody has taken, so the guard is that
 *      the jump is imported by exactly one non-test file and rendered by none.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { ACT1 } from '../../content/acts';
import { actStartState } from '../../content/actStart';
import { JUMPED_TO_ACT } from '../../content/actJump';
import { TICK_MS } from '../../sim/constants';
import { hashState } from '../../sim/hash';
import { setShortfallLogging } from '../../sim/tick';
import { createMemoryStore, createSaveStore } from '../../save/storage';
import { createActRuntime } from '../runtime';
import { jumpFromLocation, scenarioFromLocation } from '../scenario';

beforeAll(() => {
  setShortfallLogging(false);
});

const EPOCH = 1785000000000;

describe('the route is the existing development door', () => {
  it('resolves ?jump=1 to act 1 at its beginning', () => {
    const jump = jumpFromLocation('?jump=1');

    expect(jump).not.toBeNull();
    expect(jump?.act).toBe(ACT1);
    expect(hashState(jump?.start.state as never)).toBe(hashState(actStartState(ACT1).state));
  });

  it('returns null for absent, malformed and unknown, without distinguishing them', () => {
    /*
     * All three mean "no jump" and the player gets the real act. There is
     * nowhere to show an error on a door with no interface, and a development
     * affordance that breaks the game for a typo is worse than one that quietly
     * does nothing. Every other parameter in scenario.ts already behaves this
     * way.
     */
    expect(jumpFromLocation('')).toBeNull();
    expect(jumpFromLocation('?glucose=500')).toBeNull();
    expect(jumpFromLocation('?jump=')).toBeNull();
    expect(jumpFromLocation('?jump=banana')).toBeNull();
    expect(jumpFromLocation('?jump=1.5')).toBeNull();
    expect(jumpFromLocation('?jump=on')).toBeNull();
    // A well-formed act number this build does not have. Not clamped to act 1.
    expect(jumpFromLocation('?jump=3')).toBeNull();
    expect(jumpFromLocation('?jump=0')).toBeNull();
    expect(jumpFromLocation('?jump=-1')).toBeNull();
  });

  it('composes with the other parameters rather than one silently winning', () => {
    const search = '?jump=1&glucose=500';
    const create = scenarioFromLocation(search);
    const jump = jumpFromLocation(search, create);
    const envIndex = ACT1.poolIndex('glucose_env');

    expect(jump).not.toBeNull();
    expect(jump?.start.state.pools.amounts[envIndex]).toBe(500);
  });

  it('changes nothing at all for a player who types no query string', () => {
    expect(jumpFromLocation('')).toBeNull();
    expect(scenarioFromLocation('')).toEqual({});
  });
});

describe('a jumped state survives a reload, which is what ?ferment=on does not', () => {
  it('comes back with its pools, its tick count and its unlock ids', () => {
    /*
     * THE RECORDED FLAW THIS MUST NOT REPEAT. `?ferment=on` enables a reaction
     * without minting an unlock id, so a restored save has no `ferment` in
     * `progression.unlocked` and the setting evaporates. Both halves are
     * asserted here: the state comes back, AND the purchase does.
     */
    const backing = createMemoryStore();
    const persistence = () => ({
      store: createSaveStore({ store: backing }),
      epochClock: () => EPOCH,
      startTimer: () => 1,
      stopTimer: () => {},
      listen: () => () => {},
    });

    const jump = jumpFromLocation('?jump=1');
    if (jump === null) throw new Error('?jump=1 did not resolve');

    const first = createActRuntime(jump.act, { jump, persistence: persistence() });
    let nowMs = 0;
    first.frame(nowMs);
    for (let t = 0; t < 2400; t += 1) {
      nowMs += TICK_MS;
      first.frame(nowMs);
    }
    expect(first.buyFerment()).toBe(true);
    first.save();

    const before = hashState(first.state);
    const boughtIds = first.unlocked;
    expect(boughtIds.length).toBeGreaterThan(0);

    // A reload is a runtime with NO query string and no jump option.
    const reloaded = createActRuntime(ACT1, { persistence: persistence() });

    expect(reloaded.session.kind).toBe('loaded');
    expect(hashState(reloaded.state)).toBe(before);
    expect(reloaded.unlocked).toEqual(boughtIds);
    expect(reloaded.snapshot.fermentUnlocked).toBe(true);
    expect(reloaded.jumpedToAct()).toBe(1);
  });
});

/* ===========================================================================
   NO PLAYER PATH
   =========================================================================== */

const SRC = join(__dirname, '..', '..');

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

describe('no player path reaches the jump', () => {
  const files = walk(SRC)
    .map((f) => ({
      path: f.replace(/\\/g, '/'),
      source: readFileSync(f, 'utf8'),
    }))
    .filter((f) => !f.path.includes('__tests__'));

  it('found the source tree, so nothing below is vacuous', () => {
    expect(files.length).toBeGreaterThan(30);
    expect(files.some((f) => f.source.includes('resolveActJump'))).toBe(true);
  });

  it('is wired in exactly one place, and that place is App', () => {
    /*
     * `jumpFromLocation` is the only route into the jump from the interface, and
     * `App.tsx` is the only file allowed to call it. A second caller would mean
     * a second way in, which is the thing this whole section exists to prevent.
     */
    const callers = files
      .filter((f) => !f.path.endsWith('/src/ui/scenario.ts'))
      .filter((f) => f.source.includes('jumpFromLocation'))
      .map((f) => f.path.slice(f.path.indexOf('/src/') + 5));

    expect(callers).toEqual(['App.tsx']);
  });

  it('is resolved in exactly one place, and that place is the development door', () => {
    const callers = files
      .filter((f) => !f.path.endsWith('/src/content/actJump.ts'))
      .filter((f) => f.source.includes('resolveActJump'))
      .map((f) => f.path.slice(f.path.indexOf('/src/') + 5));

    expect(callers).toEqual(['ui/scenario.ts']);
  });

  it('no component mentions the jump at all', () => {
    /*
     * The strongest form. Nothing under `src/ui/components/` may name the jump,
     * the mark or the query parameter, so there is no button, no shelf slot, no
     * menu item and no label. A player cannot find by exploring a thing that no
     * rendered file knows exists.
     */
    const names = ['jumpFromLocation', 'resolveActJump', 'ActJump', JUMPED_TO_ACT];
    const offenders = files
      .filter((f) => f.path.includes('/src/ui/components/'))
      .filter((f) => names.some((name) => f.source.includes(name)))
      .map((f) => f.path.slice(f.path.indexOf('/src/') + 5));

    expect(offenders, 'acts are strictly sequential; see docs/PROGRESSION.md').toEqual([]);
  });

  it('App reads the jump from the URL and never from a control', () => {
    /*
     * `App.tsx` is the one allowed caller, so the question there is not whether
     * it mentions the jump but HOW it gets one. It must come from
     * `window.location.search` and from nothing else: no handler, no state
     * setter, no prop. A jump decided by anything a player can click is the
     * product decision this log refuses to smuggle in.
     */
    const app = files.find((f) => f.path.endsWith('/src/App.tsx'));
    expect(app).toBeDefined();
    const source = app?.source ?? '';

    expect(source).toMatch(/jumpFromLocation\(search/);
    // One call, and it is not inside a callback.
    expect(source.match(/jumpFromLocation\(/g)).toHaveLength(1);
    expect(source).not.toMatch(/onClick[^)]*jump/i);
    expect(source).not.toMatch(/setJump/);
  });
});
