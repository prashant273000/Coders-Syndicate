const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Match = require("../models/Match");
const User = require("../models/user"); // change to User if your filename is User.js

router.post("/invite-friend", async (req, res) => {
  try {
    const { senderUid, friendUid } = req.body;

    console.log("invite-friend body:", req.body);

    if (!senderUid || !friendUid) {
      return res.status(400).json({ error: "senderUid and friendUid are required" });
    }

    if (senderUid === friendUid) {
      return res.status(400).json({ error: "You cannot invite yourself" });
    }

    const sender = await User.findOne({ uid: senderUid });
    const receiver = await User.findOne({ uid: friendUid });

    console.log("sender:", sender?.uid, sender?.name);
    console.log("receiver:", receiver?.uid, receiver?.name);

    if (!sender || !receiver) {
      return res.status(404).json({ error: "Sender or receiver not found" });
    }

    const existingPending = await Match.findOne({
      senderUid,
      receiverUid: friendUid,
      status: "pending",
    });

    if (existingPending) {
      return res.status(400).json({ error: "Invite already pending" });
    }

    const roomId = new mongoose.Types.ObjectId().toString();

    const match = await Match.create({
      roomId,
      senderUid,
      receiverUid: friendUid,
      players: [
        {
          uid: sender.uid,
          name: sender.name,
          picture: sender.picture || "",
        },
        {
          uid: receiver.uid,
          name: receiver.name,
          picture: receiver.picture || "",
        },
      ],
      status: "pending",
    });

    return res.status(201).json({
      message: "Invite sent successfully",
      matchId: match._id,
      roomId: match.roomId,
    });
  } catch (err) {
    console.error("invite-friend error:", err);
    return res.status(500).json({
      error: "Server error while sending invite",
      details: err.message,
    });
  }
});

router.get("/invites/:uid", async (req, res) => {
  try {
    const { uid } = req.params;

    const invites = await Match.find({
      receiverUid: uid,
      status: "pending",
    }).sort({ createdAt: -1 });

    const formattedInvites = invites.map((match) => {
      const sender = match.players.find((p) => p.uid === match.senderUid);

      return {
        _id: match._id,
        id: match._id,
        roomId: match.roomId,
        name: sender?.name || "Unknown Player",
        photoURL: sender?.picture || "",
        league: "Champion's League",
        rank: "Diamond Tier",
      };
    });

    return res.json(formattedInvites);
  } catch (err) {
    console.error("get invites error:", err);
    return res.status(500).json({
      error: "Server error while fetching invites",
      details: err.message,
    });
  }
});

router.post("/accept-invite", async (req, res) => {
  try {
    const { matchId, uid } = req.body;

    if (!matchId || !uid) {
      return res.status(400).json({ error: "matchId and uid are required" });
    }

    const match = await Match.findById(matchId);

    if (!match) {
      return res.status(404).json({ error: "Match invite not found" });
    }

    if (match.receiverUid !== uid) {
      return res.status(403).json({ error: "Only invited user can accept this match" });
    }

    if (match.status !== "pending") {
      return res.status(400).json({ error: `Match is already ${match.status}` });
    }

    match.status = "accepted";
    await match.save();

    return res.json({
      message: "Invite accepted",
      roomId: match.roomId,
    });
  } catch (err) {
    console.error("accept-invite error:", err);
    return res.status(500).json({
      error: "Server error while accepting invite",
      details: err.message,
    });
  }
});

router.post("/decline-invite", async (req, res) => {
  try {
    const { matchId } = req.body;

    if (!matchId) {
      return res.status(400).json({ error: "matchId is required" });
    }

    const match = await Match.findById(matchId);

    if (!match) {
      return res.status(404).json({ error: "Match invite not found" });
    }

    if (match.status !== "pending") {
      return res.status(400).json({ error: `Match is already ${match.status}` });
    }

    match.status = "declined";
    await match.save();

    return res.json({ message: "Invite declined" });
  } catch (err) {
    console.error("decline-invite error:", err);
    return res.status(500).json({
      error: "Server error while declining invite",
      details: err.message,
    });
  }
});

router.post("/cancel-invite", async (req, res) => {
  try {
    const { matchId } = req.body;

    if (!matchId) {
      return res.status(400).json({ error: "matchId is required" });
    }

    const match = await Match.findById(matchId);

    if (!match) {
      return res.status(404).json({ error: "Match invite not found" });
    }

    if (match.status !== "pending") {
      return res.status(400).json({ error: `Cannot cancel, match is already ${match.status}` });
    }

    match.status = "cancelled";
    await match.save();

    return res.json({ message: "Invite cancelled" });
  } catch (err) {
    console.error("cancel-invite error:", err);
    return res.status(500).json({
      error: "Server error while cancelling invite",
      details: err.message,
    });
  }
});

router.get("/status/:matchId", async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await Match.findById(matchId);

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    return res.json({
      status: match.status,
      roomId: match.roomId,
    });
  } catch (err) {
    console.error("status error:", err);
    return res.status(500).json({
      error: "Server error while checking match status",
      details: err.message,
    });
  }
});

router.get("/room/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;

    const match = await Match.findOne({ roomId });

    if (!match) {
      return res.status(404).json({ error: "Room not found" });
    }

    return res.json({
      roomId: match.roomId,
      status: match.status,
      players: match.players,
    });
  } catch (err) {
    console.error("room error:", err);
    return res.status(500).json({
      error: "Server error while fetching room",
      details: err.message,
    });
  }
});

module.exports = router;