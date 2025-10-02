const User = require("../models/user");
const Order = require("../models/order");
const Review = require("../models/review");
const Inventory = require("../models/inventory");

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

// ---------------- Get Vehicles ----------------
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

// ---------------- Get All Available Products ----------------
exports.getAllProducts = async (req, res) => {
  try {
    const farmers = await User.find({
      role: "farmer",
      crops: { $exists: true, $not: { $size: 0 } }
    });

    const allReviews = await Review.find({}).populate('dealerId', 'firstName businessName');
    const reviewsByProduct = allReviews.reduce((acc, review) => {
        const productId = review.productId.toString();
        if (!acc[productId]) {
            acc[productId] = [];
        }
        acc[productId].push(review);
        return acc;
    }, {});

    let allProducts = [];

    farmers.forEach(farmer => {
      if (farmer.crops && farmer.crops.length > 0) {
        farmer.crops.forEach(crop => {
            const cropId = crop._id.toString();
          allProducts.push({
            _id: crop._id,
            ...crop.toObject(),
            farmerId: farmer._id,
            farmerEmail: farmer.email,
            farmerName: `${farmer.firstName} ${farmer.lastName || ''}`.trim(),
            farmerMobile: farmer.mobile,
            farmerLocation: farmer.farmLocation,
            reviews: reviewsByProduct[cropId] || []
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

// ---------------- Assign Vehicle to Product (MODIFIED for locking) ----------------
exports.assignVehicle = async (req, res) => {
  try {
    const { dealerEmail, productId, vehicleId, quantity, farmerEmail } = req.body;

    if (!dealerEmail || !productId || !vehicleId || !quantity || !farmerEmail) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const dealer = await User.findOne({ email: dealerEmail, role: "dealer" });
    if (!dealer) return res.status(404).json({ msg: "Dealer not found" });

    const vehicleIndex = dealer.vehicles?.findIndex(v => v._id?.toString() === vehicleId?.toString());
    if (vehicleIndex === -1 || vehicleIndex === undefined) {
      return res.status(404).json({ msg: "Vehicle not found" });
    }

    const vehicle = dealer.vehicles[vehicleIndex];
    if (vehicle.currentStatus !== 'AVAILABLE') {
      return res.status(400).json({ msg: "Vehicle is not available" });
    }

    const farmer = await User.findOne({ email: farmerEmail, role: "farmer" });
    if (!farmer) return res.status(404).json({ msg: "Farmer not found" });

    const productIndex = farmer.crops?.findIndex(c => c._id?.toString() === productId?.toString());
    if (productIndex === -1 || productIndex === undefined) {
      return res.status(404).json({ msg: "Product not found" });
    }

    const product = farmer.crops[productIndex];
    if (parseFloat(quantity) > parseFloat(product.harvestQuantity)) {
      return res.status(400).json({ msg: "Requested quantity exceeds available stock" });
    }

    // --- NEW LOGIC: Lock the quantity ---
    // Reduce the quantity from the farmer's product
    farmer.crops[productIndex].harvestQuantity -= parseFloat(quantity);
    
    // If the remaining quantity is zero, mark it as Out of Stock, otherwise Inspection Initiated
    if (farmer.crops[productIndex].harvestQuantity <= 0) {
        farmer.crops[productIndex].availabilityStatus = 'Out of Stock';
    } else {
        farmer.crops[productIndex].availabilityStatus = 'Inspection Initiated';
    }
    await farmer.save();
    // --- END NEW LOGIC ---

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
      status: 'Vehicle Assigned',
      assignedDate: new Date()
    };

    const newOrder = new Order(orderData);
    await newOrder.save();
    
    res.json({
      msg: "Vehicle assigned and product quantity locked for inspection.",
      orderId: newOrder._id,
      success: true
    });

  } catch (err) {
    console.error("Error assigning vehicle:", err);
    // If something fails, we should ideally revert the quantity change.
    // This requires a more complex transaction logic, but for now, we'll log the error.
    res.status(500).json({ msg: "Internal server error" });
  }
};


// ---------------- Place Bid on Product ----------------
exports.placeBid = async (req, res) => {
  try {
    const {
      orderId,
      orderedQuantity,
      bidPrice,
      totalPrice,
      deliveryDate,
      paymentMethod,
      deliveryAddress
    } = req.body;

    if (!orderId || !orderedQuantity || !bidPrice || !totalPrice || !deliveryDate || !paymentMethod || !deliveryAddress) {
      return res.status(400).json({ msg: "All fields are required to place a bid." });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: "Order not found." });
    }

    if (order.status !== 'Inspection Complete') {
        return res.status(400).json({ msg: `Cannot place bid on an order with status: ${order.status}` });
    }
    
    const numericBidPrice = parseFloat(bidPrice);
    if (isNaN(numericBidPrice)) {
        return res.status(400).json({ msg: "Invalid bid price provided." });
    }

    order.quantity = parseFloat(orderedQuantity);
    order.bidPrice = numericBidPrice;
    order.negotiatedTotalAmount = parseFloat(totalPrice);
    order.expectedDeliveryDate = new Date(deliveryDate);
    order.paymentMethod = paymentMethod;
    order.deliveryAddress = deliveryAddress;
    order.status = 'Bid Placed';
    
    order.timeline.push({
      status: 'Bid Placed',
      notes: `Dealer placed a bid of ₹${numericBidPrice.toFixed(2)} per unit.`
    });

    await order.save();

    res.json({ msg: "Bid placed successfully. Waiting for farmer approval.", order });

  } catch (err) {
    console.error("Error placing bid:", err);
    res.status(500).json({ msg: "Server error while placing bid" });
  }
};

// ---------------- Get Dealer Orders ----------------
exports.getDealerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ dealerEmail: req.params.email })
      .sort({ assignedDate: -1 });

    const populatedOrders = [];

    for (let order of orders) {
      const dealer = await User.findOne({ email: order.dealerEmail, role: "dealer" });
      const vehicle = dealer?.vehicles.id(order.vehicleId);
      const farmer = await User.findOne({ email: order.farmerEmail, role: "farmer" });
      
      // We need to find the product, even if it was modified or sold out.
      // A better approach in a larger system would be to store a snapshot of the product in the order.
      // For now, we find it, but it might not reflect the exact state at time of order.
      let product = farmer?.crops.find(crop => crop._id.toString() === order.productId.toString());
      
      // Fallback: If product is not in current crops, it means it was sold out completely.
      // We still want to show the order, so we create a placeholder product detail.
      if (farmer && !product) {
        // This is a simple fallback. A more robust solution would be needed for historical accuracy.
        const originalProduct = await User.findOne(
            { "email": order.farmerEmail, "crops._id": order.productId },
            { "crops.$": 1 }
        );
        if (originalProduct && originalProduct.crops.length > 0) {
            product = originalProduct.crops[0];
        } else {
             product = { varietySpecies: "N/A", unitOfSale: "N/A", fieldAddress: "N/A" };
        }
      }
      
      if (dealer && farmer && vehicle && product) {
        populatedOrders.push({
          ...order.toObject(),
          vehicleDetails: vehicle,
          farmerDetails: {
            _id: farmer._id,
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

// ---------------- Get Dealer Inventory ----------------
exports.getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find({ dealerEmail: req.params.email }).sort({ purchaseDate: -1 });
    res.json(inventory);
  } catch (err) {
    console.error("Error fetching inventory:", err);
    res.status(500).json({ msg: "Error fetching inventory" });
  }
};

// ---------------- Add to Dealer Inventory ----------------
exports.addInventory = async (req, res) => {
  try {
    const newInventoryItem = new Inventory({
      ...req.body,
      dealerEmail: req.params.email
    });
    await newInventoryItem.save();
    res.status(201).json({ msg: "Item added to inventory", item: newInventoryItem });
  } catch (err) {
    console.error("Error adding to inventory:", err);
    res.status(500).json({ msg: "Error adding to inventory" });
  }
};

// ---------------- Update Dealer Inventory ----------------
exports.updateInventory = async (req, res) => {
  try {
    const updatedItem = await Inventory.findByIdAndUpdate(req.params.inventoryId, req.body, { new: true });
    if (!updatedItem) return res.status(404).json({ msg: "Inventory item not found" });
    res.json({ msg: "Inventory item updated", item: updatedItem });
  } catch (err) {
    console.error("Error updating inventory:", err);
    res.status(500).json({ msg: "Error updating inventory" });
  }
};

// ---------------- Delete Dealer Inventory ----------------
exports.deleteInventory = async (req, res) => {
  try {
    const deletedItem = await Inventory.findByIdAndDelete(req.params.inventoryId);
    if (!deletedItem) return res.status(404).json({ msg: "Inventory item not found" });
    res.json({ msg: "Inventory item deleted" });
  } catch (err) {
    console.error("Error deleting inventory:", err);
    res.status(500).json({ msg: "Error deleting inventory" });
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
