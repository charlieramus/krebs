/**
 * The surfaces this log added, checked together. UPDATELOGV12.md stage 5.
 *
 * The rail reading the running act, the viewport story, reduced motion over
 * everything new, the forced-colours substitution, and the one number that says
 * whether the new surfaces are announcing or narrating.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { App } from '../../App';
import { ACT1, ACTS } from '../../content/acts';
import { TICK_MS } from '../../sim/constants';
import { setShortfallLogging } from '../../sim/tick';
import { createActRuntime, type ActRuntime } from '../runtime';
import {
  ACT1_ANNOUNCEMENT_COUNT,
  TRANSITION_ANNOUNCEMENT_COUNT,
  announcementKeys,
} from '../components/Announcer';
import { carbonOf, phosphateOf, poolCardsFor, ACT1_POOL_CARDS } from '../poolCards';
import {
  GLYCOLYSIS_ATP_THRESHOLDS,
  GLYCOLYSIS_STEPS,
  UPTAKE_VMAX_STEPS,
} from '../tuning';

setShortfallLogging(false);

const ROOT = join(import.meta.dirname, '..', '..', '..');
const CSS = readFileSync(join(ROOT, 'src', 'index.css'), 'utf8');
const APP = readFileSync(join(ROOT, 'src', 'App.tsx'), 'utf8');
const SCREEN = renderToStaticMarkup(<App />);

/* ===========================================================================
   STEP 1. THE RAIL READS THE RUNNING ACT.
   =========================================================================== */

describe('the rail reads the running act', () => {
  it('takes its cards from the act rather than importing act 1s list', () => {
    expect(poolCardsFor(ACT1)).toBe(ACT1_POOL_CARDS);
  });

  it('takes its geometry from the act registry rather than from act 1 by name', () => {
    /**
     * THE LAST PLACE IN THE INTERFACE THAT NAMED ACT 1 BY HAND AFTER SPINE A.
     * `poolCards.ts` built its conserved-weight map from `act1PoolDefinitions()`,
     * so illustration rules 1 and 2 would have drawn act 2's molecules with act
     * 1's weights, or with none.
     */
    // Comments stripped, because the file explains the change by naming what it
    // stopped calling.
    const source = readFileSync(join(ROOT, 'src', 'ui', 'poolCards.ts'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1');
    expect(source).not.toContain('act1PoolDefinitions');
    expect(source).toContain('ACTS.flatMap');
    // And it still answers correctly, which a fast wrong map would fail.
    expect(carbonOf('glucose')).toBe(6);
    expect(carbonOf('g3p')).toBe(3);
    expect(phosphateOf('atp')).toBe(3);
  });

  it('lets no two acts disagree about a pool id they share', () => {
    /**
     * The map is one table across every act, because docs/SAVE_SCHEMA.md Part 3
     * makes a pool id permanent contract surface the moment anything ships with
     * it. So a pool id is globally unique and its conserved weights are a
     * property of the pool. This is what fails if that ever stops being true.
     */
    const seen = new Map<string, string>();
    for (const act of ACTS) {
      for (const definition of act.poolDefinitions()) {
        const fingerprint = JSON.stringify(definition.conserved);
        const already = seen.get(definition.id);
        if (already !== undefined) expect({ id: definition.id, fingerprint }).toEqual({
          id: definition.id,
          fingerprint: already,
        });
        seen.set(definition.id, fingerprint);
      }
    }
    expect(seen.size).toBeGreaterThanOrEqual(13);
  });

  it('keeps the carrier pairs on one card each, which is the rule that teaches', () => {
    // The sum is what is conserved and the sum is what teaches. NAD+ draining
    // while NADH fills, on one card, is the wall arriving.
    const mix = ACT1_POOL_CARDS.find((card) => card.kind === 'mix');
    expect(mix?.stocks).toEqual(['nad', 'nadh']);
    const pair = ACT1_POOL_CARDS.find((card) => card.kind === 'pair');
    expect(pair?.stocks).toEqual(['atp', 'adp']);
  });

  it('records the act 3 regrouping as deferred rather than as forgotten', () => {
    const source = readFileSync(join(ROOT, 'src', 'ui', 'poolCards.ts'), 'utf8');
    expect(source).toContain('NOT REGROUPED FOR ACT 3');
    expect(source).toContain('deferred rather than as forgotten');
  });
});

/* ===========================================================================
   STEP 3. THE VIEWPORT.
   =========================================================================== */

describe('the viewport story', () => {
  it('gives the pathway column its width back at every breakpoint', () => {
    // Decided by what the player loses. The pathway answers why and the rail
    // answers what is happening, so neither gives up a pixel it had: what paid
    // for the timeline is the wordmark band and one rem of rail at `lg` only.
    expect(APP).toContain('lg:grid-cols-[minmax(0,14rem)_minmax(0,16rem)_minmax(0,1fr)]');
    expect(APP).toContain('xl:grid-cols-[minmax(0,16rem)_minmax(0,17rem)_minmax(0,1fr)]');
  });

  it('caps the timeline below lg rather than letting it own the first screen', () => {
    // One column below `lg`, and the timeline is first because where am I is the
    // question asked least often while playing. Capped so the cost is bounded at
    // less than a screenful rather than seven card heights.
    expect(APP).toContain('max-h-[20rem] lg:sticky');
  });

  it('hides nothing and collapses nothing at any width', () => {
    // Nothing is removed as width comes down. A surface that disappears at a
    // breakpoint is a surface the player cannot find, and every one of these
    // answers a question.
    for (const utility of ['hidden lg:', 'lg:hidden', 'sm:hidden', 'md:hidden']) {
      expect(APP).not.toContain(utility);
    }
  });
});

/* ===========================================================================
   STEP 4. REDUCED MOTION.
   =========================================================================== */

describe('reduced motion covers everything this log added', () => {
  const NEW_SURFACES = [
    'src/ui/components/Timeline.tsx',
    'src/ui/components/Beast.tsx',
    'src/ui/components/ProvenancePanel.tsx',
  ];

  it.each(NEW_SURFACES)('%s encodes nothing in movement, so there is nothing to reduce', (path) => {
    /**
     * V7's standard is that whatever a surface does in motion it says in a second
     * way when motion is off. The timeline, the beast and the provenance panel
     * satisfy it the strongest way available: they do not move at all. The
     * timeline marker is discrete, the beast never animates on a timer, and the
     * panel is an overlay.
     */
    const source = readFileSync(join(ROOT, path), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1');
    for (const pattern of [
      /@keyframes/,
      /\banimate-\[/,
      /\banimation:/,
      /\btransition-\w/,
      /requestAnimationFrame/,
      /setInterval/,
    ]) {
      expect({ path, hit: pattern.test(source) }).toEqual({ path, hit: false });
    }
  });

  it('leaves the one surface that DOES carry motion carrying it', () => {
    // Guard the guard, and the rule it protects. The pathway arrows animate at a
    // rate proportional to applied flux, and reduced motion swaps them for a
    // static arrow plus an explicit numeric rate rather than simply stopping.
    const arrow = readFileSync(
      join(ROOT, 'src', 'ui', 'components', 'PathwayArrow.tsx'),
      'utf8',
    );
    expect(arrow).toContain('reduced');
    expect(CSS).toContain('prefers-reduced-motion: reduce');
  });
});

/* ===========================================================================
   BLOCKING ITEM 4. FORCED COLOURS.
   =========================================================================== */

describe('under forced colours the shadow becomes a second outline', () => {
  it('switches the shadow off rather than recolouring it', () => {
    // A shadow in a system colour participates in a palette it was never
    // designed against.
    expect(CSS).toContain('forced-colors: active');
    const block = CSS.slice(CSS.indexOf('@media (forced-colors: active)'));
    expect(block).toContain('box-shadow: none');
    expect(block).toContain('border: 2px solid CanvasText');
  });

  it('draws it as a pseudo-element, because outline is spoken for by focus', () => {
    const block = CSS.slice(CSS.indexOf('@media (forced-colors: active)'));
    expect(block).toContain('[data-paper]::after');
    // And it sits OUTSIDE the border while the focus ring sits inside, so a
    // focused card under forced colours reads as separated and focused at once.
    expect(block).toContain('inset: -6px');
    expect(CSS).toContain('outline-offset: -6px');
  });

  it('marks only the cards that actually carry a shadow', () => {
    // A dashed slot has none, so there is nothing to substitute for.
    const card = readFileSync(join(ROOT, 'src', 'ui', 'components', 'Card.tsx'), 'utf8');
    expect(card).toContain('data-paper={dashed ? undefined : \'\'}');
    expect(SCREEN).toContain('data-paper');
  });
});

/* ===========================================================================
   STEP 5. WHAT SPEECH IS TOLD, ACROSS A WHOLE ACT.
   =========================================================================== */

function buyOne(runtime: ActRuntime): boolean {
  return (
    runtime.buyFerment() ||
    runtime.buyUptakeStep() ||
    runtime.buyGlycogen() ||
    runtime.buyEthanol() ||
    runtime.buyPfk1Pk() ||
    runtime.buyGlycolysisStep()
  );
}

/**
 * Every announcement a full act 1 would produce, counted by replaying the
 * Announcer's own event derivation against a real run.
 *
 * Counted rather than read off the constant, because the constant is an upper
 * bound and the question stage 5 asks is what a player actually hears.
 */
function announcementsAcrossAnAct(): { spoken: number; bound: number; actBound: number } {
  const runtime = createActRuntime(ACT1, {
    schedule: () => 0,
    cancel: () => {},
    persistence: { enabled: false },
  });

  const said = new Set<string>();
  let wasWalled = false;

  for (let tick = 0; tick < 70 * 60 * 20; tick += 1) {
    runtime.frame(tick * TICK_MS);
    const snapshot = runtime.snapshot;

    /*
     * THE ANNOUNCER'S OWN DERIVATION, CALLED RATHER THAN REIMPLEMENTED.
     *
     * This block used to be a hand-copied version of `announcementKeys`, which
     * is what the comment above always claimed it was not. UPDATELOGV14.md
     * stage 3 added two keys to the real one and the copy could not see either,
     * so the number this file reports would have stayed at seventeen while the
     * game said nineteen. Recovery is still derived here, because it is the one
     * event that is the ABSENCE of a condition and the component derives it
     * from the same edge outside the function.
     */
    const keys = announcementKeys(snapshot, runtime.canBuyGlycolysisStep(), {
      available: runtime.transitionAvailable(),
      decision: runtime.transitionDecision(),
    });
    if (wasWalled && !snapshot.walled) keys.push('recovered');
    wasWalled = snapshot.walled;

    for (const key of keys) said.add(key);
    if (tick % 20 === 0) buyOne(runtime);
  }

  return {
    spoken: said.size,
    bound: ACT1_ANNOUNCEMENT_COUNT + TRANSITION_ANNOUNCEMENT_COUNT,
    actBound: ACT1_ANNOUNCEMENT_COUNT,
  };
}

describe('the new surfaces announce nothing, which is the whole of the answer', () => {
  const counted = announcementsAcrossAnAct();

  it('reports the count against V8 sixteen', () => {
    console.log(`
  what a screen reader hears across a full act 1

    announcements spoken   ${counted.spoken}
    upper bound            ${counted.bound}
    act 1's own bound      ${counted.actBound}
    V8 measured            16
    added by V11           1   the act boundary
    added by V12           0
    added by V14           2   the arrival, and one of the two outcomes
`);
    expect(counted.spoken).toBeLessThanOrEqual(counted.bound);
    /*
     * THIS RUN NEVER DECIDES, SO ONLY THE ARRIVAL FIRES. The harness plays act 1
     * to completion and buys everything; it does not keep or digest, because
     * neither is reachable without a store and this runtime has persistence
     * disabled. So the expected total is act 1's seventeen plus the arrival, and
     * asserting the exact number rather than a bound is what makes this a
     * measurement instead of a ceiling nobody is near.
     */
    expect(counted.spoken).toBe(counted.actBound + 1);
  });

  it('has not grown, and the one that arrived since V8 is not this log', () => {
    /**
     * If the number had grown a lot, the new surfaces would be narrating rather
     * than announcing, which is a regression against the line V7 drew. It has
     * not grown at all in this log: the timeline, the beast and the provenance
     * panel carry no live region between them, and the act boundary the count
     * gained since V8 was added by V11.
     */
    expect(ACT1_ANNOUNCEMENT_COUNT).toBe(
      3 + 2 * (1 + (UPTAKE_VMAX_STEPS.length - 1) + (GLYCOLYSIS_STEPS.length - 1)),
    );
    expect(ACT1_ANNOUNCEMENT_COUNT).toBe(17);
    expect(GLYCOLYSIS_ATP_THRESHOLDS.length).toBe(4);
  });

  it('carries exactly one live region on the whole screen', () => {
    const regions = SCREEN.match(/aria-live=/g) ?? [];
    expect(regions.length).toBe(1);
  });
});

/* ===========================================================================
   THE FULL SCREEN, WITH EVERYTHING THIS LOG ADDED ON IT.
   =========================================================================== */

describe('the act screen, whole', () => {
  it('carries every surface at once', () => {
    for (const marker of [
      '<header',
      'Deep time',
      '<nav',
      '>Unlocks<',
      'href="#pathway-column"',
      'role="img"',
    ]) {
      expect(SCREEN).toContain(marker);
    }
  });

  it('names every landmark it renders', () => {
    // Reachable by structure. A region with no name is a region a screen reader
    // user cannot choose to go to.
    const sections = SCREEN.match(/<section(?![^>]*aria-label)/g) ?? [];
    expect(sections).toEqual([]);
  });
});
