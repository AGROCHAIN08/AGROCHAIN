const User = require("../models/user");
const Order = require("../models/order");
const { cloudinary } = require("../config/cloudinary");

// ---------------- Get Farmer Profile ----------------
exports.getFarmerProfile = async (req, res) => {
  try {
    const farmer = await User.findOne({ email: req.params.email, role: "farmer" });
    if (!farmer) return res.status(404).json({ msg: "Farmer not found" });
    res.json(farmer);
  } catch (err) {
    console.error("Error fetching farmer profile:", err);
    res.status(500).json({ msg: "Error fetching profile" });
  }
};

// ---------------- Update Farmer Profile ----------------
exports.updateFarmerProfile = async (req, res) => {
  try {
    const farmer = await User.findOneAndUpdate(
      { email: req.params.email, role: "farmer" },
      req.body,
      { new: true }
    );
    if (!farmer) return res.status(404).json({ msg: "Farmer not found" });
    res.json(farmer);
  } catch (err) {
    console.error("Error updating farmer profile:", err);
    res.status(500).json({ msg: "Error updating profile" });
  }
};

// ---------------- Add Crop ----------------
exports.addCrop = async (req, res) => {
  try {
    const farmer = await User.findOne({ email: req.params.email, role: "farmer" });
    if (!farmer) return res.status(404).json({ msg: "Farmer not found" });

    const { 
      productType, 
      varietySpecies, 
      harvestQuantity, 
      unitOfSale, 
      targetPrice, 
      geotagLocation, 
      originLatitude, 
      originLongitude, 
      fieldAddress,
      availabilityStatus
    } = req.body;

    // Validate required fields
    if (!productType || !varietySpecies || !harvestQuantity || !unitOfSale || !targetPrice || !geotagLocation || !originLatitude || !originLongitude || !fieldAddress || !availabilityStatus) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    // Validate numeric fields
    if (isNaN(harvestQuantity) || isNaN(targetPrice) || isNaN(originLatitude) || isNaN(originLongitude)) {
      return res.status(400).json({ msg: "Quantity, price, and coordinates must be valid numbers" });
    }

    // Handle image upload
    const imageFile = req.file;
    let imageUrl = "";
    if (imageFile) {
      try {
        const uploadResult = await cloudinary.uploader.upload(imageFile.path);
        imageUrl = uploadResult.secure_url;
      } catch (uploadErr) {
        console.error("Image upload error:", uploadErr);
        return res.status(500).json({ msg: "Error uploading image" });
      }
    } else {
      return res.status(400).json({ msg: "Product image is required" });
    }

    const newCrop = {
      productType,
      varietySpecies,
      harvestQuantity: parseFloat(harvestQuantity),
      unitOfSale,
      targetPrice: parseFloat(targetPrice),
      geotagLocation,
      originLatitude: parseFloat(originLatitude),
      originLongitude: parseFloat(originLongitude),
      fieldAddress,
      availabilityStatus: availabilityStatus || 'Available',
      imageUrl,
      dateAdded: new Date()
    };

    // Initialize crops array if it doesn't exist
    if (!Array.isArray(farmer.crops)) farmer.crops = [];
    
    farmer.crops.push(newCrop);
    await farmer.save();

    res.json({ 
      msg: "Product added successfully", 
      crop: newCrop 
    });
    
  } catch (err) {
    console.error("Error adding crop:", err);
    res.status(500).json({ msg: "Error adding product" });
  }
};

// ---------------- Get Crops ----------------
exports.getCrops = async (req, res) => {
  try {
    const farmer = await User.findOne({ email: req.params.email, role: "farmer" });
    if (!farmer) return res.status(404).json({ msg: "Farmer not found" });

    // Return crops sorted by date (newest first)
    const crops = farmer.crops || [];
    crops.sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0));
    
    res.json(crops);
  } catch (err) {
    console.error("Error fetching crops:", err);
    res.status(500).json({ msg: "Error fetching crops" });
  }
};

// ---------------- Update Crop ----------------
exports.updateCrop = async (req, res) => {
  try {
    const farmer = await User.findOne({ email: req.params.email, role: "farmer" });
    if (!farmer) return res.status(404).json({ msg: "Farmer not found" });

    const cropIndex = parseInt(req.params.id);
    if (cropIndex < 0 || cropIndex >= farmer.crops.length) {
      return res.status(404).json({ msg: "Product not found" });
    }

    const { 
      productType, 
      varietySpecies, 
      harvestQuantity, 
      unitOfSale, 
      targetPrice, 
      geotagLocation, 
      originLatitude, 
      originLongitude, 
      fieldAddress,
      availabilityStatus
    } = req.body;

    // Update crop fields
    const crop = farmer.crops[cropIndex];
    if (productType) crop.productType = productType;
    if (varietySpecies) crop.varietySpecies = varietySpecies;
    if (harvestQuantity) crop.harvestQuantity = parseFloat(harvestQuantity);
    if (unitOfSale) crop.unitOfSale = unitOfSale;
    if (targetPrice) crop.targetPrice = parseFloat(targetPrice);
    if (geotagLocation) crop.geotagLocation = geotagLocation;
    if (originLatitude) crop.originLatitude = parseFloat(originLatitude);
    if (originLongitude) crop.originLongitude = parseFloat(originLongitude);
    if (fieldAddress) crop.fieldAddress = fieldAddress;
    if (availabilityStatus) crop.availabilityStatus = availabilityStatus;

    // Handle image update if provided
    if (req.file) {
      try {
        const uploadResult = await cloudinary.uploader.upload(req.file.path);
        crop.imageUrl = uploadResult.secure_url;
      } catch (uploadErr) {
        console.error("Image upload error:", uploadErr);
        return res.status(500).json({ msg: "Error uploading new image" });
      }
    }

    crop.lastUpdated = new Date();
    await farmer.save();

    res.json({ 
      msg: "Product updated successfully", 
      crop 
    });
    
  } catch (err) {
    console.error("Error updating crop:", err);
    res.status(500).json({ msg: "Error updating product" });
  }
};

// ---------------- Delete Crop ----------------
exports.deleteCrop = async (req, res) => {
  try {
    const farmer = await User.findOne({ email: req.params.email, role: "farmer" });
    if (!farmer) return res.status(404).json({ msg: "Farmer not found" });

    const cropIndex = parseInt(req.params.id);
    if (cropIndex < 0 || cropIndex >= farmer.crops.length) {
      return res.status(404).json({ msg: "Product not found" });
    }

    // Check if crop is assigned to any vehicle
    const crop = farmer.crops[cropIndex];
    const activeOrder = await Order.findOne({ 
      farmerEmail: farmer.email, 
      productId: crop._id, 
      status: { $in: ['Vehicle Assigned', 'In Transit'] }
    });

    if (activeOrder) {
      return res.status(400).json({ 
        msg: "Cannot delete product with active vehicle assignment" 
      });
    }

    // Remove crop by index
    farmer.crops.splice(cropIndex, 1);
    await farmer.save();

    res.json({ msg: "Product deleted successfully" });
    
  } catch (err) {
    console.error("Error deleting crop:", err);
    res.status(500).json({ msg: "Error deleting product" });
  }
};

// ---------------- Get Farmer Orders ----------------
exports.getFarmerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ farmerEmail: req.params.email })
      .sort({ assignedDate: -1 });

    // Populate order details
    const populatedOrders = [];
    
    for (let order of orders) {
      // Get dealer details
      const dealer = await User.findOne({ email: order.dealerEmail, role: "dealer" });
      const vehicle = dealer?.vehicles.id(order.vehicleId);

      // Get farmer and product details
      const farmer = await User.findOne({ email: order.farmerEmail, role: "farmer" });
      const product = farmer?.crops.id(order.productId);

      if (dealer && farmer && vehicle && product) {
        populatedOrders.push({
          ...order.toObject(),
          vehicleDetails: vehicle,
          dealerDetails: {
            firstName: dealer.firstName,
            lastName: dealer.lastName,
            businessName: dealer.businessName,
            mobile: dealer.mobile,
            email: dealer.email
          },
          productDetails: product
        });
      }
    }

    res.json(populatedOrders);
  } catch (err) {
    console.error("Error fetching farmer orders:", err);
    res.status(500).json({ msg: "Error fetching orders" });
  }
};

// ---------------- Get Farmer Notifications ----------------
exports.getFarmerNotifications = async (req, res) => {
  try {
    const farmerEmail = req.params.email;
    
    // Get recent orders for notifications
    const recentOrders = await Order.find({ 
      farmerEmail: farmerEmail,
      assignedDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    }).sort({ assignedDate: -1 });

    const notifications = [];

    for (let order of recentOrders) {
      const dealer = await User.findOne({ email: order.dealerEmail, role: "dealer" });
      const farmer = await User.findOne({ email: order.farmerEmail, role: "farmer" });
      const vehicle = dealer?.vehicles.id(order.vehicleId);
      const product = farmer?.crops.id(order.productId);

      if (dealer && vehicle && product) {
        notifications.push({
          id: order._id,
          type: 'vehicle_assigned',
          title: 'Vehicle Assigned to Your Product',
          message: `${dealer.businessName || dealer.firstName} has assigned vehicle ${vehicle.vehicleId} to collect ${order.quantity} ${product.unitOfSale} of your ${product.varietySpecies}`,
          timestamp: order.assignedDate,
          isRead: false,
          orderDetails: {
            productName: product.varietySpecies,
            quantity: order.quantity,
            vehicleId: vehicle.vehicleId,
            dealerName: dealer.businessName || `${dealer.firstName} ${dealer.lastName}`,
            dealerContact: dealer.mobile
          }
        });
      }
    }

    res.json(notifications);
  } catch (err) {
    console.error("Error fetching farmer notifications:", err);
    res.status(500).json({ msg: "Error fetching notifications" });
  }
};