const User = require("../models/user");

// Get user profile by UID
exports.getUserProfile = async (req, res) => {
  try {
    const { uid } = req.params;

    const user = await User.findOne({ uid }).select("-__v");
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Calculate global rank by counting users with more XP
    const usersWithMoreXP = await User.countDocuments({ xpEarned: { $gt: user.xpEarned } });
    const globalRank = usersWithMoreXP + 1;

    // Calculate tier based on XP
    const tier = getTier(user.xpEarned);
    const league = getLeague(user.xpEarned);

    // Format the response
    const profileData = {
      uid: user.uid,
      name: user.name || user.username || user.email,
      email: user.email,
      photoURL: user.picture || user.avatar,
      xpEarned: user.xpEarned || 0,
      battlesWon: user.battlesWon || 0,
      battlesLost: user.battlesLost || 0,
      docsRead: user.docsRead || 0,
      tier: tier,
      league: league,
      globalRank: globalRank,
      currentRank: `#${globalRank.toLocaleString()}`,
      friendsCount: user.friends.length || 0,
      createdAt: user.createdAt,
    };

    res.json(profileData);
  } catch (err) {
    console.error("Get user profile error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Update user stats (for battles, docs read, etc.)
exports.updateUserStats = async (req, res) => {
  try {
    const { uid } = req.params;
    const { xpEarned, battlesWon, battlesLost, docsRead } = req.body;

    const updateData = {};
    if (xpEarned !== undefined) updateData.xpEarned = xpEarned;
    if (battlesWon !== undefined) updateData.battlesWon = battlesWon;
    if (battlesLost !== undefined) updateData.battlesLost = battlesLost;
    if (docsRead !== undefined) updateData.docsRead = docsRead;

    const user = await User.findOneAndUpdate(
      { uid },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User stats updated", user });
  } catch (err) {
    console.error("Update user stats error:", err);
    res.status(500).json({ error: err.message });
  }
};

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

// Export all functions
module.exports = {
  getUserProfile: exports.getUserProfile,
  updateUserStats: exports.updateUserStats,
  getLeague,
  getTier,
};
