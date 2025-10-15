// AgroChain Homepage - Enhanced Mobile Functionality
document.addEventListener("DOMContentLoaded", () => {
    console.log("AgroChain Homepage Loaded ✅ - Digital Agricultural Supply Chain Management System.");
    
    // Mobile Menu Toggle Functionality
    initMobileMenu();
    
    // Smooth scroll for navigation links
    initSmoothScroll();
    
    // Close mobile menu when clicking outside
    handleOutsideClick();
});

/**
 * Initialize mobile menu toggle
 */
function initMobileMenu() {
    // Create mobile menu toggle button if it doesn't exist
    const navbar = document.querySelector('.navbar');
    const navCenter = document.querySelector('.nav-center');
    
    if (!navbar || !navCenter) return;
    
    // Check if toggle button already exists
    let toggleBtn = document.querySelector('.mobile-menu-toggle');
    
    if (!toggleBtn) {
        // Create toggle button
        toggleBtn = document.createElement('button');
        toggleBtn.className = 'mobile-menu-toggle';
        toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
        toggleBtn.setAttribute('aria-label', 'Toggle navigation menu');
        
        // Insert toggle button after nav-left
        const navLeft = document.querySelector('.nav-left');
        navLeft.insertAdjacentElement('afterend', toggleBtn);
    }
    
    // Toggle menu on button click
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navCenter.classList.toggle('active');
        
        // Change icon based on menu state
        const icon = toggleBtn.querySelector('i');
        if (navCenter.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });
    
    // Close menu when clicking on a nav link
    const navLinks = document.querySelectorAll('.nav-center .nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 900) {
                navCenter.classList.remove('active');
                const icon = toggleBtn.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    });
}

/**
 * Handle clicks outside mobile menu to close it
 */
function handleOutsideClick() {
    document.addEventListener('click', (e) => {
        const navCenter = document.querySelector('.nav-center');
        const toggleBtn = document.querySelector('.mobile-menu-toggle');
        const navbar = document.querySelector('.navbar');
        
        if (!navCenter || !toggleBtn) return;
        
        // Check if click is outside navbar and menu is open
        if (window.innerWidth <= 900 && 
            navCenter.classList.contains('active') && 
            !navbar.contains(e.target)) {
            navCenter.classList.remove('active');
            const icon = toggleBtn.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });
}

/**
 * Initialize smooth scrolling for anchor links
 */
function initSmoothScroll() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Skip if href is just "#"
            if (href === '#') return;
            
            const targetElement = document.querySelector(href);
            
            if (targetElement) {
                e.preventDefault();
                
                // Get navbar height for offset
                const navbar = document.querySelector('.navbar');
                const navbarHeight = navbar ? navbar.offsetHeight : 0;
                
                // Calculate position with offset
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 20;
                
                // Smooth scroll to target
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/**
 * Handle window resize events
 */
window.addEventListener('resize', () => {
    const navCenter = document.querySelector('.nav-center');
    const toggleBtn = document.querySelector('.mobile-menu-toggle');
    
    // Reset menu state on desktop view
    if (window.innerWidth > 900 && navCenter) {
        navCenter.classList.remove('active');
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
    }
});

document.addEventListener("DOMContentLoaded", () => {
    console.log("AgroChain About Page Loaded ✅");
    
    // Add smooth scroll animation for cards
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe mission/vision cards and team cards for fade-in effect
    const cards = document.querySelectorAll('.mission-card, .vision-card, .team-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });

    // Team card hover effect enhancement
    const teamCards = document.querySelectorAll('.team-card');
    teamCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.borderTopColor = '#4caf50';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.borderTopColor = 'transparent';
        });
    });

    // Add ripple effect to social icons
    const socialLinks = document.querySelectorAll('.team-social a, .social-icons a');
    socialLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // This ensures the links (LinkedIn/GitHub) navigate normally
            
            // Create ripple element
            const ripple = document.createElement('span');
            ripple.classList.add('ripple-effect');

            // Set size and position based on mouse click
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';

            // Append ripple (only one at a time)
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            if (this.querySelector('.ripple-effect')) {
                this.querySelector('.ripple-effect').remove();
            }
            this.appendChild(ripple);

            // Remove ripple after animation
            ripple.addEventListener('animationend', () => {
                ripple.remove();
            });
        });

        // Dynamic change of document title
        const originalTitle = document.title;
        window.addEventListener('blur', () => {
            document.title = 'Come back to AgroChain!';
        });
        window.addEventListener('focus', () => {
            document.title = originalTitle;
        });
    });

    // Add console logging for team members on intersection
    const teamContainer = document.querySelector('.team-container');
    if (teamContainer) {
        const teamObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // This console log will only trigger for the first team-container (.team-row-top)
                    const teamCards = document.querySelectorAll('.team-card');
                    console.log(`Total Team Members: ${teamCards.length}`);
                    teamObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });
        
        // Observe both row containers
        document.querySelectorAll('.team-row-top, .team-row-bottom').forEach(container => {
            teamObserver.observe(container);
        });
    }
});

// Add CSS animation for ripple effect
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple-effect {
        0% {
            transform: scale(0);
            opacity: 1;
        }
        100% {
            transform: scale(4);
            opacity: 0;
        }
    }
    .ripple-effect {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        animation: ripple-effect 0.4s linear;
        pointer-events: none;
    }
`;
document.head.appendChild(style);

