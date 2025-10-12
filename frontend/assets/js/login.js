let otpTimer;
let googleCredential = null;

// Role-based redirect function
function redirectToRolePage(role, email) {
  if (email === "agrochain08@gmail.com") {
    window.location.href = "admin.html";
    return;
  }

  const rolePages = {
    farmer: "farmer.html",
    dealer: "dealer.html",
    retailer: "retailer.html",
  };

  const redirectUrl = rolePages[role];
  if (redirectUrl) {
    window.location.href = redirectUrl;
  } else {
    console.error("Unknown role:", role);
    alert("Unknown user role. Please contact support.");
  }
}

// Google login handler
function handleGoogleLogin(response) {
  const credential = response.credential;

  fetch("http://localhost:3000/api/auth/login-google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: credential }),
  })
    .then((res) => res.json())
    .then((result) => {
      if (result.msg === "Google login successful") {
        document.getElementById("loginStatus").innerHTML = `<p style="color:green">✅ Welcome back ${result.user.firstName}!</p>`;

        localStorage.setItem("agroChainUser", JSON.stringify(result.user));

        setTimeout(() => {
          redirectToRolePage(result.role, result.user.email);
        }, 1000);
      } else {
        document.getElementById("loginStatus").innerHTML = `<p style="color:red">${result.msg}</p>`;
      }
    })
    .catch((err) => {
      console.error(err);
      document.getElementById("loginStatus").innerHTML =
        "<p style='color:red'>Google login failed</p>";
    });
}

// Send OTP for login
document.getElementById("sendOtpBtn").addEventListener("click", async () => {
  const email = document.getElementById("loginEmail").value.trim();
  if (!email) return alert("Enter your email");

  const btn = document.getElementById("sendOtpBtn");
  btn.disabled = true;
  btn.textContent = "Sending...";

  try {
    const res = await fetch("http://localhost:3000/api/auth/send-login-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();

    if (res.ok) {
      document.getElementById("otpSection").style.display = "block";
      startOtpTimer();
      document.getElementById("loginStatus").innerHTML = `<p style="color:green">${data.msg}</p>`;
    } else {
      document.getElementById("loginStatus").innerHTML = `<p style="color:red">${data.msg}</p>`;
      btn.disabled = false;
      btn.textContent = "Send OTP";
    }
  } catch (err) {
    console.error(err);
    document.getElementById("loginStatus").innerHTML = "<p style='color:red'>Failed to send OTP</p>";
    btn.disabled = false;
    btn.textContent = "Send OTP";
  }
});

// Verify OTP for login
document.getElementById("verifyOtpBtn").addEventListener("click", async () => {
  const email = document.getElementById("loginEmail").value.trim();
  const otp = document.getElementById("otpInput").value.trim();

  if (!otp || otp.length !== 6) return alert("Enter valid 6-digit OTP");

  const btn = document.getElementById("verifyOtpBtn");
  btn.disabled = true;
  btn.textContent = "Verifying...";

  try {
    const res = await fetch("http://localhost:3000/api/auth/verify-login-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();

    if (res.ok) {
      document.getElementById("loginStatus").innerHTML = `<p style="color:green">✅ Welcome back ${data.user.firstName}!</p>`;

      localStorage.setItem("agroChainUser", JSON.stringify(data.user));

      setTimeout(() => {
        redirectToRolePage(data.role, data.user.email);
      }, 1000);
    } else {
      document.getElementById("loginStatus").innerHTML = `<p style="color:red">${data.msg}</p>`;
      btn.disabled = false;
      btn.textContent = "Verify OTP";
    }
  } catch (err) {
    console.error(err);
    document.getElementById("loginStatus").innerHTML = "<p style='color:red'>OTP verification failed</p>";
    btn.disabled = false;
    btn.textContent = "Verify OTP";
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
  const timerEl = document.getElementById("otpTimer");

  otpTimer = setInterval(() => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    timerEl.textContent = `Code expires in ${m}:${s.toString().padStart(2, "0")}`;
    if (timeLeft <= 0) {
      clearInterval(otpTimer);
      timerEl.textContent = "Code expired";
      document.getElementById("resendOtpBtn").style.display = "block";
    }
    timeLeft--;
  }, 1000);
}
