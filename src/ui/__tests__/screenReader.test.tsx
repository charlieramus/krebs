/**
 * What a screen reader is told. UPDATELOGV7.md stage 4.
 *
 * THE RULE IS ANNOUNCE EVENTS, EXPOSE RATES ON DEMAND, NEVER NARRATE THE TICK,
 * and the half of it that can rot silently is the last clause. A live region
 * pointed at a number that changes twenty times a second produces continuous
 * speech, and nobody building a feature three logs from now is going to
 * rediscover why that matters. So the shape of it is asserted rather than
 * remembered: one region, polite, empty until something happens, and nothing
 * else on the screen carrying aria-live at all.
 *
 * Same limitation as keyboard.test.tsx and stated for the same reason: the test
 * environment is `node`, so this holds the structure. What a full act 1 actually
 * sounds like is in the stage 4 report, measured in a browser.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App } from '../../App';
import {
  ACT1_ANNOUNCEMENT_COUNT,
  ACT1_PURCHASE_COUNT,
} from '../components/Announcer';
import { carrierState, LANDMARKS } from '../content';

const SCREEN = renderToStaticMarkup(<App />);

describe('one live region, and it never narrates the tick', () => {
  it('declares exactly one aria-live region on the whole act screen', () => {
    const regions = SCREEN.match(/aria-live="/g) ?? [];
    expect(regions.length).toBe(1);
  });

  it('is polite rather than assertive', () => {
    // `assertive` interrupts whatever the user is reading, and is for something
    // going wrong. Nothing in act 1 is going wrong: the NAD+ wall is the game
    // working, which is the whole teaching beat.
    expect(SCREEN).toContain('aria-live="polite"');
    expect(SCREEN).not.toContain('aria-live="assertive"');
  });

  it('is atomic, so an event is read as a sentence rather than as a diff', () => {
    expect(SCREEN).toContain('aria-atomic="true"');
  });

  it('is empty on first paint, so nothing is announced before anything happens', () => {
    const region = /<div[^>]*aria-live="polite"[^>]*>(.*?)<\/div>/s.exec(SCREEN)?.[1];
    expect(region).toBe('');
  });

  it('puts no live region on anything that updates per frame', () => {
    // The specific failure this guards, and the one most likely to be
    // introduced by somebody being helpful: aria-live on a pool card, the top
    // bar, or a pathway arrow. Every one of those is written to sixty times a
    // second from a snapshot subscription.
    for (const marker of ['data-reaction', 'tabular-nums']) {
      const around = new RegExp(`aria-live[^>]*${marker}|${marker}[^>]*aria-live`);
      expect(around.test(SCREEN)).toBe(false);
    }
  });
});

describe('how much a full act 1 says', () => {
  it('is seventeen announcements, counted from the ladders rather than restated', () => {
    // One stall, one recovery, one act boundary, and an affordable plus a bought
    // for each of the seven purchases this component speaks for. If a later log
    // adds a rung this moves with it, which is the point of deriving it: a
    // number written in a comment would not.
    //
    // SIXTEEN AT V8 AND SEVENTEEN NOW. UPDATELOGV11.md stage 4 added the act
    // boundary, which is the most significant event in the game so far and is
    // still worth exactly one sentence. The three unlocks V10 added are bought
    // from the shelf and are not spoken here, which is a gap this file records
    // rather than a change stage 4 made.
    expect(ACT1_PURCHASE_COUNT).toBe(7);
    expect(ACT1_ANNOUNCEMENT_COUNT).toBe(3 + 2 * ACT1_PURCHASE_COUNT);
    expect(ACT1_ANNOUNCEMENT_COUNT).toBe(17);
  });

  it('stays two orders of magnitude below what narrating the tick would cost', () => {
    // Not decoration. Act 1 runs 62 game-minutes to its last purchase at 20Hz,
    // so narrating the tick is roughly 74000 utterances. Sixteen is the
    // difference between a game and a page that cannot be used.
    const ticksInAct1 = 62 * 60 * 20;
    expect(ACT1_ANNOUNCEMENT_COUNT).toBeLessThan(ticksInAct1 / 100);
  });
});

describe('the four regions of the layout are reachable by landmark', () => {
  it('makes the top bar a banner rather than a section header', () => {
    // A `<header>` that descends from `<main>` does not get the banner role.
    // Stage 1 read the tree and found exactly that, so the three headline
    // readouts could not be reached by landmark navigation.
    const header = SCREEN.indexOf('<header');
    const main = SCREEN.indexOf('<main');
    expect(header).toBeGreaterThan(-1);
    expect(main).toBeGreaterThan(-1);
    expect(header).toBeLessThan(main);
  });

  it('names every region a player can navigate to', () => {
    for (const label of [LANDMARKS.pools.text, LANDMARKS.pathway.text, LANDMARKS.events.text]) {
      expect(SCREEN).toContain(`aria-label="${label}"`);
    }
    // The shelf and the save panel name themselves from their own headings.
    expect(SCREEN).toContain('aria-label="Unlocks"');
    expect(SCREEN).toContain('aria-label="Save"');
  });

  it('gives the pathway a heading, which it had neither of', () => {
    // The centre of the screen and the thing the game is about. Before this it
    // had no landmark and no heading, so navigating by structure went from the
    // pools rail straight to the unlock shelf.
    expect(SCREEN).toMatch(new RegExp(`<h2[^>]*>${LANDMARKS.pathway.text}</h2>`));
  });

  it('has a coherent heading structure with no skipped levels', () => {
    const levels = [...SCREEN.matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]));
    expect(levels[0]).toBe(1);
    expect(levels.filter((l) => l === 1).length).toBe(1);
    for (const level of levels) expect(level).toBeLessThanOrEqual(2);
  });
});

describe('the illustration says what state it is in, not what its colours mean', () => {
  it('describes the carrier by its reading across the whole range', () => {
    const bands = [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1].map((f) => carrierState(f).text);
    // Every band names the pair, per docs/CONTENT_STYLE.md Part 3.
    for (const band of bands) expect(band.startsWith('NAD+ and NADH.')).toBe(true);
    // The two ends and the middle are three different readings, which is the
    // minimum for this to be a reading rather than a label.
    expect(new Set([bands[0], bands[3], bands[6]]).size).toBe(3);
    // And the ends say what they mean rather than being the neighbouring band.
    expect(carrierState(0).text).not.toBe(carrierState(0.1).text);
    expect(carrierState(1).text).not.toBe(carrierState(0.9).text);
  });

  it('puts no unbadged figure into speech', () => {
    // CLAUDE.md hard rule 1 and the badge contract. An aria-label cannot carry
    // a pill, so a number in one would be a quantitative claim with no
    // provenance attached anywhere. The bands exist to avoid that, and the
    // exact amounts are two badged figures on the same card.
    for (const f of [0, 0.25, 0.5, 0.75, 1]) {
      expect(carrierState(f).text).not.toMatch(/\d/);
    }
  });

  it('is clamped, so a denormal past the total cannot produce a stray band', () => {
    expect(carrierState(-1).text).toBe(carrierState(0).text);
    expect(carrierState(2).text).toBe(carrierState(1).text);
    expect(carrierState(Number.NaN).text).toBe(carrierState(0).text);
  });

  it('leaves a name on every image, so nothing is announced as "graphic"', () => {
    const images = SCREEN.match(/role="img"/g) ?? [];
    const labelled = SCREEN.match(/role="img"[^>]*aria-label="[^"]+"/g) ?? [];
    expect(images.length).toBeGreaterThan(0);
    expect(labelled.length).toBe(images.length);
  });
});
