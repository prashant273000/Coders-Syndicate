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
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  tier: { type: String, default: "Bronze" },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  friends: [
    {
    uid: String,
    name: String,
    picture: String,
    status: { type: String, default: "Offline" }
    }
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);