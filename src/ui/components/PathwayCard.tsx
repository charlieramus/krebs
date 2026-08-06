/**
 * The pathway. Six act 1 reactions as arrows between the pool blobs, on the
 * cream working surface.
 *
 * Four rows, in the order UPDATELOGV3.md settles plus the branch V10 adds:
 *
 *     glucose_env -> uptake  -> glucose  -> prep    -> g3p
 *     g3p         -> payoff  -> pyruvate -> ferment -> lactate
 *     pyruvate    -> ferment_ethanol     -> ethanol + co2
 *     atp         -> maintain-> adp + pi
 *
 * g3p ends the first row and starts the second, drawn twice on purpose. The
 * preparatory phase makes two trioses per glucose and the payoff phase consumes
 * them one at a time, so the handoff is where the six-carbon arithmetic becomes
 * two three-carbon fragments, and putting it at both a line end and a line start
 * is what makes that a visible seam rather than a wrap.
 *
 * Blob geometry comes from the same derivation the rail uses, so a stoichiometry
 * change moves the pathway and the rail together or neither.
 *
 * DESIGN.md line 150: a grid column holding a wide pathway SVG must set
 * min-width: 0. It is set on the column in App.tsx and again on every flex
 * child here, because a flex item defaults to min-width: auto and will refuse to
 * shrink below its content, which is the same bug wearing a different hat.
 */

import { Blob } from './Blob';
import { Card } from './Card';
import { PathwayArrow } from './PathwayArrow';
import { LANDMARKS, MOLECULES } from '../content';
import { carbonOf, phosphateOf } from '../poolCards';
import { usePrefersReducedMotion } from '../usePrefersReducedMotion';
import type { Act1PoolId } from '../../content/act1/pools';
import type { Act1ReactionId } from '../../content/act1/reactions';

const SUBSTRATE = 'var(--color-substrate)';
const ATP_ORANGE = 'var(--color-atp)';

/** Seeds match src/ui/poolCards.ts, so a molecule is the same shape everywhere. */
const SEEDS: Readonly<Record<string, number>> = {
  glucose_env: 11,
  glucose: 23,
  g3p: 37,
  pyruvate: 41,
  lactate: 59,
  ethanol: 97,
  co2: 103,
  nad: 67,
  nadh: 67,
  atp: 73,
  adp: 73,
  pi: 83,
};

const FILLS: Readonly<Record<string, string>> = {
  glucose_env: SUBSTRATE,
  glucose: SUBSTRATE,
  g3p: SUBSTRATE,
  pyruvate: SUBSTRATE,
  lactate: SUBSTRATE,
  ethanol: SUBSTRATE,
  co2: SUBSTRATE,
  atp: ATP_ORANGE,
  adp: ATP_ORANGE,
  pi: 'var(--color-white)',
  nad: 'var(--color-oxidized)',
  nadh: 'var(--color-reduced)',
};

function Node({ poolId }: { poolId: Act1PoolId }) {
  return (
    <span className="flex shrink-0 flex-col items-center gap-0.5">
      <Blob
        carbon={carbonOf(poolId)}
        phosphate={phosphateOf(poolId)}
        fill={FILLS[poolId] ?? SUBSTRATE}
        seed={SEEDS[poolId] ?? 1}
        size={42}
        label={MOLECULES[poolId].text}
      />
      <span className="text-micro font-body font-bold text-ink2">{MOLECULES[poolId].text}</span>
    </span>
  );
}

/**
 * One row of the pathway: a chain of node groups separated by reaction arrows.
 *
 * A group rather than a single pool, because `maintain` produces two things.
 * ATP hydrolyses to ADP AND inorganic phosphate, and drawing only the ADP would
 * make the phosphate look like it comes from nowhere when the payoff phase
 * consumes it two rows up. It is also what makes that row balance on sight:
 * three dots in, two dots and one dot out.
 */
function Row({
  groups,
  reactions,
  reducedMotion,
}: {
  groups: readonly (readonly Act1PoolId[])[];
  reactions: readonly Act1ReactionId[];
  reducedMotion: boolean;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      {groups.map((group, i) => (
        <span key={group.join('+')} className="flex min-w-0 flex-1 items-start gap-2">
          <span className="flex shrink-0 items-start gap-1">
            {group.map((poolId, j) => (
              <span key={poolId} className="flex items-start gap-1">
                {j > 0 ? (
                  <span className="pt-3 font-display text-card-title text-ink2">+</span>
                ) : null}
                <Node poolId={poolId} />
              </span>
            ))}
          </span>
          {reactions[i] === undefined ? null : (
            <PathwayArrow reaction={reactions[i] as Act1ReactionId} reducedMotion={reducedMotion} />
          )}
        </span>
      ))}
    </div>
  );
}

export function PathwayCard() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <Card surface="cream" className="flex min-w-0 flex-col p-4">
      {/*
        A LANDMARK AND A HEADING, added by UPDATELOGV7.md stage 4. Stage 1 read
        the accessibility tree and found the pathway with neither: a user
        navigating by structure went from the "Pools" rail straight to the
        "Unlocks" shelf, and the centre of the screen, the thing the game is
        about, was reachable only by reading linearly through it.

        The heading is `sr-only` rather than drawn. The card already says what
        it is by being the pathway, and docs/CONTENT_STYLE.md Part 6 is explicit
        that a concept carried by the picture must not also be carried by a line
        of prose. This is the pointer structure needs, not a title the screen
        was missing.
      */}
      <section aria-label={LANDMARKS.pathway.text} className="flex min-w-0 flex-col gap-6">
        <h2 className="sr-only">{LANDMARKS.pathway.text}</h2>

        <Row
          groups={[['glucose_env'], ['glucose'], ['g3p']]}
          reactions={['uptake', 'prep']}
          reducedMotion={reducedMotion}
        />
        <Row
          groups={[['g3p'], ['pyruvate'], ['lactate']]}
          reactions={['payoff', 'ferment']}
          reducedMotion={reducedMotion}
        />
        {/*
          The second way out of pyruvate, added by UPDATELOGV10.md stage 2.

          Its own row, starting from pyruvate again, for the same reason g3p is
          drawn twice one row up: the branch point is where the arithmetic
          happens and a row that wrapped would hide it. Two products in one
          group, like the maintenance row below, because a decarboxylation makes
          two things and drawing only the ethanol would make the missing carbon
          look like a rounding error rather than a molecule.

          Pyruvate's three sides against two beads and one bead is the whole
          claim, and it is on the screen rather than in a sentence.
        */}
        <Row
          groups={[['pyruvate'], ['ethanol', 'co2']]}
          reactions={['ferment_ethanol']}
          reducedMotion={reducedMotion}
        />
        {/*
          The maintenance row. Not a glycolytic step, and on the card anyway,
          because without it ATP looks like a number that only goes up. A cell
          hydrolyses ATP continuously to do the work of being alive, and this is
          the arrow that says so.
        */}
        <Row
          groups={[['atp'], ['adp', 'pi']]}
          reactions={['maintain']}
          reducedMotion={reducedMotion}
        />
      </section>
    </Card>
  );
}
