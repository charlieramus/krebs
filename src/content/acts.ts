/**
 * An act, as a thing rather than as an assumption.
 *
 * WHAT THIS FILE IS FOR. `src/ui/runtime.ts` was written against act 1 and
 * reaches into `src/content/act1/` by name in eleven places: it calls the
 * constructor, it builds the meter, it names five pool and reaction ids as
 * string literals, it carries a NAD+ threshold as a module constant, and it
 * calls the save mapping. None of that is wrong for a project with one act and
 * all of it is in the way of a second one. A descriptor is the runtime's way of
 * asking the running act a question instead of asking act 1.
 *
 * ---------------------------------------------------------------------------
 * WHAT IT DELIBERATELY DOES NOT HAVE
 * ---------------------------------------------------------------------------
 *
 * No oxygen schedule. No damage model. No compartments. No field without an act
 * 1 caller. `src/sim/jump.ts` refuses the same temptation in as many words:
 * "THE SEAM IS LEFT OBVIOUS AND IS NOT PRE-SOLVED. Act 2's oxygen schedule is a
 * boundary in wall-clock rather than in a pool level. Neither is answerable from
 * act 1 and neither is guessed at here."
 *
 * The same argument applies with more force here, because this file abstracts
 * over a sample size of one. NOW.md records the lesson twice as settled: a wrong
 * sentence in a specification survives until something is built on top of it,
 * found once in DESIGN.md and three times in docs/SIMULATION.md Part 3. A
 * descriptor designed against one act is that sentence waiting to happen. Every
 * field below exists because a caller in `src/ui/runtime.ts` needs it today.
 * Act 2 widens this interface, with two instances to be right about.
 *
 * ---------------------------------------------------------------------------
 * THE TYPE ALIASES, AND WHY THEY POINT AT ACT 1
 * ---------------------------------------------------------------------------
 *
 * `ActMeter`, `ActMeterProbes`, `ActRestoreResult` and `ActCarriedCounters` are
 * act 1's shapes under act-neutral names. That is the honest state of the
 * project rather than a shortcut: the meter counts ATP produced, glucose
 * consumed and lactate made, and nothing outside act 1 has ever needed a
 * different set. Widening them into a structural interface now would be
 * inventing a second act's requirements out of the first act's, which is the one
 * thing this log's Context forbids. When act 2 brings a meter of its own, these
 * aliases become the union or the generic that act 2 actually needs.
 *
 * ---------------------------------------------------------------------------
 * THE IMPORT DIRECTION
 * ---------------------------------------------------------------------------
 *
 * `src/content/` may import `src/sim/` and never the reverse. This file imports
 * `src/sim/` for its types and `src/content/act1/` for the act it registers, and
 * nothing in `src/sim/` imports it. A registry the kernel reached for would make
 * the kernel act-aware, which `src/content/README.md` calls the most expensive
 * possible place to break the rule.
 */

import type { SimulationState } from '../sim/state';
import type { OfflineObserver } from '../sim/jump';
import type { SaveSettingsV1, SaveV1 } from '../save/schema';

import type { PoolDefinition } from '../sim/pools';
import { createAct1, ACT1_REACTION_IDS } from './act1/reactions';
import { ACT1_POOL_IDS, act1PoolDefinitions } from './act1/pools';
import {
  atpPerCompletedGlucose,
  createAct1Meter,
  createAct1MeterProbes,
  netAtpPerCompletedGlucose,
  recordAct1Tick,
  type Act1Meter,
  type Act1MeterProbes,
} from './act1/meter';
import { createAct1OfflineObserver } from './act1/offline';
import {
  ACT1_NO_CARRIED_COUNTERS,
  captureAct1,
  restoreAct1,
  type Act1CaptureContext,
  type Act1CarriedCounters,
  type Act1RestoreResult,
} from './act1/save';

/** See the header. Act 1's meter, under an act-neutral name. */
export type ActMeter = Act1Meter;
export type ActMeterProbes = Act1MeterProbes;
export type ActRestoreResult = Act1RestoreResult;
export type ActCarriedCounters = Act1CarriedCounters;
export type ActCaptureContext = Act1CaptureContext;

/**
 * Construction overrides, keyed by id rather than by index.
 *
 * The same shape `createAct1` already takes, with the act's own id unions
 * widened to `string` because the descriptor cannot name another act's pools.
 * An unknown id still fails at construction, because `PoolRegistry.indexOf`
 * throws on one.
 */
export interface ActCreateOptions {
  readonly initial?: Readonly<Record<string, number>>;
  readonly vmax?: Readonly<Record<string, number>>;
  readonly km?: Readonly<Record<string, number>>;
  readonly enabled?: Readonly<Record<string, boolean>>;
  readonly seed?: number;
}

/**
 * How a cell is doing, in the four readings DESIGN.md gives the beast.
 *
 * A STATE OF A CELL RATHER THAN A NAME FOR A PICTURE, WHICH IS WHY IT CAN LIVE
 * HERE. `src/content/` may never import the interface, and this union does not:
 * lively is high throughput, sluggish is throughput near zero, sick is active
 * damage and powered is a cell with a compartment. Those are facts about a
 * simulation. What they look like is DESIGN.md's problem and the beast's.
 *
 * FOUR NAMES, AND ACT 1 CAN ONLY EVER RETURN TWO OF THEM. That is not a gap.
 * `sick` needs damage and `powered` needs a compartment, and act 1 has neither.
 * The union is complete because DESIGN.md named all four on 2026-07-28, and act
 * 2 and act 3 implement their own `vitality` rather than widening this type.
 * `acts.test.ts` asserts act 1 cannot reach either, so nothing can quietly start
 * drawing a damaged cell in an act that has no damage model.
 */
export type ActVitality = 'lively' | 'sluggish' | 'sick' | 'powered';

/**
 * One act, as everything outside `src/content/<act>/` needs to see it.
 *
 * Every member below has a caller in `src/ui/runtime.ts` today. Read the header
 * before adding one that does not.
 */
export interface ActDescriptor {
  /**
   * The act number. `progression.act` in the save, and the registry key.
   *
   * docs/SAVE_SCHEMA.md documents the field as 1 to 4. It has been written by
   * every save since V4 and read by nothing until this log.
   */
  readonly act: number;

  /** Snapshot layout, and the offline report's pool naming. */
  readonly poolIds: readonly string[];

  /**
   * This act's pool definitions, conserved weights and all.
   *
   * WHAT IT IS FOR, AND IT IS THE ONLY CALLER. DESIGN.md's illustration rules 1
   * and 2 are derived rather than drawn: a blob has six sides because glucose
   * carries six carbon, read out of this table. `src/ui/poolCards.ts` was
   * reading `act1PoolDefinitions()` directly, which is the last place in the
   * interface that named act 1 by hand after Spine A, and it meant the geometry
   * of every act would have been act 1's.
   *
   * Returns the definitions rather than a carbon-and-phosphate pair, because
   * naming those two quantities here would put illustration vocabulary into the
   * content layer, and act 3 needs a membrane and a gradient that this file
   * should not have opinions about.
   */
  poolDefinitions(): readonly PoolDefinition[];
  /** Snapshot layout. */
  readonly reactionIds: readonly string[];

  /**
   * Id to index, resolved once at module construction.
   *
   * THE RULE THE KERNEL ALREADY HOLDS AND THE RUNTIME DID NOT. `src/sim/pools.ts`
   * freezes an id-to-index map and `src/sim/steady.ts` states the rule outright:
   * no allocation after construction, indexed loops over typed arrays only. The
   * runtime's `poolIndex` was `ACT1_POOL_IDS.indexOf(id)`, a linear scan called
   * once per render from `PoolCard`. Ten ids today, a compartment's worth in act
   * 3.
   *
   * Returns -1 for an unknown id, matching `indexOf`, so a caller that was
   * checking for -1 keeps working.
   */
  poolIndex(id: string): number;
  reactionIndex(id: string): number;

  /** The constructor. Was `createAct1(options.act1 ?? {})` in the runtime. */
  create(options?: ActCreateOptions): SimulationState;

  /* ===== The meter, which lives beside the simulation and never in it ===== */

  createMeter(): ActMeter;
  createMeterProbes(state: SimulationState): ActMeterProbes;
  /** Called from the loop's tick observer, exactly as often as a tick runs. */
  recordTick(
    state: SimulationState,
    probes: ActMeterProbes,
    meter: ActMeter,
    seconds?: number,
  ): void;
  /** Carries the meter across an offline jump. docs/SIMULATION.md Part 3. */
  createOfflineObserver(probes: ActMeterProbes, meter: ActMeter): OfflineObserver;

  /**
   * The pool whose stock is the yield correction's baseline.
   *
   * Act 1's is `g3p`: trioses sitting in the pool are glucose that has been paid
   * for and has not paid out, and subtracting them is the difference between
   * reporting the sourced yield of 4 and reporting a stall as a collapse in
   * yield. The runtime held the literal.
   */
  readonly yieldBaselinePoolId: string;
  atpPerCompletedGlucose(meter: ActMeter, baselineDelta: number): number;
  netAtpPerCompletedGlucose(meter: ActMeter, baselineDelta: number): number;

  /* ===== The wall ===== */

  /**
   * Is this act's pathway walled: stopped, and not because there is nothing to
   * eat.
   *
   * A PREDICATE RATHER THAN A NUMBER, AND THAT IS THE WHOLE POINT OF IT. The
   * runtime carried `WALLED_NAD = 0.05` as a module constant and read three act 1
   * conditions inline: the payoff phase has stopped, uptake has not, and the
   * carrier is essentially all reduced. Act 2's wall is not a NAD+ level, so a
   * descriptor field called `walledNad`, or a generic `walledPoolId` plus a
   * threshold, would both be act 1's answer wearing a general name. The act
   * answers the question instead.
   *
   * Takes the arrays rather than the snapshot, and closes over indices resolved
   * once, so it allocates nothing and can be called from the per-frame path.
   *
   * @param amounts     pool amounts, `poolIds` order
   * @param appliedFlux flux the tick actually applied, `reactionIds` order
   * @param stoppedFlux applied flux below which a reaction counts as stopped
   */
  isWalled(amounts: Float64Array, appliedFlux: Float64Array, stoppedFlux: number): boolean;

  /* ===== How the cell is doing ===== */

  /**
   * How this act's cell is doing, as the act itself judges it.
   *
   * A PREDICATE ON THE SAME TERMS AS `isWalled`, AND FOR THE SAME REASON. The
   * beast is a readout of this and it must not know act 1's chemistry. A
   * descriptor field called `livelyPayoffFlux` would be act 1's answer wearing a
   * general name, and act 2's Sick state is not a flux at all. So the act
   * answers the question and the interface draws the answer.
   *
   * WHAT IT READS IS GROSS THROUGHPUT, WHICH IS THE POINT. Every pool card shows
   * a net rate by construction, and a net rate is genuinely the same 0.00
   * whether a lot is happening steadily or nothing is happening at all. Those
   * are the two situations DESIGN.md open question 7 asks about, and gross
   * throughput is the quantity that differs between them.
   *
   * `previous` is passed so an act can apply hysteresis if it needs it. Act 1
   * measured that it does not: see the comment on its implementation.
   *
   * Takes the arrays rather than the snapshot, and closes over indices resolved
   * once, so it allocates nothing and can be called from the per-frame path.
   */
  vitality(
    amounts: Float64Array,
    appliedFlux: Float64Array,
    stoppedFlux: number,
    previous: ActVitality,
  ): ActVitality;

  /* ===== The save mapping ===== */

  capture(
    state: SimulationState,
    meter: ActMeter,
    unlocked: readonly string[],
    settings: SaveSettingsV1,
    context: ActCaptureContext,
  ): SaveV1;
  restore(save: SaveV1): ActRestoreResult;
  readonly noCarriedCounters: ActCarriedCounters;
}

/**
 * NAD+ remaining below which the carrier counts as exhausted.
 *
 * Moved here from `src/ui/runtime.ts`, where it was `WALLED_NAD`, unchanged. A
 * fraction of a single unit against a nicotinamide total of 30. Not zero,
 * because the pool approaches zero asymptotically and never quite arrives, and a
 * detector that waits for exactly zero waits forever.
 *
 * It is act 1's number and it lives with act 1's descriptor rather than in the
 * runtime, which is the move this log exists to make.
 */
const ACT1_WALLED_NAD = 0.05;

/** Frozen id-to-index maps, built once, at module load. */
function indexMap(ids: readonly string[]): ReadonlyMap<string, number> {
  const map = new Map<string, number>();
  for (let i = 0; i < ids.length; i += 1) map.set(ids[i] as string, i);
  return map;
}

const ACT1_POOL_INDEX = indexMap(ACT1_POOL_IDS);
const ACT1_REACTION_INDEX = indexMap(ACT1_REACTION_IDS);

/** The three indices `isWalled` reads. Resolved once, here, never per frame. */
const ACT1_PAYOFF = ACT1_REACTION_INDEX.get('payoff') as number;
const ACT1_UPTAKE = ACT1_REACTION_INDEX.get('uptake') as number;
const ACT1_NAD = ACT1_POOL_INDEX.get('nad') as number;

export const ACT1: ActDescriptor = {
  act: 1,
  poolIds: ACT1_POOL_IDS,
  poolDefinitions: act1PoolDefinitions,
  reactionIds: ACT1_REACTION_IDS,

  poolIndex(id: string): number {
    return ACT1_POOL_INDEX.get(id) ?? -1;
  },
  reactionIndex(id: string): number {
    return ACT1_REACTION_INDEX.get(id) ?? -1;
  },

  create(options: ActCreateOptions = {}): SimulationState {
    return createAct1(options);
  },

  createMeter: createAct1Meter,
  createMeterProbes: createAct1MeterProbes,
  recordTick: recordAct1Tick,
  createOfflineObserver: createAct1OfflineObserver,

  yieldBaselinePoolId: 'g3p',
  atpPerCompletedGlucose,
  netAtpPerCompletedGlucose,

  /**
   * Three conditions, and all three are needed. Transcribed from
   * `src/ui/runtime.ts`, unchanged.
   *
   * The payoff phase has stopped, so the pathway is not producing. Uptake has
   * NOT stopped, which is what separates this from starvation: a starved cell
   * has every flux low together, and a walled cell is importing at full rate.
   * And the carrier is essentially all reduced, which is the cause rather than a
   * symptom, so a pathway that stops for some other reason a later act invents
   * does not get mislabelled as this one.
   */
  isWalled(amounts: Float64Array, appliedFlux: Float64Array, stoppedFlux: number): boolean {
    return (
      (appliedFlux[ACT1_PAYOFF] as number) < stoppedFlux &&
      (appliedFlux[ACT1_UPTAKE] as number) >= stoppedFlux &&
      (amounts[ACT1_NAD] as number) < ACT1_WALLED_NAD
    );
  },

  /**
   * Act 1 has two readings and the threshold is one it already owns.
   *
   * `stoppedFlux` is `ZERO_FLUX_THRESHOLD`, the number the pathway arrows use to
   * decide whether to draw themselves as moving, handed down by the runtime and
   * already shared with the stall detector for the reason `runtime.ts` gives:
   * if the detector and the arrows disagreed, the coach mark could open while
   * the arrows still looked alive. **The beast joins that agreement rather than
   * bringing a number of its own.** One threshold, one reading, and no third
   * value that could drift from the other two. It is also why this log adds no
   * docs/ECONOMY.md row: there is no new tuned scalar to owe one.
   *
   * The payoff phase is act 1's gross throughput, because it is the step that
   * makes the ATP. Uptake is deliberately not read: a cell importing glucose it
   * cannot process is a walled cell, and the whole point of this reading is that
   * it separates working from stopped rather than busy from idle.
   *
   * NO HYSTERESIS, AND THAT IS A MEASUREMENT RATHER THAN AN OMISSION. A discrete
   * state driven by a continuous quantity normally needs a dead band, or the
   * quantity wandering across the threshold re-renders React at whatever rate it
   * wanders. Measured over a full 70 game-minute act in
   * `beastPacing.report.test.ts`: a bare threshold produces **3 transitions
   * across 84000 frames**, and a dead band with the off level at half the on
   * level produces exactly the same 3. Act 1 does not wander across this line,
   * because the wall takes the payoff flux from about 7 to 0 inside a couple of
   * ticks and fermentation brings it back the same way. `previous` is in the
   * signature so an act whose measurement comes out differently can use it
   * without changing every caller, and the report test fails if the two counts
   * ever disagree.
   */
  vitality(_amounts: Float64Array, appliedFlux: Float64Array, stoppedFlux: number): ActVitality {
    // `previous` is deliberately not declared. A shorter parameter list still
    // satisfies the interface, and leaving it off is the clearest possible
    // statement that act 1's reading does not depend on its own last answer.
    return (appliedFlux[ACT1_PAYOFF] as number) >= stoppedFlux ? 'lively' : 'sluggish';
  },

  capture: captureAct1,
  restore: restoreAct1,
  noCarriedCounters: ACT1_NO_CARRIED_COUNTERS,
};

/**
 * Every act this build knows, in order.
 *
 * One entry. That is the whole registry and it is not a placeholder for a
 * bigger one: the shape that holds four acts is a list of four descriptors, and
 * three of them do not exist yet.
 */
export const ACTS: readonly ActDescriptor[] = [ACT1];

const BY_NUMBER = new Map<number, ActDescriptor>(ACTS.map((act) => [act.act, act]));

/** Act numbers this build knows, ascending. For an error message to quote. */
export const KNOWN_ACT_NUMBERS: readonly number[] = ACTS.map((act) => act.act);

/**
 * Look an act up by number.
 *
 * NULL RATHER THAN UNDEFINED, AND THE UNKNOWN CASE IS A REAL CASE. `progression.act`
 * is a number every save has written since V4 and nothing has ever read. After
 * this log it selects which act to run, so a save naming an act this build does
 * not have stops being inert and becomes a lookup that returns nothing. There is
 * no backend, no accounts and no way to push a fix to one player, so the failure
 * has to be representable rather than discovered at the first property access.
 *
 * Stage 5 builds the refusal path on top of this. This function's only job is to
 * make the unknown case something a caller has to handle.
 */
export function findAct(act: number): ActDescriptor | null {
  return BY_NUMBER.get(act) ?? null;
}

/** Whether this build can run the given act number. */
export function knowsAct(act: number): boolean {
  return BY_NUMBER.has(act);
}
