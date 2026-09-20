const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { getCalendarEvents, createEvent, updateEvent, deleteEvent } = require('../controllers/calendarController');

router.route('/')
    .get(protect, getCalendarEvents)
    .post(protect, createEvent);

router.route('/:id')
    .put(protect, updateEvent)
    .delete(protect, deleteEvent);

module.exports = router;
