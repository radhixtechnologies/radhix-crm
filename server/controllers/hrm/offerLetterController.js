const crypto = require('crypto');
const OfferLetter = require('../../models/OfferLetter');

const send = (res, data) => res.json({ success: true, data });
const find = (req) => OfferLetter.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
exports.getMyOffers = async (req, res) => { try { send(res, await find(req)); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.getOffers = async (req, res) => { try { send(res, await OfferLetter.find().sort({ createdAt: -1 })); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.getOffer = async (req, res) => { try { const data = await OfferLetter.findById(req.params.id); if (!data) return res.status(404).json({ success: false, message: 'Offer not found' }); send(res, data); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.createOffer = async (req, res) => { try { res.status(201).json({ success: true, data: await OfferLetter.create({ ...req.body, createdBy: req.user._id, token: crypto.randomBytes(20).toString('hex') }) }); } catch (e) { res.status(400).json({ success: false, message: e.message }); } };
exports.updateOffer = async (req, res) => { try { send(res, await OfferLetter.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })); } catch (e) { res.status(400).json({ success: false, message: e.message }); } };
exports.submitForApproval = async (req, res) => { try { send(res, await OfferLetter.findByIdAndUpdate(req.params.id, { status: 'pending_approval', approvalRequestedAt: new Date() }, { new: true })); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.decideOffer = async (req, res) => { try { send(res, await OfferLetter.findByIdAndUpdate(req.params.id, { status: req.body.status || 'approved', approvedBy: req.user._id, approvedAt: new Date() }, { new: true })); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.generatePDF = async (req, res) => res.status(501).json({ success: false, message: 'PDF generation is not configured' });
exports.sendOffer = async (req, res) => { try { send(res, await OfferLetter.findByIdAndUpdate(req.params.id, { status: 'sent', sentAt: new Date() }, { new: true })); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.withdrawOffer = async (req, res) => { try { send(res, await OfferLetter.findByIdAndUpdate(req.params.id, { status: 'withdrawn' }, { new: true })); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.getPublicOffer = async (req, res) => { try { send(res, await OfferLetter.findOne({ token: req.params.token })); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.respondToOffer = async (req, res) => { try { send(res, await OfferLetter.findOneAndUpdate({ token: req.params.token }, { status: req.body.accepted ? 'accepted' : 'rejected_by_candidate', candidateResponse: req.body, respondedAt: new Date() }, { new: true })); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.createEmployeeFromOffer = async (req, res) => res.status(501).json({ success: false, message: 'Employee creation from offer is not configured' });