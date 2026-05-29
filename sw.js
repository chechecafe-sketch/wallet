const CACHE_NAME = 'cheche-wallet-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Instalación: cachear archivos esenciales
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activación: limpiar caches viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first para assets, network-first para resto
self.addEventListener('fetch', event => {
  const { request } = event;

  // Solo interceptar GET
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request)
        .then(response => {
          // Solo cachear respuestas válidas del mismo origen
          if (
            response.ok &&
            response.type === 'basic'
          ) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, cloned);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline fallback: devolver index.html
          return caches.match('/index.html');
        });
    })
  );
});
