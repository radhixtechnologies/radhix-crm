const mongoose = require('mongoose');

const constructionVendorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  company: { type: String, default: '', trim: true, maxlength: 160 },
  category: { type: String, enum: ['materials', 'labor', 'equipment', 'electrical', 'plumbing', 'interior', 'other'], default: 'materials' },
  phone: { type: String, required: true, trim: true, maxlength: 40 },
  email: { type: String, default: '', trim: true, lowercase: true, maxlength: 160 },
  address: { type: String, default: '', trim: true, maxlength: 300 },
  notes: { type: String, default: '', trim: true, maxlength: 2000 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

constructionVendorSchema.index({ name: 1, category: 1 });

module.exports = mongoose.model('ConstructionVendor', constructionVendorSchema);
