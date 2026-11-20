const mongoose = require('mongoose');

const retailProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 180 },
  sku: { type: String, required: true, trim: true, uppercase: true, unique: true, maxlength: 60 },
  category: { type: String, default: 'general', trim: true, maxlength: 80 },
  description: { type: String, default: '', trim: true, maxlength: 2000 },
  stockQuantity: { type: Number, default: 0, min: 0 },
  reorderLevel: { type: Number, default: 0, min: 0 },
  costPrice: { type: Number, default: 0, min: 0 },
  salePrice: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

retailProductSchema.index({ name: 1, category: 1 });

module.exports = mongoose.model('RetailProduct', retailProductSchema);
