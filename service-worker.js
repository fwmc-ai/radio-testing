const CACHE_NAME = 'fwmc-ai-radio-cache-v1.3.2'; // Update with new version when needed
const urlsToCache = [
  './',
  './index.html', // Make sure to include this
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png',
  // Add other essential assets (CSS, JS files, etc.)
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  // Tell the new service worker to activate as soon as possible
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');

  // Delete outdated caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting outdated cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Claim clients to control new navigations immediately
  clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Exclude DeviceID requests from caching
  if (event.request.url.includes('deviceId')) {
    return fetch(event.request);
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response; // Cache hit - return from cache
        }
        // Cache miss - fetch from network
        return fetch(event.request).then(fetchResponse => {
          // Check if we received a valid response
          if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
            return fetchResponse;
          }

          // Clone the response as it can only be consumed once
          const responseToCache = fetchResponse.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return fetchResponse;
        });
      })
  );
});