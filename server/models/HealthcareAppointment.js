const mongoose = require('mongoose');

const healthcareAppointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'HealthcarePatient', required: true, index: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  scheduledAt: { type: Date, required: true, index: true },
  durationMinutes: { type: Number, default: 30, min: 5, max: 480 },
  appointmentType: { type: String, enum: ['consultation', 'follow_up', 'diagnostic', 'procedure', 'other'], default: 'consultation' },
  reason: { type: String, default: '', trim: true, maxlength: 500 },
  administrativeNotes: { type: String, default: '', trim: true, maxlength: 2000 },
  status: { type: String, enum: ['scheduled', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show'], default: 'scheduled', index: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

healthcareAppointmentSchema.index({ scheduledAt: 1, provider: 1 });

module.exports = mongoose.model('HealthcareAppointment', healthcareAppointmentSchema);
