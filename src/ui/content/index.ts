/**
 * Every player-facing string in the game, one file per surface.
 *
 * WHY A DIRECTORY. This was 1120 lines in `src/ui/content.ts`, which is a file
 * nobody reads and everybody greps. UPDATELOGV11.md stage 3 splits it BY
 * SURFACE rather than by type, because a person looking for a string is looking
 * for the screen it is on: the offline return's eleven strings are one file, and
 * finding them no longer means knowing that they sit between the about panel and
 * the save panel.
 *
 *     common.ts         the Entry shape, the document references, the one
 *                       reusable Tuned reason
 *     molecules.ts      names. Not a surface: three surfaces say them
 *     pathway.ts        the pathway card
 *     topBar.ts         the top bar and the wordmark
 *     poolRail.ts       the pool cards' figures and the blob readouts
 *     shelf.ts          the unlock shelf
 *     announcements.ts  landmarks and the live region
 *     teaching.ts       the coach marks and the teaching panel
 *     about.ts          the first run, the about panel, the disclosure
 *     offline.ts        the offline return
 *     endOfContent.ts   the act boundary, and what it says
 *     save.ts           the save panel
 *
 * THIS FILE IS A RE-EXPORT AND NOTHING ELSE. No string is declared here. Every
 * existing `from '../content'` import resolves to it unchanged, which is what
 * kept the split from being a split plus fifty import edits, and a component
 * that wants to be specific can name the surface file directly.
 */

export type { Entry } from './common';
export { PART1, PART2, ABOUT_THE_BUILD } from './common';
export * from './molecules';
export * from './pathway';
export * from './topBar';
export * from './poolRail';
export * from './shelf';
export * from './announcements';
export * from './teaching';
export * from './about';
export * from './offline';
export * from './endOfContent';
export * from './save';
