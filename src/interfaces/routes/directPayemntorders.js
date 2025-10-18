const express = require('express');
const router = express.Router();
const directPaymentOrdersController = require('../controllers/directPaymentOrdersController');
const decodeToken = require('../../middlewares/decodeToken');
const { decode } = require('jsonwebtoken');
router.post(
  '/orders',
  decodeToken, 
  directPaymentOrdersController.addDirectPaymentOrder
);

router.post(
  '/send-link',
  directPaymentOrdersController.sendPaymentLink
);
router.get(
  '/:phoneNumber',
  decodeToken, 
  directPaymentOrdersController.getOrdersByPhoneNumber
);

router.delete(
  '/:orderId',
  directPaymentOrdersController.deleteOrder
);

router.get('/order/:orderId', directPaymentOrdersController.getOrders);

module.exports = router;
