const mongoose = require('mongoose');

const salonServiceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  category: { type: String, required: true, trim: true, maxlength: 80 },
  description: { type: String, default: '', trim: true, maxlength: 1000 },
  durationMinutes: { type: Number, required: true, min: 5, max: 600 },
  price: { type: Number, required: true, min: 0 },
  active: { type: Boolean, default: true, index: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

salonServiceSchema.index({ category: 1, active: 1 });

module.exports = mongoose.model('SalonService', salonServiceSchema);
