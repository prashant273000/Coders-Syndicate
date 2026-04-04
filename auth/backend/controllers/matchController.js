//Logic of match Rooms

const Match = require("../models/match")
const User = require("../models/user")
const { addToQueue, getMatch } = require("../arena/queue")
const getLevelFromXP = require("../utils/levels");
const getTier = require("../utils/tier");
//Find Match 
const findMatch = async (req, res) => {
    try{
        const uid = req.user.uid;

        addToQueue(uid);

        const players = getMatch(); //Initializes the matchmaking
       
        //could not find players any then waiting...
        if(!players) {
            return res.json({status: "waiting"});
        }

        const match = await Match.create({
            players,
            status: "active",
            startedAt: new Date(),
        });

        res.json({
            status: "matched",
            matchId: match._id,
            players: match.players,
        });
    } catch (err) { 
       //Printing erro messages
        res.status(500).json({error: err.message});
    }
};

//End Mactch
const endMatch = async (req, res) => {
    try{
        const { matchId, winnerId } = req.body;

        const match = await Match.findById(matchId);

        if(!match) {
            return res.status(404).json({ error: "Match not the found"});
        }

        match.status = "completed";
        match.winner = winnerId;
        match.endedAt = new Date();

        //Save Matches
        await match.save();
         for (let player of match.players) {
        const user = await User.findOne({ uid: player });

      if (!user) continue;

      if (player === winnerId) {
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