const mongoose = require('mongoose');

const automotiveCustomerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  phone: { type: String, required: true, trim: true, maxlength: 40 },
  email: { type: String, default: '', trim: true, lowercase: true, maxlength: 160 },
  address: { type: String, default: '', trim: true, maxlength: 300 },
  notes: { type: String, default: '', trim: true, maxlength: 1500 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

automotiveCustomerSchema.index({ name: 1, phone: 1 });

module.exports = mongoose.model('AutomotiveCustomer', automotiveCustomerSchema);
