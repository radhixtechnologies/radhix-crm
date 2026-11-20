const mongoose = require('mongoose');

const workflowRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    triggerEvent: {
      type: String,
      required: true,
      enum: [
        'lead_created',
        'lead_status_changed',
        'lead_score_high',
        'deal_won',
        'invoice_overdue',
      ],
      default: 'lead_created',
    },
    actionType: {
      type: String,
      required: true,
      enum: [
        'round_robin_assign',
        'auto_schedule_followup',
        'notify_sales_rep',
        'set_lead_temperature',
        'send_whatsapp_alert',
      ],
    },
    actionConfig: {
      followUpHours: { type: Number, default: 24 }, // e.g. schedule follow-up 24 hrs later
      targetTemperature: { type: String, enum: ['cold', 'warm', 'hot', 'qualified'], default: 'hot' },
      notificationTitle: { type: String, default: '' },
      notificationMessage: { type: String, default: '' },
      assignedRoles: [{ type: String, default: 'sales_employee' }],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    executionCount: {
      type: Number,
      default: 0,
    },
    lastExecutedAt: {
      type: Date,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WorkflowRule', workflowRuleSchema);

