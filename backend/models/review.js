const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User.crops' },
  orderId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Order' },
  farmerId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  dealerId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  inspectionDate: { type: Date, default: Date.now },
  qualityGrade: {
    type: String,
    enum: ['A', 'B', 'C', 'Rejected'],
    required: true
  },
  parameters: {
    color: { type: String },
    damageLevel: { type: String, enum: ['Low', 'Medium', 'High'] },
    pestInfection: { type: Number, min: 0, max: 100 } // Percentage
  },
  remarks: { type: String },
  attachments: [{ type: String }] // Array of Cloudinary image URLs
}, { timestamps: true });

reviewSchema.index({ productId: 1 });
reviewSchema.index({ farmerId: 1 });

module.exports = mongoose.model("Review", reviewSchema);