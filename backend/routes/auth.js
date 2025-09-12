const express = require("express");
const router = express.Router();
const { signup } = require("../controllers/authcontroller");

router.post("/signup", signup);

module.exports = router;
