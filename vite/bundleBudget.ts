/**
 * The bundle size budget. UPDATELOGV9.md stage 4.
 *
 * ---------------------------------------------------------------------------
 * WHY A BUDGET AT ALL
 * ---------------------------------------------------------------------------
 *
 * The bundle has grown in every log: 193.37 kB at V2, 251.29 kB at V4, 290.65 kB
 * now. Nothing tracked it and nothing would have noticed a dependency that
 * doubled it. A budget does not stop growth, it makes growth a decision, which
 * is the same thing the divergence table does for tuned numbers and the badge
 * contract does for unsourced claims.
 *
 * ---------------------------------------------------------------------------
 * WHY FOUR BUDGETS RATHER THAN ONE NUMBER
 * ---------------------------------------------------------------------------
 *
 * UPDATELOGV9.md stage 4 step 1: "the fonts are 68.86 kB of it and were a
 * recorded decision in V3, so a budget that hides them inside a total makes the
 * next such decision invisible."
 *
 * That generalises. A single total cannot tell the difference between the
 * interface growing, which is expected, and a dependency arriving, which is the
 * thing worth catching. So application code, dependencies, fonts and styles are
 * budgeted separately and the failure names the category.
 *
 * ---------------------------------------------------------------------------
 * HOW THE JS SPLIT IS COMPUTED, AND ITS ONE HONEST LIMITATION
 * ---------------------------------------------------------------------------
 *
 * Vite emits one JS chunk containing both React and this project's code, so the
 * application and dependency figures cannot be read off the filesystem. Rollup
 * exposes `renderedLength` per module, which is post-tree-shaking and
 * PRE-minification, so those lengths do not sum to the emitted chunk size.
 *
 * Rather than report a number that is wrong, the emitted chunk size is
 * APPORTIONED between the two by their renderedLength ratio. The total is exact;
 * the split is an apportionment and is labelled as one wherever it is printed.
 * It is accurate enough for the job, which is noticing that a dependency
 * arrived, and it would be the wrong tool for shaving bytes.
 */

import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

/** Bytes. Read against the measured artifact in UPDATELOGV9.md stage 4. */
export interface Budget {
  readonly application: number;
  readonly dependencies: number;
  readonly fonts: number;
  readonly styles: number;
  readonly total: number;
}

/**
 * THE BUDGETS, AND THE REASONING FOR EACH GAP.
 *
 * MEASURED at UPDATELOGV9.md stage 4, against the artifact rather than guessed
 * at and then rounded:
 *
 *   application      75.27 kB   apportioned
 *   dependencies    215.39 kB   apportioned, essentially all React
 *   fonts            68.86 kB   exact, two woff2
 *   styles           19.55 kB   exact
 *   other             3.78 kB   index.html and _headers
 *   total           382.84 kB   exact, everything a player downloads
 *   sourcemaps     1679.63 kB   shipped, never fetched during play, unbudgeted
 *
 * The first draft of this block guessed 102.6 and 188.1 for the two apportioned
 * figures before measuring. It was wrong in both directions and by a lot: the
 * dependency share is far larger and the application share far smaller than it
 * looked. Recorded because it is the argument for the plugin. Nobody's intuition
 * about which half of a bundle is which is worth trusting, which is exactly why
 * the number should be printed on every build rather than estimated in a review.
 *
 * The headroom is deliberately uneven, because the categories mean different
 * things.
 *
 * APPLICATION gets the most room, 130 kB against 75.27, which is nearly double.
 * V12 is the surface half of the spine, adding a timeline, a beast and
 * provenance-on-click, and V14, V16 and V17 each add a whole act. Interface and
 * content growth is what this project is FOR, and a budget that made the next
 * planned log fail would be noise rather than signal.
 *
 * DEPENDENCIES get almost none, 230 kB against 215.39. This is the category the
 * budget exists for. React is the only runtime dependency and there is no plan
 * to add another. 15 kB is not enough room for a date library, a state manager
 * or an animation library to arrive unnoticed, which is the point.
 *
 * FONTS get 72 kB against 68.86, which is tight on purpose. V3 recorded
 * self-hosting two woff2 as a decision, made for first paint with no network
 * dependency. A third font, or a subset regenerated larger, should be a decision
 * somebody takes rather than a number that drifts.
 *
 * STYLES get 32 kB against 19.55. Tailwind emits only what is used, so this
 * grows with new components, and the acts will add them.
 *
 * TOTAL is 460 kB, which is deliberately LESS than the sum of the categories at
 * 464 kB. The categories cannot all be maxed at once and that is intended: each
 * one is the most that category may grow on its own, and the total is the ceiling
 * on the artifact as a whole.
 */
export const BUNDLE_BUDGET: Budget = {
  application: 130_000,
  dependencies: 230_000,
  fonts: 72_000,
  styles: 32_000,
  total: 460_000,
};

const FONT_PATTERN = /\.(woff2?|ttf|otf|eot)$/i;

function kb(bytes: number): string {
  return `${(bytes / 1000).toFixed(2)} kB`;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

export function bundleBudget(budget: Budget = BUNDLE_BUDGET): Plugin {
  let isProduction = false;
  let outDir = 'dist';

  /** Apportionment ratio for the JS, captured while rollup still has module info. */
  let appRendered = 0;
  let depRendered = 0;

  return {
    name: 'krebs-bundle-budget',
    apply: 'build',

    configResolved(config) {
      isProduction = config.isProduction;
      outDir = config.build.outDir;
    },

    generateBundle(_options, bundle) {
      if (!isProduction) return;

      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk') continue;
        for (const [id, rendered] of Object.entries(output.modules)) {
          const length = rendered.renderedLength;
          if (length <= 0) continue;
          if (id.replace(/\\/g, '/').includes('/node_modules/')) depRendered += length;
          else appRendered += length;
        }
      }
    },

    /**
     * Enforced against the DIRECTORY rather than against the rollup bundle.
     *
     * generateBundle sees only what rollup emits, which leaves out index.html
     * and everything copied from public/, including _headers. Those are 3.8 kB
     * today and they are still files this project ships, and a budget that
     * silently excludes part of the artifact is the kind of number that is
     * technically true and practically misleading. So the totals below are every
     * byte in dist/, read off disk after it is written.
     */
    closeBundle() {
      if (!isProduction) return;

      let application = 0;
      let dependencies = 0;
      let fonts = 0;
      let styles = 0;
      let other = 0;
      let sourcemaps = 0;

      for (const file of walk(outDir)) {
        const size = statSync(file).size;
        const name = file.replace(/\\/g, '/');

        if (name.endsWith('.map')) {
          // Not budgeted, and the reason is that a budget measures what a player
          // downloads. A .map is fetched only when devtools are open. Counted and
          // printed rather than ignored, so it is visible rather than invisible.
          sourcemaps += size;
        } else if (FONT_PATTERN.test(name)) {
          fonts += size;
        } else if (name.endsWith('.css')) {
          styles += size;
        } else if (name.endsWith('.js')) {
          // Apportion by renderedLength. See the header note on why this is an
          // apportionment rather than a measurement.
          const rendered = appRendered + depRendered;
          if (rendered === 0) {
            other += size;
          } else {
            const appShare = Math.round((size * appRendered) / rendered);
            application += appShare;
            dependencies += size - appShare;
          }
        } else {
          other += size;
        }
      }

      const total = application + dependencies + fonts + styles + other;

      const rows: Array<[string, number, number | null]> = [
        ['application (apportioned)', application, budget.application],
        ['dependencies (apportioned)', dependencies, budget.dependencies],
        ['fonts', fonts, budget.fonts],
        ['styles', styles, budget.styles],
        ['other (html, _headers)', other, null],
        ['sourcemaps (not downloaded in play)', sourcemaps, null],
        ['total', total, budget.total],
      ];

      const report = rows
        .map(([label, value, limit]) => {
          const cell = limit === null ? '' : `  budget ${kb(limit).padStart(10)}`;
          return `    ${label.padEnd(38)}${kb(value).padStart(10)}${cell}`;
        })
        .join('\n');

      this.warn(`\n\n  bundle budget\n\n${report}\n`);

      const over = rows
        .filter(([, value, limit]) => limit !== null && value > limit)
        .map(([label, value, limit]) => `    ${label}: ${kb(value)} exceeds ${kb(limit as number)}`);

      if (over.length === 0) return;

      this.error(
        `\n\n  BUNDLE BUDGET EXCEEDED\n\n${over.join('\n')}\n\n` +
          `  UPDATELOGV9.md stage 4: the budget exists so that growth is a decision\n` +
          `  rather than a drift. If the growth is intended, raise the number in\n` +
          `  vite/bundleBudget.ts and say why in the comment above it, the same way\n` +
          `  every tuned number in this project carries its reason. Do not delete\n` +
          `  the budget.\n`,
      );
    },
  };
}
