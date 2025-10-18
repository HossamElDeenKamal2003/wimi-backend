const DirectPayment = require('../domain/models/directPaymentModel');
const response = require('../shared/sharedResponse');
const { sendOtp } = require('../domain/whatsapp/whatsapp');
const users = require('../domain/models/userModel');
const axios = require('axios');

class DirectPaymentOrders {
    async addDirectPaymentOrder(req, res) {
     const traderId = req.user?.id;
        try {
            const { orders } = req.body;

            if (!Array.isArray(orders) || orders.length === 0) {
                return response.badRequest(res, 'Orders must be a non-empty array');
            }

            // Validate and format orders
            const formattedOrders = orders.map((order) => {
                if (!order.title || !order.price || !order.quantity) {
                    throw new Error('Each order must include title, price, and quantity');
                }

                return {
                    orderId: order.orderId || `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    title: order.title,
                    description: order.description || '',
                    price: order.price,
                    quantity: order.quantity,
                    phoneNumber: order.phoneNumber || '',
                    amount: order.amount || order.price * order.quantity,
                    status: 'pending',
                };
            });

            const newDirectPayment = new DirectPayment({
                traderId,
                orders: formattedOrders,
            });

            await newDirectPayment.save();

            return response.success(
                res,
                newDirectPayment,
                'Direct payment orders created successfully',
                201
            );
        } catch (error) {
            console.error(error);
            return response.serverError(res, error.message);
        }
    }

    async sendPaymentLink(req, res) {
        const { phoneNumber, orderId, name, amount } = req.body;

        try {
            const directPayment = await DirectPayment.findOne({
            orders: { $elemMatch: { order_id: orderId } }
            });
            if (!directPayment) {
                return response.notFound(res, 'Order not found');
            }
            const order = directPayment.orders.find(o => o.order_id === orderId);
            const payload = {
                amount: Number(amount),
                currency: 'SAR',
                order_id: order.order_id,
                client: {
                    phone: phoneNumber,
                    name: name || 'Customer',
                },
                language: 'ar',
                success_url: 'https://backendb2b.kadinabiye.com/success',
                failure_url: 'https://backendb2b.kadinabiye.com/failure',
                save_token: true,
            };
            console.log('🚀 Sending payload to Fatora:', JSON.stringify(payload, null, 2));
            const fatoraResponse = await axios.post(
                'https://api.fatora.io/v1/payments/checkout',
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'api_key': 'E4B73FEE-F492-4607-A38D-852B0EBC91C9',
                    },
                }
            );
            const paymentLink = fatoraResponse.data?.result?.checkout_url || null;
            order.status = 'link_sent';
            order.phoneNumber = phoneNumber; 
            await directPayment.save();
            if (paymentLink) {
                const message = `🔗 رابط الدفع الخاص بك هو:\n${paymentLink}\n\nالرجاء إتمام العملية.`;
                console.log('🚀 Sending OTP message:', message);
                await sendOtp(phoneNumber, message);
            }
 
            return response.success(res, { paymentLink }, 'Payment link sent successfully');
        } catch (error) {
            console.error(error);
            return response.serverError(res, error.message);
        }
    }

    async getOrdersByPhoneNumber(req, res) {
        const traderId = req.user?.id;
        const { phoneNumber } = req.params;

        try {
            const directPayments = await DirectPayment.find({traderId: traderId, 'orders.phoneNumber': phoneNumber });

            if (!directPayments || directPayments.length === 0) {
                return response.notFound(res, 'No orders found for this phone number');
            }
            const orders = [];
            directPayments.forEach(dp => {
                dp.orders.forEach(order => {
                    if (order.phoneNumber === phoneNumber) {
                        orders.push(order);
                    }
                });
            });

            return response.success(res, orders, 'Orders fetched successfully');
        } catch (error) {
            console.error(error);
            return response.serverError(res, error.message);
        }
    }

    async deleteOrder(req, res) {
        const { orderId } = req.params;

        try {
            const directPayment = await DirectPayment.findOne({ 'orders.order_id': orderId });
            if (!directPayment) {
                return response.notFound(res, 'Order not found');
            }

            directPayment.orders = directPayment.orders.filter(o => o.order_id !== orderId);
            await directPayment.save();

            return response.success(res, null, 'Order deleted successfully');
        } catch (error) {
            console.error(error);
            return response.serverError(res, error.message);
        }
    }

    async getOrders(req, res) {
        const orderId = req.params.orderId;

        try {
            // 🔹 ابحث عن الطلب
            const order = await DirectPayment.findOne({ _id: orderId });

            if (!order) {
            return response.notFound(res, "Order not found");
            }

            // 🔹 تأكد أن orders موجودة ومصفوفة
           const totalPrice = Array.isArray(order.orders)
            ? order.orders.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 1)), 0)
            : 0;


            // 🔹 حساب النسب المضافة
            const addedValue10 = totalPrice * 0.10;
            const addedValue1_5 = totalPrice * 0.015; 
            const totalPrice2 = totalPrice + addedValue10 + addedValue1_5;
            // 🔹 رجع النتيجة
            return response.success(
            res,
            {
                order,
                totalPrice,
                addedValue10,
                addedValue1_5,
                totalPrice2
            },
            "Order fetched successfully"
            );
        } catch (error) {
            console.error(error);
            return response.serverError(res, error.message);
        }
        }

}

module.exports = new DirectPaymentOrders();
