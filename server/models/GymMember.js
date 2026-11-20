const mongoose = require('mongoose');

const gymMemberSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  memberCode: { type: String, trim: true, uppercase: true, sparse: true, maxlength: 40 },
  phone: { type: String, required: true, trim: true, maxlength: 40, index: true },
  email: { type: String, default: '', trim: true, lowercase: true, maxlength: 160 },
  plan: { type: String, enum: ['monthly', 'quarterly', 'half_yearly', 'annual', 'class_pass'], default: 'monthly' },
  membershipStart: { type: Date, required: true, default: Date.now },
  membershipEnd: { type: Date, required: true },
  membershipStatus: { type: String, enum: ['active', 'expired', 'paused', 'cancelled'], default: 'active', index: true },
  emergencyContact: { type: String, default: '', trim: true, maxlength: 160 },
  notes: { type: String, default: '', trim: true, maxlength: 1000 },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

gymMemberSchema.index({ membershipEnd: 1, membershipStatus: 1 });

gymMemberSchema.index({ company: 1, phone: 1 }, { unique: true });
gymMemberSchema.index({ company: 1, memberCode: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('GymMember', gymMemberSchema);
