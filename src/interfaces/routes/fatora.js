const fatoraController = require('../controllers/fatora');
const express = require('express');
const router = express.Router();
router.post('/create-payment', (req, res) => fatoraController.createPayment(req, res));
router.post('/tamara', (req, res)=>fatoraController.createTamara(req, res));
router.post('/emkan', (req, res)=>fatoraController.createEmkanOrder(req, res));
module.exports = router;