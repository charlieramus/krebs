/**
 * The beast. UPDATELOGV12.md stage 3.
 *
 * ---------------------------------------------------------------------------
 * THE SECOND CHANNEL IS MEASURED THE WAY V7 MEASURED THE REDOX AXIS
 * ---------------------------------------------------------------------------
 *
 * DESIGN.md proposes motion for three of the four beast states and V7 widened
 * the accessibility rule to ban movement or colour alone, so every state needs a
 * channel that is neither. Stage 1 chose the stroked silhouette.
 *
 * Two claims follow and they are checked differently, because they are
 * different kinds of claim.
 *
 * ARITHMETIC. Every ink mark clears its contrast floor against the fill it sits
 * on, in normal vision, in greyscale, and under the three common colour vision
 * deficiencies simulated with the Machado, Oliveira and Fernandes 2009 matrices
 * at severity 1.0, which are the matrices Chromium's own emulation uses. V7's
 * second channel measured 5.70:1 or better and that is the standard to clear.
 *
 * STRUCTURAL. With every fill removed, the four states are pairwise distinct in
 * ink. That is what makes the claim survive colour loss rather than merely be
 * asserted about it: a difference in where the ink is survives every colour
 * transform by construction, so it does not need one test per deficiency.
 *
 * NOT TESTED, AND DELIBERATELY NOT FAKED: whether a slumped blob READS as a cell
 * holding steady. Distinguishability is arithmetic. Meaning needs a reader, and
 * DESIGN.md and `contentStyle.test.ts` both refuse to fake that class of
 * question for the same reason.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { ACT1, type ActVitality } from '../../content/acts';
import { BEAST_FIGURES } from '../art';
import { BEAST } from '../content';
import { Beast } from '../components/Beast';
import { RuntimeProvider } from '../RuntimeContext';
import { ZERO_FLUX_THRESHOLD } from '../tuning';

const ART_DIR = fileURLToPath(new URL('../art', import.meta.url));
const CSS = readFileSync(new URL('../../index.css', import.meta.url), 'utf8');
const BEAST_SOURCE = readFileSync(new URL('../components/Beast.tsx', import.meta.url), 'utf8');
const ARROW_SOURCE = readFileSync(
  new URL('../components/PathwayArrow.tsx', import.meta.url),
  'utf8',
);

const TOKENS: Readonly<Record<string, string>> = Object.fromEntries(
  [...CSS.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [
    m[1] as string,
    m[2] as string,
  ]),
);

/**
 * Two decimal places without `toFixed`.
 *
 * The lint rule in `eslint.config.js` bans number formatting in every `.tsx`
 * outside `Figure`, because DESIGN.md makes tabular figures not optional in the
 * interface. This file is a test that prints a report to a terminal rather than
 * to a page, and it still works inside the rule rather than around it, because
 * an exemption is how a guard starts collecting exemptions.
 */
function two(n: number): string {
  const r = Math.round(n * 100);
  return `${Math.trunc(r / 100)}.${String(r % 100).padStart(2, '0')}`;
}

const STATES: readonly ActVitality[] = ['lively', 'sluggish', 'sick', 'powered'];

/* ===========================================================================
   COLOUR MACHINERY

   sRGB in, linear for the transforms, WCAG contrast out. The deficiency
   matrices operate in linear RGB, which is why the round trip is written out
   rather than applied to the 8-bit values directly.
   =========================================================================== */

type Rgb = [number, number, number];

function channels(hex: string): Rgb {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function toLinear(c: number): number {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}
function fromLinear(x: number): number {
  const clamped = Math.min(1, Math.max(0, x));
  const s = clamped <= 0.0031308 ? clamped * 12.92 : 1.055 * clamped ** (1 / 2.4) - 0.055;
  return Math.round(s * 255);
}
function relativeLuminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map(toLinear) as Rgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Machado, Oliveira and Fernandes 2009, severity 1.0. The three matrices
 * Chromium's vision deficiency emulation uses, applied in linear RGB.
 */
const MATRICES: Readonly<Record<string, readonly Rgb[]>> = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

function deficient(hex: string, which: keyof typeof MATRICES): Rgb {
  const linear = channels(hex).map(toLinear) as Rgb;
  const matrix = MATRICES[which] as readonly Rgb[];
  return matrix.map(
    (row) =>
      (row[0] as number) * (linear[0] as number) +
      (row[1] as number) * (linear[1] as number) +
      (row[2] as number) * (linear[2] as number),
  ).map(fromLinear) as Rgb;
}

/** Full desaturation to luminance, which is what a photocopy does. */
function greyscale(hex: string): Rgb {
  const grey = fromLinear(relativeLuminance(channels(hex)));
  return [grey, grey, grey];
}

/** The five viewing conditions every pair below is measured under. */
function viewings(hex: string): { name: string; rgb: Rgb }[] {
  return [
    { name: 'normal', rgb: channels(hex) },
    { name: 'greyscale', rgb: greyscale(hex) },
    { name: 'protanopia', rgb: deficient(hex, 'protanopia') },
    { name: 'deuteranopia', rgb: deficient(hex, 'deuteranopia') },
    { name: 'tritanopia', rgb: deficient(hex, 'tritanopia') },
  ];
}

/* ===========================================================================
   STEP 1. THE STATES ARE PINNED TO A CONDITION, AND THE ACT ANSWERS IT.
   =========================================================================== */

describe('four states, pinned to the act rather than to a component', () => {
  const flux = (payoff: number): Float64Array => {
    const array = new Float64Array(ACT1.reactionIds.length);
    array[ACT1.reactionIndex('payoff')] = payoff;
    return array;
  };
  const amounts = new Float64Array(ACT1.poolIds.length);

  it('reads gross throughput, which is the quantity a net rate cannot carry', () => {
    expect(ACT1.vitality(amounts, flux(7), ZERO_FLUX_THRESHOLD, 'sluggish')).toBe('lively');
    expect(ACT1.vitality(amounts, flux(0), ZERO_FLUX_THRESHOLD, 'lively')).toBe('sluggish');
  });

  it('puts the boundary exactly on the threshold the pathway arrows already use', () => {
    // One threshold, one reading. The beast joins the agreement between the
    // arrows and the stall detector rather than bringing a third number, which
    // is why this log adds no docs/ECONOMY.md row.
    expect(ACT1.vitality(amounts, flux(ZERO_FLUX_THRESHOLD), ZERO_FLUX_THRESHOLD, 'sluggish')).toBe(
      'lively',
    );
    expect(
      ACT1.vitality(amounts, flux(ZERO_FLUX_THRESHOLD - 1e-9), ZERO_FLUX_THRESHOLD, 'lively'),
    ).toBe('sluggish');
  });

  it('cannot reach sick or powered in act 1, at any flux', () => {
    /**
     * Act 1 has no damage model and no compartment, so an act 1 cell must never
     * be drawn as damaged or as compartmentalised. Asserted over the whole range
     * rather than at two points, because the point is that no input reaches
     * them.
     */
    for (let payoff = 0; payoff <= 40; payoff += 0.05) {
      const reading = ACT1.vitality(amounts, flux(payoff), ZERO_FLUX_THRESHOLD, 'lively');
      expect(reading === 'lively' || reading === 'sluggish').toBe(true);
    }
  });

  it('gives every reading a drawing and a name, exhaustively', () => {
    for (const state of STATES) {
      expect(BEAST_FIGURES[state]).toBeTypeOf('function');
      expect(BEAST[state].text.length).toBeGreaterThan(0);
    }
    expect(Object.keys(BEAST_FIGURES).sort()).toEqual([...STATES].sort());
  });
});

/* ===========================================================================
   STEP 2. IT NEVER RE-RENDERS AT TICK RATE AND IT NEVER ANIMATES ON A TIMER.
   =========================================================================== */

describe('the two rules, which interact', () => {
  it('sets state only on a transition, by comparing before it sets', () => {
    // The comparison is the whole architecture. Without it the callback runs at
    // frame rate and re-renders the tree sixty times a second.
    expect(BEAST_SOURCE).toContain('if (snapshot.vitality === vitality) return;');
  });

  it('drives no animation from anything except a state change', () => {
    /**
     * A character that moves because time passed rather than because the cell
     * changed is a pet with an engagement hook attached, which is
     * docs/PILLARS.md rule 2 arriving through the door marked charm.
     */
    const sources = [
      { name: 'Beast.tsx', source: BEAST_SOURCE },
      ...readdirSync(ART_DIR)
        .filter((entry) => entry.startsWith('Beast'))
        .map((entry) => ({
          name: entry,
          source: readFileSync(join(ART_DIR, entry), 'utf8'),
        })),
    ];
    expect(sources.length).toBe(5);

    const TIMERS = [
      /\bsetInterval\b/,
      /\bsetTimeout\b/,
      /\brequestAnimationFrame\b/,
      /\banimate\(/,
      /@keyframes/,
      /\banimation-|animate-\[/,
      /\btransition-\w/,
    ];
    for (const { name, source } of sources) {
      // Comments stripped: these files explain the rule by naming what it bans.
      const stripped = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
      const hits = TIMERS.filter((pattern) => pattern.test(stripped)).map(String);
      expect({ name, hits }).toEqual({ name, hits: [] });
    }
  });

  it('would have caught one, because the arrow that legitimately animates trips it', () => {
    // Guard the guard. PathwayArrow drives flowing dashes at a rate proportional
    // to applied flux, which is motion carrying information and is correct.
    expect(/\banimation|\bdashoffset|requestAnimationFrame|@keyframes/i.test(ARROW_SOURCE)).toBe(
      true,
    );
  });
});

/* ===========================================================================
   STEP 3. THE SECOND CHANNEL, MEASURED.
   =========================================================================== */

describe('every state is distinguishable without colour', () => {
  /**
   * The pairs the drawings actually render: ink on the fill each state carries,
   * and ink on the white the eyes and the compartment are filled with.
   */
  const PAIRS = [
    { what: 'ink on the lively body', fg: 'ink', bg: 'mint' },
    { what: 'ink on the sluggish body', fg: 'ink', bg: 'oxidized' },
    { what: 'ink on the sick body', fg: 'ink', bg: 'pink' },
    { what: 'ink on the powered body', fg: 'ink', bg: 'mint' },
    { what: 'ink on an eye or a compartment', fg: 'ink', bg: 'white' },
    { what: 'ink on the card behind the beast', fg: 'ink', bg: 'sky' },
  ] as const;

  it('read the tokens, so nothing below is vacuous', () => {
    expect(Object.keys(TOKENS).length).toBeGreaterThanOrEqual(15);
    expect(TOKENS.ink).toBe('#16162e');
  });

  it('reproduces V7 numbers with the same machinery, so the matrices are right', () => {
    /**
     * GUARD THE GUARD, AND IT IS THE ONE THAT MATTERS MOST HERE. A matrix typed
     * in wrong produces plausible numbers and a test that passes. V7 measured
     * the `reduced` to `oxidized` axis and found tritanopia leaves it alone
     * because the axis is a red-channel difference, while protanopia collapses
     * it. Both properties are reproduced here from the tokens.
     */
    const reduced = TOKENS.reduced as string;
    const oxidized = TOKENS.oxidized as string;
    const gap = (which: keyof typeof MATRICES): number => {
      const a = deficient(reduced, which);
      const b = deficient(oxidized, which);
      return Math.hypot(
        (a[0] as number) - (b[0] as number),
        (a[1] as number) - (b[1] as number),
        (a[2] as number) - (b[2] as number),
      );
    };
    // Tritanopia preserves the axis, protanopia destroys it. V7's finding.
    expect(gap('tritanopia')).toBeGreaterThan(gap('protanopia') * 2);
  });

  it.each(
    PAIRS.flatMap((pair) =>
      viewings(TOKENS[pair.bg] as string).map((view, index) => ({
        what: `${pair.what}, ${view.name}`,
        ratio: contrast(
          (viewings(TOKENS[pair.fg] as string)[index] as { rgb: Rgb }).rgb,
          view.rgb,
        ),
      })),
    ),
  )('$what clears V7 standard of 5.70 to 1', ({ ratio }) => {
    expect(ratio).toBeGreaterThanOrEqual(5.7);
  });

  it('reports what the colour channel alone would have given, which is the argument', () => {
    const mint = TOKENS.mint as string;
    const oxidized = TOKENS.oxidized as string;
    const rows = viewings(mint).map((view, index) => {
      const other = viewings(oxidized)[index] as { name: string; rgb: Rgb };
      return `    lively vs sluggish fill, ${other.name.padEnd(13)} ${two(contrast(view.rgb, other.rgb))}:1`;
    });
    const ink = viewings(TOKENS.ink as string);
    const worstInk = Math.min(
      ...viewings(mint).map((view, index) =>
        contrast((ink[index] as { rgb: Rgb }).rgb, view.rgb),
      ),
    );
    const worstOverall = Math.min(
      ...PAIRS.flatMap((pair) =>
        viewings(TOKENS[pair.bg] as string).map((view, index) =>
          contrast((viewings(TOKENS[pair.fg] as string)[index] as { rgb: Rgb }).rgb, view.rgb),
        ),
      ),
    );
    console.log(`
  the beast's two channels, measured

${rows.join('\n')}
    lively vs powered fill, every viewing       1.00:1   the same token

    worst ink on the lively body, any viewing   ${two(worstInk)}:1
    worst ink ANYWHERE, any viewing             ${two(worstOverall)}:1
    V7 standard to clear                         5.70:1
`);

    // The claim: the colour channel cannot carry the state and the ink can.
    const worstColour = Math.max(
      ...viewings(mint).map((view, index) =>
        contrast(view.rgb, (viewings(oxidized)[index] as { rgb: Rgb }).rgb),
      ),
    );
    expect(worstColour).toBeLessThan(2);
    expect(worstInk).toBeGreaterThanOrEqual(5.7);
  });

  it('draws four silhouettes that are pairwise distinct with every fill removed', () => {
    /**
     * THE STRUCTURAL HALF, AND IT IS WHY THIS DOES NOT NEED ONE TEST PER
     * DEFICIENCY. A difference in where the ink is survives every colour
     * transform by construction. What has to be checked is that the difference
     * exists at all once colour is gone.
     */
    const inkOnly = (state: ActVitality): string => {
      const Figure = BEAST_FIGURES[state];
      return renderToStaticMarkup(<Figure size={44} />)
        .replace(/fill="[^"]*"/g, '')
        .replace(/\s+/g, ' ');
    };
    const drawn = STATES.map((state) => ({ state, ink: inkOnly(state) }));
    for (const a of drawn) {
      expect(a.ink.length).toBeGreaterThan(100);
      for (const b of drawn) {
        if (a.state === b.state) continue;
        expect({ a: a.state, b: b.state, same: a.ink === b.ink }).toEqual({
          a: a.state,
          b: b.state,
          same: false,
        });
      }
    }
  });

  it('makes powered a compartment rather than a mark, which is the only topology change', () => {
    // A closed sub-outline inside a closed outline. Nothing else in the
    // illustration set has one, and it reads with every fill removed.
    const powered = renderToStaticMarkup(<BEAST_FIGURES.powered size={44} />);
    const lively = renderToStaticMarkup(<BEAST_FIGURES.lively size={44} />);
    expect(powered).toContain('<ellipse');
    expect(lively).not.toContain('<ellipse');
  });
});

/* ===========================================================================
   STEP 6. WHAT ASSISTIVE TECHNOLOGY IS TOLD.
   =========================================================================== */

describe('the beast states the reading and never a figure', () => {
  const markup = renderToStaticMarkup(
    <RuntimeProvider options={{ persistence: { enabled: false } }}>
      <Beast />
    </RuntimeProvider>,
  );

  it('is an image with a name rather than a decoration', () => {
    expect(markup).toContain('role="img"');
    expect(markup).toContain('aria-label=');
  });

  it('puts no number in the name, in any state', () => {
    /**
     * The rule V7 settled on the carrier blob: an aria-label has nowhere to put
     * a badge, so a figure inside one would be a quantitative claim in
     * player-facing text with no provenance. The rate is on the top bar, where a
     * badge can reach it.
     */
    for (const state of STATES) {
      expect(BEAST[state].text).not.toMatch(/\d/);
    }
  });

  it('joins no live region, so the count against V8 sixteen is unmoved', () => {
    /**
     * THE DECISION, RECORDED RATHER THAN LEFT IMPLICIT. The beast changes rarely,
     * which argues for announcing it. It is also a restatement of state that is
     * already announced: the stall and the recovery are two of the three
     * transitions act 1 produces, and `Announcer` speaks both. Two announcements
     * about one fact is the same defect as two copies of one fact in a save, so
     * the beast is silent and is read on demand instead.
     */
    expect(markup).not.toContain('aria-live');
    expect(BEAST_SOURCE).not.toContain('aria-live');
  });

  it('names the cell rather than a mood', () => {
    // docs/CONTENT_STYLE.md Part 2: the game does not perform enthusiasm. Each
    // line says what the cell is doing.
    for (const state of STATES) {
      expect(BEAST[state].text.toLowerCase()).toContain('the cell');
      expect(BEAST[state].text).not.toMatch(/!|happy|sad|tired|sleepy/i);
    }
  });
});
