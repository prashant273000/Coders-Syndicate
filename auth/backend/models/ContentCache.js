const mongoose = require('mongoose');

const ContentCacheSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // Auto-delete after 24 hours (optional, remove if you want permanent cache)
  },
});

// Compound index for fast lookups
ContentCacheSchema.index({ topic: 1, title: 1 }, { unique: true });

module.exports = mongoose.model('ContentCache', ContentCacheSchema);