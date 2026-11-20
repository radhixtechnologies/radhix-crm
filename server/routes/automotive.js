const express = require('express');
const { protect, checkModuleAccess } = require('../middlewares/auth');
const controller = require('../controllers/automotiveController');

const router = express.Router();
router.use(protect, checkModuleAccess('sales'));
router.get('/summary', controller.getSummary);
router.route('/customers').get(controller.getCustomers).post(controller.createCustomer);
router.route('/customers/:id').put(controller.updateCustomer).delete(controller.deleteCustomer);
router.route('/vehicles').get(controller.getVehicles).post(controller.createVehicle);
router.route('/vehicles/:id').put(controller.updateVehicle).delete(controller.deleteVehicle);
router.route('/jobs').get(controller.getJobs).post(controller.createJob);
router.route('/jobs/:id').put(controller.updateJob).delete(controller.deleteJob);
router.route('/parts').get(controller.getParts).post(controller.createPart);
router.route('/parts/:id').put(controller.updatePart).delete(controller.deletePart);

module.exports = router;
