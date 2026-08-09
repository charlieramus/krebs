/**
 * A static server that applies public/_headers to dist/. UPDATELOGV9.md stage 3.
 *
 * WHY THIS EXISTS. Stage 3 step 3 asks for the deployed game to run clean under
 * the content security policy with no console violations, and step 5 asks for
 * the network panel to show no request leaving the origin. Those are checks
 * against a real browser holding a real artifact under real headers, and the
 * only part of that this session cannot supply is Cloudflare.
 *
 * WHAT IT IS AND IS NOT. It parses the same public/_headers this repository
 * ships and serves the same dist/ Vite emits, so what it validates is THE
 * POLICY: whether the game runs under it, and whether anything reaches for the
 * network. It does NOT validate Cloudflare's implementation of _headers, which
 * is Cloudflare's to get right and can only be confirmed on the live origin. The
 * stage 3 report says which of the two it is claiming.
 *
 * Deliberately not a dependency. `node:http` and `node:fs` are enough, and
 * adding a server framework to check that the game asks for nothing would be a
 * poor joke.
 */

import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist');
const HEADERS_FILE = join(ROOT, 'public', '_headers');
const PORT = Number(process.env.STATIC_PORT ?? 5175);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

/** Parse the Cloudflare _headers format: a path pattern, then indented `Name: value` lines. */
function parseHeaders(text) {
  const rules = [];
  let current = null;

  for (const rawLine of text.split(/\r?\n/)) {
    if (rawLine.trim() === '' || rawLine.trimStart().startsWith('#')) continue;

    if (!/^\s/.test(rawLine)) {
      current = { pattern: rawLine.trim(), headers: [] };
      rules.push(current);
      continue;
    }

    const line = rawLine.trim();
    const colon = line.indexOf(':');
    if (colon === -1 || current === null) continue;
    current.headers.push([line.slice(0, colon).trim(), line.slice(colon + 1).trim()]);
  }

  return rules;
}

function matches(pattern, pathname) {
  if (pattern.endsWith('/*')) return pathname.startsWith(pattern.slice(0, -1));
  if (pattern === '/*') return true;
  return pattern === pathname;
}

const RULES = parseHeaders(readFileSync(HEADERS_FILE, 'utf8'));

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://localhost:${PORT}`);
  let pathname = decodeURIComponent(url.pathname);

  // Single page app: unknown paths fall back to the shell, which is what
  // Cloudflare Pages does for a build with no _redirects.
  let filePath = join(DIST, normalize(pathname).replace(/^(\.\.[/\\])+/, ''));
  if (pathname === '/' || !existsSync(filePath)) {
    filePath = join(DIST, 'index.html');
    pathname = '/index.html';
  }

  // Later matching rules win, so a specific /assets/* cache rule overrides the
  // /* block above it, which is the behaviour the file is written against.
  for (const rule of RULES) {
    if (!matches(rule.pattern, pathname)) continue;
    for (const [name, value] of rule.headers) response.setHeader(name, value);
  }

  response.setHeader('Content-Type', MIME[extname(filePath)] ?? 'application/octet-stream');
  response.writeHead(200);
  response.end(readFileSync(filePath));
});

server.listen(PORT, () => {
  process.stdout.write(`static server on http://localhost:${PORT} serving dist/ under public/_headers\n`);
});
