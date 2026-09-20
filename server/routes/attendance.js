const express = require('express');
const router = express.Router();
const {
  checkInSelf,
  checkOutSelf,
  getAttendanceSelf,
  getTodayStatusSelf,
} = require('../controllers/attendanceController');
const { protect } = require('../middlewares/auth');

// All routes require authentication
router.use(protect);

// Self-attendance routes (for current user - admin/employee)
router.post('/checkin', checkInSelf);
router.post('/checkout', checkOutSelf);
router.get('/', getAttendanceSelf);
router.get('/today', getTodayStatusSelf);

module.exports = router;

