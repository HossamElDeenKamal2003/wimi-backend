// import { fatora, tamaraPay, emkan } from '../../application/payments/fatora.js';
const { fatora, emkan, tamaraPay } = require('../../application/payments/fatora.js')
const fatoraController = fatora;
const tamaraController = tamaraPay;
const emkanController = emkan;

module.exports = { fatoraController, tamaraController, emkanController };
