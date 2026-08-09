import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * The determinism guard below is the point of this file.
 *
 * CLAUDE.md hard rule 4 bans Math.random in simulation code, because the
 * seeded PRNG is what makes a save plus an input sequence reproduce a bug.
 * CLAUDE.md hard rule 5 bans Math.pow, Math.exp and Math.log, because the
 * ECMAScript specification permits implementation-approximated results for
 * them, so they differ between engines and break cross-browser determinism.
 * docs/SIMULATION.md Part 5 adds Date.now: wall-clock time enters the system
 * only at the loop boundary and only via the offline path.
 *
 * These are rules the codebase depends on, not style preferences. Deleting
 * this block turns two hard rules back into things review has to catch.
 * Michaelis-Menten needs only multiply, divide and add, all exactly specified
 * under IEEE754. The Hill equation uses integer exponents and repeated
 * multiplication.
 *
 * The guard is in two halves, split by V4 stage 6, because the arithmetic half
 * and the clock half turn out to have different correct scopes once a save layer
 * exists. See the src/save/** block below.
 */

/** Hard rules 4 and 5. Applies everywhere the guard applies, with no exemptions. */
const arithmeticRules = [
  {
    object: 'Math',
    property: 'random',
    message:
      'CLAUDE.md hard rule 4: use the seeded PRNG in src/sim/prng.ts. Determinism is a tested property.',
  },
  {
    object: 'Math',
    property: 'pow',
    message:
      'CLAUDE.md hard rule 5: Math.pow is implementation-approximated. Use repeated multiplication.',
  },
  {
    object: 'Math',
    property: 'exp',
    message:
      'CLAUDE.md hard rule 5: Math.exp is implementation-approximated and breaks cross-browser determinism.',
  },
  {
    object: 'Math',
    property: 'log',
    message:
      'CLAUDE.md hard rule 5: Math.log is implementation-approximated and breaks cross-browser determinism.',
  },
];

const CLOCK_MESSAGE =
  'docs/SIMULATION.md Part 5: wall-clock time enters only at the loop boundary, never inside sim code.';

const determinismRules = {
  'no-restricted-properties': [
    'error',
    ...arithmeticRules,
    { object: 'Date', property: 'now', message: CLOCK_MESSAGE },
  ],
  'no-restricted-globals': ['error', { name: 'Date', message: CLOCK_MESSAGE }],
};

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
  },
  {
    // The determinism guard, scoped to simulation code AND content.
    //
    // Extended to src/content/** by V2 stage 6. The question was raised in V2
    // stage 2 and the answer is that the original scope was too narrow.
    // Content does not merely sit next to the simulation, it builds the pool
    // definitions and reaction descriptors the kernel then runs, so a Math.pow
    // in a tuning file reaches the same arithmetic through a different door and
    // breaks cross-browser determinism just as thoroughly as one in tick.ts.
    // The hashed state is a function of content, so content is simulation code
    // whatever directory it lives in.
    //
    // UI code is still exempt. It may use Date.now and Math.random freely
    // because it is not part of the tested state.
    files: ['src/sim/**/*.{ts,tsx}', 'src/content/**/*.{ts,tsx}'],
    rules: determinismRules,
  },
  {
    /**
     * THE SAVE LAYER, AND WHY IT GETS A DIFFERENT SCOPE. Added by V4 stage 6.
     *
     * V2 stage 6 extended the guard from src/sim/** to src/content/** because
     * the argument was identical: content builds the descriptors the kernel
     * runs, so a Math.pow there reaches the same arithmetic through a different
     * door. The argument for src/save/** is NOT identical, and pretending it was
     * would have produced the wrong rule.
     *
     * The arithmetic half applies in full. A save carries pool amounts, a PRNG
     * state and a tick count, all of which go straight back into the tick loop
     * on restore, so Math.random, Math.pow, Math.exp and Math.log are as
     * unwelcome here as in tick.ts. There is no legitimate use for any of them
     * in serialising a number.
     *
     * The clock half applies with ONE EXEMPTION, and the exemption is the whole
     * reason this directory sits outside the original guard.
     * docs/SAVE_SCHEMA.md Part 3 makes `meta.lastSavedAt` the only wall-clock
     * input in the entire system, so exactly one file has to read a clock. That
     * file is src/save/meta.ts. Exempting the directory would have been the easy
     * answer and it would have thrown away the property worth keeping, which is
     * not "save code may read the clock" but "the places that read the clock are
     * countable". There is one, and now nothing else in the save layer can
     * become the second by accident.
     */
    files: ['src/save/**/*.{ts,tsx}'],
    ignores: ['src/save/meta.ts'],
    rules: determinismRules,
  },
  {
    // meta.ts keeps the arithmetic half. It is exempt from the clock rules and
    // from nothing else.
    files: ['src/save/meta.ts'],
    rules: { 'no-restricted-properties': ['error', ...arithmeticRules] },
  },
  {
    /**
     * THE TABULAR FIGURES GUARD. Added by UPDATELOGV3.md stage 2.
     *
     * DESIGN.md says column alignment is the credibility mechanism and calls
     * tabular figures not optional. Not optional should mean impossible to
     * omit, not reliably remembered, so every number in the interface goes
     * through src/ui/components/Figure.tsx, which applies the declaration
     * itself. This rule is what makes that true rather than aspirational: a
     * number formatted at a call site fails the build.
     *
     * A lint rule rather than a scanning test, because the AST knows what a
     * call is and a grep does not. `toFixed` inside a string, inside a comment,
     * or inside a template that is never rendered would all trip a grep, and a
     * guard with false positives gets disabled.
     *
     * WHAT IT CANNOT SEE, stated rather than glossed. `{someNumber}` in JSX is
     * indistinguishable from `{someString}` without type information, and
     * typed linting across a React tree costs more than it buys here. This rule
     * catches formatting, which is where alignment is actually lost. Interpolating
     * an unformatted float would produce ragged decimals and be obvious on sight.
     *
     * Scoped to .tsx, so the harnesses and the drain measurement, which print
     * to a terminal rather than to a page, are untouched.
     */
    files: ['src/**/*.tsx'],
    ignores: ['src/ui/components/Figure.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='toFixed']",
          message:
            'DESIGN.md: every number goes through Figure, which applies tabular figures. Pass `value` or `read` to Figure instead of formatting here.',
        },
        {
          selector: "CallExpression[callee.property.name='toPrecision']",
          message:
            'DESIGN.md: every number goes through Figure, which applies tabular figures. Pass `value` or `read` to Figure instead of formatting here.',
        },
        {
          selector: "CallExpression[callee.property.name='toExponential']",
          message:
            'DESIGN.md: every number goes through Figure, which applies tabular figures. Pass `value` or `read` to Figure instead of formatting here.',
        },
        {
          selector: "CallExpression[callee.property.name='toLocaleString']",
          message:
            'DESIGN.md: every number goes through Figure. toLocaleString also varies its width by locale, which breaks column alignment outright.',
        },
        {
          selector: "JSXExpressionContainer > CallExpression[callee.name='String']",
          message:
            'DESIGN.md: every number goes through Figure. Use <Figure value={n} decimals={0} /> rather than String(n).',
        },
      ],
    },
  },
  {
    files: ['*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
  {
    // The static server for the deployed-artifact checks. Node, not a browser.
    // UPDATELOGV9.md stage 3.
    files: ['e2e/**/*.mjs'],
    languageOptions: { globals: globals.node },
  },
);
