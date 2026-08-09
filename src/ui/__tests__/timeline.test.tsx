/**
 * The timeline. UPDATELOGV12.md stage 2.
 *
 * ---------------------------------------------------------------------------
 * THE ASSERTION THIS FILE EXISTS FOR IS THE ONE ABOUT RE-RENDERING
 * ---------------------------------------------------------------------------
 *
 * Every other test in this project asserts a value, and a timeline wired to
 * cumulative ATP would render the same seven stops as one wired to nothing. That
 * is the same shape as the `poolIndex` defect Spine A found: a linear scan
 * produces exactly the value a map does, and 559 tests passed over it for eight
 * logs.
 *
 * So the claim is asserted structurally, twice, from two directions:
 *
 *   - the rendered markup is byte-identical before and after 200000 ticks, with
 *     a control component in the same harness that DOES change, so the harness
 *     is proved able to see a difference
 *   - the module names none of the four routes to the snapshot. `useLive`,
 *     `useLiveNode`, `useSnapshotEffect` and `subscribe`, with a guard-the-guard
 *     against `PoolCard.tsx`, which uses them
 *
 * The environment is `node` and there is no DOM in it, which is deliberate
 * across this suite, so a mounted tree cannot be re-rendered here. What is
 * assertable is that there is no input by which a re-render could be provoked.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { TICK_MS } from '../../sim/constants';
import { RuntimeProvider, useRuntime } from '../RuntimeContext';
import { Timeline } from '../components/Timeline';
import { TIMELINE_STOPS, markerStopId, stopSurface } from '../timeline';
import { TIMELINE, TIMELINE_CONTENT, UNDATED_READING } from '../content';
import { STOP_FIGURES } from '../art';
import { ACT1_ANNOUNCEMENT_COUNT } from '../components/Announcer';

const SCIENCE = readFileSync(new URL('../../../docs/SCIENCE.md', import.meta.url), 'utf8');
const TIMELINE_SOURCE = readFileSync(
  new URL('../components/Timeline.tsx', import.meta.url),
  'utf8',
);
const POOL_CARD_SOURCE = readFileSync(
  new URL('../components/PoolCard.tsx', import.meta.url),
  'utf8',
);

/* ===========================================================================
   STEP 1. SEVEN STOPS, SOURCED.
   =========================================================================== */

describe('seven stops, and every one of them traces to a document', () => {
  it('has exactly the seven DESIGN.md lists, newest first', () => {
    expect(TIMELINE_STOPS.map((stop) => stop.id)).toEqual([
      'now',
      'eukaryotes',
      'endosymbiosis',
      'goe',
      'photosynthesis',
      'mats',
      'vents',
    ]);
  });

  it('gives every stop a figure, a title, a date and a reading', () => {
    for (const stop of TIMELINE_STOPS) {
      const content = TIMELINE_CONTENT[stop.id];
      expect(STOP_FIGURES[stop.id]).toBeTypeOf('function');
      expect(content.title.length).toBeGreaterThan(0);
      expect(content.date.length).toBeGreaterThan(0);
      expect(content.note.length).toBeGreaterThan(0);
    }
  });

  it('carries no Needs source badge, which the release gate also enforces', () => {
    for (const stop of TIMELINE_STOPS) {
      expect(TIMELINE_CONTENT[stop.id].badge.kind).not.toBe('needs-source');
    }
  });

  it('cites only Parts docs/SCIENCE.md actually has', () => {
    // Same mechanism teaching.test.tsx uses on coach mark source rows: resolve
    // the citation against the document rather than against a list, so a source
    // naming a Part that does not exist fails the build.
    let checked = 0;
    for (const stop of TIMELINE_STOPS) {
      const badge = TIMELINE_CONTENT[stop.id].badge;
      if (badge.kind !== 'sourced' && badge.kind !== 'contested') continue;
      const part = /docs\/SCIENCE\.md Part (\d+)/.exec(badge.source);
      expect(part).not.toBeNull();
      expect(SCIENCE).toContain(`# Part ${(part as RegExpExecArray)[1] as string}:`);
      checked += 1;
    }
    // Guard the guard: six of the seven carry a document citation and the
    // seventh is the present, which is not a claim about the record.
    expect(checked).toBe(6);
  });

  it('keeps the two undated stops undated, and does not conflate them', () => {
    const dates = Object.fromEntries(TIMELINE_STOPS.map((stop) => [stop.id, stop.date]));
    expect(dates.photosynthesis).toBe('unresolved');
    expect(dates.vents).toBe('hypothesis');
    expect(TIMELINE_CONTENT.photosynthesis.date).toBe('unresolved');
    expect(TIMELINE_CONTENT.vents.date).toBe('hypothesis');
    // Two kinds, two readings, and the readings are different sentences.
    expect(UNDATED_READING.unresolved.text).not.toBe(UNDATED_READING.hypothesis.text);
  });

  it('puts a real range on the other five, written with "to" and never a dash', () => {
    // CLAUDE.md: no em dashes or en dashes, including in numeric ranges.
    for (const stop of TIMELINE_STOPS) {
      if (stop.date !== 'dated') continue;
      expect(TIMELINE_CONTENT[stop.id].date).not.toMatch(/[—–]/);
    }
    expect(TIMELINE_CONTENT.goe.date).toContain(' to ');
    expect(TIMELINE_CONTENT.mats.date).toContain(' to ');
  });

  it('keeps DESIGN.md and the stop table agreeing about which stops are contested', () => {
    const contested = TIMELINE_STOPS.filter((stop) => stop.contested === true).map((s) => s.id);
    expect(contested.sort()).toEqual(['endosymbiosis', 'photosynthesis', 'vents']);
    for (const id of contested) {
      // DESIGN.md: lilac means contested, and only that.
      const stop = TIMELINE_STOPS.find((s) => s.id === id);
      expect(stopSurface(stop as (typeof TIMELINE_STOPS)[number])).toBe('lilac');
      expect(TIMELINE_CONTENT[id as 'vents'].badge.kind).toBe('contested');
    }
  });
});

/* ===========================================================================
   STEP 2. THE MARKER IS DISCRETE.
   =========================================================================== */

describe('the marker reads the act and nothing else', () => {
  it('maps each of the four acts to exactly one stop', () => {
    expect(markerStopId(1)).toBe('mats');
    expect(markerStopId(2)).toBe('goe');
    expect(markerStopId(3)).toBe('endosymbiosis');
    expect(markerStopId(4)).toBe('eukaryotes');
  });

  it('returns null rather than a wrong stop for an act with none', () => {
    expect(markerStopId(5)).toBeNull();
    expect(markerStopId(0)).toBeNull();
  });

  it('renders identical markup across two hundred thousand ticks', () => {
    /**
     * THE ASSERTION THIS FILE EXISTS FOR.
     *
     * A timeline whose marker slid with cumulative ATP, elapsed time or a pool
     * level would render differently here. One whose marker reads the act cannot,
     * because the act does not change inside a runtime's life.
     *
     * THE FIRST VERSION OF THIS TEST COULD NOT HAVE FAILED, and it is written up
     * this way because the probe caught it rather than review. It built a
     * runtime, drove it 200000 frames, and then rendered through
     * `RuntimeProvider`, which builds its OWN runtime and ignores the one the
     * test aged. Both sides were a fresh cell at tick 0, so a Timeline wired
     * straight to `snapshot.tickCount` passed it. That is the same defect as a
     * guard that agrees with its own list, and the whole reason UPDATELOGV12.md
     * asks for the assertion at all is that no value assertion can catch this
     * class of regression.
     *
     * `Driver` is the fix. It runs inside the provider, so it advances the
     * runtime the tree is actually rendering against, and React renders children
     * in order so it lands before `Timeline` does.
     */
    function Driver({ frames }: { frames: number }) {
      const runtime = useRuntime();
      for (let f = 0; f < frames; f += 1) runtime.frame(f * TICK_MS);
      return null;
    }

    /** Proof the harness can see a change at all. */
    function Probe() {
      return <i>{useRuntime().snapshot.tickCount}</i>;
    }

    const render = (frames: number): string =>
      renderToStaticMarkup(
        <RuntimeProvider options={{ persistence: { enabled: false } }}>
          <Driver frames={frames} />
          <Timeline />
          <Probe />
        </RuntimeProvider>,
      );

    const cold = render(0);
    const aged = render(200_000);

    const split = (markup: string): [string, string] => {
      const at = markup.lastIndexOf('<i>');
      return [markup.slice(0, at), markup.slice(at)];
    };
    const [coldTimeline, coldProbe] = split(cold);
    const [agedTimeline, agedProbe] = split(aged);

    // The timeline did not move.
    expect(agedTimeline).toBe(coldTimeline);
    // The cell did, so a byte-identical timeline is a result rather than a
    // harness that rendered nothing twice.
    expect(coldProbe).toBe('<i>0</i>');
    expect(agedProbe).not.toBe(coldProbe);
    expect(Number.parseInt(agedProbe.replace(/\D/g, ''), 10)).toBeGreaterThan(1000);
  });

  it('names none of the four routes to the snapshot', () => {
    for (const route of ['useLive', 'useLiveNode', 'useSnapshotEffect', '.subscribe(']) {
      expect(TIMELINE_SOURCE.replace(/\/\*[\s\S]*?\*\//g, '')).not.toContain(route);
    }
    // Guard the guard. PoolCard is the component that does exactly this, so if
    // the check above cannot see a route in a file that has one, it is useless.
    expect(POOL_CARD_SOURCE).toContain('useLive');
  });
});

/* ===========================================================================
   STEP 3. THE ADMISSION RULE IS WRITTEN WHERE SOMEBODY WILL HIT IT.
   =========================================================================== */

describe('the admission rule', () => {
  it('is stated in the file that defines the stops, with what disqualifies a candidate', () => {
    const source = readFileSync(new URL('../timeline.ts', import.meta.url), 'utf8');
    expect(source).toContain('METABOLISM, NOT BY ITS MORPHOLOGY');
    expect(source).toContain('What disqualifies');
    expect(source).toContain('nitrogen fixation and methanogenesis');
  });
});

/* ===========================================================================
   STEP 5. ACCESSIBILITY, AND THE ONE ANNOUNCEMENT.
   =========================================================================== */

describe('the timeline is reachable by structure and says nothing out loud', () => {
  const markup = renderToStaticMarkup(
    <RuntimeProvider options={{ persistence: { enabled: false } }}>
      <Timeline />
    </RuntimeProvider>,
  );

  it('is a landmark with a heading, named by that heading', () => {
    expect(markup).toContain('<section aria-labelledby=');
    expect(markup).toContain('<h2 id=');
    expect(markup).toContain(TIMELINE.heading.text);
    const section = /<section aria-labelledby="([^"]+)"/.exec(markup);
    const heading = /<h2 id="([^"]+)"/.exec(markup);
    expect(section).not.toBeNull();
    expect((section as RegExpExecArray)[1]).toBe((heading as RegExpExecArray)[1]);
  });

  it('is a tab stop, because it scrolls', () => {
    expect(markup).toContain('tabindex="0"');
  });

  it('states the reading rather than the legend where the player is', () => {
    // "You are here" alone names the mechanism. The accessible name says where
    // here is, and the visible words stay inside it.
    expect(markup).toContain(TIMELINE.marker.text);
    expect(markup).toContain(`You are here. ${TIMELINE_CONTENT.mats.title}.`);
  });

  it('states the constraint on an undated stop rather than the absence', () => {
    expect(markup).toContain(UNDATED_READING.unresolved.text);
    expect(markup).toContain(UNDATED_READING.hypothesis.text);
    expect(UNDATED_READING.unresolved.text).not.toContain('no date');
  });

  it('discloses the non-linear axis on the view itself', () => {
    expect(markup).toContain(TIMELINE.axis.text);
  });

  it('carries no live region, so the act boundary is still announced once', () => {
    /**
     * The boundary is the most significant event in the game and Spine A already
     * announces it, once. Two announcements about one fact is the same defect as
     * two copies of one fact in a save, so this component has no `aria-live` at
     * all and the count is unmoved.
     */
    expect(markup).not.toContain('aria-live');
    expect(TIMELINE_SOURCE).not.toContain('aria-live');
    // 3 + 2 * (1 + 2 uptake rungs + 4 glycolytic rungs) = 17 at V11, unchanged.
    expect(ACT1_ANNOUNCEMENT_COUNT).toBe(3 + 2 * (1 + 2 + 4));
  });

  it('renders the locked stop dashed and dimmed, and nothing else', () => {
    // The contrast the undated design turns on: dashed means unfinished here,
    // and no undated stop is dashed.
    const dashed = markup.match(/border-dashed/g) ?? [];
    expect(dashed.length).toBe(1);
    expect(TIMELINE_STOPS.filter((stop) => stop.locked === true).map((s) => s.id)).toEqual(['now']);
  });
});
