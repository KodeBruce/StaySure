const CACHE_NAME = 'staysure-static-v1';
const PRECACHE_URLS = [
  '/', '/index.html', '/manifest.webmanifest',
  '/css/base.css', '/css/screens.css', '/css/install-prompt.css',
  '/js/data.js', '/js/ui.js', '/js/screens-a.js', '/js/screens-b.js',
  '/js/screens-c.js', '/js/app.js', '/js/install-prompt.js', '/js/pwa.js',
  '/icons/icon-192.png', '/icons/icon-512.png', '/images/favicon.svg',
  '/images/p1.jpg', '/images/p2.jpg', '/images/p3.jpg', '/images/p4.jpg',
  '/images/p5.jpg', '/images/p6.jpg', '/images/p7.jpg', '/images/p8.jpg',
  '/images/p9.jpg', '/images/p10.jpg'
];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE_NAME).then(function (cache) {
    return cache.addAll(PRECACHE_URLS);
  }));
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (names) {
    return Promise.all(names.filter(function (name) {
      return name.startsWith('staysure-static-') && name !== CACHE_NAME;
    }).map(function (name) { return caches.delete(name); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (event) {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(function () { return caches.match('/index.html'); }));
    return;
  }
  if (!PRECACHE_URLS.includes(url.pathname)) return;

  event.respondWith(fetch(request).then(function (response) {
    if (response.ok) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE_NAME).then(function (cache) { return cache.put(request, copy); }));
    }
    return response;
  }).catch(function () { return caches.match(request); }));
});
