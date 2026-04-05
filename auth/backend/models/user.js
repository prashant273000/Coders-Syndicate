const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
  },

  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
  },

  picture: {
    type: String,
    default: "",
  },

  xp: {
    type: Number,
    default: 0,
  },

  tier: {
    type: String,
    default: "Bronze Tier",
  },

  league: {
    type: String,
    default: "Beginner League",
  },

  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);