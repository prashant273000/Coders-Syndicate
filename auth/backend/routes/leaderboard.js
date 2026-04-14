const express = require("express");
const router = express.Router();
const User = require("../models/user");

// GET top leaderboard users
router.get("/", async (req, res) => {
  try {
    const users = await User.find()
      .sort({ xp: -1 })
      .limit(10)
      .select("uid name picture xp tier league");

    const rankedUsers = users.map((user, index) => ({
      rank: index + 1,
      uid: user.uid,
      name: user.name,
      picture: user.picture,
      xp: user.xp,
      tier: user.tier,
      league: user.league,
    }));

    res.json(rankedUsers);
  } catch (error) {
    console.error("LEADERBOARD ERROR:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// GET current user's standing by uid
router.get("/user/:uid", async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.uid }).select(
      "uid name picture xp tier league"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const higherXpUsers = await User.countDocuments({ xp: { $gt: user.xp } });

    res.json({
      uid: user.uid,
      name: user.name,
      picture: user.picture,
      xp: user.xp,
      tier: user.tier,
      league: user.league,
      rank: higherXpUsers + 1,
    });
  } catch (error) {
    console.error("USER STANDING ERROR:", error);
    res.status(500).json({ error: "Failed to fetch user standing" });
  }
});

module.exports = router;