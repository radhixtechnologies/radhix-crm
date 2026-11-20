const mongoose = require('mongoose');

const gymClassSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  category: { type: String, default: 'General', trim: true, maxlength: 80 },
  trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'GymTrainer', required: true },
  startsAt: { type: Date, required: true, index: true },
  durationMinutes: { type: Number, required: true, min: 10, max: 360 },
  capacity: { type: Number, required: true, min: 1, max: 200 },
  enrolledMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'GymMember' }],
  status: { type: String, enum: ['scheduled', 'in_progress', 'completed', 'cancelled'], default: 'scheduled', index: true },
  notes: { type: String, default: '', trim: true, maxlength: 1000 },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

gymClassSchema.index({ startsAt: 1, trainer: 1 });

module.exports = mongoose.model('GymClass', gymClassSchema);
