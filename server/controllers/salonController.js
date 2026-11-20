const mongoose = require('mongoose');
const Service = require('../models/SalonService');
const Staff = require('../models/SalonStaff');
const Client = require('../models/SalonClient');
const Appointment = require('../models/SalonAppointment');
const { applyTenantScope, getTenantCompanyId } = require('../utils/tenantHelper');
const Product = require('../models/SalonProduct');

const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const sendError = (res, error) => {
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0];
    return res.status(409).json({ success: false, message: field === 'phone' ? 'A client with this phone number already exists.' : 'This record conflicts with an existing record.' });
  }
  if ((error.statusCode || 500) >= 500) console.error('[Salon] Request failed:', error);
  const status = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
  return res.status(status).json({ success: false, message: error.message || 'Salon request failed.' });
};
const validId = (id, label) => {
  if (!mongoose.isValidObjectId(id)) throw fail(`Invalid ${label}.`);
};
const dateValue = (value, label, required = false) => {
  if (value === '' || value === null || value === undefined) {
    if (required) throw fail(`${label} is required.`);
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw fail(`${label} must be a valid date.`);
  return date;
};
const searchTerm = (value) => typeof value === 'string' && value.trim()
  ? value.trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  : '';
const populateAppointment = (query) => query
  .populate('client', 'name phone membership')
  .populate('staff', 'name specialties')
  .populate('service', 'name category');
const verifyAppointment = async ({ clientId, staffId, serviceId, scheduledAt, excludeId }) => {
  const [client, staff, service] = await Promise.all([
    Client.exists({ _id: clientId }),
    Staff.findOne({ _id: staffId, status: 'active' }).select('workingDays shiftStart shiftEnd specialties'),
    Service.findOne({ _id: serviceId, active: true }).select('name durationMinutes price category'),
  ]);
  if (!client) throw fail('Selected client does not exist.');
  if (!staff) throw fail('Selected staff member is inactive or does not exist.');
  if (!service) throw fail('Selected service is inactive or does not exist.');
  const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][scheduledAt.getDay()];
  if (staff.workingDays.length && !staff.workingDays.includes(dayName)) throw fail(`Selected staff member does not work on ${dayName}.`);
  const clock = `${String(scheduledAt.getHours()).padStart(2, '0')}:${String(scheduledAt.getMinutes()).padStart(2, '0')}`;
  const finish = new Date(scheduledAt.getTime() + service.durationMinutes * 60000);
  const endClock = `${String(finish.getHours()).padStart(2, '0')}:${String(finish.getMinutes()).padStart(2, '0')}`;
  if (clock < staff.shiftStart || endClock > staff.shiftEnd || finish.getDate() !== scheduledAt.getDate()) {
    throw fail('Appointment time falls outside the staff member’s working hours.');
  }
  const from = new Date(scheduledAt);
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 1);
  const existing = await Appointment.find({
    staff: staffId,
    scheduledAt: { $gte: from, $lt: to },
    status: { $nin: ['cancelled', 'no_show'] },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }).select('scheduledAt durationMinutes');
  const newEnd = scheduledAt.getTime() + service.durationMinutes * 60000;
  const conflict = existing.some((appointment) => {
    const start = appointment.scheduledAt.getTime();
    return scheduledAt.getTime() < start + appointment.durationMinutes * 60000 && newEnd > start;
  });
  if (conflict) throw fail('This staff member already has an appointment during that time.', 409);
  return service;
};

exports.getSummary = async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const [appointmentsToday, upcoming, clients, activeStaff, activeServices, lowStock, salesToday, recentAppointments] = await Promise.all([
      Appointment.countDocuments({ scheduledAt: { $gte: start, $lt: end }, status: { $nin: ['cancelled', 'no_show'] } }),
      Appointment.countDocuments(apptUpScope),
      Client.countDocuments(),
      Staff.countDocuments(stfScope),
      Service.countDocuments(srvScope),
      Product.countDocuments({ status: 'active', $expr: { $lte: ['$quantity', '$reorderLevel'] } }),
      Appointment.aggregate([
        { $match: { scheduledAt: { $gte: start, $lt: end }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$price' }, count: { $sum: 1 } } },
      ]),
      populateAppointment(Appointment.find({ scheduledAt: { $gte: start, $lt: end }, status: { $nin: ['cancelled', 'no_show'] } }).sort({ scheduledAt: 1 }).limit(8)).lean(),
    ]);
    res.json({ success: true, data: { appointmentsToday, upcoming, clients, activeStaff, activeServices, lowStock, salesToday: salesToday[0]?.total || 0, completedToday: salesToday[0]?.count || 0, recentAppointments } });
  } catch (error) {
    sendError(res, error);
  }
};

const list = (Model, fields, sort = { updatedAt: -1 }) => async (req, res) => {
  try {
    let query = {};
    const term = searchTerm(req.query.search);
    if (term) query.$or = fields.map((field) => ({ [field]: { $regex: term, $options: 'i' } }));
    if (req.query.status && ['active', 'inactive'].includes(req.query.status)) query.status = req.query.status;
    if (Model === Service && req.query.active === 'true') query.active = true;
    const data = await Model.find(query).sort(sort).limit(500).lean();
    res.json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
};

const create = (Model, requiredFields, numbers = []) => async (req, res) => {
  try {
    for (const field of requiredFields) {
      if (typeof req.body[field] !== 'string' || !req.body[field].trim()) throw fail(`${field} is required.`);
    }
    const data = { ...req.body, createdBy: req.user._id };
    for (const field of numbers) data[field] = Number(data[field]);
    if (data.name) data.name = data.name.trim();
    if (data.phone) data.phone = data.phone.trim();
    const record = await Model.create(data);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    sendError(res, error);
  }
};

const update = (Model, allowed) => async (req, res) => {
  try {
    validId(req.params.id, 'record ID');
    const updates = Object.fromEntries(allowed.filter((field) => Object.hasOwn(req.body, field)).map((field) => [field, req.body[field]]));
    const record = await Model.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!record) throw fail('Record not found.', 404);
    res.json({ success: true, data: record });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getServices = list(Service, ['name', 'category'], { category: 1, name: 1 });
exports.createService = create(Service, ['name', 'category'], ['durationMinutes', 'price']);
exports.updateService = update(Service, ['name', 'category', 'description', 'durationMinutes', 'price', 'active']);
exports.getStaff = list(Staff, ['name', 'phone', 'email']);
const validateShift = (start, end) => {
  if (start && end && start >= end) throw fail('Shift end must be later than shift start.');
};
exports.createStaff = async (req, res) => {
  try {
    if (typeof req.body.name !== 'string' || !req.body.name.trim() || typeof req.body.phone !== 'string' || !req.body.phone.trim()) {
      throw fail('Staff name and phone are required.');
    }
    validateShift(req.body.shiftStart, req.body.shiftEnd);
    const record = await Staff.create({ ...req.body, name: req.body.name.trim(), phone: req.body.phone.trim(), createdBy: req.user._id });
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    sendError(res, error);
  }
};
exports.updateStaff = async (req, res) => {
  try {
    validId(req.params.id, 'staff ID');
    const allowed = ['name', 'phone', 'email', 'specialties', 'workingDays', 'shiftStart', 'shiftEnd', 'status'];
    const updates = Object.fromEntries(allowed.filter((field) => Object.hasOwn(req.body, field)).map((field) => [field, req.body[field]]));
    const existing = await Staff.findById(req.params.id).select('shiftStart shiftEnd');
    if (!existing) throw fail('Staff member not found.', 404);
    validateShift(updates.shiftStart || existing.shiftStart, updates.shiftEnd || existing.shiftEnd);
    if (updates.name !== undefined && (typeof updates.name !== 'string' || !updates.name.trim())) throw fail('Staff name is required.');
    if (updates.phone !== undefined && (typeof updates.phone !== 'string' || !updates.phone.trim())) throw fail('Staff phone is required.');
    if (updates.name) updates.name = updates.name.trim();
    if (updates.phone) updates.phone = updates.phone.trim();
    const record = await Staff.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json({ success: true, data: record });
  } catch (error) {
    sendError(res, error);
  }
};
exports.getClients = list(Client, ['name', 'phone', 'email']);
exports.createClient = create(Client, ['name', 'phone']);
exports.updateClient = update(Client, ['name', 'phone', 'email', 'membership', 'membershipExpiresAt', 'notes']);
exports.getProducts = list(Product, ['name', 'category', 'supplier']);
exports.createProduct = create(Product, ['name', 'unit'], ['quantity', 'reorderLevel', 'unitCost']);
exports.updateProduct = update(Product, ['name', 'category', 'quantity', 'reorderLevel', 'unit', 'unitCost', 'supplier', 'status']);

exports.getAppointments = async (req, res) => {
  try {
    const query = {};
    if (req.query.status && ['booked', 'confirmed', 'checked_in', 'in_service', 'completed', 'cancelled', 'no_show'].includes(req.query.status)) query.status = req.query.status;
    if (req.query.from || req.query.to) {
      query.scheduledAt = {};
      if (req.query.from) query.scheduledAt.$gte = dateValue(req.query.from, 'Start date', true);
      if (req.query.to) {
        const to = dateValue(req.query.to, 'End date', true);
        to.setHours(23, 59, 59, 999);
        query.scheduledAt.$lte = to;
      }
    }
    if (req.query.staff && mongoose.isValidObjectId(req.query.staff)) query.staff = req.query.staff;
    const term = searchTerm(req.query.search);
    query = await applyTenantScope(query, req.user);
    const appointments = await populateAppointment(Appointment.find(query).sort({ scheduledAt: 1 }).limit(500)).lean();
    const filtered = term ? appointments.filter((item) => `${item.client?.name || ''} ${item.staff?.name || ''} ${item.serviceName}`.toLowerCase().includes(term.toLowerCase())) : appointments;
    res.json({ success: true, data: filtered });
  } catch (error) {
    sendError(res, error);
  }
};

exports.createAppointment = async (req, res) => {
  try {
    const scheduledAt = dateValue(req.body.scheduledAt, 'Appointment time', true);
    if (scheduledAt < new Date(Date.now() - 5 * 60000)) throw fail('Appointment time must be in the future.');
    validId(req.body.client, 'client ID');
    validId(req.body.staff, 'staff ID');
    validId(req.body.service, 'service ID');
    const service = await verifyAppointment({ clientId: req.body.client, staffId: req.body.staff, serviceId: req.body.service, scheduledAt });
    const appCompanyId = await getTenantCompanyId(req.user);
    const appointment = await Appointment.create({
      company: appCompanyId || null,
      client: req.body.client, staff: req.body.staff, service: service._id, serviceName: service.name,
      scheduledAt, durationMinutes: service.durationMinutes, price: service.price, notes: req.body.notes,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: await populateAppointment(Appointment.findById(appointment._id)) });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    validId(req.params.id, 'appointment ID');
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) throw fail('Appointment not found.', 404);
    const allowed = ['client', 'staff', 'service', 'scheduledAt', 'status', 'paymentStatus', 'notes'];
    const updates = Object.fromEntries(allowed.filter((field) => Object.hasOwn(req.body, field)).map((field) => [field, req.body[field]]));
    if (updates.status && appointment.status === 'completed' && updates.status !== 'completed') throw fail('Completed appointments cannot be moved to an earlier stage.');
    if (updates.scheduledAt !== undefined) updates.scheduledAt = dateValue(updates.scheduledAt, 'Appointment time', true);
    const client = updates.client || appointment.client;
    const staff = updates.staff || appointment.staff;
    const serviceId = updates.service || appointment.service;
    const scheduledAt = updates.scheduledAt || appointment.scheduledAt;
    if (['client', 'staff', 'service', 'scheduledAt'].some((field) => updates[field] !== undefined)) {
      validId(client, 'client ID');
      validId(staff, 'staff ID');
      validId(serviceId, 'service ID');
      if (scheduledAt < new Date(Date.now() - 5 * 60000)) throw fail('Appointment time must be in the future.');
      const service = await verifyAppointment({ clientId: client, staffId: staff, serviceId, scheduledAt, excludeId: appointment._id });
      updates.serviceName = service.name;
      updates.durationMinutes = service.durationMinutes;
      updates.price = service.price;
    }
    const markingComplete = updates.status === 'completed' && appointment.status !== 'completed';
    const updated = markingComplete
      ? await Appointment.findOneAndUpdate(
        { _id: req.params.id, status: { $ne: 'completed' } },
        updates,
        { new: true, runValidators: true },
      )
      : await Appointment.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!updated) throw fail('Appointment was completed by another update. Refresh and try again.', 409);
    if (markingComplete) await Client.updateOne({ _id: updated.client }, { $inc: { visitCount: 1, lifetimeSpend: updated.price } });
    res.json({ success: true, data: await populateAppointment(Appointment.findById(updated._id)) });
  } catch (error) {
    sendError(res, error);
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    validId(req.params.id, 'appointment ID');
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) throw fail('Appointment not found.', 404);
    res.json({ success: true, message: 'Appointment deleted.' });
  } catch (error) {
    sendError(res, error);
  }
};
