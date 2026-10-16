const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Announcement title is required'],
    trim: true,
    maxlength: 200,
  },
  content: {
    type: String,
    required: [true, 'Announcement content is required'],
    trim: true,
    maxlength: 10000,
  },
  category: {
    type: String,
    enum: ['general', 'urgent', 'event', 'holiday', 'policy', 'celebration'],
    default: 'general',
    index: true,
  },
  priority: {
    type: String,
    enum: ['normal', 'high', 'urgent'],
    default: 'normal',
    index: true,
  },
  pinned: {
    type: Boolean,
    default: false,
    index: true,
  },
  department: {
    type: String,
    default: 'All',
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  comments: [commentSchema],
  expiresAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

announcementSchema.index({ pinned: -1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);

