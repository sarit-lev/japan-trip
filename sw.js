/* Japan trip service worker. App shell precached; map tiles cached as they are seen.
   Bump CACHE to ship an update. */
const CACHE = 'japan-v18';
const TILES = 'japan-tiles-v1';
const TILE_CAP = 700;
const ASSETS = [
  './',
  './index.html',
  './styles.css?v=18',
  './app.js?v=18',
  './data/trip.json?v=18',
  './data/japan-outline.json?v=18',
  './data/credits.json?v=18',
  './img/bkk.jpg',
  './img/hakone.jpg',
  './img/home.jpg',
  './img/fuji.jpg',
  './img/kamakura.jpg',
  './img/kix.jpg',
  './img/kobe.jpg',
  './img/kyoto.jpg',
  './img/matsumoto.jpg',
  './img/miyajima.jpg',
  './img/nara.jpg',
  './img/odaiba.jpg',
  './img/osaka.jpg',
  './img/sensoji.jpg',
  './img/shibuya.jpg',
  './img/shirakawa.jpg',
  './img/takayama.jpg',
  './img/tlv.jpg',
  './img/pandan-koon.jpg',
  './img/lobo-logo.jpg',
  './img/tokyo.jpg',
  './vendor/leaflet.js',
  './vendor/leaflet.css',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== TILES).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trimTiles() {
  const c = await caches.open(TILES);
  const keys = await c.keys();
  if (keys.length > TILE_CAP) {
    await Promise.all(keys.slice(0, keys.length - TILE_CAP).map(k => c.delete(k)));
  }
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Map tiles: cache-first, so anywhere they already looked at stays available offline.
  if (url.hostname === 'tile.openstreetmap.org') {
    e.respondWith(
      caches.open(TILES).then(c => c.match(req).then(hit => hit || fetch(req).then(res => {
        if (res && res.status === 200) { c.put(req, res.clone()); trimTiles(); }
        return res;
      })))
    );
    return;
  }

  // Weather and anything else cross-origin: straight to the network (the app keeps its own copy).
  if (url.origin !== self.location.origin) return;

  // Navigations: network-first so a fresh index.html loads online; cache fallback offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => { caches.open(CACHE).then(c => c.put('./index.html', res.clone())); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Versioned app files: network-first so an update is never shadowed by an old cache.
  if (url.search.startsWith('?v=')) {
    e.respondWith(fetch(req).then(res => { if (res && res.status === 200) caches.open(CACHE).then(c => c.put(req, res.clone())); return res; }).catch(() => caches.match(req)));
    return;
  }

  // Assets: cache-first, then network.
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && res.status === 200) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
