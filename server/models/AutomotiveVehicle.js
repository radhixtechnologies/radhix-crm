const mongoose = require('mongoose');

const automotiveVehicleSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'AutomotiveCustomer', required: true, index: true },
  registrationNumber: { type: String, required: true, trim: true, uppercase: true, unique: true, maxlength: 24 },
  make: { type: String, required: true, trim: true, maxlength: 80 },
  model: { type: String, required: true, trim: true, maxlength: 100 },
  year: { type: Number, min: 1900, max: 2100, default: null },
  vin: { type: String, default: '', trim: true, uppercase: true, maxlength: 40 },
  fuelType: { type: String, enum: ['petrol', 'diesel', 'electric', 'hybrid', 'cng', 'other'], default: 'petrol' },
  odometerKm: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['active', 'in_service', 'inactive'], default: 'active', index: true },
  notes: { type: String, default: '', trim: true, maxlength: 1500 },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

automotiveVehicleSchema.index({ make: 1, model: 1 });

module.exports = mongoose.model('AutomotiveVehicle', automotiveVehicleSchema);
