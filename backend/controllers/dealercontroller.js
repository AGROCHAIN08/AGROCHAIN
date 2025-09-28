const User = require("../models/user");
const Order = require("../models/order");

// ---------------- Get Dealer Profile ----------------
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

// ---------------- Update Dealer Profile ----------------
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

// ---------------- Add Vehicle ----------------
exports.addVehicle = async (req, res) => {
  try {
    const dealer = await User.findOne({ email: req.params.email, role: "dealer" });
    if (!dealer) return res.status(404).json({ msg: "Dealer not found" });

    const { vehicleId, vehicleType, temperatureCapacity } = req.body;

    // Validate required fields
    if (!vehicleId || !vehicleType || !temperatureCapacity) {
      return res.status(400).json({ msg: "All vehicle fields are required" });
    }

    // Check if vehicle ID already exists
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

// ---------------- Get Vehicles ----------------
exports.getVehicles = async (req, res) => {
  try {
    const dealer = await User.findOne({ email: req.params.email, role: "dealer" });
    if (!dealer) return res.status(404).json({ msg: "Dealer not found" });

    // Return vehicles sorted by date (newest first)
    const vehicles = dealer.vehicles || [];
    vehicles.sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0));
    
    res.json(vehicles);
  } catch (err) {
    console.error("Error fetching vehicles:", err);
    res.status(500).json({ msg: "Error fetching vehicles" });
  }
};

// ---------------- Get All Available Products ----------------
exports.getAllProducts = async (req, res) => {
  try {
    // Find all farmers with crops
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

    // Sort by date added (newest first)
    allProducts.sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0));

    res.json(allProducts);
  } catch (err) {
    console.error("Error fetching all products:", err);
    res.status(500).json({ msg: "Error fetching products" });
  }
};

// ---------------- Assign Vehicle to Product ----------------
exports.assignVehicle = async (req, res) => {
  try {
    const { dealerEmail, productId, vehicleId, quantity, farmerEmail } = req.body;

    // Validate input
    if (!dealerEmail || !productId || !vehicleId || !quantity || !farmerEmail) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    // Find dealer and vehicle
    const dealer = await User.findOne({ email: dealerEmail, role: "dealer" });
    if (!dealer) return res.status(404).json({ msg: "Dealer not found" });

    const vehicle = dealer.vehicles.id(vehicleId);
    if (!vehicle) return res.status(404).json({ msg: "Vehicle not found" });

    if (vehicle.currentStatus !== 'AVAILABLE') {
      return res.status(400).json({ msg: "Vehicle is not available" });
    }

    // Find farmer and product
    const farmer = await User.findOne({ email: farmerEmail, role: "farmer" });
    if (!farmer) return res.status(404).json({ msg: "Farmer not found" });

    const product = farmer.crops.id(productId);
    if (!product) return res.status(404).json({ msg: "Product not found" });

    if (product.availabilityStatus !== 'Available') {
      return res.status(400).json({ msg: "Product is not available" });
    }

    if (quantity > product.harvestQuantity) {
      return res.status(400).json({ msg: "Requested quantity exceeds available stock" });
    }

    // Update product status
    product.availabilityStatus = 'Inspection Initiated';
    await farmer.save();

    // Update vehicle status
    vehicle.currentStatus = 'ASSIGNED';
    vehicle.assignedTo = {
      productId: productId,
      productName: product.varietySpecies,
      farmerEmail: farmerEmail,
      farmerName: `${farmer.firstName} ${farmer.lastName || ''}`.trim(),
      quantity: quantity,
      assignedDate: new Date()
    };
    await dealer.save();

    // Create order record
    const newOrder = new Order({
      dealerEmail,
      farmerEmail,
      productId,
      vehicleId,
      quantity,
      totalAmount: quantity * product.targetPrice,
      status: 'Vehicle Assigned',
      assignedDate: new Date()
    });
    await newOrder.save();

    res.json({ 
      msg: "Vehicle assigned successfully",
      orderId: newOrder._id
    });
    
  } catch (err) {
    console.error("Error assigning vehicle:", err);
    res.status(500).json({ msg: "Error assigning vehicle" });
  }
};

// ---------------- Get Dealer Orders ----------------
exports.getDealerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ dealerEmail: req.params.email })
      .sort({ assignedDate: -1 });

    // Populate order details
    const populatedOrders = [];
    
    for (let order of orders) {
      // Get dealer details
      const dealer = await User.findOne({ email: order.dealerEmail, role: "dealer" });
      const vehicle = dealer?.vehicles.id(order.vehicleId);

      // Get farmer details
      const farmer = await User.findOne({ email: order.farmerEmail, role: "farmer" });
      const product = farmer?.crops.id(order.productId);

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

// ---------------- Update Vehicle Status ----------------
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

// ---------------- Delete Vehicle ----------------
exports.deleteVehicle = async (req, res) => {
  try {
    const { email, vehicleId } = req.params;

    const dealer = await User.findOne({ email, role: "dealer" });
    if (!dealer) return res.status(404).json({ msg: "Dealer not found" });

    const vehicle = dealer.vehicles.id(vehicleId);
    if (!vehicle) return res.status(404).json({ msg: "Vehicle not found" });

    if (vehicle.currentStatus === 'ASSIGNED') {
      return res.status(400).json({ msg: "Cannot delete assigned vehicle" });
    }

    dealer.vehicles.pull(vehicleId);
    await dealer.save();

    res.json({ msg: "Vehicle deleted successfully" });
    
  } catch (err) {
    console.error("Error deleting vehicle:", err);
    res.status(500).json({ msg: "Error deleting vehicle" });
  }
};