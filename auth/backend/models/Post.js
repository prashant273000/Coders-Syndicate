const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  authorId: {
    type: String,
    required: true,
  },
  authorName: {
    type: String,
    required: true,
  },
  authorAvatar: {
    type: String,
    default: '',
  },
  content: {
    type: String,
    default: '',
  },
  imageUrl: {
    type: String,
    default: '',
  },
  imageFilename: {
    type: String,
    required: false,
    default: '',
  },
  likes: {
    type: [String],
    default: [],
  },
  commentsCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for sorting by creation date
PostSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', PostSchema);