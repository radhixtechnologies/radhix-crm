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

// Protect all routes with authentication
router.use(protect);

// Employees can view their own salary slips
router.get('/salary-slips', getAllSalarySlips);
router.get('/salary-slip/:id', getSalarySlip);

// Finance management routes (Creation, calculations, deletions, status updates)
router.use(checkModuleAccess('finance'));

router.get('/salary-slips/calculate/:employeeId/:month/:year', (req, res, next) => {
  console.log('[Route Debug] Calculate route matched:', req.params);
  next();
}, getSalarySlipCalculation);

router.post('/salary-slips', createSalarySlip);
router.post('/generate-salary-slip', createSalarySlip);
router.put('/salary-slip/:id/status', updateSalarySlipStatus);
router.post('/salary-slip/:id/send-email', sendSalarySlipEmail);
router.delete('/salary-slip/:id', deleteSalarySlip);

module.exports = router;

