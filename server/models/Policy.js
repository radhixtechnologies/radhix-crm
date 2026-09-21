const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, default: 'HR' },
  description: { type: String, default: '' },
  content: { type: String, default: '' },
  version: { type: Number, default: 1 },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  effectiveDate: Date,
  expiryDate: Date,
  isMandatory: { type: Boolean, default: false },
  requiresAcknowledgment: { type: Boolean, default: true },
  applicableTo: { type: mongoose.Schema.Types.Mixed, default: {} },
  acknowledgments: [{ employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }, acknowledgedAt: Date }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Policy', policySchema);