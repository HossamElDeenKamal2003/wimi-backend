const mongoose = require('mongoose');
const requestSchema = new mongoose.Schema({
    traderId: {
        type: mongoose.Types.ObjectId,
        ref: 'Trader'
    },
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'User'
    },
    userPhoneNumber: {
        type: String
    },
    amount: {
        type: Number
    },
    status: {
        type: String
    }
});

const requestModel = mongoose.model('back', requestSchema);
module.exports = requestModel;