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
  verifyGoogleLogin
} = require("../controllers/authcontroller");

// Signup routes
router.post("/signup", signup);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/verify-google", verifyGoogleToken);
router.post("/signup-google", signupWithGoogle);

// Login routes
router.post("/send-login-otp", sendLoginOTP);
router.post("/verify-login-otp", verifyLoginOTP);
router.post("/login-google", verifyGoogleLogin);

module.exports = router;