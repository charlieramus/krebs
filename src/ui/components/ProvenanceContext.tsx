/**
 * Who is offering to answer "where did this come from".
 *
 * A file of its own rather than a block inside `ProvenancePanel.tsx`, because
 * `Badge.tsx` is the affordance and the panel renders badges. One import each
 * way is a cycle; a context module both can reach is not.
 *
 * DEFAULTS TO NULL SO EVERY EXISTING ASSERTION BEHAVES AS IT DID. `Badge`
 * renders a plain pill with no provider above it, which is what the existing
 * tests expect, and becomes an affordance only where a host has offered to open
 * a panel. Same posture `OverlayOpenProvider` takes for the coach mark.
 */

import { createContext, useContext, type ReactNode } from 'react';
import type { BadgeSpec } from './Badge';

/** What the affordance calls when the player asks. */
export type OpenProvenance = (badge: BadgeSpec | null, measured?: string) => void;

const ProvenanceContext = createContext<OpenProvenance | null>(null);

export function ProvenanceProvider({
  onOpen,
  children,
}: {
  onOpen: OpenProvenance;
  children: ReactNode;
}) {
  return <ProvenanceContext.Provider value={onOpen}>{children}</ProvenanceContext.Provider>;
}

export function useOpenProvenance(): OpenProvenance | null {
  return useContext(ProvenanceContext);
}
