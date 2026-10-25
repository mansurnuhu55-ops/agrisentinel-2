var CACHE = 'agrisentinel-v6';
var FILES = ['./', './index.html', './privacy.html', './delete-account.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }));
  self.skipWaiting();
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') { return; }
  /* Only the app's own files are cached. Account and case data always goes straight to the server. */
  if (new URL(e.request.url).origin !== self.location.origin) { return; }
  e.respondWith(
    fetch(e.request).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return res;
      }
      if (e.request.mode === 'navigate') {
        return caches.match(e.request).then(function (m) { return m || caches.match('./index.html'); });
      }
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (m) {
        return m || (e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error());
      });
    })
  );
});
