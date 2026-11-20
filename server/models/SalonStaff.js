const mongoose = require('mongoose');

const salonStaffSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  phone: { type: String, required: true, trim: true, maxlength: 40 },
  email: { type: String, default: '', trim: true, lowercase: true, maxlength: 160 },
  specialties: [{ type: String, trim: true, maxlength: 80 }],
  workingDays: [{ type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] }],
  shiftStart: { type: String, default: '09:00', match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  shiftEnd: { type: String, default: '18:00', match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('SalonStaff', salonStaffSchema);
