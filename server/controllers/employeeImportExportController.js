const Employee = require('../models/Employee');
const { asyncHandler } = require('../utils/asyncHandler');

const sendNotImplemented = (message) => asyncHandler(async (req, res) => {
  res.status(501).json({ success: false, message });
});

exports.exportEmployeesCSV = sendNotImplemented('Employee CSV export is not available yet');
exports.exportEmployeesExcel = sendNotImplemented('Employee Excel export is not available yet');
exports.exportEmployeesPDF = sendNotImplemented('Employee PDF export is not available yet');
exports.importEmployees = sendNotImplemented('Employee import is not available yet');
exports.previewImport = sendNotImplemented('Employee import preview is not available yet');
exports.downloadImportTemplate = sendNotImplemented('Employee import template is not available yet');
exports.getImportLogs = asyncHandler(async (req, res) => {
  res.json({ success: true, data: [] });
});
