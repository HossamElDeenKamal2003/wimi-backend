// src/interfaces/controllers/userController.js
const userService = require('../../application/directPayemntorders');

module.exports = {
    addDirectPaymentOrder: userService.addDirectPaymentOrder.bind(userService),
    sendPaymentLink: userService.sendPaymentLink.bind(userService),
    getOrdersByPhoneNumber: userService.getOrdersByPhoneNumber.bind(userService),
    deleteOrder: userService.deleteOrder.bind(userService),
    getOrders: userService.getOrders.bind(userService)
}; 