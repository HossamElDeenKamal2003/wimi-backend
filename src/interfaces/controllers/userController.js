// src/interfaces/controllers/userController.js
const userService = require('../../application/userService');

module.exports = {
    signup: userService.signup.bind(userService),
    login: userService.login.bind(userService),
    addFavorite: userService.addFavorite.bind(userService),
    removeFavorite: userService.removeFavorite.bind(userService),
    listFavorites: userService.listFavorites.bind(userService),
    listCardShopping: userService.listCardShopping.bind(userService),
    addListShopping: userService.addListShopping.bind(userService),
    deleteFromShopping: userService.deleteFromShopping.bind(userService),
    cancellOrder: userService.cancellOrder.bind(userService),
    getMyNotificationController: userService.getMyNotification.bind(userService),
    verifyOtpController: userService.verifyOtp.bind(userService),
    getUserDataController: userService.getUserData.bind(userService)
};