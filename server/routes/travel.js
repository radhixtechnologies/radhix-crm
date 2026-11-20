const express = require('express');
const { protect, checkModuleAccess } = require('../middlewares/auth');
const controller = require('../controllers/travelController');

const router = express.Router();
router.use(protect, checkModuleAccess('sales'));
router.get('/summary', controller.getSummary);
router.route('/packages').get(controller.getPackages).post(controller.createPackage);
router.route('/packages/:id').put(controller.updatePackage).delete(controller.deletePackage);
router.route('/bookings').get(controller.getBookings).post(controller.createBooking);
router.route('/bookings/:id').put(controller.updateBooking).delete(controller.deleteBooking);

module.exports = router;
