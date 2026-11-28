const express = require('express');
const { getPublicQuotation, respondPublicQuotation } = require('../controllers/sales/quotationController');

const router = express.Router();

router.get('/:token', getPublicQuotation);
router.post('/:token/respond', respondPublicQuotation);

module.exports = router;
