// Step navigation
const steps = document.querySelectorAll(".form-step");
const stepperItems = document.querySelectorAll(".stepper li");

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

// Step 1 validation
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
  goToStep(1);
});

// Step 2 validation
document.getElementById("next2").addEventListener("click", () => {
  if (!roleSelect.value) {
    alert("Please select a role before continuing.");
    return;
  }
  goToStep(2);
});

// Back buttons
document.getElementById("back1").addEventListener("click", () => goToStep(0));
document.getElementById("back2").addEventListener("click", () => goToStep(1));

// Final submission validation
document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const role = roleSelect.value;

  // Farmer-specific validation
  if (role === "farmer") {
    const aadhaar = document.getElementById("aadhaar").value.trim();
    if (!/^\d{12}$/.test(aadhaar)) {
      alert("Aadhaar must be exactly 12 digits.");
      return;
    }
  }

  // Dealer-specific validation
  if (role === "dealer") {
    const gstin = document.getElementById("gstin").value.trim();
    if (!gstin) {
      alert("GSTIN is required for dealers.");
      return;
    }
  }

  // Retailer-specific validation
  if (role === "retailer") {
    const shopName = document.getElementById("shopName").value.trim();
    if (!shopName) {
      alert("Shop name is required for retailers.");
      return;
    }
  }

  // Submit if all validations pass
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);

  try {
    const res = await fetch("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    document.getElementById("message").innerHTML = `<p style="color:green">${result.msg}</p>`;
  } catch (err) {
    console.error(err);
    document.getElementById("message").innerHTML = "<p style='color:red'>Error submitting form</p>";
  }
});
