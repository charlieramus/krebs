/**
 * The save panel. Export, import, backup recovery.
 */

import { tuned, tunedRow } from '../components/Badge';
import type { Entry } from './common';
import { ABOUT_THE_BUILD } from './common';

export const SAVE = {
  heading: {
    text: 'Save',
    badge: tuned(ABOUT_THE_BUILD),
  },
  autosaved: {
    text: 'Saved automatically',
    // UNSOURCED, and the panel says so in those words. Nothing in biology
    // corresponds to how often a browser writes to localStorage.
    badge: tunedRow(
      `${ABOUT_THE_BUILD}. Autosave interval is provisional and lives in src/save/tuning.ts`,
      'S1',
    ),
  },
  neverSaved: {
    text: 'Not saved yet',
    badge: tuned(ABOUT_THE_BUILD),
  },
  exportAction: {
    text: 'Export to file',
    badge: tuned(`${ABOUT_THE_BUILD}. Exported saves are plain readable JSON`),
  },
  importAction: {
    text: 'Import from file',
    badge: tuned(ABOUT_THE_BUILD),
  },

  /* Storage that cannot promise anything. docs/PILLARS.md rule 7 rules out a
     backend, so an honest warning is the entire mitigation and it must not be
     silent. */
  storageUnavailable: {
    text: 'This browser is not letting the game store anything. The run will not survive this tab.',
    badge: tuned(`${ABOUT_THE_BUILD}. There is no backend to fall back to, by design`),
  },
  storageFull: {
    text: 'Browser storage is full. The run will not survive this tab, and the save already on disk has not been touched.',
    badge: tuned(`${ABOUT_THE_BUILD}. The existing save is preserved by the write order`),
  },

  /* The three load outcomes that are not an ordinary load. */
  recoveryOffer: {
    text: 'The save could not be read. There is a backup from just before it.',
    badge: tuned(`${ABOUT_THE_BUILD}. The unreadable save is kept rather than deleted`),
  },
  recoveryAction: {
    text: 'Load the backup',
    badge: tuned(ABOUT_THE_BUILD),
  },
  unreadable: {
    text: 'The save could not be read and neither could the backup. Both have been left exactly as they are.',
    badge: tuned(`${ABOUT_THE_BUILD}. Nothing is overwritten, so the files stay available`),
  },
  future: {
    text: 'This save was written by a newer version of the game. It has not been loaded and it has not been changed.',
    badge: tuned(`${ABOUT_THE_BUILD}. Guessing at a newer format is how saves get destroyed`),
  },
  /*
   * The act refusal, alongside the schema one, because they are the same
   * posture. UPDATELOGV11.md stage 5.
   *
   * It says what happened and what was not done, in that order, and it does not
   * offer to fix anything, because there is nothing this build can do with a
   * save from an act it does not have. Naming the act number would be a figure
   * in prose with nowhere to put a badge, so it does not.
   */
  futureAct: {
    text: 'This save is further into the game than this version goes. It has not been loaded and it has not been changed.',
    badge: tuned(`${ABOUT_THE_BUILD}. Clamping the act would silently rewrite somebody's progress`),
  },

  /* The offline delta. Honest in both directions: no reward is implied and no
     loss is implied, because neither is true. */
  away: {
    text: 'Away for',
    badge: tuned(`${ABOUT_THE_BUILD}. Time away is measured, not simulated`),
  },
  awaySimulated: {
    // WAS "None of it has been simulated. It is being kept, not spent." That
    // was true from V4 to V7 and NOW.md called it the honest sentence that
    // would stay wrong-sounding until offline progress made it false. It is
    // false now, so the sentence goes. Replaced by UPDATELOGV8.md stage 6.
    //
    // It says "all of it" rather than naming a duration, because the duration
    // is already on the line above with a figure attached, and repeating a
    // number in prose is what docs/CONTENT_STYLE.md Part 1 is about.
    text: 'All of it has been simulated. The cell kept running.',
    badge: tuned(`${ABOUT_THE_BUILD}. docs/SIMULATION.md Part 3 resolves it at load`),
  },
  awayPartlySimulated: {
    // The budget-exhaustion case. Act 1 never reaches it, measured over 200
    // randomized absences, and the line exists because a player who did reach
    // it would otherwise be told nothing at all.
    text: 'Some of it could not be simulated and has not been counted.',
    badge: tuned(`${ABOUT_THE_BUILD}. EVENT_BUDGET in docs/SIMULATION.md Part 6`),
  },
  awayFellBack: {
    text: 'The cell did not settle while you were away, so what happened to it is a rough reading.',
    badge: tuned(`${ABOUT_THE_BUILD}. docs/SIMULATION.md Part 3 calls this a bug signal`),
  },
  awayCapped: {
    text: 'Time away is capped, and the cap was reached.',
    badge: tuned(`${ABOUT_THE_BUILD}. The cap is MAX_OFFLINE_HOURS in docs/SIMULATION.md Part 6`),
  },
  clockBackwards: {
    text: 'The system clock moved backwards since the last save, so no time away was counted.',
    badge: tuned(`${ABOUT_THE_BUILD}. docs/SAVE_SCHEMA.md Part 3 says credit zero rather than error`),
  },

  importFailed: {
    text: 'That file is not a save this version can read. Nothing was changed.',
    badge: tuned(`${ABOUT_THE_BUILD}. A failed import never touches the existing save`),
  },
  importFuture: {
    text: 'That file was written by a newer version of the game. Nothing was changed.',
    badge: tuned(ABOUT_THE_BUILD),
  },
} as const satisfies Readonly<Record<string, Entry>>;
