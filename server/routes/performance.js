const express = require('express');
const router = express.Router();
const { protect, checkModuleAccess, authorize } = require('../middlewares/auth');

const {
  getGoals,
  getAllGoals,
  createGoal,
  updateGoal,
  submitSelfReview,
  submitManagerReview,
  getReviews,
  getAllReviews,
  createCycle,
  getCycles,
} = require('../controllers/performanceController');

// Protect all routes
router.use(protect);
router.use(checkModuleAccess('employee'));

// Goals routes
router.get('/goals', authorize('super_admin', 'admin'), getAllGoals);
router.get('/goals/:employeeId', getGoals);
router.post('/goals', authorize('super_admin', 'admin'), createGoal);
router.put('/goals/:id', authorize('super_admin', 'admin'), updateGoal);

// Review routes
router.get('/reviews', authorize('super_admin', 'admin'), getAllReviews);
router.get('/reviews/:employeeId', getReviews);
router.post('/self-review', submitSelfReview);
router.post('/manager-review', authorize('super_admin', 'admin'), submitManagerReview);

// Appraisal cycle routes
router.post('/cycles', authorize('super_admin', 'admin'), createCycle); // Only admin can create
router.get('/cycles', getCycles); // All users can view cycles

module.exports = router;

