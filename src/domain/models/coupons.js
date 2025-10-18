const mongoose = require('mongoose');

const couponsSchema = new mongoose.Schema ({
    markterName: {
        type: String,
        require: true
    },
    coupon: {
        type: String,
        require: true
    }
});

const couponModel = mongoose.model('coupons', couponsSchema);

module.exports = couponModel;
