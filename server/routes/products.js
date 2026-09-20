const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    stockIn,
    stockOut
} = require('../controllers/productController');
const { protect, checkModuleAccess } = require('../middlewares/auth');

router.use(protect);

// Basic CRUD
router.get('/', checkModuleAccess('inventory'), getProducts);
router.get('/:id', checkModuleAccess('inventory'), getProduct);
router.post('/', checkModuleAccess('inventory'), createProduct);
router.put('/:id', checkModuleAccess('inventory'), updateProduct);
router.delete('/:id', checkModuleAccess('inventory'), deleteProduct);

// Stock Management
router.post('/:id/stock-in', checkModuleAccess('inventory'), stockIn);
router.post('/:id/stock-out', checkModuleAccess('inventory'), stockOut);

module.exports = router;
