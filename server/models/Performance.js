const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: { type: Number, min: 1, max: 5 },
  comments: { type: String, default: '' },
  reviewPeriod: { type: String, default: '' },
  status: { type: String, default: 'draft' },
}, { timestamps: true });

module.exports = mongoose.model('Performance', performanceSchema);
