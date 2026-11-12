import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const files = [];

async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'tour-viewer') await visit(path);
    } else if (entry.isFile() && entry.name !== 'sw.js') {
      files.push(path);
    }
  }
}

await visit(dist);
files.sort();
const hash = createHash('sha256');
const urls = [];
for (const file of files) {
  const url = `/${relative(dist, file).split(sep).join('/')}`;
  hash.update(url).update(await readFile(file));
  urls.push(url);
}

const cacheName = `staysure-shell-${hash.digest('hex').slice(0, 12)}`;
const serviceWorker = `const CACHE_NAME = ${JSON.stringify(cacheName)};
const PRECACHE_URLS = ${JSON.stringify(urls)};

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith('staysure-shell-') && name !== CACHE_NAME).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/tour-viewer/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () => {
      const cached = await caches.match('/index.html');
      return cached || Response.error();
    }));
    return;
  }

  if (PRECACHE_URLS.includes(url.pathname)) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
  }
});
`;

await writeFile(new URL('../dist/sw.js', import.meta.url), serviceWorker);
console.log(`Generated ${cacheName} with ${urls.length} precached files.`);
