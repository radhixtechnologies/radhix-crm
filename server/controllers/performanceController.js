const Goal = require('../models/Goal');

const result = (res, data) => res.json({ success: true, data });
exports.getGoals = async (req, res) => { try { result(res, await Goal.find({ assignedTo: req.params.employeeId || req.user.employeeId }).sort({ targetDate: 1 })); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.getGoal = async (req, res) => { try { result(res, await Goal.findById(req.params.id)); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.getAllGoals = async (req, res) => { try { result(res, await Goal.find().sort({ targetDate: 1 })); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.createGoal = async (req, res) => { try { res.status(201).json({ success: true, data: await Goal.create({ ...req.body, assignedBy: req.user._id }) }); } catch (e) { res.status(400).json({ success: false, message: e.message }); } };
exports.updateGoal = async (req, res) => { try { result(res, await Goal.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })); } catch (e) { res.status(400).json({ success: false, message: e.message }); } };
exports.createReview = async (req, res) => result(res, { ...req.body, createdBy: req.user._id });
exports.updateReview = async (req, res) => result(res, { ...req.body, _id: req.params.id });
exports.getReviews = async (req, res) => result(res, []);
exports.getAllReviews = async (req, res) => result(res, []);
exports.submitSelfReview = async (req, res) => result(res, { submitted: true });
exports.submitManagerReview = async (req, res) => result(res, { submitted: true });
exports.submitSelfAssessment = exports.submitSelfReview;
exports.submitManagerAssessment = exports.submitManagerReview;
exports.getEmployeeReviews = exports.getReviews;
exports.createCycle = async (req, res) => result(res, { ...req.body, createdBy: req.user._id });
exports.getCycles = async (req, res) => result(res, []);