// src/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment');
const decodeToken = require('../../middlewares/decodeToken');

router.post('/pay', decodeToken, paymentController.handleCreatePayment);
router.get('/callback', decodeToken, paymentController.handlePaymentCallback);

module.exports = router;
