import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStore } from './lib/store.mjs';
import { handleApi } from './lib/api.mjs';
import { handleLearningApi } from './lib/learning-api.mjs';

const base = fileURLToPath(new URL('./', import.meta.url));
const root = resolve(base, 'web');
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json',
};

export async function createApp({ dataFile = resolve(base, 'data', 'aprende-pe.json') } = {}) {
  const store = await createStore(dataFile);
  return createServer(async (request, response) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
    catch { response.writeHead(400).end('Ruta no válida'); return; }
    if (pathname.startsWith('/api/v3/')) return handleLearningApi(request, response, pathname, store);
    if (pathname.startsWith('/api/')) return handleApi(request, response, pathname, store);
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end(); return;
    }
    try {
      const target = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
      if (target !== root && !target.startsWith(root + sep)) {
        response.writeHead(403).end('Forbidden'); return;
      }
      const file = (await stat(target)).isDirectory() ? resolve(target, 'index.html') : target;
      const body = await readFile(file);
      response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      response.end(request.method === 'HEAD' ? undefined : body);
    } catch {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('No encontrado');
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 4174;
  const host = process.env.HOST || '127.0.0.1';
  const dataFile = process.env.DATA_FILE ? resolve(base, process.env.DATA_FILE) : resolve(base, 'data', 'aprende-pe.json');
  const app = await createApp({ dataFile });
  app.listen(port, host, () => console.log(`Aprende Pe! → http://${host}:${port}`));
}
