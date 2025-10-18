const express = require('express');
const { sendSms } = require('../../application/smsSending');
const router = express.Router();

router.post('/send-sms', sendSms);

module.exports = router;