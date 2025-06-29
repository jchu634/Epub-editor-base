// public/sw.js

const CACHE_NAME = 'inkproof-editor-cache-v1';
const STATIC_CACHE_NAME = 'inkproof-static-v1';
const DYNAMIC_CACHE_NAME = 'inkproof-dynamic-v1';

// Essential files for offline functionality
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/logo-192.png',
    '/logo-512.png',
    '/favicon.ico'
];

// This variable will hold the latest HTML content for the preview.
let previewContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
</head>
<body>
    <p>Waiting for content...</p>
</body>
</html>`;

// The URL the iframe will request.
const PREVIEW_URL = "/preview-content";

// --- SERVICE WORKER LIFECYCLE ---

self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE_NAME).then((cache) => {
                console.log('[Service Worker] Caching static assets');
                return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
            })
        ]).then(() => {
            console.log('[Service Worker] Installation complete');
            return self.skipWaiting();
        }).catch((error) => {
            console.error('[Service Worker] Installation failed:', error);
        })
    );
});

self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== STATIC_CACHE_NAME && 
                        cacheName !== DYNAMIC_CACHE_NAME && 
                        cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[Service Worker] Activation complete');
            return self.clients.claim();
        })
    );
});

// --- EVENT LISTENERS ---

// Listen for messages from the main application.
self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "UPDATE_CONTENT") {
        previewContent = event.data.content;
        console.log('[Service Worker] Updated preview content.');
    }
});

// Intercept fetch requests.
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Handle preview content requests
    if (url.pathname === PREVIEW_URL) {
        console.log('[Service Worker] Serving preview content from memory.');
        const response = new Response(previewContent, {
            headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": "no-cache"
            },
        });
        event.respondWith(response);
        return;
    }

    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip chrome-extension and other non-http requests
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // Handle navigation requests (HTML pages)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // If online, cache the response and return it
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                        return response;
                    }
                    throw new Error('Network response was not ok');
                })
                .catch(() => {
                    // If offline, try to serve from cache
                    return caches.match(event.request)
                        .then((cachedResponse) => {
                            if (cachedResponse) {
                                return cachedResponse;
                            }
                            // Fallback to root page if available
                            return caches.match('/');
                        })
                        .then((fallbackResponse) => {
                            if (fallbackResponse) {
                                return fallbackResponse;
                            }
                            // Last resort: return a basic offline page
                            return new Response(`
                                <!DOCTYPE html>
                                <html>
                                <head>
                                    <title>Inkproof Editor - Offline</title>
                                    <meta charset="utf-8">
                                    <meta name="viewport" content="width=device-width, initial-scale=1">
                                    <style>
                                        body { 
                                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                            display: flex; 
                                            justify-content: center; 
                                            align-items: center; 
                                            height: 100vh; 
                                            margin: 0; 
                                            background: #f5f5f5;
                                            text-align: center;
                                        }
                                        .container {
                                            background: white;
                                            padding: 2rem;
                                            border-radius: 8px;
                                            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                                            max-width: 400px;
                                        }
                                        h1 { color: #2563eb; margin-bottom: 1rem; }
                                        p { color: #666; line-height: 1.5; }
                                        .retry-btn {
                                            background: #2563eb;
                                            color: white;
                                            border: none;
                                            padding: 0.75rem 1.5rem;
                                            border-radius: 4px;
                                            cursor: pointer;
                                            margin-top: 1rem;
                                        }
                                        .retry-btn:hover { background: #1d4ed8; }
                                    </style>
                                </head>
                                <body>
                                    <div class="container">
                                        <h1>📚 Inkproof Editor</h1>
                                        <p>You're currently offline. Some features may not be available.</p>
                                        <p>Your projects and work are saved locally and will sync when you're back online.</p>
                                        <button class="retry-btn" onclick="window.location.reload()">
                                            Try Again
                                        </button>
                                    </div>
                                </body>
                                </html>
                            `, {
                                headers: {
                                    'Content-Type': 'text/html; charset=utf-8'
                                }
                            });
                        });
                })
        );
        return;
    }

    // Handle other requests (CSS, JS, images, etc.)
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Return cached version if available
                if (cachedResponse) {
                    console.log('[Service Worker] Serving from cache:', url.pathname);
                    return cachedResponse;
                }

                // Otherwise, fetch from network
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache non-successful responses
                        if (!response.ok) {
                            return response;
                        }

                        // Clone the response before caching
                        const responseClone = response.clone();
                        
                        // Determine which cache to use
                        const cacheName = STATIC_ASSETS.includes(url.pathname) ? 
                            STATIC_CACHE_NAME : DYNAMIC_CACHE_NAME;

                        // Cache the response
                        caches.open(cacheName).then((cache) => {
                            cache.put(event.request, responseClone);
                            console.log('[Service Worker] Cached new asset:', url.pathname);
                        });

                        return response;
                    })
                    .catch((error) => {
                        console.log('[Service Worker] Fetch failed for:', url.pathname, error);
                        
                        // For images, return a placeholder
                        if (event.request.destination === 'image') {
                            return new Response(
                                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f0f0f0"/><text x="100" y="100" text-anchor="middle" dy=".3em" fill="#999">Image unavailable offline</text></svg>',
                                { headers: { 'Content-Type': 'image/svg+xml' } }
                            );
                        }
                        
                        // For other resources, return a basic error response
                        return new Response('Offline', { 
                            status: 503, 
                            statusText: 'Service Unavailable' 
                        });
                    });
            })
    );
});

// Handle background sync (if supported)
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background sync triggered:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(
            // Perform any background sync operations here
            Promise.resolve()
        );
    }
});

// Handle push notifications (if needed in the future)
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push message received');
    
    const options = {
        body: event.data ? event.data.text() : 'New update available',
        icon: '/logo-192.png',
        badge: '/logo-192.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };

    event.waitUntil(
        self.registration.showNotification('Inkproof Editor', options)
    );
});