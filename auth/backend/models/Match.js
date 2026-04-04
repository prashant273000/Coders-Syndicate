const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["quick", "friendly"],
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "ongoing", "completed", "declined"],
    default: "pending",
  },
  players: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }
  ],
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  invitedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  roomId: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Match", matchSchema);