const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Course code is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
    trim: true,
  },
  baseFee: {
    type: Number,
    required: [true, 'Base fee is required'],
    min: [0, 'Base fee cannot be negative'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

courseSchema.index({ isActive: 1 });

module.exports = mongoose.model('Course', courseSchema);
