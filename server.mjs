import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('./dist/', import.meta.url));
const upstream =
  'https://app.econverse.com.br/teste-front-end/junior/tecnologia/lista-produtos/produtos.json';
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.json': 'application/json; charset=utf-8',
};
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';

const server = createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    return response.end();
  }
  try {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname === '/api/products') {
      const result = await fetch(upstream, { signal: AbortSignal.timeout(15000) });
      if (!result.ok) throw new Error('Upstream unavailable');
      const json = await result.json();
      response.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      return response.end(request.method === 'HEAD' ? undefined : JSON.stringify(json));
    }
    const pathname = decodeURIComponent(url.pathname);
    const file = resolve(dist, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(resolve(dist) + sep) || !(await stat(file)).isFile()) {
      response.writeHead(404);
      return response.end('Not found');
    }
    const body = await readFile(file);
    response.writeHead(200, {
      'Content-Type': contentTypes[extname(file)] || 'application/octet-stream',
    });
    return response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(request.url?.startsWith('/api/') ? 502 : 404, {
      'Content-Type': 'application/json; charset=utf-8',
    });
    response.end(JSON.stringify({ success: false, message: 'Recurso indisponível.' }));
  }
});
server.listen(port, host, () => console.log(`Econverse: http://${host}:${port}`));
