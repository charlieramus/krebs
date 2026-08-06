/**
 * One pool card. DESIGN.md: illustration plus rate, flux headline, stock
 * subscript.
 *
 * ---------------------------------------------------------------------------
 * FLUX IS THE HEADLINE AND STOCK IS THE SUBSCRIPT
 * ---------------------------------------------------------------------------
 *
 * DESIGN.md calls this the system's biggest deliberate departure and says it
 * should not be reversed without a reason. The genre puts stock in the large
 * type because in most idle games the stock IS the score. Here it is not: the
 * adenylate pool is fixed and closed, so the ATP stock is a fact about a
 * ceiling, and the rate is the only number that says how the cell is doing.
 *
 * ---------------------------------------------------------------------------
 * A SIGN THAT READS AS A SIGN
 * ---------------------------------------------------------------------------
 *
 * A falling pool and a rising one have to be distinguishable without reading
 * the minus. The net rate is coloured live: `gain` when rising, `loss` when
 * falling, `ink2` when flat. That is not a decoration chosen for this card,
 * it is DESIGN.md's own definition of those two tokens, which name "rising,
 * healthy" and "falling numbers" explicitly.
 *
 * The colour is written straight to the node from the snapshot, like every other
 * moving property on this screen. Nothing here re-renders at tick rate.
 */

import { useState } from 'react';
import { useLiveNode, useRuntime, useSnapshotEffect } from '../RuntimeContext';
import { poolIndex, type ActSnapshot } from '../runtime';
import type { Act1PoolId } from '../../content/act1/pools';
import { Badge } from './Badge';
import { Blob, setRedoxLevel } from './Blob';
import { Card } from './Card';
import { CoachMark, COACH_MARK_TRIGGER, InfoAffordance, useCoachMark } from './CoachMark';
import { Figure } from './Figure';
import { useOpenTeachingPanel } from './TeachingPanel';
import {
  blobReadout,
  carrierState,
  CARRIER_READOUT,
  FIGURE_LABELS,
  MOLECULES,
  POOL_FIGURES,
} from '../content';
import { carbonOf, phosphateOf, type PoolCardSpec } from '../poolCards';
import { FERMENT_ATP_THRESHOLD } from '../tuning';

/** Below this the pool is flat rather than moving, and the sign means nothing. */
const FLAT_RATE = 1e-6;

function SignedRate({ read }: { read: (snapshot: ActSnapshot) => number }) {
  /**
   * MOVING OR FLAT, IN INK. UPDATELOGV7.md stage 5.
   *
   * This used to be `gain` when rising and `loss` when falling, which is
   * DESIGN.md's own definition of those two tokens and read well. It measured
   * at 2.17:1 for `gain` on the pink carrier card against a 3:1 floor for text
   * this size, and it cannot be fixed by moving the token: darkening `gain`
   * enough to read on a pale surface takes the ink word on the Sourced badge
   * from 6.54:1 to 3.30:1, which breaks the badge contract to fix a rate.
   *
   * The semantic colours in this palette are chosen so INK reads on them, and a
   * colour with that property cannot also read as text on a pale surface. That
   * is a fact about how the palette is built rather than a defect in it, and
   * DESIGN.md now states it as a rule: a semantic colour fills, ink writes.
   *
   * Nothing is lost that was only here. Direction is carried by the sign
   * character, which `Figure` renders explicitly and which `pathway.test.tsx`
   * has asserted since stage 2, and the channel table in UPDATELOGV7.md already
   * listed the sign rather than the colour as what survives. What remains is a
   * lightness step: a pool that is moving is ink and a pool that is flat is
   * ink2, both well clear of the floor.
   */
  const ref = useLiveNode<HTMLSpanElement>((element, snapshot) => {
    const rate = read(snapshot);
    const moving = rate > FLAT_RATE || rate < -FLAT_RATE;
    const colour = moving ? 'var(--color-ink)' : 'var(--color-ink2)';
    if (element.style.color !== colour) element.style.color = colour;
  });

  return (
    <span ref={ref} className="inline-flex">
      {/*
        Which of the two numbers on this card is the rate. DESIGN.md says so by
        making it large, and type size is not a channel speech has: stage 1 read
        the tree and found a card announcing as "Glucose, SOURCED, +7.95, /s,
        GLUCOSE, 944.72", two figures with nothing distinguishing them. The
        stock below already carries a visible label, so this is the only one
        that was unnamed.
      */}
      <span className="sr-only">{FIGURE_LABELS.netRate.text}</span>
      <Figure
        read={read}
        decimals={2}
        signed
        unit="/s"
        size="headline"
        badge={POOL_FIGURES.netRate.badge}
        badgeDisplay="attached"
      />
    </span>
  );
}

/** The stock, small, underneath. One line per pool the card covers. */
function Stock({ poolId }: { poolId: Act1PoolId }) {
  const index = poolIndex(poolId);
  return (
    <span className="flex items-baseline justify-between gap-2">
      <span className="text-micro font-body font-bold uppercase tracking-label text-ink2">
        {MOLECULES[poolId].text}
      </span>
      <Figure
        read={(snapshot) => snapshot.amounts[index] as number}
        decimals={2}
        size="micro"
        badge={POOL_FIGURES.stock.badge}
        badgeDisplay="attached"
      />
    </span>
  );
}

/**
 * DESIGN.md illustration rule 3, and the single most important colour decision
 * in the system. Since UPDATELOGV7.md stage 2 it is carried on two channels.
 *
 * ---------------------------------------------------------------------------
 * COLOUR, AND A LEVEL
 * ---------------------------------------------------------------------------
 *
 * One silhouette, filled `oxidized`, with the reduced fraction of it overlaid
 * in `reduced` and the boundary drawn as a hard ink rule. The rule's HEIGHT is
 * the reading and it does not depend on hue, which is what makes the wall
 * legible to a player who cannot separate the two tokens. Stage 1 measured that
 * player into existence: 3.21 dE between the two states act 1 moves between,
 * under protanopia, against a just-noticeable difference of 2.3.
 *
 * Colour is unchanged at both ends of the axis and that is the point of doing
 * it this way rather than by replacing the fill with a pattern. Fully oxidized
 * is the flat `oxidized` blob that shipped in V3 and fully reduced is the flat
 * `reduced` one. What went is the interpolated mix in between, and it went
 * because a level is the truer statement: the pool holds real NAD+ and real
 * NADH in a proportion, not one substance of intermediate colour.
 *
 * The fraction is NADH over the nicotinamide total, which is a conserved
 * quantity, so the denominator cannot drift.
 *
 * ---------------------------------------------------------------------------
 * THE ELECTRON DOTS ARE LEFT ALONE, DELIBERATELY
 * ---------------------------------------------------------------------------
 *
 * They are rule 3's other half and they remain what they were: two dots whose
 * opacity is the reduced fraction. They were the obvious candidate for this
 * channel and they lost, for a reason recorded in the stage 2 report. A count
 * cannot carry a continuous quantity here without lying, because NADH carries
 * two electrons as a hydride and there is no carrier holding one, so quantising
 * to zero, one and two would put a species on the screen that does not exist.
 */
function NicotinamideBlob({ seed }: { seed: number }) {
  const nad = poolIndex('nad');
  const nadh = poolIndex('nadh');

  const levelRef = useLiveNode<SVGGElement>((element, snapshot) => {
    const oxidized = snapshot.amounts[nad] as number;
    const reduced = snapshot.amounts[nadh] as number;
    const total = oxidized + reduced;
    // The geometry belongs to Blob.tsx. This passes a fraction and nothing else.
    setRedoxLevel(element, total > 0 ? reduced / total : 0);
  });

  /**
   * THE ACCESSIBLE NAME IS THE READING, NOT THE LEGEND. UPDATELOGV7.md stage 4.
   *
   * Stage 1 read the tree and found this blob announcing as "NAD+ and NADH. One
   * shape, and the colour is which one it is." On the one card in the game where
   * the picture is the entire signal, the name explained the encoding and
   * withheld the state. A screen reader user was told the colour means something
   * and never told what the colour currently was.
   *
   * Banded rather than numeric, and `content.ts` says why. Quantised to the band
   * rather than to the fraction, so the attribute is written when the READING
   * changes, four or five times across a whole act, rather than whenever the
   * twelfth decimal place moves.
   */
  const nameRef = useLiveNode<SVGSVGElement>((element, snapshot) => {
    const oxidized = snapshot.amounts[nad] as number;
    const reduced = snapshot.amounts[nadh] as number;
    const total = oxidized + reduced;
    const next = carrierState(total > 0 ? reduced / total : 0).text;
    if (element.getAttribute('aria-label') !== next) element.setAttribute('aria-label', next);
  });

  const electronsRef = useLiveNode<SVGGElement>((element, snapshot) => {
    const oxidized = snapshot.amounts[nad] as number;
    const reduced = snapshot.amounts[nadh] as number;
    const total = oxidized + reduced;
    const fraction = total > 0 ? reduced / total : 0;
    // Quantised to a hundred steps and compared as an integer, so the attribute
    // is written only when it visibly changed rather than sixty times a second
    // with a float that differs in its twelfth decimal place. Also keeps this
    // off toFixed, which the tabular-figures lint rule bans in .tsx and is
    // right to: an opacity is not a number anybody reads.
    const step = Math.round(fraction * 100);
    if (element.dataset.reduced !== `${step}`) {
      element.dataset.reduced = `${step}`;
      element.setAttribute('opacity', `${step / 100}`);
    }
  });

  return (
    <Blob
      carbon={carbonOf('nad')}
      phosphate={phosphateOf('nad')}
      // The two ends of the axis, straight off the tokens. No interpolation
      // anywhere now, so nothing here has to reach past var() into channel
      // values the way the old mix did, and index.css stays the definition of
      // record for both colours rather than only for their endpoints.
      fill="var(--color-oxidized)"
      reducedFill="var(--color-reduced)"
      seed={seed}
      electrons={2}
      size={54}
      // One silhouette, two states, and the readout is what says the level and
      // the colour are the state rather than a decoration. Item 11 of
      // UPDATELOGV6.md's thirteen-item table, which DESIGN.md calls its most
      // important colour decision and which nothing on the screen had ever
      // stated.
      label={CARRIER_READOUT.text}
      // The hover readout stays the encoding and the accessible name becomes
      // the reading. See Blob's `stateLabel`. Seeded at fully oxidized, which is
      // what a fresh act 1 starts at, so the name is right on the first paint
      // rather than for one frame saying nothing.
      stateLabel={carrierState(0).text}
      rootRef={nameRef}
      levelRef={levelRef}
      electronsRef={electronsRef}
    />
  );
}

export function PoolCard({ spec }: { spec: PoolCardSpec }) {
  const headline = poolIndex(spec.headline);
  const runtime = useRuntime();

  /**
   * Which mark this card teaches, if any. Three of eight do, declared in
   * src/ui/poolCards.ts beside the card rather than branched on here.
   *
   * ONLY THE NAD+ MARK IS EVER AUTOMATIC. It is the only one with a simulation
   * event to fire on, and it is the only one whose moment a player would
   * otherwise sit inside without an explanation. The other two are manual by
   * construction rather than by the COACH_MARK_TRIGGER setting: a card that
   * opens an unrequested bubble every time some condition happens to be true is
   * the thing that turns teaching into nagging, and neither of them has a
   * condition worth interrupting for.
   */
  const mark = spec.coach;
  const autoTriggered = spec.kind === 'nicotinamide';
  const coach = useCoachMark(autoTriggered ? COACH_MARK_TRIGGER : 'manual');
  const openPanel = useOpenTeachingPanel();

  const [canAct, setCanAct] = useState(false);
  useSnapshotEffect((snapshot) => {
    if (!autoTriggered) return;
    const next = !snapshot.fermentUnlocked && snapshot.meter.atpProduced >= FERMENT_ATP_THRESHOLD;
    setCanAct((current) => (current === next ? current : next));
  });

  return (
    <Card surface={spec.surface} className="relative flex flex-col gap-2 p-3">
      <span className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1">
          <span className="font-display font-semibold text-card-title leading-tight">
            {spec.title.text}
          </span>
          {mark !== undefined ? (
            <InfoAffordance onClick={coach.show} label={mark.heading.text} />
          ) : null}
        </span>
        {/* One badge per card. Every Figure below passes the same provenance
            with badgeDisplay="attached", so the contract holds without eight
            pills on one card. */}
        <Badge badge={spec.title.badge} />
      </span>

      {/*
        An overlay, not an inline block. DESIGN.md's screen inventory lists the
        coach mark as an overlay and DESIGN.md's density rule wants prose at
        comfortable width, and the left rail is 17rem. Rendered inline it came
        out at about twenty characters a line, which is readable and horrible.
        Absolutely positioned out of the column it sits at 42ch, and it no
        longer shoves the six cards below it down the page when it opens.
      */}
      {mark !== undefined && coach.open ? (
        <span className="absolute left-0 top-full z-20 mt-2 w-max max-w-[min(42ch,80vw)]">
          <CoachMark
            content={mark}
            // Only when the player asked. See CoachMark's `autoFocus`: the NAD+
            // mark fires on the wall by itself and must not take the keyboard
            // out of anybody's hands to do it.
            autoFocus={coach.requested}
            onDismiss={coach.dismiss}
            // Only the buy action can be unaffordable. An action that opens a
            // panel is always available, and disabling it would read as the
            // explanation being locked behind a purchase, which is the opposite
            // of what a teaching layer is for.
            actionEnabled={mark.actionKind === 'buy-ferment' ? canAct : true}
            onAction={() => {
              if (mark.actionKind === 'buy-ferment') runtime.buyFerment();
              else openPanel();
            }}
          />
        </span>
      ) : null}

      <span className="flex items-center gap-2">
        <span className="flex shrink-0 items-center gap-1">
          {spec.kind === 'nicotinamide' ? (
            <NicotinamideBlob seed={spec.blobs[0]?.seed ?? 1} />
          ) : (
            spec.blobs.map((blob) => (
              <Blob
                key={`${blob.poolId}-${blob.seed}`}
                carbon={carbonOf(blob.poolId)}
                phosphate={phosphateOf(blob.poolId)}
                fill={blob.fill}
                seed={blob.seed}
                electrons={blob.electrons ?? 0}
                size={spec.blobs.length > 1 ? 48 : 54}
                // The blob says what it encodes. DESIGN.md's illustration rules
                // put real information in the geometry and nothing told the
                // player it was there. Composed in src/ui/content.ts from the
                // same conserved-weight table the geometry is drawn from, so it
                // cannot describe a shape the pathway no longer makes.
                label={
                  blobReadout(
                    MOLECULES[blob.poolId].text,
                    carbonOf(blob.poolId),
                    phosphateOf(blob.poolId),
                  ).text
                }
              />
            ))
          )}
        </span>

        <SignedRate read={(snapshot) => snapshot.netRate[headline] as number} />
      </span>

      <span className="flex flex-col gap-0.5">
        {spec.stocks.map((poolId) => (
          <Stock key={poolId} poolId={poolId} />
        ))}
      </span>
    </Card>
  );
}
