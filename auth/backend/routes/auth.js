const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const { handleAuth } = require("../controllers/authController");

// POST /api/auth
router.post("/", verifyToken, handleAuth);

module.exports = router;