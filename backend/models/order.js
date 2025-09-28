const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  dealerEmail: { type: String, required: true },
  farmerEmail: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, required: true },
  quantity: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: [
      'Vehicle Assigned',
      'In Transit',
      'Delivered',
      'Inspection Complete',
      'Payment Pending',
      'Completed',
      'Cancelled'
    ], 
    default: 'Vehicle Assigned'
  },
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