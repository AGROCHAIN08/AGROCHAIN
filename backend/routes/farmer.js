const express = require("express");
const router = express.Router();
const { upload } = require("../config/cloudinary"); // Import Cloudinary upload middleware
const { 
  getFarmerProfile, 
  updateFarmerProfile, 
  addCrop, 
  getCrops, 
  updateCrop,
  deleteCrop,
  getFarmerOrders,
  getFarmerNotifications
} = require("../controllers/farmercontroller");

// Profile routes
router.get("/profile/:email", getFarmerProfile);
router.put("/profile/:email", updateFarmerProfile);

// Crops routes with updated field structure
router.post("/crops/:email", upload.single("image"), addCrop); // Add new product
router.get("/crops/:email", getCrops); // Get all products
router.put("/crops/:email/:id", upload.single("image"), updateCrop); // Update product
router.delete("/crops/:email/:id", deleteCrop); // Delete product

// Orders and notifications routes
router.get("/orders/:email", getFarmerOrders); // Get farmer orders
router.get("/notifications/:email", getFarmerNotifications); // Get farmer notifications

module.exports = router;