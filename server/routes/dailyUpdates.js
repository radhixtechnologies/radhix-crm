const express = require('express');
const router = express.Router();
const { protect, checkModuleAccess } = require('../middlewares/auth');
const controller = require('../controllers/dailyUpdateController');

// All daily update routes require authentication and employee module access
router.use(protect);
router.use(checkModuleAccess('employee'));

// Tracker and today routes must come before parameterized /:id route
router.get('/tracker', controller.getSubmissionTracker);
router.get('/today', controller.getTodayUpdate);

router.route('/')
  .get(controller.getDailyUpdates)
  .post(controller.saveDailyUpdate);

router.route('/:id')
  .get(controller.getDailyUpdate)
  .delete(controller.deleteDailyUpdate);

router.post('/:id/feedback', controller.submitFeedback);

module.exports = router;
