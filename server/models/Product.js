const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  category: { type: String, default: 'general' },
  unitPrice: { type: Number, default: 0 },
  costPrice: { type: Number, default: 0 },
  stockQuantity: { type: Number, default: 0 },
  minStockLevel: { type: Number, default: 0 },
  unit: { type: String, default: 'piece' },
  image: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);