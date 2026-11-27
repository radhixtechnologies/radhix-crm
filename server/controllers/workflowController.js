const WorkflowRule = require('../models/WorkflowRule');
const Employee = require('../models/Employee');
const Lead = require('../models/Lead');
const FollowUp = require('../models/FollowUp');
const Notification = require('../models/Notification');
const Company = require('../models/Company');
const User = require('../models/User');

const DEFAULT_WORKFLOWS = [
  {
    name: 'Auto Round-Robin Lead Assignment',
    description: 'Distributes all newly captured leads equally among active sales representatives',
    triggerEvent: 'lead_created',
    actionType: 'round_robin_assign',
    actionConfig: { assignedRoles: ['sales_employee'] },
    isActive: true,
  },
  {
    name: 'Automatic 24-Hour Welcome Follow-up',
    description: 'Automatically creates a follow-up reminder for sales rep 24 hours after lead creation',
    triggerEvent: 'lead_created',
    actionType: 'auto_schedule_followup',
    actionConfig: { followUpHours: 24 },
    isActive: true,
  },
  {
    name: 'Hot Lead Instant Notification Alert',
    description: 'Notifies sales team immediately when a high-value or hot inquiry is registered',
    triggerEvent: 'lead_score_high',
    actionType: 'notify_sales_rep',
    actionConfig: {
      notificationTitle: '🔥 High-Intent Lead Detected!',
      notificationMessage: 'A new high-score lead requires urgent attention.',
    },
    isActive: true,
  },
  {
    name: 'Auto-Elevate High Value Inquiries to Hot',
    description: 'Automatically marks inquiries with deal value over ₹50,000 as Hot Temperature',
    triggerEvent: 'lead_created',
    actionType: 'set_lead_temperature',
    actionConfig: { targetTemperature: 'hot' },
    isActive: true,
  },
];

// Helper to seed defaults if none exist
const seedDefaultsForCompany = async (companyId, userId) => {
  const count = await WorkflowRule.countDocuments({ company: companyId });
  if (count === 0) {
    const rules = DEFAULT_WORKFLOWS.map(w => ({
      ...w,
      company: companyId,
      createdBy: userId,
    }));
    await WorkflowRule.insertMany(rules);
  }
};

// GET /api/workflows
exports.getWorkflows = async (req, res) => {
  try {
    const companyId = req.user.company;
    if (companyId) {
      await seedDefaultsForCompany(companyId, req.user._id);
    }

    const query = companyId ? { company: companyId } : {};
    let workflows = await WorkflowRule.find(query).sort({ createdAt: -1 });

    if (workflows.length === 0) {
      // Return defaults even if no company attached
      workflows = await WorkflowRule.insertMany(
        DEFAULT_WORKFLOWS.map(w => ({ ...w, createdBy: req.user._id }))
      );
    }

    res.json({ success: true, data: workflows });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({ success: false, message: 'Server error fetching workflows' });
  }
};

// POST /api/workflows
exports.createWorkflow = async (req, res) => {
  try {
    const { name, description, triggerEvent, actionType, actionConfig, isActive } = req.body;
    if (!name || !triggerEvent || !actionType) {
      return res.status(400).json({ success: false, message: 'Name, trigger, and action are required' });
    }

    const workflow = await WorkflowRule.create({
      name,
      description,
      triggerEvent,
      actionType,
      actionConfig: actionConfig || {},
      isActive: isActive !== undefined ? isActive : true,
      company: req.user.company,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: workflow });
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({ success: false, message: 'Failed to create workflow rule' });
  }
};

// PUT /api/workflows/:id/toggle
exports.toggleWorkflow = async (req, res) => {
  try {
    const workflow = await WorkflowRule.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow not found' });
    }

    workflow.isActive = !workflow.isActive;
    await workflow.save();

    res.json({ success: true, data: workflow });
  } catch (error) {
    console.error('Error toggling workflow:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle workflow' });
  }
};

// DELETE /api/workflows/:id
exports.deleteWorkflow = async (req, res) => {
  try {
    const workflow = await WorkflowRule.findByIdAndDelete(req.params.id);
    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow not found' });
    }
    res.json({ success: true, message: 'Workflow rule removed successfully' });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    res.status(500).json({ success: false, message: 'Failed to delete workflow' });
  }
};

/**
 * Resolve eligible active Sales employees for a tenant without leaking across tenants,
 * while supporting legacy Sales employees whose `company` field has not been backfilled.
 */
const getEligibleSalesEmployees = async (companyTarget) => {
  const baseFilter = { status: 'active', deletedAt: null };
  const sortOrder = { createdAt: 1, _id: 1 };

  if (!companyTarget) {
    const sales = await Employee.find({ ...baseFilter, department: 'Sales' }).sort(sortOrder);
    return sales.length > 0 ? sales : Employee.find(baseFilter).sort(sortOrder).limit(50);
  }

  const companyUsers = await User.find({ company: companyTarget }).select('_id').lean();
  const companyUserIds = companyUsers.map((u) => u._id);
  const companyScopeOr = [
    { company: companyTarget },
    ...(companyUserIds.length > 0 ? [{ user: { $in: companyUserIds } }] : []),
  ];

  // 1. Strict tenant-scoped Sales employees
  let salesEmployees = await Employee.find({
    ...baseFilter,
    department: 'Sales',
    $or: companyScopeOr,
  }).sort(sortOrder);
  if (salesEmployees.length > 0) return salesEmployees;

  // 2. Legacy unscoped Sales employees (only for the root/default company when sales reps have no company set)
  const companyTargetStr = companyTarget.toString();
  const rootCompany = await Company.findOne().sort({ createdAt: 1 }).select('_id').lean();
  const isRootCompany = rootCompany && rootCompany._id.toString() === companyTargetStr;

  if (isRootCompany) {
    const legacySales = await Employee.find({
      ...baseFilter,
      department: 'Sales',
      $or: [{ company: null }, { company: { $exists: false } }],
    })
      .populate('user', 'company')
      .sort(sortOrder);

    salesEmployees = legacySales.filter(
      (emp) => !emp.user?.company || emp.user.company.toString() === companyTargetStr
    );
    if (salesEmployees.length > 0) return salesEmployees;
  }

  // 3. Fallback to any active tenant-scoped employees if no Sales department reps exist yet
  return Employee.find({ ...baseFilter, $or: companyScopeOr }).sort(sortOrder).limit(50);
};

/**
 * ENGINE: Execute active workflow triggers
 * Called internally on Lead creation, score update, or status change
 */
exports.executeWorkflowEngine = async (triggerEvent, lead, extraContext = {}) => {
  try {
    const ruleQuery = { triggerEvent, isActive: true };
    if (lead?.tenantCompany) {
      const hasCompanyRules = await WorkflowRule.exists({
        triggerEvent,
        isActive: true,
        company: lead.tenantCompany,
      });
      if (hasCompanyRules) {
        ruleQuery.company = lead.tenantCompany;
      }
    }

    const rules = await WorkflowRule.find(ruleQuery);
    if (!rules || rules.length === 0) return;

    for (const rule of rules) {
      try {
        switch (rule.actionType) {
          case 'round_robin_assign': {
            if (!lead.assignedTo) {
              const companyTarget = lead.tenantCompany || rule.company;
              const salesEmployees = await getEligibleSalesEmployees(companyTarget);

              if (salesEmployees.length > 0) {
                // Round-robin selection based on rule.executionCount % salesEmployees.length
                const targetIdx = rule.executionCount % salesEmployees.length;
                const assignedEmployee = salesEmployees[targetIdx];

                await Lead.findByIdAndUpdate(lead._id, { assignedTo: assignedEmployee._id });
                lead.assignedTo = assignedEmployee._id;

                rule.executionCount += 1;
                rule.lastExecutedAt = new Date();
                await rule.save();

                // Send notification to employee user
                if (assignedEmployee.user) {
                  await Notification.create({
                    user: assignedEmployee.user?._id || assignedEmployee.user,
                    title: '🎯 New Lead Assigned',
                    message: `Lead "${lead.name}" has been assigned to you.`,
                    type: 'reminder',
                    relatedEntity: { entityType: 'lead', entityId: lead._id },
                    actionUrl: `/sales/leads/${lead._id}`,
                  }).catch(() => {});
                }
              }
            }
            break;
          }

          case 'auto_schedule_followup': {
            if (lead.assignedTo) {
              const hours = rule.actionConfig?.followUpHours || 24;
              const scheduledDate = new Date(Date.now() + hours * 60 * 60 * 1000);
              const employee = await Employee.findById(lead.assignedTo);
              const creatorUserId = lead.createdBy || rule.createdBy || employee?.user;

              if (creatorUserId) {
                await FollowUp.create({
                  type: 'lead',
                  relatedId: lead._id,
                  title: `Welcome Follow-up: ${lead.name}`,
                  description: `Auto-generated follow-up via Automation Rule "${rule.name}"`,
                  scheduledDate,
                  typeOfFollowUp: 'call',
                  status: 'pending',
                  assignedTo: lead.assignedTo,
                  createdBy: creatorUserId,
                });

                rule.executionCount += 1;
                rule.lastExecutedAt = new Date();
                await rule.save();
              }
            }
            break;
          }

          case 'set_lead_temperature': {
            const minVal = rule.actionConfig?.minValue || 50000;
            if (lead.value && lead.value >= minVal) {
              const targetTemp = rule.actionConfig?.targetTemperature || 'hot';
              await Lead.findByIdAndUpdate(lead._id, { leadTemperature: targetTemp });
              lead.leadTemperature = targetTemp;

              rule.executionCount += 1;
              rule.lastExecutedAt = new Date();
              await rule.save();
            }
            break;
          }

          case 'notify_sales_rep': {
            if (lead.assignedTo) {
              const employee = await Employee.findById(lead.assignedTo);
              if (employee?.user) {
                await Notification.create({
                  user: employee.user,
                  title: rule.actionConfig?.notificationTitle || '🔥 High-Intent Lead Alert',
                  message: `Lead ${lead.name} needs quick follow-up.`,
                  type: 'reminder',
                  relatedEntity: { entityType: 'lead', entityId: lead._id },
                  actionUrl: `/sales/leads/${lead._id}`,
                }).catch(() => {});

                rule.executionCount += 1;
                rule.lastExecutedAt = new Date();
                await rule.save();
              }
            }
            break;
          }

          default:
            break;
        }
      } catch (ruleErr) {
        console.warn(`[Workflow Engine] Error executing rule ${rule.name}:`, ruleErr.message);
      }
    }
  } catch (engineErr) {
    console.error('[Workflow Engine] Execution failed:', engineErr.message);
  }
};

