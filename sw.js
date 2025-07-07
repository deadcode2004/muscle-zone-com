const CACHE_VERSION = 'v2';
const CACHE_NAMES = {
  static: `static-${CACHE_VERSION}`,
  dynamic: `dynamic-${CACHE_VERSION}`,
  images: `images-${CACHE_VERSION}`
};

// Cache size limits (in bytes)
const CACHE_LIMITS = {
  static: 5 * 1024 * 1024,  // 5MB
  dynamic: 10 * 1024 * 1024, // 10MB
  images: 50 * 1024 * 1024   // 50MB
};

// Cache expiration times
const CACHE_EXPIRATION = {
  static: 30 * 24 * 60 * 60 * 1000,  // 30 days
  dynamic: 7 * 24 * 60 * 60 * 1000,   // 7 days
  images: 90 * 24 * 60 * 60 * 1000    // 90 days
};

// Import compression utilities
importScripts('js/compression-utils.js');

// Cache management utilities
const cacheUtils = {
  async getCacheSize(cacheName) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    const sizes = await Promise.all(
      keys.map(async request => {
        const response = await cache.match(request);
        const decompressedResponse = await compressionUtils.getDecompressedResponse(response);
        const blob = await decompressedResponse.blob();
        return blob.size;
      })
    );
    return sizes.reduce((total, size) => total + size, 0);
  },

  async trimCache(cacheName, sizeLimit) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    const keysWithDates = await Promise.all(
      keys.map(async request => {
        const response = await cache.match(request);
        return {
          request,
          date: response.headers.get('date') ? new Date(response.headers.get('date')).getTime() : Date.now()
        };
      })
    );

    // Sort by date (oldest first)
    keysWithDates.sort((a, b) => a.date - b.date);

    let currentSize = await this.getCacheSize(cacheName);
    let index = 0;

    // Remove items until we're under the size limit
    while (currentSize > sizeLimit && index < keysWithDates.length) {
      const {request} = keysWithDates[index];
      const response = await cache.match(request);
      const blob = await response.blob();
      await cache.delete(request);
      currentSize -= blob.size;
      index++;
    }
  },

  async removeExpiredItems(cacheName, maxAge) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    const now = Date.now();

    for (const request of keys) {
      const response = await cache.match(request);
      const date = response.headers.get('date');
      const timestamp = date ? new Date(date).getTime() : now;

      if (now - timestamp > maxAge) {
        await cache.delete(request);
      }
    }
  }
};

// Resources to cache immediately
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/css/dist/main.min.css',
  '/js/app.min.js',
  '/js/performance.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js'
];

// Cache strategies
const CACHE_STRATEGIES = {
  cacheFirst: async (request) => {
    const cachedResponse = await caches.match(request);
    return cachedResponse || fetch(request);
  },
  networkFirst: async (request) => {
    try {
      const networkResponse = await fetch(request);
      const cache = await caches.open(CACHE_NAMES.dynamic);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    } catch (error) {
      const cachedResponse = await caches.match(request);
      return cachedResponse;
    }
  },
  staleWhileRevalidate: async (request) => {
    const cache = await caches.open(CACHE_NAMES.dynamic);
    const cachedResponse = await cache.match(request);
    const networkResponsePromise = fetch(request).then(response => {
      cache.put(request, response.clone());
      return response;
    });
    return cachedResponse || networkResponsePromise;
  }
};

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAMES.static).then(cache => cache.addAll(STATIC_CACHE_URLS)),
      caches.open(CACHE_NAMES.images),
      caches.open(CACHE_NAMES.dynamic)
    ])
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            return Object.values(CACHE_NAMES).every(name => name !== cacheName);
          })
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Handle different types of requests
  if (request.method !== 'GET') {
    return;
  }

  // API calls - Network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(CACHE_STRATEGIES.networkFirst(request));
    return;
  }

  // Images - Cache first with size management and compression
  if (request.destination === 'image') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAMES.images);
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
          // Check cache size and trim if needed
          const currentSize = await cacheUtils.getCacheSize(CACHE_NAMES.images);
          if (currentSize > CACHE_LIMITS.images) {
            await cacheUtils.trimCache(CACHE_NAMES.images, CACHE_LIMITS.images * 0.8);
          }
          return compressionUtils.getDecompressedResponse(cachedResponse);
        }

        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
          const compressedResponse = await compressionUtils.createCompressedResponse(networkResponse.clone());
          await cache.put(request, compressedResponse);

          // Log compression stats
          const stats = await compressionUtils.getCompressionStats(networkResponse, compressedResponse);
          if (stats) {
            console.log(`Image compression stats for ${request.url}:`, stats);
          }
        }
        return networkResponse;
      })()
    );
    return;
  }

  // Static assets - Cache first with expiration and compression
  if (STATIC_CACHE_URLS.includes(url.pathname)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAMES.static);
        await cacheUtils.removeExpiredItems(CACHE_NAMES.static, CACHE_EXPIRATION.static);
        
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return compressionUtils.getDecompressedResponse(cachedResponse);
        }

        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
          const compressedResponse = await compressionUtils.createCompressedResponse(networkResponse.clone());
          await cache.put(request, compressedResponse);

          // Log compression stats
          const stats = await compressionUtils.getCompressionStats(networkResponse, compressedResponse);
          if (stats) {
            console.log(`Static asset compression stats for ${request.url}:`, stats);
          }
        }
        return networkResponse;
      })()
    );
    return;
  }

  // Everything else - Stale while revalidate with size management and compression
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAMES.dynamic);
      const currentSize = await cacheUtils.getCacheSize(CACHE_NAMES.dynamic);
      
      if (currentSize > CACHE_LIMITS.dynamic) {
        await cacheUtils.trimCache(CACHE_NAMES.dynamic, CACHE_LIMITS.dynamic * 0.8);
      }

      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        // Return cached response while revalidating
        const decompressedResponse = await compressionUtils.getDecompressedResponse(cachedResponse);
        
        // Revalidate in background
        fetch(request).then(async networkResponse => {
          if (networkResponse.ok) {
            const compressedResponse = await compressionUtils.createCompressedResponse(networkResponse.clone());
            await cache.put(request, compressedResponse);

            // Log compression stats
            const stats = await compressionUtils.getCompressionStats(networkResponse, compressedResponse);
            if (stats) {
              console.log(`Dynamic content compression stats for ${request.url}:`, stats);
            }
          }
        });

        return decompressedResponse;
      }

      // If not in cache, get from network
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const compressedResponse = await compressionUtils.createCompressedResponse(networkResponse.clone());
        await cache.put(request, compressedResponse);
      }
      return networkResponse;
    })()
  );
});

// Handle background sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-forms') {
    event.waitUntil(syncForms());
  }
});

// Background sync function
async function syncForms() {
  try {
    const cache = await caches.open(CACHE_NAMES.dynamic);
    const requests = await cache.keys();
    const formRequests = requests.filter(request => request.url.includes('/api/forms'));

    return Promise.all(
      formRequests.map(async request => {
        try {
          const response = await fetch(request.clone());
          if (response.ok) {
            await cache.delete(request);
          }
          return response;
        } catch (error) {
          console.error('Background sync failed:', error);
        }
      })
    );
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}
