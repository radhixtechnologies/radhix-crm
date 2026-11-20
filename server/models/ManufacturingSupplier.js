const mongoose = require('mongoose');

const manufacturingSupplierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 180 },
  company: { type: String, default: '', trim: true, maxlength: 180 },
  category: { type: String, default: 'general', trim: true, maxlength: 100 },
  phone: { type: String, required: true, trim: true, maxlength: 40 },
  email: { type: String, default: '', trim: true, lowercase: true, maxlength: 180 },
  address: { type: String, default: '', trim: true, maxlength: 500 },
  notes: { type: String, default: '', trim: true, maxlength: 2000 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

manufacturingSupplierSchema.index({ company: 1, name: 1 });

module.exports = mongoose.model('ManufacturingSupplier', manufacturingSupplierSchema);
