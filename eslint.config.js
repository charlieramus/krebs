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
 */
const determinismRules = {
  'no-restricted-properties': [
    'error',
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
    {
      object: 'Date',
      property: 'now',
      message:
        'docs/SIMULATION.md Part 5: wall-clock time enters only at the loop boundary, never inside sim code.',
    },
  ],
  'no-restricted-globals': [
    'error',
    {
      name: 'Date',
      message:
        'docs/SIMULATION.md Part 5: wall-clock time enters only at the loop boundary, never inside sim code.',
    },
  ],
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
    // The determinism guard, scoped to simulation code only. UI code may use
    // Date.now and Math.random freely; it is not part of the tested state.
    files: ['src/sim/**/*.{ts,tsx}'],
    rules: determinismRules,
  },
  {
    files: ['*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
);
