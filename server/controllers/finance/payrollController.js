const Payroll = require('../../models/Payroll');
const Employee = require('../../models/Employee');
const SalaryStructure = require('../../models/SalaryStructure');
exports.getPayrolls = async (req, res) => { try { res.json({ success: true, data: await Payroll.find().populate('employee') }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.getPayroll = async (req, res) => { try { res.json({ success: true, data: await Payroll.findById(req.params.id).populate('employee') }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.generatePayroll = async (req, res) => {
	try {
		const month = Number(req.body.month || new Date().getMonth() + 1);
		const year = Number(req.body.year || new Date().getFullYear());
		const employees = req.body.employee ? await Employee.find({ _id: req.body.employee }) : await Employee.find({ status: 'active' });
		const records = [];
		for (const employee of employees) {
			const structure = await SalaryStructure.findOne({ employee: employee._id, isActive: true }).sort({ effectiveFrom: -1 });
			const basicSalary = structure?.basic || employee.salaryStructure?.basic || employee.salary || 0;
			const allowances = Number(structure?.allowances || employee.salaryStructure?.hra || 0);
			const deductions = Number(structure?.deductions || (employee.salaryStructure?.pf || 0) + (employee.salaryStructure?.esi || 0) + (employee.salaryStructure?.tds || 0));
			records.push(await Payroll.findOneAndUpdate({ employee: employee._id, month, year }, { employee: employee._id, month, year, basicSalary, grossSalary: basicSalary + allowances, deductions, netSalary: basicSalary + allowances - deductions, status: 'processed' }, { upsert: true, new: true, runValidators: true }));
		}
		res.status(201).json({ success: true, data: records });
	} catch (e) { res.status(400).json({ success: false, message: e.message }); }
};
exports.updatePayroll = async (req, res) => { try { res.json({ success: true, data: await Payroll.findByIdAndUpdate(req.params.id, req.body, { new: true }) }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.generatePDF = async (req, res) => { try { const payroll = await Payroll.findById(req.params.id).populate('employee'); if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found' }); const pdf = require('../../utils/pdfGenerator'); const result = await pdf.generatePayrollPDF(payroll, payroll.employee); res.json({ success: true, data: result }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.downloadPayslip = async (req, res) => { const payroll = await Payroll.findById(req.params.id).populate('employee'); if (!payroll) return res.status(404).json({ success: false, message: 'Payroll not found' }); const pdf = require('../../utils/pdfGenerator'); const result = await pdf.generatePayrollPDF(payroll, payroll.employee); res.redirect(result.url); };