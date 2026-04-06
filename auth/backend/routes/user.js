const express = require("express");
const router = express.Router();
const {
  getUserProfile,
  updateUserStats,
} = require("../controllers/userController");

// Get user profile by UID
router.get("/profile/:uid", getUserProfile);

// Update user stats
router.put("/stats/:uid", updateUserStats);

module.exports = router;