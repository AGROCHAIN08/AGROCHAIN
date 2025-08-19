const FarmerProduct = require("../models/farmerproducts");

// Add new product
exports.addProduct = async (req, res) => {
    try {
        const product = new FarmerProduct({
            farmProducts: [req.body]
        });
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all products
exports.getProducts = async (req, res) => {
    try {
        const products = await FarmerProduct.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get product by ID
exports.getProductById = async (req, res) => {
    try {
        const product = await FarmerProduct.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update product
exports.updateProduct = async (req, res) => {
    try {
        const product = await FarmerProduct.findByIdAndUpdate(
            req.params.id,
            { ...req.body, "farmProducts.0.lastUpdated": Date.now() },
            { new: true }
        );
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.json(product);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete product
exports.deleteProduct = async (req, res) => {
    try {
        const product = await FarmerProduct.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
