const mongoose = require('mongoose');

const healthcarePatientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  patientCode: { type: String, trim: true, uppercase: true, unique: true, sparse: true, maxlength: 40 },
  phone: { type: String, required: true, trim: true, maxlength: 40 },
  email: { type: String, default: '', trim: true, lowercase: true, maxlength: 160 },
  dateOfBirth: { type: Date, default: null },
  gender: { type: String, enum: ['female', 'male', 'non_binary', 'prefer_not_to_say', ''], default: '' },
  emergencyContactName: { type: String, default: '', trim: true, maxlength: 160 },
  emergencyContactPhone: { type: String, default: '', trim: true, maxlength: 40 },
  assignedProvider: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  administrativeNotes: { type: String, default: '', trim: true, maxlength: 2000 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

healthcarePatientSchema.index({ name: 1, phone: 1 });

module.exports = mongoose.model('HealthcarePatient', healthcarePatientSchema);
