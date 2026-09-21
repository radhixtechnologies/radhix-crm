const mongoose = require('mongoose');

const taxSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  rate: { type: Number, required: true, min: 0, max: 100 },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Tax', taxSchema);