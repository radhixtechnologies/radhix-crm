const mongoose = require('mongoose');

const jobPostingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  requirements: [String],
  location: {
    type: String,
    default: '',
  },
  hiringManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  salaryMin: Number,
  salaryMax: Number,
  currency: {
    type: String,
    default: 'USD',
  },
  isSalaryVisible: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship'],
    default: 'full-time',
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'closed', 'archived'],
    default: 'draft',
    index: true,
  },
  role: {
    type: String,
    required: false,
  },
  visibility: {
    type: String,
    enum: ['internal', 'external', 'both'],
    default: 'internal',
  },
  publishedAt: {
    type: Date,
  },
  archivedAt: {
    type: Date,
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  postedDate: {
    type: Date,
    default: Date.now,
  },
  closingDate: {
    type: Date,
  },
  applications: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobApplication',
    },
  ],
});

module.exports = mongoose.model('JobPosting', jobPostingSchema);

