const mongoose = require('mongoose');

const skillRequestSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
  skillName: { type: String, default: '' },
  reason: { type: String, default: '' },
  status: { type: String, default: 'pending' },
  evidence: { type: [mongoose.Schema.Types.Mixed], default: [] },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('SkillRequest', skillRequestSchema);