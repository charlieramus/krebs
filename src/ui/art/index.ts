/**
 * The drawn assets, and the one place a stop id becomes a picture.
 *
 * A re-export plus one table. See src/ui/art/README.md for the governance rule
 * and src/ui/__tests__/art.test.ts for the mechanism that holds it.
 */

import type { ComponentType } from 'react';
import type { ActVitality } from '../../content/acts';
import type { StopId } from '../timeline';

import { AerobicEukaryote } from './AerobicEukaryote';
import { BandedIron } from './BandedIron';
import { BeastLively } from './BeastLively';
import { BeastPowered } from './BeastPowered';
import { BeastSick } from './BeastSick';
import { BeastSluggish } from './BeastSluggish';
import { Cyanobacterium } from './Cyanobacterium';
import { Endosymbiosis } from './Endosymbiosis';
import { MicrobialMat } from './MicrobialMat';
import { ModernCell } from './ModernCell';
import { VentChimney } from './VentChimney';

export { ART_STROKE, ArtFrame } from './ArtFrame';
export {
  AerobicEukaryote,
  BandedIron,
  BeastLively,
  BeastPowered,
  BeastSick,
  BeastSluggish,
  Cyanobacterium,
  Endosymbiosis,
  MicrobialMat,
  ModernCell,
  VentChimney,
};

/**
 * One figure per stop, keyed exhaustively, so a stop added without a figure does
 * not compile.
 */
export const STOP_FIGURES: Readonly<Record<StopId, ComponentType<{ size: number }>>> = {
  now: ModernCell,
  eukaryotes: AerobicEukaryote,
  endosymbiosis: Endosymbiosis,
  goe: BandedIron,
  photosynthesis: Cyanobacterium,
  mats: MicrobialMat,
  vents: VentChimney,
};

/**
 * One drawing per reading, keyed exhaustively over `ActVitality`, so a fifth
 * state cannot be added to the union without a picture for it.
 *
 * Two of the four are unreachable in act 1 and are drawn anyway. See
 * `BeastSick.tsx` for why.
 */
export const BEAST_FIGURES: Readonly<Record<ActVitality, ComponentType<{ size: number }>>> = {
  lively: BeastLively,
  sluggish: BeastSluggish,
  sick: BeastSick,
  powered: BeastPowered,
};
