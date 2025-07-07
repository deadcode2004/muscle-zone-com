// Cache Monitor
class CacheMonitor {
  constructor() {
    this.limits = {
      static: 5 * 1024 * 1024,  // 5MB
      dynamic: 10 * 1024 * 1024, // 10MB
      images: 50 * 1024 * 1024   // 50MB
    };
    
    this.warningThreshold = 0.8; // 80%
    this.criticalThreshold = 0.9; // 90%
    
    this.init();
  }

  async init() {
    // Start monitoring
    this.startMonitoring();
    
    // Add event listeners for cache changes
    navigator.storage.addEventListener('estimate', () => this.checkStorageUsage());
  }

  async startMonitoring() {
    // Initial check
    await this.checkCacheSizes();
    
    // Regular monitoring
    setInterval(() => this.checkCacheSizes(), 5 * 60 * 1000); // Check every 5 minutes
  }

  async checkCacheSizes() {
    const cacheNames = await caches.keys();
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const size = await this.getCacheSize(cache);
      const type = this.getCacheType(cacheName);
      
      if (type && this.limits[type]) {
        const usage = size / this.limits[type];
        
        if (usage > this.criticalThreshold) {
          this.logCacheWarning(cacheName, size, 'CRITICAL');
          this.notifyServiceWorker(cacheName, 'critical');
        } else if (usage > this.warningThreshold) {
          this.logCacheWarning(cacheName, size, 'WARNING');
          this.notifyServiceWorker(cacheName, 'warning');
        }
        
        // Send metrics
        this.sendMetrics(cacheName, size, usage);
      }
    }
  }

  async getCacheSize(cache) {
    const keys = await cache.keys();
    const sizes = await Promise.all(
      keys.map(async request => {
        const response = await cache.match(request);
        const blob = await response.blob();
        return blob.size;
      })
    );
    return sizes.reduce((total, size) => total + size, 0);
  }

  getCacheType(cacheName) {
    if (cacheName.includes('static')) return 'static';
    if (cacheName.includes('dynamic')) return 'dynamic';
    if (cacheName.includes('images')) return 'images';
    return null;
  }

  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  logCacheWarning(cacheName, size, level) {
    const formattedSize = this.formatSize(size);
    const limit = this.formatSize(this.limits[this.getCacheType(cacheName)]);
    
    console.warn(
      `[Cache ${level}] ${cacheName}\n` +
      `Current size: ${formattedSize}\n` +
      `Limit: ${limit}`
    );
  }

  async notifyServiceWorker(cacheName, level) {
    const registration = await navigator.serviceWorker.ready;
    registration.active.postMessage({
      type: 'CACHE_WARNING',
      cacheName,
      level
    });
  }

  async checkStorageUsage() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const {usage, quota} = await navigator.storage.estimate();
      const percentUsed = (usage / quota) * 100;
      
      if (percentUsed > 90) {
        console.warn(`Storage usage is high: ${percentUsed.toFixed(2)}% of quota used`);
      }
    }
  }

  sendMetrics(cacheName, size, usage) {
    // Send to analytics if available
    if (typeof gtag === 'function') {
      gtag('event', 'cache_size', {
        'event_category': 'Performance',
        'event_label': cacheName,
        'value': Math.round(size),
        'metric_id': 'cache_size',
        'non_interaction': true
      });
      
      gtag('event', 'cache_usage', {
        'event_category': 'Performance',
        'event_label': cacheName,
        'value': Math.round(usage * 100),
        'metric_id': 'cache_usage',
        'non_interaction': true
      });
    }
  }
}

// Initialize cache monitor
const cacheMonitor = new CacheMonitor();
