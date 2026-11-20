const express = require('express');
const { protect, checkModuleAccess } = require('../middlewares/auth');
const controller = require('../controllers/gymController');

const router = express.Router();
router.use(protect, checkModuleAccess('sales'));
router.get('/summary', controller.getSummary);
router.route('/members').get(controller.getMembers).post(controller.createMember);
router.route('/members/:id').put(controller.updateMember);
router.route('/trainers').get(controller.getTrainers).post(controller.createTrainer);
router.route('/trainers/:id').put(controller.updateTrainer);
router.route('/classes').get(controller.getClasses).post(controller.createClass);
router.route('/classes/:id').put(controller.updateClass);
router.post('/classes/:id/enroll', controller.enrollMember);
router.route('/check-ins').get(controller.getCheckIns).post(controller.createCheckIn);
router.put('/check-ins/:id/checkout', controller.checkOut);

module.exports = router;
