const mongoose = require('mongoose');

const favouriteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    }
});

const favouriteModel = mongoose.model('favourites', favouriteSchema);

module.exports = favouriteModel;