// src/application/payments/paymentService.js
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const Order = require('../domain/models/orders');

const MOYASAR_API_KEY = 'sk_test_sRRnJzbHBm946NYeGZfYXgnYgj3CWwgmMR2eYKEz';

async function createPayment(userId, data) {
  const payload = {
    given_id: uuidv4(),
    amount: data.amount,
    currency: 'SAR',
    description: 'Test payment',
    callback_url: 'https://backendb2b.kadinabiye.com/payment/callback',
    source: {
      type: 'creditcard',
      name: data.name,
      number: data.number,
      month: data.month,
      year: data.year,
      cvc: data.cvc,
      statement_descriptor: 'Test Store',
      '3ds': true,
      manual: false,
      save_card: false
    },
    metadata: {
      customer_email: data.email,
      customer_id: userId,
      order_id: data.orderId
    },
    apply_coupon: false
  };

  const response = await axios.post('https://api.moyasar.com/v1/payments', payload, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    auth: {
      username: MOYASAR_API_KEY,
      password: ''
    }
  });

  return response.data;
}

async function handlePaymentCallback(paymentId) {
  const response = await axios.get(`https://api.moyasar.com/v1/payments/${paymentId}`, {
    auth: {
      username: MOYASAR_API_KEY,
      password: ''
    }
  });

  const payment = response.data;

  if (payment.status === 'paid') {
    const orderId = payment.metadata?.order_id;

    if (!orderId) throw new Error('order_id missing in metadata');

    await Order.findByIdAndUpdate(orderId, { paymentStatus: 'paid' });
    return { success: true };
  }

  return { success: false };
}

module.exports = {
  createPayment,
  handlePaymentCallback
};
