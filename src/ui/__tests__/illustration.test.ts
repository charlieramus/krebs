/**
 * DESIGN.md's central claim, as a property rather than eight hand-written cases.
 *
 * "Every visual property carries simulation state" and "nothing in the
 * illustration set is decorative" are the two sentences the whole direction
 * rests on. This is the test that either makes them true or reveals them as a
 * slogan. Same posture as V2 stage 3's stoichiometry test: assert over the table
 * rather than over a list of examples, so a pool added in a later act is covered
 * the moment it exists rather than the moment someone remembers to add a case.
 *
 * ---------------------------------------------------------------------------
 * THE TEST READS GEOMETRY, NOT CLAIMS
 * ---------------------------------------------------------------------------
 *
 * It counts the edges in the rendered path data and the circles in the rendered
 * markup. It does not read a `data-sides` attribute, because a component that
 * reports its own side count can be wrong about it in exactly the way this test
 * exists to catch. `data-role` is used only to say which KIND of shape was
 * drawn; the count always comes from the geometry.
 *
 * Rendered through renderToStaticMarkup rather than a DOM, because Blob is a
 * pure function of its props by design. That is not incidental: the moment the
 * illustration needed the runtime to draw itself, it would stop being testable
 * as a property of the pool table.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { Blob, MIN_POLYGON_SIDES, redoxExtent, redoxLevelY } from '../components/Blob';
import { act1PoolDefinitions, ACT1_POOL_IDS, type Act1PoolId } from '../../content/act1/pools';
import { carbonOf, phosphateOf } from '../poolCards';

/**
 * Twenty-one points across the redox axis, including both ends. Enough to catch
 * a mapping that is monotonic in the middle and clipped at the ends, which is
 * the specific way a level channel fails to be a level.
 */
const FRACTIONS: readonly number[] = Array.from({ length: 21 }, (_, i) => i / 20);

function render(id: Act1PoolId): string {
  return renderToStaticMarkup(
    createElement(Blob, {
      carbon: carbonOf(id),
      phosphate: phosphateOf(id),
      fill: '#000000',
      seed: 7,
      label: id,
    }),
  );
}

/**
 * Edges in a closed straight-line path. `M a L b L c Z` is three edges: two
 * drawn and one implied by the close.
 */
function countEdges(markup: string): number {
  const path = /data-role="silhouette" d="([^"]+)"/.exec(markup);
  if (path === null) return 0;
  const d = path[1] as string;
  if (!d.includes('Z')) throw new Error('silhouette path is not closed');
  return (d.match(/L/g) ?? []).length + 1;
}

function countDots(markup: string, role: string): number {
  return (markup.match(new RegExp(`data-role="${role}"`, 'g')) ?? []).length;
}

function hasSilhouette(markup: string): boolean {
  return markup.includes('data-role="silhouette"');
}

function hasCarrier(markup: string): boolean {
  return markup.includes('data-role="carrier"');
}

describe('illustration rule 1: sides equal carbons', () => {
  it.each(ACT1_POOL_IDS.filter((id) => carbonOf(id) >= MIN_POLYGON_SIDES))(
    '%s draws one edge per conserved carbon',
    (id) => {
      expect(countEdges(render(id))).toBe(carbonOf(id));
    },
  );

  /**
   * BELOW THREE CARBONS THE COUNT IS BEADS, AND IT IS STILL A COUNT.
   * UPDATELOGV10.md stage 2, DESIGN.md rule 1's amendment.
   *
   * The rule reached the edge of its domain when the ethanol branch added a
   * two-carbon molecule and a one-carbon one. A straight-edged polygon needs
   * three sides to enclose anything, so those two are drawn as one round bead
   * per carbon. What is asserted is unchanged in kind: the number of countable
   * things equals the conserved carbon weight, read off the geometry.
   */
  it.each(
    ACT1_POOL_IDS.filter((id) => carbonOf(id) > 0 && carbonOf(id) < MIN_POLYGON_SIDES),
  )('%s draws one bead per conserved carbon, because a polygon needs three sides', (id) => {
    const markup = render(id);
    expect(countDots(markup, 'skeleton-bead')).toBe(carbonOf(id));
    // And it is not ALSO drawing a polygon or a carrier, which would mean two
    // shapes claiming to be the same molecule.
    expect(hasSilhouette(markup)).toBe(false);
    expect(hasCarrier(markup)).toBe(false);
    // Each bead has real extent rather than being a stub.
    expect((markup.match(/data-role="skeleton-bead" d="M [\d.]+ [\d.]+ C/g) ?? []).length).toBe(
      carbonOf(id),
    );
  });

  it('never puts beads and phosphate dots on the same blob', () => {
    // THE ONE COLLISION IN THE SCHEME, ASSERTED RATHER THAN NOTED. Beads and
    // phosphate dots are both countable circles. They do not co-occur today
    // because neither ethanol nor carbon dioxide carries phosphate, and the day
    // an act adds a phosphorylated molecule below three carbons this fails,
    // which is the day the encoding needs designing again rather than
    // extending. DESIGN.md, rule 1 below three carbons.
    for (const id of ACT1_POOL_IDS) {
      if (carbonOf(id) > 0 && carbonOf(id) < MIN_POLYGON_SIDES) {
        expect(phosphateOf(id)).toBe(0);
      }
    }
  });

  it('draws no polygon at all for a pool with no carbon skeleton', () => {
    // The specific failure this guards: a zero-sided polygon, which is either
    // an empty path or a degenerate one, rendered as if it meant something.
    for (const id of ACT1_POOL_IDS.filter((pool) => carbonOf(pool) === 0)) {
      const markup = render(id);
      expect(hasSilhouette(markup)).toBe(false);
      expect(hasCarrier(markup)).toBe(true);
      // And the shape it does get has real extent, rather than being a stub.
      expect(/data-role="carrier" d="M [\d.]+ [\d.]+ C/.test(markup)).toBe(true);
    }
  });

  it('covers every act 1 pool, so none of the branches above is vacuous', () => {
    const polygons = ACT1_POOL_IDS.filter((id) => carbonOf(id) >= MIN_POLYGON_SIDES);
    const beaded = ACT1_POOL_IDS.filter(
      (id) => carbonOf(id) > 0 && carbonOf(id) < MIN_POLYGON_SIDES,
    );
    const carriers = ACT1_POOL_IDS.filter((id) => carbonOf(id) === 0);
    expect(polygons.length + beaded.length + carriers.length).toBe(ACT1_POOL_IDS.length);
    expect(polygons.length).toBeGreaterThan(0);
    expect(beaded.length).toBeGreaterThan(0);
    expect(carriers.length).toBeGreaterThan(0);
  });

  it('keeps the branch arithmetic readable across the two shape families', () => {
    // 3 = 2 + 1, which is the whole reason rule 1 exists, and it now spans a
    // polygon on one side and beads on the other. Read off the weight table.
    expect(carbonOf('pyruvate')).toBe(carbonOf('ethanol') + carbonOf('co2'));
    expect(countEdges(render('pyruvate'))).toBe(
      countDots(render('ethanol'), 'skeleton-bead') + countDots(render('co2'), 'skeleton-bead'),
    );
  });
});

describe('illustration rule 2: phosphate dots are countable', () => {
  it.each(ACT1_POOL_IDS)('%s draws one dot per conserved phosphate', (id) => {
    expect(countDots(render(id), 'phosphate')).toBe(phosphateOf(id));
  });

  it('makes ATP = ADP + Pi visible as a dot count', () => {
    // Not a separate claim, a consequence of rule 2 holding over the real
    // weights. If this ever fails, the phosphate column has drifted.
    expect(phosphateOf('atp')).toBe(phosphateOf('adp') + phosphateOf('pi'));
    expect(countDots(render('atp'), 'phosphate')).toBe(
      countDots(render('adp'), 'phosphate') + countDots(render('pi'), 'phosphate'),
    );
  });
});

describe('illustration rule 3: redox is saturation, not hue', () => {
  it('draws NAD+ and NADH as the same silhouette to the character', () => {
    // Same seed, same weights, so the paths must be byte-identical. This is what
    // "the same shape at different saturation" has to mean in practice: if the
    // silhouettes differ at all, the player is reading shape as well as colour
    // and the encoding is no longer clean.
    const oxidized = renderToStaticMarkup(
      createElement(Blob, {
        carbon: carbonOf('nad'),
        phosphate: phosphateOf('nad'),
        fill: '#A9BFB8',
        seed: 67,
        label: 'NAD+',
      }),
    );
    const reduced = renderToStaticMarkup(
      createElement(Blob, {
        carbon: carbonOf('nadh'),
        phosphate: phosphateOf('nadh'),
        fill: '#23BFA0',
        seed: 67,
        label: 'NADH',
      }),
    );

    const geometry = (markup: string): string =>
      (/data-role="carrier" d="([^"]+)"/.exec(markup)?.[1] as string) ?? '';

    expect(geometry(oxidized)).toBe(geometry(reduced));
    expect(geometry(oxidized).length).toBeGreaterThan(0);

    // And they really are distinguished by the fill and nothing else. Normalise
    // away the things that are legitimately different, the fill and the readout,
    // and the remaining markup must be identical.
    //
    // The readout appears twice since UPDATELOGV6.md stage 4: once as
    // `aria-label` and once as a `<title>`, which is what makes it a hover
    // tooltip. Both are text about the shape rather than the shape, so both are
    // normalised away. This assertion is about geometry.
    const normalise = (markup: string): string =>
      markup
        .replace(/fill="#[0-9A-Fa-f]{6}"/, 'fill="X"')
        .replace(/aria-label="[^"]*"/, 'label')
        .replace(/<title>[^<]*<\/title>/, '<title/>');
    expect(oxidized).not.toBe(reduced);
    expect(normalise(oxidized)).toBe(normalise(reduced));
  });

  it('carries a level as well, and the level is the whole of the reduced fraction', () => {
    // UPDATELOGV7.md stage 2. The claim is not "there are two states", it is
    // that a CONTINUOUS quantity is carried, so this walks the range rather
    // than checking two hand-picked points. A channel that only distinguishes
    // empty from full would pass a two-point test and would not be a channel.
    const extent = redoxExtent(54, 67);

    const ys = FRACTIONS.map((f) => redoxLevelY(extent, f));

    // Strictly monotonic, and in the right direction: more reduced is higher up
    // the shape, which is smaller in SVG coordinates.
    for (let i = 1; i < ys.length; i += 1) {
      expect(ys[i] as number).toBeLessThan(ys[i - 1] as number);
    }

    // The ends land exactly on the shape rather than nearly on it, which is what
    // makes a fully oxidized carrier pixel-identical to the flat blob that
    // shipped before this channel existed.
    expect(redoxLevelY(extent, 0)).toBe(extent.bottom);
    expect(redoxLevelY(extent, 1)).toBe(extent.top);

    // Linear in the fraction, so the level is a proportion and not a curve
    // somebody chose. Half reduced is half way up.
    expect(redoxLevelY(extent, 0.5)).toBeCloseTo((extent.top + extent.bottom) / 2, 10);

    // Clamped, because a pool amount that has drifted a denormal past its total
    // must not put the level outside the shape.
    expect(redoxLevelY(extent, -1)).toBe(extent.bottom);
    expect(redoxLevelY(extent, 2)).toBe(extent.top);
    expect(redoxLevelY(extent, Number.NaN)).toBe(extent.bottom);
  });

  it('takes the level extent from the geometry it drew, not from a bounding box', () => {
    // The same discipline as the side count above: read the rendered path and
    // check the numbers the component published about itself agree with it. A
    // level derived from a guess at the shape's height would drift the moment
    // the wobble constants moved, and it would drift silently.
    const markup = renderToStaticMarkup(
      createElement(Blob, {
        carbon: 0,
        phosphate: 0,
        fill: '#A9BFB8',
        reducedFill: '#23BFA0',
        seed: 67,
        size: 54,
        label: 'NAD+ / NADH',
      }),
    );

    const top = Number(/data-top="([\d.-]+)"/.exec(markup)?.[1]);
    const bottom = Number(/data-bottom="([\d.-]+)"/.exec(markup)?.[1]);
    expect(Number.isFinite(top)).toBe(true);
    expect(bottom).toBeGreaterThan(top);

    // Every y in the drawn carrier path lies inside the published extent, to
    // the rounding the path data itself carries.
    const d = /data-role="carrier" d="([^"]+)"/.exec(markup)?.[1] as string;
    const ys = (d.match(/[\d.-]+ [\d.-]+/g) ?? []).map((pair) => Number(pair.split(' ')[1]));
    expect(ys.length).toBeGreaterThan(0);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(top - 0.01);
    expect(Math.max(...ys)).toBeLessThanOrEqual(bottom + 0.01);
    // And the extent is tight rather than generous: the path really does reach
    // both ends of it, so a level at 1 is at the crown and not floating above.
    expect(Math.min(...ys)).toBeCloseTo(top, 1);
    expect(Math.max(...ys)).toBeCloseTo(bottom, 1);
  });

  it('adds the level without touching the silhouette', () => {
    // The constraint UPDATELOGV7.md's Decisions section puts on this stage: the
    // redox pair keeps its silhouette, because one shape in two states is what
    // makes the carrier read as one thing rather than as two molecules. A fix
    // that changed the shape would be a redesign of the system's most important
    // colour decision, and that is not this log's to make.
    const geometry = (markup: string): string =>
      (/data-role="carrier" d="([^"]+)"/.exec(markup)?.[1] as string) ?? '';

    const withoutLevel = renderToStaticMarkup(
      createElement(Blob, { carbon: 0, phosphate: 0, fill: '#A9BFB8', seed: 67, size: 54, label: 'x' }),
    );
    const withLevel = renderToStaticMarkup(
      createElement(Blob, {
        carbon: 0,
        phosphate: 0,
        fill: '#A9BFB8',
        reducedFill: '#23BFA0',
        seed: 67,
        size: 54,
        label: 'x',
      }),
    );

    expect(geometry(withLevel)).toBe(geometry(withoutLevel));
    expect(geometry(withLevel).length).toBeGreaterThan(0);
    // The level is there, and it is drawn in ink rather than in a third colour,
    // which is the only reason it survives the deficiency that killed the first
    // channel.
    expect(withLevel).toContain('data-role="redox-level"');
    expect(withLevel).toContain('data-role="redox-clip"');
    expect(/data-role="redox-level"[^>]*stroke="var\(--color-ink\)"/.test(withLevel)).toBe(true);
    // And a blob with no redox state does not get one.
    expect(withoutLevel).not.toContain('data-role="redox-level"');
  });

  it('gives the reduced carrier electron dots and the oxidized one none', () => {
    const reduced = renderToStaticMarkup(
      createElement(Blob, {
        carbon: 0,
        phosphate: 0,
        fill: '#23BFA0',
        seed: 67,
        electrons: 2,
        label: 'NADH',
      }),
    );
    const oxidized = renderToStaticMarkup(
      createElement(Blob, { carbon: 0, phosphate: 0, fill: '#A9BFB8', seed: 67, label: 'NAD+' }),
    );
    expect(countDots(reduced, 'electron')).toBe(2);
    expect(countDots(oxidized, 'electron')).toBe(0);
  });
});

describe('nothing is geometrically perfect', () => {
  it('displaces every vertex, so no molecule is a textbook figure', () => {
    // A regular hexagon reads as a diagram. Confirm the six vertices of glucose
    // do not sit at a constant radius, which is what "regular" would mean.
    const markup = render('glucose');
    const d = /data-role="silhouette" d="([^"]+)"/.exec(markup)?.[1] as string;
    const coordinates = (d.match(/[\d.]+ [\d.]+/g) ?? []).map((pair) => {
      const [x, y] = pair.split(' ').map(Number) as [number, number];
      return Math.hypot(x - 23, y - 23);
    });
    expect(coordinates.length).toBe(6);
    const spread = Math.max(...coordinates) - Math.min(...coordinates);
    expect(spread).toBeGreaterThan(0.5);
  });

  it('is deterministic, so a blob does not reshuffle between renders', () => {
    expect(render('glucose')).toBe(render('glucose'));
  });
});

describe('the weights come from the pool table and not from the interface', () => {
  it('reads every carbon and phosphate weight straight out of act1PoolDefinitions', () => {
    for (const definition of act1PoolDefinitions()) {
      const id = definition.id as Act1PoolId;
      expect(carbonOf(id)).toBe(definition.conserved.carbon ?? 0);
      expect(phosphateOf(id)).toBe(definition.conserved.phosphate ?? 0);
    }
  });

  it('agrees with the sourced act 1 skeleton sizes', () => {
    // docs/SCIENCE.md Part 2: glucose is six carbons and is cleaved into two
    // three-carbon fragments. If the illustration ever stops saying that, this
    // is where it shows up.
    expect(carbonOf('glucose')).toBe(6);
    expect(carbonOf('g3p')).toBe(3);
    expect(carbonOf('pyruvate')).toBe(3);
    expect(carbonOf('lactate')).toBe(3);
  });
});
