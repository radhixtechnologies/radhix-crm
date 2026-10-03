const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const SalaryStructure = require('../models/SalaryStructure');
const employeeRepository = require('../repositories/employeeRepository');
const { isAdmin } = require('../services/permissionService');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');

const list = async (req, res) => {
	const admin = await isAdmin(req.user);
	let filter = {};

	if (admin) {
		if (req.query.employeeId) filter.employee = req.query.employeeId;
	} else {
		const employee = await employeeRepository.findByUserId(req.user._id);
		if (!employee) return res.json({ success: true, data: [] });
		filter.employee = employee._id;
	}

	const slips = await Payroll.find(filter).populate('employee').sort({ year: -1, month: -1 });
	res.json({ success: true, data: slips });
};

exports.getSalarySlips = list;
const findAccessibleSalarySlip = async (req, id) => {
	const admin = await isAdmin(req.user);
	const filter = { _id: id };
	if (!admin) {
		const employee = await employeeRepository.findByUserId(req.user._id);
		if (!employee) return null;
		filter.employee = employee._id;
	}

	return Payroll.findOne(filter).populate({
		path: 'employee',
		populate: { path: 'user', select: 'name email' },
	});
};

exports.getSalarySlip = async (req, res) => {
	const slip = await findAccessibleSalarySlip(req, req.params.id);
	if (!slip) return res.status(404).json({ success: false, message: 'Salary slip not found' });
	res.json({ success: true, data: slip });
};
exports.downloadSalarySlip = async (req, res) => {
	let temporaryDirectory;
	try {
		const slip = await findAccessibleSalarySlip(req, req.params.id);
		if (!slip) return res.status(404).json({ success: false, message: 'Salary slip not found' });

		const basicSalary = Number(slip.basicSalary || 0);
		const grossSalary = Number(slip.grossSalary || 0);
		const totalDeductions = Number(slip.deductions || 0);
		temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'radhix-payslip-'));
		const pdf = require('../utils/pdfGenerator');
		const result = await pdf.generateSalarySlipPDF({
			...slip.toObject(),
			generatedAt: slip.createdAt,
			paymentDate: slip.paidAt,
			earnings: {
				basic: basicSalary,
				hra: 0,
				allowances: Math.max(grossSalary - basicSalary, 0),
				bonus: 0,
				overtime: 0,
				totalEarnings: grossSalary,
			},
			deductions: {
				unpaidLeave: 0,
				tax: 0,
				pf: 0,
				esi: 0,
				loan: 0,
				other: totalDeductions,
				totalDeductions,
			},
			netSalary: Number(slip.netSalary ?? grossSalary - totalDeductions),
		}, slip.employee, {
			outputDir: temporaryDirectory,
			fileName: `salary-slip-${slip._id}.pdf`,
		});

		res.download(result.filePath, result.fileName, () => {
			fs.rm(temporaryDirectory, { recursive: true, force: true }).catch(() => {});
		});
	} catch (error) {
		if (temporaryDirectory) await fs.rm(temporaryDirectory, { recursive: true, force: true }).catch(() => {});
		if (!res.headersSent) res.status(500).json({ success: false, message: error.message });
	}
};
exports.createSalarySlip = async (req, res) => {
	try {
		const employeeId = req.body.employee || req.body.employeeId;
		const employee = await Employee.findById(employeeId);
		if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

		const month = Number(req.body.month);
		const year = Number(req.body.year);
		const structure = await SalaryStructure.findOne({ employee: employeeId, isActive: true }).sort({ effectiveFrom: -1 });
		const earnings = req.body.earnings;
		const submittedDeductions = req.body.deductions;
		const basicSalary = Number(earnings?.basic ?? structure?.basic ?? employee.salary ?? 0);
		const grossSalary = earnings
			? Object.values(earnings).reduce((total, value) => total + Number(value || 0), 0)
			: basicSalary + Number(structure?.allowances || 0);
		const deductions = submittedDeductions
			? Object.values(submittedDeductions).reduce((total, value) => total + Number(value || 0), 0)
			: Number(structure?.deductions || 0);

		const slip = await Payroll.findOneAndUpdate(
			{ employee: employeeId, month, year },
			{ employee: employeeId, month, year, basicSalary, grossSalary, deductions, netSalary: grossSalary - deductions, status: 'processed' },
			{ upsert: true, new: true, runValidators: true }
		);
		res.status(201).json({ success: true, data: slip });
	} catch (error) {
		res.status(400).json({ success: false, message: error.message });
	}
};
exports.getReimbursements = async (req, res) => res.json({ success: true, data: [] });
exports.getReimbursement = async (req, res) => res.status(404).json({ success: false, message: 'Reimbursement not found' });
exports.createReimbursement = async (req, res) => res.status(201).json({ success: true, data: req.body });
exports.updateReimbursement = async (req, res) => res.json({ success: true, data: { ...req.body, _id: req.params.id } });
exports.deleteReimbursement = async (req, res) => res.json({ success: true });

exports.getPayrollEmployees = async (req, res) => res.json({ success: true, data: await Employee.find({ status: 'active' }).select('employeeId user salary salaryStructure').populate('user', 'name email') });
exports.getAllSalarySlips = list;
exports.getSalarySlipCalculation = async (req, res) => {
	try {
		const employee = await Employee.findById(req.params.employeeId);
		if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

		const structure = await SalaryStructure.findOne({ employee: employee._id, isActive: true }).sort({ effectiveFrom: -1 });
		const basic = Number(structure?.basic ?? employee.salaryStructure?.basic ?? employee.salary ?? 0);
		const allowancesValue = structure?.allowances ?? employee.salaryStructure?.hra ?? 0;
		const deductionsValue = structure?.deductions ?? {};
		const allowances = typeof allowancesValue === 'object'
			? Object.values(allowancesValue).reduce((total, value) => total + Number(value || 0), 0)
			: Number(allowancesValue || 0);
		const deductionItems = typeof deductionsValue === 'object'
			? deductionsValue
			: { tax: deductionsValue };

		res.json({
			success: true,
			data: {
				earnings: { basic, hra: 0, allowances, bonus: 0, overtime: 0 },
				deductions: {
					pf: Number(deductionItems.pf || 0),
					tax: Number(deductionItems.tax || deductionItems.tds || 0),
					esi: Number(deductionItems.esi || 0),
					loan: Number(deductionItems.loan || 0),
					unpaidLeave: Number(deductionItems.unpaidLeave || 0),
					other: Number(deductionItems.other || 0),
				},
				attendance: {},
			},
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};
exports.deleteSalarySlip = async (req, res) => { await Payroll.findByIdAndDelete(req.params.id); res.json({ success: true }); };
exports.updateSalarySlipStatus = async (req, res) => res.json({ success: true, data: await Payroll.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }) });
exports.sendSalarySlipEmail = async (req, res) => res.json({ success: true, message: 'Salary slip email queued' });
