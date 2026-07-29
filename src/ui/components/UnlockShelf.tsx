/**
 * The unlock shelf. DESIGN.md: dashed slots for what is not bought yet, and
 * locked content stays visible and dimmed rather than hidden, because seeing
 * what is coming is the genre's engine.
 *
 * Two slots, both finite. `ferment` once, which is the teaching beat. Uptake
 * capacity in a fixed enumerated number of steps, because CLAUDE.md hard rule 3
 * forbids infinite scaling and an upgrade with no last step is infinite scaling
 * wearing a small number.
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

import { useState } from 'react';
import { useLiveNode, useRuntime, useSnapshotEffect } from '../RuntimeContext';
import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';
import { Figure } from './Figure';
import { UNLOCKS } from '../content';
import {
  FERMENT_ATP_THRESHOLD,
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
    const colour = reached ? 'var(--color-gain)' : 'var(--color-ink2)';
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
      <span className="text-micro font-body font-bold text-ink2">of</span>
      <Figure
        value={threshold}
        decimals={0}
        size="micro"
        badge={TUNING_BADGES.fermentThreshold}
        badgeDisplay="attached"
      />
      <span className="text-micro font-body font-bold text-ink2">ATP made</span>
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
}: {
  title: string;
  badge: Parameters<typeof Badge>[0]['badge'];
  detail: string;
  threshold: number | null;
  bought: boolean;
  affordable: boolean;
  onBuy: () => void;
  buyLabel: string;
}) {
  return (
    <Card
      surface={bought ? 'mint' : 'white'}
      dashed={!bought}
      dimmed={!bought && !affordable}
      className="flex min-w-0 flex-1 flex-col gap-2 p-3"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="font-display font-semibold text-card-title leading-tight">{title}</span>
        <Badge badge={badge} />
      </span>

      <span className="text-micro font-body font-semibold text-ink2">{detail}</span>

      {threshold === null ? null : <Progress threshold={threshold} />}

      <Button surface={bought ? 'mint' : 'white'} disabled={bought || !affordable} onClick={onBuy}>
        {bought ? 'Running' : buyLabel}
      </Button>
    </Card>
  );
}

export function UnlockShelf() {
  const runtime = useRuntime();

  // Discrete events, so React state. Mirrors the snapshot rather than owning it:
  // the runtime is the authority and refuses a purchase it cannot afford.
  const [fermentBought, setFermentBought] = useState(runtime.snapshot.fermentUnlocked);
  const [uptakeStep, setUptakeStep] = useState(runtime.snapshot.uptakeStep);
  const [affordable, setAffordable] = useState({ ferment: false, uptake: false });

  useSnapshotEffect((snapshot) => {
    const nextFerment =
      !snapshot.fermentUnlocked && snapshot.meter.atpProduced >= FERMENT_ATP_THRESHOLD;
    const uptakeThreshold = UPTAKE_ATP_THRESHOLDS[snapshot.uptakeStep];
    const nextUptake =
      uptakeThreshold !== undefined && snapshot.meter.atpProduced >= uptakeThreshold;
    setAffordable((current) =>
      current.ferment === nextFerment && current.uptake === nextUptake
        ? current
        : { ferment: nextFerment, uptake: nextUptake },
    );
  });

  const atTopOfLadder = uptakeStep >= UPTAKE_VMAX_STEPS.length - 1;
  const nextThreshold = UPTAKE_ATP_THRESHOLDS[uptakeStep] ?? null;

  return (
    <section aria-label="Unlocks" className="flex min-w-0 flex-col gap-2">
      <span className="flex items-center gap-2">
        <h2 className="font-display font-semibold text-card-title uppercase tracking-label text-ink2">
          Unlocks
        </h2>
      </span>

      <div className="flex min-w-0 flex-wrap gap-3">
        <Slot
          title={UNLOCKS.ferment.text}
          badge={UNLOCKS.ferment.badge}
          detail="Reduces pyruvate to lactate and oxidises NADH back to NAD+. Produces no ATP."
          threshold={fermentBought ? null : FERMENT_ATP_THRESHOLD}
          bought={fermentBought}
          affordable={affordable.ferment}
          buyLabel="Express it"
          onBuy={() => {
            if (runtime.buyFerment()) setFermentBought(true);
          }}
        />

        <Slot
          title={UNLOCKS.uptakeCapacity.text}
          badge={UNLOCKS.uptakeCapacity.badge}
          detail={
            atTopOfLadder
              ? 'At the top of the ladder. Uptake is no longer the limiting step.'
              : 'More transport across the membrane. A fixed number of steps, and this is not the last.'
          }
          threshold={atTopOfLadder ? null : nextThreshold}
          bought={atTopOfLadder}
          affordable={affordable.uptake && !atTopOfLadder}
          buyLabel="Add capacity"
          onBuy={() => {
            if (runtime.buyUptakeStep()) setUptakeStep(runtime.snapshot.uptakeStep);
          }}
        />
      </div>
    </section>
  );
}
