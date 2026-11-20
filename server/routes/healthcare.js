const express = require('express');
const { protect, checkModuleAccess } = require('../middlewares/auth');
const controller = require('../controllers/healthcareController');

const router = express.Router();
router.use(protect, checkModuleAccess('sales'));

router.get('/summary', controller.getSummary);
router.route('/patients')
  .get(controller.getPatients)
  .post(controller.createPatient);
router.route('/patients/:id')
  .put(controller.updatePatient)
  .delete(controller.deletePatient);
router.route('/appointments')
  .get(controller.getAppointments)
  .post(controller.createAppointment);
router.route('/appointments/:id')
  .put(controller.updateAppointment)
  .delete(controller.deleteAppointment);

module.exports = router;
