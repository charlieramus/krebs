/**
 * The unlock shelf. DESIGN.md: dashed slots for what is not bought yet, and
 * locked content stays visible and dimmed rather than hidden, because seeing
 * what is coming is the genre's engine.
 *
 * Three slots, all finite. `ferment` once, which is the teaching beat. Uptake
 * capacity in a fixed enumerated number of steps, then glycolytic capacity in
 * another, because CLAUDE.md hard rule 3 forbids infinite scaling and an upgrade
 * with no last step is infinite scaling wearing a small number.
 *
 * The two ladders are SEQUENTIAL rather than side by side. Both raise uptake and
 * the second always raises it further, so the third slot reads "Opens once
 * uptake is at the top of its ladder" until it does. Locked content staying
 * visible and dimmed is DESIGN.md's rule and it is the right one here: what the
 * player can see coming is the reason to finish the ladder they are on.
 *
 * NEITHER SUBTRACTS FROM THE ATP POOL. The adenylate pool is fixed, closed and
 * conserved, so taking ATP out of it to pay for an upgrade breaks the
 * conservation test on the tick it happens. Costs are thresholds against the
 * cumulative counter in src/content/act1/meter.ts, which already lives outside
 * the simulation for exactly this reason, and which is also the more honest
 * statement about a cell: a cell does not save up ATP, it produces it at a rate.
 * The full argument is in src/ui/tuning.ts. Do not "fix" this into a purchase.
 *
 * React state moves here and only here. A purchase is a discrete event, which is
 * exactly the kind of thing React is for, unlike the forty numbers on this
 * screen that change twenty times a second.
 */

import { useEffect, useRef, useState } from 'react';
import { useLiveNode, useRuntime, useSnapshotEffect } from '../RuntimeContext';
import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';
import { InfoAffordance } from './CoachMark';
import { Figure } from './Figure';
import { useOpenTeachingPanel } from './TeachingPanel';
import { PANEL_AFFORDANCE, SHELF, UNLOCKS } from '../content';
import {
  ETHANOL_ATP_THRESHOLD,
  FERMENT_ATP_THRESHOLD,
  GLYCOGEN_ATP_THRESHOLD,
  GLYCOLYSIS_ATP_THRESHOLDS,
  GLYCOLYSIS_STEPS,
  TUNING_BADGES,
  UPTAKE_ATP_THRESHOLDS,
  UPTAKE_VMAX_STEPS,
} from '../tuning';

/**
 * A progress readout toward a threshold, written straight to the node.
 *
 * The affordability check runs at frame rate but the BUTTON's disabled state is
 * React state, flipped once when the threshold is crossed. Sixty re-renders a
 * second to keep a button in the same state it was already in is the thing the
 * whole runtime exists to avoid.
 */
function Progress({ threshold }: { threshold: number }) {
  const ref = useLiveNode<HTMLSpanElement>((element, snapshot) => {
    const reached = snapshot.meter.atpProduced >= threshold;
    // `ink`, not `gain`. This is micro type, so it needs 4.5:1, and `gain` on
    // white measures 2.70. See DESIGN.md, Accessibility: a semantic colour
    // fills and ink writes. Nothing is lost, because the threshold being
    // reached is already carried by the button below it becoming operable,
    // which is a stronger signal than a green number.
    const colour = reached ? 'var(--color-ink)' : 'var(--color-ink2)';
    if (element.style.color !== colour) element.style.color = colour;
  });

  return (
    <span ref={ref} className="inline-flex items-baseline gap-1">
      <Figure
        read={(snapshot) => snapshot.meter.atpProduced}
        decimals={0}
        size="micro"
        badge={TUNING_BADGES.fermentThreshold}
        badgeDisplay="attached"
      />
      <span className="text-micro font-body font-bold text-ink2">{SHELF.progressOf.text}</span>
      <Figure
        value={threshold}
        decimals={0}
        size="micro"
        badge={TUNING_BADGES.fermentThreshold}
        badgeDisplay="attached"
      />
      <span className="text-micro font-body font-bold text-ink2">{SHELF.progressUnit.text}</span>
    </span>
  );
}

function Slot({
  title,
  badge,
  detail,
  threshold,
  bought,
  affordable,
  onBuy,
  buyLabel,
  onInfo,
  infoLabel,
}: {
  title: string;
  badge: Parameters<typeof Badge>[0]['badge'];
  detail: string;
  threshold: number | null;
  bought: boolean;
  affordable: boolean;
  onBuy: () => void;
  buyLabel: string;
  /** Opens the teaching panel. Only the fermentation slot has one. */
  onInfo?: () => void;
  infoLabel?: string;
}) {
  const card = useRef<HTMLDivElement>(null);
  const buy = useRef<HTMLButtonElement>(null);

  /**
   * WHERE FOCUS GOES WHEN A PURCHASE DISABLES THE BUTTON IT WAS ON.
   *
   * Measured in stage 1, by keyboard, on the real page: tab to "Express it",
   * press Space, and the button becomes disabled, so the browser has nowhere to
   * put focus and drops it to `document.body`. The next Tab does not resume
   * where the player was. It restarts from the top of the document and lands on
   * "Export to file", PAST the whole unlock shelf, because everything before it
   * is behind the current position in DOM order. A player who buys act 1's
   * central unlock by keyboard is silently thrown to the end of the page.
   *
   * Focus moves to the slot's own card instead. It is a focus target and not a
   * tab stop, so it adds nothing to the tab order, and tabbing on from it
   * continues in document order, which is the next slot. The player stays where
   * they were and their next Tab does the obvious thing.
   *
   * Conditioned on focus actually having been inside this slot, so a purchase
   * made with the pointer, or from the coach mark's action button, does not
   * yank focus across the screen to a card nobody was looking at.
   */
  const wasFocused = useRef(false);
  useEffect(() => {
    if (!wasFocused.current) return;
    wasFocused.current = false;
    if (buy.current !== null && !buy.current.disabled) return;
    card.current?.focus();
  }, [bought, affordable]);

  return (
    <Card
      surface={bought ? 'mint' : 'white'}
      dashed={!bought}
      dimmed={!bought && !affordable}
      className="flex min-w-0 flex-1 flex-col gap-2 p-3"
      containerRef={card}
      focusable
    >
      <span className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1">
          <span className="font-display font-semibold text-card-title leading-tight">{title}</span>
          {onInfo === undefined || infoLabel === undefined ? null : (
            <InfoAffordance onClick={onInfo} label={infoLabel} />
          )}
        </span>
        <Badge badge={badge} />
      </span>

      <span className="text-micro font-body font-semibold text-ink2">{detail}</span>

      {threshold === null ? null : <Progress threshold={threshold} />}

      <Button
        ref={buy}
        surface={bought ? 'mint' : 'white'}
        disabled={bought || !affordable}
        // Recorded before the click rather than read after it, because by the
        // time the effect runs the button is disabled and `document.activeElement`
        // has already been reset to the body.
        onClick={() => {
          wasFocused.current = true;
          onBuy();
        }}
      >
        {bought ? SHELF.bought.text : buyLabel}
      </Button>
    </Card>
  );
}

export function UnlockShelf() {
  const runtime = useRuntime();
  const openPanel = useOpenTeachingPanel();

  /**
   * MIRRORED FROM THE SNAPSHOT, NOT OWNED.
   *
   * The runtime is the only authority on what has been bought, and this is a
   * defect the stage 7 play session found rather than a precaution. The shelf
   * originally seeded this from the snapshot once at mount and updated it only
   * in its own click handler, so buying lactate dehydrogenase from the COACH
   * MARK's action button left the shelf still showing an unbought slot reading
   * "14157 of 55 ATP made". Two views of one fact, one of which was not
   * watching. Everything below now derives from the snapshot every frame and
   * the click handlers set nothing.
   *
   * Still React state rather than a live DOM write, because these change what is
   * rendered rather than what a node says, and they change a handful of times in
   * a session rather than twenty times a second. The comparison before each set
   * is what keeps that true.
   */
  const [bought, setBought] = useState({
    ferment: runtime.snapshot.fermentUnlocked,
    ethanol: runtime.snapshot.ethanolUnlocked,
    glycogen: runtime.snapshot.glycogenUnlocked,
    uptakeStep: runtime.snapshot.uptakeStep,
    glycolysisStep: runtime.snapshot.glycolysisStep,
  });
  const [affordable, setAffordable] = useState({
    ferment: false,
    ethanol: false,
    uptake: false,
    glycolysis: false,
    glycogen: false,
  });

  useSnapshotEffect((snapshot) => {
    setBought((current) =>
      current.ferment === snapshot.fermentUnlocked &&
      current.ethanol === snapshot.ethanolUnlocked &&
      current.glycogen === snapshot.glycogenUnlocked &&
      current.uptakeStep === snapshot.uptakeStep &&
      current.glycolysisStep === snapshot.glycolysisStep
        ? current
        : {
            ferment: snapshot.fermentUnlocked,
            ethanol: snapshot.ethanolUnlocked,
            glycogen: snapshot.glycogenUnlocked,
            uptakeStep: snapshot.uptakeStep,
            glycolysisStep: snapshot.glycolysisStep,
          },
    );

    const nextFerment =
      !snapshot.fermentUnlocked && snapshot.meter.atpProduced >= FERMENT_ATP_THRESHOLD;
    // Asked of the runtime, like the glycolytic slot below, because the gate on
    // this one is a rule and not a threshold: it refuses until the lactate
    // branch has been bought, whatever the meter says.
    const nextEthanol = runtime.canBuyEthanol();
    const uptakeThreshold = UPTAKE_ATP_THRESHOLDS[snapshot.uptakeStep];
    const nextUptake =
      uptakeThreshold !== undefined && snapshot.meter.atpProduced >= uptakeThreshold;
    // Asked of the runtime rather than recomputed here. The sequencing rule
    // between the two ladders lives in one place and this is a mirror of it.
    const nextGlycolysis = runtime.canBuyGlycolysisStep();
    // Asked of the runtime for the same reason as the two above it: the gate is
    // a rule about the glycolytic ladder rather than a threshold.
    const nextGlycogen = runtime.canBuyGlycogen();
    setAffordable((current) =>
      current.ferment === nextFerment &&
      current.ethanol === nextEthanol &&
      current.uptake === nextUptake &&
      current.glycolysis === nextGlycolysis &&
      current.glycogen === nextGlycogen
        ? current
        : {
            ferment: nextFerment,
            ethanol: nextEthanol,
            uptake: nextUptake,
            glycolysis: nextGlycolysis,
            glycogen: nextGlycogen,
          },
    );
  });

  const fermentBought = bought.ferment;
  const ethanolBought = bought.ethanol;
  const glycogenBought = bought.glycogen;
  const uptakeStep = bought.uptakeStep;
  const glycolysisStep = bought.glycolysisStep;

  const atTopOfLadder = uptakeStep >= UPTAKE_VMAX_STEPS.length - 1;
  const nextThreshold = UPTAKE_ATP_THRESHOLDS[uptakeStep] ?? null;

  const atTopOfGlycolysis = glycolysisStep >= GLYCOLYSIS_STEPS.length - 1;
  const glycolysisThreshold = GLYCOLYSIS_ATP_THRESHOLDS[glycolysisStep] ?? null;

  return (
    <section aria-label={SHELF.heading.text} className="flex min-w-0 flex-col gap-2">
      <span className="flex items-center gap-2">
        <h2 className="font-display font-semibold text-card-title uppercase tracking-label text-ink2">
          {SHELF.heading.text}
        </h2>
      </span>

      <div className="flex min-w-0 flex-wrap gap-3">
        <Slot
          title={UNLOCKS.ferment.text}
          badge={UNLOCKS.ferment.badge}
          detail={SHELF.fermentDetail.text}
          threshold={fermentBought ? null : FERMENT_ATP_THRESHOLD}
          bought={fermentBought}
          affordable={affordable.ferment}
          // The teaching panel, reachable without having opened either coach
          // mark. It hangs off this slot because this is the purchase it is
          // about, and because the misconception docs/SCIENCE.md Part 2 asks the
          // game to correct directly is a misconception about this button.
          onInfo={openPanel}
          infoLabel={PANEL_AFFORDANCE.text}
          buyLabel={SHELF.fermentBuy.text}
          onBuy={() => {
            runtime.buyFerment();
          }}
        />

        {/*
          THE FOURTH SLOT, AND THE FIRST ONE THAT IS NOT AN UPGRADE.
          UPDATELOGV10.md stage 2.

          It sits beside the lactate slot rather than after the ladders, because
          the two fermentation branches are alternatives and reading them side by
          side is what makes that legible. It stays locked until the lactate
          branch is bought: locked content stays visible and dimmed, which is
          DESIGN.md's rule, and here it is also the teaching order.
        */}
        <Slot
          title={UNLOCKS.ethanolFerment.text}
          badge={UNLOCKS.ethanolFerment.badge}
          detail={fermentBought ? SHELF.ethanolDetail.text : SHELF.ethanolLocked.text}
          threshold={ethanolBought || !fermentBought ? null : ETHANOL_ATP_THRESHOLD}
          bought={ethanolBought}
          affordable={affordable.ethanol}
          buyLabel={SHELF.ethanolBuy.text}
          onBuy={() => {
            runtime.buyEthanol();
          }}
        />

        <Slot
          title={UNLOCKS.uptakeCapacity.text}
          badge={UNLOCKS.uptakeCapacity.badge}
          detail={
            atTopOfLadder
              ? SHELF.uptakeDone.text
              : SHELF.uptakeDetail.text
          }
          threshold={atTopOfLadder ? null : nextThreshold}
          bought={atTopOfLadder}
          affordable={affordable.uptake && !atTopOfLadder}
          buyLabel={SHELF.uptakeBuy.text}
          onBuy={() => {
            runtime.buyUptakeStep();
          }}
        />

        <Slot
          title={UNLOCKS.glycolyticCapacity.text}
          badge={UNLOCKS.glycolyticCapacity.badge}
          detail={
            atTopOfGlycolysis
              ? SHELF.glycolysisDone.text
              : atTopOfLadder
                ? SHELF.glycolysisDetail.text
                : SHELF.glycolysisLocked.text
          }
          threshold={atTopOfGlycolysis || !atTopOfLadder ? null : glycolysisThreshold}
          bought={atTopOfGlycolysis}
          affordable={affordable.glycolysis}
          // NOT "Add capacity", which is the slot to the left's label. The stage 4
          // browser check found two buttons reading the same three words side by
          // side, which is a worse problem read aloud than it is read on screen.
          // This one says what it does that the other does not.
          buyLabel={SHELF.glycolysisBuy.text}
          onBuy={() => {
            runtime.buyGlycolysisStep();
          }}
        />

        {/*
          THE LAST SLOT IN THE ACT. UPDATELOGV10.md stage 3.

          It stays locked until the glycolytic ladder is finished, because the
          reserve is charged out of the spare intracellular glucose the top of
          that ladder produces, and because a buffer against the food running
          out only means anything once the food running out is in sight.
        */}
        <Slot
          title={UNLOCKS.glycogenStorage.text}
          badge={UNLOCKS.glycogenStorage.badge}
          detail={atTopOfGlycolysis ? SHELF.glycogenDetail.text : SHELF.glycogenLocked.text}
          threshold={glycogenBought || !atTopOfGlycolysis ? null : GLYCOGEN_ATP_THRESHOLD}
          bought={glycogenBought}
          affordable={affordable.glycogen}
          buyLabel={SHELF.glycogenBuy.text}
          onBuy={() => {
            runtime.buyGlycogen();
          }}
        />
      </div>
    </section>
  );
}
