const express = require("express");
const router = express.Router();

//Routing the things
const verifyToken = require("../middleware/verifyToken");
const { findMatch, endMatch } = require("../controllers/matchController");

router.post("/find", verifyToken, findMatch);
router.post("/end", verifyToken, endMatch);

module.exports = router;