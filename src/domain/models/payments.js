const mongoose = require('mongoose');
const paymentScehma = new mongoose.Schema({
    amount: {
        type: Number,
    },
    refNumber: {
        type: String
    },
    method: {
        type: String
    },
    status: {
        type: String
    }
});

const paymentModel = mongoose.model('Payment', paymentScehma);
module.exports = paymentModel;