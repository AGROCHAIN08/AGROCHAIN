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

/**
 * Add animation on scroll for elements
 */
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe cards and sections
    const animatedElements = document.querySelectorAll('.impact-card, .feature-category, .role-card');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Initialize scroll animations when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollAnimations);
} else {
    initScrollAnimations();
}