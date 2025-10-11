const express = require("express");
const router = express.Router();
const { 
  getDealerInventories, 
  placeOrder, 
  getOrders, 
  updateOrder, 
  completePayment,
  submitReview 
} = require("../controllers/retailercontroller");

router.get("/dealer-inventory", getDealerInventories);
router.post("/place-order", placeOrder);
router.get("/orders/:email", getOrders);
router.put("/orders/:orderId", updateOrder);

// Route for finalizing payment and updating inventory
router.post("/orders/:orderId/complete-payment", completePayment);

// Route for submitting reviews
router.post("/submit-review", submitReview);

module.exports = router;