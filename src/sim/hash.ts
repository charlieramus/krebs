/**
 * State hashing. docs/SIMULATION.md Part 5.
 *
 * Determinism is a tested property, not an aspiration: same seed plus same
 * input sequence must produce a bit-identical state hash across runs, machines
 * and browsers. That requires a hash whose inputs are canonical, so this lives
 * in simulation code rather than in the test that uses it, and obeys the same
 * rules as everything else here.
 *
 * FNV-1a, 32 bit, over the canonical string form of the state. Not a
 * cryptographic hash and not trying to be. It has to be stable across engines
 * and cheap enough to run in CI, and multiply-xor over uint32 with Math.imul is
 * exactly specified.
 */

import type { SimulationState } from './state';

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

export function fnv1a(input: string): number {
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}

/**
 * Serialise a float so it round-trips exactly.
 *
 * `Number.prototype.toString` produces the shortest decimal string that parses
 * back to the same float64, which is exactly the round-trip property needed.
 * The one case it loses is negative zero, which stringifies to "0", so it is
 * spelled out. A pool at -0 rather than 0 is a real difference in state and the
 * hash should see it.
 */
function canonical(value: number): string {
  if (Object.is(value, -0)) return '-0';
  return String(value);
}

/**
 * Canonical string form of the full state tree, in fixed order: pool amounts in
 * registry order, then the tick count, then the PRNG algorithm, seed and state.
 *
 * Fixed order, arrays only, no object-key iteration. Field names are included
 * so that a state with a pool removed cannot collide with one that has a
 * different value in the same position.
 */
export function canonicalState(state: SimulationState): string {
  const parts: string[] = [];

  const amounts = state.pools.amounts;
  for (let i = 0; i < amounts.length; i += 1) {
    parts.push(`${state.pools.ids[i] as string}=${canonical(amounts[i] as number)}`);
  }

  parts.push(`tick=${canonical(state.tickCount)}`);
  parts.push(`rng.algorithm=${state.prng.algorithm}`);
  parts.push(`rng.seed=${canonical(state.prng.seed)}`);
  parts.push(`rng.state=${canonical(state.prng.state)}`);

  return parts.join('|');
}

/** Hash of the full state tree. This is the value the determinism test compares. */
export function hashState(state: SimulationState): string {
  return fnv1a(canonicalState(state)).toString(16).padStart(8, '0');
}
