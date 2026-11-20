const mongoose = require('mongoose');
const Customer = require('../models/AutomotiveCustomer');
const Vehicle = require('../models/AutomotiveVehicle');
const ServiceJob = require('../models/AutomotiveServiceJob');
const Part = require('../models/AutomotivePart');
const Employee = require('../models/Employee');
const { applyTenantScope, getTenantCompanyId } = require('../utils/tenantHelper');

const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const sendError = (res, error) => {
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0];
    return res.status(409).json({ success: false, message: field === 'registrationNumber' ? 'That vehicle registration is already in use.' : `That ${field || 'record'} already exists.` });
  }
  if ((error.statusCode || 500) >= 500) console.error('[Automotive] Request failed:', error);
  const status = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
  return res.status(status).json({ success: false, message: error.message || 'Automotive request failed.' });
};
const validId = (id, label) => {
  if (!mongoose.isValidObjectId(id)) throw fail(`Invalid ${label}.`);
};
const searchTerm = (value) => typeof value === 'string' && value.trim()
  ? value.trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  : '';
const parseDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw fail('Scheduled date and time must be valid.');
  return date;
};
const populateVehicle = (query) => query.populate('customer', 'name phone email');
const populateJob = (query) => query
  .populate('customer', 'name phone')
  .populate('vehicle', 'registrationNumber make model year')
  .populate({ path: 'assignedTechnician', select: 'employeeId designation user', populate: { path: 'user', select: 'name email' } });
const verifyTechnician = async (id) => {
  if (id && !await Employee.exists({ _id: id, deletedAt: null, status: 'active' })) {
    throw fail('Selected technician is inactive or does not exist.');
  }
};

exports.getSummary = async (req, res) => {
  try {
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const custScope = await applyTenantScope({ status: 'active' }, req.user);
    const vehScope = await applyTenantScope({ status: { $ne: 'inactive' } }, req.user);
    const jobDayScope = await applyTenantScope({ scheduledAt: { $gte: dayStart, $lt: dayEnd }, status: { $ne: 'cancelled' } }, req.user);
    const jobOpenScope = await applyTenantScope({ status: { $in: ['booked', 'checked_in', 'in_progress', 'waiting_parts', 'ready'] } }, req.user);
    const partScope = await applyTenantScope({ status: 'active', $expr: { $lte: ['$quantity', '$reorderLevel'] } }, req.user);
    const [customers, vehicles, jobsToday, openJobs, lowStockParts, recentJobs] = await Promise.all([
      Customer.countDocuments(custScope),
      Vehicle.countDocuments(vehScope),
      ServiceJob.countDocuments(jobDayScope),
      ServiceJob.countDocuments(jobOpenScope),
      Part.countDocuments(partScope),
      populateJob(ServiceJob.find(jobOpenScope).sort({ scheduledAt: 1 }).limit(6)).lean(),
    ]);
    res.json({ success: true, data: { customers, vehicles, jobsToday, openJobs, lowStockParts, recentJobs } });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getCustomers = async (req, res) => {
  try {
    let query = {};
    if (['active', 'inactive'].includes(req.query.status)) query.status = req.query.status;
    const term = searchTerm(req.query.search);
    if (term) query.$or = [{ name: { $regex: term, $options: 'i' } }, { phone: { $regex: term, $options: 'i' } }, { email: { $regex: term, $options: 'i' } }];
    query = await applyTenantScope(query, req.user);
    res.json({ success: true, data: await Customer.find(query).sort({ updatedAt: -1 }).limit(500).lean() });
  } catch (error) {
    sendError(res, error);
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const { name, phone, email, address, notes } = req.body;
    if (typeof name !== 'string' || !name.trim() || typeof phone !== 'string' || !phone.trim()) {
      throw fail('Customer name and phone number are required.');
    }
    const autoCompanyId = await getTenantCompanyId(req.user);
    const customer = await Customer.create({
      company: autoCompanyId || null, name: name.trim(), phone: phone.trim(), email, address, notes, createdBy: req.user._id });
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    validId(req.params.id, 'customer ID');
    const allowed = ['name', 'phone', 'email', 'address', 'notes', 'status'];
    const updates = Object.fromEntries(allowed.filter((key) => Object.hasOwn(req.body, key)).map((key) => [key, req.body[key]]));
    if (updates.name !== undefined && (typeof updates.name !== 'string' || !updates.name.trim())) throw fail('Customer name is required.');
    if (updates.phone !== undefined && (typeof updates.phone !== 'string' || !updates.phone.trim())) throw fail('Customer phone number is required.');
    if (updates.name) updates.name = updates.name.trim();
    if (updates.phone) updates.phone = updates.phone.trim();
    const customer = await Customer.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!customer) throw fail('Customer not found.', 404);
    res.json({ success: true, data: customer });
  } catch (error) {
    sendError(res, error);
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    validId(req.params.id, 'customer ID');
    if (await Vehicle.exists({ customer: req.params.id })) throw fail('This customer has vehicle records. Mark the customer inactive instead.', 409);
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) throw fail('Customer not found.', 404);
    res.json({ success: true, message: 'Customer deleted.' });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getVehicles = async (req, res) => {
  try {
    const query = {};
    if (['active', 'in_service', 'inactive'].includes(req.query.status)) query.status = req.query.status;
    if (req.query.customer && mongoose.isValidObjectId(req.query.customer)) query.customer = req.query.customer;
    const term = searchTerm(req.query.search);
    if (term) query.$or = [
      { registrationNumber: { $regex: term, $options: 'i' } },
      { make: { $regex: term, $options: 'i' } },
      { model: { $regex: term, $options: 'i' } },
    ];
    const data = await populateVehicle(Vehicle.find(query).sort({ updatedAt: -1 }).limit(500)).lean();
    res.json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
};

exports.createVehicle = async (req, res) => {
  try {
    const { customer, registrationNumber, make, model } = req.body;
    validId(customer, 'customer ID');
    if (!await Customer.exists({ _id: customer, status: 'active' })) throw fail('Selected customer is inactive or does not exist.');
    if (!registrationNumber?.trim() || !make?.trim() || !model?.trim()) throw fail('Registration number, make, and model are required.');
    const vehCompanyId = await getTenantCompanyId(req.user);
    const vehicle = await Vehicle.create({
      company: vehCompanyId || null, ...req.body, registrationNumber: registrationNumber.trim(), make: make.trim(), model: model.trim(), createdBy: req.user._id });
    res.status(201).json({ success: true, data: await populateVehicle(Vehicle.findById(vehicle._id)) });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateVehicle = async (req, res) => {
  try {
    validId(req.params.id, 'vehicle ID');
    const allowed = ['customer', 'registrationNumber', 'make', 'model', 'year', 'vin', 'fuelType', 'odometerKm', 'status', 'notes'];
    const updates = Object.fromEntries(allowed.filter((key) => Object.hasOwn(req.body, key)).map((key) => [key, req.body[key]]));
    if (updates.customer) {
      validId(updates.customer, 'customer ID');
      if (!await Customer.exists({ _id: updates.customer, status: 'active' })) throw fail('Selected customer is inactive or does not exist.');
    }
    for (const key of ['registrationNumber', 'make', 'model']) {
      if (updates[key] !== undefined && (typeof updates[key] !== 'string' || !updates[key].trim())) throw fail(`${titleCase(key)} is required.`);
    }
    if (updates.registrationNumber) updates.registrationNumber = updates.registrationNumber.trim().toUpperCase();
    if (updates.make) updates.make = updates.make.trim();
    if (updates.model) updates.model = updates.model.trim();
    const vehicle = await populateVehicle(Vehicle.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }));
    if (!vehicle) throw fail('Vehicle not found.', 404);
    res.json({ success: true, data: vehicle });
  } catch (error) {
    sendError(res, error);
  }
};

exports.deleteVehicle = async (req, res) => {
  try {
    validId(req.params.id, 'vehicle ID');
    if (await ServiceJob.exists({ vehicle: req.params.id })) throw fail('This vehicle has service history. Mark it inactive instead.', 409);
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) throw fail('Vehicle not found.', 404);
    res.json({ success: true, message: 'Vehicle deleted.' });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getJobs = async (req, res) => {
  try {
    const query = {};
    if (['booked', 'checked_in', 'in_progress', 'waiting_parts', 'ready', 'completed', 'cancelled'].includes(req.query.status)) query.status = req.query.status;
    const term = searchTerm(req.query.search);
    if (term) {
      const matchingVehicles = await Vehicle.find({ registrationNumber: { $regex: term, $options: 'i' } }).distinct('_id');
      const matchingCustomers = await Customer.find({ name: { $regex: term, $options: 'i' } }).distinct('_id');
      query.$or = [
        { jobNumber: { $regex: term, $options: 'i' } },
        { vehicle: { $in: matchingVehicles } },
        { customer: { $in: matchingCustomers } },
      ];
    }
    query = await applyTenantScope(query, req.user);
    const jobs = await populateJob(ServiceJob.find(query).sort({ scheduledAt: -1 }).limit(500)).lean();
    res.json({ success: true, data: jobs });
  } catch (error) {
    sendError(res, error);
  }
};

exports.createJob = async (req, res) => {
  try {
    const { customer, vehicle, description, scheduledAt, assignedTechnician } = req.body;
    validId(customer, 'customer ID');
    validId(vehicle, 'vehicle ID');
    const vehicleRecord = await Vehicle.findOne({ _id: vehicle, customer, status: { $ne: 'inactive' } });
    if (!vehicleRecord) throw fail('Selected vehicle does not belong to this active customer.');
    if (!description?.trim()) throw fail('Service description is required.');
    await verifyTechnician(assignedTechnician);
    const jobCompanyId = await getTenantCompanyId(req.user);
    const job = await ServiceJob.create({
      company: jobCompanyId || null,
      ...req.body,
      description: description.trim(),
      scheduledAt: parseDate(scheduledAt),
      assignedTechnician: assignedTechnician || null,
      createdBy: req.user._id,
    });
    if (job.status === 'checked_in' || job.status === 'in_progress' || job.status === 'waiting_parts') {
      await Vehicle.updateOne({ _id: vehicle }, { status: 'in_service' });
    }
    res.status(201).json({ success: true, data: await populateJob(ServiceJob.findById(job._id)) });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateJob = async (req, res) => {
  try {
    validId(req.params.id, 'service job ID');
    const allowed = ['jobNumber', 'customer', 'vehicle', 'serviceType', 'description', 'status', 'scheduledAt', 'completedAt', 'odometerKm', 'laborCost', 'partsCost', 'assignedTechnician', 'notes'];
    const updates = Object.fromEntries(allowed.filter((key) => Object.hasOwn(req.body, key)).map((key) => [key, req.body[key]]));
    const current = await ServiceJob.findById(req.params.id);
    if (!current) throw fail('Service job not found.', 404);
    const customer = updates.customer || current.customer;
    const vehicle = updates.vehicle || current.vehicle;
    if (updates.customer || updates.vehicle) {
      validId(customer, 'customer ID');
      validId(vehicle, 'vehicle ID');
      if (!await Vehicle.exists({ _id: vehicle, customer, status: { $ne: 'inactive' } })) throw fail('Selected vehicle does not belong to this active customer.');
    }
    if (updates.description !== undefined && !updates.description.trim()) throw fail('Service description is required.');
    if (updates.scheduledAt !== undefined) updates.scheduledAt = parseDate(updates.scheduledAt);
    if (updates.completedAt !== undefined && updates.completedAt) updates.completedAt = parseDate(updates.completedAt);
    if (updates.assignedTechnician) await verifyTechnician(updates.assignedTechnician);
    if (updates.assignedTechnician === '') updates.assignedTechnician = null;
    const job = await ServiceJob.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    const inService = await ServiceJob.exists({
      vehicle: job.vehicle,
      _id: { $ne: job._id },
      status: { $in: ['checked_in', 'in_progress', 'waiting_parts'] },
    }) || ['checked_in', 'in_progress', 'waiting_parts'].includes(job.status);
    await Vehicle.updateOne({ _id: job.vehicle }, { status: inService ? 'in_service' : 'active' });
    res.json({ success: true, data: await populateJob(ServiceJob.findById(job._id)) });
  } catch (error) {
    sendError(res, error);
  }
};

exports.deleteJob = async (req, res) => {
  try {
    validId(req.params.id, 'service job ID');
    const job = await ServiceJob.findByIdAndDelete(req.params.id);
    if (!job) throw fail('Service job not found.', 404);
    const stillInService = await ServiceJob.exists({ vehicle: job.vehicle, status: { $in: ['checked_in', 'in_progress', 'waiting_parts'] } });
    if (!stillInService) await Vehicle.updateOne({ _id: job.vehicle, status: 'in_service' }, { status: 'active' });
    res.json({ success: true, message: 'Service job deleted.' });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getParts = async (req, res) => {
  try {
    const query = {};
    if (['active', 'inactive'].includes(req.query.status)) query.status = req.query.status;
    const term = searchTerm(req.query.search);
    if (term) query.$or = [{ name: { $regex: term, $options: 'i' } }, { sku: { $regex: term, $options: 'i' } }, { supplier: { $regex: term, $options: 'i' } }];
    if (req.query.lowStock === 'true') query.$expr = { $lte: ['$quantity', '$reorderLevel'] };
    query = await applyTenantScope(query, req.user);
    res.json({ success: true, data: await Part.find(query).sort({ name: 1 }).limit(500).lean() });
  } catch (error) {
    sendError(res, error);
  }
};

exports.createPart = async (req, res) => {
  try {
    if (typeof req.body.name !== 'string' || !req.body.name.trim()) throw fail('Part name is required.');
    const partCompanyId = await getTenantCompanyId(req.user);
    const part = await Part.create({
      company: partCompanyId || null, ...req.body, name: req.body.name.trim(), createdBy: req.user._id });
    res.status(201).json({ success: true, data: part });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updatePart = async (req, res) => {
  try {
    validId(req.params.id, 'part ID');
    const allowed = ['name', 'sku', 'category', 'quantity', 'reorderLevel', 'unitCost', 'supplier', 'status'];
    const updates = Object.fromEntries(allowed.filter((key) => Object.hasOwn(req.body, key)).map((key) => [key, req.body[key]]));
    if (updates.name !== undefined && (typeof updates.name !== 'string' || !updates.name.trim())) throw fail('Part name is required.');
    if (updates.name) updates.name = updates.name.trim();
    if (updates.sku === '') delete updates.sku;
    const part = await Part.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!part) throw fail('Part not found.', 404);
    res.json({ success: true, data: part });
  } catch (error) {
    sendError(res, error);
  }
};

exports.deletePart = async (req, res) => {
  try {
    validId(req.params.id, 'part ID');
    const part = await Part.findByIdAndDelete(req.params.id);
    if (!part) throw fail('Part not found.', 404);
    res.json({ success: true, message: 'Part deleted.' });
  } catch (error) {
    sendError(res, error);
  }
};

function titleCase(value) {
  return String(value).replace(/\b\w/g, (character) => character.toUpperCase());
}
