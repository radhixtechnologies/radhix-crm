const Employee = require('../models/Employee');
const { asyncHandler } = require('../utils/asyncHandler');
const XLSX = require('xlsx');
const fs = require('fs');
const PDFDocument = require('pdfkit');

const fields = ['employeeId', 'firstName', 'lastName', 'email', 'department', 'designation', 'phone', 'joiningDate'];
const getRows = async () => (await Employee.find().populate('user', 'name email').lean()).map((employee) => ({ employeeId: employee.employeeId, firstName: employee.user?.name?.split(' ')[0] || '', lastName: employee.user?.name?.split(' ').slice(1).join(' ') || '', email: employee.user?.email || '', department: employee.department, designation: employee.designation, phone: employee.phone, joiningDate: employee.joiningDate }));
const sendWorkbook = (res, rows, filename, type) => { const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows)); const buffer = XLSX.write(workbook, { type: 'buffer', bookType: type }); res.setHeader('Content-Disposition', `attachment; filename=${filename}`); res.type(type === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); res.send(buffer); };
exports.exportEmployeesCSV = asyncHandler(async (req, res) => sendWorkbook(res, await getRows(), 'employees.csv', 'csv'));
exports.exportEmployeesExcel = asyncHandler(async (req, res) => sendWorkbook(res, await getRows(), 'employees.xlsx', 'xlsx'));
exports.exportEmployeesPDF = asyncHandler(async (req, res) => { const rows = await getRows(); const doc = new PDFDocument({ margin: 36, size: 'A4', layout: 'landscape' }); res.setHeader('Content-Disposition', 'attachment; filename=employees.pdf'); res.type('application/pdf'); doc.pipe(res); doc.fontSize(18).text('Employee Directory', { align: 'center' }).moveDown(); doc.fontSize(9); rows.forEach((row) => doc.text(`${row.employeeId || '-'} | ${row.firstName} ${row.lastName} | ${row.email} | ${row.department} | ${row.designation} | ${row.phone || '-'}`)); doc.end(); });
const parseUpload = (req) => { if (!req.file) throw new Error('Import file is required'); const workbook = XLSX.read(fs.readFileSync(req.file.path), { type: 'buffer' }); return XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]); };
exports.previewImport = asyncHandler(async (req, res) => { const rows = parseUpload(req); res.json({ success: true, data: { rows, count: rows.length, fields } }); });
exports.importEmployees = asyncHandler(async (req, res) => { const rows = parseUpload(req); res.json({ success: true, message: 'Import preview accepted; create users before employee records', data: { count: rows.length, rows } }); });
exports.downloadImportTemplate = asyncHandler(async (req, res) => sendWorkbook(res, [Object.fromEntries(fields.map((field) => [field, '']))], 'employee-import-template.xlsx', 'xlsx'));
exports.getImportLogs = asyncHandler(async (req, res) => {
  res.json({ success: true, data: [] });
});
