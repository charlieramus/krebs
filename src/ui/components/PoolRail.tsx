/**
 * The left rail. DESIGN.md, Layout: resource pools, one card each.
 *
 * Eight cards from ten pools, in pathway order rather than in any order that
 * looks tidy: environment, uptake, both halves of glycolysis, the end product,
 * then the two carrier pairs and free phosphate. Reading the rail top to bottom
 * is reading the pathway, which is the same order src/content/act1/pools.ts
 * chose and for the same reason.
 */

import { LANDMARKS } from '../content';
import { POOL_CARDS } from '../poolCards';
import { PoolCard } from './PoolCard';

export function PoolRail() {
  return (
    <nav aria-label={LANDMARKS.pools.text} className="flex flex-col gap-3">
      {POOL_CARDS.map((spec) => (
        <PoolCard key={spec.id} spec={spec} />
      ))}
    </nav>
  );
}
