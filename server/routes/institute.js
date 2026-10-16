const express = require('express');
const router = express.Router();
const { protect, checkModuleAccess } = require('../middlewares/auth');

// Controllers
const courseController = require('../controllers/institute/courseController');
const batchController = require('../controllers/institute/batchController');
const followupController = require('../controllers/institute/followupController');
const studentController = require('../controllers/institute/studentController');
const feeController = require('../controllers/institute/feeController');
const attendanceController = require('../controllers/institute/attendanceController');
const reportController = require('../controllers/institute/reportController');

// All institute routes require authentication and sales/institute module access
router.use(protect);
router.use(checkModuleAccess('sales'));

// 1. Courses
router.route('/courses')
  .get(courseController.getCourses)
  .post(courseController.createCourse);

router.route('/courses/:id')
  .get(courseController.getCourse)
  .put(courseController.updateCourse)
  .delete(courseController.deleteCourse);

// 2. Batches
router.route('/batches')
  .get(batchController.getBatches)
  .post(batchController.createBatch);

router.route('/batches/:id')
  .get(batchController.getBatch)
  .put(batchController.updateBatch)
  .delete(batchController.deleteBatch);

// 3. Follow-ups
router.route('/followups')
  .get(followupController.getFollowUps)
  .post(followupController.scheduleFollowUp);

router.route('/followups/:id')
  .put(followupController.updateFollowUp)
  .delete(followupController.deleteFollowUp);

// 4. Students & Enrollment
router.route('/students')
  .get(studentController.getStudents);

router.post('/students/enroll', studentController.enrollStudent);

router.route('/students/:id')
  .get(studentController.getStudent)
  .put(studentController.updateStudent)
  .delete(studentController.deleteStudent);

// 5. Fees & Payments
router.route('/fees')
  .get(feeController.getFees);

router.route('/fees/:id')
  .get(feeController.getFee);

router.post('/fees/:id/payments', feeController.recordPayment);

// 6. Attendance
router.get('/attendance/roster/:batchId', attendanceController.getBatchRoster);
router.post('/attendance', attendanceController.saveBatchAttendance);
router.get('/attendance/history', attendanceController.getAttendanceHistory);

// 7. Reports
router.get('/reports/overview', reportController.getOverviewReports);

module.exports = router;
