const mongoose = require('mongoose');

const travelPackageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  packageCode: { type: String, trim: true, uppercase: true, unique: true, sparse: true, maxlength: 40 },
  destination: { type: String, required: true, trim: true, maxlength: 160 },
  category: { type: String, enum: ['domestic', 'international', 'adventure', 'pilgrimage', 'business', 'staycation', 'other'], default: 'domestic' },
  durationDays: { type: Number, required: true, min: 1, max: 365 },
  pricePerPerson: { type: Number, required: true, min: 0 },
  inclusions: { type: String, default: '', trim: true, maxlength: 3000 },
  description: { type: String, default: '', trim: true, maxlength: 4000 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

travelPackageSchema.index({ destination: 1, status: 1 });

module.exports = mongoose.model('TravelPackage', travelPackageSchema);
