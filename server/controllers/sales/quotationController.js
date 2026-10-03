const Quotation = require('../../models/Quotation');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const sendError = (res, error) => res.status(error.statusCode || 500).json({ success: false, message: error.message });
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
exports.createQuotation = async (req, res) => { try { const count = await Quotation.countDocuments(); const data = await Quotation.create({ ...req.body, quotationNumber: `QUO-${String(count + 1).padStart(6, '0')}`, ...calculate(req.body) }); res.status(201).json({ success: true, data }); } catch (e) { sendError(res, e); } };
exports.updateQuotation = async (req, res) => { try { const data = await Quotation.findOneAndUpdate({ _id: req.params.id, isDeleted: { $ne: true } }, { ...req.body, ...calculate(req.body) }, { new: true, runValidators: true }); if (!data) return res.status(404).json({ success: false, message: 'Quotation not found' }); res.json({ success: true, data }); } catch (e) { sendError(res, e); } };
exports.deleteQuotation = async (req, res) => { try { const data = await Quotation.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true }); if (!data) return res.status(404).json({ success: false, message: 'Quotation not found' }); res.json({ success: true, message: 'Quotation deleted' }); } catch (e) { sendError(res, e); } };
exports.sendQuotation = async (req, res) => { try { const data = await Quotation.findByIdAndUpdate(req.params.id, { status: 'sent', emailSent: true, emailSentAt: new Date() }, { new: true }); if (!data) return res.status(404).json({ success: false, message: 'Quotation not found' }); res.json({ success: true, data, message: 'Quotation marked as sent' }); } catch (e) { sendError(res, e); } };
exports.generatePDF = async (req, res) => { try { const quotation = await Quotation.findById(req.params.id).populate('client'); if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' }); const dir = path.join(__dirname, '../../../uploads/quotations'); fs.mkdirSync(dir, { recursive: true }); const fileName = `quotation_${quotation.quotationNumber || quotation._id}.pdf`; const filePath = path.join(dir, fileName); const doc = new PDFDocument({ margin: 50 }); doc.pipe(fs.createWriteStream(filePath)); doc.fontSize(22).text('QUOTATION'); doc.moveDown(); doc.fontSize(11).text(`Quotation #: ${quotation.quotationNumber || ''}`); doc.text(`Client: ${quotation.client?.name || quotation.customClientDetails?.name || 'N/A'}`); doc.moveDown(); (quotation.items || []).forEach(item => doc.text(`${item.description || ''} x ${item.quantity || 0} = ${item.unitPrice || 0}`)); doc.moveDown(); doc.fontSize(14).text(`Total: ${quotation.total || quotation.grandTotal || 0} ${quotation.currency || 'INR'}`); doc.end(); await new Promise((resolve, reject) => { doc.on('end', resolve); doc.on('error', reject); }); quotation.pdfUrl = `/uploads/quotations/${fileName}`; await quotation.save(); res.json({ success: true, data: quotation }); } catch (e) { sendError(res, e); } };
