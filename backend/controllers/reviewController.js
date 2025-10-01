const Review = require("../models/review");
const Order = require("../models/order");
const User = require("../models/user");
const { cloudinary } = require("../config/cloudinary");
const mongoose = require('mongoose');

// Add a new review
exports.addReview = async (req, res) => {
    try {
        const {
            productId,
            orderId,
            farmerId,
            dealerId,
            qualityGrade,
            color,
            damageLevel,
            pestInfection,
            remarks
        } = req.body;

        // Basic validation for required fields
        if (!productId || !orderId || !farmerId || !dealerId || !qualityGrade) {
            return res.status(400).json({ msg: "Missing required review fields" });
        }

        // Prevent duplicate reviews for the same order
        const existingReview = await Review.findOne({ orderId });
        if (existingReview) {
            return res.status(400).json({ msg: "A review for this order has already been submitted." });
        }

        // Handle image uploads to Cloudinary if files are present
        let attachmentUrls = [];
        if (req.files) {
            for (const file of req.files) {
                const uploadResult = await cloudinary.uploader.upload(file.path);
                attachmentUrls.push(uploadResult.secure_url);
            }
        }

        // Create a new review instance with the data
        const newReview = new Review({
            productId: new mongoose.Types.ObjectId(productId),
            orderId: new mongoose.Types.ObjectId(orderId),
            farmerId: new mongoose.Types.ObjectId(farmerId),
            dealerId: new mongoose.Types.ObjectId(dealerId),
            qualityGrade,
            parameters: { color, damageLevel, pestInfection: pestInfection ? Number(pestInfection) : 0 },
            remarks,
            attachments: attachmentUrls
        });

        // Save the new review to the database
        await newReview.save();

        // Update the corresponding order's status to "Inspection Complete"
        await Order.findByIdAndUpdate(orderId, {
            status: 'Inspection Complete',
            $push: { timeline: { status: 'Inspection Complete', notes: `Review submitted with grade: ${qualityGrade}` } }
        });

        // Send a success response
        res.status(201).json({ msg: "Review submitted successfully", review: newReview });

    } catch (err) {
        console.error("Error adding review:", err);
        res.status(500).json({ msg: "Server error while adding review" });
    }
};

// Get all reviews for a specific product
exports.getReviewsForProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        // Find reviews and populate dealer information to show who wrote the review
        const reviews = await Review.find({ productId: new mongoose.Types.ObjectId(productId) })
            .populate('dealerId', 'firstName lastName businessName')
            .sort({ createdAt: -1 }); // Show newest reviews first
        res.json(reviews);
    } catch (err) {
        console.error("Error fetching reviews:", err);
        res.status(500).json({ msg: "Server error while fetching reviews" });
    }
};