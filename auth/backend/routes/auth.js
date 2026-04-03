const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");

// 🔐 Protected route
router.post("/", verifyToken, (req, res) => {
  const user = req.user;

  console.log("✅ User verified:", user);

  res.json({
    message: "Authentication successful",
    user: {
      uid: user.uid,
      email: user.email,
      name: user.name,
    },
  });
});

module.exports = router;