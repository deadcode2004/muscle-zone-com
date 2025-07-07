// Performance Tracking
const trackPerformance = () => {
    // Core Web Vitals
    const reportWebVitals = ({ name, delta, id }) => {
        gtag('event', 'web_vitals', {
            event_category: 'Web Vitals',
            event_label: name,
            value: Math.round(name === 'CLS' ? delta * 1000 : delta),
            metric_id: id,
            non_interaction: true
        });
    };

    // Track LCP (Largest Contentful Paint)
    new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach((entry) => {
            if (entry.startTime < 5000) { // Only track if LCP is under 5 seconds
                reportWebVitals({
                    name: 'LCP',
                    delta: entry.startTime,
                    id: entry.id
                });
            }
        });
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Track FID (First Input Delay)
    new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach((entry) => {
            reportWebVitals({
                name: 'FID',
                delta: entry.processingStart - entry.startTime,
                id: entry.id
            });
        });
    }).observe({ entryTypes: ['first-input'] });

    // Track CLS (Cumulative Layout Shift)
    let clsValue = 0;
    let clsEntries = [];

    new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach((entry) => {
            if (!entry.hadRecentInput) {
                const firstSessionEntry = clsEntries.length === 0;
                const currentTime = entry.startTime;

                if (firstSessionEntry || currentTime - clsEntries[0].startTime < 1000) {
                    clsEntries.push(entry);
                    clsValue = clsEntries.reduce((sum, entry) => sum + entry.value, 0);
                } else {
                    clsEntries = [entry];
                    clsValue = entry.value;
                }

                reportWebVitals({
                    name: 'CLS',
                    delta: clsValue,
                    id: entry.id
                });
            }
        });
    }).observe({ entryTypes: ['layout-shift'] });

    // Track Resource Loading
    new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach((entry) => {
            if (entry.initiatorType === 'img' || entry.initiatorType === 'css' || entry.initiatorType === 'script') {
                gtag('event', 'resource_timing', {
                    event_category: 'Performance',
                    event_label: entry.name,
                    value: Math.round(entry.duration),
                    metric_id: entry.initiatorType,
                    non_interaction: true
                });
            }
        });
    }).observe({ entryTypes: ['resource'] });

    // Track Navigation Timing
    window.addEventListener('load', () => {
        setTimeout(() => {
            const navigationEntry = performance.getEntriesByType('navigation')[0];
            const timing = {
                dns: navigationEntry.domainLookupEnd - navigationEntry.domainLookupStart,
                tcp: navigationEntry.connectEnd - navigationEntry.connectStart,
                ttfb: navigationEntry.responseStart - navigationEntry.requestStart,
                download: navigationEntry.responseEnd - navigationEntry.responseStart,
                dom: navigationEntry.domComplete - navigationEntry.domInteractive
            };

            Object.entries(timing).forEach(([metric, value]) => {
                gtag('event', 'navigation_timing', {
                    event_category: 'Performance',
                    event_label: metric,
                    value: Math.round(value),
                    non_interaction: true
                });
            });
        }, 0);
    });
};

// Start tracking when analytics is loaded
if (typeof gtag !== 'undefined') {
    trackPerformance();
} else {
    window.addEventListener('load', () => {
        if (typeof gtag !== 'undefined') {
            trackPerformance();
        }
    });
}
