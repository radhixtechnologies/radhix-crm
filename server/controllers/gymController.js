const mongoose = require('mongoose');
const Member = require('../models/GymMember');
const Trainer = require('../models/GymTrainer');
const FitnessClass = require('../models/GymClass');
const CheckIn = require('../models/GymCheckIn');
const { applyTenantScope, getTenantCompanyId } = require('../utils/tenantHelper');

const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const sendError = (res, error) => {
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0];
    const messages = {
      phone: 'A member with this phone number already exists.',
      memberCode: 'That member code is already in use.',
      member: 'Member is already checked in.',
    };
    return res.status(409).json({ success: false, message: messages[field] || 'This record conflicts with an existing record.' });
  }
  if ((error.statusCode || 500) >= 500) console.error('[Gym] Request failed:', error);
  const status = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
  return res.status(status).json({ success: false, message: error.message || 'Gym request failed.' });
};
const validId = (id, label) => {
  if (!mongoose.isValidObjectId(id)) throw fail(`Invalid ${label}.`);
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
const safeSearch = (value) => typeof value === 'string' && value.trim()
  ? value.trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  : '';
const populateClass = (query) => query.populate('trainer', 'name specialties').populate('enrolledMembers', 'name memberCode phone');

exports.getSummary = async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const [activeMembers, expiringMembers, trainers, scheduledClasses, checkInsToday, recentClasses, attendance] = await Promise.all([
      Member.countDocuments({ membershipStatus: 'active', membershipEnd: { $gte: now } }),
      Member.countDocuments({ membershipStatus: 'active', membershipEnd: { $gte: now, $lte: new Date(now.getTime() + 30 * 86400000) } }),
      Trainer.countDocuments(trnScope),
      FitnessClass.countDocuments({ startsAt: { $gte: start, $lt: end }, status: { $in: ['scheduled', 'in_progress'] } }),
      CheckIn.countDocuments({ checkedInAt: { $gte: start, $lt: end } }),
      populateClass(FitnessClass.find({ startsAt: { $gte: start, $lt: end }, status: { $ne: 'cancelled' } }).sort({ startsAt: 1 }).limit(6)).lean(),
      CheckIn.find({ checkedInAt: { $gte: start, $lt: end } }).populate('member', 'name memberCode').sort({ checkedInAt: -1 }).limit(6).lean(),
    ]);
    res.json({ success: true, data: { activeMembers, expiringMembers, trainers, scheduledClasses, checkInsToday, recentClasses, recentCheckIns: attendance } });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getMembers = async (req, res) => {
  try {
    let query = {};
    if (['active', 'expired', 'paused', 'cancelled'].includes(req.query.status)) query.membershipStatus = req.query.status;
    const term = safeSearch(req.query.search);
    if (term) query.$or = ['name', 'memberCode', 'phone', 'email'].map((field) => ({ [field]: { $regex: term, $options: 'i' } }));
    query = await applyTenantScope(query, req.user);
    const members = await Member.find(query).sort({ membershipEnd: 1 }).limit(500).lean();
    res.json({ success: true, data: members });
  } catch (error) {
    sendError(res, error);
  }
};

exports.createMember = async (req, res) => {
  try {
    const { name, phone, membershipEnd } = req.body;
    if (typeof name !== 'string' || !name.trim() || typeof phone !== 'string' || !phone.trim()) throw fail('Member name and phone are required.');
    const start = parseDate(req.body.membershipStart, 'Membership start') || new Date();
    const end = parseDate(membershipEnd, 'Membership end', true);
    if (end <= start) throw fail('Membership end must be later than the start date.');
    const gymCompanyId = await getTenantCompanyId(req.user);
    const member = await Member.create({
      company: gymCompanyId || null,
      ...req.body, name: name.trim(), phone: phone.trim(), membershipStart: start, membershipEnd: end,
      memberCode: req.body.memberCode?.trim() || undefined, createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: member });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateMember = async (req, res) => {
  try {
    validId(req.params.id, 'member ID');
    const allowed = ['name', 'memberCode', 'phone', 'email', 'plan', 'membershipStart', 'membershipEnd', 'membershipStatus', 'emergencyContact', 'notes'];
    const updates = Object.fromEntries(allowed.filter((key) => Object.hasOwn(req.body, key)).map((key) => [key, req.body[key]]));
    if (updates.name !== undefined && (typeof updates.name !== 'string' || !updates.name.trim())) throw fail('Member name is required.');
    if (updates.phone !== undefined && (typeof updates.phone !== 'string' || !updates.phone.trim())) throw fail('Member phone is required.');
    if (updates.membershipStart !== undefined) updates.membershipStart = parseDate(updates.membershipStart, 'Membership start', true);
    if (updates.membershipEnd !== undefined) updates.membershipEnd = parseDate(updates.membershipEnd, 'Membership end', true);
    const member = await Member.findById(req.params.id);
    if (!member) throw fail('Member not found.', 404);
    if ((updates.membershipEnd || member.membershipEnd) <= (updates.membershipStart || member.membershipStart)) throw fail('Membership end must be later than the start date.');
    if (updates.name) updates.name = updates.name.trim();
    if (updates.phone) updates.phone = updates.phone.trim();
    if (updates.memberCode === '') updates.memberCode = undefined;
    const updated = await Member.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getTrainers = async (req, res) => {
  try {
    const query = {};
    if (['active', 'inactive'].includes(req.query.status)) query.status = req.query.status;
    const term = safeSearch(req.query.search);
    if (term) query.$or = ['name', 'phone', 'email'].map((field) => ({ [field]: { $regex: term, $options: 'i' } }));
    query = await applyTenantScope(query, req.user);
    res.json({ success: true, data: await Trainer.find(query).sort({ name: 1 }).limit(300).lean() });
  } catch (error) {
    sendError(res, error);
  }
};

exports.createTrainer = async (req, res) => {
  try {
    if (typeof req.body.name !== 'string' || !req.body.name.trim() || typeof req.body.phone !== 'string' || !req.body.phone.trim()) throw fail('Trainer name and phone are required.');
    const trnCompanyId = await getTenantCompanyId(req.user);
    const trainer = await Trainer.create({
      company: trnCompanyId || null, ...req.body, name: req.body.name.trim(), phone: req.body.phone.trim(), createdBy: req.user._id });
    res.status(201).json({ success: true, data: trainer });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateTrainer = async (req, res) => {
  try {
    validId(req.params.id, 'trainer ID');
    const allowed = ['name', 'phone', 'email', 'specialties', 'status'];
    const updates = Object.fromEntries(allowed.filter((key) => Object.hasOwn(req.body, key)).map((key) => [key, req.body[key]]));
    const trainer = await Trainer.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!trainer) throw fail('Trainer not found.', 404);
    res.json({ success: true, data: trainer });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getClasses = async (req, res) => {
  try {
    const query = {};
    if (['scheduled', 'in_progress', 'completed', 'cancelled'].includes(req.query.status)) query.status = req.query.status;
    if (req.query.from || req.query.to) {
      query.startsAt = {};
      if (req.query.from) query.startsAt.$gte = parseDate(req.query.from, 'Start date', true);
      if (req.query.to) {
        const to = parseDate(req.query.to, 'End date', true);
        to.setHours(23, 59, 59, 999);
        query.startsAt.$lte = to;
      }
    }
    const term = safeSearch(req.query.search);
    const items = await populateClass(FitnessClass.find(query).sort({ startsAt: 1 }).limit(500)).lean();
    res.json({ success: true, data: term ? items.filter((item) => `${item.name} ${item.category} ${item.trainer?.name || ''}`.toLowerCase().includes(term.toLowerCase())) : items });
  } catch (error) {
    sendError(res, error);
  }
};

exports.createClass = async (req, res) => {
  try {
    if (typeof req.body.name !== 'string' || !req.body.name.trim()) throw fail('Class name is required.');
    validId(req.body.trainer, 'trainer ID');
    if (!await Trainer.exists({ _id: req.body.trainer, status: 'active' })) throw fail('Selected trainer is inactive or does not exist.');
    const startsAt = parseDate(req.body.startsAt, 'Class start', true);
    if (startsAt < new Date(Date.now() - 5 * 60000)) throw fail('Class start must be in the future.');
    const fitnessClass = await FitnessClass.create({ ...req.body, name: req.body.name.trim(), startsAt, createdBy: req.user._id });
    res.status(201).json({ success: true, data: await populateClass(FitnessClass.findById(fitnessClass._id)) });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateClass = async (req, res) => {
  try {
    validId(req.params.id, 'class ID');
    const updates = Object.fromEntries(['name', 'category', 'trainer', 'startsAt', 'durationMinutes', 'capacity', 'status', 'notes']
      .filter((key) => Object.hasOwn(req.body, key)).map((key) => [key, req.body[key]]));
    if (updates.startsAt !== undefined) updates.startsAt = parseDate(updates.startsAt, 'Class start', true);
    if (updates.trainer) {
      validId(updates.trainer, 'trainer ID');
      if (!await Trainer.exists({ _id: updates.trainer, status: 'active' })) throw fail('Selected trainer is inactive or does not exist.');
    }
    const existing = await FitnessClass.findById(req.params.id);
    if (!existing) throw fail('Class not found.', 404);
    if (updates.capacity !== undefined && Number(updates.capacity) < existing.enrolledMembers.length) throw fail('Capacity cannot be less than current enrollment.');
    const fitnessClass = await FitnessClass.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json({ success: true, data: await populateClass(FitnessClass.findById(fitnessClass._id)) });
  } catch (error) {
    sendError(res, error);
  }
};

exports.enrollMember = async (req, res) => {
  try {
    validId(req.params.id, 'class ID');
    validId(req.body.member, 'member ID');
    const member = await Member.findOne({ _id: req.body.member, membershipStatus: 'active', membershipEnd: { $gte: new Date() } });
    if (!member) throw fail('Member has no active membership.', 409);
    const fitnessClass = await FitnessClass.findOne({ _id: req.params.id, status: 'scheduled', startsAt: { $gte: new Date() } });
    if (!fitnessClass) throw fail('Class is not available for enrollment.', 409);
    if (fitnessClass.enrolledMembers.some((id) => String(id) === String(member._id))) throw fail('Member is already enrolled in this class.', 409);
    if (fitnessClass.enrolledMembers.length >= fitnessClass.capacity) throw fail('Class is full.', 409);
    const updated = await FitnessClass.findOneAndUpdate(
      { _id: fitnessClass._id, status: 'scheduled', enrolledMembers: { $ne: member._id }, $expr: { $lt: [{ $size: '$enrolledMembers' }, '$capacity'] } },
      { $addToSet: { enrolledMembers: member._id } },
      { new: true },
    );
    if (!updated) throw fail('Class just filled or enrollment changed. Refresh and try again.', 409);
    res.json({ success: true, data: await populateClass(FitnessClass.findById(updated._id)) });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getCheckIns = async (req, res) => {
  try {
    const from = req.query.from ? parseDate(req.query.from, 'Start date', true) : new Date(new Date().setHours(0, 0, 0, 0));
    const to = req.query.to ? parseDate(req.query.to, 'End date', true) : new Date();
    if (!req.query.to) to.setHours(23, 59, 59, 999);
    res.json({ success: true, data: await CheckIn.find({ checkedInAt: { $gte: from, $lte: to } }).populate('member', 'name memberCode phone membershipStatus membershipEnd').sort({ checkedInAt: -1 }).limit(500).lean() });
  } catch (error) {
    sendError(res, error);
  }
};

exports.createCheckIn = async (req, res) => {
  try {
    validId(req.body.member, 'member ID');
    const member = await Member.findOne({ _id: req.body.member, membershipStatus: 'active', membershipEnd: { $gte: new Date() } });
    if (!member) throw fail('Member does not have an active membership.', 409);
    const open = await CheckIn.exists({ member: member._id, checkedOutAt: null });
    if (open) throw fail('Member is already checked in.', 409);
    const chkCompanyId = await getTenantCompanyId(req.user);
    const checkIn = await CheckIn.create({
      company: chkCompanyId || null, member: member._id, createdBy: req.user._id });
    res.status(201).json({ success: true, data: await CheckIn.findById(checkIn._id).populate('member', 'name memberCode phone membershipStatus') });
  } catch (error) {
    sendError(res, error);
  }
};

exports.checkOut = async (req, res) => {
  try {
    validId(req.params.id, 'check-in ID');
    const checkIn = await CheckIn.findOneAndUpdate({ _id: req.params.id, checkedOutAt: null }, { checkedOutAt: new Date() }, { new: true })
      .populate('member', 'name memberCode phone');
    if (!checkIn) throw fail('Open check-in not found.', 404);
    res.json({ success: true, data: checkIn });
  } catch (error) {
    sendError(res, error);
  }
};
