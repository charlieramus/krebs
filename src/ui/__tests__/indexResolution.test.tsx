/**
 * Ids resolve to indices at construction, never on the render path.
 *
 * UPDATELOGV11.md stage 2 step 3. THIS IS THE ONE CLASS OF REGRESSION THE
 * EXISTING SUITE CANNOT CATCH, and the reason is worth stating: every other test
 * in this project asserts a value, and a linear scan produces exactly the same
 * value a map lookup does. `poolIndex` was `ACT1_POOL_IDS.indexOf(id)` called
 * inside `PoolCard`'s render body from V3 to V11 and all 559 tests passed
 * through every one of those logs.
 *
 * The rule is the kernel's and it is older than the defect. `src/sim/pools.ts`
 * freezes an id-to-index map at construction and `src/sim/steady.ts` states it
 * outright: no allocation after construction, indexed loops over typed arrays
 * only. The interface never inherited it.
 *
 * WHAT THIS FILE CAN AND CANNOT HOLD. The test environment is `node` and there
 * is no DOM in it, which is deliberate across this suite. So a mounted tree
 * cannot be re-rendered here and "a re-render resolves nothing" is not directly
 * assertable. What is assertable, and is asserted below, is stronger than it
 * sounds: resolution does no scan and no map construction at all, the per-frame
 * path does not resolve anything, and one mount of the whole rail resolves
 * exactly one index per slot that needs one, computed from the card table rather
 * than written down. A component resolving inside its render body cannot satisfy
 * the third of those without also failing the second on the next frame.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';

import { ACT1, type ActDescriptor } from '../../content/acts';
import { ACT1_POOL_IDS } from '../../content/act1/pools';
import { ACT1_REACTION_IDS } from '../../content/act1/reactions';
import { createActRuntime } from '../runtime';
import { RuntimeProvider } from '../RuntimeContext';
import { PoolRail } from '../components/PoolRail';
import { ACT1_POOL_CARDS, poolCardsFor } from '../poolCards';
import { TICK_MS } from '../../sim/constants';

/* ===========================================================================
   COUNTING WITHOUT A PROFILER

   Two probes. `Array.prototype.indexOf` catches the linear scan this stage
   removed, and `Map` construction catches a map rebuilt per call, which is the
   obvious wrong way to remove a scan. Both are restored in afterEach whatever
   the assertion does.
   =========================================================================== */

const realIndexOf = Array.prototype.indexOf;
const realMapSet = Map.prototype.set;

let scans = 0;
let mapWrites = 0;

function watch(): void {
  scans = 0;
  mapWrites = 0;
  Array.prototype.indexOf = function (this: unknown[], ...args: [unknown, number?]) {
    scans += 1;
    return realIndexOf.apply(this, args as [unknown, number]);
  };
  Map.prototype.set = function (this: Map<unknown, unknown>, key: unknown, value: unknown) {
    mapWrites += 1;
    return realMapSet.call(this, key, value);
  };
}

function unwatch(): void {
  Array.prototype.indexOf = realIndexOf;
  Map.prototype.set = realMapSet;
}

afterEach(unwatch);

/** ACT1, counting every id resolution asked of it. */
function counting(base: ActDescriptor = ACT1): ActDescriptor & { resolutions: () => number } {
  let count = 0;
  return {
    ...base,
    poolIndex(id: string): number {
      count += 1;
      return base.poolIndex(id);
    },
    reactionIndex(id: string): number {
      count += 1;
      return base.reactionIndex(id);
    },
    resolutions: () => count,
  };
}

describe('the map is built once', () => {
  it('resolves a pool id without a scan and without building a map', () => {
    watch();
    for (const id of ACT1_POOL_IDS) ACT1.poolIndex(id);
    for (const id of ACT1_REACTION_IDS) ACT1.reactionIndex(id);
    unwatch();
    expect(scans).toBe(0);
    expect(mapWrites).toBe(0);
  });

  it('does neither across ten thousand resolutions, which is the per-render case', () => {
    watch();
    for (let i = 0; i < 10_000; i += 1) {
      ACT1.poolIndex('atp');
      ACT1.reactionIndex('payoff');
    }
    unwatch();
    expect(scans).toBe(0);
    expect(mapWrites).toBe(0);
  });

  it('catches the implementation this stage replaced, so the probe is not agreeing with itself', () => {
    // The old `poolIndex`, restored here and nowhere else. If this passes with
    // zero scans the probe is broken rather than the code being fast.
    const old = (id: string): number => ACT1_POOL_IDS.indexOf(id as never);
    watch();
    old('atp');
    unwatch();
    expect(scans).toBeGreaterThan(0);
  });

  it('still answers correctly, which is the part a fast wrong map would fail', () => {
    ACT1_POOL_IDS.forEach((id, i) => expect(ACT1.poolIndex(id)).toBe(i));
    ACT1_REACTION_IDS.forEach((id, i) => expect(ACT1.reactionIndex(id)).toBe(i));
  });
});

describe('the per-frame path', () => {
  it('resolves no id and allocates no array across five hundred frames', () => {
    const act = counting();
    const runtime = createActRuntime(act, {
      schedule: () => 0,
      cancel: () => {},
      persistence: { enabled: false },
    });

    // Construction is allowed to resolve. Everything after it is not.
    const atConstruction = act.resolutions();

    const arrays = [
      runtime.snapshot.amounts,
      runtime.snapshot.flux,
      runtime.snapshot.appliedFlux,
      runtime.snapshot.production,
      runtime.snapshot.netRate,
      runtime.snapshot.shortfallTicks,
    ];

    let seen = 0;
    let reallocated = 0;
    runtime.subscribe((snapshot) => {
      seen += 1;
      // The same six arrays every frame. A snapshot that allocated would hand
      // out different objects and this is the cheapest possible way to say so.
      //
      // COUNTED RATHER THAN ASSERTED HERE, because the probes below are live
      // while this runs and `expect` itself scans arrays: an assertion inside
      // the subscriber measured vitest rather than the runtime, at 264 scans a
      // frame. Found by writing it the obvious way first.
      if (
        snapshot.amounts !== arrays[0] ||
        snapshot.flux !== arrays[1] ||
        snapshot.appliedFlux !== arrays[2] ||
        snapshot.production !== arrays[3] ||
        snapshot.netRate !== arrays[4] ||
        snapshot.shortfallTicks !== arrays[5]
      ) {
        reallocated += 1;
      }
    });

    watch();
    for (let f = 0; f < 500; f += 1) runtime.frame(f * TICK_MS);
    unwatch();

    expect(seen).toBe(500);
    expect(reallocated).toBe(0);
    expect(act.resolutions()).toBe(atConstruction);
    expect(scans).toBe(0);
    expect(mapWrites).toBe(0);
  });

  it('runs the walled predicate every frame and it resolves nothing either', () => {
    // `isWalled` closes over three indices resolved at module load, which is why
    // moving WALLED_NAD into the descriptor did not put a lookup on this path.
    const act = counting();
    const runtime = createActRuntime(act, {
      schedule: () => 0,
      cancel: () => {},
      persistence: { enabled: false },
    });
    const before = act.resolutions();
    watch();
    for (let f = 0; f < 200; f += 1) runtime.frame(f * TICK_MS);
    unwatch();
    expect(act.resolutions()).toBe(before);
    expect(scans).toBe(0);
  });
});

describe('the render path', () => {
  /**
   * One resolution per slot that needs one, derived from the card table rather
   * than written down.
   *
   * Each card resolves its headline pool once and each stock line under it once.
   * The one `mix` card resolves two more, for the two halves of the carrier pair
   * its level is drawn from. Change the rail and this expectation changes with
   * it, which is the point: a number typed in here would pass forever.
   */
  function expectedResolutions(): number {
    let total = 0;
    for (const card of ACT1_POOL_CARDS) {
      total += 1 + card.stocks.length;
      if (card.kind === 'mix') total += 2;
    }
    return total;
  }

  it('resolves exactly one index per slot on a mount of the whole rail', () => {
    const act = counting();

    // What building a runtime costs on its own: the yield baseline pool and the
    // three unlock flags on the snapshot. Measured rather than written down,
    // because `RuntimeProvider` builds one during the render below and its cost
    // is not the rail's.
    createActRuntime(act, {
      schedule: () => 0,
      cancel: () => {},
      persistence: { enabled: false },
    });
    const construction = act.resolutions();

    const before = act.resolutions();
    renderToStaticMarkup(
      <RuntimeProvider act={act} options={{ persistence: { enabled: false } }}>
        <PoolRail />
      </RuntimeProvider>,
    );
    expect(act.resolutions() - before).toBe(construction + expectedResolutions());
  });

  it('does no linear scan while rendering the rail', () => {
    watch();
    renderToStaticMarkup(
      <RuntimeProvider options={{ persistence: { enabled: false } }}>
        <PoolRail />
      </RuntimeProvider>,
    );
    const railScans = scans;
    unwatch();
    // React itself scans arrays internally, so this cannot assert zero. What it
    // can assert is that the rail's own resolution does not contribute a scan
    // per pool card, which is what the removed implementation did.
    expect(railScans).toBeLessThan(ACT1_POOL_CARDS.length);
  });

  it('reads the running act rather than importing act 1s list', () => {
    // The rail is act-scoped now. Same cards, reached through the descriptor.
    expect(poolCardsFor(ACT1)).toBe(ACT1_POOL_CARDS);
  });
});
