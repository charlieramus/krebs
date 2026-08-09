/**
 * The cell, with a mitochondrion in it. DESIGN.md: act 3 onward.
 *
 * THE STATE THAT MATTERS MOST, AND THE ONLY TOPOLOGICAL CHANGE IN THIS
 * PROJECT'S ILLUSTRATION SET. A closed sub-outline inside a closed outline is a
 * compartment. Nothing else the game draws has one, act 3's whole subject is
 * that a compartment appeared, and it reads with every fill in the drawing
 * removed, because a hole in a shape is not a colour.
 *
 * DESIGN.md: the act 3 transition is drawn on the beast's body, because the
 * single irreversible step in the game should get a single irreversible visual
 * change, on the thing the player has been running all along. The same
 * sub-outline is on the endosymbiosis figure in the timeline, deliberately, so
 * the moment on the column and the moment on the body are drawn as one event.
 *
 * The cyan motion ticks DESIGN.md also gives this state are not here. They are
 * motion, they are not the second channel, and nothing in this component
 * animates. Whatever they become is act 3's decision.
 */

import { ArtFrame } from './ArtFrame';

export function BeastPowered({ size }: { size: number }) {
  return (
    <ArtFrame size={size}>
      <path d="M20 33 L16 42" fill="none" />
      <path d="M29 33 L34 40" fill="none" />
      <path
        d="M24 5 C33 5 40 12 40 21 C40 29 33 34 24 34 C15 34 8 29 8 21 C8 12 15 5 24 5 Z"
        fill="var(--color-mint)"
      />
      <circle cx="19" cy="15" r="2.6" fill="var(--color-white)" />
      <circle cx="30" cy="15" r="2.6" fill="var(--color-white)" />
      {/* The compartment. A second closed path inside the first. */}
      <ellipse cx="24" cy="26" rx="9" ry="5" fill="var(--color-white)" />
      <path d="M20 26 L28 26" fill="none" />
    </ArtFrame>
  );
}
