document.addEventListener('DOMContentLoaded', function() {
    // Animate progress bars on scroll
    const progressBars = document.querySelectorAll('.progress');
    const skillSection = document.querySelector('.skills-section');

    function animateProgressBars() {
        progressBars.forEach(bar => {
            const width = bar.style.width;
            bar.style.width = '0';
            setTimeout(() => {
                bar.style.width = width;
            }, 200);
        });
    }

    // Intersection Observer for skills section
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateProgressBars();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    if (skillSection) {
        observer.observe(skillSection);
    }

    // Animate elements on scroll
    const animateOnScroll = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    };

    const scrollObserver = new IntersectionObserver(animateOnScroll, {
        threshold: 0.1
    });

    // Elements to animate
    const elements = document.querySelectorAll(
        '.profile-card, .skill-card, .contact-card'
    );

    elements.forEach(el => {
        el.classList.add('animate-prepare');
        scrollObserver.observe(el);
    });

    // Add hover effects
    const cards = document.querySelectorAll('.skill-card, .contact-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Profile image interaction
    const profileImage = document.querySelector('.profile-image');
    const profileFrame = document.querySelector('.profile-frame');

    if (profileImage && profileFrame) {
        profileImage.addEventListener('mouseenter', function() {
            profileFrame.style.transform = 'translate(5px, 5px)';
        });
        
        profileImage.addEventListener('mouseleave', function() {
            profileFrame.style.transform = 'translate(0)';
        });
    }
});

