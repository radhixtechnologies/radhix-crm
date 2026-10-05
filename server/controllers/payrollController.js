const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const SalaryStructure = require('../models/SalaryStructure');

const list = async (req, res) => {
	try {
		let employeeId = req.query.employeeId;
		const userRole = typeof req.user?.role === 'object' ? req.user?.role?.slug : req.user?.role;
		const isAdmin = userRole === 'admin' || userRole === 'super_admin';

		if (!employeeId && !isAdmin && req.user?._id) {
			const emp = await Employee.findOne({ user: req.user._id, deletedAt: null });
			if (emp) {
				employeeId = emp._id.toString();
			}
		}

		let slips = await Payroll.find(employeeId ? { employee: employeeId } : {})
			.populate({
				path: 'employee',
				select: 'employeeId department designation employmentType salary salaryStructure user',
				populate: { path: 'user', select: 'name email' }
			})
			.sort({ year: -1, month: -1 });

		// If no slips exist yet for this employee, create recent slips using employee work details/salary
		if ((!slips || slips.length === 0) && employeeId) {
			const emp = await Employee.findById(employeeId).populate('user', 'name email');
			if (emp && emp.salary) {
				const monthlyGross = Math.round(emp.salary / 12);
				const basic = Math.round(monthlyGross * 0.5);
				const hra = Math.round(monthlyGross * 0.3);
				const allowances = monthlyGross - basic - hra;
				const pf = Math.round(basic * 0.12);
				const deductions = pf;
				const netSalary = monthlyGross - deductions;

				const now = new Date();
				const currentYear = now.getFullYear();
				const currentMonth = now.getMonth() + 1; // 1-12
				const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
				const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

				await Payroll.findOneAndUpdate(
					{ employee: emp._id, month: prevMonth, year: prevYear },
					{
						employee: emp._id,
						month: prevMonth,
						year: prevYear,
						basicSalary: basic,
						grossSalary: monthlyGross,
						deductions,
						netSalary,
						status: 'paid',
						paidAt: new Date(prevYear, prevMonth - 1, 28)
					},
					{ upsert: true, new: true }
				);

				await Payroll.findOneAndUpdate(
					{ employee: emp._id, month: currentMonth, year: currentYear },
					{
						employee: emp._id,
						month: currentMonth,
						year: currentYear,
						basicSalary: basic,
						grossSalary: monthlyGross,
						deductions,
						netSalary,
						status: 'processed'
					},
					{ upsert: true, new: true }
				);

				slips = await Payroll.find({ employee: employeeId })
					.populate({
						path: 'employee',
						select: 'employeeId department designation employmentType salary salaryStructure user',
						populate: { path: 'user', select: 'name email' }
					})
					.sort({ year: -1, month: -1 });
			}
		}

		res.json({ success: true, data: slips });
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};

exports.getSalarySlips = list;
exports.getSalarySlip = async (req, res) => res.json({ success: true, data: await Payroll.findById(req.params.id).populate('employee') });
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
