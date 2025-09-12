const dotenv = require("dotenv");
const connectDB = require("./config/db");
const app = require("./app");   // ✅ use app.js config

dotenv.config();  // Load .env variables

// Connect to DB
const mongoUri = process.env.MONGO_URI;
console.log("Mongo URI:", mongoUri); // Debug
connectDB(mongoUri);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
