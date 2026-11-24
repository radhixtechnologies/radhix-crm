const mongoose = require('mongoose');

const whatsAppTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  identifier: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['Sales', 'Marketing', 'Welcome', 'Reminder', 'Utility', 'Festival', 'Finance'],
    default: 'Sales'
  },
  language: {
    type: String,
    default: 'en'
  },
  body: {
    type: String,
    required: true
  },
  variables: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['approved', 'pending', 'rejected', 'local_only'],
    default: 'approved'
  },
  isSystem: {
    type: Boolean,
    default: false
  },
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

whatsAppTemplateSchema.index({ tenantCompany: 1, name: 1 });

module.exports = mongoose.model('WhatsAppTemplate', whatsAppTemplateSchema);
