const express = require("express");
const cors = require("cors");

const app = express();

// ✅ Allow frontend running on Live Server (port 5500)
app.use(cors({
  origin: "http://127.0.0.1:5500",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));

module.exports = app;
