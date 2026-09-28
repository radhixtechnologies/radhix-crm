const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketNumber: { type: String, unique: true, sparse: true },
  contact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
  subject: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent', 'critical'], default: 'medium' },
  category: { type: String, default: 'general' },
  type: { type: String, default: 'question' },
  status: { type: String, enum: ['new', 'open', 'pending', 'in-progress', 'resolved', 'closed'], default: 'new' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  messages: [{
    body: String,
    content: String,
    messageType: { type: String, default: 'agent' },
    isInternal: { type: Boolean, default: false },
    attachments: [mongoose.Schema.Types.Mixed],
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sentAt: { type: Date, default: Date.now },
  }],
  sla: {
    firstResponseAt: Date,
    isFirstResponseBreached: { type: Boolean, default: false },
    isResolutionBreached: { type: Boolean, default: false },
  },
  resolution: { resolvedAt: Date, resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } },
  closedAt: Date,
}, { timestamps: true });

ticketSchema.pre('validate', function setTicketNumber(next) {
  if (!this.ticketNumber && this._id) {
    this.ticketNumber = `TKT-${this._id.toString().slice(-8).toUpperCase()}`;
  }
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);