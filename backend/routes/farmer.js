const express = require("express");
const router = express.Router();
const farmerController = require("../controllers/farmercontroller");

// Routes
router.post("/products", farmerController.addProduct);     // add
router.get("/products", farmerController.getProducts);     // get all
router.get("/products/:id", farmerController.getProductById); // get one
router.put("/products/:id", farmerController.updateProduct);  // update
router.delete("/products/:id", farmerController.deleteProduct); // delete

module.exports = router;
