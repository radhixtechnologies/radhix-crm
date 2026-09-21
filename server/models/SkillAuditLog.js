const mongoose = require('mongoose');

const skillAuditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('SkillAuditLog', skillAuditLogSchema);