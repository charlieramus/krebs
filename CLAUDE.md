# CLAUDE.md

Root instructions. Keep this file short. If it grows past roughly 100 lines it stops being read carefully and starts being skimmed.

## Project

An idle simulation of cellular energy metabolism. The player runs a single cell from anaerobic prokaryote to eukaryote with full aerobic respiration. ATP is the currency, enzymes are the upgrades, metabolic pathways are the production chains.

The premise is that the economy is not invented. Metabolism already is a resource system with real yields and real bottlenecks, and the game surfaces that rather than decorating it.

## Stack

TypeScript, React, Vite, Tailwind. Vitest for tests, Playwright for the three-engine determinism check. No backend, no accounts, no network dependency for core play.

Configured for Cloudflare Pages at krebs.pages.dev and **not yet deployed**. This file claimed deployment as a fact from V1 to V9 and it was never true. V9 built the configuration, the strict content security policy and the deploy job, and stopped at the credentials. Two things follow. **The origin is permanent once anything ships**, because localStorage is origin-scoped, so moving it orphans every save silently: see the THE KEYS block in src/save/storage.ts before touching it. And **hard rule 6's "after launch" has not begun**, so TICK_RATE_HZ is still movable. It freezes the day a player can reach a URL.

## Hard rules

1. Never put a number in player-facing text that is not traceable to docs/SCIENCE.md.
2. Never edit docs/SCIENCE.md during a balance pass. Balance numbers go in docs/ECONOMY.md with a divergence entry.
3. Never introduce infinite scaling, prestige loops, ads or engagement mechanics. See docs/PILLARS.md.
4. Never call Math.random in simulation code. Use the seeded PRNG. Determinism is a tested property.
5. Never use Math.pow, Math.exp or Math.log in simulation code. They are implementation-approximated in the ECMAScript spec and break cross-browser determinism.
6. Never change TICK_RATE_HZ after launch. Saves store elapsed milliseconds, not tick counts, specifically so this constant stays movable during development and frozen after.
7. Never bump the save schema version without adding a migration and a test that loads a fixture from the previous version.

## Where things live

- docs/PILLARS.md, scope contract. Read before proposing any new system.
- docs/SCIENCE.md, biological ground truth, citations and modeling methodology.
- docs/PROGRESSION.md, act structure, unlock order and gating.
- docs/SIMULATION.md, engine math, tick loop, offline progress and determinism.
- docs/SAVE_SCHEMA.md, the data contract and migration policy.
- docs/ECONOMY.md, tuned game numbers and the divergence table. Written after a playable prototype exists, not before.
- docs/CONTENT_STYLE.md, the writing contract. Voice, naming, numbers in prose, length ceilings per surface, and the rule that a concept carried by shape or colour must not be carried by a paragraph. Read before writing any player-facing string.
- DESIGN.md, the visual contract. Read before any UI decision.
- NOW.md, current state, blocking items and what is next. Read first, update as you go.

Stage prompts live outside docs/ and are ephemeral build instructions, not reference material.

## Working style

Work one stage at a time. Do not combine stages.

Flag problems rather than working around them silently. If a spec in docs/ is wrong or underspecified, say so instead of guessing.

No Oxford commas. No em dashes or en dashes, including in numeric ranges, where "to" is used instead. File paths use forward slashes. Dates in YYYY-MM-DD.

## Design

Read DESIGN.md before making any visual or UI decision. Direction is Honest Cartoon: thick black outlines, pastel surfaces, hard offset shadows, chunky rounded type, hand-drawn blob illustration. Fonts, colours, spacing and motion are all defined there. Do not deviate without explicit approval.

Two rules carry the most weight. Illustration is warm but numbers are not, so every figure uses tabular figures. And every visual property carries simulation state, so shape encodes carbon count and saturation encodes redox state. Nothing in the illustration set is decorative.

## Current state

See NOW.md. It is the only place project state is recorded. Do not duplicate it here.
