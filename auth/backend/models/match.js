const mongoose = require ("mongoose");

const matchSchema = new mongoose.Schema(
  {
    players: [String], // firebaseUIDs

    status: {
      type: String,
      enum: ["waiting", "active", "completed"],
      default: "waiting",
    },

    winner: String,

    startedAt: Date,
    endedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Match", matchSchema);