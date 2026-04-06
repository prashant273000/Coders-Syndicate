const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    default: "",
  },
  email: {
    type: String,
    default: "",
  },
  avatar: {
    type: String,
    default: "",
  },
  name: {
    type: String,
    default: "",
  },
  picture: {
    type: String,
    default: "",
  },
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }
  ],
  // User stats for profile and leaderboard
  xpEarned: {
    type: Number,
    default: 0,
  },
  battlesWon: {
    type: Number,
    default: 0,
  },
  battlesLost: {
    type: Number,
    default: 0,
  },
  docsRead: {
    type: Number,
    default: 0,
  },
  tier: {
    type: String,
    default: "Bronze Tier",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for calculating global rank (based on XP)
userSchema.virtual('globalRank').get(function() {
  // This would need to be calculated at query time
  return null;
});

module.exports = mongoose.model("User", userSchema);
