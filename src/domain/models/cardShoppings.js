const mongoose = require('mongoose');

const listShoppingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    productId: {
        type: mongoose.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});

const listShopping = mongoose.model('cardShopping', listShoppingSchema);

module.exports = listShopping;