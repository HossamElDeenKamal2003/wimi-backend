const mongoose = require('mongoose');
const blockedNumbersSchema = new mongoose.Schema({
    phoneNumber: {
        type: String,
    }
});

module.exports = mongoose.model('BlockedTraders', blockedNumbersSchema);