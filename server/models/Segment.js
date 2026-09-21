const mongoose = require('mongoose');

const segmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  type: { type: String, enum: ['dynamic', 'static'], default: 'dynamic' },
  rules: { type: mongoose.Schema.Types.Mixed, default: {} },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Contact' }],
  usedInCampaigns: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' }],
  cachedCounts: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Segment', segmentSchema);