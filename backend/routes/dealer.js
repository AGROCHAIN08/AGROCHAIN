const express = require("express");
const router = express.Router();
const { 
  getDealerProfile, 
  updateDealerProfile, 
  addVehicle, 
  getVehicles,
  updateVehicleStatus,
  deleteVehicle,
  getAllProducts,
  assignVehicle,
  getDealerOrders,
  submitReview,
  placeBid,
  freeVehicle
} = require("../controllers/dealercontroller");

// ===========================
// PROFILE ROUTES
// ===========================
router.get("/profile/:email", getDealerProfile);
router.put("/profile/:email", updateDealerProfile);

// ===========================
// VEHICLE MANAGEMENT ROUTES
// ===========================
router.post("/vehicles/:email", addVehicle);
router.get("/vehicles/:email", getVehicles);
router.put("/vehicles/:email/:vehicleId", updateVehicleStatus);
router.delete("/vehicles/:email/:vehicleId", deleteVehicle);
router.post("/vehicles/free/:email/:vehicleId", freeVehicle);

// ===========================
// PRODUCT BROWSING ROUTES
// ===========================
router.get("/all-products", getAllProducts);

// ===========================
// ORDER MANAGEMENT ROUTES
// ===========================
router.post("/assign-vehicle", assignVehicle);
router.get("/orders/:email", getDealerOrders);

// ===========================
// REVIEW ROUTES
// ===========================
router.post("/submit-review", submitReview);

// ===========================
// BIDDING ROUTES
// ===========================
router.post("/place-bid", placeBid);

module.exports = router;