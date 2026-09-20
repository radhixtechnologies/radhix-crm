const express = require('express');
const router = express.Router();
const {
    getActivities,
    createActivity,
    updateActivity,
    deleteActivity,
    getUpcomingActivities
} = require('../controllers/activityController');
const { protect } = require('../middlewares/auth');

// Protect all routes
router.use(protect);

router.route('/')
    .get(getActivities)
    .post(createActivity);

router.get('/upcoming', getUpcomingActivities);

router.route('/:id')
    .put(updateActivity)
    .delete(deleteActivity);

module.exports = router;
