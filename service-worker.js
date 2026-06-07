const CACHE_NAME = 'washdesk-v1';
const CACHE_URLS = [
  '/ERP-CRM-CleanCar-Lyon/',
  '/ERP-CRM-CleanCar-Lyon/index.html',
  '/ERP-CRM-CleanCar-Lyon/manifest.json',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap'
];

// Installation — mise en cache des ressources essentielles
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CACHE_URLS).catch(err => {
        console.log('Cache partiel:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activation — nettoyage des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch — stratégie Network First avec fallback cache
self.addEventListener('fetch', event => {
  // Ignorer les requêtes Firebase (toujours en ligne)
  if (event.request.url.includes('firebase') ||
      event.request.url.includes('googleapis.com/identitytoolkit') ||
      event.request.url.includes('firestore.googleapis.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Mettre en cache la réponse fraîche
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback sur le cache si hors ligne
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Page de fallback hors ligne
          if (event.request.destination === 'document') {
            return caches.match('/ERP-CRM-CleanCar-Lyon/index.html');
          }
        });
      })
  );
});

// Notification push (pour plus tard)
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  self.registration.showNotification(data.title || 'WashDesk', {
    body: data.body || '',
    icon: '/ERP-CRM-CleanCar-Lyon/icons/icon-192.png',
    badge: '/ERP-CRM-CleanCar-Lyon/icons/icon-72.png',
    vibrate: [200, 100, 200]
  });
});
