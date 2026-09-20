const express = require('express');
const router = express.Router();
const {
  getSuperAdminOverview,
  getHRMInsights,
  getAttendanceOverview,
  getSalesSummary,
  getFinanceSummary,
  getNotifications,
  getActivityLog,
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middlewares/auth');

// All routes require authentication
router.use(protect);
// Allow super_admin and admin roles (which includes all manager roles via the authorize mapping)
router.use(authorize('super_admin', 'admin'));

// Dashboard routes
router.get('/superadmin/overview', getSuperAdminOverview);
router.get('/superadmin/hrm', getHRMInsights);
router.get('/superadmin/attendance', getAttendanceOverview);
router.get('/superadmin/sales', getSalesSummary);
router.get('/superadmin/finance', getFinanceSummary);
router.get('/superadmin/notifications', getNotifications);
router.get('/superadmin/activity', getActivityLog);

module.exports = router;

