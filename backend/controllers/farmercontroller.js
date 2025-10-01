const User = require("../models/user");
const Order = require("../models/order");
const Review = require("../models/review");
const Inventory = require("../models/inventory");
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

    if (!productType || !varietySpecies || !harvestQuantity || !unitOfSale || !targetPrice || !geotagLocation || !originLatitude || !originLongitude || !fieldAddress || !availabilityStatus) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    if (isNaN(harvestQuantity) || isNaN(targetPrice) || isNaN(originLatitude) || isNaN(originLongitude)) {
      return res.status(400).json({ msg: "Quantity, price, and coordinates must be valid numbers" });
    }

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

    const productIds = farmer.crops.map(crop => crop._id);

    const allReviews = await Review.find({ productId: { $in: productIds } })
        .populate('dealerId', 'firstName businessName')
        .sort({ createdAt: -1 });

    const reviewsByProduct = allReviews.reduce((acc, review) => {
        const productId = review.productId.toString();
        if (!acc[productId]) acc[productId] = [];
        acc[productId].push(review);
        return acc;
    }, {});
    
    const crops = (farmer.crops || []).map(crop => {
        const cropId = crop._id.toString();
        return { ...crop.toObject(), reviews: reviewsByProduct[cropId] || [] };
    });

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
      status: { $in: ['Vehicle Assigned', 'In Transit'] }
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
        product = farmer.crops.find(crop => crop._id.toString() === order.productId.toString());
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

// ---------------- Respond to Bid (MODIFIED) ----------------
exports.respondToBid = async (req, res) => {
  try {
    const { orderId, response } = req.body;

    if (!orderId || !response) {
      return res.status(400).json({ msg: "Order ID and response are required." });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ msg: "Order not found." });
    if (order.status !== 'Bid Placed') {
      return res.status(400).json({ msg: `Can only respond to orders with a 'Bid Placed' status. Current status: ${order.status}` });
    }

    const farmer = await User.findOne({ email: order.farmerEmail, role: 'farmer' });
    if (!farmer) throw new Error('Farmer associated with the order not found.');
    
    const cropIndex = farmer.crops.findIndex(c => c._id.toString() === order.productId);

    if (response === 'Accepted') {
      if (cropIndex === -1) {
        return res.status(404).json({ msg: "The ordered product could not be found in your inventory." });
      }
      
      const crop = farmer.crops[cropIndex];

      // Check if there is enough stock
      if (crop.harvestQuantity < order.quantity) {
        return res.status(400).json({ msg: `Insufficient stock for ${crop.varietySpecies}. Available: ${crop.harvestQuantity}, Ordered: ${order.quantity}` });
      }
      
      const newInventoryItem = new Inventory({
        dealerEmail: order.dealerEmail,
        productId: order.productId,
        productName: crop.varietySpecies,
        quantity: order.quantity,
        unitOfSale: crop.unitOfSale,
        purchasePrice: order.bidPrice,
        farmerEmail: order.farmerEmail,
        imageUrl: crop.imageUrl
      });
      await newInventoryItem.save();

      // NEW LOGIC: Reduce farmer's inventory quantity or remove product entirely
      if (crop.harvestQuantity - order.quantity <= 0) {
        // If the ordered quantity is all or more of the stock, remove the product
        farmer.crops.splice(cropIndex, 1);
      } else {
        // Otherwise, just reduce the quantity
        farmer.crops[cropIndex].harvestQuantity -= order.quantity;
      }
      await farmer.save();

      order.status = 'Completed';
      order.paymentStatus = 'Completed'; // As per request, payment process is not shown
      order.timeline.push({ status: 'Bid Accepted', notes: 'Farmer accepted the bid.' });
      order.timeline.push({ status: 'Completed', notes: 'Order marked as completed and item moved to dealer inventory.' });

    } else if (response === 'Rejected') {
      // NOTE: Logic to add quantity back is removed as it's no longer necessary.
      // The quantity is only subtracted upon bid acceptance now.
      
      order.status = 'Cancelled';
      order.timeline.push({ status: 'Bid Rejected', notes: 'Farmer rejected the bid.' });
      
      // Make the assigned vehicle available again
      const dealer = await User.findOne({ email: order.dealerEmail, role: 'dealer' });
      if (dealer) {
          const vehicleIndex = dealer.vehicles.findIndex(v => v._id.toString() === order.vehicleId);
          if (vehicleIndex !== -1) {
              dealer.vehicles[vehicleIndex].currentStatus = 'AVAILABLE';
              dealer.vehicles[vehicleIndex].assignedTo = undefined;
              await dealer.save();
          }
      }

    } else {
      return res.status(400).json({ msg: "Invalid response. Must be 'Accepted' or 'Rejected'." });
    }

    await order.save();
    res.json({ msg: `Bid has been ${response.toLowerCase()}.`, order });

  } catch (err) {
    console.error("Error responding to bid:", err);
    res.status(500).json({ msg: "Server error while responding to bid", error: err.message });
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
        product = farmer.crops.find(crop => crop._id.toString() === order.productId.toString());
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