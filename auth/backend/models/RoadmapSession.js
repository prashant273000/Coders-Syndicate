const mongoose = require('mongoose');

const RoadmapSessionSchema = new mongoose.Schema({
  userId: {
    type: String,
    default: null,
  },
  topic: {
    type: String,
    required: true,
    trim: true,
  },
  modules: [{
    id: { type: String, required: true },
    title: { type: String, required: true },
    icon: { type: String, default: '📚' },
    status: { type: String, enum: ['active', 'locked'], default: 'locked' },
    description: { type: String, default: '' },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster lookups
RoadmapSessionSchema.index({ topic: 1, createdAt: -1 });

module.exports = mongoose.model('RoadmapSession', RoadmapSessionSchema);