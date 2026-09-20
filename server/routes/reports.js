const express = require('express');
const router = express.Router();
const { protect, checkModuleAccess, authorize } = require('../middlewares/auth');

// Leave report controllers
const {
  getLeaveSummary,
  getMonthlyLeaveReport,
  getDepartmentLeaveReport,
  getEmployeeLeaveReport,
  getPersonalLeaveReport,
  getAllLeaves,
  getYearlyTrend,
} = require('../controllers/leaveReportController');

const {
  getLeadConversionReport,
  getSalesPerformanceReport,
  getMarketingROIReport
} = require('../controllers/reportsController');

// Protect all routes
router.use(protect);

// Leave Report Routes
router.get('/leaves/summary', checkModuleAccess('employee'), authorize('super_admin', 'admin'), getLeaveSummary);
router.get('/leaves/all', checkModuleAccess('employee'), authorize('super_admin', 'admin'), getAllLeaves);
router.get('/leaves/monthly', checkModuleAccess('employee'), authorize('super_admin', 'admin'), getMonthlyLeaveReport);
router.get('/leaves/department', checkModuleAccess('employee'), authorize('super_admin', 'admin'), getDepartmentLeaveReport);
router.get('/leaves/employee', checkModuleAccess('employee'), authorize('super_admin', 'admin'), getEmployeeLeaveReport);
router.get('/leaves/yearly-trend', checkModuleAccess('employee'), authorize('super_admin', 'admin'), getYearlyTrend);
router.get('/leaves/:employeeId', checkModuleAccess('employee'), getPersonalLeaveReport);

// CRM Reports
router.get('/leads/conversion', checkModuleAccess('sales'), getLeadConversionReport);
router.get('/sales/performance', checkModuleAccess('sales'), getSalesPerformanceReport);
router.get('/marketing/roi', checkModuleAccess('marketing'), getMarketingROIReport);

module.exports = router;

