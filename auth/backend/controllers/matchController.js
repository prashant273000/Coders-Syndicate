const Match = require("../models/Match");
const User = require("../models/user");

const generateRoomId = () => {
  return "room_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
};

exports.inviteFriendToMatch = async (req, res) => {
  try {
    const { senderUid, friendUid } = req.body;

    const sender = await User.findOne({ uid: senderUid });
    const friend = await User.findOne({ uid: friendUid });

    if (!sender || !friend) {
      return res.status(404).json({ error: "User not found" });
    }

    const isFriend = sender.friends.some(
      (id) => id.toString() === friend._id.toString()
    );

    if (!isFriend) {
      return res.status(400).json({ error: "This user is not in your friends list" });
    }

    const roomId = generateRoomId();

    const match = await Match.create({
      type: "friendly",
      status: "pending",
      players: [sender._id],
      invitedBy: sender._id,
      invitedUser: friend._id,
      roomId,
    });

    res.json({
      message: "Friendly match invite sent",
      matchId: match._id,
      roomId: match.roomId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPendingMatchInvites = async (req, res) => {
  try {
    const { uid } = req.params;

    const user = await User.findOne({ uid });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const invites = await Match.find({
      invitedUser: user._id,
      status: "pending",
      type: "friendly",
    }).populate("invitedBy", "uid name email picture");

    const formatted = invites.map((match) => ({
      id: match._id,
      roomId: match.roomId,
      senderUid: match.invitedBy.uid,
      name: match.invitedBy.name,
      photoURL: match.invitedBy.picture,
      rank: "Diamond Tier",
      league: "Champion's League",
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.acceptMatchInvite = async (req, res) => {
  try {
    const { matchId, uid } = req.body;

    const user = await User.findOne({ uid });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const match = await Match.findById(matchId);
    if (!match || match.status !== "pending") {
      return res.status(404).json({ error: "Invite not found" });
    }

    if (match.invitedUser.toString() !== user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    match.status = "accepted";
    match.players.push(user._id);
    await match.save();

    res.json({
      message: "Invite accepted",
      roomId: match.roomId,
      matchId: match._id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.declineMatchInvite = async (req, res) => {
  try {
    const { matchId, uid } = req.body;

    const user = await User.findOne({ uid });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const match = await Match.findById(matchId);
    if (!match || match.status !== "pending") {
      return res.status(404).json({ error: "Invite not found" });
    }

    if (match.invitedUser.toString() !== user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }

    match.status = "declined";
    await match.save();

    res.json({ message: "Invite declined" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMatchByRoomId = async (req, res) => {
  try {
    const { roomId } = req.params;

    const match = await Match.findOne({ roomId })
      .populate("players", "uid name email picture invitedBy")
      .populate("invitedBy", "uid name email picture")
      .populate("invitedUser", "uid name email picture");

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    res.json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};