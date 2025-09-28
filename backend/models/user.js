const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  role: { type: String, enum: ["farmer", "dealer", "retailer"], required: true },
  firstName: { type: String, required: true },
  lastName: { type: String },
  mobile: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  
  // Email verification fields
  emailVerified: { type: Boolean, default: false },
  googleAuth: { type: Boolean, default: false },

  // Farmer fields
  aadhaar: { type: String },
  farmLocation: { type: String },
  geoTag: { type: String },
  farmSize: { type: String },
  cropsGrown: [{ type: String }],

  // Updated crops schema with new field structure
  crops: [
    {
      productType: { type: String, required: true }, // Fruit, Vegetable, Cereal, etc.
      varietySpecies: { type: String, required: true }, // Alphonso Mango, Red Delicious Apple, etc.
      harvestQuantity: { type: Number, required: true }, // Numeric quantity
      unitOfSale: { type: String, required: true }, // Kg, Box (20 Kg), Crate, etc.
      targetPrice: { type: Number, required: true }, // Price in rupees
      geotagLocation: { type: String, required: true }, // Auto-detected location
      originLatitude: { type: Number, required: true }, // GPS latitude
      originLongitude: { type: Number, required: true }, // GPS longitude
      fieldAddress: { type: String, required: true }, // Village, landmark details
      availabilityStatus: { type: String, enum: ["Available", "Out of Stock", "Coming Soon"], default: "Available" },
      imageUrl: { type: String, required: true }, // Product image
      dateAdded: { type: Date, default: Date.now },
      lastUpdated: { type: Date, default: Date.now }
    },
  ],

  // Dealer fields
  businessName: { type: String },
  gstin: { type: String },
  warehouseAddress: { type: String },
  preferredCommodities: [{ type: String }],

  // Dealer vehicles
  vehicles: [
    {
      vehicleId: { type: String, required: true },
      vehicleType: { 
        type: String, 
        enum: ["Reefer Truck (5 MT)", "Insulated Van (2 MT)", "Inspection Van", "Heavy Truck (10 MT)"], 
        required: true 
      },
      temperatureCapacity: { type: String, required: true },
      currentStatus: { 
        type: String, 
        enum: ['AVAILABLE', 'ASSIGNED', 'MAINTENANCE'], 
        default: 'AVAILABLE' 
      },
      assignedTo: {
        productId: { type: String },
        productName: { type: String },
        farmerEmail: { type: String },
        farmerName: { type: String },
        quantity: { type: Number },
        assignedDate: { type: Date }
      },
      dateAdded: { type: Date, default: Date.now }
    }
  ],

  // Retailer fields
  shopName: { type: String },
  shopAddress: { type: String },
  shopType: { type: String },
  monthlyPurchaseVolume: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);