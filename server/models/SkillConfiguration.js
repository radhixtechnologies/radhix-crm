const mongoose = require('mongoose');

const skillConfigurationSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('SkillConfiguration', skillConfigurationSchema);