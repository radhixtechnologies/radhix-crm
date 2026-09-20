const { asyncHandler } = require('../utils/asyncHandler');

const unavailable = (message) => asyncHandler(async (req, res) => {
  res.status(501).json({ success: false, message });
});

exports.getSalarySlips = unavailable('Salary slip listing is not available yet');
exports.getSalarySlip = unavailable('Salary slip details are not available yet');
exports.createSalarySlip = unavailable('Salary slip generation is not available yet');
exports.getReimbursements = unavailable('Reimbursement listing is not available yet');
exports.getReimbursement = unavailable('Reimbursement details are not available yet');
exports.createReimbursement = unavailable('Reimbursement creation is not available yet');
exports.updateReimbursement = unavailable('Reimbursement updates are not available yet');
exports.deleteReimbursement = unavailable('Reimbursement deletion is not available yet');
