const express = require('express');
const router = express.Router();
const { protect, checkModuleAccess, authorize } = require('../middlewares/auth');
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

// Protect all routes
router.use(protect);
router.use(checkModuleAccess('finance'));

// Salary Slip routes - IMPORTANT: More specific routes must come before general routes
router.get('/salary-slips/calculate/:employeeId/:month/:year', (req, res, next) => {
  console.log('[Route Debug] Calculate route matched:', req.params);
  next();
}, getSalarySlipCalculation);

router.put('/salary-slip/:id/status', updateSalarySlipStatus);
router.post('/salary-slip/:id/send-email', sendSalarySlipEmail);
router.delete('/salary-slip/:id', deleteSalarySlip);
router.get('/salary-slip/:id', getSalarySlip);

// Main salary slip routes
router.route('/salary-slips')
  .get(getAllSalarySlips)
  .post(createSalarySlip);

// Generate salary slip endpoint (alias for POST /salary-slips)
router.post('/generate-salary-slip', createSalarySlip);

module.exports = router;

