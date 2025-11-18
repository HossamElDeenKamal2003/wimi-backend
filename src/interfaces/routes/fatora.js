const {fatoraController,
    tamaraController,
    emkanController} = require('../controllers/fatora');

const express = require('express');
const router = express.Router();
router.post('/create-payment', (req, res) => fatoraController.createPayment(req, res));
router.post('/tamara', (req, res)=>tamaraController.createTamara(req, res));
router.get('/auth',(req, res)=>tamaraController.tamaraWebhookAuthorized(req, res));
router.post('/emkan', (req, res)=>emkanController.createEmkanOrder(req, res));
router.get('/payment-fatora', (req, res) => fatoraController.handlePaymentWebhook(req, res));
router.get('/payment-fail', (req, res)=>fatoraController.failFatora(req, res));
module.exports = router;