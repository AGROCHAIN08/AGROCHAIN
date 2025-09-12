const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  role: { type: String, enum: ["farmer", "dealer", "retailer"], required: true },
  firstName: { type: String, required: true },
  lastName: { type: String },
  mobile: { type: String, required: true },
  email: { type: String, required: true, unique: true },

  // Farmer fields
  aadhaar: { type: String },
  farmLocation: { type: String },
  geoTag: { type: String },
  farmSize: { type: String },
  cropsGrown: [{ type: String }],

  // Dealer fields
  businessName: { type: String },
  gstin: { type: String },
  warehouseAddress: { type: String },
  preferredCommodities: [{ type: String }],

  // Retailer fields
  shopName: { type: String },
  shopAddress: { type: String },
  shopType: { type: String },
  monthlyPurchaseVolume: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
