const express = require('express');
const { protect, checkModuleAccess } = require('../middlewares/auth');
const controller = require('../controllers/retailController');

const router = express.Router();
router.use(protect, checkModuleAccess('sales'));
router.get('/summary', controller.getSummary);
router.route('/products').get(controller.getProducts).post(controller.createProduct);
router.route('/products/:id').put(controller.updateProduct);
router.post('/products/:id/stock-adjustment', controller.adjustStock);
router.route('/orders').get(controller.getOrders).post(controller.createOrder);
router.route('/orders/:id').put(controller.updateOrder);

module.exports = router;
