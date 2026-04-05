const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  postId: {
    type: String,
    required: true,
    index: true,
  },
  authorId: {
    type: String,
    required: true,
  },
  authorName: {
    type: String,
    default: 'Anonymous',
  },
  authorAvatar: {
    type: String,
    default: '',
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for sorting by creation date (oldest first for comments)
CommentSchema.index({ postId: 1, createdAt: 1 });

module.exports = mongoose.model('Comment', CommentSchema);