/**
 * Pools. The state the simulation moves around.
 *
 * The kernel does not know what a pool means. It knows an id, a label, an
 * amount and which conserved quantities the pool carries. Whether that pool is
 * glucose or NAD+ is V2's problem.
 *
 * Layout is dictated by docs/SIMULATION.md Part 5: no iteration over object
 * keys in flux computation. Amounts live in one Float64Array, the id-to-index
 * map is built once at construction and frozen, and every lookup by id happens
 * at setup time. The hot path sees indices only.
 */

/**
 * A conserved quantity is named by a plain string, deliberately. V2 will use
 * "carbon", "phosphate" and "redox", but the kernel has no business knowing
 * that, and a union type here would push content knowledge down into the
 * engine.
 */
export type ConservedId = string;

export interface PoolDefinition {
  /** Permanent. docs/SAVE_SCHEMA.md, "Ids are permanent". */
  readonly id: string;
  /** Player-facing name. Not used by the kernel. */
  readonly label: string;
  /** Amount at construction and after reset. */
  readonly initial: number;
  /**
   * Which conserved quantities one unit of this pool contributes to, and at
   * what stoichiometric weight. A pool may contribute to more than one: a
   * three-carbon phosphorylated molecule carries both carbon and phosphate,
   * so `{ carbon: 3, phosphate: 1 }`.
   *
   * Iterated once at construction and never again. The conservation test reads
   * the flat weight matrix built from it, not this object.
   */
  readonly conserved: Readonly<Record<ConservedId, number>>;
}

export class PoolRegistry {
  /** Live amounts, indexed by pool index. The hot path writes here. */
  readonly amounts: Float64Array;

  /** Amounts at construction, for reset. */
  private readonly initialAmounts: Float64Array;

  /** Frozen id-to-index map. Setup-time lookups only. */
  readonly index: Readonly<Record<string, number>>;

  readonly ids: readonly string[];
  readonly labels: readonly string[];
  readonly count: number;

  /** Ordered conserved quantity names. Index into this is a quantity index. */
  readonly conservedIds: readonly ConservedId[];

  /**
   * Flat weight matrix, `conservedIds.length` rows by `count` columns, indexed
   * as `quantityIndex * count + poolIndex`. Flat rather than nested so that
   * totalling a quantity is one linear pass over contiguous memory with no
   * object access at all.
   */
  private readonly conservedWeights: Float64Array;

  constructor(definitions: readonly PoolDefinition[]) {
    this.count = definitions.length;
    this.amounts = new Float64Array(this.count);
    this.initialAmounts = new Float64Array(this.count);

    const ids: string[] = [];
    const labels: string[] = [];
    const index: Record<string, number> = {};
    const conservedIds: ConservedId[] = [];

    for (let i = 0; i < definitions.length; i += 1) {
      const def = definitions[i] as PoolDefinition;
      if (index[def.id] !== undefined) {
        throw new Error(`PoolRegistry: duplicate pool id "${def.id}"`);
      }
      if (!Number.isFinite(def.initial) || def.initial < 0) {
        throw new Error(`PoolRegistry: pool "${def.id}" has a non-finite or negative initial amount`);
      }
      index[def.id] = i;
      ids.push(def.id);
      labels.push(def.label);
      this.amounts[i] = def.initial;
      this.initialAmounts[i] = def.initial;

      // The one place object keys are iterated. Construction, not flux.
      for (const quantity of Object.keys(def.conserved)) {
        if (!conservedIds.includes(quantity)) conservedIds.push(quantity);
      }
    }

    conservedIds.sort(); // Fixed order regardless of definition order. Determinism.

    this.conservedWeights = new Float64Array(conservedIds.length * this.count);
    for (let q = 0; q < conservedIds.length; q += 1) {
      const quantity = conservedIds[q] as ConservedId;
      for (let i = 0; i < definitions.length; i += 1) {
        const weight = (definitions[i] as PoolDefinition).conserved[quantity] ?? 0;
        if (!Number.isFinite(weight) || weight < 0) {
          throw new Error(
            `PoolRegistry: pool "${ids[i] as string}" has an invalid weight for "${quantity}"`,
          );
        }
        this.conservedWeights[q * this.count + i] = weight;
      }
    }

    this.ids = Object.freeze(ids);
    this.labels = Object.freeze(labels);
    this.index = Object.freeze(index);
    this.conservedIds = Object.freeze(conservedIds);
  }

  /** Setup-time lookup. Throws rather than returning -1, because a typo here is a wiring bug. */
  indexOf(id: string): number {
    const i = this.index[id];
    if (i === undefined) throw new Error(`PoolRegistry: unknown pool id "${id}"`);
    return i;
  }

  /** Setup-time and diagnostic read. Not for the hot path, which uses `amounts` directly. */
  get(id: string): number {
    return this.amounts[this.indexOf(id)] as number;
  }

  /** Setup-time and test-harness write. Not for the hot path. */
  set(id: string, amount: number): void {
    this.amounts[this.indexOf(id)] = amount;
  }

  /** Restore every pool to its definition's initial amount. */
  reset(): void {
    this.amounts.set(this.initialAmounts);
  }

  /**
   * Total of one conserved quantity across every pool, weighted.
   *
   * This is what the conservation property test asserts on. One linear pass,
   * arrays only, so the test measures the simulation rather than the shape of
   * the accounting code.
   */
  totalConserved(quantity: ConservedId): number {
    const q = this.conservedIds.indexOf(quantity);
    if (q === -1) throw new Error(`PoolRegistry: unknown conserved quantity "${quantity}"`);
    const offset = q * this.count;
    let total = 0;
    for (let i = 0; i < this.count; i += 1) {
      total += (this.conservedWeights[offset + i] as number) * (this.amounts[i] as number);
    }
    return total;
  }
}
