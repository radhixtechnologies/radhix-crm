const mongoose = require('mongoose');

const performanceReviewSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cycle: { type: String, default: '' },
  status: { type: String, default: 'draft' },
  finalRating: { type: Number, min: 1, max: 5 },
  comments: { type: String, default: '' },
  selfAssessment: { type: mongoose.Schema.Types.Mixed, default: {} },
  managerAssessment: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('PerformanceReview', performanceReviewSchema);
