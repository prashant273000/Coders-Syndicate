const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    senderUid: {
      type: String,
      required: true,
    },
    receiverUid: {
      type: String,
      required: true,
    },
    players: [
      {
        uid: String,
        name: String,
        picture: String,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Match", matchSchema);