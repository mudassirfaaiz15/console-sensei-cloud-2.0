const CACHE_NAME = 'consolesensei-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/favicon.svg',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Service Worker: Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('Service Worker: Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone the response before caching
                const responseClone = response.clone();

                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });

                return response;
            })
            .catch(() => {
                // Network failed, try cache
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    // Return offline fallback for navigation requests
                    if (event.request.mode === 'navigate') {
                        return caches.match('/index.html');
                    }

                    return new Response('Offline', { status: 503 });
                });
            })
    );
});

// Background sync for AWS data
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-aws-data') {
        console.log('Service Worker: Syncing AWS data in background');
        // Would trigger data sync here
    }
});

// Push notifications
self.addEventListener('push', (event) => {
    if (!event.data) return;

    const data = event.data.json();

    const options = {
        body: data.body,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/',
        },
        actions: [
            { action: 'view', title: 'View' },
            { action: 'dismiss', title: 'Dismiss' },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then((clients) => {
            // Focus existing window if open
            for (const client of clients) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // Open new window
            return self.clients.openWindow(urlToOpen);
        })
    );
});
