const mongoose = require('mongoose');

const directPaymentSchema = new mongoose.Schema({
    traderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trader',
    },
    phoneNumber: {
        type: String,
    },
    orders: [
        {
            order_id: {
                type: String,
                default: () => 'ORD-' + Math.random().toString().slice(2, 10),
                unique: true,
            },
            title: {
                type: String,
                required: true,
            },
            phoneNumber: {
                type: String,
            },
            description: {
                type: String,
                required: true,
            },
            price: {
                type: Number,
                required: true,
            },
            quantity: {
                type: Number,
            },
            status: {
                type: String,
                default: 'pending',
            },
        },
    ],
}, { timestamps: true });

const DirectPayment = mongoose.model('DirectPayment', directPaymentSchema);
module.exports = DirectPayment;
