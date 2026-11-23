const CACHE_NAME = 'myccp-v4';
const BASE = '/my.ccp';
const ASSETS = [
  `${BASE}/`,
  `${BASE}/index.html`,
  `${BASE}/pages/accounts.html`,

  `${BASE}/pages/history.html`,
  `${BASE}/pages/settings.html`,
  `${BASE}/pages/about.html`,
  `${BASE}/pages/privacy.html`,
  `${BASE}/css/main.css`,
  `${BASE}/js/app.js`,
  `${BASE}/js/i18n.js`,

  `${BASE}/manifest.json`,
  `${BASE}/favicon.ico`,
  `${BASE}/icons/icon-72.png`,
  `${BASE}/icons/icon-96.png`,
  `${BASE}/icons/icon-128.png`,
  `${BASE}/icons/icon-144.png`,
  `${BASE}/icons/icon-152.png`,
  `${BASE}/icons/icon-192.png`,
  `${BASE}/icons/icon-384.png`,
  `${BASE}/icons/icon-512.png`,
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Cache-first for same-origin assets
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res && res.status === 200 && res.type === 'basic') {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return res;
        }).catch(() => {
          if (e.request.mode === 'navigate') {
            return caches.match(`${BASE}/index.html`);
          }
        });
      })
    );
    return;
  }

  // Cache Google Fonts cross-origin
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.open(CACHE_NAME + '-fonts').then(fontCache =>
        fontCache.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request).then(res => {
            fontCache.put(e.request, res.clone());
            return res;
          }).catch(() => cached);
        })
      )
    );
  }
});
