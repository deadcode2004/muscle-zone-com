// Cache and Compression Configuration
const CACHE_CONFIG = {
  version: 'v2',
  
  // Cache names and limits
  caches: {
    static: {
      name: 'static-cache',
      limit: 5 * 1024 * 1024,  // 5MB
      expiry: 30 * 24 * 60 * 60 * 1000  // 30 days
    },
    dynamic: {
      name: 'dynamic-cache',
      limit: 10 * 1024 * 1024, // 10MB
      expiry: 7 * 24 * 60 * 60 * 1000   // 7 days
    },
    images: {
      name: 'images-cache',
      limit: 50 * 1024 * 1024, // 50MB
      expiry: 90 * 24 * 60 * 60 * 1000  // 90 days
    }
  },

  // Compression settings
  compression: {
    // Minimum size for compression (in bytes)
    minSize: 1024,  // 1KB
    
    // Maximum size for compression (in bytes)
    maxSize: 50 * 1024 * 1024,  // 50MB
    
    // Compression formats in order of preference
    preferredFormats: ['br', 'gzip'],
    
    // Content types that should be compressed
    compressibleTypes: [
      // Text formats
      'text/',
      'application/javascript',
      'application/json',
      'application/xml',
      'application/graphql',
      'application/ld+json',
      'application/schema+json',
      'application/manifest+json',
      
      // Web formats
      'image/svg+xml',
      'font/',
      'application/x-font-',
      
      // Binary formats that might benefit from compression
      'application/wasm',
      'application/octet-stream'
    ],
    
    // Quality settings for different types
    quality: {
      images: {
        webp: 0.8,
        jpeg: 0.85,
        png: 0.8
      },
      text: {
        brotli: {
          quality: 11  // 0-11, higher = better compression but slower
        },
        gzip: {
          level: 9     // 1-9, higher = better compression but slower
        }
      }
    }
  },

  // Cache strategies for different types of requests
  strategies: {
    static: 'cache-first',
    dynamic: 'stale-while-revalidate',
    api: 'network-first',
    images: 'cache-first'
  },

  // Background sync configuration
  backgroundSync: {
    enabled: true,
    maxRetries: 3,
    retryDelay: 1000  // 1 second
  },

  // Monitoring and analytics
  monitoring: {
    enabled: true,
    interval: 5 * 60 * 1000,  // 5 minutes
    thresholds: {
      warning: 0.8,   // 80% of limit
      critical: 0.9   // 90% of limit
    },
    analytics: {
      enabled: true,
      sampleRate: 0.1  // 10% of requests
    }
  }
};

// Export configuration
export default CACHE_CONFIG;
