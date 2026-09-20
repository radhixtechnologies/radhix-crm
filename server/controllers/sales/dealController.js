const Deal = require('../../models/Deal');

const sendError = (res, error) => res.status(error.statusCode || 500).json({ success: false, message: error.message });
const buildQuery = (req) => {
  const { page = 1, limit = 50, search, stage, owner } = req.query;
  const query = { isDeleted: { $ne: true } };
  if (search) query.$or = [{ title: { $regex: search, $options: 'i' } }, { name: { $regex: search, $options: 'i' } }, { company: { $regex: search, $options: 'i' } }];
  if (stage) query.stage = stage;
  if (owner && owner !== 'all') query.assignedTo = owner;
  return { query, page: Math.max(1, Number(page)), limit: Math.min(100, Math.max(1, Number(limit))) };
};
exports.getDeals = async (req, res) => { try { const { query, page, limit } = buildQuery(req); const [data, total] = await Promise.all([Deal.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('client', 'name company').populate('contact', 'firstName lastName email').lean(), Deal.countDocuments(query)]); res.json({ success: true, data, total, page, pages: Math.ceil(total / limit) }); } catch (e) { sendError(res, e); } };
exports.getDeal = async (req, res) => { try { const data = await Deal.findOne({ _id: req.params.id, isDeleted: { $ne: true } }).populate('client').populate('contact'); if (!data) return res.status(404).json({ success: false, message: 'Deal not found' }); res.json({ success: true, data }); } catch (e) { sendError(res, e); } };
exports.createDeal = async (req, res) => { try { const data = await Deal.create({ ...req.body, createdBy: req.user._id }); res.status(201).json({ success: true, data }); } catch (e) { sendError(res, e); } };
exports.updateDeal = async (req, res) => { try { const data = await Deal.findOneAndUpdate({ _id: req.params.id, isDeleted: { $ne: true } }, req.body, { new: true, runValidators: true }).populate('client').populate('contact'); if (!data) return res.status(404).json({ success: false, message: 'Deal not found' }); res.json({ success: true, data }); } catch (e) { sendError(res, e); } };
exports.deleteDeal = async (req, res) => { try { const data = await Deal.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true }); if (!data) return res.status(404).json({ success: false, message: 'Deal not found' }); res.json({ success: true, message: 'Deal deleted' }); } catch (e) { sendError(res, e); } };
exports.changeStage = async (req, res) => { try { const stage = req.body.stage; const data = await Deal.findByIdAndUpdate(req.params.id, { stage, ...(stage === 'closed-won' ? { wonDate: new Date() } : {}), ...(stage === 'closed-lost' ? { lostDate: new Date() } : {}) }, { new: true, runValidators: true }); if (!data) return res.status(404).json({ success: false, message: 'Deal not found' }); res.json({ success: true, data }); } catch (e) { sendError(res, e); } };
exports.addNote = async (req, res) => { try { const data = await Deal.findByIdAndUpdate(req.params.id, { $push: { notes: { content: req.body.content, addedBy: req.user._id } } }, { new: true }); if (!data) return res.status(404).json({ success: false, message: 'Deal not found' }); res.json({ success: true, data }); } catch (e) { sendError(res, e); } };
