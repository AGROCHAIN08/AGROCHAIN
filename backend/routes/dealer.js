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
  placeBid,
  getInventory,
  addInventory,
  updateInventory,
  deleteInventory
} = require("../controllers/dealercontroller");

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
router.post("/place-bid", placeBid);

// Inventory management routes
router.get("/inventory/:email", getInventory);
router.post("/inventory/:email", addInventory);
router.put("/inventory/:email/:inventoryId", updateInventory);
router.delete("/inventory/:email/:inventoryId", deleteInventory);

module.exports = router;