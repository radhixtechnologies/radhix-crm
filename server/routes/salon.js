const express = require('express');
const { protect, checkModuleAccess } = require('../middlewares/auth');
const controller = require('../controllers/salonController');

const router = express.Router();
router.use(protect, checkModuleAccess('sales'));

router.get('/summary', controller.getSummary);
router.route('/services').get(controller.getServices).post(controller.createService);
router.route('/services/:id').put(controller.updateService);
router.route('/staff').get(controller.getStaff).post(controller.createStaff);
router.route('/staff/:id').put(controller.updateStaff);
router.route('/clients').get(controller.getClients).post(controller.createClient);
router.route('/clients/:id').put(controller.updateClient);
router.route('/products').get(controller.getProducts).post(controller.createProduct);
router.route('/products/:id').put(controller.updateProduct);
router.route('/appointments').get(controller.getAppointments).post(controller.createAppointment);
router.route('/appointments/:id').put(controller.updateAppointment).delete(controller.deleteAppointment);

module.exports = router;
