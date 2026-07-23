import http from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import {
  acceptsGzip,
  isAllowedSitePath,
  normalizeSitePath
} from './server-policy.mjs';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const realRoot = await realpath(root);
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '127.0.0.1';
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
const compressible = new Set(['.html', '.css', '.js', '.mjs', '.json', '.svg']);

const server = http.createServer(async (req, res) => {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') throw new Error('unsupported method');
    const rawPathname = new URL(req.url, `http://${req.headers.host || host}`).pathname;
    if (!isAllowedSitePath(rawPathname)) throw new Error('path not public');
    const pathname = normalizeSitePath(rawPathname);
    const candidate = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (candidate !== root && !candidate.startsWith(root + sep)) throw new Error('outside root');
    let file = candidate;
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    const resolvedFile = await realpath(file);
    if (resolvedFile !== realRoot && !resolvedFile.startsWith(realRoot + sep)) {
      throw new Error('symlink outside root');
    }
    const body = await readFile(resolvedFile);
    const extension = extname(resolvedFile);
    const gzip = compressible.has(extension) && acceptsGzip(req.headers['accept-encoding']);
    res.writeHead(200, {
      'Content-Type': types[extension] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'Vary': 'Accept-Encoding',
      ...(gzip ? { 'Content-Encoding': 'gzip' } : {})
    });
    res.end(req.method === 'HEAD' ? undefined : (gzip ? gzipSync(body) : body));
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

server.listen(port, host, () => {
  const address = server.address();
  const boundPort = typeof address === 'object' && address ? address.port : port;
  console.log(`qa-server http://${host}:${boundPort}`);
});
