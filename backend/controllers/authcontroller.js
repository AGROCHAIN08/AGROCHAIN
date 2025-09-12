const User = require("../models/user");

// Signup
exports.signup = async (req, res) => {
  try {
    const { role, firstName, mobile, email } = req.body;

    if (!role || !firstName || !mobile || !email) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    // Farmer checks
    if (role === "farmer") {
      if (!req.body.aadhaar || req.body.aadhaar.length !== 12) {
        return res.status(400).json({ msg: "Farmer Aadhaar must be 12 digits" });
      }
    }

    // Dealer checks
    if (role === "dealer") {
      if (!req.body.gstin) {
        return res.status(400).json({ msg: "Dealer GSTIN is required" });
      }
      if (req.body.mobile.length !== 12) {
        return res.status(400).json({ msg: "Dealer mobile must be 12 digits" });
      }
    }

    // Retailer checks
    if (role === "retailer") {
      if (!req.body.shopName) {
        return res.status(400).json({ msg: "Retailer shop name required" });
      }
      if (req.body.mobile.length !== 10) {
        return res.status(400).json({ msg: "Retailer mobile must be 10 digits" });
      }
    }

    const user = new User(req.body);
    await user.save();
    res.status(201).json({ msg: "User registered successfully", user });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};
