const CACHE = 'lifeos-v3';
const ASSETS = ['/LifeOS/', '/LifeOS/index.html', '/LifeOS/manifest.json', '/LifeOS/icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => cached))
  );
});

self.addEventListener('push', e => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch(_) {}
  e.waitUntil(self.registration.showNotification(data.title || 'LifeOS', {
    body: data.body || '',
    icon: '/LifeOS/icon.svg',
    badge: '/LifeOS/icon.svg',
    tag: data.tag || 'lifeos',
    vibrate: [200, 100, 200],
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/LifeOS/'));
});
