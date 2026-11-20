const mongoose = require('mongoose');
const Patient = require('../models/HealthcarePatient');
const Appointment = require('../models/HealthcareAppointment');
const Employee = require('../models/Employee');
const { applyTenantScope, getTenantCompanyId } = require('../utils/tenantHelper');

const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const sendError = (res, error) => {
  if (error.code === 11000) {
    return res.status(409).json({ success: false, message: 'That patient code is already in use.' });
  }
  if ((error.statusCode || 500) >= 500) console.error('[Healthcare] Request failed:', error);
  const status = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
  return res.status(status).json({ success: false, message: error.message || 'Healthcare request failed.' });
};
const parseDate = (value, label, required = false) => {
  if (value === '' || value === null || value === undefined) {
    if (required) throw fail(`${label} is required.`);
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw fail(`${label} must be a valid date.`);
  return date;
};
const validId = (id, label) => {
  if (!mongoose.isValidObjectId(id)) throw fail(`Invalid ${label}.`);
};
const populatePatient = (query) => query
  .populate({ path: 'assignedProvider', select: 'employeeId designation user', populate: { path: 'user', select: 'name email' } });
const populateAppointment = (query) => query
  .populate('patient', 'name patientCode phone status')
  .populate({ path: 'provider', select: 'employeeId designation user', populate: { path: 'user', select: 'name email' } });
const verifyProvider = async (provider) => {
  if (provider && !await Employee.exists({ _id: provider, deletedAt: null, status: 'active' })) {
    throw fail('Selected provider is inactive or does not exist.');
  }
};

exports.getSummary = async (req, res) => {
  try {
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const patScope = await applyTenantScope({ status: 'active' }, req.user);
    const apptDayScope = await applyTenantScope({ scheduledAt: { $gte: dayStart, $lt: dayEnd }, status: { $ne: 'cancelled' } }, req.user);
    const apptUpScope = await applyTenantScope({ scheduledAt: { $gte: now }, status: { $in: ['scheduled', 'confirmed'] } }, req.user);
    const apptCompScope = await applyTenantScope({ status: 'completed' }, req.user);
    const [patients, appointmentsToday, upcoming, completed, recentAppointments] = await Promise.all([
      Patient.countDocuments(patScope),
      Appointment.countDocuments(apptDayScope),
      Appointment.countDocuments(apptUpScope),
      Appointment.countDocuments(apptCompScope),
      populateAppointment(Appointment.find(apptDayScope)
        .sort({ scheduledAt: 1 }).limit(6)).lean(),
    ]);
    res.json({ success: true, data: { patients, appointmentsToday, upcoming, completed, recentAppointments } });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getPatients = async (req, res) => {
  try {
    let query = {};
    if (req.query.status && ['active', 'inactive'].includes(req.query.status)) query.status = req.query.status;
    if (typeof req.query.search === 'string' && req.query.search.trim()) {
      const term = req.query.search.trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: term, $options: 'i' } },
        { patientCode: { $regex: term, $options: 'i' } },
        { phone: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
      ];
    }
    query = await applyTenantScope(query, req.user);
    const patients = await populatePatient(Patient.find(query).sort({ updatedAt: -1 }).limit(500)).lean();
    res.json({ success: true, data: patients });
  } catch (error) {
    sendError(res, error);
  }
};

exports.createPatient = async (req, res) => {
  try {
    const { name, patientCode, phone, email, dateOfBirth, gender, emergencyContactName, emergencyContactPhone, assignedProvider, administrativeNotes } = req.body;
    if (typeof name !== 'string' || !name.trim()) throw fail('Patient name is required.');
    if (typeof phone !== 'string' || !phone.trim()) throw fail('Patient phone number is required.');
    const birthDate = parseDate(dateOfBirth, 'Date of birth');
    if (birthDate && birthDate > new Date()) throw fail('Date of birth cannot be in the future.');
    await verifyProvider(assignedProvider);
    const hcCompanyId = await getTenantCompanyId(req.user);
    const patient = await Patient.create({
      company: hcCompanyId || null,
      name: name.trim(), patientCode: patientCode?.trim() || undefined, phone: phone.trim(), email,
      dateOfBirth: birthDate, gender, emergencyContactName, emergencyContactPhone,
      assignedProvider: assignedProvider || null, administrativeNotes, createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: await populatePatient(Patient.findById(patient._id)) });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updatePatient = async (req, res) => {
  try {
    validId(req.params.id, 'patient ID');
    const allowed = ['name', 'patientCode', 'phone', 'email', 'dateOfBirth', 'gender', 'emergencyContactName', 'emergencyContactPhone', 'assignedProvider', 'administrativeNotes', 'status'];
    const updates = Object.fromEntries(allowed.filter((key) => Object.hasOwn(req.body, key)).map((key) => [key, req.body[key]]));
    if (updates.name !== undefined && (typeof updates.name !== 'string' || !updates.name.trim())) throw fail('Patient name is required.');
    if (updates.phone !== undefined && (typeof updates.phone !== 'string' || !updates.phone.trim())) throw fail('Patient phone number is required.');
    if (updates.dateOfBirth !== undefined) {
      updates.dateOfBirth = parseDate(updates.dateOfBirth, 'Date of birth');
      if (updates.dateOfBirth && updates.dateOfBirth > new Date()) throw fail('Date of birth cannot be in the future.');
    }
    if (updates.assignedProvider) await verifyProvider(updates.assignedProvider);
    if (updates.name) updates.name = updates.name.trim();
    if (updates.phone) updates.phone = updates.phone.trim();
    if (updates.patientCode === '') delete updates.patientCode;
    if (updates.assignedProvider === '') updates.assignedProvider = null;
    const patient = await populatePatient(Patient.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }));
    if (!patient) throw fail('Patient not found.', 404);
    res.json({ success: true, data: patient });
  } catch (error) {
    sendError(res, error);
  }
};

exports.deletePatient = async (req, res) => {
  try {
    validId(req.params.id, 'patient ID');
    if (await Appointment.exists({ patient: req.params.id })) throw fail('This patient has appointment history. Mark the record inactive instead.', 409);
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) throw fail('Patient not found.', 404);
    res.json({ success: true, message: 'Patient record deleted.' });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getAppointments = async (req, res) => {
  try {
    const query = {};
    if (req.query.status && ['scheduled', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show'].includes(req.query.status)) {
      query.status = req.query.status;
    }
    if (req.query.from || req.query.to) {
      query.scheduledAt = {};
      if (req.query.from) query.scheduledAt.$gte = parseDate(req.query.from, 'Start date', true);
      if (req.query.to) {
        const to = parseDate(req.query.to, 'End date', true);
        to.setHours(23, 59, 59, 999);
        query.scheduledAt.$lte = to;
      }
    }
    if (req.query.patient && mongoose.isValidObjectId(req.query.patient)) query.patient = req.query.patient;
    query = await applyTenantScope(query, req.user);
    const appointments = await populateAppointment(Appointment.find(query).sort({ scheduledAt: 1 }).limit(500)).lean();
    res.json({ success: true, data: appointments });
  } catch (error) {
    sendError(res, error);
  }
};

exports.createAppointment = async (req, res) => {
  try {
    const { patient, provider, scheduledAt, durationMinutes, appointmentType, reason, administrativeNotes, status } = req.body;
    validId(patient, 'patient ID');
    if (!await Patient.exists({ _id: patient, status: 'active' })) throw fail('Selected patient is inactive or does not exist.');
    await verifyProvider(provider);
    const date = parseDate(scheduledAt, 'Appointment date and time', true);
    const apptCompanyId = await getTenantCompanyId(req.user);
    const appointment = await Appointment.create({
      company: apptCompanyId || null,
      patient, provider: provider || null, scheduledAt: date, durationMinutes: Number(durationMinutes) || 30,
      appointmentType, reason, administrativeNotes, status, createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: await populateAppointment(Appointment.findById(appointment._id)) });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    validId(req.params.id, 'appointment ID');
    const allowed = ['patient', 'provider', 'scheduledAt', 'durationMinutes', 'appointmentType', 'reason', 'administrativeNotes', 'status'];
    const updates = Object.fromEntries(allowed.filter((key) => Object.hasOwn(req.body, key)).map((key) => [key, req.body[key]]));
    if (updates.patient) {
      validId(updates.patient, 'patient ID');
      if (!await Patient.exists({ _id: updates.patient, status: 'active' })) throw fail('Selected patient is inactive or does not exist.');
    }
    if (updates.provider) await verifyProvider(updates.provider);
    if (updates.provider === '') updates.provider = null;
    if (updates.scheduledAt !== undefined) updates.scheduledAt = parseDate(updates.scheduledAt, 'Appointment date and time', true);
    const appointment = await populateAppointment(Appointment.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }));
    if (!appointment) throw fail('Appointment not found.', 404);
    res.json({ success: true, data: appointment });
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
