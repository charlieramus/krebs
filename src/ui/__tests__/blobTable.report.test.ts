/**
 * Prints the derived side and dot count for every act 1 pool.
 *
 * Not an assertion. illustration.test.ts does the asserting. This exists so the
 * stage 4 report quotes a table produced by the code rather than one typed out
 * beside it, in the same posture as the conservation test's worst-drift readout.
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { it } from 'vitest';
import { Blob } from '../components/Blob';
import { ACT1_POOL_IDS, type Act1PoolId } from '../../content/act1/pools';
import { carbonOf, phosphateOf } from '../poolCards';

function markup(id: Act1PoolId): string {
  return renderToStaticMarkup(
    createElement(Blob, {
      carbon: carbonOf(id),
      phosphate: phosphateOf(id),
      fill: '#000000',
      seed: 7,
      label: id,
    }),
  );
}

it('reports the derived geometry for all ten pools', () => {
  const pad = (value: string, width: number): string =>
    value.length >= width ? value : value + ' '.repeat(width - value.length);
  const padLeft = (value: string, width: number): string =>
    value.length >= width ? value : ' '.repeat(width - value.length) + value;

  const lines = ACT1_POOL_IDS.map((id) => {
    const rendered = markup(id);
    const path = /data-role="(silhouette|carrier)" d="([^"]+)"/.exec(rendered);
    const kind = path?.[1] ?? 'none';
    const edges = kind === 'silhouette' ? ((path?.[2] as string).match(/L/g) ?? []).length + 1 : 0;
    const dots = (rendered.match(/data-role="phosphate"/g) ?? []).length;
    return (
      `    ${pad(id, 13)}${padLeft(String(carbonOf(id)), 8)}${padLeft(String(edges), 10)}` +
      `${padLeft(String(phosphateOf(id)), 12)}${padLeft(String(dots), 8)}   ${kind}`
    );
  });

  console.log('');
  console.log('  derived blob geometry, act 1');
  console.log('    pool            carbon   sides    phosphate    dots   shape');
  console.log('    ' + '-'.repeat(60));
  console.log(lines.join('\n'));
  console.log('');
});
