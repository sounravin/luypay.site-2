const CACHE_NAME = 'luypay-pwa-cache-v1';
const OFFLINE_URL = '/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        OFFLINE_URL,
        '/manifest.json',
        '/pwa_icon_192.png',
        '/pwa_icon_512.png',
        '/apple-touch-icon.png',
        '/pwa_icon.svg'
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests and skip Firebase Auth / API / Firestore calls
  if (event.request.method !== 'GET' || 
      event.request.url.includes('firestore') || 
      event.request.url.includes('googleapis') ||
      event.request.url.includes('identitytoolkit') ||
      event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
        return caches.match(OFFLINE_URL);
      });
    })
  );
});

// Register Progressive Web App (PWA) push notifications support
self.addEventListener('push', (event) => {
  let data = {};
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      // Fallback for simple text payloads
      data = { title: 'Luypay Notification', body: event.data.text() };
    }
  }

  const title = data.title || 'Luypay - ប្រព័ន្ធគ្រប់គ្រងការខ្ចីប្រាក់';
  const options = {
    body: data.body || 'អ្នកមានការជូនដំណឹងថ្មីពីប្រព័ន្ធ Luypay!',
    icon: data.icon || '/pwa_icon.svg',
    badge: data.badge || '/pwa_icon.svg',
    vibrate: data.vibrate || [100, 50, 100],
    tag: data.tag || 'luypay-notification',
    renotify: data.renotify !== undefined ? data.renotify : true,
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If there is already an open window/tab, navigate and focus it
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
