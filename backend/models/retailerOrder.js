const mongoose = require("mongoose");

const retailerOrderSchema = new mongoose.Schema({
  retailerEmail: { type: String, required: true },
  
  // An order is a collection of items from ONE dealer.
  dealerInfo: {
    email: { type: String, required: true },
    businessName: { type: String, required: true },
    warehouseAddress: { type: String, required: true } // Dealer's address for pickup/reference
  },
  
  products: [{
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true }
  }],
  
  totalAmount: { type: Number, required: true },
  
  // Retailer's address for delivery
  shippingAddress: { type: String, required: true },
  
  paymentDetails: {
    status: { type: String, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' },
    method: { type: String }
  },
  
  orderStatus: {
    type: String,
    enum: ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Placed'
  },
  
  // Review tracking
  reviewSubmitted: { type: Boolean, default: false }
  
}, { timestamps: true });

module.exports = mongoose.model("RetailerOrder", retailerOrderSchema);