/**
 * Development-build flag.
 *
 * Several guards in the kernel are specified as development-only: the shortfall
 * logging in docs/SIMULATION.md Part 2 and the SAFE_VALUE_CEILING assertion in
 * Part 4. They need a flag that is a compile-time constant in a Vite build, so
 * the production bundle drops the branches, and that still resolves to
 * something sane under Vitest and under a plain node run of the harness.
 *
 * `import.meta.env` exists under Vite and Vitest and does not exist under bare
 * node, hence the optional read. Defaulting to true when it is absent is the
 * safe direction: an unbundled run is a development run.
 */
const viteEnv = (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env;

export const DEV: boolean = viteEnv?.DEV ?? true;
