const CACHE_NAME = 'arogyaos-v2';
const urlsToCache = ['/', '/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});

// ─── Push Notifications ───────────────────────────────────
self.addEventListener('push', e => {
  let data = { title: 'ArogyaOS', body: 'You have a new notification', url: '/' };
  try { data = JSON.parse(e.data?.text() || '{}'); } catch {}

  e.waitUntil(
    self.registration.showNotification(data.title || 'ArogyaOS', {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'medicine-reminder',
      renotify: true,
      data: { url: data.url || '/my-prescriptions' },
      actions: [
        { action: 'view', title: 'View Prescriptions' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;

  const url = e.notification.data?.url || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes(self.location.origin));
      if (existing) { existing.focus(); existing.navigate(url); }
      else clients.openWindow(url);
    })
  );
});
