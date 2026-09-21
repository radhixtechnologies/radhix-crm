const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  type: {
    type: String,
    enum: ['call', 'email', 'meeting', 'task', 'note', 'personal', 'holiday', 'interview', 'training', 'appraisal', 'payroll', 'other'],
    default: 'meeting',
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  allDay: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  roleVisibility: [{ type: String, enum: ['employee', 'admin', 'super_admin'] }],
  isPrivate: { type: Boolean, default: false },
  color: { type: String, default: '#6b7280' },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
}, { timestamps: true });

calendarEventSchema.index({ startDate: 1, endDate: 1 });
calendarEventSchema.index({ createdBy: 1 });

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);