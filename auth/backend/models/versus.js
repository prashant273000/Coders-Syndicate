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

    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],

    submissions: [
    {
    userId: String,
    questionId: String,
    status: String, // passed / failed
    time: Date,
    },
],
  },
  { timestamps: true }
);



module.exports = mongoose.model("Versus", matchSchema);