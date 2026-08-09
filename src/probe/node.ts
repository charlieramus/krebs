/**
 * The node reference for the cross-engine determinism probe. UPDATELOGV9.md stage 2.
 *
 * `npm run probe:determinism`. Prints the same four hashes the browser page
 * produces, as JSON on one line so the Playwright spec can compare them without
 * parsing prose, and as a readable block for a person.
 *
 * Node is the reference rather than a fourth opinion: it is the engine every
 * determinism assertion in this project has been checked in since V1, so it is
 * the value the browsers have to match for the existing test suite to mean what
 * it claims.
 */

import { runDeterminismProbe } from './determinismProbe';

const started = Date.now();
const result = runDeterminismProbe();
const elapsed = Date.now() - started;

process.stdout.write(`\n  cross-engine determinism probe, node reference\n\n`);
process.stdout.write(`  canonical ticks   ${result.ticks.canonical}\n`);
process.stdout.write(`  long ticks        ${result.ticks.long}\n\n`);
process.stdout.write(`  toy   canonical   ${result.toyCanonical}\n`);
process.stdout.write(`  act1  canonical   ${result.act1Canonical}\n`);
process.stdout.write(`  toy   long        ${result.toyLong}\n`);
process.stdout.write(`  act1  long        ${result.act1Long}\n\n`);
process.stdout.write(`  elapsed           ${elapsed} ms\n\n`);
process.stdout.write(`PROBE_JSON ${JSON.stringify(result)}\n`);
