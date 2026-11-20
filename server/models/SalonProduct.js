const mongoose = require('mongoose');

const salonProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  category: { type: String, default: 'General', trim: true, maxlength: 80 },
  quantity: { type: Number, required: true, min: 0 },
  reorderLevel: { type: Number, default: 0, min: 0 },
  unit: { type: String, required: true, trim: true, maxlength: 30 },
  unitCost: { type: Number, default: 0, min: 0 },
  supplier: { type: String, default: '', trim: true, maxlength: 160 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

salonProductSchema.index({ name: 1, category: 1 });

module.exports = mongoose.model('SalonProduct', salonProductSchema);
