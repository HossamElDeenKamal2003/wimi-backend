const express = require('express');
const productController = require('../controllers/productController');
const decodeToken = require('../../middlewares/decodeToken');
const upload = require('../../middlewares/upload');

const router = express.Router();
router.post('/', decodeToken, upload.array('images', 5), productController.addProduct);
router.put('/:id', decodeToken, productController.updateProduct);
router.delete('/:id', decodeToken, productController.deleteProduct);
router.get('/:id', productController.getProductById);
module.exports = router; 