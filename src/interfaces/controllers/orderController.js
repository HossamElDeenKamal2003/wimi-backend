const orderService = require('../../application/ordersService');

module.exports = {
    addOrder: (req, res) => orderService.addOrder(req, res),
    updateOrder: (req, res) => orderService.updateOrder(req, res),
    deleteOrder: (req, res) => orderService.deleteOrder(req, res),
    getOrders: (req,res)=>orderService.getOrders(req, res)
};