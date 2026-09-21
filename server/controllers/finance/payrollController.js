const Payroll = require('../../models/Payroll');
const unavailable = (message) => async (req, res) => res.status(501).json({ success: false, message });
exports.getPayrolls = async (req, res) => { try { res.json({ success: true, data: await Payroll.find().populate('employee') }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.getPayroll = async (req, res) => { try { res.json({ success: true, data: await Payroll.findById(req.params.id).populate('employee') }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.generatePayroll = unavailable('Payroll generation requires salary structure configuration');
exports.updatePayroll = async (req, res) => { try { res.json({ success: true, data: await Payroll.findByIdAndUpdate(req.params.id, req.body, { new: true }) }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.generatePDF = unavailable('Payroll PDF generation is not configured');
exports.downloadPayslip = unavailable('Payslip download is not configured');