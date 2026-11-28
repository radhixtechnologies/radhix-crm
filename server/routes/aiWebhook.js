const express = require('express');
const { receiveAiCallWebhook } = require('../controllers/sales/aiCallingController');

const router = express.Router();

router.post('/', receiveAiCallWebhook);

module.exports = router;
