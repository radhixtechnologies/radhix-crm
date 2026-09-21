const mongoose = require('mongoose');

const skillGapSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
  skillName: { type: String, default: '' },
  currentLevel: { type: Number, default: 0 },
  requiredLevel: { type: Number, default: 0 },
  status: { type: String, default: 'open' },
  priority: { type: String, default: 'medium' },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('SkillGap', skillGapSchema);