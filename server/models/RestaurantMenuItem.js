const mongoose = require('mongoose');

const restaurantMenuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  category: { type: String, required: true, trim: true, maxlength: 80 },
  description: { type: String, default: '', trim: true, maxlength: 1000 },
  price: { type: Number, required: true, min: 0 },
  preparationMinutes: { type: Number, default: 15, min: 1, max: 360 },
  dietary: { type: String, enum: ['standard', 'vegetarian', 'vegan', 'gluten_free'], default: 'standard' },
  available: { type: Boolean, default: true, index: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

restaurantMenuItemSchema.index({ category: 1, available: 1 });

module.exports = mongoose.model('RestaurantMenuItem', restaurantMenuItemSchema);
