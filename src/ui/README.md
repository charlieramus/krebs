# src/ui

The interface, and the bridge that drives it. Added by V3.

Read DESIGN.md before changing anything here. V3 applies only the subset of it
the vertical slice needs, named in UPDATELOGV3.md's Decisions section, because
DESIGN.md specifies a lot of interface that has never been tested against a
running simulation and a fully dressed screen built before the answer is a fully
dressed screen that has to be undressed.

## The arrow points one way

`src/ui/` depends on `src/content/` and `src/sim/`. Neither of them may ever
depend on this directory, for the same reason `src/content/README.md` gives: the
simulation is a tested, hashed, deterministic thing and the display is not part
of it.

## Three clocks

    simulation    fixed 20Hz, src/sim/loop.ts, the only clock the hash sees
    display       requestAnimationFrame, whatever the browser gives, 60Hz-ish
    React         discrete events only: an unlock bought, a stall detected

`runtime.ts` owns the first two and keeps them out of the third. It reads the
clock, hands real elapsed milliseconds to `loop.advance`, and fills one
preallocated snapshot per frame. `RuntimeContext.tsx` subscribes DOM nodes to
that snapshot and writes text into them directly, so nothing re-renders at tick
rate.

## The determinism carve-out

`eslint.config.js` scopes the `Math.random`, `Math.pow` and `Date.now` bans to
`src/sim/**` and `src/content/**`, and exempts this directory deliberately.
`runtime.ts` IS the loop boundary docs/SIMULATION.md Part 5 describes and
something has to read a clock there. The carve-out licenses reading wall-clock
time. It does not license writing to simulation state from the display side, and
the test that frame timing cannot reach the simulation is what holds that line.

## Files

    runtime.ts          the bridge. Simulation, loop, meter, snapshot, rAF
    RuntimeContext.tsx  the React side. Provider, useRuntime, useLive
    drain.ts            `npm run sim:drain`, how long the environment lasts
