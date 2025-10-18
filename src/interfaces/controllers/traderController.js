// src/interfaces/traderController.js
const traderService = require('../../application/traderService');

class TraderController {
    async signup(req, res) {
        return traderService.signup(req, res);
    }

    async login(req, res) {
        return traderService.login(req, res);
    }

    async getTraderById(req, res) {
        return traderService.getTraderById(req, res);
    }

    async getTraderProductsController(req, res) {
        return traderService.getTraderProducts(req, res);
    }

    async addCouponController(req, res){
        return traderService.addCoupon(req, res);
    }

    async getMyNotificationController(req, res){
        return traderService.getMyNotification(req, res);
    }

    async checkFoundUserController(req, res) {
        return traderService.checkFoundUser(req, res);
    }

    async directPaymentController(req, res) {
        return traderService.directPayment(req, res);
    }

    async requestOrderbyTraderController(req, res){
        return traderService.requestOrderbyTrader(req, res);
    }

    async verifyOtpController(req, res) {
        return traderService.verifyOtp(req, res);
    }

    async getMyDirectOrdersController(req, res){
        return traderService.getMyDirectOrders(req, res);
    }

    async getTraderDataController(req, res){
        return traderService.getTraderData(req, res);
    }

    async getWalletController(req, res){
        return traderService.getWallet(req, res);
    }
    
    async addRequestsController(req, res){
        return traderService.addRequests(req, res);
    }
}

module.exports = new TraderController();