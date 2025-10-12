const User = require("../models/user");
const Order = require("../models/order");
const RetailerOrder = require("../models/retailerOrder");
const Log = require("../models/log");

/* ===============================
   1. ENHANCED SYSTEM ANALYTICS
   =============================== */
exports.getStats = async (req, res) => {
  try {
    // Count users by role
    const farmers = await User.countDocuments({ role: "farmer" });
    const dealers = await User.countDocuments({ role: "dealer" });
    const retailers = await User.countDocuments({ role: "retailer" });

    // Compute total products from farmer crops
    const allFarmers = await User.find({ role: "farmer" });
    let totalProducts = 0;
    allFarmers.forEach(f => {
      if (Array.isArray(f.crops)) totalProducts += f.crops.length;
    });

    // Compute orders and revenue
    let orders = 0;
    let totalAmount = 0;
    
    try {
      // Count both Order and RetailerOrder
      const farmerDealerOrders = await Order.countDocuments();
      const dealerRetailerOrders = await RetailerOrder.countDocuments();
      orders = farmerDealerOrders + dealerRetailerOrders;
      
      // Calculate total transaction amount
      const orderSum = await Order.aggregate([
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]);
      
      const retailerOrderSum = await RetailerOrder.aggregate([
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]);
      
      totalAmount = (orderSum[0]?.total || 0) + (retailerOrderSum[0]?.total || 0);
    } catch (err) {
      console.error("Error calculating orders:", err);
      orders = 0;
      totalAmount = 0;
    }

    // Additional analytics
    const activeUsers = farmers + dealers + retailers;
    
    // Get pending orders (orders with Pending bid status or vehicle assigned)
    let pendingOrders = 0;
    try {
      pendingOrders = await Order.countDocuments({ 
        status: { $in: ['Vehicle Assigned', 'Bid Placed'] } 
      });
      
      const pendingRetailerOrders = await RetailerOrder.countDocuments({
        'paymentDetails.status': 'Pending'
      });
      
      pendingOrders += pendingRetailerOrders;
    } catch (err) {
      console.error("Error counting pending orders:", err);
    }

    // Get completed orders
    let completedOrders = 0;
    try {
      completedOrders = await Order.countDocuments({ status: 'Bid Accepted' });
      const completedRetailerOrders = await RetailerOrder.countDocuments({
        'paymentDetails.status': 'Completed'
      });
      completedOrders += completedRetailerOrders;
    } catch (err) {
      console.error("Error counting completed orders:", err);
    }

    // Monthly revenue data (last 6 months)
    const monthlyRevenue = await getMonthlyRevenue();
    
    // Orders by status
    const ordersByStatus = await getOrdersByStatus();
    
    // Top products by category
    const topProducts = await getTopProducts(allFarmers);

    res.json({
      farmers,
      dealers,
      retailers,
      products: totalProducts,
      orders,
      totalAmount,
      activeUsers,
      pendingOrders,
      completedOrders,
      monthlyRevenue,
      ordersByStatus,
      topProducts
    });
  } catch (err) {
    console.error("Error fetching analytics:", err);
    res.status(500).json({ msg: "Error fetching analytics" });
  }
};

// Helper function to get monthly revenue
async function getMonthlyRevenue() {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyData = await Order.aggregate([
      {
        $match: {
          assignedDate: { $gte: sixMonthsAgo },
          status: 'Bid Accepted'
        }
      },
      {
        $group: {
          _id: { 
            year: { $year: "$assignedDate" },
            month: { $month: "$assignedDate" }
          },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    
    const retailerMonthlyData = await RetailerOrder.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          'paymentDetails.status': 'Completed'
        }
      },
      {
        $group: {
          _id: { 
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    
    // Combine and format data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const combined = {};
    
    monthlyData.forEach(item => {
      const key = `${item._id.year}-${item._id.month}`;
      combined[key] = (combined[key] || 0) + item.revenue;
    });
    
    retailerMonthlyData.forEach(item => {
      const key = `${item._id.year}-${item._id.month}`;
      combined[key] = (combined[key] || 0) + item.revenue;
    });
    
    return Object.keys(combined).map(key => {
      const [year, month] = key.split('-');
      return {
        month: months[parseInt(month) - 1],
        revenue: combined[key]
      };
    });
  } catch (err) {
    console.error("Error getting monthly revenue:", err);
    return [];
  }
}

// Helper function to get orders by status
async function getOrdersByStatus() {
  try {
    const statusCounts = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    return statusCounts.map(item => ({
      name: item._id,
      count: item.count
    }));
  } catch (err) {
    console.error("Error getting orders by status:", err);
    return [];
  }
}

// Helper function to get top products
function getTopProducts(farmers) {
  const productCategories = {};
  
  farmers.forEach(farmer => {
    if (farmer.crops && Array.isArray(farmer.crops)) {
      farmer.crops.forEach(crop => {
        const category = crop.productType;
        productCategories[category] = (productCategories[category] || 0) + 1;
      });
    }
  });
  
  return Object.entries(productCategories)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

/* ===============================
   2. CORE MONITORING & CONTROL
   =============================== */

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find(
      {},
      "firstName lastName email role mobile isActive"
    ).sort({ role: 1, createdAt: -1 });
    
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ msg: "Error fetching users" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    
    // Log the deletion
    await createLog(user.email, "deleteUser", `Admin deleted user: ${user.email}`);
    
    res.json({ msg: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ msg: "Error deleting user" });
  }
};

exports.deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    
    // Toggle active status
    user.isActive = user.isActive === false ? true : false;
    await user.save();
    
    // Log the action
    const action = user.isActive ? "activated" : "deactivated";
    await createLog(user.email, "updateProfile", `Admin ${action} user: ${user.email}`);
    
    res.json({ 
      msg: `User ${action} successfully`,
      isActive: user.isActive
    });
  } catch (err) {
    console.error("Error updating user status:", err);
    res.status(500).json({ msg: "Error updating user status" });
  }
};

/* ===============================
   3. ACTIVITY LOGS
   =============================== */
exports.getLogs = async (req, res) => {
  try {
    const { user, date, action } = req.query;
    const query = {};
    
    if (user) {
      query.userEmail = { $regex: new RegExp(user, "i") };
    }
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.timestamp = { $gte: startDate, $lt: endDate };
    }
    
    if (action) {
      query.actionType = action;
    }

    const logs = await Log.find(query)
      .sort({ timestamp: -1 })
      .limit(500);
    
    res.json(logs);
  } catch (err) {
    console.error("Error fetching logs:", err);
    res.status(500).json({ msg: "Error fetching activity logs" });
  }
};

// Helper to create new logs (exported for use in other controllers)
async function createLog(userEmail, actionType, details) {
  try {
    const log = new Log({ 
      userEmail, 
      actionType, 
      details, 
      timestamp: new Date() 
    });
    await log.save();
  } catch (err) {
    console.error("Failed to create log:", err);
  }
}

exports.createLog = createLog;

/* ===============================
   4. ADDITIONAL ANALYTICS ENDPOINTS
   =============================== */

// Get user growth over time
exports.getUserGrowth = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const growth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: { 
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            role: "$role"
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    
    res.json(growth);
  } catch (err) {
    console.error("Error fetching user growth:", err);
    res.status(500).json({ msg: "Error fetching user growth" });
  }
};

// Get platform activity summary
exports.getActivitySummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayLogs = await Log.countDocuments({
      timestamp: { $gte: today }
    });
    
    const todayOrders = await Order.countDocuments({
      assignedDate: { $gte: today }
    });
    
    const todayRetailerOrders = await RetailerOrder.countDocuments({
      createdAt: { $gte: today }
    });
    
    const activeUsersToday = await Log.distinct('userEmail', {
      timestamp: { $gte: today }
    });
    
    res.json({
      todayLogs,
      todayOrders: todayOrders + todayRetailerOrders,
      activeUsersToday: activeUsersToday.length
    });
  } catch (err) {
    console.error("Error fetching activity summary:", err);
    res.status(500).json({ msg: "Error fetching activity summary" });
  }
};

module.exports = exports;