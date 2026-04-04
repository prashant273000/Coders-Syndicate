//Logic of match Rooms

const Match = require("../models/match");
const User = require("../models/user");
const getLevelFromXP = require("../utils/levels");
const getTier = require("../utils/tier");
//Find Match 
const findMatch = async (req, res) => {
  try {
    const uid = req.user.uid;

    // Check if this user is already in an active match
    const existingMatch = await Match.findOne({
      players: uid,
      status: "active",
    });

    if (existingMatch) {
      return res.json({
        status: "matched",
        matchId: existingMatch._id,
        players: existingMatch.players,
      });
    }

    // Check if there's a waiting match to join
    const waitingMatch = await Match.findOne({ status: "waiting" });

    if (waitingMatch && !waitingMatch.players.includes(uid)) {
      // Join the waiting match
      waitingMatch.players.push(uid);
      waitingMatch.status = "active";
      waitingMatch.startedAt = new Date();
      await waitingMatch.save();

      return res.json({
        status: "matched",
        matchId: waitingMatch._id,
        players: waitingMatch.players,
      });
    }

    // No waiting match — create one and wait
    const newMatch = await Match.create({
      players: [uid],
      status: "waiting",
    });

    return res.json({ status: "waiting" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const endMatch = async (req, res) => {

  try {
    const { matchId, winnerId } = req.body;
    console.log("🏆 Match ended, winner:", winnerId); // ← logs AFTER
    console.log("📊 Updating user stats...")

    const match = await Match.findById(matchId);

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    match.status = "completed";
    match.winner = winnerId;
    match.endedAt = new Date();
    await match.save();

    // Update player stats
    for (let playerUid of match.players) {
      const user = await User.findOne({ uid: playerUid });
      if (!user) continue;

      if (playerUid === winnerId) {
        user.wins += 1;
        user.xp += 100;
      } else {
        user.losses += 1;
        user.xp += 20;
      }

      user.level = getLevelFromXP(user.xp);
      user.tier = getTier(user.level);
      await user.save();
    }

    res.json({ message: "Match ended" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { findMatch, endMatch };

