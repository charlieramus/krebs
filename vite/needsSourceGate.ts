/**
 * The release gate for the `Needs source` badge.
 *
 * DESIGN.md, The badge contract: "The release build must fail if any
 * `Needs source` badge survives into it. That check is the mechanical
 * enforcement of hard rule 1 and it should be written before any content is."
 * DESIGN.md open question 6 says the same thing and says it is not done. This
 * is what closes it, and stages 4 to 6 are the content authoring it was
 * supposed to precede.
 *
 * ---------------------------------------------------------------------------
 * WHY A VITE PLUGIN OVER THE BUNDLE, AND WHY THE OTHER TWO OPTIONS LOSE
 * ---------------------------------------------------------------------------
 *
 * A RENDER-TIME THROW guarded by import.meta.env.PROD only fires if the
 * offending component actually renders. A `Needs source` badge on a panel that
 * opens once in twenty minutes, or on a branch that needs a specific game
 * state, ships happily and detonates in front of a player rather than in front
 * of the person who wrote it. A gate that depends on coverage is not a gate.
 *
 * A TEST THAT SCANS src/ui/** catches more, but it checks the source rather
 * than the artifact, so it misses anything the globs do not reach and anything
 * assembled indirectly, and it only runs when somebody runs tests. `npm run
 * build` would still happily produce a shippable bundle.
 *
 * SCANNING THE EMITTED BUNDLE checks the thing that actually ships. It sees
 * every path into the badge regardless of which file it came from, it cannot be
 * skipped because it is part of the build, and it is stricter than a source
 * scan in the one direction that matters: a badge unreachable from the entry
 * point is tree-shaken out and correctly does not fail, while a badge that
 * survives into a chunk fails whatever route it took to get there.
 *
 * ---------------------------------------------------------------------------
 * HOW THE SENTINEL STAYS HONEST
 * ---------------------------------------------------------------------------
 *
 * The sentinel is the discriminant literal itself. src/ui/components/Badge.tsx
 * never writes it outside a type, so it can only enter the bundle from a call
 * site that declared the badge. Types are erased, there is no lookup table
 * keyed by badge kind, and the render branch sits behind import.meta.env.DEV so
 * production drops it as dead code. Property VALUES are not mangled by any
 * minifier, so `{ kind: 'needs-source' }` written anywhere survives into the
 * chunk exactly as spelled.
 *
 * Development builds are untouched. `Needs source` renders loudly in dev,
 * because being visible during development is its entire purpose.
 */

import type { Plugin } from 'vite';

/**
 * Assembled at runtime so this file does not itself contain the literal.
 *
 * Not paranoia: this file lives outside src/ and is never bundled, but the same
 * trick keeps the sentinel from tripping any future scan that is pointed at the
 * whole repository, and it costs one line.
 */
const SENTINEL = ['needs', 'source'].join('-');

export function needsSourceGate(): Plugin {
  let isProduction = false;

  return {
    name: 'krebs-needs-source-gate',
    apply: 'build',

    configResolved(config) {
      isProduction = config.isProduction;
    },

    generateBundle(_options, bundle) {
      if (!isProduction) return;

      const offenders: string[] = [];
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type !== 'chunk') continue;
        if (!chunk.code.includes(SENTINEL)) continue;

        // Report which module it came from, so the failure is actionable rather
        // than just true. A chunk name alone sends someone grepping.
        const modules = Object.keys(chunk.modules).filter((id) => {
          const rendered = chunk.modules[id];
          return rendered !== undefined && rendered.code !== null && rendered.code.includes(SENTINEL);
        });
        offenders.push(
          modules.length > 0
            ? `${fileName}  <-  ${modules.map((id) => id.replace(/\\/g, '/')).join(', ')}`
            : fileName,
        );
      }

      if (offenders.length === 0) return;

      this.error(
        `\n\n  RELEASE GATE FAILED: a "${SENTINEL}" badge survived into the production bundle.\n\n` +
          offenders.map((line) => `    ${line}`).join('\n') +
          `\n\n  CLAUDE.md hard rule 1: never put a number in player-facing text that is not\n` +
          `  traceable to docs/SCIENCE.md. DESIGN.md makes that a badge contract, and this\n` +
          `  badge is the development-only state that says a claim has no source yet.\n\n` +
          `  Fix it by sourcing the claim and using sourced(...) or contested(...), or by\n` +
          `  admitting the number is a game decision and using tuned(...) with a reason.\n` +
          `  Do not delete this gate.\n`,
      );
    },
  };
}
