// Unique cache name - change this version number (e.g., v1.1) when you update your app
const CACHE_NAME = 'townsville-radar-v1.0';
const ASSETS_TO_CACHE = [
  './index.html',
  './style.css',
  './app.js'
];

// 1. INSTANT UPDATE LOGIC (Skip Waiting)
// Forces the new service worker to activate the second it is uploaded
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting(); 
});

// Clean up old caches automatically when a new version takes over
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 2. LAZY FETCH LOGIC (Zero Data Waste)
// Only serves cached assets to keep data usage tiny while running
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});

// 3. SMART LOCK-SCREEN ALERT ENGINE
// Listens for background deal drops and pushes them to your lock screen
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  // Expecting a clean text summary and a specific image URL from the server
  const data = event.data.json();
  
  const options = {
    body: `${data.deal}\n📍 ${data.store}\n⏱️ ${data.expiry}`,
    icon: './icon.png', // Small app logo
    image: data.imageUrl, // The single blurred/clean product photo attached to the alert
    badge: './badge.png',
    tag: data.storeId, // Prevents duplicate pings from the same shop
    renotify: true,
    data: { url: './' }
  };

  event.waitUntil(
    self.registration.showNotification('🚨 TOWNSVILLE RADAR', options)
  );
});

// Opens your app directly when you tap the lock-screen alert
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});
