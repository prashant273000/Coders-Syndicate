const express = require("express");
const router = express.Router();
const User = require("../models/user");

// Get leaderboard - top players sorted by XP (descending)
router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    // Fetch users sorted by xpEarned (descending), limited to top N
    const players = await User.find()
      .select("uid name picture xpEarned battlesWon battlesLost")
      .sort({ xpEarned: -1 })
      .limit(limit)
      .lean();

    // Format the response with calculated rank
    const formattedPlayers = players.map((user, index) => ({
      rank: index + 1,
      uid: user.uid,
      name: user.name || user.uid,
      photoURL: user.picture || "",
      xpEarned: user.xpEarned || 0,
      battlesWon: user.battlesWon || 0,
      battlesLost: user.battlesLost || 0,
      // Calculate league and tier based on XP
      league: getLeague(user.xpEarned || 0),
      tier: getTier(user.xpEarned || 0),
    }));

    res.json(formattedPlayers);
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Helper function to determine league based on XP
function getLeague(xp) {
  if (xp >= 100000) return "Grandmaster";
  if (xp >= 50000) return "Champion's League";
  if (xp >= 20000) return "Diamond Division";
  if (xp >= 10000) return "Gold League";
  if (xp >= 5000) return "Silver League";
  return "Bronze League";
}

// Helper function to determine tier based on XP
function getTier(xp) {
  if (xp >= 100000) return "Apex Tier";
  if (xp >= 50000) return "Diamond Tier";
  if (xp >= 20000) return "Platinum Tier";
  if (xp >= 10000) return "Gold Tier";
  if (xp >= 5000) return "Silver Tier";
  return "Bronze Tier";
}

module.exports = router;