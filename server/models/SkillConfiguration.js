const mongoose = require('mongoose');

const skillConfigurationSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

skillConfigurationSchema.statics.getActiveConfig = async function getActiveConfig() {
  let config = await this.findOne({ key: 'default', isActive: true });
  if (!config) {
    config = await this.create({ key: 'default', settings: { proficiencyLevels: ['beginner', 'intermediate', 'advanced', 'expert'] } });
  }
  return config;
};

skillConfigurationSchema.statics.updateConfig = async function updateConfig(updates, userId) {
  return this.findOneAndUpdate({ key: 'default' }, { settings: updates, updatedBy: userId }, { new: true, upsert: true, setDefaultsOnInsert: true });
};

skillConfigurationSchema.virtual('proficiencyLevels').get(function getProficiencyLevels() {
  return this.settings?.proficiencyLevels || [];
});
skillConfigurationSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('SkillConfiguration', skillConfigurationSchema);