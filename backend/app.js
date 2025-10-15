const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables first
dotenv.config();

const app = express();

// ✅ Updated CORS configuration to allow Vercel + Render + Localhost
const allowedOrigins = [
  "https://agrochain-teal.vercel.app",
  "https://agrochain-i1h0.onrender.com",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5000",
  "http://127.0.0.1:5000",
  "http://localhost:5500",
  "http://127.0.0.1:5500"
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.log(`❌ Blocked by CORS: ${origin}`);
    return callback(new Error("CORS policy does not allow this origin."), false);
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));


app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/farmer", require("./routes/farmer"));
app.use("/api/dealer", require("./routes/dealer"));
app.use("/api/retailer", require("./routes/retailer"));
app.use("/api/admin", require("./routes/admin"));


// Health check route
app.get("/", (req, res) => {
  res.json({ 
    message: "AgroChain API is running", 
    version: "1.0.0",
    endpoints: {
      "POST /api/auth/send-otp": "Send email OTP",
      "POST /api/auth/verify-otp": "Verify email OTP", 
      "POST /api/auth/verify-google": "Verify Google token",
      "POST /api/auth/signup": "Regular signup with email OTP",
      "POST /api/auth/signup-google": "Signup with Google OAuth"
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ msg: "Something went wrong!" });
});

// 404 handler - catch all unmatched routes
app.use((req, res) => {
  res.status(404).json({ 
    msg: "API endpoint not found", 
    path: req.path,
    method: req.method 
  });
});

module.exports = app;