const express = require('express');
const { verifyWebhook, receiveWebhook } = require('../controllers/metaLeadWebhookController');

const router = express.Router();

router.get('/', verifyWebhook);
router.post('/', receiveWebhook);

module.exports = router;