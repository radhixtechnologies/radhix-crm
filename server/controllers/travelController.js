const mongoose = require('mongoose');
const TravelPackage = require('../models/TravelPackage');
const TravelBooking = require('../models/TravelBooking');

const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const sendError = (res, error) => {
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0];
    const labels = { packageCode: 'Package code', bookingCode: 'Booking code' };
    return res.status(409).json({ success: false, message: `${labels[field] || 'This value'} is already in use.` });
  }
  if ((error.statusCode || 500) >= 500) console.error('[Travel] Request failed:', error);
  const status = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
  return res.status(status).json({ success: false, message: error.message || 'Travel request failed.' });
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
const populateBooking = (query) => query.populate('package', 'name packageCode destination durationDays pricePerPerson');
const normalizePaymentStatus = (totalAmount, amountPaid, requestedStatus) => {
  if (requestedStatus === 'refunded') return 'refunded';
  if (totalAmount > 0 && amountPaid >= totalAmount) return 'paid';
  if (amountPaid > 0) return 'partial';
  return 'unpaid';
};

exports.getSummary = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const pkgScope = await applyTenantScope({ status: 'active' }, req.user);
    const enqScope = await applyTenantScope({ status: { $in: ['inquiry', 'quoted'] } }, req.user);
    const confScope = await applyTenantScope({ status: 'confirmed' }, req.user);
    const upScope = await applyTenantScope({ status: 'confirmed', travelStartDate: { $gte: today } }, req.user);
    const [activePackages, enquiries, confirmedBookings, upcomingTrips, revenue, recentBookings] = await Promise.all([
      TravelPackage.countDocuments(pkgScope),
      TravelBooking.countDocuments(enqScope),
      TravelBooking.countDocuments(confScope),
      TravelBooking.countDocuments(upScope),
      TravelBooking.aggregate([{ $match: { status: { $in: ['confirmed', 'completed'] }, paymentStatus: { $ne: 'refunded' } } }, { $group: { _id: null, total: { $sum: '$amountPaid' } } }]),
      populateBooking(TravelBooking.find({ status: { $nin: ['cancelled', 'completed'] } }).sort({ updatedAt: -1 }).limit(6)).lean(),
    ]);
    res.json({
      success: true,
      data: {
        activePackages, enquiries, confirmedBookings, upcomingTrips,
        revenue: revenue[0]?.total || 0, recentBookings,
      },
    });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getPackages = async (req, res) => {
  try {
    let query = {};
    if (['active', 'inactive'].includes(req.query.status)) query.status = req.query.status;
    const term = safeSearch(req.query.search);
    if (term) query.$or = [
      { name: { $regex: term, $options: 'i' } },
      { packageCode: { $regex: term, $options: 'i' } },
      { destination: { $regex: term, $options: 'i' } },
    ];
    query = await applyTenantScope(query, req.user);
    res.json({ success: true, data: await TravelPackage.find(query).sort({ updatedAt: -1 }).limit(500).lean() });
  } catch (error) {
    sendError(res, error);
  }
};

exports.createPackage = async (req, res) => {
  try {
    const { name, packageCode, destination, category, durationDays, pricePerPerson, inclusions, description } = req.body;
    if (typeof name !== 'string' || !name.trim()) throw fail('Package name is required.');
    if (typeof destination !== 'string' || !destination.trim()) throw fail('Destination is required.');
    const travelPackage = await TravelPackage.create({
      name: name.trim(), packageCode: packageCode?.trim() || undefined,
      destination: destination.trim(), category, durationDays: Number(durationDays),
      pricePerPerson: Number(pricePerPerson), inclusions, description, createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: travelPackage });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updatePackage = async (req, res) => {
  try {
    validId(req.params.id, 'package ID');
    const allowed = ['name', 'packageCode', 'destination', 'category', 'durationDays', 'pricePerPerson', 'inclusions', 'description', 'status'];
    const updates = Object.fromEntries(allowed.filter((key) => Object.hasOwn(req.body, key)).map((key) => [key, req.body[key]]));
    if (updates.name !== undefined && (typeof updates.name !== 'string' || !updates.name.trim())) throw fail('Package name is required.');
    if (updates.destination !== undefined && (typeof updates.destination !== 'string' || !updates.destination.trim())) throw fail('Destination is required.');
    if (updates.name) updates.name = updates.name.trim();
    if (updates.destination) updates.destination = updates.destination.trim();
    if (updates.packageCode === '') delete updates.packageCode;
    const travelPackage = await TravelPackage.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!travelPackage) throw fail('Travel package not found.', 404);
    res.json({ success: true, data: travelPackage });
  } catch (error) {
    sendError(res, error);
  }
};

exports.deletePackage = async (req, res) => {
  try {
    validId(req.params.id, 'package ID');
    if (await TravelBooking.exists({ package: req.params.id })) throw fail('This package has booking history. Mark it inactive instead.', 409);
    const travelPackage = await TravelPackage.findByIdAndDelete(req.params.id);
    if (!travelPackage) throw fail('Travel package not found.', 404);
    res.json({ success: true, message: 'Travel package deleted.' });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getBookings = async (req, res) => {
  try {
    const query = {};
    if (['inquiry', 'quoted', 'confirmed', 'cancelled', 'completed'].includes(req.query.status)) query.status = req.query.status;
    if (['unpaid', 'partial', 'paid', 'refunded'].includes(req.query.paymentStatus)) query.paymentStatus = req.query.paymentStatus;
    const term = safeSearch(req.query.search);
    if (term) query.$or = [
      { bookingCode: { $regex: term, $options: 'i' } },
      { customerName: { $regex: term, $options: 'i' } },
      { phone: { $regex: term, $options: 'i' } },
      { destination: { $regex: term, $options: 'i' } },
    ];
    query = await applyTenantScope(query, req.user);
    const bookings = await populateBooking(TravelBooking.find(query).sort({ updatedAt: -1 }).limit(500)).lean();
    res.json({ success: true, data: bookings });
  } catch (error) {
    sendError(res, error);
  }
};

exports.createBooking = async (req, res) => {
  try {
    const { bookingCode, customerName, phone, email, package: packageId, destination, travelers, travelStartDate, travelEndDate, status, totalAmount, amountPaid, notes } = req.body;
    if (typeof customerName !== 'string' || !customerName.trim()) throw fail('Customer name is required.');
    if (typeof phone !== 'string' || !phone.trim()) throw fail('Customer phone number is required.');
    let selectedPackage = null;
    if (packageId) {
      validId(packageId, 'package ID');
      selectedPackage = await TravelPackage.findOne({ _id: packageId, status: 'active' });
      if (!selectedPackage) throw fail('Selected travel package is inactive or does not exist.');
    }
    const tripStart = parseDate(travelStartDate, 'Travel start date');
    const tripEnd = parseDate(travelEndDate, 'Travel end date');
    if (tripStart && tripEnd && tripEnd < tripStart) throw fail('Travel end date cannot be before the start date.');
    const finalDestination = (destination || selectedPackage?.destination || '').trim();
    if (!finalDestination) throw fail('Choose a package or enter a destination.');
    const count = Number(travelers) || 1;
    const total = totalAmount === '' || totalAmount === undefined
      ? (selectedPackage ? selectedPackage.pricePerPerson * count : 0)
      : Number(totalAmount);
    const paid = Number(amountPaid) || 0;
    if (paid > total) throw fail('Amount paid cannot exceed the booking total.');
    const bkgCompanyId = await getTenantCompanyId(req.user);
    const booking = await TravelBooking.create({
      company: bkgCompanyId || null,
      bookingCode: bookingCode?.trim() || undefined,
      customerName: customerName.trim(), phone: phone.trim(), email,
      package: selectedPackage?._id || null, destination: finalDestination, travelers: count,
      travelStartDate: tripStart, travelEndDate: tripEnd, status,
      totalAmount: total, amountPaid: paid,
      paymentStatus: normalizePaymentStatus(total, paid),
      notes, createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: await populateBooking(TravelBooking.findById(booking._id)) });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateBooking = async (req, res) => {
  try {
    validId(req.params.id, 'booking ID');
    const booking = await TravelBooking.findById(req.params.id);
    if (!booking) throw fail('Travel booking not found.', 404);
    const allowed = ['bookingCode', 'customerName', 'phone', 'email', 'package', 'destination', 'travelers', 'travelStartDate', 'travelEndDate', 'status', 'totalAmount', 'amountPaid', 'paymentStatus', 'notes'];
    const updates = Object.fromEntries(allowed.filter((key) => Object.hasOwn(req.body, key)).map((key) => [key, req.body[key]]));
    if (updates.customerName !== undefined && (typeof updates.customerName !== 'string' || !updates.customerName.trim())) throw fail('Customer name is required.');
    if (updates.phone !== undefined && (typeof updates.phone !== 'string' || !updates.phone.trim())) throw fail('Customer phone number is required.');
    if (updates.customerName) updates.customerName = updates.customerName.trim();
    if (updates.phone) updates.phone = updates.phone.trim();
    if (updates.package) {
      validId(updates.package, 'package ID');
      if (!await TravelPackage.exists({ _id: updates.package, status: 'active' })) throw fail('Selected travel package is inactive or does not exist.');
    }
    if (updates.package === '') updates.package = null;
    for (const field of ['travelStartDate', 'travelEndDate']) {
      if (updates[field] !== undefined) updates[field] = parseDate(updates[field], field === 'travelStartDate' ? 'Travel start date' : 'Travel end date');
    }
    const start = updates.travelStartDate !== undefined ? updates.travelStartDate : booking.travelStartDate;
    const end = updates.travelEndDate !== undefined ? updates.travelEndDate : booking.travelEndDate;
    if (start && end && end < start) throw fail('Travel end date cannot be before the start date.');
    const total = updates.totalAmount !== undefined ? Number(updates.totalAmount) : booking.totalAmount;
    let paid = updates.amountPaid !== undefined ? Number(updates.amountPaid) : booking.amountPaid;
    if (updates.paymentStatus === 'paid' && updates.amountPaid === undefined) {
      paid = total;
      updates.amountPaid = total;
    } else if (updates.paymentStatus === 'unpaid' && updates.amountPaid === undefined) {
      paid = 0;
      updates.amountPaid = 0;
    }
    if (paid > total) throw fail('Amount paid cannot exceed the booking total.');
    if (updates.destination !== undefined && (typeof updates.destination !== 'string' || !updates.destination.trim())) throw fail('Destination is required.');
    if (updates.destination) updates.destination = updates.destination.trim();
    updates.paymentStatus = normalizePaymentStatus(total, paid, updates.paymentStatus || booking.paymentStatus);
    const updated = await TravelBooking.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json({ success: true, data: await populateBooking(TravelBooking.findById(updated._id)) });
  } catch (error) {
    sendError(res, error);
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    validId(req.params.id, 'booking ID');
    const booking = await TravelBooking.findByIdAndDelete(req.params.id);
    if (!booking) throw fail('Travel booking not found.', 404);
    res.json({ success: true, message: 'Travel booking deleted.' });
  } catch (error) {
    sendError(res, error);
  }
};
