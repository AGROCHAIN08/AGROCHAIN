const express = require("express");
const router = express.Router();
const { upload } = require("../config/cloudinary");
const { addReview, getReviewsForProduct } = require("../controllers/reviewController");

// Handles POST requests to /api/reviews/
// This route is used for adding a new review for a product and handles multiple image uploads for attachments.
router.post("/", upload.array("attachments", 5), addReview);

// Handles GET requests to /api/reviews/:productId
// This route is used to get all reviews for a specific product.
router.get("/:productId", getReviewsForProduct);

module.exports = router;