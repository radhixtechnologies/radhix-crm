const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  contact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
  subject: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  category: { type: String, default: 'general' },
  type: { type: String, default: 'question' },
  status: { type: String, enum: ['new', 'open', 'pending', 'resolved', 'closed'], default: 'new' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  messages: [{ body: String, sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, sentAt: { type: Date, default: Date.now } }],
  resolution: { resolvedAt: Date, resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } },
  closedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);