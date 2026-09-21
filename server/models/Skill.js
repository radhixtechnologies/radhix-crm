const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  name: { type: String, trim: true, default: '' },
  skillName: { type: String, trim: true, default: '' },
  category: { type: String, default: 'general' },
  proficiency: { type: Number, default: 0 },
  currentLevel: { type: Number, default: 0 },
  proficiencyLevel: { type: Number, default: 0 },
  skillStatus: { type: String, default: 'active' },
  priority: { type: String, default: 'medium' },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assessedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  trainingRecommendations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Training' }],
  evidenceDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('Skill', skillSchema);