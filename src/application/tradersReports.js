const orders = require('../domain/models/orders');
const traders = require('../domain/models/trader');
const response = require('../shared/sharedResponse');
const mongoose = require('mongoose');
class Reports {
    async getAllTraderOrders(req, res){
        const traderId = req.user?.id;
        console.log('Trader ID:', traderId);
        try{
            const ordersList = (await orders.find({ traderId: traderId })).reverse();
            return response.success(res, ordersList, 'Orders fetched successfully');
        }catch(error){
            return response.serverError(res, error.message);
        }
    }

    async getTraderOrdersById(req, res) {
        const traderId = req.user?.id;
        const orderId = req.params .id;
        try {
            const order = await orders.find({ orderId, traderId });
            if (!order) {
                return response.notFound(res, 'No orders found for this trader');
            }
            return response.success(res, order, 'Orders fetched successfully');
        } catch (error) {
            return response.serverError(res, error.message);
        }
    }

    async updateOrderStatus(req, res) {
        const traderId = req.user?.id;
        const { orderId, status } = req.body;
        const validStatuses = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return response.badRequest(res, 'Invalid status');
        }

        try {
            const updatedOrder = await orders.findOneAndUpdate(
                { _id: orderId, traderId },
                { status },
                { new: true }
            );

            if (!updatedOrder) {
                return response.notFound(res, 'Order not found or not authorized');
            }

            return response.success(res, updatedOrder, 'Order status updated');
        } catch (error) {
            return response.serverError(res, error.message);
        }
    }

    async getWeeklySalesReport(req, res) {
        try {
            const traderId = new mongoose.Types.ObjectId(req.user?.id); 
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
            const endDate = new Date();
            const ordersInRange = await orders.find({
                traderId,
                orderDate: { $gte: startDate, $lte: endDate }
            })
            .populate('userId', '-favourites -password -createdAt')
            .populate('productId');
            const weeklySales = await orders.aggregate([
                {
                    $match: {
                        traderId,
                        orderDate: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalSales: { $sum: '$totalPrice' },
                        totalOrders: { $sum: 1 }
                    }
                }
            ]);
            const result = {
                totalSales: weeklySales[0]?.totalSales || 0,
                totalOrders: weeklySales[0]?.totalOrders || 0,
                orders: ordersInRange
            };

            return response.success(res, result, 'Weekly sales report fetched successfully');
        } catch (error) {
            return response.serverError(res, error.message);
        }
    }

    async filterOrdersWithStatus(req, res) {
        try {
            const traderId = new mongoose.Types.ObjectId(req.user?.id);
            const { state } = req.body;
            const validStatuses = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];
            if (!state || !validStatuses.includes(state)) {
                return response.badRequest(res, 'Invalid or missing status');
            }
            const ordersList = await orders
                .find({ traderId, status: state })
                .select('-__v')      
                .lean()
                .populate('userId');              

            return response.success(res, ordersList, 'Filtered orders fetched successfully');
        } catch (error) {
            return response.serverError(res, error.message);
        }
    }
}

module.exports = new Reports();