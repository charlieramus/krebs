# src/content

Act content. The part of the simulation that knows what a pool means.

## The one rule

**Content depends on `src/sim/`. `src/sim/` never depends on content.**

The kernel is content-blind by construction and says so in its own headers.
`ConservedId` in `src/sim/pools.ts` is a bare `string` for exactly this reason:
the engine has no business knowing that "carbon" or "nicotinamide" are things.
Content defines pools and reactions in terms of kernel primitives, and the
arrow never points the other way.

A single import from `src/content/` into `src/sim/` would turn the kernel into
act 1's kernel, and every later act would then be a special case of act 1. If
you find yourself wanting one, the thing you want belongs in the kernel as a
content-blind primitive, or in content as a consumer of one.

Tests live beside the content they test, in `__tests__/`.

## What is here

    act1/    Glucose uptake, glycolysis, the NAD+ pool and lactate fermentation.
             Stoichiometry traces to docs/SCIENCE.md Part 2. Rates do not trace
             to anything and are marked as such where they live.

## Sourcing

Stoichiometry is sourced and every coefficient points at docs/SCIENCE.md.

Rates are not sourced and never will be. docs/SCIENCE.md Part 1 says so
directly: literature Km and Vmax values vary by an order of magnitude across
organism, tissue, pH, temperature and assay method, so presenting one as
authoritative would be less honest than not using literature values at all.
Every rate in this directory is provisional and lives in one file per act so
that the divergence table in docs/ECONOMY.md has a single place to point when
that document exists.

## The determinism guard

The ESLint rule that bans `Math.random`, `Math.pow`, `Math.exp`, `Math.log` and
`Date.now` **applies here**, extended from `src/sim/**` to `src/content/**` by
V2 stage 6.

The original scope was too narrow. Content does not merely sit next to the
simulation, it builds the pool definitions and reaction descriptors the kernel
runs, so a `Math.pow` in a tuning file reaches the same arithmetic through a
different door and breaks cross-browser determinism just as thoroughly as one
in `tick.ts`. The hashed state is a function of content, so content is
simulation code whatever directory it lives in.

Hard rules 4 and 5 are therefore mechanism here rather than discipline, which
is the same standard `src/sim/` has held since V1.
