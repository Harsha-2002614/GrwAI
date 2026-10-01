#!/usr/bin/env node
// Tiny static server that mimics GitHub Pages / Netlify for an `expo export --platform web` folder:
//   - serves files as-is
//   - `/onboarding/welcome` → `onboarding/welcome.html` (extensionless routes)
//   - unknown paths (dynamic routes such as /outfit/soft-power) → 404.html, else index.html
// Usage: node serve-dist.js <distDir> [port] [basePath]
//   e.g. node serve-dist.js ../../dist 4173          → http://localhost:4173/
//        node serve-dist.js ../../dist 4173 /grwai   → http://localhost:4173/grwai/  (GitHub Pages layout)
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(process.argv[2] || 'dist');
const port = Number(process.argv[3] || 4173);
const base = (process.argv[4] || '').replace(/\/$/, '');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.map': 'application/json' };

function send(res, file, status = 200) {
  res.writeHead(status, { 'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}

http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (base) {
    if (url === base) { res.writeHead(302, { Location: base + '/' }); return res.end(); }
    if (!url.startsWith(base + '/')) { res.writeHead(404); return res.end('outside base path ' + base); }
    url = url.slice(base.length);
  }
  const rel = url.replace(/\/$/, '') || '/index';
  const candidates = [path.join(root, url), path.join(root, rel + '.html'), path.join(root, rel, 'index.html')];
  for (const c of candidates) {
    if (c.startsWith(root) && fs.existsSync(c) && fs.statSync(c).isFile()) return send(res, c);
  }
  const fallback = ['404.html', 'index.html'].map((f) => path.join(root, f)).find((f) => fs.existsSync(f));
  if (fallback) return send(res, fallback, 200);
  res.writeHead(404); res.end('not found');
}).listen(port, () => console.log(`serving ${root} at http://localhost:${port}${base}/`));
