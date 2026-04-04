const express = require("express");
const router = express.Router();
const Question = require("../models/question");

// GET /api/questions/random
router.get("/random", async (req, res) => {
  try {
    const count = await Question.countDocuments();
    const random = Math.floor(Math.random() * count);
    const question = await Question.findOne().skip(random);
    res.json(question);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;