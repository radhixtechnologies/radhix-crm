const mongoose = require('mongoose');
const Project = require('../models/ConstructionProject');
const Vendor = require('../models/ConstructionVendor');
const Lead = require('../models/Lead');
const Employee = require('../models/Employee');
const { applyTenantScope, getTenantCompanyId } = require('../utils/tenantHelper');

const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const sendError = (res, error) => {
  if (error.code === 11000) {
    return res.status(409).json({ success: false, message: 'That project code is already in use.' });
  }
  if ((error.statusCode || 500) >= 500) console.error('[Construction] Request failed:', error);
  return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Construction request failed.' });
};
const parseDate = (value, label) => {
  if (value === '' || value === null || value === undefined) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw fail(`${label} must be a valid date.`);
  return date;
};
const populateProject = (query) => query
  .populate('client', 'name phone email company')
  .populate({ path: 'projectManager', select: 'employeeId designation user', populate: { path: 'user', select: 'name email' } })
  .populate({ path: 'billItems.vendor', select: 'name company category phone' });

exports.getSummary = async (req, res) => {
  try {
    const consProjectScope = await applyTenantScope({}, req.user);
    const projects = await Project.find(consProjectScope).select('status budget progress dueDate billItems').lean();
    const active = projects.filter((project) => project.status === 'active');
    const budget = projects.reduce((sum, project) => sum + (Number(project.budget) || 0), 0);
    const committed = projects.reduce((sum, project) => sum + (project.billItems || [])
      .filter((item) => item.status !== 'planned')
      .reduce((total, item) => total + item.quantity * item.unitCost, 0), 0);
    const now = new Date();
    const delayed = active.filter((project) => project.dueDate && new Date(project.dueDate) < now).length;
    const [vendors, openEstimates] = await Promise.all([
      Vendor.countDocuments(await applyTenantScope({ status: 'active' }, req.user)),
      Project.countDocuments(await applyTenantScope({ status: { $in: ['planning', 'active'] }, 'billItems.0': { $exists: true } }, req.user)),
    ]);
    res.json({
      success: true,
      data: {
        projects: projects.length,
        active: active.length,
        delayed,
        budget,
        committed,
        vendors,
        openEstimates,
        averageProgress: active.length ? Math.round(active.reduce((sum, project) => sum + project.progress, 0) / active.length) : 0,
      },
    });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getProjects = async (req, res) => {
  try {
    const { search = '', status = '' } = req.query;
    let query = {};
    if (status) query.status = status;
    if (search.trim()) {
      const escaped = search.trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { projectCode: { $regex: escaped, $options: 'i' } },
        { location: { $regex: escaped, $options: 'i' } },
      ];
    }
    query = await applyTenantScope(query, req.user);
    const projects = await populateProject(Project.find(query).sort({ updatedAt: -1 })).lean();
    const data = projects.map((project) => ({
      ...project,
      committed: (project.billItems || [])
        .filter((item) => item.status !== 'planned')
        .reduce((sum, item) => sum + item.quantity * item.unitCost, 0),
      estimateTotal: (project.billItems || []).reduce((sum, item) => sum + item.quantity * item.unitCost, 0),
    }));
    res.json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getProject = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw fail('Invalid project ID.');
    const project = await populateProject(Project.findById(req.params.id)).lean();
    if (!project) throw fail('Construction project not found.', 404);
    const estimateTotal = (project.billItems || []).reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
    const committed = (project.billItems || []).filter((item) => item.status !== 'planned')
      .reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
    res.json({ success: true, data: { ...project, estimateTotal, committed } });
  } catch (error) {
    sendError(res, error);
  }
};

exports.createProject = async (req, res) => {
  try {
    const { name, projectCode, projectType, status, priority, location, description, client, projectManager, startDate, dueDate, budget, progress } = req.body;
    if (typeof name !== 'string' || !name.trim()) throw fail('Project name is required.');
    if (typeof location !== 'string' || !location.trim()) throw fail('Project location is required.');
    const start = parseDate(startDate, 'Start date');
    const due = parseDate(dueDate, 'Due date');
    if (start && due && due < start) throw fail('Due date cannot be before the start date.');
    if (client && !await Lead.exists({ _id: client, isDeleted: { $ne: true } })) throw fail('Selected client lead does not exist.');
    if (projectManager && !await Employee.exists({ _id: projectManager, deletedAt: null, status: 'active' })) throw fail('Selected project manager is inactive or does not exist.');
    const consCompanyId = await getTenantCompanyId(req.user);
    const project = await Project.create({
      company: consCompanyId || null,
      name: name.trim(), projectCode: projectCode?.trim() || undefined, projectType, status, priority,
      location: location.trim(), description, client: client || null, projectManager: projectManager || null,
      startDate: start, dueDate: due, budget: Number(budget) || 0, progress: Number(progress) || 0,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: await populateProject(Project.findById(project._id)) });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateProject = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw fail('Invalid project ID.');
    const allowed = ['name', 'projectCode', 'projectType', 'status', 'priority', 'location', 'description', 'client', 'projectManager', 'startDate', 'dueDate', 'budget', 'progress'];
    const updates = Object.fromEntries(allowed.filter((key) => Object.hasOwn(req.body, key)).map((key) => [key, req.body[key]]));
    if (updates.name !== undefined && !String(updates.name).trim()) throw fail('Project name is required.');
    if (updates.location !== undefined && !String(updates.location).trim()) throw fail('Project location is required.');
    if (updates.startDate !== undefined) updates.startDate = parseDate(updates.startDate, 'Start date');
    if (updates.dueDate !== undefined) updates.dueDate = parseDate(updates.dueDate, 'Due date');
    if (updates.client && !await Lead.exists({ _id: updates.client, isDeleted: { $ne: true } })) throw fail('Selected client lead does not exist.');
    if (updates.projectManager && !await Employee.exists({ _id: updates.projectManager, deletedAt: null, status: 'active' })) throw fail('Selected project manager is inactive or does not exist.');
    const existing = await Project.findById(req.params.id).select('startDate dueDate');
    if (!existing) throw fail('Construction project not found.', 404);
    const start = updates.startDate !== undefined ? updates.startDate : existing.startDate;
    const due = updates.dueDate !== undefined ? updates.dueDate : existing.dueDate;
    if (start && due && due < start) throw fail('Due date cannot be before the start date.');
    if (updates.name) updates.name = updates.name.trim();
    if (updates.location) updates.location = updates.location.trim();
    if (updates.projectCode === '') delete updates.projectCode;
    const project = await populateProject(Project.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }));
    res.json({ success: true, data: project });
  } catch (error) {
    sendError(res, error);
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) throw fail('Construction project not found.', 404);
    res.json({ success: true, message: 'Construction project deleted.' });
  } catch (error) {
    sendError(res, error);
  }
};

exports.addBillItem = async (req, res) => {
  try {
    const { name, category, unit, quantity, unitCost, vendor, notes } = req.body;
    if (!name?.trim() || !unit?.trim() || Number(quantity) <= 0 || Number(unitCost) < 0) {
      throw fail('Enter an item name, unit, positive quantity, and valid unit cost.');
    }
    if (vendor && !await Vendor.exists({ _id: vendor, status: 'active' })) throw fail('Selected vendor is inactive or does not exist.');
    const project = await Project.findById(req.params.id);
    if (!project) throw fail('Construction project not found.', 404);
    project.billItems.push({ name: name.trim(), category, unit: unit.trim(), quantity: Number(quantity), unitCost: Number(unitCost), vendor: vendor || null, notes });
    await project.save();
    res.status(201).json({ success: true, data: await populateProject(Project.findById(project._id)) });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateBillItem = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) throw fail('Construction project not found.', 404);
    const item = project.billItems.id(req.params.itemId);
    if (!item) throw fail('Estimate item not found.', 404);
    const allowed = ['name', 'category', 'unit', 'quantity', 'unitCost', 'vendor', 'status', 'notes'];
    for (const key of allowed) {
      if (Object.hasOwn(req.body, key)) item[key] = req.body[key] === '' && key === 'vendor' ? null : req.body[key];
    }
    if (item.vendor && !await Vendor.exists({ _id: item.vendor, status: 'active' })) throw fail('Selected vendor is inactive or does not exist.');
    await project.save();
    res.json({ success: true, data: await populateProject(Project.findById(project._id)) });
  } catch (error) {
    sendError(res, error);
  }
};

exports.deleteBillItem = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) throw fail('Construction project not found.', 404);
    const item = project.billItems.id(req.params.itemId);
    if (!item) throw fail('Estimate item not found.', 404);
    item.deleteOne();
    await project.save();
    res.json({ success: true, data: await populateProject(Project.findById(project._id)) });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getVendors = async (req, res) => {
  try {
    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.category) query.category = req.query.category;
    if (req.query.search?.trim()) {
      const escaped = req.query.search.trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [{ name: { $regex: escaped, $options: 'i' } }, { company: { $regex: escaped, $options: 'i' } }];
    }
    const vendors = await Vendor.find(query).sort({ name: 1 }).limit(200).lean();
    res.json({ success: true, data: vendors });
  } catch (error) {
    sendError(res, error);
  }
};

exports.createVendor = async (req, res) => {
  try {
    const { name, company, category, phone, email, address, notes, status } = req.body;
    if (!name?.trim() || !phone?.trim()) throw fail('Vendor name and phone number are required.');
    const vndCompanyId = await getTenantCompanyId(req.user);
    const vendor = await Vendor.create({
      company: vndCompanyId || null, name: name.trim(), company, category, phone: phone.trim(), email, address, notes, status, createdBy: req.user._id });
    res.status(201).json({ success: true, data: vendor });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateVendor = async (req, res) => {
  try {
    const allowed = ['name', 'company', 'category', 'phone', 'email', 'address', 'notes', 'status'];
    const updates = Object.fromEntries(allowed.filter((key) => Object.hasOwn(req.body, key)).map((key) => [key, req.body[key]]));
    if (updates.name !== undefined && !updates.name.trim()) throw fail('Vendor name is required.');
    if (updates.phone !== undefined && !updates.phone.trim()) throw fail('Vendor phone number is required.');
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!vendor) throw fail('Vendor not found.', 404);
    res.json({ success: true, data: vendor });
  } catch (error) {
    sendError(res, error);
  }
};

exports.deleteVendor = async (req, res) => {
  try {
    const used = await Project.exists({ 'billItems.vendor': req.params.id });
    if (used) throw fail('This vendor is linked to an estimate. Mark it inactive instead.', 409);
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor) throw fail('Vendor not found.', 404);
    res.json({ success: true, message: 'Vendor deleted.' });
  } catch (error) {
    sendError(res, error);
  }
};
