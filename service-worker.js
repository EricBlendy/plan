// Bump this whenever index.htm changes, so old caches get replaced.
const CACHE_NAME = 'task-planner-shell-v8';

// The files needed to load the app with zero connectivity.
// If you rename index.htm, update this list AND manifest.json's start_url to match.
const SHELL_FILES = [
  './index.htm',
  './manifest.json',
  './favicon.svg',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js',
  'https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('Service worker install: some shell files failed to cache', err))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

// Strategy: try the network first (so you always get fresh app code when online),
// fall back to the cached shell copy when offline. Firebase's own database
// traffic (websocket/long-polling to firebaseio.com/firebasedatabase.app) is
// left alone — this only affects loading the page shell itself.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Keep the cached shell fresh with whatever we just fetched successfully.
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
