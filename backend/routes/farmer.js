const express = require("express");
const router = express.Router();
const { upload } = require("../config/cloudinary"); // Cloudinary upload middleware
const { 
  getFarmerProfile, 
  updateFarmerProfile, 
  addCrop, 
  getCrops, 
  updateCrop,
  deleteCrop,
  getFarmerOrders,
  getFarmerNotifications,
  acceptBid, 
  rejectBid
} = require("../controllers/farmercontroller");

// ===========================
// PROFILE ROUTES
// ===========================
router.get("/profile/:email", getFarmerProfile);       // Get farmer profile
router.put("/profile/:email", updateFarmerProfile);    // Update farmer profile

// ===========================
// CROP/PRODUCT MANAGEMENT ROUTES
// ===========================
router.post("/crops/:email", upload.single("image"), addCrop);        // Add new product
router.get("/crops/:email", getCrops);                                 // Get all products
router.put("/crops/:email/:id", upload.single("image"), updateCrop);  // Update product
router.delete("/crops/:email/:id", deleteCrop);                        // Delete product

// ===========================
// ORDER AND NOTIFICATION ROUTES
// ===========================
router.get("/orders/:email", getFarmerOrders);              // Get farmer orders
router.get("/notifications/:email", getFarmerNotifications); // Get farmer notifications

router.post("/accept-bid/:email", acceptBid);      // Accept bid
router.post("/reject-bid/:email", rejectBid);      // Reject bid

module.exports = router;