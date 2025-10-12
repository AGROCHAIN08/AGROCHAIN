const express = require("express");
const router = express.Router();
const {
  getStats,
  getUsers,
  deleteUser,
  deactivateUser,
  getLogs,
} = require("../controllers/admincontroller");

// ====================
// Admin routes
// ====================
router.get("/stats", getStats);
router.get("/users", getUsers);
router.delete("/users/:id", deleteUser);
router.put("/deactivate/:id", deactivateUser);
router.get("/logs", getLogs);

module.exports = router;
