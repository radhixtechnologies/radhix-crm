const mongoose = require('mongoose');
const Lead = require('../../models/Lead');
const Employee = require('../../models/Employee');
const Client = require('../../models/Client');
const Deal = require('../../models/Deal');
const Notification = require('../../models/Notification');
const { executeWorkflowEngine } = require('../workflowController');
const { applyTenantScope, getTenantCompanyId } = require('../../utils/tenantHelper');

const sendError = (res, error) => res.status(error.statusCode || 500).json({ success: false, message: error.message });
const roleSlug = (user) => typeof user?.role === 'object' ? user.role?.slug : user?.role;
const isSalesRep = (user) => roleSlug(user) === 'sales_employee' ||
  (roleSlug(user) === 'employee' && user.department?.toLowerCase() === 'sales');
const canManageSalesTeam = (user) => {
  const role = roleSlug(user) || '';
  return role === 'super_admin' || role === 'admin' || role.endsWith('_admin') || role.endsWith('_manager');
};

const populateAssignedTo = (query) => query.populate({
  path: 'assignedTo',
  select: 'user employeeId department designation',
  populate: { path: 'user', select: 'name email' },
});

const getCurrentEmployee = (user) => Employee.findOne({ user: user._id, deletedAt: null });

const getSalesRepAssignment = async (user) => {
  const employee = await getCurrentEmployee(user);
  if (!employee) {
    const error = new Error('Your Sales employee profile is missing. Please contact your administrator.');
    error.statusCode = 403;
    throw error;
  }
  return [employee._id, user._id];
};

const getOwnLeadAssignment = async (user) => {
  if (isSalesRep(user)) return getSalesRepAssignment(user);
  const employee = await getCurrentEmployee(user);
  if (!employee) {
    const error = new Error('Your employee profile is missing. Please contact your administrator.');
    error.statusCode = 403;
    throw error;
  }
  return [employee._id, user._id];
};

const addAndCondition = (query, condition) => {
  query.$and = [...(query.$and || []), condition];
};

const buildLeadListQuery = async (req) => {
  const { page = 1, limit = 50, search, status, source, campaign, owner, myLeads, instituteInquiry, industry } = req.query;
  const query = { isDeleted: { $ne: true } };
  if (industry) query.industry = industry;
  if (instituteInquiry === 'true') query.isInstituteInquiry = true;
  else if (instituteInquiry === 'false') query.isInstituteInquiry = { $ne: true };
  if (search) {
    addAndCondition(query, {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { courseInterested: { $regex: search, $options: 'i' } },
      ],
    });
  }
  if (status) query.status = status;
  if (source) query.source = source;
  if (campaign) query.campaign = campaign;

  if (!canManageSalesTeam(req.user)) {
    query.assignedTo = { $in: await getOwnLeadAssignment(req.user) };
  } else if (myLeads === 'true') {
    const employee = await getCurrentEmployee(req.user);
    query.assignedTo = { $in: employee ? [employee._id, req.user._id] : [req.user._id] };
  } else if (owner && owner !== 'all' && canManageSalesTeam(req.user)) {
    query.assignedTo = owner;
  }

  const scopedQuery = await applyTenantScope(query, req.user, 'lead');
  return {
    query: scopedQuery,
    page: Math.max(1, Number(page)),
    limit: Math.min(500, Math.max(1, Number(limit))),
  };
};

const leadAccessQuery = async (req, id) => {
  const query = { _id: id, isDeleted: { $ne: true } };
  if (!canManageSalesTeam(req.user)) {
    query.assignedTo = { $in: await getOwnLeadAssignment(req.user) };
  }
  return query;
};

const findEmployeeAssignee = async (value) => {
  if (!value) return null;
  const employeeValue = typeof value === 'object' ? value._id : value;
  if (mongoose.isValidObjectId(employeeValue)) {
    const byId = await Employee.findOne({ _id: employeeValue, deletedAt: null });
    if (byId) return byId;
  }
  return Employee.findOne({ employeeId: employeeValue, deletedAt: null });
};

exports.getLeadOwners = async (req, res) => {
  if (!canManageSalesTeam(req.user)) {
    return res.status(403).json({ success: false, message: 'Only Sales managers can view the owner list' });
  }
  try {
    const employees = await Employee.find({ department: 'Sales', status: 'active', deletedAt: null })
      .select('user employeeId department designation')
      .populate('user', 'name email')
      .sort({ employeeId: 1 })
      .lean();
    res.json({ success: true, data: employees });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getLeads = async (req, res) => {
  try {
    const { query, page, limit } = await buildLeadListQuery(req);

    // Compute status counts for summary widgets (matching all filters except status)
    const summaryMatch = { ...query };
    delete summaryMatch.status;

    const [data, total, statusAgg] = await Promise.all([
      populateAssignedTo(
        Lead.find(query)
          .populate('course', 'name code baseFee duration')
          .populate('batch', 'name startDate endDate schedule capacity status')
          .populate('convertedToStudent', 'studentId name status')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
      ).lean(),
      Lead.countDocuments(query),
      Lead.aggregate([
        { $match: summaryMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const summary = { total, new: 0, contacted: 0, qualified: 0, converted: 0, lost: 0 };
    (statusAgg || []).forEach(item => {
      if (item._id && summary[item._id] !== undefined) {
        summary[item._id] = item.count;
      }
    });

    res.json({
      success: true,
      data,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit: Number(limit),
      summary,
    });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getLead = async (req, res) => {
  try {
    const data = await populateAssignedTo(Lead.findOne(await leadAccessQuery(req, req.params.id)))
      .populate('campaign', 'name')
      .populate('course', 'name code baseFee duration')
      .populate('batch', 'name startDate endDate schedule capacity status')
      .populate('convertedToStudent', 'studentId name status enrollmentDate');
    if (!data) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
};

exports.createLead = async (req, res) => {
  try {
    const leadCompanyId = await getTenantCompanyId(req.user);
    const leadData = { ...req.body, tenantCompany: leadCompanyId || null, createdBy: req.user._id };
    if (!canManageSalesTeam(req.user)) {
      const [employeeId] = await getOwnLeadAssignment(req.user);
      leadData.assignedTo = employeeId;
    } else if (canManageSalesTeam(req.user) && Object.prototype.hasOwnProperty.call(leadData, 'assignedTo')) {
      if (leadData.assignedTo) {
        const employee = await findEmployeeAssignee(leadData.assignedTo);
        if (!employee) return res.status(400).json({ success: false, message: 'Sales owner not found' });
        leadData.assignedTo = employee._id;
      } else {
        leadData.assignedTo = null;
      }
    } else {
      delete leadData.assignedTo;
      const employee = await getCurrentEmployee(req.user);
      if (employee?.department === 'Sales') leadData.assignedTo = employee._id;
    }
    // Enforce tenant company subscription quota for active leads
    if (leadCompanyId) {
      const Company = require('../../models/Company');
      const SubscriptionPlan = require('../../models/SubscriptionPlan');
      const company = await Company.findById(leadCompanyId).populate('subscription.plan');
      if (company) {
        const plan = company.subscription?.plan || await SubscriptionPlan.findOne({ slug: company.subscription?.planSlug || 'starter' });
        const maxLeads = plan?.limits?.maxLeads ?? (company.subscription?.planSlug === 'starter' ? 1000 : 10000);
        const currentCount = await Lead.countDocuments({ tenantCompany: leadCompanyId, isDeleted: { $ne: true } });
        if (currentCount >= maxLeads) {
          return res.status(403).json({
            success: false,
            code: 'QUOTA_EXCEEDED',
            message: `Subscription Lead Limit Reached: Your current plan (${plan?.name || 'Starter'}) allows up to ${maxLeads.toLocaleString()} active leads. Please upgrade your subscription to add more leads.`,
          });
        }
      }
    }

    const data = await Lead.create(leadData);
    await data.populate({
      path: 'assignedTo',
      select: 'user employeeId department designation',
      populate: { path: 'user', select: 'name email' },
    });

    // Execute active automation workflows asynchronously without blocking response
    executeWorkflowEngine('lead_created', data).catch(err => console.warn('Workflow execution warning:', err.message));

    res.status(201).json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateLead = async (req, res) => {
  try {
    const updates = { ...req.body, updatedAt: new Date() };
    if (!canManageSalesTeam(req.user)) delete updates.assignedTo;
    else if (Object.prototype.hasOwnProperty.call(updates, 'assignedTo')) {
      if (updates.assignedTo) {
        const employee = await findEmployeeAssignee(updates.assignedTo);
        if (!employee) return res.status(400).json({ success: false, message: 'Sales owner not found' });
        updates.assignedTo = employee._id;
      } else {
        updates.assignedTo = null;
      }
    }
    const data = await Lead.findOneAndUpdate(await leadAccessQuery(req, req.params.id), updates, {
      new: true,
      runValidators: true,
    });
    if (!data) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
};

exports.deleteLead = async (req, res) => {
  if (!canManageSalesTeam(req.user)) {
    return res.status(403).json({ success: false, message: 'Only Sales managers can delete leads' });
  }
  try {
    const data = await Lead.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { isDeleted: true, updatedAt: new Date() },
      { new: true },
    );
    if (!data) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, data, message: 'Lead deleted' });
  } catch (error) {
    sendError(res, error);
  }
};

exports.assignLead = async (req, res) => {
  if (!canManageSalesTeam(req.user)) {
    return res.status(403).json({ success: false, message: 'Only Sales managers can assign leads' });
  }
  try {
    const assignment = req.body.employeeId || req.body.assignedTo;
    const employee = await findEmployeeAssignee(assignment);
    if (assignment && !employee) return res.status(400).json({ success: false, message: 'Sales owner not found' });
    const data = await Lead.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { assignedTo: employee?._id || null, updatedAt: new Date() },
      { new: true },
    );
    if (!data) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
};

exports.changeStatus = async (req, res) => {
  try {
    const data = await Lead.findOneAndUpdate(
      await leadAccessQuery(req, req.params.id),
      { status: req.body.status, updatedAt: new Date() },
      { new: true, runValidators: true },
    );
    if (!data) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
};

exports.addNote = async (req, res) => {
  try {
    const data = await Lead.findOneAndUpdate(
      await leadAccessQuery(req, req.params.id),
      { $push: { notes: { content: req.body.content, addedBy: req.user._id } }, updatedAt: new Date() },
      { new: true },
    );
    if (!data) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
};

exports.addCommunication = async (req, res) => {
  try {
    const data = await Lead.findOneAndUpdate(
      await leadAccessQuery(req, req.params.id),
      {
        $push: {
          communicationHistory: { ...req.body, date: req.body.date || new Date(), addedBy: req.user._id },
        },
        updatedAt: new Date(),
      },
      { new: true },
    );
    if (!data) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
};

exports.convertLead = async (req, res) => {
  try {
    const lead = await Lead.findOne(await leadAccessQuery(req, req.params.id));
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    const client = await Client.create({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      status: 'prospect',
    });
    const employee = lead.assignedTo ? await Employee.findById(lead.assignedTo).select('user') : null;
    const deal = await Deal.create({
      title: req.body.title || `${lead.name} Deal`,
      name: lead.name,
      leadId: lead._id,
      client: client._id,
      contactName: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      value: lead.value || 0,
      assignedTo: employee?.user || req.user._id,
    });
    lead.convertedToClient = client._id;
    lead.status = 'converted';
    lead.conversionDate = new Date();
    await lead.save();
    res.status(201).json({ success: true, data: { lead, client, deal } });
  } catch (error) {
    sendError(res, error);
  }
};

exports.bulkAssignLeads = async (req, res) => {
  if (!canManageSalesTeam(req.user)) {
    return res.status(403).json({ success: false, message: 'Only Sales managers or Admins can bulk assign leads' });
  }
  try {
    const { leadIds, employeeId, assignedTo } = req.body;
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of lead IDs to assign' });
    }

    const target = employeeId || assignedTo;
    let employee = null;
    if (target) {
      employee = await findEmployeeAssignee(target);
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Assigned employee was not found' });
      }
    }

    const assignedEmployeeId = employee ? employee._id : null;
    const result = await Lead.updateMany(
      { _id: { $in: leadIds }, isDeleted: { $ne: true } },
      { assignedTo: assignedEmployeeId, updatedAt: new Date() }
    );

    // Send in-app notification to employee's user if assigned
    if (employee?.user) {
      await Notification.create({
        user: employee.user,
        title: '🎯 Leads Assigned',
        message: `${leadIds.length} lead(s) have been assigned to you by Admin.`,
        type: 'reminder',
        actionUrl: '/sales/leads',
      }).catch(() => {});
    }

    res.json({
      success: true,
      modifiedCount: result.modifiedCount,
      message: `Successfully assigned ${result.modifiedCount} lead(s) to ${employee?.user?.name || employee?.employeeId || 'Unassigned'}.`,
    });
  } catch (error) {
    sendError(res, error);
  }
};

exports.bulkUpdateStatus = async (req, res) => {
  try {
    const { leadIds, status } = req.body;
    if (!Array.isArray(leadIds) || leadIds.length === 0 || !status) {
      return res.status(400).json({ success: false, message: 'Please provide lead IDs and new status' });
    }

    const query = { _id: { $in: leadIds }, isDeleted: { $ne: true } };
    if (!canManageSalesTeam(req.user)) {
      query.assignedTo = { $in: await getOwnLeadAssignment(req.user) };
    }

    const result = await Lead.updateMany(query, { status, updatedAt: new Date() });
    res.json({
      success: true,
      modifiedCount: result.modifiedCount,
      message: `Successfully updated status to "${status}" for ${result.modifiedCount} lead(s).`,
    });
  } catch (error) {
    sendError(res, error);
  }
};

exports.bulkDeleteLeads = async (req, res) => {
  if (!canManageSalesTeam(req.user)) {
    return res.status(403).json({ success: false, message: 'Only Sales managers or Admins can bulk delete leads' });
  }
  try {
    const { leadIds } = req.body;
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide lead IDs to delete' });
    }

    const result = await Lead.updateMany(
      { _id: { $in: leadIds } },
      { isDeleted: true, updatedAt: new Date() }
    );

    res.json({
      success: true,
      modifiedCount: result.modifiedCount,
      message: `Successfully deleted ${result.modifiedCount} lead(s).`,
    });
  } catch (error) {
    sendError(res, error);
  }
};
