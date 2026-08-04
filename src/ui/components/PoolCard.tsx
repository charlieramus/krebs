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
import { poolIndex, type Act1Snapshot } from '../runtime';
import type { Act1PoolId } from '../../content/act1/pools';
import { Badge } from './Badge';
import { Blob } from './Blob';
import { Card } from './Card';
import { CoachMark, COACH_MARK_TRIGGER, InfoAffordance, useCoachMark } from './CoachMark';
import { Figure } from './Figure';
import { useOpenTeachingPanel } from './TeachingPanel';
import { blobReadout, CARRIER_READOUT, MOLECULES, POOL_FIGURES } from '../content';
import { carbonOf, phosphateOf, type PoolCardSpec } from '../poolCards';
import { FERMENT_ATP_THRESHOLD } from '../tuning';

/** Below this the pool is flat rather than moving, and the sign means nothing. */
const FLAT_RATE = 1e-6;

function SignedRate({ read }: { read: (snapshot: Act1Snapshot) => number }) {
  const ref = useLiveNode<HTMLSpanElement>((element, snapshot) => {
    const rate = read(snapshot);
    const colour =
      rate > FLAT_RATE
        ? 'var(--color-gain)'
        : rate < -FLAT_RATE
          ? 'var(--color-loss)'
          : 'var(--color-ink2)';
    if (element.style.color !== colour) element.style.color = colour;
  });

  return (
    <span ref={ref} className="inline-flex">
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
 * in the system: redox is saturation, not hue.
 *
 * One silhouette, one fill, moving along the axis between `oxidized` and
 * `reduced` as the pool is reduced. The two electron dots NADH carries fade in
 * along the same axis, because rule 3 gives NADH dots and NAD+ none, and a
 * fixed pair of dots on a pool that is only half reduced would be a lie about
 * the count.
 *
 * The mix is the NADH fraction of the nicotinamide total, which is a conserved
 * quantity, so the denominator cannot drift.
 */
function NicotinamideBlob({ seed }: { seed: number }) {
  const nad = poolIndex('nad');
  const nadh = poolIndex('nadh');

  const pathRef = useLiveNode<SVGPathElement>((element, snapshot) => {
    const oxidized = snapshot.amounts[nad] as number;
    const reduced = snapshot.amounts[nadh] as number;
    const total = oxidized + reduced;
    const fraction = total > 0 ? reduced / total : 0;
    element.setAttribute('fill', mixRedox(fraction));
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
      fill={mixRedox(0)}
      seed={seed}
      electrons={2}
      size={54}
      // One silhouette, two states, and the readout is what says the colour is
      // the state rather than a decoration. Item 11 of UPDATELOGV6.md's
      // thirteen-item table, which DESIGN.md calls its most important colour
      // decision and which nothing on the screen had ever stated.
      label={CARRIER_READOUT.text}
      pathRef={pathRef}
      electronsRef={electronsRef}
    />
  );
}

/**
 * The redox axis, as a flat colour at any instant.
 *
 * DESIGN.md forbids gradients, and this is not one: it is a single flat fill
 * whose value is a function of simulation state, recomputed per frame. Hardcoded
 * channel values rather than var() because there is no way to interpolate
 * between two CSS custom properties without a colour-mix the test would have to
 * learn to read. The two endpoints are DESIGN.md's `oxidized` and `reduced`, and
 * the token block remains their definition of record.
 */
function mixRedox(fraction: number): string {
  const from = [0xa9, 0xbf, 0xb8]; // --color-oxidized #A9BFB8
  const to = [0x23, 0xbf, 0xa0]; // --color-reduced  #23BFA0
  const f = Math.min(1, Math.max(0, fraction));
  const channel = (i: number): number =>
    Math.round((from[i] as number) + ((to[i] as number) - (from[i] as number)) * f);
  return `rgb(${channel(0)} ${channel(1)} ${channel(2)})`;
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
