const mongoose = require('mongoose');

const restaurantIngredientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  unit: { type: String, required: true, trim: true, maxlength: 30 },
  quantity: { type: Number, default: 0, min: 0 },
  reorderLevel: { type: Number, default: 0, min: 0 },
  unitCost: { type: Number, default: 0, min: 0 },
  supplier: { type: String, default: '', trim: true, maxlength: 160 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

restaurantIngredientSchema.index({ name: 1 });

module.exports = mongoose.model('RestaurantIngredient', restaurantIngredientSchema);
