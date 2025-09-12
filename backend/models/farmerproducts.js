const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema({
    farmProducts: [
        {
            productName: {
                type: String,
                required: true,
            },
            productQuantity: {
                type: Number,
                required: true,
            },
            productUnit: {
                type: String,
                required: true,
                enum: ["kg", "litre", "ton", "dozen"]
            },
            productPrice: {
                type: Number, 
                required: true,
            },
            expiryDate: {
                type: Date,
            },
            stockAvailable: {
                type: Boolean,
                default: true
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
            lastUpdated: {
                type: Date,
                default: Date.now,
            }
        }
    ]
});

const FarmerProduct = mongoose.model("FarmerProduct", farmerSchema);
module.exports = FarmerProduct;
