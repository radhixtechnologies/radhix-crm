const Goal = require('../models/Goal');
const PerformanceReview = require('../models/PerformanceReview');
const Employee = require('../models/Employee');
const AppraisalCycle = require('../models/AppraisalCycle');

const result = (res, data) => res.json({ success: true, data });
const populateReview = (query) => query
	.populate({ path: 'employee', select: 'employeeId designation department user', populate: { path: 'user', select: 'name email' } })
	.populate('appraisalCycle', 'name type startDate endDate status');

const assignCycleReviews = async (cycle) => {
	const employees = await Employee.find({ status: 'active', deletedAt: null }).select('_id');
	if (!employees.length) return;

	await PerformanceReview.bulkWrite(employees.map(({ _id }) => ({
		updateOne: {
			filter: { employee: _id, appraisalCycle: cycle._id },
			update: { $setOnInsert: { employee: _id, appraisalCycle: cycle._id, cycle: cycle.name, status: 'pending' } },
			upsert: true,
		},
	})));
};
exports.getGoals = async (req, res) => { try { const employee = req.params.employeeId || (await Employee.findOne({ user: req.user._id }))?._id; result(res, await Goal.find(employee ? { assignedTo: employee } : {}).populate('assignedTo', 'employeeId designation').sort({ targetDate: 1 })); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.getGoal = async (req, res) => { try { result(res, await Goal.findById(req.params.id)); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.getAllGoals = async (req, res) => { try { result(res, await Goal.find().sort({ targetDate: 1 })); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.createGoal = async (req, res) => { try { res.status(201).json({ success: true, data: await Goal.create({ ...req.body, assignedBy: req.user._id }) }); } catch (e) { res.status(400).json({ success: false, message: e.message }); } };
exports.updateGoal = async (req, res) => { try { result(res, await Goal.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })); } catch (e) { res.status(400).json({ success: false, message: e.message }); } };
exports.createReview = async (req, res) => { try { res.status(201).json({ success: true, data: await PerformanceReview.create({ ...req.body, reviewer: req.user._id }) }); } catch (e) { res.status(400).json({ success: false, message: e.message }); } };
exports.updateReview = async (req, res) => { try { result(res, await PerformanceReview.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })); } catch (e) { res.status(400).json({ success: false, message: e.message }); } };
exports.getReviews = async (req, res) => {
	try {
		const isAdmin = ['super_admin', 'admin'].includes(req.user.role);
		const employee = isAdmin
			? req.query.employeeId || req.params.employeeId
			: (await Employee.findOne({ user: req.user._id }))?._id;
		result(res, await populateReview(PerformanceReview.find(employee ? { employee } : {})).sort({ createdAt: -1 }));
	} catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
exports.getAllReviews = async (req, res) => {
	try { result(res, await populateReview(PerformanceReview.find()).sort({ createdAt: -1 })); }
	catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
exports.submitSelfReview = async (req, res) => {
	try {
		const employee = await Employee.findOne({ user: req.user._id, status: 'active', deletedAt: null });
		if (!employee) return res.status(404).json({ success: false, message: 'Active employee record not found' });

		const selfAssessment = req.body.selfReview || req.body;
		const rating = Number(selfAssessment.rating);
		if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
			return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
		}

		let review;
		if (req.params.id) {
			review = await PerformanceReview.findOne({ _id: req.params.id, employee: employee._id });
			if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
		} else {
			const cycle = await AppraisalCycle.findOne({ _id: req.body.appraisalCycleId, status: 'active' });
			if (!cycle) return res.status(404).json({ success: false, message: 'Active appraisal cycle not found' });
			review = await PerformanceReview.findOne({ employee: employee._id, appraisalCycle: cycle._id });
			if (!review) {
				review = new PerformanceReview({ employee: employee._id, appraisalCycle: cycle._id, cycle: cycle.name, status: 'pending' });
			}
		}

		if (review.selfAssessment?.submittedAt || review.status === 'completed') {
			return res.status(409).json({ success: false, message: 'Self-review has already been submitted' });
		}

		review.selfAssessment = { ...selfAssessment, rating, submittedAt: new Date() };
		review.status = 'self_submitted';
		await review.save();
		result(res, review);
	} catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
exports.submitManagerReview = async (req, res) => {
	try {
		const reviewId = req.params.id || req.body.reviewId;
		if (!reviewId) {
			return res.status(400).json({ success: false, message: 'Review ID is required' });
		}

		const managerAssessment = req.body.managerReview || req.body;
		const overallRating = Number(managerAssessment.overallRating ?? managerAssessment.rating ?? managerAssessment.finalRating ?? 0);
		if (!Number.isFinite(overallRating) || overallRating < 1 || overallRating > 5) {
			return res.status(400).json({ success: false, message: 'Overall rating must be between 1 and 5' });
		}

		const existingReview = await PerformanceReview.findById(reviewId);
		if (!existingReview) return res.status(404).json({ success: false, message: 'Review not found' });
		if (!['self_submitted', 'completed'].includes(existingReview.status)) {
			return res.status(400).json({ success: false, message: 'Employee must submit a self-review before manager assessment' });
		}

		const review = await PerformanceReview.findByIdAndUpdate(reviewId, {
			managerAssessment: { ...managerAssessment, overallRating, submittedAt: new Date() },
			finalRating: overallRating,
			status: 'completed',
			reviewer: req.user._id,
		}, { new: true, runValidators: true });
		if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
		result(res, review);
	} catch (e) { res.status(400).json({ success: false, message: e.message }); }
};
exports.submitSelfAssessment = exports.submitSelfReview;
exports.submitManagerAssessment = exports.submitManagerReview;
exports.getEmployeeReviews = async (req, res) => { try { result(res, await PerformanceReview.find({ employee: req.params.employeeId }).sort({ createdAt: -1 })); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.createCycle = async (req, res) => {
	try {
		if (new Date(req.body.endDate) <= new Date(req.body.startDate)) {
			return res.status(400).json({ success: false, message: 'End date must be after start date' });
		}
		const cycle = await AppraisalCycle.create({ ...req.body, createdBy: req.user._id });
		if (cycle.status === 'active') await assignCycleReviews(cycle);
		res.status(201).json({ success: true, data: cycle });
	} catch (e) { res.status(400).json({ success: false, message: e.message }); }
};
exports.updateCycle = async (req, res) => {
	try {
		if (req.body.startDate && req.body.endDate && new Date(req.body.endDate) <= new Date(req.body.startDate)) {
			return res.status(400).json({ success: false, message: 'End date must be after start date' });
		}
		if (req.body.status === 'completed') {
			const pendingReviews = await PerformanceReview.countDocuments({ appraisalCycle: req.params.id, status: { $ne: 'completed' } });
			if (pendingReviews > 0) {
				return res.status(400).json({ success: false, message: `${pendingReviews} reviews must be completed before closing this cycle` });
			}
		}
		const cycle = await AppraisalCycle.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
		if (!cycle) return res.status(404).json({ success: false, message: 'Appraisal cycle not found' });
		if (cycle.status === 'active') await assignCycleReviews(cycle);
		result(res, cycle);
	} catch (e) { res.status(400).json({ success: false, message: e.message }); }
};
exports.getCycles = async (req, res) => {
	try { result(res, await AppraisalCycle.find().populate('createdBy', 'name').sort({ startDate: -1 })); }
	catch (e) { res.status(500).json({ success: false, message: e.message }); }
};