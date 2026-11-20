const mongoose = require('mongoose');
const Property = require('../models/RealEstateProperty');
const SiteVisit = require('../models/RealEstateSiteVisit');
const Offer = require('../models/RealEstateOffer');
const Booking = require('../models/RealEstateBooking');
const Lead = require('../models/Lead');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');
const { sendEmail } = require('../utils/emailService');
const { applyTenantScope, getTenantCompanyId } = require('../utils/tenantHelper');
const path = require('path');
const fs = require('fs');

const sendError = (res, error) => {
  if (error.code === 11000) {
    const duplicatePropertyCode = error.keyPattern?.propertyCode;
    return res.status(409).json({
      success: false,
      message: duplicatePropertyCode ? 'A property with this code already exists.' : 'This record conflicts with an existing active record.',
    });
  }
  return res.status(error.statusCode || 500).json({ success: false, message: error.message });
};
const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

const populateProperty = (query) => query.populate('assignedAgent', 'employeeId designation user')
  .populate({ path: 'assignedAgent', populate: { path: 'user', select: 'name email' } });

exports.getSummary = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [properties, available, reserved, buyers, visitsToday, upcomingVisits, inventoryValue] = await Promise.all([
      Property.countDocuments(),
      Property.countDocuments({ status: 'available' }),
      Property.countDocuments({ status: 'reserved' }),
      Lead.countDocuments({ industry: 'Real Estate', isDeleted: { $ne: true } }),
      SiteVisit.countDocuments({ status: 'scheduled', visitDate: { $gte: today, $lt: tomorrow } }),
      SiteVisit.countDocuments({ status: 'scheduled', visitDate: { $gte: tomorrow } }),
      Property.aggregate([{ $match: { status: 'available' } }, { $group: { _id: null, total: { $sum: '$price' } } }]),
    ]);
    res.json({
      success: true,
      data: { properties, available, reserved, buyers, visitsToday, upcomingVisits, inventoryValue: inventoryValue[0]?.total || 0 },
    });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getProperties = async (req, res) => {
  try {
    const { page = 1, limit = 12, search, status, listingType, propertyType, city } = req.query;
    let query = {};
    if (status) query.status = status;
    if (listingType) query.listingType = listingType;
    if (propertyType) query.propertyType = propertyType;
    if (city) query.city = city;
    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { propertyCode: { $regex: safeSearch, $options: 'i' } },
        { city: { $regex: safeSearch, $options: 'i' } },
        { address: { $regex: safeSearch, $options: 'i' } },
      ];
    }
    query = await applyTenantScope(query, req.user, 'realEstateProperty');
    const currentPage = Math.max(1, Number(page) || 1);
    const pageLimit = Math.min(100, Math.max(1, Number(limit) || 12));
    const [data, total] = await Promise.all([
      populateProperty(Property.find(query).sort({ createdAt: -1 }).skip((currentPage - 1) * pageLimit).limit(pageLimit)).lean(),
      Property.countDocuments(query),
    ]);
    res.json({ success: true, data, total, page: currentPage, limit: pageLimit, pages: Math.ceil(total / pageLimit) });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getProperty = async (req, res) => {
  try {
    const property = await populateProperty(Property.findById(req.params.id))
      .populate('createdBy', 'name email')
      .lean();
    if (!property) return res.status(404).json({ success: false, message: 'Property not found.' });
    const [offers, bookings, visits] = await Promise.all([
      Offer.countDocuments({ property: property._id }),
      Booking.find({ property: property._id }).populate('buyer', 'name phone email').sort({ createdAt: -1 }).lean(),
      SiteVisit.find({ property: property._id }).populate('buyer', 'name phone email').sort({ visitDate: -1 }).limit(50).lean(),
    ]);
    res.json({ success: true, data: { ...property, offerCount: offers, bookings, visits } });
  } catch (error) {
    sendError(res, error);
  }
};

exports.createProperty = async (req, res) => {
  try {
    const companyId = await getTenantCompanyId(req.user);
    const payload = { ...req.body, createdBy: req.user._id, company: companyId || null };
    if (!payload.propertyCode) delete payload.propertyCode;
    const property = await Property.create(payload);
    res.status(201).json({ success: true, data: property });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateProperty = async (req, res) => {
  try {
    const allowedFields = [
      'title', 'propertyCode', 'propertyType', 'listingType', 'status', 'price',
      'bedrooms', 'bathrooms', 'areaSqft', 'address', 'city', 'description', 'assignedAgent',
    ];
    const updates = Object.fromEntries(
      allowedFields.filter((field) => Object.prototype.hasOwnProperty.call(req.body, field))
        .map((field) => [field, req.body[field]])
    );
    if (!updates.propertyCode) delete updates.propertyCode;
    if (updates.status && updates.status !== 'reserved') {
      const activeBooking = await Booking.exists({
        property: req.params.id,
        status: { $in: ['reserved', 'confirmed'] },
      });
      if (activeBooking) {
        return res.status(409).json({ success: false, message: 'Update or cancel the active booking before changing the property status.' });
      }
    }
    const property = await Property.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!property) return res.status(404).json({ success: false, message: 'Property not found.' });
    res.json({ success: true, data: property });
  } catch (error) {
    sendError(res, error);
  }
};

exports.deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found.' });
    const visits = await SiteVisit.countDocuments({ property: property._id, status: 'scheduled' });
    if (visits) return res.status(409).json({ success: false, message: 'Cancel or complete scheduled site visits before removing this property.' });
    const activeBooking = await Booking.exists({ property: property._id, status: { $in: ['reserved', 'confirmed'] } });
    if (activeBooking) return res.status(409).json({ success: false, message: 'Cancel or complete the active booking before removing this property.' });
    await Promise.all([
      ...property.photos.map((photo) => removeStoredFile(photo.filename)),
      ...property.documents.map((document) => removeStoredFile(document.filename)),
    ]);
    await property.deleteOne();
    res.json({ success: true, message: 'Property deleted.' });
  } catch (error) {
    sendError(res, error);
  }
};

const removeStoredFile = async (filename) => {
  if (!filename || path.basename(filename) !== filename) return;
  const filePath = path.join(__dirname, '..', '..', 'uploads', 'real-estate', filename);
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
};

exports.addPropertyPhotos = async (req, res) => {
  const uploaded = req.files || [];
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      await Promise.all(uploaded.map((file) => removeStoredFile(file.filename)));
      return res.status(404).json({ success: false, message: 'Property not found.' });
    }
    if (property.photos.length + uploaded.length > 20) {
      await Promise.all(uploaded.map((file) => removeStoredFile(file.filename)));
      return res.status(400).json({ success: false, message: 'A property can have up to 20 photos.' });
    }
    const photos = uploaded.map((file) => ({
      filename: file.filename,
      url: `/uploads/real-estate/${file.filename}`,
    }));
    property.photos.push(...photos);
    await property.save();
    res.status(201).json({ success: true, data: property.photos });
  } catch (error) {
    await Promise.all(uploaded.map((file) => removeStoredFile(file.filename)));
    sendError(res, error);
  }
};

exports.deletePropertyPhoto = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found.' });
    const photo = property.photos.id(req.params.photoId);
    if (!photo) return res.status(404).json({ success: false, message: 'Property photo not found.' });
    const filename = photo.filename;
    photo.deleteOne();
    await property.save();
    await removeStoredFile(filename);
    res.json({ success: true, data: property.photos });
  } catch (error) {
    sendError(res, error);
  }
};

exports.addPropertyDocument = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Choose a document to upload.' });
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      await removeStoredFile(req.file.filename);
      return res.status(404).json({ success: false, message: 'Property not found.' });
    }
    if (property.documents.length >= 50) {
      await removeStoredFile(req.file.filename);
      return res.status(400).json({ success: false, message: 'A property can have up to 50 documents.' });
    }
    property.documents.push({
      name: req.body.name?.trim() || req.file.originalname,
      filename: req.file.filename,
      url: `/uploads/real-estate/${req.file.filename}`,
      mimeType: req.file.mimetype,
    });
    await property.save();
    res.status(201).json({ success: true, data: property.documents });
  } catch (error) {
    await removeStoredFile(req.file.filename);
    sendError(res, error);
  }
};

exports.deletePropertyDocument = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found.' });
    const document = property.documents.id(req.params.documentId);
    if (!document) return res.status(404).json({ success: false, message: 'Property document not found.' });
    const filename = document.filename;
    document.deleteOne();
    await property.save();
    await removeStoredFile(filename);
    res.json({ success: true, data: property.documents });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getSiteVisits = async (req, res) => {
  try {
    const { status, from, to } = req.query;
    const query = {};
    if (status) query.status = status;
    if (from || to) {
      query.visitDate = {};
      if (from) query.visitDate.$gte = new Date(from);
      if (to) {
        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999);
        query.visitDate.$lte = endDate;
      }
    }
    query = await applyTenantScope(query, req.user, 'realEstateSiteVisit');
    const visits = await SiteVisit.find(query)
      .populate('property', 'title propertyCode city address')
      .populate('buyer', 'name email phone status')
      .populate({ path: 'assignedAgent', select: 'employeeId designation user', populate: { path: 'user', select: 'name' } })
      .sort({ visitDate: 1 })
      .limit(200)
      .lean();
    res.json({ success: true, data: visits });
  } catch (error) {
    sendError(res, error);
  }
};

exports.createSiteVisit = async (req, res) => {
  try {
    const { property, buyer, visitDate } = req.body;
    if (!mongoose.isValidObjectId(property) || !mongoose.isValidObjectId(buyer)) {
      return res.status(400).json({ success: false, message: 'Select a valid property and buyer lead.' });
    }
    const [propertyRecord, buyerRecord] = await Promise.all([
      Property.findById(property),
      Lead.findOne({ _id: buyer, industry: 'Real Estate', isDeleted: { $ne: true } }),
    ]);
    if (!propertyRecord) return res.status(404).json({ success: false, message: 'Property not found.' });
    if (!buyerRecord) return res.status(404).json({ success: false, message: 'Real Estate buyer lead not found.' });
    if (Number.isNaN(new Date(visitDate).getTime())) {
      return res.status(400).json({ success: false, message: 'Enter a valid site visit date and time.' });
    }
    const [propertyAgent, buyerAgent] = await Promise.all([
      propertyRecord.assignedAgent ? Employee.findById(propertyRecord.assignedAgent).select('_id') : null,
      buyerRecord.assignedTo ? Employee.findById(buyerRecord.assignedTo).select('_id') : null,
    ]);
    const visitCompanyId = await getTenantCompanyId(req.user);
    const visit = await SiteVisit.create({
      company: visitCompanyId || null,
      property: propertyRecord._id,
      buyer: buyerRecord._id,
      visitDate: new Date(visitDate),
      assignedAgent: req.body.assignedAgent || null,
      notes: req.body.notes || '',
      createdBy: req.user._id,
    });
    if (!visit.assignedAgent) {
      visit.assignedAgent = propertyAgent?._id || buyerAgent?._id || null;
      if (visit.assignedAgent) await visit.save();
    }
    res.status(201).json({ success: true, data: visit });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateSiteVisit = async (req, res) => {
  try {
    const fields = ['property', 'buyer', 'visitDate', 'status', 'notes', 'assignedAgent'];
    const updates = Object.fromEntries(fields.filter((field) => field in req.body).map((field) => [field, req.body[field]]));
    if (req.body.visitDate || req.body.buyer || req.body.assignedAgent || req.body.status === 'scheduled') {
      updates.reminderSentAt = null;
      updates.buyerReminderSentAt = null;
    }
    const visit = await SiteVisit.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!visit) return res.status(404).json({ success: false, message: 'Site visit not found.' });
    res.json({ success: true, data: visit });
  } catch (error) {
    sendError(res, error);
  }
};

exports.deleteSiteVisit = async (req, res) => {
  try {
    const visit = await SiteVisit.findByIdAndDelete(req.params.id);
    if (!visit) return res.status(404).json({ success: false, message: 'Site visit not found.' });
    res.json({ success: true, message: 'Site visit deleted.' });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getOffers = async (req, res) => {
  try {
    const query = {};
    if (req.query.status) query.status = req.query.status;
    const offers = await Offer.find(query)
      .populate('property', 'title propertyCode city price status')
      .populate('buyer', 'name phone email status')
      .populate('createdBy', 'name')
      .sort({ updatedAt: -1 })
      .limit(200)
      .lean();
    res.json({ success: true, data: offers });
  } catch (error) {
    sendError(res, error);
  }
};

exports.createOffer = async (req, res) => {
  try {
    const { property, buyer, offerAmount, notes } = req.body;
    if (!mongoose.isValidObjectId(property) || !mongoose.isValidObjectId(buyer) || Number(offerAmount) <= 0) {
      return res.status(400).json({ success: false, message: 'Select a property, buyer and valid offer amount.' });
    }
    const [propertyRecord, buyerRecord] = await Promise.all([
      Property.findById(property),
      Lead.findOne({ _id: buyer, industry: 'Real Estate', isDeleted: { $ne: true } }),
    ]);
    if (!propertyRecord || propertyRecord.status !== 'available') {
      return res.status(409).json({ success: false, message: 'This property is not available for new offers.' });
    }
    if (!buyerRecord) return res.status(404).json({ success: false, message: 'Real Estate buyer lead not found.' });
    const offerCompanyId = await getTenantCompanyId(req.user);
    const offer = await Offer.create({ property, buyer, offerAmount, notes, createdBy: req.user._id, company: offerCompanyId || null });
    res.status(201).json({ success: true, data: offer });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found.' });
    const { status, counterAmount, notes } = req.body;
    if (offer.status === 'accepted' && status === 'accepted') {
      return res.json({ success: true, data: offer });
    }
    const allowedTransitions = {
      submitted: ['countered', 'accepted', 'rejected', 'withdrawn'],
      countered: ['countered', 'accepted', 'rejected', 'withdrawn'],
      accepted: [],
      rejected: [],
      withdrawn: [],
    };
    if (status && status !== offer.status && !allowedTransitions[offer.status].includes(status)) {
      return res.status(409).json({ success: false, message: `An offer marked ${offer.status} cannot be changed to ${status}.` });
    }
    if (status === 'countered' && (!Number.isFinite(Number(counterAmount)) || Number(counterAmount) <= 0)) {
      return res.status(400).json({ success: false, message: 'Enter a valid counter-offer amount.' });
    }
    let reservationCreated = false;
    if (status === 'accepted') {
      const property = await Property.findOneAndUpdate(
        { _id: offer.property, status: 'available' },
        { $set: { status: 'reserved' } },
        { new: true }
      );
      if (!property) {
        return res.status(409).json({ success: false, message: 'Property is no longer available to accept this offer.' });
      }
      try {
        await Booking.create({
          property: offer.property,
          buyer: offer.buyer,
          offer: offer._id,
          bookingAmount: Number(counterAmount) || offer.counterAmount || offer.offerAmount,
          status: 'reserved',
          createdBy: req.user._id,
        });
        reservationCreated = true;
      } catch (error) {
        await Property.updateOne({ _id: property._id, status: 'reserved' }, { $set: { status: 'available' } });
        throw error;
      }
    }
    if (status) offer.status = status;
    if (status === 'countered' && Number(counterAmount) > 0) offer.counterAmount = Number(counterAmount);
    if (notes !== undefined) offer.notes = notes;
    try {
      await offer.save();
    } catch (error) {
      if (reservationCreated) {
        await Booking.deleteOne({ offer: offer._id, status: 'reserved' });
        await Property.updateOne({ _id: offer.property, status: 'reserved' }, { $set: { status: 'available' } });
      }
      throw error;
    }
    res.json({ success: true, data: offer });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getBookings = async (req, res) => {
  try {
    const query = {};
    if (req.query.status) query.status = req.query.status;
    query = await applyTenantScope(query, req.user, 'realEstateBooking');
    const bookings = await Booking.find(query)
      .populate('property', 'title propertyCode city price status')
      .populate('buyer', 'name phone email status')
      .populate('offer', 'offerAmount counterAmount status')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    res.json({ success: true, data: bookings });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    const transitions = {
      reserved: ['confirmed', 'cancelled'],
      confirmed: ['completed', 'cancelled'],
      cancelled: [],
      completed: [],
    };
    if (req.body.status && req.body.status !== booking.status && !transitions[booking.status].includes(req.body.status)) {
      return res.status(409).json({ success: false, message: `A booking marked ${booking.status} cannot be changed to ${req.body.status}.` });
    }
    if (req.body.status) booking.status = req.body.status;
    if (req.body.bookingAmount !== undefined) booking.bookingAmount = req.body.bookingAmount;
    if (req.body.notes !== undefined) booking.notes = req.body.notes;
    await booking.save();
    if (booking.status === 'completed') {
      const property = await Property.findById(booking.property);
      if (property) {
        property.status = property.listingType === 'rent' ? 'rented' : 'sold';
        await property.save();
      }
    } else if (booking.status === 'cancelled') {
      const activeBooking = await Booking.exists({ property: booking.property, status: { $in: ['reserved', 'confirmed'] } });
      if (!activeBooking) {
        await Property.updateOne({ _id: booking.property, status: 'reserved' }, { $set: { status: 'available' } });
      }
    }
    res.json({ success: true, data: booking });
  } catch (error) {
    sendError(res, error);
  }
};

exports.sendSiteVisitReminders = async () => {
  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 60 * 1000);
  const visits = await SiteVisit.find({
    status: 'scheduled',
    visitDate: { $gte: now, $lte: soon },
    $or: [{ reminderSentAt: null }, { buyerReminderSentAt: null }],
  })
    .populate('property', 'title city')
    .populate('buyer', 'name')
    .populate({ path: 'assignedAgent', populate: { path: 'user', select: 'name' } });

  for (const visit of visits) {
    const recipients = new Set([visit.assignedAgent?.user?._id, visit.createdBy].filter(Boolean).map(String));
    try {
      if (!visit.reminderSentAt) {
        for (const recipient of recipients) {
          const existing = await Notification.exists({
            user: recipient,
            type: 'reminder',
            'relatedEntity.entityType': 'RealEstateSiteVisit',
            'relatedEntity.entityId': visit._id,
          });
          if (!existing) {
            await Notification.create({
              user: recipient,
              type: 'reminder',
              title: 'Site visit starting soon',
              message: `${visit.property?.title || 'Property visit'} with ${visit.buyer?.name || 'buyer'} starts at ${visit.visitDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`,
              relatedEntity: { entityType: 'RealEstateSiteVisit', entityId: visit._id },
              actionUrl: '/real-estate/site-visits',
            });
          }
        }
        visit.reminderSentAt = new Date();
      }
      if (!visit.buyerReminderSentAt) {
        if (visit.buyer?.email) {
          const visitTime = visit.visitDate.toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' });
          await sendEmail({
            to: visit.buyer.email,
            subject: `Reminder: your property visit is coming up`,
            text: `Hello ${visit.buyer.name || 'there'}, this is a reminder for your visit to ${visit.property?.title || 'the property'} at ${visit.property?.city || ''} on ${visitTime}.`,
            html: `<p>Hello ${escapeHtml(visit.buyer.name || 'there')},</p><p>This is a reminder for your upcoming property visit.</p><p><strong>${escapeHtml(visit.property?.title || 'Property visit')}</strong><br>${escapeHtml(visit.property?.city || '')}<br>${escapeHtml(visitTime)}</p><p>We look forward to seeing you.</p>`,
          });
        } else {
          console.warn(`[Real Estate reminders] Visit ${visit._id} has no buyer email; buyer email reminder skipped.`);
        }
        visit.buyerReminderSentAt = new Date();
      }
      await visit.save();
    } catch (error) {
      console.error(`[Real Estate reminders] Failed for visit ${visit._id}:`, error.message);
    }
  }
};
