/**
 * The offline return. What happened while away.
 */

import { sourced, tuned } from '../components/Badge';
import type { Entry } from './common';
import { PART1, PART2, ABOUT_THE_BUILD } from './common';

/* ===========================================================================
   SAVE MANAGEMENT. UPDATELOGV4.md stage 5.

   DESIGN.md's screen inventory: "Save management, export to file, import,
   backup recovery on failed parse".

   Every string here is a statement about the BUILD rather than about a cell,
   which is the same case V3's "No saves yet" line was in and it takes the same
   badge treatment: Tuned, with a reason that says so. The numbers these
   sentences sit beside are a different question, and it is the one stage 5
   decided: a value measured from the player's own session and the wall clock is
   exempt from the badge contract and goes through `Figure`'s `measured` prop.
   See src/ui/components/Figure.tsx.
   =========================================================================== */

/* ===========================================================================
   THE OFFLINE RETURN. UPDATELOGV8.md stage 6.

   DESIGN.md's screen inventory has had it since 2026-07-28 as "what happened
   while away, with the event sequence", and DESIGN.md answers the open question
   docs/SIMULATION.md left: show the sequence rather than a total, because the
   piecewise steady state algorithm produces a genuine bounded event list, so
   showing it is honest and instructive. It teaches that metabolism is
   homeostatic between shocks rather than smoothly accumulating.

   IT HAS TO READ WELL IN THE BORING CASE, which is the one act 1 mostly
   produces. Most absences contain one event or none, so the design target is
   "nothing happened, and here is how much of it happened" rather than a
   highlight reel. The quiet line below is the one most players will see and it
   is not an apology.
   =========================================================================== */

export const OFFLINE_RETURN = {
  heading: {
    text: 'While you were away',
    badge: tuned(`${ABOUT_THE_BUILD}. Resolved at load, docs/SIMULATION.md Part 3`),
  },
  away: {
    text: 'Away for',
    badge: tuned(`${ABOUT_THE_BUILD}. Measured from the system clock at load`),
  },
  made: {
    text: 'ATP made while away',
    badge: sourced(`${PART2}, the payoff phase makes 4 ATP per glucose gross`),
  },
  /** The headline of the boring case, and it is a claim about cells rather than an apology. */
  steady: {
    text: 'The cell held steady the whole time. That is what a cell does between shocks.',
    badge: sourced(`${PART2}, the pathway settles once NAD+ is being recycled`),
  },
  sequenceHeading: {
    text: 'What happened',
    badge: tuned(`${ABOUT_THE_BUILD}. The event list the offline path produced`),
  },
  /** One row per run of steady state. The pool name is filled in from POOLS. */
  steadyFor: {
    text: 'Steady for',
    badge: tuned(`${ABOUT_THE_BUILD}. Time the rates did not change`),
  },
  thenRanLow: {
    text: 'then it ran low',
    badge: sourced(`${PART2}, glycolysis is limited by what the cell can take up`),
  },
  toTheEnd: {
    text: 'and it still is',
    badge: tuned(ABOUT_THE_BUILD),
  },
  /** The environment emptying is the one thing in act 1 worth saying out loud. */
  larderEmpty: {
    text: 'The food outside the cell is gone. Nothing is coming in.',
    badge: sourced(`${PART1}, the environment is a finite pool and is not replenished`),
  },
  source: `${PART2}, glycolysis and fermentation. The event list is this build's`,
  close: { text: 'Back to the cell', badge: tuned(ABOUT_THE_BUILD) },
} as const satisfies Readonly<Record<string, Entry | string>>;
