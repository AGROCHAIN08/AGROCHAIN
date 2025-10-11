const express = require("express");
const router = express.Router();
const { 
  signup, 
  sendOTP, 
  verifyOTP, 
  verifyGoogleToken, 
  signupWithGoogle,
  sendLoginOTP,
  verifyLoginOTP,
  verifyGoogleLogin,
  updateFarmerProfile  // 👈 ADD THIS LINE
} = require("../controllers/authcontroller");


// ===========================
// PROFILE ROUTE (COMMON FOR ALL USERS)
// ===========================
const User = require("../models/user");

router.get("/profile/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ msg: "Error fetching user profile" });
  }
});


// Signup routes
router.post("/signup", signup);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/verify-google", verifyGoogleToken);
router.post("/signup-google", signupWithGoogle);
router.put("/farmer/update/:email", updateFarmerProfile);

// Login routes
router.post("/send-login-otp", sendLoginOTP);
router.post("/verify-login-otp", verifyLoginOTP);
router.post("/login-google", verifyGoogleLogin);

module.exports = router;