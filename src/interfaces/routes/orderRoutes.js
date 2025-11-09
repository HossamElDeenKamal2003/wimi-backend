const express = require('express');
const orderController = require('../controllers/orderController');
const decodeToken = require('../../middlewares/decodeToken');
const router = express.Router();

router.post('/', decodeToken, orderController.addOrder);
router.put('/:id', decodeToken, orderController.updateOrder);
router.delete('/:id', decodeToken, orderController.deleteOrder);
router.get('/', decodeToken, orderController.getOrders)
module.exports = router;