require('dotenv').config();
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const app = express();

console.log("MONGO_URI", process.env.MONGO_URI)
const connectDB = require("./config/db");
connectDB();

// Firebase Admin Setup
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));

// Test route (optional)
app.get("/", (req, res) => {
  res.send("Backend running ✅");
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});