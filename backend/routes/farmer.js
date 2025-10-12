// ===========================
// IN routes/farmer.js
// ===========================

const express = require("express");
const router = express.Router();
const { upload } = require("../config/cloudinary");
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
  rejectBid,
  markNotificationsAsRead  // ADD THIS
} = require("../controllers/farmercontroller");

// ===========================
// PROFILE ROUTES
// ===========================
router.get("/profile/:email", getFarmerProfile);
router.put("/profile/:email", updateFarmerProfile);

// ===========================
// CROP/PRODUCT MANAGEMENT ROUTES
// ===========================
router.post("/crops/:email", upload.single("image"), addCrop);
router.get("/crops/:email", getCrops);
router.put("/crops/:email/:id", upload.single("image"), updateCrop);
router.delete("/crops/:email/:id", deleteCrop);

// ===========================
// ORDER AND NOTIFICATION ROUTES
// ===========================
router.get("/orders/:email", getFarmerOrders);
router.get("/notifications/:email", getFarmerNotifications);
router.post("/notifications/:email/mark-read", markNotificationsAsRead);  // ADD THIS LINE

router.post("/accept-bid/:email", acceptBid);
router.post("/reject-bid/:email", rejectBid);

module.exports = router;