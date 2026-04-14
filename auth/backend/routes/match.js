const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");


const Match = require("../models/Match");
const User = require("../models/user"); // change to User if your filename is User.js

router.post("/accept-invite", async (req, res) => {
  try {
    const { io, onlineUsers } = require("../server");
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

    // ✅ Update status
    match.status = "accepted";
    await match.save();

    // 🔥 SOCKET LOGIC (MOST IMPORTANT PART)
    const senderSocket = onlineUsers[match.senderUid];
    const receiverSocket = onlineUsers[match.receiverUid];

    console.log("senderSocket:", senderSocket);
    console.log("receiverSocket:", receiverSocket);

    // 👉 Notify sender
    if (senderSocket) {
      io.to(senderSocket).emit("invite_accepted", {
        matchId: match._id,
        roomId: match.roomId,
      });
    }

    // 👉 Notify receiver
    if (receiverSocket) {
      io.to(receiverSocket).emit("invite_accepted", {
        matchId: match._id,
        roomId: match.roomId,
      });
    }

    return res.json({
      message: "Invite accepted",
      matchId: match._id,
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
router.post("/accept-invite", async (req, res) => {
  try {
    const { io, onlineUsers } = require("../server");
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

    const senderSocketId = onlineUsers.get(match.senderUid);

    //Real time battle added
    if (senderSocketId) {
      io.to(senderSocketId).emit("invite-accepted", {
        roomId: match.roomId,
      });
    }

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