let otpTimer;
let googleCredential = null;

// Initialize mobile menu on page load
document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initSmoothScroll();
  handleOutsideClick();
});

/**
 * Initialize mobile menu toggle
 */
function initMobileMenu() {
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
      
      if (href === '#') return;
      
      const targetElement = document.querySelector(href);
      
      if (targetElement) {
        e.preventDefault();
        
        const navbar = document.querySelector('.navbar');
        const navbarHeight = navbar ? navbar.offsetHeight : 0;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 20;
        
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

// Role-based redirect function
function redirectToRolePage(role) {
  const rolePages = {
    'farmer': 'farmer.html',
    'dealer': 'dealer.html', 
    'retailer': 'retailer.html'
  };
  
  const redirectUrl = rolePages[role];
  if (redirectUrl) {
    window.location.href = redirectUrl;
  } else {
    console.error('Unknown role:', role);
    alert('Unknown user role. Please contact support.');
  }
}

// Google login handler
function handleGoogleLogin(response) {
  const credential = response.credential;

  fetch("http://localhost:3000/api/auth/login-google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: credential })
  })
  .then(res => res.json())
  .then(result => {
    const statusEl = document.getElementById("loginStatus");
    statusEl.style.display = 'block';
    
    if (result.msg === "Google login successful") {
      statusEl.innerHTML = 
        `<p style="color:green; background-color:#d4edda; border:1px solid #c3e6cb; padding:12px; border-radius:4px;">✅ Welcome back ${result.user.firstName}!</p>`;
      
      // Store user info in localStorage for session
      localStorage.setItem('agroChainUser', JSON.stringify(result.user));
      
      // Redirect based on role
      setTimeout(() => {
        redirectToRolePage(result.role);
      }, 1000);
    } else {
      statusEl.innerHTML = 
        `<p style="color:#721c24; background-color:#f8d7da; border:1px solid #f5c6cb; padding:12px; border-radius:4px;">${result.msg}</p>`;
    }
  })
  .catch(err => {
    console.error(err);
    const statusEl = document.getElementById("loginStatus");
    statusEl.style.display = 'block';
    statusEl.innerHTML = 
      "<p style='color:#721c24; background-color:#f8d7da; border:1px solid #f5c6cb; padding:12px; border-radius:4px;'>Google login failed. Please try again.</p>";
  });
}

// Send OTP for login
document.getElementById("sendOtpBtn").addEventListener("click", async () => {
  const email = document.getElementById("loginEmail").value.trim();
  if (!email) {
    alert("Please enter your email");
    return;
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert("Please enter a valid email address");
    return;
  }

  const btn = document.getElementById("sendOtpBtn");
  btn.disabled = true;
  btn.textContent = "Sending...";

  const statusEl = document.getElementById("loginStatus");
  statusEl.style.display = 'none';

  try {
    const res = await fetch("http://localhost:3000/api/auth/send-login-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await res.json();

    statusEl.style.display = 'block';
    
    if (res.ok) {
      document.getElementById("otpSection").style.display = "block";
      startOtpTimer();
      statusEl.innerHTML = 
        `<p style="color:#155724; background-color:#d4edda; border:1px solid #c3e6cb; padding:12px; border-radius:4px;">${data.msg}</p>`;
    } else {
      statusEl.innerHTML = 
        `<p style="color:#721c24; background-color:#f8d7da; border:1px solid #f5c6cb; padding:12px; border-radius:4px;">${data.msg}</p>`;
      btn.disabled = false;
      btn.textContent = "Send OTP";
    }
  } catch (err) {
    console.error(err);
    statusEl.style.display = 'block';
    statusEl.innerHTML = 
      "<p style='color:#721c24; background-color:#f8d7da; border:1px solid #f5c6cb; padding:12px; border-radius:4px;'>Failed to send OTP. Please check your connection.</p>";
    btn.disabled = false;
    btn.textContent = "Send OTP";
  }
});

// Verify OTP for login
document.getElementById("verifyOtpBtn").addEventListener("click", async () => {
  const email = document.getElementById("loginEmail").value.trim();
  const otp = document.getElementById("otpInput").value.trim();
  
  if (!otp || otp.length !== 6) {
    alert("Please enter a valid 6-digit OTP");
    return;
  }

  const btn = document.getElementById("verifyOtpBtn");
  btn.disabled = true;
  btn.textContent = "Verifying...";

  const statusEl = document.getElementById("loginStatus");
  statusEl.style.display = 'none';

  try {
    const res = await fetch("http://localhost:3000/api/auth/verify-login-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp })
    });
    const data = await res.json();

    statusEl.style.display = 'block';
    
    if (res.ok) {
      statusEl.innerHTML = 
        `<p style="color:#155724; background-color:#d4edda; border:1px solid #c3e6cb; padding:12px; border-radius:4px;">✅ Welcome back ${data.user.firstName}!</p>`;
      
      // Store user info in localStorage for session
      localStorage.setItem('agroChainUser', JSON.stringify(data.user));
      
      // Redirect based on role
      setTimeout(() => {
        redirectToRolePage(data.role);
      }, 1000);
    } else {
      statusEl.innerHTML = 
        `<p style="color:#721c24; background-color:#f8d7da; border:1px solid #f5c6cb; padding:12px; border-radius:4px;">${data.msg}</p>`;
      btn.disabled = false;
      btn.textContent = "Verify OTP";
    }
  } catch (err) {
    console.error(err);
    statusEl.style.display = 'block';
    statusEl.innerHTML = 
      "<p style='color:#721c24; background-color:#f8d7da; border:1px solid #f5c6cb; padding:12px; border-radius:4px;'>OTP verification failed. Please try again.</p>";
    btn.disabled = false;
    btn.textContent = "Verify OTP";
  }
});

// Resend OTP
document.getElementById("resendOtpBtn").addEventListener("click", () => {
  document.getElementById("sendOtpBtn").click();
  document.getElementById("resendOtpBtn").style.display = "none";
  document.getElementById("otpInput").value = "";
});

// OTP Timer
function startOtpTimer() {
  let timeLeft = 300; // 5 minutes
  const timerEl = document.getElementById("otpTimer");
  
  // Clear any existing timer
  if (otpTimer) {
    clearInterval(otpTimer);
  }

  otpTimer = setInterval(() => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    timerEl.textContent = `Code expires in ${m}:${s.toString().padStart(2,'0')}`;
    
    if (timeLeft <= 0) {
      clearInterval(otpTimer);
      timerEl.textContent = "Code expired";
      document.getElementById("resendOtpBtn").style.display = "block";
      document.getElementById("verifyOtpBtn").disabled = true;
    }
    timeLeft--;
  }, 1000);
}

// Allow only numbers in OTP input
document.getElementById("otpInput").addEventListener("input", function(e) {
  this.value = this.value.replace(/[^0-9]/g, '');
});