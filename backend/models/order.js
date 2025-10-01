const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  dealerEmail: { type: String, required: true },
  farmerEmail: { type: String, required: true },
  productId: { type: String, required: true }, // Changed from ObjectId to String
  vehicleId: { type: String, required: true }, // Changed from ObjectId to String
  quantity: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: [
      'Vehicle Assigned',
      'Inspection Complete',
      'Bid Placed', // New status for when a dealer makes an offer
      'Payment Pending', // This is after farmer accepts the bid
      'In Transit',
      'Delivered',
      'Completed',
      'Cancelled'
    ], 
    default: 'Vehicle Assigned'
  },
  
  // New fields for the bidding process
  bidPrice: { type: Number }, // Price per unit offered by dealer
  negotiatedTotalAmount: { type: Number }, // Total amount after bid
  expectedDeliveryDate: { type: Date },
  paymentMethod: { type: String },
  deliveryAddress: { type: String },
  
  assignedDate: { type: Date, default: Date.now },
  pickupDate: { type: Date },
  deliveryDate: { type: Date },
  inspectionNotes: { type: String },
  qualityScore: { type: Number, min: 0, max: 10 },
  paymentStatus: { 
    type: String, 
    enum: ['Pending', 'Completed', 'Failed'], 
    default: 'Pending' 
  },
  trackingNumber: { type: String },
  
  // Additional details for better tracking
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
  
  // Timestamps for different stages
  timeline: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    notes: String
  }]
}, { 
  timestamps: true 
});

// Add indexes for better query performance
orderSchema.index({ dealerEmail: 1, assignedDate: -1 });
orderSchema.index({ farmerEmail: 1, assignedDate: -1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model("Order", orderSchema);