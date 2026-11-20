const mongoose = require('mongoose');

const automotiveServiceJobSchema = new mongoose.Schema({
  jobNumber: { type: String, trim: true, uppercase: true, unique: true, sparse: true, maxlength: 40 },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'AutomotiveCustomer', required: true, index: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'AutomotiveVehicle', required: true, index: true },
  serviceType: { type: String, enum: ['maintenance', 'repair', 'diagnostics', 'inspection', 'bodywork', 'other'], default: 'maintenance' },
  description: { type: String, required: true, trim: true, maxlength: 1500 },
  status: { type: String, enum: ['booked', 'checked_in', 'in_progress', 'waiting_parts', 'ready', 'completed', 'cancelled'], default: 'booked', index: true },
  scheduledAt: { type: Date, required: true, index: true },
  completedAt: { type: Date, default: null },
  odometerKm: { type: Number, default: 0, min: 0 },
  laborCost: { type: Number, default: 0, min: 0 },
  partsCost: { type: Number, default: 0, min: 0 },
  assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  notes: { type: String, default: '', trim: true, maxlength: 2000 },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

automotiveServiceJobSchema.index({ scheduledAt: 1, status: 1 });

module.exports = mongoose.model('AutomotiveServiceJob', automotiveServiceJobSchema);
