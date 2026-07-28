# src/ui

Deliberately empty.

V1 builds the kernel only. The interface lands in V3, after the kernel has
answered the two questions in docs/BRIEF.md: whether saturating kinetics feel
like a game, and whether the NAD+ wall reads as interesting rather than
annoying. DESIGN.md specifies a lot of interface that has never been tested
against a running simulation, and if the NAD+ wall reads as annoying some of
those decisions change.

Until then the only way to look at the kernel is `npm run sim`, the headless
harness in src/sim/.

Read DESIGN.md before putting anything here.
