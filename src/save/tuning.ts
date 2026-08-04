/**
 * =========================================================================
 *  PROVISIONAL. NOT MEASUREMENTS. NOT BALANCED. DO NOT CITE ANY OF THIS.
 * =========================================================================
 *
 * Every save-layer number that is a game decision rather than a mechanism. There
 * is one of them today. Same header treatment and same status as
 * src/content/act1/tuning.ts and src/ui/tuning.ts, because it is the same kind of
 * number: a first-fit value chosen so the thing behaves, never played, never
 * balanced, and not derived from anything.
 *
 * THE DEBT, DISCHARGED. Every value below owes a row in the divergence table in
 * docs/ECONOMY.md. That document exists as of UPDATELOGV5.md stage 1 and the
 * value below is row S1.
 *
 * THE COUNT THIS HEADER USED TO GIVE WAS WRONG. It said V4 took the count from
 * twenty provisional numbers across two files to twenty-one across three. The
 * real figure is twenty-four across three, counted from the files in
 * UPDATELOGV5.md stage 1: thirteen in src/content/act1/tuning.ts, ten in
 * src/ui/tuning.ts and this one. Both this header and NOW.md undercounted, and
 * both undercounted the same thing, which is the uptake capacity ladder. A
 * ladder of three rungs is three numbers a balance pass can move independently,
 * not one, and the file it lives in already counts a record of five Vmax values
 * as five.
 *
 * Introduced by UPDATELOGV4.md, stage 5.
 */

/**
 * Milliseconds between autosaves.
 *
 * WHAT IT TRADES. Shorter loses less on a crash and writes more often; the write
 * path is synchronous localStorage plus a read-back and a parse, so it is not
 * free. Longer is cheaper and loses more. The unit of loss is the interval
 * itself: the crash-state enumeration in UPDATELOGV4.md stage 2 shows the worst
 * case for a write interrupted at any step is the work since the last successful
 * one.
 *
 * HOW 30 SECONDS WAS PICKED. Act 1's two purchases sit roughly one minute and
 * roughly seven minutes in, measured in src/ui/__tests__/unlockPacing.report.test.ts,
 * so half a minute is short enough that a crash never costs a whole beat.
 * Purchases also save immediately and independently of this timer, because
 * losing a purchase is the loss a player notices, so this interval is really the
 * granularity of losing PROGRESS TOWARD the next one.
 *
 * It is a judgement about tolerable loss reasoned from the pacing measurement,
 * not a measurement in itself, which is exactly the kind of number that owes a
 * divergence row.
 */
export const AUTOSAVE_INTERVAL_MS = 30000;
