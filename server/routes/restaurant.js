const express = require('express');
const { protect, checkModuleAccess } = require('../middlewares/auth');
const controller = require('../controllers/restaurantController');

const router = express.Router();
router.use(protect, checkModuleAccess('sales'));
router.get('/summary', controller.getSummary);
router.route('/menu').get(controller.getMenu).post(controller.createMenuItem);
router.route('/menu/:id').put(controller.updateMenuItem).delete(controller.deleteMenuItem);
router.route('/tables').get(controller.getTables).post(controller.createTable);
router.put('/tables/:id', controller.updateTable);
router.route('/customers').get(controller.getCustomers).post(controller.createCustomer);
router.put('/customers/:id', controller.updateCustomer);
router.route('/reservations').get(controller.getReservations).post(controller.createReservation);
router.put('/reservations/:id', controller.updateReservation);
router.route('/orders').get(controller.getOrders).post(controller.createOrder);
router.put('/orders/:id', controller.updateOrder);
router.route('/ingredients').get(controller.getIngredients).post(controller.createIngredient);
router.route('/ingredients/:id').put(controller.updateIngredient).delete(controller.deleteIngredient);

module.exports = router;
