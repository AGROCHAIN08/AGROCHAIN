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
  getDealerOrders
} = require("../controllers/dealerController");

// Profile routes
router.get("/profile/:email", getDealerProfile);
router.put("/profile/:email", updateDealerProfile);

// Vehicle management routes
router.post("/vehicles/:email", addVehicle);
router.get("/vehicles/:email", getVehicles);
router.put("/vehicles/:email/:vehicleId", updateVehicleStatus);
router.delete("/vehicles/:email/:vehicleId", deleteVehicle);

// Product browsing routes
router.get("/all-products", getAllProducts);

// Order management routes
router.post("/assign-vehicle", assignVehicle);
router.get("/orders/:email", getDealerOrders);

module.exports = router;