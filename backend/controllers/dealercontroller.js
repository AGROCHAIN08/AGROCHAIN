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

// ---------------- Assign Vehicle to Product (FIXED) ----------------
// ---------------- Simplified and Robust Assign Vehicle Function ----------------
exports.assignVehicle = async (req, res) => {
  try {
    console.log("=== VEHICLE ASSIGNMENT START ===");
    console.log("Raw request body:", JSON.stringify(req.body, null, 2));
    
    const { dealerEmail, productId, vehicleId, quantity, farmerEmail } = req.body;

    // Basic validation
    if (!dealerEmail || !productId || !vehicleId || !quantity || !farmerEmail) {
      console.log("Missing required fields");
      return res.status(400).json({ msg: "All fields are required" });
    }

    console.log("1. Finding dealer...");
    const dealer = await User.findOne({ email: dealerEmail, role: "dealer" });
    if (!dealer) {
      console.log("Dealer not found");
      return res.status(404).json({ msg: "Dealer not found" });
    }
    console.log("✓ Dealer found");

    console.log("2. Finding vehicle...");
    console.log("Looking for vehicle ID:", vehicleId);
    console.log("Available vehicles:", dealer.vehicles?.map(v => ({ id: v._id?.toString(), vehicleId: v.vehicleId })));
    
    const vehicleIndex = dealer.vehicles?.findIndex(v => v._id?.toString() === vehicleId?.toString());
    if (vehicleIndex === -1 || vehicleIndex === undefined) {
      console.log("Vehicle not found");
      return res.status(404).json({ msg: "Vehicle not found" });
    }
    
    const vehicle = dealer.vehicles[vehicleIndex];
    if (vehicle.currentStatus !== 'AVAILABLE') {
      console.log("Vehicle not available, status:", vehicle.currentStatus);
      return res.status(400).json({ msg: "Vehicle is not available" });
    }
    console.log("✓ Vehicle found and available");

    console.log("3. Finding farmer...");
    const farmer = await User.findOne({ email: farmerEmail, role: "farmer" });
    if (!farmer) {
      console.log("Farmer not found");
      return res.status(404).json({ msg: "Farmer not found" });
    }
    console.log("✓ Farmer found");

    console.log("4. Finding product...");
    console.log("Looking for product ID:", productId);
    console.log("Available products:", farmer.crops?.map(c => ({ id: c._id?.toString(), name: c.varietySpecies })));
    
    const productIndex = farmer.crops?.findIndex(c => c._id?.toString() === productId?.toString());
    if (productIndex === -1 || productIndex === undefined) {
      console.log("Product not found");
      return res.status(404).json({ msg: "Product not found" });
    }
    
    const product = farmer.crops[productIndex];
    if (product.availabilityStatus !== 'Available') {
      console.log("Product not available, status:", product.availabilityStatus);
      return res.status(400).json({ msg: "Product is not available" });
    }

    if (parseFloat(quantity) > parseFloat(product.harvestQuantity)) {
      console.log("Insufficient quantity");
      return res.status(400).json({ msg: "Requested quantity exceeds available stock" });
    }
    console.log("✓ Product found and available");

    console.log("5. Updating product status...");
    farmer.crops[productIndex].availabilityStatus = 'Inspection Initiated';
    await farmer.save();
    console.log("✓ Product status updated");

    console.log("6. Updating vehicle status...");
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
    console.log("✓ Vehicle status updated");

    console.log("7. Creating order...");
    const orderData = {
      dealerEmail: dealerEmail,
      farmerEmail: farmerEmail,
      productId: productId?.toString(),
      vehicleId: vehicleId?.toString(),
      quantity: parseFloat(quantity),
      totalAmount: parseFloat(quantity) * parseFloat(product.targetPrice),
      status: 'Vehicle Assigned',
      assignedDate: new Date()
    };
    
    console.log("Order data:", orderData);
    
    const newOrder = new Order(orderData);
    await newOrder.save();
    console.log("✓ Order created:", newOrder._id);

    console.log("=== ASSIGNMENT SUCCESSFUL ===");
    res.json({ 
      msg: "Vehicle assigned successfully",
      orderId: newOrder._id,
      success: true
    });

  } catch (err) {
    console.error("=== ASSIGNMENT ERROR ===");
    console.error("Error:", err);
    console.error("Stack:", err.stack);
    
    res.status(500).json({ 
      msg: "Internal server error during vehicle assignment",
      error: err.message,
      success: false
    });
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

      // Get farmer details and find product
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