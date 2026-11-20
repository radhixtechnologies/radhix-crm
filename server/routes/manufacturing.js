const express = require('express');
const { protect, checkModuleAccess } = require('../middlewares/auth');
const controller = require('../controllers/manufacturingController');

const router = express.Router();
router.use(protect, checkModuleAccess('sales'));
router.get('/summary', controller.getSummary);
router.route('/products').get(controller.getProducts).post(controller.createProduct);
router.route('/products/:id').put(controller.updateProduct).delete(controller.deleteProduct);
router.post('/products/:id/stock-adjustment', controller.adjustStock);
router.route('/suppliers').get(controller.getSuppliers).post(controller.createSupplier);
router.route('/suppliers/:id').put(controller.updateSupplier).delete(controller.deleteSupplier);
router.route('/orders').get(controller.getOrders).post(controller.createOrder);
router.route('/orders/:id').put(controller.updateOrder).delete(controller.deleteOrder);

module.exports = router;
