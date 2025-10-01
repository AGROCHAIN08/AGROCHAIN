const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  dealerEmail: { type: String, required: true },
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitOfSale: { type: String, required: true },
  purchasePrice: { type: Number, required: true },
  purchaseDate: { type: Date, default: Date.now },
  farmerEmail: { type: String, required: true },
  imageUrl: { type: String },
  status: {
    type: String,
    enum: ['In Stock', 'Sold Out'],
    default: 'In Stock'
  }
}, { timestamps: true });

inventorySchema.index({ dealerEmail: 1 });

module.exports = mongoose.model("Inventory", inventorySchema);