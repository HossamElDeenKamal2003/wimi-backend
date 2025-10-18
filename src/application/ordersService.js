const Orders = require('../domain/models/orders');
const productsModel = require('../domain/models/products');
const listShopping = require('../domain/models/cardShoppings');
const response = require('../shared/sharedResponse');

class OrderService {
    async addOrder(req, res) {
        const userId = req.user?.id;
        const { productId, quantity, totalPrice } = req.body;
        try {
            const product = await productsModel.findOne({ _id: productId }).select('traderId').lean();
            if (!productId) {
                return response.badRequest(res, 'Product ID is required');
            }

            if (!product) {
                console.log(productId);
                return response.notFound(res, 'Product not found');
            }
            const traderId = product.traderId;
            const orderData = { ...req.body, userId, traderId, quantity, totalPrice };
            const newOrder = new Orders(orderData);
            await newOrder.save();
            response.success(res, newOrder, 'Order created', 201);
            const cartItem = await listShopping.findOneAndDelete({ userId, productId });
            if(cartItem){
                console.log("Item Deleted Successfully From Cart Shopping");
            }else{
                console.log("Error While Deleting The Item From List Shopping");
            }
        } catch (error) {
            return response.serverError(res, error.message);
        }  
    }


    async updateOrder(req, res) {
        const userId = req.user?.id;
        const orderId = req.params.id;
        try {
            const order = await Orders.findById(orderId);
            if (!order) return response.notFound(res, 'Order not found');
            if (order.userId.toString() !== userId) return response.unauthorized(res, 'Not authorized');
            Object.assign(order, req.body);
            await order.save();
            return response.success(res, order, 'Order updated');
        } catch (error) {
            return response.serverError(res, error.message);
        }
    }

    async deleteOrder(req, res) {
        const userId = req.user?.id;
        const orderId = req.params.id;
        try {
            const order = await Orders.findById(orderId);
            if (!order) return response.notFound(res, 'Order not found');
            if (order.userId.toString() !== userId) return response.unauthorized(res, 'Not authorized');
            await order.deleteOne();
            return response.success(res, null, 'Order deleted');
        } catch (error) {
            return response.serverError(res, error.message);
        }
    }


}

module.exports = new OrderService();