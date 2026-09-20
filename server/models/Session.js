const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  loggedOutAt: { type: Date, default: null },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Session', sessionSchema);
