// Step navigation
const steps = document.querySelectorAll(".form-step");
const stepperItems = document.querySelectorAll(".stepper li");
let emailVerified = false;
let googleVerified = false;
let googleCredential = null;
let otpTimer;

function goToStep(stepIndex) {
  steps.forEach((s, i) => s.classList.toggle("active", i === stepIndex));
  stepperItems.forEach((li, i) => li.classList.toggle("active", i <= stepIndex)); // Keeps previous steps active
}

// Show/hide role-specific fields
const roleInput = document.getElementById("role"); // Hidden input in Step 3
const farmerFields = document.getElementById("farmerFields");
const dealerFields = document.getElementById("dealerFields");
const retailerFields = document.getElementById("retailerFields");
const next3Button = document.getElementById("next3");
const roleCards = document.querySelectorAll(".role-card"); // Select all role cards


/**
 * Handles the selection of a role via card click.
 * @param {string} role - The selected role value ('farmer', 'dealer', 'retailer').
 */
function handleRoleSelection(role) {
    // 1. Update card classes (visual selection)
    roleCards.forEach(c => c.classList.remove('active-role'));
    const selectedCard = document.querySelector(`.role-card[data-role="${role}"]`);
    if (selectedCard) {
        selectedCard.classList.add('active-role');
    }

    // 2. Update the actual hidden input field
    roleInput.value = role;

    // 3. Enable the continue button
    next3Button.disabled = false;

    // 4. Show/hide fields for Step 4 (Based on the newly selected role)
    farmerFields.style.display = "none";
    dealerFields.style.display = "none";
    retailerFields.style.display = "none";

    if (role === "farmer") farmerFields.style.display = "block";
    if (role === "dealer") dealerFields.style.display = "block";
    if (role === "retailer") retailerFields.style.display = "block";
}


// Event listener for role cards (Interactive Selection)
roleCards.forEach(card => {
    card.addEventListener('click', () => {
        const role = card.getAttribute('data-role');
        handleRoleSelection(role);
    });
});


// Step 1 validation - Basic Info
document.getElementById("next1").addEventListener("click", () => {
  const firstName = document.getElementById("firstName").value.trim();
  const mobile = document.getElementById("mobile").value.trim();
  const email = document.getElementById("email").value.trim();

  if (!firstName || !mobile || !email) {
    alert("Please fill all required fields.");
    return;
  }
  if (!/^\d{10}$/.test(mobile)) {
    alert("Mobile number must be exactly 10 digits.");
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert("Please enter a valid email address.");
    return;
  }
  
  // Display email for verification
  document.getElementById("emailDisplay").textContent = email;
  goToStep(1);
});

// Google Sign-In Handler
window.handleGoogleSignIn = function(response) { // Use window.functionName for GSI callback
  const credential = response.credential;
  
  fetch("https://agrochain-i1h0.onrender.com/api/auth/verify-google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: credential })
  })
  .then(res => res.json())
  .then(result => {
    if (result.msg === "Google verification successful") {
      googleVerified = true;
      googleCredential = credential;
      
      // Auto-fill form with Google data
      document.getElementById("email").value = result.email;
      document.getElementById("firstName").value = result.firstName;
      document.getElementById("lastName").value = result.lastName;
      
      document.getElementById("next2").disabled = false;
      document.getElementById("verificationStatus").innerHTML = 
        `<p style="color:green">✅ Google verification successful! Email: ${result.email}</p>`;
        
      // Hide email OTP section
      document.querySelector(".email-otp-section").style.display = "none";
      
    } else {
      document.getElementById("verificationStatus").innerHTML = 
        `<p style="color:red">${result.msg}</p>`;
    }
  })
  .catch(err => {
    console.error(err);
    document.getElementById("verificationStatus").innerHTML = 
      "<p style='color:red'>Google verification failed</p>";
  });
}

// Email OTP functionality
document.getElementById("sendOtpBtn").addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const sendBtn = document.getElementById("sendOtpBtn");
  
  sendBtn.disabled = true;
  sendBtn.textContent = "Sending...";
  
  try {
    const response = await fetch("https://agrochain-i1h0.onrender.com/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      document.getElementById("otpSection").style.display = "block";
      sendBtn.style.display = "none";
      startOtpTimer();
      document.getElementById("verificationStatus").innerHTML = 
        `<p style="color:green">${result.msg}</p>`;
    } else {
      document.getElementById("verificationStatus").innerHTML = 
        `<p style="color:red">${result.msg}</p>`;
      sendBtn.disabled = false;
      sendBtn.textContent = "Send Verification Code";
    }
  } catch (err) {
    console.error(err);
    document.getElementById("verificationStatus").innerHTML = 
      "<p style='color:red'>Failed to send verification code</p>";
    sendBtn.disabled = false;
    sendBtn.textContent = "Send Verification Code";
  }
});

// Verify OTP
document.getElementById("verifyOtpBtn").addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const otp = document.getElementById("otpInput").value.trim();
  const verifyBtn = document.getElementById("verifyOtpBtn");
  
  if (!otp || otp.length !== 6) {
    alert("Please enter a valid 6-digit OTP");
    return;
  }
  
  verifyBtn.disabled = true;
  verifyBtn.textContent = "Verifying...";
  
  try {
    const response = await fetch("https://agrochain-i1h0.onrender.com/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      emailVerified = true;
      document.getElementById("next2").disabled = false;
      document.getElementById("verificationStatus").innerHTML = 
        `<p style="color:green">✅ ${result.msg}</p>`;
      clearInterval(otpTimer);
      document.getElementById("otpSection").style.display = "none";
      
      // Hide Google signin section
      document.querySelector(".google-signin-section").style.display = "none";
    } else {
      document.getElementById("verificationStatus").innerHTML = 
        `<p style="color:red">${result.msg}</p>`;
      verifyBtn.disabled = false;
      verifyBtn.textContent = "Verify Code";
    }
  } catch (err) {
    console.error(err);
    document.getElementById("verificationStatus").innerHTML = 
      "<p style='color:red'>Verification failed</p>";
    verifyBtn.disabled = false;
    verifyBtn.textContent = "Verify Code";
  }
});

// Resend OTP
document.getElementById("resendOtpBtn").addEventListener("click", () => {
  document.getElementById("sendOtpBtn").click();
  document.getElementById("resendOtpBtn").style.display = "none";
});

// OTP Timer
function startOtpTimer() {
  let timeLeft = 300; // 5 minutes
  const timerElement = document.getElementById("otpTimer");
  
  otpTimer = setInterval(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerElement.textContent = `Code expires in ${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    if (timeLeft <= 0) {
      clearInterval(otpTimer);
      timerElement.textContent = "Code expired";
      document.getElementById("resendOtpBtn").style.display = "block";
    }
    timeLeft--;
  }, 1000);
}

// Step 2 validation - Email Verification
document.getElementById("next2").addEventListener("click", () => {
  if (!emailVerified && !googleVerified) {
    alert("Please verify your email before continuing.");
    return;
  }
  goToStep(2); // Go to Step 3 (Select Role)
});

// Step 3 validation - Role Selection (Uses the hidden input value)
document.getElementById("next3").addEventListener("click", () => {
  if (!roleInput.value) {
    alert("Please select a role by clicking one of the cards before continuing.");
    return;
  }
  goToStep(3); // Go to Step 4 (Additional Details)
});

// Back buttons
document.getElementById("back1").addEventListener("click", () => goToStep(0));
document.getElementById("back2").addEventListener("click", () => goToStep(1));
document.getElementById("back3").addEventListener("click", () => goToStep(2)); // Back from Step 4 to Step 3

// Final submission validation
document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  // Get role from the hidden input in Step 3
  const role = roleInput.value;

  if (!emailVerified && !googleVerified) {
    alert("Please verify your email before signing up.");
    return;
  }
  
  // Disable submit button and show loading state
  const submitBtn = document.querySelector("#signupForm button[type='submit']");
  submitBtn.disabled = true;
  submitBtn.textContent = "Signing up...";


  // Role-specific validation
  if (role === "farmer") {
    const aadhaar = document.getElementById("aadhaar").value.trim();
    const farmLocation = document.getElementById("farmLocation").value.trim();
    const latitude = document.getElementById("latitude").value.trim();
    const longitude = document.getElementById("longitude").value.trim();
    const farmSize = document.getElementById("farmSize").value.trim();
  
    if (!farmLocation || !farmSize) {
      alert("Please fill all required farmer details.");
      submitBtn.disabled = false;
      submitBtn.textContent = "Signup";
      return;
    }
    if (!latitude || !longitude) {
      alert("Please fetch your farm location using the 'Get Geotag Location' button.");
      submitBtn.disabled = false;
      submitBtn.textContent = "Signup";
      return;
    }
    if (!/^\d{12}$/.test(aadhaar)) {
      alert("Aadhaar must be exactly 12 digits.");
      submitBtn.disabled = false;
      submitBtn.textContent = "Signup";
      return;
    }
    
  }

  if (role === "dealer") {
    const businessName = document.getElementById("businessName").value.trim();
    const gstin = document.getElementById("gstin").value.trim();
    const warehouseAddress = document.getElementById("warehouseAddress").value.trim();

    if (!businessName || !gstin || !warehouseAddress) {
      alert("Please fill all required dealer details.");
      submitBtn.disabled = false;
      submitBtn.textContent = "Signup";
      return;
    }
  }

  if (role === "retailer") {
    const shopName = document.getElementById("shopName").value.trim();
    const shopAddress = document.getElementById("shopAddress").value.trim();
    const shopType = document.getElementById("shopType").value.trim();

    if (!shopName || !shopAddress || !shopType) {
      alert("Please fill all required retailer details.");
      submitBtn.disabled = false;
      submitBtn.textContent = "Signup";
      return;
    }
  }

  try {
    let response, result;
    
    if (googleVerified) {
      // Submit with Google auth
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);
      data.googleToken = googleCredential;
      
      response = await fetch("https://agrochain-i1h0.onrender.com/api/auth/signup-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } else {
      // Submit with email OTP verification
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);
      data.emailVerified = emailVerified;
      
      response = await fetch("https://agrochain-i1h0.onrender.com/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }
    
    result = await response.json();
    if (response.ok) {
        document.getElementById("message").innerHTML = `<p class="message-success">${result.msg}</p>`;
        
        // Redirect logic after successful signup
        setTimeout(() => {
          window.location.href = "./login.html";
        }, 1500); 
    } else {
        document.getElementById("message").innerHTML = `<p class="message-error">${result.msg}</p>`;
    }
    submitBtn.disabled = false;
    submitBtn.textContent = "Signup";

  } catch (err) {
    console.error(err);
    document.getElementById("message").innerHTML = "<p class='message-error'>Error submitting form</p>";
    submitBtn.disabled = false;
    submitBtn.textContent = "Signup";
  }
});

// Get Geolocation
document.getElementById("getLocationBtn").addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lon = position.coords.longitude.toFixed(6);
        document.getElementById("latitude").value = lat;
        document.getElementById("longitude").value = lon;
        alert(`Location fetched successfully! Latitude: ${lat}, Longitude: ${lon}`);
      },
      (error) => {
        console.error(error);
        alert("Unable to fetch location. Please allow location access.");
      }
    );
  } else {
    alert("Geolocation is not supported by your browser.");
  }
});


// Initial check
goToStep(0);