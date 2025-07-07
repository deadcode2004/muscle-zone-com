// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// Hide loading screen
window.addEventListener('load', function() {
    setTimeout(function() {
        document.querySelector('.loading-overlay').classList.add('hide');
    }, 2000);
});

// Video optimization
function initializeVideo() {
    const heroVideo = document.getElementById('heroVideo');
    if (!heroVideo) return;

    // Set initial playback rate
    heroVideo.playbackRate = 0.7;
    
    // Check if video can play
    heroVideo.addEventListener('error', function(e) {
        console.error('Error loading video:', e);
        heroVideo.style.display = 'none';
        // Show fallback image
        document.querySelector('.hero').style.backgroundImage = 'url("images/gym-poster.jpg")';
    });

    // Check if video is supported
    if (!heroVideo.canPlayType('video/mp4')) {
        console.log('MP4 video not supported');
        heroVideo.style.display = 'none';
        // Show fallback image
        document.querySelector('.hero').style.backgroundImage = 'url("images/gym-poster.jpg")';
        return;
    }

    // Handle video playback
    heroVideo.addEventListener('canplay', () => {
        // Adjust video size based on screen width
        adjustVideoSize();
        if ('requestVideoFrameCallback' in heroVideo) {
            heroVideo.requestVideoFrameCallback(() => {
                heroVideo.playbackRate = 0.7;
            });
        }
    });

    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(adjustVideoSize, 250);
    });

    // Ensure video starts playing
    heroVideo.play().catch(function(error) {
        console.log('Video autoplay failed:', error);
        // Show first frame
        heroVideo.currentTime = 0.1;
    });
}

// Function to adjust video size based on screen width
function adjustVideoSize() {
    const heroVideo = document.getElementById('heroVideo');
    if (!heroVideo) return;

    const videoRatio = 16/9; // assuming video is 16:9
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const windowRatio = windowWidth / windowHeight;

    if (windowWidth <= 768) {
        // For mobile screens
        if (windowRatio < videoRatio) {
            // Window is taller than video ratio
            heroVideo.style.width = '100%';
            heroVideo.style.height = 'auto';
            heroVideo.style.top = '50%';
            heroVideo.style.left = '0';
            heroVideo.style.transform = 'translateY(-50%)';
        } else {
            // Window is wider than video ratio
            heroVideo.style.width = 'auto';
            heroVideo.style.height = '100%';
            heroVideo.style.top = '0';
            heroVideo.style.left = '50%';
            heroVideo.style.transform = 'translateX(-50%)';
        }
    } else {
        // For desktop screens
        heroVideo.style.width = '100%';
        heroVideo.style.height = '100%';
        heroVideo.style.top = '0';
        heroVideo.style.left = '0';
        heroVideo.style.transform = 'none';
    }
}

// Initialize video when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeVideo();

    // Handle scroll events
    window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY;
        const header = document.querySelector('.navbar');
        
        if (scrollPosition > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
});

// Lazy load video
let videoLoaded = false;
const loadVideo = () => {
    if (!videoLoaded && window.innerWidth >= 768) {
        const video = document.getElementById('heroVideo');
        if (video) {
            video.load();
            videoLoaded = true;
        }
    }
};

// Observe video container
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            loadVideo();
            observer.disconnect();
        }
    });
});

const videoContainer = document.querySelector('.hero');
if (videoContainer) {
    observer.observe(videoContainer);
}

// Contact form handling
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        // Add your form handling logic here
    });
}

document.getElementById('scroll-top').addEventListener('click', function(e) {
    e.preventDefault();
    if (window.innerWidth <= 991) {
        // سريع للشاشات الصغيرة والمتوسطة
        window.scrollTo(0, 0);
    } else {
        // سلس للشاشات الكبيرة
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

// Header control
const movingHeader = document.querySelector('.sub-header');
const addressHeader = document.querySelector('.address-header');
let lastScrollY = window.scrollY;

const handleHeaderScroll = () => {
    const currentScrollY = window.scrollY;
    const movingHeader = document.querySelector('.sub-header');
    const addressHeader = document.querySelector('.address-header');
    
    if (currentScrollY > lastScrollY) {
        movingHeader && movingHeader.classList.remove('visible');
        addressHeader && addressHeader.classList.remove('visible');
    } else {
        movingHeader && movingHeader.classList.add('visible');
        addressHeader && addressHeader.classList.add('visible');
    }
    
    lastScrollY = currentScrollY;
};

window.addEventListener('scroll', handleHeaderScroll);

// Loading Screen
const loadingScreen = document.querySelector('.loading-screen');

// Hide loading screen when page is loaded
if (loadingScreen) {
    window.addEventListener('load', () => {
        loadingScreen.classList.add('hidden');
    });
}

// Fade In Animation
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            fadeObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

// Keyboard Shortcuts
const handleKeyboardShortcuts = (e) => {
    // Alt + 1: Go to Home
    if (e.altKey && e.key === '1') {
        e.preventDefault();
        document.querySelector('a[href="#home"]').click();
    }
    // Alt + 2: Go to About
    else if (e.altKey && e.key === '2') {
        e.preventDefault();
        document.querySelector('a[href="#about"]').click();
    }
    // Alt + 3: Go to Services
    else if (e.altKey && e.key === '3') {
        e.preventDefault();
        document.querySelector('a[href="#services"]').click();
    }
    // Alt + 4: Go to Pricing
    else if (e.altKey && e.key === '4') {
        e.preventDefault();
        document.querySelector('a[href="#pricing"]').click();
    }
    // Alt + 5: Go to Contact
    else if (e.altKey && e.key === '5') {
        e.preventDefault();
        document.querySelector('a[href="#contact"]').click();
    }
    // Esc: Close modals
    else if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            const closeBtn = modal.querySelector('.close');
            if (closeBtn) closeBtn.click();
        });
    }
};

document.addEventListener('keydown', handleKeyboardShortcuts);

// Analytics Event Tracking
const trackEvent = (category, action, label = null, value = null) => {
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            'event_category': category,
            'event_label': label,
            'value': value
        });
    }
};

// Track form submissions
const trackContactForm = () => {
    const form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', () => {
            trackEvent('Contact', 'Form Submit', 'Contact Form');
        });
    }
};

trackContactForm();

// Track pricing clicks
const pricingButtons = document.querySelectorAll('.pricing-card .btn');
if (pricingButtons) {
    pricingButtons.forEach(button => {
        button.addEventListener('click', () => {
            const card = button.closest('.pricing-card');
            const planTitle = card && card.querySelector('h3');
            const planName = planTitle ? planTitle.textContent : 'Unknown Plan';
            trackEvent('Pricing', 'Plan Click', planName);
        });
    });
}

// Track social media clicks
const socialLinks = document.querySelectorAll('.social-links a');
if (socialLinks) 
    socialLinks.forEach(link => {
    link.addEventListener('click', () => {
        const platform = link.getAttribute('class');
        trackEvent('Social', 'Click', platform);
    });
});

// Track video interactions
const heroVideo = document.getElementById('heroVideo');
if (heroVideo) {
    heroVideo.addEventListener('play', () => {
        trackEvent('Video', 'Play', 'Hero Video');
    });
    
    heroVideo.addEventListener('pause', () => {
        trackEvent('Video', 'Pause', 'Hero Video');
    });
}

// Track scroll depth
let scrollDepthTriggered = {
    25: false,
    50: false,
    75: false,
    100: false
};

window.addEventListener('scroll', () => {
    const winHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;
    const scrollPercent = (scrollTop / (docHeight - winHeight)) * 100;
    
    Object.keys(scrollDepthTriggered).forEach(depth => {
        if (!scrollDepthTriggered[depth] && scrollPercent >= depth) {
            trackEvent('Scroll', 'Depth', `${depth}%`);
            scrollDepthTriggered[depth] = true;
        }
    });
});

// Mobile Touch Optimizations
const handleTouchStart = (e) => {
    const target = e.currentTarget;
    target.classList.add('touch-active');
};

const handleTouchEnd = (e) => {
    const target = e.currentTarget;
    target.classList.remove('touch-active');
};

// Add touch feedback to interactive elements
const addTouchFeedback = () => {
    const touchElements = document.querySelectorAll('button, .btn, .nav-link, .card, .social-links a');
    touchElements.forEach(element => {
        element.addEventListener('touchstart', handleTouchStart, { passive: true });
        element.addEventListener('touchend', handleTouchEnd, { passive: true });
    });
};

// Handle mobile menu
const setupMobileMenu = () => {
    const navbar = document.querySelector('.navbar-collapse');
    const navLinks = document.querySelectorAll('.nav-link');
    const navbarToggler = document.querySelector('.navbar-toggler');

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (navbar.classList.contains('show') && 
            !navbar.contains(e.target) && 
            !navbarToggler.contains(e.target)) {
            navbar.classList.remove('show');
        }
    });

    // Close menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navbar.classList.remove('show');
        });
    });
};

// Handle pull-to-refresh
let touchStart = { x: 0, y: 0 };
let pullStarted = false;

document.addEventListener('touchstart', (e) => {
    touchStart = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
    };
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    if (window.scrollY === 0 && !pullStarted) {
        const touchY = e.touches[0].clientY;
        const deltaY = touchY - touchStart.y;

        if (deltaY > 70) {
            pullStarted = true;
            location.reload();
        }
    }
}, { passive: true });

document.addEventListener('touchend', () => {
    pullStarted = false;
});

// Performance optimization
document.addEventListener('DOMContentLoaded', function() {
    // Hide loading screen after page loads
    window.addEventListener('load', function() {
        setTimeout(function() {
            document.querySelector('.loading-overlay').classList.add('hide');
        }, 2000);
    });

    try {
        // Initialize mobile optimizations
        if (typeof addTouchFeedback === 'function') {
            addTouchFeedback();
        }
        if (typeof setupMobileMenu === 'function') {
            setupMobileMenu();
        }

        // Add fade-in class to elements
        const fadeElements = document.querySelectorAll('.card, .section-title, .service-item, .pricing-card');
        if (fadeElements && fadeElements.length > 0 && typeof fadeObserver !== 'undefined') {
            fadeElements.forEach(element => {
                if (element) {
                    element.classList.add('fade-in');
                    fadeObserver.observe(element);
                }
            });
        }

        // Defer non-critical operations
        const loadSocialWidgets = () => {
            try {
                const socialWidgets = document.querySelectorAll('.social-widget');
                if (socialWidgets) {
                    socialWidgets.forEach(widget => {
                        // Widget initialization code here
                        if (widget.dataset.platform) {
                            // Initialize based on platform
                            console.log(`Initializing ${widget.dataset.platform} widget`);
                        }
                    });
                }
            } catch (error) {
                console.error('Error loading social widgets:', error);
            }
        };

        // Execute deferred operations
        if (typeof loadSocialWidgets === 'function') {
            if (window.requestIdleCallback) {
                requestIdleCallback(loadSocialWidgets);
            } else {
                setTimeout(loadSocialWidgets, 1000);
            }
        }
    } catch (error) {
        console.error('Error in DOMContentLoaded:', error);
    }
});
