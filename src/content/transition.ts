/**
 * The endosymbiosis transition. UPDATELOGV14.md stage 3.
 *
 * ---------------------------------------------------------------------------
 * THE ONE IRREVERSIBLE DECISION IN THE GAME, AND THE ONLY UNDO
 * ---------------------------------------------------------------------------
 *
 * docs/PILLARS.md rule 1 rejects repeatable prestige resets. docs/PROGRESSION.md
 * replaces them with exactly one hard transition, at the act 2 to act 3
 * boundary, and multicellularity was cut on 2026-07-27, so this is the only one
 * there will ever be. A stranger arrives. The player keeps it or digests it.
 *
 * Keeping is the only path forward. Digesting gives a large one-off ATP payout
 * and a soft lock, deliberately, as a teaching moment about short-term against
 * structural gains. docs/PROGRESSION.md is explicit that the lock is the lesson
 * and not a punishment, and asks for an undo on this one decision.
 *
 * SO THE UNDO IS BUILT FIRST AND IT IS THE ONLY SNAPSHOT THIS GAME EVER TAKES.
 * What it is not, stated here because a mechanism like this attracts uses:
 *
 *   not a save-scumming mechanic. One decision, one snapshot, and no code
 *     anywhere else may write `save.snapshot`
 *   not generalisable. It is not an undo stack and not a rewind. There is no
 *     way to take a second snapshot and no API that offers one
 *   not a second save slot. `storage.ts` has a backup slot already and it is a
 *     different thing: that one protects a failed write, this one is content
 *
 * ---------------------------------------------------------------------------
 * WHY THIS FILE IS IN src/content/ AND WHAT IT DOES NOT IMPORT
 * ---------------------------------------------------------------------------
 *
 * It composes act descriptors and saves and it renders nothing, so it sits
 * beside `actStart.ts` and `actJump.ts` under the rule in
 * `src/content/README.md`: content may depend on `src/sim/`, never the reverse,
 * and never on `src/ui/`.
 *
 * It is pure. Every function here takes a save and returns a save. Nothing reads
 * a clock, nothing writes storage, and nothing calls the PRNG, which is what
 * lets the whole thing be tested by value rather than by driving a runtime.
 *
 * ---------------------------------------------------------------------------
 * WHAT IS LOST, WHICH IS THE PART THAT LOOKS LIKE A BUG AND IS NOT
 * ---------------------------------------------------------------------------
 *
 * docs/PROGRESSION.md: the endosymbiont is a separate entity with its own
 * genome and the player does not have full authority over it initially, so
 * some direct control goes away. An idle game that takes an upgrade away is
 * doing something unusual, and it is the same move act 2 makes with damage.
 *
 * THE LOSS IS NOT MODELLED AS DELETION and that is a decision rather than an
 * implementation detail. Deleting unlock ids would destroy the record of what
 * the player earned, and endosymbiotic gene transfer is the act 3 mechanic that
 * gives control back, so the game has to know what it is giving back. The loss
 * is therefore a property of act 3's own unlock gating: the reactions the
 * endosymbiont runs are not tunable until the matching `gene-transfer-N` rung
 * is bought. That is act 3 content and it belongs to a later stage. What this
 * file owns is that the transition SAYS so, through `TransitionOutcome.lost`,
 * so the player is told rather than left to notice.
 *
 * **Losing control silently reads as a bug. Losing it with a stated reason
 * reads as biology.**
 */

import { deserialize, serialize } from '../save/codec';
import { parseAndMigrate } from '../save/migrations';
import type { EndosymbiontState, SaveV2 } from '../save/schema';
import { actStartState } from './actStart';
import { findAct, type ActCaptureContext, type ActDescriptor } from './acts';

/** Keep the stranger, or digest it. There is no third answer and no default. */
export type TransitionChoice = 'kept' | 'digested';

/**
 * The act the transition leads into.
 *
 * Three rather than a parameter, because docs/PROGRESSION.md places the single
 * hard transition at the act 2 to act 3 boundary and nowhere else. A function
 * that took the target act would be offering to run this at a boundary that has
 * no stranger in it.
 */
export const TRANSITION_TARGET_ACT = 3;

export type TransitionResult =
  | { readonly kind: 'ok'; readonly save: SaveV2; readonly outcome: TransitionOutcome }
  /**
   * The target act is not in the registry. Not an error and not a crash.
   *
   * `findAct` returns null rather than clamping for the reason V11 gave: a
   * clamp succeeds, quietly, at something other than what was asked. The same
   * posture applies here, and act 3 becomes reachable the day it is registered
   * with no edit to this file.
   */
  | { readonly kind: 'act-not-built'; readonly act: number }
  /** The save has already been through this. One decision, taken once. */
  | { readonly kind: 'already-taken'; readonly endosymbiont: EndosymbiontState };

export interface TransitionOutcome {
  readonly choice: TransitionChoice;
  /**
   * ATP granted once, on the digest path only, and zero on the keep path.
   *
   * The figure itself is act 3 balance and lives in docs/ECONOMY.md when act 3
   * has a tuning file. This function takes it as an argument rather than
   * holding one, so that no tuned number lives in `src/content/` outside a
   * tuning file, which is the rule `docs/ECONOMY.md` states about itself.
   */
  readonly payout: number;
  /** Whether the run can continue. False is the soft lock, and it is the lesson. */
  readonly canContinue: boolean;
  /**
   * What direct control the player no longer has, as act 3 unlock ids.
   *
   * Empty on the digest path, because a digested endosymbiont was never
   * acquired and nothing about the host changed.
   */
  readonly lost: readonly string[];
}

export interface TransitionOptions {
  /** ATP granted on the digest path. Zero on the keep path, and ignored there. */
  readonly digestPayout: number;
  /** Passed to the target act's `capture`, exactly as the runtime passes it. */
  readonly context: ActCaptureContext;
  /**
   * Act 3 unlock ids the player cannot tune until gene transfer returns them.
   *
   * Supplied rather than held, for the same reason as the payout: this file
   * knows the SHAPE of the loss and act 3 knows its content.
   */
  readonly lost: readonly string[];
}

/**
 * Take the decision.
 *
 * The snapshot is the save as it stood BEFORE anything changed, serialised, and
 * it is attached to the save this returns. So the undo is carried by the thing
 * it undoes, which means a player who reloads between deciding and undoing still
 * has it, and a player who never decides never carries one.
 */
export function takeTransition(
  choice: TransitionChoice,
  before: SaveV2,
  options: TransitionOptions,
): TransitionResult {
  if (before.progression.endosymbiont !== null) {
    return { kind: 'already-taken', endosymbiont: before.progression.endosymbiont };
  }

  /*
   * SNAPSHOT FIRST, BEFORE ANY BRANCH.
   *
   * Both paths get one, including the keep path. It is tempting to snapshot only
   * the digest path on the argument that keeping is what the player wanted, and
   * it is wrong: a player who meant to read the text and clicked through has
   * taken the game's only irreversible step by accident, and that is exactly the
   * case an undo exists for.
   *
   * `before.snapshot` is null here, checked below, so the payload is one level
   * deep and the codec's nesting refusal is never reached in normal play.
   */
  const snapshot = serialize({ ...before, snapshot: null });

  if (choice === 'digested') {
    /*
     * THE SOFT LOCK. The cell stays exactly where it is, in the act it was in,
     * with everything it had, plus the payout. Nothing is taken away and nothing
     * new is opened.
     *
     * That is what makes it a lesson rather than a punishment: the player got
     * precisely what the choice offered, in full, and the thing they did not get
     * is a structure rather than a number. A game that also confiscated
     * something here would be arguing with the player about their own decision.
     */
    return {
      kind: 'ok',
      save: {
        ...before,
        progression: { ...before.progression, endosymbiont: 'digested' },
        stats: {
          ...before.stats,
          totalAtpProduced: before.stats.totalAtpProduced + options.digestPayout,
        },
        pools: addAtp(before.pools, options.digestPayout),
        snapshot,
      },
      outcome: { choice, payout: options.digestPayout, canContinue: false, lost: [] },
    };
  }

  const target = findAct(TRANSITION_TARGET_ACT);
  if (target === null) return { kind: 'act-not-built', act: TRANSITION_TARGET_ACT };

  return {
    kind: 'ok',
    save: keptSave(target, before, snapshot, options),
    outcome: { choice, payout: 0, canContinue: true, lost: options.lost.slice() },
  };
}

/**
 * The kept path: act 3 at its beginning, carrying the snapshot.
 *
 * `actStartState` is the only definition of what an act looks like at its
 * beginning and this is its third caller, after the runtime's new-game path and
 * the jump. **A transition that built act 3's opening state by hand would be the
 * second definition V13 exists to prevent.**
 *
 * Three things survive the act boundary and each one is a decision:
 *
 *   meta       createdAt and buildId, because this is the same run. A new
 *              createdAt would say the player started over, which is the one
 *              thing docs/PILLARS.md rule 1 promises never happens
 *   time       elapsedGameMs and the offline counters, for the same reason.
 *              The clock does not reset at an act boundary
 *   stats      the lifetime meter. Cumulative ATP is a lifetime figure and the
 *              endgame summary reads it
 *
 * Everything else is act 3's own, out of the start state.
 */
function keptSave(
  target: ActDescriptor,
  before: SaveV2,
  snapshot: string,
  options: TransitionOptions,
): SaveV2 {
  const start = actStartState(target);
  const captured = target.capture(start.state, start.meter, start.unlocked, start.settings, {
    ...options.context,
    carried: start.carried,
  });

  return {
    ...captured,
    meta: { ...captured.meta, createdAt: before.meta.createdAt, buildId: before.meta.buildId },
    time: { ...before.time },
    progression: { ...captured.progression, endosymbiont: 'kept' },
    stats: { ...before.stats },
    diagnostics: { ...before.diagnostics },
    settings: { ...before.settings },
    snapshot,
  };
}

export type UndoResult =
  | { readonly kind: 'ok'; readonly save: SaveV2 }
  /** Nothing to undo. The decision has not been taken, or the undo already was. */
  | { readonly kind: 'nothing-to-undo' }
  /**
   * The snapshot is present and will not load.
   *
   * Reported rather than thrown, and the caller keeps the current save. A player
   * whose undo is broken still has the run they are in, and losing that as well
   * to a failed restore would turn one bad outcome into two.
   */
  | { readonly kind: 'corrupt'; readonly reason: string };

/**
 * Put it back exactly as it was.
 *
 * THE SNAPSHOT GOES BACK THROUGH `parseAndMigrate` rather than through
 * `deserialize` alone. A snapshot is a save, it was written at whatever schema
 * version was current when the decision was taken, and a player can take the
 * decision under one build and undo it under a later one. Handing an old shape
 * straight back would be the one place in the project where a save skips the
 * migration chain.
 *
 * The restored save has `snapshot: null`, so the undo is not itself undoable and
 * there is no way to accumulate a stack. One decision, one snapshot, one undo.
 */
export function undoTransition(save: SaveV2): UndoResult {
  if (save.snapshot === null) return { kind: 'nothing-to-undo' };

  const migrated = parseAndMigrate(save.snapshot);
  if (migrated.kind === 'corrupt') return { kind: 'corrupt', reason: migrated.reason };
  if (migrated.kind !== 'ok') {
    /*
     * A snapshot from a NEWER build than this one. Refused rather than migrated
     * downward, which is `migrations.ts`'s standing rule and applies here for
     * exactly its stated reason: this build cannot know what the fields mean.
     *
     * Reachable in the same way the future-save refusal is, through a cached
     * bundle or a rolled-back deploy.
     */
    return {
      kind: 'corrupt',
      reason: `the snapshot was written by a newer build (schema version ${migrated.version})`,
    };
  }

  // Round-tripped rather than handed back. `parseAndMigrate` produces a migrated
  // shape, and running it through the codec is what proves the migrated shape
  // passes the same validation a fresh save does before it becomes the run.
  const restored = deserialize(serialize(migrated.save));
  if (restored.kind !== 'ok') {
    return {
      kind: 'corrupt',
      reason: restored.kind === 'corrupt' ? restored.reason : 'the snapshot did not round-trip',
    };
  }

  return { kind: 'ok', save: { ...restored.save, snapshot: null } };
}

/**
 * Credit a one-off ATP payout into the pool table.
 *
 * WHY THIS IS NOT A REACTION, disclosed rather than hidden. Every other ATP in
 * this game comes out of a reaction that balanced five conserved quantities.
 * This one is a content grant written straight into the pool, so it breaks
 * adenylate conservation on the tick it lands unless the same amount of ADP is
 * removed, which is what happens here.
 *
 * Digesting an endosymbiont really does liberate its material, so a real cell
 * would gain from real chemistry rather than from nothing. The model has no
 * pools for an endosymbiont's contents, because the endosymbiont is not a set of
 * pools until it is kept. **So this is a departure and it owes docs/ECONOMY.md a
 * row when the payout has a number**, which is why the figure is an argument
 * here rather than a constant.
 */
function addAtp(pools: SaveV2['pools'], payout: number): SaveV2['pools'] {
  if (payout === 0) return { ...pools };
  const atp = pools['atp'] ?? 0;
  const adp = pools['adp'] ?? 0;
  /*
   * Bounded by the adenylate pool, which is fixed and closed. ATP is a flux and
   * not a score, and a payout larger than the ADP available cannot become ATP
   * because there is no acceptor to phosphorylate. Granting it anyway would
   * manufacture adenylate and fail the conservation test on the next tick.
   */
  const granted = Math.min(payout, adp);
  return { ...pools, atp: atp + granted, adp: adp - granted };
}
