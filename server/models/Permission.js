const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  displayName: { type: String, required: true, trim: true },
  module: { type: String, required: true, index: true },
  resource: { type: String, default: null },
  action: { type: String, required: true },
  scope: { type: String, enum: ['all', 'department', 'team', 'own'], default: 'own' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Permission', permissionSchema);
