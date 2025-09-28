// Step navigation
const steps = document.querySelectorAll(".form-step");
const stepperItems = document.querySelectorAll(".stepper li");
let emailVerified = false;
let googleVerified = false;
let googleCredential = null;
let otpTimer;

function goToStep(stepIndex) {
  steps.forEach((s, i) => s.classList.toggle("active", i === stepIndex));
  stepperItems.forEach((li, i) => li.classList.toggle("active", i === stepIndex));
}

// Show/hide role-specific fields
const roleSelect = document.getElementById("role");
const farmerFields = document.getElementById("farmerFields");
const dealerFields = document.getElementById("dealerFields");
const retailerFields = document.getElementById("retailerFields");

roleSelect.addEventListener("change", () => {
  farmerFields.style.display = "none";
  dealerFields.style.display = "none";
  retailerFields.style.display = "none";

  if (roleSelect.value === "farmer") farmerFields.style.display = "block";
  if (roleSelect.value === "dealer") dealerFields.style.display = "block";
  if (roleSelect.value === "retailer") retailerFields.style.display = "block";
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
function handleGoogleSignIn(response) {
  const credential = response.credential;
  
  fetch("http://localhost:3000/api/auth/verify-google", {
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
    const response = await fetch("http://localhost:3000/api/auth/send-otp", {
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
    const response = await fetch("http://localhost:3000/api/auth/verify-otp", {
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
  goToStep(2);
});

// Step 3 validation - Role Selection
document.getElementById("next3").addEventListener("click", () => {
  if (!roleSelect.value) {
    alert("Please select a role before continuing.");
    return;
  }
  goToStep(3);
});

// Back buttons
document.getElementById("back1").addEventListener("click", () => goToStep(0));
document.getElementById("back2").addEventListener("click", () => goToStep(1));
document.getElementById("back3").addEventListener("click", () => goToStep(2));

// Final submission validation
document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const role = roleSelect.value;

  if (!emailVerified && !googleVerified) {
    alert("Please verify your email before signing up.");
    return;
  }

  // Role-specific validation
  if (role === "farmer") {
    const aadhaar = document.getElementById("aadhaar").value.trim();
    const farmLocation = document.getElementById("farmLocation").value.trim();
    const geoTag = document.getElementById("geoTag").value.trim();
    const farmSize = document.getElementById("farmSize").value.trim();
    const cropsGrown = document.getElementById("cropsGrown").value.trim();

    if (!/^\d{12}$/.test(aadhaar)) {
      alert("Aadhaar must be exactly 12 digits.");
      return;
    }
    if (!farmLocation || !geoTag || !farmSize || !cropsGrown) {
      alert("Please fill all farmer details.");
      return;
    }
  }

  if (role === "dealer") {
    const businessName = document.getElementById("businessName").value.trim();
    const gstin = document.getElementById("gstin").value.trim();
    const warehouseAddress = document.getElementById("warehouseAddress").value.trim();

    if (!businessName || !gstin || !warehouseAddress) {
      alert("Please fill all dealer details.");
      return;
    }
  }

  if (role === "retailer") {
    const shopName = document.getElementById("shopName").value.trim();
    const shopAddress = document.getElementById("shopAddress").value.trim();
    const shopType = document.getElementById("shopType").value.trim();

    if (!shopName || !shopAddress || !shopType) {
      alert("Please fill all retailer details.");
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
      
      response = await fetch("http://localhost:3000/api/auth/signup-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } else {
      // Submit with email OTP verification
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);
      data.emailVerified = emailVerified;
      
      response = await fetch("http://localhost:3000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }
    
    result = await response.json();
    
    if (response.ok) {
      document.getElementById("message").innerHTML = `<p style="color:green">${result.msg}</p>`;
      // Optionally redirect to login page
      // window.location.href = '/login.html';
    } else {
      document.getElementById("message").innerHTML = `<p style="color:red">${result.msg}</p>`;
    }
  } catch (err) {
    console.error(err);
    document.getElementById("message").innerHTML = "<p style='color:red'>Error submitting form</p>";
  }
});