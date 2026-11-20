const mongoose = require('mongoose');

const gymCheckInSchema = new mongoose.Schema({
  member: { type: mongoose.Schema.Types.ObjectId, ref: 'GymMember', required: true },
  checkedInAt: { type: Date, required: true, default: Date.now, index: true },
  checkedOutAt: { type: Date, default: null },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

gymCheckInSchema.index({ member: 1, checkedInAt: -1 });
gymCheckInSchema.index({ member: 1 }, { unique: true, partialFilterExpression: { checkedOutAt: null } });

module.exports = mongoose.model('GymCheckIn', gymCheckInSchema);
