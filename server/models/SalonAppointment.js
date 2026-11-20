const mongoose = require('mongoose');

const salonAppointmentSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'SalonClient', required: true, index: true },
  staff: { type: mongoose.Schema.Types.ObjectId, ref: 'SalonStaff', required: true, index: true },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'SalonService', required: true },
  serviceName: { type: String, required: true, trim: true, maxlength: 160 },
  scheduledAt: { type: Date, required: true, index: true },
  durationMinutes: { type: Number, required: true, min: 5, max: 600 },
  price: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['booked', 'confirmed', 'checked_in', 'in_service', 'completed', 'cancelled', 'no_show'], default: 'booked', index: true },
  paymentStatus: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
  notes: { type: String, default: '', trim: true, maxlength: 1000 },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

salonAppointmentSchema.index({ staff: 1, scheduledAt: 1, status: 1 });

module.exports = mongoose.model('SalonAppointment', salonAppointmentSchema);
