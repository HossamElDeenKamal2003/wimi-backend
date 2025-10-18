// src/interfaces/controllers/productController.js
const productsService = require('../../application/productService');

module.exports = {
    addProduct: (req, res) => productsService.addProduct(req, res),
    updateProduct: (req, res) => productsService.updateProduct(req, res),
    deleteProduct: (req, res) => productsService.deleteProduct(req, res),
    getProductById: (req, res) => productsService.getProductById(req, res),
};