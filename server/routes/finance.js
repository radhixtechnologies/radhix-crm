const express = require('express');
const router = express.Router();
const { protect, checkModuleAccess, authorize } = require('../middlewares/auth');
const { uploadReceipt } = require('../utils/upload');

// Invoice controllers
const {
  getInvoices,
  getInvoice,
  createInvoice,
  createInvoiceFromDeal,
  updateInvoice,
  deleteInvoice,
  generatePDF,
  sendEmail,
  updateStatus,
  getClients,
} = require('../controllers/finance/invoiceController');

// Expense controllers
const {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
} = require('../controllers/finance/expenseController');

// Payroll controllers
const {
  getPayrolls,
  getPayroll,
  generatePayroll,
  updatePayroll,
  generatePDF: generatePayrollPDF,
  downloadPayslip,
} = require('../controllers/finance/payrollController');

// Salary Structure controllers
const {
  getSalaryStructures,
  getSalaryStructure,
  getSalaryStructureByEmployee,
  createSalaryStructure,
  updateSalaryStructure,
  deleteSalaryStructure,
} = require('../controllers/finance/salaryStructureController');

// Salary Slip controllers
const {
  getPayrollEmployees,
  getAllSalarySlips,
  getSalarySlip,
  getSalarySlipCalculation,
  createSalarySlip,
  deleteSalarySlip,
  updateSalarySlipStatus,
  sendSalarySlipEmail,
} = require('../controllers/payrollController');

// Report controllers
const {
  exportInvoices,
  exportExpenses,
  exportPayroll,
  getFinancialSummary,
  getExpenseStats,
} = require('../controllers/finance/reportController');

// Reminder controllers
const {
  getReminders,
  createReminder,
  sendReminder,
  deleteReminder,
} = require('../controllers/finance/reminderController');

// Protect all routes
router.use(protect);
router.use(checkModuleAccess('finance'));

// Client routes (for invoice creation)
router.get('/clients', getClients);

// Invoice routes
router.route('/invoices')
  .get(getInvoices)
  .post(createInvoice);

router.post('/invoices/from-deal/:dealId', authorize(['admin', 'super_admin', 'accountant', 'sales']), createInvoiceFromDeal);

router.route('/invoices/:id')
  .get(getInvoice)
  .put(updateInvoice)
  .delete(deleteInvoice);

router.post('/invoices/:id/generate-pdf', generatePDF);
router.post('/invoices/:id/send-email', sendEmail);
router.put('/invoices/:id/status', updateStatus);

// Expense routes
router.route('/expenses')
  .get(getExpenses)
  .post(createExpense);

router.route('/expenses/:id')
  .get(getExpense)
  .put(updateExpense)
  .delete(deleteExpense);

// Expense receipt upload
router.post('/expenses/upload-receipt', uploadReceipt, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const fileUrl = `/uploads/expenses/${req.file.filename}`;

    res.status(200).json({
      success: true,
      data: {
        name: req.file.originalname,
        url: fileUrl,
        filename: req.file.filename,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Payroll routes
router.route('/payroll')
  .get(getPayrolls)
  .post(generatePayroll);

// Payroll employees route (MUST come before /payroll/:id to avoid route conflict)
router.get('/payroll/employees', getPayrollEmployees);

router.route('/payroll/:id')
  .get(getPayroll)
  .put(updatePayroll);

router.post('/payroll/:id/generate-pdf', generatePayrollPDF);
router.get('/payroll/:id/download', downloadPayslip);

// Report routes
router.get('/reports/invoices', exportInvoices);
router.get('/reports/expenses', exportExpenses);
router.get('/reports/payroll', exportPayroll);
router.get('/reports/summary', getFinancialSummary);
router.get('/reports/expense-stats', getExpenseStats);

// Tax routes
const {
  getTaxes,
  getTax,
  createTax,
  updateTax,
  deleteTax
} = require('../controllers/finance/taxController');

router.route('/taxes')
  .get(getTaxes)
  .post(authorize('super_admin', 'admin', 'accountant'), createTax);

router.route('/taxes/:id')
  .get(getTax)
  .put(authorize('super_admin', 'admin', 'accountant'), updateTax)
  .delete(authorize('super_admin', 'admin', 'accountant'), deleteTax);

// Reminder routes
router.route('/reminders')
  .get(getReminders)
  .post(createReminder);

router.post('/reminders/:id/send', sendReminder);
router.delete('/reminders/:id', deleteReminder);

// Quote routes
const quoteController = require('../controllers/quoteController');
router.get('/quotes', quoteController.getAllQuotes);
router.get('/quotes/:id', quoteController.getQuoteById);
router.post('/quotes', quoteController.createQuote);
router.put('/quotes/:id', quoteController.updateQuote);
router.delete('/quotes/:id', quoteController.deleteQuote);
router.post('/quotes/:id/send', quoteController.sendQuote);
router.post('/quotes/:id/accept', quoteController.acceptQuote);
router.post('/quotes/:id/convert', quoteController.convertToInvoice);

// Payment routes
const paymentController = require('../controllers/paymentController');
router.get('/payments', paymentController.getAllPayments);
router.get('/payments/:id', paymentController.getPaymentById);
router.get('/payments/invoice/:invoiceId', paymentController.getPaymentsByInvoice);
router.post('/payments', paymentController.createPayment);
router.put('/payments/:id', paymentController.updatePayment);
router.delete('/payments/:id', paymentController.deletePayment);
router.post('/payments/:id/refund', paymentController.refundPayment);

// Finance Reports routes
const financeReportController = require('../controllers/financeReportController');
router.get('/reports/finance-dashboard', financeReportController.getRevenueDashboard);
router.get('/reports/outstanding-invoices', financeReportController.getOutstandingReport);
router.get('/reports/profit-loss-statement', financeReportController.getProfitLossReport);
router.get('/reports/revenue-by-sales-rep', financeReportController.getRevenueBySalesRep);
router.get('/reports/revenue-by-product', financeReportController.getRevenueByProduct);
router.get('/reports/cash-flow-forecast', financeReportController.getCashFlowForecast);

// Salary Slip routes
// IMPORTANT: More specific routes must come before general routes
router.get('/salary-slips/calculate/:employeeId/:month/:year', (req, res, next) => {
  console.log('[Route Debug] Calculate route matched:', req.params);
  next();
}, getSalarySlipCalculation);
router.put('/salary-slips/:id/status', updateSalarySlipStatus);
router.post('/salary-slips/:id/send-email', sendSalarySlipEmail);
router.delete('/salary-slips/:id', deleteSalarySlip);
router.get('/salary-slips/:id', getSalarySlip);
router.route('/salary-slips')
  .get(getAllSalarySlips)
  .post(createSalarySlip);

// Salary Structure routes
// GET routes - Admin/SuperAdmin can view all, Employees can view own
router.get('/salary-structures', getSalaryStructures);
router.get('/salary-structures/:id', getSalaryStructure);
router.get('/salary-structures/employee/:employeeId', getSalaryStructureByEmployee);

// POST/PUT/DELETE routes - Admin/SuperAdmin only
router.post('/salary-structures', authorize('super_admin', 'admin'), createSalaryStructure);
router.put('/salary-structures/:id', authorize('super_admin', 'admin'), updateSalaryStructure);
router.delete('/salary-structures/:id', authorize('super_admin', 'admin'), deleteSalaryStructure);

module.exports = router;
