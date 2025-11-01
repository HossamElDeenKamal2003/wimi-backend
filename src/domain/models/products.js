const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    traderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trader',
        required: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    stockQuantity: {
        type: Number,
        required: true,
        min: 0
    },
    images: {
        type: [String],
    },
    verify: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;