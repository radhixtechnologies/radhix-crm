const mongoose = require('mongoose');

const restaurantTableSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 40 },
  capacity: { type: Number, required: true, min: 1, max: 50 },
  area: { type: String, default: '', trim: true, maxlength: 80 },
  status: { type: String, enum: ['available', 'occupied', 'inactive'], default: 'available', index: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

restaurantTableSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('RestaurantTable', restaurantTableSchema);
