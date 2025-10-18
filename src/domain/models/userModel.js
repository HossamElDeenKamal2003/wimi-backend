const { verify } = require('jsonwebtoken');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    UID: {
        type: String,
    },
    username: {
        type: String,
    },

    phoneNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    favourites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        default: []
    }],
    verify: {
        type: Boolean,
        default: false
    },
    otp: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);
module.exports = User;