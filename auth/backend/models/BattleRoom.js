const mongoose = require("mongoose");

const BattleRoomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
  },
  player1: {
    userId: { type: String, required: true },
    username: { type: String, required: true },
    photoURL: { type: String },
  },
  player2: {
    userId: { type: String, required: true },
    username: { type: String, required: true },
    photoURL: { type: String },
  },
  question: {
    title: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], required: true },
    examples: [{
      input: String,
      output: String,
    }],
    testCases: [{
      input: String,
      expectedOutput: String,
    }],
  },
  submissions: [{
    userId: { type: String, required: true },
    code: { type: String, required: true },
    language: { type: String, required: true },
    languageId: { type: Number, required: true },
    verdict: { type: String },
    score: { type: Number, default: 0 },
    testResults: [{
      testCase: Number,
      passed: Boolean,
      expectedOutput: String,
      actualOutput: String,
    }],
    submittedAt: { type: Date, default: Date.now },
  }],
  status: {
    type: String,
    enum: ["ongoing", "finished"],
    default: "ongoing",
  },
  winnerId: {
    type: String,
  },
  winnerScore: {
    type: Number,
  },
  loserScore: {
    type: Number,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  endedAt: {
    type: Date,
  },
});

module.exports = mongoose.model("BattleRoom", BattleRoomSchema);