const express = require('express');
const { receiveExternalLeadWebhook } = require('../controllers/sales/leadRoutingController');

const router = express.Router();

router.post('/:provider', receiveExternalLeadWebhook);

module.exports = router;
