const Orders = require('../domain/models/orders');
const productsModel = require('../domain/models/products');
const listShopping = require('../domain/models/cardShoppings');
const response = require('../shared/sharedResponse');

class OrderService {
    async addOrder(req, res) {
        const userId = req.user?.id;
        const { products } = req.body;

        try {
            // Validate
            if (!products || !Array.isArray(products) || products.length === 0) {
            return response.badRequest(res, "Products array is required");
            }

            // Fetch traderId for each product and validate
            const productDetails = await Promise.all(
            products.map(async (item) => {
                const product = await productsModel.findById(item.productId).select("traderId").lean();
                if (!product) {
                throw new Error(`Product not found with ID: ${item.productId}`);
                }
                return {
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                traderId: product.traderId,
                };
            })
            );

            // Calculate total price automatically
            const totalPrice = productDetails.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            // Prepare order data
            const orderData = {
            userId,
            products: productDetails,
            totalPrice,
            status: "Pending", // optional field if your model supports it
            createdAt: new Date(),
            };

            // Save the new order
            const newOrder = new Orders(orderData);
            await newOrder.save();

            // Remove products from shopping cart after successful order
            const productIds = products.map(p => p.productId);
            await listShopping.deleteMany({ userId, productId: { $in: productIds } });

            console.log("🛒 Cart items deleted successfully after order creation.");

            return response.success(res, newOrder, "Order created successfully", 201);

        } catch (error) {
            console.error("❌ Error while adding order:", error.message);
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

    async getOrders(req, res){
        const userId = req.user?.id;
        try{
            const orders = await Orders.find().populate('products.productId products.traderId');
            console.log("orders : ", orders);
            console.log("id : ", userId)
            // const filteredOrders = orders.filter(order =>
            //     order.products.some(product => product.traderId.toString() === userId)
            // );         
            return response.success(res, orders)
        }catch(error){
            console.log(error);
            return response.serverError(res, error.message);
        }
    }


}

module.exports = new OrderService();