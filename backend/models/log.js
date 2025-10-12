const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  actionType: {
    type: String,
    enum: ["login", "addProduct", "orderPlaced", "updateProfile", "deleteUser", "other"],
  },
  details: { type: String },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Log", logSchema);
