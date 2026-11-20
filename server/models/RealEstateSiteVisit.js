const mongoose = require('mongoose');

const realEstateSiteVisitSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'RealEstateProperty', required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  visitDate: { type: Date, required: true },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
  notes: { type: String, default: '', trim: true, maxlength: 2000 },
  assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  reminderSentAt: { type: Date, default: null },
  buyerReminderSentAt: { type: Date, default: null },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

realEstateSiteVisitSchema.index({ company: 1, visitDate: 1, status: 1 });
realEstateSiteVisitSchema.index({ visitDate: 1, status: 1 });
realEstateSiteVisitSchema.index({ property: 1, buyer: 1 });

module.exports = mongoose.model('RealEstateSiteVisit', realEstateSiteVisitSchema);
