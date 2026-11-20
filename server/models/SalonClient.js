const mongoose = require('mongoose');

const salonClientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  phone: { type: String, required: true, trim: true, maxlength: 40, index: true },
  email: { type: String, default: '', trim: true, lowercase: true, maxlength: 160 },
  membership: { type: String, enum: ['none', 'silver', 'gold', 'platinum'], default: 'none', index: true },
  membershipExpiresAt: { type: Date, default: null },
  visitCount: { type: Number, default: 0, min: 0 },
  lifetimeSpend: { type: Number, default: 0, min: 0 },
  notes: { type: String, default: '', trim: true, maxlength: 1000 },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

salonClientSchema.index({ company: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model('SalonClient', salonClientSchema);
