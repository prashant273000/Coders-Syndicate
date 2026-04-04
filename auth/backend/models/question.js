const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  title: String,
  description: String,
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    default: "Easy",
  },
  examples: [
    {
      input: String,
      output: String,
    },
  ],
  testCases: [
    {
      input: String,
      expectedOutput: String,
    },
  ],
  functionSignature: {
    javascript: String,
    python: String,
    cpp: String,
  },
});

module.exports = mongoose.model("Question", questionSchema);