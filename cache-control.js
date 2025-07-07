// Cache Control Headers
const CACHE_CONTROL = {
  images: {
    maxAge: 31536000, // 1 year
    immutable: true
  },
  static: {
    maxAge: 2592000, // 30 days
    immutable: true
  },
  dynamic: {
    maxAge: 0,
    noStore: true
  }
};

// Set cache headers for different resource types
function setCacheHeaders(resourceType) {
  const headers = new Headers();
  const options = CACHE_CONTROL[resourceType];

  if (options.maxAge > 0) {
    headers.append('Cache-Control', `public, max-age=${options.maxAge}${options.immutable ? ', immutable' : ''}`);
  } else if (options.noStore) {
    headers.append('Cache-Control', 'no-store, must-revalidate');
  }

  return headers;
}

// Apply cache headers to fetch requests
const originalFetch = window.fetch;
window.fetch = function(input, init) {
  if (typeof input === 'string') {
    const url = new URL(input, window.location.href);
    const extension = url.pathname.split('.').pop().toLowerCase();

    // Determine resource type based on extension or path
    let resourceType = 'dynamic';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
      resourceType = 'images';
    } else if (['css', 'js', 'woff', 'woff2', 'ttf'].includes(extension)) {
      resourceType = 'static';
    }

    // Merge cache headers with existing init
    const headers = setCacheHeaders(resourceType);
    init = {
      ...init,
      headers: {
        ...(init?.headers || {}),
        ...Object.fromEntries(headers)
      }
    };
  }

  return originalFetch(input, init);
};

// Preload critical resources
function preloadResources() {
  const criticalResources = [
    '/css/dist/main.min.css',
    '/js/app.min.js',
    '/images/optimized/hero.webp'
  ];

  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource;
    link.as = resource.endsWith('.css') ? 'style' : 
              resource.endsWith('.js') ? 'script' : 'image';
    document.head.appendChild(link);
  });
}

// Initialize cache control
document.addEventListener('DOMContentLoaded', () => {
  preloadResources();
});
