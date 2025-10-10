const mongoose = require("mongoose");

// ===========================
// ORDER SCHEMA DEFINITION
// ===========================
const orderSchema = new mongoose.Schema({
  // Basic order information
  dealerEmail: { type: String, required: true },
  farmerEmail: { type: String, required: true },
  productId: { type: String, required: true },
  vehicleId: { type: String, required: true },
  quantity: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  
  // Bidding information
  bidPrice: { type: Number },                    // Dealer's bid price per unit
  originalPrice: { type: Number },               // Original farmer's price
  bidStatus: { 
    type: String, 
    enum: ['Pending', 'Accepted', 'Rejected'], 
    default: 'Pending' 
  },
  bidDate: { type: Date },
  bidResponseDate: { type: Date },
  
  // Order status tracking
  status: { 
    type: String, 
    enum: [
      'Vehicle Assigned',      // Initial state when vehicle is assigned
      'Bid Placed',           // Dealer placed a bid after review
      'Bid Accepted',         // Farmer accepted the bid
      'Bid Rejected',         // Farmer rejected the bid
      'In Transit',           // Vehicle on the way to pickup/delivery
      'Delivered',            // Product delivered to dealer
      'Completed',            // Order completed with payment
      'Cancelled'             // Order cancelled
    ], 
    default: 'Vehicle Assigned'
  },
  
  // Receipt information
  receiptNumber: { type: String },
  receiptGeneratedAt: { type: Date },
  
  // Important dates
  assignedDate: { type: Date, default: Date.now },
  tentativeDate: { type: Date },          // Expected arrival date
  pickupDate: { type: Date },             // Actual pickup date
  deliveryDate: { type: Date },           // Actual delivery date
  
  // Payment tracking
  paymentStatus: { 
    type: String, 
    enum: ['Pending', 'Completed', 'Failed'], 
    default: 'Pending' 
  },
  
  // Location tracking
  pickupLocation: {
    address: String,
    latitude: Number,
    longitude: Number
  },
  
  deliveryLocation: {
    address: String,
    latitude: Number,
    longitude: Number
  },
  
  // Additional tracking information
  trackingNumber: { type: String },
  
  // Order timeline for different stages
  timeline: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    notes: String
  }]
}, { 
  timestamps: true  // Automatically add createdAt and updatedAt
});

// ===========================
// INDEXES FOR PERFORMANCE
// ===========================
// Index for dealer queries
orderSchema.index({ dealerEmail: 1, assignedDate: -1 });

// Index for farmer queries
orderSchema.index({ farmerEmail: 1, assignedDate: -1 });

// Index for status queries
orderSchema.index({ status: 1 });

// Index for bid status
orderSchema.index({ bidStatus: 1 });

module.exports = mongoose.model("Order", orderSchema);