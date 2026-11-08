/* Dim's Challenge service worker. __BUILD__ is replaced at build time so every deploy busts the old cache. */
const VERSION = '__BUILD__';
const SHELL_CACHE = `dims-shell-${VERSION}`;
const FONT_CACHE = 'dims-fonts-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/icon-180.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('dims-shell-') && k !== SHELL_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Fonts: serve cached, refresh in the background.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONT_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const network = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => cached);
        return cached || network;
      }),
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // App shell: network first so updates land quickly, cache when offline.
  if (req.mode === 'navigate' || SHELL.some((p) => url.pathname.endsWith(p.replace('./', '/')))) {
    event.respondWith(
      fetch(req)
        .then((res) => { if (res.ok) caches.open(SHELL_CACHE).then((c) => c.put(req, res.clone())); return res; })
        .catch(async () => (await caches.match(req)) || (await caches.match('./index.html')) || Response.error()),
    );
    return;
  }

  event.respondWith(caches.match(req).then((cached) => cached || fetch(req)));
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
