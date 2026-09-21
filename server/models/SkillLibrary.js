const mongoose = require('mongoose');

const skillLibrarySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  skillName: { type: String, default: '' },
  description: { type: String, default: '' },
  category: { type: String, default: 'general' },
  proficiencyLevels: { type: [mongoose.Schema.Types.Mixed], default: [] },
  roles: { type: [String], default: [] },
  requiredLevelsByRole: { type: [mongoose.Schema.Types.Mixed], default: [] },
  tags: { type: [String], default: [] },
  relatedTrainings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Training' }],
  linkedTrainings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Training' }],
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('SkillLibrary', skillLibrarySchema);