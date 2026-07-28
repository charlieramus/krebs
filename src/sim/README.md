# src/sim

The kernel. The part of the simulation that knows how to advance state without
knowing what the state means: pools, reactions, flux, integration, the tick
loop and the seeded PRNG. It has no idea that glucose or NAD+ exist. Act 1
content lands in V2.

Everything under this directory is bound by CLAUDE.md hard rules 4 and 5 and by
docs/SIMULATION.md Part 5. `Math.random`, `Math.pow`, `Math.exp`, `Math.log`
and `Date.now` are banned here and the ESLint config enforces it. Determinism
is a tested property, not a convention.

Tests live in `__tests__/`. Their fixtures are synthetic, not biology.
