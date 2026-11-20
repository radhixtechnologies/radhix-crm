const mongoose = require('mongoose');

const automotivePartSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  sku: { type: String, trim: true, uppercase: true, unique: true, sparse: true, maxlength: 50 },
  category: { type: String, enum: ['engine', 'brakes', 'electrical', 'fluids', 'filters', 'tyres', 'body', 'other'], default: 'other' },
  quantity: { type: Number, default: 0, min: 0 },
  reorderLevel: { type: Number, default: 0, min: 0 },
  unitCost: { type: Number, default: 0, min: 0 },
  supplier: { type: String, default: '', trim: true, maxlength: 160 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

automotivePartSchema.index({ name: 1, category: 1 });

module.exports = mongoose.model('AutomotivePart', automotivePartSchema);
