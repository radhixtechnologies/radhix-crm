const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: Date, required: true },
  checkIn: { type: Date, default: null },
  checkOut: { type: Date, default: null },
  hoursWorked: { type: Number, default: 0 },
  status: { type: String, enum: ['present', 'late', 'wfh', 'half-day', 'absent', 'leave'], default: 'present' },
  isLate: { type: Boolean, default: false },
  lateMinutes: { type: Number, default: 0 },
  checkInMethod: { type: String, default: 'web' },
  checkOutMethod: { type: String, default: '' },
  checkInLocation: { type: mongoose.Schema.Types.Mixed, default: null },
  checkOutLocation: { type: mongoose.Schema.Types.Mixed, default: null },
  notes: { type: String, default: '' },
  correctedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  correctedAt: { type: Date, default: null },
}, { timestamps: true });

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

attendanceSchema.pre('save', function (next) {
  if (this.checkIn && this.checkOut) {
    this.hoursWorked = Math.round(((this.checkOut - this.checkIn) / 3600000) * 100) / 100;
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
