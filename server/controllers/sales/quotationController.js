const Quotation = require('../../models/Quotation');
const Company = require('../../models/Company');
const Deal = require('../../models/Deal');
const Notification = require('../../models/Notification');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const sendError = (res, error) => res.status(error.statusCode || 500).json({ success: false, message: error.message });
const normalizeOptionalReferences = (body) => {
  const normalized = { ...body };
  ['client', 'contact', 'deal'].forEach((field) => {
    if (normalized[field] === '') normalized[field] = null;
  });
  return normalized;
};
const calculate = (body) => {
  const items = Array.isArray(body.items) ? body.items : [];
  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
  const lineDiscount = items.reduce((sum, item) => { const amount = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0); return sum + amount * (Number(item.discount) || 0) / 100; }, 0);
  let totalDiscount = lineDiscount;
  if (body.discountType === 'percentage') totalDiscount += Math.max(0, subtotal - lineDiscount) * (Number(body.discountValue) || 0) / 100;
  if (body.discountType === 'fixed') totalDiscount += Number(body.discountValue) || 0;
  const taxable = Math.max(0, subtotal - totalDiscount);
  const taxRate = Number(body.taxRate) || 0;
  const taxAmount = body.taxInclusive ? taxable - taxable / (1 + taxRate / 100) : taxable * taxRate / 100;
  const total = body.taxInclusive ? taxable : taxable + taxAmount;
  return { subtotal, totalDiscount, taxAmount, grandTotal: total, total };
};
const queryOptions = (req) => { const { page = 1, limit = 10, status, search } = req.query; const query = { isDeleted: { $ne: true } }; if (status) query.status = status; if (search) query.quotationName = { $regex: search, $options: 'i' }; return { query, page: Math.max(1, Number(page)), limit: Math.min(100, Math.max(1, Number(limit))) }; };
exports.getQuotations = async (req, res) => { try { const { query, page, limit } = queryOptions(req); const [data, total] = await Promise.all([Quotation.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('client', 'name company email').populate('deal', 'title name value').lean(), Quotation.countDocuments(query)]); res.json({ success: true, data, total, page, pages: Math.ceil(total / limit) }); } catch (e) { sendError(res, e); } };
exports.getQuotation = async (req, res) => { try { const data = await Quotation.findOne({ _id: req.params.id, isDeleted: { $ne: true } }).populate('client').populate('contact').populate('deal'); if (!data) return res.status(404).json({ success: false, message: 'Quotation not found' }); res.json({ success: true, data }); } catch (e) { sendError(res, e); } };
exports.createQuotation = async (req, res) => { try { const body = normalizeOptionalReferences(req.body); const count = await Quotation.countDocuments(); const data = await Quotation.create({ ...body, quotationNumber: `QUO-${String(count + 1).padStart(6, '0')}`, ...calculate(body) }); res.status(201).json({ success: true, data }); } catch (e) { sendError(res, e); } };
exports.updateQuotation = async (req, res) => { try { const body = normalizeOptionalReferences(req.body); const data = await Quotation.findOneAndUpdate({ _id: req.params.id, isDeleted: { $ne: true } }, { ...body, ...calculate(body) }, { new: true, runValidators: true }); if (!data) return res.status(404).json({ success: false, message: 'Quotation not found' }); res.json({ success: true, data }); } catch (e) { sendError(res, e); } };
exports.deleteQuotation = async (req, res) => { try { const data = await Quotation.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true }); if (!data) return res.status(404).json({ success: false, message: 'Quotation not found' }); res.json({ success: true, message: 'Quotation deleted' }); } catch (e) { sendError(res, e); } };
exports.sendQuotation = async (req, res) => { try { const data = await Quotation.findByIdAndUpdate(req.params.id, { status: 'sent', emailSent: true, emailSentAt: new Date() }, { new: true }); if (!data) return res.status(404).json({ success: false, message: 'Quotation not found' }); res.json({ success: true, data, message: 'Quotation marked as sent' }); } catch (e) { sendError(res, e); } };
exports.generatePDF = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
      .populate('client')
      .populate('contact');
    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });

    const dir = path.join(__dirname, '../../../uploads/quotations');
    fs.mkdirSync(dir, { recursive: true });
    const safeNumber = String(quotation.quotationNumber || quotation._id).replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `quotation_${safeNumber}.pdf`;
    const filePath = path.join(dir, fileName);
    const { generateRadhixQuotationPDF } = require('../../utils/radhixQuotationPdf');
    await generateRadhixQuotationPDF(quotation, filePath);
    quotation.pdfUrl = `/uploads/quotations/${fileName}?v=${Date.now()}`;
    await quotation.save();
    res.json({ success: true, data: quotation });
  } catch (e) {
    sendError(res, e);
  }
};

exports.shareQuotationLink = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });

    if (!quotation.publicToken) {
      quotation.publicToken = crypto.randomBytes(12).toString('hex');
    }
    if (quotation.status === 'draft') {
      quotation.status = 'sent';
    }
    quotation.sharedAt = new Date();
    await quotation.save();

    res.json({
      success: true,
      data: quotation,
      publicToken: quotation.publicToken,
      sharePath: `/quote/${quotation.publicToken}`,
      message: 'Public client approval & payment link generated!',
    });
  } catch (e) {
    sendError(res, e);
  }
};

exports.getPublicQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({
      publicToken: req.params.token,
      isDeleted: { $ne: true },
    })
      .populate('client', 'name company email phone address')
      .populate('deal', 'title stage value')
      .lean();

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation link is invalid or expired' });
    }

    const company = await Company.findOne()
      .sort({ createdAt: 1 })
      .select('name logo upiId upiName address gstin bankDetails branding')
      .lean();

    res.json({
      success: true,
      data: { quotation, company },
    });
  } catch (e) {
    sendError(res, e);
  }
};

exports.respondPublicQuotation = async (req, res) => {
  try {
    const { action, signedByName = '', signatureDataUrl = '', feedback = '' } = req.body;
    if (!['accepted', 'rejected'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be accepted or rejected' });
    }

    const quotation = await Quotation.findOne({
      publicToken: req.params.token,
      isDeleted: { $ne: true },
    });
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation link is invalid or expired' });
    }

    if (quotation.status === 'accepted' && action === 'accepted') {
      return res.json({ success: true, data: quotation, message: 'Quotation already accepted' });
    }

    quotation.status = action;
    quotation.clientFeedback = String(feedback || '').trim();
    if (action === 'accepted') {
      quotation.acceptedAt = new Date();
      quotation.clientSignature = {
        signedByName: String(signedByName || '').trim() || 'Authorized Signatory',
        signatureDataUrl: String(signatureDataUrl || ''),
        signedAt: new Date(),
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
      };
    } else {
      quotation.rejectedAt = new Date();
    }
    await quotation.save();

    if (quotation.deal) {
      try {
        const deal = await Deal.findById(quotation.deal);
        if (deal) {
          if (action === 'accepted' && ['new-deal', 'proposal', 'quotation'].includes(deal.stage)) {
            deal.stage = 'negotiation';
          }
          await deal.save();
          if (deal.assignedTo) {
            await Notification.create({
              user: deal.assignedTo,
              title: action === 'accepted' ? '🎉 Client Accepted Quotation!' : '📝 Client Requested Quotation Changes',
              message: `${quotation.quotationName} (${quotation.quotationNumber}) — ${action === 'accepted' ? `Signed by ${quotation.clientSignature.signedByName}` : quotation.clientFeedback || 'Revision requested'}`,
              type: action === 'accepted' ? 'success' : 'warning',
              actionUrl: `/sales/quotations/${quotation._id}`,
            }).catch(() => {});
          }
        }
      } catch (dealErr) {
        console.warn('Deal sync after quotation response warning:', dealErr.message);
      }
    }

    res.json({
      success: true,
      data: quotation,
      message:
        action === 'accepted'
          ? 'Quotation approved and digitally signed! Thank you.'
          : 'Your feedback has been shared with our sales team.',
    });
  } catch (e) {
    sendError(res, e);
  }
};
