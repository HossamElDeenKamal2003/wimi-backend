const ReportsService = require('../../application/tradersReports');

// Just forward the request to the service methods
module.exports = {
    getAllTraderOrders: (req, res) => ReportsService.getAllTraderOrders(req, res),

    getTraderOrdersById: (req, res) => ReportsService.getTraderOrdersById(req, res),

    updateOrderStatus: (req, res) => ReportsService.updateOrderStatus(req, res),

    getWeeklySalesReport: (req, res) => ReportsService.getWeeklySalesReport(req, res),

    filterOrdersWithStatus: (req, res) => ReportsService.filterOrdersWithStatus(req, res)
};
