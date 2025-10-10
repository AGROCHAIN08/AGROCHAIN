const User = require("../models/user");
const Order = require("../models/order");
const { cloudinary } = require("../config/cloudinary");

// Generate unique receipt number
function generateReceiptNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `RCP-${year}${month}${day}-${random}`;
}

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
      availabilityStatus
    } = req.body;

    if (!productType || !varietySpecies || !harvestQuantity || !unitOfSale || !targetPrice) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    if (isNaN(harvestQuantity) || isNaN(targetPrice)) {
      return res.status(400).json({ msg: "Quantity and price must be valid numbers" });
    }

    const imageFile = req.file;
    if (!imageFile) {
      return res.status(400).json({ msg: "Product image is required" });
    }

    let imageUrl = "";
    try {
      const uploadResult = await cloudinary.uploader.upload(imageFile.path);
      imageUrl = uploadResult.secure_url;
    } catch (err) {
      console.error("Image upload error:", err);
      return res.status(500).json({ msg: "Error uploading image" });
    }

    const newCrop = {
      productType,
      varietySpecies,
      harvestQuantity: parseFloat(harvestQuantity),
      unitOfSale,
      targetPrice: parseFloat(targetPrice),
      availabilityStatus: availabilityStatus,
      imageUrl,
      dateAdded: new Date()
    };

    if (!Array.isArray(farmer.crops)) farmer.crops = [];
    farmer.crops.push(newCrop);
    await farmer.save();

    res.json({
      msg: "Product added successfully",
      crop: newCrop
    });

  } catch (err) {
    console.error("Error adding crop:", err);
    res.status(500).json({ msg: "Internal Server Error while adding product" });
  }
};

// ---------------- Get Crops ----------------
exports.getCrops = async (req, res) => {
  try {
    const farmer = await User.findOne({ email: req.params.email, role: "farmer" });
    if (!farmer) return res.status(404).json({ msg: "Farmer not found" });

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
      availabilityStatus
    } = req.body;

    const crop = farmer.crops[cropIndex];
    if (productType) crop.productType = productType;
    if (varietySpecies) crop.varietySpecies = varietySpecies;
    if (harvestQuantity) crop.harvestQuantity = parseFloat(harvestQuantity);
    if (unitOfSale) crop.unitOfSale = unitOfSale;
    if (targetPrice) crop.targetPrice = parseFloat(targetPrice);
    if (availabilityStatus) crop.availabilityStatus = availabilityStatus;

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

    const crop = farmer.crops[cropIndex];
    const activeOrder = await Order.findOne({ 
      farmerEmail: farmer.email, 
      productId: crop._id.toString(),
      status: { $in: ['Vehicle Assigned', 'In Transit', 'Bid Placed'] }
    });

    if (activeOrder) {
      return res.status(400).json({ 
        msg: "Cannot delete product with active vehicle assignment" 
      });
    }

    farmer.crops.splice(cropIndex, 1);
    await farmer.save();

    res.json({ msg: "Product deleted successfully" });
    
  } catch (err) {
    console.error("Error deleting crop:", err);
    res.status(500).json({ msg: "Error deleting product" });
  }
};

// ---------------- Accept Bid ----------------
exports.acceptBid = async (req, res) => {
  try {
    const { orderId } = req.body;
    const { email } = req.params;

    if (!orderId) {
      return res.status(400).json({ msg: "Order ID is required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    if (order.farmerEmail !== email) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    if (order.bidStatus !== 'Pending') {
      return res.status(400).json({ msg: "Bid already processed" });
    }

    // Update order
    order.bidStatus = 'Accepted';
    order.bidResponseDate = new Date();
    order.status = 'Bid Accepted';
    order.receiptNumber = generateReceiptNumber();
    order.receiptGeneratedAt = new Date();
    
    await order.save();

    // Update product quantity
    const farmer = await User.findOne({ email: order.farmerEmail, role: "farmer" });
    if (farmer && farmer.crops) {
      const productIndex = farmer.crops.findIndex(c => c._id.toString() === order.productId.toString());
      if (productIndex !== -1) {
        const currentQty = parseFloat(farmer.crops[productIndex].harvestQuantity);
        const orderedQty = parseFloat(order.quantity);
        farmer.crops[productIndex].harvestQuantity = currentQty - orderedQty;
        
        // Update status if out of stock
        if (farmer.crops[productIndex].harvestQuantity <= 0) {
          farmer.crops[productIndex].availabilityStatus = 'Out of Stock';
        }
        
        await farmer.save();
      }
    }

    // Notify dealer
    const dealer = await User.findOne({ email: order.dealerEmail, role: "dealer" });
    if (dealer) {
      if (!dealer.notifications) dealer.notifications = [];
      dealer.notifications.push({
        title: "Bid Accepted!",
        message: `Farmer has accepted your bid of ₹${order.bidPrice} per unit. Receipt: ${order.receiptNumber}`,
        createdAt: new Date()
      });
      await dealer.save();
    }

    res.json({ 
      msg: "Bid accepted successfully",
      order,
      receiptNumber: order.receiptNumber
    });

  } catch (err) {
    console.error("Error accepting bid:", err);
    res.status(500).json({ msg: "Error accepting bid" });
  }
};

// ---------------- Reject Bid ----------------
exports.rejectBid = async (req, res) => {
  try {
    const { orderId } = req.body;
    const { email } = req.params;

    if (!orderId) {
      return res.status(400).json({ msg: "Order ID is required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    if (order.farmerEmail !== email) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    if (order.bidStatus !== 'Pending') {
      return res.status(400).json({ msg: "Bid already processed" });
    }

    // Update order
    order.bidStatus = 'Rejected';
    order.bidResponseDate = new Date();
    order.status = 'Bid Rejected';
    
    await order.save();

    // Update product availability back to Available
    const farmer = await User.findOne({ email: order.farmerEmail, role: "farmer" });
    if (farmer && farmer.crops) {
      const productIndex = farmer.crops.findIndex(c => c._id.toString() === order.productId.toString());
      if (productIndex !== -1) {
        farmer.crops[productIndex].availabilityStatus = 'Available';
        await farmer.save();
      }
    }

    // Make vehicle available again
    const dealer = await User.findOne({ email: order.dealerEmail, role: "dealer" });
    if (dealer && dealer.vehicles) {
      const vehicleIndex = dealer.vehicles.findIndex(v => v._id.toString() === order.vehicleId.toString());
      if (vehicleIndex !== -1) {
        dealer.vehicles[vehicleIndex].currentStatus = 'AVAILABLE';
        dealer.vehicles[vehicleIndex].assignedTo = undefined;
      }
      
      // Notify dealer
      if (!dealer.notifications) dealer.notifications = [];
      dealer.notifications.push({
        title: "Bid Rejected",
        message: `Farmer has rejected your bid of ₹${order.bidPrice} per unit for ${order.quantity} units.`,
        createdAt: new Date()
      });
      
      await dealer.save();
    }

    res.json({ 
      msg: "Bid rejected successfully",
      order
    });

  } catch (err) {
    console.error("Error rejecting bid:", err);
    res.status(500).json({ msg: "Error rejecting bid" });
  }
};

// ---------------- Get Farmer Orders ----------------
exports.getFarmerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ farmerEmail: req.params.email })
      .sort({ assignedDate: -1 });

    const populatedOrders = [];
    
    for (let order of orders) {
      const dealer = await User.findOne({ email: order.dealerEmail, role: "dealer" });
      const vehicle = dealer?.vehicles.id(order.vehicleId);

      const farmer = await User.findOne({ email: order.farmerEmail, role: "farmer" });
      
      let product = null;
      if (farmer && farmer.crops) {
        farmer.crops.forEach(crop => {
          if (crop._id.toString() === order.productId.toString()) {
            product = crop;
          }
        });
      }

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
    
    const recentOrders = await Order.find({ 
      farmerEmail: farmerEmail,
      assignedDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).sort({ assignedDate: -1 });

    const notifications = [];

    for (let order of recentOrders) {
      const dealer = await User.findOne({ email: order.dealerEmail, role: "dealer" });
      const farmer = await User.findOne({ email: order.farmerEmail, role: "farmer" });
      const vehicle = dealer?.vehicles.id(order.vehicleId);
      
      let product = null;
      if (farmer && farmer.crops) {
        farmer.crops.forEach(crop => {
          if (crop._id.toString() === order.productId.toString()) {
            product = crop;
          }
        });
      }

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