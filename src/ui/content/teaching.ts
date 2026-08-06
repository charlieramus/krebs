/**
 * The coach marks and the teaching panel. The two surfaces whose whole job is
 * explaining, and the affordance that opens the second from the shelf.
 */

import { sourced, tuned } from '../components/Badge';
import type { Entry } from './common';
import { PART2, ABOUT_THE_BUILD } from './common';

/* ===========================================================================
   THE COACH MARK

   One, on the carrier card. DESIGN.md's anatomy: heading with badge, at most
   two paragraphs, an action, and a mandatory source row.

   TWO PARAGRAPHS IS A HARD CEILING and this fits inside it, which is a finding
   rather than an accident: the constraint is genuinely one idea. The pool is
   small and fixed, and the payoff phase is the only thing that spends it. What
   did NOT fit is the part players find most surprising, that fermentation buys
   throughput and buys exactly zero yield. That is reported in stage 3 rather
   than crammed in, and it belongs on the unlock or in a teaching panel.
   =========================================================================== */

/**
 * What a coach mark's action button does.
 *
 * DESIGN.md's anatomy makes the action row part of a coach mark, so it is not
 * optional and this is how a mark with nothing to sell still has one. Two of the
 * three marks escalate to the teaching panel instead, which is the escalation
 * docs/CONTENT_STYLE.md Part 5 describes: a concept that will not fit its
 * ceiling moves up one surface rather than overflowing.
 */
export type CoachMarkAction = 'buy-ferment' | 'open-panel';

export interface CoachMark {
  readonly heading: Entry;
  readonly body: readonly Entry[];
  readonly action: Entry;
  readonly actionKind: CoachMarkAction;
  /** Mandatory. DESIGN.md: a coach mark without a source row does not ship. */
  readonly source: string;
}

/** The mark's own furniture. DESIGN.md's 16px info affordance and the way out. */
export const COACH = {
  affordance: { text: 'i', badge: tuned(ABOUT_THE_BUILD) },
  dismiss: { text: 'Dismiss', badge: tuned(ABOUT_THE_BUILD) },
} as const satisfies Readonly<Record<string, Entry>>;

export const NAD_COACH_MARK: CoachMark = {
  heading: { text: 'NAD+ has run out', badge: sourced(`${PART2}, the NAD+ constraint`) },
  body: [
    {
      text: 'The payoff phase reduces NAD+ to NADH, and it is the only reaction here that spends NAD+. The pool is small and fixed, so once it is all NADH the pathway stops.',
      badge: sourced(`${PART2}, the NAD+ constraint`),
    },
    {
      text: 'Glucose is still arriving and the cell is still full of it. This is not starvation. Nothing is recycling the carrier.',
      badge: sourced(`${PART2}, glycolysis halts within seconds regardless of glucose availability`),
    },
  ],
  action: {
    text: 'Show me what recycles it',
    badge: sourced(`${PART2}, fermentation exists to regenerate NAD+`),
  },
  actionKind: 'buy-ferment',
  source: `${PART2}, the NAD+ constraint`,
};

/* ===========================================================================
   THE TEACHING LAYER. UPDATELOGV6.md stage 4.

   TWO MORE COACH MARKS AND THE TEACHING PANEL DESIGN.md HAS SPECIFIED SINCE
   2026-07-28. The two-paragraph ceiling has never bound, because there has only
   ever been one mark and V3 reported that the NAD+ constraint is genuinely one
   idea. It binds now, and the thing it binds against is the one V3 named when it
   said what did not fit: that fermentation buys throughput and buys exactly zero
   yield. That went to the panel rather than being crammed into a bubble.

   THE PANEL IS DISCHARGING TWO EXPLICIT INSTRUCTIONS FROM docs/SCIENCE.md, NOT
   ANSWERING A DESIGN PREFERENCE. Part 2 says of the net figure: "This is worth
   surfacing in-game because the gross figure of 4 is a common point of
   confusion." And of fermentation: "Framing it as an energy pathway is a common
   misconception and the game should correct it directly." Both are orders to the
   interface and neither had been carried out.
   =========================================================================== */

/**
 * Sides equal carbons, on the card where the arithmetic is visible.
 *
 * DESIGN.md's argument for illustration rule 1 is that a player told once that a
 * six-sided blob has six carbons can read the whole pathway from then on. Told
 * ONCE. Nothing in the game had ever told them, so the design's central claim
 * was being made to nobody. This is the once, and the g3p card is where it goes,
 * because the split is the only place the arithmetic is on screen.
 */
export const CARBON_COACH_MARK: CoachMark = {
  heading: {
    text: '6 carbons, split in two',
    badge: sourced(`${PART2}, glycolysis, one glucose is cleaved into two trioses`),
  },
  body: [
    {
      text: 'Every blob on this screen has one side per carbon, so glucose has 6 sides and this has 3.',
      // The counts are sourced and the drawing convention is not, which is the
      // distinction this badge exists to keep. Same shape as the mixed-provenance
      // badges elsewhere in this file.
      badge: tuned(
        `Carbon counts are sourced, ${PART2}. Drawing a carbon as a side is this game's convention and is not`,
      ),
    },
    {
      text: 'The preparatory phase splits one glucose into two of these, so the payoff phase runs twice for every turn the preparatory phase takes.',
      badge: sourced(`${PART2}, glycolysis, the payoff phase runs on each of two fragments`),
    },
  ],
  action: {
    text: 'Show me the yield',
    badge: sourced(`${PART2}, 4 ATP gross and 2 net per glucose`),
  },
  actionKind: 'open-panel',
  source: `${PART2}, glycolysis`,
};

/**
 * What ATP is, on the card that shows it not going up.
 *
 * THE CLOSED ADENYLATE POOL IS NOT SOURCED AND THE BADGE SAYS SO. docs/SCIENCE.md
 * says nothing about the adenylate total being fixed, and a real cell synthesises
 * adenine nucleotides. What IS sourced is the stoichiometry: every reaction in
 * act 1 converts one of the pair into the other, so under this pathway the sum
 * does not move. Closing the pool is the game's decision and it has a structural
 * entry in docs/ECONOMY.md rather than a row. Writing a plausible Sourced badge
 * here would have been the failure the badge contract exists to prevent.
 */
export const ATP_COACH_MARK: CoachMark = {
  heading: {
    text: 'ATP does not pile up',
    badge: tuned(
      `Every act 1 reaction converts one of the pair into the other, which is sourced, ${PART2}. That the total is closed is this game's model of a cell`,
    ),
  },
  body: [
    {
      text: 'ATP and ADP are one pool. Making ATP spends ADP and spending ATP makes ADP back, so the two always add up to the same number.',
      badge: tuned(
        `The conversions are sourced, ${PART2}. A cell with a fixed adenylate total is a simplification this game makes`,
      ),
    },
    {
      text: 'So the amount is not a score. Everything else the cell does spends ATP again, and what changes is how fast it arrives.',
      badge: tuned(
        'One reaction stands in for everything else a cell spends ATP on. See the Maintenance step on the pathway',
      ),
    },
  ],
  action: {
    text: 'Show me the yield',
    badge: sourced(`${PART2}, 4 ATP gross and 2 net per glucose`),
  },
  actionKind: 'open-panel',
  source: `${PART2}, glycolysis`,
};

/* ===========================================================================
   THE TEACHING PANEL

   DESIGN.md's screen inventory: "overlay for concepts too long for a bubble".
   Same contract a coach mark has, a heading with a badge and a mandatory source
   row, and docs/CONTENT_STYLE.md Part 5 caps it at 6 paragraphs and 1400
   characters. Longer than two paragraphs is the whole reason it exists. It is
   not unbounded, and a concept that will not fit here is two concepts.

   THIS IS SUCCESS CONDITION 2 IN ACT 1 FORM. docs/PILLARS.md wants a player who
   can explain why aerobic respiration yields roughly fifteen times more ATP than
   fermentation. Act 1 cannot make that comparison, because it has one pathway.
   What it can do is establish the half of the claim that is in front of the
   player: what one glucose is worth here, that nothing on the shelf changes it,
   and that fermentation adds none of it.
   =========================================================================== */

export interface TeachingPanel {
  readonly heading: Entry;
  readonly body: readonly Entry[];
  /** Mandatory, to the same contract a coach mark has. */
  readonly source: string;
  readonly close: Entry;
}

export const YIELD_PANEL: TeachingPanel = {
  heading: {
    text: 'What one glucose is worth',
    badge: sourced(`${PART2}, net per glucose`),
  },
  body: [
    {
      text: 'The preparatory phase spends 2 ATP to split one glucose into two 3-carbon pieces. The payoff phase makes 2 ATP from each piece. That is 4 made and 2 spent, so 2 net.',
      badge: sourced(`${PART2}, glycolysis, 4 ATP gross and 2 net per glucose`),
    },
    {
      // docs/SCIENCE.md Part 2, verbatim on the point: "The 2 ATP figure is net
      // of the 2 ATP investment. This is worth surfacing in-game because the
      // gross figure of 4 is a common point of confusion."
      text: 'The 4 is the number most people remember and the 2 is the one that leaves the cell better off. Both are true and they are not the same claim.',
      badge: sourced(`${PART2}, the gross figure of 4 is a common point of confusion`),
    },
    {
      text: 'Nothing on the unlock shelf moves that 2. More transport brings glucose in faster. More glycolytic capacity runs both phases faster. Neither changes what one glucose is worth.',
      badge: sourced(`${PART2}, the net yield is fixed by the stoichiometry of the pathway`),
    },
    {
      // Part 2 again, verbatim: "Framing it as an energy pathway is a common
      // misconception and the game should correct it directly."
      text: 'Lactate fermentation makes no ATP at all. It takes the NADH the payoff phase made and turns it back into NAD+, which is the only thing that was stopping the pathway. It buys rate and nothing else.',
      badge: sourced(`${PART2}, fermentation produces zero additional ATP`),
    },
    {
      text: 'So the two headline numbers do different things. ATP per second climbs every time something is bought. ATP per glucose sits at 2 and stays there.',
      badge: tuned(
        `The ceiling of 2 net is sourced, ${PART2}. That the top bar is where a player would notice it is a claim about this interface`,
      ),
    },
  ],
  source: `${PART2}, glycolysis and fermentation`,
  close: { text: 'Close', badge: tuned(ABOUT_THE_BUILD) },
};

/**
 * The affordance that opens the panel from the unlock shelf.
 *
 * The two new coach marks escalate into the panel, but a player who dismissed
 * both, or who never opened either, would never reach the most important thing
 * in the act. So it also hangs off the fermentation slot, which is the purchase
 * the panel is about. V3's own note said this belongs "on the unlock or in a
 * teaching panel"; it is on both.
 */
export const PANEL_AFFORDANCE: Entry = {
  text: 'About the yield',
  badge: tuned(ABOUT_THE_BUILD),
};
