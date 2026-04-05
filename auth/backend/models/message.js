const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, default: null },
  content: { type: String, required: true },
  type: { type: String, enum: ["private", "world"], required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

messageSchema.index({ type: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, receiverId: 1, type: 1 });

module.exports = mongoose.model("Message", messageSchema);
