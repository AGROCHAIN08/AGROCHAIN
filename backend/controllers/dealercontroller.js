const User = require("../models/user");
const Order = require("../models/order");

// ===========================
// DEALER PROFILE MANAGEMENT
// ===========================

// Get Dealer Profile
exports.getDealerProfile = async (req, res) => {
  try {
    const dealer = await User.findOne({ email: req.params.email, role: "dealer" });
    if (!dealer) return res.status(404).json({ msg: "Dealer not found" });
    res.json(dealer);
  } catch (err) {
    console.error("Error fetching dealer profile:", err);
    res.status(500).json({ msg: "Error fetching profile" });
  }
};

// Update Dealer Profile
exports.updateDealerProfile = async (req, res) => {
  try {
    const dealer = await User.findOneAndUpdate(
      { email: req.params.email, role: "dealer" },
      req.body,
      { new: true }
    );
    if (!dealer) return res.status(404).json({ msg: "Dealer not found" });
    res.json(dealer);
  } catch (err) {
    console.error("Error updating dealer profile:", err);
    res.status(500).json({ msg: "Error updating profile" });
  }
};

// ===========================
// VEHICLE MANAGEMENT
// ===========================

// Add Vehicle
exports.addVehicle = async (req, res) => {
  try {
    const dealer = await User.findOne({ email: req.params.email, role: "dealer" });
    if (!dealer) return res.status(404).json({ msg: "Dealer not found" });

    const { vehicleId, vehicleType, temperatureCapacity } = req.body;

    if (!vehicleId || !vehicleType || !temperatureCapacity) {
      return res.status(400).json({ msg: "All vehicle fields are required" });
    }

    const existingVehicle = dealer.vehicles?.find(v => v.vehicleId === vehicleId);
    if (existingVehicle) {
      return res.status(400).json({ msg: "Vehicle ID already exists" });
    }

    const newVehicle = {
      vehicleId,
      vehicleType,
      temperatureCapacity,
      currentStatus: 'AVAILABLE',
      dateAdded: new Date()
    };

    if (!Array.isArray(dealer.vehicles)) dealer.vehicles = [];
    dealer.vehicles.push(newVehicle);
    await dealer.save();

    res.json({ 
      msg: "Vehicle added successfully", 
      vehicle: newVehicle 
    });
    
  } catch (err) {
    console.error("Error adding vehicle:", err);
    res.status(500).json({ msg: "Error adding vehicle" });
  }
};

// Get All Vehicles for a Dealer
exports.getVehicles = async (req, res) => {
  try {
    const dealer = await User.findOne({ email: req.params.email, role: "dealer" });
    if (!dealer) return res.status(404).json({ msg: "Dealer not found" });

    const vehicles = dealer.vehicles || [];
    vehicles.sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0));
    
    res.json(vehicles);
  } catch (err) {
    console.error("Error fetching vehicles:", err);
    res.status(500).json({ msg: "Error fetching vehicles" });
  }
};

// Update Vehicle Status
exports.updateVehicleStatus = async (req, res) => {
  try {
    const { email, vehicleId } = req.params;
    const { currentStatus } = req.body;

    const dealer = await User.findOne({ email, role: "dealer" });
    if (!dealer) return res.status(404).json({ msg: "Dealer not found" });

    const vehicle = dealer.vehicles.id(vehicleId);
    if (!vehicle) return res.status(404).json({ msg: "Vehicle not found" });

    vehicle.currentStatus = currentStatus;
    
    if (currentStatus === 'AVAILABLE') {
      vehicle.assignedTo = undefined;
    }
    
    await dealer.save();

    res.json({ 
      msg: "Vehicle status updated successfully",
      vehicle 
    });
    
  } catch (err) {
    console.error("Error updating vehicle status:", err);
    res.status(500).json({ msg: "Error updating vehicle status" });
  }
};

// Delete Vehicle
exports.deleteVehicle = async (req, res) => {
  try {
    const { email, vehicleId } = req.params;

    const dealer = await User.findOne({ email, role: "dealer" });
    if (!dealer) {
      return res.status(404).json({ msg: "Dealer not found" });
    }

    const vehicleIndex = dealer.vehicles?.findIndex(v => v._id?.toString() === vehicleId?.toString());
    if (vehicleIndex === -1 || vehicleIndex === undefined) {
      return res.status(404).json({ msg: "Vehicle not found" });
    }

    const vehicle = dealer.vehicles[vehicleIndex];

    if (vehicle.currentStatus === 'ASSIGNED') {
      return res.status(400).json({ msg: "Cannot delete assigned vehicle. Free it first." });
    }

    dealer.vehicles.splice(vehicleIndex, 1);
    await dealer.save();

    res.json({ msg: "Vehicle deleted successfully" });

  } catch (err) {
    console.error("Error deleting vehicle:", err);
    res.status(500).json({ msg: "Error deleting vehicle" });
  }
};

// ===========================
// PRODUCT BROWSING
// ===========================

// Get All Available Products from All Farmers
exports.getAllProducts = async (req, res) => {
  try {
    const farmers = await User.find({ 
      role: "farmer", 
      crops: { $exists: true, $not: { $size: 0 } }
    });

    let allProducts = [];

    farmers.forEach(farmer => {
      if (farmer.crops && farmer.crops.length > 0) {
        farmer.crops.forEach(crop => {
          allProducts.push({
            _id: crop._id,
            ...crop.toObject(),
            farmerEmail: farmer.email,
            farmerName: `${farmer.firstName} ${farmer.lastName || ''}`.trim(),
            farmerMobile: farmer.mobile,
            farmerLocation: farmer.farmLocation
          });
        });
      }
    });

    allProducts.sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0));

    res.json(allProducts);
  } catch (err) {
    console.error("Error fetching all products:", err);
    res.status(500).json({ msg: "Error fetching products" });
  }
};

// ===========================
// VEHICLE ASSIGNMENT
// ===========================

// Assign Vehicle to Product
exports.assignVehicle = async (req, res) => {
  try {
    console.log("=== VEHICLE ASSIGNMENT START ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    
    const { dealerEmail, productId, vehicleId, quantity, farmerEmail, tentativeDate } = req.body;

    if (!dealerEmail || !productId || !vehicleId || !quantity || !farmerEmail || !tentativeDate) {
      console.log("Missing required fields");
      return res.status(400).json({ msg: "All fields are required" });
    }

    const dealer = await User.findOne({ email: dealerEmail, role: "dealer" });
    if (!dealer) {
      return res.status(404).json({ msg: "Dealer not found" });
    }

    const vehicleIndex = dealer.vehicles?.findIndex(v => v._id?.toString() === vehicleId?.toString());
    if (vehicleIndex === -1 || vehicleIndex === undefined) {
      return res.status(404).json({ msg: "Vehicle not found" });
    }
    
    const vehicle = dealer.vehicles[vehicleIndex];
    if (vehicle.currentStatus !== 'AVAILABLE') {
      return res.status(400).json({ msg: "Vehicle is not available" });
    }

    const farmer = await User.findOne({ email: farmerEmail, role: "farmer" });
    if (!farmer) {
      return res.status(404).json({ msg: "Farmer not found" });
    }

    const productIndex = farmer.crops?.findIndex(c => c._id?.toString() === productId?.toString());
    if (productIndex === -1 || productIndex === undefined) {
      return res.status(404).json({ msg: "Product not found" });
    }
    
    const product = farmer.crops[productIndex];
    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }

    if (parseFloat(quantity) > parseFloat(product.harvestQuantity)) {
      return res.status(400).json({ msg: "Requested quantity exceeds available stock" });
    }

    farmer.crops[productIndex].availabilityStatus = 'Inspection Initiated';
    
    if (!farmer.notifications) farmer.notifications = [];
    farmer.notifications.push({
      title: "Vehicle Assigned for Delivery",
      message: `A ${vehicle.vehicleType} (${vehicle.vehicleId}) has been assigned by dealer ${dealer.businessName || dealer.firstName}. Expected arrival: ${tentativeDate}`,
      dealerDetails: {
        name: `${dealer.firstName} ${dealer.lastName || ""}`,
        email: dealer.email,
        businessName: dealer.businessName,
        mobile: dealer.mobile,
        address: dealer.warehouseAddress
      },
      productDetails: {
        name: product.varietySpecies,
        quantity,
        price: product.targetPrice
      },
      createdAt: new Date()
    });
    await farmer.save();

    dealer.vehicles[vehicleIndex].currentStatus = 'ASSIGNED';
    dealer.vehicles[vehicleIndex].assignedTo = {
      productId: productId?.toString(),
      productName: product.varietySpecies,
      farmerEmail: farmerEmail,
      farmerName: `${farmer.firstName} ${farmer.lastName || ''}`.trim(),
      quantity: parseFloat(quantity),
      assignedDate: new Date()
    };
    await dealer.save();

    const orderData = {
      dealerEmail: dealerEmail,
      farmerEmail: farmerEmail,
      productId: productId?.toString(),
      vehicleId: vehicleId?.toString(),
      quantity: parseFloat(quantity),
      totalAmount: parseFloat(quantity) * parseFloat(product.targetPrice),
      originalPrice: parseFloat(product.targetPrice),
      status: 'Vehicle Assigned',
      assignedDate: new Date(),
      tentativeDate: tentativeDate
    };
    
    const newOrder = new Order(orderData);
    await newOrder.save();

    console.log("=== ASSIGNMENT SUCCESSFUL ===");
    res.json({ 
      msg: "Vehicle assigned successfully",
      orderId: newOrder._id,
      success: true
    });

  } catch (err) {
    console.error("=== ASSIGNMENT ERROR ===");
    console.error("Error:", err);
    
    res.status(500).json({ 
      msg: "Internal server error during vehicle assignment",
      error: err.message,
      success: false
    });
  }
};

// Free Vehicle (make it available again)
exports.freeVehicle = async (req, res) => {
  try {
    const { email, vehicleId } = req.params;

    const dealer = await User.findOne({ email, role: "dealer" });
    if (!dealer) {
      return res.status(404).json({ msg: "Dealer not found" });
    }

    const vehicleIndex = dealer.vehicles?.findIndex(v => v._id?.toString() === vehicleId?.toString());
    if (vehicleIndex === -1 || vehicleIndex === undefined) {
      return res.status(404).json({ msg: "Vehicle not found" });
    }

    const vehicle = dealer.vehicles[vehicleIndex];

    if (vehicle.currentStatus === 'AVAILABLE') {
      return res.status(400).json({ msg: "Vehicle is already available" });
    }

    // Update vehicle status to available
    dealer.vehicles[vehicleIndex].currentStatus = 'AVAILABLE';
    dealer.vehicles[vehicleIndex].assignedTo = undefined;
    await dealer.save();

    // If there was an assigned order, update it
    if (vehicle.assignedTo?.productId) {
      const order = await Order.findOne({
        dealerEmail: email,
        productId: vehicle.assignedTo.productId,
        status: { $in: ['Vehicle Assigned', 'Bid Placed'] }
      });

      if (order) {
        // Update order status
        order.status = 'Cancelled';
        await order.save();

        // Make product available again
        const farmer = await User.findOne({ email: order.farmerEmail, role: "farmer" });
        if (farmer && farmer.crops) {
          const productIndex = farmer.crops.findIndex(c => c._id.toString() === order.productId.toString());
          if (productIndex !== -1) {
            farmer.crops[productIndex].availabilityStatus = 'Available';
            await farmer.save();
          }
        }

        // Notify farmer
        if (!farmer.notifications) farmer.notifications = [];
        farmer.notifications.push({
          title: "Vehicle Assignment Cancelled",
          message: `Dealer has cancelled the vehicle assignment for your ${vehicle.assignedTo.productName}.`,
          createdAt: new Date()
        });
        await farmer.save();
      }
    }

    res.json({ 
      msg: "Vehicle freed successfully",
      vehicle: dealer.vehicles[vehicleIndex]
    });

  } catch (err) {
    console.error("Error freeing vehicle:", err);
    res.status(500).json({ msg: "Error freeing vehicle" });
  }
};

// ===========================
// BIDDING SYSTEM
// ===========================

// Place Bid on Order
exports.placeBid = async (req, res) => {
  try {
    console.log("=== PLACE BID START ===");
    console.log("Request body:", req.body);
    
    const { orderId, bidPrice } = req.body;

    if (!orderId || !bidPrice) {
      console.log("Missing required fields");
      return res.status(400).json({ msg: "Order ID and bid price are required" });
    }

    console.log("Finding order:", orderId);
    const order = await Order.findById(orderId);
    if (!order) {
      console.log("Order not found");
      return res.status(404).json({ msg: "Order not found" });
    }

    console.log("Order found:", order._id);

    // Validate bid price
    if (parseFloat(bidPrice) <= 0) {
      console.log("Invalid bid price");
      return res.status(400).json({ msg: "Bid price must be greater than 0" });
    }

    // Update order with bid information
    order.bidPrice = parseFloat(bidPrice);
    order.bidStatus = 'Pending';
    order.bidDate = new Date();
    order.status = 'Bid Placed';
    order.totalAmount = parseFloat(bidPrice) * order.quantity;
    
    console.log("Saving order with bid...");
    await order.save();
    console.log("Order saved successfully");

    // Notify farmer about the bid
    console.log("Notifying farmer:", order.farmerEmail);
    const farmer = await User.findOne({ email: order.farmerEmail, role: "farmer" });
    if (farmer) {
      if (!farmer.notifications) farmer.notifications = [];
      farmer.notifications.push({
        title: "New Bid Received",
        message: `Dealer has placed a bid of ₹${bidPrice} per unit for your product (Order ID: ${orderId.substring(0, 8)})`,
        dealerDetails: {
          email: order.dealerEmail
        },
        productDetails: {
          quantity: order.quantity
        },
        createdAt: new Date()
      });
      await farmer.save();
      console.log("Farmer notified");
    }

    console.log("=== BID PLACED SUCCESSFULLY ===");
    res.json({ 
      msg: "Bid placed successfully",
      order,
      success: true
    });

  } catch (err) {
    console.error("=== BID PLACEMENT ERROR ===");
    console.error("Error:", err);
    console.error("Stack:", err.stack);
    res.status(500).json({ 
      msg: "Error placing bid",
      error: err.message 
    });
  }
};

// ===========================
// ORDER MANAGEMENT
// ===========================

// Get All Orders for a Dealer
exports.getDealerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ dealerEmail: req.params.email })
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
          farmerDetails: {
            firstName: farmer.firstName,
            lastName: farmer.lastName,
            mobile: farmer.mobile
          },
          productDetails: product
        });
      }
    }

    res.json(populatedOrders);
  } catch (err) {
    console.error("Error fetching dealer orders:", err);
    res.status(500).json({ msg: "Error fetching orders" });
  }
};

// ===========================
// PRODUCT REVIEW
// ===========================

// Submit Product Review
exports.submitReview = async (req, res) => {
  try {
    const { productId, dealerEmail, quality, comments, rating } = req.body;

    if (!productId || !dealerEmail || !quality || !comments || !rating) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ msg: "Rating must be between 1 and 5" });
    }

    const farmer = await User.findOne({ 
      role: "farmer",
      "crops._id": productId 
    });

    if (!farmer) {
      return res.status(404).json({ msg: "Product not found" });
    }

    const productIndex = farmer.crops.findIndex(c => c._id.toString() === productId.toString());
    
    if (productIndex === -1) {
      return res.status(404).json({ msg: "Product not found" });
    }

    if (!farmer.crops[productIndex].reviews) {
      farmer.crops[productIndex].reviews = [];
    }

    const newReview = {
      dealerEmail,
      quality,
      comments,
      rating: parseInt(rating),
      date: new Date()
    };

    farmer.crops[productIndex].reviews.push(newReview);
    await farmer.save();

    res.json({ 
      msg: "Review submitted successfully",
      review: newReview
    });

  } catch (err) {
    console.error("Error submitting review:", err);
    res.status(500).json({ msg: "Error submitting review" });
  }
};