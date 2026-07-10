/* GreenOps service worker — offline shell.
   Bump CACHE version whenever index.html changes so installs pick up the new build. */
const CACHE = 'greenops-v6';
const SHELL = ['./', './index.html', './manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((hit) => {
      if (hit) return hit;
      return fetch(e.request)
        .then((res) => {
          // Runtime-cache successful GETs (covers Google Fonts CSS + woff2
          // so typography survives offline after first load).
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => {
          // Offline and uncached: fall back to the app shell for navigations
          if (e.request.mode === 'navigate') return caches.match('./index.html');
        });
    })
  );
});
