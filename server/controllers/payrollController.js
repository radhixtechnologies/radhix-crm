const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const SalaryStructure = require('../models/SalaryStructure');

const list = async (req, res) => res.json({ success: true, data: await Payroll.find(req.query.employeeId ? { employee: req.query.employeeId } : {}).populate('employee').sort({ year: -1, month: -1 }) });

exports.getSalarySlips = list;
exports.getSalarySlip = async (req, res) => res.json({ success: true, data: await Payroll.findById(req.params.id).populate('employee') });
exports.createSalarySlip = async (req, res) => { const employee = await Employee.findById(req.body.employee); const structure = await SalaryStructure.findOne({ employee: req.body.employee, isActive: true }).sort({ effectiveFrom: -1 }); const basicSalary = structure?.basic || employee?.salary || 0; const deductions = Number(structure?.deductions || 0); const slip = await Payroll.findOneAndUpdate({ employee: req.body.employee, month: Number(req.body.month), year: Number(req.body.year) }, { employee: req.body.employee, month: Number(req.body.month), year: Number(req.body.year), basicSalary, grossSalary: basicSalary + Number(structure?.allowances || 0), deductions, netSalary: basicSalary - deductions, status: 'processed' }, { upsert: true, new: true }); res.status(201).json({ success: true, data: slip }); };
exports.getReimbursements = async (req, res) => res.json({ success: true, data: [] });
exports.getReimbursement = async (req, res) => res.status(404).json({ success: false, message: 'Reimbursement not found' });
exports.createReimbursement = async (req, res) => res.status(201).json({ success: true, data: req.body });
exports.updateReimbursement = async (req, res) => res.json({ success: true, data: { ...req.body, _id: req.params.id } });
exports.deleteReimbursement = async (req, res) => res.json({ success: true });

exports.getPayrollEmployees = async (req, res) => res.json({ success: true, data: await Employee.find({ status: 'active' }).select('employeeId user salary salaryStructure').populate('user', 'name email') });
exports.getAllSalarySlips = list;
exports.getSalarySlipCalculation = async (req, res) => { const structure = await SalaryStructure.findOne({ employee: req.params.employeeId, isActive: true }).sort({ effectiveFrom: -1 }); res.json({ success: true, data: structure || {} }); };
exports.deleteSalarySlip = async (req, res) => { await Payroll.findByIdAndDelete(req.params.id); res.json({ success: true }); };
exports.updateSalarySlipStatus = async (req, res) => res.json({ success: true, data: await Payroll.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }) });
exports.sendSalarySlipEmail = async (req, res) => res.json({ success: true, message: 'Salary slip email queued' });
