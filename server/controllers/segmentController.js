const Segment = require('../models/Segment');
const Contact = require('../models/Contact');
const Lead = require('../models/Lead');

const resolveSegment = async (id) => {
  const segment = await Segment.findById(id).lean();
  if (!segment) throw new Error('Segment not found');
  if (segment.type === 'static') {
    const contacts = await Contact.find({ _id: { $in: segment.members || [] } });
    return { contacts, leads: [], totalMembers: contacts.length };
  }
  const rules = segment.rules || {};
  const query = {};
  if (rules.status) query.status = rules.status;
  if (rules.source) query.source = rules.source;
  if (rules.industry) query.industry = rules.industry;
  const [contacts, leads] = await Promise.all([Contact.find(query), Lead.find(query)]);
  return { contacts, leads, totalMembers: contacts.length + leads.length };
};

exports.resolveSegment = resolveSegment;
exports.getAllSegments = async (req, res) => { try { const query = {}; if (req.query.search) query.name = { $regex: req.query.search, $options: 'i' }; if (req.query.type) query.type = req.query.type; const segments = await Segment.find(query).sort({ createdAt: -1 }); res.json({ success: true, data: { segments } }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.getSegmentById = async (req, res) => { try { const data = await Segment.findById(req.params.id); if (!data) return res.status(404).json({ success: false, message: 'Segment not found' }); res.json({ success: true, data }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.createSegment = async (req, res) => { try { res.status(201).json({ success: true, data: await Segment.create({ ...req.body, createdBy: req.user._id }) }); } catch (e) { res.status(400).json({ success: false, message: e.message }); } };
exports.updateSegment = async (req, res) => { try { const data = await Segment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); if (!data) return res.status(404).json({ success: false, message: 'Segment not found' }); res.json({ success: true, data }); } catch (e) { res.status(400).json({ success: false, message: e.message }); } };
exports.deleteSegment = async (req, res) => { try { await Segment.findByIdAndDelete(req.params.id); res.json({ success: true }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.resolveSegmentMembers = async (req, res) => { try { const data = await resolveSegment(req.params.id); res.json({ success: true, data }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.refreshSegment = async (req, res) => { try { const resolved = await resolveSegment(req.params.id); const data = await Segment.findByIdAndUpdate(req.params.id, { cachedCounts: { total: resolved.totalMembers, contacts: resolved.contacts.length, leads: resolved.leads.length } }, { new: true }); res.json({ success: true, data }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };