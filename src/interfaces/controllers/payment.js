// src/interfaces/controllers/paymentController.js
const paymentService = require('../../application/payments');

async function handleCreatePayment(req, res) {
  try {
    const userId = req.user?.id;
    const data = req.body;

    const result = await paymentService.createPayment(userId, data);
    res.json(result);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Payment failed', detail: error.response?.data || error.message });
  }
}

async function handlePaymentCallback(req, res) {
  const paymentId = req.query.id;

  try {
    const result = await paymentService.handlePaymentCallback(paymentId);

    if (result.success) {
      res.send('✅ Payment Successful! Order updated.');
    } else {
      res.send('❌ Payment Failed or Cancelled.');
    }
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).send('❌ Error verifying payment status.');
  }
}

module.exports = {
  handleCreatePayment,
  handlePaymentCallback
};
