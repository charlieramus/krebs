/**
 * The pathway card. One entry per reaction, and the arrows read from it.
 */

import { sourced, tuned } from '../components/Badge';
import type { Act1ReactionId } from '../../content/act1/reactions';
import type { Entry } from './common';
import { PART1, PART2 } from './common';

/* ===========================================================================
   REACTIONS
   =========================================================================== */

export const REACTIONS: Readonly<Record<Act1ReactionId, Entry>> = {
  uptake: {
    text: 'Uptake',
    // No transporter is named and no energetic cost is charged. That is a
    // disclosed simplification rather than an omission, so the badge points at
    // the disclosure rather than claiming a mechanism.
    badge: sourced(`${PART1}, glucose uptake is modeled as untyped transport`),
  },
  prep: { text: 'Preparatory phase', badge: sourced(`${PART2}, steps 1 to 5`) },
  payoff: { text: 'Payoff phase', badge: sourced(`${PART2}, steps 6 to 10`) },
  ferment: { text: 'Lactate fermentation', badge: sourced(`${PART2}, fermentation`) },
  ferment_ethanol: {
    text: 'Ethanol fermentation',
    // One arrow standing for two enzymes, which is the same posture `prep` and
    // `payoff` take for five each. The badge names the pathway rather than an
    // enzyme, because naming one of the two would say the other is not there.
    badge: sourced(`${PART2}, ethanol fermentation`),
  },
  store: {
    text: 'Glycogen synthesis',
    // The stoichiometry is sourced and the placement of the cost is not. See
    // the `store` comment in src/content/act1/reactions.ts and the structural departure in docs/ECONOMY.md: the
    // real cycle costs 2 ATP in and refunds 1 on the way out, this charges the
    // net of 1 at the front, and the badge says which half is which.
    badge: tuned(
      'Storing and retrieving a glucose really costs 1 ATP equivalent, which is sourced. Charging all of it at the storing end is not',
    ),
  },
  mobilise: {
    text: 'Glycogen breakdown',
    badge: sourced(`${PART2}, glycogen phosphorylase spends no ATP`),
  },
  maintain: {
    text: 'Maintenance',
    // The stoichiometry is real: ATP hydrolyses to ADP and inorganic phosphate.
    // What is invented is that the whole rest of cellular metabolism is one
    // saturating reaction in ATP, and since UPDATELOGV5.md stage 2, that its
    // response is cooperative. The badge below says the invented part out loud
    // and does not name a curve, which is why it did not have to change.
    badge: tuned(
      'ATP hydrolysis to ADP and phosphate is real. Standing in for the entire rest of cellular metabolism with one reaction is not',
    ),
  },
};
