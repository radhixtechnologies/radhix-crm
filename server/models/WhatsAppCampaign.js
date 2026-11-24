const mongoose = require('mongoose');

const recipientSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'recipients.recipientType'
  },
  recipientType: {
    type: String,
    enum: ['Lead', 'Contact', 'Client'],
    default: 'Lead'
  },
  name: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    default: 'pending'
  },
  sentAt: Date,
  error: String,
  waMessageId: String
}, { _id: true });

const whatsAppCampaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Campaign name is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  templateId: {
    type: String,
    default: ''
  },
  messageBody: {
    type: String,
    required: [true, 'Message content is required']
  },
  category: {
    type: String,
    enum: ['Marketing', 'Sales', 'Welcome', 'Reminder', 'Utility', 'Festival'],
    default: 'Marketing'
  },
  targetType: {
    type: String,
    enum: ['selected_leads', 'all_leads', 'selected_clients', 'all_clients', 'selected_contacts', 'custom'],
    default: 'selected_leads'
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'completed', 'failed'],
    default: 'draft'
  },
  scheduledAt: Date,
  sentAt: Date,
  totalRecipients: {
    type: Number,
    default: 0
  },
  sentCount: {
    type: Number,
    default: 0
  },
  failedCount: {
    type: Number,
    default: 0
  },
  recipients: [recipientSchema],
  tenantCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

whatsAppCampaignSchema.index({ tenantCompany: 1, createdAt: -1 });
whatsAppCampaignSchema.index({ status: 1 });

module.exports = mongoose.model('WhatsAppCampaign', whatsAppCampaignSchema);
